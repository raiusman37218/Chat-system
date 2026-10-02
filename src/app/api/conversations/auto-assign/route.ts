import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vfjsaynnubxywdbevxtx.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmanNheW5udWJ4eXdkYmV2eHR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNTA5MDEsImV4cCI6MjEwMzgyNjkwMX0.YyBCXMqwrOk5BRhQafYLFw8tiM5PC8lc8Yocodw9wf0';

function getSupabase() {
  return createClient(SUPABASE_URL, SUPABASE_KEY);
}

/**
 * Auto-assigns an unassigned conversation to an online agent using
 * load-balanced round-robin distribution.
 */
export async function POST(req: NextRequest) {
  try {
    const { conversation_id } = await req.json();

    if (!conversation_id) {
      return NextResponse.json(
        { error: 'Missing conversation_id' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    // 1. Fetch conversation to determine workspace
    const { data: conv, error: convErr } = await supabase
      .from('conversations')
      .select('id, workspace_id, assigned_agent_id')
      .eq('id', conversation_id)
      .single();

    if (convErr || !conv) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const wsId = conv.workspace_id;

    // Check workspace auto-assignment setting
    if (wsId) {
      const { data: ws } = await supabase
        .from('workspaces')
        .select('auto_assignment')
        .eq('id', wsId)
        .single();

      if (ws?.auto_assignment && ws.auto_assignment.enabled === false) {
        return NextResponse.json({
          success: false,
          assigned: false,
          reason: 'Auto-assignment is disabled for this workspace',
        });
      }
    }

    // 2. Fetch online agents for this workspace
    let query = supabase
      .from('agents')
      .select('id, name, email, avatar_url, status, workspace_id')
      .eq('status', 'online');

    if (wsId) {
      query = query.eq('workspace_id', wsId);
    }

    let { data: agents, error: aErr } = await query;
    if (aErr) throw aErr;

    // If no agents are marked 'online', return unassigned as specified
    if (!agents || agents.length === 0) {
      return NextResponse.json({
        success: true,
        assigned: false,
        message: 'No online agents available for auto-assignment',
      });
    }

    // 3. Query open conversation counts per agent to balance workload
    let openQuery = supabase
      .from('conversations')
      .select('assigned_agent_id')
      .eq('status', 'open');

    if (wsId) {
      openQuery = openQuery.eq('workspace_id', wsId);
    }

    const { data: openConvs, error: cErr } = await openQuery;
    if (cErr) throw cErr;

    const workloadMap: Record<string, number> = {};
    agents.forEach((a) => {
      workloadMap[a.id] = 0;
    });

    openConvs?.forEach((c) => {
      if (c.assigned_agent_id && workloadMap[c.assigned_agent_id] !== undefined) {
        workloadMap[c.assigned_agent_id]++;
      }
    });

    // 4. Pick the agent with the fewest active tickets
    agents.sort((a, b) => workloadMap[a.id] - workloadMap[b.id]);
    const chosenAgent = agents[0];

    // 5. Update the conversation
    const { error: uErr } = await supabase
      .from('conversations')
      .update({
        assigned_agent_id: chosenAgent.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversation_id);

    if (uErr) throw uErr;

    return NextResponse.json({
      success: true,
      assigned: true,
      agent: chosenAgent,
      activeTickets: workloadMap[chosenAgent.id] + 1,
    });
  } catch (error: any) {
    console.error('[Auto-Assign Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Auto-assignment failed' },
      { status: 500 }
    );
  }
}
