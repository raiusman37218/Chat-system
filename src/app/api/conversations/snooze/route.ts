import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vfjsaynnubxywdbevxtx.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmanNheW5udWJ4eXdkYmV2eHR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNTA5MDEsImV4cCI6MjEwMzgyNjkwMX0.YyBCXMqwrOk5BRhQafYLFw8tiM5PC8lc8Yocodw9wf0';

function getSupabase() {
  return createClient(SUPABASE_URL, SUPABASE_KEY);
}

/**
 * POST /api/conversations/snooze
 * Snoozes a conversation until a specified timestamp.
 */
export async function POST(req: NextRequest) {
  try {
    const { conversation_id, snoozed_until } = await req.json();

    if (!conversation_id) {
      return NextResponse.json({ error: 'Missing conversation_id' }, { status: 400 });
    }

    const supabase = getSupabase();
    const until = snoozed_until ? new Date(snoozed_until).toISOString() : null;

    const { error } = await supabase
      .from('conversations')
      .update({
        status: 'snoozed',
        snoozed_until: until,
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversation_id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      status: 'snoozed',
      snoozed_until: until,
    });
  } catch (error: any) {
    console.error('[Snooze Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to snooze conversation' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/conversations/snooze
 * Checks and auto-reopens all conversations whose snoozed_until timestamp has passed.
 */
export async function GET() {
  try {
    const supabase = getSupabase();
    const now = new Date().toISOString();

    // Query overdue snoozed conversations
    const { data: overdue, error: qErr } = await supabase
      .from('conversations')
      .select('id, visitor_id, assigned_agent_id, snoozed_until')
      .eq('status', 'snoozed')
      .lte('snoozed_until', now);

    if (qErr) throw qErr;

    if (!overdue || overdue.length === 0) {
      return NextResponse.json({ reopened: 0, items: [] });
    }

    const ids = overdue.map((c) => c.id);

    // Auto-reopen them
    const { error: uErr } = await supabase
      .from('conversations')
      .update({
        status: 'open',
        snoozed_until: null,
        updated_at: now,
      })
      .in('id', ids);

    if (uErr) throw uErr;

    return NextResponse.json({
      reopened: ids.length,
      items: overdue,
    });
  } catch (error: any) {
    console.error('[Auto-Reopen Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Auto-reopen check failed' },
      { status: 500 }
    );
  }
}
