import { NextRequest, NextResponse } from 'next/server';
import { providerConfigFrom } from '@/lib/ai/help-answer';
import { serviceClient } from '@/lib/supabase/service';
import { generateSuggestedReplies } from '@/lib/ai/anthropic';

export async function POST(req: NextRequest) {
  try {
    const { conversation_id, workspace_id } = await req.json();

    if (!conversation_id || !workspace_id) {
      return NextResponse.json({ error: 'Missing conversation_id or workspace_id' }, { status: 400 });
    }

    const supabase = serviceClient();

    // 1. Fetch workspace AI settings
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('ai_settings')
      .eq('id', workspace_id)
      .single();

    const aiSettings = workspace?.ai_settings;
    if (aiSettings && (!aiSettings.enabled || !aiSettings.suggested_replies_enabled)) {
      return NextResponse.json({ suggestions: [], disabled: true });
    }

    // 2. Fetch conversation and recent messages
    const [{ data: conv }, { data: messages }] = await Promise.all([
      supabase.from('conversations').select('*, visitor:visitors(*)').eq('id', conversation_id).single(),
      supabase
        .from('messages')
        .select('sender_type, content, created_at')
        .eq('conversation_id', conversation_id)
        .order('created_at', { ascending: true })
        .limit(10),
    ]);

    const msgList = messages || [];
    const lastVisitorMsg = [...msgList].reverse().find((m) => m.sender_type === 'visitor');

    const suggestions = await generateSuggestedReplies({
      incomingMessage: lastVisitorMsg?.content || 'Hello, I have a question.',
      conversationHistory: msgList,
      visitorName: conv?.visitor?.name || 'Customer',
      providerConfig: providerConfigFrom(aiSettings),
    });

    return NextResponse.json({ suggestions });
  } catch (error: any) {
    console.error('Error generating AI suggested replies:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate suggestions' }, { status: 500 });
  }
}
