import { NextRequest, NextResponse } from 'next/server';
import { serviceClient } from '@/lib/supabase/service';
import { providerConfigFrom } from '@/lib/ai/help-answer';
import {
  detectLanguage,
  translateToEnglish,
} from '@/lib/ai/translator';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      messageId,
      conversationId,
      text,
      workspaceId,
    } = body;

    if (!messageId && !text) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400, headers: CORS_HEADERS });
    }

    const messageText = (text || '').trim();
    if (!messageText) {
      return NextResponse.json({ skipped: true, reason: 'Empty text' }, { headers: CORS_HEADERS });
    }

    const detected = detectLanguage(messageText);
    const supabase = serviceClient();

    let providerConfig = null;
    let convWorkspaceId = workspaceId;

    if (!convWorkspaceId && conversationId) {
      const { data: conv } = await supabase
        .from('conversations')
        .select('workspace_id, channel_metadata, visitor_id')
        .eq('id', conversationId)
        .maybeSingle();

      if (conv) {
        convWorkspaceId = conv.workspace_id;
      }
    }

    if (convWorkspaceId) {
      const { data: ws } = await supabase
        .from('workspaces')
        .select('ai_settings')
        .eq('id', convWorkspaceId)
        .maybeSingle();

      if (ws) {
        providerConfig = providerConfigFrom(ws.ai_settings);
      }
    }

    // Translate to English
    const res = await translateToEnglish({
      text: messageText,
      detectedLanguage: detected.code !== 'en' ? detected.code : undefined,
      providerConfig,
    });

    const finalDetectedCode = res.detectedLanguageCode || detected.code || 'en';
    const isNonEnglish =
      !res.isOriginalEnglish ||
      finalDetectedCode !== 'en' ||
      res.englishText.trim().toLowerCase() !== messageText.trim().toLowerCase();

    // If messageId provided, update message row in database
    if (messageId) {
      const { data: existingMsg } = await supabase
        .from('messages')
        .select('metadata')
        .eq('id', messageId)
        .maybeSingle();

      const existingMeta = (existingMsg?.metadata as Record<string, any>) || {};

      await supabase
        .from('messages')
        .update({
          metadata: {
            ...existingMeta,
            translation: {
              is_translated: isNonEnglish,
              direction: 'visitor_to_agent',
              original_text: messageText,
              english_text: res.englishText,
              detected_language: finalDetectedCode,
              language_name: res.sourceLanguage,
            },
            detected_language: finalDetectedCode,
            language_name: res.sourceLanguage,
            english_translation: res.englishText,
          },
        })
        .eq('id', messageId);
    }

    // Update conversation visitor language
    if (conversationId && isNonEnglish) {
      const { data: conv } = await supabase
        .from('conversations')
        .select('channel_metadata, visitor_id')
        .eq('id', conversationId)
        .maybeSingle();

      if (conv) {
        await supabase
          .from('conversations')
          .update({
            channel_metadata: {
              ...((conv.channel_metadata as Record<string, any>) || {}),
              visitor_language: finalDetectedCode,
              language_name: res.sourceLanguage,
            },
            updated_at: new Date().toISOString(),
          })
          .eq('id', conversationId);

        if (conv.visitor_id) {
          await supabase
            .from('visitors')
            .update({ language: finalDetectedCode })
            .eq('id', conv.visitor_id);
        }
      }
    }

    return NextResponse.json(
      {
        success: true,
        detectedLanguage: finalDetectedCode,
        languageName: res.sourceLanguage,
        isOriginalEnglish: !isNonEnglish,
        englishText: res.englishText,
      },
      { headers: CORS_HEADERS }
    );
  } catch (error: any) {
    console.error('[Process Message Translation Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Processing failed' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
