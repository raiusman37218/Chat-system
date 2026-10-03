import { serviceClient } from '@/lib/supabase/service';
import type { ProviderConfig } from './provider';
import { chat, isConfigured } from './provider';
import type { RetrievedChunk } from '@/types/database';

/**
 * Semantic retrieval and embedding engine with pgvector.
 *
 * Replaces pure keyword overlap with:
 * 1. 300-500 token chunking with title & section metadata preserved on every chunk.
 * 2. Supabase pgvector cosine embeddings + automatic sync on article lifecycle.
 * 3. Hybrid search combining cosine similarity and exact keyword/phrase matching.
 * 4. Conversational query rewriting using the last 6 conversation messages.
 */

export interface ArticleChunkInput {
  workspace_id: string;
  article_id: string;
  article_title: string;
  section_name: string | null;
  article_slug: string | null;
  chunk_index: number;
  content: string;
  token_count: number;
}

/**
 * Estimates token count for English and multilingual text.
 * Standard heuristic: 1 token ~= 4 chars or 0.75 words.
 */
export function estimateTokenCount(text: string): number {
  if (!text) return 0;
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const chars = text.length;
  return Math.max(1, Math.round(Math.max(words * 1.3, chars / 4)));
}

/**
 * Splits markdown content into structural blocks (headers, code, paragraphs, lists).
 */
function splitMarkdownBlocks(markdown: string): string[] {
  const lines = (markdown || '').replace(/\r\n/g, '\n').split('\n');
  const blocks: string[] = [];
  let current: string[] = [];
  let inCode = false;

  for (const line of lines) {
    if (line.trim().startsWith('```')) {
      inCode = !inCode;
      current.push(line);
      continue;
    }
    if (inCode) {
      current.push(line);
      continue;
    }
    if (/^#{1,6}\s+/.test(line.trim())) {
      if (current.length) {
        blocks.push(current.join('\n').trim());
        current = [];
      }
      current.push(line);
      continue;
    }
    if (line.trim() === '' && current.length) {
      blocks.push(current.join('\n').trim());
      current = [];
      continue;
    }
    if (line.trim() !== '') {
      current.push(line);
    }
  }
  if (current.length) blocks.push(current.join('\n').trim());
  return blocks.filter(Boolean);
}

/**
 * Splits a published help article into chunks of roughly 300 to 500 tokens,
 * keeping the article title and section name with each chunk.
 */
export function splitArticleIntoChunks(article: {
  id: string;
  workspace_id: string;
  title: string;
  sectionName?: string | null;
  category?: string | null;
  slug?: string | null;
  summary?: string | null;
  content: string;
}): ArticleChunkInput[] {
  const title = (article.title || '').trim();
  const sectionName = (article.sectionName || article.category || 'General').trim();
  const header = `Article: ${title}\nSection: ${sectionName}\n\n`;
  const headerTokens = estimateTokenCount(header);

  const TARGET_MAX_TOKENS = 460;
  const blocks = splitMarkdownBlocks(article.content);
  const rawChunks: string[] = [];
  let currentBodyBlocks: string[] = [];
  let currentTokens = headerTokens;

  for (const block of blocks) {
    const blockTokens = estimateTokenCount(block);

    // If a single block exceeds the max chunk budget, split by sentences
    if (blockTokens > TARGET_MAX_TOKENS) {
      if (currentBodyBlocks.length > 0) {
        rawChunks.push(header + currentBodyBlocks.join('\n\n'));
        currentBodyBlocks = [];
        currentTokens = headerTokens;
      }
      const sentences = block.split(/(?<=[.!?])\s+/);
      let subSentences: string[] = [];
      let subTokens = headerTokens;
      for (const sent of sentences) {
        const sTokens = estimateTokenCount(sent);
        if (subTokens + sTokens > TARGET_MAX_TOKENS && subSentences.length > 0) {
          rawChunks.push(header + subSentences.join(' '));
          subSentences = [];
          subTokens = headerTokens;
        }
        subSentences.push(sent);
        subTokens += sTokens;
      }
      if (subSentences.length > 0) {
        rawChunks.push(header + subSentences.join(' '));
      }
      continue;
    }

    // If adding this block exceeds the 460 token target, flush current chunk
    if (currentTokens + blockTokens > TARGET_MAX_TOKENS && currentBodyBlocks.length > 0) {
      rawChunks.push(header + currentBodyBlocks.join('\n\n'));
      currentBodyBlocks = [];
      currentTokens = headerTokens;
    }

    currentBodyBlocks.push(block);
    currentTokens += blockTokens;
  }

  if (currentBodyBlocks.length > 0) {
    rawChunks.push(header + currentBodyBlocks.join('\n\n'));
  }

  // If the article had no blocks (empty content), create a minimal chunk with title & summary
  if (rawChunks.length === 0) {
    rawChunks.push(`${header}${article.summary ? `${article.summary}\n\n` : ''}${title}`);
  }

  return rawChunks.map((content, idx) => ({
    workspace_id: article.workspace_id,
    article_id: article.id,
    article_title: title,
    section_name: sectionName,
    article_slug: article.slug || null,
    chunk_index: idx,
    content,
    token_count: estimateTokenCount(content),
  }));
}

