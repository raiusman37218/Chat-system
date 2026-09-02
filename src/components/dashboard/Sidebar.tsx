'use client';

import React from 'react';
import {
  Bell,
  ChevronsUpDown,
  Code2,
  ExternalLink,
  Inbox,
  LogOut,
  Radio,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Agent, AgentStatus, ConversationStatus, Workspace } from '@/types/database';
import { sound } from '@/lib/sound';
import { requestNotificationPermission, cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import { Menu } from '@/components/ui/Menu';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

type View = 'inbox' | 'visitors' | 'installation';

interface SidebarProps {
  currentAgent: Agent | null;
  workspace: Workspace | null;
  activeView: View;
  onSelectView: (view: View) => void;
  statusFilter: ConversationStatus | 'all';
  onSelectStatusFilter: (status: ConversationStatus | 'all') => void;
  counts: {
    all: number;
    open: number;
    pending: number;
    closed: number;
    liveVisitors: number;
  };
  onUpdateAgentStatus: (status: AgentStatus) => void;
  onLogout: () => void;
}

const STATUS_TINT: Record<AgentStatus, string> = {
  online: 'var(--ds-success)',
  away: 'var(--ds-warn)',
  offline: 'var(--ds-line-3)',
};

const FILTERS: { value: ConversationStatus | 'all'; label: string; key: keyof SidebarProps['counts'] }[] = [
  { value: 'all', label: 'All', key: 'all' },
  { value: 'open', label: 'Open', key: 'open' },
  { value: 'pending', label: 'Pending', key: 'pending' },
  { value: 'closed', label: 'Resolved', key: 'closed' },
];

export function Sidebar({
  currentAgent,
  workspace,
  activeView,
  onSelectView,
  statusFilter,
  onSelectStatusFilter,
  counts,
  onUpdateAgentStatus,
  onLogout,
}: SidebarProps) {
  const [soundActive, setSoundActive] = React.useState(true);

  const toggleSound = () => {
    const newState = sound.toggleSound();
    setSoundActive(newState);
    if (newState) sound.playSentMessage();
  };

  const enableNotifications = async () => {
    const granted = await requestNotificationPermission();
    if (granted) sound.playIncomingMessage();
  };

  const nav: { view: View; label: string; Icon: typeof Inbox; badge?: React.ReactNode }[] = [
    {
      view: 'inbox',
      label: 'Inbox',
      Icon: Inbox,
      badge: counts.open > 0 ? counts.open : undefined,
    },
    {
      view: 'visitors',
      label: 'Live visitors',
      Icon: Radio,
      badge:
        counts.liveVisitors > 0 ? (
          <span className="inline-flex items-center gap-1.5 text-success font-semibold">
            <span className="live-dot" />
            {counts.liveVisitors}
          </span>
        ) : undefined,
    },
    { view: 'installation', label: 'Install', Icon: Code2 },
  ];

  return (
    <aside className="w-[252px] shrink-0 h-screen flex flex-col bg-surface-2 border-r border-line select-none">
      {/* Workspace identity */}
      <div className="p-3 border-b border-line">
        <div className="flex items-center gap-2.5 px-1.5 py-1.5">
          <Avatar
            name={workspace?.name || 'C'}
            seed={workspace?.id || 'chatify'}
            color={workspace?.brand_color || undefined}
            size="sm"
          />
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-semibold text-ink truncate leading-tight">
              {workspace?.name || 'Chatify'}
            </div>
            <div className="text-[11px] text-ink-3 truncate">
              {workspace?.website_url || 'Live workspace'}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="p-3 flex-1 overflow-y-auto space-y-6">
        <nav className="space-y-0.5">
          {nav.map(({ view, label, Icon, badge }) => {
            const active = activeView === view;
            return (
              <button
                key={view}
                onClick={() => onSelectView(view)}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'w-full h-9 px-2.5 rounded-lg flex items-center justify-between gap-2 text-[13px] font-medium transition-colors duration-150',
                  active
                    ? 'bg-surface text-ink shadow-xs border border-line'
                    : 'text-ink-2 hover:bg-surface-3 hover:text-ink border border-transparent'
                )}
              >
                <span className="flex items-center gap-2.5 truncate">
                  <Icon className="w-4 h-4 shrink-0" />
                  {label}
                </span>
                {badge !== undefined && (
                  <span className="text-[11px] text-ink-3 shrink-0">{badge}</span>
                )}
              </button>
            );
          })}
        </nav>

        {activeView === 'inbox' && (
          <div>
            <div className="px-2.5 pb-2 eyebrow">Filter</div>
            <div className="space-y-0.5">
              {FILTERS.map((f) => {
                const active = statusFilter === f.value;
                return (
                  <button
                    key={f.value}
                    onClick={() => onSelectStatusFilter(f.value)}
                    className={cn(
                      'w-full h-8 px-2.5 rounded-lg flex items-center justify-between text-[12.5px] transition-colors duration-150',
                      active
                        ? 'bg-surface-3 text-ink font-semibold'
                        : 'text-ink-2 hover:bg-surface-3/60 hover:text-ink'
                    )}
                  >
                    <span>{f.label}</span>
                    <span className="text-[11px] text-ink-3 tabular-nums">
                      {counts[f.key]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Simulator shortcut */}
        <a
          href={`/demo.html?workspaceId=${workspace?.id || ''}&name=${encodeURIComponent(
            workspace?.name || 'Chatify'
          )}`}
          target="_blank"
          rel="noreferrer"
          className="block card p-3 card-hover group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[12.5px] font-semibold text-ink">
              Customer simulator
            </span>
            <ExternalLink className="w-3.5 h-3.5 text-ink-3 group-hover:text-accent transition-colors" />
          </div>
          <p className="mt-1 text-[11.5px] leading-snug text-ink-3">
            Open your site as a visitor and test the widget end to end.
          </p>
        </a>
      </div>

      {/* Footer: utilities + profile */}
      <div className="p-3 border-t border-line space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-0.5">
            <button
              onClick={toggleSound}
              title={soundActive ? 'Mute alerts' : 'Unmute alerts'}
              aria-label={soundActive ? 'Mute alerts' : 'Unmute alerts'}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-3 hover:text-ink hover:bg-surface-3 transition-colors"
            >
              {soundActive ? (
                <Volume2 className="w-4 h-4" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={enableNotifications}
              title="Enable browser notifications"
              aria-label="Enable browser notifications"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-3 hover:text-ink hover:bg-surface-3 transition-colors"
            >
              <Bell className="w-4 h-4" />
            </button>
          </div>
          <ThemeToggle />
        </div>

        <Menu<AgentStatus | 'logout'>
          value={(currentAgent?.status || 'online') as AgentStatus}
          side="top"
          align="start"
          label="Agent status"
          menuClassName="left-0 right-0 min-w-0"
          options={[
            { value: 'online', label: 'Online', dot: STATUS_TINT.online, description: 'Receiving new chats' },
            { value: 'away', label: 'Away', dot: STATUS_TINT.away, description: 'Paused assignments' },
            { value: 'offline', label: 'Offline', dot: STATUS_TINT.offline, description: 'Hidden from visitors' },
            { value: 'logout', label: 'Log out', danger: true },
          ]}
          onChange={(v) => {
            if (v === 'logout') onLogout();
            else onUpdateAgentStatus(v as AgentStatus);
          }}
          trigger={({ open }) => (
            <span
              className={cn(
                'flex items-center gap-2.5 w-full h-11 px-2 rounded-xl border transition-colors',
                open
                  ? 'bg-surface border-line-2'
                  : 'bg-surface border-line hover:border-line-2'
              )}
            >
              <Avatar
                name={currentAgent?.name || 'A'}
                seed={currentAgent?.id || 'agent'}
                size="sm"
                online={currentAgent?.status === 'online'}
              />
              <span className="min-w-0 flex-1 text-left">
                <span className="block text-[12.5px] font-semibold text-ink truncate leading-tight">
                  {currentAgent?.name || 'Agent'}
                </span>
                <span className="flex items-center gap-1.5 text-[11px] text-ink-3 capitalize">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      background: STATUS_TINT[currentAgent?.status || 'online'],
                    }}
                  />
                  {currentAgent?.status || 'online'}
                </span>
              </span>
              <ChevronsUpDown className="w-3.5 h-3.5 text-ink-3 shrink-0" />
            </span>
          )}
        />

        <button
          onClick={onLogout}
          className="w-full h-8 rounded-lg flex items-center justify-center gap-2 text-[12px] font-medium text-ink-3 hover:text-danger hover:bg-danger-soft transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Log out
        </button>
      </div>
    </aside>
  );
}
