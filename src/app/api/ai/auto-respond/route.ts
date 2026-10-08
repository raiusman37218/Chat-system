import { NextRequest, NextResponse, after } from 'next/server';
import { serviceClient } from '@/lib/supabase/service';
import {
  generateHelpDeskResponseWithHandover,
  executeHandoverToHuman,
} from '@/lib/ai/anthropic';
import { dispatchOutboundMessage } from '@/lib/channels/dispatcher';
import { providerConfigFrom, warmHelpIndex, wantsHuman } from '@/lib/ai/help-answer';
import {
  detectLanguage,
  getLanguageInfo,
  isLatinScript,
  isLikelyEnglishText,
  normalizeDetectedLanguage,
  translateAgentReply,
  translateToEnglish,
  translateWithGoogleGtx,
} from '@/lib/ai/translator';
import { translateVisitorMessage } from '@/lib/ai/inbound-translation';
import { getWorkspaceHelpCenterUrl } from '@/lib/domain';

/**
 * The language the visitor wrote in. The word-list detector is instant but
 * only knows a few dozen languages and calls everything else English, so text
 * it cannot place is checked with Google's detector.
 */
async function visitorLanguageOf(text: string): Promise<{ code: string; roman: boolean }> {
  if (!text || !/[\p{L}]/u.test(text) || isLikelyEnglishText(text)) {
    return { code: 'en', roman: false };
  }
  let code = normalizeDetectedLanguage(detectLanguage(text).code, text);
  if (code === 'en') {
    const g = await translateWithGoogleGtx(text, 'en', 'auto').catch(() => null);
    if (g?.detectedLanguage) {
      code = g.romanizedSource ? g.detectedLanguage : normalizeDetectedLanguage(g.detectedLanguage, text);
    }
  }
  return { code, roman: code !== 'en' && isLatinScript(text) && ['ur', 'hi'].includes(code) };
}

/** Epoch ms of the latest of several optional timestamps; -Infinity if none. */
function latest(...values: (string | null | undefined)[]): number {
  let best = -Infinity;
  for (const v of values) {
    const t = v ? Date.parse(v) : NaN;
    if (!Number.isNaN(t) && t > best) best = t;
  }
  return best;
}

/**
 * Where the customer can read the full article.
 * Uses verified custom domain if live, otherwise platform help center subdomain.
 */
