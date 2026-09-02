import { NextRequest, NextResponse } from 'next/server';
import { dispatchOutboundMessage } from '@/lib/channels/dispatcher';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { conversationId, workspaceId, content, channel } = body;

    if (!conversationId || !content || !channel) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const res = await dispatchOutboundMessage({
      conversationId,
      workspaceId,
      content,
      channel,
    });

    return NextResponse.json(res);
  } catch (err: any) {
    console.error('[API Channels Dispatch Error]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
