import { NextRequest, NextResponse } from 'next/server';
import { serviceClient } from '@/lib/supabase/service';
import {
  generateAutoFirstResponse,
  generateHelpDeskResponseWithHandover,
  executeHandoverToHuman,
} from '@/lib/ai/anthropic';
import { dispatchOutboundMessage } from '@/lib/channels/dispatcher';
import { providerConfigFrom } from '@/lib/ai/help-answer';

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

    // Privileged: this route has no user session, and row level security
    // otherwise hides the workspace's own settings from it.
    const supabase = serviceClient();

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

    // Everything the visitor has said since anyone last replied is one
    // unanswered turn.
    //
    // Anchoring on "the newest visitor message with nothing after it" dropped
    // messages: a visitor who sends two lines in quick succession has the
    // reply to the first land *after* the second, so the second looked
    // answered and was never picked up. Working back from the last reply
    // instead means a burst of messages is answered once, together.
    let lastReplyIndex = -1;
    for (let i = msgs.length - 1; i >= 0; i--) {
      const m = msgs[i];
      if ((m.sender_type === 'agent' || m.sender_type === 'ai') && !m.is_internal) {
        lastReplyIndex = i;
        break;
      }
    }

    const unanswered = msgs
      .slice(lastReplyIndex + 1)
      .filter((m) => m.sender_type === 'visitor' && !m.is_internal);

    if (unanswered.length === 0) {
      return NextResponse.json({ replied: false, reason: 'Already responded' });
    }

    // The newest line is the question; the rest of the burst is its context.
    const visitorMsg = unanswered[unanswered.length - 1];
    const burstContext = unanswered
      .slice(0, -1)
      .map((m) => m.content as string)
      .reverse();

    // Older turns, so a follow-up like "and how long does that take?" still
    // resolves against what was being discussed.
    const earlier = msgs
      .slice(0, lastReplyIndex + 1)
      .filter((m) => m.sender_type === 'visitor' && !m.is_internal)
      .map((m) => m.content as string)
      .reverse();

    // Retrieval searches against what the *customer* said. Including the
    // assistant's own replies would bias the search toward whatever it already
    // answered, which is the opposite of what a follow-up needs.
    const history = [...burstContext, ...earlier].slice(0, 4);

    // The model, unlike the retriever, does need both sides. Without its own
    // previous replies it re-greets, repeats an answer it just gave, and
    // cannot resolve "what about the other one?".
    const answeredIndex = msgs.indexOf(visitorMsg);
    const turns = msgs
      .slice(0, answeredIndex === -1 ? msgs.length : answeredIndex)
      .filter(
        (m) =>
          !m.is_internal &&
          ['visitor', 'agent', 'ai'].includes(m.sender_type) &&
          typeof m.content === 'string' &&
          m.content.trim()
      )
      .slice(-10)
      .map((m) => ({
        role: (m.sender_type === 'visitor' ? 'user' : 'assistant') as
          | 'user'
          | 'assistant',
        content: m.content as string,
      }));

    // 3. Generate RAG First Response using workspace Help Desk sections and articles
    const result = await generateHelpDeskResponseWithHandover({
      workspaceId: workspace_id,
      conversationId: conversation_id,
      incomingMessage: visitorMsg.content,
      visitorName: conv.visitor?.name,
      providerConfig: providerConfigFrom(aiSettings),
      history,
      turns,
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
