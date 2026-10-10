'use server';

import { createClient } from '@/lib/supabase/server';
import { Agent, Article, HelpSection, Workspace } from '@/types/database';
import {
  syncArticleChunks,
  deleteArticleChunks,
  syncWorkspaceArticleEmbeddings,
} from '@/lib/ai/semantic-retrieval';
import { generateSlug } from '@/lib/slug';
import { after } from 'next/server';
import { invalidateHelpIndex } from '@/lib/ai/help-answer';
import { getWorkspaceAccess } from '@/lib/team/access';
import type { Capability } from '@/lib/team/permissions';
import { assertWorkspaceLimit } from '@/lib/plans/enforce';

/**
 * Brings the assistant's knowledge up to date after a help-centre change.
 *
 * Run with after() rather than fire-and-forget: a serverless function is
 * frozen once the action returns, which used to cut the re-embedding off
 * halfway and leave the assistant answering from the old article.
 */
function refreshKnowledge(workspaceId: string, task: () => Promise<unknown>) {
  invalidateHelpIndex(workspaceId);
  after(async () => {
    try {
      await task();
    } catch (err) {
      console.error('[Help Desk] Knowledge sync failed:', err);
    }
  });
}

/**
 * Ensures the caller is an active member of the workspace whose role allows
 * `capability`: reading needs `view`, changing articles `edit_content`.
 */
async function assertAgent(
  workspaceId: string,
  capability: Capability = 'edit_content'
): Promise<{ user: { id: string }; agent: Agent }> {
  const { user, agent } = await getWorkspaceAccess(workspaceId, capability);
  return { user, agent: agent as unknown as Agent };
}



/**
 * Ensures an article slug is unique within a workspace.
 * If a collision occurs with another article or an existing redirect,
 * appends -2, -3, etc.
 */
export async function ensureUniqueArticleSlug(
  supabase: any,
  workspaceId: string,
  rawSlugOrTitle: string,
  excludeArticleId?: string
): Promise<string> {
  const base = generateSlug(rawSlugOrTitle) || 'article';

  const [articlesRes, redirectsRes] = await Promise.all([
    supabase
      .from('articles')
      .select('id, slug')
      .eq('workspace_id', workspaceId),
    supabase
      .from('article_slug_redirects')
      .select('article_id, old_slug')
      .eq('workspace_id', workspaceId),
  ]);

  const takenSlugs = new Set<string>();

  (articlesRes.data || []).forEach((row: any) => {
    if (row.slug && row.id !== excludeArticleId) {
      takenSlugs.add(row.slug.toLowerCase().trim());
    }
  });

  (redirectsRes.data || []).forEach((row: any) => {
    if (row.old_slug && row.article_id !== excludeArticleId) {
      takenSlugs.add(row.old_slug.toLowerCase().trim());
    }
  });

  if (!takenSlugs.has(base)) {
    return base;
  }

  let counter = 2;
  while (takenSlugs.has(`${base}-${counter}`)) {
    counter++;
  }
  return `${base}-${counter}`;
}

/**
 * Fetch all sections, articles, and calculated KPI metrics for the Help Desk.
 */
