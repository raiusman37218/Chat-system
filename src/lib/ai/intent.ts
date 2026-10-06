/**
 * Visitor Intent Classification and Routing Engine
 *
 * Classifies visitor messages into 7 distinct intents before retrieval:
 * 1. greeting: short welcome and ask how to help. No handover, no gap.
 * 2. thanks_or_ack: reply "You're welcome!" and nothing else. No handover, no gap.
 * 3. wants_human: confirm handover, state expected reply time (10-15 mins), notify agents.
 * 4. account_specific_issue: collect account number and email if missing, tell visitor team will check,
 *    create 1 internal note, set priority High.
 * 5. complaint: apologise in 1 sentence, then treat as account_specific_issue or question.
 * 6. off_topic: explain bot can only help with <workspace name> questions. No handover, no gap.
 * 7. question: route to semantic retrieval and answer from chunks.
 */

import { chat, isConfigured, type ProviderConfig } from './provider';
import { wantsHuman } from './help-answer';
import { detectLanguage } from './translator';

export type VisitorIntent =
  | 'greeting'
  | 'thanks_or_ack'
  | 'question'
  | 'wants_human'
  | 'account_specific_issue'
  | 'complaint'
  | 'off_topic';

export interface IntentClassificationResult {
  intent: VisitorIntent;
  confidence: number;
  accountNumber?: string | null;
  email?: string | null;
  complaintSubtype?: 'account_specific_issue' | 'question' | null;
  issueSummary?: string | null;
}

const GREETING_OR_GENERIC_NAMES = new Set([
  'hi',
  'hello',
  'hey',
  'hiya',
  'heya',
  'hola',
  'bonjour',
  'hallo',
  'salam',
  'salom',
  'assalam',
  'assalamu',
  'aloha',
  'yo',
  'good morning',
  'good afternoon',
  'good evening',
  'guest',
  'visitor',
  'user',
  'someone',
  'anonymous',
  'admin',
  'test',
]);

/**
 * Strips display names that are greetings or generic placeholders so the bot
 * never addresses customers as "Hi Hi!" or "Hello Hey".
 */
export function cleanVisitorDisplayName(name?: string | null): string | null {
  if (!name) return null;
  const trimmed = name.trim();
  if (!trimmed) return null;
  const normalized = trimmed.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (GREETING_OR_GENERIC_NAMES.has(normalized)) return null;
  if (/^(hi+|hello+|hey+|yo+|salam|hola|test)$/i.test(trimmed)) return null;
  return trimmed;
}

const GREETING_REGEX =
  /^\s*(hi+|hello+|hey+|hiya|heya|hola|bonjour|hallo|aloha|yo|good\s+(?:morning|afternoon|evening|day)|as-salamu\s+alaykum|assalamu\s+alaikum|assalam\s*o\s*alaikum|salaam\s*walekum|salam|kese\s*ho|kia\s*hal\s*hai)[\s!.,؟?]*$/i;

const THANKS_OR_ACK_REGEX =
  /^\s*(thanks+|thank\s*you|thx|ty|ok|okay|got\s*it|shukriya|theek\s*hai|understood|alright|all\s*good|perfect|cool|great|nice|noted|k|kk|done|ok\s+thanks|okay\s+thank\s+you|thanks\s+a\s+lot|thank\s+you\s+so\s+much|shukriya\s+bhai|bohot\s+shukriya)[\s!.,؟?]*$/i;

const OFF_TOPIC_REGEX =
  /\b(cake|cookie|cookies|recipe|bake|baking|chocolate|pizza|burger|pasta|cooking|ingredients|weather|forecast|rain today|temperature outside|write a python script|solve this calculus|write an essay on|who won the world cup|capital of france|who is president of|distance to the moon)\b/i;

const COMPLAINT_KEYWORDS_REGEX =
  /\b(scam|fraud|thief|thieves|cheat|cheating|terrible|worst service|disgusted|unacceptable|ridiculous|angry|furious|disappointed|frustrat(?:ing|ed|ion)|bakwaas|fraud company|chor|dhoka|loot liya|waste of money|very bad|awful|horrible|annoying|unfair|complaint|file a complaint|sue you|legal action|report you)\b/i;

