'use server';

import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { serviceClient } from '@/lib/supabase/service';
import { Workspace, Agent, SuperAdminAuditLog } from '@/types/database';
import { generateUniqueWorkspaceSlug } from '@/lib/slug';

export interface CompanyPlanLimits {
  max_seats: number;
  max_monthly_conversations: number;
  max_ai_replies: number;
}

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
  ai_settings?: any;
  ai_enabled: boolean;
  help_center_tab_label: string;
  show_help_tab: boolean;
  created_at: string;
  owner_id: string;
  owner_email: string | null;
  is_suspended: boolean;
  suspended_at: string | null;
  suspension_reason: string | null;
  deleted_at: string | null;
  plan: string;
  plan_limits: CompanyPlanLimits;
  merged_into_workspace_id: string | null;
  conversations_count: number;
  open_conversations_count: number;
  closed_conversations_count: number;
  messages_count: number;
  visitors_count: number;
  active_visitors_count: number;
  agents_count: number;
  articles_count: number;
  published_articles_count: number;
  total_article_views: number;
  widget_installed: boolean;
  last_activity_at: string | null;
  health_flags?: string[];
  csat_score?: number | null;
  csat_count?: number;
  unanswered_older_24h_count?: number;
  knowledge_gaps_count?: number;
}

export interface PlatformAnalyticsTimeSeriesPoint {
  date: string;
  formatted_date: string;
  new_companies: number;
  conversations: number;
  messages: number;
  visitors: number;
  ai_replies: number;
  estimated_ai_cost: number;
}

export interface PlatformWeeklyCompanyPoint {
  week_start: string;
  week_label: string;
  new_companies: number;
}

export interface PlatformTopCompany {
  id: string;
  name: string;
  website_url: string | null;
  brand_color: string;
  plan: string;
  conversations_count: number;
  messages_count: number;
  visitors_count: number;
  share_percent: number;
}

export interface PlatformAnalyticsData {
  range_days: number;
  start_date: string;
  end_date: string;
  time_series: PlatformAnalyticsTimeSeriesPoint[];
  weekly_companies: PlatformWeeklyCompanyPoint[];
  active_companies_7d_count: number;
  total_companies_count: number;
  active_companies_7d_percent: number;
  top_10_companies: PlatformTopCompany[];
  totals: {
    total_conversations: number;
    total_messages: number;
    total_visitors: number;
    total_ai_replies: number;
    total_new_companies: number;
  };
  total_estimated_ai_cost: number;
}

export interface CompanyAnalyticsData {
  workspace_id: string;
  workspace_name: string;
  range_days: number;
  conversations_per_day: Array<{
    date: string;
    formatted_date: string;
    conversations: number;
    messages: number;
    ai_replies: number;
    agent_replies: number;
  }>;
  total_conversations: number;
  open_conversations_count: number;
  resolved_conversations_count: number;
  resolution_rate_percent: number;
  avg_first_response_time_seconds: number | null;
  avg_resolution_time_seconds: number | null;
  csat_score: number | null;
  csat_ratings_count: number;
  csat_positive_percent: number | null;
  ai_only_chats_count: number;
  ai_only_chats_percent: number;
  ai_handover_chats_count: number;
  ai_handover_percent: number;
  unanswered_older_24h_count: number;
  unanswered_older_24h_list: Array<{
    id: string;
    created_at: string;
    waiting_hours: number;
    visitor_name: string;
    channel: string;
  }>;
  knowledge_gaps_count: number;
  knowledge_gaps_sample: Array<{
    id: string;
    question: string;
    times_asked: number;
    last_asked_at: string;
  }>;
  health_flags: string[];
  widget_installed: boolean;
  agent_online_7d: boolean;
  published_articles_count: number;
}

export interface OrphanAgent {
  id: string;
  name: string;
  email: string;
  role: string;
  is_super_admin: boolean;
  created_at: string;
  workspace_id: string | null;
  issue_reason: string;
}

export interface OrphanConversation {
  id: string;
  visitor_id: string;
  status: string;
  channel: string;
  created_at: string;
  updated_at: string;
  workspace_id: string | null;
  issue_reason: string;
}

export interface OrphanMessage {
  id: string;
  conversation_id: string;
  sender_type: string;
  created_at: string;
  content_preview: string;
  issue_reason: string;
}

export interface OrphanVisitor {
  id: string;
  name: string | null;
  email: string | null;
  current_url: string | null;
  location: string | null;
  last_seen: string;
  created_at: string;
  workspace_id: string | null;
  issue_reason: string;
}

