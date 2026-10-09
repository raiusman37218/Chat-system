import { serviceClient } from '@/lib/supabase/service';
import {
  answerFromHelpCenter,
  buildModelContext,
  helpCenterTopics,
  recordUnanswered,
  type CitableArticle,
  type RetrievalConfidence,
} from './help-answer';
import { chat, isConfigured, ProviderError, type ProviderConfig } from './provider';
import {
  accountSpecificReply,
  buildHandoverSummary,
  classifyVisitorIntent,
  cleanVisitorDisplayName,
  complaintApology,
  localized,
  outOfScopeReply,
  replyLanguageOf,
  smallTalkReply,
  wantsHumanReply,
  type IntentClassificationResult,
  type ReplyLanguage,
  type VisitorIntent,
} from './intent';

export { cleanVisitorDisplayName };

function getSupabase() {
  return serviceClient();
}

/**
 * Runs a short model call through whichever provider the workspace configured.
 * Returns null when nothing is configured or the call fails, which is every
 * caller's cue to use its own fallback.
 */
async function askModel(
  providerConfig: ProviderConfig | null | undefined,
  system: string,
  user: string,
  maxTokens = 700
): Promise<string | null> {
  if (!isConfigured(providerConfig)) return null;
  try {
    const res = await chat(providerConfig!, {
      system,
      messages: [{ role: 'user', content: user }],
      maxTokens,
      temperature: 0,
    });
    return res.text || null;
  } catch (err) {
    const e = err as ProviderError;
    console.warn(
      `[ai] ${e?.provider || 'provider'} call failed${e?.status ? ` (HTTP ${e.status})` : ''}: ${e?.message}`
    );
    return null;
  }
}

/** Models sometimes wrap JSON in prose or a code fence; take the payload. */
function parseJsonBlock<T>(text: string | null, opener: '[' | '{'): T | null {
  if (!text) return null;
  const closer = opener === '[' ? ']' : '}';
  const start = text.indexOf(opener);
  const end = text.lastIndexOf(closer);
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}

export interface HelpDeskResponseResult {
  replyText: string;
  shouldHandover: boolean;
  handoverReason?: string;
  canAnswerFromDocs: boolean;
  intent?: VisitorIntent;
  /** Whether rules or the model chose the intent. */
  intentSource?: IntentClassificationResult['source'];
  /** Internal note for agents when handing over: the handover summary. */
  internalNote?: string | null;
  disableAi?: boolean;
  priority?: 'normal' | 'high' | 'urgent';
  /** The article a help-centre answer is based on. */
  citation?: CitableArticle | null;
  /** Retrieval confidence, for help-centre questions only. */
  retrievalConfidence?: RetrievalConfidence;
}

/* ── Help-centre answers ──────────────────────────────────────────────── */

/**
 * What the bot says when the help centre has nothing that fits. It does not
 * guess and does not hand over on its own: it offers a person, and a "yes"
 * comes back as `wants_human` (see HANDOFF_OFFER in intent.ts, which must keep
 * matching every one of these).
 */
export function lowConfidenceReply(lang: ReplyLanguage): string {
  return localized(lang, {
    en: "I couldn't find this in our help center, and I'd rather not guess. Would you like me to connect you with a team member?",
    roman_ur: 'Mujhe yeh hamare help center mein nahi mila, aur main andaza nahi lagana chahta. Kya main aapko team member se connect kar doon?',
    ur: 'مجھے یہ ہمارے ہیلپ سینٹر میں نہیں ملا، اور میں اندازہ نہیں لگانا چاہتا۔ کیا میں آپ کو ہماری سپورٹ ٹیم کے ممبر سے منسلک کر دوں؟',
    hi: 'मुझे यह हमारे सहायता केंद्र में नहीं मिला, और मैं अनुमान नहीं लगाना चाहता। क्या मैं आपको हमारी सहायता टीम के किसी सदस्य से जोड़ दूँ?',
    ar: 'لم أجد هذا في مركز المساعدة، ولا أريد التخمين. هل تريد أن أصلك بأحد أعضاء فريق الدعم؟',
    es: 'No encontré esto en nuestro centro de ayuda y prefiero no adivinar. ¿Quieres que te comunique con un miembro de nuestro equipo?',
    fr: "Je n'ai pas trouvé cela dans notre centre d'aide et je préfère ne pas deviner. Voulez-vous que je vous mette en contact avec un membre de notre équipe ?",
  });
}

