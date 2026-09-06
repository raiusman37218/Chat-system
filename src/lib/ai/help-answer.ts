import { createClient } from '@supabase/supabase-js';
import {
  buildIndex,
  search,
  assess,
  extractPassage,
  type HelpIndex,
  type RetrievableArticle,
  type Confidence,
} from './retrieval';

/**
 * Answers a customer from the workspace's own help centre, with no model API.
 *
 * The previous no-API path scored articles by counting substring hits and, when
 * something scored above an arbitrary 4, replied with the article's first 220
 * characters followed by an ellipsis. That is not an answer — it is a preview
 * of one — and it fired on questions the documentation did not cover.
 *
 * This picks the article with `retrieval.ts`, refuses to speak when the
 * evidence is thin, and quotes the passage that actually addresses the
 * question. Everything it says is text the workspace owner wrote.
 */

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://vfjsaynnubxywdbevxtx.supabase.co';
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

export interface HelpAnswer {
  /** null when the help centre cannot answer — the caller should hand over. */
  text: string | null;
  confidence: Confidence;
  /** The article the answer came from, for citation and analytics. */
  article: { id: string; title: string; slug?: string | null } | null;
  /** Human-readable explanation of the decision, for logs and tests. */
  reason: string;
  /** Other articles worth offering when the answer is only partial. */
  alternatives: { id: string; title: string; slug?: string | null }[];
}

/** Index cache. Help content changes rarely; questions arrive constantly. */
const indexCache = new Map<string, { index: HelpIndex; builtAt: number }>();
const INDEX_TTL_MS = 60_000;

export function invalidateHelpIndex(workspaceId: string) {
  indexCache.delete(workspaceId);
}

async function loadIndex(workspaceId: string): Promise<HelpIndex> {
  const cached = indexCache.get(workspaceId);
  if (cached && Date.now() - cached.builtAt < INDEX_TTL_MS) return cached.index;

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const [{ data: sections }, { data: articles }] = await Promise.all([
    supabase
      .from('help_sections')
      .select('id, name')
      .eq('workspace_id', workspaceId),
    supabase
      .from('articles')
      .select('id, title, slug, summary, content, category, section_id')
      .eq('workspace_id', workspaceId)
      .eq('status', 'published'),
  ]);

  const sectionName = new Map((sections || []).map((s) => [s.id, s.name]));
  const docs: RetrievableArticle[] = (articles || []).map((a) => ({
    ...a,
    sectionName: a.section_id ? sectionName.get(a.section_id) ?? null : null,
  }));

  const index = buildIndex(docs);
  indexCache.set(workspaceId, { index, builtAt: Date.now() });
  return index;
}

/**
 * Phrases that mean "stop answering me and fetch a person". Checked before
 * retrieval: however well the documentation matches, it is not what was asked
 * for.
 */
const HUMAN_REQUEST =
  /\b(human|real person|agent|representative|operator|someone else|live (?:support|agent|person)|talk to (?:someone|a person)|speak (?:to|with) (?:someone|a human|a person)|customer care|insan|banda)\b/i;

export function wantsHuman(message: string): boolean {
  return HUMAN_REQUEST.test(message);
}

export interface AnswerRequest {
  workspaceId: string;
  message: string;
  /** Earlier visitor turns, most recent first. */
  history?: string[];
  /** Used to open the reply; omitted when unknown. */
  visitorName?: string | null;
  /** Where the help centre lives, so the answer can link to the full article. */
  helpCenterUrl?: string | null;
}

export async function answerFromHelpCenter(
  req: AnswerRequest
): Promise<HelpAnswer> {
  if (wantsHuman(req.message)) {
    return {
      text: null,
      confidence: 'none',
      article: null,
      reason: 'customer asked for a human',
      alternatives: [],
    };
  }

  const index = await loadIndex(req.workspaceId);
  const hits = search(index, req.message, { history: req.history, limit: 4 });
  const verdict = assess(hits, req.message);

  if (verdict.confidence === 'none' || !verdict.hit) {
    return {
      text: null,
      confidence: 'none',
      article: verdict.hit
        ? {
            id: verdict.hit.article.id,
            title: verdict.hit.article.title,
            slug: verdict.hit.article.slug,
          }
        : null,
      reason: verdict.reason,
      alternatives: [],
    };
  }

  const article = verdict.hit.article;
  const passage = extractPassage(article.content, req.message, {
    history: req.history,
    maxChars: 700,
  });

  if (!passage) {
    return {
      text: null,
      confidence: 'none',
      article: { id: article.id, title: article.title, slug: article.slug },
      reason: 'matched an article with no readable body',
      alternatives: [],
    };
  }

  const link = req.helpCenterUrl
    ? `${req.helpCenterUrl.replace(/\/$/, '')}/${article.slug || article.id}`
    : null;

  // A confident answer is stated plainly. A partial one says so, because a
  // hedge the customer can see beats a wrong answer they cannot.
  const opening =
    verdict.confidence === 'high'
      ? ''
      : `I think this is what you're after — tell me if you meant something else.\n\n`;

  const citation = link
    ? `\n\nFull article: ${article.title} — ${link}`
    : `\n\n(From "${article.title}" in our help centre.)`;

  return {
    text: `${opening}${passage}${citation}`,
    confidence: verdict.confidence,
    article: { id: article.id, title: article.title, slug: article.slug },
    reason: verdict.reason,
    alternatives: hits
      .slice(1, 3)
      // Only near-ties are worth offering. At a looser threshold a question
      // about account types was answered with a suggestion about leverage.
      .filter((h) => h.score > verdict.hit!.score * 0.72)
      .map((h) => ({
        id: h.article.id,
        title: h.article.title,
        slug: h.article.slug,
      })),
  };
}
