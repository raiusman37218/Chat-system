'use client';

import React from 'react';
import { 
  User, 
  Mail, 
  Globe, 
  MapPin, 
  Monitor, 
  Calendar, 
  Clock, 
  Hash, 
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { Visitor, Conversation } from '@/types/database';
import { formatTimeAgo, parseUserAgent } from '@/lib/utils';

interface VisitorDetailsSidebarProps {
  visitor: Visitor | null | undefined;
  conversation: Conversation;
}

export function VisitorDetailsSidebar({ visitor, conversation }: VisitorDetailsSidebarProps) {
  if (!visitor) {
    return (
      <div className="w-72 border-l border-slate-800/80 bg-[#0d1424] p-6 text-center text-slate-400 text-xs flex flex-col items-center justify-center h-screen">
        <User className="w-8 h-8 text-slate-600 mb-2" />
        <p>No visitor details loaded</p>
      </div>
    );
  }

  const { browser, os } = parseUserAgent(visitor.user_agent);
  const isOnline = visitor.last_seen
    ? (new Date().getTime() - new Date(visitor.last_seen).getTime()) / 1000 < 60
    : false;

  const displayName = visitor.name || (visitor.email ? visitor.email.split('@')[0] : 'Anonymous Visitor');

  return (
    <aside className="w-80 border-l border-slate-800/80 bg-[#0d1424] flex flex-col h-screen overflow-y-auto">
      {/* Header Profile Card */}
      <div className="p-6 border-b border-slate-800/70 text-center flex flex-col items-center">
        <div className="relative mb-3">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 border-2 border-slate-700 flex items-center justify-center text-white text-xl font-bold shadow-lg">
            {displayName.charAt(0).toUpperCase()}
          </div>
          {isOnline && (
            <span 
              title="Active now" 
              className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-[#0d1424]" 
            />
          )}
        </div>

        <h4 className="text-sm font-bold text-white tracking-tight">{displayName}</h4>
        <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[200px]">
          {visitor.email || 'No email provided'}
        </p>

        <div className="mt-3 flex items-center gap-2">
          <span
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
              isOnline
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {isOnline ? '● Online Now' : `Idle ${formatTimeAgo(visitor.last_seen)}`}
          </span>
        </div>
      </div>

      {/* Live Navigation & Technical Details */}
      <div className="p-5 space-y-6">
        {/* Live URL */}
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Current Browsing Activity
          </div>
          <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-xs space-y-2">
            <div className="flex items-start gap-2">
              <Globe className="w-3.5 h-3.5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <span className="text-[11px] text-slate-400 block">Current Page:</span>
                <a
                  href={visitor.current_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-400 hover:underline break-all font-mono text-[11px] flex items-center gap-1"
                >
                  <span>{visitor.current_url}</span>
                  <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Location & Device Info */}
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Device & Location
          </div>
          <div className="divide-y divide-slate-800/60 rounded-lg bg-slate-900/90 border border-slate-800 text-xs">
            <div className="p-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>Location</span>
              </div>
              <span className="text-slate-200 font-medium">{visitor.location || 'Unknown location'}</span>
            </div>

            <div className="p-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-400">
                <Monitor className="w-3.5 h-3.5 text-slate-400" />
                <span>Device</span>
              </div>
              <span className="text-slate-200 font-medium">
                {browser} • {os}
              </span>
            </div>

            <div className="p-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-400">
                <Hash className="w-3.5 h-3.5 text-slate-400" />
                <span>IP Address</span>
              </div>
              <span className="font-mono text-slate-300 text-[11px]">{visitor.ip_address || '—'}</span>
            </div>
          </div>
        </div>

        {/* Timestamps */}
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Session History
          </div>
          <div className="divide-y divide-slate-800/60 rounded-lg bg-slate-900/90 border border-slate-800 text-xs">
            <div className="p-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-400">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>First Seen</span>
              </div>
              <span className="text-slate-300">{formatTimeAgo(visitor.first_seen)}</span>
            </div>

            <div className="p-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-400">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Last Active</span>
              </div>
              <span className="text-slate-300">{formatTimeAgo(visitor.last_seen)}</span>
            </div>
          </div>
        </div>

        {/* Conversation Metadata */}
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Conversation Info
          </div>
          <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-xs space-y-1.5">
            <div className="flex justify-between text-slate-400">
              <span>Conversation ID:</span>
              <span className="font-mono text-slate-300 text-[10px]">{conversation.id.slice(0, 8)}...</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Status:</span>
              <span className="capitalize font-semibold text-blue-400">{conversation.status}</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