export async function getHelpDeskDataAction(workspaceId: string) {
  await assertAgent(workspaceId, 'view');
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
  await assertAgent(workspaceId, 'view');
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

  await assertAgent(workspaceId, 'view');
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

  const trimmedName = data.name.trim();
  if (!trimmedName) {
    throw new Error('Section name is required and cannot be empty.');
  }

  // Determine highest existing order index
  const { data: existingSections, error: listErr } = await supabase
    .from('help_sections')
    .select('id, name, order_index')
    .eq('workspace_id', workspaceId);

  if (listErr) throw new Error(listErr.message);

  const highestExistingOrder = (existingSections || []).reduce(
    (max, s) => Math.max(max, s.order_index ?? 0),
    0
  );

  let targetOrder: number;
  if (data.order_index !== undefined && data.order_index > 0) {
    // Reject duplicate order number with a clear message
    const duplicate = (existingSections || []).find(
      (s) => (s.order_index ?? 0) === data.order_index
    );
    if (duplicate) {
      throw new Error(
        `Order number #${data.order_index} is already assigned to "${duplicate.name}". Please choose another order number or drag to reorder.`
      );
    }
    targetOrder = data.order_index;
  } else {
    // Default order number must be (highest existing order + 1), not (section count + 1)
    targetOrder = highestExistingOrder + 1;
  }

  const slug = generateSlug(trimmedName);

  const { data: inserted, error } = await supabase
    .from('help_sections')
    .insert({
      workspace_id: workspaceId,
      name: trimmedName,
      slug,
      description: data.description?.trim() || null,
      icon: data.icon?.trim() || '📚',
      order_index: targetOrder,
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

  if (data.name !== undefined && !data.name.trim()) {
    throw new Error('Section name is required and cannot be empty.');
  }

  if (data.order_index !== undefined && data.order_index > 0) {
    const { data: duplicate } = await supabase
      .from('help_sections')
      .select('id, name')
      .eq('workspace_id', workspaceId)
      .eq('order_index', data.order_index)
      .neq('id', sectionId)
      .maybeSingle();

    if (duplicate) {
      throw new Error(
        `Order number #${data.order_index} is already assigned to "${duplicate.name}".`
      );
    }
  }

  const updatePayload: any = { updated_at: new Date().toISOString() };
  if (data.name !== undefined) {
    updatePayload.name = data.name.trim();
    updatePayload.slug = generateSlug(data.name);
  }
  if (data.description !== undefined) updatePayload.description = data.description.trim() || null;
  if (data.icon !== undefined) updatePayload.icon = data.icon.trim() || '📚';
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

    // Re-sync article chunks with updated section name in background
    refreshKnowledge(workspaceId, () => syncWorkspaceArticleEmbeddings(workspaceId));
  }

  return { success: true, section: updated as HelpSection };
}

export async function reorderHelpSectionsAction(
  workspaceId: string,
  orderedSectionIds: string[]
) {
  await assertAgent(workspaceId);
  const supabase = await createClient();

  // Assign sequential 1..N order_index to eliminate gaps and enforce exact order
  const updates = orderedSectionIds.map((id, index) =>
    supabase
      .from('help_sections')
      .update({ order_index: index + 1, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('workspace_id', workspaceId)
  );

  const results = await Promise.all(updates);
  const failed = results.find((r) => r.error);
  if (failed?.error) {
    throw new Error(failed.error.message);
  }

  return { success: true };
}

export async function deleteHelpSectionAction(
  workspaceId: string,
  sectionId: string,
  moveToSectionId?: string | null
) {
  await assertAgent(workspaceId);
  const supabase = await createClient();

  // Check if articles exist in this section
  const { data: articles, error: artErr } = await supabase
    .from('articles')
    .select('id, title')
    .eq('section_id', sectionId)
    .eq('workspace_id', workspaceId);

  if (artErr) throw new Error(artErr.message);

  if (articles && articles.length > 0) {
    if (moveToSectionId) {
      // Find the target section name
      const { data: targetSection, error: targetErr } = await supabase
        .from('help_sections')
        .select('id, name')
        .eq('id', moveToSectionId)
        .eq('workspace_id', workspaceId)
        .single();

      if (targetErr || !targetSection) {
        throw new Error('Destination section not found.');
      }

      const { error: moveErr } = await supabase
        .from('articles')
        .update({
          section_id: targetSection.id,
          category: targetSection.name,
        })
        .eq('section_id', sectionId)
        .eq('workspace_id', workspaceId);

      if (moveErr) throw new Error(moveErr.message);

      // Re-sync article embeddings in background
      refreshKnowledge(workspaceId, () => syncWorkspaceArticleEmbeddings(workspaceId));
    } else {
      // Check if other sections exist
      const { data: otherSections } = await supabase
        .from('help_sections')
        .select('id')
        .eq('workspace_id', workspaceId)
        .neq('id', sectionId);

      if (otherSections && otherSections.length > 0) {
        throw new Error(
          'This section contains articles. Please specify a destination section to move them to before deleting.'
        );
      }

      // If no other section exists, clear section_id
      await supabase
        .from('articles')
        .update({ section_id: null })
        .eq('section_id', sectionId)
        .eq('workspace_id', workspaceId);
    }
  }

  const { error } = await supabase
    .from('help_sections')
    .delete()
    .eq('id', sectionId)
    .eq('workspace_id', workspaceId);

  if (error) throw new Error(error.message);
  return { success: true };
}

export async function migrateHelpDeskArticlesAction(workspaceId: string) {
  await assertAgent(workspaceId);
  const supabase = await createClient();

  // 1. Fetch all existing sections
  const { data: sections, error: secErr } = await supabase
    .from('help_sections')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('order_index', { ascending: true });

  if (secErr) throw new Error(secErr.message);

  const existingSections: HelpSection[] = (sections || []) as HelpSection[];
  const validSectionIds = new Set(existingSections.map((s) => s.id));

  // Map lowercase section name -> HelpSection
  const sectionByName = new Map<string, HelpSection>();
  for (const sec of existingSections) {
    sectionByName.set(sec.name.trim().toLowerCase(), sec);
  }

  let highestOrder = existingSections.reduce(
    (max, s) => Math.max(max, s.order_index ?? 0),
    0
  );

  // 2. Fetch all articles for this workspace
  const { data: articles, error: artErr } = await supabase
    .from('articles')
    .select('id, title, category, section_id')
    .eq('workspace_id', workspaceId);

  if (artErr) throw new Error(artErr.message);

  let migratedCount = 0;
  let createdSectionsCount = 0;

  for (const art of articles || []) {
    const isOrphaned = !art.section_id || !validSectionIds.has(art.section_id);
    if (!isOrphaned) {
      continue;
    }

    // Determine target category name: use legacy category text, or default to "General"
    let targetName = (art.category || '').trim();
    if (!targetName) {
      targetName = 'General';
    }

    // Match or create section
    const lowerTarget = targetName.toLowerCase();
    let targetSection = sectionByName.get(lowerTarget);

    if (!targetSection) {
      highestOrder += 1;
      const slug = generateSlug(targetName);
      const { data: newSec, error: createSecErr } = await supabase
        .from('help_sections')
        .insert({
          workspace_id: workspaceId,
          name: targetName,
          slug,
          description: `${targetName} articles and guides`,
          icon: '📚',
          order_index: highestOrder,
        })
        .select()
        .single();

      if (createSecErr || !newSec) {
        throw new Error(
          createSecErr?.message ||
            `Failed to create section "${targetName}" during migration.`
        );
      }

      targetSection = newSec as HelpSection;
      existingSections.push(targetSection);
      validSectionIds.add(targetSection.id);
      sectionByName.set(lowerTarget, targetSection);
      createdSectionsCount += 1;
    }

    // Attach article to this section
    const { error: updateErr } = await supabase
      .from('articles')
      .update({
        section_id: targetSection.id,
        category: targetSection.name,
      })
      .eq('id', art.id)
      .eq('workspace_id', workspaceId);

    if (updateErr) {
      throw new Error(
        `Failed to attach article "${art.title}" to section "${targetSection.name}": ${updateErr.message}`
      );
    }

    migratedCount += 1;
  }

  if (migratedCount > 0) {
    refreshKnowledge(workspaceId, () => syncWorkspaceArticleEmbeddings(workspaceId));
  }

  return {
    success: true,
    migratedCount,
    createdSectionsCount,
    totalArticles: (articles || []).length,
  };
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
  await assertWorkspaceLimit(workspaceId, 'max_articles');
  const supabase = await createClient();

  const rawSlug = data.slug?.trim() || data.title;
  const slug = await ensureUniqueArticleSlug(supabase, workspaceId, rawSlug);

  // If this slug was previously recorded as a redirect, remove it to prevent redirect loop
  await supabase
    .from('article_slug_redirects')
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('old_slug', slug);

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
  if (data.order_index === undefined || data.order_index <= 0) {
    let query = supabase
      .from('articles')
      .select('order_index')
      .eq('workspace_id', workspaceId);
    if (data.section_id) {
      query = query.eq('section_id', data.section_id);
    }
    const { data: lastArt } = await query
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
      status: data.status || 'draft',
      order_index: orderIndex,
      author_id: agent.id,
      views_count: 0,
      helpful_count: 0,
      not_helpful_count: 0,
    })
    .select('*, author:agents(id, name, avatar_url), section:help_sections(id, name, icon)')
    .single();

  if (error) throw new Error(error.message);

  if (inserted.status === 'published') {
    refreshKnowledge(workspaceId, () => syncArticleChunks(inserted.id, workspaceId));
  }

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

  // Fetch current article to inspect existing slug and section_id
  const { data: existing, error: fetchErr } = await supabase
    .from('articles')
    .select('id, slug, title, section_id')
    .eq('workspace_id', workspaceId)
    .eq('id', articleId)
    .maybeSingle();

  if (fetchErr || !existing) {
    throw new Error('Article not found');
  }

  const updatePayload: any = { updated_at: new Date().toISOString() };
  if (data.title !== undefined) {
    updatePayload.title = data.title.trim();
  }

  // IMPORTANT: Slugs are generated once from title upon creation and remain editable.
  // When updating, ONLY update slug if data.slug was explicitly provided and non-empty.
  // Editing the title must NEVER automatically overwrite or re-generate the slug!
  if (data.slug !== undefined && data.slug.trim()) {
    const rawSlug = data.slug.trim();
    const newSlug = await ensureUniqueArticleSlug(supabase, workspaceId, rawSlug, articleId);
    updatePayload.slug = newSlug;

    const oldSlug = existing.slug?.trim();
    if (oldSlug && oldSlug.toLowerCase() !== newSlug.toLowerCase()) {
      // Record redirect from old_slug to this article
      await supabase
        .from('article_slug_redirects')
        .upsert(
          {
            workspace_id: workspaceId,
            article_id: articleId,
            old_slug: oldSlug,
            created_at: new Date().toISOString(),
          },
          { onConflict: 'workspace_id,old_slug' }
        );

      // If newSlug was previously an old_slug in article_slug_redirects, delete it to prevent loops
      await supabase
        .from('article_slug_redirects')
        .delete()
        .eq('workspace_id', workspaceId)
        .eq('old_slug', newSlug);
    }
  }

  if (data.section_id !== undefined) updatePayload.section_id = data.section_id || null;
  if (data.summary !== undefined) updatePayload.summary = data.summary?.trim() || null;
  if (data.content !== undefined) updatePayload.content = data.content.trim();
  if (data.status !== undefined) updatePayload.status = data.status;
  if (data.order_index !== undefined) {
    if (data.order_index <= 0) {
      let targetSectionId = data.section_id;
      if (targetSectionId === undefined) {
        targetSectionId = existing?.section_id;
      }
      let query = supabase
        .from('articles')
        .select('order_index')
        .eq('workspace_id', workspaceId);
      if (targetSectionId) {
        query = query.eq('section_id', targetSectionId);
      }
      const { data: lastArt } = await query
        .order('order_index', { ascending: false })
        .limit(1)
        .maybeSingle();
      updatePayload.order_index = (lastArt?.order_index ?? 0) + 1;
    } else {
      updatePayload.order_index = data.order_index;
    }
  }

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

  if (updated.status === 'published') {
    refreshKnowledge(workspaceId, () => syncArticleChunks(articleId, workspaceId));
  } else {
    refreshKnowledge(workspaceId, () => deleteArticleChunks(articleId));
  }

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
  refreshKnowledge(workspaceId, () => deleteArticleChunks(articleId));
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

  if (newStatus === 'published') {
    refreshKnowledge(workspaceId, () => syncArticleChunks(articleId, workspaceId));
  } else {
    refreshKnowledge(workspaceId, () => deleteArticleChunks(articleId));
  }

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
  await assertAgent(workspaceId, 'manage_settings');
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