export interface PlatformDataIssues {
  total_orphan_count: number;
  orphan_agents: OrphanAgent[];
  orphan_conversations: OrphanConversation[];
  orphan_messages: OrphanMessage[];
  orphan_visitors: OrphanVisitor[];
}

export interface PlatformCompaniesData {
  total_companies: number;
  total_conversations: number;
  total_messages: number;
  total_visitors: number;
  total_agents: number;
  total_articles: number;
  active_companies_7d?: number;
  active_companies_7d_percent?: number;
  companies: CompanyMetricItem[];
  data_issues?: PlatformDataIssues;
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
 * Retrieves time-series and aggregate platform analytics for the platform owner
 */
export async function getPlatformAnalyticsAction(days: number = 30): Promise<PlatformAnalyticsData> {
  const { agent } = await assertSuperAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('fn_get_platform_analytics', {
    p_days: days,
  });

  if (error) {
    throw new Error(`Failed to load platform analytics: ${error.message}`);
  }

  return data as PlatformAnalyticsData;
}

/**
 * Retrieves deep performance analytics and health diagnostics for a specific company
 */
export async function getCompanyAnalyticsAction(
  workspaceId: string,
  days: number = 30
): Promise<CompanyAnalyticsData> {
  const { agent } = await assertSuperAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('fn_get_company_analytics', {
    p_workspace_id: workspaceId,
    p_days: days,
  });

  if (error) {
    throw new Error(`Failed to load company analytics: ${error.message}`);
  }

  return data as CompanyAnalyticsData;
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
    { count: visitorsCount },
    { count: activeVisitorsCount },
    { data: articles },
  ] = await Promise.all([
    supabase.from('workspaces').select('*').eq('id', workspaceId).maybeSingle(),
    supabase.from('agents').select('*').eq('workspace_id', workspaceId).order('created_at', { ascending: false }),
    supabase
      .from('conversations')
      .select('id, visitor_id, status, created_at, updated_at, channel, visitor:visitors(name, email, location)')
      .eq('workspace_id', workspaceId)
      .order('updated_at', { ascending: false })
      .limit(20),
    supabase
      .from('visitors')
      .select('id, name, email, current_url, current_page_url, location, ip_location_city, ip_location_country, last_seen, last_seen_at, is_online, visit_count, first_seen, first_seen_at')
      .eq('workspace_id', workspaceId)
      .order('last_seen', { ascending: false })
      .limit(20),
    supabase
      .from('visitors')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId),
    supabase
      .from('visitors')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .gt('last_seen', new Date(Date.now() - 30 * 60 * 1000).toISOString()),
    supabase
      .from('articles')
      .select('id, title, status, views_count, helpful_count, created_at')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  // 1. Sort conversations by last activity (updated_at || created_at), newest first
  const sortedConversations = [...(recentConversations || [])].sort((a: any, b: any) => {
    const timeA = new Date(a.updated_at || a.created_at || 0).getTime();
    const timeB = new Date(b.updated_at || b.created_at || 0).getTime();
    return timeB - timeA;
  });

  // 2. Format and sort visitors from the same workspace visitor source
  const sortedVisitors = [...(recentVisitors || [])]
    .map((v: any) => ({
      ...v,
      current_url: v.current_url || v.current_page_url || '/',
      location: v.location || [v.ip_location_city, v.ip_location_country].filter(Boolean).join(', ') || null,
      last_seen: v.last_seen || v.last_seen_at || v.first_seen || v.first_seen_at,
      is_browsing_now:
        (Date.now() - new Date(v.last_seen || v.last_seen_at || 0).getTime()) <= 30 * 60 * 1000,
    }))
    .sort((a: any, b: any) => {
      const timeA = new Date(a.last_seen || 0).getTime();
      const timeB = new Date(b.last_seen || 0).getTime();
      return timeB - timeA;
    });

  await recordSuperAdminAudit({
    admin: agent,
    action: 'view_company_drilldown',
    workspaceId,
    workspaceName: workspace?.name || null,
    details: {
      agents_count: agents?.length || 0,
      recent_conversations_count: sortedConversations.length,
      visitors_count: visitorsCount || 0,
      active_visitors_count: activeVisitorsCount || 0,
    },
  });

  return {
    workspace: workspace as Workspace | null,
    agents: (agents || []) as Agent[],
    recentConversations: sortedConversations,
    recentVisitors: sortedVisitors,
    visitorsCount: visitorsCount || 0,
    activeVisitorsCount: activeVisitorsCount || 0,
    articles: articles || [],
  };
}

/**
 * Helper: Finds an existing agent by email or creates/invites an agent account
 */
async function findOrCreateOwnerAgent(
  ownerEmail: string,
  workspaceId?: string,
  name?: string
): Promise<{ id: string; email: string }> {
  const adminClient = serviceClient();
  const normalizedEmail = ownerEmail.trim().toLowerCase();

  // 1. Check if agent already exists
  const { data: existingAgent } = await adminClient
    .from('agents')
    .select('id, email, workspace_id, role')
    .eq('email', normalizedEmail)
    .maybeSingle();

  if (existingAgent) {
    if (workspaceId) {
      await adminClient
        .from('agents')
        .update({
          role: 'owner',
          workspace_id: workspaceId,
        })
        .eq('id', existingAgent.id);
    }
    return { id: existingAgent.id, email: existingAgent.email };
  }

  // 2. Try inviting or creating in Supabase Auth
  let targetUserId: string | null = null;
  const displayName = name || normalizedEmail.split('@')[0];

  try {
    const { data: inviteData } = await adminClient.auth.admin.inviteUserByEmail(
      normalizedEmail,
      {
        data: {
          name: displayName,
          workspace_id: workspaceId,
          role: 'owner',
        },
      }
    );
    if (inviteData?.user?.id) {
      targetUserId = inviteData.user.id;
    }
  } catch (err) {
    // invite fallback
  }

  if (!targetUserId) {
    try {
      const { data: createData } = await adminClient.auth.admin.createUser({
        email: normalizedEmail,
        email_confirm: true,
        user_metadata: {
          name: displayName,
          workspace_id: workspaceId,
          role: 'owner',
        },
      });
      if (createData?.user?.id) {
        targetUserId = createData.user.id;
      }
    } catch (err) {
      // ignore
    }
  }

  if (!targetUserId) {
    targetUserId = crypto.randomUUID();
  }

  // 3. Upsert agent profile
  await adminClient.from('agents').upsert(
    {
      id: targetUserId,
      email: normalizedEmail,
      name: displayName,
      role: 'owner',
      status: 'offline',
      workspace_id: workspaceId || null,
    },
    { onConflict: 'id' }
  );

  return { id: targetUserId, email: normalizedEmail };
}

/**
 * Registers a brand new company/workspace from the platform admin panel
 * Requires an owner email, creates/invites owner agent, sets initial plan and limits.
 */
export async function createCompanyAction(data: {
  name: string;
  owner_email: string;
  website_url?: string;
  brand_color?: string;
  greeting_title?: string;
  greeting_message?: string;
  plan?: string;
  plan_limits?: {
    max_seats?: number;
    max_monthly_conversations?: number;
    max_ai_replies?: number;
  };
}) {
  const { agent } = await assertSuperAdmin();
  const supabase = await createClient();

  if (!data.name?.trim()) {
    throw new Error('Company name is required.');
  }
  if (!data.owner_email?.trim()) {
    throw new Error('Owner email is required to create a new company.');
  }

  const normalizedOwnerEmail = data.owner_email.trim().toLowerCase();

  // Find or create owner user
  const owner = await findOrCreateOwnerAgent(normalizedOwnerEmail, undefined, data.name.trim() + ' Admin');

  const slug = await generateUniqueWorkspaceSlug(supabase, data.name.trim());

  const defaultLimits: CompanyPlanLimits = {
    max_seats: data.plan_limits?.max_seats ?? 5,
    max_monthly_conversations: data.plan_limits?.max_monthly_conversations ?? 1000,
    max_ai_replies: data.plan_limits?.max_ai_replies ?? 500,
  };

  const { data: newWs, error } = await supabase
    .from('workspaces')
    .insert({
      name: data.name.trim(),
      website_url: data.website_url?.trim() || null,
      brand_color: data.brand_color || '#2563eb',
      greeting_title: data.greeting_title?.trim() || 'Welcome to Support! 👋',
      greeting_message: data.greeting_message?.trim() || 'How can our team help you today?',
      owner_id: owner.id,
      slug,
      slug_changes_count: 0,
      slug_changed_at: null,
      widget_position: 'right',
      help_center_tab_label: 'Help Center',
      show_help_tab: true,
      help_center_tab_icon: '📖',
      plan: data.plan || 'free',
      plan_limits: defaultLimits,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create company workspace: ${error.message}`);
  }

  // Ensure owner agent points to this new workspace
  const adminClient = serviceClient();
  await adminClient.from('agents').update({ workspace_id: newWs.id }).eq('id', owner.id);

  await recordSuperAdminAudit({
    admin: agent,
    action: 'create_company',
    workspaceId: newWs.id,
    workspaceName: newWs.name,
    details: {
      owner_email: normalizedOwnerEmail,
      owner_id: owner.id,
      website_url: newWs.website_url,
      brand_color: newWs.brand_color,
      plan: newWs.plan,
    },
  });

  return { success: true, workspace: newWs as Workspace, owner_email: normalizedOwnerEmail };
}

/**
 * Super Admin Action: Suspend a company workspace
 * Immediately blocks the widget and agent logins while preserving all data.
 */
export async function suspendCompanyAction(workspaceId: string, reason?: string) {
  const { agent } = await assertSuperAdmin();
  const supabase = await createClient();

  const { data: ws, error: fetchErr } = await supabase
    .from('workspaces')
    .select('id, name')
    .eq('id', workspaceId)
    .single();

  if (fetchErr || !ws) {
    throw new Error('Workspace not found.');
  }

  const suspensionReason = reason?.trim() || 'Suspended by Super Admin';

  const { error } = await supabase
    .from('workspaces')
    .update({
      is_suspended: true,
      suspended_at: new Date().toISOString(),
      suspension_reason: suspensionReason,
    })
    .eq('id', workspaceId);

  if (error) {
    throw new Error(`Failed to suspend company: ${error.message}`);
  }

  await recordSuperAdminAudit({
    admin: agent,
    action: 'suspend_company',
    workspaceId,
    workspaceName: ws.name,
    details: { reason: suspensionReason },
  });

  return { success: true };
}

/**
 * Super Admin Action: Reactivate a suspended company workspace
 */
export async function reactivateCompanyAction(workspaceId: string) {
  const { agent } = await assertSuperAdmin();
  const supabase = await createClient();

  const { data: ws, error: fetchErr } = await supabase
    .from('workspaces')
    .select('id, name')
    .eq('id', workspaceId)
    .single();

  if (fetchErr || !ws) {
    throw new Error('Workspace not found.');
  }

  const { error } = await supabase
    .from('workspaces')
    .update({
      is_suspended: false,
      suspended_at: null,
      suspension_reason: null,
    })
    .eq('id', workspaceId);

  if (error) {
    throw new Error(`Failed to reactivate company: ${error.message}`);
  }

  await recordSuperAdminAudit({
    admin: agent,
    action: 'reactivate_company',
    workspaceId,
    workspaceName: ws.name,
    details: {},
  });

  return { success: true };
}

/**
 * Super Admin Action: Soft-delete a company workspace (retained for 30 days)
 */
export async function softDeleteCompanyAction(workspaceId: string) {
  const { agent } = await assertSuperAdmin();
  const supabase = await createClient();

  const { data: ws, error: fetchErr } = await supabase
    .from('workspaces')
    .select('id, name')
    .eq('id', workspaceId)
    .single();

  if (fetchErr || !ws) {
    throw new Error('Workspace not found.');
  }

  const { error } = await supabase
    .from('workspaces')
    .update({
      deleted_at: new Date().toISOString(),
      is_suspended: true,
      suspension_reason: 'Soft deleted (30-day recovery window)',
    })
    .eq('id', workspaceId);

  if (error) {
    throw new Error(`Failed to delete company: ${error.message}`);
  }

  await recordSuperAdminAudit({
    admin: agent,
    action: 'soft_delete_company',
    workspaceId,
    workspaceName: ws.name,
    details: { retention_days: 30 },
  });

  return { success: true };
}

/**
 * Super Admin Action: Restore a soft-deleted company workspace
 */
export async function restoreCompanyAction(workspaceId: string) {
  const { agent } = await assertSuperAdmin();
  const supabase = await createClient();

  const { data: ws, error: fetchErr } = await supabase
    .from('workspaces')
    .select('id, name')
    .eq('id', workspaceId)
    .single();

  if (fetchErr || !ws) {
    throw new Error('Workspace not found.');
  }

  const { error } = await supabase
    .from('workspaces')
    .update({
      deleted_at: null,
      is_suspended: false,
      suspension_reason: null,
    })
    .eq('id', workspaceId);

  if (error) {
    throw new Error(`Failed to restore company: ${error.message}`);
  }

  await recordSuperAdminAudit({
    admin: agent,
    action: 'restore_company',
    workspaceId,
    workspaceName: ws.name,
    details: {},
  });

  return { success: true };
}

/**
 * Super Admin Action: Assign or change company owner by email
 */
export async function assignWorkspaceOwnerAction(workspaceId: string, ownerEmail: string) {
  const { agent } = await assertSuperAdmin();
  const supabase = await createClient();

  if (!ownerEmail || !ownerEmail.trim()) {
    throw new Error('Owner email is required.');
  }

  const { data: ws, error: fetchErr } = await supabase
    .from('workspaces')
    .select('id, name, owner_id')
    .eq('id', workspaceId)
    .single();

  if (fetchErr || !ws) {
    throw new Error('Workspace not found.');
  }

  const normalizedEmail = ownerEmail.trim().toLowerCase();
  const owner = await findOrCreateOwnerAgent(normalizedEmail, workspaceId, ws.name + ' Owner');

  const { error: updateErr } = await supabase
    .from('workspaces')
    .update({ owner_id: owner.id })
    .eq('id', workspaceId);

  if (updateErr) {
    throw new Error(`Failed to update workspace owner: ${updateErr.message}`);
  }

  await recordSuperAdminAudit({
    admin: agent,
    action: 'assign_workspace_owner',
    workspaceId,
    workspaceName: ws.name,
    details: {
      previous_owner_id: ws.owner_id,
      new_owner_id: owner.id,
      new_owner_email: normalizedEmail,
    },
  });

  return { success: true, owner_email: normalizedEmail, owner_id: owner.id };
}

/**
 * Super Admin Action: Edit company name, domain, plan and limits
 */
export async function updateCompanySettingsAction(
  workspaceId: string,
  data: {
    name: string;
    website_url?: string | null;
    plan: string;
    plan_limits: CompanyPlanLimits;
  }
) {
  const { agent } = await assertSuperAdmin();
  const supabase = await createClient();

  if (!data.name?.trim()) {
    throw new Error('Company name is required.');
  }

  const { data: ws, error: fetchErr } = await supabase
    .from('workspaces')
    .select('id, name, plan, plan_limits')
    .eq('id', workspaceId)
    .single();

  if (fetchErr || !ws) {
    throw new Error('Workspace not found.');
  }

  const updatePayload = {
    name: data.name.trim(),
    website_url: data.website_url ? data.website_url.trim() : null,
    plan: data.plan || 'free',
    plan_limits: {
      max_seats: Math.max(1, Number(data.plan_limits?.max_seats || 5)),
      max_monthly_conversations: Math.max(0, Number(data.plan_limits?.max_monthly_conversations || 1000)),
      max_ai_replies: Math.max(0, Number(data.plan_limits?.max_ai_replies || 500)),
    },
  };

  const { data: updated, error: updateErr } = await supabase
    .from('workspaces')
    .update(updatePayload)
    .eq('id', workspaceId)
    .select()
    .single();

  if (updateErr) {
    throw new Error(`Failed to update company settings: ${updateErr.message}`);
  }

  await recordSuperAdminAudit({
    admin: agent,
    action: 'update_company_settings',
    workspaceId,
    workspaceName: updated.name,
    details: {
      previous_plan: ws.plan,
      new_plan: updated.plan,
      plan_limits: updated.plan_limits,
    },
  });

  return { success: true, workspace: updated as Workspace };
}

/**
 * Super Admin Action: Merge two duplicate workspaces
 */
export async function mergeWorkspacesAction(params: {
  sourceWorkspaceId: string;
  targetWorkspaceId: string;
}) {
  const { agent } = await assertSuperAdmin();
  const supabase = await createClient();

  if (params.sourceWorkspaceId === params.targetWorkspaceId) {
    throw new Error('Cannot merge a workspace into itself.');
  }

  const [{ data: sourceWs }, { data: targetWs }] = await Promise.all([
    supabase.from('workspaces').select('id, name').eq('id', params.sourceWorkspaceId).maybeSingle(),
    supabase.from('workspaces').select('id, name').eq('id', params.targetWorkspaceId).maybeSingle(),
  ]);

  if (!sourceWs) throw new Error('Source workspace not found.');
  if (!targetWs) throw new Error('Target workspace not found.');

  const { data: result, error } = await supabase.rpc('fn_merge_workspaces', {
    p_source_id: params.sourceWorkspaceId,
    p_target_id: params.targetWorkspaceId,
  });

  if (error) {
    throw new Error(`Failed to merge workspaces: ${error.message}`);
  }

  await recordSuperAdminAudit({
    admin: agent,
    action: 'merge_workspaces',
    workspaceId: params.targetWorkspaceId,
    workspaceName: targetWs.name,
    details: {
      source_workspace_id: params.sourceWorkspaceId,
      source_workspace_name: sourceWs.name,
      target_workspace_id: params.targetWorkspaceId,
      target_workspace_name: targetWs.name,
      merge_stats: result,
    },
  });

  return {
    success: true,
    result,
  };
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
