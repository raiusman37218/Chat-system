import { createClient } from '@supabase/supabase-js';
import type { ProviderConfig, ProviderId } from './provider';
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

/** Where a piece of knowledge came from. */
export type KnowledgeSource = 'article' | 'note';

export interface HelpAnswer {
  /** Whether the answer came from a published article or an internal note. */
  source?: KnowledgeSource;
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
  const [{ data: sections }, { data: articles }, { data: notes }] = await Promise.all([
    supabase
      .from('help_sections')
      .select('id, name')
      .eq('workspace_id', workspaceId),
    supabase
      .from('articles')
      .select('id, title, slug, summary, content, category, section_id')
      .eq('workspace_id', workspaceId)
      .eq('status', 'published'),
    // Through an RPC, not a table read: knowledge_notes is behind row level
    // security and this runs on the anonymous key, so a direct select returns
    // nothing. The function returns only notes marked 'assistant', which makes
    // the privacy boundary the database's job rather than this file's.
    supabase.rpc('fn_assistant_notes', { p_workspace_id: workspaceId }),
  ]);

  const sectionName = new Map((sections || []).map((s) => [s.id, s.name]));
  const docs: RetrievableArticle[] = (articles || []).map((a) => ({
    ...a,
    sectionName: a.section_id ? sectionName.get(a.section_id) ?? null : null,
  }));

  for (const n of notes || []) {
    docs.push({
      // Prefixed so the id cannot collide with an article's and so the source
      // is obvious wherever the id travels.
      id: `note:${n.id}`,
      title: n.title,
      slug: null,
      summary: null,
      content: n.content || '',
      category: null,
      section_id: null,
      sectionName: Array.isArray(n.tags) && n.tags.length ? n.tags.join(' ') : 'Team knowledge',
    });
  }

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
  /** Recorded against the gap so the owner can read it in context. */
  conversationId?: string | null;
  /** Earlier visitor turns, most recent first. */
  history?: string[];
  /** Used to open the reply; omitted when unknown. */
  visitorName?: string | null;
  /** Where the help centre lives, so the answer can link to the full article. */
  helpCenterUrl?: string | null;
}

/**
 * Logs a question the help centre could not answer.
 *
 * Deliberately fire-and-forget and deliberately silent on failure: a customer
 * waiting on a reply must not wait on analytics, and a broken log must not
 * break the conversation.
 */
export async function recordUnanswered(
  workspaceId: string,
  question: string,
  reason: string,
  conversationId?: string | null
): Promise<void> {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    await supabase.rpc('fn_record_unanswered_question', {
      p_workspace_id: workspaceId,
      p_question: question.slice(0, 1000),
      p_reason: reason,
      p_conversation_id: conversationId ?? null,
    });
  } catch {
    /* never let bookkeeping affect the reply */
  }
}

const recordGap = (req: AnswerRequest, reason: string) =>
  recordUnanswered(req.workspaceId, req.message, reason, req.conversationId);

export async function answerFromHelpCenter(
  req: AnswerRequest
): Promise<HelpAnswer> {
  // Asking for a person is not a gap in the documentation — logging it would
  // fill the backlog with "can I talk to someone".
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
    // The questions nothing answers are the articles worth writing next.
    // Previously the conversation was handed to a person and the question
    // itself was thrown away, so the same gap was rediscovered every week.
    void recordGap(req, verdict.reason);

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

  const isNote = article.id.startsWith('note:');

  // A note lives nowhere a customer can visit, so it never gets a link.
  const link =
    !isNote && req.helpCenterUrl
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
    : isNote
    ? ''
    : `\n\n(From "${article.title}" in our help centre.)`;

  return {
    text: `${opening}${passage}${citation}`,
    source: isNote ? 'note' : 'article',
    confidence: verdict.confidence,
    article: { id: article.id, title: article.title, slug: article.slug },
    reason: verdict.reason,
    alternatives: hits
      .slice(1, 3)
      // Suggesting "see also: <internal note title>" would leak the existence
      // and wording of private knowledge.
      .filter((h) => !h.article.id.startsWith('note:'))
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


/* ── Context for a language model ─────────────────────────────────────── */

export interface ModelContext {
  /** The documentation to put in front of the model. Empty when nothing fits. */
  text: string;
  /** What went in, for citation and for logging what the answer was based on. */
  used: { id: string; title: string; source: KnowledgeSource }[];
}

/**
 * The passages a model should be given to answer this question.
 *
 * Uses the same ranking as the no-API path. The model path used to select its
 * own context by counting substring hits per word — the ranker that answered
 * questions about daily drawdown with an article about leverage — so adding an
 * API key swapped a good retriever for a bad one without anyone noticing.
 */
export async function buildModelContext(
  workspaceId: string,
  question: string,
  options: { history?: string[]; limit?: number } = {}
): Promise<ModelContext> {
  const index = await loadIndex(workspaceId);
  const hits = search(index, question, {
    history: options.history,
    limit: options.limit ?? 4,
  });

  // Only what plausibly relates. Padding the prompt with the rest of the help
  // centre invites the model to answer from whatever it finds there.
  const relevant = hits.filter((h) => h.score >= 1);
  if (relevant.length === 0) return { text: '', used: [] };

  const used: ModelContext['used'] = [];
  const blocks = relevant.map((h) => {
    const a = h.article;
    const isNote = a.id.startsWith('note:');
    used.push({ id: a.id, title: a.title, source: isNote ? 'note' : 'article' });

    const label = isNote
      ? `${a.title} (internal team knowledge)`
      : a.sectionName
      ? `${a.title} — ${a.sectionName}`
      : a.title;

    // The whole article, not an excerpt: the model is better than a heuristic
    // at finding the relevant line, once the right article is in front of it.
    return `## ${label}\n${a.summary ? `${a.summary}\n` : ''}${a.content}`;
  });

  return { text: blocks.join('\n\n---\n\n'), used };
}


/**
 * Reads a workspace's `ai_settings` into a provider config.
 *
 * Older workspaces stored only `anthropic_api_key`, from when Claude was the
 * only option; that shape still works and is treated as the Anthropic provider.
 */
export function providerConfigFrom(
  aiSettings: Record<string, any> | null | undefined
): ProviderConfig | null {
  if (!aiSettings) return null;
  if (aiSettings.enabled === false) return null;

  const legacyKey = aiSettings.anthropic_api_key;
  const provider: ProviderId = (aiSettings.provider as ProviderId) || 'anthropic';

  return {
    provider,
    model: aiSettings.model ?? null,
    apiKey: aiSettings.api_key ?? legacyKey ?? null,
    baseUrl: aiSettings.base_url ?? null,
  };
}
