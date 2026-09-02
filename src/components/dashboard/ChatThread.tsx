'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  CheckCheck,
  CheckCircle2,
  ExternalLink,
  Lock,
  Plus,
  RotateCcw,
  Send,
  Sparkles,
  Star,
  Tag,
  X,
  Zap,
} from 'lucide-react';
import {
  Agent,
  Conversation,
  ConversationPriority,
  ConversationStatus,
  Message,
} from '@/types/database';
import { formatTime, formatTimeAgo, cn } from '@/lib/utils';
import { sound } from '@/lib/sound';
import { Avatar } from '@/components/ui/Avatar';
import { Menu } from '@/components/ui/Menu';

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
  { shortcut: 'hello', title: 'Warm greeting', content: 'Hello! Welcome to our support desk. How can I help you today?' },
  { shortcut: 'pricing', title: 'Pricing overview', content: 'Our plans start at $29/mo with unlimited chats. You can view all features on our pricing page!' },
  { shortcut: 'wait', title: 'Investigating', content: 'Thank you for your patience! I am looking into your inquiry right now and will update you in just a moment.' },
  { shortcut: 'solved', title: 'Issue resolved', content: 'I have resolved this issue for you! Please let me know if there is anything else I can assist with today.' },
  { shortcut: 'refund', title: 'Refund policy', content: 'We offer a 100% money-back guarantee within 14 days of purchase. Would you like me to process that for you?' },
];

const PRESET_TAGS = ['VIP', 'Billing', 'Bug', 'Sales lead', 'Feature request', 'Urgent'];

const PRIORITY_OPTIONS: { value: ConversationPriority; label: string; dot: string }[] = [
  { value: 'low', label: 'Low', dot: 'var(--ds-line-3)' },
  { value: 'normal', label: 'Normal', dot: 'var(--ds-accent)' },
  { value: 'high', label: 'High', dot: 'var(--ds-warn)' },
  { value: 'urgent', label: 'Urgent', dot: 'var(--ds-danger)' },
];

const STATUS_OPTIONS: { value: ConversationStatus; label: string; dot: string }[] = [
  { value: 'open', label: 'Open', dot: 'var(--ds-success)' },
  { value: 'pending', label: 'Pending', dot: 'var(--ds-warn)' },
  { value: 'closed', label: 'Resolved', dot: 'var(--ds-line-3)' },
];

/** Groups consecutive messages into calendar days for the date separators. */
function dayKey(iso: string) {
  return new Date(iso).toDateString();
}

function dayLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86_400_000).toDateString();
  if (d.toDateString() === today) return 'Today';
  if (d.toDateString() === yesterday) return 'Yesterday';
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

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
  const [composerMode, setComposerMode] = useState<'reply' | 'internal'>('reply');
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const [showMacros, setShowMacros] = useState(false);
  const [macroSearch, setMacroSearch] = useState('');

  const [showTagPicker, setShowTagPicker] = useState(false);
  const [customTagInput, setCustomTagInput] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const tagPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Close the tag popover on an outside click.
  useEffect(() => {
    if (!showTagPicker) return;
    const onDown = (e: MouseEvent) => {
      if (!tagPickerRef.current?.contains(e.target as Node)) setShowTagPicker(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [showTagPicker]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInputText(val);

    // `#` at the end opens the saved-reply palette.
    if (val.endsWith('#')) {
      setShowMacros(true);
      setMacroSearch('');
    }

    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
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
    if (e.key === 'Escape') setShowMacros(false);
  };

  const insertMacro = (macro: CannedItem) => {
    setInputText((prev) =>
      prev.endsWith('#')
        ? prev.slice(0, -1) + macro.content
        : prev
        ? `${prev} ${macro.content}`
        : macro.content
    );
    setShowMacros(false);
    textareaRef.current?.focus();
  };

  const handleToggleTag = (tag: string) => {
    if (!onUpdateTags) return;
    const currentTags = conversation.tags || [];
    onUpdateTags(
      currentTags.includes(tag)
        ? currentTags.filter((t) => t !== tag)
        : [...currentTags, tag]
    );
  };

  const handleAddCustomTag = () => {
    if (!customTagInput.trim() || !onUpdateTags) return;
    const clean = customTagInput.trim();
    const currentTags = conversation.tags || [];
    if (!currentTags.includes(clean)) onUpdateTags([...currentTags, clean]);
    setCustomTagInput('');
    setShowTagPicker(false);
  };

  const visitor = conversation.visitor;
  const displayName =
    visitor?.name ||
    (visitor?.email
      ? visitor.email.split('@')[0]
      : `Visitor ${conversation.visitor_id.slice(0, 6)}`);

  const isOnline = visitor?.last_seen
    ? (Date.now() - new Date(visitor.last_seen).getTime()) / 1000 < 60
    : false;

  const currentPriority: ConversationPriority = conversation.priority || 'normal';
  const isInternalMode = composerMode === 'internal';

  const filteredMacros = useMemo(() => {
    const q = macroSearch.toLowerCase();
    return DEFAULT_MACROS.filter(
      (m) =>
        m.shortcut.toLowerCase().includes(q) ||
        m.title.toLowerCase().includes(q) ||
        m.content.toLowerCase().includes(q)
    );
  }, [macroSearch]);

  const assignOptions = useMemo(
    () => [
      { value: '', label: 'Unassigned' },
      ...agentsList.map((a) => ({
        value: a.id,
        label: a.id === currentAgent?.id ? `${a.name} (you)` : a.name,
        dot:
          a.status === 'online'
            ? 'var(--ds-success)'
            : a.status === 'away'
            ? 'var(--ds-warn)'
            : 'var(--ds-line-3)',
      })),
    ],
    [agentsList, currentAgent?.id]
  );

  // Render list with day separators injected between calendar days.
  const rendered: React.ReactNode[] = [];
  let lastDay = '';

  messages.forEach((msg) => {
    const key = dayKey(msg.created_at);
    if (key !== lastDay) {
      lastDay = key;
      rendered.push(
        <div key={`day-${key}`} className="flex items-center gap-3 py-2">
          <span className="flex-1 h-px bg-line" />
          <span className="text-[11px] font-medium text-ink-3">
            {dayLabel(msg.created_at)}
          </span>
          <span className="flex-1 h-px bg-line" />
        </div>
      );
    }

    if (msg.is_internal) {
      rendered.push(
        <div
          key={msg.id}
          className="rounded-xl border border-warn-line bg-warn-soft px-4 py-3"
        >
          <div className="flex items-center justify-between gap-3 mb-1.5">
            <span className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-warn">
              <Lock className="w-3.5 h-3.5" />
              Internal note · {msg.agent?.name || 'Teammate'}
            </span>
            <span className="text-[11px] text-warn/70 tabular-nums">
              {formatTime(msg.created_at)}
            </span>
          </div>
          <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-ink">
            {msg.content}
          </p>
          <p className="mt-2 text-[11px] text-warn/80">
            Only visible to your team — never sent to the visitor.
          </p>
        </div>
      );
      return;
    }

    const isAgent = msg.sender_type === 'agent';
    const isAI = msg.sender_type === 'ai';

    rendered.push(
      <div
        key={msg.id}
        className={cn('flex gap-2.5', isAgent ? 'justify-end' : 'justify-start')}
      >
        {!isAgent && (
          <Avatar
            name={isAI ? 'AI' : displayName}
            seed={isAI ? 'chatify-ai' : conversation.visitor_id}
            size="xs"
            className="mt-auto mb-1"
          />
        )}

        <div className={cn('max-w-[min(560px,72%)]', isAgent && 'items-end')}>
          <div
            className={cn(
              'px-4 py-2.5 text-[13.5px] leading-relaxed whitespace-pre-wrap break-words',
              isAgent
                ? 'rounded-2xl rounded-br-md bg-bubble-out text-bubble-out-ink shadow-sm'
                : isAI
                ? 'rounded-2xl rounded-bl-md bg-accent-soft border border-accent-line text-ink'
                : 'rounded-2xl rounded-bl-md bg-surface-2 border border-line text-ink'
            )}
          >
            {isAI && (
              <span className="flex items-center gap-1 mb-1 text-[10.5px] font-bold uppercase tracking-wide text-accent">
                <Sparkles className="w-3 h-3" />
                Chatify bot
              </span>
            )}
            {msg.content}
          </div>

          <div
            className={cn(
              'mt-1 flex items-center gap-1 px-1 text-[10.5px] text-ink-3',
              isAgent && 'justify-end'
            )}
          >
            <span className="tabular-nums">{formatTime(msg.created_at)}</span>
            {isAgent &&
              (msg.read_at ? (
                <CheckCheck className="w-3 h-3 text-accent" aria-label="Read" />
              ) : (
                <Check className="w-3 h-3" aria-label="Delivered" />
              ))}
          </div>
        </div>
      </div>
    );
  });

  return (
    <div className="flex-1 min-w-0 h-screen flex flex-col bg-canvas">
      {/* ── Header ── */}
      <header className="shrink-0 px-5 h-16 flex items-center justify-between gap-4 border-b border-line bg-surface">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar
            name={displayName}
            seed={conversation.visitor_id}
            size="md"
            online={isOnline}
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <h2 className="text-[15px] font-semibold tracking-tight truncate">
                {displayName}
              </h2>
              {visitor?.email && (
                <span className="text-[12px] text-ink-3 truncate hidden lg:inline">
                  {visitor.email}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-[11.5px] text-ink-3 min-w-0">
              {isOnline ? (
                <span className="inline-flex items-center gap-1.5 text-success font-medium shrink-0">
                  <span className="live-dot" />
                  Active now
                </span>
              ) : (
                <span className="shrink-0">
                  Active {formatTimeAgo(visitor?.last_seen || conversation.updated_at)}
                </span>
              )}
              {visitor?.current_url && (
                <>
                  <span aria-hidden>·</span>
                  <a
                    href={visitor.current_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 hover:text-accent transition-colors truncate max-w-[240px]"
                  >
                    <span className="truncate">{visitor.current_url}</span>
                    <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                  </a>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Only status and the resolve action live up here. Priority and
            assignment sit in the meta bar below, which can wrap — the header
            cannot, and overflowed at common laptop widths. */}
        <div className="flex items-center gap-2 shrink-0">
          <Menu<ConversationStatus>
            value={conversation.status}
            options={STATUS_OPTIONS}
            label="Status"
            onChange={(v) => onUpdateStatus(v)}
          />

          {conversation.status !== 'closed' ? (
            <button
              onClick={() => onUpdateStatus('closed')}
              className="btn btn-sm btn-primary"
              title="Close and resolve this conversation"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Resolve</span>
            </button>
          ) : (
            <button
              onClick={() => onUpdateStatus('open')}
              className="btn btn-sm btn-secondary"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reopen</span>
            </button>
          )}
        </div>
      </header>

      {/* ── Meta bar: priority, assignment, tags ── */}
      <div className="shrink-0 px-5 py-2 flex items-center justify-between gap-3 flex-wrap border-b border-line bg-surface-2">
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          <Menu<ConversationPriority>
            value={currentPriority}
            options={PRIORITY_OPTIONS}
            label="Priority"
            align="start"
            className="shrink-0"
            onChange={(v) => onUpdatePriority?.(v)}
          />

          <Menu<string>
            value={conversation.agent_id || ''}
            options={assignOptions}
            label="Assignee"
            align="start"
            className="shrink-0"
            onChange={(v) => onAssignAgent(v || null)}
          />

          <span className="w-px h-4 bg-line-2 mx-1" />

          <Tag className="w-3.5 h-3.5 text-ink-3 shrink-0" />

          {conversation.tags?.length ? (
            conversation.tags.map((t) => (
              <span key={t} className="pill pill-accent group">
                {t}
                <button
                  onClick={() => handleToggleTag(t)}
                  aria-label={`Remove tag ${t}`}
                  className="opacity-50 hover:opacity-100 transition-opacity"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            ))
          ) : (
            <span className="text-[11.5px] text-ink-3">No tags</span>
          )}

          <div ref={tagPickerRef} className="relative">
            <button
              onClick={() => setShowTagPicker((s) => !s)}
              className="inline-flex items-center gap-1 h-[22px] px-2 rounded-full border border-dashed border-line-2 text-[11px] font-medium text-ink-3 hover:text-ink hover:border-line-3 transition-colors"
            >
              <Plus className="w-3 h-3" />
              Add
            </button>

            {showTagPicker && (
              <div className="absolute top-[calc(100%+6px)] left-0 z-50 w-56 p-2 rounded-xl border border-line bg-surface shadow-lg animate-pop">
                <div className="eyebrow px-1.5 pb-1.5">Tags</div>
                <div className="space-y-0.5 mb-2">
                  {PRESET_TAGS.map((pt) => {
                    const active = (conversation.tags || []).includes(pt);
                    return (
                      <button
                        key={pt}
                        onClick={() => handleToggleTag(pt)}
                        className={cn(
                          'w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-[12.5px] transition-colors',
                          active
                            ? 'bg-accent-soft text-accent font-medium'
                            : 'text-ink hover:bg-surface-3'
                        )}
                      >
                        {pt}
                        {active && <Check className="w-3.5 h-3.5" />}
                      </button>
                    );
                  })}
                </div>
                <div className="pt-2 border-t border-line flex items-center gap-1.5">
                  <input
                    type="text"
                    placeholder="Custom tag"
                    value={customTagInput}
                    onChange={(e) => setCustomTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCustomTag()}
                    className="input input-sm flex-1"
                  />
                  <button
                    onClick={handleAddCustomTag}
                    className="btn btn-sm btn-primary shrink-0"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {conversation.csat_rating && (
          <span className="pill pill-warn shrink-0">
            <Star className="w-3 h-3 fill-current" />
            CSAT {conversation.csat_rating}/5
            {conversation.csat_feedback && (
              <span className="font-normal opacity-80">
                · {conversation.csat_feedback}
              </span>
            )}
          </span>
        )}
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-3.5">
        <div className="flex justify-center">
          <span className="pill pill-neutral">
            Conversation opened {formatTimeAgo(conversation.created_at)}
          </span>
        </div>
        {rendered}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Composer ── */}
      <div className="shrink-0 px-5 py-3.5 border-t border-line bg-surface relative">
        {showMacros && (
          <div className="absolute bottom-[calc(100%-4px)] left-5 right-5 z-50 rounded-xl border border-line bg-surface shadow-xl p-2.5 animate-pop">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="eyebrow flex items-center gap-1.5">
                <Zap className="w-3 h-3" />
                Saved replies
              </span>
              <span className="text-[11px] text-ink-3">
                Type <span className="kbd">#</span> to open
              </span>
            </div>

            <input
              type="text"
              placeholder="Search replies…"
              value={macroSearch}
              onChange={(e) => setMacroSearch(e.target.value)}
              className="input input-sm mb-2"
              autoFocus
            />

            <div className="max-h-56 overflow-y-auto space-y-0.5">
              {filteredMacros.length === 0 ? (
                <p className="py-4 text-center text-[12.5px] text-ink-3">
                  No matching replies
                </p>
              ) : (
                filteredMacros.map((macro) => (
                  <button
                    key={macro.shortcut}
                    onClick={() => insertMacro(macro)}
                    className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-surface-3 transition-colors group"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-[12.5px] font-semibold text-ink group-hover:text-accent transition-colors">
                        #{macro.shortcut}
                      </span>
                      <span className="text-[11px] text-ink-3 shrink-0">
                        {macro.title}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11.5px] text-ink-3 truncate">
                      {macro.content}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-2.5">
          <div className="inline-flex items-center gap-0.5 p-0.5 rounded-lg bg-surface-2 border border-line">
            {(
              [
                ['reply', 'Reply'],
                ['internal', 'Note'],
              ] as const
            ).map(([mode, label]) => (
              <button
                key={mode}
                onClick={() => setComposerMode(mode)}
                className={cn(
                  'h-7 px-3 rounded-md text-[12px] font-semibold transition-colors inline-flex items-center gap-1.5',
                  composerMode === mode
                    ? mode === 'internal'
                      ? 'bg-warn-soft text-warn shadow-xs'
                      : 'bg-surface text-ink shadow-xs'
                    : 'text-ink-3 hover:text-ink'
                )}
              >
                {mode === 'internal' && <Lock className="w-3 h-3" />}
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowMacros((s) => !s)}
              className="btn btn-sm btn-ghost"
            >
              <Zap className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Saved replies</span>
            </button>
            <span className="text-[11.5px] text-ink-3 hidden md:inline">
              as{' '}
              <span className="font-medium text-ink-2">
                {currentAgent?.name || 'Agent'}
              </span>
            </span>
          </div>
        </div>

        <div
          className={cn(
            'flex items-end gap-2 p-2 rounded-xl border transition-colors',
            isInternalMode
              ? 'bg-warn-soft border-warn-line focus-within:border-warn'
              : 'bg-surface-2 border-line-2 focus-within:border-accent'
          )}
        >
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputText}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={
              isInternalMode
                ? 'Write a note for your team — the visitor never sees this…'
                : `Reply to ${displayName}…`
            }
            className="flex-1 min-h-[42px] max-h-40 px-2 py-2.5 bg-transparent text-[13.5px] leading-relaxed text-ink resize-none focus:outline-none"
          />

          <button
            onClick={handleSend}
            disabled={!inputText.trim() || isSending}
            title={isInternalMode ? 'Post internal note' : 'Send reply'}
            className={cn(
              'shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-all',
              !inputText.trim() || isSending
                ? 'bg-surface-3 text-ink-3 cursor-not-allowed'
                : isInternalMode
                ? 'bg-warn text-white hover:opacity-90 shadow-sm'
                : 'bg-ink text-ink-inv hover:bg-primary-hover shadow-sm'
            )}
          >
            {isInternalMode ? (
              <Lock className="w-4 h-4" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>

        <p className="mt-2 text-[11px] text-ink-3">
          <span className="kbd">↵</span> to send ·{' '}
          <span className="kbd">⇧</span>
          <span className="kbd">↵</span> for a new line ·{' '}
          <span className="kbd">#</span> for saved replies
        </p>
      </div>
    </div>
  );
}
