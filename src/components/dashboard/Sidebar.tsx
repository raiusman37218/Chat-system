'use client';

import React from 'react';
import {
  BarChart2,
  Bell,
  ChevronsUpDown,
  Inbox,
  Radio,
  Settings,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Agent, AgentStatus, Workspace } from '@/types/database';
import { sound } from '@/lib/sound';
import { requestNotificationPermission, cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import { Menu } from '@/components/ui/Menu';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export type View = 'inbox' | 'visitors' | 'reports' | 'settings';

interface SidebarProps {
  currentAgent: Agent | null;
  workspace: Workspace | null;
  activeView: View;
  onSelectView: (view: View) => void;
  counts: {
    open: number;
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

export function Sidebar({
  currentAgent,
  workspace,
  activeView,
  onSelectView,
  counts,
  onUpdateAgentStatus,
  onLogout,
}: SidebarProps) {
  // The sound module owns the preference and its persistence; this just
  // mirrors it, so there is no second copy of the state to drift.
  const soundActive = React.useSyncExternalStore(
    sound.subscribe,
    sound.isEnabled,
    sound.isEnabledServer
  );

  const toggleSound = () => {
    if (sound.toggleSound()) sound.playSentMessage();
  };

  const enableNotifications = async () => {
    const granted = await requestNotificationPermission();
    if (granted) sound.playIncomingMessage();
  };

  const isAdmin =
    currentAgent?.role === 'admin' || currentAgent?.role === 'owner';

  /*
   * Four destinations, not six. Install, Integrations and Admin were three
   * separate entries that all did the same job — configure the workspace — so
   * they live behind Settings now. Conversation filters are not here either:
   * the inbox owns its own queue tabs, and having both was the main source of
   * "which filter am I actually looking at?".
   */
  const nav: {
    view: View;
    label: string;
    Icon: typeof Inbox;
    badge?: React.ReactNode;
  }[] = [
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
    ...(isAdmin
      ? [{ view: 'reports' as View, label: 'Reports', Icon: BarChart2 }]
      : []),
    { view: 'settings', label: 'Settings', Icon: Settings },
  ];

  return (
    <aside className="w-[236px] shrink-0 h-screen flex flex-col bg-surface-2 border-r border-line select-none">
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
      <nav className="p-3 flex-1 overflow-y-auto space-y-0.5">
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

        {/* Status and log out share one menu — a separate log-out row below the
            profile was a second way to do the same thing. */}
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
      </div>
    </aside>
  );
}
