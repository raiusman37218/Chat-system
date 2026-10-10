'use server';

/**
 * Team and group management (Settings → Team members & roles, Groups &
 * routing). Owners and admins only.
 *
 * Role changes, capacity, deactivation and group membership go through the
 * database functions in supabase/migrations/20261010090000_teams_and_roles.sql,
 * which check the caller again and apply the rules (only the owner manages
 * admins, nobody changes themselves, the owner is untouchable). Inviting needs
 * the service role, to create the sign-in account, so it repeats those checks
 * here before doing anything.
 */

import { getWorkspaceAccess, type WorkspaceAccess } from '@/lib/team/access';
import { hasServiceRole, serviceClient } from '@/lib/supabase/service';
import { assignableRoles, isRole, type Role } from '@/lib/team/permissions';
import { assertWorkspaceLimit } from '@/lib/plans/enforce';
import type { TicketGroup } from '@/types/database';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  role: Role;
  status: 'online' | 'away' | 'offline';
  is_active: boolean;
  deactivated_at: string | null;
  max_open_tickets: number | null;
  open_tickets: number;
  group_ids: string[];
}

export interface TeamGroup extends TicketGroup {
  round_robin: boolean;
  member_ids: string[];
}

export interface TeamData {
  me: { id: string; role: Role };
  members: TeamMember[];
  groups: TeamGroup[];
}

function dbError(error: { message?: string } | null | undefined, fallback: string): Error {
  return new Error(error?.message || fallback);
}

function checkId(id: string, what = 'That person') {
  if (!UUID.test(id || '')) throw new Error(`${what} was not found.`);
}

async function loadTeam(access: WorkspaceAccess, workspaceId: string): Promise<TeamData> {
  const { supabase } = access;
  const [{ data: agents, error }, { data: groups }, { data: memberships }, { data: open }] = await Promise.all([
    supabase
      .from('agents')
      .select('id, name, email, avatar_url, role, status, is_active, deactivated_at, max_open_tickets')
      .eq('workspace_id', workspaceId)
      .order('name'),
    supabase.from('ticket_groups').select('*').eq('workspace_id', workspaceId).order('name'),
    supabase.from('ticket_group_members').select('group_id, agent_id').eq('workspace_id', workspaceId),
    supabase.from('tickets').select('assignee_id').eq('workspace_id', workspaceId).in('status', ['new', 'open']).not('assignee_id', 'is', null),
  ]);
  if (error) throw dbError(error, 'Could not load the team.');

  const rows = (memberships as { group_id: string; agent_id: string }[] | null) || [];
  const openCount = new Map<string, number>();
  for (const t of (open as { assignee_id: string }[] | null) || []) {
    openCount.set(t.assignee_id, (openCount.get(t.assignee_id) || 0) + 1);
  }
  type AgentRow = Omit<TeamMember, 'open_tickets' | 'group_ids'>;
  return {
    me: { id: access.user.id, role: access.role },
    members: ((agents as AgentRow[] | null) || []).map((a) => ({
      ...a,
      role: isRole(a.role) ? a.role : 'agent',
      is_active: a.is_active !== false,
      open_tickets: openCount.get(a.id) || 0,
      group_ids: rows.filter((r) => r.agent_id === a.id).map((r) => r.group_id),
    })),
    groups: ((groups as TicketGroup[] | null) || []).map((g) => ({
      ...(g as TeamGroup),
      round_robin: Boolean((g as TeamGroup).round_robin),
      member_ids: rows.filter((r) => r.group_id === g.id).map((r) => r.agent_id),
    })),
  };
}

export async function getTeamAction(workspaceId: string): Promise<TeamData> {
  const access = await getWorkspaceAccess(workspaceId, 'manage_team');
  return loadTeam(access, workspaceId);
}

/* ── Members ──────────────────────────────────────────────────────────── */

/**
 * Adds someone to the workspace by email. New people get an invitation email
 * from Supabase Auth; people with an account are linked straight away. Someone
 * already working in another workspace is refused rather than moved: an agent
 * belongs to one workspace, and taking them would cut off their other team.
 */
