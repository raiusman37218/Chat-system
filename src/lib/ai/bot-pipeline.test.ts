/**
 * The whole answer pipeline for one visitor message, run against a fixture
 * help centre with the real keyword retrieval, confidence gate, citation and
 * handover summary. Only the database client and the model are faked.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RetrievedChunk } from '@/types/database';

const WORKSPACE_ID = 'ws-acme';
const HELP_URL = 'https://acme.help.example';

const db = vi.hoisted(() => ({
  tables: {} as Record<string, unknown[]>,
  rpcCalls: [] as { fn: string; args: Record<string, unknown> }[],
}));

/** Just enough of the Supabase query builder for help-answer.ts. */
function fakeSupabase() {
  const query = (rows: unknown[]) => {
    const builder: Record<string, unknown> = {};
    for (const m of ['select', 'eq', 'neq', 'in', 'order', 'limit', 'or', 'filter']) {
      builder[m] = () => builder;
    }
    builder.then = (resolve: (v: unknown) => unknown) => resolve({ data: rows, error: null });
    return builder;
  };
  return {
    from: (table: string) => query(db.tables[table] ?? []),
    rpc: (fn: string, args: Record<string, unknown>) => {
      db.rpcCalls.push({ fn, args });
      if (fn === 'fn_assistant_notes') return Promise.resolve({ data: db.tables.notes ?? [], error: null });
      return Promise.resolve({ data: null, error: null });
    },
  };
}

vi.mock('@/lib/supabase/service', () => ({ serviceClient: () => fakeSupabase(), hasServiceRole: () => true }));

const semantic = vi.hoisted(() => ({ chunks: [] as RetrievedChunk[] }));
vi.mock('@/lib/ai/semantic-retrieval', () => ({
  // No embeddings in tests unless a test provides chunks: the keyword index answers.
  buildSemanticModelContext: async ({ visitorMessage }: { visitorMessage: string }) => {
    if (!semantic.chunks.length) {
      return { text: '', used: [], rewrittenQuery: visitorMessage, queryEmbedding: null, chunks: [], belowThreshold: true };
    }
    return {
      text: semantic.chunks
        .map((c, i) => `[CHUNK ${i + 1}]\nArticle: ${c.article_title}\nSection: ${c.section_name}\n\n${c.content}`)
        .join('\n\n---\n\n'),
      used: semantic.chunks.map((c) => ({ id: c.article_id, title: c.article_title, source: 'article' })),
      rewrittenQuery: visitorMessage,
      queryEmbedding: null,
      chunks: semantic.chunks,
      belowThreshold: false,
    };
  },
  hybridSearchWorkspaceChunks: async () => semantic.chunks,
}));

vi.mock('@/lib/ai/provider', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/ai/provider')>();
  return { ...actual, chat: vi.fn() };
});

import { chat, type ProviderConfig } from '@/lib/ai/provider';
import { generateHelpDeskResponseWithHandover, lowConfidenceReply } from '@/lib/ai/anthropic';

const ARTICLES = [
  {
    id: 'art-refund',
    slug: 'refund-policy',
    title: 'Refund policy',
    section_id: 'sec-orders',
    category: 'Orders',
    summary: 'When and how you can get your money back.',
    content:
      'You can request a refund within 30 days of delivery. Items must be unused and in their original packaging. Refunds are sent to the original payment method within 5 to 7 business days after we receive the return.',
  },
  {
    id: 'art-shipping',
    slug: 'shipping-times',
    title: 'Shipping times',
    section_id: 'sec-orders',
    category: 'Orders',
    summary: 'How long delivery takes.',
    content:
      'Standard shipping takes 3 to 5 business days within Pakistan. Express shipping takes 1 to 2 business days. International shipping takes 7 to 14 business days.',
  },
  {
    id: 'art-password',
    slug: 'reset-password',
    title: 'Reset your password',
    section_id: 'sec-account',
    category: 'Account',
    summary: null,
    content:
      'To reset your password, open the login page and click "Forgot password". Enter your email address and we will send you a reset link that is valid for 30 minutes.',
  },
  {
    id: 'art-payment',
    slug: 'payment-methods',
    title: 'Payment methods',
    section_id: 'sec-orders',
    category: 'Orders',
    summary: null,
    content: 'We accept Visa and Mastercard credit cards, debit cards, JazzCash, Easypaisa and cash on delivery.',
  },
];

const NOTES = [
  {
    id: 'note-1',
    title: 'Gift cards',
    content: 'Internal: gift cards are launching next quarter, do not promise dates. Gift cards cost 5000.',
    tags: ['internal'],
  },
];

function resetFixture() {
  db.tables = {
    help_sections: [
      { id: 'sec-orders', name: 'Orders and delivery' },
      { id: 'sec-account', name: 'Your account' },
    ],
    articles: ARTICLES,
    notes: NOTES,
  };
  db.rpcCalls = [];
  semantic.chunks = [];
}

