'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  AtSign,
  Bot,
  Check,
  CheckCheck,
  CheckCircle2,
  ChevronDown,
  Clock,
  CornerDownLeft,
  ExternalLink,
  FileText,
  GitMerge,
  Lock,
  MoreHorizontal,
  PanelRightClose,
  PanelRightOpen,
  Plus,
  RotateCcw,
  Send,
  Sparkles,
  Star,
  Tag,
  X,
  Zap,
  ArrowLeft,
  Smile,
  Frown,
  Meh,
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
import { ChannelBadge } from '@/components/ui/ChannelBadge';
import { ChatThreadSkeleton } from '@/components/ui/Skeleton';
import { createClient } from '@/lib/supabase/client';

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
  onToggleAiMode?: (mode: 'autopilot' | 'disabled') => Promise<void>;
  loading?: boolean;
  onBack?: () => void;
  onToggleDetailsSidebar?: () => void;
  isDetailsSidebarOpen?: boolean;
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

type ThreadAction = "" | "snooze" | "merge" | "auto-assign" | "ai";

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
  onToggleAiMode,
  loading = false,
  onBack,
  onToggleDetailsSidebar,
  isDetailsSidebarOpen = true,
}: ChatThreadProps) {
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [composerMode, setComposerMode] = useState<'reply' | 'internal'>('reply');
  const [showMacros, setShowMacros] = useState(false);
  const [macroSearch, setMacroSearch] = useState('');
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [customTagInput, setCustomTagInput] = useState('');
  const [aiDrafting, setAiDrafting] = useState(false);
  const [collisionAgents, setCollisionAgents] = useState<
    { id: string; name: string; avatar_url?: string }[]
  >([]);
  const [dbMacros, setDbMacros] = useState<CannedItem[]>([]);

  // Features State: Auto-Assign, Snooze, Merge, Mentions
  const [isAutoAssigning, setIsAutoAssigning] = useState(false);
  const [showSnoozeModal, setShowSnoozeModal] = useState(false);
  const [customSnoozeDate, setCustomSnoozeDate] = useState('');
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [mergeCandidates, setMergeCandidates] = useState<Conversation[]>([]);
  const [selectedMergeId, setSelectedMergeId] = useState('');
  const [isMerging, setIsMerging] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [mentionedAgentIds, setMentionedAgentIds] = useState<string[]>([]);
  const [suggestedReplies, setSuggestedReplies] = useState<Array<{ title: string; text: string }>>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const tagPickerRef = useRef<HTMLDivElement>(null);

  // 1. Realtime Agent Collision Detection (Supabase Presence)
  useEffect(() => {
    if (!conversation.id || !currentAgent?.id) return;

    const supabase = createClient();
    const presenceChannel = supabase.channel(
      `conversation-presence-${conversation.id}`,
      {
        config: { presence: { key: currentAgent.id } },
      }
    );

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const others: { id: string; name: string; avatar_url?: string }[] = [];

        Object.keys(state).forEach((key) => {
          if (key !== currentAgent.id) {
            const presences = state[key] as any[];
            presences.forEach((p) => {
              if (
                p &&
                p.agent_id !== currentAgent.id &&
                !others.some((o) => o.id === p.agent_id)
              ) {
                others.push({
                  id: p.agent_id,
                  name: p.agent_name || 'Another agent',
                  avatar_url: p.avatar_url,
                });
              }
            });
          }
        });

        setCollisionAgents(others);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            agent_id: currentAgent.id,
            agent_name: currentAgent.name,
            avatar_url: currentAgent.avatar_url,
          });
        }
      });

    return () => {
      presenceChannel.untrack();
      supabase.removeChannel(presenceChannel);
    };
  }, [conversation.id, currentAgent?.id, currentAgent?.name, currentAgent?.avatar_url]);

  // 2. Fetch Canned Responses from Database
  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('canned_responses')
      .select('*')
      .then(({ data }) => {
        if (data && data.length > 0) {
          setDbMacros(
            data.map((d: any) => ({
              shortcut: d.shortcut.replace(/^[/]/, ''),
              title: d.title || d.shortcut,
              content: d.content,
            }))
          );
        }
      });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Suggestions are fetched on demand from the AI Suggest button, not on every
  // open and every incoming message — that pushed a panel over the composer
  // unasked and spent an API call per keystroke-worth of traffic.
  // Reset during render (React's documented "adjust state on prop change"
  // pattern) rather than in an effect, which would render stale suggestions
  // for a frame after switching conversations.
  const [suggestionsFor, setSuggestionsFor] = useState(conversation.id);
  if (suggestionsFor !== conversation.id) {
    setSuggestionsFor(conversation.id);
    setSuggestedReplies([]);
  }

  // Trigger background sentiment & tag analysis on new visitor message
  useEffect(() => {
    if (!conversation?.id || !conversation?.workspace_id || messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.sender_type === 'visitor') {
      fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: conversation.id,
          workspace_id: conversation.workspace_id,
        }),
      }).catch((err) => console.warn('Failed to trigger AI analysis:', err));
    }
  }, [conversation.id, messages.length]);

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

    // Typing '/' or '#' opens the saved-reply palette.
    if (val.endsWith('/') || val.endsWith('#')) {
      setShowMacros(true);
      setMacroSearch('');
    }

    // Typing '@' in internal note mode opens teammate mentions palette
    if (composerMode === 'internal') {
      if (val.endsWith('@')) {
        setShowMentions(true);
        setMentionFilter('');
      } else if (showMentions) {
        const match = val.match(/@([a-zA-Z0-9_\s]*)$/);
        if (match) {
          setMentionFilter(match[1].toLowerCase());
        } else {
          setShowMentions(false);
        }
      }
    }

    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  };

  // 1. Auto-Assign Handler
  const handleAutoAssign = async () => {
    setIsAutoAssigning(true);
    try {
      const res = await fetch('/api/conversations/auto-assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_id: conversation.id }),
      });
      const data = await res.json();
      if (data.agent) {
        await onAssignAgent(data.agent.id);
      }
    } catch (err) {
      console.error('Auto-assign failed:', err);
    } finally {
      setIsAutoAssigning(false);
    }
  };

  // 2. Snooze Handler
  const handleSnooze = async (minutesOrIso: number | string) => {
    let targetTime: Date;
    if (typeof minutesOrIso === 'string') {
      targetTime = new Date(minutesOrIso);
    } else {
      targetTime = new Date(Date.now() + minutesOrIso * 60 * 1000);
    }

    try {
      await fetch('/api/conversations/snooze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: conversation.id,
          snoozed_until: targetTime.toISOString(),
        }),
      });
      await onUpdateStatus('snoozed');
      setShowSnoozeModal(false);
    } catch (err) {
      console.error('Snooze failed:', err);
    }
  };

  // 3. Open Merge Modal and fetch other conversations from visitor
  const handleOpenMergeModal = async () => {
    setShowMergeModal(true);
    setSelectedMergeId('');
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from('conversations')
        .select('id, status, created_at, updated_at, tags')
        .eq('visitor_id', conversation.visitor_id)
        .neq('id', conversation.id)
        .order('created_at', { ascending: false });

      setMergeCandidates((data as Conversation[]) || []);
    } catch (err) {
      console.error('Failed to load merge candidates:', err);
    }
  };

  // 4. Execute Merge
  const handleExecuteMerge = async (sourceId: string) => {
    if (!sourceId || isMerging) return;
    setIsMerging(true);
    try {
      const res = await fetch('/api/conversations/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_conversation_id: sourceId,
          target_conversation_id: conversation.id,
          agent_name: currentAgent?.name || 'Agent',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowMergeModal(false);
        window.location.reload();
      }
    } catch (err) {
      console.error('Merge execution failed:', err);
    } finally {
      setIsMerging(false);
    }
  };

  // 5. Insert Mention
  const handleInsertMention = (agent: Agent) => {
    const cleaned = inputText.replace(/@[a-zA-Z0-9_\s]*$/, '');
    setInputText(`${cleaned}@${agent.name} `);
    if (!mentionedAgentIds.includes(agent.id)) {
      setMentionedAgentIds((prev) => [...prev, agent.id]);
    }
    setShowMentions(false);
    setMentionFilter('');
    textareaRef.current?.focus();
  };

  const handleSend = async () => {
    if (!inputText.trim() || isSending) return;
    const text = inputText.trim();
    const isInternal = composerMode === 'internal';

    setInputText('');
    setIsSending(true);

    try {
      sound.playSentMessage();

      if (isInternal) {
        const supabase = createClient();
        await supabase.from('internal_notes').insert({
          conversation_id: conversation.id,
          agent_id: currentAgent?.id || null,
          content: text,
          mentioned_agent_ids: mentionedAgentIds,
        });
        setMentionedAgentIds([]);
      }

      await onSendMessage(text, isInternal);

      // If customer is on WhatsApp, Instagram, Messenger, or LinkedIn, dispatch outbound
      if (!isInternal && conversation.channel && conversation.channel !== 'web') {
        fetch('/api/channels/dispatch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId: conversation.id,
            workspaceId: conversation.workspace_id,
            content: text,
            channel: conversation.channel,
          }),
        }).catch((err) => console.error('[Outbound Dispatch Error]:', err));
      }
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

  const handleGenerateAiSuggestion = async () => {
    if (aiDrafting) return;
    setAiDrafting(true);

    try {
      const lastVisitorMsg = [...messages]
        .reverse()
        .find((m) => m.sender_type === 'visitor');

      const res = await fetch('/api/agent/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: conversation.id,
          workspace_id: conversation.workspace_id,
          incoming_message: lastVisitorMsg?.content || '',
          visitor: conversation.visitor,
          channel: conversation.channel || 'web',
        }),
      });

      const data = await res.json();
      if (data.draft) {
        setInputText(data.draft);
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
          textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
          textareaRef.current.focus();
        }
      }
    } catch (err) {
      console.error('Failed to get AI draft:', err);
    } finally {
      setAiDrafting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Cmd+Enter or Ctrl+Enter sends message or note
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSend();
      return;
    }

    // Enter without Shift sends message if popups are not active
    if (e.key === 'Enter' && !e.shiftKey && !showMacros && !showMentions) {
      e.preventDefault();
      handleSend();
      return;
    }

    // Escape closes popups or triggers onBack
    if (e.key === 'Escape') {
      if (showMacros) {
        setShowMacros(false);
        return;
      }
      if (showMentions) {
        setShowMentions(false);
        return;
      }
      if (onBack) {
        onBack();
        return;
      }
    }
  };

  const insertMacro = (macro: CannedItem) => {
    setInputText((prev) => {
      const cleaned = prev.replace(/[/|#][a-zA-Z0-9_-]*$/, '');
      return cleaned
        ? `${cleaned}${cleaned.endsWith(' ') ? '' : ' '}${macro.content}`
        : macro.content;
    });
    setShowMacros(false);
    setMacroSearch('');
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

  const isOnline = Boolean(
    visitor?.is_online !== false &&
    (visitor?.last_seen || visitor?.last_seen_at
      ? (Date.now() - new Date(visitor.last_seen || visitor.last_seen_at!).getTime()) / 1000 < 60
      : false)
  );

  const currentPriority: ConversationPriority = conversation.priority || 'normal';
  const isInternalMode = composerMode === 'internal';

  const filteredMacros = useMemo(() => {
    const combined = [...dbMacros];
    DEFAULT_MACROS.forEach((dm) => {
      if (
        !combined.some(
          (m) => m.shortcut.toLowerCase() === dm.shortcut.toLowerCase()
        )
      ) {
        combined.push(dm);
      }
    });

    const q = macroSearch.toLowerCase();
    if (!q) return combined;
    return combined.filter(
      (m) =>
        m.shortcut.toLowerCase().includes(q) ||
        m.title.toLowerCase().includes(q) ||
        m.content.toLowerCase().includes(q)
    );
  }, [dbMacros, macroSearch]);

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
            {msg.attachment_url && (
              <div className="mb-2">
                {msg.attachment_url.match(/\.(jpeg|jpg|png|webp|gif)$/i) ? (
                  <img
                    src={msg.attachment_url}
                    alt="Attachment"
                    className="rounded-xl max-h-48 w-auto object-cover cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => window.open(msg.attachment_url!, '_blank')}
                  />
                ) : (
                  <a
                    href={msg.attachment_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 p-2 bg-black/10 dark:bg-white/10 rounded-lg text-xs hover:underline"
                  >
                    <FileText className="w-4 h-4 shrink-0" />
                    <span className="truncate">View Attachment</span>
                  </a>
                )}
              </div>
            )}
            {msg.content}
          </div>

          <div
            className={cn(
              'mt-1 flex items-center gap-1 px-1 text-[10.5px] text-ink-3',
              (isAgent || isAI) && 'justify-end'
            )}
          >
            <span className="tabular-nums">{formatTime(msg.created_at)}</span>
            {(isAgent || isAI) && (
              <span
                className="flex items-center"
                title={
                  msg.read_at
                    ? `Seen by customer at ${new Date(msg.read_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                    : isOnline
                    ? 'Delivered (customer is online)'
                    : 'Sent'
                }
              >
                {msg.read_at ? (
                  <CheckCheck
                    className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 stroke-[2.5]"
                    aria-label="Seen by customer"
                  />
                ) : isOnline ? (
                  <CheckCheck
                    className="w-3.5 h-3.5 text-ink-3/70 dark:text-slate-400 stroke-[2]"
                    aria-label="Delivered"
                  />
                ) : (
                  <Check
                    className="w-3.5 h-3.5 text-ink-3/70 dark:text-slate-400 stroke-[2]"
                    aria-label="Sent"
                  />
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  });

  // Placed after every hook: an early return above them changes the hook
  // count between renders, which crashes React when loading flips to false.
  if (loading) {
    return <ChatThreadSkeleton />;
  }

  return (
    <div className="@container/thread flex-1 min-w-0 h-screen flex flex-col bg-canvas">
      {/* ── Header ──
          min-h rather than a fixed h: a fixed height clipped its own content
          the moment anything wrapped. The identity block takes the remaining
          width (flex-1) instead of collapsing, and the name line never wraps —
      {/* ── Header ── */}
      <header className="shrink-0 px-4 py-2.5 min-h-16 flex items-center justify-between gap-3 border-b border-line bg-surface">
        <div className="flex items-center gap-2.5 min-w-0 flex-1 overflow-hidden">
          {onBack && (
            <button
              onClick={onBack}
              className="md:hidden p-1.5 -ml-1 rounded-lg text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors shrink-0"
              title="Back to conversations"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <Avatar
            name={displayName}
            seed={conversation.visitor_id}
            size="md"
            online={isOnline}
            muted={!visitor?.name && !visitor?.email}
            className="shrink-0"
          />
          <div className="min-w-0 flex-1 overflow-hidden">
            {/* Line 1: identity only, always one line, truncated */}
            <div className="flex items-center gap-2 min-w-0 overflow-hidden">
              <h2 className="text-[15px] font-bold tracking-tight truncate min-w-0">
                {displayName}
              </h2>
              {conversation.channel && conversation.channel !== 'web' && (
                <ChannelBadge
                  channel={conversation.channel}
                  showLabel={false}
                  size="xs"
                />
              )}
              {(conversation.sentiment === 'positive' ||
                conversation.sentiment === 'negative') && (
                <span
                  className={cn(
                    'pill shrink-0',
                    conversation.sentiment === 'positive'
                      ? 'pill-success'
                      : 'pill-danger'
                  )}
                  title={`Visitor tone: ${conversation.sentiment}`}
                >
                  {conversation.sentiment === 'positive' ? (
                    <Smile className="w-3 h-3" />
                  ) : (
                    <Frown className="w-3 h-3" />
                  )}
                  {conversation.sentiment === 'positive'
                    ? 'Positive'
                    : 'Frustrated'}
                </span>
              )}
            </div>

            {/* Line 2: details, fully truncated */}
            <div className="flex items-center gap-1.5 text-[11.5px] text-ink-3 min-w-0 overflow-hidden truncate">
              {isOnline ? (
                <span className="inline-flex items-center gap-1.5 text-success font-medium shrink-0">
                  <span className="live-dot" />
                  Active now
                </span>
              ) : (
                <span className="shrink-0 truncate">
                  Active{' '}
                  {formatTimeAgo(visitor?.last_seen || conversation.updated_at)}
                </span>
              )}

              {visitor?.email && (
                <>
                  <span aria-hidden className="shrink-0">
                    ·
                  </span>
                  <a
                    href={`mailto:${visitor.email}`}
                    className="truncate hover:text-accent transition-colors"
                  >
                    {visitor.email}
                  </a>
                </>
              )}

              {visitor?.current_url && (
                <>
                  <span aria-hidden className="shrink-0 hidden @xl/thread:inline">
                    ·
                  </span>
                  <a
                    href={visitor.current_url}
                    target="_blank"
                    rel="noreferrer"
                    className="hidden @xl/thread:inline-flex items-center gap-1 min-w-0 hover:text-accent transition-colors truncate"
                  >
                    <span className="truncate">{visitor.current_url}</span>
                    <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                  </a>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Actions strip in header */}
        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
          <Menu<ConversationStatus>
            value={conversation.status}
            options={STATUS_OPTIONS}
            label="Status"
            onChange={(v) => onUpdateStatus(v)}
            trigger={({ active, open }) => (
              <span
                className={cn(
                  'btn btn-sm btn-secondary gap-1.5',
                  open && 'bg-surface-3'
                )}
                title={`Status: ${active?.label ?? ''}`}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: active?.dot }}
                />
                <span className="hidden @xl/thread:inline">{active?.label}</span>
                <ChevronDown
                  className={cn(
                    'w-3.5 h-3.5 text-ink-3 transition-transform duration-150',
                    open && 'rotate-180'
                  )}
                />
              </span>
            )}
          />

          {conversation.status !== 'closed' ? (
            <button
              onClick={() => onUpdateStatus('closed')}
              className="btn btn-sm btn-primary shadow-xs"
              title="Close and resolve this conversation"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="hidden @2xl/thread:inline">Resolve</span>
            </button>
          ) : (
            <button
              onClick={() => onUpdateStatus('open')}
              className="btn btn-sm btn-secondary shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden @2xl/thread:inline">Reopen</span>
            </button>
          )}

          {/* More actions: AI Autopilot, Snooze, Merge, Auto-Assign */}
          <Menu<ThreadAction>
            value={"" as ThreadAction}
            label="More actions"
            options={[
              ...(onToggleAiMode
                ? [
                    {
                      value: "ai" as ThreadAction,
                      label:
                        conversation.ai_mode !== "disabled"
                          ? "Turn AI autopilot off"
                          : "Turn AI autopilot on",
                      description:
                        conversation.ai_mode !== "disabled"
                          ? "AI is answering this thread"
                          : "Let the AI agent draft and send replies",
                    },
                  ]
                : []),
              {
                value: "snooze",
                label:
                  conversation.status === "snoozed" ? "Snoozed — edit" : "Snooze conversation",
                description: "Hide until a chosen time",
              },
              {
                value: "merge",
                label: "Merge conversation",
                description: "Combine with another thread from this visitor",
              },
              {
                value: "auto-assign",
                label: isAutoAssigning ? "Assigning…" : "Auto-assign to agent",
                description: "Round-robin to an available teammate",
              },
            ]}
            onChange={(action) => {
              if (action === "snooze") setShowSnoozeModal(true);
              else if (action === "merge") handleOpenMergeModal();
              else if (action === "auto-assign") handleAutoAssign();
              else if (action === "ai")
                onToggleAiMode?.(
                  conversation.ai_mode === "disabled" ? "autopilot" : "disabled"
                );
            }}
            trigger={({ open }) => (
              <span
                className={cn(
                  "btn btn-sm btn-secondary w-8.5 px-0",
                  open && "bg-surface-3"
                )}
                title="More actions"
              >
                <MoreHorizontal className="w-4 h-4" />
              </span>
            )}
          />

          {/* CRM Details Sidebar Toggle */}
          {onToggleDetailsSidebar && (
            <button
              onClick={onToggleDetailsSidebar}
              title={isDetailsSidebarOpen ? "Hide CRM details panel" : "Show CRM details panel"}
              aria-label={isDetailsSidebarOpen ? "Hide CRM details panel" : "Show CRM details panel"}
              className={cn(
                "btn btn-sm btn-secondary w-8.5 px-0 transition-all",
                isDetailsSidebarOpen ? "text-accent bg-accent/10 border-accent/30" : "text-ink-3 hover:text-ink"
              )}
            >
              {isDetailsSidebarOpen ? (
                <PanelRightClose className="w-4 h-4" />
              ) : (
                <PanelRightOpen className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </header>

      {/* ── Meta bar: perfectly scrollable single row without overlapping ── */}
      <div className="shrink-0 px-4 py-2 flex items-center gap-2 border-b border-line bg-surface-2 overflow-x-auto scrollbar-none whitespace-nowrap">
        <Menu<ConversationPriority>
          value={currentPriority}
          options={PRIORITY_OPTIONS}
          label="Priority"
          align="start"
          className="shrink-0"
          onChange={(v) => onUpdatePriority?.(v)}
        />

        <div className="inline-flex items-center shrink-0">
          <Menu<string>
            value={conversation.agent_id || ''}
            options={assignOptions}
            label="Assignee"
            align="start"
            className="shrink-0"
            onChange={(v) => onAssignAgent(v || null)}
          />
        </div>

        {/* Interactive AI Autopilot Toggle Pill */}
        {onToggleAiMode && (
          <button
            type="button"
            onClick={() =>
              onToggleAiMode(
                conversation.ai_mode === 'disabled' ? 'autopilot' : 'disabled'
              )
            }
            className={cn(
              'pill shrink-0 transition-all cursor-pointer inline-flex items-center gap-1.5 text-[11px]',
              conversation.ai_mode !== 'disabled'
                ? 'pill-accent font-bold shadow-xs'
                : 'pill-neutral hover:bg-surface-3'
            )}
            title={
              conversation.ai_mode !== 'disabled'
                ? 'AI Autopilot is ON (click to pause)'
                : 'AI Autopilot is OFF (click to activate)'
            }
          >
            <Bot className="w-3 h-3 text-accent" />
            <span>{conversation.ai_mode !== 'disabled' ? 'AI Autopilot' : 'Autopilot Off'}</span>
          </button>
        )}

        {conversation.status === "snoozed" && conversation.snoozed_until && (
          <span className="pill pill-warn shrink-0">
            <Clock className="w-3 h-3" />
            Snoozed {formatTimeAgo(conversation.snoozed_until)}
          </span>
        )}

        <span className="w-px h-4 bg-line-2 mx-0.5 shrink-0" />

        <Tag className="w-3.5 h-3.5 text-ink-3 shrink-0" />

        {conversation.tags?.length ? (
          conversation.tags.map((t) => (
            <span key={t} className="pill pill-accent group shrink-0">
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
          <span className="text-[11.5px] text-ink-3 shrink-0">No tags</span>
        )}

        <div ref={tagPickerRef} className="relative shrink-0">
          <button
            onClick={() => setShowTagPicker((s) => !s)}
            className="inline-flex items-center gap-1 h-[22px] px-2 rounded-full border border-dashed border-line-2 text-[11px] font-medium text-ink-3 hover:text-ink hover:border-line-3 transition-colors shrink-0"
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

        {conversation.csat_rating && (
          <span
            className="pill pill-warn shrink-0"
            title={
              conversation.csat_feedback
                ? `CSAT ${conversation.csat_rating}/5 — ${conversation.csat_feedback}`
                : `CSAT ${conversation.csat_rating}/5`
            }
          >
            <Star className="w-3 h-3 fill-current" />
            {conversation.csat_rating}/5
          </span>
        )}
      </div>

      {/* ── Collision Warning Banner ── */}
      {collisionAgents.length > 0 && (
        <div className="bg-amber-500/10 border-b border-amber-500/25 px-5 py-2.5 flex items-center justify-between text-xs text-amber-800 dark:text-amber-300 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              <strong>Collision Warning:</strong>{' '}
              {collisionAgents.map((a) => a.name).join(', ')}{' '}
              {collisionAgents.length === 1 ? 'is' : 'are'} also viewing this conversation.
            </span>
          </div>
          <div className="flex -space-x-1.5 overflow-hidden">
            {collisionAgents.map((a) => (
              <Avatar key={a.id} name={a.name} size="xs" />
            ))}
          </div>
        </div>
      )}

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
                Type <span className="kbd">/</span> or <span className="kbd">#</span> to open
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

        {/* ── Teammate @Mention Palette ── */}
        {showMentions && isInternalMode && (
          <div className="absolute bottom-[calc(100%-4px)] left-5 z-50 rounded-xl border border-line bg-surface shadow-xl p-2 w-64 animate-pop">
            <div className="flex items-center justify-between mb-1.5 px-1.5">
              <span className="eyebrow flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
                <AtSign className="w-3 h-3" />
                Mention teammate
              </span>
            </div>
            <div className="max-h-48 overflow-y-auto space-y-0.5">
              {agentsList
                .filter(
                  (a) =>
                    !mentionFilter ||
                    a.name.toLowerCase().includes(mentionFilter)
                )
                .map((agent) => (
                  <button
                    key={agent.id}
                    onClick={() => handleInsertMention(agent)}
                    className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-surface-3 transition-colors flex items-center gap-2"
                  >
                    <Avatar name={agent.name} seed={agent.id} size="xs" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-semibold text-ink truncate">
                        {agent.name}
                      </p>
                      <p className="text-[10.5px] text-ink-3 truncate">
                        {agent.email}
                      </p>
                    </div>
                  </button>
                ))}
            </div>
          </div>
        )}

        {/* Claude AI Suggested Replies */}
        {suggestedReplies.length > 0 && (
          <div className="mb-3 p-2.5 rounded-xl bg-accent-soft/40 border border-accent-line flex flex-col gap-1.5 animate-rise">
            <div className="flex items-center justify-between text-[11px] text-accent font-semibold px-0.5">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Claude Suggested Responses (click to insert):
              </span>
              <button
                type="button"
                onClick={() => setSuggestedReplies([])}
                className="opacity-60 hover:opacity-100 transition-opacity p-0.5 rounded"
                title="Dismiss suggestions"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {suggestedReplies.map((sr, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setInputText(sr.text);
                    if (textareaRef.current) {
                      textareaRef.current.style.height = 'auto';
                      textareaRef.current.focus();
                    }
                  }}
                  className="shrink-0 max-w-[260px] text-left p-2 rounded-lg bg-surface text-ink text-[12px] border border-line hover:border-accent hover:shadow-xs transition-all group"
                  title={sr.text}
                >
                  <span className="font-semibold text-[11px] text-accent flex items-center gap-1 mb-0.5">
                    <Sparkles className="w-2.5 h-2.5" />
                    {sr.title}
                  </span>
                  <span className="line-clamp-2 text-[11.5px] leading-snug text-ink-2 group-hover:text-ink">
                    {sr.text}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Unified Linear-Style Composer Card */}
        <div
          className={cn(
            'rounded-2xl border transition-all duration-200 overflow-hidden shadow-xs focus-within:shadow-md',
            isInternalMode
              ? 'bg-amber-500/5 border-amber-500/40 focus-within:border-amber-500/80 focus-within:ring-2 focus-within:ring-amber-500/20'
              : 'bg-surface border-line focus-within:border-accent/80 focus-within:ring-2 focus-within:ring-accent/20'
          )}
        >
          {/* Composer Header Bar */}
          <div className="px-3 pt-2 pb-1.5 flex items-center justify-between gap-2 border-b border-line/40 bg-surface-2/30">
            <div className="inline-flex items-center gap-1 p-0.5 rounded-lg bg-surface-2 border border-line/60">
              <button
                type="button"
                onClick={() => setComposerMode('reply')}
                className={cn(
                  'h-6 px-2.5 rounded-md text-[11.5px] font-semibold transition-all inline-flex items-center gap-1.5',
                  composerMode === 'reply'
                    ? 'bg-surface text-ink font-bold shadow-xs'
                    : 'text-ink-3 hover:text-ink'
                )}
              >
                <Send className="w-3 h-3" />
                Reply
              </button>
              <button
                type="button"
                onClick={() => setComposerMode('internal')}
                className={cn(
                  'h-6 px-2.5 rounded-md text-[11.5px] font-semibold transition-all inline-flex items-center gap-1.5',
                  composerMode === 'internal'
                    ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold shadow-xs'
                    : 'text-ink-3 hover:text-ink'
                )}
              >
                <Lock className="w-3 h-3" />
                Note
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleGenerateAiSuggestion}
                disabled={aiDrafting}
                className="h-6 px-2 rounded-md text-[11px] font-semibold text-accent hover:bg-accent/10 transition-colors inline-flex items-center gap-1"
                title="Ask AI Copilot to draft a reply"
              >
                <Sparkles className={cn('w-3 h-3', aiDrafting && 'animate-spin')} />
                <span>{aiDrafting ? 'Drafting…' : 'AI Copilot'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowMacros((s) => !s)}
                className="h-6 px-2 rounded-md text-[11px] font-medium text-ink-3 hover:text-ink hover:bg-surface-3 transition-colors inline-flex items-center gap-1"
                title="Saved replies (/)"
              >
                <Zap className="w-3 h-3 text-amber-500" />
                <span>Replies</span>
              </button>

              <span className="text-[10.5px] text-ink-3 hidden @3xl/thread:inline shrink-0 truncate max-w-[120px] ml-1">
                as <strong className="text-ink font-medium">{currentAgent?.name || 'Agent'}</strong>
              </span>
            </div>
          </div>

          {/* Textarea */}
          <div className="p-3">
            <textarea
              ref={textareaRef}
              rows={2}
              value={inputText}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={
                isInternalMode
                  ? 'Write an internal note for your team (visitor will not see this)…'
                  : `Reply to ${displayName}…`
              }
              className="w-full bg-transparent text-[13px] leading-relaxed text-ink resize-none focus:outline-none placeholder:text-ink-3 min-h-[48px] max-h-40"
            />
          </div>

          {/* Composer Footer Action Bar */}
          <div className="px-3 py-2 bg-surface-2/40 border-t border-line/40 flex items-center justify-between text-[11px] text-ink-3">
            <div className="flex items-center gap-1.5">
              <span>Press</span>
              <span className="kbd text-[9.5px]">Ctrl ↵</span>
              <span>to send</span>
              <span className="text-ink-3/40">·</span>
              <span className="kbd text-[9.5px]">/</span>
              <span>macros</span>
              {inputText.length > 0 && (
                <>
                  <span className="text-ink-3/40">·</span>
                  <span className="font-mono text-[10px] opacity-70">
                    {inputText.length} chars
                  </span>
                </>
              )}
            </div>

            <button
              onClick={handleSend}
              disabled={!inputText.trim() || isSending}
              title={isInternalMode ? 'Post internal note (Ctrl+Enter)' : 'Send reply (Ctrl+Enter)'}
              className={cn(
                'h-7 px-3 rounded-lg flex items-center gap-1.5 text-[11.5px] font-bold transition-all shadow-xs cursor-pointer',
                !inputText.trim() || isSending
                  ? 'bg-surface-3 text-ink-3 cursor-not-allowed opacity-50'
                  : isInternalMode
                  ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm hover:scale-102'
                  : 'bg-accent hover:bg-accent-hover text-accent-ink shadow-sm hover:scale-102'
              )}
            >
              <span>{isInternalMode ? 'Add Note' : 'Send'}</span>
              {isInternalMode ? (
                <Lock className="w-3 h-3" />
              ) : (
                <Send className="w-3 h-3" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Snooze Modal ── */}
      {showSnoozeModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl border border-line shadow-2xl max-w-sm w-full p-5 animate-pop space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-bold text-ink flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                Snooze Conversation
              </h3>
              <button
                onClick={() => setShowSnoozeModal(false)}
                className="p-1 rounded-md text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[12px] text-ink-2 leading-relaxed">
              This conversation will be hidden until the chosen time, then
              automatically reopen in your inbox.
            </p>

            <div className="space-y-2">
              <button
                onClick={() => handleSnooze(60)}
                className="w-full text-left p-2.5 rounded-xl border border-line hover:border-accent hover:bg-surface-2 transition-all flex items-center justify-between text-[12.5px] font-medium"
              >
                <span>In 1 hour</span>
                <span className="text-[11px] text-ink-3">
                  {new Date(Date.now() + 3600000).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </button>

              <button
                onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() + 1);
                  d.setHours(9, 0, 0, 0);
                  handleSnooze(d.toISOString());
                }}
                className="w-full text-left p-2.5 rounded-xl border border-line hover:border-accent hover:bg-surface-2 transition-all flex items-center justify-between text-[12.5px] font-medium"
              >
                <span>Tomorrow morning</span>
                <span className="text-[11px] text-ink-3">9:00 AM</span>
              </button>

              <button
                onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() + ((1 + 7 - d.getDay()) % 7 || 7));
                  d.setHours(9, 0, 0, 0);
                  handleSnooze(d.toISOString());
                }}
                className="w-full text-left p-2.5 rounded-xl border border-line hover:border-accent hover:bg-surface-2 transition-all flex items-center justify-between text-[12.5px] font-medium"
              >
                <span>Next Monday</span>
                <span className="text-[11px] text-ink-3">9:00 AM</span>
              </button>
            </div>

            {/* Custom Datetime Picker */}
            <div className="pt-2 border-t border-line space-y-2">
              <label className="block text-[11px] font-semibold text-ink-3 uppercase tracking-wider">
                Custom time
              </label>
              <div className="flex gap-2">
                <input
                  type="datetime-local"
                  value={customSnoozeDate}
                  onChange={(e) => setCustomSnoozeDate(e.target.value)}
                  className="input input-sm flex-1 text-[12px]"
                />
                <button
                  disabled={!customSnoozeDate}
                  onClick={() => handleSnooze(customSnoozeDate)}
                  className="btn btn-sm btn-primary shrink-0"
                >
                  Set
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Merge Conversations Modal ── */}
      {showMergeModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl border border-line shadow-2xl max-w-md w-full p-5 animate-pop space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-bold text-ink flex items-center gap-2">
                <GitMerge className="w-4 h-4 text-accent" />
                Merge Conversations
              </h3>
              <button
                onClick={() => setShowMergeModal(false)}
                className="p-1 rounded-md text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[12px] text-ink-2 leading-relaxed">
              Consolidate messages and internal notes from another conversation
              into this active thread (<strong>#{conversation.id.slice(0, 8)}</strong>).
            </p>

            {/* Other Conversations from this Visitor */}
            <div className="space-y-2">
              <label className="block text-[11px] font-semibold text-ink-3 uppercase tracking-wider">
                Visitor&apos;s other conversations
              </label>

              {mergeCandidates.length === 0 ? (
                <p className="text-[12px] text-ink-3 py-3 text-center border border-dashed border-line rounded-xl">
                  No other conversations found for this visitor.
                </p>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-1.5">
                  {mergeCandidates.map((cand) => (
                    <div
                      key={cand.id}
                      className="p-2.5 rounded-xl border border-line hover:border-accent hover:bg-surface-2 flex items-center justify-between gap-2 transition-colors"
                    >
                      <div className="min-w-0">
                        <span className="font-mono text-[11.5px] font-semibold text-ink block">
                          #{cand.id.slice(0, 8)}
                        </span>
                        <span className="text-[11px] text-ink-3">
                          {formatTimeAgo(cand.created_at)} · {cand.status}
                        </span>
                      </div>
                      <button
                        onClick={() => handleExecuteMerge(cand.id)}
                        disabled={isMerging}
                        className="btn btn-xs btn-primary shrink-0"
                      >
                        {isMerging ? 'Merging…' : 'Merge this'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Manual ID Input */}
            <div className="pt-2 border-t border-line space-y-2">
              <label className="block text-[11px] font-semibold text-ink-3 uppercase tracking-wider">
                Or enter another Conversation ID
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Paste conversation UUID…"
                  value={selectedMergeId}
                  onChange={(e) => setSelectedMergeId(e.target.value.trim())}
                  className="input input-sm flex-1 font-mono text-[11.5px]"
                />
                <button
                  disabled={!selectedMergeId || isMerging}
                  onClick={() => handleExecuteMerge(selectedMergeId)}
                  className="btn btn-sm btn-secondary shrink-0"
                >
                  Merge
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
