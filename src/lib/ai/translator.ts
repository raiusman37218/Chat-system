/**
 * Real-time bidirectional translation engine for customer support.
 *
 * Capabilities:
 * 1. Automatic language detection (Arabic, Hindi, Urdu, Spanish, French, German, Russian, Chinese, etc.)
 * 2. Translates customer foreign messages into clear English for support agents in the dashboard
 * 3. Translates agent English replies into the customer's native language with polite, human support tone
 * 4. Dual-layer engine: Uses configured LLM (OpenAI, Gemini, Anthropic, DeepSeek) with zero-config free translation fallback
 */

import { chat, isConfigured, ProviderConfig } from './provider';

export interface LanguageInfo {
  code: string;
  name: string;
  nativeName?: string;
  flag?: string;
  isRtl?: boolean;
}

export const SUPPORTED_LANGUAGES: Record<string, LanguageInfo> = {
  en: { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  ar: { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', isRtl: true },
  hi: { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  ur: { code: 'ur', name: 'Urdu', nativeName: 'اردو', flag: '🇵🇰', isRtl: true },
  es: { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  fr: { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  de: { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  tr: { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
  ru: { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  zh: { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  pt: { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
  it: { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  id: { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩' },
  fa: { code: 'fa', name: 'Persian', nativeName: 'فارسی', flag: '🇮🇷', isRtl: true },
  he: { code: 'he', name: 'Hebrew', nativeName: 'עברית', flag: '🇮🇱', isRtl: true },
  bn: { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇧🇩' },
  pa: { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
  ta: { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
  te: { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' },
  mr: { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳' },
  gu: { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳' },
  ja: { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  ko: { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  th: { code: 'th', name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭' },
  vi: { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳' },
  el: { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', flag: '🇬🇷' },
  nl: { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱' },
  pl: { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱' },
  sv: { code: 'sv', name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪' },
  uk: { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', flag: '🇺🇦' },
  ro: { code: 'ro', name: 'Romanian', nativeName: 'Română', flag: '🇷🇴' },
  ms: { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', flag: '🇲🇾' },
  tl: { code: 'tl', name: 'Tagalog', nativeName: 'Tagalog', flag: '🇵🇭' },
  cs: { code: 'cs', name: 'Czech', nativeName: 'Čeština', flag: '🇨🇿' },
  hu: { code: 'hu', name: 'Hungarian', nativeName: 'Magyar', flag: '🇭🇺' },
};

export function getLanguageInfo(code: string): LanguageInfo {
  const normalized = (code || 'en').toLowerCase().trim();
  return SUPPORTED_LANGUAGES[normalized] || {
    code: normalized,
    name: normalized.toUpperCase(),
  };
}

export function isLanguageRtl(code: string): boolean {
  return Boolean(SUPPORTED_LANGUAGES[code?.toLowerCase()]?.isRtl);
}

/**
 * Clean HTML entities commonly returned by web translation APIs.
 */
export function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)));
}

/**
 * Free translation fallback via MyMemory with zero API keys required.
 */
export async function translateViaFreeApi(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string | null> {
  if (!text || !text.trim()) return text;
  const s = sourceLang === 'en' ? 'en' : (sourceLang || 'auto');
  const t = targetLang || 'en';
  if (s === t) return text;

  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.trim())}&langpair=${encodeURIComponent(s)}|${encodeURIComponent(t)}`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(6000),
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const candidate = data?.responseData?.translatedText;
    if (candidate && typeof candidate === 'string' && candidate.trim()) {
      if (candidate.startsWith('MYMEMORY WARNING:')) {
        return null;
      }
      return decodeHtmlEntities(candidate.trim());
    }
  } catch (err) {
    console.warn('[translateViaFreeApi] Translation fetch failed:', err);
  }
  return null;
}

/**
 * Detects the language of a customer message.
 */
export function detectLanguage(text: string): { code: string; name: string } {
  if (!text || !text.trim()) return { code: 'en', name: 'English' };
  const trimmed = text.trim();

  // Arabic / Urdu / Persian script detection
  if (/[\u0600-\u06FF]/.test(trimmed)) {
    // Urdu-specific letters or common words
    if (
      /[ٹڈڑںےھچپگ]/.test(trimmed) ||
      /\b(کیا|ہیں|ہے|نہیں|آپ|کیوں|کیسے|سلام|شکریہ|معلومات|ضرورت|چاہیے|قیمت)\b/.test(trimmed)
    ) {
      return { code: 'ur', name: 'Urdu' };
    }
    // Persian specific: گچپژ
    if (/[گچپژ]/.test(trimmed)) {
      return { code: 'fa', name: 'Persian' };
    }
    return { code: 'ar', name: 'Arabic' };
  }

  // Hebrew script
  if (/[\u0590-\u05FF]/.test(trimmed)) {
    return { code: 'he', name: 'Hebrew' };
  }

  // Devanagari script (Hindi / Marathi)
  if (/[\u0900-\u097F]/.test(trimmed)) {
    return { code: 'hi', name: 'Hindi' };
  }

  // Bengali script
  if (/[\u0980-\u09FF]/.test(trimmed)) {
    return { code: 'bn', name: 'Bengali' };
  }

  // Gurmukhi script (Punjabi)
  if (/[\u0A00-\u0A7F]/.test(trimmed)) {
    return { code: 'pa', name: 'Punjabi' };
  }

  // Gujarati script
  if (/[\u0A80-\u0AFF]/.test(trimmed)) {
    return { code: 'gu', name: 'Gujarati' };
  }

  // Tamil script
  if (/[\u0B80-\u0BFF]/.test(trimmed)) {
    return { code: 'ta', name: 'Tamil' };
  }

  // Telugu script
  if (/[\u0C00-\u0C7F]/.test(trimmed)) {
    return { code: 'te', name: 'Telugu' };
  }

  // Thai script
  if (/[\u0E00-\u0E7F]/.test(trimmed)) {
    return { code: 'th', name: 'Thai' };
  }

  // Greek script
  if (/[\u0370-\u03FF]/.test(trimmed)) {
    return { code: 'el', name: 'Greek' };
  }

  // Japanese (Hiragana / Katakana / Kanji)
  if (/[\u3040-\u30ff]/.test(trimmed)) {
    return { code: 'ja', name: 'Japanese' };
  }

  // Korean (Hangul)
  if (/[\uac00-\ud7af]/.test(trimmed)) {
    return { code: 'ko', name: 'Korean' };
  }

  // Chinese script
  if (/[\u4e00-\u9fa5]/.test(trimmed)) {
    return { code: 'zh', name: 'Chinese' };
  }

  // Cyrillic (Russian / Ukrainian)
  if (/[\u0400-\u04FF]/.test(trimmed)) {
    if (/[іїєґ]/i.test(trimmed)) {
      return { code: 'uk', name: 'Ukrainian' };
    }
    return { code: 'ru', name: 'Russian' };
  }

  // Vietnamese diacritics
  if (/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(trimmed)) {
    return { code: 'vi', name: 'Vietnamese' };
  }

  // Roman Urdu / Hindi patterns (Latin script)
  const lower = trimmed.toLowerCase();
  const romanUrduWords =
    /\b(hum|hm|ham|main|mein|aap|ap|tum|aapko|apko|aapka|apka|aapki|apki|mera|meri|mere|mujhe|mujhko|chahiye|chahye|shukriya|shukria|theek|thik|hai|hain|ho|hoga|hogi|kya|kia|kaise|kese|kaisay|batao|bataen|bataiye|kitna|kitni|kitne|denge|dainge|karenge|krenge|karen|karo|karein|madad|acha|accha|salam|assalam|walekum|nahi|nahin|mat|bhi|aur|kuch|koi|ab|ye|yeh|wo|woh|mil|jayega|jayegi|milega)\b/i;
  if (romanUrduWords.test(lower)) {
    return { code: 'ur', name: 'Urdu (Roman)' };
  }

  // Spanish patterns
  if (
    /\b(hola|por favor|gracias|buenos|dias|noches|cuanto|cuesta|precio|ayuda|ayudar|ayudarle|podemos|puedo|necesito|quiero|donde|cuando|orden|pedido|descuento)\b/i.test(
      lower
    ) ||
    /[¿¡áéíóúñ]/.test(lower)
  ) {
    return { code: 'es', name: 'Spanish' };
  }

  // French patterns
  if (
    /\b(bonjour|bonsoir|merci|combien|coute|prix|aide|aider|pouvons|besoin|ou|quand|comment|salut|commande)\b/i.test(
      lower
    ) ||
    /[éàèùâêîôûçëïüœ]/.test(lower)
  ) {
    return { code: 'fr', name: 'French' };
  }

  // German patterns
  if (
    /\b(hallo|guten|morgen|tag|danke|bitte|wieviel|kostet|preis|hilfe|helfen|können|brauche|wo|wann|wie|bestellung|rabatt)\b/i.test(
      lower
    ) ||
    /[äöüß]/.test(lower)
  ) {
    return { code: 'de', name: 'German' };
  }

  // Turkish patterns
  if (
    /\b(merhaba|selam|nasil|nasilsiniz|fiyat|ucret|yardim|tesekkur|tesekkür|lutfen|lütfen)\b/i.test(
      lower
    ) ||
    /[çğıöşü]/.test(lower)
  ) {
    return { code: 'tr', name: 'Turkish' };
  }

  // Portuguese patterns
  if (
    /\b(ola|olá|obrigado|obrigada|quanto|custa|preco|preço|ajuda|preciso|por favor)\b/i.test(
      lower
    )
  ) {
    return { code: 'pt', name: 'Portuguese' };
  }

  // Italian patterns
  if (
    /\b(ciao|buongiorno|grazie|quanto|costa|prezzo|aiuto|ho bisogno|per favore)\b/i.test(
      lower
    )
  ) {
    return { code: 'it', name: 'Italian' };
  }

  // Indonesian / Malay patterns
  if (
    /\b(selamat|pagi|siang|malam|terima|kasih|berapa|harganya|bisa|bantu|saya|tolong)\b/i.test(
      lower
    )
  ) {
    return { code: 'id', name: 'Indonesian' };
  }

  // Dutch patterns
  if (
    /\b(hallo|goedemorgen|goedenavond|bedankt|alsjeblieft|hoeveel|kost|prijs|hulp|nodig)\b/i.test(
      lower
    )
  ) {
    return { code: 'nl', name: 'Dutch' };
  }

  // Polish patterns
  if (
    /\b(cześć|dzień|dobry|dziękuję|proszę|ile|kosztuje|cena|pomoc)\b/i.test(lower) ||
    /[ąćęłńóśźż]/i.test(lower)
  ) {
    return { code: 'pl', name: 'Polish' };
  }

  // Swedish patterns
  if (
    /\b(hej|tack|snälla|hur|mycket|kostar|pris|hjälp|behöver)\b/i.test(lower) ||
    /[åäö]/i.test(lower)
  ) {
    return { code: 'sv', name: 'Swedish' };
  }

  // Default to English
  return { code: 'en', name: 'English' };
}

/**
 * Translates customer text into English for support agents in the dashboard.
 */
export async function translateToEnglish({
  text,
  detectedLanguage,
  providerConfig,
}: {
  text: string;
  detectedLanguage?: string;
  providerConfig?: ProviderConfig | null;
}): Promise<{ englishText: string; sourceLanguage: string; isOriginalEnglish: boolean }> {
  if (!text || !text.trim()) {
    return { englishText: text, sourceLanguage: 'en', isOriginalEnglish: true };
  }

  const detection = detectedLanguage
    ? {
        code: detectedLanguage,
        name: SUPPORTED_LANGUAGES[detectedLanguage]?.name || detectedLanguage,
      }
    : detectLanguage(text);

  // If already English, no translation needed
  if (detection.code === 'en') {
    return { englishText: text, sourceLanguage: 'English', isOriginalEnglish: true };
  }

  // 1. Try AI provider if configured
  if (isConfigured(providerConfig)) {
    try {
      const res = await chat(providerConfig!, {
        system:
          'You are a professional real-time customer support translator.\n' +
          'Translate the customer message into clear, natural, accurate English so the support agent can easily understand their issue or question.\n' +
          'Preserve all numbers, proper nouns, emails, and links exactly as they are.\n' +
          'Output ONLY the translated English text, without commentary, notes, or quotes.',
        messages: [{ role: 'user', content: text }],
        maxTokens: 500,
        temperature: 0,
        reasoning: 'fast',
        timeoutMs: 6000,
      });

      const translated = res.text?.trim();
      if (translated) {
        return {
          englishText: translated,
          sourceLanguage: detection.name,
          isOriginalEnglish: false,
        };
      }
    } catch (err) {
      console.warn('[translateToEnglish] AI Provider error, falling back to free API:', err);
    }
  }

  // 2. Fallback to free translation engine (MyMemory)
  const freeTranslation = await translateViaFreeApi(text, detection.code, 'en');
  if (freeTranslation) {
    return {
      englishText: freeTranslation,
      sourceLanguage: detection.name,
      isOriginalEnglish: false,
    };
  }

  // 3. Fallback: return original text with detected language
  return { englishText: text, sourceLanguage: detection.name, isOriginalEnglish: false };
}

/**
 * Common Roman Urdu words/phrases mapped to standard Urdu script.
 * Enables zero-config free translation engines to parse Roman Urdu text.
 */
const ROMAN_URDU_DICTIONARY: Record<string, string> = {
  hum: 'ہم',
  hm: 'ہم',
  ham: 'ہم',
  main: 'میں',
  mein: 'میں',
  me: 'میں',
  aap: 'آپ',
  ap: 'آپ',
  tum: 'تم',
  aapki: 'آپ کی',
  apki: 'آپ کی',
  aapka: 'آپ کا',
  apka: 'آپ کا',
  aapko: 'آپ کو',
  apko: 'آپ کو',
  madad: 'مدد',
  help: 'مدد',
  karenge: 'کریں گے',
  krenge: 'کریں گے',
  karengay: 'کریں گے',
  karen: 'کریں',
  karna: 'کرنا',
  denge: 'دیں گے',
  dainge: 'دیں گے',
  den: 'دیں',
  discount: 'رعایت',
  off: 'رعایت',
  mil: 'مل',
  jayega: 'جائے گا',
  jayegi: 'جائے گی',
  milega: 'ملے گا',
  milegi: 'ملے گی',
  shukriya: 'شکریہ',
  shukria: 'شکریہ',
  thanks: 'شکریہ',
  chahiye: 'چاہیے',
  chahye: 'چاہیے',
  theek: 'ٹھیک',
  thik: 'ٹھیک',
  acha: 'اچھا',
  accha: 'اچھا',
  kya: 'کیا',
  kia: 'کیا',
  kaise: 'کیسے',
  kese: 'کیسے',
  kaisay: 'کیسے',
  kitna: 'کتنا',
  kitni: 'کتنی',
  kitne: 'کتنے',
  batao: 'بتائیں',
  bataiye: 'بتائیں',
  bataen: 'بتائیں',
  hai: 'ہے',
  hain: 'ہیں',
  ho: 'ہو',
  hoga: 'ہوگا',
  hogi: 'ہوگی',
  nahi: 'نہیں',
  nahin: 'نہیں',
  mat: 'مت',
  salam: 'السلام علیکم',
  assalam: 'السلام علیکم',
  walekum: 'وعلیکم السلام',
  yes: 'جی ہاں',
  haan: 'ہاں',
  ji: 'جی',
  price: 'قیمت',
  rate: 'قیمت',
  keemat: 'قیمت',
  order: 'آرڈر',
  delivery: 'ڈلیوری',
};

export function romanUrduToUrdu(text: string): string {
  if (!text) return '';
  return text
    .split(/\s+/)
    .map((word) => {
      const clean = word.toLowerCase().replace(/[^a-z]/g, '');
      if (ROMAN_URDU_DICTIONARY[clean]) {
        return word.toLowerCase().replace(clean, ROMAN_URDU_DICTIONARY[clean]);
      }
      return word;
    })
    .join(' ');
}

export interface AgentReplyTranslationResult {
  translatedText: string;
  englishText: string;
  detectedSourceLanguage: string;
  sourceLanguageName: string;
  targetLanguage: string;
  targetLanguageName: string;
  isTranslated: boolean;
}

/**
 * Translates support agent's reply from ANY language (English, Roman Urdu, Urdu, Hindi, Spanish, French, etc.)
 * into the customer's native target language, while also generating/preserving an English version for the agent's dashboard.
 */
export async function translateAgentReply({
  text,
  targetLanguageCode,
  sourceLanguageCode,
  providerConfig,
  businessName,
}: {
  text: string;
  targetLanguageCode: string;
  sourceLanguageCode?: string;
  providerConfig?: ProviderConfig | null;
  businessName?: string;
}): Promise<AgentReplyTranslationResult> {
  if (!text || !text.trim()) {
    const target = targetLanguageCode || 'en';
    return {
      translatedText: text,
      englishText: text,
      detectedSourceLanguage: 'en',
      sourceLanguageName: 'English',
      targetLanguage: target,
      targetLanguageName: getLanguageInfo(target).name,
      isTranslated: false,
    };
  }

  const targetLang = targetLanguageCode || 'ar';
  const targetLangInfo = getLanguageInfo(targetLang);
  const detectedSource = sourceLanguageCode
    ? { code: sourceLanguageCode, name: getLanguageInfo(sourceLanguageCode).name }
    : detectLanguage(text);

  // 1. Try AI provider if configured
  if (isConfigured(providerConfig)) {
    try {
      const brandContext = businessName ? ` representing ${businessName}` : '';
      const res = await chat(providerConfig!, {
        system:
          `You are an expert real-time multilingual customer support translation system${brandContext}.\n` +
          `A support agent wrote a reply to a customer in their preferred language (could be English, Roman Urdu, Urdu, Hindi, Spanish, French, Arabic, German, etc.).\n` +
          `The customer speaks: ${targetLangInfo.name} (language code: "${targetLang}").\n\n` +
          `Your task:\n` +
          `1. "customer_text": Translate the agent's message into natural, polite, respectful, and friendly ${targetLangInfo.name} for the customer. If the agent's text is already in ${targetLangInfo.name}, keep it natural in ${targetLangInfo.name}.\n` +
          `2. "english_text": Translate the agent's message into clear, natural, professional English for the support agent's dashboard. If the agent typed in English, keep it in English.\n` +
          `3. "detected_source_language": The 2-letter ISO code or name of the language the agent wrote in.\n\n` +
          `Important:\n` +
          `- Accurately understand Roman Urdu/Hindi Latin transliterations (e.g. "hum aapko 20% discount denge" -> English: "We will give you a 20% discount", translated to customer language).\n` +
          `- Keep all numbers, prices, URLs, emails, codes, and proper names untouched.\n` +
          `- Respond with ONLY a valid JSON object matching: {"customer_text": "...", "english_text": "...", "detected_source_language": "..."}`,
        messages: [{ role: 'user', content: text }],
        maxTokens: 1000,
        temperature: 0.1,
        reasoning: 'fast',
        timeoutMs: 8000,
      });

      const raw = res.text?.trim() || '';
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.customer_text && parsed.english_text) {
            return {
              translatedText: parsed.customer_text.trim(),
              englishText: parsed.english_text.trim(),
              detectedSourceLanguage: parsed.detected_source_language || detectedSource.code,
              sourceLanguageName: getLanguageInfo(parsed.detected_source_language || detectedSource.code).name,
              targetLanguage: targetLang,
              targetLanguageName: targetLangInfo.name,
              isTranslated: true,
            };
          }
        } catch (_) {}
      }
    } catch (err) {
      console.warn('[translateAgentReply] AI Provider failed, falling back to free engine:', err);
    }
  }

  // 2. Fallback: Free translation engine (MyMemory)
  let englishText = text;
  let sourceForTranslation = text;
  const isRomanUrdu =
    detectedSource.name.includes('Roman') ||
    (detectedSource.code === 'ur' && !/[\u0600-\u06FF]/.test(text));

  if (isRomanUrdu) {
    sourceForTranslation = romanUrduToUrdu(text);
  }

  // Translate to English for agent dashboard if not originally in English
  if (detectedSource.code !== 'en' || isRomanUrdu) {
    const sourceLangForEn = isRomanUrdu ? 'ur' : detectedSource.code;
    const toEn = await translateViaFreeApi(sourceForTranslation, sourceLangForEn, 'en');
    if (toEn) {
      englishText = toEn;
    }
  }

  // Translate to target language for customer
  let customerText = text;
  if (targetLang === detectedSource.code && !isRomanUrdu) {
    customerText = text;
  } else if (targetLang === 'en') {
    customerText = englishText;
  } else {
    // Pivot from englishText to target language for high accuracy
    const fromEnglish = await translateViaFreeApi(englishText, 'en', targetLang);
    if (fromEnglish) {
      customerText = fromEnglish;
    } else {
      const direct = await translateViaFreeApi(sourceForTranslation, detectedSource.code, targetLang);
      if (direct) {
        customerText = direct;
      }
    }
  }

  return {
    translatedText: customerText,
    englishText,
    detectedSourceLanguage: detectedSource.code,
    sourceLanguageName: detectedSource.name,
    targetLanguage: targetLang,
    targetLanguageName: targetLangInfo.name,
    isTranslated: customerText !== text || englishText !== text,
  };
}

/**
 * Translates support agent English response into customer's native language.
 * (Maintained for backward-compatibility)
 */
export async function translateFromEnglish({
  englishText,
  targetLanguageCode,
  providerConfig,
  businessName,
}: {
  englishText: string;
  targetLanguageCode: string;
  providerConfig?: ProviderConfig | null;
  businessName?: string;
}): Promise<{ translatedText: string; targetLanguage: string; isTranslated: boolean }> {
  const res = await translateAgentReply({
    text: englishText,
    targetLanguageCode,
    providerConfig,
    businessName,
  });
  return {
    translatedText: res.translatedText,
    targetLanguage: res.targetLanguage,
    isTranslated: res.isTranslated,
  };
}
