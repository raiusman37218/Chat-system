'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Agent, Conversation, Message, Visitor, Workspace, AgentStatus, ConversationStatus, ConversationPriority, CannedResponse } from '@/types/database';
import { Sidebar, type View } from '@/components/dashboard/Sidebar';
import { ConversationList } from '@/components/dashboard/ConversationList';
import { ChatThread } from '@/components/dashboard/ChatThread';
import { VisitorDetailsSidebar } from '@/components/dashboard/VisitorDetailsSidebar';
import { LiveVisitorsRadar } from '@/components/dashboard/LiveVisitorsRadar';
import { SettingsHub } from '@/components/dashboard/SettingsHub';
import { AnalyticsDashboard } from '@/components/admin/AnalyticsDashboard';
import { HelpDeskDashboard } from '@/components/dashboard/HelpDeskDashboard';
import { EmptyState } from '@/components/ui/EmptyState';
import { KeyboardShortcutsModal } from '@/components/ui/KeyboardShortcutsModal';
import { sound } from '@/lib/sound';
import { sendBrowserNotification, cn } from '@/lib/utils';
import { updateFaviconBadge } from '@/lib/favicon';
import { BarChart2, BookOpen, Inbox, Radio, Settings } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [currentAgent, setCurrentAgent] = useState<Agent | null>(null);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [allAgents, setAllAgents] = useState<Agent[]>([]);
  const [cannedResponses, setCannedResponses] = useState<CannedResponse[]>([]);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [isDetailsSidebarOpen, setIsDetailsSidebarOpen] = useState(true);
  const [articlesCount, setArticlesCount] = useState(0);

  // Five destinations: the inbox, the visitor radar, reports, help desk,
  // and the Settings hub.
  const [activeView, setActiveView] = useState<View>('inbox');

  // Conversations & Messages
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  // Visitors
  const [visitors, setVisitors] = useState<Visitor[]>([]);

  // Refs for tracking active state in realtime callbacks
  const selectedConversationIdRef = useRef<string | null>(null);
  selectedConversationIdRef.current = selectedConversationId;

  const currentWorkspaceIdRef = useRef<string | null>(null);
  currentWorkspaceIdRef.current = currentWorkspace?.id || null;

  // Dynamically update favicon badge and title count when unread conversations change
  useEffect(() => {
    const unreadTotal = conversations.reduce(
      (acc, c) => acc + (c.unread_count || 0),
      0
    );
    updateFaviconBadge(unreadTotal);
  }, [conversations]);

  // Global Keyboard Shortcuts Listener (? for cheatsheet, Esc to deselect)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      const isInputActive =
        activeTag === 'input' ||
        activeTag === 'textarea' ||
        (document.activeElement as HTMLElement)?.isContentEditable;

      if (e.key === '?' && !isInputActive && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setShowShortcutsModal((prev) => !prev);
        return;
      }

      if (e.key === 'Escape' && !showShortcutsModal && selectedConversationId) {
        setSelectedConversationId(null);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [showShortcutsModal, selectedConversationId]);

  // 1. Initial Load & Auth Verification
  const initializeDashboard = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/login');
        return;
      }

      // Fetch or auto-create agent profile
      let agent: Agent | null = null;
      const { data: agentData } = await supabase
        .from('agents')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

      if (agentData) {
        agent = agentData as Agent;
      } else {
        const newAgent = {
          id: session.user.id,
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Agent',
          email: session.user.email || '',
          status: 'online' as AgentStatus,
          role: 'owner',
        };
        const { data: inserted } = await supabase.from('agents').upsert(newAgent).select().single();
        agent = inserted as Agent;
      }

      // Check if user has a workspace
      let workspace: Workspace | null = null;
      if (agent?.workspace_id) {
        const { data: wsData } = await supabase
          .from('workspaces')
          .select('*')
          .eq('id', agent.workspace_id)
          .maybeSingle();
        workspace = wsData as Workspace;
      }

      // If still no workspace, check if user owns one
      if (!workspace) {
        const { data: ownedWs } = await supabase
          .from('workspaces')
          .select('*')
          .eq('owner_id', session.user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (ownedWs) {
          workspace = ownedWs as Workspace;
          // link agent to this workspace
          await supabase.from('agents').update({ workspace_id: workspace.id }).eq('id', session.user.id);
          agent.workspace_id = workspace.id;
        }
      }

      // If user has NO workspace at all, redirect to Onboarding
      if (!workspace) {
        router.replace('/onboarding');
        return;
      }

      setCurrentAgent(agent);
      setCurrentWorkspace(workspace);

      // Fetch all agents in this workspace
      const { data: agentsList } = await supabase
        .from('agents')
        .select('*')
        .eq('workspace_id', workspace.id);
      if (agentsList) setAllAgents(agentsList as Agent[]);

      // Fetch conversations and visitors for this workspace
      await refreshConversations(workspace.id);
      await refreshVisitors(workspace.id);

      // Fetch canned responses
      const { data: cannedList } = await supabase
        .from('canned_responses')
        .select('*')
        .or(`workspace_id.eq.${workspace.id},workspace_id.is.null`)
        .order('shortcut');
      if (cannedList) setCannedResponses(cannedList as CannedResponse[]);

      // Fetch articles count for sidebar badge
      const { count: artCount } = await supabase
        .from('articles')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspace.id);
      if (artCount !== null && artCount !== undefined) setArticlesCount(artCount);

      setLoading(false);
    } catch (err) {
      console.error('Error initializing dashboard:', err);
      setLoading(false);
    }
  }, [supabase, router]);

  useEffect(() => {
    initializeDashboard();
  }, [initializeDashboard]);

  // 2. Refresh Conversations
  const refreshConversations = async (wsId?: string) => {
    const targetWsId = wsId || currentWorkspaceIdRef.current;
    let query = supabase
      .from('conversations')
      .select(`
        *,
        visitor:visitors(*),
        agent:agents(*)
      `)
      .order('updated_at', { ascending: false });

    if (targetWsId) {
      query = query.eq('workspace_id', targetWsId);
    }

    const { data: convData, error } = await query;
    if (error) {
      console.error('Failed to fetch conversations:', error);
      return;
    }

    const enrichedConversations: Conversation[] = await Promise.all(
      (convData || []).map(async (c: any) => {
        const { data: msgData } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', c.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        return {
          ...c,
          last_message: msgData || null,
        };
      })
    );

    setConversations(enrichedConversations);

    if (!selectedConversationIdRef.current && enrichedConversations.length > 0) {
      setSelectedConversationId(enrichedConversations[0].id);
    }
  };

  // 3. Refresh Visitors
  const refreshVisitors = async (wsId?: string) => {
    const targetWsId = wsId || currentWorkspaceIdRef.current;
    let query = supabase
      .from('visitors')
      .select('*')
      .order('last_seen', { ascending: false });

    if (targetWsId) {
      query = query.eq('workspace_id', targetWsId);
    }

    const { data: vData, error } = await query;
    if (error) {
      console.error('Failed to fetch visitors:', error);
      return;
    }
    setVisitors((vData as Visitor[]) || []);
  };

  // 4. Fetch Messages for Active Conversation
  const loadMessages = useCallback(async (conversationId: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*, agent:agents(*)')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Failed to load messages:', error);
      return;
    }
    setMessages((data as Message[]) || []);

    await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .is('read_at', null)
      .eq('sender_type', 'visitor');
  }, [supabase]);

  useEffect(() => {
    if (selectedConversationId) {
      loadMessages(selectedConversationId);
    } else {
      setMessages([]);
    }
  }, [selectedConversationId, loadMessages]);

  // 5. Supabase Realtime Subscriptions
  useEffect(() => {
    const messagesChannel = supabase
      .channel('chatify-dashboard-messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const newMsg = payload.new as Message;

          if (newMsg.conversation_id === selectedConversationIdRef.current) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });

            if (newMsg.sender_type === 'visitor') {
              supabase
                .from('messages')
                .update({ read_at: new Date().toISOString() })
                .eq('id', newMsg.id)
                .then();
            }
          }

          if (newMsg.sender_type === 'visitor') {
            sound.playIncomingMessage();
            sendBrowserNotification(
              'New Customer Message',
              newMsg.content || 'Sent an attachment',
              {
                tag: `msg-${newMsg.conversation_id}`,
                onClick: () => {
                  setSelectedConversationId(newMsg.conversation_id);
                },
              }
            );

            // Dispatch offline agent email check
            fetch('/api/notifications/dispatch', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                event: 'new_message',
                conversation_id: newMsg.conversation_id,
                message: newMsg,
                workspace_id: currentWorkspaceIdRef.current,
              }),
            }).catch((err) => console.error('[Offline Email Dispatch]:', err));
          }

          refreshConversations();
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages' },
        (payload) => {
          const updatedMsg = payload.new as Message;
          if (updatedMsg.conversation_id === selectedConversationIdRef.current) {
            setMessages((prev) =>
              prev.map((m) => (m.id === updatedMsg.id ? { ...m, ...updatedMsg } : m))
            );
          }
        }
      )
      .subscribe();

    const conversationsChannel = supabase
      .channel('chatify-dashboard-conversations')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            sound.playNewConversation();
            const newConv = payload.new as Conversation;
            sendBrowserNotification(
              'New Conversation Started',
              'A visitor started a new conversation on your site.',
              {
                tag: `conv-${newConv.id}`,
                onClick: () => {
                  setSelectedConversationId(newConv.id);
                },
              }
            );

            // Dispatch Slack notification
            fetch('/api/notifications/dispatch', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                event: 'conversation_created',
                conversation_id: newConv.id,
                workspace_id: currentWorkspaceIdRef.current,
              }),
            }).catch((err) => console.error('[Slack Dispatch]:', err));

            // Schedule Claude AI Auto-First-Response check if unassigned
            const wsId = newConv.workspace_id || currentWorkspaceIdRef.current;
            if (wsId) {
              const delay = currentWorkspace?.ai_settings?.auto_response_delay_seconds || 20;
              setTimeout(() => {
                fetch('/api/ai/auto-respond', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    conversation_id: newConv.id,
                    workspace_id: wsId,
                  }),
                }).catch((err) => console.warn('[AI Auto-Respond]:', err));
              }, delay * 1000);
            }
          }

          refreshConversations();
        }
      )
      .subscribe();

    const visitorsChannel = supabase
      .channel('chatify-dashboard-visitors')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'visitors' },
        (payload) => {
          const updatedVisitor = payload.new as Visitor;
          // Only process if belongs to this workspace
          if (
            currentWorkspaceIdRef.current &&
            updatedVisitor.workspace_id &&
            updatedVisitor.workspace_id !== currentWorkspaceIdRef.current
          ) {
            return;
          }

          setVisitors((prev) => {
            const index = prev.findIndex((v) => v.id === updatedVisitor.id);
            if (index >= 0) {
              const copy = [...prev];
              copy[index] = updatedVisitor;
              return copy;
            } else {
              return [updatedVisitor, ...prev];
            }
          });

          setConversations((prev) =>
            prev.map((c) =>
              c.visitor_id === updatedVisitor.id ? { ...c, visitor: updatedVisitor } : c
            )
          );
        }
      )
      .subscribe();

    const internalNotesChannel = supabase
      .channel('chatify-dashboard-internal-notes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'internal_notes' },
        (payload) => {
          const note = payload.new as any;
          if (
            currentAgent?.id &&
            note.mentioned_agent_ids?.includes(currentAgent.id) &&
            note.agent_id !== currentAgent.id
          ) {
            sound.playIncomingMessage();
            sendBrowserNotification(
              'You were @mentioned in a conversation',
              note.content
            );
          }
        }
      )
      .subscribe();

    // Periodic check for overdue snoozed conversations
    const checkSnoozed = () => {
      fetch('/api/conversations/snooze')
        .then((res) => res.json())
        .then((data) => {
          if (data && data.reopened > 0) {
            refreshConversations();
            sendBrowserNotification(
              'Snooze expired',
              `${data.reopened} snoozed conversation(s) have reopened.`
            );
          }
        })
        .catch(() => {});
    };

    checkSnoozed();
    const snoozeInterval = setInterval(checkSnoozed, 30000);

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(conversationsChannel);
      supabase.removeChannel(visitorsChannel);
      supabase.removeChannel(internalNotesChannel);
      clearInterval(snoozeInterval);
    };
  }, [supabase, currentAgent?.id]);

  // 6. Action Handlers
  const handleSendMessage = async (content: string, isInternal: boolean = false) => {
    if (!selectedConversationId || !currentAgent) return;

    const { error } = await supabase.from('messages').insert({
      conversation_id: selectedConversationId,
      sender_type: 'agent',
      sender_id: currentAgent.id,
      content,
      is_internal: isInternal,
    });

    if (error) {
      console.error('Error sending message:', error);
      throw error;
    }

    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', selectedConversationId);
  };

  const handleUpdatePriority = async (priority: ConversationPriority) => {
    if (!selectedConversationId) return;

    const { error } = await supabase
      .from('conversations')
      .update({ priority, updated_at: new Date().toISOString() })
      .eq('id', selectedConversationId);

    if (error) {
      console.error('Error updating conversation priority:', error);
      return;
    }

    setConversations((prev) =>
      prev.map((c) => (c.id === selectedConversationId ? { ...c, priority } : c))
    );
  };

  const handleUpdateTags = async (tags: string[]) => {
    if (!selectedConversationId) return;

    const { error } = await supabase
      .from('conversations')
      .update({ tags, updated_at: new Date().toISOString() })
      .eq('id', selectedConversationId);

    if (error) {
      console.error('Error updating conversation tags:', error);
      return;
    }

    setConversations((prev) =>
      prev.map((c) => (c.id === selectedConversationId ? { ...c, tags } : c))
    );
  };

  const handleUpdateStatus = async (status: ConversationStatus) => {
    if (!selectedConversationId) return;

    const updates: Partial<Conversation> = {
      status,
      closed_at: status === 'closed' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('conversations')
      .update(updates)
      .eq('id', selectedConversationId);

    if (error) {
      console.error('Error updating conversation status:', error);
      return;
    }

    setConversations((prev) =>
      prev.map((c) => (c.id === selectedConversationId ? { ...c, ...updates } : c))
    );
  };

  const handleAssignAgent = async (agentId: string | null) => {
    if (!selectedConversationId) return;

    const { error } = await supabase
      .from('conversations')
      .update({
        agent_id: agentId,
        assigned_agent_id: agentId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', selectedConversationId);

    if (error) {
      console.error('Error assigning agent:', error);
      return;
    }

    const assignedAgent = allAgents.find((a) => a.id === agentId) || null;
    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedConversationId
          ? { ...c, agent_id: agentId, assigned_agent_id: agentId, agent: assignedAgent }
          : c
      )
    );
  };

  const handleUpdateAgentStatus = async (status: AgentStatus) => {
    if (!currentAgent) return;

    const { error } = await supabase
      .from('agents')
      .update({ status })
      .eq('id', currentAgent.id);

    if (error) {
      console.error('Error updating agent status:', error);
      return;
    }
    setCurrentAgent((prev) => (prev ? { ...prev, status } : null));
  };

  const handleOpenConversationForVisitor = async (visitorId: string) => {
    let existing = conversations.find((c) => c.visitor_id === visitorId);
    if (!existing) {
      const { data } = await supabase
        .from('conversations')
        .insert({
          visitor_id: visitorId,
          workspace_id: currentWorkspace?.id || null,
          status: 'open',
        })
        .select('*, visitor:visitors(*)')
        .single();

      if (data) {
        existing = data as Conversation;
        setConversations((prev) => [existing!, ...prev]);
      }
    }

    if (existing) {
      setSelectedConversationId(existing.id);
      setActiveView('inbox');
    }
  };

  const handleLogout = async () => {
    if (currentAgent) {
      await supabase.from('agents').update({ status: 'offline' }).eq('id', currentAgent.id);
    }
    await supabase.auth.signOut();
    router.replace('/login');
  };

  const activeConversation = conversations.find((c) => c.id === selectedConversationId);

  const isAdmin =
    currentAgent?.role === 'admin' || currentAgent?.role === 'owner';

  const counts = {
    open: conversations.filter((c) => c.status === 'open').length,
    liveVisitors: visitors.filter(
      (v) => (Date.now() - new Date(v.last_seen).getTime()) / 1000 < 90
    ).length,
    articles: articlesCount,
  };

  if (loading) {
    return (
      <div className="h-screen w-screen bg-canvas flex flex-col items-center justify-center gap-4">
        <div className="w-14 h-14 flex items-center justify-center animate-breathe">
          <img
            src="/logo.png"
            alt="Loading"
            className="w-full h-full object-contain filter drop-shadow-sm"
          />
        </div>
        <p className="text-[13px] font-medium text-ink-3">Loading workspace…</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-canvas relative">
      {/* 1. Left Sidebar Navigation (Desktop) */}
      <div
        className={cn(
          'h-screen shrink-0',
          selectedConversationId ? 'hidden md:flex' : 'hidden md:flex'
        )}
      >
        <Sidebar
          currentAgent={currentAgent}
          workspace={currentWorkspace}
          activeView={activeView}
          onSelectView={setActiveView}
          counts={counts}
          onUpdateAgentStatus={handleUpdateAgentStatus}
          onLogout={handleLogout}
          onOpenShortcuts={() => setShowShortcutsModal(true)}
        />
      </div>

      {/* 2. Middle & Right Content Area based on activeView */}
      {activeView === 'inbox' && (
        <div className="flex-1 flex overflow-hidden w-full">
          {/* Conversation List: full width on mobile when no conversation active */}
          <div
            className={cn(
              'h-full shrink-0',
              selectedConversationId
                ? 'hidden md:flex md:w-[310px]'
                : 'flex w-full md:w-[310px] pb-14 md:pb-0'
            )}
          >
            <ConversationList
              conversations={conversations}
              selectedConversationId={selectedConversationId}
              onSelectConversation={setSelectedConversationId}
              currentAgent={currentAgent}
              loading={loading}
            />
          </div>

          {/* Chat Thread + Visitor CRM Sidebar */}
          {activeConversation ? (
            <div
              className={cn(
                'flex-1 flex overflow-hidden',
                selectedConversationId ? 'flex w-full' : 'hidden md:flex'
              )}
            >
              <ChatThread
                conversation={activeConversation}
                messages={messages}
                currentAgent={currentAgent}
                agentsList={allAgents}
                onSendMessage={handleSendMessage}
                onUpdateStatus={handleUpdateStatus}
                onAssignAgent={handleAssignAgent}
                onUpdatePriority={handleUpdatePriority}
                onUpdateTags={handleUpdateTags}
                onBack={() => setSelectedConversationId(null)}
                isDetailsSidebarOpen={isDetailsSidebarOpen}
                onToggleDetailsSidebar={() => setIsDetailsSidebarOpen((prev) => !prev)}
                onToggleAiMode={async (mode) => {
                  if (!selectedConversationId) return;
                  await supabase
                    .from('conversations')
                    .update({ ai_mode: mode, updated_at: new Date().toISOString() })
                    .eq('id', selectedConversationId);

                  setConversations((prev) =>
                    prev.map((c) =>
                      c.id === selectedConversationId ? { ...c, ai_mode: mode } : c
                    )
                  );
                }}
              />

              {isDetailsSidebarOpen && (
                <VisitorDetailsSidebar
                  visitor={activeConversation.visitor}
                  conversation={activeConversation}
                  currentAgent={currentAgent}
                  onSelectConversation={setSelectedConversationId}
                  onUpdateTags={handleUpdateTags}
                  onClose={() => setIsDetailsSidebarOpen(false)}
                />
              )}
            </div>
          ) : (
            <div className="hidden md:flex flex-1 flex-col items-center justify-center p-8 bg-canvas text-center select-none">
              <div className="max-w-md w-full p-8 rounded-3xl border border-line bg-surface shadow-md flex flex-col items-center animate-rise">
                <div className="relative mb-5">
                  <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shadow-inner">
                    <Inbox className="w-8 h-8" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold border-2 border-surface shadow-xs">
                    ✓
                  </div>
                </div>

                <h3 className="text-lg font-bold text-ink tracking-tight mb-2">
                  Ready for new conversations
                </h3>
                <p className="text-[13px] text-ink-3 leading-relaxed mb-6">
                  Select a visitor from your inbox on the left to start replying, or monitor active traffic on the live radar.
                </p>

                <div className="flex items-center gap-2.5 w-full mb-6">
                  <button
                    onClick={() => setActiveView('visitors')}
                    className="flex-1 btn btn-sm btn-secondary shadow-xs hover:border-line-2 gap-1.5"
                  >
                    <Radio className="w-3.5 h-3.5 text-emerald-500" />
                    Live Radar ({counts.liveVisitors})
                  </button>
                  <button
                    onClick={() => setActiveView('settings')}
                    className="flex-1 btn btn-sm btn-primary shadow-xs gap-1.5"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    Widget Setup
                  </button>
                </div>

                {/* Keyboard Quick Guide */}
                <div className="w-full pt-4 border-t border-line/60 grid grid-cols-2 gap-2 text-[11px] text-ink-3 text-left">
                  <div className="flex items-center justify-between px-2 py-1 rounded-lg bg-surface-2">
                    <span>Search Inbox</span>
                    <span className="kbd text-[9.5px]">Ctrl K</span>
                  </div>
                  <div className="flex items-center justify-between px-2 py-1 rounded-lg bg-surface-2">
                    <span>Shortcuts</span>
                    <span className="kbd text-[9.5px]">?</span>
                  </div>
                  <div className="flex items-center justify-between px-2 py-1 rounded-lg bg-surface-2">
                    <span>Saved Replies</span>
                    <span className="kbd text-[9.5px]">/</span>
                  </div>
                  <div className="flex items-center justify-between px-2 py-1 rounded-lg bg-surface-2">
                    <span>Send Message</span>
                    <span className="kbd text-[9.5px]">Ctrl ↵</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeView === 'visitors' && (
        <div className="flex-1 flex overflow-hidden w-full pb-14 md:pb-0">
          <LiveVisitorsRadar
            visitors={visitors}
            workspace={currentWorkspace}
            onOpenConversationForVisitor={handleOpenConversationForVisitor}
            onRefresh={() => refreshVisitors()}
          />
        </div>
      )}

      {activeView === 'reports' && currentWorkspace && currentAgent && (
        <div className="flex-1 flex overflow-hidden w-full pb-14 md:pb-0">
          <AnalyticsDashboard
            workspace={currentWorkspace}
            currentAgent={currentAgent}
          />
        </div>
      )}

      {activeView === 'helpdesk' && (
        <div className="flex-1 flex overflow-hidden w-full pb-14 md:pb-0">
          <HelpDeskDashboard
            workspace={currentWorkspace}
            currentAgent={currentAgent}
            onArticlesCountChange={(c) => setArticlesCount(c)}
          />
        </div>
      )}

      {activeView === 'settings' && (
        <div className="flex-1 flex overflow-hidden w-full pb-14 md:pb-0">
          <SettingsHub
            workspace={currentWorkspace}
            currentAgent={currentAgent}
            agents={allAgents}
            cannedResponses={cannedResponses}
            hasVisitors={visitors.length > 0}
            latestVisitorUrl={visitors[0]?.current_url}
            onWorkspaceUpdated={(ws) => setCurrentWorkspace(ws)}
          />
        </div>
      )}

      {/* 3. Mobile bottom navigation — mirrors the desktop rail exactly, so
          the app has one navigation model rather than two. */}
      {!selectedConversationId && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-surface border-t border-line flex items-center justify-around px-2 z-40 shadow-lg">
          {(
            [
              ['inbox', 'Inbox', Inbox, true],
              ['visitors', 'Visitors', Radio, true],
              ['reports', 'Reports', BarChart2, isAdmin],
              ['helpdesk', 'Help Desk', BookOpen, true],
              ['settings', 'Settings', Settings, true],
            ] as [View, string, typeof Inbox, boolean][]
          )
            .filter(([, , , visible]) => visible)
            .map(([view, label, Icon]) => (
              <button
                key={view}
                onClick={() => setActiveView(view)}
                aria-current={activeView === view ? 'page' : undefined}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-lg text-[10px] font-medium transition-colors',
                  activeView === view ? 'text-accent font-bold' : 'text-ink-3'
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
        </nav>
      )}

      {/* 4. Global Keyboard Shortcuts Cheatsheet Modal */}
      <KeyboardShortcutsModal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
      />
    </div>
  );
}
