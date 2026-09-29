/**
 * Real-time bidirectional translation engine for customer support.
 *
 * Capabilities:
 * 1. Automatic language detection (Urdu, Arabic, Spanish, French, German, Hindi, Roman Urdu, etc.)
 * 2. Translates customer native messages to clear English for support agents in the dashboard
 * 3. Translates agent English replies into the customer's native language with polite, human support tone
 */

import { chat, isConfigured, ProviderConfig } from './provider';

export interface LanguageInfo {
  code: string;
  name: string;
  isRtl?: boolean;
}

export const SUPPORTED_LANGUAGES: Record<string, LanguageInfo> = {
  en: { code: 'en', name: 'English' },
  ur: { code: 'ur', name: 'Urdu', isRtl: true },
  ar: { code: 'ar', name: 'Arabic', isRtl: true },
  es: { code: 'es', name: 'Spanish' },
  fr: { code: 'fr', name: 'French' },
  de: { code: 'de', name: 'German' },
  hi: { code: 'hi', name: 'Hindi' },
  tr: { code: 'tr', name: 'Turkish' },
  ru: { code: 'ru', name: 'Russian' },
  zh: { code: 'zh', name: 'Chinese' },
  pt: { code: 'pt', name: 'Portuguese' },
  it: { code: 'it', name: 'Italian' },
  id: { code: 'id', name: 'Indonesian' },
  fa: { code: 'fa', name: 'Persian', isRtl: true },
  bn: { code: 'bn', name: 'Bengali' },
};

/**
 * Detects the language of a customer message.
 */
export function detectLanguage(text: string): { code: string; name: string } {
  if (!text || !text.trim()) return { code: 'en', name: 'English' };
  const trimmed = text.trim();

  // Arabic / Urdu script detection
  // Urdu typically contains specific letters: ٹ, ڈ, ڑ, ں, ے, ھ, چ, پ, گ or common words
  if (/[\u0600-\u06FF]/.test(trimmed)) {
    if (/[ٹڈڑںےھچپگ]/.test(trimmed) || /\b(کیا|ہیں|ہے|نہیں|آپ|کیوں|کیسے|سلام|شکریہ|معلومات|ضرورت|چاہیے|قیمت)\b/.test(trimmed)) {
      return { code: 'ur', name: 'Urdu' };
    }
    // Persian specific: گچپژ
    if (/[گچپژ]/.test(trimmed)) {
      return { code: 'fa', name: 'Persian' };
    }
    return { code: 'ar', name: 'Arabic' };
  }

  // Devanagari script (Hindi / Marathi)
  if (/[\u0900-\u097F]/.test(trimmed)) {
    return { code: 'hi', name: 'Hindi' };
  }

  // Cyrillic (Russian / Ukrainian)
  if (/[\u0400-\u04FF]/.test(trimmed)) {
    return { code: 'ru', name: 'Russian' };
  }

  // Chinese script
  if (/[\u4e00-\u9fa5]/.test(trimmed)) {
    return { code: 'zh', name: 'Chinese' };
  }

  // Bengali script
  if (/[\u0980-\u09FF]/.test(trimmed)) {
    return { code: 'bn', name: 'Bengali' };
  }

  // Roman Urdu / Hindi patterns (Latin script)
  const lower = trimmed.toLowerCase();
  const romanUrduWords = /\b(kya|kaise|kaisay|apka|aapka|apki|aapki|mera|meri|mujhe|chahiye|shukriya|shukria|theek|hai|hain|nahi|nahin|hoga|hogi|batao|bataen|bataiye|kitna|kitni|price|rate|kese|acha|salam|assalam|walekum)\b/i;
  if (romanUrduWords.test(lower)) {
    return { code: 'ur', name: 'Urdu (Roman)' };
  }

  // Spanish patterns
  if (/\b(hola|por favor|gracias|buenos|dias|noches|cuanto|cuesta|precio|ayuda|necesito|quiero|donde|cuando)\b/i.test(lower) || /[¿¡áéíóúñ]/.test(lower)) {
    return { code: 'es', name: 'Spanish' };
  }

  // French patterns
  if (/\b(bonjour|bonsoir|merci|combien|coute|prix|aide|besoin|ou|quand|comment|salut)\b/i.test(lower) || /[éàèùâêîôûçëïüœ]/.test(lower)) {
    return { code: 'fr', name: 'French' };
  }

  // German patterns
  if (/\b(hallo|guten|morgen|tag|danke|bitte|wieviel|kostet|preis|hilfe|brauche|wo|wann|wie)\b/i.test(lower) || /[äöüß]/.test(lower)) {
    return { code: 'de', name: 'German' };
  }

  // Turkish patterns
  if (/\b(merhaba|selam|nasil|nasilsiniz|fiyat|ucret|yardim|tesekkur|tesekkür|lutfen|lütfen)\b/i.test(lower) || /[çğıöşü]/.test(lower)) {
    return { code: 'tr', name: 'Turkish' };
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
}): Promise<{ englishText: string; sourceLanguage: string }> {
  if (!text || !text.trim()) {
    return { englishText: text, sourceLanguage: 'en' };
  }

  const detection = detectedLanguage
    ? { code: detectedLanguage, name: SUPPORTED_LANGUAGES[detectedLanguage]?.name || detectedLanguage }
    : detectLanguage(text);

  // If already English, no translation needed
  if (detection.code === 'en') {
    return { englishText: text, sourceLanguage: 'en' };
  }

  // If an AI provider is configured, use it for best contextual translation
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
        return { englishText: translated, sourceLanguage: detection.name };
      }
    } catch (err) {
      console.warn('[translateToEnglish] Provider error, falling back:', err);
    }
  }

  // Fallback: If no provider or provider failed, return original with detected language
  return { englishText: text, sourceLanguage: detection.name };
}

