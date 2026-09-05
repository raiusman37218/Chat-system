import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vfjsaynnubxywdbevxtx.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmanNheW5udWJ4eXdkYmV2eHR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNTA5MDEsImV4cCI6MjEwMzgyNjkwMX0.YyBCXMqwrOk5BRhQafYLFw8tiM5PC8lc8Yocodw9wf0';

function getSupabase() {
  return createClient(SUPABASE_URL, SUPABASE_KEY);
}

function getAnthropicClient(apiKey?: string | null): Anthropic | null {
  const key = apiKey || process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  return new Anthropic({ apiKey: key });
}

export interface HelpDeskResponseResult {
  replyText: string;
  shouldHandover: boolean;
  handoverReason?: string;
  canAnswerFromDocs: boolean;
}

/**
 * 1. AI Auto-First-Response with RAG over Help Desk sections & articles, with intelligent Human Handover
 */
export async function generateHelpDeskResponseWithHandover({
  workspaceId,
  conversationId,
  incomingMessage,
  visitorName,
  apiKey,
  systemPrompt,
}: {
  workspaceId: string;
  conversationId: string;
  incomingMessage: string;
  visitorName?: string;
  apiKey?: string | null;
  systemPrompt?: string | null;
}): Promise<HelpDeskResponseResult> {
  const supabase = getSupabase();

  // 0. Check for explicit human agent request in incoming text
  const humanRequestRegex =
    /\b(human|agent|person|representative|support agent|live support|operator|real person|talk to someone|speak to someone|baat karni|insan|human support|customer care|speak with human|contact agent)\b/i;
  const isExplicitHumanRequest = humanRequestRegex.test(incomingMessage);

  if (isExplicitHumanRequest) {
    return {
      replyText: `Hello ${visitorName || 'there'}! 👋 I understand you'd like to speak with a human support specialist. I have transferred your conversation to our live team, and someone will assist you shortly!`,
      shouldHandover: true,
      handoverReason: 'Customer explicitly requested to speak with a human agent.',
      canAnswerFromDocs: false,
    };
  }

  // 1. Fetch relevant Help Desk sections and published articles for this workspace
  const [{ data: sections }, { data: articles }] = await Promise.all([
    supabase
      .from('help_sections')
      .select('id, name, description')
      .eq('workspace_id', workspaceId)
      .order('order_index', { ascending: true }),
    supabase
      .from('articles')
      .select('id, section_id, title, category, summary, content, status')
      .or(`workspace_id.eq.${workspaceId},workspace_id.is.null`),
  ]);

  const publishedArticles = (articles || []).filter(
    (a) => !a.status || a.status === 'published'
  );

  const sectionMap = new Map((sections || []).map((s) => [s.id, s.name]));

  // Rank articles by keyword overlap with the customer's incoming message
  const queryWords = incomingMessage
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 2);

  const scoredArticles = publishedArticles.map((article) => {
    let score = 0;
    const titleLower = (article.title || '').toLowerCase();
    const summaryLower = (article.summary || '').toLowerCase();
    const contentLower = (article.content || '').toLowerCase();
    const categoryLower = (article.category || '').toLowerCase();

    for (const word of queryWords) {
      if (titleLower.includes(word)) score += 8;
      if (summaryLower.includes(word)) score += 4;
      if (categoryLower.includes(word)) score += 3;
      if (contentLower.includes(word)) score += 1;
    }
    return { article, score };
  });

  scoredArticles.sort((a, b) => b.score - a.score);
  const relevantArticles = scoredArticles.slice(0, 5).map((item) => item.article);

  const ragContext = relevantArticles
    .map((a) => {
      const sectionName = a.section_id ? sectionMap.get(a.section_id) : null;
      const heading = sectionName ? `[${sectionName}] ${a.title}` : a.title;
      return `### ${heading} (${a.category || 'General'})\n${a.summary ? `Summary: ${a.summary}\n` : ''}${a.content}`;
    })
    .join('\n\n');

  const anthropic = getAnthropicClient(apiKey);
  if (anthropic) {
    try {
      const defaultInstruction =
        systemPrompt ||
        'You are the official AI Support Assistant for our company. Be polite, concise, warm, and helpful.';

      const prompt = `${defaultInstruction}

A customer named "${visitorName || 'Customer'}" just asked:
"${incomingMessage}"

Here is our official Help Desk Documentation:
${ragContext || 'No relevant documentation articles found for this workspace.'}

Instructions:
1. Ground Truth Evaluation:
   - Check if the Help Desk Documentation above provides sufficient information to answer the customer's question clearly.
2. If YES (documentation covers this inquiry):
   - Provide a helpful, concise, and professional response (max 2 short paragraphs) based on our documentation.
3. If NO (documentation does NOT cover this inquiry, or the user is facing an account-specific problem, transaction issue, bug, or asks something beyond the documentation):
   - Politely explain what you can and inform the customer that their inquiry has been escalated to our human support team who will join shortly.
   - At the very end of your response, append the exact tag: [HANDOVER: <short reason why human is needed>]

Do not invent or hallucinate policies not found in the documentation. Do not mention that you were given a prompt or internal context.`;

      const msg = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 450,
        messages: [{ role: 'user', content: prompt }],
      });

      const firstBlock = msg.content[0];
      if (firstBlock && 'text' in firstBlock) {
        let text = firstBlock.text.trim();
        const handoverMatch = text.match(/\[HANDOVER:\s*([^\]]+)\]/i);

        if (handoverMatch) {
          const reason = handoverMatch[1].trim();
          text = text.replace(/\[HANDOVER:\s*[^\]]+\]/i, '').trim();
          return {
            replyText: text,
            shouldHandover: true,
            handoverReason: reason || 'Inquiry requires human specialist assistance.',
            canAnswerFromDocs: false,
          };
        }

        return {
          replyText: text,
          shouldHandover: false,
          canAnswerFromDocs: true,
        };
      }
    } catch (err) {
      console.warn('[Anthropic] Claude API error in help desk response, falling back:', err);
    }
  }

  // Heuristic RAG Fallback when API key is not configured or fails
  const bestMatch = scoredArticles.find((item) => item.score > 0)?.article;
  const bestScore = scoredArticles[0]?.score || 0;

  if (bestMatch && bestScore >= 4) {
    const sectionName = bestMatch.section_id ? sectionMap.get(bestMatch.section_id) : null;
    const prefix = sectionName ? `our Help Center (${sectionName} - "${bestMatch.title}")` : `"${bestMatch.title}"`;
    const excerpt = bestMatch.summary || bestMatch.content.slice(0, 220);
    return {
      replyText: `Hello ${visitorName || 'there'}! 👋 Based on ${prefix}:\n\n${excerpt}...\n\nLet us know if you have any questions, our support team has been alerted!`,
      shouldHandover: false,
      canAnswerFromDocs: true,
    };
  }

  // If score is 0 or low relevance, Help Desk doesn't cover this: Trigger Handover!
  return {
    replyText: `Hello ${visitorName || 'there'}! 👋 I couldn't find specific documentation covering your inquiry in our Help Center, so I've transferred your conversation to our live support team. A specialist has been alerted and will assist you shortly!`,
    shouldHandover: true,
    handoverReason: 'Inquiry is not covered in Help Desk documentation.',
    canAnswerFromDocs: false,
  };
}

