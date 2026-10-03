import { serviceClient } from '@/lib/supabase/service';
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
import {
  buildSemanticModelContext,
  hybridSearchWorkspaceChunks,
} from './semantic-retrieval';
import type { RetrievedChunk } from '@/types/database';

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

/**
 * Index cache. Help content changes rarely; questions arrive constantly.
 *
 * Building the index takes three queries and over a second, which blew the
 * reply-time budget once a minute when the entry expired. An expired entry is
 * now served as-is while a fresh one builds in the background, so only the very
 * first question on a cold server waits for it.
 */
const indexCache = new Map<string, { index: HelpIndex; builtAt: number }>();
const rebuilding = new Map<string, Promise<HelpIndex>>();
const INDEX_TTL_MS = 60_000;

export function invalidateHelpIndex(workspaceId: string) {
  indexCache.delete(workspaceId);
}

/** Starts loading the index early, so it is ready by the time it is needed. */
export function warmHelpIndex(workspaceId: string): void {
  loadIndex(workspaceId).catch(() => {});
}

function loadIndex(workspaceId: string): Promise<HelpIndex> {
  const cached = indexCache.get(workspaceId);
  if (cached && Date.now() - cached.builtAt < INDEX_TTL_MS) return Promise.resolve(cached.index);

  let pending = rebuilding.get(workspaceId);
  if (!pending) {
    pending = buildWorkspaceIndex(workspaceId).finally(() => rebuilding.delete(workspaceId));
    rebuilding.set(workspaceId, pending);
    pending.catch(() => {});
  }
  return cached ? Promise.resolve(cached.index) : pending;
}