/**
 * Resolves API key for embeddings, checking provider config and environment fallbacks.
 */
function resolveEmbeddingCredentials(providerConfig?: ProviderConfig | null): {
  provider: 'google' | 'openai' | 'compatible';
  apiKey: string;
  baseUrl?: string | null;
} | null {
  const p = providerConfig?.provider;
  const cfgKey = providerConfig?.apiKey;

  if (p === 'google' && cfgKey) {
    return { provider: 'google', apiKey: cfgKey };
  }
  if (p === 'openai' && cfgKey) {
    return { provider: 'openai', apiKey: cfgKey };
  }
  if (p === 'compatible' && cfgKey && providerConfig?.baseUrl) {
    return { provider: 'compatible', apiKey: cfgKey, baseUrl: providerConfig.baseUrl };
  }

  // Environment fallbacks
  const googleKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (googleKey) return { provider: 'google', apiKey: googleKey };

  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) return { provider: 'openai', apiKey: openaiKey };

  return null;
}

/**
 * Generates 768-dimensional float embeddings for an array of texts.
 */
export async function generateEmbeddings(
  texts: string[],
  providerConfig?: ProviderConfig | null
): Promise<number[][]> {
  if (!texts.length) return [];

  const creds = resolveEmbeddingCredentials(providerConfig);
  if (!creds) {
    throw new Error('No embedding API key configured for Google or OpenAI.');
  }

  if (creds.provider === 'google') {
    return generateGoogleEmbeddings(texts, creds.apiKey);
  } else {
    return generateOpenAiEmbeddings(texts, creds.apiKey, creds.baseUrl);
  }
}

