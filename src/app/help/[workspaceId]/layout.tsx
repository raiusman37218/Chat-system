import type { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';

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
        .from('workspaces')
        .select('name, custom_domain, custom_domain_status')
        .eq('id', workspaceId)
        .maybeSingle()
    : await supabase
        .from('workspaces')
        .select('name, custom_domain, custom_domain_status')
        .or(`slug.eq.${workspaceId},custom_domain.eq.${workspaceId}`)
        .maybeSingle();

  if (!ws) {
    return { title: 'Help Center' };
  }

  const title = `${ws.name} Help Center`;
  const description = `Guides, troubleshooting steps and answers from the ${ws.name} team.`;

  return {
    title,
    description,
    // Nothing here should advertise the platform: this page belongs to the
    // customer's brand, on the customer's domain.
    openGraph: { title, description, siteName: ws.name, type: 'website' },
    twitter: { card: 'summary', title, description },
  };
}

export default function HelpCenterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
