'use client';

import React, { useMemo, useState, useRef, useEffect, useCallback, memo } from 'react';
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
  RefreshCw,
  Zap,
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

export interface ConversationListProps {
  conversations: Conversation[];
  selectedConversationId: string | null;
  onSelectConversation: (id: string) => void;
  currentAgent?: Agent | null;
  statusFilter?: ConversationStatus | 'all';
  loading?: boolean;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  lastSynced?: Date;
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

function isVisitorOnline(lastSeen?: string, isOnlineFlag?: boolean): boolean {
  if (isOnlineFlag === false) return false;
  if (!lastSeen) return false;
  return (Date.now() - new Date(lastSeen).getTime()) / 1000 < 60;
}

/**
 * Memoized single conversation item for high-performance 60fps list scrolling.
 */
interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

const ConversationItem = memo(function ConversationItem({
  conversation: conv,
  isSelected,
  onSelect,
}: ConversationItemProps) {
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
      onClick={() => onSelect(conv.id)}
      data-selected={isSelected}
      className={cn(
        'w-full text-left p-2.5 rounded-xl transition-all duration-150 flex items-start gap-2.5 relative border cursor-pointer group select-none outline-none',
        isSelected
          ? 'bg-accent/[0.08] dark:bg-accent/15 border-accent/40 shadow-xs ring-1 ring-accent/25'
          : hasUnread
          ? 'bg-surface border-line-2 hover:bg-surface-2 hover:border-line-2 shadow-xs'
          : 'bg-surface border-line/60 hover:bg-surface-2/60 hover:border-line shadow-xs'
      )}
    >
      {/* Active Left Indicator Bar */}
      {isSelected && (
        <span className="absolute left-0 top-2.5 bottom-2.5 w-1 rounded-r-full bg-accent shadow-[0_0_8px_rgba(46,91,255,0.4)]" />
      )}

      {/* Avatar (w-9 h-9) */}
      <Avatar
        name={name}
        seed={conv.visitor_id}
        size="sm"
        online={online}
        muted={!conv.visitor?.name && !conv.visitor?.email}
        className="shrink-0 mt-0.5 w-9 h-9 text-[13px]"
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Top Line: Name + Channel + Time */}
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5 truncate">
            <span
              className={cn(
                'text-[12.5px] truncate leading-tight',
                hasUnread
                  ? 'font-bold text-ink'
                  : isSelected
                  ? 'font-bold text-accent dark:text-accent-soft'
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

        {/* Middle Line: Last Message Preview */}
        <p
          className={cn(
            'text-[11.5px] truncate mt-1 leading-snug',
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
            <span className="text-purple-600 dark:text-purple-400 font-medium inline-flex items-center gap-0.5 mr-1">
              <Sparkles className="w-2.5 h-2.5" />
              <span>Bot:</span>
            </span>
          ) : null}
          {conv.last_message?.content ||
            (conv.last_message?.attachment_url
              ? '📎 Attachment'
              : 'Conversation started')}
        </p>

        {/* Bottom Line: Meta Badges */}
        <div className="flex items-center justify-between gap-1.5 mt-1.5">
          <div className="flex items-center gap-1 flex-wrap min-w-0">
            {/* Waiting for reply pill */}
            {isWaiting && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9.5px] font-semibold rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Waiting
              </span>
            )}

            {/* Priority Tag */}
            {isUrgent ? (
              <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-md bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/20">
                Urgent
              </span>
            ) : isHigh ? (
              <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                High
              </span>
            ) : null}

            {/* Assigned Agent */}
            {conv.agent && (
              <span className="inline-flex items-center gap-1 text-[9.5px] text-ink-3 bg-surface-2 px-1.5 py-0.5 rounded-md border border-line">
                <span className="truncate max-w-[65px]">
                  {conv.agent.name.split(' ')[0]}
                </span>
              </span>
            )}

            {/* AI Summary Badge */}
            {conv.summary && (
              <span
                title={`AI Summary: ${conv.summary}`}
                className="inline-flex items-center gap-0.5 text-[9px] text-violet-600 dark:text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded-md font-semibold border border-violet-500/20"
              >
                <Sparkles className="w-2.5 h-2.5" />
                AI
              </span>
            )}

            {/* CSAT Star Badge */}
            {conv.csat_rating && (
              <span className="inline-flex items-center gap-0.5 text-[9px] text-amber-500 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded-md border border-amber-500/20">
                <Star className="w-2.5 h-2.5 fill-current" />
                {conv.csat_rating}
              </span>
            )}
          </div>

          {/* Unread Count Badge */}
          {hasUnread && (
            <span className="px-1.5 py-0.5 min-w-[18px] text-center text-[9.5px] font-extrabold rounded-full bg-accent text-accent-ink shrink-0 shadow-xs">
              {conv.unread_count}
            </span>
          )}
        </div>
      </div>
    </button>
  );
});

