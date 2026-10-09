import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Agent, Workspace, CannedResponse } from '@/types/database';
import { AdminClientLayout } from '@/app/admin/AdminClientLayout';

export default async function AdminAuditPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/admin/audit');
  }

  // Verify server-side platform super admin flag from database
  const { data: agent } = await supabase
    .from('agents')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!agent?.is_super_admin) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-invert text-white p-6">
        <div className="max-w-md w-full p-8 rounded-2xl border border-danger/20 bg-danger/5 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-danger/10 text-danger flex items-center justify-center mx-auto text-xl font-bold">
            403
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">403 - Forbidden</h1>
          <p className="text-sm text-ink-3">
            Access denied. Platform super administrator privileges are required to view this page.
          </p>
          <a
            href="/dashboard"
            className="inline-block px-4 py-2 rounded-xl bg-invert hover:bg-ink-2 text-white text-xs font-semibold transition-colors"
          >
            Return to Dashboard
          </a>
        </div>
      </div>
    );
  }

  const workspaceId = agent.workspace_id || 'a0000000-0000-0000-0000-000000000001';

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
      initialTab="audit"
    />
  );
}