/**
 * Backward compatibility wrapper returning reply text
 */
export async function generateAutoFirstResponse(params: {
  workspaceId: string;
  conversationId: string;
  incomingMessage: string;
  visitorName?: string;
  apiKey?: string | null;
  systemPrompt?: string | null;
}): Promise<string> {
  const result = await generateHelpDeskResponseWithHandover(params);
  return result.replyText;
}

/**
 * Executes a seamless handover to human agents:
 * - Updates conversation: status = 'open', priority = 'high', ai_mode = 'disabled'
 * - Inserts internal note: '🤖 [AI Handover]: Transferred to human agent. Reason: ...'
 * - Auto-assigns to an online human agent if auto-assignment is enabled
 */
export async function executeHandoverToHuman({
  supabase,
  conversationId,
  workspaceId,
  reason,
  channel = 'web',
}: {
  supabase: ReturnType<typeof getSupabase>;
  conversationId: string;
  workspaceId: string;
  reason: string;
  channel?: string;
}) {
  try {
    // 1. Escalate conversation in Supabase
    await supabase
      .from('conversations')
      .update({
        status: 'open',
        priority: 'high',
        ai_mode: 'disabled', // Disables AI auto-replies on this conversation
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversationId);

    // 2. Insert private internal note for human support agents
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_type: 'ai',
      content: `🤖 [AI Handover to Real Agent]: Handed over to human agent.\nReason: ${reason}`,
      is_internal: true,
    });

    // 3. Attempt auto-assignment to available human agent
    const { data: ws } = await supabase
      .from('workspaces')
      .select('auto_assignment')
      .eq('id', workspaceId)
      .maybeSingle();

    if (ws?.auto_assignment?.enabled) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      fetch(`${appUrl}/api/conversations/auto-assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_id: conversationId }),
      }).catch((e) => console.warn('[Auto-Assign Error during Handover]:', e));
    }
  } catch (err: any) {
    console.error('[executeHandoverToHuman Error]:', err.message);
  }
}

/**
 * 2. AI Suggested Replies (Returns 2-3 contextual drafts for an agent)
 */
export async function generateSuggestedReplies({
  incomingMessage,
  conversationHistory,
  visitorName,
  apiKey,
}: {
  incomingMessage: string;
  conversationHistory?: Array<{ sender_type: string; content: string }>;
  visitorName?: string;
  apiKey?: string | null;
}): Promise<Array<{ title: string; text: string }>> {
  const anthropic = getAnthropicClient(apiKey);

  if (anthropic) {
    try {
      const historySummary = (conversationHistory || [])
        .slice(-6)
        .map((m) => `${m.sender_type.toUpperCase()}: ${m.content}`)
        .join('\n');

      const prompt = `You are assisting a customer support agent.
Customer: "${visitorName || 'Customer'}"
Recent conversation context:
${historySummary || `VISITOR: ${incomingMessage}`}

Generate exactly 3 diverse, contextual suggested replies the agent can choose from:
1. A direct solution/confirmation
2. A friendly troubleshooting/explanatory guide
3. A polite follow-up asking for more details

Format your response as a valid JSON array of objects with keys "title" (short 2-3 word label) and "text" (the message body). Output JSON ONLY, no extra text.`;

      const msg = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }],
      });

      const firstBlock = msg.content[0];
      if (firstBlock && 'text' in firstBlock) {
        const jsonMatch = firstBlock.text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }
    } catch (err) {
      console.warn('[Anthropic] Claude API error in suggested replies, falling back:', err);
    }
  }

  // Heuristic Fallback drafts
  return [
    {
      title: 'Quick Resolution',
      text: `Hi ${visitorName || 'there'}! I've checked into this for you and updated your settings. Everything is good to go now!`,
    },
    {
      title: 'Step-by-Step Help',
      text: `Hello! You can easily accomplish this by navigating to your Account Settings and clicking the Verification tab.`,
    },
    {
      title: 'Ask for Details',
      text: `Thanks for reaching out! Could you please provide your account email or order number so I can look into this immediately?`,
    },
  ];
}

