'use server';

/**
 * Channel settings: connect, test and disconnect a workspace's messaging
 * channels (Settings → Channels). Every action checks the caller's role
 * first; connection rows are read through the caller's session (RLS), while
 * credentials are written and read only by server code with the service role
 * (src/lib/channels/store.ts), encrypted.
 */

import { getWorkspaceAccess } from '@/lib/team/access';
import { hasServiceRole } from '@/lib/supabase/service';
import { hasEncryptionKey, randomToken } from '@/lib/channels/crypto';
import { CHANNEL_CATALOG, getAdapter, isChannelId, type ChannelCatalogEntry } from '@/lib/channels/registry';
import { deleteSecrets, getConnection, loadConnection, recordConnectionError, saveConnection, updateConnection } from '@/lib/channels/store';
import { exchangeSignupCode } from '@/lib/channels/whatsapp/graph';
import { normalizePhone, type WhatsAppCredentials } from '@/lib/channels/whatsapp/adapter';
import type { MessageTemplate } from '@/lib/channels/types';
import type { Capability } from '@/lib/team/permissions';
import type { ChannelConnection } from '@/types/database';

type Result<T = object> = ({ success: true } & T) | { success: false; error: string };

function fail(err: unknown, fallback: string): { success: false; error: string } {
  const message = err instanceof Error && err.message ? err.message : fallback;
  return { success: false, error: message };
}

async function guard(workspaceId: string, capability: Capability) {
  const access = await getWorkspaceAccess(workspaceId, capability);
  if (!hasServiceRole()) throw new Error('The server is missing SUPABASE_SERVICE_ROLE_KEY, so channels cannot be managed.');
  if (!hasEncryptionKey()) throw new Error('The server is missing CHANNEL_ENCRYPTION_KEY, so channel credentials cannot be stored safely.');
  return access;
}

function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '');
}

/* ── Overview ─────────────────────────────────────────────────────────── */

export interface ChannelCard extends ChannelCatalogEntry {
  connection: ChannelConnection | null;
  /** Manual setup: where to point the customer's Meta app, and the token to give it. */
  manualWebhook: { url: string; verifyToken: string } | null;
}

export interface ChannelsOverview {
  cards: ChannelCard[];
  /** What the server is missing; the page explains each one instead of failing later. */
  setupProblems: string[];
  /** Present when the platform Meta app is configured for Embedded Signup. */
  embeddedSignup: { appId: string; configId: string; graphVersion: string } | null;
  platformWebhookUrl: string | null;
}

export async function getChannelsOverviewAction(workspaceId: string): Promise<Result<{ overview: ChannelsOverview }>> {
  try {
    const { supabase } = await getWorkspaceAccess(workspaceId, 'manage_settings');
    const { data, error } = await supabase.from('channel_connections').select('*').eq('workspace_id', workspaceId);
    if (error) throw new Error(`Could not load channels: ${error.message}`);
    const rows = (data as ChannelConnection[]) || [];

    const setupProblems: string[] = [];
    if (!hasServiceRole()) setupProblems.push('SUPABASE_SERVICE_ROLE_KEY is not set on the server.');
    if (!hasEncryptionKey()) setupProblems.push('CHANNEL_ENCRYPTION_KEY is not set (or is not 32 bytes) on the server.');
    if (!appUrl()) setupProblems.push('NEXT_PUBLIC_APP_URL is not set, so webhook URLs cannot be shown.');

    const cards: ChannelCard[] = [];
    for (const entry of CHANNEL_CATALOG) {
      const connection = rows.find((r) => r.channel === entry.id) || null;
      let manualWebhook: ChannelCard['manualWebhook'] = null;
      if (connection && connection.setup_method === 'manual' && connection.status !== 'disconnected' && hasServiceRole() && hasEncryptionKey()) {
        const loaded = await loadConnection<WhatsAppCredentials>(workspaceId, entry.id).catch(() => null);
        if (loaded?.credentials.verifyToken) {
          manualWebhook = { url: `${appUrl()}/api/channels/${entry.id}/webhook/${connection.id}`, verifyToken: loaded.credentials.verifyToken };
        }
      }
      cards.push({ ...entry, connection, manualWebhook });
    }

    const appId = process.env.META_APP_ID;
    const configId = process.env.META_WHATSAPP_CONFIG_ID;
    return {
      success: true,
      overview: {
        cards,
        setupProblems,
        embeddedSignup:
          appId && configId && process.env.META_APP_SECRET
            ? { appId, configId, graphVersion: process.env.META_GRAPH_API_VERSION || 'v23.0' }
            : null,
        platformWebhookUrl: appUrl() ? `${appUrl()}/api/channels/whatsapp/webhook` : null,
      },
    };
  } catch (err) {
    return fail(err, 'Could not load channels.');
  }
}

/* ── Connecting ───────────────────────────────────────────────────────── */

