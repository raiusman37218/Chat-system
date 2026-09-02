import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vfjsaynnubxywdbevxtx.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmanNheW5udWJ4eXdkYmV2eHR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNTA5MDEsImV4cCI6MjEwMzgyNjkwMX0.YyBCXMqwrOk5BRhQafYLFw8tiM5PC8lc8Yocodw9wf0';
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';

function getSupabase() {
  return createClient(SUPABASE_URL, SUPABASE_KEY);
}

/**
 * POST /api/notifications/dispatch
 * Central dispatcher for Slack webhooks and offline agent email notifications.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { event, conversation_id, message, workspace_id } = body;

    const supabase = getSupabase();
    const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // ──────────────────────────────────────────────────────────────────────────
    // 1. TEST SLACK WEBHOOK
    // ──────────────────────────────────────────────────────────────────────────
    if (event === 'test_slack') {
      const { webhook_url } = body;
      if (!webhook_url) {
        return NextResponse.json({ error: 'Missing webhook_url' }, { status: 400 });
      }

      const res = await fetch(webhook_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: '🚀 *Chatify Test Notification*\nYour Slack webhook is connected successfully! New customer conversations will appear here.',
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        return NextResponse.json(
          { error: `Slack returned error: ${errText}` },
          { status: 400 }
        );
      }

      return NextResponse.json({ success: true, message: 'Test message sent to Slack' });
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 2. NEW CONVERSATION CREATED -> SLACK WEBHOOK
    // ──────────────────────────────────────────────────────────────────────────
    if (event === 'conversation_created') {
      if (!conversation_id) {
        return NextResponse.json({ error: 'Missing conversation_id' }, { status: 400 });
      }

      // Fetch conversation with visitor details
      const { data: conv } = await supabase
        .from('conversations')
        .select('*, visitor:visitors(*)')
        .eq('id', conversation_id)
        .single();

      if (!conv) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
      }

      // Look up workspace integrations for Slack
      const wsId = conv.workspace_id || workspace_id;
      let slackWebhook = process.env.SLACK_WEBHOOK_URL || '';
      let slackEnabled = true;

      if (wsId) {
        const { data: integ } = await supabase
          .from('workspace_integrations')
          .select('slack_enabled, slack_webhook_url')
          .eq('workspace_id', wsId)
          .maybeSingle();

        if (integ) {
          if (integ.slack_webhook_url) slackWebhook = integ.slack_webhook_url;
          if (integ.slack_enabled !== undefined) slackEnabled = integ.slack_enabled;
        }
      }

      if (slackWebhook && slackEnabled) {
        const visitorName = conv.visitor?.name || 'Anonymous Visitor';
        const visitorEmail = conv.visitor?.email || 'None';
        const channel = conv.channel || 'web';
        const initialText = message?.content || 'A customer started a new chat session.';
        const inboxUrl = `${appBaseUrl}/dashboard?conversation=${conv.id}`;

        const slackPayload = {
          text: `💬 *New Conversation Started by ${visitorName}*`,
          blocks: [
            {
              type: 'header',
              text: {
                type: 'plain_text',
                text: '💬 New Customer Conversation Started',
                emoji: true,
              },
            },
            {
              type: 'section',
              fields: [
                { type: 'mrkdwn', text: `*Visitor:*\n${visitorName}` },
                { type: 'mrkdwn', text: `*Email:*\n${visitorEmail}` },
                { type: 'mrkdwn', text: `*Channel:*\n\`${channel}\`` },
                { type: 'mrkdwn', text: `*Ticket ID:*\n\`#${conv.id.slice(0, 8)}\`` },
              ],
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*Initial Message:*\n>${initialText.replace(/\n/g, '\n>')}`,
              },
            },
            {
              type: 'actions',
              elements: [
                {
                  type: 'button',
                  text: { type: 'plain_text', text: 'Open in Chatify Inbox ↗', emoji: true },
                  url: inboxUrl,
                  style: 'primary',
                },
              ],
            },
          ],
        };

        try {
          await fetch(slackWebhook, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(slackPayload),
          });
        } catch (sErr) {
          console.error('[Slack Webhook Error]:', sErr);
        }
      }

      return NextResponse.json({ success: true, dispatched: 'conversation_created' });
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 3. NEW VISITOR MESSAGE -> EMAIL TO OFFLINE ASSIGNED AGENT
    // ──────────────────────────────────────────────────────────────────────────
    if (event === 'new_message') {
      const senderType = message?.sender_type;
      if (senderType !== 'visitor') {
        return NextResponse.json({ ignored: 'Not a visitor message' });
      }

      // Fetch conversation to find assigned agent
      const { data: conv } = await supabase
        .from('conversations')
        .select('*, visitor:visitors(*), agent:agents(*)')
        .eq('id', conversation_id)
        .single();

      if (!conv || !conv.assigned_agent_id) {
        return NextResponse.json({ ignored: 'No assigned agent for this conversation' });
      }

      // Check agent status
      let agent = conv.agent;
      if (!agent) {
        const { data: aData } = await supabase
          .from('agents')
          .select('*')
          .eq('id', conv.assigned_agent_id)
          .single();
        agent = aData;
      }

      if (!agent || !agent.email) {
        return NextResponse.json({ ignored: 'Agent has no email' });
      }

      // Only notify if agent is offline or away
      if (agent.status === 'online') {
        return NextResponse.json({ ignored: 'Agent is currently online' });
      }

      // Check workspace integration settings
      let emailsEnabled = true;
      if (conv.workspace_id) {
        const { data: integ } = await supabase
          .from('workspace_integrations')
          .select('email_offline_notifications')
          .eq('workspace_id', conv.workspace_id)
          .maybeSingle();

        if (integ && integ.email_offline_notifications === false) {
          emailsEnabled = false;
        }
      }

      if (!emailsEnabled) {
        return NextResponse.json({ ignored: 'Offline email notifications disabled in settings' });
      }

      const visitorName = conv.visitor?.name || 'A customer';
      const ticketUrl = `${appBaseUrl}/dashboard?conversation=${conv.id}`;
      const emailSubject = `[Chatify] New message from ${visitorName} (Ticket #${conv.id.slice(0, 8)})`;
      const messageSnippet = message.content || 'Sent an attachment';

      console.log(
        `[Email Notification] Disagreeing agent offline (${agent.name} <${agent.email}>, status: ${agent.status}). Dispatching email...`
      );

      // If Resend API key is configured, send actual email
      let emailResult = { simulated: true };
      if (RESEND_API_KEY) {
        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: 'Chatify Support <notifications@chatify.dev>',
            to: agent.email,
            subject: emailSubject,
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; rounded: 12px;">
                <div style="margin-bottom: 16px;">
                  <span style="font-weight: 700; font-size: 18px; color: #0f172a;">Chatify</span>
                </div>
                <h2 style="font-size: 16px; color: #1e293b; margin-top: 0;">You have a new message while offline</h2>
                <p style="font-size: 14px; color: #475569; line-height: 1.5;">
                  <strong>${visitorName}</strong> replied to conversation <strong>#${conv.id.slice(0, 8)}</strong>:
                </p>
                <div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 12px 16px; margin: 16px 0; border-radius: 4px; font-size: 14px; color: #334155;">
                  ${messageSnippet}
                </div>
                <div style="margin-top: 24px;">
                  <a href="${ticketUrl}" style="background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block;">
                    Open Conversation in Inbox &rarr;
                  </a>
                </div>
                <p style="font-size: 12px; color: #94a3b8; margin-top: 32px; border-top: 1px solid #f1f5f9; padding-top: 16px;">
                  You received this email because this ticket is assigned to you and your status is currently set to <em>${agent.status}</em>.
                </p>
              </div>
            `,
          }),
        });

        if (resendRes.ok) {
          emailResult = await resendRes.json();
        }
      }

      return NextResponse.json({
        success: true,
        dispatched: 'email_offline_agent',
        agent: agent.email,
        subject: emailSubject,
        result: emailResult,
      });
    }

    return NextResponse.json({ error: 'Unknown event type' }, { status: 400 });
  } catch (error: any) {
    console.error('[Notification Dispatch Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Notification dispatch failed' },
      { status: 500 }
    );
  }
}