/**
 * 3. Auto-Tagging (Suggests tags based on conversation content)
 */
export async function generateAutoTags({
  content,
  existingTags,
  apiKey,
}: {
  content: string;
  existingTags?: string[];
  apiKey?: string | null;
}): Promise<string[]> {
  const anthropic = getAnthropicClient(apiKey);

  if (anthropic) {
    try {
      const prompt = `Analyze this customer support conversation message and extract 1 to 3 relevant tags.
Message: "${content}"
Standard categories to pick from: Billing, Bug, Refund, VIP, Feature Request, Sales Lead, Account Access, Urgent, Setup, General.

Output ONLY a comma-separated list of tags, for example: "Billing, Refund"`;

      const msg = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 60,
        messages: [{ role: 'user', content: prompt }],
      });

      const firstBlock = msg.content[0];
      if (firstBlock && 'text' in firstBlock) {
        const tags = firstBlock.text
          .split(',')
          .map((t) => t.trim().replace(/^#/, ''))
          .filter((t) => t.length > 0);
        return Array.from(new Set([...(existingTags || []), ...tags]));
      }
    } catch (err) {
      console.warn('[Anthropic] Claude API error in auto-tagging:', err);
    }
  }

  // Keyword heuristic fallback
  const text = content.toLowerCase();
  const tags: string[] = [...(existingTags || [])];

  if (text.includes('refund') || text.includes('cancel') || text.includes('money back')) tags.push('Refund');
  if (text.includes('bill') || text.includes('invoice') || text.includes('charge') || text.includes('card') || text.includes('price')) tags.push('Billing');
  if (text.includes('bug') || text.includes('error') || text.includes('broken') || text.includes('failed') || text.includes('crash')) tags.push('Bug');
  if (text.includes('urgent') || text.includes('asap') || text.includes('emergency')) tags.push('Urgent');
  if (text.includes('buy') || text.includes('purchase') || text.includes('enterprise') || text.includes('demo')) tags.push('Sales Lead');

  // No catch-all tag: a label every conversation carries is not a label.
  return Array.from(new Set(tags)).slice(0, 4);
}

