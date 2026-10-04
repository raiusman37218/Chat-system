import { serviceClient } from '@/lib/supabase/service';
import {
  answerFromHelpCenter,
  buildModelContext,
  recordUnanswered,
  wantsHuman,
} from './help-answer';
import { chat, isConfigured, ProviderError, type ProviderConfig } from './provider';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vfjsaynnubxywdbevxtx.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmanNheW5udWJ4eXdkYmV2eHR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNTA5MDEsImV4cCI6MjEwMzgyNjkwMX0.YyBCXMqwrOk5BRhQafYLFw8tiM5PC8lc8Yocodw9wf0';

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

import { detectLanguage, translateToEnglish } from './translator';

/**
 * The English wording of a question, for the search step only.
 * One short call with thinking switched off — well under a second.
 */
async function translateForSearch(
  providerConfig: ProviderConfig | null | undefined,
  text: string
): Promise<string> {
  if (!isConfigured(providerConfig)) return text;
  try {
    const res = await chat(providerConfig!, {
      system:
        'Translate the customer message into plain English for knowledge base search. ' +
        'Preserve key keywords, product names, numbers, and technical terms. ' +
        'Output only the direct English translation without any extra notes.',
      messages: [{ role: 'user', content: text }],
      maxTokens: 120,
      temperature: 0,
      reasoning: 'fast',
      timeoutMs: 4000,
    });
    const english = res.text?.trim();
    return english ? `${english}\n${text}` : text;
  } catch {
    return text;
  }
}

import {
  classifyVisitorIntent,
  generateIntentDirectResponse,
  getExpectedReplyTimeNotice,
  cleanVisitorDisplayName,
  type VisitorIntent,
} from './intent';

export { cleanVisitorDisplayName };

export interface HelpDeskResponseResult {
  replyText: string;
  shouldHandover: boolean;
  handoverReason?: string;
  canAnswerFromDocs: boolean;
  intent?: VisitorIntent;
  internalNote?: string | null;
  disableAi?: boolean;
  priority?: 'normal' | 'high' | 'urgent';
}


/**
 * Sanitizes and cleans the AI response according to display guidelines:
 * 1. Output plain text or simple markdown only (bold, lists, links). No "###" headings.
 * 2. Keep at most ONE "Read more" link to an article.
 * 3. Never repeat or leave raw [NOT_COVERED] / [HANDOVER] tags in visitor text.
 */
export function sanitizeComposedAnswer(rawText: string): string {
  let text = rawText.trim();

  // Strip prompt tags or markers
  text = text
    .replace(/\[(?:NOT_COVERED|HANDOVER):\s*[^\]]*\]/gi, '')
    .replace(/\[NOT_COVERED\]/gi, '')
    .replace(/\[HANDOVER\]/gi, '')
    .trim();

  // Convert markdown headings (# Title, ## Title, ### Title) to **Title**
  text = text.replace(/^#{1,6}\s+(.+)$/gm, '**$1**');

  // Ensure at most ONE "Read more" or article link in the entire reply
  let linkCount = 0;
  text = text.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (fullMatch, anchorText) => {
    linkCount++;
    if (linkCount === 1) {
      return fullMatch;
    }
    // For subsequent links, if it is a "read more" style link, strip it completely; otherwise keep anchor text
    if (/read\s+more|read\s+full|mazeed|مزید|اقرأ|leer/i.test(anchorText)) {
      return '';
    }
    return anchorText;
  });

  // Clean up excessive blank lines and trailing spaces
  text = text.replace(/\n{3,}/g, '\n\n').trim();

  return text;
}

/**
 * Provides a warm, 1-sentence "not sure" response in the visitor's exact language and script,
 * asking a clarifying question or offering human assistance.
 */
