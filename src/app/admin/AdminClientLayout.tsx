'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Building2, Settings, ArrowLeft, ShieldAlert, LogOut, ExternalLink } from 'lucide-react';
import { Workspace, Agent, CannedResponse } from '@/types/database';
import { CompaniesAdminDashboard } from '@/components/admin/CompaniesAdminDashboard';
import { SettingsHub } from '@/components/dashboard/SettingsHub';
import { SuperAdminAuditLogView } from '@/components/admin/SuperAdminAuditLogView';
import { exitSuperAdminWorkspaceViewAction } from '@/app/actions/platform';
import { cn } from '@/lib/utils';

interface AdminClientLayoutProps {
  workspace: Workspace;
  agent: Agent;
  initialAgents: Agent[];
  initialCannedResponses: CannedResponse[];
  initialTab?: 'companies' | 'audit' | 'settings';
}

export function AdminClientLayout({
  workspace: initialWorkspace,
  agent,
  initialAgents,
  initialCannedResponses,
  initialTab = 'companies',
}: AdminClientLayoutProps) {
  const [activeTab, setActiveTab] = useState<'companies' | 'audit' | 'settings'>(initialTab);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace>(initialWorkspace);

  const isSwitched = currentWorkspace.id !== agent.workspace_id;

  const handleExitSwitch = async () => {
    await exitSuperAdminWorkspaceViewAction();
    setCurrentWorkspace(initialWorkspace);
  };

  return (
    <div className="flex flex-col h-screen bg-canvas overflow-hidden">
      {/* Super Admin Switch Banner */}
      {isSwitched && (
        <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 text-white px-6 py-2.5 text-xs font-semibold flex items-center justify-between shadow-md z-30 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-ping" />
            <ShieldAlert className="w-4 h-4 text-amber-300" />
            <span>
              Viewing as super admin: <strong className="underline underline-offset-2">{currentWorkspace.name}</strong>{' '}
              <span className="opacity-80 font-mono text-[11px]">({currentWorkspace.id})</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white text-[11.5px] font-bold flex items-center gap-1.5 transition-colors"
            >
              <span>Open Workspace Inbox</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
            <button
              onClick={handleExitSwitch}
              className="px-3 py-1 rounded-lg bg-red-500/80 hover:bg-red-600 text-white text-[11.5px] font-bold flex items-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3 h-3" />
              <span>Exit Super Admin View</span>
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Mini Icon Rail */}
        <aside className="w-16 bg-surface border-r border-line flex flex-col items-center justify-between py-4 shrink-0 z-20">
          <div className="flex flex-col items-center gap-5">
            {/* Logo */}
            <Link
              href="/dashboard"
              title="Return to Agent Inbox"
              className="w-10 h-10 rounded-xl bg-accent text-accent-ink flex items-center justify-center font-bold text-sm shadow-xs hover:opacity-90 transition-opacity"
            >
              <img src="/logo.png" alt="Chatify" className="w-6 h-6 object-contain" />
            </Link>

            {/* Nav Tabs */}
            <nav className="flex flex-col items-center gap-2">
              <button
                onClick={() => setActiveTab('companies')}
                title="All Companies (Platform Admin)"
                className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center transition-colors',
                  activeTab === 'companies'
                    ? 'bg-accent text-accent-ink shadow-xs font-bold'
                    : 'text-ink-3 hover:text-ink hover:bg-surface-2'
                )}
              >
                <Building2 className="w-5 h-5" />
              </button>

              <button
                onClick={() => setActiveTab('audit')}
                title="Super Admin Audit Log"
                className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center transition-colors',
                  activeTab === 'audit'
                    ? 'bg-accent text-accent-ink shadow-xs font-bold'
                    : 'text-ink-3 hover:text-ink hover:bg-surface-2'
                )}
              >
                <ShieldAlert className="w-5 h-5" />
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                title="Workspace Settings & Team"
                className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center transition-colors',
                  activeTab === 'settings'
                    ? 'bg-accent text-accent-ink shadow-xs font-bold'
                    : 'text-ink-3 hover:text-ink hover:bg-surface-2'
                )}
              >
                <Settings className="w-5 h-5" />
              </button>
            </nav>
          </div>

          <div className="flex flex-col items-center gap-3">
            <Link
              href="/dashboard"
              title="Back to Agent Inbox"
              className="p-2.5 rounded-xl text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>

            <div
              className="w-9 h-9 rounded-full bg-accent/10 text-accent font-bold text-xs flex items-center justify-center border border-accent/20"
              title={`Logged in as ${agent.name} (Super Admin)`}
            >
              {agent.name.slice(0, 2).toUpperCase()}
            </div>
          </div>
        </aside>

        {/* Main Admin Tab View */}
        <div className="flex-1 flex overflow-hidden">
          {activeTab === 'companies' ? (
            <CompaniesAdminDashboard
              currentWorkspace={currentWorkspace}
              currentAgent={agent}
              onSwitchWorkspace={(newWs) => {
                setCurrentWorkspace(newWs);
              }}
            />
          ) : activeTab === 'audit' ? (
            <SuperAdminAuditLogView />
          ) : (
            <SettingsHub
              workspace={currentWorkspace}
              currentAgent={agent}
              agents={initialAgents}
              cannedResponses={initialCannedResponses}
              onWorkspaceUpdated={(newWs) => setCurrentWorkspace(newWs)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