/** "Source: [Title](url)" in the visitor's language; bold title without a URL. */
export function formatCitation(source: { title: string; url: string | null }, lang: ReplyLanguage): string {
  const label = localized(lang, { en: 'Source', ur: 'ماخذ', hi: 'स्रोत', ar: 'المصدر', es: 'Fuente' });
  const title = source.title.replace(/[[\]]/g, '');
  return source.url ? `${label}: [${title}](${source.url})` : `${label}: **${title}**`;
}

/**
 * Tidies a model's answer for the chat bubble. Links are removed because the
 * citation is added by code from the article that was actually retrieved; a
 * URL the model wrote may be one it invented.
 */
export function cleanModelAnswer(rawText: string): string {
  return rawText
    .replace(/\[(?:SOURCE|NOT_COVERED|HANDOVER)[^\]]*\]/gi, '')
    .replace(/^#{1,6}\s+(.+)$/gm, '**$1**')
    .replace(/\[([^\]]+)\]\((?:https?:\/\/|mailto:)[^\s)]+\)/g, (_m, anchor: string) =>
      /read\s+(?:more|full)|mazeed|مزید|اقرأ|leer|lire|source|article/i.test(anchor) ? '' : anchor
    )
    .replace(/(?:^|\s)https?:\/\/\S+/g, '')
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const SOURCE_TAG = /\[SOURCE:\s*(\d+)\s*\]/i;
const NOT_COVERED_TAG = /\[(?:NOT_COVERED|HANDOVER)\b/i;

function answeringInstructions(brand: string): string {
  return [
    `You answer customer questions for ${brand} using ONLY the numbered help-center articles below.`,
    '',
    'Rules:',
    '1. Use only facts stated in the articles. Never add outside knowledge or assumptions.',
    '2. If the articles do not answer the question, reply with exactly [NOT_COVERED] and nothing else.',
    '3. Answer every part of the question the articles cover, in under 120 words.',
    "4. Reply in the language and script of the customer's latest message. If it mixes English and Roman Urdu, reply in Roman Urdu.",
    '5. Do not write links or URLs. The article link is added for you.',
    '6. End your reply with [SOURCE: n], where n is the number of the article you relied on most.',
    '7. Plain text or simple markdown only (bold, bullet lists). No headings.',
  ].join('\n');
}

interface HelpCenterInput {
  workspaceId: string;
  conversationId: string;
  incomingMessage: string;
  intent: IntentClassificationResult;
  lang: ReplyLanguage;
  brand: string;
  providerConfig?: ProviderConfig | null;
  systemPrompt?: string | null;
  history?: string[];
  conversationMessages: { role: 'user' | 'assistant'; content: string }[];
  helpCenterUrl?: string | null;
}

/**
 * Answers a help-centre question from this workspace's published articles,
 * with a citation, or says it cannot and offers a person. The decision to
 * answer is made on retrieval confidence before any model is asked; a model
 * that then finds the articles do not cover the question, or names no source,
 * is treated the same as low confidence.
 */
async function answerHelpCenterQuestion(input: HelpCenterInput): Promise<HelpDeskResponseResult> {
  const { workspaceId, conversationId, incomingMessage, intent, lang, brand, providerConfig } = input;
  const apology = intent.isComplaint ? `${complaintApology(lang)} ` : '';

  const context = await buildModelContext(workspaceId, incomingMessage, {
    history: input.history,
    turns: input.conversationMessages.slice(-6),
    limit: 6,
    providerConfig,
    helpCenterUrl: input.helpCenterUrl,
    articlesOnly: true,
  });

  const notAnswered = async (why: string, record = true): Promise<HelpDeskResponseResult> => {
    if (record) {
      await recordUnanswered(workspaceId, incomingMessage, why, conversationId, context.queryEmbedding);
    }
    return {
      replyText: `${apology}${lowConfidenceReply(lang)}`,
      shouldHandover: false,
      canAnswerFromDocs: false,
      intent: intent.intent,
      intentSource: intent.source,
      disableAi: false,
      citation: null,
      retrievalConfidence: 'low',
    };
  };

  const answered = (text: string, citation: CitableArticle): HelpDeskResponseResult => ({
    replyText: `${apology}${text}\n\n${formatCitation(citation, lang)}`,
    shouldHandover: false,
    canAnswerFromDocs: true,
    intent: intent.intent,
    intentSource: intent.source,
    disableAi: false,
    citation,
    retrievalConfidence: context.confidence,
  });

  if (context.confidence === 'low' || context.sources.length === 0) {
    return notAnswered('Help center has no article that fits (low retrieval confidence)');
  }

  if (isConfigured(providerConfig)) {
    try {
      const system = [
        input.systemPrompt?.trim() || '',
        answeringInstructions(brand),
        '',
        '# HELP-CENTER ARTICLES',
        context.text,
      ]
        .filter((part, i) => i > 0 || part)
        .join('\n');

      const result = await chat(providerConfig!, {
        system,
        messages: input.conversationMessages,
        maxTokens: 900,
        temperature: 0.1,
        reasoning: 'fast',
      });
      const raw = (result.text || '').trim();

      if (raw) {
        if (NOT_COVERED_TAG.test(raw)) {
          return notAnswered('Articles retrieved, but they do not answer the question');
        }
        const n = Number(raw.match(SOURCE_TAG)?.[1]);
        const cited =
          Number.isInteger(n) && n >= 1 && n <= context.sources.length
            ? context.sources[n - 1]
            : context.confidence === 'high'
            ? context.sources[0]
            : null;
        const text = cleanModelAnswer(raw);
        if (!cited || !text) {
          // An answer that cannot say where it came from is a guess.
          return notAnswered('Model answer named no source');
        }
        return answered(text, cited);
      }
    } catch (err) {
      const e = err as ProviderError;
      console.warn(`[ai] ${e?.provider || 'provider'} call failed: ${e?.message}. Answering from the articles directly.`);
    }
  }

  // No model, or it failed: quote the article itself, and only when sure.
  const answer = await answerFromHelpCenter({
    workspaceId,
    conversationId,
    message: context.rewrittenQuery || incomingMessage,
    history: input.history,
    helpCenterUrl: input.helpCenterUrl,
    chunks: context.chunks,
    belowThreshold: context.belowThreshold,
    queryEmbedding: context.queryEmbedding,
    intent: intent.intent,
    providerConfig,
    articlesOnly: true,
  });

  if (answer.text && answer.article && answer.source !== 'note') {
    return answered(answer.text.trim(), {
      id: answer.article.id,
      title: answer.article.title,
      slug: answer.article.slug ?? null,
      url: answer.article.url ?? null,
    });
  }
  // answerFromHelpCenter has already recorded the gap.
  return notAnswered(answer.reason, false);
}

/* ── Pipeline ─────────────────────────────────────────────────────────── */

/**
 * The bot's reply to one visitor message:
 *
 *   1. classify intent (rules, then the workspace's model when rules are unsure)
 *   2. route:
 *      small_talk           short reply in the visitor's language
 *      help_center_question cited answer from published articles, or an offer
 *                           of a person when retrieval confidence is low
 *      account_specific     hand over with a summary; ask for missing order /
 *                           account number and email
 *      out_of_scope         say what the bot covers; hand over with a summary
 *      wants_human          hand over with a summary
 *
 * The caller (the auto-respond route) stores the reply and runs the handover.
 */
export async function generateHelpDeskResponseWithHandover({
  workspaceId,
  conversationId,
  incomingMessage,
  visitorName,
  providerConfig,
  systemPrompt,
  history,
  turns,
  helpCenterUrl,
  workspaceName,
  hasHumanReplied = false,
}: {
  workspaceId: string;
  conversationId: string;
  incomingMessage: string;
  visitorName?: string;
  providerConfig?: ProviderConfig | null;
  systemPrompt?: string | null;
  history?: string[];
  turns?: { role: 'user' | 'assistant'; content: string }[];
  helpCenterUrl?: string | null;
  workspaceName?: string | null;
  /** A human agent has already replied in the current exchange. */
  hasHumanReplied?: boolean;
}): Promise<HelpDeskResponseResult> {
  const brand = workspaceName?.trim() || 'our team';
  const lang = replyLanguageOf(incomingMessage);
  const name = cleanVisitorDisplayName(visitorName);

  const priorTurns = (turns && turns.length
    ? turns
    : (history || []).slice(0, 14).reverse().map((h) => ({ role: 'user' as const, content: h }))
  ).slice(-14);
  const conversationMessages = [...priorTurns, { role: 'user' as const, content: incomingMessage }].slice(-15);

  const intent = await classifyVisitorIntent({
    message: incomingMessage,
    recentMessages: conversationMessages,
    providerConfig,
    workspaceName: brand,
    topics: isConfigured(providerConfig) ? await helpCenterTopics(workspaceId) : [],
  });

  const handover = (
    replyText: string,
    opts: { disableAi: boolean; priority: 'normal' | 'high' }
  ): HelpDeskResponseResult => ({
    replyText,
    shouldHandover: true,
    handoverReason: intent.reason,
    canAnswerFromDocs: false,
    intent: intent.intent,
    intentSource: intent.source,
    internalNote: buildHandoverSummary({ intent, message: incomingMessage, recentMessages: conversationMessages, lang }),
    disableAi: opts.disableAi,
    priority: opts.priority,
  });

  switch (intent.intent) {
    case 'small_talk':
      return {
        replyText: smallTalkReply(intent.smallTalkKind ?? 'greeting', lang, brand, name),
        shouldHandover: false,
        canAnswerFromDocs: false,
        intent: intent.intent,
        intentSource: intent.source,
        disableAi: false,
      };

    case 'wants_human':
      // The bot steps aside until the conversation is resolved.
      return handover(wantsHumanReply(lang, hasHumanReplied), { disableAi: true, priority: 'high' });

    case 'account_specific':
      // Only someone with access to their records can help.
      return handover(accountSpecificReply(lang, intent), { disableAi: true, priority: 'high' });

    case 'out_of_scope':
      // The bot stays on: the visitor's next message may well be in scope.
      return handover(outOfScopeReply(lang, brand), { disableAi: false, priority: 'normal' });

    case 'help_center_question':
    default:
      return answerHelpCenterQuestion({
        workspaceId,
        conversationId,
        incomingMessage,
        intent,
        lang,
        brand,
        providerConfig,
        systemPrompt,
        history,
        conversationMessages,
        helpCenterUrl,
      });
  }
}

/**
 * Backward compatibility wrapper returning reply text
 */
export async function generateAutoFirstResponse(params: {
  workspaceId: string;
  conversationId: string;
  incomingMessage: string;
  visitorName?: string;
  providerConfig?: ProviderConfig | null;
  systemPrompt?: string | null;
  history?: string[];
  turns?: { role: 'user' | 'assistant'; content: string }[];
  helpCenterUrl?: string | null;
  workspaceName?: string | null;
}): Promise<string> {
  const result = await generateHelpDeskResponseWithHandover(params);
  return result.replyText;
}

/**
 * Executes a seamless handover to human agents:
 * - Updates conversation: status = 'open', priority = 'high', ai_mode = 'disabled'
 * - Inserts internal note: '🤖 [AI Handover]: Transferred to human agent. Reason: ...'
 * - Auto-assigns to an online human agent if auto-assignment is enabled
 */
export async function executeHandoverToHuman({
  supabase,
  conversationId,
  workspaceId,
  reason,
  channel = 'web',
  visitorMessageId,
  disableAi = false,
  internalNote,
  priority = 'high',
}: {
  supabase: ReturnType<typeof getSupabase>;
  conversationId: string;
  workspaceId: string;
  reason: string;
  channel?: string;
  visitorMessageId?: string;
  disableAi?: boolean;
  internalNote?: string | null;
  priority?: 'normal' | 'high' | 'urgent';
}) {
  try {
    // 0. Idempotency guard: refuse to create a second handover note for the same visitor message
    if (visitorMessageId) {
      const { data: existingHandover } = await supabase
        .from('messages')
        .select('id')
        .eq('conversation_id', conversationId)
        .eq('is_internal', true)
        .or(`reply_to_message_id.eq.${visitorMessageId},metadata->>handover_for_message_id.eq.${visitorMessageId}`)
        .limit(1);

      if (existingHandover && existingHandover.length > 0) {
        console.log(`[executeHandoverToHuman] Handover note already exists for visitor message ${visitorMessageId}. Skipping duplicate note.`);
        return;
      }
    }

    // 0b. One visible handover per exchange. A visitor who asks three
    // uncovered questions in a row should not be told three times that they
    // were passed to the team; agents are already notified.
    const [{ data: recent }, { data: convRow }] = await Promise.all([
      supabase
        .from('messages')
        .select('sender_type, is_internal, sender_id, metadata, created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(30),
      supabase.from('conversations').select('*').eq('id', conversationId).maybeSingle(),
    ]);
    const resolvedAt = Date.parse((convRow as any)?.last_resolved_at || '') || -Infinity;
    const alreadyHandedOver = (() => {
      for (const m of recent || []) {
        // Earlier exchanges (before the last resolution) do not count.
        if (Date.parse(m.created_at) <= resolvedAt) return false;
        // A human reply since the last handover means this is a new handover.
        if (m.sender_type === 'agent' && !m.is_internal && m.sender_id) return false;
        if (m.metadata?.system_event === 'handover' || m.metadata?.is_handover) return true;
      }
      return false;
    })();

    // 1. Escalate conversation in Supabase
    const now = new Date().toISOString();
    const updatePayload: Record<string, any> = {
      status: 'open',
      priority,
      updated_at: now,
    };
    if (disableAi) {
      updatePayload.ai_mode = 'disabled'; // Disables AI auto-replies on this conversation
      // Recorded so a later resolution knows the switch-off predates it.
      updatePayload.channel_metadata = {
        ...(((convRow as any)?.channel_metadata as Record<string, any>) || {}),
        ai_disabled_at: now,
      };
    }

    await supabase
      .from('conversations')
      .update(updatePayload)
      .eq('id', conversationId);

    if (alreadyHandedOver && !disableAi) {
      return;
    }

    // 2. Insert private internal note for human support agents with visitor message reference
    const noteContent =
      internalNote ||
      `🤖 [AI Handover to Real Agent]: Handed over to human agent.\nReason: ${reason}`;

    const { error: insertErr } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_type: 'ai',
      content: noteContent,
      is_internal: true,
      reply_to_message_id: visitorMessageId || null,
      metadata: {
        is_handover: true,
        handover_for_message_id: visitorMessageId || null,
        reason,
        priority,
      },
    });

    if (insertErr) {
      if ((insertErr as any).code === '23505') {
        console.log(`[executeHandoverToHuman] Handover note already exists for visitor message ${visitorMessageId} (unique violation). Skipping.`);
        return;
      }
      throw insertErr;
    }

    // 2b. Visitor-visible system event. The widget turns it into
    // "We've passed this to our team. We usually reply within … We'll also
    // email you at …" using the reply time and the visitor's own email.
    if (channel === 'web') {
      await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_type: 'ai',
        content: "We've passed this to our team.",
        is_internal: false,
        metadata: {
          system_event: 'handover',
          handover_for_message_id: visitorMessageId || null,
        },
      });
    }

    // 3. Attempt auto-assignment to available human agent
    const { data: ws } = await supabase
      .from('workspaces')
      .select('auto_assignment')
      .eq('id', workspaceId)
      .maybeSingle();

      const appUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || '').replace(/\/+$/, '');
      if (appUrl) {
        fetch(`${appUrl}/api/conversations/auto-assign`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversation_id: conversationId }),
        }).catch((e) => console.warn('[Auto-Assign Error during Handover]:', e));
      }
  } catch (err: any) {
    if (err?.code === '23505') {
      return;
    }
    console.error('[executeHandoverToHuman Error]:', err.message);
  }
}