export async function connectWhatsAppManualAction(
  workspaceId: string,
  input: { phoneNumberId: string; wabaId: string; accessToken: string; appSecret: string }
): Promise<Result<{ connection: ChannelConnection }>> {
  try {
    const { user } = await guard(workspaceId, 'manage_settings');
    const appSecret = (input.appSecret || '').trim();
    if (!/^[0-9a-f]{32}$/i.test(appSecret)) {
      throw new Error('The app secret is the 32-character value under App settings → Basic in your Meta app.');
    }
    // Reconnecting keeps the verify token, so the webhook set up in Meta keeps working.
    const existing = await loadConnection<WhatsAppCredentials>(workspaceId, 'whatsapp').catch(() => null);
    const credentials: WhatsAppCredentials = {
      accessToken: (input.accessToken || '').trim(),
      appSecret,
      verifyToken: existing?.credentials.verifyToken || randomToken(),
    };
    const adapter = getAdapter('whatsapp')!;
    const account = await adapter.connect({ phoneNumberId: input.phoneNumberId, wabaId: input.wabaId }, credentials);
    const connection = await saveConnection({
      workspaceId,
      channel: 'whatsapp',
      userId: user.id,
      setupMethod: 'manual',
      ...account,
      settings: { ...account.settings, webhook_verified_at: existing?.connection.settings?.webhook_verified_at ?? null },
      credentials,
    });
    return { success: true, connection };
  } catch (err) {
    return fail(err, 'Could not connect WhatsApp.');
  }
}

export async function completeWhatsAppSignupAction(
  workspaceId: string,
  input: { code: string; phoneNumberId: string; wabaId: string }
): Promise<Result<{ connection: ChannelConnection }>> {
  try {
    const { user } = await guard(workspaceId, 'manage_settings');
    if (!input.code) throw new Error('Meta did not return an authorisation code. Try connecting again.');
    const accessToken = await exchangeSignupCode(input.code);
    // Webhooks for embedded signup arrive at the platform URL, signed with the platform app secret.
    const credentials: WhatsAppCredentials = { accessToken };
    const account = await getAdapter('whatsapp')!.connect({ phoneNumberId: input.phoneNumberId, wabaId: input.wabaId }, credentials);
    const connection = await saveConnection({
      workspaceId,
      channel: 'whatsapp',
      userId: user.id,
      setupMethod: 'embedded_signup',
      ...account,
      credentials,
    });
    return { success: true, connection };
  } catch (err) {
    return fail(err, 'Could not finish connecting WhatsApp.');
  }
}

/* ── Testing, templates, disconnecting ────────────────────────────────── */

export async function sendChannelTestMessageAction(
  workspaceId: string,
  channel: string,
  input: { to: string; templateName: string; language: string }
): Promise<Result<{ providerMessageId: string }>> {
  try {
    await guard(workspaceId, 'manage_settings');
    if (!isChannelId(channel)) throw new Error('Unknown channel.');
    const to = normalizePhone(input.to);
    if (to.length < 8) throw new Error('Enter the full number with its country code, e.g. +1 650 555 1234.');
    const conn = await loadConnection<unknown>(workspaceId, channel);
    if (!conn || conn.connection.status === 'disconnected') throw new Error('Connect the channel first.');
    // A test goes to someone who has not written in: WhatsApp only allows a template.
    const result = await getAdapter(channel)!.sendMessage(conn, to, {
      type: 'template',
      template: { name: input.templateName || 'hello_world', language: input.language || 'en_US' },
    });
    if (!result.ok) {
      await recordConnectionError(conn.connection.id, result.error, Boolean(result.needsAttention));
      return { success: false, error: result.error };
    }
    await updateConnection(conn.connection.id, {
      last_outbound_at: new Date().toISOString(),
      last_error: null,
      last_error_at: null,
      ...(conn.connection.status === 'needs_attention' ? { status: 'connected' as const } : {}),
    });
    return { success: true, providerMessageId: result.providerMessageId };
  } catch (err) {
    return fail(err, 'Could not send the test message.');
  }
}

export async function listChannelTemplatesAction(workspaceId: string, channel: string): Promise<Result<{ templates: MessageTemplate[] }>> {
  try {
    await guard(workspaceId, 'reply');
    if (!isChannelId(channel)) throw new Error('Unknown channel.');
    const conn = await loadConnection<unknown>(workspaceId, channel);
    if (!conn || conn.connection.status === 'disconnected') throw new Error('This channel is not connected.');
    return { success: true, templates: await getAdapter(channel)!.listTemplates(conn) };
  } catch (err) {
    return fail(err, 'Could not load templates.');
  }
}

export async function disconnectChannelAction(workspaceId: string, channel: string): Promise<Result> {
  try {
    const { supabase } = await guard(workspaceId, 'manage_settings');
    if (!isChannelId(channel)) throw new Error('Unknown channel.');
    const connection = await getConnection(workspaceId, channel);
    if (!connection) return { success: true };
    const loaded = await loadConnection<unknown>(workspaceId, channel).catch(() => null);
    if (loaded) {
      // Best effort: stop Meta sending this account's webhooks to us. A revoked
      // token must not stop the admin from disconnecting.
      await getAdapter(channel)!
        .disconnect(loaded)
        .catch((err) => console.warn('[Channels] Could not unsubscribe on disconnect:', (err as Error).message));
    }
    await deleteSecrets(connection.id);
    const { error } = await supabase
      .from('channel_connections')
      .update({ status: 'disconnected', last_error: null, last_error_at: null })
      .eq('id', connection.id)
      .eq('workspace_id', workspaceId);
    if (error) throw new Error(`Could not disconnect: ${error.message}`);
    return { success: true };
  } catch (err) {
    return fail(err, 'Could not disconnect.');
  }
}
