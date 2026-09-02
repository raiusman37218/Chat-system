import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Agent, Workspace, CannedResponse } from '@/types/database';
import { AdminSettingsPanel } from '@/components/admin/AdminSettingsPanel';
import {  } from '@/components/dashboard/Sidebar';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

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
    <div className="flex h-screen bg-surface-2 overflow-hidden">
      {/* Sidebar with Back to Inbox link */}
      <div className="w-16 bg-surface border-r border-line flex flex-col items-center justify-between py-4 shrink-0">
        <div className="flex flex-col items-center gap-4">
          <Link
            href="/dashboard"
            title="Back to Inbox"
            className="w-10 h-10 rounded-xl bg-accent text-white flex items-center justify-center font-bold text-sm shadow-sm hover:opacity-90 transition-opacity"
          >
            C
          </Link>
          <Link
            href="/dashboard"
            title="Back to Agent Inbox"
            className="p-2.5 rounded-xl text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </div>

        <div className="w-9 h-9 rounded-full bg-accent/10 text-accent font-bold text-xs flex items-center justify-center">
          {agent.name.slice(0, 2).toUpperCase()}
        </div>
      </div>

      {/* Main Admin Settings View */}
      <AdminSettingsPanel
        workspace={workspace as Workspace}
        currentAgent={agent as Agent}
        initialAgents={(agents as Agent[]) || []}
        initialCannedResponses={(cannedResponses as CannedResponse[]) || []}
      />
    </div>
  );
}