/**
 * 2. AI Suggested Replies (Returns 2-3 contextual drafts for an agent)
 */
export async function generateSuggestedReplies({
  incomingMessage,
  conversationHistory,
  visitorName,
  providerConfig,
}: {
  incomingMessage: string;
  conversationHistory?: Array<{ sender_type: string; content: string }>;
  visitorName?: string;
  providerConfig?: ProviderConfig | null;
}): Promise<Array<{ title: string; text: string }>> {
  {
    {
      const historySummary = (conversationHistory || [])
        .slice(-6)
        .map((m) => `${m.sender_type.toUpperCase()}: ${m.content}`)
        .join('\n');

      const prompt = `You are assisting a customer support agent.
Customer: "${visitorName || 'Customer'}"
Recent conversation context:
${historySummary || `VISITOR: ${incomingMessage}`}

Generate exactly 3 diverse, contextual suggested replies the agent can choose from:
1. A direct solution/confirmation
2. A friendly troubleshooting/explanatory guide
3. A polite follow-up asking for more details

Reply with a JSON array of objects with keys "title" (2-3 words) and "text" (the message). JSON only.`;

      const parsed = parseJsonBlock<Array<{ title: string; text: string }>>(
        await askModel(providerConfig, 'You write concise customer support replies.', prompt, 800),
        '['
      );
      if (Array.isArray(parsed) && parsed.length) return parsed;
    }
  }

  // Heuristic Fallback drafts
  return [
    {
      title: 'Quick Resolution',
      text: `Hi ${visitorName || 'there'}! I've checked into this for you and updated your settings. Everything is good to go now!`,
    },
    {
      title: 'Step-by-Step Help',
      text: `Hello! You can easily accomplish this by navigating to your Account Settings and clicking the Verification tab.`,
    },
    {
      title: 'Ask for Details',
      text: `Thanks for reaching out! Could you please provide your account email or order number so I can look into this immediately?`,
    },
  ];
}