export async function inviteMemberAction(
  workspaceId: string,
  input: { name: string; email: string; role: Role; groupIds?: string[] }
): Promise<TeamData> {
  const access = await getWorkspaceAccess(workspaceId, 'manage_team');
  await assertWorkspaceLimit(workspaceId, 'max_agents');
  const email = (input.email || '').trim().toLowerCase();
  const name = (input.name || '').trim().slice(0, 120) || email.split('@')[0];
  if (!EMAIL.test(email)) throw new Error('Enter a valid email address.');
  if (!assignableRoles(access.role).includes(input.role)) {
    throw new Error(access.role === 'admin' && input.role === 'admin' ? 'Only the owner can invite admins.' : 'Choose a role.');
  }
  if (!hasServiceRole()) throw new Error('Inviting needs SUPABASE_SERVICE_ROLE_KEY on the server.');
  const admin = serviceClient();

  const { data: existing } = await admin
    .from('agents')
    .select('id, workspace_id, is_active')
    .ilike('email', email)
    .limit(1)
    .maybeSingle();

  let userId: string | null = existing?.id ?? null;
  if (existing?.workspace_id === workspaceId) {
    throw new Error(
      existing.is_active === false
        ? `${email} was deactivated. Reactivate them from the list instead.`
        : `${email} is already on this team.`
    );
  }
  if (existing?.workspace_id) {
    throw new Error(`${email} already works in another workspace. They need to leave it before joining this one.`);
  }

  if (!userId) {
    const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { name, workspace_id: workspaceId, role: input.role },
    });
    userId = invited?.user?.id ?? null;
    if (!userId) {
      // Already has an auth account (e.g. signed up but never joined a workspace).
      const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 });
      userId = list?.users?.find((u) => u.email?.toLowerCase() === email)?.id ?? null;
      if (!userId) throw dbError(inviteError, 'Could not send the invitation.');
    }
  }

  const { error } = await admin.from('agents').upsert(
    {
      id: userId,
      workspace_id: workspaceId,
      name,
      email,
      role: input.role,
      status: 'offline',
      is_active: true,
      deactivated_at: null,
    },
    { onConflict: 'id' }
  );
  if (error) throw dbError(error, 'Could not add them to the workspace.');

  const groupIds = (input.groupIds || []).filter((g) => UUID.test(g));
  if (groupIds.length && input.role !== 'light_agent') {
    const { data: groups } = await access.supabase.from('ticket_groups').select('id').eq('workspace_id', workspaceId).in('id', groupIds);
    const rows = ((groups as { id: string }[] | null) || []).map((g) => ({ group_id: g.id, agent_id: userId, workspace_id: workspaceId }));
    if (rows.length) {
      const { error: groupError } = await access.supabase.from('ticket_group_members').insert(rows);
      if (groupError) throw dbError(groupError, 'They were invited, but could not be added to the groups.');
    }
  }
  return loadTeam(access, workspaceId);
}

export async function setMemberRoleAction(workspaceId: string, agentId: string, role: Role): Promise<TeamData> {
  const access = await getWorkspaceAccess(workspaceId, 'manage_team');
  checkId(agentId);
  if (!isRole(role)) throw new Error('Choose a role.');
  const { error } = await access.supabase.rpc('fn_set_member_role', { p_workspace_id: workspaceId, p_agent_id: agentId, p_role: role });
  if (error) throw dbError(error, 'Could not change their role.');
  return loadTeam(access, workspaceId);
}

export async function setMemberCapacityAction(workspaceId: string, agentId: string, maxOpen: number | null): Promise<TeamData> {
  const access = await getWorkspaceAccess(workspaceId, 'manage_team');
  checkId(agentId);
  const value = maxOpen === null ? null : Math.round(Number(maxOpen));
  if (value !== null && !(value >= 1 && value <= 1000)) throw new Error('Capacity is a number from 1 to 1000, or no limit.');
  const { error } = await access.supabase.rpc('fn_set_member_capacity', {
    p_workspace_id: workspaceId,
    p_agent_id: agentId,
    p_max_open: value,
  });
  if (error) throw dbError(error, 'Could not change their capacity.');
  return loadTeam(access, workspaceId);
}

export type ReassignMode = 'agent' | 'round_robin' | 'unassign';

