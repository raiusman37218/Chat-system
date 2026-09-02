import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateSuggestedReplies } from '@/lib/ai/anthropic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vfjsaynnubxywdbevxtx.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmanNheW5udWJ4eXdkYmV2eHR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNTA5MDEsImV4cCI6MjEwMzgyNjkwMX0.YyBCXMqwrOk5BRhQafYLFw8tiM5PC8lc8Yocodw9wf0';

export async function POST(req: NextRequest) {
  try {
    const { conversation_id, workspace_id } = await req.json();

    if (!conversation_id || !workspace_id) {
      return NextResponse.json({ error: 'Missing conversation_id or workspace_id' }, { status: 400 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

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
      apiKey: aiSettings?.anthropic_api_key,
    });

    return NextResponse.json({ suggestions });
  } catch (error: any) {
    console.error('Error generating AI suggested replies:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate suggestions' }, { status: 500 });
  }
}
