/**
 * Sends what rules asked for. The database can only queue emails and webhooks
 * (automation_outbox); this drains the queue. It runs hourly from
 * /api/cron/run-automations and, so a reply or an edit does not wait for the
 * hour, after ticket actions from agents.
 *
 * Service role: the outbox has no row level security policy on purpose, and
 * every row already carries the workspace it belongs to.
 */
import { createHmac } from 'node:crypto';
import { lookup } from 'node:dns/promises';
import { serviceClient } from '@/lib/supabase/service';
import { isValidEmail, sendSmtpEmail } from '@/lib/email/smtp';
import { isPrivateAddress, isSafeWebhookUrl } from '@/lib/automation/rules';
import type { SMTPSettingsConfig } from '@/types/database';
import { emailConfig } from '@/lib/channels/email/config';
import { composeNotification } from '@/lib/channels/email/compose';
import { getEmailProvider } from '@/lib/channels/email/providers';
import { isSuppressed, loadBrand, senderSettingsFrom, type EmailSettings } from '@/lib/channels/email/runtime';
import type { NotificationTemplate } from '@/lib/channels/email/template';
import { getConnection } from '@/lib/channels/store';

const MAX_ATTEMPTS = 5;
const CLAIM_MINUTES = 5;

interface OutboxRow {
  id: string;
  workspace_id: string;
  kind: 'email_requester' | 'email_agent' | 'webhook';
  payload: Record<string, unknown>;
  attempts: number;
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

/** Backoff: 1, 5, 25, 125 minutes. */
export function retryDelayMinutes(attemptsSoFar: number): number {
  return Math.pow(5, Math.max(0, attemptsSoFar - 1));
}

/** The requester notifications (received / replied / solved): branded mail through the email channel. */
async function sendNotification(row: OutboxRow, to: string): Promise<{ ok: boolean; error?: string; permanent?: boolean }> {
  const template = String(row.payload.template) as NotificationTemplate;
  if (!['received', 'replied', 'solved'].includes(template)) return { ok: false, error: 'Unknown notification.', permanent: true };
  const connection = await getConnection(row.workspace_id, 'email');
  if (!connection || connection.status === 'disconnected') {
    return { ok: false, error: 'The email channel is not enabled (Settings → Channels → Email).', permanent: true };
  }
  const cfg = emailConfig();
  const provider = getEmailProvider();
  if (!cfg.tokenSecret || !provider.isConfigured()) return { ok: false, error: 'The email provider is not configured on the server.', permanent: true };
  if (await isSuppressed(row.workspace_id, to)) return { ok: false, error: `${to} is blocked because an earlier email to it bounced.`, permanent: true };

  const email = composeNotification({
    workspace: await loadBrand(row.workspace_id),
    sender: senderSettingsFrom((connection.settings || {}) as EmailSettings, connection.external_account_id || ''),
    tokenSecret: cfg.tokenSecret,
    to: { email: to, name: String(row.payload.requester_name ?? '') || undefined },
    template,
    ticket: { number: Number(row.payload.ticket_number), subject: String(row.payload.ticket_subject ?? '') },
    agentName: String(row.payload.agent_name ?? '') || null,
    reply: String(row.payload.reply ?? '') || null,
  });
  const result = await provider.send(email);
  if (result.ok) return { ok: true };
  return { ok: false, error: result.error, permanent: !result.retryable };
}

async function sendEmail(row: OutboxRow): Promise<{ ok: boolean; error?: string; permanent?: boolean }> {
  const to = String(row.payload.to ?? '');
  if (!isValidEmail(to)) return { ok: false, error: 'The recipient has no valid email address.', permanent: true };
  if (row.payload.template) return sendNotification(row, to);
  const { data: ws } = await serviceClient().from('workspaces').select('smtp_settings').eq('id', row.workspace_id).maybeSingle();
  const smtp = ws?.smtp_settings as SMTPSettingsConfig | null | undefined;
  if (!smtp?.enabled || !smtp.host || !smtp.user || !smtp.pass) {
    return { ok: false, error: 'SMTP is not set up for this workspace (Settings → Channels → Email).', permanent: true };
  }
  const body = String(row.payload.body ?? '');
  const sent = await sendSmtpEmail(smtp, {
    to,
    subject: String(row.payload.subject ?? '').slice(0, 200),
    text: body,
    html: `<div style="font-family:sans-serif;white-space:pre-wrap;line-height:1.5">${escapeHtml(body)}</div>`,
  });
  return sent.success ? { ok: true } : { ok: false, error: sent.error || 'Email could not be sent.' };
}

async function sendWebhook(row: OutboxRow): Promise<{ ok: boolean; error?: string; permanent?: boolean }> {
  const url = String(row.payload.url ?? '');
  if (!isSafeWebhookUrl(url)) return { ok: false, error: 'The webhook address is not a public https URL.', permanent: true };
  // The name may resolve to a private address; check what it points at now.
  const host = new URL(url).hostname.replace(/^\[|\]$/g, '');
  try {
    const addresses = await lookup(host, { all: true });
    if (addresses.some((a) => isPrivateAddress(a.address))) {
      return { ok: false, error: 'The webhook address resolves to a private network.', permanent: true };
    }
  } catch {
    return { ok: false, error: 'The webhook address could not be resolved.' };
  }

  const body = JSON.stringify({ event: row.payload.event, rule: row.payload.rule, ticket: row.payload.ticket });
  const headers: Record<string, string> = { 'Content-Type': 'application/json', 'User-Agent': 'Zentry-Webhook/1', 'X-Zentry-Event': String(row.payload.event ?? '') };
  const secret = typeof row.payload.secret === 'string' ? row.payload.secret : '';
  if (secret) headers['X-Zentry-Signature'] = `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`;
  try {
    // Redirects are not followed: a public host must not bounce us to a private one.
    const res = await fetch(url, { method: 'POST', headers, body, redirect: 'manual', signal: AbortSignal.timeout(8000) });
    return res.status >= 200 && res.status < 300 ? { ok: true } : { ok: false, error: `The endpoint answered ${res.status}.` };
  } catch (e) {
    return { ok: false, error: (e as Error).message || 'The endpoint could not be reached.' };
  }
}

/** Sends due rows. Returns how many were sent and how many failed for good. */
export async function processAutomationOutbox(opts: { workspaceId?: string; limit?: number } = {}): Promise<{ sent: number; failed: number }> {
  const supabase = serviceClient();
  let query = supabase
    .from('automation_outbox')
    .select('id, workspace_id, kind, payload, attempts')
    .eq('status', 'pending')
    .lte('next_attempt_at', new Date().toISOString())
    .order('created_at')
    .limit(opts.limit ?? 25);
  if (opts.workspaceId) query = query.eq('workspace_id', opts.workspaceId);
  const { data, error } = await query;
  if (error) {
    console.error('[Automation Outbox Error]:', error);
    return { sent: 0, failed: 0 };
  }

  let sent = 0;
  let failed = 0;
  for (const row of (data || []) as OutboxRow[]) {
    // Claim the row: push its next attempt out first, so a second worker skips it.
    const claim = await supabase
      .from('automation_outbox')
      .update({ attempts: row.attempts + 1, next_attempt_at: new Date(Date.now() + CLAIM_MINUTES * 60_000).toISOString() })
      .eq('id', row.id)
      .eq('status', 'pending')
      .eq('attempts', row.attempts)
      .select('id')
      .maybeSingle();
    if (!claim.data) continue;

    const result = row.kind === 'webhook' ? await sendWebhook(row) : await sendEmail(row);
    const attempts = row.attempts + 1;
    if (result.ok) {
      sent++;
      await supabase.from('automation_outbox').update({ status: 'sent', sent_at: new Date().toISOString(), last_error: null }).eq('id', row.id);
    } else if (result.permanent || attempts >= MAX_ATTEMPTS) {
      failed++;
      await supabase.from('automation_outbox').update({ status: 'failed', last_error: result.error ?? 'Failed' }).eq('id', row.id);
      console.error('[Automation Outbox Error]:', row.kind, result.error);
    } else {
      await supabase
        .from('automation_outbox')
        .update({ last_error: result.error ?? 'Failed', next_attempt_at: new Date(Date.now() + retryDelayMinutes(attempts) * 60_000).toISOString() })
        .eq('id', row.id);
    }
  }
  return { sent, failed };
}
