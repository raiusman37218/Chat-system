import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  generateAutoFirstResponse,
  generateHelpDeskResponseWithHandover,
  executeHandoverToHuman,
} from '@/lib/ai/anthropic';
import { dispatchOutboundMessage } from '@/lib/channels/dispatcher';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vfjsaynnubxywdbevxtx.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmanNheW5udWJ4eXdkYmV2eHR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNTA5MDEsImV4cCI6MjEwMzgyNjkwMX0.YyBCXMqwrOk5BRhQafYLFw8tiM5PC8lc8Yocodw9wf0';

/**
 * Where the customer can read the full article.
 *
 * A verified custom domain is the customer's own; otherwise the answer links
 * back to the platform path, which still works.
 */
function helpCenterUrlFor(ws: {
  slug?: string | null;
  custom_domain?: string | null;
  custom_domain_status?: string | null;
} | null): string | null {
  if (!ws) return null;
  if (ws.custom_domain && ws.custom_domain_status === 'verified') {
    return `https://${ws.custom_domain}`;
  }
  const origin =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : null);
  return origin && ws.slug ? `${origin.replace(/\/$/, '')}/help/${ws.slug}` : null;
}

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
      .select('ai_settings, slug, custom_domain, custom_domain_status')
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

    // A handover sets ai_mode to 'disabled'; once a person owns the thread the
    // assistant stays out of it.
    if (conv.ai_mode === 'disabled') {
      return NextResponse.json({ replied: false, reason: 'AI disabled on this conversation' });
    }

    // The *latest* visitor message, not the first. Answering only the opening
    // message meant every follow-up went unanswered until an agent appeared,
    // even when the help centre covered it.
    let visitorIndex = -1;
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].sender_type === 'visitor' && !msgs[i].is_internal) {
        visitorIndex = i;
        break;
      }
    }
    if (visitorIndex === -1) {
      return NextResponse.json({ replied: false, reason: 'No visitor message found' });
    }

    const visitorMsg = msgs[visitorIndex];
    const hasAgentOrAiReply = msgs
      .slice(visitorIndex + 1)
      .some((m) => m.sender_type === 'agent' || m.sender_type === 'ai');

    if (hasAgentOrAiReply) {
      return NextResponse.json({ replied: false, reason: 'Already responded' });
    }

    // Everything the visitor said before this turn, most recent first. A
    // follow-up like "and how long does that take?" is meaningless on its own.
    const history = msgs
      .slice(0, visitorIndex)
      .filter((m) => m.sender_type === 'visitor' && !m.is_internal)
      .map((m) => m.content as string)
      .reverse()
      .slice(0, 4);

    // 3. Generate RAG First Response using workspace Help Desk sections and articles
    const result = await generateHelpDeskResponseWithHandover({
      workspaceId: workspace_id,
      conversationId: conversation_id,
      incomingMessage: visitorMsg.content,
      visitorName: conv.visitor?.name,
      apiKey: aiSettings?.anthropic_api_key,
      history,
      helpCenterUrl: helpCenterUrlFor(workspace),
    });

    const aiResponseText = result.replyText;
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

    // 4b. If Help Desk cannot answer or customer requested a real agent, execute handover!
    if (result.shouldHandover) {
      console.log(`[Auto-Respond] Handing over conversation ${conversation_id} to real agent. Reason: ${result.handoverReason}`);
      await executeHandoverToHuman({
        supabase,
        conversationId: conversation_id,
        workspaceId: workspace_id,
        reason: result.handoverReason || 'Inquiry not covered in Help Desk documentation.',
        channel: conv.channel || 'web',
      });
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

    return NextResponse.json({ replied: true, message: insertedMsg, handed_over: result.shouldHandover });
  } catch (error: any) {
    console.error('Error in AI auto-respond:', error);
    return NextResponse.json({ error: error.message || 'Auto-respond failed' }, { status: 500 });
  } finally {
    if (lockAcquired && conversation_id) {
      inFlightConversations.delete(conversation_id);
    }
  }
}
