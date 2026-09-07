'use server';

import { createClient } from '@/lib/supabase/server';
import { Agent, Article, HelpSection, Workspace } from '@/types/database';

/**
 * Ensures the requesting user is authenticated and belongs to the specified workspace.
 */
async function assertAgent(workspaceId: string): Promise<{ user: any; agent: Agent }> {
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
    throw new Error('Forbidden: Agent does not belong to this workspace.');
  }

  return { user, agent: agent as Agent };
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

/**
 * Fetch all sections, articles, and calculated KPI metrics for the Help Desk.
 */
export async function getHelpDeskDataAction(workspaceId: string) {
  await assertAgent(workspaceId);
  const supabase = await createClient();

  const [sectionsRes, articlesRes] = await Promise.all([
    supabase
      .from('help_sections')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: true }),
    supabase
      .from('articles')
      // The list renders titles, badges and counters — never the body. Sending
      // every article's full text made opening the Help Desk proportional to
      // how much the customer had written, which is exactly backwards.
      .select(
        'id, workspace_id, section_id, title, slug, category, summary, status, order_index, ' +
          'author_id, views_count, helpful_count, not_helpful_count, created_at, updated_at, ' +
          'author:agents(id, name, avatar_url), section:help_sections(id, name, slug, icon)'
      )
      .eq('workspace_id', workspaceId)
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: true }),
  ]);

  if (sectionsRes.error) {
    throw new Error(`Failed to load sections: ${sectionsRes.error.message}`);
  }
  if (articlesRes.error) {
    throw new Error(`Failed to load articles: ${articlesRes.error.message}`);
  }

  const sections = (sectionsRes.data as HelpSection[]) || [];
  // The list projection omits `content`, so this is an Article minus its body.
  const articles = (articlesRes.data as unknown as Article[]) || [];

  // Calculate article counts per section
  const sectionCounts: Record<string, number> = {};
  articles.forEach((art) => {
    if (art.section_id) {
      sectionCounts[art.section_id] = (sectionCounts[art.section_id] || 0) + 1;
    }
  });

  const sectionsWithCount = sections.map((sec) => ({
    ...sec,
    article_count: sectionCounts[sec.id] || 0,
  }));

  // KPI calculations
  const totalArticles = articles.length;
  const publishedCount = articles.filter((a) => a.status === 'published').length;
  const draftCount = articles.filter((a) => a.status === 'draft').length;
  const totalViews = articles.reduce((sum, a) => sum + (a.views_count || 0), 0);
  const totalHelpful = articles.reduce((sum, a) => sum + (a.helpful_count || 0), 0);
  const totalNotHelpful = articles.reduce((sum, a) => sum + (a.not_helpful_count || 0), 0);
  const totalFeedback = totalHelpful + totalNotHelpful;
  // null, not 100. A brand-new help centre with zero votes was reporting a
  // perfect helpfulness score, which is a number nobody earned.
  const helpfulRate =
    totalFeedback > 0 ? Math.round((totalHelpful / totalFeedback) * 100) : null;

  return {
    sections: sectionsWithCount,
    articles,
    metrics: {
      totalArticles,
      publishedCount,
      draftCount,
      totalViews,
      totalHelpful,
      totalNotHelpful,
      helpfulRate,
    },
  };
}

/**
 * One article, body included.
 *
 * The Help Desk list no longer carries article bodies, so the editor has to
 * ask for the one it is about to open. Without this it would load an empty
 * textarea over a real article and save the blank back.
 */
export async function getArticleAction(
  workspaceId: string,
  articleId: string
): Promise<Article> {
  await assertAgent(workspaceId);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('articles')
    .select('*, author:agents(id, name, avatar_url), section:help_sections(id, name, slug, icon)')
    .eq('workspace_id', workspaceId)
    .eq('id', articleId)
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Article not found');
  }
  return data as Article;
}

/**
 * Ids of articles whose body matches `query`.
 *
 * Titles and summaries are filtered in the browser from data it already has;
 * only the bodies need the database, and they stay there.
 */