export function getFallbackNotSureReply(
  langCode: string,
  incomingMessage: string,
  cleanName?: string | null
): string {
  const isRomanUrdu =
    (langCode === 'ur' && !/[\u0600-\u06FF]/.test(incomingMessage)) ||
    /\b(aap|kya|hai|hain|mein|kaise|shukriya|batao|karein|kar sakta|bataen|chahiye|kitna|hoga)\b/i.test(
      incomingMessage
    );

  if (isRomanUrdu) {
    return `Maazrat${cleanName ? ` ${cleanName}` : ''}, filhal mere paas is bare mein mukammal maloomat nahi hain. Kya main aapko support team ke member se connect kar doon?`;
  }
  if (langCode === 'ur') {
    return `معذرت${cleanName ? ` ${cleanName}` : ''}، فی الحال میرے پاس اس بارے میں مکمل معلومات نہیں ہیں۔ کیا میں آپ کو ہماری سپورٹ ٹیم کے ممبر سے منسلک کر دوں؟`;
  }
  if (langCode === 'ar') {
    return `عذراً${cleanName ? ` ${cleanName}` : ''}، لا تتوفر لديّ هذه المعلومة حالياً في مركز المساعدة. هل ترغب في أن أصلك بأحد أعضاء فريق الدعم للمتابعة؟`;
  }
  if (langCode === 'es') {
    return `Disculpa${cleanName ? ` ${cleanName}` : ''}, no tengo esa información en nuestra guía de ayuda en este momento. ¿Te gustaría que te comunique con nuestro equipo de soporte?`;
  }
  if (langCode === 'fr') {
    return `Désolé${cleanName ? ` ${cleanName}` : ''}, je n'ai pas cette information dans notre centre d'aide pour le moment. Souhaitez-vous que je vous mette en contact avec un conseiller ?`;
  }
  return `I don't have the exact details on that in our help guide right now. Would you like me to connect you with a team member who can help?`;
}