const ACCOUNT_ISSUE_KEYWORDS_REGEX =
  /\b(payout|withdrawal|withdraw|breach|breached|dashboard|metrics|account number|account #|login credentials|login failed|password reset|deposit stuck|deposit pending|withdrawal stuck|withdrawal delayed|not updating|not syncing|my account|mera account|mera payout|mera withdrawal|account block|account ban)\b/i;

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i;
const ACCOUNT_NUMBER_REGEX =
  /\b(?:account|acc|login|mt4|mt5|id|ticket)\s*(?:#|no\.?|num(?:ber)?)?\s*[:=]?\s*(\d{4,10})\b/i;
const STANDALONE_NUMBER_REGEX = /(?:^|\s)#?(\d{5,9})(?:\s|$|[.,!?])/;

/**
 * Fast deterministic regex-based classification fallback.
 */
export function classifyVisitorIntentFast(text: string): IntentClassificationResult {
  const trimmed = (text || '').trim();

  // 1. Explicit greeting
  if (GREETING_REGEX.test(trimmed)) {
    return { intent: 'greeting', confidence: 0.98 };
  }

  // 2. Thanks or Acknowledgement ("thanks", "ok", "got it")
  if (THANKS_OR_ACK_REGEX.test(trimmed)) {
    return { intent: 'thanks_or_ack', confidence: 0.98 };
  }

  // 3. Human agent request
  if (wantsHuman(trimmed)) {
    return { intent: 'wants_human', confidence: 0.95 };
  }

  // Extract account number and email if present
  const emailMatch = trimmed.match(EMAIL_REGEX);
  const email = emailMatch ? emailMatch[0] : null;

  const accMatch = trimmed.match(ACCOUNT_NUMBER_REGEX) || trimmed.match(STANDALONE_NUMBER_REGEX);
  const accountNumber = accMatch ? accMatch[1] : null;

  // 4. Complaint
  if (COMPLAINT_KEYWORDS_REGEX.test(trimmed)) {
    const isAccountRelated =
      Boolean(accountNumber) || ACCOUNT_ISSUE_KEYWORDS_REGEX.test(trimmed);
    return {
      intent: 'complaint',
      confidence: 0.9,
      complaintSubtype: isAccountRelated ? 'account_specific_issue' : 'question',
      accountNumber,
      email,
      issueSummary: trimmed.slice(0, 150),
    };
  }

  // 5. Account-specific issue
  if (
    accountNumber ||
    ACCOUNT_ISSUE_KEYWORDS_REGEX.test(trimmed)
  ) {
    const mentionsIssue = /\b(delay|pending|stuck|not received|kab milega|nahi mila|kab aye ga|reject|fail|blown|closed|banned|blocked|not updating|not syncing|frozen|glitch|cannot login|can't login|invalid)\b/i.test(
      trimmed
    );
    if (accountNumber || mentionsIssue) {
      return {
        intent: 'account_specific_issue',
        confidence: 0.9,
        accountNumber,
        email,
        issueSummary: trimmed.slice(0, 150),
      };
    }
  }

  // 6. Off-topic queries
  if (OFF_TOPIC_REGEX.test(trimmed)) {
    return { intent: 'off_topic', confidence: 0.92 };
  }

  // 7. Default to general question
  return {
    intent: 'question',
    confidence: 0.85,
    accountNumber,
    email,
  };
}

/**
 * Classifies visitor message using configured AI model when available,
 * falling back to fast deterministic rules.
 */
export async function classifyVisitorIntent({
  message,
  recentMessages = [],
  providerConfig,
  workspaceName = 'our platform',
}: {
  message: string;
  recentMessages?: { role: string; content: string }[];
  providerConfig?: ProviderConfig | null;
  workspaceName?: string;
}): Promise<IntentClassificationResult> {
  const trimmed = message.trim();
  if (!trimmed) {
    return { intent: 'greeting', confidence: 1 };
  }

  // Fast check: greetings & thanks can be classified in 0ms with 100% precision
  if (GREETING_REGEX.test(trimmed)) {
    return { intent: 'greeting', confidence: 0.99 };
  }
  if (THANKS_OR_ACK_REGEX.test(trimmed)) {
    return { intent: 'thanks_or_ack', confidence: 0.99 };
  }
  if (wantsHuman(trimmed)) {
    return { intent: 'wants_human', confidence: 0.99 };
  }

  // Fast check: clear off-topic
  if (OFF_TOPIC_REGEX.test(trimmed) && !ACCOUNT_ISSUE_KEYWORDS_REGEX.test(trimmed)) {
    return { intent: 'off_topic', confidence: 0.95 };
  }

  // If AI model is configured, run structured classification
  if (isConfigured(providerConfig)) {
    try {
      const prompt = [
        `You are an intent classifier for customer support at ${workspaceName}.`,
        'Classify the customer message into EXACTLY ONE of the following 7 categories:',
        '- greeting: Simple hello/hi/salam with no question or issue.',
        '- thanks_or_ack: Simple thanks or acknowledgement ("thanks", "ok", "got it", "shukriya", "understood", "cool", "great").',
        '- wants_human: Visitor explicitly asking to speak with a human agent, person, or representative.',
        '- account_specific_issue: Visitor mentioning a personal trading account, account number, payout, breach, deposit/withdrawal stuck, or dashboard metrics not updating.',
        '- complaint: Visitor complaining, angry, frustrated, accusing fraud, or dissatisfied with service.',
        '- off_topic: Topics completely unrelated to trading, prop firms, or accounts (e.g., cake recipes, weather, calculus, trivia).',
        '- question: Inquiries about trading rules, challenge pricing, phases, leverage, drawdown limits, platforms, or general FAQs.',
        '',
        'Output strictly valid JSON only with this schema:',
        '{',
        '  "intent": "greeting" | "thanks_or_ack" | "wants_human" | "account_specific_issue" | "complaint" | "off_topic" | "question",',
        '  "confidence": 0.0 to 1.0,',
        '  "account_number": "string" or null,',
        '  "email": "string" or null,',
        '  "complaint_subtype": "account_specific_issue" | "question" | null,',
        '  "issue_summary": "short summary" or null',
        '}',
      ].join('\n');

      const historyContext = recentMessages.slice(-4).map((m) => `${m.role}: ${m.content}`).join('\n');
      const userMessage = historyContext
        ? `Recent conversation:\n${historyContext}\n\nCurrent visitor message: ${trimmed}`
        : `Customer message: ${trimmed}`;

      const res = await chat(providerConfig!, {
        system: prompt,
        messages: [{ role: 'user', content: userMessage }],
        maxTokens: 200,
        temperature: 0,
        reasoning: 'fast',
        timeoutMs: 6000,
      });

      const text = res.text?.trim() || '';
      const opener = text.indexOf('{');
      const closer = text.lastIndexOf('}');
      if (opener !== -1 && closer > opener) {
        const parsed = JSON.parse(text.slice(opener, closer + 1));
        const validIntents: VisitorIntent[] = [
          'greeting',
          'thanks_or_ack',
          'question',
          'wants_human',
          'account_specific_issue',
          'complaint',
          'off_topic',
        ];

        if (validIntents.includes(parsed.intent)) {
          // If regex detected an account number or email that model missed, preserve it
          const fast = classifyVisitorIntentFast(trimmed);
          let finalIntent = parsed.intent;
          let complaintSubtype = parsed.complaint_subtype || fast.complaintSubtype || null;

          // If visitor message expressed strong frustration / complaint words, treat as complaint
          if (finalIntent !== 'complaint' && COMPLAINT_KEYWORDS_REGEX.test(trimmed)) {
            finalIntent = 'complaint';
            complaintSubtype = parsed.intent === 'account_specific_issue' ? 'account_specific_issue' : 'question';
          }

          return {
            intent: finalIntent,
            confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.9,
            accountNumber: parsed.account_number || fast.accountNumber || null,
            email: parsed.email || fast.email || null,
            complaintSubtype,
            issueSummary: parsed.issue_summary || fast.issueSummary || null,
          };
        }
      }
    } catch (err) {
      console.warn('[Intent Classifier] Model classification failed, using deterministic fallback:', err);
    }
  }

  return classifyVisitorIntentFast(trimmed);
}

/**
 * Formats a localized expected reply time message for handovers.
 */
export function getExpectedReplyTimeNotice(langCode: string, isRomanUrdu: boolean): string {
  if (isRomanUrdu) {
    return 'Hamari team aam tor par 10 se 15 minute mein yahan review karke reply karegi.';
  }
  if (langCode === 'hi') {
    return 'हमारी टीम आमतौर पर 10 से 15 मिनट में यहाँ समीक्षा करके उत्तर देगी।';
  }
  if (langCode === 'ur') {
    return 'ہماری سپورٹ ٹیم عام طور پر 10 سے 15 منٹ میں جائزہ لے کر یہاں جواب دے گی۔';
  }
  if (langCode === 'ar') {
    return 'سيقوم فريق الدعم لدينا بمراجعة طلبك والرد عليك هنا، عادة خلال 10 إلى 15 دقيقة.';
  }
  if (langCode === 'es') {
    return 'Nuestro equipo revisará los detalles y te responderá directamente aquí, normalmente en 10-15 minutos.';
  }
  if (langCode === 'fr') {
    return 'Notre équipe examinera les détails et vous répondra directement ici, généralement sous 10 à 15 minutes.';
  }
  return 'A team member will review your details and respond right here, typically within 10–15 minutes.';
}

/**
 * Handles intent-specific responses (greeting, thanks_or_ack, wants_human, account_specific_issue, complaint, off_topic).
 */
export function generateIntentDirectResponse({
  intentResult,
  incomingMessage,
  visitorName,
  workspaceName = 'our team',
}: {
  intentResult: IntentClassificationResult;
  incomingMessage: string;
  visitorName?: string | null;
  workspaceName?: string | null;
}): {
  replyText: string;
  shouldHandover: boolean;
  handoverReason?: string;
  createInternalNote?: string | null;
  setPriorityHigh?: boolean;
} | null {
  const brand = workspaceName?.trim() || 'our team';
  const detected = detectLanguage(incomingMessage);
  const langCode = detected.code;
  const cleanName = cleanVisitorDisplayName(visitorName);
  const isRomanUrdu =
    detected.name === 'Urdu (Roman)' ||
    (langCode === 'ur' && !/[\u0600-\u06FF]/.test(incomingMessage)) ||
    /\b(aap|kya|hai|hain|mein|kaise|shukriya|batao|karein|kar sakta|bataen|chahiye|kitna|hoga|bhai)\b/i.test(
      incomingMessage
    );

  const replyTimeNotice = getExpectedReplyTimeNotice(langCode, isRomanUrdu);

  // 1. GREETING: reply with a short welcome and ask how to help. No handover.
  if (intentResult.intent === 'greeting') {
    const replyText = isRomanUrdu
      ? `Salam${cleanName ? ` ${cleanName}` : ''}! ${brand} mein khushamdeed. Main aaj aap ki kya madad kar sakta hoon?`
      : langCode === 'hi'
      ? `नमस्ते${cleanName ? ` ${cleanName}` : ''}! ${brand} में आपका स्वागत है। मैं आज आपकी क्या सहायता कर सकता हूँ?`
      : langCode === 'ur'
      ? `السلام علیکم${cleanName ? ` ${cleanName}` : ''}! ${brand} میں خوش آمدید۔ بتائیے میں آج آپ کی کیا مدد کر سکتا ہوں؟`
      : langCode === 'ar'
      ? `مرحباً${cleanName ? ` ${cleanName}` : ''}! أهلاً بك في ${brand}. كيف يمكنني مساعدتك اليوم؟`
      : langCode === 'es'
      ? `¡Hola${cleanName ? ` ${cleanName}` : ''}! Bienvenido a ${brand}. ¿En qué te puedo ayudar hoy?`
      : langCode === 'fr'
      ? `Bonjour${cleanName ? ` ${cleanName}` : ''} ! Bienvenue chez ${brand}. Comment puis-je vous aider aujourd'hui ?`
      : `Hello${cleanName ? ` ${cleanName}` : ''}! Welcome to ${brand}. How can I help you today?`;

    return {
      replyText,
      shouldHandover: false,
    };
  }

  // 2. THANKS OR ACK: reply in the visitor's matching language. No handover, do not log gap.
  if (intentResult.intent === 'thanks_or_ack') {
    const replyText = isRomanUrdu
      ? 'Koi baat nahi! Hum aapki madad ke liye hamesha hazir hain.'
      : langCode === 'hi'
      ? 'आपका स्वागत है! हमें आपकी सहायता करके खुशी हुई।'
      : langCode === 'ur'
      ? 'کوئی بات نہیں! ہم آپ کی مدد کے لیے ہمیشہ حاضر ہیں۔'
      : langCode === 'ar'
      ? 'على الرحب والسعة!'
      : langCode === 'es'
      ? '¡De nada! Estamos para ayudarte.'
      : langCode === 'fr'
      ? 'Je vous en prie ! Avec plaisir.'
      : "You're welcome!";

    return {
      replyText,
      shouldHandover: false,
    };
  }

  // 3. WANTS HUMAN: confirm handover to visitor, state expected reply time, notify agents.
  // Must work even after a previous handover.
  if (intentResult.intent === 'wants_human') {
    const replyText = isRomanUrdu
      ? `Maine aapki guftagu hamari support team ko connect kar di hai. ${replyTimeNotice}`
      : langCode === 'hi'
      ? `मैंने आपकी बातचीत हमारी सहायता टीम से जोड़ दी है। ${replyTimeNotice}`
      : langCode === 'ur'
      ? `میں نے آپ کی گفتگو ہماری سپورٹ ٹیم کو منتقل کر دی ہے۔ ${replyTimeNotice}`
      : langCode === 'ar'
      ? `لقد قمت بتحويل محادثتك إلى فريق الدعم لدينا. ${replyTimeNotice}`
      : langCode === 'es'
      ? `Te he comunicado con nuestro equipo de soporte. ${replyTimeNotice}`
      : langCode === 'fr'
      ? `Je vous ai mis en relation avec notre équipe d'assistance. ${replyTimeNotice}`
      : `I've connected you with our support team. ${replyTimeNotice}`;

    const internalNote = [
      '🤖 [Visitor Requested Human Agent]:',
      `- Customer explicitly asked to speak with a human support agent.`,
      `- Customer Message: "${incomingMessage}"`,
    ].join('\n');

    return {
      replyText,
      shouldHandover: true,
      handoverReason: 'Customer explicitly asked to speak with a human agent.',
      createInternalNote: internalNote,
      setPriorityHigh: true,
    };
  }

  // 4. ACCOUNT-SPECIFIC ISSUE: collect account number and email if missing, tell visitor team will check,
  //    create 1 internal note with details, set priority High.
  if (intentResult.intent === 'account_specific_issue') {
    const acc = intentResult.accountNumber;
    const email = intentResult.email;

    const isMissingDetails = !acc || !email;
    let replyText = '';

    if (isMissingDetails) {
      const missingParts: string[] = [];
      if (!acc) missingParts.push(isRomanUrdu ? 'account number' : langCode === 'hi' ? 'खाता संख्या (account number)' : 'account number');
      if (!email) missingParts.push(isRomanUrdu ? 'email' : langCode === 'hi' ? 'ईमेल (email)' : 'email');
      const missingStr = missingParts.join(isRomanUrdu ? ' aur ' : langCode === 'hi' ? ' और ' : ' and ');

      replyText = isRomanUrdu
        ? `Hamari team is issue ko check karegi. Baraye meherbani apna ${missingStr} share kar dein. ${replyTimeNotice}`
        : langCode === 'hi'
        ? `हमारी टीम इस समस्या की जांच करेगी। कृपया अपना ${missingStr} साझा करें। ${replyTimeNotice}`
        : langCode === 'ur'
        ? `ہماری سپورٹ ٹیم اس معاملے کی جانچ کرے گی۔ برائے مہربانی اپنا ${missingStr} فراہم کر دیں۔ ${replyTimeNotice}`
        : langCode === 'ar'
        ? `سيتولى فريقنا التحقق من هذا الأمر. يُرجى تزويدنا بـ ${missingStr}. ${replyTimeNotice}`
        : `Our team will check into this for you. Could you please share your ${missingStr}? ${replyTimeNotice}`;
    } else {
      replyText = isRomanUrdu
        ? `Shukriya! Maine aapke account (#${acc}) ki tafseelat note kar li hain aur team check karegi. ${replyTimeNotice}`
        : langCode === 'hi'
        ? `धन्यवाद! मैंने आपके खाते (#${acc}) का विवरण नोट कर लिया है और हमारी टीम इसकी जांच करेगी। ${replyTimeNotice}`
        : langCode === 'ur'
        ? `شکریہ! میں نے آپ کے اکاؤنٹ (#${acc}) کی تفصیلات درج کر لی ہیں، ہماری ٹیم اس کی جانچ کرے گی۔ ${replyTimeNotice}`
        : langCode === 'ur'
        ? `شکریہ! میں نے آپ کے اکاؤنٹ (#${acc}) کی تفصیلات درج کر لی ہیں، ہماری ٹیم اس کی جانچ کرے گی۔ ${replyTimeNotice}`
        : langCode === 'ar'
        ? `شكراً لك! لقد سجلت تفاصيل حسابك (#${acc}) وسيقوم فريقنا بالتحقق من ذلك. ${replyTimeNotice}`
        : `Thank you! I've noted your details for account #${acc} and our team will check into this for you. ${replyTimeNotice}`;
    }

    const internalNote = [
      '🤖 [Account-Specific Issue Escalated]:',
      `- Issue Summary: ${intentResult.issueSummary || incomingMessage}`,
      `- Account Number: ${acc || 'Missing (requested from visitor)'}`,
      `- Email Address: ${email || 'Missing (requested from visitor)'}`,
      `- Customer Message: "${incomingMessage}"`,
    ].join('\n');

    return {
      replyText,
      shouldHandover: true,
      handoverReason: `Account-specific issue: ${intentResult.issueSummary || 'Account/payout/breach issue'}`,
      createInternalNote: internalNote,
      setPriorityHigh: true,
    };
  }

  // 5. COMPLAINT: apologise in one sentence, then treat as account_specific_issue or question.
  if (intentResult.intent === 'complaint') {
    const apology = isRomanUrdu
      ? 'Hamein is pareshani par nihayat afsos hai.'
      : langCode === 'ur'
      ? 'ہمیں آپ کو پیش آنے والی اس پریشانی پر دلی افسوس ہے۔'
      : langCode === 'ar'
      ? 'نعتذر بشدة عن أي إزعاج.'
      : langCode === 'es'
      ? 'Lamentamos sinceramente los inconvenientes causados.'
      : langCode === 'fr'
      ? 'Nous sommes sincèrement désolés pour la gêne occasionnée.'
      : 'I am truly sorry for the frustration and inconvenience this has caused you.';

    // If complaint is account-specific (payout, breach, dashboard, login, deposit)
    if (intentResult.complaintSubtype === 'account_specific_issue' || intentResult.accountNumber) {
      const acc = intentResult.accountNumber;
      const email = intentResult.email;
      const isMissingDetails = !acc || !email;

      let followUp = '';
      if (isMissingDetails) {
        followUp = isRomanUrdu
          ? `Hamari team iski fori investigation karegi. Baraye meherbani apna account number aur email share kar dein. ${replyTimeNotice}`
          : langCode === 'ur'
          ? `ہماری ٹیم اس کی فوری جانچ کرے گی۔ برائے مہربانی اپنا اکاؤنٹ نمبر اور ای میل فراہم کریں۔ ${replyTimeNotice}`
          : `Our team will check into this for you. Could you please share your account number and email? ${replyTimeNotice}`;
      } else {
        followUp = isRomanUrdu
          ? `Hamari team aapke account (#${acc}) ko fori check karegi. ${replyTimeNotice}`
          : `Our team will check into account #${acc} for you immediately. ${replyTimeNotice}`;
      }

      const internalNote = [
        '🚨 [Customer Complaint Escalated - High Priority]:',
        `- Complaint Summary: ${intentResult.issueSummary || incomingMessage}`,
        `- Account Number: ${acc || 'Missing (requested from customer)'}`,
        `- Email Address: ${email || 'Missing (requested from customer)'}`,
        `- Customer Message: "${incomingMessage}"`,
      ].join('\n');

      return {
        replyText: `${apology} ${followUp}`,
        shouldHandover: true,
        handoverReason: `Customer complaint escalated: ${intentResult.issueSummary || 'Customer dissatisfaction'}`,
        createInternalNote: internalNote,
        setPriorityHigh: true,
      };
    }

    // If complaint is a question, return null so it falls through to retrieval
    return null;
  }

  // 6. OFF-TOPIC: say you can only help with <workspace name> questions. No handover.
  if (intentResult.intent === 'off_topic') {
    const replyText = isRomanUrdu
      ? `Main sirf ${brand} ke sawalaat mein aapki madad kar sakta hoon.`
      : langCode === 'ur'
      ? `میں صرف ${brand} کے سوالات میں آپ کی مدد کر سکتا ہوں۔`
      : langCode === 'ar'
      ? `يمكنني فقط المساعدة في أسئلة ${brand}.`
      : langCode === 'es'
      ? `Solo puedo ayudarte con preguntas sobre ${brand}.`
      : langCode === 'fr'
      ? `Je peux uniquement vous aider avec les questions concernant ${brand}.`
      : `I can only help with ${brand} questions.`;

    return {
      replyText,
      shouldHandover: false,
    };
  }

  // 7. QUESTION: Fall through to semantic retrieval and composed answer
  return null;
}

