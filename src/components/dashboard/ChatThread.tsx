'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertTriangle,
  AtSign,
  Bot,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
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
  CornerUpLeft,
  Image as ImageIcon,
  Paperclip,
  Pencil,
  Trash2,
  Loader2,
  Globe,
} from 'lucide-react';
import {
  Agent,
  CannedResponse,
  Conversation,
  ConversationPriority,
  ConversationStatus,
  Message,
  Workspace,
} from '@/types/database';
import { formatTime, formatTimeAgo, cn } from '@/lib/utils';
import { sound } from '@/lib/sound';
import { Avatar } from '@/components/ui/Avatar';
import { Menu } from '@/components/ui/Menu';
import { ChannelBadge } from '@/components/ui/ChannelBadge';
import { ChatThreadSkeleton } from '@/components/ui/Skeleton';
import {
  MessageTicks,
  messageStatusOf,
} from '@/components/ui/MessageTicks';
import { CountryFlag } from '@/components/ui/BrandIcon';
import { parseLocation } from '@/lib/visitor-meta';
import { createClient } from '@/lib/supabase/client';
import { EMOJI_CATEGORIES, ALL_EMOJIS } from '@/lib/emojis';
import { ChatMarkdown } from '@/components/ui/ChatMarkdown';
import {
  detectLanguage,
  SUPPORTED_LANGUAGES,
  getLanguageInfo,
} from '@/lib/ai/translator';

interface ChatThreadProps {
  conversation: Conversation;
  messages: Message[];
  currentAgent: Agent | null;
  agentsList: Agent[];
  /** @param replyToId - the message being quoted, when the agent used Reply. */
  onSendMessage: (
    content: string,
    isInternal?: boolean,
    conversationId?: string,
    replyToId?: string | null,
    attachmentUrl?: string | null,
    metadata?: Record<string, any> | null
  ) => Promise<void>;
  onEditMessage?: (id: string, content: string) => Promise<void>;
  onDeleteMessage?: (id: string) => Promise<void>;
  onUpdateStatus: (status: ConversationStatus) => Promise<void>;
  onAssignAgent: (agentId: string | null) => Promise<void>;
  onUpdatePriority?: (priority: ConversationPriority) => Promise<void>;
  onUpdateTags?: (tags: string[]) => Promise<void>;
  onToggleAiMode?: (mode: 'autopilot' | 'disabled') => Promise<void>;
  /**
   * The AI assistant owns the replies on this thread. Agents can still leave
   * internal notes, but a customer-facing reply needs them to take over first,
   * so the visitor never gets answers from both.
   */
  aiAnswering?: boolean;
  loading?: boolean;
  onBack?: () => void;
  onToggleDetailsSidebar?: () => void;
  isDetailsSidebarOpen?: boolean;
  onMerged?: (targetId: string) => Promise<void> | void;
  cannedResponses?: CannedResponse[];
  workspace?: Workspace | null;
}

