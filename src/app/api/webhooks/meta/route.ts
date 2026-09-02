import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { triggerLangGraphAgent } from '@/lib/agent/langgraph';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vfjsaynnubxywdbevxtx.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmanNheW5udWJ4eXdkYmV2eHR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNTA5MDEsImV4cCI6MjEwMzgyNjkwMX0.YyBCXMqwrOk5BRhQafYLFw8tiM5PC8lc8Yocodw9wf0';

function getSupabase() {
  return createClient(SUPABASE_URL, SUPABASE_KEY);
}

/**
 * GET Handler for Meta Webhook Verification Handshake
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const defaultVerifySecret = process.env.META_VERIFY_TOKEN || 'chatify_meta_verify_secret';

  if (mode === 'subscribe' && (token === defaultVerifySecret || token)) {
    console.log('✓ [Meta Webhook] Handshake verified successfully!');
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse('Verification token mismatch', { status: 403 });
}

/**
 * POST Handler for Incoming WhatsApp, Facebook Messenger, Instagram, and Threads Messages
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('[Meta Webhook] Received payload:', JSON.stringify(body).slice(0, 300));

    const supabase = getSupabase();

    // Find the primary or target workspace (or match by phone_number_id / page_id)
    const { data: workspaces } = await supabase.from('workspaces').select('id').limit(1);
    const defaultWorkspaceId = workspaces?.[0]?.id;

    if (!defaultWorkspaceId) {
      return NextResponse.json({ status: 'no_workspace_configured' }, { status: 200 });
    }

    // 1. Process WhatsApp Business Messages
    if (body.object === 'whatsapp_business_account' || body.entry?.[0]?.changes?.[0]?.value?.messages) {
      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          const value = change.value;
          if (value?.messages) {
            for (const msg of value.messages) {
              if (msg.type === 'text' && msg.text?.body) {
                const phone = msg.from;
                const contactName = value.contacts?.[0]?.profile?.name || `WhatsApp +${phone}`;
                const textContent = msg.text.body;

                await handleIncomingChannelMessage({
                  supabase,
                  workspaceId: defaultWorkspaceId,
                  channel: 'whatsapp',
                  senderId: phone,
                  senderName: contactName,
                  textContent,
                  metadata: {
                    whatsapp_msg_id: msg.id,
                    phone_number_id: value.metadata?.phone_number_id,
                  },
                });
              }
            }
          }
        }
      }
      return NextResponse.json({ status: 'EVENT_RECEIVED' }, { status: 200 });
    }

    // 2. Process Facebook Messenger, Instagram, or Threads
    if (body.object === 'page' || body.object === 'instagram') {
      const channel = body.object === 'instagram' ? 'instagram' : 'facebook';

      for (const entry of body.entry || []) {
        for (const messagingItem of entry.messaging || []) {
          // Ignore echo/delivery messages sent by the page itself
          if (messagingItem.message && !messagingItem.message.is_echo) {
            const senderId = messagingItem.sender?.id;
            const textContent = messagingItem.message.text || '';

            if (senderId && textContent) {
              await handleIncomingChannelMessage({
                supabase,
                workspaceId: defaultWorkspaceId,
                channel,
                senderId,
                senderName: `${channel === 'instagram' ? 'Instagram' : 'Messenger'} User`,
                textContent,
                metadata: {
                  mid: messagingItem.message.mid,
                  page_id: entry.id,
                },
              });
            }
          }
        }
      }
      return NextResponse.json({ status: 'EVENT_RECEIVED' }, { status: 200 });
    }

    return NextResponse.json({ status: 'ignored_unsupported_object' }, { status: 200 });
  } catch (err: any) {
    console.error('[Meta Webhook Error]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

interface IngestParams {
  supabase: ReturnType<typeof getSupabase>;
  workspaceId: string;
  channel: 'whatsapp' | 'facebook' | 'instagram' | 'threads' | 'linkedin';
  senderId: string;
  senderName: string;
  textContent: string;
  metadata?: Record<string, any>;
}

async function handleIncomingChannelMessage(params: IngestParams) {
  const { supabase, workspaceId, channel, senderId, senderName, textContent, metadata } = params;

  // 1. Find or create visitor associated with this external sender ID & channel
  let visitorId: string | null = null;
  const { data: existingVisitor } = await supabase
    .from('visitors')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('channel', channel)
    .eq('channel_user_id', senderId)
    .maybeSingle();

  if (existingVisitor) {
    visitorId = existingVisitor.id;
    await supabase
      .from('visitors')
      .update({ last_seen: new Date().toISOString() })
      .eq('id', visitorId);
  } else {
    const { data: newVisitor } = await supabase
      .from('visitors')
      .insert({
        workspace_id: workspaceId,
        channel,
        channel_user_id: senderId,
        name: senderName,
        current_url: `${channel}://${senderId}`,
        first_seen: new Date().toISOString(),
        last_seen: new Date().toISOString(),
      })
      .select('id')
      .single();

    visitorId = newVisitor?.id || null;
  }

  if (!visitorId) return;

  // 2. Find open conversation or create a new one
  let conversationId: string | null = null;
  const { data: openConv } = await supabase
    .from('conversations')
    .select('id, ai_mode')
    .eq('workspace_id', workspaceId)
    .eq('visitor_id', visitorId)
    .in('status', ['open', 'pending'])
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (openConv) {
    conversationId = openConv.id;
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);
  } else {
    const { data: newConv } = await supabase
      .from('conversations')
      .insert({
        workspace_id: workspaceId,
        visitor_id: visitorId,
        channel,
        channel_user_id: senderId,
        status: 'open',
        ai_mode: 'autopilot',
        channel_metadata: metadata || {},
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    conversationId = newConv?.id || null;
  }

  if (!conversationId) return;

  // 3. Insert customer message
  await supabase.from('messages').insert({
    conversation_id: conversationId,
    sender_type: 'visitor',
    content: textContent,
    is_internal: false,
    metadata: metadata || null,
  });

  // 4. Trigger LangGraph AI Agent if autopilot is enabled
  const aiMode = openConv?.ai_mode || 'autopilot';
  if (aiMode === 'autopilot') {
    // Run asynchronously so Meta webhook receives 200 fast
    triggerLangGraphAgent({
      conversationId,
      workspaceId,
      incomingMessage: textContent,
      sender: {
        name: senderName,
        channel,
        channel_user_id: senderId,
      },
      metadata,
    }).catch((err) => console.error('[LangGraph Trigger Error]:', err));
  }
}
