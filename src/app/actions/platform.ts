'use server';

import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { Workspace, Agent, SuperAdminAuditLog } from '@/types/database';
import { generateUniqueWorkspaceSlug } from '@/lib/slug';

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
 * Server-side guard: Ensures caller is an authenticated platform super admin
 * Checks is_super_admin stored in the database.
 */
async function assertSuperAdmin(): Promise<{ user: any; agent: Agent }> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('401 Unauthorized: Authentication required.');
  }

  const { data: agent, error: agentError } = await supabase
    .from('agents')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (agentError || !agent || !agent.is_super_admin) {
    throw new Error('403 Forbidden: Platform super admin privileges required.');
  }

  return { user, agent: agent as Agent };
}

/**
 * Inserts an immutable audit log record for super admin actions
 */
async function recordSuperAdminAudit(params: {
  admin: Agent;
  action: string;
  workspaceId?: string | null;
  workspaceName?: string | null;
  details?: Record<string, any>;
}) {
  try {
    const supabase = await createClient();
    await supabase.from('super_admin_audit_logs').insert({
      admin_id: params.admin.id,
      admin_email: params.admin.email,
      admin_name: params.admin.name || null,
      action: params.action,
      workspace_id: params.workspaceId || null,
      workspace_name: params.workspaceName || null,
      details: params.details || {},
    });
  } catch (err) {
    console.error('Failed to write super admin audit log:', err);
  }
}

/**
 * Retrieves platform-wide summary of all registered companies and their aggregated data
 */
export async function getPlatformCompaniesAction(): Promise<PlatformCompaniesData> {
  const { agent } = await assertSuperAdmin();
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
  const { agent } = await assertSuperAdmin();
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

  await recordSuperAdminAudit({
    admin: agent,
    action: 'view_company_drilldown',
    workspaceId,
    workspaceName: workspace?.name || null,
    details: {
      agents_count: agents?.length || 0,
      recent_conversations_count: recentConversations?.length || 0,
    },
  });

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
  const { user, agent } = await assertSuperAdmin();
  const supabase = await createClient();

  const slug = await generateUniqueWorkspaceSlug(supabase, data.name.trim());

  const { data: newWs, error } = await supabase
    .from('workspaces')
    .insert({
      name: data.name.trim(),
      website_url: data.website_url?.trim() || null,
      brand_color: data.brand_color || '#2563eb',
      greeting_title: data.greeting_title?.trim() || 'Welcome to Support! 👋',
      greeting_message: data.greeting_message?.trim() || 'How can our team help you today?',
      owner_id: user.id,
      slug,
      slug_changes_count: 0,
      slug_changed_at: null,
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

  await recordSuperAdminAudit({
    admin: agent,
    action: 'create_company',
    workspaceId: newWs.id,
    workspaceName: newWs.name,
    details: {
      website_url: newWs.website_url,
      brand_color: newWs.brand_color,
    },
  });

  return { success: true, workspace: newWs as Workspace };
}

/**
 * Super Admin Action: Switch into another company's workspace
 * Writes an audit log record and stores viewing state in an HTTP-only cookie.
 */
export async function switchWorkspaceAction(params: {
  workspaceId: string;
  workspaceName?: string;
}) {
  const { agent } = await assertSuperAdmin();
  const supabase = await createClient();

  const { data: workspace, error } = await supabase
    .from('workspaces')
    .select('*')
    .eq('id', params.workspaceId)
    .single();

  if (error || !workspace) {
    throw new Error('Workspace not found or inaccessible.');
  }

  // Record audit log
  await recordSuperAdminAudit({
    admin: agent,
    action: 'switch_workspace',
    workspaceId: workspace.id,
    workspaceName: workspace.name,
    details: {
      previous_workspace_id: agent.workspace_id || null,
      switched_at: new Date().toISOString(),
    },
  });

  // Set cookie for dashboard viewing
  const cookieStore = await cookies();
  cookieStore.set('super_admin_viewing_workspace_id', workspace.id, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
  });

  return {
    success: true,
    workspace: workspace as Workspace,
  };
}

/**
 * Super Admin Action: Exit viewing another workspace and revert to native view
 */
export async function exitSuperAdminWorkspaceViewAction() {
  const { agent } = await assertSuperAdmin();
  const cookieStore = await cookies();
  const prevViewingId = cookieStore.get('super_admin_viewing_workspace_id')?.value;

  cookieStore.delete('super_admin_viewing_workspace_id');

  if (prevViewingId) {
    await recordSuperAdminAudit({
      admin: agent,
      action: 'exit_switched_workspace',
      workspaceId: prevViewingId,
      details: {
        exited_at: new Date().toISOString(),
      },
    });
  }

  return { success: true };
}

/**
 * Super Admin Action: Get super admin audit logs
 */
export async function getSuperAdminAuditLogsAction(options: {
  limit?: number;
  offset?: number;
  actionFilter?: string;
} = {}): Promise<{ logs: SuperAdminAuditLog[]; totalCount: number }> {
  await assertSuperAdmin();
  const supabase = await createClient();

  const limit = options.limit || 50;
  const offset = options.offset || 0;

  let query = supabase
    .from('super_admin_audit_logs')
    .select('*', { count: 'exact' });

  if (options.actionFilter && options.actionFilter !== 'all') {
    query = query.eq('action', options.actionFilter);
  }

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error(`Failed to load super admin audit logs: ${error.message}`);
  }

  return {
    logs: (data || []) as SuperAdminAuditLog[],
    totalCount: count || 0,
  };
}
