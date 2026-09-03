'use client';

import React from 'react';
import {
  BarChart2,
  Bell,
  BookOpen,
  ChevronsUpDown,
  ExternalLink,
  HelpCircle,
  Inbox,
  Radio,
  Settings,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Agent, AgentStatus, Workspace } from '@/types/database';
import { sound } from '@/lib/sound';
import { requestNotificationPermission, cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import { Menu } from '@/components/ui/Menu';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export type View = 'inbox' | 'visitors' | 'reports' | 'helpdesk' | 'settings';

interface SidebarProps {
  currentAgent: Agent | null;
  workspace: Workspace | null;
  activeView: View;
  onSelectView: (view: View) => void;
  counts: {
    open: number;
    liveVisitors: number;
    articles?: number;
  };
  onUpdateAgentStatus: (status: AgentStatus) => void;
  onLogout: () => void;
  onOpenShortcuts?: () => void;
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
  onOpenShortcuts,
}: SidebarProps) {
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
      badge: counts.open > 0 ? (
        <span className="px-1.5 py-0.5 text-[10.5px] font-bold rounded-full bg-accent text-accent-ink shadow-xs">
          {counts.open}
        </span>
      ) : undefined,
    },
    {
      view: 'visitors',
      label: 'Live visitors',
      Icon: Radio,
      badge:
        counts.liveVisitors > 0 ? (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
            <span className="live-dot" />
            {counts.liveVisitors}
          </span>
        ) : undefined,
    },
    ...(isAdmin
      ? [{ view: 'reports' as View, label: 'Analytics', Icon: BarChart2 }]
      : []),
    {
      view: 'helpdesk',
      label: 'Help Desk',
      Icon: BookOpen,
      badge:
        counts.articles !== undefined && counts.articles > 0 ? (
          <span className="px-1.5 py-0.5 text-[10.5px] font-medium rounded-full bg-surface-3 text-ink-2">
            {counts.articles}
          </span>
        ) : undefined,
    },
    { view: 'settings', label: 'Settings', Icon: Settings },
  ];

  return (
    <aside className="w-[220px] shrink-0 h-screen flex flex-col bg-surface border-r border-line select-none relative z-10">
      {/* Workspace Identity Card */}
      <div className="p-3 border-b border-line/80">
        <div className="flex items-center justify-between gap-2.5 p-2 rounded-xl bg-surface-2/80 hover:bg-surface-2 transition-all border border-line/60">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <Avatar
              name={workspace?.name || 'C'}
              seed={workspace?.id || 'chatify'}
              color={workspace?.brand_color || undefined}
              size="sm"
              className="shadow-xs ring-1 ring-black/5 dark:ring-white/10"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[13px] font-bold text-ink truncate leading-tight">
                  {workspace?.name || 'Chatify'}
                </span>
                <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-accent-soft text-accent uppercase tracking-wider">
                  Live
                </span>
              </div>
              <div className="text-[11px] text-ink-3 truncate flex items-center gap-1 mt-0.5">
                <span className="truncate">{workspace?.website_url ? workspace.website_url.replace(/^https?:\/\//, '') : 'Workspace Active'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="p-3 flex-1 overflow-y-auto space-y-1">
        <div className="px-2 py-1 text-[10px] font-bold tracking-wider uppercase text-ink-3">
          Menu
        </div>
        {nav.map(({ view, label, Icon, badge }) => {
          const active = activeView === view;
          return (
            <button
              key={view}
              onClick={() => onSelectView(view)}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'w-full h-9 px-2.5 rounded-lg flex items-center justify-between gap-2 text-[13px] font-medium transition-all duration-150 relative group',
                active
                  ? 'bg-accent/10 text-accent font-semibold shadow-xs'
                  : 'text-ink-2 hover:bg-surface-2 hover:text-ink'
              )}
            >
              {active && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-accent" />
              )}
              <span className="flex items-center gap-2.5 truncate">
                <Icon
                  className={cn(
                    'w-4 h-4 shrink-0 transition-transform duration-150 group-hover:scale-105',
                    active ? 'text-accent' : 'text-ink-3 group-hover:text-ink'
                  )}
                />
                {label}
              </span>
              {badge !== undefined && (
                <span className="shrink-0">{badge}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer: Quick controls + Agent Profile */}
      <div className="p-3 border-t border-line/80 space-y-2.5 bg-surface-2/40">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1">
            <button
              onClick={toggleSound}
              title={soundActive ? 'Sound notifications: ON' : 'Sound notifications: MUTED'}
              aria-label={soundActive ? 'Mute audio' : 'Unmute audio'}
              className={cn(
                'w-7 h-7 rounded-lg flex items-center justify-center transition-colors',
                soundActive
                  ? 'text-ink-2 hover:text-ink hover:bg-surface-3'
                  : 'text-ink-3 hover:text-ink hover:bg-surface-3 opacity-60'
              )}
            >
              {soundActive ? (
                <Volume2 className="w-3.5 h-3.5" />
              ) : (
                <VolumeX className="w-3.5 h-3.5" />
              )}
            </button>
            <button
              onClick={enableNotifications}
              title="Browser notifications"
              aria-label="Browser notifications"
              className="w-7 h-7 rounded-lg flex items-center justify-center text-ink-3 hover:text-ink hover:bg-surface-3 transition-colors"
            >
              <Bell className="w-3.5 h-3.5" />
            </button>
            {onOpenShortcuts && (
              <button
                onClick={onOpenShortcuts}
                title="Keyboard Shortcuts (?)"
                aria-label="Keyboard Shortcuts"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-ink-3 hover:text-ink hover:bg-surface-3 transition-colors text-[11px] font-mono font-bold"
              >
                ?
              </button>
            )}
          </div>
          <ThemeToggle />
        </div>

        {/* Agent Profile & Status Card */}
        <Menu<AgentStatus | 'logout'>
          value={(currentAgent?.status || 'online') as AgentStatus}
          side="top"
          align="start"
          label="Agent status"
          menuClassName="left-0 right-0 min-w-0"
          options={[
            { value: 'online', label: 'Online', dot: STATUS_TINT.online, description: 'Receiving live chats' },
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
                'flex items-center gap-2.5 w-full p-2 rounded-xl border transition-all cursor-pointer shadow-xs',
                open
                  ? 'bg-surface border-line-2 ring-2 ring-accent/15'
                  : 'bg-surface border-line hover:border-line-2 hover:bg-surface-2/60'
              )}
            >
              <Avatar
                name={currentAgent?.name || 'A'}
                seed={currentAgent?.id || 'agent'}
                size="sm"
                online={currentAgent?.status === 'online'}
                className="shrink-0"
              />
              <span className="min-w-0 flex-1 text-left">
                <span className="block text-[12.5px] font-bold text-ink truncate leading-tight">
                  {currentAgent?.name || 'Agent'}
                </span>
                <span className="flex items-center gap-1.5 text-[10.5px] text-ink-3 capitalize mt-0.5">
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{
                      background: STATUS_TINT[currentAgent?.status || 'online'],
                    }}
                  />
                  <span>{currentAgent?.status || 'online'}</span>
                  {currentAgent?.role && (
                    <>
                      <span className="text-ink-3/40">·</span>
                      <span className="text-[10px] font-medium uppercase text-ink-3">
                        {currentAgent.role}
                      </span>
                    </>
                  )}
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
