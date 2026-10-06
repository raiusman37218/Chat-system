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
  af: { code: 'af', name: 'Afrikaans', nativeName: 'Afrikaans', flag: '🇿🇦' },
  ak: { code: 'ak', name: 'Twi', nativeName: 'Twi', flag: '🇬🇭' },
  am: { code: 'am', name: 'Amharic', nativeName: 'አማርኛ', flag: '🇪🇹' },
  ar: { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', isRtl: true },
  as: { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া', flag: '🇮🇳' },
  ay: { code: 'ay', name: 'Aymara', nativeName: 'Aymar', flag: '🇧🇴' },
  az: { code: 'az', name: 'Azerbaijani', nativeName: 'Azərbaycan', flag: '🇦🇿' },
  be: { code: 'be', name: 'Belarusian', nativeName: 'Беларуская', flag: '🇧🇾' },
  bg: { code: 'bg', name: 'Bulgarian', nativeName: 'Български', flag: '🇧🇬' },
  bho: { code: 'bho', name: 'Bhojpuri', nativeName: 'भोजपुरी', flag: '🇮🇳' },
  bm: { code: 'bm', name: 'Bambara', nativeName: 'Bamanankan', flag: '🇲🇱' },
  bn: { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇧🇩' },
  bs: { code: 'bs', name: 'Bosnian', nativeName: 'Bosanski', flag: '🇧🇦' },
  ca: { code: 'ca', name: 'Catalan', nativeName: 'Català', flag: '🇪🇸' },
  ceb: { code: 'ceb', name: 'Cebuano', nativeName: 'Cebuano', flag: '🇵🇭' },
  ckb: { code: 'ckb', name: 'Kurdish (Sorani)', nativeName: 'کوردی', flag: '🇮🇶', isRtl: true },
  co: { code: 'co', name: 'Corsican', nativeName: 'Corsu', flag: '🇫🇷' },
  cs: { code: 'cs', name: 'Czech', nativeName: 'Čeština', flag: '🇨🇿' },
  cy: { code: 'cy', name: 'Welsh', nativeName: 'Cymraeg', flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿' },
  da: { code: 'da', name: 'Danish', nativeName: 'Dansk', flag: '🇩🇰' },
  de: { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  doi: { code: 'doi', name: 'Dogri', nativeName: 'डोगरी', flag: '🇮🇳' },
  dv: { code: 'dv', name: 'Dhivehi', nativeName: 'ދިވެހި', flag: '🇲🇻', isRtl: true },
  ee: { code: 'ee', name: 'Ewe', nativeName: 'Eʋegbe', flag: '🇬🇭' },
  el: { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', flag: '🇬🇷' },
  en: { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  eo: { code: 'eo', name: 'Esperanto', nativeName: 'Esperanto', flag: '🌐' },
  es: { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  et: { code: 'et', name: 'Estonian', nativeName: 'Eesti', flag: '🇪🇪' },
  eu: { code: 'eu', name: 'Basque', nativeName: 'Euskara', flag: '🇪🇸' },
  fa: { code: 'fa', name: 'Persian', nativeName: 'فارسی', flag: '🇮🇷', isRtl: true },
  fi: { code: 'fi', name: 'Finnish', nativeName: 'Suomi', flag: '🇫🇮' },
  fr: { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  fy: { code: 'fy', name: 'Frisian', nativeName: 'Frysk', flag: '🇳🇱' },
  ga: { code: 'ga', name: 'Irish', nativeName: 'Gaeilge', flag: '🇮🇪' },
  gd: { code: 'gd', name: 'Scots Gaelic', nativeName: 'Gàidhlig', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
  gl: { code: 'gl', name: 'Galician', nativeName: 'Galego', flag: '🇪🇸' },
  gn: { code: 'gn', name: 'Guarani', nativeName: 'Avañe\'ẽ', flag: '🇵🇾' },
  gom: { code: 'gom', name: 'Konkani', nativeName: 'कोंकणी', flag: '🇮🇳' },
  gu: { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳' },
  ha: { code: 'ha', name: 'Hausa', nativeName: 'Hausa', flag: '🇳🇬' },
  haw: { code: 'haw', name: 'Hawaiian', nativeName: 'ʻŌlelo Hawaiʻi', flag: '🇺🇸' },
  he: { code: 'he', name: 'Hebrew', nativeName: 'עברית', flag: '🇮🇱', isRtl: true },
  hi: { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  hmn: { code: 'hmn', name: 'Hmong', nativeName: 'Hmoob', flag: '🇱🇦' },
  hr: { code: 'hr', name: 'Croatian', nativeName: 'Hrvatski', flag: '🇭🇷' },
  ht: { code: 'ht', name: 'Haitian Creole', nativeName: 'Kreyòl Ayisyen', flag: '🇭🇹' },
  hu: { code: 'hu', name: 'Hungarian', nativeName: 'Magyar', flag: '🇭🇺' },
  hy: { code: 'hy', name: 'Armenian', nativeName: 'Հայերեն', flag: '🇦🇲' },
  id: { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩' },
  ig: { code: 'ig', name: 'Igbo', nativeName: 'Asụsụ Igbo', flag: '🇳🇬' },
  ilo: { code: 'ilo', name: 'Ilocano', nativeName: 'Ilokano', flag: '🇵🇭' },
  is: { code: 'is', name: 'Icelandic', nativeName: 'Íslenska', flag: '🇮🇸' },
  it: { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  ja: { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  jv: { code: 'jv', name: 'Javanese', nativeName: 'Basa Jawa', flag: '🇮🇩' },
  ka: { code: 'ka', name: 'Georgian', nativeName: 'ქართული', flag: '🇬🇪' },
  kk: { code: 'kk', name: 'Kazakh', nativeName: 'Қазақ', flag: '🇰🇿' },
  km: { code: 'km', name: 'Khmer', nativeName: 'ខ្មែរ', flag: '🇰🇭' },
  kn: { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳' },
  ko: { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  kri: { code: 'kri', name: 'Krio', nativeName: 'Krio', flag: '🇸🇱' },
  ku: { code: 'ku', name: 'Kurdish (Kurmanji)', nativeName: 'Kurdî', flag: '🇹🇷' },
  ky: { code: 'ky', name: 'Kyrgyz', nativeName: 'Кыргызча', flag: '🇰🇬' },
  la: { code: 'la', name: 'Latin', nativeName: 'Latina', flag: '🇻🇦' },
  lb: { code: 'lb', name: 'Luxembourgish', nativeName: 'Lëtzebuergesch', flag: '🇱🇺' },
  lg: { code: 'lg', name: 'Luganda', nativeName: 'Luganda', flag: '🇺🇬' },
  ln: { code: 'ln', name: 'Lingala', nativeName: 'Lingála', flag: '🇨🇩' },
  lo: { code: 'lo', name: 'Lao', nativeName: 'ລາວ', flag: '🇱🇦' },
  lt: { code: 'lt', name: 'Lithuanian', nativeName: 'Lietuvių', flag: '🇱🇹' },
  lus: { code: 'lus', name: 'Mizo', nativeName: 'Mizo ṭawng', flag: '🇮🇳' },
  lv: { code: 'lv', name: 'Latvian', nativeName: 'Latviešu', flag: '🇱🇻' },
  mai: { code: 'mai', name: 'Maithili', nativeName: 'मैथिली', flag: '🇮🇳' },
  mg: { code: 'mg', name: 'Malagasy', nativeName: 'Malagasy', flag: '🇲🇬' },
  mi: { code: 'mi', name: 'Maori', nativeName: 'Te Reo Māori', flag: '🇳🇿' },
  mk: { code: 'mk', name: 'Macedonian', nativeName: 'Македонски', flag: '🇲🇰' },
  ml: { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳' },
  mn: { code: 'mn', name: 'Mongolian', nativeName: 'Монгол', flag: '🇲🇳' },
  'mni-mtei': { code: 'mni-mtei', name: 'Meiteilon (Manipuri)', nativeName: 'ꯃꯩꯇꯩꯂꯣꯟ', flag: '🇮🇳' },
  mr: { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳' },
  ms: { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', flag: '🇲🇾' },
  mt: { code: 'mt', name: 'Maltese', nativeName: 'Malti', flag: '🇲🇹' },
  my: { code: 'my', name: 'Myanmar (Burmese)', nativeName: 'မြန်မာ', flag: '🇲🇲' },
  ne: { code: 'ne', name: 'Nepali', nativeName: 'नेपाली', flag: '🇳🇵' },
  nl: { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱' },
  no: { code: 'no', name: 'Norwegian', nativeName: 'Norsk', flag: '🇳🇴' },
  nso: { code: 'nso', name: 'Sepedi', nativeName: 'Sesotho sa Leboa', flag: '🇿🇦' },
  ny: { code: 'ny', name: 'Chichewa', nativeName: 'Chichewa', flag: '🇲🇼' },
  om: { code: 'om', name: 'Oromo', nativeName: 'Afaan Oromoo', flag: '🇪🇹' },
  or: { code: 'or', name: 'Odia (Oriya)', nativeName: 'ଓଡ଼ିଆ', flag: '🇮🇳' },
  pa: { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
  pl: { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱' },
  ps: { code: 'ps', name: 'Pashto', nativeName: 'پښتو', flag: '🇦🇫', isRtl: true },
  pt: { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
  qu: { code: 'qu', name: 'Quechua', nativeName: 'Runasimi', flag: '🇵🇪' },
  ro: { code: 'ro', name: 'Romanian', nativeName: 'Română', flag: '🇷🇴' },
  ru: { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  rw: { code: 'rw', name: 'Kinyarwanda', nativeName: 'Ikinyarwanda', flag: '🇷🇼' },
  sa: { code: 'sa', name: 'Sanskrit', nativeName: 'संस्कृतम्', flag: '🇮🇳' },
  sd: { code: 'sd', name: 'Sindhi', nativeName: 'سنڌي', flag: '🇵🇰', isRtl: true },
  si: { code: 'si', name: 'Sinhala', nativeName: 'සිංහල', flag: '🇱🇰' },
  sk: { code: 'sk', name: 'Slovak', nativeName: 'Slovenčina', flag: '🇸🇰' },
  sl: { code: 'sl', name: 'Slovenian', nativeName: 'Slovenščina', flag: '🇸🇮' },
  sm: { code: 'sm', name: 'Samoan', nativeName: 'Gagana Sāmoa', flag: '🇼🇸' },
  sn: { code: 'sn', name: 'Shona', nativeName: 'chiShona', flag: '🇿🇼' },
  so: { code: 'so', name: 'Somali', nativeName: 'Soomaali', flag: '🇸🇴' },
  sq: { code: 'sq', name: 'Albanian', nativeName: 'Shqip', flag: '🇦🇱' },
  sr: { code: 'sr', name: 'Serbian', nativeName: 'Српски', flag: '🇷🇸' },
  st: { code: 'st', name: 'Sesotho', nativeName: 'Sesotho', flag: '🇱🇸' },
  su: { code: 'su', name: 'Sundanese', nativeName: 'Basa Sunda', flag: '🇮🇩' },
  sv: { code: 'sv', name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪' },
  sw: { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', flag: '🇰🇪' },
  ta: { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
  te: { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' },
  tg: { code: 'tg', name: 'Tajik', nativeName: 'Тоҷикӣ', flag: '🇹🇯' },
  th: { code: 'th', name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭' },
  ti: { code: 'ti', name: 'Tigrinya', nativeName: 'ትግርኛ', flag: '🇪🇷' },
  tk: { code: 'tk', name: 'Turkmen', nativeName: 'Türkmençe', flag: '🇹🇲' },
  tl: { code: 'tl', name: 'Tagalog (Filipino)', nativeName: 'Tagalog', flag: '🇵🇭' },
  tr: { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
  ts: { code: 'ts', name: 'Tsonga', nativeName: 'Xitsonga', flag: '🇿🇦' },
  tt: { code: 'tt', name: 'Tatar', nativeName: 'Татар', flag: '🇷🇺' },
  ug: { code: 'ug', name: 'Uyghur', nativeName: 'ئۇيغۇرچە', flag: '🇨🇳', isRtl: true },
  uk: { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', flag: '🇺🇦' },
  ur: { code: 'ur', name: 'Urdu', nativeName: 'اردو', flag: '🇵🇰', isRtl: true },
  uz: { code: 'uz', name: 'Uzbek', nativeName: 'Oʻzbek', flag: '🇺🇿' },
  vi: { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳' },
  xh: { code: 'xh', name: 'Xhosa', nativeName: 'isiXhosa', flag: '🇿🇦' },
  yi: { code: 'yi', name: 'Yiddish', nativeName: 'ייִדיש', flag: '🇮🇱', isRtl: true },
  yo: { code: 'yo', name: 'Yoruba', nativeName: 'Èdè Yorùbá', flag: '🇳🇬' },
  zh: { code: 'zh', name: 'Chinese (Simplified)', nativeName: '中文 (简体)', flag: '🇨🇳' },
  'zh-tw': { code: 'zh-tw', name: 'Chinese (Traditional)', nativeName: '中文 (繁體)', flag: '🇹🇼' },
  zu: { code: 'zu', name: 'Zulu', nativeName: 'isiZulu', flag: '🇿🇦' },
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
 * Primary free translation & auto-detection engine via Google Translate GTX API.
 * High-speed, zero API keys required, handles Roman Urdu, Italian, Arabic, Spanish, French, etc.
 */
export async function translateWithGoogleGtx(
  text: string,
  targetLang: string = 'en',
  sourceLang: string = 'auto'
): Promise<{ translated: string; detectedLanguage: string } | null> {
  if (!text || !text.trim()) return null;
  const s = sourceLang || 'auto';
  const t = targetLang || 'en';

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(
      s
    )}&tl=${encodeURIComponent(t)}&dt=t&q=${encodeURIComponent(text.trim())}`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(6000),
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'application/json, text/plain, */*',
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const candidate = data[0]?.map((x: any) => x[0]).filter(Boolean).join('');
    const rawDetected = data[2] || s;
    let detected = (rawDetected || 'en').toLowerCase().split('-')[0];

    // Normalize Roman Urdu detection (Google GTX often flags as hi, id, tl, sw, so, or en)
    if (
      (detected === 'hi' || detected === 'id' || detected === 'tl' || detected === 'sw' || detected === 'so' || detected === 'en') &&
      (ROMAN_URDU_WORDS_REGEX.test(text.toLowerCase()) || /[\u0600-\u06FF]/.test(text))
    ) {
      detected = 'ur';
    }

    // Tagalog false-detection safeguard:
    // Google GTX frequently misclassifies English typos or short informal greetings (e.g. "helow", "helo", "hlo", "hi", "j") as Tagalog ('tl')
    if (detected === 'tl') {
      const TAGALOG_AUTHENTIC_WORDS =
        /\b(kumusta|kamusta|salamat|opo|po|ang|mga|sa|ko|mo|ba|ako|ikaw|siya|ito|iyon|magandang|umaga|hapon|gabi|ano|bakit|paano|kailan|saan|hindi|wala|meron|mayroon|paki|lahat|namin|natin|ninyo|sila|kanila|dito|doon|dyan|gusto|ayaw|puwede|pwede|kailangan|kasi|pero|dahil|para|kung)\b/i;
      const isEnglishGreetingOrShort =
        /^(helow|helo|hello|hlo|hlw|hi|hii|hiii|hey|heyy|ok|okay|k|pls|plz|thanks|thx|yes|no|j)$/i.test(text.trim()) ||
        !TAGALOG_AUTHENTIC_WORDS.test(text);

      if (isEnglishGreetingOrShort) {
        detected = 'en';
      }
    }

    if (candidate && typeof candidate === 'string' && candidate.trim()) {
      let finalTrans = decodeHtmlEntities(candidate.trim());

      // If Roman Urdu text was returned untranslated by Google (e.g. "theek hai" -> "theek hai"):
      if (
        t === 'en' &&
        detected === 'ur' &&
        s !== 'ur' &&
        (finalTrans.toLowerCase() === text.trim().toLowerCase() || ROMAN_URDU_WORDS_REGEX.test(finalTrans))
      ) {
        const urduScript = romanUrduToUrdu(text);
        if (/[\u0600-\u06FF]/.test(urduScript)) {
          try {
            const secondPass = await translateWithGoogleGtx(urduScript, 'en', 'ur');
            if (secondPass?.translated && secondPass.translated.toLowerCase() !== finalTrans.toLowerCase()) {
              finalTrans = secondPass.translated;
            }
          } catch (_) {}
        }
      }

      return {
        translated: finalTrans,
        detectedLanguage: detected,
      };
    }
  } catch (err) {
    console.warn('[translateWithGoogleGtx] fetch error:', err);
  }
  return null;
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
  if (s === t && s !== 'auto') return text;

  // 1. Primary: Google GTX
  const googleRes = await translateWithGoogleGtx(text, t, s);
  if (googleRes?.translated) {
    return googleRes.translated;
  }

  // 2. Secondary: MyMemory fallback
  try {
    const sPair = s === 'auto' ? 'en' : s;
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
      text.trim()
    )}&langpair=${encodeURIComponent(sPair)}|${encodeURIComponent(t)}`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(5000),
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      const candidate = data?.responseData?.translatedText;
      if (
        candidate &&
        typeof candidate === 'string' &&
        candidate.trim() &&
        !candidate.startsWith('MYMEMORY WARNING:')
      ) {
        return decodeHtmlEntities(candidate.trim());
      }
    }
  } catch (err) {
    console.warn('[translateViaFreeApi] Translation fetch failed:', err);
  }
  return null;
}

const ROMAN_URDU_WORDS_REGEX =
  /\b(hum|humein|humay|ham|hamara|hamari|main|mein|me|aap|ap|tum|aapko|apko|aapka|apka|aapki|apki|mera|meri|mere|mujhe|mujhko|mujhy|chahiye|chahye|chahie|shukriya|shukria|theek|thik|hai|hain|hoga|hogi|kya|kia|kaise|kese|kaisay|batao|bataen|bataiye|kitna|kitni|kitne|denge|dainge|karenge|krenge|karen|karo|karein|madad|acha|accha|salam|assalam|walekum|alaikum|nahi|nahin|bhi|kuch|koi|yeh|woh|mil|jayega|jayegi|milega|bhai|bhaia|bhaiya|bro|kab|kahan|kaha|kidhar|kidhr|kyun|kyu|bolo|bolen|bata|sun|suno|yar|yaar|kro|krna|karna|kr|raha|rahi|rahe|mila|miley|mile|lena|lo|lelo|dena|dedo|dein|pohncha|pohnchega|paisa|paise|rupay|rupee|rate|shuru|khatam|pehle|baad|abhi|wapas|return|kharidna|masla|rabta|rabtah|tasweer|cheez|waghera)\b/i;

const ROMAN_HINDI_WORDS_REGEX =
  /\b(namaste|namaskar|dhanyawad|dhanyavad|kripya|kripaya|kaise ho|kaisi ho|theek hu|theek hoon|pranam|shubh|puchna|pucho)\b/i;

/**
 * Normalizes detected language codes with high accuracy for Urdu, Hindi, English, etc.
 */
export function normalizeDetectedLanguage(code: string, text: string): string {
  const c = (code || '').toLowerCase().split('-')[0];
  const hasDevanagari = /[\u0900-\u097F]/.test(text || '');
  const isRomanHindi = ROMAN_HINDI_WORDS_REGEX.test(text || '');
  if (hasDevanagari || isRomanHindi) {
    return 'hi';
  }

  const isRomanUrdu = ROMAN_URDU_WORDS_REGEX.test(text || '');
  const hasArabicUrduScript = /[\u0600-\u06FF]/.test(text || '');
  if (isRomanUrdu || hasArabicUrduScript) {
    return 'ur';
  }

  if (c === 'hi') {
    return hasDevanagari || isRomanHindi ? 'hi' : 'ur';
  }
  return c || 'en';
}

/**
 * Detects the language of a customer message.
 */
export function detectLanguage(text: string): { code: string; name: string } {
  if (!text || !text.trim()) return { code: 'en', name: 'English' };
  const trimmed = text.trim();

  // Fast-track common English greetings, single letters, and typos
  if (
    /^(helow|helo|hello|hlo|hlw|hi|hii|hiii|hey|heyy|ok|okay|k|yes|yeah|yup|no|nope|pls|plz|thanks|thank\s+you|thx|ty|welcome|good\s+morning|good\s+afternoon|good\s+evening|good\s+night|tc|gm|gn|[a-z])$/i.test(
      trimmed
    )
  ) {
    return { code: 'en', name: 'English' };
  }

  // Fast-track Hindi / Urdu greetings
  if (/^(namaste|namaskar|pranam)$/i.test(trimmed)) {
    return { code: 'hi', name: 'Hindi' };
  }
  if (/^(salam|assalam|assalamu\s+alaikum|walekum\s+assalam)$/i.test(trimmed)) {
    return { code: 'ur', name: 'Urdu (Roman)' };
  }

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

  const lower = trimmed.toLowerCase();

  // Italian patterns (check before Roman Urdu to avoid collisions like 'ho', 'carta', etc.)
  if (
    /\b(ciao|buongiorno|buonasera|grazie|mille|quanto|costa|prezzo|aiuto|carta|pagamento|sconto|adesso|posso|effettuare|domani|mattina|ricarico|codice|disponibile|per favore|come|avrò|oppure|faccio|risulta)\b/i.test(
      lower
    )
  ) {
    return { code: 'it', name: 'Italian' };
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

  // Roman Hindi patterns (Latin script)
  if (ROMAN_HINDI_WORDS_REGEX.test(lower)) {
    return { code: 'hi', name: 'Hindi' };
  }

  // Roman Urdu / Hindi patterns (Latin script)
  if (ROMAN_URDU_WORDS_REGEX.test(lower)) {
    return { code: 'ur', name: 'Urdu (Roman)' };
  }

  // Default to English
  return { code: 'en', name: 'English' };
}

/**
 * Translates customer text into English for support agents in the dashboard.
 * Auto-detects foreign languages (including Italian, Arabic, Urdu, Spanish, etc.) and guarantees English output.
 */
export async function translateToEnglish({
  text,
  detectedLanguage,
  providerConfig,
}: {
  text: string;
  detectedLanguage?: string;
  providerConfig?: ProviderConfig | null;
}): Promise<{
  englishText: string;
  sourceLanguage: string;
  detectedLanguageCode: string;
  isOriginalEnglish: boolean;
}> {
  if (!text || !text.trim()) {
    return {
      englishText: text || '',
      sourceLanguage: 'English',
      detectedLanguageCode: 'en',
      isOriginalEnglish: true,
    };
  }

  const trimmed = text.trim();

  // If text has only numbers, punctuation, or emojis (e.g. "5000", "???")
  if (!/[a-zA-Z\u00C0-\uFFFF]/.test(trimmed)) {
    return {
      englishText: trimmed,
      sourceLanguage: 'English',
      detectedLanguageCode: 'en',
      isOriginalEnglish: true,
    };
  }

  // 1. Try AI provider if configured in workspace
  if (isConfigured(providerConfig)) {
    try {
      const res = await chat(providerConfig!, {
        system:
          'You are a professional real-time customer support translator.\n' +
          'Translate the customer message into clear, natural, accurate English so the support agent can easily understand their issue or question.\n' +
          'Preserve all numbers, proper nouns, emails, and links exactly as they are.\n' +
          'Respond with ONLY a JSON object: {"english_text": "...", "detected_language": "2-letter ISO code", "is_original_english": boolean}',
        messages: [{ role: 'user', content: trimmed }],
        maxTokens: 500,
        temperature: 0,
        reasoning: 'fast',
        timeoutMs: 6000,
      });

      const raw = res.text?.trim() || '';
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.english_text) {
          const code = normalizeDetectedLanguage(parsed.detected_language || 'en', trimmed);
          const langInfo = getLanguageInfo(code);
          return {
            englishText: parsed.english_text.trim(),
            sourceLanguage: langInfo.name,
            detectedLanguageCode: code,
            isOriginalEnglish: Boolean(parsed.is_original_english || (code === 'en' && parsed.english_text.trim() === trimmed)),
          };
        }
      }
    } catch (err) {
      console.warn('[translateToEnglish] AI Provider error, falling back to Google engine:', err);
    }
  }

  // 2. High-speed Google GTX translation & language auto-detection
  const googleRes = await translateWithGoogleGtx(trimmed, 'en', detectedLanguage || 'auto');
  if (googleRes) {
    const code = normalizeDetectedLanguage(googleRes.detectedLanguage || 'en', trimmed);
    const langInfo = getLanguageInfo(code);
    const isNonEnglish = code !== 'en';

    return {
      englishText: googleRes.translated,
      sourceLanguage: langInfo.name,
      detectedLanguageCode: code,
      isOriginalEnglish: !isNonEnglish,
    };
  }

  // 3. Fallback: MyMemory
  const heuristic = detectedLanguage
    ? { code: detectedLanguage, name: getLanguageInfo(detectedLanguage).name }
    : detectLanguage(trimmed);

  if (heuristic.code !== 'en') {
    const freeTranslation = await translateViaFreeApi(trimmed, heuristic.code, 'en');
    if (freeTranslation) {
      return {
        englishText: freeTranslation,
        sourceLanguage: heuristic.name,
        detectedLanguageCode: heuristic.code,
        isOriginalEnglish: false,
      };
    }
  }

  return {
    englishText: trimmed,
    sourceLanguage: heuristic.name,
    detectedLanguageCode: heuristic.code,
    isOriginalEnglish: heuristic.code === 'en',
  };
}

/**
 * Common Roman Urdu words/phrases mapped to standard Urdu script.
 * Enables zero-config free translation engines to parse Roman Urdu text.
 */
const ROMAN_URDU_DICTIONARY: Record<string, string> = {
  hum: 'ہم',
  hm: 'ہم',
  ham: 'ہم',
  humein: 'ہمیں',
  humay: 'ہمیں',
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
  karo: 'کریں',
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
  chahie: 'چاہیے',
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
  bhai: 'بھائی',
  bhaia: 'بھائی',
  bhaiya: 'بھائی',
  bro: 'بھائی',
  kab: 'کب',
  kahan: 'کہاں',
  kidhar: 'کدھر',
  kyun: 'کیوں',
  kyu: 'کیوں',
  yar: 'یار',
  yaar: 'یار',
  bolo: 'بولیں',
  bolen: 'بولیں',
  bata: 'بتائیں',
  sun: 'سنیں',
  suno: 'سنیں',
  krna: 'کرنا',
  kro: 'کریں',
  kr: 'کر',
  raha: 'رہا',
  rahi: 'رہی',
  rahe: 'رہے',
  mila: 'ملا',
  mile: 'ملے',
  miley: 'ملے',
  lena: 'لینا',
  lo: 'لیں',
  lelo: 'لیں',
  dena: 'دینا',
  dedo: 'دیں',
  dein: 'دیں',
  pohncha: 'پہنچا',
  pohnchega: 'پہنچے گا',
  paisa: 'پیسہ',
  paise: 'پیسے',
  rupay: 'روپے',
  rupee: 'روپے',
  rs: 'روپے',
  alaikum: 'وعلیکم السلام',
  wapas: 'واپس',
  kharidna: 'خریدنا',
  masla: 'مسئلہ',
  rabta: 'رابطہ',
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

  const targetLang = targetLanguageCode || 'en';
  const targetLangInfo = getLanguageInfo(targetLang);

  // 1. Try AI provider if configured in workspace
  if (isConfigured(providerConfig)) {
    try {
      const brandContext = businessName ? ` representing ${businessName}` : '';
      const res = await chat(providerConfig!, {
        system:
          `You are an expert real-time multilingual customer support translation system${brandContext}.\n` +
          `A support agent wrote a reply to a customer in their preferred language (could be English, Roman Urdu, Urdu, Hindi, Spanish, French, Arabic, German, etc.).\n` +
          `The customer speaks: ${targetLangInfo.name} (language code: "${targetLang}").\n\n` +
          `Your task:\n` +
          `1. "customer_text": Translate the agent's message into natural, polite, respectful, and friendly ${targetLangInfo.name} for the customer. If target is English, provide clear English.\n` +
          `2. "english_text": Translate the agent's message into clear, natural, professional English for the support agent's dashboard. If the agent typed in English, keep it in English.\n` +
          `3. "detected_source_language": The 2-letter ISO code of the language the agent wrote in.\n\n` +
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
            const detectedCode = parsed.detected_source_language || 'en';
            return {
              translatedText: parsed.customer_text.trim(),
              englishText: parsed.english_text.trim(),
              detectedSourceLanguage: detectedCode,
              sourceLanguageName: getLanguageInfo(detectedCode).name,
              targetLanguage: targetLang,
              targetLanguageName: targetLangInfo.name,
              isTranslated: true,
            };
          }
        } catch (_) {}
      }
    } catch (err) {
      console.warn('[translateAgentReply] AI Provider failed, falling back to Google engine:', err);
    }
  }

  // 2. High-speed Google GTX translation engine
  // Step 2a: Generate English translation for dashboard
  let englishText = text;
  let detectedSourceLang = sourceLanguageCode || 'en';

  const enRes = await translateWithGoogleGtx(text, 'en', sourceLanguageCode || 'auto');
  if (enRes) {
    englishText = enRes.translated;
    detectedSourceLang = enRes.detectedLanguage || 'en';
  } else {
    // Fallback: Check if Roman Urdu
    const isRoman = ROMAN_URDU_WORDS_REGEX.test(text.toLowerCase());
    if (isRoman) {
      const urduScript = romanUrduToUrdu(text);
      const toEn = await translateViaFreeApi(urduScript, 'ur', 'en');
      if (toEn) englishText = toEn;
      detectedSourceLang = 'ur';
    }
  }

  // Step 2b: Translate to customer's target language
  let customerText = text;
  if (targetLang === 'en') {
    customerText = englishText;
  } else if (targetLang === detectedSourceLang) {
    customerText = text;
  } else {
    // Pivot from englishText to customer's target language for maximum accuracy
    const targetRes = await translateWithGoogleGtx(englishText, targetLang, 'en');
    if (targetRes?.translated) {
      customerText = targetRes.translated;
    } else {
      const direct = await translateViaFreeApi(text, detectedSourceLang, targetLang);
      if (direct) customerText = direct;
    }
  }

  const isActuallyTranslated =
    targetLang === 'en'
      ? englishText.trim().toLowerCase() !== text.trim().toLowerCase()
      : customerText.trim().toLowerCase() !== text.trim().toLowerCase();

  return {
    translatedText: customerText,
    englishText,
    detectedSourceLanguage: detectedSourceLang,
    sourceLanguageName: getLanguageInfo(detectedSourceLang).name,
    targetLanguage: targetLang,
    targetLanguageName: targetLangInfo.name,
    isTranslated: isActuallyTranslated,
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

