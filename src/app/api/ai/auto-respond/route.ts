import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateAutoFirstResponse } from '@/lib/ai/anthropic';
import { dispatchOutboundMessage } from '@/lib/channels/dispatcher';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vfjsaynnubxywdbevxtx.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmanNheW5udWJ4eXdkYmV2eHR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNTA5MDEsImV4cCI6MjEwMzgyNjkwMX0.YyBCXMqwrOk5BRhQafYLFw8tiM5PC8lc8Yocodw9wf0';

export async function POST(req: NextRequest) {
  try {
    const { conversation_id, workspace_id } = await req.json();

    if (!conversation_id || !workspace_id) {
      return NextResponse.json({ error: 'Missing conversation_id or workspace_id' }, { status: 400 });
    }

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

    // 2. Check if conversation is still open and has no agent message yet
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
    const hasAgentOrAiReply = msgs.some((m) => m.sender_type === 'agent' || m.sender_type === 'ai');

    if (hasAgentOrAiReply) {
      return NextResponse.json({ replied: false, reason: 'Already responded' });
    }

    const visitorMsg = msgs.find((m) => m.sender_type === 'visitor');
    if (!visitorMsg) {
      return NextResponse.json({ replied: false, reason: 'No visitor message found' });
    }

    // 3. Generate RAG First Response
    const aiResponseText = await generateAutoFirstResponse({
      workspaceId: workspace_id,
      conversationId: conversation_id,
      incomingMessage: visitorMsg.content,
      visitorName: conv.visitor?.name,
      apiKey: aiSettings?.anthropic_api_key,
    });

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
  }
}
