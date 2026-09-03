import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vfjsaynnubxywdbevxtx.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmanNheW5udWJ4eXdkYmV2eHR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNTA5MDEsImV4cCI6MjEwMzgyNjkwMX0.YyBCXMqwrOk5BRhQafYLFw8tiM5PC8lc8Yocodw9wf0';

function getSupabase() {
  return createClient(SUPABASE_URL, SUPABASE_KEY);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspace_id') || 'a0000000-0000-0000-0000-000000000001';
    const timeRange = searchParams.get('range') || '30d'; // '7d' | '30d' | '90d'
    const granularity = searchParams.get('granularity') || 'daily'; // 'daily' | 'weekly' | 'monthly'

    const supabase = getSupabase();

    // Determine cutoff date
    const now = new Date();
    let daysBack = 30;
    if (timeRange === '7d') daysBack = 7;
    else if (timeRange === '90d') daysBack = 90;

    const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
    const prevStartDate = new Date(now.getTime() - daysBack * 2 * 24 * 60 * 60 * 1000);

    // 1. Fetch conversations in current and previous periods
    const [{ data: conversations }, { data: prevConversations }, { data: agents }, { data: messages }] =
      await Promise.all([
        supabase
          .from('conversations')
          .select('*, visitor:visitors(*), agent:agents(*)')
          .eq('workspace_id', workspaceId)
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: true }),
        supabase
          .from('conversations')
          .select('id, status, csat_rating')
          .eq('workspace_id', workspaceId)
          .gte('created_at', prevStartDate.toISOString())
          .lt('created_at', startDate.toISOString()),
        supabase
          .from('agents')
          .select('*')
          .eq('workspace_id', workspaceId),
        supabase
          .from('messages')
          .select('conversation_id, sender_type, created_at')
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: true }),
      ]);

    const convList = conversations || [];
    const prevConvList = prevConversations || [];
    const agentList = agents || [];
    const msgList = messages || [];

    // Map messages by conversation_id for First Response Time (FRT) calculation
    const msgsByConv = new Map<string, Array<{ sender_type: string; created_at: string }>>();
    for (const m of msgList) {
      if (!msgsByConv.has(m.conversation_id)) {
        msgsByConv.set(m.conversation_id, []);
      }
      msgsByConv.get(m.conversation_id)!.push(m);
    }

    // 2. Compute First Response Times & Resolution Times
    const frtValues: number[] = [];
    const resValues: number[] = [];
    const csatValues: number[] = [];

    // Per-agent metrics map
    const agentMetrics = new Map<
      string,
      {
        handled: number;
        resolved: number;
        frtList: number[];
        resList: number[];
        csatList: number[];
      }
    >();

    for (const a of agentList) {
      agentMetrics.set(a.id, {
        handled: 0,
        resolved: 0,
        frtList: [],
        resList: [],
        csatList: [],
      });
    }

    for (const c of convList) {
      const assignedId = c.assigned_agent_id;
      if (assignedId && !agentMetrics.has(assignedId)) {
        agentMetrics.set(assignedId, {
          handled: 0,
          resolved: 0,
          frtList: [],
          resList: [],
          csatList: [],
        });
      }
      const aMetric = assignedId ? agentMetrics.get(assignedId) : null;
      if (aMetric) aMetric.handled += 1;

      // CSAT
      if (c.csat_rating && c.csat_rating >= 1 && c.csat_rating <= 5) {
        csatValues.push(c.csat_rating);
        if (aMetric) aMetric.csatList.push(c.csat_rating);
      }

      // Resolution Time
      if (c.status === 'closed' && c.closed_at) {
        if (aMetric) aMetric.resolved += 1;
        const resSeconds = (new Date(c.closed_at).getTime() - new Date(c.created_at).getTime()) / 1000;
        if (resSeconds > 0 && resSeconds < 30 * 24 * 3600) {
          resValues.push(resSeconds);
          if (aMetric) aMetric.resList.push(resSeconds);
        }
      }

      // First Response Time (FRT)
      const convMsgs = msgsByConv.get(c.id);
      if (convMsgs && convMsgs.length > 1) {
        const firstVisitorMsg = convMsgs.find((m) => m.sender_type === 'visitor');
        if (firstVisitorMsg) {
          const firstAgentMsg = convMsgs.find(
            (m) =>
              (m.sender_type === 'agent' || m.sender_type === 'ai') &&
              new Date(m.created_at) >= new Date(firstVisitorMsg.created_at)
          );

          if (firstAgentMsg) {
            const frtSeconds =
              (new Date(firstAgentMsg.created_at).getTime() -
                new Date(firstVisitorMsg.created_at).getTime()) /
              1000;
            if (frtSeconds >= 0 && frtSeconds < 7 * 24 * 3600) {
              frtValues.push(frtSeconds);
              if (aMetric) aMetric.frtList.push(frtSeconds);
            }
          }
        }
      }
    }

    // Averages.
    //
    // These return null, never a placeholder. Earlier revisions fell back to
    // "benchmark" figures (84s, 18m, 4.8 stars, 95% positive) when there was
    // nothing to measure, so a workspace with zero ratings still displayed a
    // healthy-looking CSAT. A reporting screen that invents numbers is worse
    // than one that admits it has none.
    const avgFrt =
      frtValues.length > 0
        ? Math.round(frtValues.reduce((a, b) => a + b, 0) / frtValues.length)
        : null;

    const avgResolution =
      resValues.length > 0
        ? Math.round(resValues.reduce((a, b) => a + b, 0) / resValues.length)
        : null;

    const avgCsat =
      csatValues.length > 0
        ? Number((csatValues.reduce((a, b) => a + b, 0) / csatValues.length).toFixed(1))
        : null;

    const positiveCsatCount = csatValues.filter((v) => v >= 4).length;
    const positiveCsatPercent =
      csatValues.length > 0
        ? Math.round((positiveCsatCount / csatValues.length) * 100)
        : null;

    // Volume comparison
    const totalCurrent = convList.length;
    const totalPrev = prevConvList.length;
    const volumeChangePercent =
      totalPrev > 0
        ? Number((((totalCurrent - totalPrev) / totalPrev) * 100).toFixed(1))
        : totalCurrent > 0
        ? 100
        : 0;

    // 3. Status Breakdown
    const statusCounts = {
      open: convList.filter((c) => c.status === 'open').length,
      closed: convList.filter((c) => c.status === 'closed').length,
      snoozed: convList.filter((c) => c.status === 'snoozed').length,
    };

    const statusBreakdown = [
      { name: 'Open', value: statusCounts.open, color: '#2563eb' },
      { name: 'Resolved', value: statusCounts.closed, color: '#10b981' },
      { name: 'Snoozed', value: statusCounts.snoozed, color: '#f59e0b' },
    ];

    // 4. Timeline Aggregation (Daily / Weekly / Monthly)
    const timelineMap = new Map<
      string,
      { date: string; conversations: number; resolved: number; csatScores: number[] }
    >();

    for (let i = daysBack - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      let key = d.toISOString().split('T')[0];
      let displayLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      if (granularity === 'weekly') {
        // Round to Monday
        const dayOfWeek = d.getDay();
        const diff = d.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        const monday = new Date(d.setDate(diff));
        key = monday.toISOString().split('T')[0];
        displayLabel = `Wk ${monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      } else if (granularity === 'monthly') {
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        displayLabel = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      }

      if (!timelineMap.has(key)) {
        timelineMap.set(key, {
          date: displayLabel,
          conversations: 0,
          resolved: 0,
          csatScores: [],
        });
      }
    }

    for (const c of convList) {
      const cDate = new Date(c.created_at);
      let key = cDate.toISOString().split('T')[0];

      if (granularity === 'weekly') {
        const dayOfWeek = cDate.getDay();
        const diff = cDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        const monday = new Date(cDate.setDate(diff));
        key = monday.toISOString().split('T')[0];
      } else if (granularity === 'monthly') {
        key = `${cDate.getFullYear()}-${String(cDate.getMonth() + 1).padStart(2, '0')}`;
      }

      const item = timelineMap.get(key);
      if (item) {
        item.conversations += 1;
        if (c.status === 'closed') item.resolved += 1;
        if (c.csat_rating) item.csatScores.push(c.csat_rating);
      }
    }

    const timelineData = Array.from(timelineMap.values()).map((t) => {
      // null, so the trend line breaks on days with no ratings instead of
      // drawing a flat invented 4.8 across an empty month.
      const avgDayCsat =
        t.csatScores.length > 0
          ? Number((t.csatScores.reduce((a, b) => a + b, 0) / t.csatScores.length).toFixed(1))
          : null;
      return {
        date: t.date,
        total: t.conversations,
        resolved: t.resolved,
        csat: avgDayCsat,
      };
    });

    // 5. Per-Agent Performance Table
    const perAgentPerformance = agentList.map((agent) => {
      const m = agentMetrics.get(agent.id) || {
        handled: 0,
        resolved: 0,
        frtList: [],
        resList: [],
        csatList: [],
      };

      // Same rule as the workspace summary: an agent who has handled nothing
      // reports nothing, rather than a flattering 65s / 4.9 stars / 100%.
      const agentAvgFrt =
        m.frtList.length > 0
          ? Math.round(m.frtList.reduce((a, b) => a + b, 0) / m.frtList.length)
          : null;

      const agentAvgRes =
        m.resList.length > 0
          ? Math.round(m.resList.reduce((a, b) => a + b, 0) / m.resList.length)
          : null;

      const agentAvgCsat =
        m.csatList.length > 0
          ? Number((m.csatList.reduce((a, b) => a + b, 0) / m.csatList.length).toFixed(1))
          : null;

      const resolutionRate =
        m.handled > 0 ? Math.round((m.resolved / m.handled) * 100) : null;

      return {
        id: agent.id,
        name: agent.name,
        email: agent.email,
        status: agent.status,
        role: agent.role,
        handled: m.handled,
        resolved: m.resolved,
        resolutionRate,
        avgFrt: agentAvgFrt,
        avgResolution: agentAvgRes,
        csatScore: agentAvgCsat,
        csatCount: m.csatList.length,
      };
    });

    // Sort by handled conversations descending
    perAgentPerformance.sort((a, b) => b.handled - a.handled);

    return NextResponse.json({
      summary: {
        totalConversations: totalCurrent,
        volumeChangePercent,
        avgFirstResponseSeconds: avgFrt,
        avgResolutionSeconds: avgResolution,
        avgCsat,
        positiveCsatPercent,
        totalCsatRatings: csatValues.length,
      },
      statusBreakdown,
      timelineData,
      perAgentPerformance,
    });
  } catch (error: any) {
    console.error('[Analytics API Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to aggregate analytics' },
      { status: 500 }
    );
  }
}
