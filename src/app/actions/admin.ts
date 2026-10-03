'use server';

import { createClient } from '@/lib/supabase/server';
import { serviceClient } from '@/lib/supabase/service';
import {
  Workspace,
  Agent,
  CannedResponse,
  BusinessHoursConfig,
  AutoAssignmentConfig,
  AISettingsConfig,
  NavbarTriggerConfig,
  SMTPSettingsConfig,
} from '@/types/database';
import { generateUniqueWorkspaceSlug } from '@/lib/slug';

/**
 * Ensures the requesting user is authenticated, has 'admin' or 'owner' role,
 * and belongs to or owns the specified workspace.
 */
export async function assertAdminUser(workspaceId: string): Promise<{ user: any; agent: Agent }> {
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

  // Tenancy check: agent must belong to the workspace, or be the workspace owner
  let isAuthorized = agent.workspace_id === workspaceId;

  if (!isAuthorized) {
    const { data: ws } = await supabase
      .from('workspaces')
      .select('owner_id')
      .eq('id', workspaceId)
      .maybeSingle();

    if (ws && ws.owner_id === user.id) {
      isAuthorized = true;
    }
  }

  if (!isAuthorized) {
    throw new Error('Forbidden: You do not have administrative privileges for this workspace.');
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
    show_launcher_logo?: boolean;
    widget_position?: 'right' | 'left';
    greeting_title?: string;
    greeting_message?: string;
    help_center_tab_label?: string;
    show_help_tab?: boolean;
    help_center_tab_icon?: string;
    launcher_offset_bottom?: number;
    launcher_offset_side?: number;
    widget_z_index?: number;
    enable_proactive_welcome?: boolean;
    proactive_delay_seconds?: number;
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

  if (data.show_launcher_logo !== undefined) {
    updatePayload.show_launcher_logo = data.show_launcher_logo;
  }
  if (data.help_center_tab_label !== undefined) {
    updatePayload.help_center_tab_label = data.help_center_tab_label;
  }
  if (data.show_help_tab !== undefined) {
    updatePayload.show_help_tab = data.show_help_tab;
  }
  if (data.help_center_tab_icon !== undefined) {
    updatePayload.help_center_tab_icon = data.help_center_tab_icon;
  }
  if (data.launcher_offset_bottom !== undefined) {
    updatePayload.launcher_offset_bottom = Math.max(0, Number(data.launcher_offset_bottom));
  }
  if (data.launcher_offset_side !== undefined) {
    updatePayload.launcher_offset_side = Math.max(0, Number(data.launcher_offset_side));
  }
  if (data.widget_z_index !== undefined) {
    updatePayload.widget_z_index = Math.max(1, Number(data.widget_z_index));
  }
  if (data.enable_proactive_welcome !== undefined) {
    updatePayload.enable_proactive_welcome = Boolean(data.enable_proactive_welcome);
  }
  if (data.proactive_delay_seconds !== undefined) {
    updatePayload.proactive_delay_seconds = Math.max(8, Number(data.proactive_delay_seconds));
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
): Promise<{ success: boolean; agent?: Agent; error?: string }> {
  try {
    await assertAdminUser(workspaceId);

    const email = data.email?.trim().toLowerCase();
    const name = data.name?.trim();
    const role = data.role === 'admin' ? 'admin' : 'agent';

    if (!email || !email.includes('@')) {
      return { success: false, error: 'Please provide a valid email address.' };
    }
    if (!name) {
      return { success: false, error: "Please provide the agent's full name." };
    }

    const adminClient = serviceClient();

    // 1. Check if the user is already part of THIS workspace
    const { data: existingWorkspaceAgent } = await adminClient
      .from('agents')
      .select('*')
      .eq('workspace_id', workspaceId)
      .ilike('email', email)
      .maybeSingle();

    if (existingWorkspaceAgent) {
      return {
        success: false,
        error: `A team member with email "${email}" is already part of this workspace.`,
      };
    }

    // 2. Check if the user already exists in auth.users or agents
    let targetUserId: string | null = null;

    try {
      const { data: usersData } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
      const foundUser = usersData?.users?.find((u) => u.email?.toLowerCase() === email);
      if (foundUser) {
        targetUserId = foundUser.id;
      }
    } catch (listErr) {
      console.warn('Could not list users from auth.admin:', listErr);
    }

    if (!targetUserId) {
      const { data: existingAgent } = await adminClient
        .from('agents')
        .select('id')
        .ilike('email', email)
        .maybeSingle();
      if (existingAgent?.id) {
        targetUserId = existingAgent.id;
      }
    }

    // 3. If user doesn't exist in auth, invite or create them
    if (!targetUserId) {
      const { data: inviteData, error: inviteErr } = await adminClient.auth.admin.inviteUserByEmail(
        email,
        {
          data: {
            name,
            workspace_id: workspaceId,
            role,
          },
        }
      );

      if (inviteData?.user?.id) {
        targetUserId = inviteData.user.id;
      } else {
        // Fallback: create auth user directly if invite email failed (e.g. SMTP limits or email restrictions)
        const { data: createData, error: createErr } = await adminClient.auth.admin.createUser({
          email,
          email_confirm: true,
          user_metadata: {
            name,
            workspace_id: workspaceId,
            role,
          },
        });

        if (createErr || !createData?.user?.id) {
          return {
            success: false,
            error: inviteErr?.message || createErr?.message || 'Failed to create user account.',
          };
        }
        targetUserId = createData.user.id;
      }
    }

    // 4. Upsert into public.agents
    const { data: inserted, error: agentError } = await adminClient
      .from('agents')
      .upsert(
        {
          id: targetUserId,
          workspace_id: workspaceId,
          name,
          email,
          role,
          status: 'offline',
        },
        { onConflict: 'id' }
      )
      .select()
      .single();

    if (agentError || !inserted) {
      return {
        success: false,
        error: agentError?.message || 'Failed to link agent to workspace.',
      };
    }

    return { success: true, agent: inserted as Agent };
  } catch (err: any) {
    console.error('Error in inviteAgentAction:', err);
    return {
      success: false,
      error: err.message || 'Failed to invite agent. Please try again.',
    };
  }
}

export async function updateAgentRoleAction(
  workspaceId: string,
  agentId: string,
  role: 'admin' | 'agent'
): Promise<{ success: boolean; agent?: Agent; error?: string }> {
  try {
    await assertAdminUser(workspaceId);
    const adminClient = serviceClient();

    const { data: updated, error } = await adminClient
      .from('agents')
      .update({ role })
      .eq('id', agentId)
      .eq('workspace_id', workspaceId)
      .select()
      .single();

    if (error || !updated) {
      return {
        success: false,
        error: error?.message || 'Failed to update agent role.',
      };
    }
    return { success: true, agent: updated as Agent };
  } catch (err: any) {
    console.error('Error in updateAgentRoleAction:', err);
    return {
      success: false,
      error: err.message || 'Failed to update agent role.',
    };
  }
}

export async function removeAgentAction(
  workspaceId: string,
  agentId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { agent: currentAgent } = await assertAdminUser(workspaceId);
    if (currentAgent.id === agentId) {
      return { success: false, error: 'You cannot remove yourself from the workspace.' };
    }

    const adminClient = serviceClient();
    const { error } = await adminClient
      .from('agents')
      .update({ workspace_id: null })
      .eq('id', agentId)
      .eq('workspace_id', workspaceId);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.error('Error in removeAgentAction:', err);
    return {
      success: false,
      error: err.message || 'Failed to remove agent.',
    };
  }
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

  const { data: existing } = await supabase
    .from('workspaces')
    .select('ai_settings')
    .eq('id', workspaceId)
    .single();

  const prevAi = existing?.ai_settings || {};
  const cleanedApiKey = settings.api_key && settings.api_key.trim() ? settings.api_key.trim() : null;
  const finalApiKey = cleanedApiKey !== null ? cleanedApiKey : (prevAi.api_key ?? prevAi.anthropic_api_key ?? null);

  const finalSettings: AISettingsConfig = {
    ...prevAi,
    ...settings,
    api_key: finalApiKey,
    anthropic_api_key: null,
  };

  const { data: updated, error } = await supabase
    .from('workspaces')
    .update({
      ai_settings: finalSettings,
    })
    .eq('id', workspaceId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  try {
    const adminClient = serviceClient();
    await adminClient
      .from('workspace_integrations')
      .update({
        langgraph_enabled: finalSettings.enabled,
        langgraph_auto_pilot: finalSettings.auto_pilot ?? finalSettings.auto_response_enabled,
        langgraph_system_prompt: finalSettings.system_prompt || null,
      })
      .eq('workspace_id', workspaceId);
  } catch (syncErr) {
    console.warn('[updateAISettingsAction] Non-fatal integrations sync error:', syncErr);
  }

  return { success: true, workspace: updated as Workspace };
}

/**
 * SECTION 8: Help Center Branding & Appearance
 */
export async function updateHelpCenterBrandingAction(
  workspaceId: string,
  data: {
    help_center_title?: string | null;
    help_center_subtitle?: string | null;
    help_center_logo_url?: string | null;
    help_center_header_links?: Array<{ label: string; url: string; target?: string }>;
    help_center_footer_text?: string | null;
    help_center_layout?: 'grid-2' | 'grid-3' | 'grid-4' | 'list' | null;
  }
) {
  await assertAdminUser(workspaceId);
  const supabase = await createClient();

  const updatePayload: Record<string, any> = {};
  if (data.help_center_title !== undefined) {
    updatePayload.help_center_title = data.help_center_title ? data.help_center_title.trim() : null;
  }
  if (data.help_center_subtitle !== undefined) {
    updatePayload.help_center_subtitle = data.help_center_subtitle ? data.help_center_subtitle.trim() : null;
  }
  if (data.help_center_logo_url !== undefined) {
    updatePayload.help_center_logo_url = data.help_center_logo_url ? data.help_center_logo_url.trim() : null;
  }
  if (data.help_center_header_links !== undefined) {
    updatePayload.help_center_header_links = data.help_center_header_links;
  }
  if (data.help_center_footer_text !== undefined) {
    updatePayload.help_center_footer_text = data.help_center_footer_text ? data.help_center_footer_text.trim() : null;
  }
  if (data.help_center_layout !== undefined) {
    updatePayload.help_center_layout = data.help_center_layout || 'grid-2';
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
 * SECTION 8: Zero-Code Navbar Trigger Button
 */
export async function updateNavbarTriggerConfigAction(
  workspaceId: string,
  config: NavbarTriggerConfig
) {
  await assertAdminUser(workspaceId);
  const supabase = await createClient();

  const { data: updated, error } = await supabase
    .from('workspaces')
    .update({
      navbar_trigger_config: config,
    })
    .eq('id', workspaceId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return { success: true, workspace: updated as Workspace };
}

export async function dismissNavbarPromptAction(workspaceId: string) {
  await assertAdminUser(workspaceId);
  const supabase = await createClient();

  const { data: ws } = await supabase
    .from('workspaces')
    .select('navbar_trigger_config')
    .eq('id', workspaceId)
    .single();

  const current = (ws?.navbar_trigger_config || {}) as NavbarTriggerConfig;
  const updatedConfig: NavbarTriggerConfig = {
    ...current,
    dismissed_prompt: true,
  };

  const { data: updated, error } = await supabase
    .from('workspaces')
    .update({
      navbar_trigger_config: updatedConfig,
    })
    .eq('id', workspaceId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return { success: true, workspace: updated as Workspace };
}

/**
 * SECTION 9: Hostinger / Custom SMTP Settings & 5-minute unread email alerts
 */
export async function updateSMTPSettingsAction(
  workspaceId: string,
  settings: SMTPSettingsConfig
) {
  await assertAdminUser(workspaceId);
  const supabase = await createClient();

  const sanitized: SMTPSettingsConfig = {
    ...settings,
    host: (settings.host || '').trim(),
    port: Number(settings.port) || 465,
    user: (settings.user || '').trim(),
    pass: settings.pass || '',
    from_name: (settings.from_name || '').trim(),
    from_email: (settings.from_email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.from_email.trim()))
      ? settings.from_email.trim()
      : (settings.user || '').trim(),
    secure: settings.secure !== undefined ? settings.secure : Number(settings.port) === 465,
    unread_threshold_minutes: Number(settings.unread_threshold_minutes) || 5,
  };

  const { data: updated, error } = await supabase
    .from('workspaces')
    .update({
      smtp_settings: sanitized,
    })
    .eq('id', workspaceId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return { success: true, workspace: updated as Workspace };
}

/**
 * SECTION 10: Create Workspace & Link Agent
 */
export async function createWorkspaceAction(input: {
  businessName: string;
  websiteUrl?: string | null;
  brandColor: string;
  greetingTitle: string;
  greetingMessage: string;
  slug: string;
  customDomain?: string | null;
  verificationToken?: string | null;
}) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    throw new Error('Unauthorized: Authentication required.');
  }

  // 1. Generate clean, unique slug from workspace name
  const slug = await generateUniqueWorkspaceSlug(
    supabase,
    input.slug || input.businessName
  );

  // 2. Insert Workspace
  const { data: ws, error: wsError } = await supabase
    .from('workspaces')
    .insert({
      name: input.businessName,
      website_url: input.websiteUrl || null,
      brand_color: input.brandColor,
      greeting_title: input.greetingTitle,
      greeting_message: input.greetingMessage,
      owner_id: user.id,
      slug,
      slug_changes_count: 0,
      slug_changed_at: null,
      custom_domain: input.customDomain || null,
      custom_domain_status: input.customDomain ? 'pending' : null,
      custom_domain_verification_token: input.customDomain ? input.verificationToken : null,
    })
    .select()
    .single();

  if (wsError || !ws) {
    throw new Error(wsError?.message || 'Failed to create workspace.');
  }

  // 2. Link current agent to workspace
  await supabase
    .from('agents')
    .upsert({
      id: user.id,
      name: user.user_metadata?.name || user.email?.split('@')[0] || 'Owner',
      email: user.email || '',
      workspace_id: ws.id,
      role: 'owner',
      status: 'online',
    });

  return { success: true, workspace: ws as Workspace };
}



