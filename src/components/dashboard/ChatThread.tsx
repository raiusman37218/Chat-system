'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  UserCheck, 
  Clock, 
  CheckCircle2, 
  ExternalLink, 
  Sparkles, 
  Bot, 
  Globe, 
  MessageSquareQuote,
  Check,
  CheckCheck,
  Lock,
  EyeOff,
  Zap,
  Tag,
  Flag,
  AlertTriangle,
  Star,
  Plus,
  X
} from 'lucide-react';
import { Conversation, Message, Agent, ConversationStatus, ConversationPriority } from '@/types/database';
import { formatTime, formatTimeAgo } from '@/lib/utils';
import { sound } from '@/lib/sound';

interface ChatThreadProps {
  conversation: Conversation;
  messages: Message[];
  currentAgent: Agent | null;
  agentsList: Agent[];
  onSendMessage: (content: string, isInternal?: boolean) => Promise<void>;
  onUpdateStatus: (status: ConversationStatus) => Promise<void>;
  onAssignAgent: (agentId: string | null) => Promise<void>;
  onUpdatePriority?: (priority: ConversationPriority) => Promise<void>;
  onUpdateTags?: (tags: string[]) => Promise<void>;
}

interface CannedItem {
  shortcut: string;
  title: string;
  content: string;
}

const DEFAULT_MACROS: CannedItem[] = [
  { shortcut: 'hello', title: 'Warm Greeting', content: 'Hello! Welcome to our support desk. How can I help you today?' },
  { shortcut: 'pricing', title: 'Pricing Overview', content: 'Our plans start at $29/mo with unlimited chats. You can view all features on our pricing page!' },
  { shortcut: 'wait', title: 'Investigating', content: 'Thank you for your patience! I am looking into your inquiry right now and will update you in just a moment.' },
  { shortcut: 'solved', title: 'Issue Resolved', content: 'I have resolved this issue for you! Please let me know if there is anything else I can assist with today.' },
  { shortcut: 'refund', title: 'Refund Policy', content: 'We offer a 100% money-back guarantee within 14 days of purchase. Would you like me to process that for you?' },
];

const PRESET_TAGS = ['VIP', 'Billing', 'Bug', 'Sales Lead', 'Feature Request', 'Urgent'];

