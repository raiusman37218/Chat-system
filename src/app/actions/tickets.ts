'use server';

/**
 * Ticketing server actions. Each one checks the caller belongs to the
 * workspace, then works through the caller's own session so row level
 * security applies as well, and still filters by workspace_id explicitly.
 *
 * The rules (numbering, status changes, follow-ups, the audit log) live in
 * the database (supabase/migrations/20261009110000_ticketing.sql); these
 * actions only ask for changes and report the database's answer.
 */

import { createClient } from '@/lib/supabase/server';
import { isValidEmail, sendSmtpEmail } from '@/lib/email/smtp';
import { sanitizeTicketPatch, type TicketPatch } from '@/lib/tickets/patch';
import {
  SETTABLE_STATUSES,
  SYSTEM_VIEWS,
  TICKET_CHANNELS,
  applyTicketFilters,
  normalizeFilters,
  normalizeSort,
  normalizeTag,
  sortColumn,
  viewFromRow,
  type FilterableQuery,
  type TicketFilters,
  type TicketSort,
  type ViewDefinition,
} from '@/lib/tickets/views';
import type {
  Agent,
  Message,
  SMTPSettingsConfig,
  Ticket,
  TicketChannel,
  TicketEvent,
  TicketGroup,
  TicketPriority,
  TicketStatus,
  TicketType,
  Visitor,
} from '@/types/database';

export type { TicketPatch };

// The project has no generated database types; the other actions use the same untyped client.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Supabase = Awaited<ReturnType<typeof createClient<any>>>;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PAGE_SIZE = 50;

/* ── Access ───────────────────────────────────────────────────────────── */

interface Caller {
  supabase: Supabase;
  agent: Pick<Agent, 'id' | 'name' | 'role' | 'workspace_id' | 'is_super_admin'>;
  isAdmin: boolean;
}

/** Membership as the database sees it (fn_ticket_member), plus the role. */
async function assertTicketAccess(workspaceId: string): Promise<Caller> {
  if (!UUID.test(workspaceId || '')) throw new Error('Unknown workspace.');
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized: sign in again.');

  const [{ data: agent }, { data: ws }] = await Promise.all([
    supabase.from('agents').select('id, name, role, workspace_id, is_super_admin').eq('id', user.id).maybeSingle(),
    supabase.from('workspaces').select('id, owner_id').eq('id', workspaceId).maybeSingle(),
  ]);
  const isOwner = ws?.owner_id === user.id;
  const isMember = isOwner || agent?.workspace_id === workspaceId || Boolean(agent?.is_super_admin);
  if (!agent || !isMember) throw new Error('Forbidden: this workspace is not yours.');

  const isAdmin =
    isOwner || Boolean(agent.is_super_admin) || (agent.workspace_id === workspaceId && ['owner', 'admin'].includes(agent.role));
  return { supabase, agent, isAdmin };
}

function dbError(error: { message?: string } | null | undefined, fallback: string): Error {
  return new Error(error?.message || fallback);
}

/* ── Shapes returned to the UI ────────────────────────────────────────── */

export interface TicketListItem {
  id: string;
  number: number;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  type: TicketType;
  channel: TicketChannel;
  tags: string[];
  assignee_id: string | null;
  group_id: string | null;
  requester: { id: string; name: string | null; email: string | null } | null;
  created_at: string;
  updated_at: string;
  solved_at: string | null;
}

const LIST_COLUMNS =
  'id, number, subject, status, priority, type, channel, tags, assignee_id, group_id, created_at, updated_at, solved_at, requester:visitors(id, name, email)';

export interface TicketsBootstrap {
  me: { id: string; name: string; isAdmin: boolean };
  agents: { id: string; name: string; avatar_url: string | null; status: string }[];
  groups: TicketGroup[];
  views: ViewDefinition[];
  counts: Record<string, number>;
}

/* ── Views and counts ─────────────────────────────────────────────────── */

async function savedViews(caller: Caller, workspaceId: string): Promise<ViewDefinition[]> {
  const { data } = await caller.supabase
    .from('ticket_views')
    .select('id, name, filters, sort, owner_id, position')
    .eq('workspace_id', workspaceId)
    .order('position')
    .order('created_at');
  return (data || []).map(viewFromRow);
}

