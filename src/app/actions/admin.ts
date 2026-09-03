'use server';

import { createClient } from '@/lib/supabase/server';
import {
  Workspace,
  Agent,
  CannedResponse,
  BusinessHoursConfig,
  AutoAssignmentConfig,
  AISettingsConfig,
} from '@/types/database';

/**
 * Ensures the requesting user is authenticated and has 'admin' or 'owner' role.
 */
async function assertAdminUser(workspaceId: string): Promise<{ user: any; agent: Agent }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    throw new Error('Unauthorized: Authentication required.');
  }

  const { data: agent, error: agentErr } = await supabase
    .from('agents')
    .select('*')
    .eq('id', user.id)
    .single();

  if (agentErr || !agent) {
    throw new Error('Forbidden: Agent profile not found.');
  }

  if (agent.role !== 'admin' && agent.role !== 'owner') {
    throw new Error('Forbidden: Only administrators can access admin settings.');
  }

  return { user, agent: agent as Agent };
}

/**
 * Fetch all admin settings data for the given workspace in a single round-trip.
 */
export async function getAdminDataAction(workspaceId: string) {
  await assertAdminUser(workspaceId);
  const supabase = await createClient();

  const [{ data: workspace }, { data: agents }, { data: cannedResponses }] = await Promise.all([
    supabase.from('workspaces').select('*').eq('id', workspaceId).single(),
    supabase.from('agents').select('*').eq('workspace_id', workspaceId).order('name'),
    supabase
      .from('canned_responses')
      .select('*')
      .or(`workspace_id.eq.${workspaceId},workspace_id.is.null`)
      .order('shortcut'),
  ]);

  return {
    workspace: workspace as Workspace | null,
    agents: (agents as Agent[]) || [],
    cannedResponses: (cannedResponses as CannedResponse[]) || [],
  };
}

/**
 * SECTION 1: Widget Customization
 */
