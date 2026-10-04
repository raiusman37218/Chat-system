import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function HelpRootPage() {
  const supabase = await createClient();

  // Priority 1: Dedicated Chatify workspace
  const { data: chatifyWs } = await supabase
    .from('public_workspaces')
    .select('id, slug')
    .or('slug.eq.chatify,name.ilike.Chatify')
    .limit(1)
    .maybeSingle();

  if (chatifyWs) {
    redirect(`/help/${chatifyWs.slug || chatifyWs.id}`);
  }

  // Priority 2: First active public workspace
  const { data: ws } = await supabase
    .from('public_workspaces')
    .select('id, slug')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  const target = ws?.slug || ws?.id || 'chatify';
  redirect(`/help/${target}`);
}