async function ask(
  message: string,
  opts: { turns?: { role: 'user' | 'assistant'; content: string }[]; providerConfig?: ProviderConfig | null } = {}
) {
  return generateHelpDeskResponseWithHandover({
    workspaceId: WORKSPACE_ID,
    conversationId: 'conv-1',
    incomingMessage: message,
    providerConfig: opts.providerConfig ?? null,
    turns: opts.turns,
    helpCenterUrl: HELP_URL,
    workspaceName: 'Acme Store',
  });
}

const gapsRecorded = () => db.rpcCalls.filter((c) => c.fn.startsWith('fn_record_unanswered_question'));

beforeEach(() => {
  resetFixture();
  vi.mocked(chat).mockReset();
});

describe('help-center questions, no model configured', () => {
  it.each([
    ['What is your refund policy?', 'Refund policy', 'refund-policy', '30 days'],
    ['How do I reset my password?', 'Reset your password', 'reset-password', 'Forgot password'],
    ['How long does express shipping take?', 'Shipping times', 'shipping-times', '1 to 2 business days'],
    ['refund policy kya hai?', 'Refund policy', 'refund-policy', '30 days'],
  ])('"%s" is answered from "%s" and cites it', async (message, title, slug, fact) => {
    const r = await ask(message);
    expect(r.intent).toBe('help_center_question');
    expect(r.shouldHandover).toBe(false);
    expect(r.citation).toMatchObject({ title, url: `${HELP_URL}/${slug}` });
    expect(r.replyText).toContain(fact);
    expect(r.replyText).toContain(`[${title}](${HELP_URL}/${slug})`);
    expect(gapsRecorded()).toHaveLength(0);
  });

  it('does not guess when no article fits: says so, offers a person, logs the gap', async () => {
    const r = await ask('Do you have a store in Islamabad?');
    expect(r.intent).toBe('help_center_question');
    expect(r.replyText).toBe(lowConfidenceReply('en'));
    expect(r.shouldHandover).toBe(false);
    expect(r.citation).toBeNull();
    expect(r.retrievalConfidence).toBe('low');
    expect(gapsRecorded()).toHaveLength(1);
  });

  it('never answers from team notes, even when a note matches', async () => {
    const r = await ask('How much do gift cards cost?');
    expect(r.replyText).not.toContain('5000');
    expect(r.replyText).toBe(lowConfidenceReply('en'));
  });

  it('offers the person in Roman Urdu when asked in Roman Urdu', async () => {
    const r = await ask('kya aap ka Islamabad mein koi store hai?');
    expect(r.replyText).toBe(lowConfidenceReply('roman_ur'));
  });

  it('cites the article title without a link when the workspace has no help-centre URL', async () => {
    const r = await generateHelpDeskResponseWithHandover({
      workspaceId: WORKSPACE_ID,
      conversationId: 'conv-1',
      incomingMessage: 'What is your refund policy?',
      workspaceName: 'Acme Store',
    });
    expect(r.replyText).toContain('Source: **Refund policy**');
  });
});