function filteredTickets(caller: Caller, workspaceId: string, filters: TicketFilters, columns: string, head = false) {
  const base = caller.supabase
    .from('tickets')
    .select(columns, head ? { count: 'exact', head: true } : { count: 'exact' })
    .eq('workspace_id', workspaceId);
  // The Supabase builder satisfies FilterableQuery; its generics are too deep to name here.
  return applyTicketFilters(base as unknown as FilterableQuery<never>, filters, caller.agent.id) as unknown as typeof base;
}

async function countViews(caller: Caller, workspaceId: string, views: ViewDefinition[]): Promise<Record<string, number>> {
  const results = await Promise.all(
    views.map(async (v) => {
      const { count } = await filteredTickets(caller, workspaceId, v.filters, 'id', true);
      return [v.id, count ?? 0] as const;
    })
  );
  return Object.fromEntries(results);
}

export async function getTicketsBootstrapAction(workspaceId: string): Promise<TicketsBootstrap> {
  const caller = await assertTicketAccess(workspaceId);
  const [{ data: agents }, { data: groups }, saved] = await Promise.all([
    caller.supabase.from('agents').select('id, name, avatar_url, status').eq('workspace_id', workspaceId).order('name'),
    caller.supabase.from('ticket_groups').select('*').eq('workspace_id', workspaceId).order('name'),
    savedViews(caller, workspaceId),
  ]);
  const views = [...SYSTEM_VIEWS, ...saved];
  return {
    me: { id: caller.agent.id, name: caller.agent.name, isAdmin: caller.isAdmin },
    agents: agents || [],
    groups: (groups as TicketGroup[]) || [],
    views,
    counts: await countViews(caller, workspaceId, views),
  };
}

export async function getViewCountsAction(workspaceId: string): Promise<Record<string, number>> {
  const caller = await assertTicketAccess(workspaceId);
  return countViews(caller, workspaceId, [...SYSTEM_VIEWS, ...(await savedViews(caller, workspaceId))]);
}

export async function listTicketsAction(
  workspaceId: string,
  request: { viewId?: string; filters?: unknown; sort?: unknown; page?: number }
): Promise<{ tickets: TicketListItem[]; total: number; view: ViewDefinition | null }> {
  const caller = await assertTicketAccess(workspaceId);

  let view: ViewDefinition | null = null;
  if (request.viewId) {
    view =
      SYSTEM_VIEWS.find((v) => v.id === request.viewId) ||
      (await savedViews(caller, workspaceId)).find((v) => v.id === request.viewId) ||
      null;
    if (!view) throw new Error('That view no longer exists.');
  }
  const filters = request.filters !== undefined ? normalizeFilters(request.filters) : view?.filters ?? {};
  const sort: TicketSort = request.sort !== undefined ? normalizeSort(request.sort) : view?.sort ?? normalizeSort(null);
  const page = Math.max(0, Math.floor(request.page ?? 0));

  const { data, count, error } = await filteredTickets(caller, workspaceId, filters, LIST_COLUMNS)
    .order(sortColumn(sort), { ascending: sort.direction === 'asc', nullsFirst: false })
    .order('number', { ascending: false })
    .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
  if (error) throw dbError(error, 'Could not load tickets.');
  return { tickets: (data as unknown as TicketListItem[]) || [], total: count ?? 0, view };
}

export async function saveTicketViewAction(
  workspaceId: string,
  input: { id?: string; name: string; filters: unknown; sort: unknown; shared: boolean }
): Promise<ViewDefinition> {
  const caller = await assertTicketAccess(workspaceId);
  const name = (input.name || '').trim().slice(0, 80);
  if (!name) throw new Error('Give the view a name.');
  if (input.shared && !caller.isAdmin) throw new Error('Only admins can share views with the whole team.');

  const row = {
    workspace_id: workspaceId,
    name,
    filters: normalizeFilters(input.filters),
    sort: normalizeSort(input.sort),
    owner_id: input.shared ? null : caller.agent.id,
    updated_at: new Date().toISOString(),
  };
  const query = input.id
    ? caller.supabase.from('ticket_views').update(row).eq('id', input.id).eq('workspace_id', workspaceId)
    : caller.supabase.from('ticket_views').insert(row);
  const { data, error } = await query.select('id, name, filters, sort, owner_id').single();
  if (error || !data) throw dbError(error, 'Could not save the view.');
  return viewFromRow(data);
}

export async function deleteTicketViewAction(workspaceId: string, viewId: string): Promise<void> {
  const caller = await assertTicketAccess(workspaceId);
  const { error } = await caller.supabase.from('ticket_views').delete().eq('id', viewId).eq('workspace_id', workspaceId);
  if (error) throw dbError(error, 'Could not delete the view.');
}

