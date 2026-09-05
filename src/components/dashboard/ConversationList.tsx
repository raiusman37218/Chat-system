'use client';

import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  Search,
  Clock,
  Star,
  X,
  Tag as TagIcon,
  Sparkles,
  SlidersHorizontal,
  Check,
  CheckCheck,
  ArrowUpDown,
  User,
  MessageSquare,
  AlertCircle,
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

export type InboxQueue = 'all' | 'waiting' | 'unassigned' | 'mine';
export type StatusView = 'open' | 'snoozed' | 'closed';
export type SortOption = 'newest' | 'waiting' | 'unread' | 'priority';

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversationId: string | null;
  onSelectConversation: (id: string) => void;
  currentAgent?: Agent | null;
  statusFilter?: ConversationStatus | 'all';
  loading?: boolean;
}

const CHANNELS: { value: ChannelType | 'all'; label: string }[] = [
  { value: 'all', label: 'All Channels' },
  { value: 'web', label: 'Web' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Messenger' },
  { value: 'linkedin', label: 'LinkedIn' },
];

const SORT_LABELS: Record<SortOption, { label: string; desc: string }> = {
  newest: { label: 'Newest Activity', desc: 'Latest message on top' },
  waiting: { label: 'Needs Reply First', desc: 'Waiting customers on top' },
  unread: { label: 'Unread First', desc: 'Unread messages on top' },
  priority: { label: 'Urgent & High', desc: 'Urgent priority on top' },
};

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

/**
 * When something last actually HAPPENED in the conversation.
 *
 * Deliberately ignores `updated_at`. That column is a row-modified timestamp:
 * adding a tag, changing priority, assigning an agent, toggling AI and snoozing
 * all bump it. Ranking on it meant that tagging a two-day-old conversation
 * threw it to the top of the inbox and relabelled it "just now", with nothing
 * on screen explaining why. The only honest signals are the last message and,
 * for a conversation with no messages yet, when it opened.
 */
function getLastActivityTime(conv: Conversation): number {
  if (conv.last_message?.created_at) {
    return new Date(conv.last_message.created_at).getTime();
  }
  return conv.created_at ? new Date(conv.created_at).getTime() : 0;
}

function isWaitingOnAgent(conv: Conversation): boolean {
  if (conv.status === 'closed' || conv.status === 'snoozed') return false;
  if ((conv.unread_count || 0) > 0) return true;
  if (conv.last_message && conv.last_message.sender_type === 'visitor') return true;
  if (!conv.last_message) return true;
  return false;
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
  const [sortBy, setSortBy] = useState<SortOption>('newest');
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
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [showFilters]);

  /** True when the conversation belongs to the status view being shown. */
  const inStatusView = (c: Conversation, view: StatusView) => {
    const isClosed = c.status === 'closed';
    const isSnoozed = c.status === 'snoozed';
    if (view === 'closed') return isClosed;
    if (view === 'snoozed') return isSnoozed;
    return !isClosed && !isSnoozed;
  };

  // Queue counts scoped to the current status view
  const counts = useMemo(() => {
    let all = 0;
    let waiting = 0;
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
      if (isWaitingOnAgent(c)) waiting++;
      if (!agentId) unassigned++;
      if (currentAgent?.id && agentId === currentAgent.id) mine++;
    });

    return { all, waiting, unassigned, mine, snoozed, closed };
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

      // 2. Queue (who owns it or waiting status)
      if (activeQueue === 'waiting' && !isWaitingOnAgent(conv)) return false;
      if (activeQueue === 'unassigned' && agentId) return false;
      if (activeQueue === 'mine' && agentId !== currentAgent?.id) return false;

      // 3. Channel Filter
      if (channelFilter !== 'all' && (conv.channel || 'web') !== channelFilter) {
        return false;
      }

      // 4. Tag Filter
      if (
        selectedTagFilter !== 'all' &&
        (!conv.tags || !conv.tags.includes(selectedTagFilter))
      ) {
        return false;
      }

      // 5. Search Query Filter
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

    // Sort order: Industry standard customer support workflow
    return list.sort((a, b) => {
      const timeA = getLastActivityTime(a);
      const timeB = getLastActivityTime(b);

      if (sortBy === 'waiting') {
        const aWait = isWaitingOnAgent(a) ? 1 : 0;
        const bWait = isWaitingOnAgent(b) ? 1 : 0;
        if (aWait !== bWait) return bWait - aWait;
        return timeB - timeA;
      }

      if (sortBy === 'unread') {
        const aUnread = (a.unread_count || 0) > 0 ? 1 : 0;
        const bUnread = (b.unread_count || 0) > 0 ? 1 : 0;
        if (aUnread !== bUnread) return bUnread - aUnread;
        return timeB - timeA;
      }

      if (sortBy === 'priority') {
        const pOrder: Record<string, number> = { urgent: 3, high: 2, normal: 1, low: 0 };
        const pA = pOrder[a.priority || 'normal'] || 1;
        const pB = pOrder[b.priority || 'normal'] || 1;
        if (pA !== pB) return pB - pA;
        return timeB - timeA;
      }

      // Default: 'newest' (Most recent message/activity on top)
      return timeB - timeA;
    });
  }, [
    conversations,
    activeQueue,
    statusView,
    sortBy,
    channelFilter,
    selectedTagFilter,
    searchQuery,
    currentAgent?.id,
  ]);

  const hasActiveFilters =
    channelFilter !== 'all' ||
    selectedTagFilter !== 'all' ||
    statusView !== 'open' ||
    sortBy !== 'newest';

  const isVisitorOnline = (lastSeen?: string, isOnlineFlag?: boolean) => {
    if (isOnlineFlag === false) return false;
    if (!lastSeen) return false;
    return (Date.now() - new Date(lastSeen).getTime()) / 1000 < 60;
  };

  const queueTabs: { id: InboxQueue; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: counts.all },
    { id: 'waiting', label: 'Waiting', count: counts.waiting },
    { id: 'unassigned', label: 'Unassigned', count: counts.unassigned },
    { id: 'mine', label: 'Mine', count: counts.mine },
  ];

  const statusViews: { id: StatusView; label: string; count?: number }[] = [
    { id: 'open', label: 'Open' },
    { id: 'snoozed', label: 'Snoozed', count: counts.snoozed },
    { id: 'closed', label: 'Closed', count: counts.closed },
  ];

  return (
    <div className="w-full md:w-[320px] shrink-0 h-screen flex flex-col border-r border-line bg-surface select-none">
      {/* Top Header & Search */}
      <div className="p-3 border-b border-line/80 space-y-2.5 bg-surface/50 backdrop-blur-xs">
        <div className="flex items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2">
            <h2 className="text-[14px] font-bold tracking-tight text-ink">
              Inbox
            </h2>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-2 text-ink-3 border border-line">
              {filteredAndSorted.length}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowFilters((v) => !v)}
              title={SORT_LABELS[sortBy].desc}
              className={cn(
                'inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md transition-colors',
                sortBy === 'newest'
                  ? 'text-ink-3 hover:text-ink hover:bg-surface-3'
                  : 'bg-accent/10 text-accent'
              )}
            >
              <ArrowUpDown className="w-2.5 h-2.5" />
              {SORT_LABELS[sortBy].label}
            </button>
            {statusView !== 'open' && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 capitalize">
                {statusView}
              </span>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-ink-3 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input input-sm pl-8.5 pr-14 bg-surface-2 text-[12px] w-full border-line/70 focus:border-accent"
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
            <span className="kbd absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[10px]">
              Ctrl K
            </span>
          )}
        </div>

        {/* Queue Tabs + Filter/Sort Trigger */}
        <div className="flex items-center gap-1.5">
          <div className="flex-1 min-w-0 flex items-center gap-0.5 p-1 rounded-xl bg-surface-2 border border-line/70 overflow-x-auto scrollbar-none">
            {queueTabs.map((tab) => {
              const active = activeQueue === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveQueue(tab.id)}
                  title={`${tab.label} (${tab.count})`}
                  className={cn(
                    'h-6 px-2 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all flex items-center justify-center gap-1 flex-1 shrink-0',
                    active
                      ? 'bg-surface text-ink shadow-xs border border-line/60 font-bold'
                      : 'text-ink-3 hover:text-ink'
                  )}
                >
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span
                      className={cn(
                        'tabular-nums text-[9.5px] px-1.5 py-0.2 rounded-full font-bold',
                        active
                          ? tab.id === 'waiting'
                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                            : 'bg-accent/10 text-accent'
                          : 'bg-surface-3 text-ink-3'
                      )}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Filter & Sort Popover Trigger */}
          <div ref={filterRef} className="relative shrink-0">
            <button
              onClick={() => setShowFilters((v) => !v)}
              aria-label="Sort & Filters"
              title="Sort and filter inbox"
              className={cn(
                'w-8 h-8 rounded-xl border flex items-center justify-center transition-all shadow-xs',
                hasActiveFilters
                  ? 'border-accent bg-accent/10 text-accent font-bold ring-2 ring-accent/15'
                  : 'border-line/80 bg-surface-2 text-ink-3 hover:text-ink hover:bg-surface-3'
              )}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>

            {showFilters && (
              <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-68 p-3.5 rounded-2xl border border-line bg-surface shadow-xl animate-pop text-left">
                {/* Sort Order Selector */}
                <div className="mb-3">
                  <div className="flex items-center gap-1 text-[10px] font-bold text-ink-3 uppercase tracking-wider mb-1.5">
                    <ArrowUpDown className="w-3 h-3 text-accent" />
                    Sort Order
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => (
                      <button
                        key={key}
                        onClick={() => setSortBy(key)}
                        className={cn(
                          'px-2 py-1.5 rounded-lg text-[11px] font-medium transition-all text-left border',
                          sortBy === key
                            ? 'bg-accent text-accent-ink border-accent font-bold shadow-xs'
                            : 'bg-surface-2 text-ink-2 hover:bg-surface-3 border-line/60'
                        )}
                      >
                        <div className="leading-tight">{SORT_LABELS[key].label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status Selector */}
                <div className="mb-3 pt-2.5 border-t border-line">
                  <div className="text-[10px] font-bold text-ink-3 uppercase tracking-wider mb-1.5">
                    Status View
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {statusViews.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => setStatusView(v.id)}
                        className={cn(
                          'px-2.5 h-6.5 rounded-lg text-[11px] font-semibold transition-all inline-flex items-center gap-1.5',
                          statusView === v.id
                            ? 'bg-ink text-ink-inv shadow-xs'
                            : 'bg-surface-2 text-ink-2 hover:bg-surface-3 border border-line/60'
                        )}
                      >
                        {v.label}
                        {v.count ? (
                          <span className="tabular-nums text-[10px] opacity-75">{v.count}</span>
                        ) : null}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Channel Selector */}
                <div className="mb-3 pt-2.5 border-t border-line">
                  <div className="text-[10px] font-bold text-ink-3 uppercase tracking-wider mb-1.5">
                    Channel
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {CHANNELS.map((ch) => (
                      <button
                        key={ch.value}
                        onClick={() => setChannelFilter(ch.value)}
                        className={cn(
                          'px-2.5 h-6 rounded-lg text-[10.5px] font-semibold transition-all',
                          channelFilter === ch.value
                            ? 'bg-ink text-ink-inv shadow-xs'
                            : 'bg-surface-2 text-ink-2 hover:bg-surface-3 border border-line/60'
                        )}
                      >
                        {ch.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tag Selector */}
                {availableTags.length > 0 && (
                  <div className="mb-3 pt-2.5 border-t border-line">
                    <div className="text-[10px] font-bold text-ink-3 uppercase tracking-wider mb-1.5">
                      Tag
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                      <button
                        onClick={() => setSelectedTagFilter('all')}
                        className={cn(
                          'px-2 h-5.5 rounded-lg text-[10px] font-semibold transition-all',
                          selectedTagFilter === 'all'
                            ? 'bg-ink text-ink-inv'
                            : 'bg-surface-2 text-ink-2 hover:bg-surface-3 border border-line/60'
                        )}
                      >
                        All
                      </button>
                      {availableTags.map((tag) => (
                        <button
                          key={tag}
                          onClick={() => setSelectedTagFilter(tag)}
                          className={cn(
                            'px-2 h-5.5 rounded-lg text-[10px] font-semibold transition-all flex items-center gap-1',
                            selectedTagFilter === tag
                              ? 'bg-accent text-accent-ink'
                              : 'bg-surface-2 text-ink-2 hover:bg-surface-3 border border-line/60'
                          )}
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {hasActiveFilters && (
                  <div className="pt-2 border-t border-line/80 flex justify-end">
                    <button
                      onClick={() => {
                        setSortBy('newest');
                        setStatusView('open');
                        setChannelFilter('all');
                        setSelectedTagFilter('all');
                      }}
                      className="text-[11px] font-semibold text-accent hover:underline"
                    >
                      Reset all filters
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        {loading ? (
          <ConversationListSkeleton />
        ) : filteredAndSorted.length === 0 ? (
          <div className="p-4 flex items-center justify-center h-full">
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
                    : activeQueue === 'waiting'
                    ? 'No waiting customers'
                    : activeQueue === 'unassigned'
                    ? 'Nothing unassigned'
                    : activeQueue === 'mine'
                    ? 'Nothing assigned to you'
                    : 'Inbox zero'
                }
                description={
                  hasActiveFilters
                    ? 'No conversations match the currently selected filters.'
                    : 'When visitors send a message on your site, conversations appear here live.'
                }
                actionLabel={hasActiveFilters ? 'Reset Filters' : undefined}
                onAction={() => {
                  setSortBy('newest');
                  setStatusView('open');
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
              conv.visitor?.last_seen || conv.visitor?.last_seen_at,
              conv.visitor?.is_online
            );
            const name = displayNameFor(conv);
            const fromAgent = conv.last_message?.sender_type === 'agent';
            const fromAi = conv.last_message?.sender_type === 'ai';
            const hasUnread = (conv.unread_count || 0) > 0;
            const isWaiting = isWaitingOnAgent(conv);
            const isUrgent = conv.priority === 'urgent';
            const isHigh = conv.priority === 'high';
            const activityTime = getLastActivityTime(conv);

            return (
              <button
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className={cn(
                  'w-full text-left p-2.5 rounded-xl transition-all duration-150 flex items-start gap-2.5 relative border cursor-pointer group',
                  selected
                    ? 'bg-accent-soft/40 border-accent/40 shadow-xs ring-1 ring-accent/20'
                    : hasUnread
                    ? 'bg-surface border-line-2 hover:bg-surface-2/80 shadow-xs'
                    : 'bg-surface border-line/60 hover:bg-surface-2/60 hover:border-line shadow-xs'
                )}
              >
                {/* Active indicator line */}
                {selected && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-accent" />
                )}

                {/* Avatar */}
                <Avatar
                  name={name}
                  seed={conv.visitor_id}
                  size="md"
                  online={online}
                  muted={!conv.visitor?.name && !conv.visitor?.email}
                  className="shrink-0 mt-0.5"
                />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Top Line: Name + Channel + Time */}
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5 truncate">
                      <span
                        className={cn(
                          'text-[12.5px] truncate',
                          hasUnread
                            ? 'font-bold text-ink'
                            : selected
                            ? 'font-bold text-accent'
                            : 'font-semibold text-ink-2 group-hover:text-ink'
                        )}
                      >
                        {name}
                      </span>
                      {conv.channel && conv.channel !== 'web' && (
                        <ChannelBadge channel={conv.channel} />
                      )}
                    </div>

                    <span
                      className={cn(
                        'text-[10.5px] shrink-0 tabular-nums',
                        hasUnread ? 'text-accent font-bold' : 'text-ink-3'
                      )}
                    >
                      {formatTimeAgo(activityTime)}
                    </span>
                  </div>

                  {/* Middle Line: Last Message Snippet */}
                  <p
                    className={cn(
                      'text-[11.5px] truncate mt-0.5 leading-snug',
                      hasUnread
                        ? 'font-medium text-ink dark:text-slate-100'
                        : 'text-ink-3 group-hover:text-ink-2'
                    )}
                  >
                    {fromAgent ? (
                      <span className="text-ink-2 font-medium inline-flex items-center gap-0.5 mr-1">
                        <span className="inline-flex items-center">
                          {conv.last_message?.read_at ? (
                            <CheckCheck className="w-3 h-3 text-blue-500 stroke-[2.5]" />
                          ) : online ? (
                            <CheckCheck className="w-3 h-3 text-ink-3/70 stroke-[2]" />
                          ) : (
                            <Check className="w-3 h-3 text-ink-3/70 stroke-[2]" />
                          )}
                        </span>
                        <span>You:</span>
                      </span>
                    ) : fromAi ? (
                      <span className="text-purple-600 dark:text-purple-400 font-medium mr-1">
                        Bot:
                      </span>
                    ) : null}
                    {conv.last_message?.content ||
                      (conv.last_message?.attachment_url
                        ? '📎 Attachment'
                        : 'Conversation started')}
                  </p>

                  {/* Bottom Line: Clean, Subtle Meta Pills */}
                  <div className="flex items-center justify-between gap-1.5 mt-1.5">
                    <div className="flex items-center gap-1 flex-wrap min-w-0">
                      {/* Waiting on reply indicator */}
                      {isWaiting && (
                        <span className="px-1.5 py-0.2 text-[9.5px] font-semibold rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          Waiting for reply
                        </span>
                      )}

                      {/* Priority Tag (Only if urgent or high) */}
                      {isUrgent ? (
                        <span className="px-1.5 py-0.2 text-[9px] font-bold rounded-md bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/20">
                          Urgent
                        </span>
                      ) : isHigh ? (
                        <span className="px-1.5 py-0.2 text-[9px] font-bold rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          High
                        </span>
                      ) : null}

                      {/* Assigned Agent */}
                      {conv.agent && (
                        <span className="inline-flex items-center gap-1 text-[9.5px] text-ink-3 bg-surface-2 px-1.5 py-0.2 rounded-md border border-line">
                          <span className="truncate max-w-[60px]">
                            {conv.agent.name.split(' ')[0]}
                          </span>
                        </span>
                      )}

                      {/* Compact AI indicator if summary exists */}
                      {conv.summary && (
                        <span
                          title={`AI Summary: ${conv.summary}`}
                          className="inline-flex items-center gap-0.5 text-[9px] text-accent bg-accent/10 px-1 py-0.2 rounded-md font-semibold border border-accent/20"
                        >
                          <Sparkles className="w-2.5 h-2.5" />
                          AI
                        </span>
                      )}

                      {/* CSAT Star if rated */}
                      {conv.csat_rating && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] text-amber-500 font-bold bg-amber-500/10 px-1.5 py-0.2 rounded-md border border-amber-500/20">
                          <Star className="w-2.5 h-2.5 fill-current" />
                          {conv.csat_rating}
                        </span>
                      )}
                    </div>

                    {/* Unread Count Badge */}
                    {hasUnread && (
                      <span className="px-1.5 py-0.2 min-w-[17px] text-center text-[9.5px] font-extrabold rounded-full bg-accent text-accent-ink shrink-0 shadow-xs">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
