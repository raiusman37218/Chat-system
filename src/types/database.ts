export type AgentStatus = 'online' | 'away' | 'offline';
export type AgentRole = 'admin' | 'agent' | 'owner';
export type ConversationStatus = 'open' | 'closed' | 'snoozed' | 'pending';
export type ConversationPriority = 'low' | 'normal' | 'high' | 'urgent';
export type SenderType = 'visitor' | 'agent' | 'system' | 'ai';
export type ChannelType = 'web' | 'whatsapp' | 'facebook' | 'instagram' | 'threads' | 'linkedin';
export type AiMode = 'autopilot' | 'copilot' | 'disabled';

// ============================================================================
// 1. Visitors
// ============================================================================
export interface Visitor {
  id: string;
  name: string | null;
  email: string | null;
  first_seen_at: string;
  last_seen_at: string;
  current_page_url: string;
  current_page_title: string | null;
  ip_location_city: string | null;
  ip_location_country: string | null;
  device: string | null;
  browser: string | null;
  os: string | null;
  referrer_source: string | null;
  visit_count: number;
  is_online: boolean;

  // Backwards compatibility aliases
  first_seen: string;
  last_seen: string;
  current_url: string;
  location: string | null;
  user_agent: string | null;
  ip_address: string | null;
  workspace_id?: string | null;
  channel?: ChannelType;
  channel_user_id?: string | null;
  channel_metadata?: Record<string, any> | null;
}

export type VisitorInsert = Partial<Visitor>;

// ============================================================================
// 2. Agents
// ============================================================================
export interface Agent {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  role: AgentRole;
  status: AgentStatus;
  created_at: string;
  workspace_id?: string | null;
}

export type AgentInsert = Partial<Agent>;

// ============================================================================
// 3. Conversations
// ============================================================================
export interface Conversation {
  id: string;
  visitor_id: string;
  assigned_agent_id: string | null;
  status: ConversationStatus;
  priority: ConversationPriority;
  created_at: string;
  updated_at: string;
  closed_at: string | null;

  // Joined relation fields
  visitor?: Visitor;
  agent?: Agent | null;
  last_message?: Message | null;
  unread_count?: number;

  // Compatibility / multi-tenant fields
  agent_id?: string | null;
  workspace_id?: string | null;
  tags?: string[] | null;
  csat_rating?: number | null;
  csat_feedback?: string | null;
  channel?: ChannelType;
  channel_user_id?: string | null;
  channel_metadata?: Record<string, any> | null;
  ai_mode?: AiMode;
  snoozed_until?: string | null;
  merged_into?: string | null;
  summary?: string | null;
  sentiment?: 'positive' | 'neutral' | 'negative' | null;
}

export type ConversationInsert = Partial<Conversation>;

// ============================================================================
// 4. Messages
// ============================================================================
export interface Message {
  id: string;
  conversation_id: string;
  sender_type: SenderType;
  sender_id: string | null;
  content: string;
  attachment_url: string | null;
  created_at: string;
  read_at: string | null;

  // Joined or metadata
  agent?: Agent | null;
  is_internal?: boolean;
  metadata?: Record<string, any> | null;
}

export type MessageInsert = Partial<Message>;

// ============================================================================
// 5. Conversation Tags
// ============================================================================
export interface ConversationTag {
  id: string;
  conversation_id: string;
  tag_name: string;
  created_at: string;
}

export type ConversationTagInsert = Partial<ConversationTag>;

// ============================================================================
// 6. Internal Notes
// ============================================================================
export interface InternalNote {
  id: string;
  conversation_id: string;
  agent_id: string;
  content: string;
  mentioned_agent_ids: string[];
  created_at: string;

  // Joined relation
  agent?: Agent | null;
}

export type InternalNoteInsert = Partial<InternalNote>;

// ============================================================================
// 7. Canned Responses
// ============================================================================
export interface CannedResponse {
  id: string;
  agent_id: string | null;
  shortcut: string;
  content: string;
  created_at: string;
  title?: string;
  workspace_id?: string | null;
}

export type CannedResponseInsert = Partial<CannedResponse>;

// ============================================================================
// 8. Visitor Page History
// ============================================================================
export interface VisitorPageHistory {
  id: string;
  visitor_id: string;
  url: string;
  title: string | null;
  visited_at: string;
}

export type VisitorPageHistoryInsert = Partial<VisitorPageHistory>;

// ============================================================================
// Workspaces & Integration Models
// ============================================================================
export interface BusinessHoursScheduleDay {
  enabled: boolean;
  start: string;
  end: string;
}

