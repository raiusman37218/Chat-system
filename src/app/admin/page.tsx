import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Agent, Workspace, CannedResponse } from '@/types/database';
import { AdminClientLayout } from '@/app/admin/AdminClientLayout';

export default async function AdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/admin');
  }

  // Verify role
  const { data: agent } = await supabase
    .from('agents')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!agent || (agent.role !== 'admin' && agent.role !== 'owner')) {
    redirect('/dashboard?error=unauthorized_admin_access');
  }

  const workspaceId = agent.workspace_id || 'a0000000-0000-0000-0000-000000000001';

  // Load initial workspace, team agents, and canned responses
  const [{ data: workspace }, { data: agents }, { data: cannedResponses }] = await Promise.all([
    supabase.from('workspaces').select('*').eq('id', workspaceId).single(),
    supabase.from('agents').select('*').eq('workspace_id', workspaceId).order('name'),
    supabase
      .from('canned_responses')
      .select('*')
      .or(`workspace_id.eq.${workspaceId},workspace_id.is.null`)
      .order('shortcut'),
  ]);

  if (!workspace) {
    redirect('/dashboard');
  }

  return (
    <AdminClientLayout
      workspace={workspace as Workspace}
      agent={agent as Agent}
      initialAgents={(agents as Agent[]) || []}
      initialCannedResponses={(cannedResponses as CannedResponse[]) || []}
    />
  );
}
