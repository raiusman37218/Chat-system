'use server';

import { createClient } from '@/lib/supabase/server';
import { invalidateHelpIndex } from '@/lib/ai/help-answer';
import { testProvider, type ProviderConfig } from '@/lib/ai/provider';

/**
 * Internal team knowledge, and the questions the help centre could not answer.
 *
 * Both sit behind the same tenancy check as the rest of the dashboard. Notes in
 * particular are private by design — the whole point of the feature is that
 * they are not published — so nothing here is reachable without a workspace
 * agent's session.
 */

export interface KnowledgeNote {
  id: string;
  workspace_id: string;
  title: string;
  content: string;
  tags: string[];
  visibility: 'agent_only' | 'assistant';
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface UnansweredQuestion {
  id: string;
  question: string;
  reason: string | null;
  times_asked: number;
  status: 'open' | 'answered' | 'ignored';
  last_conversation_id: string | null;
  first_asked_at: string;
  last_asked_at: string;
}

async function assertAgent(workspaceId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized: sign in again.');

  const { data: agent } = await supabase
    .from('agents')
    .select('id, workspace_id')
    .eq('id', user.id)
    .maybeSingle();

  if (agent?.workspace_id === workspaceId) return { supabase, agentId: user.id };

  const { data: ws } = await supabase
    .from('workspaces')
    .select('owner_id')
    .eq('id', workspaceId)
    .maybeSingle();

  if (ws?.owner_id === user.id) return { supabase, agentId: user.id };
  throw new Error('Forbidden: this workspace is not yours.');
}

/* ── Notes ────────────────────────────────────────────────────────────── */

export async function listKnowledgeNotesAction(
  workspaceId: string
): Promise<KnowledgeNote[]> {
  const { supabase } = await assertAgent(workspaceId);
  const { data, error } = await supabase
    .from('knowledge_notes')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('updated_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data as KnowledgeNote[]) || [];
}

export async function saveKnowledgeNoteAction(
  workspaceId: string,
  note: {
    id?: string;
    title: string;
    content: string;
    tags?: string[];
    visibility?: 'agent_only' | 'assistant';
  }
): Promise<KnowledgeNote> {
  const { supabase, agentId } = await assertAgent(workspaceId);

  const title = note.title.trim();
  if (!title) throw new Error('Give the note a title.');

  const payload = {
    workspace_id: workspaceId,
    title,
    content: note.content ?? '',
    tags: (note.tags || []).map((t) => t.trim()).filter(Boolean),
    visibility: note.visibility || 'agent_only',
    updated_at: new Date().toISOString(),
  };

  const query = note.id
    ? supabase
        .from('knowledge_notes')
        .update(payload)
        .eq('id', note.id)
        .eq('workspace_id', workspaceId)
    : supabase
        .from('knowledge_notes')
        .insert({ ...payload, created_by: agentId });

  const { data, error } = await query.select().single();
  if (error) throw new Error(error.message);

  // The assistant caches the index for a minute; a note the team just changed
  // should take effect on the next message, not the next minute.
  invalidateHelpIndex(workspaceId);
  return data as KnowledgeNote;
}

export async function deleteKnowledgeNoteAction(
  workspaceId: string,
  noteId: string
): Promise<void> {
  const { supabase } = await assertAgent(workspaceId);
  const { error } = await supabase
    .from('knowledge_notes')
    .delete()
    .eq('id', noteId)
    .eq('workspace_id', workspaceId);

  if (error) throw new Error(error.message);
  invalidateHelpIndex(workspaceId);
}

/* ── Gaps ─────────────────────────────────────────────────────────────── */

export async function listUnansweredQuestionsAction(
  workspaceId: string,
  status: 'open' | 'answered' | 'ignored' | 'all' = 'open'
): Promise<UnansweredQuestion[]> {
  const { supabase } = await assertAgent(workspaceId);

  let query = supabase
    .from('unanswered_questions')
    .select('*')
    .eq('workspace_id', workspaceId)
    // Most-asked first: the biggest gap is the one to write about next.
    .order('times_asked', { ascending: false })
    .order('last_asked_at', { ascending: false })
    .limit(200);

  if (status !== 'all') query = query.eq('status', status);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data as UnansweredQuestion[]) || [];
}

export async function updateUnansweredStatusAction(
  workspaceId: string,
  id: string,
  status: 'open' | 'answered' | 'ignored',
  resolved?: { articleId?: string; noteId?: string }
): Promise<void> {
  const { supabase } = await assertAgent(workspaceId);
  const { error } = await supabase
    .from('unanswered_questions')
    .update({
      status,
      resolved_article_id: resolved?.articleId ?? null,
      resolved_note_id: resolved?.noteId ?? null,
    })
    .eq('id', id)
    .eq('workspace_id', workspaceId);

  if (error) throw new Error(error.message);
}

/* ── Model provider ───────────────────────────────────────────────────── */

export async function saveAiProviderAction(
  workspaceId: string,
  settings: {
    enabled: boolean;
    auto_response_enabled: boolean;
    provider: ProviderConfig['provider'];
    model?: string | null;
    api_key?: string | null;
    base_url?: string | null;
    system_prompt?: string | null;
  }
): Promise<void> {
  const { supabase } = await assertAgent(workspaceId);

  const { data: existing } = await supabase
    .from('workspaces')
    .select('ai_settings')
    .eq('id', workspaceId)
    .maybeSingle();

  const previous = existing?.ai_settings || {};

  // An empty key field means "leave it alone", not "delete it" — the UI shows
  // a masked placeholder rather than the stored key, so blank is the normal
  // state of the input on every visit after the first.
  const apiKey =
    settings.api_key && settings.api_key.trim()
      ? settings.api_key.trim()
      : previous.api_key ?? previous.anthropic_api_key ?? null;

  const { error } = await supabase
    .from('workspaces')
    .update({
      ai_settings: {
        ...previous,
        enabled: settings.enabled,
        auto_response_enabled: settings.auto_response_enabled,
        provider: settings.provider,
        model: settings.model?.trim() || null,
        api_key: apiKey,
        base_url: settings.base_url?.trim() || null,
        system_prompt: settings.system_prompt?.trim() || null,
        // Superseded by api_key; cleared so there is one place to look.
        anthropic_api_key: null,
      },
    })
    .eq('id', workspaceId);

  if (error) throw new Error(error.message);
}

/**
 * Calls the configured provider once and reports what happened, so a wrong key
 * is discovered in Settings rather than by a customer waiting on a reply.
 */
export async function testAiProviderAction(
  workspaceId: string,
  override?: Partial<ProviderConfig>
): Promise<{ ok: boolean; model?: string; error?: string }> {
  const { supabase } = await assertAgent(workspaceId);

  const { data } = await supabase
    .from('workspaces')
    .select('ai_settings')
    .eq('id', workspaceId)
    .maybeSingle();

  const stored = data?.ai_settings || {};
  const config: ProviderConfig = {
    provider: (override?.provider ?? stored.provider ?? 'anthropic') as ProviderConfig['provider'],
    model: override?.model ?? stored.model ?? null,
    // A key typed but not yet saved is testable; otherwise fall back to stored.
    apiKey: override?.apiKey || stored.api_key || stored.anthropic_api_key || null,
    baseUrl: override?.baseUrl ?? stored.base_url ?? null,
  };

  return testProvider(config);
}
