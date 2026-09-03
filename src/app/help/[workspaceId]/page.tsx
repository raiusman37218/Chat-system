'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Search,
  BookOpen,
  ArrowRight,
  ExternalLink,
  MessageCircle,
  HelpCircle,
  FileText,
  ChevronRight,
  Layers,
  Sparkles,
  X,
} from 'lucide-react';
import { Article, HelpSection, Workspace } from '@/types/database';
import { createClient } from '@/lib/supabase/client';

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

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (!workspaceId) return;

    async function loadData() {
      try {
        setLoading(true);
        // Fetch workspace
        const { data: ws } = await supabase
          .from('workspaces')
          .select('*')
          .eq('id', workspaceId)
          .maybeSingle();

        if (ws) setWorkspace(ws as Workspace);

        // Fetch sections
        const { data: secList } = await supabase
          .from('help_sections')
          .select('*')
          .eq('workspace_id', workspaceId)
          .order('order_index', { ascending: true })
          .order('created_at', { ascending: true });

        // Fetch published articles
        const { data: artList } = await supabase
          .from('articles')
          .select('*, author:agents(id, name, avatar_url), section:help_sections(id, name, icon)')
          .eq('workspace_id', workspaceId)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-3 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-[13px] text-ink-3">Loading Help Center...</p>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-6 text-center space-y-4">
        <HelpCircle className="w-12 h-12 text-ink-3 mx-auto" />
        <h1 className="text-[22px] font-bold text-ink">Help Center Not Found</h1>
        <p className="text-[14px] text-ink-3 max-w-md">
          The requested workspace does not exist or has not published its help documentation yet.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col">
      {/* Top Brand Banner & Navigation */}
      <header className="border-b border-line/80 bg-surface sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {workspace.logo_url ? (
              <img
                src={workspace.logo_url}
                alt={workspace.name}
                className="w-8 h-8 rounded-lg object-contain bg-surface-2 p-1 border border-line"
              />
            ) : (
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-[14px] shadow-xs"
                style={{ backgroundColor: brandColor }}
              >
                {workspace.name.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <span className="text-[15px] font-bold text-ink truncate block">
                {workspace.name}
              </span>
              <span className="text-[11px] font-medium text-ink-3 uppercase tracking-wider">
                Help Center
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {workspace.website_url && (
              <a
                href={workspace.website_url}
                target="_blank"
                rel="noreferrer"
                className="text-[12.5px] font-medium text-ink-2 hover:text-ink flex items-center gap-1.5 transition-colors hidden sm:flex"
              >
                <span>Visit Main Site</span>
                <ExternalLink className="w-3.5 h-3.5 text-ink-3" />
              </a>
            )}

            <button
              onClick={handleOpenChat}
              className="h-8.5 px-3.5 rounded-lg text-white text-[12.5px] font-semibold flex items-center gap-1.5 transition-all shadow-sm hover:opacity-90"
              style={{ backgroundColor: brandColor }}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Ask Support</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Search Section */}
      <section
        className="py-16 px-6 text-center relative overflow-hidden"
        style={{
          background: `radial-gradient(ellipse 80% 50% at 50% -20%, ${brandColor}25, transparent 70%)`,
        }}
      >
        <div className="max-w-3xl mx-auto space-y-4">
          <h1 className="text-[32px] sm:text-[38px] font-extrabold text-ink tracking-tight">
            Advice and answers from the {workspace.name} Team
          </h1>
          <p className="text-[15px] text-ink-2 max-w-xl mx-auto">
            Search our guides, troubleshooting steps, and documentation for instant answers.
          </p>

          {/* Search Box */}
          <div className="pt-2 max-w-2xl mx-auto">
            <div className="relative shadow-lg rounded-2xl">
              <Search className="w-5 h-5 text-ink-3 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for articles, features, questions..."
                className="w-full h-13 pl-12 pr-12 rounded-2xl border border-line bg-surface text-[15px] text-ink placeholder:text-ink-3 focus:outline-none focus:ring-2 shadow-xs transition-all"
                style={{
                  caretColor: brandColor,
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center justify-center gap-4 mt-3 text-[12px] text-ink-3">
              <span>{articles.length} published articles</span>
              <span>•</span>
              <span>{sections.length} collections</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-6 py-10 flex-1 w-full space-y-10">
        {/* If user is searching, show live search results */}
        {searchQuery.trim() ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[18px] font-bold text-ink">
                Search Results for &quot;{searchQuery}&quot;
              </h2>
              <span className="text-[13px] text-ink-3">{searchResults.length} results</span>
            </div>

            {searchResults.length === 0 ? (
              <div className="p-12 text-center rounded-2xl border border-dashed border-line bg-surface-2/40 space-y-3">
                <p className="text-[14px] text-ink-2 font-medium">
                  No articles matched your search query.
                </p>
                <p className="text-[12.5px] text-ink-3">
                  Try broader keywords or talk to our live support team directly.
                </p>
                <button
                  onClick={handleOpenChat}
                  className="h-9 px-4 rounded-lg text-white text-[12.5px] font-semibold inline-flex items-center gap-2 mt-2"
                  style={{ backgroundColor: brandColor }}
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Start Live Conversation</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {searchResults.map((article) => (
                  <div
                    key={article.id}
                    onClick={() => router.push(`/help/${workspaceId}/${article.id}`)}
                    className="p-5 rounded-2xl border border-line bg-surface hover:border-ink-3/40 hover:shadow-md transition-all cursor-pointer group space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      {article.section && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-surface-2 text-ink-2 border border-line/60">
                          {article.section.icon} {article.section.name}
                        </span>
                      )}
                      <span className="text-[11px] text-ink-3">
                        {new Date(article.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="text-[16px] font-bold text-ink group-hover:text-accent transition-colors">
                      {article.title}
                    </h3>

                    {article.summary && (
                      <p className="text-[13px] text-ink-2 line-clamp-2 leading-relaxed">
                        {article.summary}
                      </p>
                    )}

                    <div className="pt-2 flex items-center gap-1 text-[12px] font-semibold text-accent group-hover:translate-x-1 transition-transform">
                      <span>Read article</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Default View: Collections & Sections Grid */
          <div className="space-y-10">
            {sections.length === 0 && articles.length === 0 ? (
              <div className="p-16 text-center border border-dashed border-line rounded-2xl space-y-2">
                <BookOpen className="w-10 h-10 text-ink-3 mx-auto" />
                <h3 className="text-[16px] font-semibold text-ink">Articles are being prepared</h3>
                <p className="text-[13px] text-ink-3">
                  This workspace has not published public articles yet. Check back shortly!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sections.map((section) => {
                  const sectionArticles = articlesBySection[section.id] || [];

                  return (
                    <div
                      key={section.id}
                      className="p-6 rounded-2xl border border-line bg-surface hover:border-ink-3/40 hover:shadow-lg transition-all flex flex-col justify-between group"
                    >
                      <div className="space-y-3">
                        <div className="w-12 h-12 rounded-xl bg-surface-2 flex items-center justify-center text-[26px] border border-line/80 group-hover:scale-105 transition-transform">
                          {section.icon || '📚'}
                        </div>

                        <div>
                          <h3 className="text-[18px] font-bold text-ink">{section.name}</h3>
                          {section.description && (
                            <p className="text-[13px] text-ink-2 mt-1 leading-relaxed">
                              {section.description}
                            </p>
                          )}
                        </div>

                        {/* Article Previews in this section */}
                        <div className="pt-2 border-t border-line/60 space-y-2">
                          {sectionArticles.slice(0, 4).map((art) => (
                            <div
                              key={art.id}
                              onClick={() => router.push(`/help/${workspaceId}/${art.id}`)}
                              className="text-[13px] text-ink-2 hover:text-accent font-medium flex items-center justify-between cursor-pointer py-1 group/art"
                            >
                              <span className="truncate group-hover/art:translate-x-0.5 transition-transform">
                                {art.title}
                              </span>
                              <ChevronRight className="w-3.5 h-3.5 text-ink-3 group-hover/art:text-accent shrink-0" />
                            </div>
                          ))}

                          {sectionArticles.length === 0 && (
                            <p className="text-[12px] text-ink-3 italic">No articles published yet.</p>
                          )}
                        </div>
                      </div>

                      <div className="pt-4 mt-2 border-t border-line/40 flex items-center justify-between text-[12px] text-ink-3">
                        <span>{sectionArticles.length} articles</span>
                        <span className="font-semibold text-accent group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                          <span>Browse all</span>
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Bottom Support Callout */}
        <section className="mt-12 p-8 rounded-3xl border border-line bg-surface-2/60 text-center space-y-3">
          <h2 className="text-[20px] font-bold text-ink">Still need assistance?</h2>
          <p className="text-[13.5px] text-ink-2 max-w-lg mx-auto">
            Can&apos;t find what you are looking for? Our friendly team is ready to answer questions in real time.
          </p>
          <div className="pt-2">
            <button
              onClick={handleOpenChat}
              className="h-10 px-5 rounded-xl text-white text-[13px] font-semibold inline-flex items-center gap-2 transition-all shadow-sm hover:opacity-90"
              style={{ backgroundColor: brandColor }}
            >
              <MessageCircle className="w-4 h-4" />
              <span>Chat with Support</span>
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-line/80 py-6 px-6 text-center text-[12px] text-ink-3 bg-surface">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            © {new Date().getFullYear()} {workspace.name}. Powered by{' '}
            <strong className="text-ink">Chatify</strong>.
          </span>
          <span className="text-[11px]">Intercom-Grade Knowledge Base</span>
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
