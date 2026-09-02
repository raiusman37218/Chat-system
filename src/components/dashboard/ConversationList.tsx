'use client';

import React, { useMemo, useState } from 'react';
import { Inbox, Search, Star, X } from 'lucide-react';
import { Conversation, ConversationStatus } from '@/types/database';
import { formatTimeAgo, cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversationId: string | null;
  onSelectConversation: (id: string) => void;
  statusFilter: ConversationStatus | 'all';
}

const STATUS_LABEL: Record<ConversationStatus, string> = {
  open: 'Open',
  pending: 'Pending',
  closed: 'Resolved',
};

const STATUS_PILL: Record<ConversationStatus, string> = {
  open: 'pill-success',
  pending: 'pill-warn',
  closed: 'pill-neutral',
};

function displayNameFor(conv: Conversation) {
  return (
    conv.visitor?.name ||
    (conv.visitor?.email
      ? conv.visitor.email.split('@')[0]
      : `Visitor ${conv.visitor_id.slice(0, 6)}`)
  );
}

export function ConversationList({
  conversations,
  selectedConversationId,
  onSelectConversation,
  statusFilter,
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = useMemo(
    () =>
      conversations.filter((conv) => {
        if (statusFilter !== 'all' && conv.status !== statusFilter) return false;

        const q = searchQuery.trim().toLowerCase();
        if (!q) return true;

        return (
          (conv.visitor?.name?.toLowerCase() || '').includes(q) ||
          (conv.visitor?.email?.toLowerCase() || '').includes(q) ||
          (conv.last_message?.content?.toLowerCase() || '').includes(q) ||
          conv.id.toLowerCase().includes(q)
        );
      }),
    [conversations, statusFilter, searchQuery]
  );

  const isVisitorOnline = (lastSeen?: string) => {
    if (!lastSeen) return false;
    return (Date.now() - new Date(lastSeen).getTime()) / 1000 < 60;
  };

  return (
    <div className="w-[336px] shrink-0 h-screen flex flex-col border-r border-line bg-surface">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-line">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-[15px] font-semibold tracking-tight">
            Conversations
          </h2>
          <span className="text-[12px] text-ink-3 tabular-nums">
            {filtered.length}
          </span>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-ink-3 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search people and messages"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input input-sm pl-8.5 pr-8 bg-surface-2"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md flex items-center justify-center text-ink-3 hover:text-ink hover:bg-surface-3 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-8 gap-3">
            <div className="w-11 h-11 rounded-xl bg-surface-2 border border-line flex items-center justify-center text-ink-3">
              <Inbox className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[13px] font-semibold">
                {searchQuery ? 'No matches' : 'No conversations yet'}
              </p>
              <p className="mt-1 text-[12px] leading-relaxed text-ink-3">
                {searchQuery
                  ? 'Try a different name, email or phrase.'
                  : 'Visitors who open the messenger on your site land here in real time.'}
              </p>
            </div>
          </div>
        ) : (
          filtered.map((conv) => {
            const selected = conv.id === selectedConversationId;
            const online = isVisitorOnline(conv.visitor?.last_seen);
            const name = displayNameFor(conv);
            const fromAgent = conv.last_message?.sender_type === 'agent';

            return (
              <button
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                aria-current={selected ? 'true' : undefined}
                className={cn(
                  'w-full text-left px-4 py-3.5 flex gap-3 border-b border-line/70 transition-colors duration-150 relative',
                  selected
                    ? 'bg-accent-soft'
                    : 'hover:bg-surface-2'
                )}
              >
                {selected && (
                  <span className="absolute left-0 inset-y-0 w-[2.5px] bg-accent" />
                )}

                <Avatar
                  name={name}
                  seed={conv.visitor_id}
                  size="md"
                  online={online}
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[13.5px] font-semibold text-ink truncate">
                      {name}
                    </span>
                    <span className="text-[11px] text-ink-3 shrink-0 tabular-nums">
                      {formatTimeAgo(conv.updated_at)}
                    </span>
                  </div>

                  <p
                    className={cn(
                      'mt-0.5 text-[12.5px] leading-snug line-clamp-2',
                      fromAgent ? 'text-ink-3' : 'text-ink-2'
                    )}
                  >
                    {conv.last_message ? (
                      <>
                        {fromAgent && (
                          <span className="text-ink-3">You: </span>
                        )}
                        {conv.last_message.content}
                      </>
                    ) : (
                      <span className="italic text-ink-3">
                        Conversation started
                      </span>
                    )}
                  </p>

                  <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                    <span className={cn('pill', STATUS_PILL[conv.status])}>
                      {STATUS_LABEL[conv.status]}
                    </span>

                    {conv.priority === 'urgent' && (
                      <span className="pill pill-danger">Urgent</span>
                    )}
                    {conv.priority === 'high' && (
                      <span className="pill pill-warn">High</span>
                    )}

                    {conv.tags?.slice(0, 2).map((t) => (
                      <span key={t} className="pill pill-neutral">
                        {t}
                      </span>
                    ))}
                    {conv.tags && conv.tags.length > 2 && (
                      <span className="text-[10.5px] text-ink-3">
                        +{conv.tags.length - 2}
                      </span>
                    )}

                    {conv.csat_rating && (
                      <span className="pill pill-warn">
                        <Star className="w-2.5 h-2.5 fill-current" />
                        {conv.csat_rating}
                      </span>
                    )}

                    <span className="ml-auto text-[11px] text-ink-3 truncate max-w-[92px]">
                      {conv.agent ? conv.agent.name : 'Unassigned'}
                    </span>
                  </div>
                </div>

                {conv.unread_count && conv.unread_count > 0 ? (
                  <span className="self-start mt-0.5 shrink-0 min-w-[18px] h-[18px] px-1.5 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center">
                    {conv.unread_count}
                  </span>
                ) : null}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
