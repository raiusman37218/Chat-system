'use client';

import React from 'react';
import { 
  Radio, 
  Globe, 
  ExternalLink, 
  MapPin, 
  Monitor, 
  MessageSquare, 
  Clock,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { Visitor } from '@/types/database';
import { formatTimeAgo, parseUserAgent } from '@/lib/utils';

interface LiveVisitorsRadarProps {
  visitors: Visitor[];
  onOpenConversationForVisitor: (visitorId: string) => void;
  onRefresh: () => void;
}

export function LiveVisitorsRadar({
  visitors,
  onOpenConversationForVisitor,
  onRefresh,
}: LiveVisitorsRadarProps) {
  // Active visitors within last 90 seconds
  const activeVisitors = visitors.filter((v) => {
    const diff = (new Date().getTime() - new Date(v.last_seen).getTime()) / 1000;
    return diff < 90;
  });

  return (
    <div className="flex-1 flex flex-col h-screen bg-[#0b101d] overflow-hidden">
      {/* Radar Header */}
      <div className="px-8 py-5 border-b border-slate-800/80 bg-[#0d1424] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              Live Visitors Radar
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                {activeVisitors.length} Online Now
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Real-time heartbeat monitoring of users currently active on your websites.
            </p>
          </div>
        </div>

        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-850 text-slate-300 text-xs border border-slate-700/60 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Visitors List / Cards */}
      <div className="flex-1 overflow-y-auto p-8">
        {activeVisitors.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 rounded-full bg-slate-800/50 border border-slate-700/60 flex items-center justify-center text-slate-400">
              <Radio className="w-8 h-8 opacity-40" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-slate-200">No active visitors right now</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                When visitors browse any site where the Chatify script is installed, they will show up here live with their current URL, device info, and location.
              </p>
            </div>
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-left text-xs text-slate-400 space-y-1 w-full">
              <div className="text-slate-200 font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                <span>Tip to test live radar:</span>
              </div>
              <p>Open the demo page in a new browser tab and navigate around to see real-time updates.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeVisitors.map((visitor) => {
              const { browser, os } = parseUserAgent(visitor.user_agent);
              const displayName =
                visitor.name ||
                (visitor.email ? visitor.email.split('@')[0] : `Visitor #${visitor.id.slice(0, 6)}`);

              return (
                <div
                  key={visitor.id}
                  className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all shadow-sm flex flex-col justify-between space-y-4"
                >
                  {/* Top Bar */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-sm">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">{displayName}</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[140px]">
                          {visitor.email || 'Anonymous'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      <span className="text-[10px] text-emerald-400 font-semibold">Active</span>
                    </div>
                  </div>

                  {/* Current Page */}
                  <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800/80 text-xs">
                    <div className="text-[10px] uppercase font-semibold text-slate-400 mb-1 flex items-center gap-1">
                      <Globe className="w-3 h-3 text-blue-400" />
                      <span>Browsing Page:</span>
                    </div>
                    <a
                      href={visitor.current_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-400 hover:underline font-mono text-[11px] truncate flex items-center justify-between"
                    >
                      <span className="truncate">{visitor.current_url}</span>
                      <ExternalLink className="w-3 h-3 flex-shrink-0 ml-1 opacity-70" />
                    </a>
                  </div>

                  {/* Metadata */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate text-slate-300">{visitor.location || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <Monitor className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate text-slate-300">{browser}</span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate col-span-2 text-[11px]">
                      <Clock className="w-3 h-3 text-slate-400 flex-shrink-0" />
                      <span>First seen {formatTimeAgo(visitor.first_seen)} • Heartbeat {formatTimeAgo(visitor.last_seen)}</span>
                    </div>
                  </div>

                  {/* Action */}
                  <button
                    onClick={() => onOpenConversationForVisitor(visitor.id)}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-md shadow-blue-600/20 transition-all"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Open Conversation</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
