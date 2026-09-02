'use client';

import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  Search,
  Clock,
  Star,
  X,
  Tag as TagIcon,
  Sparkles,
  Smile,
  Frown,
  SlidersHorizontal,
} from 'lucide-react';
import {
  Conversation,
  ConversationStatus,
  ChannelType,
  Agent,
} from '@/types/database';
import { formatTimeAgo, cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import { ChannelBadge } from '@/components/ui/ChannelBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConversationListSkeleton } from '@/components/ui/Skeleton';

/** Who owns the conversation. Open / snoozed / closed is a separate axis. */
export type InboxQueue = 'all' | 'unassigned' | 'mine';
export type StatusView = 'open' | 'snoozed' | 'closed';

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversationId: string | null;
  onSelectConversation: (id: string) => void;
  currentAgent?: Agent | null;
  statusFilter?: ConversationStatus | 'all';
  loading?: boolean;
}

const STATUS_LABEL: Record<ConversationStatus, string> = {
  open: 'Open',
  pending: 'Pending',
  closed: 'Resolved',
  snoozed: 'Snoozed',
};

const CHANNELS: { value: ChannelType | 'all'; label: string }[] = [
  { value: 'all', label: 'All Channels' },
  { value: 'web', label: 'Web' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Messenger' },
  { value: 'linkedin', label: 'LinkedIn' },
];

function displayNameFor(conv: Conversation) {
  return (
    conv.visitor?.name ||
    (conv.visitor?.email
      ? conv.visitor.email.split('@')[0]
      : conv.channel_user_id
      ? `${conv.channel?.toUpperCase() || 'CHAT'}: ${conv.channel_user_id}`
      : `Visitor ${conv.visitor_id.slice(0, 6)}`)
  );
}

export function ConversationList({
  conversations,
  selectedConversationId,
  onSelectConversation,
  currentAgent,
  loading = false,
}: ConversationListProps) {
  const [activeQueue, setActiveQueue] = useState<InboxQueue>('all');
  const [statusView, setStatusView] = useState<StatusView>('open');
  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState<ChannelType | 'all'>('all');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!showFilters) return;
    const onDown = (e: MouseEvent) => {
      if (!filterRef.current?.contains(e.target as Node)) setShowFilters(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [showFilters]);

  /** True when the conversation belongs to the status view being shown. */
  const inStatusView = (c: Conversation, view: StatusView) => {
    const isClosed = c.status === 'closed';
    const isSnoozed = c.status === 'snoozed';
    if (view === 'closed') return isClosed;
    if (view === 'snoozed') return isSnoozed;
    return !isClosed && !isSnoozed;
  };

  // Queue counts are scoped to the current status view, so a tab never
  // promises more conversations than the list actually shows.
  const counts = useMemo(() => {
    let all = 0;
    let unassigned = 0;
    let mine = 0;
    let snoozed = 0;
    let closed = 0;

    conversations.forEach((c) => {
      if (c.status === 'snoozed') snoozed++;
      if (c.status === 'closed') closed++;
      if (!inStatusView(c, statusView)) return;

      const agentId = c.assigned_agent_id || c.agent_id;
      all++;
      if (!agentId) unassigned++;
      if (currentAgent?.id && agentId === currentAgent.id) mine++;
    });

    return { all, unassigned, mine, snoozed, closed };
  }, [conversations, currentAgent?.id, statusView]);

  // Extract all distinct tags present in conversations
  const availableTags = useMemo(() => {
    const set = new Set<string>(['Billing', 'Bug', 'Refund', 'VIP', 'Sales lead', 'Urgent']);
    conversations.forEach((c) => {
      c.tags?.forEach((t) => set.add(t));
    });
    return Array.from(set);
  }, [conversations]);

  // Filter and sort conversations
  const filteredAndSorted = useMemo(() => {
    const list = conversations.filter((conv) => {
      const agentId = conv.assigned_agent_id || conv.agent_id;

      // 1. Status view (open / snoozed / closed)
      if (!inStatusView(conv, statusView)) return false;

      // 2. Queue (who owns it)
      if (activeQueue === 'unassigned' && agentId) return false;
      if (activeQueue === 'mine' && agentId !== currentAgent?.id) return false;

      // 2. Channel Filter
      if (channelFilter !== 'all' && (conv.channel || 'web') !== channelFilter) {
        return false;
      }

      // 3. Tag Filter
      if (
        selectedTagFilter !== 'all' &&
        (!conv.tags || !conv.tags.includes(selectedTagFilter))
      ) {
        return false;
      }

      // 4. Search Query Filter (deep matching name, email, keyword, tag, or id)
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;

      return (
        (conv.visitor?.name?.toLowerCase() || '').includes(q) ||
        (conv.visitor?.email?.toLowerCase() || '').includes(q) ||
        (conv.channel_user_id?.toLowerCase() || '').includes(q) ||
        (conv.last_message?.content?.toLowerCase() || '').includes(q) ||
        (conv.tags?.some((t) => t.toLowerCase().includes(q)) ?? false) ||
        conv.id.toLowerCase().includes(q)
      );
    });

    // 5. Priority Sorting: Urgent always at the top!
    return list.sort((a, b) => {
      if (a.priority === 'urgent' && b.priority !== 'urgent') return -1;
      if (b.priority === 'urgent' && a.priority !== 'urgent') return 1;

      if (a.priority === 'high' && b.priority !== 'high') return -1;
      if (b.priority === 'high' && a.priority !== 'high') return 1;

      const timeA = new Date(a.updated_at || a.created_at).getTime();
      const timeB = new Date(b.updated_at || b.created_at).getTime();
      return timeB - timeA;
    });
  }, [
    conversations,
    activeQueue,
    statusView,
    channelFilter,
    selectedTagFilter,
    searchQuery,
    currentAgent?.id,
  ]);

  const hasActiveFilters =
    channelFilter !== 'all' || selectedTagFilter !== 'all' || statusView !== 'open';

  const isVisitorOnline = (lastSeen?: string) => {
    if (!lastSeen) return false;
    return (Date.now() - new Date(lastSeen).getTime()) / 1000 < 90;
  };

  const queueTabs: { id: InboxQueue; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: counts.all },
    { id: 'unassigned', label: 'Unassigned', count: counts.unassigned },
    { id: 'mine', label: 'Mine', count: counts.mine },
  ];

  const statusViews: { id: StatusView; label: string; count?: number }[] = [
    { id: 'open', label: 'Open' },
    { id: 'snoozed', label: 'Snoozed', count: counts.snoozed },
    { id: 'closed', label: 'Closed', count: counts.closed },
  ];

  return (
    <div className="w-[340px] shrink-0 h-screen flex flex-col border-r border-line bg-surface select-none">
      {/* ── Header: title + search, then one row of queues.
          Channel and tag filters used to sit here as two more scrolling pill
          strips; they live behind the Filter button now, because they are
          occasional controls and were pushing the actual conversations below
          the fold. ── */}
      <div className="px-3 pt-3.5 pb-2.5 border-b border-line space-y-2.5">
        <div className="flex items-center justify-between gap-2 px-1">
          <h2 className="text-[14px] font-semibold tracking-tight text-ink">
            Inbox
          </h2>
          <span className="text-[11px] text-ink-3 tabular-nums">
            {filteredAndSorted.length}
          </span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-ink-3 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search conversations"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input input-sm pl-8.5 pr-12 bg-surface-2 text-[12.5px] w-full"
          />
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md flex items-center justify-center text-ink-3 hover:text-ink hover:bg-surface-3 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <span className="kbd absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
              Ctrl K
            </span>
          )}
        </div>

        {/* Queues + filter affordance */}
        <div className="flex items-center gap-1.5">
          <div className="flex-1 min-w-0 flex items-center gap-0.5 p-0.5 rounded-lg bg-surface-2 border border-line overflow-x-auto scrollbar-none">
            {queueTabs.map((tab) => {
              const active = activeQueue === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveQueue(tab.id)}
                  title={tab.label + ' (' + tab.count + ')'}
                  className={cn(
                    'h-6 px-2 rounded-md text-[11.5px] font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 shrink-0',
                    active
                      ? 'bg-surface text-ink shadow-xs font-semibold'
                      : 'text-ink-3 hover:text-ink'
                  )}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span
                      className={cn(
                        'tabular-nums text-[10px]',
                        active ? 'text-accent' : 'text-ink-3'
                      )}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div ref={filterRef} className="relative shrink-0">
            <button
              onClick={() => setShowFilters((v) => !v)}
              aria-label="Filters"
              className={cn(
                'w-7 h-7 rounded-lg border flex items-center justify-center transition-colors relative',
                hasActiveFilters
                  ? 'border-accent-line bg-accent-soft text-accent'
                  : 'border-line bg-surface-2 text-ink-3 hover:text-ink'
              )}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>

            {showFilters && (
              <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-60 p-2.5 rounded-xl border border-line bg-surface shadow-lg animate-pop">
                {/* Open / snoozed / closed is a state, not a queue — keeping it
                    out of the tab row is what stops that row overflowing. */}
                <div className="eyebrow mb-1.5">Status</div>
                <div className="flex flex-wrap gap-1 mb-3">
                  {statusViews.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setStatusView(v.id)}
                      className={cn(
                        'px-2 h-6 rounded-md text-[11px] font-medium transition-colors inline-flex items-center gap-1.5',
                        statusView === v.id
                          ? 'bg-ink text-ink-inv'
                          : 'bg-surface-2 text-ink-2 hover:bg-surface-3'
                      )}
                    >
                      {v.label}
                      {v.count ? (
                        <span className="tabular-nums opacity-70">{v.count}</span>
                      ) : null}
                    </button>
                  ))}
                </div>

                <div className="eyebrow mb-1.5">Channel</div>
                <div className="flex flex-wrap gap-1 mb-3">
                  {CHANNELS.map((ch) => (
                    <button
                      key={ch.value}
                      onClick={() => setChannelFilter(ch.value)}
                      className={cn(
                        'px-2 h-6 rounded-md text-[11px] font-medium transition-colors',
                        channelFilter === ch.value
                          ? 'bg-ink text-ink-inv'
                          : 'bg-surface-2 text-ink-2 hover:bg-surface-3'
                      )}
                    >
                      {ch.label}
                    </button>
                  ))}
                </div>

                <div className="eyebrow mb-1.5">Tag</div>
                <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                  <button
                    onClick={() => setSelectedTagFilter('all')}
                    className={cn(
                      'px-2 h-6 rounded-md text-[11px] font-medium transition-colors',
                      selectedTagFilter === 'all'
                        ? 'bg-ink text-ink-inv'
                        : 'bg-surface-2 text-ink-2 hover:bg-surface-3'
                    )}
                  >
                    Any
                  </button>
                  {availableTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() =>
                        setSelectedTagFilter(
                          selectedTagFilter === tag ? 'all' : tag
                        )
                      }
                      className={cn(
                        'px-2 h-6 rounded-md text-[11px] font-medium transition-colors',
                        selectedTagFilter === tag
                          ? 'bg-ink text-ink-inv'
                          : 'bg-surface-2 text-ink-2 hover:bg-surface-3'
                      )}
                    >
                      {tag}
                    </button>
                  ))}
                </div>

                {hasActiveFilters && (
                  <button
                    onClick={() => {
                      setChannelFilter('all');
                      setSelectedTagFilter('all');
                      setStatusView('open');
                    }}
                    className="mt-3 w-full btn btn-xs btn-secondary"
                  >
                    Reset filters
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Active filters, shown only when they are actually narrowing things */}
        {hasActiveFilters && (
          <div className="flex items-center gap-1 flex-wrap px-0.5">
            {statusView !== 'open' && (
              <button
                onClick={() => setStatusView('open')}
                className="pill pill-accent"
              >
                {statusView === 'closed' ? 'Closed' : 'Snoozed'}
                <X className="w-2.5 h-2.5 opacity-60" />
              </button>
            )}
            {channelFilter !== 'all' && (
              <button
                onClick={() => setChannelFilter('all')}
                className="pill pill-accent"
              >
                {CHANNELS.find((c) => c.value === channelFilter)?.label}
                <X className="w-2.5 h-2.5 opacity-60" />
              </button>
            )}
            {selectedTagFilter !== 'all' && (
              <button
                onClick={() => setSelectedTagFilter('all')}
                className="pill pill-accent"
              >
                {selectedTagFilter}
                <X className="w-2.5 h-2.5 opacity-60" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── 2. Conversation List (with Urgent Priority Sorting & Badges) ── */}
      <div className="flex-1 overflow-y-auto divide-y divide-line/60">
        {loading ? (
          <ConversationListSkeleton count={6} />
        ) : filteredAndSorted.length === 0 ? (
          <div className="h-full flex items-center justify-center p-4">
            {searchQuery ? (
              <EmptyState
                type="no-search-results"
                title="No matching threads"
                description={`No conversations matched "${searchQuery}". Try another keyword or clear your query.`}
                actionLabel="Clear Search"
                onAction={() => setSearchQuery('')}
              />
            ) : (
              <EmptyState
                type="no-conversations"
                title={
                  statusView === 'closed'
                    ? 'No closed conversations'
                    : statusView === 'snoozed'
                    ? 'No snoozed conversations'
                    : activeQueue === 'unassigned'
                    ? 'Nothing unassigned'
                    : activeQueue === 'mine'
                    ? 'Nothing assigned to you'
                    : 'Inbox zero'
                }
                description={
                  channelFilter !== 'all' || selectedTagFilter !== 'all'
                    ? 'No conversations match the currently selected filters.'
                    : 'When visitors send a message on your site, conversations appear here live.'
                }
                actionLabel={channelFilter !== 'all' || selectedTagFilter !== 'all' ? 'Reset Filters' : undefined}
                onAction={() => {
                  setChannelFilter('all');
                  setSelectedTagFilter('all');
                }}
              />
            )}
          </div>
        ) : (
          filteredAndSorted.map((conv) => {
            const selected = conv.id === selectedConversationId;
            const online = isVisitorOnline(
              conv.visitor?.last_seen || conv.visitor?.last_seen_at
            );
            const name = displayNameFor(conv);
            const fromAgent = conv.last_message?.sender_type === 'agent';
            const fromAi = conv.last_message?.sender_type === 'ai';
            const hasUnread = (conv.unread_count || 0) > 0;
            const isUrgent = conv.priority === 'urgent';

            return (
              <button
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className={cn(
                  'w-full text-left p-3.5 transition-all flex items-start gap-3 relative border-l-3',
                  selected
                    ? 'bg-surface-2 border-accent shadow-xs'
                    : hasUnread
                    ? 'bg-blue-50/30 dark:bg-blue-950/15 border-blue-500 hover:bg-surface-2'
                    : isUrgent
                    ? 'bg-red-50/30 dark:bg-red-950/15 border-red-500 hover:bg-surface-2'
                    : 'border-transparent hover:bg-surface-2/60'
                )}
              >
                {/* Visitor Avatar with live online indicator */}
                <Avatar
                  name={name}
                  seed={conv.visitor_id}
                  size="md"
                  online={online}
                  muted={!conv.visitor?.name && !conv.visitor?.email}
                  className="shrink-0 mt-0.5"
                />

                {/* Conversation Meta & Snippet */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1.5">
                    <span
                      className={cn(
                        'text-[13px] truncate flex items-center gap-1.5',
                        hasUnread
                          ? 'font-bold text-ink'
                          : selected
                          ? 'font-semibold text-ink'
                          : 'font-medium text-ink-2'
                      )}
                    >
                      {name}
                    </span>

                    {/* Relative Timestamp */}
                    <span className="text-[11px] text-ink-3 shrink-0 tabular-nums font-mono">
                      {formatTimeAgo(conv.updated_at || conv.created_at)}
                    </span>
                  </div>

                  {/* 2-Line AI Summary for long threads, or Last Message Snippet */}
                  {conv.summary ? (
                    <div className="mt-1.5 p-2 rounded-lg bg-accent-soft/35 border border-accent-line/60 text-[11.5px] leading-tight">
                      <div className="flex items-center gap-1 text-[9.5px] font-bold text-accent uppercase tracking-wide mb-1">
                        <Sparkles className="w-2.5 h-2.5" />
                        AI Summary
                      </div>
                      <p className="line-clamp-2 italic text-ink-2 font-medium">
                        {conv.summary}
                      </p>
                    </div>
                  ) : (
                    <p
                      className={cn(
                        'text-[12px] truncate mt-1 leading-snug',
                        hasUnread
                          ? 'font-semibold text-ink dark:text-slate-100'
                          : 'text-ink-3'
                      )}
                    >
                      {fromAgent ? (
                        <span className="text-ink-2 font-medium">You: </span>
                      ) : fromAi ? (
                        <span className="text-purple-500 font-medium">🤖 AI: </span>
                      ) : null}
                      {conv.last_message?.content ||
                        (conv.last_message?.attachment_url
                          ? '📎 Attachment'
                          : 'Conversation started')}
                    </p>
                  )}

                  {/* Badges Footer: Priority, Channel, Sentiment, Assigned Agent, Tags */}
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    {/* Urgent already sorts to the top of the list; a pulsing
                        all-caps flag on top of that was shouting. */}
                    {isUrgent && <span className="pill pill-danger">Urgent</span>}

                    {conv.priority === 'high' && (
                      <span className="pill pill-warn">High</span>
                    )}

                    {/* Only a positive or negative read is worth a row badge;
                        "Neutral" would appear on nearly every conversation. */}
                    {(conv.sentiment === 'positive' ||
                      conv.sentiment === 'negative') && (
                      <span
                        className={cn(
                          'pill',
                          conv.sentiment === 'positive'
                            ? 'pill-success'
                            : 'pill-danger'
                        )}
                        title={`Visitor sentiment: ${conv.sentiment}`}
                      >
                        {conv.sentiment === 'positive' ? (
                          <Smile className="w-2.5 h-2.5" />
                        ) : (
                          <Frown className="w-2.5 h-2.5" />
                        )}
                        {conv.sentiment === 'positive' ? 'Positive' : 'Frustrated'}
                      </span>
                    )}

                    {conv.channel && conv.channel !== 'web' && (
                      <ChannelBadge channel={conv.channel} />
                    )}

                    {/* Assigned Agent Pill */}
                    {conv.agent && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-ink-2 bg-surface-3 px-1.5 py-0.5 rounded border border-line">
                        <Avatar
                          name={conv.agent.name}
                          seed={conv.agent.id}
                          size="xs"
                        />
                        <span className="truncate max-w-[70px]">
                          {conv.agent.name.split(' ')[0]}
                        </span>
                      </span>
                    )}

                    {/* Tags Pills */}
                    {conv.tags?.slice(0, 2).map((t) => (
                      <span
                        key={t}
                        className="text-[9.5px] text-ink-3 bg-surface-2 px-1.5 py-0.5 rounded border border-line truncate max-w-[60px]"
                      >
                        #{t}
                      </span>
                    ))}

                    {conv.status === 'snoozed' && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-600 dark:text-amber-400 bg-amber-500/15 px-1.5 py-0.5 rounded font-medium">
                        <Clock className="w-2.5 h-2.5" />
                        Snoozed
                      </span>
                    )}

                    {conv.csat_rating && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-500 font-medium bg-amber-500/10 px-1.5 py-0.5 rounded">
                        <Star className="w-2.5 h-2.5 fill-current" />
                        {conv.csat_rating}/5
                      </span>
                    )}
                  </div>
                </div>

                {/* Blue Unread Dot */}
                {hasUnread && (
                  <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5 shadow-xs" />
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