/* ── Groups ───────────────────────────────────────────────────────────── */

export async function createTicketGroupAction(workspaceId: string, name: string): Promise<TicketGroup> {
  const caller = await assertTicketAccess(workspaceId);
  if (!caller.isAdmin) throw new Error('Only admins can manage groups.');
  const clean = (name || '').trim().slice(0, 60);
  if (!clean) throw new Error('Give the group a name.');
  const { data, error } = await caller.supabase
    .from('ticket_groups')
    .insert({ workspace_id: workspaceId, name: clean })
    .select('*')
    .single();
  if (error || !data) throw dbError(error, 'Could not create the group.');
  return data as TicketGroup;
}

export async function deleteTicketGroupAction(workspaceId: string, groupId: string): Promise<void> {
  const caller = await assertTicketAccess(workspaceId);
  if (!caller.isAdmin) throw new Error('Only admins can manage groups.');
  const { error } = await caller.supabase.from('ticket_groups').delete().eq('id', groupId).eq('workspace_id', workspaceId);
  if (error) throw dbError(error, 'Could not delete the group.');
}

/* ── One ticket ───────────────────────────────────────────────────────── */

export interface TicketDetail {
  ticket: Ticket;
  messages: Pick<
    Message,
    'id' | 'conversation_id' | 'sender_type' | 'sender_id' | 'content' | 'attachment_url' | 'created_at' | 'is_internal' | 'metadata'
  >[];
  events: TicketEvent[];
  requester: Pick<
    Visitor,
    'id' | 'name' | 'email' | 'location' | 'ip_location_city' | 'ip_location_country' | 'browser' | 'os' | 'device' | 'current_page_url' | 'last_seen_at' | 'first_seen_at' | 'timezone' | 'language'
  > | null;
  previousTickets: Pick<Ticket, 'id' | 'number' | 'subject' | 'status' | 'created_at'>[];
  /** Follow-ups of this ticket, tickets merged into it, and what it follows up or was merged into. */
  related: Pick<Ticket, 'id' | 'number' | 'subject' | 'status' | 'follow_up_of_id' | 'merged_into_id'>[];
  /** Names for every agent and visitor that appears in the thread or log. */
  people: Record<string, string>;
}

