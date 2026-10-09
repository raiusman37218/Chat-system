import type { ChannelAdapter, ChannelId } from './types';
import { whatsappAdapter } from './whatsapp/adapter';

/**
 * Every channel the app can talk to. The integrations page, the webhook
 * routes and the outbound worker all look adapters up here, so a channel is
 * live everywhere once it is registered (plus its entries in the channels
 * migration).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- each adapter has its own credential shape.
const ADAPTERS: Record<ChannelId, ChannelAdapter<any, any>> = {
  whatsapp: whatsappAdapter,
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
    description: 'Instagram direct messages. Not available yet.',
    available: false,
  },
  {
    id: 'messenger',
    label: 'Facebook Messenger',
    description: 'Messages to your Facebook Page. Not available yet.',
    available: false,
  },
];
