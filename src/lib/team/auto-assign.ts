/**
 * Picks the least-loaded available agent for a conversation and assigns it.
 * Available means online, active, not a light agent and under their open-ticket
 * capacity. Used by the inbox's "auto-assign" button and the bot's handover.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Client = { from: (table: string) => any };

export interface AutoAssignResult {
  assigned: boolean;
  reason?: string;
  agent?: { id: string; name: string | null; email: string | null; avatar_url: string | null };
}

export async function autoAssignConversation(supabase: Client, conversationId: string): Promise<AutoAssignResult> {
  const { data: conv } = await supabase.from('conversations').select('id, workspace_id, assigned_agent_id').eq('id', conversationId).maybeSingle();
  if (!conv) throw new Error('Conversation not found');
  const wsId = conv.workspace_id as string | null;
  if (!wsId) return { assigned: false, reason: 'Conversation has no workspace' };

  const { data: ws } = await supabase.from('workspaces').select('auto_assignment').eq('id', wsId).maybeSingle();
  if (ws?.auto_assignment && ws.auto_assignment.enabled === false) {
    return { assigned: false, reason: 'Auto-assignment is disabled for this workspace' };
  }

  const { data: agents } = await supabase
    .from('agents')
    .select('id, name, email, avatar_url, max_open_tickets')
    .eq('workspace_id', wsId)
    .eq('status', 'online')
    .eq('is_active', true)
    .neq('role', 'light_agent');
  if (!agents?.length) return { assigned: false, reason: 'No online agents available for auto-assignment' };

  const { data: open } = await supabase
    .from('tickets')
    .select('assignee_id')
    .eq('workspace_id', wsId)
    .in('status', ['new', 'open'])
    .not('assignee_id', 'is', null);
  const load = new Map<string, number>();
  for (const t of (open as { assignee_id: string }[] | null) || []) load.set(t.assignee_id, (load.get(t.assignee_id) || 0) + 1);

  type A = { id: string; name: string | null; email: string | null; avatar_url: string | null; max_open_tickets: number | null };
  const available = (agents as A[])
    .filter((a) => a.max_open_tickets == null || (load.get(a.id) || 0) < a.max_open_tickets)
    .sort((a, b) => (load.get(a.id) || 0) - (load.get(b.id) || 0));
  if (!available.length) return { assigned: false, reason: 'Everyone available is at their capacity' };

  const chosen = available[0];
  const { error } = await supabase
    .from('conversations')
    .update({ assigned_agent_id: chosen.id, updated_at: new Date().toISOString() })
    .eq('id', conversationId);
  if (error) throw error;
  return { assigned: true, agent: { id: chosen.id, name: chosen.name, email: chosen.email, avatar_url: chosen.avatar_url } };
}