/**
 * 1. AI Auto-First-Response with RAG over Help Desk sections & articles, with intelligent Human Handover
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
}): Promise<HelpDeskResponseResult> {
  const brand = workspaceName?.trim() || 'our team';
  const detected = detectLanguage(incomingMessage);
  const langCode = detected.code;
  const cleanName = cleanVisitorDisplayName(visitorName);
  const isRomanUrdu =
    detected.name === 'Urdu (Roman)' ||
    (langCode === 'ur' && !/[\u0600-\u06FF]/.test(incomingMessage)) ||
    /\b(aap|kya|hai|hain|mein|kaise|shukriya|batao|karein|kar sakta|bataen|chahiye|kitna|hoga)\b/i.test(
      incomingMessage
    );

  // 1. Prepare conversation turns: Support up to 15 recent messages (including agent replies & internal notes)
  const priorTurns = (turns && turns.length
    ? turns
    : (history || []).slice(0, 14).reverse().map((h) => ({ role: 'user' as const, content: h }))
  ).slice(-14);

  const conversationMessages = [
    ...priorTurns,
    { role: 'user' as const, content: incomingMessage },
  ].slice(-15);

  const hasHumanReplied = (turns || []).some(
    (t) =>
      t.content.includes('[Human Agent]') ||
      t.content.includes('[Agent]') ||
      t.content.includes('[Internal Team Note]')
  );

  // 2. Intent step before retrieval: Classify message into one of 7 intents
  const intentResult = await classifyVisitorIntent({
    message: incomingMessage,
    recentMessages: conversationMessages,
    providerConfig,
    workspaceName: brand,
  });

  const direct = generateIntentDirectResponse({
    intentResult,
    incomingMessage,
    visitorName,
    workspaceName: brand,
  });

  if (direct) {
    // If a human has already replied, do not trigger handover lines or repeats
    if (hasHumanReplied && direct.shouldHandover) {
      // Proceed to docs retrieval instead of repeating a handover line
    } else {
      return {
        replyText: direct.replyText,
        shouldHandover: direct.shouldHandover,
        handoverReason: direct.handoverReason,
        canAnswerFromDocs: false,
        intent: intentResult.intent,
        internalNote: direct.createInternalNote,
        disableAi: direct.shouldHandover, // only disable AI if explicit human or account issue
        priority: direct.setPriorityHigh ? 'high' : 'normal',
      };
    }
  }

  // 3. For intent 'question' (or general question complaints), proceed to semantic retrieval
  const replyTimeNotice = getExpectedReplyTimeNotice(langCode, isRomanUrdu);
  const complaintApology =
    intentResult.intent === 'complaint'
      ? (isRomanUrdu
          ? 'Hamein is pareshani par nihayat afsos hai.'
          : langCode === 'ur'
          ? 'ہمیں اس پریشانی پر دلی افسوس ہے۔'
          : langCode === 'ar'
          ? 'نعتذر بشدة عن أي إزعاج.'
          : 'I am truly sorry for the frustration this has caused you.')
      : '';

  // For query rewriting: up to last 6 messages
  const rewriteTurns = conversationMessages.slice(-6);

  const context = await buildModelContext(workspaceId, incomingMessage, {
    history,
    turns: rewriteTurns,
    limit: 6,
    providerConfig,
    helpCenterUrl,
  });

  const effectiveSearchQuery = context.rewrittenQuery || incomingMessage;

  // 2. Ask whichever provider this workspace configured
  if (isConfigured(providerConfig)) {
    try {
      const defaultComposingInstructions = [
        `You are a knowledgeable and helpful customer support specialist for ${brand}.`,
        'Your job is to compose a concise, accurate support answer based strictly on the provided knowledge base chunks.',
        '',
        '# MANDATORY INSTRUCTIONS:',
        '1. ANSWER ONLY FROM CHUNKS: Answer strictly and exclusively from the provided knowledge base chunks. Do not extrapolate, assume, or use outside knowledge. If the chunks do not contain the answer, follow instruction 3.',
        '2. ANSWER EVERY PART: If the visitor asks a multi-part question, answer every single part thoroughly and directly using the information in the chunks.',
        '3. UNCOVERED QUESTIONS: If the provided chunks do not contain the answer (or do not cover part of the question), state clearly in exactly ONE sentence that you do not have that information, and ask one clarifying question or offer to connect them with a human team member. Never recommend or send an unrelated article. Append [NOT_COVERED] at the end.',
        '4. STRICT WORD LIMIT: Keep your entire reply strictly under 120 words.',
        '5. EXACT LANGUAGE AND SCRIPT: Reply in the EXACT same language AND script the visitor used. If the visitor writes in Roman Urdu (Urdu written in the Latin alphabet, e.g. "account kaisay banayein"), you MUST reply in Roman Urdu in Latin script. Do not switch to Arabic/Urdu script. If the visitor writes in Arabic script, reply in Arabic script. If English, reply in English.',
        '6. VISITOR DISPLAY NAME: Never use the visitor\'s display name inside your sentence or greeting if it resembles a greeting word (e.g. "Hi", "Hello", "Hey", "Guest", etc.).',
        '7. LINKS: Add at most ONE "Read more" link to the single most relevant article URL provided in the chunks, formatted as [Read more](url) (or translated, e.g. [Mazeed parhein](url)). Never include more than one link, and never invent a URL.',
        '8. FORMATTING: Output plain text or simple markdown only (bold, bullet lists, links). NEVER use markdown headings (no "#", "##", or "###"). Use **bold** text for titles or emphasis.',
      ].join('\n');

      const systemPromptParts: string[] = [];
      if (systemPrompt && systemPrompt.trim()) {
        systemPromptParts.push(systemPrompt.trim(), '');
      }
      systemPromptParts.push(defaultComposingInstructions, '');
      if (cleanName) {
        systemPromptParts.push(`Visitor Name: ${cleanName}`, '');
      }
      systemPromptParts.push(
        '# KNOWLEDGE BASE CHUNKS:',
        context.text && !context.belowThreshold
          ? context.text
          : 'No relevant documentation available for this question.'
      );

      const system = systemPromptParts.join('\n');

      const result = await chat(providerConfig!, {
        system,
        messages: conversationMessages,
        maxTokens: 1200,
        temperature: 0.1,
        reasoning: 'fast',
      });

      let rawText = (result.text || '').trim();
      if (rawText) {
        const gap =
          rawText.match(/\[(?:NOT_COVERED|HANDOVER):\s*([^\]]*)\]/i) ||
          rawText.includes('[NOT_COVERED]');
        const text = sanitizeComposedAnswer(rawText);

        if (gap || context.belowThreshold) {
          if (intentResult.intent === 'question') {
            await recordUnanswered(
              workspaceId,
              incomingMessage,
              `Model could not answer or below threshold: ${gap ? 'not covered' : 'below threshold'}`,
              conversationId,
              context.queryEmbedding
            );
          }
          const baseReply = text || getFallbackNotSureReply(langCode, incomingMessage, cleanName);
          const fullReply = complaintApology
            ? `${complaintApology} ${baseReply} ${replyTimeNotice}`
            : `${baseReply} ${replyTimeNotice}`;

          return {
            replyText: fullReply,
            shouldHandover: true,
            handoverReason: 'Inquiry not covered in knowledge base.',
            canAnswerFromDocs: false,
            intent: intentResult.intent,
            disableAi: false, // Handover Rule 1: A failed answer must NOT turn the bot off!
            priority: 'normal',
          };
        }

        const fullReply = complaintApology ? `${complaintApology} ${text}` : text;
        return {
          replyText: fullReply,
          shouldHandover: false,
          canAnswerFromDocs: true,
          intent: intentResult.intent,
          disableAi: false,
        };
      }
    } catch (err) {
      const e = err as ProviderError;
      console.warn(
        `[ai] ${e?.provider || 'provider'} call failed: ${e?.message}. Falling back to help-centre retrieval.`
      );
    }
  }

  // 3. Fallback: Answer from workspace knowledge base directly (No API key or provider call failed)
  const answer = await answerFromHelpCenter({
    workspaceId,
    conversationId,
    message: effectiveSearchQuery,
    history,
    visitorName: cleanName,
    helpCenterUrl,
    chunks: context.chunks,
    belowThreshold: context.belowThreshold,
    queryEmbedding: context.queryEmbedding,
    intent: intentResult.intent,
    providerConfig,
  });

  if (answer.text) {
    const text = sanitizeComposedAnswer(answer.text);
    const fullReply = complaintApology ? `${complaintApology} ${text}` : text;
    return {
      replyText: fullReply,
      shouldHandover: false,
      canAnswerFromDocs: true,
      intent: intentResult.intent,
      disableAi: false,
    };
  }

  // Warm, human fallback when documentation has no answer ("not sure" reply)
  if (intentResult.intent === 'question') {
    await recordUnanswered(
      workspaceId,
      incomingMessage,
      'Question not found in documentation fallback',
      conversationId,
      context.queryEmbedding
    );
  }

  const baseReply = hasHumanReplied
    ? `I have reviewed our help documentation, but could not locate specific details regarding "${incomingMessage}".`
    : getFallbackNotSureReply(langCode, incomingMessage, cleanName);
  const fullReply = complaintApology
    ? `${complaintApology} ${baseReply} ${hasHumanReplied ? '' : replyTimeNotice}`
    : `${baseReply} ${hasHumanReplied ? '' : replyTimeNotice}`;

  return {
    replyText: fullReply.trim(),
    shouldHandover: !hasHumanReplied,
    handoverReason: hasHumanReplied ? undefined : 'Question not found in documentation.',
    canAnswerFromDocs: false,
    intent: intentResult.intent,
    disableAi: false, // Handover Rule 1: A failed answer must NOT turn the bot off!
    priority: 'normal',
  };
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
  disableAi = true,
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

    // 1. Escalate conversation in Supabase
    const updatePayload: Record<string, any> = {
      status: 'open',
      priority,
      updated_at: new Date().toISOString(),
    };
    if (disableAi) {
      updatePayload.ai_mode = 'disabled'; // Disables AI auto-replies on this conversation
    }

    await supabase
      .from('conversations')
      .update(updatePayload)
      .eq('id', conversationId);

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
