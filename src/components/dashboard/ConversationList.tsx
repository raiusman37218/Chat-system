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
  Check,
  CheckCheck,
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

  const isVisitorOnline = (lastSeen?: string, isOnlineFlag?: boolean) => {
    if (isOnlineFlag === false) return false;
    if (!lastSeen) return false;
    return (Date.now() - new Date(lastSeen).getTime()) / 1000 < 60;
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
    <div className="w-full md:w-[310px] shrink-0 h-screen flex flex-col border-r border-line bg-surface select-none">
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
          {statusView !== 'open' && (
            <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 capitalize">
              {statusView}
            </span>
          )}
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-ink-3 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input input-sm pl-8.5 pr-14 bg-surface-2 text-[12.5px] w-full border-line/70 focus:border-accent"
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

        <div className="flex items-center gap-1.5">
          <div className="flex-1 min-w-0 flex items-center gap-1 p-1 rounded-xl bg-surface-2 border border-line/70 overflow-x-auto scrollbar-none">
            {queueTabs.map((tab) => {
              const active = activeQueue === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveQueue(tab.id)}
                  title={`${tab.label} (${tab.count})`}
                  className={cn(
                    'h-6 px-2.5 rounded-lg text-[11.5px] font-semibold whitespace-nowrap transition-all flex items-center justify-center gap-1.5 flex-1 shrink-0',
                    active
                      ? 'bg-surface text-ink shadow-xs border border-line/50 font-bold'
                      : 'text-ink-3 hover:text-ink'
                  )}
                >
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span
                      className={cn(
                        'tabular-nums text-[10px] px-1.5 py-0.2 rounded-full font-bold',
                        active
                          ? 'bg-accent/10 text-accent'
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

          <div ref={filterRef} className="relative shrink-0">
            <button
              onClick={() => setShowFilters((v) => !v)}
              aria-label="Filters"
              title="Filter channels and status"
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
              <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-64 p-3 rounded-2xl border border-line bg-surface shadow-xl animate-pop">
                <div className="eyebrow mb-1.5 text-[10px] font-bold text-ink-3 uppercase">Status</div>
                <div className="flex flex-wrap gap-1.5 mb-3">
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

                <div className="eyebrow mb-1.5 text-[10px] font-bold text-ink-3 uppercase">Channel</div>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {CHANNELS.map((ch) => (
                    <button
                      key={ch.value}
                      onClick={() => setChannelFilter(ch.value)}
                      className={cn(
                        'px-2.5 h-6.5 rounded-lg text-[11px] font-semibold transition-all',
                        channelFilter === ch.value
                          ? 'bg-ink text-ink-inv shadow-xs'
                          : 'bg-surface-2 text-ink-2 hover:bg-surface-3 border border-line/60'
                      )}
                    >
                      {ch.label}
                    </button>
                  ))}
                </div>

                {availableTags.length > 0 && (
                  <>
                    <div className="eyebrow mb-1.5 text-[10px] font-bold text-ink-3 uppercase">Tag</div>
                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                      <button
                        onClick={() => setSelectedTagFilter('all')}
                        className={cn(
                          'px-2.5 h-6 rounded-lg text-[10.5px] font-semibold transition-all',
                          selectedTagFilter === 'all'
                            ? 'bg-ink text-ink-inv'
                            : 'bg-surface-2 text-ink-2 hover:bg-surface-3 border border-line/60'
                        )}
                      >
                        All tags
                      </button>
                      {availableTags.map((tag) => (
                        <button
                          key={tag}
                          onClick={() => setSelectedTagFilter(tag)}
                          className={cn(
                            'px-2 h-6 rounded-lg text-[10.5px] font-semibold transition-all flex items-center gap-1',
                            selectedTagFilter === tag
                              ? 'bg-accent text-accent-ink'
                              : 'bg-surface-2 text-ink-2 hover:bg-surface-3 border border-line/60'
                          )}
                        >
                          <TagIcon className="w-2.5 h-2.5" />
                          #{tag}
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {hasActiveFilters && (
                  <div className="pt-2 mt-2 border-t border-line/80 flex justify-end">
                    <button
                      onClick={() => {
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
              conv.visitor?.last_seen || conv.visitor?.last_seen_at,
              conv.visitor?.is_online
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
                  'w-full text-left p-3 rounded-xl transition-all duration-150 flex items-start gap-3 relative border cursor-pointer group',
                  selected
                    ? 'bg-surface-2 border-line-2 shadow-xs ring-1 ring-accent/25'
                    : hasUnread
                    ? 'bg-red-500/5 dark:bg-red-950/20 border-red-500/40 hover:bg-red-500/10 hover:border-red-500/60 shadow-xs ring-1 ring-red-500/20'
                    : 'bg-surface border-line/60 hover:bg-surface-2/70 hover:border-line/90 shadow-xs'
                )}
              >
                {selected ? (
                  <span className="absolute left-0 top-2.5 bottom-2.5 w-1 rounded-r-full bg-accent" />
                ) : hasUnread ? (
                  <span className="absolute left-0 top-2 bottom-2 w-1.5 rounded-r-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.7)] animate-pulse" />
                ) : null}
                <Avatar
                  name={name}
                  seed={conv.visitor_id}
                  size="md"
                  online={online}
                  muted={!conv.visitor?.name && !conv.visitor?.email}
                  className="shrink-0 mt-0.5 shadow-xs"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1.5">
                    <span
                      className={cn(
                        'text-[13px] truncate flex items-center gap-1.5',
                        hasUnread
                          ? 'font-extrabold text-red-600 dark:text-red-400'
                          : selected
                          ? 'font-bold text-accent'
                          : 'font-semibold text-ink group-hover:text-ink'
                      )}
                    >
                      {name}
                      {hasUnread && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-red-600 text-white text-[9px] font-extrabold uppercase tracking-wider shrink-0 shadow-xs animate-pulse">
                          <span className="w-1 h-1 rounded-full bg-white animate-ping" />
                          {conv.unread_count && conv.unread_count > 1 ? `${conv.unread_count} NEW` : 'NEW'}
                        </span>
                      )}
                    </span>

                    <span className={cn(
                      "text-[10.5px] shrink-0 tabular-nums font-mono",
                      hasUnread ? "text-red-500 font-bold" : "text-ink-3"
                    )}>
                      {formatTimeAgo(conv.updated_at || conv.created_at)}
                    </span>
                  </div>

                  {conv.summary ? (
                    <div className="mt-1.5 p-2 rounded-lg bg-accent-soft/40 border border-accent-line/60 text-[11.5px] leading-tight">
                      <div className="flex items-center gap-1 text-[9.5px] font-bold text-accent uppercase tracking-wider mb-0.5">
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
                          ? 'font-bold text-ink dark:text-slate-100'
                          : 'text-ink-3 group-hover:text-ink-2'
                      )}
                    >
                      {fromAgent ? (
                        <span className="text-ink-2 font-medium inline-flex items-center gap-0.5 mr-1">
                          <span
                            className="inline-flex items-center"
                            title={
                              conv.last_message?.read_at
                                ? 'Seen by customer'
                                : online
                                ? 'Delivered (website open)'
                                : 'Sent (website closed)'
                            }
                          >
                            {conv.last_message?.read_at ? (
                              <CheckCheck className="w-3.5 h-3.5 text-blue-500 stroke-[2.5]" />
                            ) : online ? (
                              <CheckCheck className="w-3.5 h-3.5 text-ink-3/70 stroke-[2]" />
                            ) : (
                              <Check className="w-3.5 h-3.5 text-ink-3/70 stroke-[2]" />
                            )}
                          </span>
                          <span>You: </span>
                        </span>
                      ) : fromAi ? (
                        <span className="text-purple-600 dark:text-purple-400 font-medium inline-flex items-center gap-0.5 mr-1">
                          <span
                            className="inline-flex items-center"
                            title={
                              conv.last_message?.read_at
                                ? 'Seen by customer'
                                : online
                                ? 'Delivered (website open)'
                                : 'Sent (website closed)'
                            }
                          >
                            {conv.last_message?.read_at ? (
                              <CheckCheck className="w-3.5 h-3.5 text-blue-500 stroke-[2.5]" />
                            ) : online ? (
                              <CheckCheck className="w-3.5 h-3.5 text-ink-3/70 stroke-[2]" />
                            ) : (
                              <Check className="w-3.5 h-3.5 text-ink-3/70 stroke-[2]" />
                            )}
                          </span>
                          <span>🤖 AI: </span>
                        </span>
                      ) : null}
                      {conv.last_message?.content ||
                        (conv.last_message?.attachment_url
                          ? '📎 Attachment'
                          : 'Conversation started')}
                    </p>
                  )}

                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    {hasUnread && (
                      <span className="px-1.5 py-0.5 text-[9.5px] font-extrabold rounded-md bg-red-500 text-white shadow-xs">
                        Unopened
                      </span>
                    )}

                    {isUrgent && (
                      <span className="px-1.5 py-0.5 text-[9.5px] font-bold rounded-md bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/20">
                        Urgent
                      </span>
                    )}

                    {conv.priority === 'high' && (
                      <span className="px-1.5 py-0.5 text-[9.5px] font-bold rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        High
                      </span>
                    )}

                    {(conv.sentiment === 'positive' ||
                      conv.sentiment === 'negative') && (
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 px-1.5 py-0.5 text-[9.5px] font-bold rounded-md border',
                          conv.sentiment === 'positive'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                            : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
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

                    {conv.agent && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-ink-2 bg-surface-2 px-1.5 py-0.5 rounded-md border border-line">
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

                    {conv.tags?.slice(0, 2).map((t) => (
                      <span
                        key={t}
                        className="text-[9.5px] font-medium text-ink-3 bg-surface-2 px-1.5 py-0.5 rounded-md border border-line truncate max-w-[60px]"
                      >
                        #{t}
                      </span>
                    ))}

                    {conv.status === 'snoozed' && (
                      <span className="inline-flex items-center gap-0.5 text-[9.5px] text-amber-600 dark:text-amber-400 bg-amber-500/15 px-1.5 py-0.5 rounded-md font-medium border border-amber-500/20">
                        <Clock className="w-2.5 h-2.5" />
                        Snoozed
                      </span>
                    )}

                    {conv.csat_rating && (
                      <span className="inline-flex items-center gap-0.5 text-[9.5px] text-amber-500 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded-md border border-amber-500/20">
                        <Star className="w-2.5 h-2.5 fill-current" />
                        {conv.csat_rating}/5
                      </span>
                    )}
                  </div>
                </div>

                {hasUnread && (
                  <span className="w-3 h-3 rounded-full bg-red-500 shrink-0 mt-1 shadow-md ring-4 ring-red-500/25 animate-ping" />
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
