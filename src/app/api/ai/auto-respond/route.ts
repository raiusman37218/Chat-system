import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateAutoFirstResponse } from '@/lib/ai/anthropic';
import { dispatchOutboundMessage } from '@/lib/channels/dispatcher';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vfjsaynnubxywdbevxtx.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmanNheW5udWJ4eXdkYmV2eHR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNTA5MDEsImV4cCI6MjEwMzgyNjkwMX0.YyBCXMqwrOk5BRhQafYLFw8tiM5PC8lc8Yocodw9wf0';

// In-memory set to prevent concurrent auto-response runs for the same conversation
const inFlightConversations = new Set<string>();

export async function POST(req: NextRequest) {
  let lockAcquired = false;
  let conversation_id: string | undefined;

  try {
    const body = await req.json();
    conversation_id = body.conversation_id;
    const workspace_id = body.workspace_id;

    if (!conversation_id || !workspace_id) {
      return NextResponse.json({ error: 'Missing conversation_id or workspace_id' }, { status: 400 });
    }

    // 0. Concurrency lock check: prevent simultaneous execution for the same conversation
    if (inFlightConversations.has(conversation_id)) {
      return NextResponse.json({ replied: false, reason: 'Auto-response already in progress' });
    }
    inFlightConversations.add(conversation_id);
    lockAcquired = true;

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // 1. Fetch workspace AI settings
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('ai_settings')
      .eq('id', workspace_id)
      .single();

    const aiSettings = workspace?.ai_settings;
    if (aiSettings && (!aiSettings.enabled || !aiSettings.auto_response_enabled)) {
      return NextResponse.json({ replied: false, reason: 'AI auto-first-response disabled' });
    }

    // 2. Check if conversation is still open and has no agent or AI message yet
    const { data: conv } = await supabase
      .from('conversations')
      .select('*, visitor:visitors(*)')
      .eq('id', conversation_id)
      .single();

    if (!conv || conv.status === 'closed') {
      return NextResponse.json({ replied: false, reason: 'Conversation not open' });
    }

    const { data: existingMessages } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversation_id)
      .order('created_at', { ascending: true });

    const msgs = existingMessages || [];
    const visitorMsg = msgs.find((m) => m.sender_type === 'visitor');
    if (!visitorMsg) {
      return NextResponse.json({ replied: false, reason: 'No visitor message found' });
    }

    const visitorMsgIndex = msgs.findIndex((m) => m.id === visitorMsg.id);
    const hasAgentOrAiReply = msgs
      .slice(visitorMsgIndex + 1)
      .some((m) => m.sender_type === 'agent' || m.sender_type === 'ai');

    if (hasAgentOrAiReply) {
      return NextResponse.json({ replied: false, reason: 'Already responded' });
    }

    // 3. Generate RAG First Response using workspace Help Desk sections and articles
    const aiResponseText = await generateAutoFirstResponse({
      workspaceId: workspace_id,
      conversationId: conversation_id,
      incomingMessage: visitorMsg.content,
      visitorName: conv.visitor?.name,
      apiKey: aiSettings?.anthropic_api_key,
    });

    if (!aiResponseText || !aiResponseText.trim()) {
      return NextResponse.json({ replied: false, reason: 'Empty auto-response generated' });
    }

    // 3b. ATOMIC DOUBLE-CHECK: Re-query messages to guarantee no agent or AI replied during RAG generation
    const { data: lateCheckMessages } = await supabase
      .from('messages')
      .select('id')
      .eq('conversation_id', conversation_id)
      .in('sender_type', ['agent', 'ai'])
      .gt('created_at', visitorMsg.created_at)
      .limit(1);

    if (lateCheckMessages && lateCheckMessages.length > 0) {
      return NextResponse.json({ replied: false, reason: 'Already responded during generation' });
    }

    // 4. Insert message as 'ai' sender
    const { data: insertedMsg, error: msgErr } = await supabase
      .from('messages')
      .insert({
        conversation_id,
        sender_type: 'ai',
        sender_id: null,
        content: aiResponseText,
        is_internal: false,
      })
      .select()
      .single();

    if (msgErr) {
      throw msgErr;
    }

    // 5. If channel is multi-channel (WhatsApp, Meta, LinkedIn), dispatch outbound
    if (conv.channel && conv.channel !== 'web') {
      await dispatchOutboundMessage({
        conversationId: conversation_id,
        workspaceId: workspace_id,
        content: aiResponseText,
        channel: conv.channel,
      });
    }

    return NextResponse.json({ replied: true, message: insertedMsg });
  } catch (error: any) {
    console.error('Error in AI auto-respond:', error);
    return NextResponse.json({ error: error.message || 'Auto-respond failed' }, { status: 500 });
  } finally {
    if (lockAcquired && conversation_id) {
      inFlightConversations.delete(conversation_id);
    }
  }
}
