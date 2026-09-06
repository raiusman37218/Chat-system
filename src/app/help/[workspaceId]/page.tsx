'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  Search,
  BookOpen,
  ArrowLeft,
  MessageCircle,
  FileText,
  ChevronRight,
  X,
  CornerDownLeft,
} from 'lucide-react';
import { Article, HelpSection, Workspace } from '@/types/database';
import { createClient } from '@/lib/supabase/client';
import { isPlatformHost } from '@/lib/domain';
import {
  HelpHeader,
  HelpFooter,
  HelpWidget,
  brandOf,
  helpTitleOf,
  openChat,
  formatDate,
} from '@/components/help/HelpChrome';

/** Articles with no section still have to be reachable. */
const UNSORTED = '__unsorted__';

/** Columns the index needs. Article bodies are fetched separately — see below. */
const LIST_COLUMNS =
  'id, title, slug, summary, section_id, created_at, updated_at, views_count';

type ListArticle = Pick<
  Article,
  'id' | 'title' | 'slug' | 'summary' | 'section_id' | 'created_at' | 'updated_at'
>;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function PublicHelpCenterPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const workspaceId = params?.workspaceId as string;

  const [loading, setLoading] = useState(true);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [sections, setSections] = useState<HelpSection[]>([]);
  const [articles, setArticles] = useState<ListArticle[]>([]);
  /** id → body text, filled in after first paint so deep search still works. */
  const [bodies, setBodies] = useState<Record<string, string>>({});

  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);

  const supabase = useMemo(() => createClient(), []);

  // The open collection lives in the URL. Keeping it in component state alone
  // meant a collection could not be linked to and the browser's Back button
  // walked out of the help centre instead of back to the collection list.
  const openCollection = searchParams?.get('c') || null;

  const setOpenCollection = useCallback(
    (slug: string | null) => {
      const next = new URLSearchParams(Array.from(searchParams?.entries() || []));
      if (slug) next.set('c', slug);
      else next.delete('c');
      const qs = next.toString();
      router.push(qs ? `?${qs}` : '?', { scroll: true });
    },
    [router, searchParams]
  );

  useEffect(() => {
    if (!workspaceId) return;
    let cancelled = false;

    async function load() {
      try {
        const key = decodeURIComponent(workspaceId).trim();
        const { data: ws } = UUID_RE.test(key)
          ? await supabase
              .from('public_workspaces')
              .select('*')
              .eq('id', key)
              .maybeSingle()
          : await supabase
              .from('public_workspaces')
              .select('*')
              .or(`slug.eq.${key},custom_domain.eq.${key}`)
              .maybeSingle();

        if (cancelled) return;
        if (!ws) {
          setLoading(false);
          return;
        }
        setWorkspace(ws as Workspace);

        // First paint deliberately leaves article bodies behind. A help centre
        // with a few hundred articles was shipping every full article to the
        // browser before it could draw a single card.
        const [secRes, artRes] = await Promise.all([
          supabase
            .from('help_sections')
            .select('*')
            .eq('workspace_id', ws.id)
            .order('order_index', { ascending: true })
            .order('created_at', { ascending: true }),
          supabase
            .from('articles')
            .select(LIST_COLUMNS)
            .eq('workspace_id', ws.id)
            .eq('status', 'published')
            .order('created_at', { ascending: false }),
        ]);

        if (cancelled) return;
        setSections((secRes.data as HelpSection[]) || []);
        setArticles((artRes.data as ListArticle[]) || []);
        setLoading(false);

        // Then pull the bodies in the background so search can look inside
        // articles too, without holding up the page.
        const { data: full } = await supabase
          .from('articles')
          .select('id, content')
          .eq('workspace_id', ws.id)
          .eq('status', 'published');

        if (cancelled || !full) return;
        const map: Record<string, string> = {};
        for (const row of full as { id: string; content: string | null }[]) {
          map[row.id] = (row.content || '').toLowerCase();
        }
        setBodies(map);
      } catch (err) {
        console.error('Failed to load help center:', err);
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [workspaceId, supabase]);

  const byCollection = useMemo(() => {
    const map: Record<string, ListArticle[]> = {};
    for (const a of articles) {
      const key = a.section_id || UNSORTED;
      (map[key] ||= []).push(a);
    }
    return map;
  }, [articles]);

  /**
   * Collections shown to visitors. Empty ones are hidden — an owner's
   * work-in-progress category reads as a broken link to a customer — and
   * articles that were never filed get a collection of their own instead of
   * silently disappearing from the site, which is what used to happen.
   */
  const collections = useMemo(() => {
    const list = sections
      .filter((s) => (byCollection[s.id]?.length || 0) > 0)
      .map((s) => ({
        key: s.id,
        slug: s.slug || s.id,
        name: s.name,
        description: s.description,
        icon: s.icon || '📘',
        articles: byCollection[s.id] || [],
      }));

    const unsorted = byCollection[UNSORTED] || [];
    if (unsorted.length) {
      list.push({
        key: UNSORTED,
        slug: UNSORTED,
        name: 'Other articles',
        description: null,
        icon: '📄',
        articles: unsorted,
      });
    }
    return list;
  }, [sections, byCollection]);

  const activeCollection = useMemo(
    () => collections.find((c) => c.slug === openCollection) || null,
    [collections, openCollection]
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const scored = articles
      .map((a) => {
        const title = a.title.toLowerCase();
        const summary = (a.summary || '').toLowerCase();
        // Title beats summary beats body, so the obvious answer comes first
        // instead of whichever article happened to be created last.
        let score = 0;
        if (title.startsWith(q)) score = 100;
        else if (title.includes(q)) score = 80;
        else if (summary.includes(q)) score = 50;
        else if (bodies[a.id]?.includes(q)) score = 20;
        return { article: a, score };
      })
      .filter((r) => r.score > 0);

    scored.sort((a, b) => b.score - a.score);
    return scored.map((r) => r.article);
  }, [articles, bodies, query]);

  useEffect(() => setActiveIndex(0), [query]);

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

  const goToArticle = useCallback(
    (a: { id: string; slug?: string | null }) => router.push(articleHref(a)),
    [articleHref, router]
  );

  // "/" focuses search from anywhere, Escape clears it, arrows walk results.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = document.activeElement;
      const typing =
        el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement;

      if (e.key === '/' && !typing) {
        e.preventDefault();
        searchRef.current?.focus();
        return;
      }
      if (!query) return;
      if (e.key === 'Escape') {
        setQuery('');
        searchRef.current?.blur();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && results[activeIndex]) {
        e.preventDefault();
        goToArticle(results[activeIndex]);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [query, results, activeIndex, goToArticle]);

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas">
        <div className="h-16 bg-[#0b0b0f]" />
        <div className="bg-[#0b0b0f] px-4 sm:px-6 pb-14 pt-10">
          <div className="mx-auto max-w-3xl space-y-5">
            <div className="h-8 w-2/3 rounded-lg bg-white/10 animate-pulse" />
            <div className="h-13 w-full rounded-xl bg-white/5 animate-pulse" />
          </div>
        </div>
        <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10 space-y-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-24 rounded-2xl border border-line bg-surface-2/50 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-6 text-center gap-3">
        <BookOpen className="w-10 h-10 text-ink-3" />
        <h1 className="text-[20px] font-semibold text-ink">Help Center not found</h1>
        <p className="text-[14px] text-ink-3 max-w-sm">
          This address doesn&apos;t match a published help centre.
        </p>
      </div>
    );
  }

  const brand = brandOf(workspace);
  const title = helpTitleOf(workspace);
  const totalPublished = articles.length;

  return (
    <div
      className="min-h-screen bg-canvas text-ink flex flex-col"
      style={{ ['--brand' as string]: brand }}
    >
      <HelpHeader workspace={workspace} onHome={() => setOpenCollection(null)} />

      {/* Brand band: title + search, the only two things a visitor arrives for. */}
      <section className="bg-[#0b0b0f] px-4 sm:px-6 pt-10 pb-12 sm:pt-12 sm:pb-14">
        <div className="mx-auto max-w-3xl space-y-5">
          <div className="space-y-1.5">
            <h1 className="text-[26px] sm:text-[32px] font-semibold tracking-tight text-white">
              How can we help?
            </h1>
            <p className="text-[14px] text-white/50">
              {totalPublished > 0
                ? `${totalPublished} ${totalPublished === 1 ? 'article' : 'articles'} from the ${title} team`
                : `Answers from the ${title} team`}
            </p>
          </div>

          <div className="relative">
            <Search className="w-[18px] h-[18px] text-white/40 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for an answer…"
              aria-label="Search help articles"
              className="w-full h-13 pl-11 pr-24 rounded-xl bg-white/[0.06] border border-white/12 text-[15px] text-white placeholder:text-white/35 outline-none transition-all focus:bg-white/[0.09] focus:border-white/25 [&::-webkit-search-cancel-button]:hidden"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 grid place-items-center rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <kbd className="absolute right-4 top-1/2 -translate-y-1/2 hidden sm:block px-1.5 py-0.5 rounded border border-white/15 text-[11px] font-medium text-white/40">
                /
              </kbd>
            )}
          </div>
        </div>
      </section>

      <main className="flex-1 w-full mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-10">
        {query.trim() ? (
          <SearchResults
            query={query}
            results={results}
            activeIndex={activeIndex}
            onHover={setActiveIndex}
            onSelect={goToArticle}
            href={articleHref}
            onAskSupport={openChat}
          />
        ) : activeCollection ? (
          <CollectionView
            collection={activeCollection}
            onBack={() => setOpenCollection(null)}
            onSelect={goToArticle}
            href={articleHref}
          />
        ) : (
          <CollectionGrid
            collections={collections}
            onOpen={(slug) => setOpenCollection(slug)}
            onSelect={goToArticle}
            href={articleHref}
          />
        )}

        {!query.trim() && (
          <section className="mt-10 rounded-2xl border border-line bg-surface p-6 sm:p-7 text-center">
            <h2 className="text-[16px] font-semibold text-ink">
              Can&apos;t find what you need?
            </h2>
            <p className="mt-1 text-[13.5px] text-ink-3 max-w-md mx-auto">
              Start a conversation and someone from the {title} team will pick it up.
            </p>
            <button
              type="button"
              onClick={openChat}
              className="mt-4 h-10 px-5 rounded-xl text-white text-[13.5px] font-semibold inline-flex items-center gap-2 transition-opacity hover:opacity-90"
              style={{ backgroundColor: brand }}
            >
              <MessageCircle className="w-4 h-4" />
              Message us
            </button>
          </section>
        )}
      </main>

      <HelpFooter workspace={workspace} />
      <HelpWidget workspace={workspace} />
    </div>
  );
}

