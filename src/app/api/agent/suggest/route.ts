import { NextRequest, NextResponse } from 'next/server';
import { generateLangGraphDraft } from '@/lib/agent/langgraph';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { conversation_id, workspace_id, incoming_message, visitor, channel = 'web' } = body;

    if (!conversation_id || !workspace_id) {
      return NextResponse.json({ error: 'Missing conversation_id or workspace_id' }, { status: 400 });
    }

    const draft = await generateLangGraphDraft({
      conversationId: conversation_id,
      workspaceId: workspace_id,
      incomingMessage: incoming_message || '',
      sender: {
        name: visitor?.name || 'Customer',
        email: visitor?.email || null,
        channel,
      },
    });

    return NextResponse.json({ draft: draft || 'Hello! How can I help you today?' });
  } catch (err: any) {
    console.error('Error generating AI suggestion:', err);
    return NextResponse.json({ draft: 'Thank you for reaching out! How can we assist you today?' });
  }
}
