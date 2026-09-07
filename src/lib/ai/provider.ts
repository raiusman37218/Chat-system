/**
 * One chat call, whichever model provider the workspace has configured.
 *
 * The AI code used to import the Anthropic SDK directly and hardcode Claude
 * model ids, so "add an API key" meant "add an Anthropic key" and nothing else.
 * Everything now goes through `chat()` below, and the workspace decides who
 * answers it.
 *
 * Adding a provider means adding one case here — nothing above this file knows
 * which one is in use.
 */

import Anthropic from '@anthropic-ai/sdk';

export type ProviderId =
  | 'anthropic'
  | 'openai'
  | 'google'
  | 'deepseek'
  | 'compatible';

export interface ProviderConfig {
  provider: ProviderId;
  /** Model identifier as that provider spells it. */
  model?: string | null;
  apiKey?: string | null;
  /**
   * Only for `compatible`: the base URL of any OpenAI-shaped `/chat/completions`
   * endpoint — OpenRouter, Groq, Together, DeepSeek, a local Ollama, vLLM.
   * Covers the long tail without a case per vendor.
   */
  baseUrl?: string | null;
}

export interface ChatRequest {
  system: string;
  /** Oldest first. */
  messages: { role: 'user' | 'assistant'; content: string }[];
  maxTokens?: number;
  /** 0 keeps support answers close to the source text. */
  temperature?: number;
  /** Abandon a slow provider rather than hold a conversation open. */
  timeoutMs?: number;
}

export interface ChatResult {
  text: string;
  provider: ProviderId;
  model: string;
}

/** Thrown for provider failures so callers can fall back deliberately. */
export class ProviderError extends Error {
  constructor(
    message: string,
    readonly provider: ProviderId,
    readonly status?: number,
    /** False for a bad key or a bad request — retrying will not help. */
    readonly retryable = false
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}

/**
 * Sensible current default per provider, used when the workspace has not named
 * a model. Overridable in Settings, because model names change faster than
 * this file does.
 */
export const DEFAULT_MODELS: Record<ProviderId, string> = {
  anthropic: 'claude-opus-5',
  openai: 'gpt-5',
  google: 'gemini-2.5-pro',
  // deepseek-chat is the general model; deepseek-reasoner is the thinking one.
  deepseek: 'deepseek-chat',
  compatible: '',
};

/** Fixed endpoints for the providers that speak OpenAI's shape. */
const OPENAI_SHAPED_BASE_URLS: Partial<Record<ProviderId, string>> = {
  openai: 'https://api.openai.com/v1',
  deepseek: 'https://api.deepseek.com/v1',
};

export const PROVIDER_LABELS: Record<ProviderId, string> = {
  anthropic: 'Anthropic (Claude)',
  openai: 'OpenAI',
  google: 'Google (Gemini)',
  deepseek: 'DeepSeek',
  compatible: 'Other (OpenAI-compatible URL)',
};

/** Environment fallbacks, so a self-hosted deployment can set one key globally. */
function envKeyFor(provider: ProviderId): string | undefined {
  switch (provider) {
    case 'anthropic':
      return process.env.ANTHROPIC_API_KEY;
    case 'openai':
      return process.env.OPENAI_API_KEY;
    case 'google':
      return process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
    case 'deepseek':
      return process.env.DEEPSEEK_API_KEY;
    case 'compatible':
      return process.env.AI_API_KEY;
  }
}

/** True when this config could actually reach a model. */
export function isConfigured(config: ProviderConfig | null | undefined): boolean {
  if (!config) return false;
  const key = config.apiKey || envKeyFor(config.provider);
  if (!key) return false;
  if (config.provider === 'compatible') {
    return Boolean(config.baseUrl && config.model);
  }
  return true;
}

export async function chat(
  config: ProviderConfig,
  req: ChatRequest
): Promise<ChatResult> {
  const apiKey = config.apiKey || envKeyFor(config.provider);
  if (!apiKey) {
    throw new ProviderError('No API key configured', config.provider, undefined, false);
  }

  const model = config.model || DEFAULT_MODELS[config.provider];
  if (!model) {
    throw new ProviderError('No model configured', config.provider, undefined, false);
  }

  const timeoutMs = req.timeoutMs ?? 25_000;

  switch (config.provider) {
    case 'anthropic':
      return anthropicChat(apiKey, model, req, timeoutMs);
    case 'google':
      return googleChat(apiKey, model, req, timeoutMs);
    case 'openai':
    case 'deepseek':
      return openAiChat(
        apiKey,
        model,
        // The provider's own endpoint; a workspace may still override it, which
        // is how a proxy or a regional endpoint gets used.
        (config.baseUrl || OPENAI_SHAPED_BASE_URLS[config.provider])!.replace(/\/+$/, ''),
        req,
        timeoutMs,
        config.provider
      );
    case 'compatible': {
      if (!config.baseUrl) {
        throw new ProviderError('No base URL configured', 'compatible', undefined, false);
      }
      return openAiChat(
        apiKey,
        model,
        config.baseUrl.replace(/\/+$/, ''),
        req,
        timeoutMs,
        'compatible'
      );
    }
  }
}

/* ── Anthropic ────────────────────────────────────────────────────────── */

async function anthropicChat(
  apiKey: string,
  model: string,
  req: ChatRequest,
  timeoutMs: number
): Promise<ChatResult> {
  const client = new Anthropic({ apiKey, timeout: timeoutMs });

  try {
    const res = await client.messages.create({
      model,
      // Generous, because it is a ceiling rather than a target — and on models
      // that think before answering, a tight ceiling truncates the answer
      // itself. Reply length is controlled by the prompt.
      max_tokens: req.maxTokens ?? 4096,
      system: req.system,
      messages: req.messages,
      // A support reply drawn from documentation is not a reasoning problem;
      // low effort keeps it fast and cheap.
      output_config: { effort: 'low' },
    } as Parameters<typeof client.messages.create>[0]);

    const message = res as Anthropic.Message;

    // A safety decline arrives as a normal 200 — check before reading content.
    if (message.stop_reason === 'refusal') {
      throw new ProviderError('The model declined this request', 'anthropic', 200, false);
    }

    const text = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim();

    return { text, provider: 'anthropic', model };
  } catch (err) {
    if (err instanceof ProviderError) throw err;
    if (err instanceof Anthropic.APIError) {
      throw new ProviderError(
        err.message,
        'anthropic',
        err.status,
        err.status === 429 || (err.status ?? 0) >= 500
      );
    }
    throw new ProviderError(
      err instanceof Error ? err.message : 'Request failed',
      'anthropic',
      undefined,
      true
    );
  }
}

/* ── OpenAI and anything that speaks its shape ────────────────────────── */

async function openAiChat(
  apiKey: string,
  model: string,
  baseUrl: string,
  req: ChatRequest,
  timeoutMs: number,
  provider: ProviderId
): Promise<ChatResult> {
  const res = await fetchJson(
    `${baseUrl}/chat/completions`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        // OpenAI's newer models require max_completion_tokens and reject
        // max_tokens; DeepSeek and most compatible servers only know
        // max_tokens. Sending the wrong one is a 400, so pick by provider.
        ...(provider === 'openai'
          ? { max_completion_tokens: req.maxTokens ?? 4096 }
          : { max_tokens: req.maxTokens ?? 4096 }),
        messages: [
          { role: 'system', content: req.system },
          ...req.messages,
        ],
        ...(req.temperature !== undefined ? { temperature: req.temperature } : {}),
      }),
    },
    timeoutMs,
    provider
  );

  const text: string = res?.choices?.[0]?.message?.content ?? '';
  return { text: text.trim(), provider, model };
}

