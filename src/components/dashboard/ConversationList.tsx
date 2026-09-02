'use client';

import React, { useState } from 'react';
import { Search, Inbox, Clock, CheckCircle2, User } from 'lucide-react';
import { Conversation, ConversationStatus } from '@/types/database';
import { formatTimeAgo } from '@/lib/utils';

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversationId: string | null;
  onSelectConversation: (id: string) => void;
  statusFilter: ConversationStatus | 'all';
}

export function ConversationList({
  conversations,
  selectedConversationId,
  onSelectConversation,
  statusFilter,
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter conversations by status & search
  const filteredConversations = conversations.filter((conv) => {
    // Status filter
    if (statusFilter !== 'all' && conv.status !== statusFilter) {
      return false;
    }

    // Search query filter
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const visitorName = conv.visitor?.name?.toLowerCase() || '';
      const visitorEmail = conv.visitor?.email?.toLowerCase() || '';
      const lastMsg = conv.last_message?.content?.toLowerCase() || '';
      const idMatch = conv.id.toLowerCase().includes(q);
      return visitorName.includes(q) || visitorEmail.includes(q) || lastMsg.includes(q) || idMatch;
    }

    return true;
  });

  const isVisitorOnline = (lastSeen?: string) => {
    if (!lastSeen) return false;
    const diff = (new Date().getTime() - new Date(lastSeen).getTime()) / 1000;
    return diff < 60; // active within last 60 seconds
  };

  return (
    <div className="w-80 border-r border-slate-800/80 bg-[#0f172a]/60 flex flex-col h-screen">
      {/* Header & Search */}
      <div className="p-3.5 border-b border-slate-800/70 space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-100 tracking-tight flex items-center gap-2">
            <span>Conversations</span>
            <span className="text-xs font-normal text-slate-400">
              ({filteredConversations.length})
            </span>
          </h2>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search visitors, messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-900/90 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-blue-500/70 transition-colors"
          />
        </div>
      </div>

      {/* Conversations Scrollable Feed */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40">
        {filteredConversations.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center justify-center text-slate-400 space-y-2 h-full">
            <div className="w-10 h-10 rounded-full bg-slate-800/50 flex items-center justify-center text-slate-400">
              <Inbox className="w-5 h-5" />
            </div>
            <p className="text-xs font-medium">No conversations found</p>
            <p className="text-[11px] text-slate-400 max-w-[180px]">
              {searchQuery ? 'Try matching another search keyword.' : 'Visitors starting chat on your site will appear here in real time.'}
            </p>
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const isSelected = conv.id === selectedConversationId;
            const visitorOnline = isVisitorOnline(conv.visitor?.last_seen);
            const displayName =
              conv.visitor?.name ||
              (conv.visitor?.email ? conv.visitor.email.split('@')[0] : `Visitor #${conv.visitor_id.slice(0, 6)}`);

            return (
              <div
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className={`p-3.5 cursor-pointer transition-all flex gap-3 relative select-none ${
                  isSelected
                    ? 'bg-blue-600/10 border-l-2 border-blue-500'
                    : 'hover:bg-slate-800/30 border-l-2 border-transparent'
                }`}
              >
                {/* Avatar with Online Indicator */}
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700/60 flex items-center justify-center text-slate-300 font-semibold text-xs uppercase">
                    {displayName.charAt(0)}
                  </div>
                  {visitorOnline && (
                    <span 
                      title="Active right now on site"
                      className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#0f172a]" 
                    />
                  )}
                </div>

                {/* Content Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-200 truncate max-w-[120px]">
                      {displayName}
                    </span>
                    <span className="text-[10px] text-slate-400 flex-shrink-0">
                      {formatTimeAgo(conv.updated_at)}
                    </span>
                  </div>

                  {/* Message Snippet */}
                  <p className="text-xs text-slate-400 truncate leading-relaxed">
                    {conv.last_message ? (
                      conv.last_message.sender_type === 'agent' ? (
                        <span className="text-slate-400">You: {conv.last_message.content}</span>
                      ) : (
                        <span className="text-slate-300 font-medium">{conv.last_message.content}</span>
                      )
                    ) : (
                      <span className="italic text-slate-400">Conversation started</span>
                    )}
                  </p>

                  {/* Priority & Tags Pills */}
                  {((conv.priority && conv.priority !== 'normal') || (conv.tags && conv.tags.length > 0)) && (
                    <div className="mt-1 flex items-center gap-1 flex-wrap">
                      {conv.priority === 'urgent' && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          🔴 URGENT
                        </span>
                      )}
                      {conv.priority === 'high' && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          🟠 HIGH
                        </span>
                      )}
                      {conv.tags && conv.tags.slice(0, 2).map((t) => (
                        <span key={t} className="px-1.5 py-0.2 rounded text-[9px] font-medium bg-slate-800/80 text-blue-300 border border-slate-700/60">
                          #{t}
                        </span>
                      ))}
                      {conv.tags && conv.tags.length > 2 && (
                        <span className="text-[9px] text-slate-500">+{conv.tags.length - 2}</span>
                      )}
                    </div>
                  )}

                  {/* Badges footer */}
                  <div className="mt-2 flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1.5">
                      {conv.status === 'open' && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Open
                        </span>
                      )}
                      {conv.status === 'pending' && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          Pending
                        </span>
                      )}
                      {conv.status === 'closed' && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-400">
                          Closed
                        </span>
                      )}

                      {conv.agent ? (
                        <span className="text-slate-400 flex items-center gap-1">
                          <User className="w-2.5 h-2.5" />
                          <span className="truncate max-w-[70px]">{conv.agent.name}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400">Unassigned</span>
                      )}

                      {conv.csat_rating && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-0.5">
                          ★ {conv.csat_rating}/5
                        </span>
                      )}
                    </div>

                    {conv.unread_count && conv.unread_count > 0 ? (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white">
                        {conv.unread_count}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
