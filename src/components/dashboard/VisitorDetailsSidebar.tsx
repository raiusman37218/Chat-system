'use client';

import React, { useEffect, useState } from 'react';
import {
  Clock,
  ExternalLink,
  Globe,
  Hash,
  Mail,
  User,
  Plus,
  X,
} from 'lucide-react';
import {
  Visitor,
  Conversation,
  Agent,
} from '@/types/database';
import { formatTimeAgo, cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import {
  BrowserIcon,
  CountryFlag,
  DeviceIcon,
  OsIcon,
} from '@/components/ui/BrandIcon';
import {
  languageLabel,
  localTimeIn,
  parseLocation,
  parseUserAgentDetailed,
  timezoneFrom,
} from '@/lib/visitor-meta';
import { EmptyState } from '@/components/ui/EmptyState';
import { createClient } from '@/lib/supabase/client';

interface VisitorDetailsSidebarProps {
  visitor: Visitor | null | undefined;
  conversation: Conversation;
  currentAgent?: Agent | null;
  onSelectConversation?: (id: string) => void;
  onUpdateTags?: (tags: string[]) => Promise<void>;
  onClose?: () => void;
}

const PRESET_TAGS = [
  'VIP',
  'Billing',
  'Bug',
  'Sales lead',
  'Feature request',
  'Urgent',
];

function Row({
  Icon,
  label,
  children,
}: {
  Icon: any;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 px-3 py-2 text-[12px]">
      <span className="flex items-center gap-2 text-ink-3 shrink-0">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </span>
      <span className="font-medium text-ink text-right min-w-0 truncate">
        {children}
      </span>
    </div>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between px-1">
        <h3 className="eyebrow text-[11px] font-bold tracking-wider text-ink-3">
          {title}
        </h3>
        {action}
      </div>
      <div className="rounded-xl border border-line bg-surface-2 divide-y divide-line/60 overflow-hidden shadow-xs">
        {children}
      </div>
    </div>
  );
}

export function VisitorDetailsSidebar({
  visitor,
  conversation,
  currentAgent,
  onSelectConversation,
  onUpdateTags,
  onClose,
}: VisitorDetailsSidebarProps) {
  const [liveVisitor, setLiveVisitor] = useState<Visitor | null>(visitor || null);
  const [pastConversations, setPastConversations] = useState<Conversation[]>([]);
  const [showTagInput, setShowTagInput] = useState(false);
  const [customTag, setCustomTag] = useState('');

  // 1. Sync & Realtime live visitor updates (URL & last seen changes)
  useEffect(() => {
    setLiveVisitor(visitor || null);
    if (!visitor?.id) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`sidebar-visitor-${visitor.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'visitors',
          filter: `id=eq.${visitor.id}`,
        },
        (payload) => {
          setLiveVisitor((prev) => ({
            ...(prev || ({} as Visitor)),
            ...(payload.new as Visitor),
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [visitor]);

  // 2. Fetch Past Conversation History for this Visitor
  useEffect(() => {
    const vid = visitor?.id || conversation.visitor_id;
    if (!vid) return;

    const supabase = createClient();
    supabase
      .from('conversations')
      .select('id, status, priority, created_at, updated_at')
      .eq('visitor_id', vid)
      .neq('id', conversation.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setPastConversations(data as Conversation[]);
      });
  }, [visitor?.id, conversation.id, conversation.visitor_id]);

  // Tag Handlers
  const handleToggleTag = (tag: string) => {
    if (!onUpdateTags) return;
    const currentTags = conversation.tags || [];
    const nextTags = currentTags.includes(tag)
      ? currentTags.filter((t) => t !== tag)
      : [...currentTags, tag];
    onUpdateTags(nextTags);
  };

  const handleAddCustomTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTag.trim() || !onUpdateTags) return;
    const clean = customTag.trim();
    const currentTags = conversation.tags || [];
    if (!currentTags.includes(clean)) {
      onUpdateTags([...currentTags, clean]);
    }
    setCustomTag('');
    setShowTagInput(false);
  };

  if (!liveVisitor) {
    return (
      <aside className="hidden xl:flex w-[320px] shrink-0 h-screen border-l border-line bg-surface flex-col items-center justify-center gap-3 px-6 text-center select-none">
        <div className="w-10 h-10 rounded-xl bg-surface-2 border border-line flex items-center justify-center text-ink-3">
          <User className="w-5 h-5" />
        </div>
        <p className="text-[12.5px] text-ink-3">No visitor profile available</p>
      </aside>
    );
  }

  const ua = parseUserAgentDetailed(liveVisitor.user_agent);
  const place = parseLocation(
    liveVisitor.location,
    liveVisitor.ip_location_city,
    liveVisitor.ip_location_country
  );
  const timezone = liveVisitor.timezone || timezoneFrom(liveVisitor.location);
  const localTime = localTimeIn(timezone);
  const isOnline = liveVisitor.last_seen
    ? (Date.now() - new Date(liveVisitor.last_seen).getTime()) / 1000 < 90
    : false;

  const displayName =
    liveVisitor.name ||
    (liveVisitor.email ? liveVisitor.email.split('@')[0] : 'Anonymous Visitor');

  const liveUrl =
    liveVisitor.current_page_url || liveVisitor.current_url || '/';

  const [copiedEmail, setCopiedEmail] = useState(false);

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  return (
    <aside className="hidden xl:flex w-[280px] 2xl:w-[300px] shrink-0 h-screen border-l border-line bg-surface flex-col overflow-y-auto select-none relative z-10">
      {/* ── 1. Profile Header & Identity ── */}
      <div className="px-5 py-6 flex flex-col items-center text-center border-b border-line/80 relative bg-surface-2/40">
        {onClose && (
          <button
            onClick={onClose}
            title="Close sidebar"
            className="absolute top-3 right-3 p-1.5 rounded-lg text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <Avatar
          name={displayName}
          seed={liveVisitor.id}
          size="lg"
          muted={!liveVisitor.name && !liveVisitor.email}
          online={isOnline}
          className="shadow-sm ring-2 ring-black/5 dark:ring-white/10"
        />
        <h2 className="mt-3 text-[15px] font-bold tracking-tight text-ink">
          {displayName}
        </h2>

        {liveVisitor.email ? (
          <div className="mt-1 flex items-center gap-1.5 max-w-full">
            <a
              href={`mailto:${liveVisitor.email}`}
              className="inline-flex items-center gap-1.5 text-[12px] text-ink-2 hover:text-accent transition-colors truncate font-medium"
            >
              <Mail className="w-3.5 h-3.5 shrink-0 text-ink-3" />
              <span className="truncate">{liveVisitor.email}</span>
            </a>
            <button
              onClick={() => handleCopyEmail(liveVisitor.email!)}
              title={copiedEmail ? 'Copied!' : 'Copy email'}
              className="text-[10px] text-ink-3 hover:text-ink px-1.5 py-0.5 rounded bg-surface-3 hover:bg-surface-2 transition-colors shrink-0"
            >
              {copiedEmail ? 'Copied' : 'Copy'}
            </button>
          </div>
        ) : (
          <p className="mt-1 text-[11.5px] text-ink-3">Anonymous visitor</p>
        )}

        <span
          className={cn(
            'mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border shadow-xs',
            isOnline
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
              : 'bg-surface-2 text-ink-3 border-line'
          )}
        >
          {isOnline ? (
            <>
              <span className="live-dot" />
              Active on website
            </>
          ) : (
            <>Last seen {formatTimeAgo(liveVisitor.last_seen || liveVisitor.last_seen_at)}</>
          )}
        </span>
      </div>

      <div className="p-4 space-y-4">
        {/* ── 2. Live Currently Viewing Page ── */}
        <Section title="Currently Viewing">
          <div className="px-3 py-2.5">
            <a
              href={liveUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-start gap-2 group"
            >
              <Globe className="w-3.5 h-3.5 text-accent mt-0.5 shrink-0" />
              <span className="min-w-0 flex-1">
                <span className="block font-mono text-[11px] leading-relaxed text-accent break-all group-hover:underline">
                  {liveUrl}
                </span>
                {liveVisitor.current_page_title && (
                  <span className="block text-[10.5px] text-ink-3 truncate mt-0.5">
                    {liveVisitor.current_page_title}
                  </span>
                )}
              </span>
              <ExternalLink className="w-3 h-3 text-ink-3 mt-0.5 shrink-0" />
            </a>
          </div>
        </Section>

        {/* ── 3. Location ── */}
        <Section title="Location">
          {/* A dead "Unknown location" row is worse than no row when the time
              below already tells the agent which region they are in. */}
          {(place.label || !localTime) && (
            <div className="px-3 py-2.5 flex items-center gap-2.5">
              <CountryFlag flag={place.flag} />
              <span className="text-[12.5px] font-medium text-ink truncate">
                {place.label || 'Location unavailable'}
              </span>
            </div>
          )}

          {localTime && (
            <div className="px-3 py-2.5 flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-ink-3 shrink-0" />
              <span className="text-[12.5px] font-medium text-ink truncate">
                {localTime}
                <span className="ml-1.5 font-normal text-ink-3">
                  ({timezone})
                </span>
              </span>
            </div>
          )}

          {liveVisitor.language && (
            <div className="px-3 py-2.5 flex items-center gap-2.5">
              <Globe className="w-4 h-4 text-ink-3 shrink-0" />
              <span className="text-[12.5px] font-medium text-ink truncate">
                {languageLabel(liveVisitor.language)}
              </span>
            </div>
          )}

          {liveVisitor.ip_address && (
            <div className="px-3 py-2.5 flex items-center gap-2.5">
              <Hash className="w-4 h-4 text-ink-3 shrink-0" />
              <span className="font-mono text-[12px] text-ink truncate">
                {liveVisitor.ip_address}
              </span>
            </div>
          )}
        </Section>

        {/* ── 4. Device ── */}
        <Section title="Device">
          <div className="px-3 py-2.5 flex items-center gap-2.5">
            <BrowserIcon browser={ua.browser} title={ua.browserName} />
            <span className="text-[12.5px] font-medium text-ink truncate">
              {ua.browserName}
              {ua.browserVersion && (
                <span className="ml-1 font-normal text-ink-2">
                  {ua.browserVersion}
                </span>
              )}
            </span>
          </div>

          <div className="px-3 py-2.5 flex items-center gap-2.5">
            <OsIcon os={ua.os} title={ua.osName} />
            <span className="text-[12.5px] font-medium text-ink truncate">
              {ua.osName}
              {ua.osVersion && (
                <span className="ml-1 font-normal text-ink-2">
                  {ua.osVersion}
                </span>
              )}
            </span>
          </div>

          <div className="px-3 py-2.5 flex items-center gap-2.5">
            <DeviceIcon device={ua.device} />
            <span className="text-[12.5px] font-medium text-ink capitalize truncate">
              {ua.device}
            </span>
          </div>
        </Section>

        {/* ── 5. Session ── */}
        <Section title="Session">
          <Row Icon={Hash} label="Visits">
            <span className="tabular-nums">
              {liveVisitor.visit_count || 1} session
              {(liveVisitor.visit_count || 1) > 1 ? 's' : ''}
            </span>
          </Row>
          <Row Icon={Clock} label="First seen">
            {formatTimeAgo(liveVisitor.first_seen_at || liveVisitor.first_seen)}
          </Row>
        </Section>

        {/* ── 4. Tags Section ── */}
        <Section
          title="Tags"
          action={
            <button
              onClick={() => setShowTagInput(!showTagInput)}
              className="text-[11px] text-accent hover:underline flex items-center gap-0.5 font-semibold"
            >
              <Plus className="w-3 h-3" />
              Add
            </button>
          }
        >
          <div className="p-3">
            <div className="flex flex-wrap gap-1.5">
              {(conversation.tags || []).length === 0 && !showTagInput ? (
                <div className="py-2 text-center w-full">
                  <p className="text-[11.5px] text-ink-3 mb-2">No tags applied yet</p>
                  <div className="flex flex-wrap justify-center gap-1">
                    {PRESET_TAGS.slice(0, 4).map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => handleToggleTag(preset)}
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-surface-2 text-ink-2 border border-line hover:border-accent hover:text-accent transition-colors"
                      >
                        +{preset}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                (conversation.tags || []).map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 bg-surface-3 text-ink text-[11px] font-medium px-2 py-0.5 rounded-md border border-line"
                  >
                    #{tag}
                    <button
                      onClick={() => handleToggleTag(tag)}
                      className="text-ink-3 hover:text-ink ml-0.5"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))
              )}
            </div>

            {/* Tag Add Dropdown / Input */}
            {showTagInput && (
              <div className="mt-2.5 pt-2 border-t border-line/60 space-y-2">
                <div className="flex flex-wrap gap-1">
                  {PRESET_TAGS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleToggleTag(preset)}
                      className={cn(
                        'text-[10.5px] px-1.5 py-0.5 rounded border transition-colors',
                        (conversation.tags || []).includes(preset)
                          ? 'bg-accent text-white border-accent'
                          : 'bg-surface text-ink-2 border-line hover:border-accent'
                      )}
                    >
                      +{preset}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleAddCustomTag} className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder="New tag…"
                    value={customTag}
                    onChange={(e) => setCustomTag(e.target.value)}
                    className="input input-xs flex-1 text-[11px]"
                  />
                  <button type="submit" className="btn btn-xs btn-primary">
                    Add
                  </button>
                </form>
              </div>
            )}
          </div>
        </Section>

        {/* ── 5. Past Conversation History ── */}
        <Section title="Past Conversations">
          <div className="p-2 space-y-1 max-h-40 overflow-y-auto">
            {pastConversations.length === 0 ? (
              <p className="text-[11.5px] text-ink-3 px-2 py-1">
                No previous conversations recorded
              </p>
            ) : (
              pastConversations.map((past) => (
                <button
                  key={past.id}
                  onClick={() => onSelectConversation?.(past.id)}
                  className="w-full text-left p-2 rounded-lg hover:bg-surface-3 transition-colors flex items-center justify-between gap-2 group"
                >
                  <div className="min-w-0">
                    <span className="font-mono text-[11px] text-ink font-semibold block">
                      #{past.id.slice(0, 8)}
                    </span>
                    <span className="text-[10.5px] text-ink-3">
                      {formatTimeAgo(past.created_at)}
                    </span>
                  </div>
                  <span
                    className={cn(
                      'text-[10px] uppercase font-bold px-1.5 py-0.5 rounded',
                      past.status === 'closed'
                        ? 'bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        : past.status === 'snoozed'
                        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                        : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                    )}
                  >
                    {past.status}
                  </span>
                </button>
              ))
            )}
          </div>
        </Section>

        {/* Internal notes are written from the thread composer's "Note" mode,
            which stores them inline with the conversation. A second composer
            here wrote to a different table, so a note left in one place never
            showed up in the other. */}
      </div>
    </aside>
  );
}
