import { NextRequest, NextResponse } from 'next/server';

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
      text,
    } = body;

    if (!messageId && !text) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400, headers: CORS_HEADERS });
    }

    const messageText = (text || '').trim();
    if (!messageText) {
      return NextResponse.json({ skipped: true, reason: 'Empty text' }, { headers: CORS_HEADERS });
    }

    // Auto-translation is disabled per user request
    return NextResponse.json(
      {
        skipped: true,
        reason: 'Auto-translation is disabled',
        englishText: messageText,
        detectedLanguage: 'en',
        languageName: 'English',
        isOriginalEnglish: true,
      },
      { headers: CORS_HEADERS }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Internal server error' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
