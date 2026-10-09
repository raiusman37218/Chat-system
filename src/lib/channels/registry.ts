import type { ChannelAdapter, ChannelId } from './types';
import { whatsappAdapter } from './whatsapp/adapter';
import { instagramAdapter } from './instagram/adapter';
import { emailAdapter } from './email/adapter';

/**
 * Every channel the app can talk to. The integrations page, the webhook
 * routes and the outbound worker all look adapters up here, so a channel is
 * live everywhere once it is registered (plus its entries in the channels
 * migration).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- each adapter has its own credential shape.
const ADAPTERS: Record<ChannelId, ChannelAdapter<any, any>> = {
  whatsapp: whatsappAdapter,
  instagram: instagramAdapter,
  email: emailAdapter,
};

export function getAdapter(channel: string | null | undefined): ChannelAdapter<unknown, unknown> | null {
  return channel && channel in ADAPTERS ? ADAPTERS[channel as ChannelId] : null;
}

export function isChannelId(value: unknown): value is ChannelId {
  return typeof value === 'string' && value in ADAPTERS;
}

/** What the integrations page lists. Planned channels show as "coming soon" cards. */
export interface ChannelCatalogEntry {
  id: string;
  label: string;
  description: string;
  available: boolean;
}

export const CHANNEL_CATALOG: ChannelCatalogEntry[] = [
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    description: 'Answer WhatsApp messages as tickets through the official WhatsApp Business Cloud API.',
    available: true,
  },
  {
    id: 'instagram',
    label: 'Instagram',
    description: 'Answer Instagram DMs, story replies and story mentions as tickets, for a professional (Business or Creator) account.',
    available: true,
  },
  {
    id: 'email',
    label: 'Email',
    description: 'Give your team a support address: emails become tickets, and replies go out as branded emails from your address.',
    available: true,
  },
  {
    id: 'messenger',
    label: 'Facebook Messenger',
    description: 'Messages to your Facebook Page. Not available yet.',
    available: false,
  },
];
