import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { getWorkspaceHelpCenterUrl } from '@/lib/domain';

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://vfjsaynnubxywdbevxtx.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/** Article pages are client components; see the parent layout for why. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ workspaceId: string; articleId: string }>;
}): Promise<Metadata> {
  const { workspaceId, articleId } = await params;

  const isUuid = (v: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  const { data: ws } = isUuid(workspaceId)
    ? await supabase
        .from('public_workspaces')
        .select(
          'id, name, slug, custom_domain, custom_domain_status, help_center_title, logo_url, help_center_logo_url, website_url'
        )
        .eq('id', workspaceId)
        .maybeSingle()
    : await supabase
        .from('public_workspaces')
        .select(
          'id, name, slug, custom_domain, custom_domain_status, help_center_title, logo_url, help_center_logo_url, website_url'
        )
        .or(`slug.eq.${workspaceId},custom_domain.eq.${workspaceId}`)
        .maybeSingle();

  if (!ws) return { title: 'Help Center' };

  const cleanArticleId = decodeURIComponent(articleId).trim();
  const { data: article } = isUuid(cleanArticleId)
    ? await supabase
        .from('articles')
        .select('id, slug, title, summary')
        .eq('id', cleanArticleId)
        .eq('workspace_id', ws.id)
        .eq('status', 'published')
        .maybeSingle()
    : await supabase
        .from('articles')
        .select('id, slug, title, summary')
        .eq('workspace_id', ws.id)
        .ilike('slug', cleanArticleId)
        .eq('status', 'published')
        .maybeSingle();

  const helpTitle = (ws as any).help_center_title || ws.name;
  if (!article) return { title: `${helpTitle} Help Center` };

  const title = `${article.title} — ${helpTitle} Help Center`;
  const description =
    article.summary || `Help article from the ${helpTitle} team.`;

  // See the parent layout: one article, two reachable URLs, one canonical.
  const h = await headers();
  const canonical = getWorkspaceHelpCenterUrl(ws as any, article, {
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
    openGraph: {
      title,
      description,
      siteName: helpTitle,
      type: 'article',
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

export default function HelpArticleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