async function generateGoogleEmbeddings(texts: string[], apiKey: string): Promise<number[][]> {
  const BATCH_SIZE = 15;
  const results: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:batchEmbedContents?key=${encodeURIComponent(apiKey)}`;
    const requests = batch.map((text) => ({
      model: 'models/gemini-embedding-001',
      content: { parts: [{ text }] },
      outputDimensionality: 768,
    }));

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => '');
      throw new Error(`Google embeddings error ${res.status}: ${err}`);
    }

    const data = await res.json();
    if (!data.embeddings || !Array.isArray(data.embeddings)) {
      throw new Error('Invalid response structure from Gemini embeddings API');
    }

    for (const e of data.embeddings) {
      results.push(e.values);
    }
  }

  return results;
}

async function generateOpenAiEmbeddings(
  texts: string[],
  apiKey: string,
  baseUrl?: string | null
): Promise<number[][]> {
  const url = (baseUrl || 'https://api.openai.com/v1').replace(/\/$/, '') + '/embeddings';
  const BATCH_SIZE = 20;
  const results: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: batch,
        dimensions: 768,
      }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => '');
      throw new Error(`OpenAI embeddings error ${res.status}: ${err}`);
    }

    const data = await res.json();
    const sorted = (data.data || []).sort((a: any, b: any) => a.index - b.index);
    for (const item of sorted) {
      results.push(item.embedding);
    }
  }

  return results;
}

/**
 * Re-embeds an article automatically when created, edited, published or unpublished.
 */
export async function syncArticleChunks(articleId: string, workspaceId: string): Promise<void> {
  const supabase = serviceClient();

  // 1. Fetch article
  const { data: article } = await supabase
    .from('articles')
    .select('*, section:help_sections(name)')
    .eq('id', articleId)
    .eq('workspace_id', workspaceId)
    .maybeSingle();

  // If deleted or unpublished (draft), clean up existing chunks
  if (!article || article.status !== 'published') {
    await deleteArticleChunks(articleId);
    return;
  }

  // 2. Fetch workspace AI settings for embedding provider
  const { data: ws } = await supabase
    .from('workspaces')
    .select('ai_settings')
    .eq('id', workspaceId)
    .maybeSingle();

  const providerConfig = ws?.ai_settings
    ? {
        provider: ws.ai_settings.provider || 'google',
        apiKey: ws.ai_settings.api_key || ws.ai_settings.anthropic_api_key || null,
        model: ws.ai_settings.model || null,
        baseUrl: ws.ai_settings.base_url || null,
      }
    : null;

  // 3. Chunk article
  const sectionName = article.section?.name || article.category || 'General';
  const chunks = splitArticleIntoChunks({
    id: article.id,
    workspace_id: workspaceId,
    title: article.title,
    sectionName,
    slug: article.slug,
    summary: article.summary,
    content: article.content,
  });

  if (!chunks.length) {
    await deleteArticleChunks(articleId);
    return;
  }

  // 4. Generate embeddings
  const texts = chunks.map((c) => c.content);
  const embeddings = await generateEmbeddings(texts, providerConfig);

  // 5. Replace existing chunks for this article atomically
  await supabase.from('article_chunks').delete().eq('article_id', articleId);

  const rows = chunks.map((chunk, idx) => ({
    ...chunk,
    embedding: embeddings[idx] as any,
  }));

  const { error: insErr } = await supabase.from('article_chunks').insert(rows);
  if (insErr) {
    console.error('[Semantic Retrieval] Failed to insert article chunks:', insErr);
    throw new Error(`Failed to store article chunks: ${insErr.message}`);
  }
}

/**
 * Deletes all chunks belonging to an article.
 */
export async function deleteArticleChunks(articleId: string): Promise<void> {
  const supabase = serviceClient();
  await supabase.from('article_chunks').delete().eq('article_id', articleId);
}

/**
 * Synchronizes/backfills embeddings for all published articles in a workspace.
 */
export async function syncWorkspaceArticleEmbeddings(
  workspaceId: string
): Promise<{ indexedArticles: number; totalChunks: number }> {
  const supabase = serviceClient();
  const [{ data: sections }, { data: articles }, { data: ws }] = await Promise.all([
    supabase.from('help_sections').select('id, name').eq('workspace_id', workspaceId),
    supabase
      .from('articles')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('status', 'published'),
    supabase.from('workspaces').select('ai_settings').eq('id', workspaceId).maybeSingle(),
  ]);

  if (!articles || !articles.length) {
    return { indexedArticles: 0, totalChunks: 0 };
  }

  const providerConfig = ws?.ai_settings
    ? {
        provider: ws.ai_settings.provider || 'google',
        apiKey: ws.ai_settings.api_key || ws.ai_settings.anthropic_api_key || null,
        model: ws.ai_settings.model || null,
        baseUrl: ws.ai_settings.base_url || null,
      }
    : null;

  const secMap = new Map((sections || []).map((s) => [s.id, s.name]));
  const allChunks: (ArticleChunkInput & { embedding?: number[] })[] = [];

  for (const art of articles) {
    const secName = art.section_id ? secMap.get(art.section_id) : art.category;
    const chunks = splitArticleIntoChunks({
      ...art,
      sectionName: secName,
    });
    allChunks.push(...chunks);
  }

  if (allChunks.length === 0) return { indexedArticles: 0, totalChunks: 0 };

  const texts = allChunks.map((c) => c.content);
  const embeddings = await generateEmbeddings(texts, providerConfig);

  // Clear existing workspace chunks and insert fresh ones
  await supabase.from('article_chunks').delete().eq('workspace_id', workspaceId);

  const BATCH_SIZE = 25;
  for (let i = 0; i < allChunks.length; i += BATCH_SIZE) {
    const batch = allChunks.slice(i, i + BATCH_SIZE).map((c, idx) => ({
      ...c,
      embedding: embeddings[i + idx] as any,
    }));
    const { error } = await supabase.from('article_chunks').insert(batch);
    if (error) {
      console.error('[Semantic Retrieval] Batch insert error:', error);
      throw error;
    }
  }

  return { indexedArticles: articles.length, totalChunks: allChunks.length };
}

/**
 * Rewrites the visitor message into a standalone English search query
 * using the last 6 messages of the conversation.
 *
 * Handles:
 * - Follow-up questions (e.g. "and what about instant accounts?")
 * - Languages like Roman Urdu/Hindi, Arabic, French, Spanish, Uzbek
 * - Spelling errors, typos, and abbreviations
 * - Preserving exact terms, figures, percentages (e.g. "1% rule", "80/20", "drawdown")
 */
export async function rewriteVisitorMessageToEnglishQuery({
  visitorMessage,
  recentMessages = [],
  providerConfig,
}: {
  visitorMessage: string;
  recentMessages?: { sender_type?: string; role?: string; content?: string }[];
  providerConfig?: ProviderConfig | null;
}): Promise<string> {
  const trimmed = visitorMessage.trim();
  if (!trimmed) return '';

  // Filter and take the last 6 conversation messages for context
  const last6 = (recentMessages || [])
    .filter((m) => typeof m.content === 'string' && m.content.trim())
    .slice(-6)
    .map((m) => {
      const isUser = m.sender_type === 'visitor' || m.role === 'user';
      return `${isUser ? 'Customer' : 'Assistant'}: ${m.content!.trim()}`;
    });

  if (!isConfigured(providerConfig)) {
    return trimmed;
  }

  const systemInstruction = [
    'You are a search query reformulation engine for customer support knowledge retrieval.',
    'Your job is to rewrite the customer’s latest message into a standalone, concise English search query optimized for semantic vector and keyword search.',
    '',
    'RULES:',
    '1. Output ONLY the standalone English search query without quotes, explanations, prefixes, or markdown.',
    '2. Context resolution: If the message is a follow-up (e.g., uses pronouns like "it", "they", or ellipsis like "and what about instant accounts?"), integrate context from the recent conversation history so the query stands entirely on its own.',
    '3. Multilingual translation: If the customer writes in Roman Urdu/Hindi, Arabic, French, Spanish, Uzbek, or any other language, translate the intent accurately into clear English.',
    '4. Typo correction: Correct spelling errors and informal slang (e.g. "instnt acounts" -> "instant accounts", "drawdwn" -> "drawdown").',
    '5. Exact terms: ALWAYS preserve specific trading rules, percentages, figures, and technical acronyms (e.g. "1% rule", "80/20", "MT5", "KYC", "drawdown").',
    '6. Keep the rewritten query information-rich and focused (typically 4 to 12 words).',
  ].join('\n');

  const userContent = [
    'Recent conversation context (up to last 6 messages):',
    last6.length ? last6.join('\n') : 'None',
    '',
    'Current visitor message to rewrite:',
    trimmed,
  ].join('\n');

  try {
    const res = await chat(providerConfig!, {
      system: systemInstruction,
      messages: [{ role: 'user', content: userContent }],
      maxTokens: 400,
      temperature: 0.1,
      reasoning: 'fast',
      timeoutMs: 12000,
    });

    const rewritten = (res.text || '').trim().replace(/^["']|["']$/g, '');
    return rewritten && rewritten.length > 2 ? rewritten : trimmed;
  } catch (err) {
    console.warn('[Semantic Retrieval] Query rewrite model call failed, using raw query:', err);
    return trimmed;
  }
}

/**
 * Executes hybrid search over workspace article chunks:
 * 1. Cosine similarity via pgvector (embedding <=> query_embedding)
 * 2. Full text search and exact phrase matching
 * 3. Scoped strictly to the workspace
 * Returns top 6 chunks.
 */
export async function hybridSearchWorkspaceChunks({
  workspaceId,
  queryText,
  queryEmbedding,
  limit = 6,
}: {
  workspaceId: string;
  queryText: string;
  queryEmbedding?: number[] | null;
  limit?: number;
}): Promise<RetrievedChunk[]> {
  const supabase = serviceClient();

  const { data, error } = await supabase.rpc('fn_hybrid_search_chunks', {
    p_workspace_id: workspaceId,
    p_query_text: queryText,
    p_query_embedding: queryEmbedding || null,
    p_limit: limit,
  });

  if (error) {
    console.warn('[Semantic Retrieval] fn_hybrid_search_chunks RPC failed:', error.message);
    return [];
  }

  return (data as RetrievedChunk[]) || [];
}

/**
 * Builds the AI model context from semantic retrieved chunks:
 * 1. Rewrites visitor query into standalone English query using last 6 messages.
 * 2. Embeds the query.
 * 3. Retrieves top 6 chunks via hybrid search.
 * 4. Filters out chunks below similarity threshold so unrelated articles are never sent.
 * 5. Assembles clean context blocks with article URLs for the model.
 */
export async function buildSemanticModelContext({
  workspaceId,
  visitorMessage,
  recentMessages = [],
  providerConfig,
  limit = 6,
  helpCenterUrl,
}: {
  workspaceId: string;
  visitorMessage: string;
  recentMessages?: { sender_type?: string; role?: string; content?: string }[];
  providerConfig?: ProviderConfig | null;
  limit?: number;
  helpCenterUrl?: string | null;
}): Promise<{
  text: string;
  used: { id: string; title: string; source: 'article' }[];
  rewrittenQuery: string;
  queryEmbedding?: number[] | null;
  chunks: RetrievedChunk[];
  belowThreshold: boolean;
}> {
  // 1. Rewrite query into standalone English
  const rewrittenQuery = await rewriteVisitorMessageToEnglishQuery({
    visitorMessage,
    recentMessages,
    providerConfig,
  });

  // 2. Generate embedding for query
  let queryEmbedding: number[] | null = null;
  try {
    const embeddings = await generateEmbeddings([rewrittenQuery], providerConfig);
    if (embeddings.length) queryEmbedding = embeddings[0];
  } catch (err) {
    console.warn('[Semantic Retrieval] Query embedding failed, continuing with keyword search:', err);
  }

  // 3. Hybrid search (scoped to workspace, top 6 chunks)
  const chunks = await hybridSearchWorkspaceChunks({
    workspaceId,
    queryText: rewrittenQuery,
    queryEmbedding,
    limit,
  });

  if (!chunks.length) {
    return { text: '', used: [], rewrittenQuery, queryEmbedding, chunks: [], belowThreshold: true };
  }

  // 4. Threshold check: if top match is below threshold, refuse to pass unrelated articles
  const topChunk = chunks[0];
  const isBelowThreshold =
    topChunk.similarity < 0.42 && topChunk.keyword_score < 0.20 && topChunk.combined_score < 0.38;

  if (isBelowThreshold) {
    return { text: '', used: [], rewrittenQuery, queryEmbedding, chunks: [], belowThreshold: true };
  }

  // 5. Assemble context blocks with article URLs (no "###" or "##" headings)
  const usedMap = new Map<string, { id: string; title: string; source: 'article' }>();
  const blocks = chunks.map((c, idx) => {
    usedMap.set(c.article_id, {
      id: c.article_id,
      title: c.article_title,
      source: 'article',
    });

    const articlePath = c.article_slug || c.article_id;
    const articleUrl = helpCenterUrl ? `${helpCenterUrl.replace(/\/$/, '')}/${articlePath}` : null;
    const cleanContent = c.content.replace(/^Article:\s*.*?\nSection:\s*.*?\n\n/i, '').trim();

    const lines = [
      `[CHUNK ${idx + 1}]`,
      `Article: ${c.article_title}`,
      `Section: ${c.section_name || 'General'}`,
    ];
    if (articleUrl) {
      lines.push(`Article URL: ${articleUrl}`);
    }
    lines.push('', cleanContent);
    return lines.join('\n');
  });

  return {
    text: blocks.join('\n\n---\n\n'),
    used: Array.from(usedMap.values()),
    rewrittenQuery,
    queryEmbedding,
    chunks,
    belowThreshold: false,
  };
}
