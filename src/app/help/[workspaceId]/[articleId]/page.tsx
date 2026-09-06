'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Calendar,
  Clock,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Check,
  Link2,
  BookOpen,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  List,
} from 'lucide-react';
import { Article, Workspace } from '@/types/database';
import { createClient } from '@/lib/supabase/client';
import { Avatar } from '@/components/ui/Avatar';
import {
  MarkdownArticleContent,
  extractHeadings,
} from '@/components/dashboard/MarkdownArticleContent';
import { getWorkspaceHelpCenterUrl, isPlatformHost } from '@/lib/domain';
import {
  HelpHeader,
  HelpFooter,
  HelpWidget,
  brandOf,
  openChat,
  copyText,
  readingTime,
  formatDate,
} from '@/components/help/HelpChrome';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type SiblingArticle = Pick<Article, 'id' | 'title' | 'slug' | 'summary'>;

export default function ArticleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params?.workspaceId as string;
  const articleId = params?.articleId as string;

  const [loading, setLoading] = useState(true);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [article, setArticle] = useState<Article | null>(null);
  const [siblings, setSiblings] = useState<SiblingArticle[]>([]);

  const [vote, setVote] = useState<'helpful' | 'unhelpful' | null>(null);
  const [voteState, setVoteState] = useState<'idle' | 'sending' | 'done' | 'error'>(
    'idle'
  );
  const [copied, setCopied] = useState(false);
  const [activeHeading, setActiveHeading] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const viewTracked = useRef(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (!workspaceId || !articleId) return;
    let cancelled = false;

    async function load() {
      try {
        const wsKey = decodeURIComponent(workspaceId).trim();
        const { data: ws } = UUID_RE.test(wsKey)
          ? await supabase
              .from('public_workspaces')
              .select('*')
              .eq('id', wsKey)
              .maybeSingle()
          : await supabase
              .from('public_workspaces')
              .select('*')
              .or(`slug.eq.${wsKey},custom_domain.eq.${wsKey}`)
              .maybeSingle();

        if (cancelled) return;
        if (!ws) {
          setLoading(false);
          return;
        }
        setWorkspace(ws as Workspace);

        const artKey = decodeURIComponent(articleId).trim();
        const base = () =>
          supabase
            .from('articles')
            .select(
              '*, author:agents(id, name, avatar_url), section:help_sections(id, name, slug, icon, order_index)'
            )
            .eq('workspace_id', ws.id)
            .eq('status', 'published');

        let art: Article | null = null;

        if (UUID_RE.test(artKey)) {
          const { data } = await base()
            .or(`id.eq.${artKey},slug.eq.${artKey}`)
            .maybeSingle();
          art = (data as Article) || null;
        } else {
          const { data } = await base().ilike('slug', artKey).maybeSingle();
          art = (data as Article) || null;

          // An article renamed after someone shared its link still has to
          // resolve, so fall back to matching the words in the old slug.
          if (!art) {
            const { data: byTitle } = await base()
              .ilike('title', `%${artKey.replace(/-/g, ' ').trim()}%`)
              .limit(1)
              .maybeSingle();
            art = (byTitle as Article) || null;
          }
        }

        if (cancelled) return;
        if (!art) {
          setLoading(false);
          return;
        }

        setArticle(art);
        setLoading(false);

        if (!viewTracked.current) {
          viewTracked.current = true;
          fetch('/api/help/view', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ articleId: art.id }),
          }).catch(() => {});
        }

        // Siblings drive both "more in this collection" and prev/next. Ordered
        // the same way the collection lists them, so "next" means what the
        // reader just saw one line below.
        if (art.section_id) {
          const { data: sib } = await supabase
            .from('articles')
            .select('id, title, slug, summary')
            .eq('workspace_id', ws.id)
            .eq('section_id', art.section_id)
            .eq('status', 'published')
            .order('created_at', { ascending: false });

          if (!cancelled && sib) setSiblings(sib as SiblingArticle[]);
        }
      } catch (err) {
        console.error('Failed to load article:', err);
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [workspaceId, articleId, supabase]);

  const headings = useMemo(
    () => extractHeadings(article?.content || '').filter((h) => h.level <= 2),
    [article?.content]
  );

  // Reading progress and the active outline entry, from one scroll listener.
  useEffect(() => {
    if (!article) return;

    function onScroll() {
      const el = bodyRef.current;
      if (!el) return;

      const start = el.offsetTop;
      const span = Math.max(1, el.offsetHeight - window.innerHeight * 0.4);
      const seen = window.scrollY - start;
      setProgress(Math.min(1, Math.max(0, seen / span)));

      let current: string | null = null;
      for (const h of headings) {
        const node = document.getElementById(h.id);
        if (node && node.getBoundingClientRect().top <= 120) current = h.id;
      }
      setActiveHeading(current);
    }

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [article, headings]);

  const homeHref = useCallback(() => {
    if (typeof window !== 'undefined') {
      const host = window.location.host.toLowerCase().split(':')[0];
      if (!isPlatformHost(host)) return '/';
    }
    return `/help/${workspace?.slug || workspaceId}`;
  }, [workspace, workspaceId]);

  const articleHref = useCallback(
    (a: { id: string; slug?: string | null }) => {
      const path = a.slug || a.id;
      if (typeof window !== 'undefined') {
        const host = window.location.host.toLowerCase().split(':')[0];
        if (!isPlatformHost(host)) return `/${path}`;
      }
      return `/help/${workspace?.slug || workspaceId}/${path}`;
    },
    [workspace, workspaceId]
  );

  const goHome = useCallback(() => router.push(homeHref()), [router, homeHref]);

  const goToCollection = useCallback(() => {
    const slug = article?.section?.slug || article?.section_id;
    router.push(slug ? `${homeHref()}?c=${slug}` : homeHref());
  }, [router, homeHref, article]);

  const handleShare = async () => {
    const ok = await copyText(getWorkspaceHelpCenterUrl(workspace, article));
    if (!ok) return;
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const submitVote = async (isHelpful: boolean) => {
    if (!article || !workspace || voteState === 'sending') return;
    setVote(isHelpful ? 'helpful' : 'unhelpful');
    setVoteState('sending');

    let visitorId = 'anon';
    try {
      visitorId = localStorage.getItem('chatify_vid') || 'anon';
    } catch {
      /* storage blocked; an anonymous vote still counts */
    }

    try {
      const res = await fetch('/api/help/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleId: article.id,
          workspaceId: workspace.id,
          visitorId,
          isHelpful,
        }),
      });
      // Saying "thanks for your feedback" for a vote that never saved is worse
      // than admitting it failed — the reader would never think to try again.
      setVoteState(res.ok ? 'done' : 'error');
    } catch {
      setVoteState('error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas">
        <div className="h-16 bg-[#0b0b0f]" />
        <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10 space-y-4">
          <div className="h-4 w-40 rounded bg-surface-2 animate-pulse" />
          <div className="h-9 w-3/4 rounded-lg bg-surface-2 animate-pulse" />
          <div className="h-4 w-1/2 rounded bg-surface-2 animate-pulse" />
          <div className="pt-6 space-y-2.5">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-3.5 rounded bg-surface-2 animate-pulse"
                style={{ width: `${92 - i * 6}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!article || !workspace) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-6 text-center gap-3">
        <BookOpen className="w-10 h-10 text-ink-3" />
        <h1 className="text-[20px] font-semibold text-ink">Article not found</h1>
        <p className="text-[14px] text-ink-3 max-w-sm">
          It may have been moved, unpublished, or the link is out of date.
        </p>
        <button
          type="button"
          onClick={goHome}
          className="mt-1 h-9 px-4 rounded-lg border border-line bg-surface text-[13px] font-medium text-ink hover:bg-surface-2 transition-colors"
        >
          Back to Help Center
        </button>
      </div>
    );
  }

  const brand = brandOf(workspace);
  const at = siblings.findIndex((s) => s.id === article.id);
  const prev = at > 0 ? siblings[at - 1] : null;
  const next = at >= 0 && at < siblings.length - 1 ? siblings[at + 1] : null;
  const related = siblings.filter((s) => s.id !== article.id).slice(0, 4);

  return (
    <div
      className="min-h-screen bg-canvas text-ink flex flex-col"
      style={{ ['--brand' as string]: brand }}
    >
      <HelpHeader
        workspace={workspace}
        onHome={goHome}
        leading={
          <button
            type="button"
            onClick={goHome}
            aria-label="Back to Help Center"
            className="w-8 h-8 -ml-1 grid place-items-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        }
        trailing={
          <>
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-[13px] font-medium text-white/70 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Link2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Share</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={openChat}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-white text-[13px] font-semibold transition-opacity hover:opacity-90 cursor-pointer"
              style={{ backgroundColor: brand }}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ask</span>
            </button>
          </>
        }
      />

      {/* How far through the article the reader is. */}
      <div
        className="sticky top-16 z-30 h-0.5 origin-left transition-transform duration-75"
        style={{
          backgroundColor: brand,
          transform: `scaleX(${progress})`,
        }}
        aria-hidden
      />

      <div className="flex-1 w-full mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-10 flex gap-10">
        {/* Centred when it is the only column; left-aligned once the outline
            sidebar is beside it, so the pair reads as one block. */}
        <main
          className={`min-w-0 flex-1 max-w-3xl mx-auto ${
            headings.length > 2 ? 'lg:mx-0' : ''
          }`}
        >
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 text-[12.5px] text-ink-3 flex-wrap"
          >
            <button
              type="button"
              onClick={goHome}
              className="hover:text-ink transition-colors cursor-pointer"
            >
              Help Center
            </button>
            {article.section && (
              <>
                <span aria-hidden>/</span>
                <button
                  type="button"
                  onClick={goToCollection}
                  className="hover:text-ink transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  {article.section.order_index ? (
                    <span className="font-mono text-[10.5px] font-bold px-1.5 py-0.2 rounded bg-surface-2 border border-line text-ink-3">
                      #{String(article.section.order_index).padStart(2, '0')}
                    </span>
                  ) : null}
                  <span>{article.section.icon} {article.section.name}</span>
                </button>
              </>
            )}
          </nav>

          <header className="mt-4 pb-6 border-b border-line space-y-3">
            <h1 className="text-[27px] sm:text-[34px] font-semibold text-ink tracking-tight leading-[1.15]">
              {article.title}
            </h1>

            {article.summary && (
              <p className="text-[15.5px] text-ink-2 leading-relaxed">
                {article.summary}
              </p>
            )}

            <div className="flex items-center gap-x-4 gap-y-1.5 pt-1 text-[12.5px] text-ink-3 flex-wrap">
              <span className="flex items-center gap-2 min-w-0">
                {article.author ? (
                  <>
                    <Avatar
                      name={article.author.name}
                      seed={article.author.id}
                      size="sm"
                      className="w-5 h-5 shrink-0 text-[9px]"
                    />
                    <span className="text-ink-2">{article.author.name}</span>
                  </>
                ) : (
                  <>
                    {/* shrink-0: without it the flex row squeezes the badge
                        under the name and the two render on top of each other. */}
                    <span
                      className="w-5 h-5 shrink-0 rounded-full grid place-items-center text-white text-[9px] font-bold"
                      style={{ backgroundColor: brand }}
                    >
                      {workspace.name.slice(0, 1).toUpperCase()}
                    </span>
                    <span className="text-ink-2">{workspace.name} team</span>
                  </>
                )}
              </span>

              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Updated {formatDate(article.updated_at || article.created_at)}
              </span>

              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {readingTime(article.content)}
              </span>
            </div>
          </header>

          {/* Outline on narrow screens, where the sidebar is hidden. */}
          {headings.length > 2 && (
            <details className="lg:hidden mt-6 rounded-xl border border-line bg-surface-2/50 overflow-hidden">
              <summary className="px-4 py-3 text-[13px] font-medium text-ink cursor-pointer flex items-center gap-2 select-none">
                <List className="w-3.5 h-3.5 text-ink-3" />
                On this page
              </summary>
              <ul className="px-4 pb-3 space-y-1.5">
                {headings.map((h) => (
                  <li key={h.id} className={h.level === 2 ? 'pl-3' : ''}>
                    <a
                      href={`#${h.id}`}
                      className="text-[13px] text-ink-2 hover:text-ink transition-colors"
                    >
                      {h.text}
                    </a>
                  </li>
                ))}
              </ul>
            </details>
          )}

          <div ref={bodyRef} className="mt-7 text-[15.5px] leading-[1.75]">
            <MarkdownArticleContent content={article.content} />
          </div>

          {/* Feedback */}
          <section className="mt-12 rounded-2xl border border-line bg-surface-2/50 p-6 text-center">
            {voteState === 'done' ? (
              <p className="flex items-center justify-center gap-2 text-[13.5px] font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                {vote === 'helpful'
                  ? 'Thanks — glad this helped.'
                  : "Thanks — we'll make this clearer."}
              </p>
            ) : voteState === 'error' ? (
              <div className="space-y-2">
                <p className="flex items-center justify-center gap-2 text-[13.5px] font-medium text-amber-600 dark:text-amber-400">
                  <AlertCircle className="w-4 h-4" />
                  We couldn&apos;t record that just now.
                </p>
                <button
                  type="button"
                  onClick={() => submitVote(vote === 'helpful')}
                  className="text-[13px] font-medium text-ink underline underline-offset-2 hover:no-underline cursor-pointer"
                >
                  Try again
                </button>
              </div>
            ) : (
              <>
                <p className="text-[14px] font-medium text-ink">
                  Did this answer your question?
                </p>
                <div className="mt-3.5 flex items-center justify-center gap-2.5">
                  <button
                    type="button"
                    disabled={voteState === 'sending'}
                    onClick={() => submitVote(true)}
                    className="h-9 px-4 rounded-xl border border-line bg-surface text-[13px] font-medium text-ink inline-flex items-center gap-2 transition-colors hover:border-emerald-500/50 hover:bg-emerald-500/5 disabled:opacity-60 cursor-pointer"
                  >
                    <ThumbsUp className="w-3.5 h-3.5 text-emerald-500" />
                    Yes
                  </button>
                  <button
                    type="button"
                    disabled={voteState === 'sending'}
                    onClick={() => submitVote(false)}
                    className="h-9 px-4 rounded-xl border border-line bg-surface text-[13px] font-medium text-ink inline-flex items-center gap-2 transition-colors hover:border-rose-500/50 hover:bg-rose-500/5 disabled:opacity-60 cursor-pointer"
                  >
                    <ThumbsDown className="w-3.5 h-3.5 text-rose-500" />
                    No
                  </button>
                </div>
              </>
            )}
          </section>

          {/* Previous / next within the collection */}
          {(prev || next) && (
            <nav className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {prev ? (
                <a
                  href={articleHref(prev)}
                  onClick={(e) => {
                    e.preventDefault();
                    router.push(articleHref(prev));
                  }}
                  className="group rounded-xl border border-line bg-surface p-4 hover:border-ink-3/35 transition-colors"
                >
                  <span className="flex items-center gap-1.5 text-[11.5px] text-ink-3">
                    <ArrowLeft className="w-3 h-3 transition-transform group-hover:-translate-x-0.5" />
                    Previous
                  </span>
                  <span className="mt-1 block text-[13.5px] font-medium text-ink line-clamp-2">
                    {prev.title}
                  </span>
                </a>
              ) : (
                <span />
              )}

              {next && (
                <a
                  href={articleHref(next)}
                  onClick={(e) => {
                    e.preventDefault();
                    router.push(articleHref(next));
                  }}
                  className="group rounded-xl border border-line bg-surface p-4 hover:border-ink-3/35 transition-colors sm:text-right"
                >
                  <span className="flex items-center gap-1.5 text-[11.5px] text-ink-3 sm:justify-end">
                    Next
                    <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                  </span>
                  <span className="mt-1 block text-[13.5px] font-medium text-ink line-clamp-2">
                    {next.title}
                  </span>
                </a>
              )}
            </nav>
          )}

          {related.length > 0 && (
            <section className="mt-10 pt-8 border-t border-line">
              <h2 className="text-[15px] font-semibold text-ink">
                More in {article.section?.name || 'this collection'}
              </h2>
              <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {related.map((r) => (
                  <li key={r.id}>
                    <a
                      href={articleHref(r)}
                      onClick={(e) => {
                        e.preventDefault();
                        router.push(articleHref(r));
                      }}
                      className="block rounded-xl border border-line bg-surface p-3.5 hover:border-ink-3/35 transition-colors"
                    >
                      <span className="block text-[13.5px] font-medium text-ink line-clamp-1">
                        {r.title}
                      </span>
                      {r.summary && (
                        <span className="mt-0.5 block text-[12.5px] text-ink-3 line-clamp-1">
                          {r.summary}
                        </span>
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </main>

        {/* Desktop outline */}
        {headings.length > 2 && (
          <aside className="hidden lg:block w-56 shrink-0">
            <nav className="sticky top-28">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">
                On this page
              </p>
              <ul className="mt-3 space-y-1.5 border-l border-line">
                {headings.map((h) => (
                  <li key={h.id}>
                    <a
                      href={`#${h.id}`}
                      className={`block border-l-2 -ml-px pl-3 py-0.5 text-[12.5px] leading-snug transition-colors ${
                        activeHeading === h.id
                          ? 'border-[var(--brand)] text-ink font-medium'
                          : 'border-transparent text-ink-3 hover:text-ink-2'
                      } ${h.level === 2 ? 'pl-5' : ''}`}
                    >
                      {h.text}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>
        )}
      </div>

      <HelpFooter workspace={workspace} />
      <HelpWidget workspace={workspace} />
    </div>
  );
}