export async function searchArticleBodiesAction(
  workspaceId: string,
  query: string
): Promise<string[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  await assertAgent(workspaceId);
  const supabase = await createClient();

  // PostgREST treats these as pattern metacharacters inside a filter list.
  const safe = q.replace(/[%,()\\]/g, ' ').trim();
  if (!safe) return [];

  const { data, error } = await supabase
    .from('articles')
    .select('id')
    .eq('workspace_id', workspaceId)
    .ilike('content', `%${safe}%`)
    .limit(200);

  if (error) return [];
  return (data || []).map((r) => r.id as string);
}

/**
 * SECTION ACTIONS
 */
export async function createHelpSectionAction(
  workspaceId: string,
  data: {
    name: string;
    description?: string;
    icon?: string;
    order_index?: number;
  }
) {
  await assertAgent(workspaceId);
  const supabase = await createClient();

  const slug = generateSlug(data.name);

  const { data: inserted, error } = await supabase
    .from('help_sections')
    .insert({
      workspace_id: workspaceId,
      name: data.name.trim(),
      slug,
      description: data.description?.trim() || null,
      icon: data.icon?.trim() || '📚',
      order_index: data.order_index ?? 0,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return { success: true, section: inserted as HelpSection };
}

export async function updateHelpSectionAction(
  workspaceId: string,
  sectionId: string,
  data: {
    name?: string;
    description?: string;
    icon?: string;
    order_index?: number;
  }
) {
  await assertAgent(workspaceId);
  const supabase = await createClient();

  const updatePayload: any = { updated_at: new Date().toISOString() };
  if (data.name !== undefined) {
    updatePayload.name = data.name.trim();
    updatePayload.slug = generateSlug(data.name);
  }
  if (data.description !== undefined) updatePayload.description = data.description.trim();
  if (data.icon !== undefined) updatePayload.icon = data.icon.trim();
  if (data.order_index !== undefined) updatePayload.order_index = data.order_index;

  const { data: updated, error } = await supabase
    .from('help_sections')
    .update(updatePayload)
    .eq('id', sectionId)
    .eq('workspace_id', workspaceId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  if (data.name !== undefined) {
    // Keep legacy category column in sync for existing articles in this section
    await supabase
      .from('articles')
      .update({ category: data.name.trim() })
      .eq('section_id', sectionId)
      .eq('workspace_id', workspaceId);
  }

  return { success: true, section: updated as HelpSection };
}

export async function deleteHelpSectionAction(workspaceId: string, sectionId: string) {
  await assertAgent(workspaceId);
  const supabase = await createClient();

  // Nullify section_id in existing articles
  await supabase
    .from('articles')
    .update({ section_id: null })
    .eq('section_id', sectionId)
    .eq('workspace_id', workspaceId);

  const { error } = await supabase
    .from('help_sections')
    .delete()
    .eq('id', sectionId)
    .eq('workspace_id', workspaceId);

  if (error) throw new Error(error.message);
  return { success: true };
}

/**
 * ARTICLE ACTIONS
 */
export async function createArticleAction(
  workspaceId: string,
  data: {
    title: string;
    section_id?: string | null;
    category?: string;
    summary?: string | null;
    content: string;
    status?: 'published' | 'draft';
    slug?: string;
    order_index?: number;
  }
) {
  const { agent } = await assertAgent(workspaceId);
  const supabase = await createClient();

  const slug = data.slug?.trim() ? generateSlug(data.slug) : generateSlug(data.title);

  // If section_id provided, fetch section name for backward compatibility category
  let category = data.category?.trim() || 'General';
  if (data.section_id) {
    const { data: sec } = await supabase
      .from('help_sections')
      .select('name')
      .eq('id', data.section_id)
      .maybeSingle();
    if (sec?.name) category = sec.name;
  }

  let orderIndex = data.order_index ?? 0;
  if (data.order_index === undefined && data.section_id) {
    const { data: lastArt } = await supabase
      .from('articles')
      .select('order_index')
      .eq('workspace_id', workspaceId)
      .eq('section_id', data.section_id)
      .order('order_index', { ascending: false })
      .limit(1)
      .maybeSingle();
    orderIndex = (lastArt?.order_index ?? 0) + 1;
  }

  const { data: inserted, error } = await supabase
    .from('articles')
    .insert({
      workspace_id: workspaceId,
      section_id: data.section_id || null,
      title: data.title.trim(),
      slug,
      category,
      summary: data.summary?.trim() || null,
      content: data.content.trim(),
      status: data.status || 'published',
      order_index: orderIndex,
      author_id: agent.id,
      views_count: 0,
      helpful_count: 0,
      not_helpful_count: 0,
    })
    .select('*, author:agents(id, name, avatar_url), section:help_sections(id, name, icon)')
    .single();

  if (error) throw new Error(error.message);
  return { success: true, article: inserted as Article };
}

export async function updateArticleAction(
  workspaceId: string,
  articleId: string,
  data: {
    title?: string;
    section_id?: string | null;
    category?: string;
    summary?: string | null;
    content?: string;
    status?: 'published' | 'draft';
    slug?: string;
    order_index?: number;
  }
) {
  await assertAgent(workspaceId);
  const supabase = await createClient();

  const updatePayload: any = { updated_at: new Date().toISOString() };
  if (data.title !== undefined) {
    updatePayload.title = data.title.trim();
  }
  if (data.slug !== undefined && data.slug.trim()) {
    updatePayload.slug = generateSlug(data.slug);
  } else if (data.title !== undefined) {
    updatePayload.slug = generateSlug(data.title);
  }
  if (data.section_id !== undefined) updatePayload.section_id = data.section_id || null;
  if (data.summary !== undefined) updatePayload.summary = data.summary?.trim() || null;
  if (data.content !== undefined) updatePayload.content = data.content.trim();
  if (data.status !== undefined) updatePayload.status = data.status;
  if (data.order_index !== undefined) updatePayload.order_index = data.order_index;

  if (data.section_id) {
    const { data: sec } = await supabase
      .from('help_sections')
      .select('name')
      .eq('id', data.section_id)
      .maybeSingle();
    if (sec?.name) updatePayload.category = sec.name;
  } else if (data.category !== undefined) {
    updatePayload.category = data.category.trim();
  }

  const { data: updated, error } = await supabase
    .from('articles')
    .update(updatePayload)
    .eq('id', articleId)
    .eq('workspace_id', workspaceId)
    .select('*, author:agents(id, name, avatar_url), section:help_sections(id, name, icon)')
    .single();

  if (error) throw new Error(error.message);
  return { success: true, article: updated as Article };
}

export async function reorderArticlesAction(
  workspaceId: string,
  updates: { id: string; order_index: number }[]
) {
  await assertAgent(workspaceId);
  const supabase = await createClient();

  const promises = updates.map(({ id, order_index }) =>
    supabase
      .from('articles')
      .update({ order_index, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('workspace_id', workspaceId)
  );

  const results = await Promise.all(promises);
  const failed = results.find((r) => r.error);
  if (failed?.error) {
    throw new Error(failed.error.message);
  }

  return { success: true };
}

export async function deleteArticleAction(workspaceId: string, articleId: string) {
  await assertAgent(workspaceId);
  const supabase = await createClient();

  const { error } = await supabase
    .from('articles')
    .delete()
    .eq('id', articleId)
    .eq('workspace_id', workspaceId);

  if (error) throw new Error(error.message);
  return { success: true };
}

export async function toggleArticleStatusAction(
  workspaceId: string,
  articleId: string,
  newStatus: 'published' | 'draft'
) {
  await assertAgent(workspaceId);
  const supabase = await createClient();

  const { data: updated, error } = await supabase
    .from('articles')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', articleId)
    .eq('workspace_id', workspaceId)
    .select('*, author:agents(id, name, avatar_url), section:help_sections(id, name, icon)')
    .single();

  if (error) throw new Error(error.message);
  return { success: true, article: updated as Article };
}

/**
 * WIDGET HELP TAB CUSTOMIZATION ACTION
 */
export async function updateHelpTabSettingsAction(
  workspaceId: string,
  data: {
    label: string;
    showTab: boolean;
    icon?: string;
  }
) {
  await assertAgent(workspaceId);
  const supabase = await createClient();

  const { data: updated, error } = await supabase
    .from('workspaces')
    .update({
      help_center_tab_label: data.label.trim() || 'Help',
      show_help_tab: data.showTab,
      help_center_tab_icon: data.icon || '📖',
    })
    .eq('id', workspaceId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return { success: true, workspace: updated as Workspace };
}