export async function getTicketAction(workspaceId: string, ticketId: string): Promise<TicketDetail> {
  const caller = await assertTicketAccess(workspaceId);
  const { supabase } = caller;
  const { data: ticket, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('id', ticketId)
    .maybeSingle();
  if (error || !ticket) throw dbError(error, 'Ticket not found.');
  const t = ticket as Ticket;

  const linkIds = [t.follow_up_of_id, t.merged_into_id].filter(Boolean) as string[];
  const [{ data: messages }, { data: events }, { data: requester }, { data: previous }, { data: related }] = await Promise.all([
    supabase
      .from('messages')
      .select('id, conversation_id, sender_type, sender_id, content, attachment_url, created_at, is_internal, metadata')
      .eq('ticket_id', t.id)
      .order('created_at', { ascending: true })
      .limit(1000),
    supabase.from('ticket_events').select('*').eq('ticket_id', t.id).eq('workspace_id', workspaceId).order('id', { ascending: true }),
    t.requester_id
      ? supabase
          .from('visitors')
          .select('id, name, email, location, ip_location_city, ip_location_country, browser, os, device, current_page_url, last_seen_at, first_seen_at, timezone, language')
          .eq('id', t.requester_id)
          .eq('workspace_id', workspaceId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    t.requester_id
      ? supabase
          .from('tickets')
          .select('id, number, subject, status, created_at')
          .eq('workspace_id', workspaceId)
          .eq('requester_id', t.requester_id)
          .neq('id', t.id)
          .order('created_at', { ascending: false })
          .limit(20)
      : Promise.resolve({ data: [] }),
    supabase
      .from('tickets')
      .select('id, number, subject, status, follow_up_of_id, merged_into_id')
      .eq('workspace_id', workspaceId)
      .or([`follow_up_of_id.eq.${t.id}`, `merged_into_id.eq.${t.id}`, ...linkIds.map((id) => `id.eq.${id}`)].join(',')),
  ]);

  const agentIds = new Set<string>();
  for (const m of messages || []) if (m.sender_type === 'agent' && m.sender_id) agentIds.add(m.sender_id);
  for (const e of events || []) {
    if (e.actor_type === 'agent' && e.actor_id) agentIds.add(e.actor_id);
    if (e.field === 'assignee_id') {
      if (e.old_value) agentIds.add(e.old_value);
      if (e.new_value) agentIds.add(e.new_value);
    }
  }
  if (t.assignee_id) agentIds.add(t.assignee_id);
  const { data: agentRows } = agentIds.size
    ? await supabase.from('agents').select('id, name').in('id', Array.from(agentIds))
    : { data: [] as { id: string; name: string }[] };

  const people: Record<string, string> = {};
  for (const a of agentRows || []) people[a.id] = a.name;
  if (requester) people[requester.id] = requester.name || requester.email || 'Customer';

  return {
    ticket: t,
    messages: (messages as TicketDetail['messages']) || [],
    events: (events as TicketEvent[]) || [],
    requester: (requester as TicketDetail['requester']) || null,
    previousTickets: (previous as TicketDetail['previousTickets']) || [],
    related: (related as TicketDetail['related']) || [],
    people,
  };
}

/** An assignee and group must belong to this workspace. */
async function assertReferences(caller: Caller, workspaceId: string, patch: TicketPatch) {
  if (patch.assignee_id) {
    const { data } = await caller.supabase
      .from('agents')
      .select('id')
      .eq('id', patch.assignee_id)
      .eq('workspace_id', workspaceId)
      .maybeSingle();
    if (!data) throw new Error('That agent is not in this workspace.');
  }
  if (patch.group_id) {
    const { data } = await caller.supabase
      .from('ticket_groups')
      .select('id')
      .eq('id', patch.group_id)
      .eq('workspace_id', workspaceId)
      .maybeSingle();
    if (!data) throw new Error('That group is not in this workspace.');
  }
}

export async function updateTicketAction(workspaceId: string, ticketId: string, patch: TicketPatch): Promise<Ticket> {
  const caller = await assertTicketAccess(workspaceId);
  const clean = sanitizeTicketPatch(patch);
  if (!Object.keys(clean).length) throw new Error('Nothing to change.');
  await assertReferences(caller, workspaceId, clean);
  const { data, error } = await caller.supabase
    .from('tickets')
    .update(clean)
    .eq('workspace_id', workspaceId)
    .eq('id', ticketId)
    .select('*')
    .maybeSingle();
  if (error || !data) throw dbError(error, 'Ticket not found.');
  return data as Ticket;
}

/* ── Replies and notes ────────────────────────────────────────────────── */

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

export async function replyToTicketAction(
  workspaceId: string,
  ticketId: string,
  input: { body: string; internal: boolean; submitAs?: TicketStatus }
): Promise<{ emailed: boolean; emailError?: string }> {
  const caller = await assertTicketAccess(workspaceId);
  const body = (input.body || '').trim();
  if (!body) throw new Error('Write something first.');
  if (body.length > 20_000) throw new Error('That reply is too long.');

  const { data: ticket } = await caller.supabase
    .from('tickets')
    .select('id, number, subject, status, conversation_id, channel, requester_id')
    .eq('workspace_id', workspaceId)
    .eq('id', ticketId)
    .maybeSingle();
  if (!ticket) throw new Error('Ticket not found.');
  if (ticket.status === 'closed') throw new Error(`Ticket #${ticket.number} is closed. Create a follow-up instead.`);

  // After a merge the customer may be writing in another conversation; reply
  // where they last wrote so the widget they have open receives it.
  const { data: lastCustomer } = await caller.supabase
    .from('messages')
    .select('conversation_id')
    .eq('ticket_id', ticketId)
    .eq('sender_type', 'visitor')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  const conversationId = lastCustomer?.conversation_id || ticket.conversation_id;
  if (!conversationId) throw new Error('This ticket has no conversation to reply in.');

  const { error } = await caller.supabase.from('messages').insert({
    conversation_id: conversationId,
    ticket_id: ticketId,
    sender_type: 'agent',
    sender_id: caller.agent.id,
    content: body,
    is_internal: input.internal,
  });
  if (error) throw dbError(error, 'Could not send the reply.');

  if (input.submitAs && SETTABLE_STATUSES.includes(input.submitAs) && input.submitAs !== ticket.status) {
    const { error: statusError } = await caller.supabase
      .from('tickets')
      .update({ status: input.submitAs })
      .eq('workspace_id', workspaceId)
      .eq('id', ticketId);
    if (statusError) throw dbError(statusError, 'Reply sent, but the status could not be changed.');
  }

  // Chat replies reach the widget in real time. Email and web-form tickets
  // have no live channel, so the reply is emailed through the workspace SMTP.
  if (input.internal || ticket.channel === 'chat' || !ticket.requester_id) return { emailed: false };
  const [{ data: requester }, { data: ws }] = await Promise.all([
    caller.supabase.from('visitors').select('email, name').eq('id', ticket.requester_id).maybeSingle(),
    caller.supabase.from('workspaces').select('name, smtp_settings').eq('id', workspaceId).maybeSingle(),
  ]);
  const smtp = ws?.smtp_settings as SMTPSettingsConfig | null | undefined;
  if (!requester?.email || !isValidEmail(requester.email)) return { emailed: false, emailError: 'The requester has no email address.' };
  if (!smtp?.enabled || !smtp.host || !smtp.user || !smtp.pass) {
    return { emailed: false, emailError: 'Saved, but not emailed: SMTP is not set up for this workspace.' };
  }
  const sent = await sendSmtpEmail(smtp, {
    to: requester.email,
    subject: `[#${ticket.number}] ${ticket.subject || `Your request to ${ws?.name || 'support'}`}`,
    html: `<div style="font-family:sans-serif;white-space:pre-wrap;line-height:1.5">${escapeHtml(body)}</div>`,
  });
  return sent.success ? { emailed: true } : { emailed: false, emailError: sent.error || 'Email could not be sent.' };
}

/* ── Creating tickets ─────────────────────────────────────────────────── */

export async function createTicketAction(
  workspaceId: string,
  input: {
    requesterName: string;
    requesterEmail: string;
    subject: string;
    body: string;
    channel: TicketChannel;
    priority?: TicketPriority;
    type?: TicketType;
    assigneeId?: string | null;
    groupId?: string | null;
    tags?: string[];
  }
): Promise<Ticket> {
  const caller = await assertTicketAccess(workspaceId);
  const { supabase } = caller;
  const email = (input.requesterEmail || '').trim().toLowerCase();
  const subject = (input.subject || '').trim();
  const body = (input.body || '').trim();
  if (!isValidEmail(email)) throw new Error('Enter the requester’s email address.');
  if (!subject) throw new Error('Give the ticket a subject.');
  if (!body) throw new Error('Describe the request.');
  const channel: TicketChannel = TICKET_CHANNELS.includes(input.channel) ? input.channel : 'email';

  const patch = sanitizeTicketPatch({
    priority: input.priority,
    type: input.type,
    assignee_id: input.assigneeId ?? undefined,
    group_id: input.groupId ?? undefined,
    tags: input.tags,
  });
  await assertReferences(caller, workspaceId, patch);

  // One requester per email address in a workspace.
  let { data: visitor } = await supabase
    .from('visitors')
    .select('id')
    .eq('workspace_id', workspaceId)
    .ilike('email', email)
    .order('first_seen_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!visitor) {
    const { data: created, error } = await supabase
      .from('visitors')
      .insert({
        workspace_id: workspaceId,
        email,
        name: (input.requesterName || '').trim() || email.split('@')[0],
        channel: 'web',
        is_online: false,
      })
      .select('id')
      .single();
    if (error || !created) throw dbError(error, 'Could not create the requester.');
    visitor = created;
  }

  // The conversation is the ticket's thread; the database opens the ticket.
  const { data: conv, error: convError } = await supabase
    .from('conversations')
    .insert({
      workspace_id: workspaceId,
      visitor_id: visitor.id,
      status: 'open',
      channel: 'web',
      channel_metadata: { ticket_channel: channel, ticket_subject: subject, ticket_type: patch.type || 'question' },
    })
    .select('id')
    .single();
  if (convError || !conv) throw dbError(convError, 'Could not create the ticket.');

  const { error: msgError } = await supabase.from('messages').insert({
    conversation_id: conv.id,
    sender_type: 'visitor',
    content: body,
    metadata: { logged_by_agent_id: caller.agent.id },
  });
  if (msgError) throw dbError(msgError, 'Ticket created, but its first message could not be saved.');

  const { data: created } = await supabase
    .from('conversations')
    .select('current_ticket_id')
    .eq('id', conv.id)
    .single();
  if (!created?.current_ticket_id) throw new Error('Ticket was not created.');

  const rest = { ...patch };
  delete rest.type;
  if (Object.keys(rest).length) {
    const { error } = await supabase.from('tickets').update(rest).eq('id', created.current_ticket_id).eq('workspace_id', workspaceId);
    if (error) throw dbError(error, 'Ticket created, but some fields could not be set.');
  }
  const { data: ticket } = await supabase.from('tickets').select('*').eq('id', created.current_ticket_id).single();
  return ticket as Ticket;
}

/* ── Bulk actions, merge, search ──────────────────────────────────────── */

export interface BulkChange {
  assigneeId?: string | null;
  status?: TicketStatus;
  addTag?: string;
}

export async function bulkUpdateTicketsAction(
  workspaceId: string,
  ticketIds: string[],
  change: BulkChange
): Promise<{ updated: number; skipped: { id: string; number?: number; reason: string }[] }> {
  const caller = await assertTicketAccess(workspaceId);
  const ids = Array.from(new Set(ticketIds.filter((id) => UUID.test(id)))).slice(0, 200);
  if (!ids.length) throw new Error('Select some tickets first.');

  const patch = sanitizeTicketPatch({
    assignee_id: change.assigneeId === undefined ? undefined : change.assigneeId,
    status: change.status,
  });
  const tag = change.addTag ? normalizeTag(change.addTag) : '';
  if (!Object.keys(patch).length && !tag) throw new Error('Choose what to change.');
  await assertReferences(caller, workspaceId, patch);

  const { data: rows, error } = await caller.supabase
    .from('tickets')
    .select('id, number, status, tags')
    .eq('workspace_id', workspaceId)
    .in('id', ids);
  if (error) throw dbError(error, 'Could not load the selected tickets.');

  const skipped: { id: string; number?: number; reason: string }[] = ids
    .filter((id) => !(rows || []).some((r) => r.id === id))
    .map((id) => ({ id, reason: 'not found' }));
  let updated = 0;
  // One update per ticket so each gets its own audit entries and a closed
  // ticket only fails itself.
  for (const row of rows || []) {
    if (row.status === 'closed') {
      skipped.push({ id: row.id, number: row.number, reason: 'closed tickets are read-only' });
      continue;
    }
    const rowPatch: TicketPatch = { ...patch };
    if (tag && !(row.tags || []).includes(tag)) rowPatch.tags = [...(row.tags || []), tag];
    if (!Object.keys(rowPatch).length) continue;
    const { error: updateError } = await caller.supabase
      .from('tickets')
      .update(rowPatch)
      .eq('workspace_id', workspaceId)
      .eq('id', row.id);
    if (updateError) skipped.push({ id: row.id, number: row.number, reason: updateError.message });
    else updated += 1;
  }
  return { updated, skipped };
}

export async function mergeTicketsAction(workspaceId: string, targetId: string, sourceIds: string[]): Promise<Ticket> {
  const caller = await assertTicketAccess(workspaceId);
  const sources = Array.from(new Set(sourceIds.filter((id) => UUID.test(id) && id !== targetId)));
  if (!UUID.test(targetId) || !sources.length) throw new Error('Choose a ticket to merge into and at least one other.');
  const { data, error } = await caller.supabase.rpc('fn_merge_tickets', { p_target_id: targetId, p_source_ids: sources });
  if (error || !data) throw dbError(error, 'Could not merge the tickets.');
  const merged = data as Ticket;
  if (merged.workspace_id !== workspaceId) throw new Error('Ticket not found.');
  return merged;
}

export async function searchTicketsAction(
  workspaceId: string,
  query: string
): Promise<{ tickets: (TicketListItem & { matched_on: string })[] }> {
  const caller = await assertTicketAccess(workspaceId);
  const q = (query || '').trim().slice(0, 200);
  if (!q) return { tickets: [] };
  const { data: hits, error } = await caller.supabase.rpc('fn_search_tickets', {
    p_workspace_id: workspaceId,
    p_query: q,
    p_limit: 50,
  });
  if (error) throw dbError(error, 'Search failed.');
  const matches = (hits as { ticket_id: string; matched_on: string }[]) || [];
  if (!matches.length) return { tickets: [] };
  const { data: rows } = await caller.supabase
    .from('tickets')
    .select(LIST_COLUMNS)
    .eq('workspace_id', workspaceId)
    .in('id', matches.map((m) => m.ticket_id));
  const byId = new Map(((rows as unknown as TicketListItem[]) || []).map((r) => [r.id, r]));
  return {
    tickets: matches
      .map((m) => (byId.has(m.ticket_id) ? { ...byId.get(m.ticket_id)!, matched_on: m.matched_on } : null))
      .filter((t): t is TicketListItem & { matched_on: string } => t !== null),
  };
}
