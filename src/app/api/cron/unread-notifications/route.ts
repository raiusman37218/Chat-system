import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendSmtpEmail, generateUnreadAlertEmailHtml } from '@/lib/email/smtp';
import { SMTPSettingsConfig, Workspace } from '@/types/database';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vfjsaynnubxywdbevxtx.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmanNheW5udWJ4eXdkYmV2eHR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNTA5MDEsImV4cCI6MjEwMzgyNjkwMX0.YyBCXMqwrOk5BRhQafYLFw8tiM5PC8lc8Yocodw9wf0';

function getSupabase() {
  return createClient(SUPABASE_URL, SUPABASE_KEY);
}

export async function GET(req: NextRequest) {
  return processUnreadNotifications(req);
}

export async function POST(req: NextRequest) {
  return processUnreadNotifications(req);
}

async function processUnreadNotifications(req: NextRequest) {
  try {
    const supabase = getSupabase();
    const appBaseUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || '').replace(/\/+$/, '');

    // 1. Calculate 5 minutes threshold
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    // 2. Fetch unread messages from agent/ai older than 5 minutes that have not been emailed
    const { data: unreadMessages, error: msgError } = await supabase
      .from('messages')
      .select('id, conversation_id, content, attachment_url, sender_type, created_at, read_at, email_notified_at, is_internal')
      .in('sender_type', ['agent', 'ai'])
      .is('read_at', null)
      .is('email_notified_at', null)
      .or('is_internal.is.null,is_internal.eq.false')
      .lte('created_at', fiveMinutesAgo)
      .order('created_at', { ascending: true });

    if (msgError) {
      console.error('[Unread Cron Error] Fetching messages:', msgError);
      return NextResponse.json({ error: msgError.message }, { status: 500 });
    }

    if (!unreadMessages || unreadMessages.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pending unread messages older than 5 minutes found.',
        processed: 0,
        sent: 0,
      });
    }

    // 3. Group unread messages by conversation_id
    const messagesByConv: Record<string, typeof unreadMessages> = {};
    for (const msg of unreadMessages) {
      if (!messagesByConv[msg.conversation_id]) {
        messagesByConv[msg.conversation_id] = [];
      }
      messagesByConv[msg.conversation_id].push(msg);
    }

    const convIds = Object.keys(messagesByConv);

    // 4. Fetch the conversations and visitor details
    const { data: convs, error: convError } = await supabase
      .from('conversations')
      .select('id, workspace_id, visitor:visitors(id, name, email, current_url)')
      .in('id', convIds);

    if (convError || !convs) {
      console.error('[Unread Cron Error] Fetching conversations:', convError);
      return NextResponse.json({ error: convError?.message || 'Failed to fetch conversations' }, { status: 500 });
    }

    // 5. Fetch the relevant workspaces to get their SMTP settings
    const workspaceIds = Array.from(new Set(convs.map((c: any) => c.workspace_id).filter(Boolean)));
    const { data: workspaces, error: wsError } = await supabase
      .from('workspaces')
      .select('*')
      .in('id', workspaceIds);

    if (wsError || !workspaces) {
      console.error('[Unread Cron Error] Fetching workspaces:', wsError);
      return NextResponse.json({ error: wsError?.message || 'Failed to fetch workspaces' }, { status: 500 });
    }

    const workspaceMap = new Map<string, Workspace>();
    workspaces.forEach((ws: any) => workspaceMap.set(ws.id, ws));

    let sentCount = 0;
    let skippedCount = 0;
    const errors: any[] = [];

    // 6. Process each conversation
    for (const conv of convs as any[]) {
      const msgs = messagesByConv[conv.id];
      if (!msgs || msgs.length === 0) continue;

      const visitor = conv.visitor;
      if (!visitor || !visitor.email || !visitor.email.includes('@')) {
        skippedCount++;
        continue;
      }

      const workspace = workspaceMap.get(conv.workspace_id);
      if (!workspace) {
        skippedCount++;
        continue;
      }

      const smtp = workspace.smtp_settings as SMTPSettingsConfig | null | undefined;
      if (!smtp || !smtp.enabled || !smtp.host || !smtp.user || !smtp.pass) {
        // Workspace has not configured or enabled Hostinger/custom SMTP
        skippedCount++;
        continue;
      }

      // Concatenate unread message contents
      const combinedMessage = msgs
        .map((m: any) => m.content || (m.attachment_url ? '[Sent an attachment]' : ''))
        .filter(Boolean)
        .join('\n\n');

      // Determine chat link
      const fallbackUrl = visitor.current_url || workspace.website_url || `${appBaseUrl}/demo.html?workspaceId=${workspace.id}`;
      const urlObj = new URL(fallbackUrl, appBaseUrl);
      urlObj.searchParams.set('zentry_conversation', conv.id);
      urlObj.searchParams.set('zentry_open', '1');
      urlObj.searchParams.set('chatify_conversation', conv.id);
      urlObj.searchParams.set('chatify_open', '1');
      const chatUrl = urlObj.toString();

      const emailHtml = generateUnreadAlertEmailHtml({
        visitorName: visitor.name || 'there',
        workspaceName: workspace.name || smtp.from_name || 'Support Desk',
        brandColor: workspace.brand_color,
        logoUrl: workspace.logo_url,
        messageContent: combinedMessage,
        ticketId: conv.id,
        chatUrl,
      });

      const emailSubject = `New reply from ${workspace.name || 'Support Desk'}: "${combinedMessage.slice(0, 48)}${combinedMessage.length > 48 ? '...' : ''}"`;

      // Send email via workspace Hostinger SMTP
      const sendResult = await sendSmtpEmail(smtp, {
        to: visitor.email,
        subject: emailSubject,
        html: emailHtml,
      });

      if (sendResult.success) {
        sentCount++;
        const msgIds = msgs.map((m: any) => m.id);
        const nowIso = new Date().toISOString();

        // Mark messages as email notified
        await supabase
          .from('messages')
          .update({ email_notified_at: nowIso })
          .in('id', msgIds);
      } else {
        errors.push({
          conversation_id: conv.id,
          recipient: visitor.email,
          error: sendResult.error,
        });
      }
    }

    return NextResponse.json({
      success: true,
      processedConversations: convs.length,
      sentEmails: sentCount,
      skippedConversations: skippedCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error('[Unread Notifications Cron Critical Error]:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
