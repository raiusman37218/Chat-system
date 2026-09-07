'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback, Suspense } from 'react';
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
  LayoutGrid,
  Grid3X3,
  Columns4,
  Rows3,
  Calendar,
  Clock,
  Sparkles,
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
  'id, title, slug, summary, section_id, created_at, updated_at, views_count, order_index';

type ListArticle = Pick<
  Article,
  'id' | 'title' | 'slug' | 'summary' | 'section_id' | 'created_at' | 'updated_at' | 'views_count' | 'order_index'
>;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function PublicHelpCenterContent() {
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

  const [layout, setLayout] = useState<'grid-2' | 'grid-3' | 'grid-4' | 'list'>('grid-2');

  useEffect(() => {
    if (workspace?.help_center_layout) {
      setLayout(workspace.help_center_layout as any);
    }
    try {
      const saved = localStorage.getItem(`help_layout_${workspaceId}`);
      if (saved && ['grid-2', 'grid-3', 'grid-4', 'list'].includes(saved)) {
        setLayout(saved as any);
      }
    } catch {}
  }, [workspace, workspaceId]);

  const handleSetLayout = useCallback(
    (nextLayout: 'grid-2' | 'grid-3' | 'grid-4' | 'list') => {
      setLayout(nextLayout);
      try {
        localStorage.setItem(`help_layout_${workspaceId}`, nextLayout);
      } catch {}
    },
    [workspaceId]
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
            .order('order_index', { ascending: true })
            .order('created_at', { ascending: true }),
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
    // Sort articles within each collection by order_index asc, then created_at asc
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => {
        const ao = a.order_index ?? 0;
        const bo = b.order_index ?? 0;
        if (ao !== bo) return ao - bo;
        return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
      });
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
    // Sort sections by order_index ascending, then created_at
    const sorted = [...sections].sort((a, b) => {
      const ao = a.order_index ?? 0;
      const bo = b.order_index ?? 0;
      if (ao !== bo) return ao - bo;
      return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
    });

    const list = sorted
      .filter((s) => (byCollection[s.id]?.length || 0) > 0)
      .map((s, idx) => {
        const orderNum = s.order_index && s.order_index > 0 ? s.order_index : idx + 1;
        const formattedNumber = String(orderNum).padStart(2, '0');
        return {
          key: s.id,
          slug: s.slug || s.id,
          name: s.name,
          description: s.description,
          icon: s.icon || '📘',
          orderNumber: orderNum,
          formattedNumber,
          articles: byCollection[s.id] || [],
        };
      });

    const unsorted = byCollection[UNSORTED] || [];
    if (unsorted.length) {
      const idx = list.length + 1;
      list.push({
        key: UNSORTED,
        slug: UNSORTED,
        name: 'Other articles',
        description: null,
        icon: '📄',
        orderNumber: idx,
        formattedNumber: String(idx).padStart(2, '0'),
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

  const popularArticles = useMemo(() => {
    if (articles.length === 0) return [];
    return [...articles]
      .sort((a, b) => (b.views_count || 0) - (a.views_count || 0))
      .slice(0, 3);
  }, [articles]);

  if (loading) {
    return <HelpCenterLoadingSkeleton />;
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
              {workspace.help_center_title ? `Welcome to ${workspace.help_center_title}` : 'How can we help?'}
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
              placeholder="Search for articles..."
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

      <main
        className={`flex-1 w-full mx-auto px-4 sm:px-6 py-8 sm:py-10 transition-all duration-300 ${
          layout === 'grid-4'
            ? 'max-w-6xl'
            : layout === 'grid-3'
            ? 'max-w-5xl'
            : layout === 'grid-2'
            ? 'max-w-4xl'
            : 'max-w-3xl'
        }`}
      >
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
          <div className="space-y-8">
            {/* AquaFunded-style "Most Viewed Articles" Top Block */}
            {popularArticles.length > 0 && (
              <section className="rounded-2xl border border-line bg-surface p-4 sm:p-5 shadow-2xs">
                <div className="flex items-center justify-between mb-3 px-1">
                  <header className="text-[16px] font-bold text-ink">
                    Most Viewed Articles
                  </header>
                  <span className="text-[12px] text-ink-3">Popular</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {popularArticles.map((art) => (
                    <a
                      key={art.id}
                      href={articleHref(art)}
                      onClick={(e) => {
                        e.preventDefault();
                        goToArticle(art);
                      }}
                      className="group flex items-center justify-between gap-3 p-3.5 rounded-xl border border-line/70 bg-surface-2/40 hover:bg-accent-soft/30 hover:border-accent/40 transition-all no-underline"
                    >
                      <div className="min-w-0 flex-1">
                        <h4 className="text-[13.5px] font-medium text-ink group-hover:text-accent transition-colors truncate">
                          {art.title}
                        </h4>
                      </div>
                      <ChevronRight className="w-4 h-4 text-ink-3 shrink-0 group-hover:text-accent group-hover:translate-x-0.5 transition-transform" />
                    </a>
                  ))}
                </div>
              </section>
            )}

            <CollectionGrid
              collections={collections}
              layout={layout}
              onSetLayout={handleSetLayout}
              onOpen={(slug) => setOpenCollection(slug)}
              onSelect={goToArticle}
              href={articleHref}
            />
          </div>
        )}

        {!query.trim() && (
          <section className="mt-14 rounded-2xl border border-line bg-surface p-8 sm:p-10 text-center shadow-2xs">
            <h2 className="text-[22px] sm:text-[25px] font-bold text-ink tracking-tight">
              More Questions?
            </h2>
            <p className="mt-2 text-[14px] text-ink-3 max-w-md mx-auto leading-relaxed">
              If you have any unanswered questions simply get in touch with us and we&apos;ll aim to reply promptly.
            </p>
            <button
              type="button"
              onClick={openChat}
              className="mt-5 h-11 px-6 rounded-xl text-white text-[14px] font-semibold inline-flex items-center gap-2 shadow-sm transition-all hover:opacity-90 active:scale-[0.98] cursor-pointer"
              style={{ backgroundColor: brand }}
            >
              <MessageCircle className="w-4 h-4" />
              <span>Contact {title} Support</span>
            </button>
          </section>
        )}
      </main>

      <HelpFooter workspace={workspace} />
      <HelpWidget workspace={workspace} />
    </div>
  );
}

function HelpCenterLoadingSkeleton() {
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

export default function PublicHelpCenterPage() {
  return (
    <Suspense fallback={<HelpCenterLoadingSkeleton />}>
      <PublicHelpCenterContent />
    </Suspense>
  );
}

/* ── Collections ──────────────────────────────────────────────────────── */

interface Collection {
  key: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string;
  orderNumber: number;
  formattedNumber: string;
  articles: ListArticle[];
}

/** Renders an image logo if icon starts with http/data/path, otherwise renders emoji/symbol */
function CollectionIcon({
  icon,
  className = 'w-11 h-11',
  imgClassName = 'w-6 h-6',
}: {
  icon?: string | null;
  className?: string;
  imgClassName?: string;
}) {
  const isImg =
    icon &&
    (icon.startsWith('http://') ||
      icon.startsWith('https://') ||
      icon.startsWith('/') ||
      icon.startsWith('data:image/'));

  return (
    <span
      aria-hidden
      className={`shrink-0 rounded-xl grid place-items-center bg-surface-2 border border-line overflow-hidden select-none transition-transform group-hover:scale-105 ${className}`}
    >
      {isImg ? (
        <img
          src={icon}
          alt=""
          className={`object-contain ${imgClassName}`}
        />
      ) : (
        <span className="text-[20px] leading-none">
          {icon?.trim() || '📚'}
        </span>
      )}
    </span>
  );
}

function CollectionGrid({
  collections,
  layout,
  onSetLayout,
  onOpen,
  onSelect,
  href,
}: {
  collections: Collection[];
  layout: 'grid-2' | 'grid-3' | 'grid-4' | 'list';
  onSetLayout: (l: 'grid-2' | 'grid-3' | 'grid-4' | 'list') => void;
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
    <div className="space-y-4">
      {/* Top Controls: Collections Header + Intercom-style Layout Variation Switcher */}
      <div className="flex items-center justify-between gap-3 pb-1">
        <div className="flex items-center gap-2">
          <h2 className="text-[13px] font-bold text-ink uppercase tracking-wider">
            Collections
          </h2>
          <span className="text-[11.5px] px-2 py-0.5 rounded-full bg-surface-2 border border-line text-ink-3 font-medium">
            {collections.length}
          </span>
        </div>

        {/* Layout Switcher (List / Row-wise, 2-Col, 3-Col, 4-Col) */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-surface-2 border border-line">
          <button
            type="button"
            onClick={() => onSetLayout('list')}
            title="Row-wise / List View"
            className={`p-1.5 rounded-lg transition-all ${
              layout === 'list'
                ? 'bg-surface text-ink shadow-xs'
                : 'text-ink-3 hover:text-ink'
            }`}
          >
            <Rows3 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onSetLayout('grid-2')}
            title="2 in a row (2 Columns)"
            className={`p-1.5 rounded-lg transition-all ${
              layout === 'grid-2'
                ? 'bg-surface text-ink shadow-xs'
                : 'text-ink-3 hover:text-ink'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onSetLayout('grid-3')}
            title="3 in a row (3 Columns)"
            className={`p-1.5 rounded-lg transition-all ${
              layout === 'grid-3'
                ? 'bg-surface text-ink shadow-xs'
                : 'text-ink-3 hover:text-ink'
            }`}
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onSetLayout('grid-4')}
            title="4 in a row (4 Columns)"
            className={`p-1.5 rounded-lg transition-all ${
              layout === 'grid-4'
                ? 'bg-surface text-ink shadow-xs'
                : 'text-ink-3 hover:text-ink'
            }`}
          >
            <Columns4 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── VARIATION 1: ROW-WISE / LIST VIEW ── */}
      {layout === 'list' && (
        <div className="space-y-3">
          {collections.map((c) => (
            <article
              key={c.key}
              className="group rounded-2xl border border-line bg-surface transition-all hover:border-ink-3/35 hover:shadow-xs"
            >
              <button
                type="button"
                onClick={() => onOpen(c.slug)}
                className="w-full text-left p-5 sm:p-6 flex items-start sm:items-center gap-4 cursor-pointer"
              >
                <CollectionIcon
                  icon={c.icon}
                  className="w-12 h-12 rounded-xl text-[22px]"
                  imgClassName="w-7 h-7"
                />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded-md bg-surface-2 border border-line text-ink-3 shrink-0">
                      #{c.formattedNumber}
                    </span>
                    <h3 className="text-[16.5px] font-semibold text-ink group-hover:text-accent transition-colors truncate">
                      {c.name}
                    </h3>
                  </div>
                  {c.description && (
                    <p className="mt-1 text-[13.5px] text-ink-2 leading-relaxed line-clamp-1">
                      {c.description}
                    </p>
                  )}
                  <p className="mt-1 text-[12px] text-ink-3">
                    {c.articles.length} {c.articles.length === 1 ? 'article' : 'articles'}
                  </p>
                </div>

                <ChevronRight className="w-5 h-5 text-ink-3 shrink-0 transition-transform group-hover:translate-x-1" />
              </button>

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
                        className="w-full text-left px-5 sm:px-6 py-2.5 text-[13px] font-medium text-accent hover:underline hover:bg-surface-2/60 transition-colors"
                      >
                        Show all {c.articles.length} articles →
                      </button>
                    </li>
                  )}
                </ul>
              )}
            </article>
          ))}
        </div>
      )}

      {/* ── VARIATION 2: 2 IN A ROW (GRID-2) ── */}
      {layout === 'grid-2' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          {collections.map((c) => (
            <article
              key={c.key}
              className="group rounded-2xl border border-line bg-surface transition-all hover:border-ink-3/35 hover:shadow-xs flex flex-col justify-between"
            >
              <button
                type="button"
                onClick={() => onOpen(c.slug)}
                className="w-full text-left p-6 flex items-start gap-4 cursor-pointer"
              >
                <CollectionIcon
                  icon={c.icon}
                  className="w-12 h-12 rounded-2xl text-[24px]"
                  imgClassName="w-7 h-7"
                />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded-md bg-surface-2 border border-line text-ink-3 shrink-0">
                        #{c.formattedNumber}
                      </span>
                      <h3 className="text-[17px] font-bold text-ink group-hover:text-accent transition-colors truncate">
                        {c.name}
                      </h3>
                    </div>
                    <ChevronRight className="w-4 h-4 text-ink-3 shrink-0 transition-transform group-hover:translate-x-0.5" />
                  </div>
                  {c.description && (
                    <p className="mt-1 text-[13.5px] text-ink-2 leading-relaxed line-clamp-2">
                      {c.description}
                    </p>
                  )}
                  <span className="inline-block mt-2 text-[11.5px] font-medium px-2 py-0.5 rounded-md bg-surface-2 border border-line text-ink-3">
                    {c.articles.length} {c.articles.length === 1 ? 'article' : 'articles'}
                  </span>
                </div>
              </button>

              {c.articles.length > 0 && (
                <ul className="border-t border-line/70 divide-y divide-line/60 mt-auto">
                  {c.articles.slice(0, 3).map((a) => (
                    <li key={a.id}>
                      <a
                        href={href(a)}
                        onClick={(e) => {
                          e.preventDefault();
                          onSelect(a);
                        }}
                        className="flex items-center gap-2.5 px-6 py-2.5 text-[13.5px] text-ink-2 hover:text-ink hover:bg-surface-2/60 transition-colors"
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
                        className="w-full text-left px-6 py-2 text-[12.5px] font-medium text-accent hover:underline transition-colors"
                      >
                        Show all {c.articles.length} articles →
                      </button>
                    </li>
                  )}
                </ul>
              )}
            </article>
          ))}
        </div>
      )}

      {/* ── VARIATION 3: 3 IN A ROW (GRID-3) ── */}
      {layout === 'grid-3' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map((c) => (
            <article
              key={c.key}
              className="group rounded-2xl border border-line bg-surface transition-all hover:border-ink-3/35 hover:shadow-xs flex flex-col justify-between"
            >
              <button
                type="button"
                onClick={() => onOpen(c.slug)}
                className="w-full text-left p-5 flex flex-col gap-3 cursor-pointer"
              >
                <div className="flex items-center justify-between w-full">
                  <CollectionIcon
                    icon={c.icon}
                    className="w-11 h-11 rounded-xl text-[20px]"
                    imgClassName="w-6 h-6"
                  />
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded-md bg-surface-2 border border-line text-ink-3">
                      #{c.formattedNumber}
                    </span>
                    <ChevronRight className="w-4 h-4 text-ink-3 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>

                <div>
                  <h3 className="text-[16px] font-bold text-ink group-hover:text-accent transition-colors truncate">
                    {c.name}
                  </h3>
                  {c.description && (
                    <p className="mt-1 text-[13px] text-ink-2 leading-relaxed line-clamp-2">
                      {c.description}
                    </p>
                  )}
                  <p className="mt-2 text-[11.5px] text-ink-3 font-medium">
                    {c.articles.length} {c.articles.length === 1 ? 'article' : 'articles'}
                  </p>
                </div>
              </button>

              {c.articles.length > 0 && (
                <ul className="border-t border-line/70 divide-y divide-line/60 mt-auto">
                  {c.articles.slice(0, 2).map((a) => (
                    <li key={a.id}>
                      <a
                        href={href(a)}
                        onClick={(e) => {
                          e.preventDefault();
                          onSelect(a);
                        }}
                        className="flex items-center gap-2 px-5 py-2 text-[12.5px] text-ink-2 hover:text-ink hover:bg-surface-2/60 transition-colors"
                      >
                        <FileText className="w-3 h-3 text-ink-3 shrink-0" />
                        <span className="truncate">{a.title}</span>
                      </a>
                    </li>
                  ))}
                  {c.articles.length > 2 && (
                    <li>
                      <button
                        type="button"
                        onClick={() => onOpen(c.slug)}
                        className="w-full text-left px-5 py-1.5 text-[12px] font-medium text-accent hover:underline transition-colors"
                      >
                        +{c.articles.length - 2} more →
                      </button>
                    </li>
                  )}
                </ul>
              )}
            </article>
          ))}
        </div>
      )}

      {/* ── VARIATION 4: 4 IN A ROW (GRID-4) ── */}
      {layout === 'grid-4' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {collections.map((c) => (
            <article
              key={c.key}
              onClick={() => onOpen(c.slug)}
              className="group rounded-xl border border-line bg-surface p-4 transition-all hover:border-ink-3/40 hover:shadow-xs cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <CollectionIcon
                    icon={c.icon}
                    className="w-10 h-10 rounded-lg text-[18px]"
                    imgClassName="w-5 h-5"
                  />
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-surface-2 border border-line text-ink-3">
                      #{c.formattedNumber}
                    </span>
                    <ChevronRight className="w-4 h-4 text-ink-3 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>

                <h3 className="text-[15px] font-bold text-ink group-hover:text-accent transition-colors line-clamp-1">
                  {c.name}
                </h3>
                {c.description && (
                  <p className="mt-1 text-[12px] text-ink-3 leading-snug line-clamp-2">
                    {c.description}
                  </p>
                )}
              </div>

              <div className="mt-3 pt-2.5 border-t border-line/60 flex items-center justify-between text-[11.5px] font-medium text-ink-3">
                <span>{c.articles.length} {c.articles.length === 1 ? 'article' : 'articles'}</span>
                <span className="text-accent opacity-0 group-hover:opacity-100 transition-opacity">View →</span>
              </div>
            </article>
          ))}
        </div>
      )}
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
    <div className="space-y-6 animate-in fade-in">
      {/* Breadcrumbs Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[13px] text-ink-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 font-medium text-accent hover:underline cursor-pointer group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
          <span>All collections</span>
        </button>
        <span className="text-ink-3/60">/</span>
        <span className="text-ink font-semibold truncate">{collection.name}</span>
      </nav>

      {/* AquaFunded-style Collection Hero Card */}
      <div className="rounded-2xl border border-line bg-surface p-6 sm:p-7 flex flex-col sm:flex-row items-start sm:items-center gap-5 shadow-2xs">
        <CollectionIcon
          icon={collection.icon}
          className="w-16 h-16 rounded-2xl text-[32px] shrink-0"
          imgClassName="w-9 h-9"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded-md bg-surface-2 border border-line text-ink-3">
              #{collection.formattedNumber}
            </span>
            <span className="text-[12px] font-medium text-ink-3">
              {collection.articles.length} {collection.articles.length === 1 ? 'article' : 'articles'}
            </span>
          </div>
          <h1 className="text-[22px] sm:text-[26px] font-bold text-ink tracking-tight">
            {collection.name}
          </h1>
          {collection.description && (
            <p className="mt-1.5 text-[14px] text-ink-2 leading-relaxed max-w-2xl">
              {collection.description}
            </p>
          )}
        </div>
      </div>

      {/* Articles inside collection */}
      <ul className="rounded-2xl border border-line bg-surface divide-y divide-line/70 overflow-hidden shadow-2xs">
        {collection.articles.map((a) => (
          <li key={a.id}>
            <a
              href={href(a)}
              onClick={(e) => {
                e.preventDefault();
                onSelect(a);
              }}
              className="group flex items-center justify-between gap-4 p-4 sm:p-5 hover:bg-accent-soft/20 transition-all"
            >
              <div className="min-w-0 flex-1">
                <h3 className="text-[15px] sm:text-[16px] font-semibold text-ink group-hover:text-accent transition-colors">
                  {a.title}
                </h3>
                {a.summary && (
                  <p className="mt-1 text-[13px] text-ink-3 line-clamp-2 leading-relaxed">
                    {a.summary}
                  </p>
                )}
                <div className="mt-2 flex items-center gap-3 text-[11.5px] text-ink-3">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3 h-3 opacity-70" />
                    Updated {formatDate(a.updated_at || a.created_at)}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-ink-3 shrink-0 group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
            </a>
          </li>
        ))}

        {collection.articles.length === 0 && (
          <li className="p-12 text-center text-ink-3 text-[13.5px]">
            No published articles in this collection yet.
          </li>
        )}
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
