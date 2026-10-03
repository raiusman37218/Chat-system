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

  let finalArticle = article;
  if (!finalArticle && !isUuid(cleanArticleId)) {
    const { data: redir } = await supabase
      .from('article_slug_redirects')
      .select('article_id')
      .eq('workspace_id', ws.id)
      .ilike('old_slug', cleanArticleId)
      .maybeSingle();

    if (redir?.article_id) {
      const { data: redirectedArt } = await supabase
        .from('articles')
        .select('id, slug, title, summary')
        .eq('id', redir.article_id)
        .eq('workspace_id', ws.id)
        .eq('status', 'published')
        .maybeSingle();
      finalArticle = redirectedArt;
    }
  }

  const helpTitle = (ws as any).help_center_title || ws.name;
  if (!finalArticle) return { title: `${helpTitle} Help Center` };

  const title = `${finalArticle.title} — ${helpTitle} Help Center`;
  const description =
    finalArticle.summary || `Help article from the ${helpTitle} team.`;

  // See the parent layout: one article, two reachable URLs, one canonical.
  const h = await headers();
  const canonical = getWorkspaceHelpCenterUrl(ws as any, finalArticle, {
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

import { redirect } from 'next/navigation';

export default async function HelpArticleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspaceId: string; articleId: string }>;
}) {
  const { workspaceId, articleId } = await params;
  const isUuid = (v: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

  const cleanArticleId = decodeURIComponent(articleId).trim();

  // If this is a slug (not a UUID), check if it's an old redirected slug
  if (!isUuid(cleanArticleId)) {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data: ws } = isUuid(workspaceId)
      ? await supabase
          .from('public_workspaces')
          .select('id, name, slug, custom_domain, custom_domain_status')
          .eq('id', workspaceId)
          .maybeSingle()
      : await supabase
          .from('public_workspaces')
          .select('id, name, slug, custom_domain, custom_domain_status')
          .or(`slug.eq.${workspaceId},custom_domain.eq.${workspaceId}`)
          .maybeSingle();

    if (ws) {
      // Check if current article exists with this slug
      const { data: currentArt } = await supabase
        .from('articles')
        .select('id, slug')
        .eq('workspace_id', ws.id)
        .ilike('slug', cleanArticleId)
        .eq('status', 'published')
        .maybeSingle();

      // If no published article currently has this slug, check article_slug_redirects
      if (!currentArt) {
        const { data: redir } = await supabase
          .from('article_slug_redirects')
          .select('article_id')
          .eq('workspace_id', ws.id)
          .ilike('old_slug', cleanArticleId)
          .maybeSingle();

        if (redir?.article_id) {
          const { data: targetArt } = await supabase
            .from('articles')
            .select('id, slug')
            .eq('id', redir.article_id)
            .eq('status', 'published')
            .maybeSingle();

          if (targetArt) {
            const h = await headers();
            const destination = getWorkspaceHelpCenterUrl(ws as any, targetArt, {
              host: h.get('x-forwarded-host') || h.get('host'),
            });
            redirect(destination);
          }
        }
      }
    }
  }

  return children;
}