async function buildWorkspaceIndex(workspaceId: string): Promise<HelpIndex> {
  const supabase = serviceClient();
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
  // A bare "agent" is not on the list: traders say "EA" and "trading agent",
  // and each false match turns the assistant off for the whole conversation.
  /\b(human|real person|(?:real|live|human) agent|representative|operator|live (?:support|person)|(?:talk|speak) (?:to|with) (?:someone|a human|a person|an agent|support)|customer care|jonli\s+(?:odam|operator|xodim)|odam\s+bilan\s+gaplash\w*|xodim\s+bilan\s+gaplash\w*)\b/i;

/** Arabic has no \b in JS regex, so its phrases are matched on their own. */
const HUMAN_REQUEST_AR =
  /موظف|شخص حقيقي|إنسان حقيقي|انسان حقيقي|التحدث مع (?:شخص|موظف|إنسان|انسان|الدعم)|خدمة العملاء|وكيل بشري/;

export function wantsHuman(message: string): boolean {
  return HUMAN_REQUEST.test(message) || HUMAN_REQUEST_AR.test(message);
}

export interface AnswerRequest {
  workspaceId: string;
  message: string;
  /** Recorded against the gap so the owner can read it in context. */
  conversationId?: string | null;
  /** Earlier visitor turns, most recent first. */
  history?: string[];
  recentMessages?: { sender_type?: string; role?: string; content?: string }[];
  /** Used to open the reply; omitted when unknown. */
  visitorName?: string | null;
  /** Where the help centre lives, so the answer can link to the full article. */
  helpCenterUrl?: string | null;
  chunks?: RetrievedChunk[];
  belowThreshold?: boolean;
  queryEmbedding?: number[] | null;
  intent?: string;
  providerConfig?: ProviderConfig | null;
}

/**
 * Logs a question the help centre could not answer.
 * If an embedding is provided, groups near-duplicate gaps semantically via pgvector.
 *
 * Deliberately fire-and-forget and deliberately silent on failure: a customer
 * waiting on a reply must not wait on analytics, and a broken log must not
 * break the conversation.
 */
export async function recordUnanswered(
  workspaceId: string,
  question: string,
  reason: string,
  conversationId?: string | null,
  embedding?: number[] | null
): Promise<void> {
  try {
    const supabase = serviceClient();
    if (embedding && embedding.length > 0) {
      await supabase.rpc('fn_record_unanswered_question_semantic', {
        p_workspace_id: workspaceId,
        p_question: question.slice(0, 1000),
        p_embedding: embedding,
        p_reason: reason,
        p_conversation_id: conversationId ?? null,
        p_similarity_threshold: 0.82,
      });
    } else {
      await supabase.rpc('fn_record_unanswered_question', {
        p_workspace_id: workspaceId,
        p_question: question.slice(0, 1000),
        p_reason: reason,
        p_conversation_id: conversationId ?? null,
      });
    }
  } catch {
    /* never let bookkeeping affect the reply */
  }
}

const recordGap = (req: AnswerRequest, reason: string) => {
  // Handover Rule 4: Only log a knowledge gap for intent "question" with no answer.
  if (req.intent && req.intent !== 'question') {
    return Promise.resolve();
  }
  return recordUnanswered(req.workspaceId, req.message, reason, req.conversationId, req.queryEmbedding);
};

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

  // Never send an article when similarity is below threshold
  if (req.belowThreshold) {
    void recordGap(req, 'below threshold');
    return {
      text: null,
      confidence: 'none',
      article: null,
      reason: 'semantic similarity below threshold',
      alternatives: [],
    };
  }

  // If semantic retrieval provided chunks:
  // Show the single best article ONLY when similarity is high; otherwise return null ("not sure" reply)
  if (req.chunks && req.chunks.length > 0) {
    const topChunk = req.chunks[0];
    const isHighSimilarity =
      topChunk.similarity >= 0.65 || topChunk.combined_score >= 0.55;

    if (isHighSimilarity) {
      const cleanContent = topChunk.content
        .replace(/^Article:\s*.*?\nSection:\s*.*?\n\n/i, '')
        .trim();
      const link = req.helpCenterUrl
        ? `${req.helpCenterUrl.replace(/\/$/, '')}/${topChunk.article_slug || topChunk.article_id}`
        : null;

      // Output plain text or simple markdown: bold title, no "###" headings
      const heading = `**${topChunk.article_title}**\n\n`;
      const body = cleanContent.replace(/^\s*•\s+/gm, '- ').replace(/\n{3,}/g, '\n\n');
      const citation = link ? `\n\n[Read more](${link})` : '';

      return {
        text: `${heading}${body}${citation}`,
        source: 'article',
        confidence: 'high',
        article: { id: topChunk.article_id, title: topChunk.article_title, slug: topChunk.article_slug },
        reason: `semantic hybrid high match (score: ${topChunk.combined_score.toFixed(2)}, similarity: ${topChunk.similarity.toFixed(2)})`,
        alternatives: [], // Single best article only
      };
    } else {
      // Similarity is not high -> refuse to show article, fall back to "not sure" reply
      void recordGap(req, `similarity not high enough for no-api fallback (${topChunk.similarity.toFixed(2)})`);
      return {
        text: null,
        confidence: 'none',
        article: null,
        reason: 'similarity not high enough for fallback',
        alternatives: [],
      };
    }
  }

  const index = await loadIndex(req.workspaceId);
  const hits = search(index, req.message, { history: req.history, limit: 4 });
  const verdict = assess(hits, req.message);

  // In no-API fallback, only show single best article when confidence is high
  if (verdict.confidence !== 'high' || !verdict.hit) {
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
  const link =
    !isNote && req.helpCenterUrl
      ? `${req.helpCenterUrl.replace(/\/$/, '')}/${article.slug || article.id}`
      : null;

  // Simple markdown: bold title, no "###" headings
  const heading = isNote ? '' : `**${article.title}**\n\n`;
  const body = passage
    .replace(/^\s*•\s+/gm, '- ')
    .replace(/^[ \t]*\|?[ \t]*:?-{2,}.*$/gm, '')
    .replace(/^[ \t]*\|(.+)\|[ \t]*$/gm, (_row, cells: string) => {
      const [first, ...rest] = cells.split('|').map((c) => c.trim());
      return rest.length ? `- **${first}:** ${rest.join(' · ')}` : `- ${first}`;
    })
    .replace(/\n{3,}/g, '\n\n');

  const citation = link ? `\n\n[Read more](${link})` : '';

  return {
    text: `${heading}${body}${citation}`,
    source: isNote ? 'note' : 'article',
    confidence: 'high',
    article: { id: article.id, title: article.title, slug: article.slug },
    reason: verdict.reason,
    alternatives: [],
  };
}


/* ── Context for a language model ─────────────────────────────────────── */

const MODEL_CONTEXT_TOP_CHARS = 3000;
const MODEL_CONTEXT_OTHER_CHARS = 1000;

export interface ModelContext {
  /** The documentation to put in front of the model. Empty when nothing fits. */
  text: string;
  /** What went in, for citation and for logging what the answer was based on. */
  used: { id: string; title: string; source: KnowledgeSource }[];
}

/**
 * The passages a model should be given to answer this question.
 * Uses semantic retrieval (rewrites query, embeds, and executes pgvector hybrid search).
 * Falls back to BM25 index if semantic retrieval is unavailable or empty.
 */
export async function buildModelContext(
  workspaceId: string,
  question: string,
  options: {
    history?: string[];
    turns?: { role: 'user' | 'assistant'; content: string }[];
    recentMessages?: { sender_type?: string; role?: string; content?: string }[];
    limit?: number;
    providerConfig?: ProviderConfig | null;
    helpCenterUrl?: string | null;
  } = {}
): Promise<ModelContext & { rewrittenQuery?: string; queryEmbedding?: number[] | null; chunks?: RetrievedChunk[]; belowThreshold?: boolean }> {
  // 1. Primary: Semantic Retrieval with pgvector & query rewriting
  try {
    const messages = options.recentMessages || options.turns || (options.history || []).map((h) => ({ role: 'user', content: h }));
    const semantic = await buildSemanticModelContext({
      workspaceId,
      visitorMessage: question,
      recentMessages: messages,
      providerConfig: options.providerConfig,
      limit: options.limit ?? 6,
      helpCenterUrl: options.helpCenterUrl,
    });

    return {
      text: semantic.text,
      used: semantic.used,
      rewrittenQuery: semantic.rewrittenQuery,
      queryEmbedding: semantic.queryEmbedding,
      chunks: semantic.chunks,
      belowThreshold: semantic.belowThreshold,
    };
  } catch (err) {
    console.warn('[Semantic Retrieval] buildModelContext fallback to keyword index:', err);
  }

  // 2. Fallback to keyword index only if semantic retrieval threw an unexpected error
  const index = await loadIndex(workspaceId);
  const hits = search(index, question, {
    history: options.history,
    limit: options.limit ?? 4,
  });

  // Only what plausibly relates
  const relevant = hits.filter((h) => h.score >= 1);
  if (relevant.length === 0) return { text: '', used: [], belowThreshold: true };

  const budgets = [MODEL_CONTEXT_TOP_CHARS, ...Array(relevant.length).fill(MODEL_CONTEXT_OTHER_CHARS)];

  const used: ModelContext['used'] = [];
  const blocks = relevant.map((h, i) => {
    const a = h.article;
    const isNote = a.id.startsWith('note:');
    used.push({ id: a.id, title: a.title, source: isNote ? 'note' : 'article' });

    const articleUrl =
      !isNote && options.helpCenterUrl
        ? `${options.helpCenterUrl.replace(/\/$/, '')}/${a.slug || a.id}`
        : null;

    const body =
      a.content.length <= budgets[i]
        ? a.content
        : extractPassage(a.content, question, {
            history: options.history,
            maxChars: budgets[i],
          });

    const lines = [
      `[CHUNK ${i + 1}]`,
      `Article: ${a.title}`,
      `Section: ${a.sectionName || 'General'}`,
    ];
    if (articleUrl) {
      lines.push(`Article URL: ${articleUrl}`);
    }
    lines.push('', a.summary ? `${a.summary}\n\n${body}` : body);
    return lines.join('\n');
  });

  return { text: blocks.join('\n\n---\n\n'), used, belowThreshold: false };
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
