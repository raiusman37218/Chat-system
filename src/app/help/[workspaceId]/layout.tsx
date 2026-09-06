import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { getWorkspaceHelpCenterUrl } from '@/lib/domain';

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://vfjsaynnubxywdbevxtx.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * The help centre pages are client components, so they cannot export
 * `generateMetadata` themselves — a `<title>` written in their JSX loses to the
 * root layout's metadata. The result was every customer's help centre, on their
 * own domain, showing "Chatify — Live chat…" in the browser tab and in search
 * results. This server layout puts the workspace's own name back on the page.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}): Promise<Metadata> {
  const { workspaceId } = await params;

  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      workspaceId
    );

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const { data: ws } = isUuid
    ? await supabase
        .from('public_workspaces')
        .select(
          'id, name, slug, custom_domain, custom_domain_status, help_center_title, help_center_subtitle, logo_url, help_center_logo_url, website_url'
        )
        .eq('id', workspaceId)
        .maybeSingle()
    : await supabase
        .from('public_workspaces')
        .select(
          'id, name, slug, custom_domain, custom_domain_status, help_center_title, help_center_subtitle, logo_url, help_center_logo_url, website_url'
        )
        .or(`slug.eq.${workspaceId},custom_domain.eq.${workspaceId}`)
        .maybeSingle();

  if (!ws) {
    return { title: 'Help Center' };
  }

  const helpTitle = (ws as any).help_center_title || ws.name;
  const title = `${helpTitle} Help Center`;
  const description =
    (ws as any).help_center_subtitle ||
    `Guides, troubleshooting steps and answers from the ${helpTitle} team.`;

  // The same help centre is reachable both on the platform path and on the
  // customer's domain. Without a canonical, search engines see two copies of
  // every article and split the ranking between them.
  const h = await headers();
  const canonical = getWorkspaceHelpCenterUrl(ws as any, null, {
    host: h.get('x-forwarded-host') || h.get('host'),
  });

  let domain = '';
  if (ws.website_url) {
    try {
      const u = new URL(
        ws.website_url.startsWith('http') ? ws.website_url : `https://${ws.website_url}`
      );
      domain = u.hostname;
    } catch {}
  } else if (ws.custom_domain) {
    domain = ws.custom_domain;
  }

  const rawLogo =
    (ws as any).help_center_logo_url?.trim() || (ws as any).logo_url?.trim();
  const faviconUrl =
    rawLogo ||
    (domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128` : '/favicon.ico');

  return {
    title,
    description,
    icons: {
      icon: [
        { url: faviconUrl },
        ...(domain
          ? [
              {
                url: `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
                sizes: '128x128',
                type: 'image/png',
              },
            ]
          : []),
      ],
      shortcut: faviconUrl,
      apple: [
        { url: faviconUrl },
        ...(domain
          ? [
              {
                url: `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
                sizes: '128x128',
                type: 'image/png',
              },
            ]
          : []),
      ],
    },
    alternates: { canonical },
    // Nothing here should advertise the platform: this page belongs to the
    // customer's brand, on the customer's domain.
    openGraph: {
      title,
      description,
      siteName: helpTitle,
      type: 'website',
      url: canonical,
      ...(rawLogo ? { images: [{ url: rawLogo }] } : {}),
    },
    twitter: {
      card: 'summary',
      title,
      description,
      ...(rawLogo ? { images: [rawLogo] } : {}),
    },
  };
}

export default function HelpCenterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
