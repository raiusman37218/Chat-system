'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Search,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  ExternalLink,
  MessageCircle,
  HelpCircle,
  FileText,
  ChevronRight,
  ChevronDown,
  Globe,
  Sparkles,
  X,
} from 'lucide-react';
import { Article, HelpSection, Workspace } from '@/types/database';
import { createClient } from '@/lib/supabase/client';
import { getWorkspaceHelpCenterUrl, isPlatformHost } from '@/lib/domain';

// Premium SVG Modern Folder Icon matching reference screenshot
function ModernFolderIcon({ className = 'w-11 h-11 sm:w-13 sm:h-13' }: { className?: string }) {
  return (
    <div className="shrink-0 flex items-center justify-center select-none">
      <svg
        viewBox="0 0 54 46"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        {/* Back tab and body */}
        <path
          d="M4 11C4 8.79086 5.79086 7 8 7H20.2C21.36 7 22.46 7.5 23.23 8.36L26.77 12.34C27.54 13.2 28.64 13.7 29.8 13.7H46C48.2091 13.7 50 15.4909 50 17.7V39C50 41.2091 48.2091 43 46 43H8C5.79086 43 4 41.2091 4 39V11Z"
          fill="#3B82F6"
          fillOpacity="0.08"
          stroke="#2563EB"
          strokeWidth="3.2"
          strokeLinejoin="round"
        />
        {/* Front flap crease */}
        <path
          d="M4 21.5H50"
          stroke="#2563EB"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
];

export default function PublicHelpCenterPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params?.workspaceId as string;

  const [loading, setLoading] = useState(true);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [sections, setSections] = useState<HelpSection[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

  // Language Dropdown
  const [selectedLang, setSelectedLang] = useState(LANGUAGES[0]);
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  const supabase = useMemo(() => createClient(), []);

  // Close language dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!workspaceId) return;

    async function loadData() {
      try {
        setLoading(true);
        // Fetch workspace by UUID, slug, or custom domain
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(workspaceId);
        const { data: ws } = isUuid
          ? await supabase.from('public_workspaces').select('*').eq('id', workspaceId).maybeSingle()
          : await supabase.from('public_workspaces').select('*').or(`slug.eq.${workspaceId},custom_domain.eq.${workspaceId}`).maybeSingle();

        if (!ws) {
          setLoading(false);
          return;
        }

        setWorkspace(ws as Workspace);
        const actualWorkspaceId = ws.id;

        // Fetch sections
        const { data: secList } = await supabase
          .from('help_sections')
          .select('*')
          .eq('workspace_id', actualWorkspaceId)
          .order('order_index', { ascending: true })
          .order('created_at', { ascending: true });

        // Fetch published articles
        const { data: artList } = await supabase
          .from('articles')
          .select('*, author:agents(id, name, avatar_url), section:help_sections(id, name, icon)')
          .eq('workspace_id', actualWorkspaceId)
          .eq('status', 'published')
          .order('created_at', { ascending: false });

        const rawArticles = (artList as Article[]) || [];
        const rawSections = (secList as HelpSection[]) || [];

        // Count per section
        const countMap: Record<string, number> = {};
        rawArticles.forEach((art) => {
          if (art.section_id) {
            countMap[art.section_id] = (countMap[art.section_id] || 0) + 1;
          }
        });

        const sectionsWithCount = rawSections.map((s) => ({
          ...s,
          article_count: countMap[s.id] || 0,
        }));

        setSections(sectionsWithCount);
        setArticles(rawArticles);
      } catch (err) {
        console.error('Failed to load help center:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [workspaceId, supabase]);

  // Real-time search filter
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return articles.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.summary?.toLowerCase().includes(q) ||
        a.content.toLowerCase().includes(q) ||
        a.category?.toLowerCase().includes(q)
    );
  }, [articles, searchQuery]);

  // Group articles by section for default view
  const articlesBySection = useMemo(() => {
    const map: Record<string, Article[]> = {};
    articles.forEach((a) => {
      const key = a.section_id || 'unassigned';
      if (!map[key]) map[key] = [];
      map[key].push(a);
    });
    return map;
  }, [articles]);

  const brandColor = workspace?.brand_color || '#2563eb';

  const handleOpenChat = () => {
    if (typeof window !== 'undefined' && (window as any).Chatify) {
      (window as any).Chatify.open();
    }
  };

  const navigateToArticle = (art: Article) => {
    if (typeof window !== 'undefined') {
      const host = window.location.host.toLowerCase().split(':')[0];
      const isPlatform = isPlatformHost(host);

      if (!isPlatform) {
        router.push(`/${art.slug || art.id}`);
        return;
      }
    }
    router.push(`/help/${workspace?.slug || workspaceId}/${art.slug || art.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-[13px] text-zinc-400">Loading Help Center...</p>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="min-h-screen bg-[#09090b] text-white flex flex-col items-center justify-center p-6 text-center space-y-4">
        <HelpCircle className="w-12 h-12 text-zinc-500 mx-auto" />
        <h1 className="text-[22px] font-bold text-white">Help Center Not Found</h1>
        <p className="text-[14px] text-zinc-400 max-w-md">
          The requested workspace does not exist or has not published its help documentation yet.
        </p>
      </div>
    );
  }

  const helpTitle = workspace.help_center_title || workspace.name;
  const helpLogo = workspace.help_center_logo_url || workspace.logo_url;
  const headerLinks = Array.isArray(workspace.help_center_header_links)
    ? workspace.help_center_header_links
    : [];

  const websiteUrl = workspace.website_url || 'https://www.range4ex.com';
  const portalUrl = workspace.website_url ? `${workspace.website_url}/en/auth/signin` : '/auth/signin';

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      <head>
        <title>{`${helpTitle} Help Center`}</title>
        <link rel="canonical" href={getWorkspaceHelpCenterUrl(workspace)} />
        <meta property="og:title" content={`${helpTitle} Help Center & Documentation`} />
        <meta property="og:url" content={getWorkspaceHelpCenterUrl(workspace)} />
      </head>

      {/* ─────────────────────────────────────────────────────────────
          1. JET-BLACK TOP NAVIGATION BAR (Matching Reference Image)
          ───────────────────────────────────────────────────────────── */}
      <header className="bg-black border-b border-zinc-800/80 sticky top-0 z-40 transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-17 flex items-center justify-between gap-4">
          {/* Left Brand / Logo */}
          <div
            onClick={() => setActiveSectionId(null)}
            className="flex items-center gap-3 cursor-pointer group"
          >
            {helpLogo ? (
              <img
                src={helpLogo}
                alt={helpTitle}
                className="w-9 h-9 object-contain group-hover:scale-105 transition-transform"
              />
            ) : (
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-[15px] shadow-sm tracking-wider"
                style={{ backgroundColor: brandColor }}
              >
                {helpTitle.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-[15px] sm:text-[16px] font-bold text-white tracking-wide uppercase group-hover:text-blue-400 transition-colors">
                {helpTitle}
              </span>
            </div>
          </div>

          {/* Right Navigation & Language Selector */}
          <div className="flex items-center gap-3 sm:gap-6">
            {/* Website Link */}
            <a
              href={websiteUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[13px] sm:text-[14px] font-medium text-zinc-300 hover:text-white transition-colors"
            >
              Website
            </a>

            {/* User Portal Link */}
            <a
              href={portalUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[13px] sm:text-[14px] font-medium text-zinc-300 hover:text-white transition-colors"
            >
              User Portal
            </a>

            {/* Language Selector Dropdown */}
            <div className="relative" ref={langRef}>
              <button
                type="button"
                onClick={() => setLangOpen(!langOpen)}
                className="px-3 py-1.5 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 text-white text-[13px] font-medium flex items-center gap-1.5 transition-all shadow-xs"
              >
                <span>{selectedLang.flag}</span>
                <span className="hidden sm:inline">{selectedLang.label}</span>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
              </button>

              {langOpen && (
                <div className="absolute right-0 mt-2 w-36 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => {
                        setSelectedLang(lang);
                        setLangOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-[13px] flex items-center gap-2 hover:bg-zinc-800 transition-colors ${
                        selectedLang.code === lang.code
                          ? 'text-blue-400 font-semibold bg-zinc-800/40'
                          : 'text-zinc-300'
                      }`}
                    >
                      <span>{lang.flag}</span>
                      <span>{lang.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          2. SLEEK BLACK HERO SECTION (Matching Reference Image)
          ───────────────────────────────────────────────────────────── */}
      <section className="bg-black pt-12 pb-16 px-4 sm:px-6 relative overflow-hidden border-b border-zinc-900">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Big Bold Clean Title */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white">
            Welcome to {helpTitle} Help Center
          </h1>

          {/* Sleek Dark Search Bar */}
          <div className="relative w-full">
            <div className="relative flex items-center bg-[#18181c] border border-zinc-700/70 rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-3.5 shadow-xl focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for articles..."
                className="w-full bg-transparent text-[15px] sm:text-[16.5px] text-white placeholder-zinc-400 focus:outline-none pr-10"
              />

              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 p-1 text-zinc-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <Search className="w-5 h-5 text-zinc-400 absolute right-4 sm:right-5 pointer-events-none" />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. MAIN CONTENT: STACKED COLLECTION CARDS (Reference Layout)
          ───────────────────────────────────────────────────────────── */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 flex-1 w-full space-y-8">
        {/* CASE A: USER IS SEARCHING */}
        {searchQuery.trim() ? (
          <div className="space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="text-[17px] sm:text-[19px] font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <span>Search Results for</span>
                <span className="text-blue-600 dark:text-blue-400 font-semibold">&quot;{searchQuery}&quot;</span>
              </h2>
              <span className="text-[13px] text-zinc-500 font-medium">
                {searchResults.length} {searchResults.length === 1 ? 'article' : 'articles'} found
              </span>
            </div>

            {searchResults.length === 0 ? (
              <div className="p-12 text-center rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 bg-white dark:bg-[#121216] space-y-3">
                <Search className="w-8 h-8 text-zinc-400 mx-auto" />
                <p className="text-[15px] font-semibold text-zinc-800 dark:text-zinc-200">
                  No articles matched your search.
                </p>
                <p className="text-[13px] text-zinc-500 max-w-md mx-auto">
                  Try searching with different keywords, or contact our support team directly.
                </p>
                <button
                  onClick={handleOpenChat}
                  className="h-9 px-4 rounded-xl text-white text-[13px] font-semibold inline-flex items-center gap-2 mt-2 bg-blue-600 hover:bg-blue-700 transition-colors shadow-xs"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Ask Support</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {searchResults.map((article) => (
                  <div
                    key={article.id}
                    onClick={() => navigateToArticle(article)}
                    className="group p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-[#121216] hover:border-blue-500/50 hover:shadow-md transition-all cursor-pointer flex items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-4 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/40 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {article.section && (
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                              {article.section.name}
                            </span>
                          )}
                        </div>
                        <h3 className="text-[16px] sm:text-[17px] font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mt-1">
                          {article.title}
                        </h3>
                        {article.summary && (
                          <p className="text-[13px] text-zinc-600 dark:text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                            {article.summary}
                          </p>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : activeSectionId ? (
          /* CASE B: SINGLE COLLECTION VIEW (Articles inside clicked collection) */
          <div className="space-y-6 animate-in fade-in">
            <button
              type="button"
              onClick={() => setActiveSectionId(null)}
              className="inline-flex items-center gap-2 text-[13.5px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span>All Collections</span>
            </button>

            {(() => {
              const sec = sections.find((s) => s.id === activeSectionId);
              const secArticles = articlesBySection[activeSectionId] || [];

              return (
                <div className="space-y-5">
                  {/* Collection Banner */}
                  <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-[#121216] flex items-start gap-4 sm:gap-5 shadow-xs">
                    <ModernFolderIcon className="w-13 h-13" />
                    <div>
                      <h2 className="text-[20px] sm:text-[23px] font-bold text-zinc-900 dark:text-white">
                        {sec?.name || 'Collection'}
                      </h2>
                      {sec?.description && (
                        <p className="text-[14px] text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed">
                          {sec.description}
                        </p>
                      )}
                      <div className="text-[12px] font-medium text-zinc-400 dark:text-zinc-500 mt-2">
                        {secArticles.length} {secArticles.length === 1 ? 'article' : 'articles'} in this collection
                      </div>
                    </div>
                  </div>

                  {/* Articles List */}
                  <div className="space-y-3">
                    {secArticles.map((art) => (
                      <div
                        key={art.id}
                        onClick={() => navigateToArticle(art)}
                        className="group p-5 rounded-xl sm:rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-[#121216] hover:border-blue-500/50 hover:shadow-sm transition-all cursor-pointer flex items-center justify-between gap-4"
                      >
                        <div className="min-w-0 flex-1">
                          <h4 className="text-[15.5px] sm:text-[16.5px] font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {art.title}
                          </h4>
                          {art.summary && (
                            <p className="text-[13px] text-zinc-600 dark:text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                              {art.summary}
                            </p>
                          )}
                        </div>
                        <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all shrink-0 ml-2" />
                      </div>
                    ))}

                    {secArticles.length === 0 && (
                      <div className="p-12 text-center rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 bg-white dark:bg-[#121216] text-zinc-400 text-[13.5px]">
                        No articles published in this collection yet.
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        ) : (
          /* CASE C: DEFAULT VIEW — STACKED COLLECTION CARDS (Exact Reference Match) */
          <div className="space-y-4">
            {sections.length === 0 && articles.length === 0 ? (
              <div className="p-16 text-center border border-dashed border-zinc-300 dark:border-zinc-800 rounded-2xl space-y-3 bg-white dark:bg-[#121216]">
                <BookOpen className="w-10 h-10 text-zinc-400 mx-auto" />
                <h3 className="text-[17px] font-bold text-zinc-900 dark:text-white">
                  Articles are being prepared
                </h3>
                <p className="text-[13px] text-zinc-500">
                  This workspace has not published public articles yet. Check back shortly!
                </p>
              </div>
            ) : (
              sections.map((section) => {
                const secArticles = articlesBySection[section.id] || [];
                const count = secArticles.length;

                return (
                  <div
                    key={section.id}
                    onClick={() => setActiveSectionId(section.id)}
                    className="group relative p-5 sm:p-6 rounded-2xl border border-zinc-200/90 dark:border-zinc-800/80 bg-white dark:bg-[#121216] hover:border-blue-500/50 hover:shadow-md transition-all duration-200 cursor-pointer flex items-center justify-between gap-5"
                  >
                    {/* Left: Modern Blue Folder Icon + Title & Details */}
                    <div className="flex items-start sm:items-center gap-4 sm:gap-5 min-w-0 flex-1">
                      <ModernFolderIcon className="w-11 h-11 sm:w-13 sm:h-13" />

                      <div className="min-w-0 flex-1">
                        <h3 className="text-[17px] sm:text-[19px] font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug">
                          {section.name}
                        </h3>

                        {section.description && (
                          <p className="text-[13.5px] text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed line-clamp-2">
                            {section.description}
                          </p>
                        )}

                        <div className="text-[12px] font-medium text-zinc-400 dark:text-zinc-500 mt-1.5 flex items-center gap-1.5">
                          <span>
                            {count} {count === 1 ? 'article' : 'articles'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right Chevron */}
                    <div className="hidden sm:flex items-center text-zinc-300 dark:text-zinc-600 group-hover:text-blue-500 group-hover:translate-x-1 transition-all shrink-0">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            4. BOTTOM SUPPORT CARD
            ───────────────────────────────────────────────────────────── */}
        <section className="mt-12 p-7 sm:p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-[#121216] text-center space-y-3 shadow-xs">
          <h2 className="text-[19px] sm:text-[20px] font-bold text-zinc-900 dark:text-white">
            Still need assistance?
          </h2>
          <p className="text-[13.5px] text-zinc-600 dark:text-zinc-400 max-w-lg mx-auto">
            Can&apos;t find what you are looking for? Our friendly team is ready to answer questions in real time.
          </p>
          <div className="pt-2">
            <button
              onClick={handleOpenChat}
              className="h-10 px-5 rounded-xl text-white text-[13px] font-semibold inline-flex items-center gap-2 transition-all shadow-sm hover:opacity-90 cursor-pointer"
              style={{ backgroundColor: brandColor }}
            >
              <MessageCircle className="w-4 h-4" />
              <span>Chat with Support</span>
            </button>
          </div>
        </section>
      </main>

      {/* ─────────────────────────────────────────────────────────────
          5. FOOTER
          ───────────────────────────────────────────────────────────── */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800/80 py-6 px-4 sm:px-6 text-center text-[12px] text-zinc-500 bg-white dark:bg-black">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            {workspace.help_center_footer_text || (
              <>
                © {new Date().getFullYear()} {helpTitle}. All rights reserved.
              </>
            )}
          </span>
          <span className="text-[11px] text-zinc-400">
            Powered by <strong className="text-zinc-600 dark:text-zinc-300">Chatify</strong>
          </span>
        </div>
      </footer>

      {/* Embed Standalone Chatify Widget on Help Center */}
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