export function ConversationList({
  conversations,
  selectedConversationId,
  onSelectConversation,
  currentAgent,
  loading = false,
  isRefreshing = false,
  onRefresh,
  lastSynced,
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
  const listContainerRef = useRef<HTMLDivElement>(null);

  // Focus search bar on Ctrl+K or Cmd+K
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

  // Close filter popover on outside click
  useEffect(() => {
    if (!showFilters) return;
    const onDown = (e: MouseEvent) => {
      if (!filterRef.current?.contains(e.target as Node)) setShowFilters(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [showFilters]);

  /** True when conversation matches current status view (open, snoozed, closed) */
  const inStatusView = useCallback((c: Conversation, view: StatusView) => {
    const isClosed = c.status === 'closed';
    const isSnoozed = c.status === 'snoozed';
    if (view === 'closed') return isClosed;
    if (view === 'snoozed') return isSnoozed;
    return !isClosed && !isSnoozed;
  }, []);

  // Queue counts scoped to current status view
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
  }, [conversations, currentAgent?.id, statusView, inStatusView]);

  // Extract distinct tags
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

      // 1. Status view
      if (!inStatusView(conv, statusView)) return false;

      // 2. Queue
      if (activeQueue === 'waiting' && !isWaitingOnAgent(conv)) return false;
      if (activeQueue === 'unassigned' && agentId) return false;
      if (activeQueue === 'mine' && agentId !== currentAgent?.id) return false;

      // 3. Channel
      if (channelFilter !== 'all' && (conv.channel || 'web') !== channelFilter) {
        return false;
      }

      // 4. Tag
      if (
        selectedTagFilter !== 'all' &&
        (!conv.tags || !conv.tags.includes(selectedTagFilter))
      ) {
        return false;
      }

      // 5. Search query
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

      // Default: newest
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
    inStatusView,
  ]);

  // Keyboard navigation for moving between conversations (ArrowUp / ArrowDown / J / K)
  useEffect(() => {
    const handleNavKeys = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      const isInputActive =
        activeTag === 'input' ||
        activeTag === 'textarea' ||
        (document.activeElement as HTMLElement)?.isContentEditable;

      if (isInputActive) return;

      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        if (filteredAndSorted.length === 0) return;
        const currentIndex = filteredAndSorted.findIndex(
          (c) => c.id === selectedConversationId
        );
        const nextIndex =
          currentIndex < filteredAndSorted.length - 1 ? currentIndex + 1 : 0;
        onSelectConversation(filteredAndSorted[nextIndex].id);
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        if (filteredAndSorted.length === 0) return;
        const currentIndex = filteredAndSorted.findIndex(
          (c) => c.id === selectedConversationId
        );
        const prevIndex =
          currentIndex > 0 ? currentIndex - 1 : filteredAndSorted.length - 1;
        onSelectConversation(filteredAndSorted[prevIndex].id);
      }
    };

    window.addEventListener('keydown', handleNavKeys);
    return () => window.removeEventListener('keydown', handleNavKeys);
  }, [filteredAndSorted, selectedConversationId, onSelectConversation]);

  // Scroll active item into view when changed via keyboard
  useEffect(() => {
    if (!selectedConversationId || !listContainerRef.current) return;
    const selectedEl = listContainerRef.current.querySelector('[data-selected="true"]');
    if (selectedEl) {
      selectedEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedConversationId]);

  const hasActiveFilters =
    channelFilter !== 'all' ||
    selectedTagFilter !== 'all' ||
    statusView !== 'open' ||
    sortBy !== 'newest';

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
    <div className="w-full h-screen flex flex-col border-r border-line bg-surface select-none">
      {/* 1. Header Toolbar */}
      <div className="p-3 border-b border-line/80 space-y-2.5 bg-surface/80 backdrop-blur-xs">
        <div className="flex items-center justify-between gap-2 px-0.5">
          <div className="flex items-center gap-2">
            <h2 className="text-[14.5px] font-bold tracking-tight text-ink">
              Inbox
            </h2>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-surface-2 text-ink-3 border border-line">
              {filteredAndSorted.length}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Sync / Refresh Button */}
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={isRefreshing}
                title={isRefreshing ? 'Refreshing inbox…' : 'Refresh inbox (Press R)'}
                className={cn(
                  'w-7 h-7 rounded-lg flex items-center justify-center transition-all border border-line/70 hover:border-line hover:bg-surface-3 text-ink-3 hover:text-ink',
                  isRefreshing && 'bg-surface-3 text-accent cursor-not-allowed'
                )}
              >
                <RefreshCw
                  className={cn(
                    'w-3.5 h-3.5 transition-transform',
                    isRefreshing && 'animate-spin text-accent'
                  )}
                />
              </button>
            )}

            {/* Sort indicator & trigger */}
            <button
              onClick={() => setShowFilters((v) => !v)}
              title={SORT_LABELS[sortBy].desc}
              className={cn(
                'inline-flex items-center gap-1 text-[10.5px] font-semibold px-2 py-1 rounded-lg transition-colors border',
                sortBy === 'newest'
                  ? 'border-line/70 text-ink-3 hover:text-ink hover:bg-surface-3'
                  : 'border-accent/40 bg-accent/10 text-accent font-bold'
              )}
            >
              <ArrowUpDown className="w-2.5 h-2.5" />
              <span className="truncate max-w-[90px]">{SORT_LABELS[sortBy].label}</span>
            </button>

            {/* Filter Popover Trigger */}
            <div ref={filterRef} className="relative shrink-0">
              <button
                onClick={() => setShowFilters((v) => !v)}
                aria-label="Sort & Filters"
                title="Sort and filter inbox"
                className={cn(
                  'w-7 h-7 rounded-lg border flex items-center justify-center transition-all shadow-xs',
                  hasActiveFilters
                    ? 'border-accent bg-accent/10 text-accent font-bold ring-2 ring-accent/15'
                    : 'border-line/70 bg-surface-2 text-ink-3 hover:text-ink hover:bg-surface-3'
                )}
              >
                <SlidersHorizontal className="w-3 h-3" />
              </button>

              {/* Filter Popover Menu */}
              {showFilters && (
                <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-72 p-3.5 rounded-2xl border border-line bg-surface shadow-2xl animate-pop text-left">
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

        {/* 2. Search Bar */}
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
            <span className="kbd absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[9.5px]">
              Ctrl K
            </span>
          )}
        </div>

        {/* 3. Queue Tabs Segmented Navigation */}
        <div className="flex items-center p-1 rounded-xl bg-surface-2 border border-line/70">
          {queueTabs.map((tab) => {
            const active = activeQueue === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveQueue(tab.id)}
                title={`${tab.label} (${tab.count})`}
                className={cn(
                  'h-6.5 px-2 rounded-lg text-[11px] font-medium transition-all flex items-center justify-center gap-1 flex-1',
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
      </div>

      {/* 4. Conversations List Canvas */}
      <div
        ref={listContainerRef}
        className="flex-1 overflow-y-auto px-2 py-2 space-y-1 scrollbar-thin"
      >
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
          filteredAndSorted.map((conv) => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              isSelected={conv.id === selectedConversationId}
              onSelect={onSelectConversation}
            />
          ))
        )}
      </div>
    </div>
  );
}
