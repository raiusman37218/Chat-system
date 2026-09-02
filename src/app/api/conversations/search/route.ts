import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vfjsaynnubxywdbevxtx.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmanNheW5udWJ4eXdkYmV2eHR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNTA5MDEsImV4cCI6MjEwMzgyNjkwMX0.YyBCXMqwrOk5BRhQafYLFw8tiM5PC8lc8Yocodw9wf0';

function getSupabase() {
  return createClient(SUPABASE_URL, SUPABASE_KEY);
}

/**
 * GET /api/conversations/search?q=...&tag=...
 * Searches conversations by visitor name, email, keyword in messages, or tag.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q')?.trim() || '';
    const tag = searchParams.get('tag')?.trim() || '';

    const supabase = getSupabase();

    // 1. Search matching messages by content
    let matchingConvIdsFromMessages = new Set<string>();
    if (query) {
      const { data: matchedMsgs } = await supabase
        .from('messages')
        .select('conversation_id, content')
        .ilike('content', `%${query}%`)
        .limit(100);

      matchedMsgs?.forEach((m) => {
        if (m.conversation_id) matchingConvIdsFromMessages.add(m.conversation_id);
      });
    }

    // 2. Search matching visitors by name or email
    let matchingVisitorIds = new Set<string>();
    if (query) {
      const { data: matchedVisitors } = await supabase
        .from('visitors')
        .select('id')
        .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(100);

      matchedVisitors?.forEach((v) => matchingVisitorIds.add(v.id));
    }

    // 3. Search conversations
    let convQuery = supabase
      .from('conversations')
      .select('*, visitor:visitors(*), agent:agents(*), last_message:messages(*)')
      .order('updated_at', { ascending: false })
      .limit(50);

    if (tag) {
      convQuery = convQuery.contains('tags', [tag]);
    }

    const { data: conversations, error } = await convQuery;
    if (error) throw error;

    // Filter conversations in memory if query was passed
    let results = conversations || [];
    if (query) {
      const qLower = query.toLowerCase();
      results = results.filter((conv) => {
        // Direct ID match
        if (conv.id.toLowerCase().includes(qLower)) return true;
        // Visitor match
        if (conv.visitor_id && matchingVisitorIds.has(conv.visitor_id)) return true;
        if (conv.visitor?.name?.toLowerCase().includes(qLower)) return true;
        if (conv.visitor?.email?.toLowerCase().includes(qLower)) return true;
        // Tag match
        if (conv.tags?.some((t: string) => t.toLowerCase().includes(qLower))) return true;
        // Message content match
        if (matchingConvIdsFromMessages.has(conv.id)) return true;
        return false;
      });
    }

    return NextResponse.json({
      count: results.length,
      conversations: results,
    });
  } catch (error: any) {
    console.error('[Search Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Search failed' },
      { status: 500 }
    );
  }
}