function helpCenterUrlFor(ws: any): string | null {
  if (!ws) return null;
  return getWorkspaceHelpCenterUrl(ws);
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

// In-memory sets to prevent concurrent auto-response runs
const inFlightConversations = new Set<string>();
const inFlightMessages = new Set<string>();

export async function POST(req: NextRequest) {
  let lockAcquired = false;
  let messageLockAcquired = false;
  let conversation_id: string | undefined;
  let targetVisitorMsgId: string | undefined;

  try {
    const body = await req.json();
    conversation_id = body.conversation_id;
    const workspace_id = body.workspace_id;
    const requested_message_id = body.message_id || body.messageId;

    if (!conversation_id || !workspace_id) {
      return json({ error: 'Missing conversation_id or workspace_id' }, { status: 400 });
    }

    // Agents read every visitor message in English. This runs whether or not
    // the assistant answers, and after the response so it never slows a reply.
    if (requested_message_id) {
      after(() =>
        translateVisitorMessage(requested_message_id).catch((err) =>
          console.warn('[Auto-Respond] Inbound translation failed:', err)
        )
      );
    }

    if (requested_message_id && inFlightMessages.has(requested_message_id)) {
      return json({ replied: false, reason: 'Auto-response already in progress for this message' });
    }

    // 0. One run per conversation at a time.
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
        .select('name, greeting_title, greeting_message, ai_settings, slug, custom_domain, custom_domain_status')
        .eq('id', workspace_id)
        .single(),
      supabase
        .from('conversations')
        // '*' rather than a column list, so the route keeps working before
        // the last_resolved_at migration has been run.
        .select('*, visitor:visitors(name)')
        .eq('id', conversation_id)
        .single(),
      // Only the recent end of the thread is ever used below.
      supabase
        .from('messages')
        .select('id, sender_type, sender_id, content, is_internal, created_at, metadata, reply_to_message_id')
        .eq('conversation_id', conversation_id)
        .order('created_at', { ascending: false })
        .limit(40),
    ]);

    const msgs = (recentMessages || []).reverse();
    const isVisitorLine = (m: (typeof msgs)[number]) =>
      m.sender_type === 'visitor' && !m.is_internal;

    // Gather all visitor message IDs that have already been answered or handed over
    const answeredVisitorMessageIds = new Set<string>();
    for (const m of msgs) {
      if (m.sender_type === 'ai' || m.sender_type === 'agent') {
        if (m.reply_to_message_id) answeredVisitorMessageIds.add(m.reply_to_message_id);
        if (m.metadata?.answered_message_id) answeredVisitorMessageIds.add(m.metadata.answered_message_id);
        if (m.metadata?.reply_to_message_id) answeredVisitorMessageIds.add(m.metadata.reply_to_message_id);
        if (m.metadata?.handover_for_message_id) answeredVisitorMessageIds.add(m.metadata.handover_for_message_id);
      }
    }

    // Determine target visitor message
    let visitorMsg: (typeof msgs)[number] | undefined;
    if (requested_message_id) {
      visitorMsg = msgs.find((m) => m.id === requested_message_id && isVisitorLine(m));
      if (!visitorMsg) {
        const { data: specificMsg } = await supabase
          .from('messages')
          .select('id, sender_type, sender_id, content, is_internal, created_at, metadata, reply_to_message_id')
          .eq('id', requested_message_id)
          .eq('conversation_id', conversation_id)
          .maybeSingle();

        if (specificMsg && isVisitorLine(specificMsg)) {
          visitorMsg = specificMsg;
        }
      }
    }

    if (!visitorMsg) {
      const lastReply = [...msgs]
        .reverse()
        .find((m) => (m.sender_type === 'agent' || m.sender_type === 'ai') && !m.is_internal);
      const answeredUntil = lastReply
        ? Date.parse(
            (lastReply.sender_type === 'ai' && lastReply.metadata?.answered_until) ||
              lastReply.created_at
          )
        : -Infinity;

      const unanswered = msgs.filter(
        (m) =>
          isVisitorLine(m) &&
          !answeredVisitorMessageIds.has(m.id) &&
          Date.parse(m.created_at) > answeredUntil
      );

      if (unanswered.length === 0) {
        return json({ replied: false, reason: 'Already responded' });
      }

      visitorMsg = unanswered[unanswered.length - 1];
    }

    if (!visitorMsg) {
      return json({ replied: false, reason: 'No visitor message found to answer' });
    }

    const currentVisitorMsgId: string = visitorMsg.id;
    targetVisitorMsgId = currentVisitorMsgId;

    // Idempotency Guard 1: In-flight duplicate prevention
    if (inFlightMessages.has(currentVisitorMsgId)) {
      return json({ replied: false, reason: `Auto-response already in progress for message ${currentVisitorMsgId}` });
    }
    inFlightMessages.add(currentVisitorMsgId);
    messageLockAcquired = true;

    // Idempotency Guard 2: In-memory answered check
    if (answeredVisitorMessageIds.has(currentVisitorMsgId)) {
      return json({ replied: false, reason: `Already responded to message ${currentVisitorMsgId}` });
    }

    // Idempotency Guard 3: Database-level existence check
    const { data: existingAnswer } = await supabase
      .from('messages')
      .select('id, sender_type, is_internal, reply_to_message_id, metadata')
      .eq('conversation_id', conversation_id)
      .or(`reply_to_message_id.eq.${currentVisitorMsgId},metadata->>answered_message_id.eq.${currentVisitorMsgId},metadata->>handover_for_message_id.eq.${currentVisitorMsgId}`)
      .limit(1);

    if (existingAnswer && existingAnswer.length > 0) {
      return json({ replied: false, reason: `Already responded to message ${targetVisitorMsgId}` });
    }

    const aiSettings = workspace?.ai_settings;

    if (aiSettings && (!aiSettings.enabled || !aiSettings.auto_response_enabled)) {
      return json({ replied: false, reason: 'AI auto-first-response disabled' });
    }

    if (!conv || (conv.workspace_id && conv.workspace_id !== workspace_id)) {
      return json({ replied: false, reason: 'Conversation not found or workspace mismatch' });
    }

    // Handover rule: "When a human replies, the bot stays silent until the
    // conversation is resolved or the agent turns autopilot back on."
    //
    // closed_at cannot tell us about a resolution: the visitor's own message
    // reopens the conversation and clears it before this route runs. The
    // last_resolved_at column (never cleared) and channel_metadata carry the
    // history instead.
    const meta = ((conv.channel_metadata as Record<string, any>) || {}) as Record<string, any>;
    const lastHumanReply = [...msgs]
      .reverse()
      .find((m) => m.sender_type === 'agent' && !m.is_internal && m.sender_id != null);

    const resolvedAt = latest(conv.last_resolved_at, conv.closed_at, meta.last_resolved_at);
    const lastHumanAt = latest(lastHumanReply?.created_at, meta.last_human_reply_at);
    const autopilotAt = latest(meta.autopilot_enabled_at);
    // When the assistant was switched off: by a human reply, by hand, or by a handover.
    const disabledAt = latest(lastHumanReply?.created_at, meta.last_human_reply_at, meta.ai_disabled_at);

    const humanActive =
      lastHumanAt > -Infinity && autopilotAt < lastHumanAt && resolvedAt < lastHumanAt;

    // A conversation resolved after the assistant was switched off starts a
    // new exchange, so the assistant gets its turn back.
    let aiDisabled = conv.ai_mode === 'disabled';
    if (aiDisabled && resolvedAt > -Infinity && resolvedAt > disabledAt) {
      aiDisabled = false;
      conv.ai_mode = 'autopilot';
      await supabase
        .from('conversations')
        .update({ ai_mode: 'autopilot' })
        .eq('id', conversation_id)
        .eq('ai_mode', 'disabled');
    }

    // "wants_human: confirm the handover to the visitor and notify agents. This must work even after a previous handover."
    const isAskingForHuman = wantsHuman(visitorMsg.content);

    if ((humanActive || aiDisabled) && !isAskingForHuman) {
      return json({
        replied: false,
        reason: humanActive
          ? 'Human agent has replied. Bot stays silent until resolved or autopilot is turned back on.'
          : 'AI disabled on this conversation',
      });
    }

    const burstContext = msgs
      .filter((m) => isVisitorLine(m) && m.id !== targetVisitorMsgId && Date.parse(m.created_at) <= Date.parse(visitorMsg.created_at))
      .slice(-3)
      .map((m) => m.content as string)
      .reverse();

    const earlier = msgs
      .filter((m) => isVisitorLine(m) && m.id !== targetVisitorMsgId && !burstContext.includes(m.content as string))
      .map((m) => m.content as string)
      .reverse();

    const history = [...burstContext, ...earlier].slice(0, 4);

    const targetAt = Date.parse(visitorMsg.created_at);
    const turns = msgs
      .filter(
        (m) =>
          m.id !== targetVisitorMsgId &&
          // Only what came before the message being answered.
          Date.parse(m.created_at) <= targetAt &&
          !m.is_internal &&
          ['visitor', 'agent', 'ai'].includes(m.sender_type) &&
          typeof m.content === 'string' &&
          m.content.trim()
      )
      .slice(-8)
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
      workspaceName: workspace?.name,
      // A human took part in this exchange (they replied after the last
      // resolution): the assistant should not repeat a handover line.
      hasHumanReplied: lastHumanAt > -Infinity && lastHumanAt > resolvedAt,
    });

    let aiResponseText = result.replyText;
    if (!aiResponseText || !aiResponseText.trim()) {
      return json({ replied: false, reason: 'Empty auto-response generated' });
    }

    // 3b. ATOMIC DOUBLE-CHECK: Re-query messages to guarantee no agent or AI replied during RAG generation
    const { data: lateReplies } = await supabase
      .from('messages')
      .select('id, sender_type, is_internal, reply_to_message_id, metadata, created_at')
      .eq('conversation_id', conversation_id)
      .or(`reply_to_message_id.eq.${targetVisitorMsgId},metadata->>answered_message_id.eq.${targetVisitorMsgId},metadata->>handover_for_message_id.eq.${targetVisitorMsgId}`)
      .limit(5);

    if (lateReplies && lateReplies.length > 0) {
      return json({ replied: false, reason: 'Already responded for this visitor message during generation' });
    }

    const { data: humanReplies } = await supabase
      .from('messages')
      .select('id')
      .eq('conversation_id', conversation_id)
      .eq('is_internal', false)
      .eq('sender_type', 'agent')
      .gt('created_at', visitorMsg.created_at)
      .limit(1);

    if (humanReplies && humanReplies.length > 0) {
      return json({ replied: false, reason: 'Already responded during generation' });
    }

    // Check if conversation was closed or handed over during generation
    const { data: freshConv } = await supabase
      .from('conversations')
      .select('status, ai_mode')
      .eq('id', conversation_id)
      .single();

    if (freshConv && (freshConv.status === 'closed' || freshConv.ai_mode === 'disabled')) {
      return json({ replied: false, reason: 'Conversation status changed during generation' });
    }

    // The reply must be in the language of the visitor's latest message. The
    // model is told so, but the documentation it quotes is usually English,
    // and the no-provider fallback answers straight from that documentation —
    // so check, and translate when the reply came out in the wrong language.
    const visitorText = (visitorMsg.content || '').trim();
    const visitorLang = await visitorLanguageOf(visitorText);
    const replyLang = isLikelyEnglishText(aiResponseText) ? 'en' : detectLanguage(aiResponseText).code;
    const providerConfig = providerConfigFrom(aiSettings);
    let aiEnglishTranslation = aiResponseText;

    if (visitorLang.code !== 'en' && replyLang === 'en') {
      try {
        const t = await translateAgentReply({
          text: aiResponseText,
          targetLanguageCode: visitorLang.code,
          sourceLanguageCode: 'en',
          providerConfig,
          businessName: workspace?.name,
          romanize: visitorLang.roman,
        });
        if (t.translatedText?.trim()) {
          aiEnglishTranslation = aiResponseText;
          aiResponseText = t.translatedText.trim();
        }
      } catch (err) {
        console.warn('[Auto-Respond] Reply translation failed, sending as written:', err);
      }
    } else if (visitorLang.code === 'en' && replyLang !== 'en') {
      try {
        const t = await translateToEnglish({ text: aiResponseText, providerConfig });
        if (t.englishText?.trim()) aiResponseText = t.englishText.trim();
        aiEnglishTranslation = aiResponseText;
      } catch (err) {
        console.warn('[Auto-Respond] Reply translation to English failed:', err);
      }
    } else if (visitorLang.code !== 'en') {
      // Already in the visitor's language: keep an English copy for agents.
      try {
        const t = await translateToEnglish({ text: aiResponseText, providerConfig });
        if (t.englishText?.trim()) aiEnglishTranslation = t.englishText.trim();
      } catch {}
    }
    const detected = { code: visitorLang.code, name: getLanguageInfo(visitorLang.code).name };

    // 4. Insert message as 'ai' sender with idempotency keys
    const { data: insertedMsg, error: msgErr } = await supabase
      .from('messages')
      .insert({
        conversation_id,
        sender_type: 'ai',
        sender_id: null,
        content: aiResponseText,
        is_internal: false,
        reply_to_message_id: targetVisitorMsgId,
        metadata: {
          answered_message_id: targetVisitorMsgId,
          reply_to_message_id: targetVisitorMsgId,
          answered_until: visitorMsg.created_at,
          delivered_language: detected.code,
          delivered_language_name: detected.name,
          english_translation: aiEnglishTranslation,
        },
      })
      .select()
      .single();

    if (msgErr) {
      if ((msgErr as any).code === '23505') {
        return json({ replied: false, reason: 'Already responded for this visitor message' });
      }
      throw msgErr;
    }

    // 4b. If Help Desk cannot answer or customer requested a real agent, execute handover!
    if (result.shouldHandover) {
      console.log(`[Auto-Respond] Handing over conversation ${conversation_id} to real agent. Reason: ${result.handoverReason}`);
      await executeHandoverToHuman({
        supabase,
        conversationId: conversation_id,
        workspaceId: workspace_id,
        visitorMessageId: targetVisitorMsgId,
        reason: result.handoverReason || 'Inquiry not covered in Help Desk documentation.',
        channel: conv.channel || 'web',
        disableAi: Boolean(result.disableAi),
        internalNote: result.internalNote,
        priority: result.priority || 'high',
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
    if (error?.code === '23505') {
      return json({ replied: false, reason: 'Already responded for this visitor message' });
    }
    console.error('Error in AI auto-respond:', error);
    return json({ error: error.message || 'Auto-respond failed' }, { status: 500 });
  } finally {
    if (lockAcquired && conversation_id) {
      inFlightConversations.delete(conversation_id);
    }
    if (messageLockAcquired && targetVisitorMsgId) {
      inFlightMessages.delete(targetVisitorMsgId);
    }
  }
}