/* ── Collections ──────────────────────────────────────────────────────── */

interface Collection {
  key: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string;
  articles: ListArticle[];
}

function CollectionGrid({
  collections,
  onOpen,
  onSelect,
  href,
}: {
  collections: Collection[];
  onOpen: (slug: string) => void;
  onSelect: (a: ListArticle) => void;
  href: (a: ListArticle) => string;
}) {
  if (collections.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-surface-2/40 p-14 text-center space-y-2">
        <BookOpen className="w-9 h-9 text-ink-3 mx-auto stroke-[1.5]" />
        <h2 className="text-[16px] font-semibold text-ink">Nothing published yet</h2>
        <p className="text-[13px] text-ink-3">
          Articles will appear here as soon as they go live.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {collections.map((c) => (
        <article
          key={c.key}
          className="group rounded-2xl border border-line bg-surface transition-colors hover:border-ink-3/35"
        >
          <button
            type="button"
            onClick={() => onOpen(c.slug)}
            className="w-full text-left p-5 sm:p-6 flex items-start gap-4 cursor-pointer"
          >
            <span
              aria-hidden
              className="shrink-0 w-11 h-11 rounded-xl grid place-items-center text-[20px] bg-surface-2 border border-line"
            >
              {c.icon}
            </span>

            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <h2 className="text-[16.5px] font-semibold text-ink truncate">
                  {c.name}
                </h2>
                <ChevronRight className="w-4 h-4 text-ink-3 shrink-0 transition-transform group-hover:translate-x-0.5" />
              </span>
              {c.description && (
                <p className="mt-1 text-[13.5px] text-ink-2 leading-relaxed line-clamp-2">
                  {c.description}
                </p>
              )}
              <p className="mt-1.5 text-[12px] text-ink-3">
                {c.articles.length} {c.articles.length === 1 ? 'article' : 'articles'}
              </p>
            </span>
          </button>

          {/* A preview of what is inside saves a click for the common case. */}
          {c.articles.length > 0 && (
            <ul className="border-t border-line/70 divide-y divide-line/60">
              {c.articles.slice(0, 3).map((a) => (
                <li key={a.id}>
                  <a
                    href={href(a)}
                    onClick={(e) => {
                      e.preventDefault();
                      onSelect(a);
                    }}
                    className="flex items-center gap-3 px-5 sm:px-6 py-2.5 text-[13.5px] text-ink-2 hover:text-ink hover:bg-surface-2/60 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5 text-ink-3 shrink-0" />
                    <span className="truncate">{a.title}</span>
                  </a>
                </li>
              ))}
              {c.articles.length > 3 && (
                <li>
                  <button
                    type="button"
                    onClick={() => onOpen(c.slug)}
                    className="w-full text-left px-5 sm:px-6 py-2.5 text-[13px] font-medium text-ink-3 hover:text-ink hover:bg-surface-2/60 transition-colors"
                  >
                    Show all {c.articles.length} articles
                  </button>
                </li>
              )}
            </ul>
          )}
        </article>
      ))}
    </div>
  );
}

