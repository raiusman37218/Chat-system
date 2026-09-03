import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function HelpRootPage() {
  const supabase = await createClient();

  // Redirect to first active workspace or fallback default
  const { data: ws } = await supabase
    .from('workspaces')
    .select('id')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  const targetId = ws?.id || 'a0000000-0000-0000-0000-000000000001';
  redirect(`/help/${targetId}`);
}