/**
 * 3. Auto-Tagging (Suggests tags based on conversation content)
 */
export async function generateAutoTags({
  content,
  existingTags,
  providerConfig,
}: {
  content: string;
  existingTags?: string[];
  providerConfig?: ProviderConfig | null;
}): Promise<string[]> {
  {
    {
      const prompt = `Analyze this customer support conversation message and extract 1 to 3 relevant tags.
Message: "${content}"
Standard categories to pick from: Billing, Bug, Refund, VIP, Feature Request, Sales Lead, Account Access, Urgent, Setup, General.

Output ONLY a comma-separated list of tags, for example: "Billing, Refund"`;

      const text = await askModel(
        providerConfig,
        'You label customer support conversations. Reply with tags only.',
        prompt,
        60
      );
      if (text) {
        const tags = text
          .split(',')
          .map((t) => t.trim().replace(/^#/, ''))
          // A model that ignores the format instruction can return a sentence;
          // a 40-character "tag" is not one, and would look broken on a chip.
          .filter((t) => t.length > 0 && t.length <= 24)
          .slice(0, 3);
        if (tags.length) {
          return Array.from(new Set([...(existingTags || []), ...tags]));
        }
      }
    }
  }

  // Keyword heuristic fallback
  const text = content.toLowerCase();
  const tags: string[] = [...(existingTags || [])];

  if (text.includes('refund') || text.includes('cancel') || text.includes('money back')) tags.push('Refund');
  if (text.includes('bill') || text.includes('invoice') || text.includes('charge') || text.includes('card') || text.includes('price')) tags.push('Billing');
  if (text.includes('bug') || text.includes('error') || text.includes('broken') || text.includes('failed') || text.includes('crash')) tags.push('Bug');
  if (text.includes('urgent') || text.includes('asap') || text.includes('emergency')) tags.push('Urgent');
  if (text.includes('buy') || text.includes('purchase') || text.includes('enterprise') || text.includes('demo')) tags.push('Sales Lead');

  // No catch-all tag: a label every conversation carries is not a label.
  return Array.from(new Set(tags)).slice(0, 4);
}

/**
 * 4. Conversation Summary (Generates 2-line summary for long threads)
 */
export async function generateConversationSummary({
  messages,
  visitorName,
  providerConfig,
}: {
  messages: Array<{ sender_type: string; content: string }>;
  visitorName?: string;
  providerConfig?: ProviderConfig | null;
}): Promise<string> {
  {
    {
      const threadText = messages
        .map((m) => `${m.sender_type.toUpperCase()}: ${m.content}`)
        .join('\n');

      const prompt = `Summarize this support conversation in exactly 2 concise lines (under 25 words total).
Customer: ${visitorName || 'Visitor'}
Thread:
${threadText}

Format:
Line 1: Customer inquired about [issue].
Line 2: Status / resolution [status].`;

      const text = await askModel(
        providerConfig,
        'You summarise support conversations in two short lines.',
        prompt,
        160
      );
      if (text) return text.trim();
    }
  }

  // Fallback summary generator
  const visitorMsgs = messages.filter((m) => m.sender_type === 'visitor');
  const lastVisitor = visitorMsgs[visitorMsgs.length - 1]?.content || 'general inquiry';
  const hasAgentReply = messages.some((m) => m.sender_type === 'agent' || m.sender_type === 'ai');

  return `Customer inquired about: "${lastVisitor.slice(0, 60)}..."\n${hasAgentReply ? 'Agent replied with instructions. Awaiting customer follow-up.' : 'Awaiting agent first response.'}`;
}

export interface SentimentResult {
  sentiment: 'positive' | 'neutral' | 'negative';
  confidence: number;
}

/**
 * 5. Visitor Sentiment Analysis (Positive / Neutral / Negative)
 * Computed from the visitor's last 5 messages.
 * Marks Negative when messages contain insults, complaints or repeated "waiting" messages.
 * Returns confidence score so low-confidence badges can be hidden.
 */
export async function analyzeVisitorSentiment({
  messages,
  providerConfig,
}: {
  messages: Array<{ sender_type: string; content: string }>;
  providerConfig?: ProviderConfig | null;
}): Promise<SentimentResult> {
  const visitorMsgs = messages
    .filter((m) => m.sender_type === 'visitor')
    .slice(-5);

  if (visitorMsgs.length === 0) {
    return { sentiment: 'neutral', confidence: 0 };
  }

  // 1. Insults
  const insultRegex = /\b(stupid|idiot|moron|dumb|useless|scam|scammer|clowns?|pathetic|trash|garbage|bullshit|bull crap|worst|incompetent|terrible|sucks?|horrible|wtf|damn|fucking?)\b/i;

  // 2. Complaints
  const complaintRegex = /\b(broken|not working|doesn'?t work|won'?t work|failed|fail|failure|charge|billing issue|overcharg(ed|ing)|unacceptable|refund|cancel|disappointed|bad experience|horrible service|rip off|ripoff|fix this|frustrated|angry|fraud|poor service|awful)\b/i;

  // 3. Repeated "waiting" messages
  const waitingRegex = /\b(still waiting|waiting|wait|anyone (here|there|alive)|hello\?+|any update\?*|are you there|reply please|respond please|no response|how long|ignoring me|nobody answers)\b/i;

  const hasInsult = visitorMsgs.some((m) => insultRegex.test(m.content));
  const hasComplaint = visitorMsgs.some((m) => complaintRegex.test(m.content));
  const waitingMessagesCount = visitorMsgs.filter((m) => waitingRegex.test(m.content)).length;
  const singleMsgRepeatedWait = visitorMsgs.some((m) => {
    const matches = m.content.match(/\b(waiting|wait|hello\?|anyone there|reply)\b/gi);
    return matches && matches.length >= 2;
  });
  const hasRepeatedWaiting = waitingMessagesCount >= 2 || singleMsgRepeatedWait;

  if (hasInsult || hasComplaint || hasRepeatedWaiting) {
    return { sentiment: 'negative', confidence: 0.95 };
  }

  // 4. Check positive cues
  const positiveRegex = /\b(thank|thanks|thank you|great|awesome|helpful|love it|good job|perfect|resolved|amazing|excellent|wonderful|appreciate)\b/i;
  const positiveCount = visitorMsgs.filter((m) => positiveRegex.test(m.content)).length;
  if (positiveCount >= 1) {
    return { sentiment: 'positive', confidence: 0.85 };
  }

  // 5. LLM classification if providerConfig is available
  const visitorText = visitorMsgs.map((m) => m.content).join(' ');
  if (visitorText && providerConfig) {
    try {
      const prompt = `Analyze the sentiment of this customer's last messages:
"${visitorText}"

Classify into exactly one word: "positive", "neutral", or "negative".
Output ONLY the single classification word.`;

      const answer = await askModel(
        providerConfig,
        'You classify customer sentiment. Reply with one word: positive, neutral, or negative.',
        prompt,
        16
      );
      if (answer) {
        const text = answer.toLowerCase().trim();
        if (text.includes('neg')) return { sentiment: 'negative', confidence: 0.85 };
        if (text.includes('pos')) return { sentiment: 'positive', confidence: 0.85 };
        if (text.includes('neu')) return { sentiment: 'neutral', confidence: 0.4 };
      }
    } catch (err) {}
  }

  // Default to neutral with low confidence so badge stays hidden
  return { sentiment: 'neutral', confidence: 0.4 };
}
