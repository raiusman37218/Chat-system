import { createClient } from '@supabase/supabase-js';
import { dispatchOutboundMessage } from '@/lib/channels/dispatcher';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vfjsaynnubxywdbevxtx.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmanNheW5udWJ4eXdkYmV2eHR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNTA5MDEsImV4cCI6MjEwMzgyNjkwMX0.YyBCXMqwrOk5BRhQafYLFw8tiM5PC8lc8Yocodw9wf0';

function getSupabase() {
  return createClient(SUPABASE_URL, SUPABASE_KEY);
}

export interface LangGraphTriggerParams {
  conversationId: string;
  workspaceId: string;
  incomingMessage: string;
  sender: {
    name?: string | null;
    email?: string | null;
    channel: string;
    channel_user_id?: string | null;
  };
  metadata?: Record<string, any>;
}

export interface LangGraphResponse {
  response?: string;
  content?: string;
  message?: string;
  action?: 'reply' | 'escalate' | 'suggest';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  internal_note?: string;
}

/**
 * Triggers the connected LangGraph agent for a conversation.
 */
export async function triggerLangGraphAgent(params: LangGraphTriggerParams) {
  const supabase = getSupabase();
  const { conversationId, workspaceId, incomingMessage, sender } = params;

  try {
    // 1. Fetch workspace integration settings
    const { data: integration, error: intErr } = await supabase
      .from('workspace_integrations')
      .select('*')
      .eq('workspace_id', workspaceId)
      .maybeSingle();

    if (intErr || !integration || !integration.langgraph_enabled || !integration.langgraph_webhook_url) {
      return { success: false, reason: 'LangGraph integration not enabled or URL missing' };
    }

    // 2. Fetch conversation history for context
    const { data: historyMessages } = await supabase
      .from('messages')
      .select('sender_type, content, created_at, is_internal')
      .eq('conversation_id', conversationId)
      .eq('is_internal', false)
      .order('created_at', { ascending: true })
      .limit(20);

    const history = (historyMessages || []).map((m) => ({
      role: m.sender_type === 'visitor' ? 'user' : 'assistant',
      content: m.content,
      timestamp: m.created_at,
    }));

    // 3. Dispatch payload to LangGraph agent endpoint
    const payload = {
      conversation_id: conversationId,
      workspace_id: workspaceId,
      channel: sender.channel,
      visitor: {
        name: sender.name || 'Customer',
        email: sender.email || null,
        channel_user_id: sender.channel_user_id || null,
      },
      current_message: incomingMessage,
      history,
      system_prompt:
        integration.langgraph_system_prompt ||
        'You are Chatify AI Support Assistant. Be polite, concise, and helpful. Escalate to a human agent when needed.',
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (integration.langgraph_api_key) {
      headers['Authorization'] = `Bearer ${integration.langgraph_api_key}`;
    }

    console.log(`[LangGraph Bridge] Calling agent endpoint at: ${integration.langgraph_webhook_url}`);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000); // 25s timeout

    const res = await fetch(integration.langgraph_webhook_url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`LangGraph returned HTTP ${res.status}: ${errText}`);
    }

    const data: LangGraphResponse = await res.json();
    const replyText = data.response || data.content || data.message || '';

    // 4. Handle internal notes if the agent left any
    if (data.internal_note) {
      await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_type: 'ai',
        content: `🤖 [AI Agent Note]: ${data.internal_note}`,
        is_internal: true,
      });
    }

    // 5. Handle escalation
    if (data.action === 'escalate') {
      await supabase
        .from('conversations')
        .update({
          status: 'open',
          priority: data.priority || 'high',
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId);

      if (replyText) {
        await insertAndDispatchReply(supabase, conversationId, workspaceId, replyText, sender.channel);
      }
      return { success: true, action: 'escalate' };
    }

    // 6. Handle standard AI reply
    if (replyText) {
      await insertAndDispatchReply(supabase, conversationId, workspaceId, replyText, sender.channel);
      return { success: true, action: 'reply', response: replyText };
    }

    return { success: true, action: 'none' };
  } catch (err: any) {
    console.error('[LangGraph Bridge Error]:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Inserts AI reply into database and forwards out to the customer's native channel.
 */
async function insertAndDispatchReply(
  supabase: ReturnType<typeof getSupabase>,
  conversationId: string,
  workspaceId: string,
  replyText: string,
  channel: string
) {
  // 1. Insert into Supabase
  const { data: insertedMsg, error: msgErr } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_type: 'ai',
      content: replyText,
      is_internal: false,
    })
    .select()
    .single();

  if (msgErr) {
    console.error('Failed to insert AI reply:', msgErr);
    return;
  }

  // 2. Touch conversation updated_at
  await supabase
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId);

  // 3. Dispatch outbound if not standard web
  if (channel && channel !== 'web') {
    await dispatchOutboundMessage({
      conversationId,
      workspaceId,
      content: replyText,
      channel,
    });
  }
}

/**
 * Generates an AI suggested draft reply for the human agent without auto-sending.
 */
export async function generateLangGraphDraft(params: LangGraphTriggerParams): Promise<string | null> {
  const supabase = getSupabase();
  const { conversationId, workspaceId, incomingMessage, sender } = params;

  try {
    const { data: integration } = await supabase
      .from('workspace_integrations')
      .select('*')
      .eq('workspace_id', workspaceId)
      .maybeSingle();

    if (!integration || !integration.langgraph_webhook_url) {
      // Fallback default suggestions if agent URL isn't configured yet
      return `Hi ${sender.name || 'there'}! Thank you for reaching out. How can I assist you with your request today?`;
    }

    const { data: historyMessages } = await supabase
      .from('messages')
      .select('sender_type, content, created_at')
      .eq('conversation_id', conversationId)
      .eq('is_internal', false)
      .order('created_at', { ascending: true })
      .limit(10);

    const history = (historyMessages || []).map((m) => ({
      role: m.sender_type === 'visitor' ? 'user' : 'assistant',
      content: m.content,
    }));

    const res = await fetch(integration.langgraph_webhook_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(integration.langgraph_api_key ? { Authorization: `Bearer ${integration.langgraph_api_key}` } : {}),
      },
      body: JSON.stringify({
        conversation_id: conversationId,
        workspace_id: workspaceId,
        channel: sender.channel,
        visitor: sender,
        mode: 'suggestion',
        current_message: incomingMessage,
        history,
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.response || data.content || data.message || null;
  } catch (err) {
    console.error('Error generating LangGraph draft:', err);
    return null;
  }
}
