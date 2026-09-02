import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  analyzeVisitorSentiment,
  generateAutoTags,
  generateConversationSummary,
} from '@/lib/ai/anthropic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vfjsaynnubxywdbevxtx.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmanNheW5udWJ4eXdkYmV2eHR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNTA5MDEsImV4cCI6MjEwMzgyNjkwMX0.YyBCXMqwrOk5BRhQafYLFw8tiM5PC8lc8Yocodw9wf0';

export async function POST(req: NextRequest) {
  try {
    const { conversation_id, workspace_id, apply_tags = true } = await req.json();

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
    if (aiSettings && !aiSettings.enabled) {
      return NextResponse.json({ disabled: true });
    }

    // 2. Fetch conversation and messages
    const [{ data: conv }, { data: messages }] = await Promise.all([
      supabase.from('conversations').select('*, visitor:visitors(*)').eq('id', conversation_id).single(),
      supabase
        .from('messages')
        .select('sender_type, content, created_at')
        .eq('conversation_id', conversation_id)
        .order('created_at', { ascending: true }),
    ]);

    if (!conv) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const msgList = messages || [];
    const apiKey = aiSettings?.anthropic_api_key;
    const updates: Record<string, any> = {};

    let sentiment = conv.sentiment || 'neutral';
    let summary = conv.summary || null;
    let tags = conv.tags || [];

    // A. Sentiment Analysis (if enabled)
    if (!aiSettings || aiSettings.sentiment_enabled) {
      sentiment = await analyzeVisitorSentiment({
        messages: msgList,
        apiKey,
      });
      updates.sentiment = sentiment;
    }

    // B. Auto-Tagging (if enabled)
    if (!aiSettings || aiSettings.auto_tagging_enabled) {
      const visitorMessages = msgList.filter((m) => m.sender_type === 'visitor');
      const allVisitorText = visitorMessages.map((m) => m.content).join(' ');
      if (allVisitorText) {
        tags = await generateAutoTags({
          content: allVisitorText,
          existingTags: conv.tags || [],
          apiKey,
        });
        if (apply_tags) {
          updates.tags = tags;
        }
      }
    }

    // C. 2-Line Conversation Summary (for long threads >= 4 messages)
    if ((!aiSettings || aiSettings.summary_enabled) && msgList.length >= 3) {
      summary = await generateConversationSummary({
        messages: msgList,
        visitorName: conv.visitor?.name,
        apiKey,
      });
      updates.summary = summary;
    }

    // D. Persist updates to conversations table
    if (Object.keys(updates).length > 0) {
      updates.updated_at = new Date().toISOString();
      await supabase
        .from('conversations')
        .update(updates)
        .eq('id', conversation_id);
    }

    return NextResponse.json({
      sentiment,
      summary,
      tags,
      applied: updates,
    });
  } catch (error: any) {
    console.error('Error analyzing conversation:', error);
    return NextResponse.json({ error: error.message || 'Analysis failed' }, { status: 500 });
  }
}
