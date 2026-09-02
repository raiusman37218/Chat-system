import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { triggerLangGraphAgent } from '@/lib/agent/langgraph';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vfjsaynnubxywdbevxtx.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmanNheW5udWJ4eXdkYmV2eHR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNTA5MDEsImV4cCI6MjEwMzgyNjkwMX0.YyBCXMqwrOk5BRhQafYLFw8tiM5PC8lc8Yocodw9wf0';

function getSupabase() {
  return createClient(SUPABASE_URL, SUPABASE_KEY);
}

/**
 * GET Handler for LinkedIn Webhook Challenge Verification
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const challenge = searchParams.get('challenge');

  if (challenge) {
    return new NextResponse(challenge, { status: 200, headers: { 'Content-Type': 'text/plain' } });
  }

  return NextResponse.json({ status: 'linkedin_webhook_active' });
}

/**
 * POST Handler for LinkedIn Messaging Events
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('[LinkedIn Webhook] Payload:', JSON.stringify(body).slice(0, 300));

    const supabase = getSupabase();
    const { data: workspaces } = await supabase.from('workspaces').select('id').limit(1);
    const workspaceId = workspaces?.[0]?.id;

    if (!workspaceId) {
      return NextResponse.json({ status: 'no_workspace' }, { status: 200 });
    }

    // Process LinkedIn message events
    const senderUrn = body.actor || body.sender || body.from || 'urn:li:person:unknown';
    const text = body.message?.body || body.content || body.text || '';
    const senderName = body.sender_name || 'LinkedIn Member';

    if (text && senderUrn) {
      // 1. Find or create visitor
      let visitorId: string | null = null;
      const { data: existingVisitor } = await supabase
        .from('visitors')
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('channel', 'linkedin')
        .eq('channel_user_id', senderUrn)
        .maybeSingle();

      if (existingVisitor) {
        visitorId = existingVisitor.id;
      } else {
        const { data: newV } = await supabase
          .from('visitors')
          .insert({
            workspace_id: workspaceId,
            channel: 'linkedin',
            channel_user_id: senderUrn,
            name: senderName,
            current_url: `https://www.linkedin.com/in/${senderUrn}`,
            first_seen: new Date().toISOString(),
            last_seen: new Date().toISOString(),
          })
          .select('id')
          .single();

        visitorId = newV?.id || null;
      }

      if (visitorId) {
        // 2. Find or create conversation
        let conversationId: string | null = null;
        const { data: openConv } = await supabase
          .from('conversations')
          .select('id, ai_mode')
          .eq('workspace_id', workspaceId)
          .eq('visitor_id', visitorId)
          .in('status', ['open', 'pending'])
          .maybeSingle();

        if (openConv) {
          conversationId = openConv.id;
        } else {
          const { data: newConv } = await supabase
            .from('conversations')
            .insert({
              workspace_id: workspaceId,
              visitor_id: visitorId,
              channel: 'linkedin',
              channel_user_id: senderUrn,
              status: 'open',
              ai_mode: 'autopilot',
              updated_at: new Date().toISOString(),
            })
            .select('id')
            .single();

          conversationId = newConv?.id || null;
        }

        if (conversationId) {
          // 3. Insert message
          await supabase.from('messages').insert({
            conversation_id: conversationId,
            sender_type: 'visitor',
            content: text,
            is_internal: false,
          });

          // 4. Trigger LangGraph AI
          if (openConv?.ai_mode !== 'disabled') {
            triggerLangGraphAgent({
              conversationId,
              workspaceId,
              incomingMessage: text,
              sender: {
                name: senderName,
                channel: 'linkedin',
                channel_user_id: senderUrn,
              },
            }).catch(console.error);
          }
        }
      }
    }

    return NextResponse.json({ status: 'SUCCESS' }, { status: 200 });
  } catch (err: any) {
    console.error('[LinkedIn Webhook Error]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
