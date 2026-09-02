'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Agent, Conversation, Message, Visitor, Workspace, AgentStatus, ConversationStatus, ConversationPriority } from '@/types/database';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { ConversationList } from '@/components/dashboard/ConversationList';
import { ChatThread } from '@/components/dashboard/ChatThread';
import { VisitorDetailsSidebar } from '@/components/dashboard/VisitorDetailsSidebar';
import { LiveVisitorsRadar } from '@/components/dashboard/LiveVisitorsRadar';
import { InstallationGuide } from '@/components/dashboard/InstallationGuide';
import { sound } from '@/lib/sound';
import { sendBrowserNotification } from '@/lib/utils';
import { MessageSquare } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [currentAgent, setCurrentAgent] = useState<Agent | null>(null);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [allAgents, setAllAgents] = useState<Agent[]>([]);

  // Navigation & Views: 'inbox' | 'visitors' | 'installation'
  const [activeView, setActiveView] = useState<'inbox' | 'visitors' | 'installation'>('inbox');
  const [statusFilter, setStatusFilter] = useState<ConversationStatus | 'all'>('all');

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
            sendBrowserNotification('New Customer Message', newMsg.content);
          }

          refreshConversations();
        }
      )
      .subscribe();

    const conversationsChannel = supabase
      .channel('chatify-dashboard-conversations')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations' },
        () => {
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

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(conversationsChannel);
      supabase.removeChannel(visitorsChannel);
    };
  }, [supabase]);

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
      .update({ agent_id: agentId, updated_at: new Date().toISOString() })
      .eq('id', selectedConversationId);

    if (error) {
      console.error('Error assigning agent:', error);
      return;
    }

    const assignedAgent = allAgents.find((a) => a.id === agentId) || null;
    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedConversationId ? { ...c, agent_id: agentId, agent: assignedAgent } : c
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

  const counts = {
    all: conversations.length,
    open: conversations.filter((c) => c.status === 'open').length,
    pending: conversations.filter((c) => c.status === 'pending').length,
    closed: conversations.filter((c) => c.status === 'closed').length,
    liveVisitors: visitors.filter((v) => {
      const diff = (new Date().getTime() - new Date(v.last_seen).getTime()) / 1000;
      return diff < 90;
    }).length,
  };

  if (loading) {
    return (
      <div className="h-screen w-screen bg-[#090d16] flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white animate-bounce">
          <MessageSquare className="w-5 h-5" />
        </div>
        <p className="text-sm font-medium">Loading Workspace...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#090d16]">
      {/* 1. Left Sidebar Navigation */}
      <Sidebar
        currentAgent={currentAgent}
        workspace={currentWorkspace}
        activeView={activeView}
        onSelectView={setActiveView}
        statusFilter={statusFilter}
        onSelectStatusFilter={setStatusFilter}
        counts={counts}
        onUpdateAgentStatus={handleUpdateAgentStatus}
        onLogout={handleLogout}
      />

      {/* 2. Middle & Right Content Area based on activeView */}
      {activeView === 'inbox' && (
        <>
          <ConversationList
            conversations={conversations}
            selectedConversationId={selectedConversationId}
            onSelectConversation={setSelectedConversationId}
            statusFilter={statusFilter}
          />

          {activeConversation ? (
            <>
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
              />

              <VisitorDetailsSidebar
                visitor={activeConversation.visitor}
                conversation={activeConversation}
              />
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 space-y-3 bg-[#0b101d]">
              <div className="w-14 h-14 rounded-2xl bg-slate-800/40 border border-slate-700/60 flex items-center justify-center text-slate-400">
                <MessageSquare className="w-7 h-7 opacity-60" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-semibold text-slate-300">No conversation selected</p>
                <p className="text-xs text-slate-400 max-w-sm">
                  Select an active customer conversation from the list or install the widget on your site to receive visitors.
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {activeView === 'visitors' && (
        <LiveVisitorsRadar
          visitors={visitors}
          onOpenConversationForVisitor={handleOpenConversationForVisitor}
          onRefresh={() => refreshVisitors()}
        />
      )}

      {activeView === 'installation' && (
        <InstallationGuide
          workspace={currentWorkspace}
          hasVisitors={visitors.length > 0}
          latestVisitorUrl={visitors[0]?.current_url}
        />
      )}
    </div>
  );
}
