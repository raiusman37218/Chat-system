import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vfjsaynnubxywdbevxtx.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmanNheW5udWJ4eXdkYmV2eHR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNTA5MDEsImV4cCI6MjEwMzgyNjkwMX0.YyBCXMqwrOk5BRhQafYLFw8tiM5PC8lc8Yocodw9wf0';

function getSupabase() {
  return createClient(SUPABASE_URL, SUPABASE_KEY);
}

export interface DispatchOutboundParams {
  conversationId: string;
  workspaceId: string;
  content: string;
  channel: string;
}

/**
 * Forwards an agent or AI message out to external messaging channels (WhatsApp, Facebook, Instagram, LinkedIn).
 */
export async function dispatchOutboundMessage(params: DispatchOutboundParams) {
  const { conversationId, workspaceId, content, channel } = params;

  // Web messages are automatically picked up by Supabase Realtime in widget.js
  if (channel === 'web' || !channel) {
    return { success: true, channel: 'web' };
  }

  const supabase = getSupabase();

  try {
    // 1. Fetch conversation details to get channel_user_id (phone number, PSID, IGSID, etc.)
    const { data: conv, error: convErr } = await supabase
      .from('conversations')
      .select('channel_user_id, channel_metadata')
      .eq('id', conversationId)
      .single();

    if (convErr || !conv || !conv.channel_user_id) {
      console.warn(`[Dispatcher] No external channel_user_id for conversation ${conversationId}`);
      return { success: false, error: 'Missing channel_user_id' };
    }

    const recipientId = conv.channel_user_id;

    // 2. Fetch workspace integration credentials
    const { data: integration } = await supabase
      .from('workspace_integrations')
      .select('*')
      .eq('workspace_id', workspaceId)
      .maybeSingle();

    if (!integration) {
      console.warn(`[Dispatcher] No workspace_integrations found for workspace ${workspaceId}`);
      return { success: false, error: 'Integration settings missing' };
    }

    // 3. Dispatch to respective provider
    switch (channel.toLowerCase()) {
      case 'whatsapp': {
        if (!integration.whatsapp_access_token || !integration.whatsapp_phone_number_id) {
          console.warn('[Dispatcher] WhatsApp credentials not configured.');
          return { success: false, error: 'WhatsApp credentials missing' };
        }

        const url = `https://graph.facebook.com/v20.0/${integration.whatsapp_phone_number_id}/messages`;
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${integration.whatsapp_access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: recipientId,
            type: 'text',
            text: { preview_url: false, body: content },
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          console.error('[WhatsApp Outbound Error]:', data);
          return { success: false, error: data };
        }
        console.log(`✓ [WhatsApp] Sent message to ${recipientId}:`, data.messages?.[0]?.id);
        return { success: true, providerMsgId: data.messages?.[0]?.id };
      }

      case 'facebook':
      case 'messenger':
      case 'instagram': {
        if (!integration.meta_page_access_token) {
          console.warn('[Dispatcher] Meta Page Access Token not configured.');
          return { success: false, error: 'Meta Page Access Token missing' };
        }

        const url = `https://graph.facebook.com/v20.0/me/messages?access_token=${integration.meta_page_access_token}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipient: { id: recipientId },
            message: { text: content },
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          console.error(`[${channel} Outbound Error]:`, data);
          return { success: false, error: data };
        }
        console.log(`✓ [${channel}] Sent message to ${recipientId}:`, data.message_id);
        return { success: true, providerMsgId: data.message_id };
      }

      case 'linkedin': {
        if (!integration.linkedin_access_token) {
          console.warn('[Dispatcher] LinkedIn Access Token not configured.');
          return { success: false, error: 'LinkedIn Access Token missing' };
        }

        const url = 'https://api.linkedin.com/v2/messages';
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${integration.linkedin_access_token}`,
            'Content-Type': 'application/json',
            'X-Restli-Protocol-Version': '2.0.0',
          },
          body: JSON.stringify({
            recipients: [recipientId],
            message: {
              body: content,
            },
          }),
        });

        if (!res.ok) {
          const errText = await res.text();
          console.error('[LinkedIn Outbound Error]:', errText);
          return { success: false, error: errText };
        }
        console.log(`✓ [LinkedIn] Sent message to ${recipientId}`);
        return { success: true };
      }

      default:
        return { success: true, channel };
    }
  } catch (err: any) {
    console.error(`[Dispatcher Error for ${channel}]:`, err.message);
    return { success: false, error: err.message };
  }
}
