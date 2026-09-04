'use client';

import React from 'react';
import {
  Clock,
  ExternalLink,
  Globe,
  MapPin,
  MessageSquare,
  Monitor,
  Radio,
  RefreshCw,
  Smartphone,
  Users,
} from 'lucide-react';
import { Visitor, Workspace } from '@/types/database';
import { formatTimeAgo, cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import {
  BrowserIcon,
  CountryFlag,
  DeviceIcon,
  OsIcon,
} from '@/components/ui/BrandIcon';
import {
  localTimeIn,
  parseLocation,
  parseUserAgentDetailed,
  timezoneFrom,
} from '@/lib/visitor-meta';
import { EmptyState } from '@/components/ui/EmptyState';

interface LiveVisitorsRadarProps {
  visitors: Visitor[];
  workspace?: Workspace | null;
  onOpenConversationForVisitor: (visitorId: string) => void;
  onRefresh: () => void;
}

/** A visitor counts as "live" while their heartbeat is under 90s old. */
const LIVE_WINDOW_SECONDS = 90;

export function LiveVisitorsRadar({
  visitors,
  workspace,
  onOpenConversationForVisitor,
  onRefresh,
}: LiveVisitorsRadarProps) {
  const activeVisitors = visitors.filter(
    (v) => (Date.now() - new Date(v.last_seen).getTime()) / 1000 < LIVE_WINDOW_SECONDS
  );

  const desktopCount = activeVisitors.filter(
    (v) => !/mobile|android|iphone|ipad/i.test(v.user_agent || '')
  ).length;
  const mobileCount = activeVisitors.length - desktopCount;

  return (
    <div className="flex-1 min-w-0 h-screen flex flex-col bg-canvas">
      {/* Header */}
      <header className="shrink-0 px-7 h-16 flex items-center justify-between gap-4 border-b border-line bg-surface">
        <div className="min-w-0 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-[15px] font-bold tracking-tight flex items-center gap-2.5 text-ink">
              Live Visitors Radar
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span className="live-dot" />
                {activeVisitors.length} online now
              </span>
            </h1>
            <p className="text-[12px] text-ink-3">
              Realtime telemetry of visitors browsing your website right now.
            </p>
          </div>
        </div>

        <button
          onClick={onRefresh}
          className="btn btn-sm btn-secondary shrink-0 shadow-xs hover:border-line-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Radar
        </button>
      </header>

      {/* Telemetry Metric Cards */}
      {activeVisitors.length > 0 && (
        <div className="px-7 py-4 border-b border-line/70 bg-surface/50 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-surface border border-line/60 shadow-xs">
            <span className="text-[11px] font-semibold text-ink-3 uppercase tracking-wider block mb-1">
              Active Visitors
            </span>
            <div className="text-xl font-bold text-ink tabular-nums flex items-baseline gap-1.5">
              {activeVisitors.length}
              <span className="text-[11px] font-normal text-emerald-600 dark:text-emerald-400">Live</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-surface border border-line/60 shadow-xs">
            <span className="text-[11px] font-semibold text-ink-3 uppercase tracking-wider block mb-1">
              Devices
            </span>
            <div className="text-[13px] font-bold text-ink flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Monitor className="w-3.5 h-3.5 text-ink-3" /> {desktopCount} Desktop
              </span>
              <span className="flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5 text-ink-3" /> {mobileCount} Mobile
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-surface border border-line/60 shadow-xs col-span-2">
            <span className="text-[11px] font-semibold text-ink-3 uppercase tracking-wider block mb-1">
              Top Active URL
            </span>
            <div className="text-[12px] font-mono text-accent truncate">
              {activeVisitors[0]?.current_url || '/'}
            </div>
          </div>
        </div>
      )}

      {/* Grid of live visitors */}
      <div className="flex-1 overflow-y-auto p-7">
        {activeVisitors.length === 0 ? (
          <div className="h-full flex items-center justify-center p-8">
            <EmptyState
              type="no-visitors"
              title="Radar Scanning for Live Visitors"
              description="Nobody is browsing your site right now. As soon as someone visits, their page URL, location, and device will appear here live."
              actionLabel="Launch Demo Simulator"
              onAction={() => {
                const targetUrl = workspace?.id
                  ? `/demo.html?workspaceId=${workspace.id}&name=${encodeURIComponent(workspace.name || '')}`
                  : '/demo.html';
                window.open(targetUrl, '_blank');
              }}
              secondaryActionLabel="Refresh Radar"
              onSecondaryAction={onRefresh}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
            {activeVisitors.map((visitor) => {
              const ua = parseUserAgentDetailed(visitor.user_agent);
              const place = parseLocation(
                visitor.location,
                visitor.ip_location_city,
                visitor.ip_location_country
              );
              const localTime = localTimeIn(
                visitor.timezone || timezoneFrom(visitor.location)
              );
              const displayName =
                visitor.name ||
                (visitor.email
                  ? visitor.email.split('@')[0]
                  : `Visitor ${visitor.id.slice(0, 6)}`);

              return (
                <div
                  key={visitor.id}
                  className="rounded-2xl border border-line bg-surface p-5 flex flex-col gap-4 shadow-xs hover:shadow-md hover:border-accent/40 transition-all duration-150 relative group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar
                        name={displayName}
                        seed={visitor.id}
                        size="md"
                        online={true}
                        className="shadow-xs"
                      />
                      <div className="min-w-0">
                        <div className="text-[14px] font-bold text-ink truncate">
                          {displayName}
                        </div>
                        <div className="text-[11.5px] text-ink-3 truncate">
                          {visitor.email || 'Anonymous visitor'}
                        </div>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                      <span className="live-dot" />
                      Live
                    </span>
                  </div>

                  {/* Current URL Card */}
                  <a
                    href={visitor.current_url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 rounded-xl bg-surface-2 border border-line/70 hover:border-accent/50 transition-all group/link"
                  >
                    <div className="flex items-center gap-1.5 mb-1 text-[10.5px] font-bold text-ink-3 uppercase tracking-wider">
                      <Globe className="w-3 h-3 text-accent" />
                      <span>Viewing Page</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[11.5px] text-accent truncate group-hover/link:underline underline-offset-2">
                        {visitor.current_url}
                      </span>
                      <ExternalLink className="w-3 h-3 text-ink-3 shrink-0" />
                    </div>
                  </a>

                  {/* Device & location telemetry, same marks as the visitor panel */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[12px] text-ink-2 bg-surface-2/40 p-3 rounded-xl border border-line/40">
                    <span className="flex items-center gap-1.5 truncate">
                      <CountryFlag flag={place.flag} className="w-3.5 h-3.5" />
                      <span className="truncate font-medium">
                        {place.label || 'Location undetected'}
                      </span>
                    </span>
                    <span className="flex items-center gap-1.5 truncate">
                      <BrowserIcon
                        browser={ua.browser}
                        className="w-3.5 h-3.5"
                        title={ua.browserName}
                      />
                      <span className="truncate font-medium">
                        {ua.browserName}
                        {ua.browserVersion ? ` ${ua.browserVersion}` : ''}
                      </span>
                    </span>
                    <span className="flex items-center gap-1.5 truncate">
                      <OsIcon os={ua.os} className="w-3.5 h-3.5" title={ua.osName} />
                      <span className="truncate font-medium">{ua.osName}</span>
                    </span>
                    <span className="flex items-center gap-1.5 truncate">
                      <DeviceIcon device={ua.device} className="w-3.5 h-3.5" />
                      <span className="truncate font-medium capitalize">
                        {ua.device}
                      </span>
                    </span>
                    {localTime && (
                      <span className="flex items-center gap-1.5 truncate">
                        <Clock className="w-3.5 h-3.5 text-ink-3 shrink-0" />
                        <span className="truncate font-medium">{localTime}</span>
                      </span>
                    )}
                    <span className="flex items-center gap-1.5 truncate text-[11px] text-ink-3">
                      <Clock className="w-3 h-3 shrink-0" />
                      Since {formatTimeAgo(visitor.first_seen)}
                    </span>
                  </div>

                  {/* Action CTA */}
                  <button
                    onClick={() => onOpenConversationForVisitor(visitor.id)}
                    className="btn btn-primary w-full shadow-xs hover:shadow transition-all"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Open Conversation
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
