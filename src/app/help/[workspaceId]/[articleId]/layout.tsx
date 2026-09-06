import type { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';

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
        .from('workspaces')
        .select('id, name')
        .eq('id', workspaceId)
        .maybeSingle()
    : await supabase
        .from('workspaces')
        .select('id, name')
        .or(`slug.eq.${workspaceId},custom_domain.eq.${workspaceId}`)
        .maybeSingle();

  if (!ws) return { title: 'Help Center' };

  const { data: article } = isUuid(articleId)
    ? await supabase
        .from('articles')
        .select('title, summary')
        .eq('id', articleId)
        .maybeSingle()
    : await supabase
        .from('articles')
        .select('title, summary')
        .eq('workspace_id', ws.id)
        .eq('slug', articleId)
        .maybeSingle();

  if (!article) return { title: `${ws.name} Help Center` };

  const title = `${article.title} — ${ws.name} Help Center`;
  const description =
    article.summary || `Help article from the ${ws.name} team.`;

  return {
    title,
    description,
    openGraph: { title, description, siteName: ws.name, type: 'article' },
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
