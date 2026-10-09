/**
 * The contract every messaging channel implements.
 *
 * The rest of the app never talks to WhatsApp (or, later, Instagram) directly:
 * webhooks are verified and parsed by the channel's adapter into the neutral
 * events below, the database turns those into tickets
 * (fn_channel_ingest_inbound), and the outbound worker hands queued replies
 * back to the same adapter. A new channel is one adapter plus its entry in
 * the registry and the channel lists in the channels migration.
 */
import type { ChannelConnection } from '@/types/database';

/** Channels with an adapter. Add to this union when a new adapter lands. */
export type ChannelId = 'whatsapp';

export type MediaKind = 'image' | 'video' | 'audio' | 'document' | 'sticker';

export interface InboundMedia {
  /** The provider's media id; fetch the bytes with adapter.downloadMedia. */
  id: string;
  kind: MediaKind;
  mimeType?: string;
  filename?: string;
}

/** A customer wrote to the business. */
export interface InboundMessageEvent {
  kind: 'message';
  /** The business account the message was sent to (WhatsApp phone number id): routes it to a workspace. */
  accountId: string;
  /** The provider's id for the message; the key that makes webhook retries harmless. */
  externalId: string;
  /** The customer's address on the channel (WhatsApp: their phone number in international format). */
  from: string;
  fromName?: string;
  sentAt: Date;
  /** What the inbox shows: the text, a caption, or a placeholder such as "[Image]". */
  text: string;
  media?: InboundMedia;
  /** The provider message type, kept for the record ("text", "image", "button", …). */
  type: string;
  /** The provider id of the message this one replies to, when the customer quoted one. */
  replyToExternalId?: string;
}

/** A message the business sent moved on: sent, delivered, read, or failed. */
export interface StatusEvent {
  kind: 'status';
  accountId: string;
  externalId: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  at: Date;
  error?: string;
}

export type ChannelEvent = InboundMessageEvent | StatusEvent;

export interface TemplateRef {
  name: string;
  /** Locale code, e.g. "en_US". */
  language: string;
  /** Values for the body's {{1}}, {{2}}, … placeholders, in order. */
  bodyParams?: string[];
}

export type OutboundContent =
  | { type: 'text'; text: string; replyToExternalId?: string }
  | { type: 'template'; template: TemplateRef };

export interface OutboundMedia {
  kind: Exclude<MediaKind, 'sticker'>;
  /** A public https URL the provider fetches the file from. */
  url: string;
  caption?: string;
  filename?: string;
}

export type SendResult =
  | { ok: true; providerMessageId: string }
  | {
      ok: false;
      error: string;
      /** Worth trying again later (rate limit, provider outage, network). */
      retryable: boolean;
      /** The connection itself is broken (expired token, number removed): an admin must act. */
      needsAttention?: boolean;
      /** The provider refused because only templates may be sent right now. */
      windowClosed?: boolean;
    };

export interface MessageTemplate {
  name: string;
  language: string;
  category: string;
  status: string;
  /** The body text with {{n}} placeholders. */
  body: string;
  /** How many {{n}} placeholders the body has. */
  paramCount: number;
}

/** The details a successful connect stores on channel_connections. */
export interface ConnectedAccount {
  externalAccountId: string;
  externalBusinessId: string | null;
  displayName: string;
  settings: Record<string, unknown>;
}

export interface ChannelContext<Credentials> {
  connection: Pick<ChannelConnection, 'id' | 'workspace_id' | 'external_account_id' | 'external_business_id' | 'settings'>;
  credentials: Credentials;
}

export interface WebhookRequest {
  /** The body exactly as received: signatures are computed over these bytes. */
  rawBody: string;
  headers: Headers;
}

export interface ChannelCapabilities {
  media: boolean;
  templates: boolean;
  readReceipts: boolean;
  /** Hours after the customer's last message during which free-form replies are allowed; null when unlimited. */
  serviceWindowHours: number | null;
}

export interface ChannelAdapter<Credentials = unknown, ConnectInput = unknown> {
  id: ChannelId;
  label: string;
  capabilities: ChannelCapabilities;

  /** Checks the credentials against the provider, subscribes to its webhooks, and returns what to store. */
  connect(input: ConnectInput, credentials: Credentials): Promise<ConnectedAccount>;

  /** The GET handshake providers make when a webhook URL is registered: the challenge to echo, or null. */
  verifyWebhookChallenge(query: URLSearchParams, expectedToken: string): string | null;
  /** True when a POST really comes from the provider. */
  verifyWebhookSignature(req: WebhookRequest, secret: string): boolean;
  /** Turns a verified webhook body into neutral events; unknown parts are skipped, never thrown on. */
  parseWebhook(body: unknown): ChannelEvent[];

  sendMessage(ctx: ChannelContext<Credentials>, to: string, content: OutboundContent): Promise<SendResult>;
  sendMedia(ctx: ChannelContext<Credentials>, to: string, media: OutboundMedia): Promise<SendResult>;
  /** Tells the customer their message was read (blue ticks). Best effort. */
  markRead(ctx: ChannelContext<Credentials>, externalId: string): Promise<void>;
  downloadMedia(ctx: ChannelContext<Credentials>, mediaId: string): Promise<{ data: Buffer; mimeType: string }>;
  listTemplates(ctx: ChannelContext<Credentials>): Promise<MessageTemplate[]>;

  /** Stops the provider sending webhooks for this account. Best effort; the connection is removed regardless. */
  disconnect(ctx: ChannelContext<Credentials>): Promise<void>;
}