interface CannedItem {
  shortcut: string;
  title: string;
  content: string;
}

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
  onEditMessage,
  onDeleteMessage,
  onUpdateStatus,
  onAssignAgent,
  onUpdatePriority,
  onUpdateTags,
  onToggleAiMode,
  aiAnswering = false,
  loading = false,
  onBack,
  onToggleDetailsSidebar,
  isDetailsSidebarOpen = true,
  onMerged,
  cannedResponses,
  workspace,
}: ChatThreadProps) {
  const [inputText, setInputText] = useState('');
  const composerRef = useRef<HTMLDivElement>(null);
  /** The message the agent is replying to, or null for a plain message. */
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  /** Briefly tinted after a quote is clicked, so the eye finds the original. */
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [noteErrorToast, setNoteErrorToast] = useState<string | null>(null);
  const [composerMode, setComposerMode] = useState<'reply' | 'internal'>('reply');
  const [showMacros, setShowMacros] = useState(false);
  const [macroSearch, setMacroSearch] = useState('');
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [tagPickerCoords, setTagPickerCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const tagMenuRef = useRef<HTMLDivElement>(null);
  const [customTagInput, setCustomTagInput] = useState('');
  const [aiDrafting, setAiDrafting] = useState(false);
  const [collisionAgents, setCollisionAgents] = useState<
    { id: string; name: string; avatar_url?: string }[]
  >([]);
  const [dbMacros, setDbMacros] = useState<CannedResponse[]>([]);

  // Features State: Auto-Translation (Bidirectional English <-> Customer Language)
  const [targetLanguage, setTargetLanguage] = useState<string>('en');
  const [autoTranslateEnabled, setAutoTranslateEnabled] = useState<boolean>(false);
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [expandedTranslations, setExpandedTranslations] = useState<Record<string, boolean>>({});
  const [showTranslateMenu, setShowTranslateMenu] = useState<boolean>(false);
  const translateMenuRef = useRef<HTMLDivElement>(null);
  const bottomTranslateBtnRef = useRef<HTMLButtonElement>(null);

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

  // Emoji Picker State
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeEmojiCategory, setActiveEmojiCategory] = useState('smileys');
  const [emojiSearchQuery, setEmojiSearchQuery] = useState('');

  const handleInsertEmoji = (emoji: string) => {
    if (!textareaRef.current) {
      setInputText((prev) => prev + emoji);
      return;
    }
    const el = textareaRef.current;
    const start = el.selectionStart || inputText.length;
    const end = el.selectionEnd || inputText.length;
    const newText = inputText.substring(0, start) + emoji + inputText.substring(end);
    setInputText(newText);
    setTimeout(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = start + emoji.length;
    }, 10);
  };

  // Message Edit & Delete State
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [deleteConfirmMsg, setDeleteConfirmMsg] = useState<Message | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const startEditing = (msg: Message) => {
    setEditingMessageId(msg.id);
    setEditingContent(msg.content);
  };

  const cancelEditing = () => {
    setEditingMessageId(null);
    setEditingContent('');
    setIsSavingEdit(false);
  };

  const handleSaveEdit = async (messageId: string) => {
    if (!editingContent.trim() || isSavingEdit) return;
    try {
      setIsSavingEdit(true);
      if (onEditMessage) {
        await onEditMessage(messageId, editingContent.trim());
      }
      setEditingMessageId(null);
      setEditingContent('');
    } catch (err: any) {
      console.error('Failed to save message edit:', err);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmMsg || isDeleting) return;
    try {
      setIsDeleting(true);
      if (onDeleteMessage) {
        await onDeleteMessage(deleteConfirmMsg.id);
      }
      setDeleteConfirmMsg(null);
    } catch (err: any) {
      console.error('Failed to delete message:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const tagPickerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [pendingAttachment, setPendingAttachment] = useState<{
    file: File;
    isImage: boolean;
    previewUrl: string;
  } | null>(null);
  const [previewImageModalUrl, setPreviewImageModalUrl] = useState<string | null>(null);

  const isImageAttachment = (url: string | null | undefined): boolean => {
    if (!url) return false;
    if (url.includes('cloudinary.com') && (url.includes('/image/upload/') || !url.includes('/raw/upload/'))) {
      return true;
    }
    return Boolean(url.match(/\.(jpeg|jpg|png|webp|gif|svg|avif|bmp)(\?.*)?$/i));
  };

  const handleSelectFile = (file: File) => {
    if (file.size > 15 * 1024 * 1024) {
      alert('File size exceeds maximum 15MB limit.');
      return;
    }
    if (pendingAttachment?.previewUrl) {
      URL.revokeObjectURL(pendingAttachment.previewUrl);
    }
    const isImg = file.type.startsWith('image/');
    const previewUrl = isImg ? URL.createObjectURL(file) : '';
    setPendingAttachment({ file, isImage: isImg, previewUrl });
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          handleSelectFile(file);
          break;
        }
      }
    }
  };

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
      .subscribe(async (status: any) => {
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

  // 2. Fetch Canned Responses from Database if not provided via props
  useEffect(() => {
    if (cannedResponses && cannedResponses.length > 0) return;
    const supabase = createClient();
    let query = supabase.from('canned_responses').select('*');
    if (conversation.workspace_id) {
      query = query.or(`workspace_id.eq.${conversation.workspace_id},workspace_id.is.null`);
    }
    query.then(({ data }: any) => {
      if (data && data.length > 0) {
        setDbMacros(data as CannedResponse[]);
      }
    });
  }, [cannedResponses, conversation.workspace_id]);

  const scrollToBottom = useCallback((smooth = false) => {
    const scroll = () => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
      messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'end' });
    };

    scroll();
    requestAnimationFrame(scroll);
    setTimeout(scroll, 50);
    setTimeout(scroll, 200);
  }, []);

  // Jump to bottom immediately on conversation open or switch (like WhatsApp)
  useEffect(() => {
    scrollToBottom(false);
  }, [conversation?.id, scrollToBottom]);

  // Jump to bottom when messages load or change
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom(false);
    }
  }, [messages, scrollToBottom]);

  // Jump to bottom when loading finishes
  useEffect(() => {
    if (!loading) {
      scrollToBottom(false);
    }
  }, [loading, scrollToBottom]);

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

  // Trigger background sentiment & tag analysis only on a new unanalyzed visitor message
  const lastAnalyzedMsgIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!conversation?.id || !conversation?.workspace_id || messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    if (
      lastMsg?.sender_type === 'visitor' &&
      lastMsg.id &&
      lastMsg.id !== lastAnalyzedMsgIdRef.current &&
      !conversation.sentiment
    ) {
      lastAnalyzedMsgIdRef.current = lastMsg.id;
      fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: conversation.id,
          workspace_id: conversation.workspace_id,
        }),
      }).catch((err) => console.warn('Failed to trigger AI analysis:', err));
    }
  }, [conversation?.id, conversation?.sentiment, conversation?.workspace_id, messages]);

  // Close the tag popover on an outside click and track positioning
  useEffect(() => {
    if (!showTagPicker) return;

    const updateTagPosition = () => {
      if (!tagPickerRef.current) return;
      const rect = tagPickerRef.current.getBoundingClientRect();
      const menuWidth = 224; // w-56
      let left = rect.left;
      if (left + menuWidth > window.innerWidth - 8) {
        left = Math.max(8, window.innerWidth - menuWidth - 8);
      }
      setTagPickerCoords({
        top: Math.round(rect.bottom + 6),
        left: Math.round(left),
      });
    };

    updateTagPosition();

    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        !tagPickerRef.current?.contains(target) &&
        !tagMenuRef.current?.contains(target)
      ) {
        setShowTagPicker(false);
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        setShowTagPicker(false);
      }
    };

    window.addEventListener('scroll', updateTagPosition, true);
    window.addEventListener('resize', updateTagPosition);
    window.addEventListener('keydown', onKey, { capture: true });
    document.addEventListener('mousedown', onDown);

    return () => {
      window.removeEventListener('scroll', updateTagPosition, true);
      window.removeEventListener('resize', updateTagPosition);
      window.removeEventListener('keydown', onKey, { capture: true });
      document.removeEventListener('mousedown', onDown);
    };
  }, [showTagPicker]);

  const typingSignalRef = React.useRef<{ convId: string; channel: any; last: number } | null>(null);

  // Lets the visitor's widget show "typing…". Throttled; never for internal notes.
  const sendTypingSignal = () => {
    if (!conversation?.id) return;
    const now = Date.now();
    let state = typingSignalRef.current;
    if (!state || state.convId !== conversation.id) {
      const supabase = createClient();
      if (state) supabase.removeChannel(state.channel);
      const channel = supabase.channel(`zen-try-typing-${conversation.id}`);
      channel.subscribe();
      state = { convId: conversation.id, channel, last: 0 };
      typingSignalRef.current = state;
    }
    if (now - state.last < 2500) return;
    state.last = now;
    state.channel.send({ type: 'broadcast', event: 'typing', payload: { sender: 'agent' } });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInputText(val);
    if (composerMode !== 'internal' && val.trim()) sendTypingSignal();

    // Typing '/' opens the saved-reply palette. Use one notation everywhere: "/shortcut"
    const slashMatch = val.match(/\/([a-zA-Z0-9_-]*)$/);
    if (slashMatch) {
      setShowMacros(true);
      setMacroSearch(slashMatch[1]);
    } else if (showMacros && !val.includes('/')) {
      setShowMacros(false);
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
    const computedLineHeight = 22;
    const minHeight = computedLineHeight * 3; // ~66px (3 lines)
    const maxHeight = computedLineHeight * 10; // ~220px (10 lines)
    const nextHeight = Math.min(Math.max(el.scrollHeight, minHeight), maxHeight);
    el.style.height = `${nextHeight}px`;
  };

  // Keep reply composer auto-grown from 3 to 10 lines whenever inputText changes
  useEffect(() => {
    if (textareaRef.current) {
      const el = textareaRef.current;
      el.style.height = 'auto';
      const computedLineHeight = 22;
      const minHeight = computedLineHeight * 3;
      const maxHeight = computedLineHeight * 10;
      const nextHeight = Math.min(Math.max(el.scrollHeight, minHeight), maxHeight);
      el.style.height = `${nextHeight}px`;
    }
  }, [inputText]);

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

  // 3. Open Merge Modal and fetch other conversations from visitor (by visitor_id and email)
  const handleOpenMergeModal = async () => {
    setShowMergeModal(true);
    setSelectedMergeId('');
    try {
      const supabase = createClient();
      const vid = conversation.visitor_id;
      const email = conversation.visitor?.email?.trim().toLowerCase();
      let visitorIds = [vid].filter(Boolean) as string[];

      if (email) {
        const { data: matchedVisitors } = await supabase
          .from('visitors')
          .select('id')
          .eq('email', email);
        if (matchedVisitors) {
          const ids = (matchedVisitors as Array<{ id: string }>).map((v) => v.id);
          visitorIds = Array.from(new Set([...visitorIds, ...ids]));
        }
      }

      const { data } = await supabase
        .from('conversations')
        .select('id, status, created_at, updated_at, tags')
        .in('visitor_id', visitorIds)
        .neq('id', conversation.id)
        .order('updated_at', { ascending: false });

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
        if (onMerged) {
          await onMerged(conversation.id);
        } else {
          window.location.reload();
        }
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

  // 6. Customer Language Auto-Detection & Sync
  const detectedVisitorLang = useMemo(() => {
    // 1. Scan visitor messages in the thread (most recent first)
    const visitorMessages = [...messages]
      .reverse()
      .filter((m) => m.sender_type === 'visitor' && m.content?.trim());

    if (visitorMessages.length > 0) {
      for (const msg of visitorMessages) {
        const text = msg.content.trim();
        // Skip purely numeric/punctuation messages or empty
        if (!/[a-zA-Z\u00C0-\uFFFF]/.test(text)) continue;

        const transLang =
          msg.metadata?.translation?.detected_language ||
          msg.metadata?.detected_language;

        // If explicitly detected and supported
        if (transLang && SUPPORTED_LANGUAGES[transLang.toLowerCase()]) {
          return transLang.toLowerCase();
        }

        const det = detectLanguage(text);
        if (det.code && SUPPORTED_LANGUAGES[det.code]) {
          return det.code;
        }
      }
    }

    // 2. Check channel_metadata if already known for this conversation
    const chanMeta = conversation.channel_metadata as Record<string, any> | undefined;
    if (chanMeta?.visitor_language && SUPPORTED_LANGUAGES[chanMeta.visitor_language.toLowerCase()]) {
      return chanMeta.visitor_language.toLowerCase();
    }

    // 3. Check visitor profile language
    if (conversation.visitor?.language) {
      const code = conversation.visitor.language.split('-')[0].toLowerCase();
      if (SUPPORTED_LANGUAGES[code]) return code;
    }

    return 'en';
  }, [conversation, messages]);

  // Close translation menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        translateMenuRef.current &&
        !translateMenuRef.current.contains(target) &&
        (!bottomTranslateBtnRef.current || !bottomTranslateBtnRef.current.contains(target))
      ) {
        setShowTranslateMenu(false);
      }
    };
    if (showTranslateMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTranslateMenu]);

  // Track previous conversation ID to detect when user switches conversations
  const prevConvIdRef = useRef<string>(conversation.id);

  // Sync target language when conversation or detected visitor language changes
  useEffect(() => {
    const isNewConv = prevConvIdRef.current !== conversation.id;
    if (isNewConv) {
      prevConvIdRef.current = conversation.id;
      if (detectedVisitorLang && detectedVisitorLang !== 'en') {
        setTargetLanguage(detectedVisitorLang);
        setAutoTranslateEnabled(true);
      } else {
        setTargetLanguage('en');
        setAutoTranslateEnabled(false);
      }
    } else if (detectedVisitorLang && detectedVisitorLang !== 'en' && targetLanguage === 'en') {
      // Inbound foreign message detected in current thread
      setTargetLanguage(detectedVisitorLang);
      setAutoTranslateEnabled(true);
    }
  }, [detectedVisitorLang, conversation.id, targetLanguage]);

  // Set to track in-flight translation requests so we don't repeat them
  const inFlightTranslationsRef = useRef<Set<string>>(new Set());

  // Auto-translate any incoming non-English visitor messages that haven't been translated yet
  useEffect(() => {
    const untranslated = messages.filter(
      (m) =>
        m.sender_type === 'visitor' &&
        m.content?.trim() &&
        !inFlightTranslationsRef.current.has(m.id) &&
        (!m.metadata?.translation?.is_translated ||
          !m.metadata?.translation?.english_text ||
          (m.metadata?.translation?.detected_language !== 'en' &&
            m.metadata?.translation?.english_text === m.content))
    );

    if (untranslated.length === 0) return;

    untranslated.forEach((m) => {
      inFlightTranslationsRef.current.add(m.id);
      fetch('/api/translation/process-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId: m.id,
          conversationId: conversation.id,
          text: m.content,
          workspaceId: conversation.workspace_id,
        }),
      })
        .catch((e) => {
          inFlightTranslationsRef.current.delete(m.id);
          console.warn('Inbound translation trigger failed:', e);
        });
    });
  }, [messages, conversation.id, conversation.workspace_id]);

  const handleSend = async () => {
    if ((!inputText.trim() && !pendingAttachment) || isSending || isTranslating) return;
    const text = inputText.trim();
    const isInternal = composerMode === 'internal';
    if (!isInternal && aiAnswering) return;

    setIsSending(true);
    setSendError(null);

    let attachmentUrl: string | null = null;
    if (pendingAttachment) {
      try {
        const formData = new FormData();
        formData.append('file', pendingAttachment.file);
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to upload image to Cloudinary');
        }
        const data = await res.json();
        attachmentUrl = data.url;
      } catch (err: any) {
        setSendError(err.message || 'Image upload failed');
        setIsSending(false);
        return;
      }
    }

    if (pendingAttachment?.previewUrl) {
      URL.revokeObjectURL(pendingAttachment.previewUrl);
    }
    setPendingAttachment(null);
    setInputText('');
    setShowEmojiPicker(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (imageInputRef.current) imageInputRef.current.value = '';

    try {
      sound.playSentMessage();

      if (isInternal) {
        const supabase = createClient();
        await supabase.from('internal_notes').insert({
          conversation_id: conversation.id,
          agent_id: currentAgent?.id || null,
          content: text || (attachmentUrl ? 'Attached an image' : ''),
          mentioned_agent_ids: mentionedAgentIds,
        });
        setMentionedAgentIds([]);
      }

      // Auto-translate agent reply (written in ANY language) into customer's native language and English
      let finalContentToSend = text;
      let translationMetadata: Record<string, any> | null = null;

      // Determine customer target language: controlled strictly by state
      const effectiveCustomerLang = targetLanguage || 'en';

      // Check if agent typed in a foreign language (e.g. Urdu, Roman Urdu, Hindi)
      const agentInputLang = detectLanguage(text).code;
      const isAgentWritingForeign = autoTranslateEnabled && effectiveCustomerLang === 'en' && agentInputLang !== 'en';

      // CRITICAL FIX: Only translate if autoTranslateEnabled is TRUE!
      // If the agent turns off auto-translation, NEVER translate!
      const shouldTranslate =
        !isInternal &&
        text.trim().length > 0 &&
        autoTranslateEnabled &&
        (effectiveCustomerLang !== 'en' || isAgentWritingForeign);

      if (shouldTranslate) {
        setIsTranslating(true);
        try {
          const transRes = await fetch('/api/translation/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              direction: 'agent_reply',
              text,
              targetLanguage: effectiveCustomerLang,
              workspaceId: conversation.workspace_id,
            }),
          });
          if (transRes.ok) {
            const data = await transRes.json();
            const wasTranslated = Boolean(
              data.isTranslated ||
              (data.translatedText && data.translatedText.trim().toLowerCase() !== text.trim().toLowerCase())
            );

            if (wasTranslated && data.translatedText && data.translatedText.trim()) {
              finalContentToSend = data.translatedText.trim();
              const englishText = data.englishText?.trim() || text;
              const detectedLang = data.detectedSourceLanguage || 'en';
              const langInfo = getLanguageInfo(effectiveCustomerLang);
              translationMetadata = {
                translation: {
                  is_translated: true,
                  direction: 'agent_to_visitor',
                  original_agent_input: text,
                  agent_input_language: detectedLang,
                  english_text: englishText,
                  original_english: englishText,
                  translated_text: finalContentToSend,
                  target_language: effectiveCustomerLang,
                  target_language_name: langInfo.name,
                },
                english_text: englishText,
                original_english: englishText,
                original_agent_input: text,
                translated_text: finalContentToSend,
                target_language: effectiveCustomerLang,
              };
            }
          }
        } catch (tErr) {
          console.warn('[Auto-Translate Error, sending original text]:', tErr);
        } finally {
          setIsTranslating(false);
        }
      }

      // An internal note is not a chat message, so it cannot quote one.
      const quotedId = isInternal ? null : replyTo?.id ?? null;
      await onSendMessage(
        finalContentToSend,
        isInternal,
        conversation.id,
        quotedId,
        attachmentUrl,
        translationMetadata
      );
      setReplyTo(null);

      // If customer is on WhatsApp, Instagram, Messenger, or LinkedIn, dispatch outbound
      if (!isInternal && conversation.channel && conversation.channel !== 'web') {
        fetch('/api/channels/dispatch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId: conversation.id,
            workspaceId: conversation.workspace_id,
            content: finalContentToSend || (attachmentUrl ? '[Image Attachment]' : ''),
            channel: conversation.channel,
          }),
        }).catch((err) => console.error('[Outbound Dispatch Error]:', err));
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      // Give the draft back AND say so — silently restoring the text looked
      // like the message had been sent and then reappeared.
      // The quote is part of the draft: dropping it on failure would send a
      // bare message on retry, answering nothing in particular.
      setInputText(text);
      const errMsg =
        err instanceof Error
          ? err.message
          : isInternal
          ? 'Failed to save internal note. Please try again.'
          : 'Could not send. Try again.';
      setSendError(errMsg);
      if (isInternal) {
        setNoteErrorToast(errMsg);
        setTimeout(() => setNoteErrorToast(null), 6000);
      }
    } finally {
      setIsSending(false);
      setIsTranslating(false);
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
      const recentMessages = messages.slice(-15);
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
          recent_messages: recentMessages,
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
      if (showTagPicker) {
        setShowTagPicker(false);
        return;
      }
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
      const cleaned = prev.replace(/\/([a-zA-Z0-9_-]*)$/, '');
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
  const truncatedDisplayName =
    displayName.length > 24 ? `${displayName.slice(0, 24)}…` : displayName;

  const isOnline = Boolean(
    visitor?.is_online !== false &&
    (visitor?.last_seen || visitor?.last_seen_at
      ? (Date.now() - new Date(visitor.last_seen || visitor.last_seen_at!).getTime()) / 1000 < 60
      : false)
  );

  const currentPriority: ConversationPriority = conversation.priority || 'normal';
  const visitorPlace = useMemo(
    () =>
      parseLocation(
        visitor?.location,
        visitor?.ip_location_city,
        visitor?.ip_location_country
      ),
    [visitor?.location, visitor?.ip_location_city, visitor?.ip_location_country]
  );
  const isInternalMode = composerMode === 'internal';
  const replyLocked = aiAnswering && !isInternalMode;

  const workspaceMacros = useMemo(() => {
    const list = cannedResponses && cannedResponses.length > 0 ? cannedResponses : dbMacros;
    return list
      .filter((c) => {
        // Workspace check: if canned response has a workspace_id, must match this workspace
        if (c.workspace_id && conversation.workspace_id && c.workspace_id !== conversation.workspace_id) {
          return false;
        }
        // Team replies are for all agents (agent_id is null/undefined)
        if (!c.agent_id) return true;
        // Personal replies are only for this agent
        return c.agent_id === currentAgent?.id;
      })
      .map((c) => ({
        shortcut: c.shortcut.replace(/^\/+/, ''),
        title: c.title || c.shortcut,
        content: c.content,
      }));
  }, [cannedResponses, dbMacros, conversation.workspace_id, currentAgent?.id]);

  const filteredMacros = useMemo(() => {
    const q = macroSearch.replace(/^\/+/, '').toLowerCase().trim();
    if (!q) return workspaceMacros;
    return workspaceMacros.filter(
      (m) =>
        m.shortcut.toLowerCase().includes(q) ||
        m.title.toLowerCase().includes(q) ||
        m.content.toLowerCase().includes(q)
    );
  }, [workspaceMacros, macroSearch]);

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

  // A quote needs the message it points at. The id is all that is stored, so
  // resolve it from the thread already in memory rather than re-fetching.
  const messageById = useMemo(
    () => new Map(messages.map((m) => [m.id, m])),
    [messages]
  );

  const startReply = useCallback((msg: Message) => {
    setReplyTo(msg);
    setComposerMode('reply');
    // Focus last: the composer grows when the quote bar appears, and focusing
    // before that leaves the caret scrolled out of view.
    requestAnimationFrame(() => textareaRef.current?.focus());
  }, []);

  // Escape drops the quote first: the composer's other Escape behaviours
  // (closing pickers, deselecting) would otherwise swallow it.
  useEffect(() => {
    if (!replyTo) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setReplyTo(null);
      }
    }
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [replyTo]);

  const jumpToMessage = useCallback((id: string) => {
    const node = document.getElementById(`msg-${id}`);
    if (!node) return;
    node.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setHighlightedId(id);
    window.setTimeout(() => setHighlightedId((c) => (c === id ? null : c)), 1600);
  }, []);

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
          id={`msg-${msg.id}`}
          className="rounded-xl border border-amber-300/80 dark:border-amber-600/40 bg-amber-500/10 dark:bg-amber-950/40 px-4 py-3 group/note relative shadow-xs"
        >
          <div className="flex items-center justify-between gap-3 mb-1.5">
            <span className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-amber-800 dark:text-amber-200">
              <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              Internal note · {msg.agent?.name || 'Teammate'}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-amber-700/70 dark:text-amber-300/70 tabular-nums">
                {formatTime(msg.created_at)}
              </span>
              {msg.metadata?.is_edited && (
                <span className="text-[10px] text-amber-700/70 dark:text-amber-300/70 italic">(edited)</span>
              )}
              <button
                type="button"
                title="Edit note"
                onClick={() => startEditing(msg)}
                className="opacity-0 group-hover/note:opacity-100 text-amber-700/70 hover:text-amber-800 dark:text-amber-300/70 dark:hover:text-amber-200 transition-opacity p-0.5 cursor-pointer"
              >
                <Pencil className="w-3 h-3" />
              </button>
              <button
                type="button"
                title="Delete note"
                onClick={() => setDeleteConfirmMsg(msg)}
                className="opacity-0 group-hover/note:opacity-100 text-amber-700/70 hover:text-danger dark:text-amber-300/70 transition-opacity p-0.5 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
          {editingMessageId === msg.id ? (
            <div className="w-full pt-1">
              <textarea
                value={editingContent}
                onChange={(e) => setEditingContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSaveEdit(msg.id);
                  } else if (e.key === 'Escape') {
                    e.preventDefault();
                    cancelEditing();
                  }
                }}
                autoFocus
                rows={3}
                className="w-full rounded-lg bg-surface border border-amber-300/80 p-2 text-[13.5px] text-ink focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none"
                placeholder="Edit internal note..."
              />
              <div className="mt-1.5 flex items-center justify-between gap-2 text-[11px]">
                <span className="text-amber-700/80 dark:text-amber-300/80 text-[10px]">Esc to cancel • Enter to save</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={cancelEditing}
                    disabled={isSavingEdit}
                    className="px-2 py-0.5 rounded border border-line bg-surface text-ink-2 hover:bg-surface-2 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveEdit(msg.id)}
                    disabled={isSavingEdit || !editingContent.trim()}
                    className="px-2.5 py-0.5 rounded bg-amber-600 text-white font-medium hover:bg-amber-700 transition-colors flex items-center gap-1 shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    {isSavingEdit ? (
                      <>
                        <RotateCcw className="w-3 h-3 animate-spin" />
                        <span>Saving</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3 h-3" />
                        <span>Save</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-amber-950 dark:text-amber-100">
              {msg.content}
            </p>
          )}
          <p className="mt-2 text-[11px] text-amber-700/80 dark:text-amber-400/80 font-medium">
            🔒 Only visible to your team — never sent to the visitor.
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
        id={`msg-${msg.id}`}
        className={cn(
          'flex gap-2.5 scroll-mt-24 rounded-2xl transition-colors duration-500',
          isAgent ? 'justify-end' : 'justify-start',
          highlightedId === msg.id && 'bg-accent-soft/60'
        )}
      >
        {!isAgent && (
          <Avatar
            name={isAI ? 'AI' : displayName}
            seed={isAI ? 'zen-try-ai' : conversation.visitor_id}
            size="xs"
            className="mt-auto mb-1"
          />
        )}

        <div
          className={cn(
            'group/msg relative max-w-[min(560px,72%)]',
            isAgent && 'items-end'
          )}
        >
          {/* Quote the message being answered, so "yes, that's right" is never
              ambiguous about which of the last four questions it answers. */}
          {msg.reply_to_message_id && msg.sender_type !== 'ai' && (
            <QuotedMessage
              quoted={messageById.get(msg.reply_to_message_id) || null}
              visitorName={displayName}
              currentAgentId={currentAgent?.id}
              onJump={() => jumpToMessage(msg.reply_to_message_id!)}
              tone={isAgent ? 'out' : 'in'}
            />
          )}

          {/* Message Action Toolbar (Reply, Edit, Delete) */}
          <div
            className={cn(
              'absolute top-0 z-10 flex items-center gap-0.5 rounded-full border border-line bg-surface p-0.5 shadow-sm opacity-0 transition-opacity focus-within:opacity-100 group-hover/msg:opacity-100 backdrop-blur-sm',
              isAgent ? '-left-24' : '-right-9'
            )}
          >
            <button
              type="button"
              title="Reply to this message"
              aria-label="Reply to this message"
              onClick={() => startReply(msg)}
              className="w-6 h-6 grid place-items-center rounded-full text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
            >
              <CornerUpLeft className="w-3.5 h-3.5" />
            </button>
            {isAgent && (
              <>
                <button
                  type="button"
                  title="Edit message"
                  aria-label="Edit message"
                  onClick={() => startEditing(msg)}
                  className="w-6 h-6 grid place-items-center rounded-full text-ink-3 hover:text-accent hover:bg-surface-2 transition-colors cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  title="Delete message"
                  aria-label="Delete message"
                  onClick={() => setDeleteConfirmMsg(msg)}
                  className="w-6 h-6 grid place-items-center rounded-full text-ink-3 hover:text-danger hover:bg-surface-2 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>

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
                AI
              </span>
            )}
            {msg.attachment_url && (
              <div className="mb-2">
                {isImageAttachment(msg.attachment_url) ? (
                  <img
                    src={msg.attachment_url}
                    alt="Attachment"
                    onLoad={() => scrollToBottom(false)}
                    className="rounded-xl max-h-56 w-auto max-w-full object-cover cursor-pointer hover:opacity-90 transition-opacity border border-black/10 dark:border-white/10 shadow-xs"
                    onClick={() => setPreviewImageModalUrl(msg.attachment_url)}
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
            {editingMessageId === msg.id ? (
              <div className="w-full min-w-[240px] pt-1">
                <textarea
                  value={editingContent}
                  onChange={(e) => setEditingContent(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSaveEdit(msg.id);
                    } else if (e.key === 'Escape') {
                      e.preventDefault();
                      cancelEditing();
                    }
                  }}
                  autoFocus
                  rows={Math.min(6, Math.max(2, editingContent.split('\n').length))}
                  className="w-full rounded-lg bg-black/15 text-white placeholder-white/50 p-2 text-[13.5px] border border-white/20 focus:outline-none focus:ring-1 focus:ring-white/40 resize-none font-normal"
                  placeholder="Edit message..."
                />
                <div className="mt-1.5 flex items-center justify-between gap-2 text-[11px]">
                  <span className="text-white/70 text-[10px]">
                    Esc to cancel • Enter to save
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={cancelEditing}
                      disabled={isSavingEdit}
                      className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(msg.id)}
                      disabled={isSavingEdit || !editingContent.trim()}
                      className="px-2.5 py-0.5 rounded bg-white text-accent-strong font-medium hover:bg-white/90 transition-colors flex items-center gap-1 shadow-xs disabled:opacity-50 cursor-pointer"
                    >
                      {isSavingEdit ? (
                        <>
                          <RotateCcw className="w-3 h-3 animate-spin" />
                          <span>Saving</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Save</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : isAI ? (
              (() => {
                const aiEnglish =
                  msg.metadata?.english_translation ||
                  msg.metadata?.translation?.english_text ||
                  msg.content;
                const aiDelivered = msg.content;
                const deliveredLangCode =
                  msg.metadata?.delivered_language ||
                  msg.metadata?.translation?.target_language ||
                  msg.metadata?.target_language;
                const deliveredLangInfo = deliveredLangCode ? getLanguageInfo(deliveredLangCode) : null;
                const isAiForeign = Boolean(
                  (deliveredLangCode && deliveredLangCode !== 'en') ||
                  (aiEnglish && aiDelivered && aiEnglish.trim().toLowerCase() !== aiDelivered.trim().toLowerCase())
                );
                const isExpanded = expandedTranslations[msg.id];

                return (
                  <div className="space-y-1.5">
                    <ChatMarkdown content={isExpanded ? aiDelivered : aiEnglish} />
                    {isAiForeign && (
                      <div className="pt-1.5 border-t border-purple-500/20 flex items-center justify-between gap-2 text-[11px] select-none">
                        <span className="inline-flex items-center gap-1.5 font-bold px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 shadow-2xs">
                          <Globe className="w-3.5 h-3.5 shrink-0" />
                          {isExpanded
                            ? `Delivered to customer in ${deliveredLangInfo?.name || deliveredLangCode || 'Customer Language'}`
                            : `Delivered in ${deliveredLangInfo?.name || deliveredLangCode || 'Customer Language'}`}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedTranslations((prev) => ({
                              ...prev,
                              [msg.id]: !prev[msg.id],
                            }))
                          }
                          className="px-2 py-0.5 rounded-md bg-surface-2 border border-line-2 hover:border-purple-500 text-ink font-bold text-[11px] transition-all cursor-pointer ml-auto hover:text-purple-600"
                        >
                          {isExpanded ? 'Show English' : `View ${deliveredLangInfo?.name || 'Customer Language'}`}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()
            ) : isAgent ? (
              (() => {
                const translationMeta = msg.metadata?.translation;
                const englishText =
                  translationMeta?.english_text ||
                  translationMeta?.original_english ||
                  msg.metadata?.english_text ||
                  msg.metadata?.original_english;
                const translatedForeign =
                  translationMeta?.translated_text || msg.metadata?.translated_text;
                const originalInput =
                  translationMeta?.original_agent_input || msg.metadata?.original_agent_input;
                const targetCode =
                  translationMeta?.target_language || msg.metadata?.target_language;
                const targetLangInfo = targetCode ? getLanguageInfo(targetCode) : null;
                const isExpanded = expandedTranslations[msg.id];

                const wasActuallyTranslatedToForeign = Boolean(
                  translationMeta?.is_translated &&
                  targetCode &&
                  targetCode !== 'en' &&
                  translatedForeign &&
                  englishText &&
                  translatedForeign.trim().toLowerCase() !== (originalInput || englishText).trim().toLowerCase()
                );

                // If translation exists and was translated to customer's foreign language
                if (wasActuallyTranslatedToForeign) {
                  return (
                    <div className="space-y-2">
                      <p className="whitespace-pre-wrap leading-relaxed">
                        {isExpanded ? translatedForeign : englishText}
                      </p>
                      <div className="pt-2 border-t border-white/25 flex items-center justify-between gap-2 text-[11px] select-none">
                        <span className="inline-flex items-center gap-1.5 font-bold px-2 py-0.5 rounded-md bg-white/20 text-white border border-white/30 shadow-2xs">
                          <Globe className="w-3.5 h-3.5 shrink-0" />
                          {isExpanded
                            ? `Delivered to customer in ${targetLangInfo?.name || targetCode}`
                            : `Delivered in ${targetLangInfo?.name || targetCode}`}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedTranslations((prev) => ({
                              ...prev,
                              [msg.id]: !prev[msg.id],
                            }))
                          }
                          className="px-2 py-0.5 rounded-md bg-white/15 hover:bg-white/25 text-white font-bold text-[11px] underline transition-all cursor-pointer ml-auto"
                        >
                          {isExpanded ? 'Show English' : `View ${targetLangInfo?.name || 'Translation'}`}
                        </button>
                      </div>
                    </div>
                  );
                }

                // If agent typed in Urdu / Roman Urdu / etc. and customer received in English
                if (englishText && originalInput && originalInput !== englishText) {
                  return (
                    <div className="space-y-1.5">
                      <p className="whitespace-pre-wrap leading-relaxed">
                        {isExpanded ? originalInput : englishText}
                      </p>
                      <div className="pt-1.5 border-t border-white/20 flex items-center justify-between gap-2 text-[10.5px] opacity-90 select-none">
                        <span className="inline-flex items-center gap-1 font-medium">
                          <Globe className="w-3 h-3 shrink-0" />
                          {isExpanded ? 'Your original input' : 'English preview'}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedTranslations((prev) => ({
                              ...prev,
                              [msg.id]: !prev[msg.id],
                            }))
                          }
                          className="underline font-semibold hover:opacity-100 opacity-80 transition-opacity cursor-pointer ml-auto"
                        >
                          {isExpanded ? 'Show English' : 'Show my input'}
                        </button>
                      </div>
                    </div>
                  );
                }

                return englishText || msg.content;
              })()
            ) : (
              (() => {
                // Visitor message
                const translationMeta = msg.metadata?.translation;
                const englishText = translationMeta?.english_text || msg.metadata?.english_translation;
                const originalText = translationMeta?.original_text || msg.content;
                const detectedCode =
                  translationMeta?.detected_language ||
                  msg.metadata?.detected_language ||
                  (msg.content ? detectLanguage(msg.content).code : 'en');
                const isForeign = detectedCode !== 'en';
                const hasEnglishTranslation =
                  Boolean(englishText) &&
                  englishText.trim().toLowerCase() !== originalText.trim().toLowerCase();
                const langInfo = getLanguageInfo(detectedCode);
                const isExpanded = expandedTranslations[msg.id];

                if (isForeign || hasEnglishTranslation || translationMeta?.is_translated) {
                  return (
                    <div className="space-y-2">
                      {englishText ? (
                        <p className="whitespace-pre-wrap leading-relaxed font-normal">
                          {isExpanded ? originalText : englishText}
                        </p>
                      ) : (
                        <div>
                          <p className="whitespace-pre-wrap leading-relaxed">{originalText}</p>
                          <span className="inline-flex items-center gap-1.5 text-[11.5px] text-accent mt-1.5 font-bold animate-pulse px-2 py-0.5 rounded-md bg-accent/10 border border-accent/20">
                            <Globe className="w-3.5 h-3.5 shrink-0 animate-spin" />
                            Auto-translating to English...
                          </span>
                        </div>
                      )}

                      {englishText && (
                        <div className="mt-2 pt-2 border-t-2 border-line-2 flex items-center justify-between gap-2 text-[11.5px] select-none">
                          <span className="inline-flex items-center gap-1.5 font-bold px-2 py-0.5 rounded-md bg-accent/15 text-accent border border-accent/25">
                            <Globe className="w-3.5 h-3.5 text-accent shrink-0" />
                            {isExpanded
                              ? `Original (${langInfo.name})`
                              : `Auto-translated from ${langInfo.name}`}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedTranslations((prev) => ({
                                ...prev,
                                [msg.id]: !prev[msg.id],
                              }))
                            }
                            className="px-2.5 py-0.5 rounded-md bg-surface-2 border border-line-2 hover:border-accent text-ink font-bold text-[11px] transition-all cursor-pointer ml-auto shadow-2xs hover:text-accent"
                          >
                            {isExpanded ? 'Show English' : `Show Original (${langInfo.name})`}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                }

                return englishText || msg.content;
              })()
            )}
          </div>

          <div
            className={cn(
              'mt-1 flex items-center gap-1.5 px-1 text-[10.5px] text-ink-3',
              (isAgent || isAI) && 'justify-end'
            )}
          >
            {isAgent && (
              <span className="font-semibold text-ink-2">
                {msg.sender_id === currentAgent?.id
                  ? 'You'
                  : msg.agent?.name || agentsList.find((a) => a.id === msg.sender_id)?.name || 'Agent'}
                {' ·'}
              </span>
            )}
            <span className="tabular-nums">{formatTime(msg.created_at)}</span>
            {msg.metadata?.is_edited && (
              <span className="italic text-[10px] text-ink-3/70 ml-0.5">(edited)</span>
            )}
            {(isAgent || isAI) && (
              <MessageTicks
                status={messageStatusOf(msg)}
                readAt={msg.read_at}
              />
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

  const replyPreview = replyTo
    ? {
        who:
          replyTo.sender_type === 'agent'
            ? replyTo.sender_id === currentAgent?.id
              ? 'You'
              : replyTo.agent?.name || 'Agent'
            : replyTo.sender_type === 'ai'
            ? 'AI'
            : displayName,
        text: replyTo.content,
      }
    : null;

  return (
    <div className="@container/thread flex-1 min-w-0 h-screen flex flex-col bg-canvas overflow-x-hidden">
      {/* ── Header ── */}
      <header className="shrink-0 px-3 sm:px-4 py-2 min-h-16 flex items-center justify-between gap-2 border-b border-line bg-surface max-w-full overflow-hidden">
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
            {/* Line 1: customer name (truncated with ellipsis only after 24 characters) & channel */}
            <div className="flex items-center gap-2 min-w-0 overflow-hidden">
              <h2
                className="text-[14px] sm:text-[15px] font-bold tracking-tight text-ink shrink-0 truncate max-w-full"
                title={displayName}
              >
                {truncatedDisplayName}
              </h2>
              {conversation.channel && conversation.channel !== 'web' && (
                <ChannelBadge
                  channel={conversation.channel}
                  showLabel={false}
                  size="xs"
                />
              )}
            </div>

            {/* Line 2: status and sentiment badges, plus visitor details */}
            <div className="flex items-center gap-1.5 text-[11px] text-ink-3 min-w-0 overflow-hidden truncate mt-0.5">
              {/* Conversation status badge */}
              {(() => {
                const cur = STATUS_OPTIONS.find((s) => s.value === conversation.status) || STATUS_OPTIONS[0];
                return (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-surface-2 border border-line text-ink-2 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: cur.dot }} />
                    {cur.label}
                  </span>
                );
              })()}

              {/* Sentiment badge: Hide when confidence is low (< 0.7) */}
              {(conversation.sentiment === 'positive' ||
                conversation.sentiment === 'negative') &&
               (conversation.channel_metadata?.sentiment_confidence === undefined ||
                conversation.channel_metadata?.sentiment_confidence >= 0.7) && (
                <span
                  className={cn(
                    'pill shrink-0 text-[10px] py-0 px-1.5 h-4',
                    conversation.sentiment === 'positive'
                      ? 'pill-success'
                      : 'pill-danger'
                  )}
                  title={`Visitor tone: ${conversation.sentiment}${
                    conversation.channel_metadata?.sentiment_confidence
                      ? ` (${Math.round(conversation.channel_metadata.sentiment_confidence * 100)}% confidence)`
                      : ''
                  }`}
                >
                  {conversation.sentiment === 'positive' ? (
                    <Smile className="w-2.5 h-2.5" />
                  ) : (
                    <Frown className="w-2.5 h-2.5" />
                  )}
                  {conversation.sentiment === 'positive'
                    ? 'Positive'
                    : 'Frustrated'}
                </span>
              )}

              {/* Activity status */}
              {isOnline ? (
                <span className="inline-flex items-center gap-1 text-success font-medium shrink-0">
                  <span className="live-dot" />
                  Active now
                </span>
              ) : (
                <span className="shrink-0 truncate">
                  Active{' '}
                  {formatTimeAgo(visitor?.last_seen || conversation.updated_at)}
                </span>
              )}

              {visitorPlace.label && (
                <>
                  <span aria-hidden className="shrink-0 text-ink-3">
                    ·
                  </span>
                  <span className="inline-flex items-center gap-1 shrink-0 text-ink-2 font-medium" title={visitorPlace.label}>
                    <CountryFlag
                      flag={visitorPlace.flag}
                      countryCode={visitorPlace.countryCode}
                      className="w-3.5 h-2.5 shrink-0"
                    />
                    <span className="truncate max-w-[120px]">{visitorPlace.label}</span>
                  </span>
                </>
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

        {/* Actions strip in header: keep in one row without shifting or wrapping */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 ml-auto flex-nowrap">
          <Menu<ConversationStatus>
            value={conversation.status}
            options={STATUS_OPTIONS}
            label="Status"
            className="shrink-0"
            onChange={(v) => onUpdateStatus(v)}
            trigger={({ active, open }) => (
              <span
                className={cn(
                  'btn btn-sm btn-secondary gap-1.5 shrink-0 px-2 sm:px-2.5',
                  open && 'bg-surface-3'
                )}
                title={`Status: ${active?.label ?? ''}`}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: active?.dot }}
                />
                <span className="hidden @2xl/thread:inline">{active?.label}</span>
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
              className="btn btn-sm btn-primary shadow-xs shrink-0 px-2 sm:px-2.5"
              title="Close and resolve this conversation"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="hidden @2xl/thread:inline">Resolve</span>
            </button>
          ) : (
            <button
              onClick={() => onUpdateStatus('open')}
              className="btn btn-sm btn-secondary shadow-xs shrink-0 px-2 sm:px-2.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden @2xl/thread:inline">Reopen</span>
            </button>
          )}

          {/* More actions: AI Autopilot, Snooze, Merge, Auto-Assign */}
          <Menu<ThreadAction>
            value={"" as ThreadAction}
            label="More actions"
            className="shrink-0"
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
                label: "Merge with another conversation from this visitor",
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
                  "btn btn-sm btn-secondary w-8 h-8 px-0 flex items-center justify-center shrink-0",
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
                "btn btn-sm btn-secondary w-8 h-8 px-0 flex items-center justify-center shrink-0 transition-all",
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

      {/* ── Toolbar bar: wraps to two lines instead of scrolling horizontally ── */}
      <div className="shrink-0 px-3 sm:px-4 py-1.5 flex flex-wrap items-center gap-x-2 gap-y-1.5 border-b border-line bg-surface-2 min-h-[38px]">
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
        {onToggleAiMode && (() => {
          const isFullAutopilot = conversation.ai_mode === 'autopilot';
          const isWorkspaceFirstReplyOn = Boolean(
            workspace?.ai_settings?.enabled !== false &&
            (workspace?.ai_settings?.auto_response_enabled ?? true)
          );

          return (
            <button
              type="button"
              onClick={() =>
                onToggleAiMode(
                  isFullAutopilot ? 'disabled' : 'autopilot'
                )
              }
              className={cn(
                'pill shrink-0 transition-all cursor-pointer inline-flex items-center gap-1.5 text-[11px]',
                isFullAutopilot
                  ? 'pill-accent font-bold shadow-xs'
                  : isWorkspaceFirstReplyOn
                  ? 'bg-accent/15 text-accent border border-accent/30 font-medium'
                  : 'pill-neutral hover:bg-surface-3'
              )}
              title={
                isFullAutopilot
                  ? 'Full Autopilot is ON for this conversation (click to pause)'
                  : isWorkspaceFirstReplyOn
                  ? 'Workspace AI first reply is ON (click to turn on full Autopilot)'
                  : 'AI Autopilot is OFF (click to activate)'
              }
            >
              <Bot className={cn('w-3 h-3', isFullAutopilot || isWorkspaceFirstReplyOn ? 'text-accent' : 'text-ink-3')} />
              <span>
                {isFullAutopilot
                  ? 'Autopilot'
                  : isWorkspaceFirstReplyOn
                  ? 'AI first reply: on'
                  : 'Autopilot Off'}
              </span>
            </button>
          );
        })()}

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

          {showTagPicker &&
            typeof document !== 'undefined' &&
            createPortal(
              <div
                ref={tagMenuRef}
                style={{
                  position: 'fixed',
                  top: `${tagPickerCoords.top}px`,
                  left: `${tagPickerCoords.left}px`,
                  zIndex: 9999,
                }}
                className="w-56 p-2 rounded-xl border border-line bg-surface shadow-2xl animate-pop"
              >
                <div className="eyebrow px-1.5 pb-1.5">Tags</div>
                <div className="space-y-0.5 mb-2">
                  {PRESET_TAGS.map((pt) => {
                    const active = (conversation.tags || []).includes(pt);
                    return (
                      <button
                        key={pt}
                        onClick={() => handleToggleTag(pt)}
                        className={cn(
                          'w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-[12.5px] transition-colors cursor-pointer',
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
              </div>,
              document.body
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
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-5 py-5 space-y-3.5">
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
        {/* Floating Error Toast for Note Saving Failure */}
        {noteErrorToast && (
          <div
            role="alert"
            className="absolute bottom-[calc(100%+8px)] left-5 right-5 z-50 rounded-xl bg-danger text-white shadow-xl p-3 flex items-center justify-between gap-2.5 animate-pop"
          >
            <div className="flex items-center gap-2 min-w-0">
              <AlertTriangle className="w-4 h-4 shrink-0 text-white" />
              <span className="text-[12px] font-medium leading-snug">{noteErrorToast}</span>
            </div>
            <button
              type="button"
              onClick={() => setNoteErrorToast(null)}
              className="text-white/80 hover:text-white p-1 rounded-md hover:bg-white/20 transition-colors shrink-0 cursor-pointer"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {showMacros && (
          <div className="absolute bottom-[calc(100%-4px)] left-5 right-5 z-50 rounded-xl border border-line bg-surface shadow-xl p-2.5 animate-pop">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="eyebrow flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-accent" />
                Saved Quick Replies
              </span>
              <span className="text-[11px] text-ink-3">
                Type <span className="kbd font-mono">/</span> to open
              </span>
            </div>

            <input
              type="text"
              placeholder="Search replies by /shortcut or title…"
              value={macroSearch}
              onChange={(e) => setMacroSearch(e.target.value)}
              className="input input-sm mb-2 font-mono text-xs"
              autoFocus
            />

            <div className="max-h-56 overflow-y-auto space-y-0.5">
              {filteredMacros.length === 0 ? (
                <p className="py-4 text-center text-[12px] text-ink-3">
                  No matching replies. Add them in Settings &gt; Saved Quick Replies.
                </p>
              ) : (
                filteredMacros.map((macro) => (
                  <button
                    key={macro.shortcut}
                    type="button"
                    onClick={() => insertMacro(macro)}
                    className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-surface-3 transition-colors group cursor-pointer"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-[12.5px] font-semibold font-mono text-accent group-hover:text-accent-hover transition-colors">
                        /{macro.shortcut}
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

        {/* Suggested replies from the configured model provider */}
        {suggestedReplies.length > 0 && (
          <div className="mb-3 p-2.5 rounded-xl bg-accent-soft/40 border border-accent-line flex flex-col gap-1.5 animate-rise">
            <div className="flex items-center justify-between text-[11px] text-accent font-semibold px-0.5">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Suggested replies (click to insert):
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
            'rounded-2xl border transition-all duration-200 shadow-xs focus-within:shadow-md relative bg-surface',
            isInternalMode
              ? 'bg-amber-500/5 border-amber-500/40 focus-within:border-amber-500/80 focus-within:ring-2 focus-within:ring-amber-500/20'
              : 'bg-surface border-line focus-within:border-accent/80 focus-within:ring-2 focus-within:ring-accent/20'
          )}
        >
          {/* Replying to — kept above the toolbar so the message being
              answered stays in view while the answer is written. */}
          {replyPreview && !isInternalMode && (
            <div className="flex items-start gap-2 px-3 pt-2.5 pb-2 border-b border-line/40 bg-accent-soft/30 rounded-t-2xl">
              <span className="mt-0.5 w-0.5 self-stretch rounded-full bg-accent shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-accent">
                  Replying to {replyPreview.who}
                </p>
                <p className="text-[12px] text-ink-2 truncate">
                  {replyPreview.text}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                title="Cancel reply"
                aria-label="Cancel reply"
                className="shrink-0 w-6 h-6 grid place-items-center rounded-md text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Composer Header Bar */}
          <div
            className={cn(
              'px-3 pt-2 pb-1.5 flex items-center justify-between gap-2 border-b border-line/40 bg-surface-2/30',
              !replyPreview && 'rounded-t-2xl'
            )}
          >
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

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleGenerateAiSuggestion}
                disabled={aiDrafting}
                className="h-6 px-2 rounded-md text-[11px] font-semibold text-accent hover:bg-accent/10 transition-colors inline-flex items-center gap-1 cursor-pointer"
                title="Ask AI Copilot to draft a reply"
              >
                <Sparkles className={cn('w-3 h-3', aiDrafting && 'animate-spin')} />
                <span>{aiDrafting ? 'Drafting…' : 'AI Copilot'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowMacros((s) => !s)}
                className="h-6 px-2 rounded-md text-[11px] font-medium text-ink-3 hover:text-ink hover:bg-surface-3 transition-colors inline-flex items-center gap-1 cursor-pointer"
                title="Saved replies (/)"
              >
                <Zap className="w-3 h-3 text-amber-500" />
                <span>Replies</span>
              </button>

              {/* ── Translation Controls (Side Badge & Safe Popover) ── */}
              {composerMode === 'reply' && (
                <div className="relative" ref={translateMenuRef}>
                  <button
                    type="button"
                    onClick={() => setShowTranslateMenu((prev) => !prev)}
                    className={cn(
                      'h-6 px-2 rounded-md text-[11px] font-medium transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-2xs',
                      autoTranslateEnabled && targetLanguage !== 'en'
                        ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 hover:bg-blue-500/25 font-bold'
                        : 'text-ink-3 hover:text-ink hover:bg-surface-3 border border-transparent'
                    )}
                    title={`Translation settings: Customer receives replies in ${getLanguageInfo(targetLanguage).name}. Click to view or change.`}
                  >
                    <Globe className={cn('w-3 h-3 shrink-0', autoTranslateEnabled && targetLanguage !== 'en' ? 'text-blue-500' : 'text-ink-3')} />
                    <span className="truncate max-w-[120px]">
                      {autoTranslateEnabled && targetLanguage !== 'en'
                        ? `${getLanguageInfo(targetLanguage).flag || ''} ${getLanguageInfo(targetLanguage).name}`
                        : 'Translate'}
                    </span>
                    <ChevronDown className="w-2.5 h-2.5 opacity-60 shrink-0" />
                  </button>

                  {/* Popover Dropdown Menu */}
                  {showTranslateMenu && (
                    <div className="absolute right-0 bottom-full mb-2 z-50 w-80 max-h-[min(520px,calc(100vh-140px))] overflow-y-auto overscroll-contain bg-surface rounded-2xl border border-line shadow-2xl p-3.5 space-y-3 animate-pop focus:outline-none">
                      <div className="sticky -top-3.5 -mx-3.5 -mt-3.5 px-3.5 pt-3 pb-2.5 bg-surface/95 backdrop-blur-md border-b border-line/60 flex items-center justify-between z-10 rounded-t-2xl">
                        <div className="flex items-center gap-1.5 text-[12px] font-bold text-ink">
                          <Globe className="w-3.5 h-3.5 text-blue-500" />
                          <span>Translation Settings</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowTranslateMenu(false)}
                          className="text-ink-3 hover:text-ink p-1 rounded-md hover:bg-surface-2 transition-colors cursor-pointer"
                          title="Close settings"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Customer Native Language Status */}
                      <div className="bg-surface-2/70 rounded-lg p-2.5 space-y-2 border border-line/40">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-ink-3 font-medium">Customer speaks:</span>
                          <span className="font-bold text-ink flex items-center gap-1">
                            <span>{getLanguageInfo(detectedVisitorLang).flag}</span>
                            <span>{getLanguageInfo(detectedVisitorLang).name}</span>
                            {getLanguageInfo(detectedVisitorLang).nativeName && (
                              <span className="text-ink-3 font-normal">({getLanguageInfo(detectedVisitorLang).nativeName})</span>
                            )}
                          </span>
                        </div>

                        {/* Reset / Lock to Customer Language Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setTargetLanguage(detectedVisitorLang);
                            setAutoTranslateEnabled(detectedVisitorLang !== 'en');
                          }}
                          className="w-full py-1.5 px-2.5 rounded-lg text-[11px] font-semibold bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <RotateCcw className="w-3 h-3 shrink-0" />
                          <span>Auto-lock to Customer ({getLanguageInfo(detectedVisitorLang).name})</span>
                        </button>
                      </div>

                      {/* Manual Override Dropdown */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <label className="font-semibold text-ink">
                            Customer Receives Replies In:
                          </label>
                          {targetLanguage !== detectedVisitorLang && (
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded">
                              Custom Override
                            </span>
                          )}
                        </div>
                        <select
                          value={targetLanguage}
                          onChange={async (e) => {
                            const newLang = e.target.value;
                            setTargetLanguage(newLang);
                            if (newLang !== 'en') {
                              setAutoTranslateEnabled(true);
                            } else {
                              setAutoTranslateEnabled(false);
                            }
                            try {
                              const supabase = createClient();
                              const langInfo = getLanguageInfo(newLang);
                              await supabase
                                .from('conversations')
                                .update({
                                  channel_metadata: {
                                    ...((conversation.channel_metadata as any) || {}),
                                    visitor_language: newLang,
                                    language_name: langInfo.name,
                                  },
                                })
                                .eq('id', conversation.id);
                            } catch (err) {
                              console.warn('Failed to update conversation language preference:', err);
                            }
                          }}
                          aria-label="Select Customer Language"
                          className="w-full text-[11.5px] font-semibold bg-surface border border-line-2 rounded-lg px-2.5 py-1.5 text-ink focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer shadow-2xs"
                        >
                          <option value="en">🇬🇧 English (Original / No Translation)</option>
                          {Object.values(SUPPORTED_LANGUAGES)
                            .filter((l) => l.code !== 'en')
                            .sort((a, b) => a.name.localeCompare(b.name))
                            .map((l) => (
                              <option key={l.code} value={l.code}>
                                {l.flag || '🌐'} {l.name} {l.nativeName && l.nativeName !== l.name ? `(${l.nativeName})` : ''}
                              </option>
                            ))}
                        </select>
                      </div>

                      {/* On / Off Toggle */}
                      <div className="pt-2 border-t border-line/60 flex items-center justify-between">
                        <div className="space-y-0.5">
                          <p className="text-[11px] font-bold text-ink">Auto-Translation</p>
                          <p className="text-[10px] text-ink-3">Translate agent replies automatically</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setAutoTranslateEnabled(!autoTranslateEnabled)}
                          className={cn(
                            'text-[10.5px] px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer shadow-2xs',
                            autoTranslateEnabled
                              ? 'bg-blue-600 hover:bg-blue-700 text-white'
                              : 'bg-surface-2 hover:bg-surface-3 text-ink-2 border border-line'
                          )}
                        >
                          {autoTranslateEnabled ? 'Enabled (ON)' : 'Disabled (OFF)'}
                        </button>
                      </div>

                      <div className="text-[10px] text-ink-3 bg-surface-2/40 p-2 rounded-lg border border-line/30 leading-snug">
                        ✨ <strong>Workflow:</strong> Write in English or any language. The customer receives your reply in {getLanguageInfo(targetLanguage).name}. Customer replies will always appear in English for you.
                      </div>
                    </div>
                  )}
                </div>
              )}

              <span className="text-[10.5px] text-ink-3 hidden @3xl/thread:inline shrink-0 truncate max-w-[120px] ml-1">
                as <strong className="text-ink font-medium">{currentAgent?.name || 'Agent'}</strong>
              </span>
            </div>
          </div>

          {/* Hidden File Inputs for Attachments */}
          <input
            type="file"
            ref={imageInputRef}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleSelectFile(file);
            }}
            className="hidden"
            accept="image/*"
          />
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleSelectFile(file);
            }}
            className="hidden"
            accept="image/*,.pdf,.txt"
          />

          {/* Pending Attachment Preview Banner */}
          {pendingAttachment && (
            <div className="flex items-center gap-2.5 px-3 py-2 border-b border-line/60 bg-surface-2/60 animate-rise">
              {pendingAttachment.isImage && pendingAttachment.previewUrl ? (
                <img
                  src={pendingAttachment.previewUrl}
                  alt="Preview"
                  className="w-10 h-10 rounded-lg object-cover border border-line shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-semibold text-ink truncate">
                  {pendingAttachment.file.name}
                </p>
                <p className="text-[10.5px] text-ink-3">
                  {(pendingAttachment.file.size / 1024).toFixed(0)} KB · Ready to send via Cloudinary
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (pendingAttachment.previewUrl) URL.revokeObjectURL(pendingAttachment.previewUrl);
                  setPendingAttachment(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                  if (imageInputRef.current) imageInputRef.current.value = '';
                }}
                className="p-1 rounded-md text-ink-3 hover:text-ink hover:bg-surface-3 transition-colors cursor-pointer"
                title="Remove attachment"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {replyLocked && (
            <div className="px-3 py-2 flex items-center gap-2 border-b border-line/40 bg-accent/10 text-[11.5px] text-ink">
              <Bot className="w-3.5 h-3.5 text-accent shrink-0" />
              <span className="flex-1 min-w-0">
                AI assistant is replying to this conversation. Take over to reply yourself, or leave a note.
              </span>
              {onToggleAiMode && (
                <button
                  type="button"
                  onClick={() => onToggleAiMode('disabled')}
                  className="h-6 px-2.5 rounded-md text-[11px] font-bold bg-accent hover:bg-accent-hover text-accent-ink shrink-0 cursor-pointer"
                >
                  Take over
                </button>
              )}
            </div>
          )}

          {/* Textarea */}
          <div className="p-3">
            <textarea
              ref={textareaRef}
              rows={3}
              disabled={replyLocked}
              value={inputText}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder={
                isInternalMode
                  ? 'Write an internal note for your team (visitor will not see this)…'
                  : replyLocked
                  ? 'AI autopilot is on — take over to reply'
                  : pendingAttachment
                  ? 'Add a caption for this picture (optional)…'
                  : `Reply to ${displayName}…`
              }
              className="w-full bg-transparent text-[13px] leading-relaxed text-ink resize-none focus:outline-none placeholder:text-ink-3 min-h-[66px] max-h-[220px] overflow-y-auto"
            />
          </div>

          {/* A send that fails must say so. The draft is restored above, but
              without this the agent only saw their text reappear and assumed
              the message had gone out. */}
          {sendError && (
            <div
              role="alert"
              className="px-3 py-2 flex items-center gap-2 border-t border-danger-line bg-danger-soft text-[11.5px] text-danger"
            >
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span className="flex-1 min-w-0">{sendError}</span>
              <button
                onClick={handleSend}
                className="font-semibold underline underline-offset-2 hover:opacity-80 shrink-0"
              >
                Retry
              </button>
              <button
                onClick={() => setSendError(null)}
                aria-label="Dismiss"
                className="opacity-60 hover:opacity-100 shrink-0"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* WhatsApp Style Emoji Picker Popover */}
          {showEmojiPicker && (
            <div className="p-2.5 bg-surface border-t border-line flex flex-col gap-2 shadow-lg max-h-64 animate-in fade-in duration-150">
              {/* Search */}
              <input
                type="text"
                value={emojiSearchQuery}
                onChange={(e) => setEmojiSearchQuery(e.target.value)}
                placeholder="Search emojis..."
                className="w-full px-2.5 py-1 text-[12px] rounded-lg border border-line bg-surface-2 focus:outline-none focus:ring-1 focus:ring-accent"
              />
              {/* Category tabs */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-line">
                {EMOJI_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setActiveEmojiCategory(cat.id);
                      setEmojiSearchQuery('');
                    }}
                    title={cat.name}
                    className={cn(
                      'p-1 text-sm rounded-md transition-colors cursor-pointer',
                      activeEmojiCategory === cat.id && !emojiSearchQuery
                        ? 'bg-surface-3'
                        : 'hover:bg-surface-2'
                    )}
                  >
                    {cat.icon}
                  </button>
                ))}
              </div>
              {/* Emojis Grid */}
              <div className="grid grid-cols-10 sm:grid-cols-12 gap-1 max-h-36 overflow-y-auto pr-1">
                {(emojiSearchQuery
                  ? ALL_EMOJIS
                  : EMOJI_CATEGORIES.find((c) => c.id === activeEmojiCategory)?.emojis || EMOJI_CATEGORIES[0].emojis
                ).map((emoji, idx) => (
                  <button
                    key={`${emoji}-${idx}`}
                    type="button"
                    onClick={() => handleInsertEmoji(emoji)}
                    className="text-lg hover:scale-125 transition-transform p-1 rounded hover:bg-surface-2 flex items-center justify-center leading-none cursor-pointer"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Composer Footer Action Bar */}
          <div className="px-3 py-2 bg-surface-2/40 border-t border-line/40 flex items-center justify-between text-[11px] text-ink-3 rounded-b-2xl">
            <div className="flex items-center gap-1.5 flex-wrap">
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

              <div className="flex items-center gap-1 ml-1.5 border-l border-line/50 pl-2">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker((prev) => !prev)}
                  disabled={isSending}
                  className={cn(
                    'h-6 px-2 rounded-md text-[11px] font-medium transition-colors inline-flex items-center gap-1 cursor-pointer',
                    showEmojiPicker
                      ? 'text-accent bg-accent/15'
                      : 'text-ink-3 hover:text-accent hover:bg-accent/10'
                  )}
                  title="Insert emoji (WhatsApp style)"
                >
                  <Smile className="w-3.5 h-3.5" />
                  <span>Emoji</span>
                </button>
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={isSending}
                  className="h-6 px-2 rounded-md text-[11px] font-medium text-ink-3 hover:text-accent hover:bg-accent/10 transition-colors inline-flex items-center gap-1 cursor-pointer"
                  title="Attach photo/image (Cloudinary)"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-accent" />
                  <span>Photo</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSending}
                  className="h-6 px-1.5 rounded-md text-[11px] font-medium text-ink-3 hover:text-ink hover:bg-surface-3 transition-colors inline-flex items-center gap-1 cursor-pointer"
                  title="Attach document/file"
                >
                  <Paperclip className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!isInternalMode && autoTranslateEnabled && targetLanguage !== 'en' && (
                <button
                  ref={bottomTranslateBtnRef}
                  type="button"
                  onClick={() => setShowTranslateMenu((prev) => !prev)}
                  className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 hover:bg-blue-500/15 border border-blue-500/25 px-2 py-1 rounded-md cursor-pointer transition-colors shadow-2xs"
                  title="Click to view or change translation settings"
                >
                  <Globe className="w-3 h-3 shrink-0" />
                  <span>→ {getLanguageInfo(targetLanguage).flag || ''} {getLanguageInfo(targetLanguage).name}</span>
                </button>
              )}

              <button
                onClick={handleSend}
                disabled={(!inputText.trim() && !pendingAttachment) || isSending || isTranslating || replyLocked}
                title={
                  isInternalMode
                    ? 'Post internal note (Ctrl+Enter)'
                    : autoTranslateEnabled && targetLanguage !== 'en'
                    ? `Translate into ${getLanguageInfo(targetLanguage).name} and send (Ctrl+Enter)`
                    : 'Send reply (Ctrl+Enter)'
                }
                className={cn(
                  'h-7 px-3 rounded-lg flex items-center gap-1.5 text-[11.5px] font-bold transition-all shadow-xs cursor-pointer',
                  (!inputText.trim() && !pendingAttachment) || isSending || isTranslating || replyLocked
                    ? 'bg-surface-3 text-ink-3 cursor-not-allowed opacity-50'
                    : isInternalMode
                    ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm hover:scale-102'
                    : autoTranslateEnabled && targetLanguage !== 'en'
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:scale-102'
                    : 'bg-accent hover:bg-accent-hover text-accent-ink shadow-sm hover:scale-102'
                )}
              >
                {isTranslating ? (
                  <>
                    <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>Translating…</span>
                  </>
                ) : isSending ? (
                  <>
                    <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>Sending…</span>
                  </>
                ) : isInternalMode ? (
                  <>
                    <Lock className="w-3 h-3" />
                    <span>Add Note</span>
                  </>
                ) : autoTranslateEnabled && targetLanguage !== 'en' ? (
                  <>
                    <Globe className="w-3 h-3" />
                    <span>Translate &amp; Send</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3 h-3" />
                    <span>Send</span>
                  </>
                )}
              </button>
            </div>
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

      {/* ── Image Lightbox Modal ── */}
      {previewImageModalUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setPreviewImageModalUrl(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setPreviewImageModalUrl(null)}
              className="absolute -top-10 right-0 text-white hover:text-slate-300 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
              title="Close image"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewImageModalUrl}
              alt="Enlarged attachment"
              className="max-h-[80vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl border border-white/10"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="mt-3 text-center">
              <a
                href={previewImageModalUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-xs text-blue-300 hover:text-blue-200 hover:underline inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 transition-colors"
              >
                <span>Open original in new tab</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Message Confirmation Modal ── */}
      {deleteConfirmMsg && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => !isDeleting && setDeleteConfirmMsg(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-line bg-surface p-5 shadow-2xl animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-danger mb-3">
              <div className="w-10 h-10 rounded-full bg-danger/10 grid place-items-center shrink-0">
                <Trash2 className="w-5 h-5 text-danger" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-ink">Delete message?</h3>
                <p className="text-xs text-ink-3 mt-0.5">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-ink-2 mb-3">
              Are you sure you want to delete this message? It will be removed for everyone in this conversation:
            </p>

            <div className="p-3 rounded-xl bg-surface-2 border border-line mb-5 text-xs text-ink-2 max-h-24 overflow-y-auto italic">
              &ldquo;{deleteConfirmMsg.content || (deleteConfirmMsg.attachment_url ? 'Attachment file' : 'Message')}&rdquo;
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteConfirmMsg(null)}
                disabled={isDeleting}
                className="px-3.5 py-1.5 rounded-xl border border-line bg-surface text-xs font-medium text-ink hover:bg-surface-2 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-1.5 rounded-xl bg-danger text-white text-xs font-medium hover:bg-danger/90 transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete for everyone</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * The message a reply is answering, shown above it.
 *
 * A deleted original leaves the reply intact but unquotable — say so rather
 * than render an empty bar, which reads like a rendering bug.
 */
function QuotedMessage({
  quoted,
  visitorName,
  currentAgentId,
  onJump,
  tone,
}: {
  quoted: Message | null;
  visitorName: string;
  currentAgentId?: string;
  onJump: () => void;
  tone: 'in' | 'out';
}) {
  const who = !quoted
    ? ''
    : quoted.sender_type === 'agent'
    ? quoted.sender_id === currentAgentId
      ? 'You'
      : quoted.agent?.name || 'Agent'
    : quoted.sender_type === 'ai'
    ? 'AI'
    : visitorName;

  return (
    <button
      type="button"
      onClick={quoted ? onJump : undefined}
      disabled={!quoted}
      className={cn(
        'mb-1 w-full flex items-stretch gap-2 rounded-xl border px-2.5 py-1.5 text-left transition-colors',
        tone === 'out'
          ? 'border-line/60 bg-surface-2/70'
          : 'border-line/60 bg-surface-2/50',
        quoted ? 'hover:bg-surface-3/60 cursor-pointer' : 'cursor-default'
      )}
    >
      <span
        className={cn(
          'w-0.5 rounded-full shrink-0',
          quoted ? 'bg-accent' : 'bg-line'
        )}
      />
      <span className="min-w-0 flex-1">
        {quoted ? (
          <>
            <span className="block text-[10.5px] font-semibold text-accent">
              {who}
            </span>
            <span className="block text-[12px] text-ink-2 line-clamp-2">
              {quoted.content}
            </span>
          </>
        ) : (
          <span className="block text-[12px] italic text-ink-3">
            Original message deleted
          </span>
        )}
      </span>
    </button>
  );
}
