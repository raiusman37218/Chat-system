import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vfjsaynnubxywdbevxtx.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmanNheW5udWJ4eXdkYmV2eHR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNTA5MDEsImV4cCI6MjEwMzgyNjkwMX0.YyBCXMqwrOk5BRhQafYLFw8tiM5PC8lc8Yocodw9wf0';

function getSupabase() {
  return createClient(SUPABASE_URL, SUPABASE_KEY);
}

/**
 * POST /api/conversations/auto-close
 * Auto-closes conversations that have had no activity for X days (default 7).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const days = typeof body.days === 'number' && body.days > 0 ? body.days : 7;
    const workspaceId = body.workspace_id;

    const supabase = getSupabase();

    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    let query = supabase
      .from('conversations')
      .select('id, workspace_id')
      .eq('status', 'open')
      .lt('updated_at', cutoffDate);

    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId);
    }

    const { data: staleConvs, error: fetchErr } = await query;
    if (fetchErr) {
      console.error('[Auto-Close Fetch Error]:', fetchErr);
      return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    }

    if (!staleConvs || staleConvs.length === 0) {
      return NextResponse.json({
        success: true,
        closed_count: 0,
        days,
        message: 'No inactive conversations found past cutoff',
      });
    }

    const convIds = staleConvs.map((c) => c.id);
    const nowIso = new Date().toISOString();

    // Batch update all stale conversations to closed
    const { error: updateErr } = await supabase
      .from('conversations')
      .update({
        status: 'closed',
        closed_at: nowIso,
        updated_at: nowIso,
      })
      .in('id', convIds);

    if (updateErr) {
      console.error('[Auto-Close Update Error]:', updateErr);
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // Insert system messages in batches
    const systemMessages = convIds.map((id) => ({
      conversation_id: id,
      sender_type: 'system',
      content: `Conversation automatically resolved after ${days} days of inactivity.`,
      is_internal: false,
      created_at: nowIso,
    }));

    try {
      await supabase.from('messages').insert(systemMessages);
    } catch (err) {
      console.warn('[Auto-Close Messages Insert Warning]:', err);
    }

    return NextResponse.json({
      success: true,
      closed_count: convIds.length,
      days,
    });
  } catch (err: any) {
    console.error('[Auto-Close Handler Error]:', err);
    return NextResponse.json(
      { error: err.message || 'Auto-close failed' },
      { status: 500 }
    );
  }
}
