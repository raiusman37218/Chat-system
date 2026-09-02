'use client';

import React from 'react';
import { 
  MessageSquare, 
  Users, 
  Radio, 
  Inbox, 
  CheckCircle2, 
  Clock, 
  Volume2, 
  VolumeX, 
  Bell, 
  LogOut, 
  ShieldCheck,
  ChevronDown,
  ExternalLink
} from 'lucide-react';
import { Agent, AgentStatus, ConversationStatus, Workspace } from '@/types/database';
import { sound } from '@/lib/sound';
import { requestNotificationPermission } from '@/lib/utils';
import { Code2 } from 'lucide-react';

interface SidebarProps {
  currentAgent: Agent | null;
  workspace: Workspace | null;
  activeView: 'inbox' | 'visitors' | 'installation';
  onSelectView: (view: 'inbox' | 'visitors' | 'installation') => void;
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
  const [showStatusMenu, setShowStatusMenu] = React.useState(false);

  const toggleSound = () => {
    const newState = sound.toggleSound();
    setSoundActive(newState);
    if (newState) {
      sound.playSentMessage();
    }
  };

  const enableNotifications = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      sound.playIncomingMessage();
    }
  };

  const getStatusColor = (status: AgentStatus) => {
    switch (status) {
      case 'online': return 'bg-emerald-500';
      case 'away': return 'bg-amber-500';
      case 'offline': return 'bg-slate-500';
    }
  };

  return (
    <aside className="w-64 bg-[#0d1322] border-r border-slate-800/80 flex flex-col justify-between select-none h-screen">
      {/* Brand Header */}
      <div>
        <div className="p-4 border-b border-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div 
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg flex-shrink-0"
              style={{ backgroundColor: workspace?.brand_color || '#2563eb' }}
            >
              {workspace?.name ? workspace.name.charAt(0).toUpperCase() : <MessageSquare className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-white tracking-tight text-sm flex items-center gap-1.5 truncate">
                <span className="truncate">{workspace?.name || 'Chatify'}</span>
              </h1>
              <p className="text-[11px] text-slate-400 truncate">{workspace?.website_url || 'Live Workspace'}</p>
            </div>
          </div>
        </div>

        {/* Customer Simulator Quick Launch */}
        <div className="px-3 pt-3">
          <a
            href={`/demo.html?workspaceId=${workspace?.id || ''}&name=${encodeURIComponent(workspace?.name || 'Chatify')}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-blue-600/15 via-indigo-600/10 to-blue-600/15 border border-blue-500/30 hover:border-blue-400 text-blue-300 hover:text-white transition-all group shadow-sm"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
              <div className="truncate">
                <div className="text-xs font-bold leading-none flex items-center gap-1">
                  <span>Customer Simulator</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1 truncate">
                  Test live chat as visitor
                </div>
              </div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-blue-400 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
          </a>
        </div>

        {/* Navigation Sections */}
        <div className="p-3 space-y-6">
          {/* Main Views */}
          <div>
            <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Navigation
            </div>
            <div className="space-y-1">
              <button
                onClick={() => onSelectView('inbox')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeView === 'inbox'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Inbox className="w-4 h-4" />
                  <span>Inbox</span>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    activeView === 'inbox'
                      ? 'bg-blue-700 text-white'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {counts.open}
                </span>
              </button>

              <button
                onClick={() => onSelectView('visitors')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeView === 'visitors'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <span>Live Visitors</span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {counts.liveVisitors}
                </span>
              </button>

              <button
                onClick={() => onSelectView('installation')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeView === 'installation'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Code2 className="w-4 h-4 text-indigo-400" />
                  <span>Embed Code</span>
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
                  Setup
                </span>
              </button>
            </div>
          </div>

          {/* Inbox Filter Tags */}
          {activeView === 'inbox' && (
            <div>
              <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Conversation Filters
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => onSelectStatusFilter('all')}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    statusFilter === 'all'
                      ? 'bg-slate-800 text-white font-semibold'
                      : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>All Conversations</span>
                  </div>
                  <span className="text-[11px] text-slate-400">{counts.all}</span>
                </button>

                <button
                  onClick={() => onSelectStatusFilter('open')}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    statusFilter === 'open'
                      ? 'bg-blue-500/10 text-blue-400 font-semibold border border-blue-500/20'
                      : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Open</span>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-400">{counts.open}</span>
                </button>

                <button
                  onClick={() => onSelectStatusFilter('pending')}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    statusFilter === 'pending'
                      ? 'bg-amber-500/10 text-amber-400 font-semibold border border-amber-500/20'
                      : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Pending</span>
                  </div>
                  <span className="text-[11px] font-semibold text-amber-400">{counts.pending}</span>
                </button>

                <button
                  onClick={() => onSelectStatusFilter('closed')}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    statusFilter === 'closed'
                      ? 'bg-slate-800 text-slate-200 font-semibold'
                      : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Closed</span>
                  </div>
                  <span className="text-[11px] text-slate-400">{counts.closed}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Profile & Utilities */}
      <div className="p-3 border-t border-slate-800/60 bg-[#0a0f1b] space-y-3">
        {/* Controls */}
        <div className="flex items-center justify-between px-2 text-xs text-slate-400">
          <div className="flex items-center gap-1">
            <button
              onClick={toggleSound}
              title={soundActive ? 'Mute alert sounds' : 'Unmute alert sounds'}
              className="p-1.5 rounded-md hover:bg-slate-800 hover:text-white transition-colors"
            >
              {soundActive ? <Volume2 className="w-4 h-4 text-blue-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>
            <button
              onClick={enableNotifications}
              title="Enable browser notifications"
              className="p-1.5 rounded-md hover:bg-slate-800 hover:text-white transition-colors"
            >
              <Bell className="w-4 h-4 text-slate-400 hover:text-amber-400" />
            </button>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Human Only</span>
          </div>
        </div>

        {/* Agent Profile & Status */}
        <div className="relative">
          <div 
            onClick={() => setShowStatusMenu(!showStatusMenu)}
            className="flex items-center justify-between p-2 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all"
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="relative flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs uppercase shadow-sm">
                  {currentAgent?.name?.charAt(0) || 'A'}
                </div>
                <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0d1322] ${getStatusColor(currentAgent?.status || 'online')}`} />
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-semibold text-white truncate">
                  {currentAgent?.name || 'Agent'}
                </div>
                <div className="text-[10px] text-slate-400 capitalize">
                  {currentAgent?.status || 'online'}
                </div>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </div>

          {/* Status Dropdown Menu */}
          {showStatusMenu && (
            <div className="absolute bottom-full mb-1 left-0 right-0 bg-slate-900 border border-slate-800 rounded-lg shadow-xl py-1 z-50 text-xs">
              {(['online', 'away', 'offline'] as AgentStatus[]).map((st) => (
                <button
                  key={st}
                  onClick={() => {
                    onUpdateAgentStatus(st);
                    setShowStatusMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-slate-300 hover:bg-slate-800 capitalize transition-colors"
                >
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(st)}`} />
                  <span>{st}</span>
                </button>
              ))}
              <div className="border-t border-slate-800 my-1" />
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