function CollectionView({
  collection,
  onBack,
  onSelect,
  href,
}: {
  collection: Collection;
  onBack: () => void;
  onSelect: (a: ListArticle) => void;
  href: (a: ListArticle) => string;
}) {
  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-3 hover:text-ink transition-colors group cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
        All collections
      </button>

      <header className="flex items-start gap-4">
        <span
          aria-hidden
          className="shrink-0 w-12 h-12 rounded-xl grid place-items-center text-[22px] bg-surface-2 border border-line"
        >
          {collection.icon}
        </span>
        <div className="min-w-0">
          <h2 className="text-[22px] sm:text-[25px] font-semibold tracking-tight text-ink">
            {collection.name}
          </h2>
          {collection.description && (
            <p className="mt-1 text-[14px] text-ink-2 leading-relaxed">
              {collection.description}
            </p>
          )}
          <p className="mt-1.5 text-[12.5px] text-ink-3">
            {collection.articles.length}{' '}
            {collection.articles.length === 1 ? 'article' : 'articles'}
          </p>
        </div>
      </header>

      <ul className="rounded-2xl border border-line bg-surface divide-y divide-line/70 overflow-hidden">
        {collection.articles.map((a) => (
          <li key={a.id}>
            <a
              href={href(a)}
              onClick={(e) => {
                e.preventDefault();
                onSelect(a);
              }}
              className="group flex items-center gap-4 p-4 sm:px-5 hover:bg-surface-2/60 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <h3 className="text-[14.5px] font-medium text-ink truncate">
                  {a.title}
                </h3>
                {a.summary && (
                  <p className="mt-0.5 text-[13px] text-ink-3 line-clamp-1">
                    {a.summary}
                  </p>
                )}
                {formatDate(a.updated_at || a.created_at) && (
                  <p className="mt-1 text-[11.5px] text-ink-3/80">
                    Updated {formatDate(a.updated_at || a.created_at)}
                  </p>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-ink-3 shrink-0 transition-transform group-hover:translate-x-0.5" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── Search ───────────────────────────────────────────────────────────── */

function SearchResults({
  query,
  results,
  activeIndex,
  onHover,
  onSelect,
  href,
  onAskSupport,
}: {
  query: string;
  results: ListArticle[];
  activeIndex: number;
  onHover: (i: number) => void;
  onSelect: (a: ListArticle) => void;
  href: (a: ListArticle) => string;
  onAskSupport: () => void;
}) {
  if (results.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-surface-2/40 p-12 text-center space-y-2">
        <Search className="w-8 h-8 text-ink-3 mx-auto stroke-[1.5]" />
        <h2 className="text-[15.5px] font-semibold text-ink">
          No results for “{query}”
        </h2>
        <p className="text-[13px] text-ink-3 max-w-sm mx-auto">
          Try a shorter or different word — or ask us directly.
        </p>
        <button
          type="button"
          onClick={onAskSupport}
          className="mt-2 h-9 px-4 rounded-xl border border-line bg-surface text-[13px] font-medium text-ink inline-flex items-center gap-2 hover:bg-surface-2 transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          Ask support
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-ink-3">
          {results.length} {results.length === 1 ? 'result' : 'results'} for{' '}
          <span className="font-medium text-ink-2">“{query}”</span>
        </p>
        <p className="hidden sm:flex items-center gap-1.5 text-[11.5px] text-ink-3">
          <CornerDownLeft className="w-3 h-3" /> to open
        </p>
      </div>

      <ul className="rounded-2xl border border-line bg-surface divide-y divide-line/70 overflow-hidden">
        {results.map((a, i) => (
          <li key={a.id}>
            <a
              href={href(a)}
              onMouseEnter={() => onHover(i)}
              onClick={(e) => {
                e.preventDefault();
                onSelect(a);
              }}
              className={`flex items-start gap-3 p-4 sm:px-5 transition-colors ${
                i === activeIndex ? 'bg-surface-2/70' : 'hover:bg-surface-2/50'
              }`}
            >
              <FileText className="w-4 h-4 text-ink-3 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <h3 className="text-[14.5px] font-medium text-ink">
                  <Highlight text={a.title} query={query} />
                </h3>
                {a.summary && (
                  <p className="mt-0.5 text-[13px] text-ink-3 line-clamp-2">
                    <Highlight text={a.summary} query={query} />
                  </p>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-ink-3 shrink-0 mt-0.5" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Marks the matched span so it is obvious why a result was returned. */
function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  if (!q) return <>{text}</>;

  const at = text.toLowerCase().indexOf(q.toLowerCase());
  if (at === -1) return <>{text}</>;

  return (
    <>
      {text.slice(0, at)}
      <mark className="bg-transparent text-ink font-semibold underline decoration-2 decoration-[var(--brand)] underline-offset-2">
        {text.slice(at, at + q.length)}
      </mark>
      {text.slice(at + q.length)}
    </>
  );
}