/* ── Google Gemini ────────────────────────────────────────────────────── */

async function googleChat(
  apiKey: string,
  model: string,
  req: ChatRequest,
  timeoutMs: number
): Promise<ChatResult> {
  // Gemini keeps the system prompt in its own field and calls the assistant
  // role "model".
  const res = await fetchJson(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      model
    )}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: req.system }] },
        contents: req.messages.map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        })),
        generationConfig: {
          maxOutputTokens: req.maxTokens ?? 4096,
          ...(req.temperature !== undefined ? { temperature: req.temperature } : {}),
        },
      }),
    },
    timeoutMs,
    'google'
  );

  const text: string =
    res?.candidates?.[0]?.content?.parts
      ?.map((p: { text?: string }) => p.text || '')
      .join('') ?? '';
  return { text: text.trim(), provider: 'google', model };
}

/* ── Shared HTTP ──────────────────────────────────────────────────────── */

async function fetchJson(
  url: string,
  init: RequestInit,
  timeoutMs: number,
  provider: ProviderId
): Promise<any> {
  let res: Response;
  try {
    res = await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
  } catch (err) {
    const e = err as { name?: string; message?: string };
    throw new ProviderError(
      e?.name === 'TimeoutError' ? 'Provider timed out' : e?.message || 'Network error',
      provider,
      undefined,
      true
    );
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    let detail = body.slice(0, 300);
    try {
      detail = JSON.parse(body)?.error?.message ?? detail;
    } catch {
      /* not JSON; the raw body is the best detail available */
    }
    throw new ProviderError(
      detail || `HTTP ${res.status}`,
      provider,
      res.status,
      res.status === 429 || res.status >= 500
    );
  }

  return res.json();
}

/**
 * A one-shot call used by Settings to tell the owner whether their key works,
 * before a customer finds out for them.
 */
export async function testProvider(
  config: ProviderConfig
): Promise<{ ok: boolean; model?: string; error?: string }> {
  try {
    const res = await chat(config, {
      system: 'Reply with the single word: ready',
      messages: [{ role: 'user', content: 'ping' }],
      maxTokens: 16,
      timeoutMs: 20_000,
    });
    return { ok: true, model: res.model };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}