/**
 * 4. Conversation Summary (Generates 2-line summary for long threads)
 */
export async function generateConversationSummary({
  messages,
  visitorName,
  apiKey,
}: {
  messages: Array<{ sender_type: string; content: string }>;
  visitorName?: string;
  apiKey?: string | null;
}): Promise<string> {
  const anthropic = getAnthropicClient(apiKey);

  if (anthropic) {
    try {
      const threadText = messages
        .map((m) => `${m.sender_type.toUpperCase()}: ${m.content}`)
        .join('\n');

      const prompt = `Summarize this support conversation in exactly 2 concise lines (under 25 words total).
Customer: ${visitorName || 'Visitor'}
Thread:
${threadText}

Format:
Line 1: Customer inquired about [issue].
Line 2: Status / resolution [status].`;

      const msg = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 80,
        messages: [{ role: 'user', content: prompt }],
      });

      const firstBlock = msg.content[0];
      if (firstBlock && 'text' in firstBlock) {
        return firstBlock.text.trim();
      }
    } catch (err) {
      console.warn('[Anthropic] Claude API error in summary:', err);
    }
  }

  // Fallback summary generator
  const visitorMsgs = messages.filter((m) => m.sender_type === 'visitor');
  const lastVisitor = visitorMsgs[visitorMsgs.length - 1]?.content || 'general inquiry';
  const hasAgentReply = messages.some((m) => m.sender_type === 'agent' || m.sender_type === 'ai');

  return `Customer inquired about: "${lastVisitor.slice(0, 60)}..."\n${hasAgentReply ? 'Agent replied with instructions. Awaiting customer follow-up.' : 'Awaiting agent first response.'}`;
}

/**
 * 5. Visitor Sentiment Analysis (Positive / Neutral / Negative)
 */
export async function analyzeVisitorSentiment({
  messages,
  apiKey,
}: {
  messages: Array<{ sender_type: string; content: string }>;
  apiKey?: string | null;
}): Promise<'positive' | 'neutral' | 'negative'> {
  const anthropic = getAnthropicClient(apiKey);
  const visitorText = messages
    .filter((m) => m.sender_type === 'visitor')
    .map((m) => m.content)
    .join(' ');

  if (anthropic && visitorText) {
    try {
      const prompt = `Analyze the sentiment of this customer's messages:
"${visitorText}"

Classify into exactly one word: "positive", "neutral", or "negative".
Output ONLY the single classification word.`;

      const msg = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 10,
        messages: [{ role: 'user', content: prompt }],
      });

      const firstBlock = msg.content[0];
      if (firstBlock && 'text' in firstBlock) {
        const text = firstBlock.text.toLowerCase().trim();
        if (text.includes('pos')) return 'positive';
        if (text.includes('neg')) return 'negative';
        return 'neutral';
      }
    } catch (err) {
      console.warn('[Anthropic] Claude API error in sentiment:', err);
    }
  }

  // Heuristic sentiment analysis
  const text = visitorText.toLowerCase();
  const positiveWords = ['thank', 'thanks', 'great', 'awesome', 'helpful', 'love', 'good', 'perfect', 'resolved', 'amazing'];
  const negativeWords = ['terrible', 'bad', 'angry', 'awful', 'frustrated', 'broken', 'worst', 'scam', 'horrible', 'refund immediately', 'waste'];

  const posCount = positiveWords.filter((w) => text.includes(w)).length;
  const negCount = negativeWords.filter((w) => text.includes(w)).length;

  if (negCount > posCount) return 'negative';
  if (posCount > 0) return 'positive';
  return 'neutral';
}
