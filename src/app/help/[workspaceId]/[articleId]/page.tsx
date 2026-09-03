'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ChevronLeft,
  Calendar,
  Clock,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  ExternalLink,
  Check,
  Share2,
  BookOpen,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import { Article, Workspace } from '@/types/database';
import { createClient } from '@/lib/supabase/client';
import { Avatar } from '@/components/ui/Avatar';
import { MarkdownArticleContent } from '@/components/dashboard/MarkdownArticleContent';

export default function ArticleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params?.workspaceId as string;
  const articleId = params?.articleId as string;

  const [loading, setLoading] = useState(true);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [article, setArticle] = useState<Article | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);

  // Feedback State
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<boolean>(false);
  const [userVote, setUserVote] = useState<'helpful' | 'unhelpful' | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const viewTrackedRef = useRef(false);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (!workspaceId || !articleId) return;

    async function loadArticle() {
      try {
        setLoading(true);

        // Fetch workspace
        const { data: ws } = await supabase
          .from('workspaces')
          .select('*')
          .eq('id', workspaceId)
          .maybeSingle();

        if (ws) setWorkspace(ws as Workspace);

        // Fetch article
        const { data: art } = await supabase
          .from('articles')
          .select('*, author:agents(id, name, avatar_url), section:help_sections(id, name, icon)')
          .eq('id', articleId)
          .eq('workspace_id', workspaceId)
          .maybeSingle();

        if (art) {
          setArticle(art as Article);

          // Track view once
          if (!viewTrackedRef.current) {
            viewTrackedRef.current = true;
            fetch('/api/help/view', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ articleId: art.id }),
            }).catch(() => {});
          }

          // Fetch related articles in same section
          if (art.section_id) {
            const { data: related } = await supabase
              .from('articles')
              .select('id, title, summary, created_at')
              .eq('section_id', art.section_id)
              .eq('status', 'published')
              .neq('id', art.id)
              .limit(4);

            if (related) setRelatedArticles(related as Article[]);
          }
        }
      } catch (err) {
        console.error('Failed to load article:', err);
      } finally {
        setLoading(false);
      }
    }

    loadArticle();
  }, [workspaceId, articleId, supabase]);

  const handleVote = async (isHelpful: boolean) => {
    if (!article || !workspace) return;
    setUserVote(isHelpful ? 'helpful' : 'unhelpful');
    setIsSubmittingFeedback(true);

    try {
      let vid = 'anon';
      try {
        vid = localStorage.getItem('chatify_vid') || 'anon_visitor';
      } catch (e) {}

      await fetch('/api/help/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleId: article.id,
          workspaceId: workspace.id,
          visitorId: vid,
          isHelpful,
          feedbackText: feedbackText.trim() || undefined,
        }),
      });

      setFeedbackSubmitted(true);
    } catch (err) {
      console.error('Failed to submit feedback:', err);
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleOpenChat = () => {
    if (typeof window !== 'undefined' && (window as any).Chatify) {
      (window as any).Chatify.open();
    }
  };

  const brandColor = workspace?.brand_color || '#2563eb';

  const readingTime = useMemo(() => {
    if (!article?.content) return '1 min read';
    const words = article.content.split(/\s+/).length;
    const minutes = Math.max(1, Math.round(words / 180));
    return `${minutes} min read`;
  }, [article?.content]);

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-3 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-[13px] text-ink-3">Loading article...</p>
      </div>
    );
  }

  if (!article || !workspace) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-6 text-center space-y-4">
        <BookOpen className="w-12 h-12 text-ink-3 mx-auto" />
        <h1 className="text-[22px] font-bold text-ink">Article Not Found</h1>
        <p className="text-[14px] text-ink-3 max-w-md">
          This article might have been moved, removed, or is currently saved as an internal draft.
        </p>
        <button
          onClick={() => router.push(`/help/${workspaceId}`)}
          className="h-9 px-4 rounded-lg bg-accent text-accent-ink text-[13px] font-medium"
        >
          Return to Help Center
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col">
      {/* Top Header */}
      <header className="border-b border-line/80 bg-surface sticky top-0 z-30 shadow-xs">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <button
            onClick={() => router.push(`/help/${workspaceId}`)}
            className="flex items-center gap-2 text-[13px] font-semibold text-ink-2 hover:text-ink transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>All Collections</span>
          </button>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleShare}
              className="h-8 px-3 rounded-lg border border-line bg-surface hover:bg-surface-2 text-[12px] font-medium text-ink flex items-center gap-1.5 transition-colors shadow-xs"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400">Link Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-ink-3" />
                  <span>Share</span>
                </>
              )}
            </button>

            <button
              onClick={handleOpenChat}
              className="h-8 px-3.5 rounded-lg text-white text-[12px] font-semibold flex items-center gap-1.5 transition-all shadow-xs hover:opacity-90"
              style={{ backgroundColor: brandColor }}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Ask Support</span>
            </button>
          </div>
        </div>
      </header>

      {/* Article Container */}
      <main className="max-w-4xl mx-auto px-6 py-12 flex-1 w-full space-y-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-[12.5px] text-ink-3 flex-wrap">
          <span
            onClick={() => router.push(`/help/${workspaceId}`)}
            className="hover:text-accent cursor-pointer transition-colors"
          >
            Help Center
          </span>
          <span>/</span>
          {article.section && (
            <>
              <span className="text-ink-2 font-medium">
                {article.section.icon} {article.section.name}
              </span>
              <span>/</span>
            </>
          )}
          <span className="text-ink font-semibold truncate max-w-xs">{article.title}</span>
        </nav>

        {/* Article Title & Metadata Header */}
        <div className="space-y-4 pb-6 border-b border-line">
          <h1 className="text-[28px] sm:text-[36px] font-extrabold text-ink tracking-tight leading-tight">
            {article.title}
          </h1>

          {article.summary && (
            <p className="text-[16px] text-ink-2 leading-relaxed max-w-2xl font-normal">
              {article.summary}
            </p>
          )}

          {/* Author & Meta Row */}
          <div className="flex items-center gap-4 text-[12.5px] text-ink-3 pt-2 flex-wrap">
            {article.author ? (
              <div className="flex items-center gap-2">
                <Avatar
                  name={article.author.name}
                  seed={article.author.id}
                  size="sm"
                  className="w-6 h-6 text-[10px]"
                />
                <span className="text-ink-2 font-medium">Written by {article.author.name}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                  style={{ backgroundColor: brandColor }}
                >
                  {workspace.name.slice(0, 1)}
                </div>
                <span className="text-ink-2 font-medium">{workspace.name} Support Team</span>
              </div>
            )}

            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Updated {new Date(article.updated_at || article.created_at).toLocaleDateString()}</span>
            </span>

            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{readingTime}</span>
            </span>
          </div>
        </div>

        {/* Article Body Content */}
        <article className="prose dark:prose-invert max-w-none text-[15px] leading-relaxed text-ink space-y-4">
          <RenderArticleContent content={article.content} />
        </article>

        {/* Was this article helpful? (Intercom Reaction Box) */}
        <div className="my-12 p-6 rounded-2xl border border-line bg-surface-2/60 text-center space-y-4">
          <div className="text-[15px] font-bold text-ink">Did this answer your question?</div>

          {!feedbackSubmitted ? (
            <div className="flex items-center justify-center gap-3">
              <button
                disabled={isSubmittingFeedback}
                onClick={() => handleVote(true)}
                className="h-10 px-5 rounded-xl border border-line bg-surface hover:bg-surface-2 hover:border-emerald-500/50 text-[13px] font-semibold text-ink flex items-center gap-2 transition-all shadow-xs group"
              >
                <ThumbsUp className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
                <span>Yes, thanks!</span>
              </button>

              <button
                disabled={isSubmittingFeedback}
                onClick={() => handleVote(false)}
                className="h-10 px-5 rounded-xl border border-line bg-surface hover:bg-surface-2 hover:border-rose-500/50 text-[13px] font-semibold text-ink flex items-center gap-2 transition-all shadow-xs group"
              >
                <ThumbsDown className="w-4 h-4 text-rose-500 group-hover:scale-110 transition-transform" />
                <span>Not really</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-[13.5px] animate-in fade-in">
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {userVote === 'helpful'
                  ? 'Thank you for your feedback! Glad we could help.'
                  : "Thank you for the feedback. We'll work to make this guide clearer."}
              </span>
            </div>
          )}
        </div>

        {/* Related Articles in Same Section */}
        {relatedArticles.length > 0 && (
          <div className="pt-8 border-t border-line space-y-4">
            <h3 className="text-[16px] font-bold text-ink">
              More in this collection ({article.section?.name || 'Related'})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {relatedArticles.map((rel) => (
                <div
                  key={rel.id}
                  onClick={() => router.push(`/help/${workspaceId}/${rel.id}`)}
                  className="p-4 rounded-xl border border-line bg-surface hover:border-accent transition-all cursor-pointer space-y-1"
                >
                  <h4 className="text-[13.5px] font-semibold text-ink hover:text-accent">
                    {rel.title}
                  </h4>
                  {rel.summary && (
                    <p className="text-[12px] text-ink-3 line-clamp-1">{rel.summary}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-line/80 py-6 px-6 text-center text-[12px] text-ink-3 bg-surface mt-12">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            © {new Date().getFullYear()} {workspace.name}. Powered by{' '}
            <strong className="text-ink">Chatify</strong>.
          </span>
          <button
            onClick={handleOpenChat}
            className="text-accent font-semibold hover:underline flex items-center gap-1"
          >
            <span>Have questions? Talk with us</span>
            <MessageCircle className="w-3.5 h-3.5" />
          </button>
        </div>
      </footer>

      {/* Embed Standalone Chatify Widget */}
      <script
        async
        src="/widget.js"
        data-workspace-id={workspace.id}
        data-color={brandColor}
        data-title={`${workspace.name} Support`}
      />
    </div>
  );
}

// Markdown Parser Component
function RenderArticleContent({ content }: { content: string }) {
  return <MarkdownArticleContent content={content} />;
}
