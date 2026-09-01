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
  CheckCheck
} from 'lucide-react';
import { Conversation, Message, Agent, ConversationStatus } from '@/types/database';
import { formatTime, formatTimeAgo } from '@/lib/utils';
import { sound } from '@/lib/sound';

interface ChatThreadProps {
  conversation: Conversation;
  messages: Message[];
  currentAgent: Agent | null;
  agentsList: Agent[];
  onSendMessage: (content: string) => Promise<void>;
  onUpdateStatus: (status: ConversationStatus) => Promise<void>;
  onAssignAgent: (agentId: string | null) => Promise<void>;
}

const CANNED_RESPONSES = [
  "Hello! How can I help you today?",
  "Let me look into that for you right away.",
  "Could you provide a few more details so I can assist you better?",
  "Thank you for your patience! I've resolved this for you.",
  "Is there anything else I can help you with today?"
];

export function ChatThread({
  conversation,
  messages,
  currentAgent,
  agentsList,
  onSendMessage,
  onUpdateStatus,
  onAssignAgent,
}: ChatThreadProps) {
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showCanned, setShowCanned] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim() || isSending) return;
    const text = inputText.trim();
    setInputText('');
    setIsSending(true);

    try {
      sound.playSentMessage();
      await onSendMessage(text);
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

  const insertCanned = (text: string) => {
    setInputText(text);
    setShowCanned(false);
    textareaRef.current?.focus();
  };

  const visitor = conversation.visitor;
  const displayName = visitor?.name || (visitor?.email ? visitor.email.split('@')[0] : `Visitor #${conversation.visitor_id.slice(0, 6)}`);
  
  const isOnline = visitor?.last_seen 
    ? (new Date().getTime() - new Date(visitor.last_seen).getTime()) / 1000 < 60
    : false;

  return (
    <div className="flex-1 flex flex-col h-screen bg-[#0b101d] overflow-hidden">
      {/* Thread Header */}
      <div className="px-6 py-3.5 border-b border-slate-800/80 bg-[#0d1424] flex items-center justify-between">
        {/* Left: Visitor Identity & URL */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-sm">
              {displayName.charAt(0).toUpperCase()}
            </div>
            {isOnline && (
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-[#0d1424]" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-tight">{displayName}</h3>
              {visitor?.email && (
                <span className="text-xs text-slate-400 font-normal">({visitor.email})</span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
              {visitor?.current_url && (
                <a
                  href={visitor.current_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-slate-400 hover:text-blue-400 transition-colors max-w-[260px] truncate"
                >
                  <Globe className="w-3 h-3 text-slate-500" />
                  <span className="truncate">{visitor.current_url}</span>
                  <ExternalLink className="w-2.5 h-2.5 opacity-60" />
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

        {/* Right: Status & Assignment Actions */}
        <div className="flex items-center gap-3">
          {/* Assign Agent Dropdown */}
          <div className="relative">
            <select
              value={conversation.agent_id || ''}
              onChange={(e) => onAssignAgent(e.target.value || null)}
              className="bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
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
              className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none transition-all cursor-pointer border ${
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
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Intro greeting badge */}
        <div className="text-center py-2">
          <span className="text-[11px] text-slate-400 bg-slate-900/60 border border-slate-800/80 px-3 py-1 rounded-full">
            Conversation opened • {formatTimeAgo(conversation.created_at)}
          </span>
        </div>

        {messages.map((msg) => {
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
                      <Sparkles className="w-3 h-3" /> AI Assistant (Phase 2 Preview)
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
                        <span title="Read"><CheckCheck className="w-3 h-3 text-blue-200" /></span>
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

      {/* Composer Section */}
      <div className="p-4 border-t border-slate-800/80 bg-[#0d1424] relative">
        {/* Quick Canned Responses Popover */}
        {showCanned && (
          <div className="absolute bottom-full mb-2 left-4 right-4 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-2 z-50">
            <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Quick Saved Replies
            </div>
            <div className="divide-y divide-slate-800/60 max-h-48 overflow-y-auto">
              {CANNED_RESPONSES.map((resp, i) => (
                <button
                  key={i}
                  onClick={() => insertCanned(resp)}
                  className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 rounded transition-colors"
                >
                  {resp}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Shortcuts Toolbar */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCanned(!showCanned)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/70 hover:bg-slate-800 text-slate-300 text-xs transition-colors border border-slate-700/50"
            >
              <MessageSquareQuote className="w-3.5 h-3.5 text-blue-400" />
              <span>Quick Replies</span>
            </button>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <span>Replying as</span>
            <span className="text-blue-400 font-semibold">{currentAgent?.name || 'Agent'}</span>
          </div>
        </div>

        {/* Input Box */}
        <div className="relative flex items-end gap-2 bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 focus-within:border-blue-500 transition-colors">
          <textarea
            ref={textareaRef}
            rows={2}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Reply to ${displayName}... (Press Enter to send, Shift+Enter for new line)`}
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-400 resize-none focus:outline-none max-h-32"
          />

          <button
            onClick={handleSend}
            disabled={!inputText.trim() || isSending}
            className={`p-2.5 rounded-lg flex items-center justify-center transition-all ${
              inputText.trim() && !isSending
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30 cursor-pointer'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
