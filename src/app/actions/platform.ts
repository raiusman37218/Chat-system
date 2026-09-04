'use server';

import { createClient } from '@/lib/supabase/server';
import { Workspace, Agent } from '@/types/database';

export interface CompanyMetricItem {
  id: string;
  name: string;
  website_url: string | null;
  brand_color: string;
  logo_url: string | null;
  widget_position: string;
  greeting_title: string | null;
  greeting_message: string | null;
  business_hours: any;
  auto_assignment: any;
  help_center_tab_label: string;
  show_help_tab: boolean;
  created_at: string;
  owner_id: string;
  conversations_count: number;
  open_conversations_count: number;
  closed_conversations_count: number;
  messages_count: number;
  visitors_count: number;
  active_visitors_count: number;
  agents_count: number;
  articles_count: number;
  total_article_views: number;
}

export interface PlatformCompaniesData {
  total_companies: number;
  total_conversations: number;
  total_messages: number;
  total_visitors: number;
  total_agents: number;
  total_articles: number;
  companies: CompanyMetricItem[];
}

/**
 * Ensures caller is an authenticated user
 */
async function assertAuthenticated(): Promise<{ user: any; agent: Agent | null }> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('Unauthorized: Authentication required.');
  }

  const { data: agent } = await supabase
    .from('agents')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  return { user, agent: agent as Agent | null };
}

/**
 * Retrieves platform-wide summary of all registered companies and their aggregated data
 */
export async function getPlatformCompaniesAction(): Promise<PlatformCompaniesData> {
  await assertAuthenticated();
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('fn_get_platform_companies_summary');

  if (error) {
    throw new Error(`Failed to load platform companies: ${error.message}`);
  }

  return data as PlatformCompaniesData;
}

/**
 * Loads deep drill-down details for a specific company
 */
export async function getCompanyDrilldownAction(workspaceId: string) {
  await assertAuthenticated();
  const supabase = await createClient();

  const [
    { data: workspace },
    { data: agents },
    { data: recentConversations },
    { data: recentVisitors },
    { data: articles },
  ] = await Promise.all([
    supabase.from('workspaces').select('*').eq('id', workspaceId).maybeSingle(),
    supabase.from('agents').select('*').eq('workspace_id', workspaceId).order('created_at', { ascending: false }),
    supabase
      .from('conversations')
      .select('id, visitor_id, status, created_at, updated_at, channel, visitor:visitors(name, email, location)')
      .eq('workspace_id', workspaceId)
      .order('updated_at', { ascending: false })
      .limit(10),
    supabase
      .from('visitors')
      .select('id, name, email, current_url, location, last_seen, created_at')
      .eq('workspace_id', workspaceId)
      .order('last_seen', { ascending: false })
      .limit(10),
    supabase
      .from('articles')
      .select('id, title, status, views_count, helpful_count, created_at')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  return {
    workspace: workspace as Workspace | null,
    agents: (agents || []) as Agent[],
    recentConversations: recentConversations || [],
    recentVisitors: recentVisitors || [],
    articles: articles || [],
  };
}

/**
 * Registers a brand new company/workspace from the platform admin panel
 */
export async function createCompanyAction(data: {
  name: string;
  website_url?: string;
  brand_color?: string;
  greeting_title?: string;
  greeting_message?: string;
}) {
  const { user } = await assertAuthenticated();
  const supabase = await createClient();

  const { data: newWs, error } = await supabase
    .from('workspaces')
    .insert({
      name: data.name.trim(),
      website_url: data.website_url?.trim() || null,
      brand_color: data.brand_color || '#2563eb',
      greeting_title: data.greeting_title?.trim() || 'Welcome to Support! 👋',
      greeting_message: data.greeting_message?.trim() || 'How can our team help you today?',
      owner_id: user.id,
      widget_position: 'right',
      help_center_tab_label: 'Help Center',
      show_help_tab: true,
      help_center_tab_icon: '📖',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create company workspace: ${error.message}`);
  }

  return { success: true, workspace: newWs as Workspace };
}
