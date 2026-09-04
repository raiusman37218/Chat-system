'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Building2, Settings, ArrowLeft } from 'lucide-react';
import { Workspace, Agent, CannedResponse } from '@/types/database';
import { CompaniesAdminDashboard } from '@/components/admin/CompaniesAdminDashboard';
import { AdminSettingsPanel } from '@/components/admin/AdminSettingsPanel';
import { cn } from '@/lib/utils';

interface AdminClientLayoutProps {
  workspace: Workspace;
  agent: Agent;
  initialAgents: Agent[];
  initialCannedResponses: CannedResponse[];
}

export function AdminClientLayout({
  workspace: initialWorkspace,
  agent,
  initialAgents,
  initialCannedResponses,
}: AdminClientLayoutProps) {
  const [activeTab, setActiveTab] = useState<'companies' | 'settings'>('companies');
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace>(initialWorkspace);

  return (
    <div className="flex h-screen bg-canvas overflow-hidden">
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
            title={`Logged in as ${agent.name} (${agent.role})`}
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
        ) : (
          <AdminSettingsPanel
            workspace={currentWorkspace}
            currentAgent={agent}
            initialAgents={initialAgents}
            initialCannedResponses={initialCannedResponses}
          />
        )}
      </div>
    </div>
  );
}
