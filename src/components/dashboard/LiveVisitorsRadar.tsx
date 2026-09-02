'use client';

import React from 'react';
import {
  Clock,
  ExternalLink,
  Globe,
  MapPin,
  MessageSquare,
  Monitor,
  RefreshCw,
} from 'lucide-react';
import { Visitor } from '@/types/database';
import { formatTimeAgo, parseUserAgent } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';

interface LiveVisitorsRadarProps {
  visitors: Visitor[];
  onOpenConversationForVisitor: (visitorId: string) => void;
  onRefresh: () => void;
}

/** A visitor counts as "live" while their heartbeat is under 90s old. */
const LIVE_WINDOW_SECONDS = 90;

export function LiveVisitorsRadar({
  visitors,
  onOpenConversationForVisitor,
  onRefresh,
}: LiveVisitorsRadarProps) {
  const activeVisitors = visitors.filter(
    (v) => (Date.now() - new Date(v.last_seen).getTime()) / 1000 < LIVE_WINDOW_SECONDS
  );

  return (
    <div className="flex-1 min-w-0 h-screen flex flex-col bg-canvas">
      {/* Header */}
      <header className="shrink-0 px-7 h-16 flex items-center justify-between gap-4 border-b border-line bg-surface">
        <div className="min-w-0">
          <h1 className="text-[15px] font-semibold tracking-tight flex items-center gap-2.5">
            Live visitors
            <span className="pill pill-success">
              <span className="live-dot" />
              {activeVisitors.length} online
            </span>
          </h1>
          <p className="text-[12px] text-ink-3 mt-0.5">
            Everyone browsing a page where your widget is installed, right now.
          </p>
        </div>

        <button onClick={onRefresh} className="btn btn-sm btn-secondary shrink-0">
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </header>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-7">
        {activeVisitors.length === 0 ? (
          <div className="h-full flex items-center justify-center p-8">
            <EmptyState
              type="no-visitors"
              title="Radar Scanning for Live Visitors"
              description="Nobody is browsing your site right now. As soon as someone visits, their page URL, location, and device will appear here live."
              actionLabel="Launch Demo Simulator"
              onAction={() => window.open('/demo.html', '_blank')}
              secondaryActionLabel="Refresh Radar"
              onSecondaryAction={onRefresh}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
            {activeVisitors.map((visitor) => {
              const { browser, os } = parseUserAgent(visitor.user_agent);
              const displayName =
                visitor.name ||
                (visitor.email
                  ? visitor.email.split('@')[0]
                  : `Visitor ${visitor.id.slice(0, 6)}`);

              return (
                <div
                  key={visitor.id}
                  className="card card-hover p-5 flex flex-col gap-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar name={displayName} seed={visitor.id} size="md" />
                      <div className="min-w-0">
                        <div className="text-[13.5px] font-semibold truncate">
                          {displayName}
                        </div>
                        <div className="text-[11.5px] text-ink-3 truncate">
                          {visitor.email || 'Anonymous'}
                        </div>
                      </div>
                    </div>

                    <span className="pill pill-success shrink-0">
                      <span className="live-dot" />
                      Live
                    </span>
                  </div>

                  <a
                    href={visitor.current_url}
                    target="_blank"
                    rel="noreferrer"
                    className="panel p-3 group"
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <Globe className="w-3 h-3 text-ink-3" />
                      <span className="eyebrow">Viewing</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[11.5px] text-accent truncate group-hover:underline underline-offset-2">
                        {visitor.current_url}
                      </span>
                      <ExternalLink className="w-3 h-3 text-ink-3 shrink-0" />
                    </div>
                  </a>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[12px] text-ink-2">
                    <span className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-ink-3 shrink-0" />
                      <span className="truncate">
                        {visitor.location || 'Unknown'}
                      </span>
                    </span>
                    <span className="flex items-center gap-1.5 truncate">
                      <Monitor className="w-3.5 h-3.5 text-ink-3 shrink-0" />
                      <span className="truncate">
                        {browser} · {os}
                      </span>
                    </span>
                    <span className="col-span-2 flex items-center gap-1.5 text-[11.5px] text-ink-3 truncate">
                      <Clock className="w-3 h-3 shrink-0" />
                      First seen {formatTimeAgo(visitor.first_seen)} · heartbeat{' '}
                      {formatTimeAgo(visitor.last_seen)}
                    </span>
                  </div>

                  <button
                    onClick={() => onOpenConversationForVisitor(visitor.id)}
                    className="btn btn-primary w-full"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Start conversation
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