export interface BusinessHoursConfig {
  enabled: boolean;
  timezone: string;
  schedule: {
    monday: BusinessHoursScheduleDay;
    tuesday: BusinessHoursScheduleDay;
    wednesday: BusinessHoursScheduleDay;
    thursday: BusinessHoursScheduleDay;
    friday: BusinessHoursScheduleDay;
    saturday: BusinessHoursScheduleDay;
    sunday: BusinessHoursScheduleDay;
  };
}

export interface AutoAssignmentConfig {
  enabled: boolean;
  max_conversations_per_agent: number;
}

export interface AISettingsConfig {
  enabled: boolean;
  auto_response_enabled: boolean;
  auto_response_delay_seconds: number;
  suggested_replies_enabled: boolean;
  auto_tagging_enabled: boolean;
  summary_enabled: boolean;
  sentiment_enabled: boolean;
  anthropic_api_key?: string | null;
  model?: string;
}

export interface Article {
  id: string;
  workspace_id: string;
  title: string;
  category: string;
  summary: string | null;
  content: string;
  created_at: string;
}

export interface Workspace {
  id: string;
  name: string;
  website_url: string | null;
  brand_color: string;
  greeting_title: string;
  greeting_message: string;
  owner_id: string;
  logo_url?: string | null;
  widget_position?: 'right' | 'left';
  business_hours?: BusinessHoursConfig;
  auto_assignment?: AutoAssignmentConfig;
  ai_settings?: AISettingsConfig;
  created_at: string;
}

export interface WorkspaceIntegration {
  id: string;
  workspace_id: string;
  langgraph_enabled: boolean;
  langgraph_webhook_url: string | null;
  langgraph_api_key: string | null;
  langgraph_system_prompt: string | null;
  langgraph_auto_pilot: boolean;
  whatsapp_enabled: boolean;
  whatsapp_phone_number_id: string | null;
  whatsapp_access_token: string | null;
  whatsapp_business_account_id: string | null;
  meta_enabled: boolean;
  meta_page_access_token: string | null;
  meta_verify_token: string | null;
  meta_app_secret: string | null;
  linkedin_enabled: boolean;
  linkedin_access_token: string | null;
  linkedin_organization_urn: string | null;
  slack_enabled?: boolean;
  slack_webhook_url?: string | null;
  email_offline_notifications?: boolean;
  created_at?: string;
  updated_at?: string;
}

// ============================================================================
// Full Database generic for Supabase v2 clients
// ============================================================================
export interface Database {
  public: {
    Tables: {
      visitors: {
        Row: Visitor;
        Insert: Partial<Visitor>;
        Update: Partial<Visitor>;
        Relationships: [];
      };
      agents: {
        Row: Agent;
        Insert: Partial<Agent>;
        Update: Partial<Agent>;
        Relationships: [];
      };
      conversations: {
        Row: Conversation;
        Insert: Partial<Conversation>;
        Update: Partial<Conversation>;
        Relationships: [];
      };
      messages: {
        Row: Message;
        Insert: Partial<Message>;
        Update: Partial<Message>;
        Relationships: [];
      };
      conversation_tags: {
        Row: ConversationTag;
        Insert: Partial<ConversationTag>;
        Update: Partial<ConversationTag>;
        Relationships: [];
      };
      internal_notes: {
        Row: InternalNote;
        Insert: Partial<InternalNote>;
        Update: Partial<InternalNote>;
        Relationships: [];
      };
      canned_responses: {
        Row: CannedResponse;
        Insert: Partial<CannedResponse>;
        Update: Partial<CannedResponse>;
        Relationships: [];
      };
      visitor_page_history: {
        Row: VisitorPageHistory;
        Insert: Partial<VisitorPageHistory>;
        Update: Partial<VisitorPageHistory>;
        Relationships: [];
      };
      workspaces: {
        Row: Workspace;
        Insert: Partial<Workspace>;
        Update: Partial<Workspace>;
        Relationships: [];
      };
      workspace_integrations: {
        Row: WorkspaceIntegration;
        Insert: Partial<WorkspaceIntegration>;
        Update: Partial<WorkspaceIntegration>;
        Relationships: [];
      };
      [key: string]: {
        Row: any;
        Insert: any;
        Update: any;
        Relationships: any[];
      };
    };
    Views: {
      [key: string]: {
        Row: any;
      };
    };
    Functions: {
      [key: string]: {
        Args: any;
        Returns: any;
      };
    };
    Enums: {
      [key: string]: any;
    };
    CompositeTypes: {
      [key: string]: any;
    };
  };
}