/**
 * Translates support agent English response into customer's native language.
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
}): Promise<{ translatedText: string; targetLanguage: string }> {
  if (!englishText || !englishText.trim()) {
    return { translatedText: englishText, targetLanguage: targetLanguageCode };
  }

  const targetLang = SUPPORTED_LANGUAGES[targetLanguageCode]?.name || targetLanguageCode;

  // If target is English, no translation needed
  if (targetLanguageCode === 'en' || targetLang.toLowerCase() === 'english') {
    return { translatedText: englishText, targetLanguage: 'English' };
  }

  // If Roman Urdu was detected, translate to natural Urdu (standard script or Roman Urdu)
  const isRomanUrdu = targetLanguageCode === 'ur' && targetLang.includes('Roman');
  const targetSpec = isRomanUrdu
    ? 'Roman Urdu (Urdu written in English Latin alphabet, polite, natural, commonly used in chat, e.g. "Aap ka bohot shukriya, hum aap ki poori madad karen gay")'
    : targetLang;

  if (isConfigured(providerConfig)) {
    try {
      const brandContext = businessName ? ` representing ${businessName}` : '';
      const res = await chat(providerConfig!, {
        system:
          `You are a professional customer support translator${brandContext}.\n` +
          `Translate the following English response from a support agent into fluent, natural, polite ${targetSpec}.\n` +
          `The tone must be genuinely warm, helpful, respectful, and human (like a real support team member talking to a customer).\n` +
          `Keep any technical terms, URLs, numbers, email addresses, and names untouched.\n` +
          `Output ONLY the final translation, without any preamble, surrounding quotes, or explanations.`,
        messages: [{ role: 'user', content: englishText }],
        maxTokens: 800,
        temperature: 0.1,
        reasoning: 'fast',
        timeoutMs: 8000,
      });

      const translated = res.text?.trim();
      if (translated) {
        return { translatedText: translated, targetLanguage: targetLang };
      }
    } catch (err) {
      console.warn('[translateFromEnglish] Provider error, falling back:', err);
    }
  }

  // Fallback: If translation model could not translate, deliver english text safely
  return { translatedText: englishText, targetLanguage: targetLang };
}
