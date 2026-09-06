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
        .select('id, name, slug, custom_domain, custom_domain_status')
        .eq('id', workspaceId)
        .maybeSingle()
    : await supabase
        .from('public_workspaces')
        .select('id, name, slug, custom_domain, custom_domain_status')
        .or(`slug.eq.${workspaceId},custom_domain.eq.${workspaceId}`)
        .maybeSingle();

  if (!ws) return { title: 'Help Center' };

  const { data: article } = isUuid(articleId)
    ? await supabase
        .from('articles')
        .select('id, slug, title, summary')
        .eq('id', articleId)
        .eq('workspace_id', ws.id)
        .eq('status', 'published')
        .maybeSingle()
    : await supabase
        .from('articles')
        .select('id, slug, title, summary')
        .eq('workspace_id', ws.id)
        .eq('slug', articleId)
        .eq('status', 'published')
        .maybeSingle();

  if (!article) return { title: `${ws.name} Help Center` };

  const title = `${article.title} — ${ws.name} Help Center`;
  const description =
    article.summary || `Help article from the ${ws.name} team.`;

  // See the parent layout: one article, two reachable URLs, one canonical.
  const h = await headers();
  const canonical = getWorkspaceHelpCenterUrl(ws as any, article, {
    host: h.get('x-forwarded-host') || h.get('host'),
  });

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, siteName: ws.name, type: 'article', url: canonical },
    twitter: { card: 'summary', title, description },
  };
}

export default function HelpArticleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
