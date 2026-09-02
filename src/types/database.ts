export type AgentStatus = 'online' | 'away' | 'offline';
export type ConversationStatus = 'open' | 'pending' | 'closed';
export type ConversationPriority = 'low' | 'normal' | 'high' | 'urgent';
export type SenderType = 'visitor' | 'agent' | 'ai';

export interface Workspace {
  id: string;
  name: string;
  website_url: string | null;
  brand_color: string;
  greeting_title: string;
  greeting_message: string;
  owner_id: string;
  created_at: string;
}

export interface Visitor {
  id: string;
  name: string | null;
  email: string | null;
  current_url: string;
  user_agent: string | null;
  ip_address: string | null;
  location: string | null;
  workspace_id?: string | null;
  first_seen: string;
  last_seen: string;
}

export interface Agent {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  status: AgentStatus;
  workspace_id?: string | null;
  role?: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  visitor_id: string;
  agent_id: string | null;
  workspace_id?: string | null;
  status: ConversationStatus;
  priority?: ConversationPriority | null;
  tags?: string[] | null;
  csat_rating?: number | null;
  csat_feedback?: string | null;
  created_at: string;
  closed_at: string | null;
  updated_at: string;
  // Joined relation fields
  visitor?: Visitor;
  agent?: Agent | null;
  last_message?: Message | null;
  unread_count?: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_type: SenderType;
  sender_id: string | null;
  content: string;
  is_internal?: boolean;
  metadata?: Record<string, any> | null;
  created_at: string;
  read_at: string | null;
  // Joined
  agent?: Agent | null;
}

export interface CannedResponse {
  id: string;
  workspace_id?: string | null;
  shortcut: string;
  title: string;
  content: string;
  created_at?: string;
}

export interface Article {
  id: string;
  workspace_id?: string | null;
  title: string;
  category: string;
  summary: string;
  content: string;
  created_at?: string;
}
