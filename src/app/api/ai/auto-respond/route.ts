import { NextRequest, NextResponse } from 'next/server';
import { serviceClient } from '@/lib/supabase/service';
import {
  generateAutoFirstResponse,
  generateHelpDeskResponseWithHandover,
  executeHandoverToHuman,
} from '@/lib/ai/anthropic';
import { dispatchOutboundMessage } from '@/lib/channels/dispatcher';
import { providerConfigFrom, warmHelpIndex } from '@/lib/ai/help-answer';

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

// The embeddable widget calls this after every visitor message, from the
// customer's own site.
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(body: unknown, init?: { status?: number }) {
  return NextResponse.json(body, { ...init, headers: CORS_HEADERS });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
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
      return json({ error: 'Missing conversation_id or workspace_id' }, { status: 400 });
    }

    // 0. One run per conversation at a time. A message that arrives while the
    // previous one is still being answered used to be turned away here, and
    // since nothing retried it, that message never got a reply. It now waits
    // its turn; once the earlier reply lands, the checks below see it as the
    // unanswered message and answer it.
    const waitUntil = Date.now() + 45_000;
    while (inFlightConversations.has(conversation_id)) {
      if (Date.now() > waitUntil) {
        return json({ replied: false, reason: 'Auto-response already in progress' });
      }
      await new Promise((r) => setTimeout(r, 200));
    }
    inFlightConversations.add(conversation_id);
    lockAcquired = true;

    // Privileged: this route has no user session, and row level security
    // otherwise hides the workspace's own settings from it.
    const supabase = serviceClient();

    // The reply has a two-second budget, so everything this route reads is
    // fetched at once rather than one query after another, and the help index
    // starts loading alongside.
    warmHelpIndex(workspace_id);
    const [{ data: workspace }, { data: conv }, { data: recentMessages }] = await Promise.all([
      supabase
        .from('workspaces')
        .select('ai_settings, slug, custom_domain, custom_domain_status')
        .eq('id', workspace_id)
        .single(),
      supabase
        .from('conversations')
        .select('id, workspace_id, status, ai_mode, channel, visitor:visitors(name)')
        .eq('id', conversation_id)
        .single(),
      // Only the recent end of the thread is ever used below.
      supabase
        .from('messages')
        .select('id, sender_type, content, is_internal, created_at, metadata')
        .eq('conversation_id', conversation_id)
        .order('created_at', { ascending: false })
        .limit(40),
    ]);

    const aiSettings = workspace?.ai_settings;
    if (aiSettings && (!aiSettings.enabled || !aiSettings.auto_response_enabled)) {
      return json({ replied: false, reason: 'AI auto-first-response disabled' });
    }

    if (!conv || (conv.workspace_id && conv.workspace_id !== workspace_id) || conv.status === 'closed') {
      return json({ replied: false, reason: 'Conversation not open' });
    }

    const msgs = (recentMessages || []).reverse();

    // A handover sets ai_mode to 'disabled'; once a person owns the thread the
    // assistant stays out of it.
    if (conv.ai_mode === 'disabled') {
      return json({ replied: false, reason: 'AI disabled on this conversation' });
    }

    // Everything the visitor has said since anyone last replied is one
    // unanswered turn.
    //
    // Anchoring on "the newest visitor message with nothing after it" dropped
    // messages: a visitor who sends two lines in quick succession has the
    // reply to the first land *after* the second, so the second looked
    // answered and was never picked up. Working back from the last reply
    // instead means a burst of messages is answered once, together.
    //
    // A reply's position is not always what it covered, though: when the
    // second line arrives while the first is still being answered, that reply
    // is stored after the second line without having seen it. So an AI reply
    // records the last visitor message it read (`answered_until`), and only
    // visitor messages after that point count as unanswered.
    const lastReply = [...msgs]
      .reverse()
      .find((m) => (m.sender_type === 'agent' || m.sender_type === 'ai') && !m.is_internal);
    const answeredUntil = lastReply
      ? Date.parse(
          (lastReply.sender_type === 'ai' && lastReply.metadata?.answered_until) ||
            lastReply.created_at
        )
      : -Infinity;
    const isVisitorLine = (m: (typeof msgs)[number]) =>
      m.sender_type === 'visitor' && !m.is_internal;

    const unanswered = msgs.filter(
      (m) => isVisitorLine(m) && Date.parse(m.created_at) > answeredUntil
    );

    if (unanswered.length === 0) {
      return json({ replied: false, reason: 'Already responded' });
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
      .filter((m) => isVisitorLine(m) && !unanswered.includes(m))
      .map((m) => m.content as string)
      .reverse();

    // Retrieval searches against what the *customer* said. Including the
    // assistant's own replies would bias the search toward whatever it already
    // answered, which is the opposite of what a follow-up needs.
    const history = [...burstContext, ...earlier].slice(0, 4);

    // The model, unlike the retriever, does need both sides. Without its own
    // previous replies it re-greets, repeats an answer it just gave, and
    // cannot resolve "what about the other one?".
    // Everything except the lines being answered now, so the model also sees
    // the reply it gave to a message that came just before them.
    const turns = msgs
      .filter(
        (m) =>
          !unanswered.includes(m) &&
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
      visitorName: (conv.visitor as { name?: string | null } | null)?.name || undefined,
      providerConfig: providerConfigFrom(aiSettings),
      systemPrompt: aiSettings?.system_prompt || null,
      history,
      turns,
      helpCenterUrl: helpCenterUrlFor(workspace),
    });

    const aiResponseText = result.replyText;
    if (!aiResponseText || !aiResponseText.trim()) {
      return json({ replied: false, reason: 'Empty auto-response generated' });
    }

    // 3b. ATOMIC DOUBLE-CHECK: Re-query messages to guarantee no agent or AI replied during RAG generation
    // An AI reply stored after this message but written before it arrived is
    // not an answer to it, so AI replies are judged by what they read.
    const { data: lateReplies } = await supabase
      .from('messages')
      .select('sender_type, created_at, metadata')
      .eq('conversation_id', conversation_id)
      .eq('is_internal', false)
      .in('sender_type', ['agent', 'ai'])
      .gt('created_at', visitorMsg.created_at)
      .limit(10);

    const visitorAt = Date.parse(visitorMsg.created_at);
    const alreadyAnswered = (lateReplies || []).some(
      (m) =>
        m.sender_type === 'agent' ||
        Date.parse(m.metadata?.answered_until || m.created_at) >= visitorAt
    );

    if (alreadyAnswered) {
      return json({ replied: false, reason: 'Already responded during generation' });
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
        // What this reply actually read up to — see `answeredUntil` above.
        metadata: { answered_until: visitorMsg.created_at },
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

    return json({ replied: true, message: insertedMsg, handed_over: result.shouldHandover });
  } catch (error: any) {
    console.error('Error in AI auto-respond:', error);
    return json({ error: error.message || 'Auto-respond failed' }, { status: 500 });
  } finally {
    if (lockAcquired && conversation_id) {
      inFlightConversations.delete(conversation_id);
    }
  }
}