export async function updateWidgetSettingsAction(
  workspaceId: string,
  data: {
    brand_color?: string;
    logo_url?: string | null;
    widget_position?: 'right' | 'left';
    greeting_title?: string;
    greeting_message?: string;
    help_center_tab_label?: string;
    show_help_tab?: boolean;
    help_center_tab_icon?: string;
  }
) {
  await assertAdminUser(workspaceId);
  const supabase = await createClient();

  const updatePayload: any = {
    brand_color: data.brand_color,
    logo_url: data.logo_url,
    widget_position: data.widget_position || 'right',
    greeting_title: data.greeting_title,
    greeting_message: data.greeting_message,
  };

  if (data.help_center_tab_label !== undefined) {
    updatePayload.help_center_tab_label = data.help_center_tab_label;
  }
  if (data.show_help_tab !== undefined) {
    updatePayload.show_help_tab = data.show_help_tab;
  }
  if (data.help_center_tab_icon !== undefined) {
    updatePayload.help_center_tab_icon = data.help_center_tab_icon;
  }

  const { data: updated, error } = await supabase
    .from('workspaces')
    .update(updatePayload)
    .eq('id', workspaceId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return { success: true, workspace: updated as Workspace };
}

/**
 * SECTION 2: Business Hours
 */
export async function updateBusinessHoursAction(
  workspaceId: string,
  businessHours: BusinessHoursConfig
) {
  await assertAdminUser(workspaceId);
  const supabase = await createClient();

  const { data: updated, error } = await supabase
    .from('workspaces')
    .update({
      business_hours: businessHours,
    })
    .eq('id', workspaceId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return { success: true, workspace: updated as Workspace };
}

/**
 * SECTION 3: Team Management
 */
export async function inviteAgentAction(
  workspaceId: string,
  data: {
    name: string;
    email: string;
    role: 'admin' | 'agent';
  }
) {
  await assertAdminUser(workspaceId);
  const supabase = await createClient();

  // Create an invited agent entry
  const { data: inserted, error } = await supabase
    .from('agents')
    .insert({
      workspace_id: workspaceId,
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      role: data.role,
      status: 'offline',
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return { success: true, agent: inserted as Agent };
}

export async function updateAgentRoleAction(
  workspaceId: string,
  agentId: string,
  role: 'admin' | 'agent'
) {
  await assertAdminUser(workspaceId);
  const supabase = await createClient();

  const { data: updated, error } = await supabase
    .from('agents')
    .update({ role })
    .eq('id', agentId)
    .eq('workspace_id', workspaceId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return { success: true, agent: updated as Agent };
}

export async function removeAgentAction(workspaceId: string, agentId: string) {
  const { agent: currentAgent } = await assertAdminUser(workspaceId);
  if (currentAgent.id === agentId) {
    throw new Error('You cannot remove yourself from the workspace.');
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('agents')
    .delete()
    .eq('id', agentId)
    .eq('workspace_id', workspaceId);

  if (error) throw new Error(error.message);
  return { success: true };
}

/**
 * SECTION 4: Canned Responses CRUD
 */
export async function createCannedResponseAction(
  workspaceId: string,
  data: {
    shortcut: string;
    title: string;
    content: string;
    scope: 'team' | 'agent';
    agent_id?: string;
  }
) {
  const { agent: currentAgent } = await assertAdminUser(workspaceId);
  const supabase = await createClient();

  let formattedShortcut = data.shortcut.trim();
  if (!formattedShortcut.startsWith('/')) {
    formattedShortcut = `/${formattedShortcut}`;
  }

  const { data: inserted, error } = await supabase
    .from('canned_responses')
    .insert({
      workspace_id: workspaceId,
      shortcut: formattedShortcut,
      title: data.title.trim(),
      content: data.content.trim(),
      agent_id: data.scope === 'agent' ? data.agent_id || currentAgent.id : null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return { success: true, cannedResponse: inserted as CannedResponse };
}

export async function updateCannedResponseAction(
  workspaceId: string,
  id: string,
  data: {
    shortcut?: string;
    title?: string;
    content?: string;
    scope?: 'team' | 'agent';
    agent_id?: string | null;
  }
) {
  await assertAdminUser(workspaceId);
  const supabase = await createClient();

  let formattedShortcut = data.shortcut?.trim();
  if (formattedShortcut && !formattedShortcut.startsWith('/')) {
    formattedShortcut = `/${formattedShortcut}`;
  }

  const updatePayload: any = {};
  if (formattedShortcut) updatePayload.shortcut = formattedShortcut;
  if (data.title) updatePayload.title = data.title.trim();
  if (data.content) updatePayload.content = data.content.trim();
  if (data.scope !== undefined) {
    updatePayload.agent_id = data.scope === 'team' ? null : data.agent_id;
  }

  const { data: updated, error } = await supabase
    .from('canned_responses')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return { success: true, cannedResponse: updated as CannedResponse };
}

export async function deleteCannedResponseAction(workspaceId: string, id: string) {
  await assertAdminUser(workspaceId);
  const supabase = await createClient();

  const { error } = await supabase.from('canned_responses').delete().eq('id', id);
  if (error) throw new Error(error.message);
  return { success: true };
}

/**
 * SECTION 5: Auto-Assignment Rules
 */
export async function updateAutoAssignmentRulesAction(
  workspaceId: string,
  rules: AutoAssignmentConfig
) {
  await assertAdminUser(workspaceId);
  const supabase = await createClient();

  const { data: updated, error } = await supabase
    .from('workspaces')
    .update({
      auto_assignment: rules,
    })
    .eq('id', workspaceId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return { success: true, workspace: updated as Workspace };
}

/**
 * SECTION 7: Claude AI Settings
 */
export async function updateAISettingsAction(
  workspaceId: string,
  settings: AISettingsConfig
) {
  await assertAdminUser(workspaceId);
  const supabase = await createClient();

  const { data: updated, error } = await supabase
    .from('workspaces')
    .update({
      ai_settings: settings,
    })
    .eq('id', workspaceId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return { success: true, workspace: updated as Workspace };
}

