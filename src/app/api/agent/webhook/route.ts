import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { dispatchOutboundMessage } from '@/lib/channels/dispatcher';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vfjsaynnubxywdbevxtx.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmanNheW5udWJ4eXdkYmV2eHR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNTA5MDEsImV4cCI6MjEwMzgyNjkwMX0.YyBCXMqwrOk5BRhQafYLFw8tiM5PC8lc8Yocodw9wf0';

function getSupabase() {
  return createClient(SUPABASE_URL, SUPABASE_KEY);
}

/**
 * Inbound webhook for LangGraph Agent to push replies or tool execution updates to Chatify
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { conversation_id, workspace_id, content, is_internal = false, escalate = false, priority } = body;

    if (!conversation_id || !content) {
      return NextResponse.json({ error: 'Missing conversation_id or content' }, { status: 400 });
    }

    const supabase = getSupabase();

    // 1. Fetch conversation details
    const { data: conv, error: convErr } = await supabase
      .from('conversations')
      .select('id, workspace_id, channel')
      .eq('id', conversation_id)
      .single();

    if (convErr || !conv) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const wsId = workspace_id || conv.workspace_id;

    // 2. Handle escalation if requested by LangGraph agent
    if (escalate) {
      await supabase
        .from('conversations')
        .update({
          status: 'open',
          priority: priority || 'high',
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversation_id);
    }

    // 3. Insert agent message into thread
    const { data: newMsg, error: msgErr } = await supabase
      .from('messages')
      .insert({
        conversation_id,
        sender_type: 'ai',
        content,
        is_internal: Boolean(is_internal),
      })
      .select()
      .single();

    if (msgErr) {
      return NextResponse.json({ error: msgErr.message }, { status: 500 });
    }

    // 4. If message is external (not internal note), forward to customer's channel
    if (!is_internal && conv.channel && conv.channel !== 'web') {
      await dispatchOutboundMessage({
        conversationId: conversation_id,
        workspaceId: wsId,
        content,
        channel: conv.channel,
      });
    }

    return NextResponse.json({ success: true, message_id: newMsg.id }, { status: 200 });
  } catch (err: any) {
    console.error('[LangGraph Webhook Route Error]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