describe('help-center questions with a model configured', () => {
  const provider: ProviderConfig = { provider: 'anthropic', apiKey: 'test-key', model: null, baseUrl: null };
  const mockedChat = vi.mocked(chat);

  /** Classifier calls get JSON; answer calls get `answer`. */
  function modelAnswers(answer: string, intent = 'help_center_question') {
    mockedChat.mockImplementation(async (_cfg, req) => {
      if (req.system.includes('You route customer messages')) {
        return { text: JSON.stringify({ intent, confidence: 0.9, summary: 'test' }) } as Awaited<ReturnType<typeof chat>>;
      }
      return { text: answer } as Awaited<ReturnType<typeof chat>>;
    });
  }

  it('cites the article the model names, and drops any link the model wrote', async () => {
    modelAnswers(
      'Standard delivery takes 3 to 5 business days. [Read more](https://made-up.example/shipping) [SOURCE: 1]'
    );
    const r = await ask('How long does delivery take?', { providerConfig: provider });
    expect(r.citation?.id).toBe('art-shipping');
    expect(r.replyText).not.toContain('made-up.example');
    expect(r.replyText).not.toContain('[SOURCE');
    expect(r.replyText).toMatch(/3 to 5 business days\.\n\nSource: \[Shipping times\]\(https:\/\/acme\.help\.example\/shipping-times\)$/);

    const answerCall = mockedChat.mock.calls.find(([, req]) => req.system.includes('HELP-CENTER ARTICLES'));
    expect(answerCall).toBeDefined();
    expect(answerCall![1].system).not.toContain('Gift cards'); // team notes never reach the model
  });

  it('treats [NOT_COVERED] as low confidence: no answer, offer a person, log the gap', async () => {
    modelAnswers('[NOT_COVERED]');
    const r = await ask('How long does delivery take for furniture?', { providerConfig: provider });
    expect(mockedChat.mock.calls.some(([, req]) => req.system.includes('HELP-CENTER ARTICLES'))).toBe(true);
    expect(r.replyText).toBe(lowConfidenceReply('en'));
    expect(r.shouldHandover).toBe(false);
    expect(gapsRecorded()).toHaveLength(1);
  });

  it('does not call the answering model at all when retrieval confidence is low', async () => {
    modelAnswers('Yes, we have a store in Islamabad. [SOURCE: 1]');
    const r = await ask('Do you have a store in Islamabad?', { providerConfig: provider });
    expect(r.replyText).toBe(lowConfidenceReply('en'));
    expect(mockedChat.mock.calls.some(([, req]) => req.system.includes('HELP-CENTER ARTICLES'))).toBe(false);
  });

  it('rejects an unsourced answer when retrieval was only a partial match', async () => {
    semantic.chunks = [
      {
        id: 'c1', article_id: 'art-payment', article_title: 'Payment methods', section_name: 'Orders and delivery',
        article_slug: 'payment-methods', chunk_index: 0, content: ARTICLES[3].content,
        similarity: 0.5, keyword_score: 0.1, combined_score: 0.4,
      },
    ];
    modelAnswers('We probably accept PayPal too.');
    const r = await ask('Do you accept PayPal?', { providerConfig: provider });
    expect(r.replyText).toBe(lowConfidenceReply('en'));
  });

  it('answers in Roman Urdu when the model does, still with the citation', async () => {
    semantic.chunks = [
      {
        id: 'c1', article_id: 'art-refund', article_title: 'Refund policy', section_name: 'Orders and delivery',
        article_slug: 'refund-policy', chunk_index: 0, content: ARTICLES[0].content,
        similarity: 0.82, keyword_score: 0.4, combined_score: 0.7,
      },
    ];
    modelAnswers('Aap delivery ke 30 din ke andar refund le sakte hain. [SOURCE: 1]');
    const r = await ask('refund kitne din mein mil sakta hai?', { providerConfig: provider });
    expect(r.replyText).toContain('30 din');
    expect(r.replyText).toContain('Source: [Refund policy](https://acme.help.example/refund-policy)');
    expect(r.retrievalConfidence).toBe('high');
  });
});

describe('routing other intents', () => {
  it.each([
    ['hi', 'Welcome to Acme Store'],
    ['thanks!', "You're welcome"],
    ['shukriya bhai', 'Koi baat nahi'],
  ])('"%s" gets a short small-talk reply', async (message, expected) => {
    const r = await ask(message);
    expect(r.intent).toBe('small_talk');
    expect(r.replyText).toContain(expected);
    expect(r.shouldHandover).toBe(false);
    expect(r.internalNote).toBeUndefined();
  });

  it('hands a request for a person to the inbox, with a summary, and turns the bot off', async () => {
    const r = await ask('I want to talk to a real person', {
      turns: [
        { role: 'user', content: 'Do you have a store in Islamabad?' },
        { role: 'assistant', content: lowConfidenceReply('en') },
      ],
    });
    expect(r).toMatchObject({ intent: 'wants_human', shouldHandover: true, disableAi: true, priority: 'high' });
    expect(r.internalNote).toContain('Bot handover: Asked for a human');
    expect(r.internalNote).toContain('Earlier: "Do you have a store in Islamabad?"');
  });

  it('turns "yes" after the offer into a handover that carries the original question', async () => {
    const r = await ask('yes please', {
      turns: [
        { role: 'user', content: 'Do you have a store in Islamabad?' },
        { role: 'assistant', content: lowConfidenceReply('en') },
      ],
    });
    expect(r.intent).toBe('wants_human');
    expect(r.shouldHandover).toBe(true);
    expect(r.internalNote).toContain('Accepted the offer');
    expect(r.internalNote).toContain('Do you have a store in Islamabad?');
  });

  it('hands over a Roman Urdu request for a person and replies in Roman Urdu', async () => {
    const r = await ask('kisi insaan se baat karwa do please');
    expect(r.intent).toBe('wants_human');
    expect(r.replyText).toContain('support team');
    expect(r.replyText).toContain('Maine');
    expect(r.internalNote).toContain('Language: Roman Urdu');
  });

  it('hands out-of-scope messages to the inbox with a summary but keeps the bot on', async () => {
    const r = await ask('Can you write me a poem about cats?');
    expect(r).toMatchObject({ intent: 'out_of_scope', shouldHandover: true, disableAi: false, priority: 'normal' });
    expect(r.replyText).toContain('only help with questions about Acme Store');
    expect(r.internalNote).toContain('Bot handover: Out of scope');
    expect(gapsRecorded()).toHaveLength(0);
  });

  it('hands account questions over, asks for what is missing, and records what was given', async () => {
    const r = await ask('mera order abhi tak nahi aya, order number 77120');
    expect(r).toMatchObject({ intent: 'account_specific', shouldHandover: true, priority: 'high' });
    expect(r.replyText).toContain('email');
    expect(r.replyText).not.toContain('order ya account number');
    expect(r.internalNote).toContain('order 77120');
    expect(gapsRecorded()).toHaveLength(0);
  });
});