export async function deactivateMemberAction(
  workspaceId: string,
  agentId: string,
  reassign: { mode: ReassignMode; to?: string | null }
): Promise<{ team: TeamData; moved: number }> {
  const access = await getWorkspaceAccess(workspaceId, 'manage_team');
  checkId(agentId);
  if (!['agent', 'round_robin', 'unassign'].includes(reassign.mode)) throw new Error('Choose what happens to their tickets.');
  if (reassign.mode === 'agent') checkId(reassign.to || '', 'The new assignee');
  const { data, error } = await access.supabase.rpc('fn_deactivate_member', {
    p_workspace_id: workspaceId,
    p_agent_id: agentId,
    p_mode: reassign.mode,
    p_reassign_to: reassign.mode === 'agent' ? reassign.to : null,
  });
  if (error) throw dbError(error, 'Could not deactivate them.');
  return { team: await loadTeam(access, workspaceId), moved: Number(data) || 0 };
}

export async function reactivateMemberAction(workspaceId: string, agentId: string): Promise<TeamData> {
  const access = await getWorkspaceAccess(workspaceId, 'manage_team');
  checkId(agentId);
  const { error } = await access.supabase.rpc('fn_reactivate_member', { p_workspace_id: workspaceId, p_agent_id: agentId });
  if (error) throw dbError(error, 'Could not reactivate them.');
  return loadTeam(access, workspaceId);
}

/* ── Groups ───────────────────────────────────────────────────────────── */

export async function createGroupAction(workspaceId: string, input: { name: string; roundRobin?: boolean }): Promise<TeamData> {
  const access = await getWorkspaceAccess(workspaceId, 'manage_groups');
  const name = (input.name || '').trim().slice(0, 60);
  if (!name) throw new Error('Give the group a name.');
  const { error } = await access.supabase
    .from('ticket_groups')
    .insert({ workspace_id: workspaceId, name, round_robin: Boolean(input.roundRobin) });
  if (error) throw dbError(error, error.code === '23505' ? 'There is already a group with that name.' : 'Could not create the group.');
  return loadTeam(access, workspaceId);
}

export async function updateGroupAction(
  workspaceId: string,
  groupId: string,
  patch: { name?: string; roundRobin?: boolean }
): Promise<TeamData> {
  const access = await getWorkspaceAccess(workspaceId, 'manage_groups');
  checkId(groupId, 'That group');
  const update: Record<string, unknown> = {};
  if (patch.name !== undefined) {
    const name = patch.name.trim().slice(0, 60);
    if (!name) throw new Error('Give the group a name.');
    update.name = name;
  }
  if (patch.roundRobin !== undefined) update.round_robin = Boolean(patch.roundRobin);
  if (Object.keys(update).length) {
    const { error } = await access.supabase.from('ticket_groups').update(update).eq('id', groupId).eq('workspace_id', workspaceId);
    if (error) throw dbError(error, error.code === '23505' ? 'There is already a group with that name.' : 'Could not update the group.');
  }
  return loadTeam(access, workspaceId);
}

export async function deleteGroupAction(workspaceId: string, groupId: string): Promise<TeamData> {
  const access = await getWorkspaceAccess(workspaceId, 'manage_groups');
  checkId(groupId, 'That group');
  const { error } = await access.supabase.from('ticket_groups').delete().eq('id', groupId).eq('workspace_id', workspaceId);
  if (error) throw dbError(error, 'Could not delete the group.');
  return loadTeam(access, workspaceId);
}

export async function setGroupMembersAction(workspaceId: string, groupId: string, agentIds: string[]): Promise<TeamData> {
  const access = await getWorkspaceAccess(workspaceId, 'manage_groups');
  checkId(groupId, 'That group');
  const ids = Array.from(new Set((agentIds || []).filter((id) => UUID.test(id))));
  const { data: group } = await access.supabase.from('ticket_groups').select('id').eq('id', groupId).eq('workspace_id', workspaceId).maybeSingle();
  if (!group) throw new Error('That group was not found.');
  const { error } = await access.supabase.rpc('fn_set_group_members', { p_group_id: groupId, p_agent_ids: ids });
  if (error) throw dbError(error, 'Could not update the group’s members.');
  return loadTeam(access, workspaceId);
}
