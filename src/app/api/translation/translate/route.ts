import { NextRequest, NextResponse } from 'next/server';
import { serviceClient } from '@/lib/supabase/service';
import { providerConfigFrom } from '@/lib/ai/help-answer';
import {
  detectLanguage,
  translateToEnglish,
  translateFromEnglish,
} from '@/lib/ai/translator';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      text,
      direction, // 'to_english' | 'from_english'
      targetLanguage,
      workspaceId,
    } = body;

    if (!text || !text.trim()) {
      return NextResponse.json({ translatedText: text });
    }

    let providerConfig = null;
    let businessName = '';

    if (workspaceId) {
      const supabase = serviceClient();
      const { data: ws } = await supabase
        .from('workspaces')
        .select('name, ai_settings')
        .eq('id', workspaceId)
        .maybeSingle();

      if (ws) {
        businessName = ws.name || '';
        providerConfig = providerConfigFrom(ws.ai_settings);
      }
    }

    if (direction === 'to_english') {
      const detected = detectLanguage(text);
      const res = await translateToEnglish({
        text,
        detectedLanguage: detected.code,
        providerConfig,
      });

      return NextResponse.json({
        translatedText: res.englishText,
        detectedLanguage: detected.code,
        languageName: res.sourceLanguage,
        isOriginalEnglish: detected.code === 'en',
      });
    }

    if (direction === 'from_english') {
      const res = await translateFromEnglish({
        englishText: text,
        targetLanguageCode: targetLanguage || 'ur',
        providerConfig,
        businessName,
      });

      return NextResponse.json({
        translatedText: res.translatedText,
        targetLanguage: res.targetLanguage,
      });
    }

    return NextResponse.json({ error: 'Invalid direction parameter' }, { status: 400 });
  } catch (error: any) {
    console.error('[Translation API Error]:', error);
    return NextResponse.json({ error: error.message || 'Translation failed' }, { status: 500 });
  }
}