export function ChatThread({
  conversation,
  messages,
  currentAgent,
  agentsList,
  onSendMessage,
  onUpdateStatus,
  onAssignAgent,
  onUpdatePriority,
  onUpdateTags,
}: ChatThreadProps) {
  // Composer Mode: 'reply' (sent to customer) vs 'internal' (yellow team note)
  const [composerMode, setComposerMode] = useState<'reply' | 'internal'>('reply');
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Canned Responses / Macro popover
  const [showMacros, setShowMacros] = useState(false);
  const [macroSearch, setMacroSearch] = useState('');

  // Tag manager popover
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [customTagInput, setCustomTagInput] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle keyboard typing & detect `#` shortcut for macros
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInputText(val);

    // If user types `#` as first character or after space, open macro popover
    if (val.endsWith('#')) {
      setShowMacros(true);
      setMacroSearch('');
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || isSending) return;
    const text = inputText.trim();
    const isInternal = composerMode === 'internal';

    setInputText('');
    setIsSending(true);

    try {
      sound.playSentMessage();
      await onSendMessage(text, isInternal);
    } catch (err) {
      console.error('Failed to send message:', err);
      setInputText(text); // restore on error
    } finally {
      setIsSending(false);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.focus();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const insertMacro = (macro: CannedItem) => {
    // If text ends with `#`, replace the `#` with the content
    if (inputText.endsWith('#')) {
      setInputText((prev) => prev.slice(0, -1) + macro.content);
    } else {
      setInputText((prev) => (prev ? `${prev} ${macro.content}` : macro.content));
    }
    setShowMacros(false);
    textareaRef.current?.focus();
  };

  const handleToggleTag = (tag: string) => {
    if (!onUpdateTags) return;
    const currentTags = conversation.tags || [];
    let updated: string[];
    if (currentTags.includes(tag)) {
      updated = currentTags.filter((t) => t !== tag);
    } else {
      updated = [...currentTags, tag];
    }
    onUpdateTags(updated);
  };

  const handleAddCustomTag = () => {
    if (!customTagInput.trim() || !onUpdateTags) return;
    const clean = customTagInput.trim();
    const currentTags = conversation.tags || [];
    if (!currentTags.includes(clean)) {
      onUpdateTags([...currentTags, clean]);
    }
    setCustomTagInput('');
    setShowTagPicker(false);
  };

  const visitor = conversation.visitor;
  const displayName = visitor?.name || (visitor?.email ? visitor.email.split('@')[0] : `Visitor #${conversation.visitor_id.slice(0, 6)}`);
  
  const isOnline = visitor?.last_seen 
    ? (new Date().getTime() - new Date(visitor.last_seen).getTime()) / 1000 < 60
    : false;

  const currentPriority: ConversationPriority = conversation.priority || 'normal';

  const filteredMacros = DEFAULT_MACROS.filter(
    (m) =>
      m.shortcut.toLowerCase().includes(macroSearch.toLowerCase()) ||
      m.title.toLowerCase().includes(macroSearch.toLowerCase()) ||
      m.content.toLowerCase().includes(macroSearch.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col h-screen bg-[#0b101d] overflow-hidden">
      {/* Thread Header */}
      <div className="px-6 py-3 border-b border-slate-800/80 bg-[#0d1424] flex items-center justify-between gap-4">
        {/* Left: Visitor Identity & URL */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-sm">
              {displayName.charAt(0).toUpperCase()}
            </div>
            {isOnline && (
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-[#0d1424]" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-tight truncate">{displayName}</h3>
              {visitor?.email && (
                <span className="text-xs text-slate-400 font-normal truncate">({visitor.email})</span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5 flex-wrap">
              {visitor?.current_url && (
                <a
                  href={visitor.current_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-slate-400 hover:text-blue-400 transition-colors max-w-[220px] truncate"
                >
                  <Globe className="w-3 h-3 text-slate-500 flex-shrink-0" />
                  <span className="truncate">{visitor.current_url}</span>
                  <ExternalLink className="w-2.5 h-2.5 opacity-60 flex-shrink-0" />
                </a>
              )}
              <span>•</span>
              <span className="text-[11px] text-slate-400">
                {isOnline ? (
                  <span className="text-emerald-400 font-medium">Active now</span>
                ) : (
                  <span>Active {formatTimeAgo(visitor?.last_seen || conversation.updated_at)}</span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Intercom Header Actions (Priority, Tags, Assign, Resolve) */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          {/* Priority Dropdown */}
          <div className="relative">
            <select
              value={currentPriority}
              onChange={(e) => onUpdatePriority && onUpdatePriority(e.target.value as ConversationPriority)}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold focus:outline-none transition-all cursor-pointer border ${
                currentPriority === 'urgent'
                  ? 'bg-rose-500/15 text-rose-300 border-rose-500/40'
                  : currentPriority === 'high'
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                  : currentPriority === 'low'
                  ? 'bg-slate-800 text-slate-400 border-slate-700'
                  : 'bg-blue-500/10 text-blue-300 border-blue-500/30'
              }`}
            >
              <option value="low">⚪ Low Priority</option>
              <option value="normal">🔵 Normal</option>
              <option value="high">🟠 High Priority</option>
              <option value="urgent">🔴 Urgent</option>
            </select>
          </div>

          {/* Assign Agent Dropdown */}
          <div className="relative">
            <select
              value={conversation.agent_id || ''}
              onChange={(e) => onAssignAgent(e.target.value || null)}
              className="bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
            >
              <option value="">Unassigned</option>
              {agentsList.map((ag) => (
                <option key={ag.id} value={ag.id}>
                  {ag.name} {ag.id === currentAgent?.id ? '(Me)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Status Dropdown */}
          <div className="relative">
            <select
              value={conversation.status}
              onChange={(e) => onUpdateStatus(e.target.value as ConversationStatus)}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold focus:outline-none transition-all cursor-pointer border ${
                conversation.status === 'open'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : conversation.status === 'pending'
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              <option value="open">🟢 Open</option>
              <option value="pending">🟡 Pending</option>
              <option value="closed">⚪ Closed</option>
            </select>
          </div>

          {/* 1-Click Resolve Button */}
          {conversation.status !== 'closed' ? (
            <button
              onClick={() => onUpdateStatus('closed')}
              className="px-3 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Close and resolve conversation"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Resolve</span>
            </button>
          ) : (
            <button
              onClick={() => onUpdateStatus('open')}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Reopen</span>
            </button>
          )}
        </div>
      </div>

      {/* Tags Bar */}
      <div className="px-6 py-1.5 bg-[#0a0f1d] border-b border-slate-800/60 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Tag className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
          <span className="text-[11px] text-slate-500 font-medium">Tags:</span>

          {(conversation.tags && conversation.tags.length > 0) ? (
            conversation.tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/15 border border-blue-500/30 text-blue-300 text-[11px] font-medium"
              >
                <span>#{t}</span>
                <button
                  onClick={() => handleToggleTag(t)}
                  className="hover:text-white"
                  title="Remove tag"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            ))
          ) : (
            <span className="text-[11px] text-slate-500 italic">No tags</span>
          )}

          {/* Add Tag Popover Toggle */}
          <div className="relative">
            <button
              onClick={() => setShowTagPicker(!showTagPicker)}
              className="px-1.5 py-0.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-[11px] font-medium flex items-center gap-0.5 transition-colors"
            >
              <Plus className="w-3 h-3" />
              <span>Add</span>
            </button>

            {showTagPicker && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-2 z-50 text-xs">
                <div className="font-semibold text-slate-400 text-[10px] uppercase mb-1.5">
                  Select or Type Tag
                </div>
                <div className="space-y-1 mb-2">
                  {PRESET_TAGS.map((pt) => {
                    const active = (conversation.tags || []).includes(pt);
                    return (
                      <button
                        key={pt}
                        onClick={() => handleToggleTag(pt)}
                        className={`w-full text-left px-2 py-1 rounded text-xs transition-colors flex items-center justify-between ${
                          active ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <span>#{pt}</span>
                        {active && <Check className="w-3 h-3" />}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-1.5 border-t border-slate-800 flex items-center gap-1">
                  <input
                    type="text"
                    placeholder="Custom tag..."
                    value={customTagInput}
                    onChange={(e) => setCustomTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCustomTag()}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={handleAddCustomTag}
                    className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[11px] font-semibold"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Post-Chat CSAT rating badge if present */}
        {conversation.csat_rating && (
          <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-semibold">
            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
            <span>CSAT: {conversation.csat_rating}/5</span>
            {conversation.csat_feedback && (
              <span className="font-normal italic text-amber-200/80">({conversation.csat_feedback})</span>
            )}
          </div>
        )}
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <div className="text-center py-2">
          <span className="text-[11px] text-slate-400 bg-slate-900/60 border border-slate-800/80 px-3 py-1 rounded-full">
            Conversation opened • {formatTimeAgo(conversation.created_at)}
          </span>
        </div>

        {messages.map((msg) => {
          // Intercom Internal Note (Yellow Team Note)
          if (msg.is_internal) {
            return (
              <div
                key={msg.id}
                className="w-full my-2.5 p-3.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-600/10 to-amber-500/10 border border-amber-500/40 text-amber-100 shadow-sm"
              >
                <div className="flex items-center justify-between mb-1.5 text-amber-400 font-semibold text-xs">
                  <span className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Internal Note • {msg.agent?.name || 'Teammate'}</span>
                  </span>
                  <span className="text-amber-400/70 font-normal text-[11px]">
                    {formatTime(msg.created_at)}
                  </span>
                </div>
                <p className="whitespace-pre-wrap leading-relaxed text-amber-100/90 text-sm font-normal">
                  {msg.content}
                </p>
                <div className="mt-2 text-[10px] text-amber-400/60 flex items-center gap-1.5 pt-1.5 border-t border-amber-500/20">
                  <EyeOff className="w-3 h-3" />
                  <span>Hidden from visitor • Only visible to logged-in agents</span>
                </div>
              </div>
            );
          }

          const isAgent = msg.sender_type === 'agent';
          const isAI = msg.sender_type === 'ai';

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isAgent ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-end gap-2 max-w-[75%]">
                {/* Visitor / AI Avatar */}
                {!isAgent && (
                  <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs text-slate-300 flex-shrink-0 mb-1">
                    {isAI ? <Bot className="w-4 h-4 text-purple-400" /> : displayName.charAt(0)}
                  </div>
                )}

                <div
                  className={`p-3.5 rounded-2xl text-sm leading-relaxed ${
                    isAgent
                      ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-br-none shadow-md shadow-blue-600/10'
                      : isAI
                      ? 'bg-purple-950/40 text-purple-200 border border-purple-800/40 rounded-bl-none'
                      : 'bg-slate-800/90 text-slate-100 border border-slate-700/60 rounded-bl-none'
                  }`}
                >
                  {isAI && (
                    <div className="text-[10px] uppercase font-bold text-purple-400 mb-1 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Chatify Bot
                    </div>
                  )}

                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>

                  <div
                    className={`mt-1.5 flex items-center justify-end gap-1 text-[10px] ${
                      isAgent ? 'text-blue-200/80' : 'text-slate-400'
                    }`}
                  >
                    <span>{formatTime(msg.created_at)}</span>
                    {isAgent && (
                      msg.read_at ? (
                        <span title="Read by customer"><CheckCheck className="w-3 h-3 text-blue-200" /></span>
                      ) : (
                        <span title="Delivered"><Check className="w-3 h-3 text-blue-200/60" /></span>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Intercom Dual-Mode Composer Section */}
      <div className="p-4 border-t border-slate-800/80 bg-[#0d1424] relative">
        {/* Quick Canned Macros Popover */}
        {showMacros && (
          <div className="absolute bottom-full mb-2 left-4 right-4 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-3 z-50">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Quick Macros &amp; Saved Replies</span>
              </div>
              <span className="text-[10px] text-slate-500">Shortcut: Type #</span>
            </div>

            <input
              type="text"
              placeholder="Search macros (e.g. pricing, refund, hello)..."
              value={macroSearch}
              onChange={(e) => setMacroSearch(e.target.value)}
              className="w-full mb-2 px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              autoFocus
            />

            <div className="divide-y divide-slate-800/60 max-h-48 overflow-y-auto">
              {filteredMacros.length === 0 ? (
                <div className="py-3 text-center text-xs text-slate-500">No matching macros found</div>
              ) : (
                filteredMacros.map((macro) => (
                  <button
                    key={macro.shortcut}
                    onClick={() => insertMacro(macro)}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-slate-800 rounded transition-colors group"
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                        #{macro.shortcut}
                      </span>
                      <span className="text-[10px] text-slate-500">{macro.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">{macro.content}</p>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Dual Mode Tabs & Action Bar */}
        <div className="flex items-center justify-between mb-2">
          {/* Dual-Mode Selector: Reply vs Internal Note */}
          <div className="flex items-center p-0.5 bg-slate-900 border border-slate-800 rounded-lg">
            <button
              onClick={() => setComposerMode('reply')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                composerMode === 'reply'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>💬 Reply</span>
            </button>
            <button
              onClick={() => setComposerMode('internal')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                composerMode === 'internal'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-amber-400'
              }`}
            >
              <Lock className="w-3 h-3" />
              <span>Note (Internal)</span>
            </button>
          </div>

          {/* Right Toolbar: Quick macros button & Agent Indicator */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMacros(!showMacros)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs transition-colors border border-slate-700/60"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Macros (#)</span>
            </button>

            <span className="text-[11px] text-slate-500">
              as <strong className="text-slate-300 font-semibold">{currentAgent?.name || 'Agent'}</strong>
            </span>
          </div>
        </div>

        {/* Composer Input Box */}
        <div
          className={`relative flex items-end gap-2 rounded-xl p-2.5 transition-all border ${
            composerMode === 'internal'
              ? 'bg-amber-950/20 border-amber-500/50 focus-within:border-amber-400'
              : 'bg-slate-900 border-slate-700/80 focus-within:border-blue-500'
          }`}
        >
          <textarea
            ref={textareaRef}
            rows={2}
            value={inputText}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={
              composerMode === 'internal'
                ? 'Type an internal team note... Only your teammates can see this (hidden from customer).'
                : `Reply to ${displayName}... (Press Enter to send, Shift+Enter for new line, # for macros)`
            }
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 resize-none focus:outline-none max-h-32"
          />

          <button
            onClick={handleSend}
            disabled={!inputText.trim() || isSending}
            className={`p-2.5 rounded-lg flex items-center justify-center transition-all ${
              inputText.trim() && !isSending
                ? composerMode === 'internal'
                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-600/30 cursor-pointer'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30 cursor-pointer'
                : 'bg-slate-800 text-slate-600 cursor-not-allowed'
            }`}
            title={composerMode === 'internal' ? 'Post Internal Note' : 'Send Reply'}
          >
            {composerMode === 'internal' ? (
              <Lock className="w-4 h-4" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
