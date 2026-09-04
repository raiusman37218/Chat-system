'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  MessageCircle,
  X,
  Send,
  Paperclip,
  Smile,
  Check,
  CheckCheck,
  Image as ImageIcon,
  FileText,
  Clock,
  Sparkles,
  BookOpen,
  Search,
  ChevronLeft,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Message } from '@/types/database';
import { getWorkspaceHelpCenterUrl } from '@/lib/domain';

export interface WidgetConfig {
  brandColor?: string;
  position?: 'bottom-right' | 'bottom-left';
  logoUrl?: string;
  companyName?: string;
  welcomeText?: string;
  autoGreetingDelaySeconds?: number;
  autoGreetingText?: string;
  workspaceId?: string;
  helpTabLabel?: string;
  showHelpTab?: boolean;
}

interface ChatWidgetProps {
  config?: WidgetConfig;
  mode?: 'full' | 'window-only';
  onClose?: () => void;
  onUnreadChange?: (count: number) => void;
  onOpenStateChange?: (isOpen: boolean) => void;
}

const POPULAR_EMOJIS = [
  '👋', '😊', '👍', '❤️', '🔥', '🎉', '🚀', '🙌',
  '💡', '✨', '🙏', '💯', '🤔', '👀', '😎', '🤝',
  '😍', '⭐', '⚡', '💻', '📞', '📩', '✅', '❌',
];

