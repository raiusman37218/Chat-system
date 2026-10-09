import { NextResponse, after } from 'next/server';
import { handleWebhookChallenge, handleWebhookPost } from '@/lib/channels/inbound';
import { processOutboundQueue } from '@/lib/channels/outbound';
import { hasServiceRole } from '@/lib/supabase/service';

/**
 * Shared by the platform webhook URL (/api/channels/<channel>/webhook, used by
 * embedded signup) and the per-connection one
 * (/api/channels/<channel>/webhook/<connectionId>, used by manual setup with
 * the customer's own Meta app). All the logic is in src/lib/channels/inbound.ts.
 */

export async function verify(request: Request, channel: string, connectionId?: string) {
  const { status, body } = await handleWebhookChallenge(channel, new URL(request.url).searchParams, connectionId);
  return new NextResponse(body, { status, headers: { 'Content-Type': 'text/plain' } });
}

export async function receive(request: Request, channel: string, connectionId?: string) {
  if (!hasServiceRole()) {
    console.error('[Channels Webhook Error]: SUPABASE_SERVICE_ROLE_KEY is not set; cannot store inbound messages.');
    return NextResponse.json({ error: 'Not configured' }, { status: 503 });
  }
  // The signature covers the exact bytes Meta sent, so read text, not JSON.
  const rawBody = await request.text();
  const outcome = await handleWebhookPost({
    channel,
    rawBody,
    headers: request.headers,
    connectionId,
    origin: process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin,
  });
  // Answer Meta now; media downloads and the bot run after the response.
  for (const job of outcome.followUps) {
    after(() => job().catch((err) => console.error('[Channels Webhook Follow-up Error]:', err)));
  }
  // Webhooks arrive all day (receipts, messages): a cheap moment to send any
  // retries that have come due, so they do not wait for the daily cron.
  if (outcome.status === 200) {
    after(() => processOutboundQueue({ limit: 20 }).then(() => undefined));
  }
  return new NextResponse(outcome.body, { status: outcome.status, headers: { 'Content-Type': 'text/plain' } });
}
