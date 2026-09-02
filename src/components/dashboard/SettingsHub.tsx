'use client';

import React, { useState } from 'react';
import {
  Bot,
  Clock,
  Code2,
  MessageSquareText,
  Palette,
  Share2,
  Users,
} from 'lucide-react';
import { Agent, CannedResponse, Workspace } from '@/types/database';
import { cn } from '@/lib/utils';
import { InstallationGuide } from '@/components/dashboard/InstallationGuide';
import {
  IntegrationsSettings,
  type IntegrationTab,
} from '@/components/dashboard/IntegrationsSettings';
import {
  AdminSettingsPanel,
  type AdminTab,
} from '@/components/admin/AdminSettingsPanel';

/**
 * One home for everything that configures the workspace.
 *
 * Install, Integrations and Admin used to be three separate top-level
 * destinations with thirteen tabs between them — including two different
 * screens for the same embed snippet. They are one destination now; the
 * underlying panels are reused, rendered without their own chrome.
 */

type SectionId =
  | 'install'
  | 'widget'
  | 'team'
  | 'replies'
  | 'routing'
  | 'ai'
  | 'channels';

interface Section {
  id: SectionId;
  label: string;
  description: string;
  Icon: typeof Code2;
  /** Sections marked admin-only are hidden from non-owner agents. */
  adminOnly?: boolean;
}

const SECTIONS: Section[] = [
  {
    id: 'install',
    label: 'Install',
    description: 'Add the widget to your website',
    Icon: Code2,
  },
  {
    id: 'widget',
    label: 'Widget',
    description: 'Branding, greeting and appearance',
    Icon: Palette,
    adminOnly: true,
  },
  {
    id: 'team',
    label: 'Team',
    description: 'Teammates, roles and access',
    Icon: Users,
    adminOnly: true,
  },
  {
    id: 'replies',
    label: 'Saved replies',
    description: 'Canned responses your team can insert',
    Icon: MessageSquareText,
    adminOnly: true,
  },
  {
    id: 'routing',
    label: 'Availability',
    description: 'Business hours and auto-assignment',
    Icon: Clock,
    adminOnly: true,
  },
  {
    id: 'ai',
    label: 'AI assistant',
    description: 'Claude replies and the LangGraph agent',
    Icon: Bot,
    adminOnly: true,
  },
  {
    id: 'channels',
    label: 'Channels',
    description: 'WhatsApp, Messenger, Instagram, LinkedIn, Slack',
    Icon: Share2,
    adminOnly: true,
  },
];

interface SettingsHubProps {
  workspace: Workspace | null;
  currentAgent: Agent | null;
  agents: Agent[];
  cannedResponses: CannedResponse[];
  hasVisitors: boolean;
  latestVisitorUrl?: string;
  onWorkspaceUpdated?: (ws: Workspace) => void;
}

export function SettingsHub({
  workspace,
  currentAgent,
  agents,
  cannedResponses,
  hasVisitors,
  latestVisitorUrl,
  onWorkspaceUpdated,
}: SettingsHubProps) {
  const isAdmin =
    currentAgent?.role === 'admin' || currentAgent?.role === 'owner';

  const sections = SECTIONS.filter((s) => !s.adminOnly || isAdmin);
  const [active, setActive] = useState<SectionId>('install');

  const current = sections.find((s) => s.id === active) ?? sections[0];

  /** Availability merges two former admin tabs, so it renders both. */
  const adminTabFor: Partial<Record<SectionId, AdminTab>> = {
    widget: 'widget',
    team: 'team',
    replies: 'canned',
    routing: 'hours',
    ai: 'ai',
  };

  const renderAdmin = (tab: AdminTab) =>
    workspace && currentAgent ? (
      <AdminSettingsPanel
        embedded
        tab={tab}
        workspace={workspace}
        currentAgent={currentAgent}
        initialAgents={agents}
        initialCannedResponses={cannedResponses}
        onWorkspaceUpdated={onWorkspaceUpdated}
      />
    ) : null;

  const renderIntegrations = (tab: IntegrationTab) => (
    <IntegrationsSettings embedded tab={tab} workspace={workspace} />
  );

  const [channelTab, setChannelTab] = useState<IntegrationTab>('whatsapp');

  return (
    <div className="flex-1 min-w-0 h-screen flex flex-col bg-canvas">
      <header className="shrink-0 px-7 h-16 flex items-center border-b border-line bg-surface">
        <div className="min-w-0">
          <h1 className="text-[15px] font-semibold tracking-tight">Settings</h1>
          <p className="text-[12px] text-ink-3 mt-0.5 truncate">
            {current?.description}
          </p>
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        {/* Section list */}
        <nav className="w-[212px] shrink-0 border-r border-line bg-surface-2 p-2.5 overflow-y-auto">
          {sections.map(({ id, label, Icon }) => {
            const isActive = active === id;
            return (
              <button
                key={id}
                onClick={() => setActive(id)}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'w-full h-9 px-2.5 mb-0.5 rounded-lg flex items-center gap-2.5 text-[13px] font-medium transition-colors',
                  isActive
                    ? 'bg-surface text-ink shadow-xs border border-line'
                    : 'text-ink-2 hover:bg-surface-3 hover:text-ink border border-transparent'
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{label}</span>
              </button>
            );
          })}
        </nav>

        {/* Section body */}
        <div className="flex-1 min-w-0 overflow-y-auto">
          {active === 'install' && (
            <InstallationGuide
              embedded
              workspace={workspace}
              hasVisitors={hasVisitors}
              latestVisitorUrl={latestVisitorUrl}
            />
          )}

          {active === 'channels' && (
            <div className="p-7 max-w-4xl">
              <div className="flex items-center gap-1 mb-6 p-0.5 rounded-lg bg-surface-2 border border-line w-fit">
                {(
                  [
                    ['whatsapp', 'WhatsApp'],
                    ['meta', 'Messenger & Instagram'],
                    ['linkedin', 'LinkedIn'],
                    ['slack', 'Slack alerts'],
                  ] as [IntegrationTab, string][]
                ).map(([id, label]) => (
                  <button
                    key={id}
                    onClick={() => setChannelTab(id)}
                    className={cn(
                      'h-7 px-3 rounded-md text-[12px] font-medium transition-colors',
                      channelTab === id
                        ? 'bg-surface text-ink shadow-xs'
                        : 'text-ink-3 hover:text-ink'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {renderIntegrations(channelTab)}
            </div>
          )}

          {active === 'ai' && (
            <div className="p-7 max-w-4xl space-y-10">
              {renderAdmin('ai')}
              {renderIntegrations('langgraph')}
            </div>
          )}

          {active === 'routing' && (
            <div className="p-7 max-w-4xl space-y-10">
              {renderAdmin('hours')}
              {renderAdmin('assignment')}
            </div>
          )}

          {adminTabFor[active] && active !== 'ai' && active !== 'routing' && (
            <div className="p-7 max-w-4xl">
              {renderAdmin(adminTabFor[active]!)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