export default function ChatWidget({
  config = {},
  mode = 'full',
  onClose,
  onUnreadChange,
  onOpenStateChange,
}: ChatWidgetProps) {
  // 1. Theme and Configuration
  const brandColor = config.brandColor || '#2563EB';
  const [widgetPosition, setWidgetPosition] = useState<'bottom-right' | 'bottom-left'>(
    config.position || 'bottom-right'
  );
  const companyName = config.companyName || 'Chatify Support';
  const welcomeText = config.welcomeText || 'Hi there! 👋 How can we help you today?';
  const autoGreetingDelay = config.autoGreetingDelaySeconds ?? 5;
  const autoGreetingText = config.autoGreetingText || welcomeText;

  // 2. Component State
  const [isOpen, setIsOpen] = useState(mode === 'window-only');
  const [visitorName, setVisitorName] = useState('');
  const [visitorEmail, setVisitorEmail] = useState('');
  const [isIdentified, setIsIdentified] = useState(false);
  const [isAgentOnline, setIsAgentOnline] = useState<boolean | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputContent, setInputContent] = useState('');
  const [isAgentTyping, setIsAgentTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasNewMessagePulse, setHasNewMessagePulse] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isOfflineSubmitted, setIsOfflineSubmitted] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [visitorId, setVisitorId] = useState<string>('');

  // Help Desk state
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [helpArticles, setHelpArticles] = useState<any[]>([]);
  const [helpSearch, setHelpSearch] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<any | null>(null);
  const [articleVoted, setArticleVoted] = useState<Record<string, boolean>>({});
  const [helpTabLabel, setHelpTabLabel] = useState(config.helpTabLabel || 'Help');
  const [showHelpTab, setShowHelpTab] = useState(config.showHelpTab !== false);
  const [helpCenterPortalUrl, setHelpCenterPortalUrl] = useState<string>(
    config.workspaceId ? `/help/${config.workspaceId}` : '/help'
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const supabase = useMemo(() => createClient(), []);

  // Fetch published articles & workspace settings for widget's help desk
  useEffect(() => {
    if (!config.workspaceId) return;
    async function loadWorkspaceAndArticles() {
      try {
        const [{ data: wsData }, { data: articlesData }] = await Promise.all([
          supabase
            .from('workspaces')
            .select('id, slug, custom_domain, custom_domain_status, website_url, help_center_tab_label, show_help_tab, widget_position')
            .eq('id', config.workspaceId)
            .maybeSingle(),
          supabase
            .from('articles')
            .select('id, title, summary, content, category, section:help_sections(name, icon)')
            .eq('workspace_id', config.workspaceId)
            .eq('status', 'published')
            .order('created_at', { ascending: false }),
        ]);

        if (wsData) {
          if (wsData.help_center_tab_label) setHelpTabLabel(wsData.help_center_tab_label);
          if (typeof wsData.show_help_tab === 'boolean') setShowHelpTab(wsData.show_help_tab);
          if (wsData.widget_position) {
            setWidgetPosition(wsData.widget_position === 'left' ? 'bottom-left' : 'bottom-right');
          }
          const resolvedUrl = getWorkspaceHelpCenterUrl(wsData as any);
          setHelpCenterPortalUrl(resolvedUrl);
        }
        if (articlesData) setHelpArticles(articlesData);
      } catch (err) {
        console.warn('Failed to load help tab config in widget:', err);
      }
    }
    loadWorkspaceAndArticles();
  }, [config.workspaceId, supabase]);

  // 3. Initialize Visitor Identity
  useEffect(() => {
    let vid = '';
    try {
      vid = localStorage.getItem('chatify_vid') || '';
      if (!vid) {
        vid = crypto.randomUUID();
        localStorage.setItem('chatify_vid', vid);
      }
      setVisitorId(vid);

      const savedName = localStorage.getItem('chatify_visitor_name') || '';
      const savedEmail = localStorage.getItem('chatify_visitor_email') || '';
      if (savedName && savedEmail) {
        setVisitorName(savedName);
        setVisitorEmail(savedEmail);
        setIsIdentified(true);
      }
    } catch (e) {
      vid = 'v_' + Math.random().toString(36).slice(2, 9);
      setVisitorId(vid);
    }
  }, []);

  // 4. Check Agent Online Status
  useEffect(() => {
    async function checkAgentStatus() {
      const { data: agents } = await supabase
        .from('agents')
        .select('id, status');

      if (agents && agents.length > 0) {
        const hasOnline = agents.some((a: any) => a.status === 'online');
        setIsAgentOnline(hasOnline);
      } else {
        setIsAgentOnline(false);
      }
    }

    checkAgentStatus();

    // Listen for agent status changes in real time
    const agentChannel = supabase
      .channel('public-agent-status')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'agents' },
        () => {
          checkAgentStatus();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(agentChannel);
    };
  }, [supabase]);

  // 5. Auto-Greeting Trigger
  useEffect(() => {
    if (autoGreetingDelay <= 0) return;

    const timer = setTimeout(() => {
      setMessages((prev) => {
        if (prev.length === 0) {
          if (!isOpen) {
            setUnreadCount((c) => {
              const next = c + 1;
              onUnreadChange?.(next);
              return next;
            });
            setHasNewMessagePulse(true);
          }
          return [
            {
              id: 'auto-greeting',
              conversation_id: conversationId || 'temp',
              sender_type: 'agent',
              sender_id: null,
              content: autoGreetingText,
              attachment_url: null,
              created_at: new Date().toISOString(),
              read_at: null,
            },
          ];
        }
        return prev;
      });
    }, autoGreetingDelay * 1000);

    return () => clearTimeout(timer);
  }, [autoGreetingDelay, autoGreetingText, isOpen, conversationId, onUnreadChange]);

  // 6. Connect or Fetch Active Conversation
  useEffect(() => {
    if (!visitorId) return;

    async function loadConversation() {
      const { data: conv } = await supabase
        .from('conversations')
        .select('id, status')
        .eq('visitor_id', visitorId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (conv) {
        setConversationId(conv.id);

        const { data: msgs } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conv.id)
          .or('is_internal.is.null,is_internal.eq.false')
          .order('created_at', { ascending: true });

        if (msgs) {
          setMessages(msgs);
        }
      }
    }

    loadConversation();
  }, [visitorId, supabase]);

  // 7. Supabase Realtime Message & Typing Presence Subscription
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase.channel(`chatify-widget-${conversationId}`);

    // Listen for new messages
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        const newMsg = payload.new as Message;
        if (newMsg.is_internal) return; // Drop internal team notes

        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });

        if (newMsg.sender_type !== 'visitor' && !isOpen) {
          setUnreadCount((c) => {
            const next = c + 1;
            onUnreadChange?.(next);
            return next;
          });
          setHasNewMessagePulse(true);
        }
      }
    );

    // Listen for agent typing broadcast
    (channel as any).on(
      'broadcast',
      { event: 'typing' },
      (payload: any) => {
        if (payload?.payload?.sender === 'agent') {
          setIsAgentTyping(payload.payload.isTyping);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          if (payload.payload.isTyping) {
            typingTimeoutRef.current = setTimeout(() => {
              setIsAgentTyping(false);
            }, 3500);
          }
        }
      }
    );

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, isOpen, supabase, onUnreadChange]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAgentTyping]);

  // Handle open/close toggle
  const toggleWidget = (openState?: boolean) => {
    const nextState = openState !== undefined ? openState : !isOpen;
    setIsOpen(nextState);
    onOpenStateChange?.(nextState);

    if (nextState) {
      setUnreadCount(0);
      setHasNewMessagePulse(false);
      onUnreadChange?.(0);
    }
  };

  // Broadcast visitor typing
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputContent(e.target.value);

    if (conversationId) {
      supabase.channel(`chatify-widget-${conversationId}`).send({
        type: 'broadcast',
        event: 'typing',
        payload: { isTyping: e.target.value.length > 0, sender: 'visitor' },
      });
    }
  };

  // Pre-chat Form Submission
  const handlePreChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorName.trim() || !visitorEmail.trim()) return;

    try {
      localStorage.setItem('chatify_visitor_name', visitorName);
      localStorage.setItem('chatify_visitor_email', visitorEmail);
    } catch (err) {}

    setIsIdentified(true);

    // Sync visitor info to database
    supabase.from('visitors').upsert({
      id: visitorId,
      name: visitorName,
      email: visitorEmail,
      last_seen_at: new Date().toISOString(),
      is_online: true,
    });
  };

  // Create Conversation if not exists
  const ensureConversation = async (): Promise<string> => {
    if (conversationId) return conversationId;

    const { data: newConv, error } = await supabase
      .from('conversations')
      .insert({
        visitor_id: visitorId,
        status: 'open',
        priority: 'normal',
      })
      .select()
      .single();

    if (error || !newConv) {
      throw new Error('Failed to create conversation');
    }

    setConversationId(newConv.id);
    return newConv.id;
  };

  // Send Message
  const handleSendMessage = async (attachmentUrl?: string) => {
    const text = inputContent.trim();
    if (!text && !attachmentUrl) return;

    setInputContent('');
    setShowEmojiPicker(false);

    try {
      const activeConvId = await ensureConversation();

      // Optimistic message update
      const tempId = 'temp-' + Date.now();
      const optimisticMsg: Message = {
        id: tempId,
        conversation_id: activeConvId,
        sender_type: 'visitor',
        sender_id: null,
        content: text,
        attachment_url: attachmentUrl || null,
        created_at: new Date().toISOString(),
        read_at: null,
      };

      setMessages((prev) => [...prev, optimisticMsg]);

      // Insert to Supabase
      const { data: savedMsg, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: activeConvId,
          sender_type: 'visitor',
          content: text || 'Sent an attachment',
          attachment_url: attachmentUrl || null,
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to send message:', error);
      } else if (savedMsg) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? savedMsg : m))
        );
      }
    } catch (err) {
      console.error('[ChatWidget] Error dispatching message:', err);
    }
  };

  // File Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Upload failed');
      }

      const data = await res.json();
      await handleSendMessage(data.url);
    } catch (err: any) {
      alert(`Upload error: ${err.message}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Offline Form Submission
  const handleOfflineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorEmail.trim() || !inputContent.trim()) return;

    try {
      const activeConvId = await ensureConversation();
      await supabase.from('messages').insert({
        conversation_id: activeConvId,
        sender_type: 'visitor',
        content: `[Offline Message] ${inputContent.trim()}`,
      });

      setIsOfflineSubmitted(true);
      setInputContent('');
    } catch (err) {
      console.error('Offline submit error:', err);
    }
  };

  const isPositionLeft = widgetPosition === 'bottom-left';

  return (
    <div
      className={`chatify-widget-container font-sans antialiased text-slate-800 dark:text-slate-100 ${
        mode === 'window-only' ? 'w-full h-full' : 'fixed z-[999999]'
      } ${
        mode !== 'window-only'
          ? isPositionLeft
            ? 'left-6 bottom-6'
            : 'right-6 bottom-6'
          : ''
      }`}
    >
      {/* ---------------------------------------------------------------------- */}
      {/* CHAT WINDOW (Slide-up Animation ~250ms with Rounded-2xl & Soft Shadow) */}
      {/* ---------------------------------------------------------------------- */}
      <div
        className={`transition-all duration-250 ease-out origin-bottom ${
          isOpen
            ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 scale-95 translate-y-4 pointer-events-none hidden'
        } ${
          mode === 'window-only'
            ? 'w-full h-full flex flex-col'
            : 'w-[380px] sm:w-[410px] h-[590px] max-h-[calc(100vh-100px)] rounded-2xl shadow-2xl flex flex-col mb-4 border border-slate-200/80 dark:border-slate-800'
        } bg-white dark:bg-slate-900 overflow-hidden`}
        style={{
          boxShadow:
            '0 20px 40px -15px rgba(0, 0, 0, 0.2), 0 0 1px 1px rgba(0, 0, 0, 0.05)',
        }}
      >
        {/* HEADER */}
        <div
          className="p-4 flex items-center justify-between text-white select-none transition-colors duration-200"
          style={{ backgroundColor: brandColor }}
        >
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-full bg-white/20 flex items-center justify-center overflow-hidden border border-white/30 backdrop-blur-sm">
              <img
                src={config.logoUrl || '/chat-icon.png'}
                alt={companyName}
                className="w-full h-full object-contain p-1"
              />
              {/* Online/Offline Status Dot */}
              <span
                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                  isAgentOnline
                    ? 'bg-emerald-400 animate-pulse'
                    : 'bg-slate-400'
                }`}
                title={isAgentOnline ? 'Agent is online' : 'Agents away'}
              />
            </div>

            <div>
              <h3 className="font-semibold text-sm leading-tight">
                {companyName}
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5 text-xs text-white/90">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isAgentOnline ? 'bg-emerald-300' : 'bg-white/60'
                  }`}
                />
                <span>
                  {isAgentOnline ? 'Active now · Quick replies' : 'Away · Leave a message'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {showHelpTab && (
              <button
                onClick={() => {
                  setIsHelpOpen((prev) => !prev);
                  setSelectedArticle(null);
                }}
                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors text-white"
                title={isHelpOpen ? 'Back to Chat' : `${helpTabLabel} & FAQs`}
              >
                <BookOpen className="w-4.5 h-4.5" />
              </button>
            )}

            <button
              onClick={() => {
                toggleWidget(false);
                onClose?.();
              }}
              className="p-1.5 rounded-lg hover:bg-white/20 transition-colors text-white"
              title="Close chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {isHelpOpen ? (
          <div className="flex-1 flex flex-col min-h-0 bg-slate-50/80 dark:bg-slate-950/80 overflow-hidden">
            {selectedArticle ? (
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
                <button
                  onClick={() => setSelectedArticle(null)}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Back to all guides</span>
                </button>

                <div>
                  <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/50 border border-blue-200/50">
                    {selectedArticle.section?.icon || '📚'} {selectedArticle.section?.name || selectedArticle.category || 'General'}
                  </span>
                  <h3 className="text-[16px] font-bold text-slate-900 dark:text-white mt-2">
                    {selectedArticle.title}
                  </h3>
                </div>

                {selectedArticle.summary && (
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-200/50 dark:bg-slate-800/50 p-2.5 rounded-lg leading-relaxed">
                    {selectedArticle.summary}
                  </p>
                )}

                <div className="text-xs text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {selectedArticle.content}
                </div>

                {/* Helpful voting */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                  <span>Was this article helpful?</span>
                  {articleVoted[selectedArticle.id] ? (
                    <span className="text-emerald-500 font-semibold text-[11px]">✓ Thank you!</span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={async () => {
                          setArticleVoted((prev) => ({ ...prev, [selectedArticle.id]: true }));
                          if (config.workspaceId) {
                            fetch('/api/help/feedback', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                articleId: selectedArticle.id,
                                workspaceId: config.workspaceId,
                                visitorId,
                                isHelpful: true,
                              }),
                            }).catch(() => {});
                          }
                        }}
                        className="px-2.5 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs hover:border-emerald-500 transition-colors"
                      >
                        👍 Yes
                      </button>
                      <button
                        onClick={async () => {
                          setArticleVoted((prev) => ({ ...prev, [selectedArticle.id]: true }));
                          if (config.workspaceId) {
                            fetch('/api/help/feedback', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                articleId: selectedArticle.id,
                                workspaceId: config.workspaceId,
                                visitorId,
                                isHelpful: false,
                              }),
                            }).catch(() => {});
                          }
                        }}
                        className="px-2.5 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs hover:border-rose-500 transition-colors"
                      >
                        👎 No
                      </button>
                    </div>
                  )}
                </div>

                <div className="pt-3">
                  <button
                    onClick={() => setIsHelpOpen(false)}
                    className="w-full py-2 rounded-xl text-white font-semibold text-xs transition-opacity hover:opacity-95 shadow-sm"
                    style={{ backgroundColor: brandColor }}
                  >
                    Still need assistance? Start Chat
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={helpSearch}
                      onChange={(e) => setHelpSearch(e.target.value)}
                      placeholder={`Search ${helpTabLabel.toLowerCase()}...`}
                      className="w-full h-8.5 pl-9 pr-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {helpArticles.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400 space-y-2">
                      <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
                      <p>No articles available yet.</p>
                    </div>
                  ) : (() => {
                    const filtered = helpArticles.filter((a) => {
                      if (!helpSearch.trim()) return true;
                      const q = helpSearch.toLowerCase().trim();
                      return (
                        a.title?.toLowerCase().includes(q) ||
                        a.summary?.toLowerCase().includes(q) ||
                        a.content?.toLowerCase().includes(q) ||
                        a.category?.toLowerCase().includes(q) ||
                        a.section?.name?.toLowerCase().includes(q)
                      );
                    });

                    if (filtered.length === 0) {
                      return (
                        <div className="p-8 text-center text-xs text-slate-400 space-y-2">
                          <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
                          <p>No articles match &ldquo;{helpSearch}&rdquo;</p>
                        </div>
                      );
                    }

                    return filtered.map((art) => (
                      <div
                        key={art.id}
                        onClick={() => setSelectedArticle(art)}
                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-400 dark:hover:border-slate-600 transition-all cursor-pointer space-y-1 shadow-2xs"
                      >
                        <span className="text-[10.5px] font-semibold text-blue-600 dark:text-blue-400">
                          {art.section?.icon || '📚'} {art.section?.name || art.category}
                        </span>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-snug">
                          {art.title}
                        </h4>
                        {art.summary && (
                          <p className="text-[11.5px] text-slate-500 dark:text-slate-400 line-clamp-1">
                            {art.summary}
                          </p>
                        )}
                      </div>
                    ));
                  })()}
                </div>

                {config.workspaceId && (
                  <div className="p-2.5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center">
                    <a
                      href={helpCenterPortalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11.5px] font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                    >
                      <span>Open Full {helpTabLabel} Portal</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* BODY AREA */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/70 dark:bg-slate-950/60 relative">
          {/* OFFLINE BANNER */}
          {isAgentOnline === false && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
              <Clock className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Support is currently offline</p>
                <p className="text-amber-700/80 dark:text-amber-400/80 mt-0.5">
                  Send your message and we'll reply directly to your email as soon as we return.
                </p>
              </div>
            </div>
          )}

          {/* PRE-CHAT IDENTIFICATION FORM */}
          {!isIdentified ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4 my-auto">
              <div className="text-center space-y-1">
                <h4 className="font-semibold text-base text-slate-800 dark:text-slate-100">
                  Welcome to Live Support! 👋
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Please introduce yourself to start chatting with our team.
                </p>
              </div>

              <form onSubmit={handlePreChatSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Jane Doe"
                    value={visitorName}
                    onChange={(e) => setVisitorName(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="jane@example.com"
                    value={visitorEmail}
                    onChange={(e) => setVisitorEmail(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  style={{ backgroundColor: brandColor }}
                  className="w-full py-2.5 px-4 text-white text-sm font-semibold rounded-lg shadow-sm hover:opacity-95 transition-opacity mt-2"
                >
                  Start Live Conversation
                </button>
              </form>
            </div>
          ) : (
            /* MESSAGE THREAD */
            <>
              {messages.map((msg) => {
                const isVisitor = msg.sender_type === 'visitor';
                const timeString = new Date(msg.created_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={msg.id}
                    className={`group flex flex-col ${
                      isVisitor ? 'items-end' : 'items-start'
                    } relative`}
                  >
                    <div
                      className={`max-w-[82%] px-3.5 py-2.5 text-sm rounded-2xl break-words transition-all duration-150 ${
                        isVisitor
                          ? 'rounded-br-xs text-white shadow-sm'
                          : 'rounded-bl-xs bg-slate-200/90 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                      }`}
                      style={isVisitor ? { backgroundColor: brandColor } : {}}
                    >
                      {/* Attachment Rendering */}
                      {msg.attachment_url && (
                        <div className="mb-2">
                          {msg.attachment_url.match(/\.(jpeg|jpg|png|webp|gif)$/i) ? (
                            <img
                              src={msg.attachment_url}
                              alt="Attachment"
                              className="rounded-xl max-h-48 w-auto object-cover cursor-pointer hover:opacity-90"
                              onClick={() => window.open(msg.attachment_url!, '_blank')}
                            />
                          ) : (
                            <a
                              href={msg.attachment_url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-2 p-2 bg-white/10 rounded-lg text-xs hover:underline"
                            >
                              <FileText className="w-4 h-4 shrink-0" />
                              <span className="truncate">View Document</span>
                            </a>
                          )}
                        </div>
                      )}

                      {/* Content */}
                      <p className="whitespace-pre-wrap leading-relaxed">
                        {msg.content}
                      </p>
                    </div>

                    {/* Timestamp & Delivery Info (Shown on Hover) */}
                    <div
                      className={`flex items-center gap-1 text-[10px] text-slate-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity ${
                        isVisitor ? 'justify-end pr-1' : 'justify-start pl-1'
                      }`}
                    >
                      <span>{timeString}</span>
                      {isVisitor && (
                        <span>
                          {msg.read_at ? (
                            <CheckCheck className="w-3 h-3 text-blue-500" />
                          ) : (
                            <Check className="w-3 h-3" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* TYPING INDICATOR (Supabase Realtime Presence) */}
              {isAgentTyping && (
                <div className="flex items-center gap-1.5 p-3 rounded-2xl bg-slate-200/80 dark:bg-slate-800 w-fit rounded-bl-xs">
                  <span
                    className="w-2 h-2 rounded-full bg-slate-500 animate-bounce"
                    style={{ animationDelay: '0ms' }}
                  />
                  <span
                    className="w-2 h-2 rounded-full bg-slate-500 animate-bounce"
                    style={{ animationDelay: '150ms' }}
                  />
                  <span
                    className="w-2 h-2 rounded-full bg-slate-500 animate-bounce"
                    style={{ animationDelay: '300ms' }}
                  />
                  <span className="text-[11px] text-slate-500 ml-1.5 font-medium">
                    Agent is typing...
                  </span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* EMOJI PICKER POPOVER */}
        {showEmojiPicker && (
          <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 grid grid-cols-8 gap-2 max-h-36 overflow-y-auto">
            {POPULAR_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  setInputContent((prev) => prev + emoji);
                  setShowEmojiPicker(false);
                }}
                className="text-lg hover:scale-125 transition-transform p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* COMPOSER / OFFLINE INPUT */}
        {isIdentified && (
          <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
            {isAgentOnline === false && isOfflineSubmitted ? (
              <div className="text-center py-3 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                ✓ Message received! We'll reply to your email shortly.
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (isAgentOnline === false) {
                    handleOfflineSubmit(e);
                  } else {
                    handleSendMessage();
                  }
                }}
                className="flex items-end gap-2"
              >
                {/* File Attachment Hidden Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  accept="image/*,.pdf,.txt"
                />

                <div className="flex items-center gap-0.5 mb-1 text-slate-500">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                    title="Attach file or image"
                  >
                    <Paperclip className={`w-4 h-4 ${isUploading ? 'animate-spin' : ''}`} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                    title="Insert emoji"
                  >
                    <Smile className="w-4 h-4" />
                  </button>
                </div>

                <textarea
                  rows={1}
                  value={inputContent}
                  onChange={handleInputChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (isAgentOnline === false) {
                        handleOfflineSubmit(e);
                      } else {
                        handleSendMessage();
                      }
                    }
                  }}
                  placeholder={
                    isAgentOnline === false
                      ? 'Leave your message...'
                      : 'Write a message...'
                  }
                  className="flex-1 max-h-24 px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />

                <button
                  type="submit"
                  disabled={!inputContent.trim() && !isUploading}
                  style={{ backgroundColor: brandColor }}
                  className="p-2 rounded-xl text-white shadow-sm hover:opacity-90 disabled:opacity-40 transition-opacity mb-0.5"
                  title="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        )}
          </>
        )}
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* FLOATING CIRCULAR LAUNCHER BUBBLE                                      */}
      {/* ---------------------------------------------------------------------- */}
      {mode !== 'window-only' && (
        <div className={`flex ${isPositionLeft ? 'justify-start' : 'justify-end'}`}>
          <button
            onClick={() => toggleWidget()}
            style={{ backgroundColor: brandColor }}
            className={`relative w-14 h-14 rounded-full text-white shadow-xl hover:scale-105 active:scale-95 flex items-center justify-center transition-all duration-200 focus:outline-none ${
              hasNewMessagePulse ? 'ring-4 ring-blue-400/50 animate-pulse' : ''
            }`}
            title="Open Live Chat"
          >
            {/* Launcher Icon Toggle */}
            {isOpen ? (
              <X className="w-6 h-6 transition-transform duration-200 rotate-90 scale-100" />
            ) : (
              <img
                src="/chat-icon.png"
                alt="Chat"
                className="w-7 h-7 object-contain filter drop-shadow-sm transition-transform duration-200 hover:scale-105"
              />
            )}

            {/* Unread Counter Badge Pill */}
            {unreadCount > 0 && !isOpen && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white font-bold text-xs px-2 py-0.5 rounded-full border-2 border-white shadow-md animate-bounce">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
