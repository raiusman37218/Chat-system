'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  ExternalLink,
  FolderPlus,
  Settings,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  ArrowUpDown,
  Filter,
  Layers,
  Sparkles,
  FileText,
  X,
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Link2,
  AlertCircle,
  HelpCircle,
  Smile,
  Table as TableIcon,
  CheckSquare,
  Minus,
  Strikethrough,
  AlertTriangle,
  Lightbulb,
  Globe,
  Copy,
  Maximize2,
  Minimize2,
  Columns2,
  Image as ImageIcon,
  Check,
  Lock,
  Unlock,
  RotateCcw,
  LayoutTemplate,
  Info,
  Keyboard,
  Upload,
  MoreHorizontal,
  Highlighter,
  BadgeCheck,
  ShieldAlert,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  GripVertical,
} from 'lucide-react';
import { Agent, Article, HelpSection, Workspace } from '@/types/database';
import { EmojiPickerPopover } from '@/components/dashboard/EmojiPickerPopover';
import { MarkdownArticleContent } from '@/components/dashboard/MarkdownArticleContent';
import { getWorkspaceHelpCenterUrl, cleanDomain } from '@/lib/domain';
import {
  getHelpDeskDataAction,
  createHelpSectionAction,
  updateHelpSectionAction,
  deleteHelpSectionAction,
  createArticleAction,
  updateArticleAction,
  deleteArticleAction,
  reorderArticlesAction,
  toggleArticleStatusAction,
  updateHelpTabSettingsAction,
  searchArticleBodiesAction,
  getArticleAction,
} from '@/app/actions/helpdesk';
import { Avatar } from '@/components/ui/Avatar';
import { KnowledgePanel } from '@/components/dashboard/KnowledgePanel';
import { Menu } from '@/components/ui/Menu';
import { cn } from '@/lib/utils';

interface HelpDeskDashboardProps {
  workspace: Workspace | null;
  currentAgent: Agent | null;
  onArticlesCountChange?: (count: number) => void;
}

const COMMON_EMOJIS = ['🚀', '💳', '⚙️', '📦', '🔒', '💡', '❓', '📖', '🛠️', '🎯', '📱', '🔔'];

export function SectionIconPreview({
  icon,
  className = 'w-9 h-9 rounded-xl',
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
      className={`grid place-items-center bg-surface-2 border border-line overflow-hidden shrink-0 select-none ${className}`}
    >
      {isImg ? (
        <img
          src={icon}
          alt=""
          className={`object-contain ${imgClassName}`}
        />
      ) : (
        <span className="text-[18px] leading-none">{icon?.trim() || '📚'}</span>
      )}
    </span>
  );
}

export const SECTION_ICON_GROUPS = [
  {
    name: 'Trading & Finance',
    icons: ['📈', '💳', '💵', '📊', '🪙', '📉', '🏦', '💹'],
  },
  {
    name: 'Security & Rules',
    icons: ['🛡️', '🔒', '⚖️', '🔑', '📜', '🔏', '🪪', '⚠️'],
  },
  {
    name: 'Tech & Platform',
    icons: ['🚀', '⚡', '⚙️', '💡', '📱', '🌐', '💻', '🔧'],
  },
  {
    name: 'General & Support',
    icons: ['📚', '📄', '📁', '💬', '❓', '🎯', '👤', '🎧'],
  },
];

export function HelpDeskDashboard({
  workspace,
  currentAgent,
  onArticlesCountChange,
}: HelpDeskDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState<HelpSection[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);


  // Filter and search state
  const [selectedSectionId, setSelectedSectionId] = useState<string | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'published' | 'draft'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [bodyMatchIds, setBodyMatchIds] = useState<Set<string>>(new Set());

  // Modals
  const [isArticleModalOpen, setIsArticleModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<HelpSection | null>(null);
  const [sectionToRename, setSectionToRename] = useState<HelpSection | null>(null);
  const [sectionToDelete, setSectionToDelete] = useState<HelpSection | null>(null);
  const [isDeletingSection, setIsDeletingSection] = useState(false);
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
  const [isTabSettingsModalOpen, setIsTabSettingsModalOpen] = useState(false);
  const [workspaceState, setWorkspaceState] = useState<Workspace | null>(workspace);

  useEffect(() => {
    setWorkspaceState(workspace);
  }, [workspace]);

  // Status feedback toast
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  /**
   * Public articles, or the internal side of the same job.
   *
   * Team knowledge and unanswered questions belong beside the articles rather
   * than in Settings: they are the same work — deciding what the help centre
   * says — just the parts that are private or not written yet.
   */
  const [view, setView] = useState<'articles' | 'internal'>('articles');
  /** Bumped by the header button to ask the knowledge panel to open its editor. */
  const [newNoteRequest, setNewNoteRequest] = useState(0);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadHelpDeskData = async () => {
    if (!workspace?.id) return;
    try {
      setLoading(true);
      const data = await getHelpDeskDataAction(workspace.id);
      setSections(data.sections);
      setArticles(data.articles);
    } catch (err: any) {
      showToast(err.message || 'Failed to load Help Desk data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHelpDeskData();
  }, [workspace?.id]);

  // Body search runs on the server, debounced. Titles and summaries filter
  // instantly from data already in memory, so typing stays responsive and the
  // deeper match arrives a moment later.
  useEffect(() => {
    const q = searchQuery.trim();
    if (!workspace?.id || q.length < 2) {
      setBodyMatchIds(new Set());
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const ids = await searchArticleBodiesAction(workspace.id, q);
        if (!cancelled) setBodyMatchIds(new Set(ids));
      } catch {
        // A failed deep search just means fewer results, not a broken page.
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery, workspace?.id]);

  // Derived from the list itself, so publishing or deleting an article updates
  // the tiles immediately and cannot drift from what is on screen.
  const metrics = useMemo(() => {
    const totalHelpful = articles.reduce((n, a) => n + (a.helpful_count || 0), 0);
    const totalNotHelpful = articles.reduce(
      (n, a) => n + (a.not_helpful_count || 0),
      0
    );
    const votes = totalHelpful + totalNotHelpful;

    return {
      totalArticles: articles.length,
      publishedCount: articles.filter((a) => a.status === 'published').length,
      draftCount: articles.filter((a) => a.status === 'draft').length,
      totalViews: articles.reduce((n, a) => n + (a.views_count || 0), 0),
      totalHelpful,
      totalNotHelpful,
      // null, not 100 — a help centre with no votes has not earned a score.
      helpfulRate: votes > 0 ? Math.round((totalHelpful / votes) * 100) : null,
    };
  }, [articles]);

  useEffect(() => {
    onArticlesCountChange?.(metrics.totalArticles);
  }, [metrics.totalArticles, onArticlesCountChange]);

  // Section pills count what the list currently holds, for the same reason.
  const sectionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const a of articles) {
      if (a.section_id) counts[a.section_id] = (counts[a.section_id] || 0) + 1;
    }
    return counts;
  }, [articles]);

  const activeSection = useMemo(() => {
    if (selectedSectionId === 'all') return null;
    return sections.find((s) => s.id === selectedSectionId) || null;
  }, [sections, selectedSectionId]);

  const handleStartRenameSection = (sec: HelpSection) => {
    setSectionToRename(sec);
  };

  const handleStartDeleteSection = (sec: HelpSection) => {
    setSectionToDelete(sec);
  };

  const handleConfirmDeleteSection = async () => {
    if (!workspace?.id || !sectionToDelete) return;
    setIsDeletingSection(true);
    try {
      await deleteHelpSectionAction(workspace.id, sectionToDelete.id);

      setSections((prev) => prev.filter((s) => s.id !== sectionToDelete.id));
      setArticles((prev) =>
        prev.map((art) =>
          art.section_id === sectionToDelete.id
            ? { ...art, section_id: null, section: null }
            : art
        )
      );

      if (selectedSectionId === sectionToDelete.id) {
        setSelectedSectionId('all');
      }

      showToast(`Section "${sectionToDelete.name}" deleted successfully!`);
      setSectionToDelete(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete section', 'error');
    } finally {
      setIsDeletingSection(false);
    }
  };

  const handleSectionUpdated = (updatedSec: HelpSection) => {
    setSections((prev) =>
      prev.map((s) => (s.id === updatedSec.id ? updatedSec : s))
    );
    setArticles((prev) =>
      prev.map((art) =>
        art.section_id === updatedSec.id
          ? {
              ...art,
              category: updatedSec.name,
              section: updatedSec,
            }
          : art
      )
    );
    showToast(`Section "${updatedSec.name}" updated successfully!`);
    setSectionToRename(null);
  };

  // Articles in the currently selected section, sorted by order_index asc, created_at asc
  const activeSectionArticles = useMemo(() => {
    if (!activeSection) return [];
    return articles
      .filter((a) => a.section_id === activeSection.id)
      .sort((a, b) => {
        const ao = a.order_index ?? 0;
        const bo = b.order_index ?? 0;
        if (ao !== bo) return ao - bo;
        return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
      });
  }, [articles, activeSection]);

  const handleQuickMoveArticle = async (article: Article, direction: 'up' | 'down') => {
    if (!workspace?.id || !activeSection) return;
    const list = [...activeSectionArticles];
    const idx = list.findIndex((a) => a.id === article.id);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;

    // Swap adjacent items
    const temp = list[idx];
    list[idx] = list[targetIdx];
    list[targetIdx] = temp;

    // Assign sequential 1..N order_index
    const updates = list.map((item, index) => ({
      id: item.id,
      order_index: index + 1,
    }));

    // Optimistically update local articles state
    setArticles((prev) =>
      prev.map((art) => {
        const up = updates.find((u) => u.id === art.id);
        return up ? { ...art, order_index: up.order_index } : art;
      })
    );

    try {
      await reorderArticlesAction(workspace.id, updates);
      showToast(`Article moved ${direction}!`);
    } catch (err: any) {
      showToast(err.message || 'Failed to reorder article', 'error');
      loadHelpDeskData();
    }
  };

  // Filtered Articles
  const filteredArticles = useMemo(() => {
    const list = articles.filter((art) => {
      if (selectedSectionId !== 'all' && art.section_id !== selectedSectionId) {
        return false;
      }
      if (selectedStatus !== 'all' && art.status !== selectedStatus) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          art.title.toLowerCase().includes(q) ||
          art.summary?.toLowerCase().includes(q) ||
          art.category?.toLowerCase().includes(q) ||
          bodyMatchIds.has(art.id)
        );
      }
      return true;
    });

    if (selectedSectionId !== 'all') {
      // Sort in the exact sequence as it appears on the public Help Center
      list.sort((a, b) => {
        const ao = a.order_index ?? 0;
        const bo = b.order_index ?? 0;
        if (ao !== bo) return ao - bo;
        return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
      });
    }

    return list;
  }, [articles, selectedSectionId, selectedStatus, searchQuery, bodyMatchIds]);

  const handleToggleStatus = async (article: Article) => {
    if (!workspace?.id) return;
    const nextStatus = article.status === 'published' ? 'draft' : 'published';
    try {
      const res = await toggleArticleStatusAction(workspace.id, article.id, nextStatus);
      if (res.article) {
        setArticles((prev) => prev.map((a) => (a.id === article.id ? res.article : a)));
        showToast(
          nextStatus === 'published'
            ? 'Article is live on your help centre.'
            : 'Article moved back to drafts.'
        );
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update article status', 'error');
    }
  };

  const handleDeleteArticle = async (articleId: string, title: string) => {
    if (!workspace?.id) return;
    if (!confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) return;

    try {
      await deleteArticleAction(workspace.id, articleId);
      setArticles((prev) => prev.filter((a) => a.id !== articleId));
      showToast(`"${title}" deleted.`);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete article', 'error');
    }
  };

  const handleOpenPublicHelpCenter = () => {
    if (!workspace) return;
    const url = getWorkspaceHelpCenterUrl(workspace);
    window.open(url, '_blank');
  };

  const handleCopyPublicHelpCenterLink = () => {
    if (!workspace) return;
    const url = getWorkspaceHelpCenterUrl(workspace);
    navigator.clipboard.writeText(url);
    showToast('Help Center link copied to clipboard!');
  };

  const handleCopyArticleLink = (art: Article) => {
    if (!workspace) return;
    const url = getWorkspaceHelpCenterUrl(workspace, art);
    navigator.clipboard.writeText(url);
    showToast(`Link for "${art.title}" copied!`);
  };

  const handleOpenArticleLive = (art: Article) => {
    if (!workspace) return;
    const url = getWorkspaceHelpCenterUrl(workspace, art);
    window.open(url, '_blank');
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-y-auto bg-surface select-none">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={cn(
            'fixed top-5 right-5 z-50 px-4 py-2.5 rounded-xl shadow-lg border text-[13px] font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-2',
            toastMessage.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
          )}
        >
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Navigation Bar */}
      <header className="px-8 py-5 border-b border-line/80 flex items-center justify-between gap-4 bg-surface sticky top-0 z-20">
        <div>
          <h1 className="text-[19px] font-semibold text-ink tracking-tight">
            Help Center
          </h1>
          <p className="text-[12.5px] text-ink-3 mt-0.5">
            {view === 'articles'
              ? 'Write once, and let customers answer their own questions.'
              : 'What your team knows but customers should not read — and what nobody has written yet.'}
          </p>
        </div>

        {/* One primary action, everything else behind the overflow.
            Five equal-weight buttons wrapped their own labels onto three lines
            at 1100px, none of them read as the main thing to do, and "Copy URL"
            was duplicated by the address bar directly below. */}
        <div className="flex items-center gap-2 shrink-0">
          <Menu
            value={'' as string}
            align="end"
            label="More Help Center actions"
            options={[
              { value: 'open', label: 'Open public help center' },
              { value: 'copy', label: 'Copy public link' },
              { value: 'sections', label: 'Manage sections' },
              {
                value: 'tab',
                label: `Widget tab: ${workspaceState?.help_center_tab_label || 'Help'}`,
              },
            ]}
            onChange={(v) => {
              if (v === 'open') handleOpenPublicHelpCenter();
              else if (v === 'copy') handleCopyPublicHelpCenterLink();
              else if (v === 'sections') {
                setEditingSection(null);
                setIsSectionModalOpen(true);
              } else if (v === 'tab') setIsTabSettingsModalOpen(true);
            }}
            trigger={() => (
              <span className="h-9 w-9 grid place-items-center rounded-lg border border-line bg-surface-2 text-ink-2 hover:text-ink hover:bg-surface transition-colors">
                <MoreHorizontal className="w-4 h-4" />
              </span>
            )}
          />

          {/* The primary action follows the view, so it is never the wrong one. */}
          <button
            onClick={() => {
              if (view === 'internal') {
                setNewNoteRequest(Date.now());
              } else {
                setEditingArticle(null);
                setIsArticleModalOpen(true);
              }
            }}
            className="h-9 px-4 rounded-lg bg-accent text-accent-ink hover:opacity-90 text-[13px] font-semibold flex items-center gap-1.5 transition-all shadow-sm whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>{view === 'internal' ? 'New note' : 'New article'}</span>
          </button>
        </div>
      </header>

      {/* Domain Status Banner */}
      {workspace && (
        <div className="px-8 py-2 bg-surface-2/80 border-b border-line/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <Globe className="w-3.5 h-3.5 text-accent shrink-0" />
            <span className="text-ink-3 shrink-0">Public URL:</span>
            <a
              href={getWorkspaceHelpCenterUrl(workspace)}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-accent hover:underline font-semibold truncate"
            >
              {getWorkspaceHelpCenterUrl(workspace)}
            </a>
            {workspace.custom_domain && (
              <span
                className={cn(
                  'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0',
                  workspace.custom_domain_status === 'verified'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : workspace.custom_domain_status === 'failed'
                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                )}
              >
                {workspace.custom_domain_status === 'verified'
                  ? 'Domain Verified'
                  : workspace.custom_domain_status === 'failed'
                  ? 'DNS Check Failed'
                  : 'DNS Pending'}
              </span>
            )}
          </div>
          <button
            onClick={handleCopyPublicHelpCenterLink}
            className="text-ink-3 hover:text-ink font-medium text-[11.5px] flex items-center gap-1 transition-colors shrink-0 ml-4"
          >
            <Copy className="w-3 h-3" />
            <span>Copy Link</span>
          </button>
        </div>
      )}

      <main className="p-8 space-y-6 max-w-7xl mx-auto w-full">
        <div className="inline-flex items-center p-0.5 rounded-lg bg-surface-2 border border-line">
          {(
            [
              ['articles', 'Published articles'],
              ['internal', 'Team knowledge & gaps'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setView(id)}
              className={cn(
                'h-7 px-3 rounded-md text-[12.5px] font-medium transition-all',
                view === id
                  ? 'bg-surface text-ink font-semibold shadow-xs'
                  : 'text-ink-3 hover:text-ink'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {view === 'internal' ? (
          <KnowledgePanel
            workspaceId={workspace?.id || ''}
            newNoteSignal={newNoteRequest}
            onCreateArticle={(title) => {
              // Straight from the question a customer actually asked into a
              // draft, so the gap closes in one step instead of being
              // copy-pasted into a new article later.
              setView('articles');
              setEditingArticle({ title } as Article);
              setIsArticleModalOpen(true);
            }}
          />
        ) : (
        <>
        {/* KPI Metrics Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-line bg-surface-2/60">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium text-ink-3 uppercase tracking-wider">Total Articles</span>
              <BookOpen className="w-4 h-4 text-accent" />
            </div>
            <div className="text-[26px] font-bold text-ink mt-2">{metrics.totalArticles}</div>
            <div className="text-[11.5px] text-ink-3 mt-1 flex items-center gap-2">
              <span className="text-emerald-500 font-medium">{metrics.publishedCount} published</span>
              <span>•</span>
              <span className="text-amber-500 font-medium">{metrics.draftCount} drafts</span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-line bg-surface-2/60">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium text-ink-3 uppercase tracking-wider">Total Views</span>
              <Eye className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-[26px] font-bold text-ink mt-2">{metrics.totalViews.toLocaleString()}</div>
            <div className="text-[11.5px] text-ink-3 mt-1">Across all published help guides</div>
          </div>

          <div className="p-4 rounded-xl border border-line bg-surface-2/60">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium text-ink-3 uppercase tracking-wider">Helpfulness Rate</span>
              <ThumbsUp className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-[26px] font-bold text-ink mt-2">
              {metrics.helpfulRate === null ? '—' : `${metrics.helpfulRate}%`}
            </div>
            <div className="text-[11.5px] text-ink-3 mt-1 flex items-center gap-2">
              {metrics.helpfulRate === null ? (
                <span>No reader votes yet</span>
              ) : (
                <>
                  <span>{metrics.totalHelpful} helpful</span>
                  <span>•</span>
                  <span>{metrics.totalNotHelpful} not helpful</span>
                </>
              )}
            </div>
          </div>

          <div className="p-4 rounded-xl border border-line bg-surface-2/60">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium text-ink-3 uppercase tracking-wider">Help Sections</span>
              <Layers className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-[26px] font-bold text-ink mt-2">{sections.length}</div>
            <div className="text-[11.5px] text-ink-3 mt-1">Organized categories &amp; topics</div>
          </div>
        </section>

        {/* Section Navigation Tabs & Pills */}
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
              <button
                onClick={() => setSelectedSectionId('all')}
                className={cn(
                  'h-8 px-3 rounded-lg text-[12.5px] font-medium transition-all whitespace-nowrap flex items-center gap-1.5',
                  selectedSectionId === 'all'
                    ? 'bg-accent text-accent-ink shadow-xs'
                    : 'bg-surface-2 text-ink-2 hover:bg-surface-3 hover:text-ink'
                )}
              >
                <span>All Sections</span>
                <span className="text-[11px] opacity-80">({articles.length})</span>
              </button>

              {sections.map((sec, idx) => {
                const isSelected = selectedSectionId === sec.id;
                return (
                  <div
                    key={sec.id}
                    className={cn(
                      'group relative inline-flex items-center h-8 rounded-lg text-[12.5px] font-medium transition-all whitespace-nowrap border',
                      isSelected
                        ? 'bg-accent text-accent-ink border-transparent shadow-xs'
                        : 'bg-surface-2 text-ink-2 hover:bg-surface-3 hover:text-ink border-transparent'
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedSectionId(sec.id)}
                      className="h-full pl-3 pr-2 flex items-center gap-1.5 cursor-pointer"
                    >
                      <span className="font-mono text-[10px] font-bold opacity-75">
                        #{String(sec.order_index && sec.order_index > 0 ? sec.order_index : idx + 1).padStart(2, '0')}
                      </span>
                      <span>{sec.icon || '📚'}</span>
                      <span className="max-w-[130px] truncate">{sec.name}</span>
                      <span className="text-[11px] opacity-75">({sectionCounts[sec.id] || 0})</span>
                    </button>

                    {/* Quick rename & delete actions on pill hover */}
                    <div className="flex items-center pr-1.5 gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartRenameSection(sec);
                        }}
                        className={cn(
                          'w-5 h-5 rounded flex items-center justify-center transition-colors cursor-pointer',
                          isSelected
                            ? 'hover:bg-white/20 text-accent-ink'
                            : 'hover:bg-surface text-ink-3 hover:text-ink'
                        )}
                        title={`Rename section "${sec.name}"`}
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartDeleteSection(sec);
                        }}
                        className={cn(
                          'w-5 h-5 rounded flex items-center justify-center transition-colors cursor-pointer',
                          isSelected
                            ? 'hover:bg-rose-500 text-accent-ink hover:text-white'
                            : 'hover:bg-rose-500/20 text-ink-3 hover:text-rose-500'
                        )}
                        title={`Delete section "${sec.name}"`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setEditingSection(null);
                    setIsSectionModalOpen(true);
                  }}
                  className="h-8 px-2.5 rounded-lg border border-dashed border-line text-[12px] text-ink-3 hover:text-accent hover:border-accent flex items-center gap-1 transition-all whitespace-nowrap cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Section</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingSection(null);
                    setIsSectionModalOpen(true);
                  }}
                  className="h-8 px-2.5 rounded-lg bg-surface-2 hover:bg-surface-3 text-[12px] text-ink-2 hover:text-ink flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer border border-line/60"
                  title="Manage all sections (reorder, rename, delete, custom icons)"
                >
                  <Settings className="w-3 h-3 text-ink-3" />
                  <span>Manage Sections</span>
                </button>
              </div>
            </div>
          </div>

          {/* Active Section Banner with direct Rename and Delete controls */}
          {activeSection && (
            <div className="p-3.5 sm:p-4 rounded-xl border border-accent/30 bg-accent/5 backdrop-blur-xs flex flex-col md:flex-row md:items-center justify-between gap-3.5 animate-in fade-in">
              <div className="flex items-center gap-3 min-w-0">
                <SectionIconPreview
                  icon={activeSection.icon}
                  className="w-10 h-10 rounded-xl bg-surface border border-line shadow-xs text-[20px] shrink-0"
                  imgClassName="w-6 h-6 object-contain"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[10.5px] font-bold px-1.5 py-0.5 rounded-md bg-surface border border-line text-ink-3">
                      Section #{String(activeSection.order_index && activeSection.order_index > 0 ? activeSection.order_index : 1).padStart(2, '0')}
                    </span>
                    <h2 className="text-[15px] font-bold text-ink truncate">{activeSection.name}</h2>
                    <span className="text-[11.5px] font-medium px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                      {sectionCounts[activeSection.id] || 0} articles
                    </span>
                  </div>
                  {activeSection.description ? (
                    <p className="text-[12px] text-ink-3 mt-0.5 line-clamp-1">{activeSection.description}</p>
                  ) : (
                    <p className="text-[11.5px] text-ink-3 italic mt-0.5">No description set for this section.</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-start md:self-auto flex-wrap">
                <button
                  type="button"
                  onClick={() => handleStartRenameSection(activeSection)}
                  className="h-8 px-3 rounded-lg border border-line bg-surface hover:bg-surface-2 text-ink text-[12px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  title="Rename or update this section"
                >
                  <Edit2 className="w-3.5 h-3.5 text-accent" />
                  <span>Rename Section</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleStartDeleteSection(activeSection)}
                  className="h-8 px-3 rounded-lg border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/15 text-rose-600 dark:text-rose-400 text-[12px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Delete this section"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Section</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsReorderModalOpen(true)}
                  className="h-8 px-3 rounded-lg border border-line bg-surface hover:bg-surface-2 text-ink text-[12px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  title="Change the display order of articles in this section"
                >
                  <ArrowUpDown className="w-3.5 h-3.5 text-accent" />
                  <span>Reorder Articles</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEditingArticle({ section_id: activeSection.id } as Article);
                    setIsArticleModalOpen(true);
                  }}
                  className="h-8 px-3 rounded-lg bg-accent text-accent-ink hover:opacity-95 text-[12px] font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  title="Create a new article directly in this section"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Article</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedSectionId('all')}
                  className="h-8 w-8 rounded-lg border border-line bg-surface hover:bg-surface-2 text-ink-3 hover:text-ink flex items-center justify-center transition-colors cursor-pointer"
                  title="View all sections"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Search and Status Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-ink-3 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search articles by title, content..."
                className="w-full h-9 pl-9 pr-3 rounded-lg border border-line bg-surface-2/70 text-[13px] text-ink placeholder:text-ink-3 focus:outline-none focus:border-accent focus:bg-surface transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <div className="flex items-center p-0.5 rounded-lg bg-surface-2 border border-line">
                {(['all', 'published', 'draft'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setSelectedStatus(status)}
                    className={cn(
                      'px-2.5 py-1 rounded-md text-[12px] font-medium transition-all capitalize',
                      selectedStatus === status
                        ? 'bg-surface text-ink shadow-xs font-semibold'
                        : 'text-ink-3 hover:text-ink'
                    )}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Articles List / Grid */}
        <section className="space-y-3">
          {loading ? (
            <div className="p-12 text-center text-ink-3 text-[13px]">Loading help articles...</div>
          ) : filteredArticles.length === 0 ? (
            <div className="p-12 rounded-2xl border border-dashed border-line text-center space-y-3 bg-surface-2/40">
              <BookOpen className="w-10 h-10 text-ink-3 mx-auto stroke-1" />
              <div className="text-[15px] font-semibold text-ink">No articles found</div>
              <p className="text-[12.5px] text-ink-3 max-w-sm mx-auto">
                {searchQuery
                  ? 'No articles match your search filter. Try clearing the search query.'
                  : 'Start building your Knowledge Base so customers can resolve questions on their own.'}
              </p>
              <button
                onClick={() => {
                  setEditingArticle(null);
                  setIsArticleModalOpen(true);
                }}
                className="h-8 px-3.5 rounded-lg bg-accent text-accent-ink text-[12.5px] font-semibold inline-flex items-center gap-1.5 transition-all shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Your First Article</span>
              </button>
            </div>
          ) : (
            <div className="border border-line rounded-xl overflow-hidden bg-surface divide-y divide-line/80 shadow-xs">
              {filteredArticles.map((article) => {
                const isPublished = article.status === 'published';
                return (
                  <div
                    key={article.id}
                    className="p-4.5 hover:bg-surface-2/50 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group"
                  >
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold',
                            isPublished
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                          )}
                        >
                          <span
                            className={cn(
                              'w-1.5 h-1.5 rounded-full',
                              isPublished ? 'bg-emerald-500' : 'bg-amber-500'
                            )}
                          />
                          {isPublished ? 'Published' : 'Draft'}
                        </span>

                        {/* Article Order within Section */}
                        {selectedSectionId !== 'all' ? (
                          <div
                            className="flex items-center gap-1 bg-surface-2/90 border border-line rounded-md px-2 py-0.5"
                            title="Display position on help.business.com"
                          >
                            <span className="font-mono text-[11px] font-bold text-accent">
                              #{String(article.order_index && article.order_index > 0 ? article.order_index : filteredArticles.indexOf(article) + 1).padStart(2, '0')}
                            </span>
                            <div className="flex items-center gap-0.5 border-l border-line/80 pl-1 ml-0.5">
                              <button
                                type="button"
                                disabled={filteredArticles.indexOf(article) === 0}
                                onClick={() => handleQuickMoveArticle(article, 'up')}
                                className="w-4.5 h-4.5 rounded hover:bg-surface flex items-center justify-center text-ink-3 hover:text-ink disabled:opacity-25 transition-colors cursor-pointer"
                                title="Move article up in order"
                              >
                                <ArrowUp className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                disabled={filteredArticles.indexOf(article) === filteredArticles.length - 1}
                                onClick={() => handleQuickMoveArticle(article, 'down')}
                                className="w-4.5 h-4.5 rounded hover:bg-surface flex items-center justify-center text-ink-3 hover:text-ink disabled:opacity-25 transition-colors cursor-pointer"
                                title="Move article down in order"
                              >
                                <ArrowDown className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ) : article.order_index && article.order_index > 0 ? (
                          <span
                            className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-surface-2 border border-line text-ink-3"
                            title="Display order position"
                          >
                            #{String(article.order_index).padStart(2, '0')}
                          </span>
                        ) : null}

                        {article.section ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-surface-2 text-ink-2 border border-line/60">
                            {article.section.order_index ? (
                              <span className="font-mono text-[10px] text-ink-3">
                                #{String(article.section.order_index).padStart(2, '0')}
                              </span>
                            ) : null}
                            <span>{article.section.icon || '📁'}</span>
                            <span>{article.section.name}</span>
                          </span>
                        ) : article.category ? (
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-surface-2 text-ink-3">
                            {article.category}
                          </span>
                        ) : null}

                        <span className="text-[11px] text-ink-3">
                          Updated {new Date(article.updated_at || article.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      <h3
                        onClick={() => {
                          setEditingArticle(article);
                          setIsArticleModalOpen(true);
                        }}
                        className="text-[14.5px] font-semibold text-ink hover:text-accent cursor-pointer transition-colors"
                      >
                        {article.title}
                      </h3>

                      {article.summary && (
                        <p className="text-[12.5px] text-ink-2 line-clamp-1 max-w-2xl">{article.summary}</p>
                      )}
                    </div>

                    {/* Stats & Actions */}
                    <div className="flex items-center gap-6 shrink-0 text-[12px] text-ink-3">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1" title="Total Views">
                          <Eye className="w-3.5 h-3.5 text-ink-3" />
                          <span>{article.views_count || 0}</span>
                        </span>

                        <span className="flex items-center gap-1" title="Helpful votes">
                          <ThumbsUp className="w-3.5 h-3.5 text-emerald-500/80" />
                          <span>{article.helpful_count || 0}</span>
                        </span>

                        {Boolean(article.not_helpful_count) && (
                          <span className="flex items-center gap-1" title="Unhelpful votes">
                            <ThumbsDown className="w-3.5 h-3.5 text-rose-500/80" />
                            <span>{article.not_helpful_count}</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleCopyArticleLink(article)}
                          className="h-8 w-8 rounded-md hover:bg-surface-2 flex items-center justify-center text-ink-3 hover:text-ink transition-colors"
                          title="Copy public article link"
                        >
                          <Link2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleOpenArticleLive(article)}
                          className="h-8 w-8 rounded-md hover:bg-surface-2 flex items-center justify-center text-ink-3 hover:text-ink transition-colors"
                          title="Open live article"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleToggleStatus(article)}
                          className="h-8 px-2.5 rounded-md text-[11.5px] font-medium border border-line hover:bg-surface-2 text-ink transition-colors"
                          title={isPublished ? 'Unpublish to draft' : 'Publish live'}
                        >
                          {isPublished ? 'Unpublish' : 'Publish'}
                        </button>

                        <button
                          onClick={() => {
                            setEditingArticle(article);
                            setIsArticleModalOpen(true);
                          }}
                          className="h-8 w-8 rounded-md hover:bg-surface-2 flex items-center justify-center text-ink-2 hover:text-ink transition-colors"
                          title="Edit article"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteArticle(article.id, article.title)}
                          className="h-8 w-8 rounded-md hover:bg-rose-500/10 flex items-center justify-center text-ink-3 hover:text-rose-500 transition-colors"
                          title="Delete article"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
        </>
        )}
      </main>

      {/* ARTICLE EDITOR MODAL */}
      {isArticleModalOpen && (
        <ArticleEditorModal
          workspace={workspace}
          workspaceId={workspace?.id || ''}
          sections={sections}
          article={editingArticle}
          onClose={() => {
            setIsArticleModalOpen(false);
            setEditingArticle(null);
          }}
          onSaved={(savedArticle) => {
            setIsArticleModalOpen(false);
            setEditingArticle(null);
            showToast(`Article "${savedArticle.title}" saved successfully!`);
            loadHelpDeskData();
          }}
        />
      )}

      {/* SECTIONS MANAGER MODAL */}
      {isSectionModalOpen && (
        <SectionsManagerModal
          workspaceId={workspace?.id || ''}
          sections={sections}
          initialEditingSection={editingSection}
          onClose={() => {
            setIsSectionModalOpen(false);
            setEditingSection(null);
          }}
          onSectionsChanged={() => {
            loadHelpDeskData();
          }}
        />
      )}

      {/* QUICK RENAME SECTION MODAL */}
      {sectionToRename && (
        <QuickRenameSectionModal
          workspaceId={workspace?.id || ''}
          section={sectionToRename}
          onClose={() => setSectionToRename(null)}
          onUpdated={handleSectionUpdated}
          onDeleteRequest={(sec) => {
            setSectionToRename(null);
            handleStartDeleteSection(sec);
          }}
        />
      )}

      {/* DELETE SECTION CONFIRM MODAL */}
      {sectionToDelete && (
        <DeleteSectionConfirmModal
          section={sectionToDelete}
          articleCount={sectionCounts[sectionToDelete.id] || 0}
          isDeleting={isDeletingSection}
          onClose={() => setSectionToDelete(null)}
          onConfirm={handleConfirmDeleteSection}
        />
      )}

      {/* REORDER ARTICLES MODAL */}
      {isReorderModalOpen && activeSection && (
        <ReorderArticlesModal
          workspaceId={workspace?.id || ''}
          section={activeSection}
          articles={activeSectionArticles}
          onClose={() => setIsReorderModalOpen(false)}
          onSaved={(updatedSectionArticles: Article[]) => {
            setIsReorderModalOpen(false);
            setArticles((prev) =>
              prev.map((art) => {
                const up = updatedSectionArticles.find((u: Article) => u.id === art.id);
                return up ? { ...art, order_index: up.order_index } : art;
              })
            );
            showToast(`Article order for "${activeSection.name}" updated successfully!`);
          }}
        />
      )}

      {/* WIDGET TAB SETTINGS MODAL */}
      {isTabSettingsModalOpen && workspaceState && (
        <WidgetTabSettingsModal
          workspace={workspaceState}
          onClose={() => setIsTabSettingsModalOpen(false)}
          onUpdated={(updatedWs) => {
            setWorkspaceState(updatedWs);
            showToast(`Widget tab renamed to "${updatedWs.help_center_tab_label || 'Help'}"!`);
          }}
        />
      )}
    </div>
  );
}

// ============================================================================
// ARTICLE EDITOR MODAL COMPONENT (with live markdown toolbar & preview)
// ============================================================================
interface ArticleEditorModalProps {
  workspace: Workspace | null;
  workspaceId: string;
  sections: HelpSection[];
  article: Article | null;
  onClose: () => void;
  onSaved: (article: Article) => void;
}

// ============================================================================
// ARTICLE BLUEPRINTS (Quick Start Professional Templates)
// ============================================================================
const ARTICLE_BLUEPRINTS = [
  {
    id: 'aquafunded-split',
    label: '🏆 Profit Split & Payouts',
    name: 'Profit Split Policy (AquaFunded Style)',
    desc: '90% standard split, 100% upgrade notice, reward calculations & CTA',
    content: `# 🏆 What is the Profit Split?

Traders receive a ==90% profit split== as standard on all evaluation and funded accounts.

### Example Calculation
If a trader earns a profit of **$5,000** and requests a payout reward, they will receive **$4,500** as their total reward directly to their preferred method.

> [!SUCCESS]
> **100% PROFIT SPLIT UPGRADE**
> Upon checkout, you have the option to upgrade with an add-on to:
> - [badge:emerald:100% PROFIT SPLIT]
> Keep every single dollar you generate through your trading strategy!

## Supported Payout Methods
We process reward payouts within **24 hours** through the following gateways:

| Method | Min Amount | Processing Time | Fee |
|:---|:---|:---|:---|
| Crypto (USDT / BTC) | $50 | Instant - 2 Hours | $0 |
| Bank Wire (Direct) | $200 | 1 - 2 Business Days | $0 |
| Deel / Rise | $100 | Same Day | $0 |

> [!CTA]
> **Trade with our capital and keep 100% of the profit**
> *Take advantage of our limited time evaluation sale live now.*
> [button:Get Funded](https://www.aquafunded.com/#Evaluations)`,
  },
  {
    id: 'aquafunded-risk',
    label: '⚡ Floating Loss & Risk',
    name: 'Maximum Loss Per Trade Policy',
    desc: '-2% risk limits, violation consequences, and account scaling tiers',
    content: `# ⚡ Maximum Loss Per Trade Policy

For all Instant Funding Models & AquaMan Models, if your floating PnL (profit and loss) drops below ==-2% of the account starting balance==, the account will be closed immediately.

This ensures strict adherence to risk management protocols and safeguards the integrity of our funding process.

### Floating Loss Example
For a **$50,000** account balance, if your combined open PnL across all active positions reaches a loss of ==$1,000 (-2%)==, the account will be permanently breached.

> [!WARNING]
> **Important Note for $300,000 & $400,000 Accounts**
> For $300k and $400k accounts, a stricter floating risk limit of ==-1%== applies to manage market exposure.

## Consequences for Exceeding the Risk Limit:
- [ ] Immediate and permanent closure of the breached account.
- [ ] No further trading activity permitted on the account.
- [ ] Remaining balance is settled according to evaluation terms.

> [!DANGER]
> **Zero Tolerance Violations**
> Hedging between different accounts, latency arbitrage, or account sharing will result in permanent ban from the platform.

---

> [!CTA]
> **Need help configuring risk on your platform?**
> *Our 24/7 team is available to assist you with lot size calculators.*
> [button:Contact Support](https://trading.aquafunded.com)`,
  },
  {
    id: 'aquafunded-faq',
    label: '❓ Trading Rules FAQ',
    name: 'Trading Rules & Conditions FAQ',
    desc: 'EAs, copy trading, holding trades overnight and weekend rules',
    content: `# ❓ General Trading Rules & FAQ

Find answers to common operational and strategy questions below.

### Q: Are EAs & Trade Copiers allowed?
==Yes.== Expert Advisors (EAs), algorithms, and trade copiers between your own personal accounts are fully permitted.

### Q: Can I hold trades overnight and over the weekend?
==Yes.== You are free to hold positions overnight and across the weekend on all swing and evaluation models without restriction.

### Q: Is there a maximum lot limit?
No, there is no arbitrary max lot limit. You can trade any position size that fits within your margin and max drawdown boundaries.

> [!NOTE]
> **News Trading Guidelines**
> You are permitted to trade high-impact news releases without restrictions on standard evaluation phases.

### Q: Do you allow hedging and martingale?
==Hedging is allowed== within the same trading account. Martingale strategies are permitted as long as you do not exceed max drawdown.

> [!CTA]
> **Ready to test your trading skills?**
> [button:Start Evaluation Challenge](https://www.aquafunded.com/#Evaluations)`,
  },
  {
    id: 'step-guide',
    label: '📋 Step Guide',
    name: 'Step-by-Step Tutorial',
    desc: 'Actionable walkthrough with prerequisites, step numbers & callouts',
    content: `# 📋 Step-by-Step Guide Title

A clear, concise walkthrough explaining how to achieve this goal.

> [!NOTE]
> Before you begin, ensure you have your account credentials and required permissions ready.

## 1. Prerequisites
- [ ] Active verified account
- [ ] Required client credentials
- [ ] Access to the client portal

## 2. Step-by-Step Instructions
1. Navigate to your **Dashboard** and open the configuration menu.
2. Under the general settings, locate the **Options** panel.
3. Review your preferences and click **Save Changes**.

> [!TIP]
> Changes usually take effect within 60 seconds across all connected devices.

## 3. Common Troubleshooting
- **Option not showing?** Make sure you are logged in with administrator privileges.
- **Save button disabled?** Verify all required fields are filled out.

---
*Still need help? Reach out to our 24/7 support team via live chat.*`,
  },
  {
    id: 'faq',
    label: '❓ FAQ',
    name: 'Frequently Asked Questions',
    desc: 'Structured Q&A format for common customer queries',
    content: `# ❓ Frequently Asked Questions

Find quick answers to the most common questions regarding our services and policies.

### Q: How long does verification take?
Verification is typically processed automatically within **5 to 15 minutes**. In rare cases requiring manual review, it may take up to 24 hours.

### Q: What payment and payout options are supported?
We support all major payment providers including:
- Credit / Debit Cards (Visa, MasterCard, Amex)
- Bank Wire Transfer
- Crypto (USDT, BTC)

> [!NOTE]
> All transactions are encrypted and processed through PCI-DSS compliant gateways.

### Q: Can I update my account email address?
Yes. You can edit your contact information at any time from your Account Settings tab.`,
  },
  {
    id: 'rules-table',
    label: '📊 Rules & Plans',
    name: 'Rules & Plan Matrix',
    desc: 'Comparison table, requirements matrix, and best practices',
    content: `# 📊 Policy & Plan Guidelines

Detailed criteria and rules applicable to all active accounts and evaluations.

> [!WARNING]
> Violating maximum drawdown limits will result in automatic rule breaches.

## Rule Summary Matrix

| Rule / Requirement | Standard Plan | Pro Plan | VIP Enterprise |
|:---|:---|:---|:---|
| Minimum Active Days | 5 Days | 3 Days | 0 Days |
| Maximum Daily Loss | 5% | 5% | 6% |
| Maximum Overall Loss | 10% | 12% | 14% |
| Profit Split | 80% | 85% | 90% |

## Key Best Practices
- Always use a stop-loss order on open positions.
- Keep your total risk per trade below **1-2%**.
- Avoid holding oversized positions through major high-impact economic news releases.`,
  },
  {
    id: 'troubleshooting',
    label: '🛠️ Troubleshooting',
    name: 'Troubleshooting Guide',
    desc: 'Error symptoms, root causes, and verified fix steps',
    content: `# 🛠️ Troubleshooting & Fix Guide

Quick solutions for unexpected errors or issues you might encounter.

> [!IMPORTANT]
> Always make sure you are running the latest browser version before proceeding.

## Symptoms
- Connection timed out when attempting to log in.
- Data on the dashboard is not refreshing in real time.

## Solution Steps
1. **Clear browser cache**: Press \`Ctrl + Shift + R\` (\`Cmd + Shift + R\` on Mac) for a hard reload.
2. **Check network status**: Disable any active VPN or proxy connections that might interfere.
3. **Verify server status**: Check our public status page for any scheduled maintenance.

> [!TIP]
> If the problem persists, try accessing through an incognito window or contact support.`,
  },
];

// ============================================================================
// ARTICLE EDITOR MODAL COMPONENT (with live markdown toolbar & preview)
// ============================================================================
interface ArticleEditorModalProps {
  workspace: Workspace | null;
  workspaceId: string;
  sections: HelpSection[];
  article: Article | null;
  onClose: () => void;
  onSaved: (article: Article) => void;
}

function ArticleEditorModal({
  workspace,
  workspaceId,
  sections,
  article,
  onClose,
  onSaved,
}: ArticleEditorModalProps) {
  const [title, setTitle] = useState(article?.title || '');
  const [slug, setSlug] = useState(article?.slug || '');
  const [isSlugCustom, setIsSlugCustom] = useState(Boolean(article?.slug));
  const [sectionId, setSectionId] = useState<string>(article?.section_id || sections[0]?.id || '');
  const [orderIndex, setOrderIndex] = useState<number>(article?.order_index ?? 0);
  const [summary, setSummary] = useState(article?.summary || '');
  const [content, setContent] = useState(article?.content || '');
  // The list hands over an article without its body, so an existing article
  // is not editable until the body has been fetched. Saving before then would
  // overwrite real content with an empty string.
  const [bodyLoading, setBodyLoading] = useState(
    Boolean(article?.id) && article?.content === undefined
  );
  const [bodyError, setBodyError] = useState<string | null>(null);
  const [status, setStatus] = useState<'published' | 'draft'>(article?.status || 'published');
  const [viewMode, setViewMode] = useState<'write' | 'split' | 'preview'>('split');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [showContentEmojiPicker, setShowContentEmojiPicker] = useState(false);
  const [showTitleEmojiPicker, setShowTitleEmojiPicker] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (!article?.id || article.content !== undefined || !workspaceId) return;

    let cancelled = false;
    setBodyLoading(true);
    setBodyError(null);

    getArticleAction(workspaceId, article.id)
      .then((full) => {
        if (cancelled) return;
        setContent(full.content || '');
        setBodyLoading(false);
      })
      .catch((err: any) => {
        if (cancelled) return;
        setBodyError(err?.message || 'Could not load this article.');
        setBodyLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [article?.id, article?.content, workspaceId]);

  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Auto-generate slug when title changes (unless admin custom-edited the slug)
  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (!isSlugCustom) {
      const generated = newTitle
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 80);
      setSlug(generated);
    }
  };

  // Statistics
  const stats = useMemo(() => {
    const trimmed = content.trim();
    const words = trimmed ? trimmed.split(/\s+/).length : 0;
    const chars = content.length;
    const readMinutes = Math.max(1, Math.ceil(words / 200));
    return { words, chars, readMinutes };
  }, [content]);

  // Insert markdown wrapper (e.g. **bold**)
  const insertMarkdown = (prefix: string, suffix: string = '') => {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = el.value;
    const selected = text.substring(start, end);

    if (!selected) {
      const newText = text.substring(0, start) + prefix + suffix + text.substring(end);
      setContent(newText);
      setTimeout(() => {
        el.focus();
        el.setSelectionRange(start + prefix.length, start + prefix.length);
      }, 20);
      return;
    }

    const replacement = `${prefix}${selected}${suffix}`;
    setContent(text.substring(0, start) + replacement + text.substring(end));
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    }, 20);
  };

  const insertText = (str: string) => {
    const el = textareaRef.current;
    if (!el) {
      setContent((prev) => prev + str);
      return;
    }

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = el.value;
    setContent(text.substring(0, start) + str + text.substring(end));
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + str.length, start + str.length);
    }, 20);
  };

  // ─────────────────────────────────────────────────────────────
  // 1. SMART BULLET LIST TOGGLER (Single or Multi-Line)
  // ─────────────────────────────────────────────────────────────
  const toggleBulletList = () => {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = el.value;

    const lineStart = text.lastIndexOf('\n', start - 1) + 1;
    let lineEnd = text.indexOf('\n', end);
    if (lineEnd === -1) lineEnd = text.length;

    const selectedBlock = text.substring(lineStart, lineEnd);
    const lines = selectedBlock.split('\n');

    const allBulleted = lines.every((l) => /^\s*[-*]\s+/.test(l));

    let firstLineDiff = 0;
    const newLines = lines.map((l, idx) => {
      let result = l;
      if (allBulleted) {
        result = l.replace(/^(\s*)[-*]\s+/, '$1');
      } else {
        if (/^\s*\d+\.\s+/.test(l)) {
          result = l.replace(/^(\s*)\d+\.\s+/, '$1- ');
        } else if (/^\s*[-*]\s+/.test(l)) {
          result = l;
        } else {
          result = l.replace(/^(\s*)/, '$1- ');
        }
      }
      if (idx === 0) firstLineDiff = result.length - l.length;
      return result;
    });

    const replacement = newLines.join('\n');
    const newContent = text.substring(0, lineStart) + replacement + text.substring(lineEnd);
    setContent(newContent);

    setTimeout(() => {
      el.focus();
      if (start === end) {
        const newPos = Math.max(lineStart, start + firstLineDiff);
        el.setSelectionRange(newPos, newPos);
      } else {
        el.setSelectionRange(lineStart, lineStart + replacement.length);
      }
    }, 20);
  };

  // ─────────────────────────────────────────────────────────────
  // 2. SMART NUMBERED LIST TOGGLER (Sequential Multi-Line)
  // ─────────────────────────────────────────────────────────────
  const toggleNumberedList = () => {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = el.value;

    const lineStart = text.lastIndexOf('\n', start - 1) + 1;
    let lineEnd = text.indexOf('\n', end);
    if (lineEnd === -1) lineEnd = text.length;

    const selectedBlock = text.substring(lineStart, lineEnd);
    const lines = selectedBlock.split('\n');

    const allNumbered = lines.every((l) => /^\s*\d+\.\s+/.test(l));

    let counter = 1;
    let firstLineDiff = 0;
    const newLines = lines.map((l, idx) => {
      let result = l;
      if (allNumbered) {
        result = l.replace(/^(\s*)\d+\.\s+/, '$1');
      } else {
        if (/^\s*[-*]\s+/.test(l)) {
          result = l.replace(/^(\s*)[-*]\s+/, `$1${counter++}. `);
        } else if (/^\s*\d+\.\s+/.test(l)) {
          result = l.replace(/^(\s*)\d+\.\s+/, `$1${counter++}. `);
        } else {
          result = l.replace(/^(\s*)/, `$1${counter++}. `);
        }
      }
      if (idx === 0) firstLineDiff = result.length - l.length;
      return result;
    });

    const replacement = newLines.join('\n');
    const newContent = text.substring(0, lineStart) + replacement + text.substring(lineEnd);
    setContent(newContent);

    setTimeout(() => {
      el.focus();
      if (start === end) {
        const newPos = Math.max(lineStart, start + firstLineDiff);
        el.setSelectionRange(newPos, newPos);
      } else {
        el.setSelectionRange(lineStart, lineStart + replacement.length);
      }
    }, 20);
  };

  // ─────────────────────────────────────────────────────────────
  // 3. SMART TASK CHECKLIST TOGGLER
  // ─────────────────────────────────────────────────────────────
  const toggleTaskList = () => {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = el.value;

    const lineStart = text.lastIndexOf('\n', start - 1) + 1;
    let lineEnd = text.indexOf('\n', end);
    if (lineEnd === -1) lineEnd = text.length;

    const selectedBlock = text.substring(lineStart, lineEnd);
    const lines = selectedBlock.split('\n');

    const allTasks = lines.every((l) => /^\s*-\s*\[[ x]\]\s+/.test(l));

    let firstLineDiff = 0;
    const newLines = lines.map((l, idx) => {
      let result = l;
      if (allTasks) {
        result = l.replace(/^(\s*)-\s*\[[ x]\]\s+/, '$1');
      } else {
        if (/^\s*[-*]\s+/.test(l)) {
          result = l.replace(/^(\s*)[-*]\s+/, '$1- [ ] ');
        } else {
          result = l.replace(/^(\s*)/, '$1- [ ] ');
        }
      }
      if (idx === 0) firstLineDiff = result.length - l.length;
      return result;
    });

    const replacement = newLines.join('\n');
    const newContent = text.substring(0, lineStart) + replacement + text.substring(lineEnd);
    setContent(newContent);

    setTimeout(() => {
      el.focus();
      if (start === end) {
        const newPos = Math.max(lineStart, start + firstLineDiff);
        el.setSelectionRange(newPos, newPos);
      } else {
        el.setSelectionRange(lineStart, lineStart + replacement.length);
      }
    }, 20);
  };

  // ─────────────────────────────────────────────────────────────
  // 4. INTELLIGENT KEYBOARD AUTO-CONTINUATION (Notion/Slack Grade)
  // ─────────────────────────────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const el = textareaRef.current;
    if (!el) return;

    // Shortcuts:
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
      e.preventDefault();
      insertMarkdown('**', '**');
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'i') {
      e.preventDefault();
      insertMarkdown('*', '*');
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      insertMarkdown('[', '](https://)');
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'h') {
      e.preventDefault();
      insertMarkdown('==', '==');
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSave();
      return;
    }

    // Backspace: If cursor is right after list prefix, remove prefix (Notion style)
    if (e.key === 'Backspace') {
      const start = el.selectionStart;
      const end = el.selectionEnd;
      if (start === end) {
        const text = el.value;
        const lineStart = text.lastIndexOf('\n', start - 1) + 1;
        const lineBeforeCursor = text.substring(lineStart, start);

        const prefixMatch = lineBeforeCursor.match(/^(\s*)([-*]\s+|\d+\.\s+|-\s*\[[ x]\]\s+)$/);
        if (prefixMatch) {
          e.preventDefault();
          const indent = prefixMatch[1];
          const newContent = text.substring(0, lineStart) + indent + text.substring(start);
          setContent(newContent);
          setTimeout(() => {
            el.setSelectionRange(lineStart + indent.length, lineStart + indent.length);
          }, 0);
          return;
        }
      }
    }

    // Tab key -> Indent / Outdent
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const text = el.value;
      const lineStart = text.lastIndexOf('\n', start - 1) + 1;

      if (e.shiftKey) {
        // Unindent
        if (text.substring(lineStart, lineStart + 2) === '  ') {
          const newContent = text.substring(0, lineStart) + text.substring(lineStart + 2);
          setContent(newContent);
          setTimeout(() => {
            const newPos = Math.max(lineStart, start - 2);
            el.setSelectionRange(newPos, newPos);
          }, 0);
        }
      } else {
        // Indent
        const newContent = text.substring(0, lineStart) + '  ' + text.substring(lineStart);
        setContent(newContent);
        setTimeout(() => {
          el.setSelectionRange(start + 2, end + 2);
        }, 0);
      }
      return;
    }

    // Enter key -> Auto-continuation for lists
    if (e.key === 'Enter' && !e.shiftKey) {
      const start = el.selectionStart;
      const text = el.value;
      const lineStart = text.lastIndexOf('\n', start - 1) + 1;
      const currentLine = text.substring(lineStart, start);

      // A. Empty bullet: "- " -> exit list & start clean line
      const emptyBulletMatch = currentLine.match(/^(\s*)[-*]\s*$/);
      if (emptyBulletMatch) {
        e.preventDefault();
        const newContent = text.substring(0, lineStart) + text.substring(start);
        setContent(newContent);
        setTimeout(() => {
          el.setSelectionRange(lineStart, lineStart);
        }, 0);
        return;
      }

      // B. Bullet with text: "- something" -> continue bullet
      const bulletMatch = currentLine.match(/^(\s*)([-*])\s+(.+)$/);
      if (bulletMatch) {
        e.preventDefault();
        const indent = bulletMatch[1];
        const symbol = bulletMatch[2];
        const insertion = `\n${indent}${symbol} `;
        const newContent = text.substring(0, start) + insertion + text.substring(start);
        setContent(newContent);
        setTimeout(() => {
          el.setSelectionRange(start + insertion.length, start + insertion.length);
        }, 0);
        return;
      }

      // C. Empty numbered item: "3. " -> exit list
      const emptyNumMatch = currentLine.match(/^(\s*)\d+\.\s*$/);
      if (emptyNumMatch) {
        e.preventDefault();
        const newContent = text.substring(0, lineStart) + text.substring(start);
        setContent(newContent);
        setTimeout(() => {
          el.setSelectionRange(lineStart, lineStart);
        }, 0);
        return;
      }

      // D. Numbered item with text -> continue next number "4. "
      const numMatch = currentLine.match(/^(\s*)(\d+)\.\s+(.+)$/);
      if (numMatch) {
        e.preventDefault();
        const indent = numMatch[1];
        const currentNum = parseInt(numMatch[2], 10);
        const nextNum = currentNum + 1;
        const insertion = `\n${indent}${nextNum}. `;
        const newContent = text.substring(0, start) + insertion + text.substring(start);
        setContent(newContent);
        setTimeout(() => {
          el.setSelectionRange(start + insertion.length, start + insertion.length);
        }, 0);
        return;
      }

      // E. Empty task checklist: "- [ ] " -> exit checklist
      const emptyTaskMatch = currentLine.match(/^(\s*)-\s*\[[ x]\]\s*$/);
      if (emptyTaskMatch) {
        e.preventDefault();
        const newContent = text.substring(0, lineStart) + text.substring(start);
        setContent(newContent);
        setTimeout(() => {
          el.setSelectionRange(lineStart, lineStart);
        }, 0);
        return;
      }

      // F. Task checklist with text -> continue "- [ ] "
      const taskMatch = currentLine.match(/^(\s*)-\s*\[[ x]\]\s+(.+)$/);
      if (taskMatch) {
        e.preventDefault();
        const indent = taskMatch[1];
        const insertion = `\n${indent}- [ ] `;
        const newContent = text.substring(0, start) + insertion + text.substring(start);
        setContent(newContent);
        setTimeout(() => {
          el.setSelectionRange(start + insertion.length, start + insertion.length);
        }, 0);
        return;
      }
    }
  };

  const handleApplyBlueprint = (blueprintContent: string) => {
    if (content.trim().length > 30) {
      if (!confirm('Apply this blueprint? This will replace your current editor content.')) {
        return;
      }
    }
    setContent(blueprintContent);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  };

  const handleInsertImage = () => {
    if (!imageUrl.trim()) return;
    const md = `\n![${imageAlt.trim() || 'Image'}](${imageUrl.trim()})\n`;
    insertText(md);
    setImageUrl('');
    setImageAlt('');
    setShowImageModal(false);
  };

  const handleSave = async () => {
    // Guard the window between opening an existing article and its body
    // arriving; saving in it would replace the article with an empty one.
    if (bodyLoading) {
      setErrorMsg('Still loading this article — one moment.');
      return;
    }
    if (bodyError) {
      setErrorMsg(`${bodyError} Close and reopen the article before saving.`);
      return;
    }
    if (!title.trim()) {
      setErrorMsg('Please enter an article title.');
      return;
    }
    if (!content.trim()) {
      setErrorMsg('Please write article content.');
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    try {
      if (article?.id) {
        const res = await updateArticleAction(workspaceId, article.id, {
          title,
          slug: slug.trim() || undefined,
          section_id: sectionId || null,
          summary,
          content,
          status,
          order_index: orderIndex,
        });
        if (res.article) onSaved(res.article);
      } else {
        const res = await createArticleAction(workspaceId, {
          title,
          slug: slug.trim() || undefined,
          section_id: sectionId || null,
          summary,
          content,
          status,
          order_index: orderIndex > 0 ? orderIndex : undefined,
        });
        if (res.article) onSaved(res.article);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save article');
      setSaving(false);
    }
  };

  const resolvedPublicUrl = workspace
    ? getWorkspaceHelpCenterUrl(workspace, {
        id: article?.id || 'new',
        slug: slug || 'article',
      })
    : '';

  const handleCopyPublicUrl = () => {
    if (resolvedPublicUrl) {
      navigator.clipboard.writeText(resolvedPublicUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div
      className={cn(
        'fixed z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in',
        isFullscreen ? 'inset-0 p-0' : 'inset-0'
      )}
    >
      <div
        className={cn(
          'bg-surface border border-line flex flex-col overflow-hidden transition-all shadow-2xl',
          isFullscreen
            ? 'w-full h-full rounded-none border-0'
            : 'max-w-6xl w-full max-h-[94vh] rounded-2xl'
        )}
      >
        {/* ─────────────────────────────────────────────────────────────
            1. MODAL HEADER & STUDIO CONTROLS
            ───────────────────────────────────────────────────────────── */}
        <div className="px-5 py-3.5 border-b border-line flex items-center justify-between bg-surface-2/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent/10 text-accent flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[15px] font-bold text-ink">
                  {article ? 'Edit Knowledge Base Article' : 'Author Knowledge Base Article'}
                </h2>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-accent-soft text-accent">
                  Pro Studio
                </span>
              </div>
              <p className="text-[11.5px] text-ink-3">
                Smart formatting, automated list continuation, blueprints &amp; live preview.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Switcher: Write | Split (Live) | Preview */}
            <div className="flex items-center bg-surface rounded-lg p-0.5 border border-line shadow-2xs">
              <button
                type="button"
                onClick={() => setViewMode('write')}
                className={cn(
                  'px-2.5 py-1 rounded text-[11px] font-semibold transition-all',
                  viewMode === 'write'
                    ? 'bg-surface-3 text-ink shadow-xs'
                    : 'text-ink-3 hover:text-ink'
                )}
                title="Editor Only"
              >
                Write
              </button>
              <button
                type="button"
                onClick={() => setViewMode('split')}
                className={cn(
                  'px-2.5 py-1 rounded text-[11px] font-semibold transition-all flex items-center gap-1',
                  viewMode === 'split'
                    ? 'bg-accent text-accent-ink shadow-xs'
                    : 'text-ink-3 hover:text-ink'
                )}
                title="Side-by-side Live Split View"
              >
                <Columns2 className="w-3.5 h-3.5" />
                <span>Split View</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('preview')}
                className={cn(
                  'px-2.5 py-1 rounded text-[11px] font-semibold transition-all',
                  viewMode === 'preview'
                    ? 'bg-surface-3 text-ink shadow-xs'
                    : 'text-ink-3 hover:text-ink'
                )}
                title="Preview Only"
              >
                Preview
              </button>
            </div>

            {/* Shortcuts Help Button */}
            <button
              type="button"
              onClick={() => setShowShortcutsModal((prev) => !prev)}
              className="h-8 px-2 rounded-lg border border-line hover:bg-surface-3 flex items-center gap-1 text-[11px] font-medium text-ink-3 hover:text-ink transition-colors"
              title="Keyboard Shortcuts & Tips"
            >
              <Keyboard className="w-3.5 h-3.5 text-accent" />
              <span className="hidden sm:inline">Shortcuts</span>
            </button>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="w-8 h-8 rounded-lg hover:bg-surface-3 flex items-center justify-center text-ink-3 hover:text-ink transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Editor'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-surface-3 flex items-center justify-center text-ink-3 hover:text-ink transition-colors ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            2. MODAL BODY: METADATA & EDITOR PANE
            ───────────────────────────────────────────────────────────── */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-[12.5px] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Title & Section Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <div className="md:col-span-2 space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[12px] font-semibold text-ink">Article Title</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowTitleEmojiPicker((prev) => !prev)}
                    className="text-[11px] text-accent hover:underline flex items-center gap-1 font-medium"
                  >
                    <Smile className="w-3.5 h-3.5" />
                    <span>Insert Emoji</span>
                  </button>
                  {showTitleEmojiPicker && (
                    <div className="absolute right-0 top-6 z-50">
                      <EmojiPickerPopover
                        onSelect={(em) => handleTitleChange(title ? `${title} ${em}` : `${em} `)}
                        onClose={() => setShowTitleEmojiPicker(false)}
                      />
                    </div>
                  )}
                </div>
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. 🚀 How to pass evaluation challenge guidelines"
                className="w-full h-10 px-3.5 rounded-xl border border-line bg-surface text-[14px] text-ink focus:outline-none focus:border-accent font-medium shadow-2xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-3 space-y-1">
                <label className="text-[12px] font-semibold text-ink">Section / Collection</label>
                <select
                  value={sectionId}
                  onChange={(e) => setSectionId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-line bg-surface text-[13px] text-ink focus:outline-none focus:border-accent font-medium shadow-2xs"
                >
                  <option value="">(No Section - General)</option>
                  {sections.map((sec, idx) => (
                    <option key={sec.id} value={sec.id}>
                      #{String(sec.order_index && sec.order_index > 0 ? sec.order_index : idx + 1).padStart(2, '0')} {sec.icon} {sec.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-1 space-y-1">
                <label className="text-[12px] font-semibold text-ink" title="Order position on help.business.com (lower numbers appear first)">
                  Order # in Section
                </label>
                <input
                  type="number"
                  min={1}
                  value={orderIndex > 0 ? orderIndex : ''}
                  onChange={(e) => setOrderIndex(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  placeholder="Auto"
                  className="w-full h-10 px-3 rounded-xl border border-line bg-surface text-[13px] font-mono text-ink focus:outline-none focus:border-accent font-medium shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* Excerpt / Summary */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[12px] font-semibold text-ink">
                Short Summary <span className="font-normal text-ink-3">(Displayed on cards, preview &amp; search)</span>
              </label>
              <span className="text-[11px] text-ink-3 font-mono">{summary.length}/200</span>
            </div>
            <input
              type="text"
              value={summary}
              maxLength={220}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Brief summary explaining what customer learns from this guide..."
              className="w-full h-9.5 px-3.5 rounded-xl border border-line bg-surface text-[13px] text-ink focus:outline-none focus:border-accent shadow-2xs"
            />
          </div>

          {/* Custom Slug & Live URL Preview Banner */}
          <div className="p-3 rounded-xl bg-surface-2/60 border border-line/70 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              {/* Publishing Status Radio */}
              <div className="flex items-center gap-4">
                <span className="text-[12px] font-semibold text-ink">Status:</span>
                <label className="flex items-center gap-1.5 cursor-pointer text-[12.5px]">
                  <input
                    type="radio"
                    name="status"
                    value="published"
                    checked={status === 'published'}
                    onChange={() => setStatus('published')}
                    className="text-accent"
                  />
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    Published (Live)
                  </span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-[12.5px]">
                  <input
                    type="radio"
                    name="status"
                    value="draft"
                    checked={status === 'draft'}
                    onChange={() => setStatus('draft')}
                    className="text-accent"
                  />
                  <span className="font-medium text-amber-600 dark:text-amber-400">
                    Draft (Private)
                  </span>
                </label>
              </div>

              {/* URL Customizer & Copy */}
              <div className="flex items-center gap-2 text-xs">
                <div className="flex items-center gap-1.5 bg-surface px-2.5 py-1 rounded-lg border border-line font-mono text-[11px] text-ink-2">
                  <Globe className="w-3.5 h-3.5 text-accent shrink-0" />
                  <span className="text-ink-3 hidden md:inline">URL:</span>
                  <span className="text-ink font-semibold truncate max-w-[220px] sm:max-w-xs">
                    /{slug || 'article-slug'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsSlugCustom(!isSlugCustom)}
                    className="ml-1 text-ink-3 hover:text-ink"
                    title={isSlugCustom ? 'Custom slug unlocked' : 'Auto-generating slug from title'}
                  >
                    {isSlugCustom ? <Unlock className="w-3 h-3 text-accent" /> : <Lock className="w-3 h-3" />}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleCopyPublicUrl}
                  className="h-7 px-2.5 rounded-lg border border-line bg-surface hover:bg-surface-3 text-[11px] font-medium text-ink flex items-center gap-1 transition-colors"
                  title="Copy full article link"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-500" />
                      <span className="text-emerald-500">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-ink-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>

                {article && (
                  <a
                    href={resolvedPublicUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="h-7 px-2.5 rounded-lg border border-line bg-surface hover:bg-surface-3 text-[11px] font-medium text-ink flex items-center gap-1 transition-colors"
                    title="Open live article page"
                  >
                    <ExternalLink className="w-3 h-3 text-ink-3" />
                    <span>Live</span>
                  </a>
                )}
              </div>
            </div>

            {/* Custom Slug Input (if unlocked) */}
            {isSlugCustom && (
              <div className="flex items-center gap-2 pt-1 border-t border-line/40">
                <span className="text-[11.5px] text-ink-3 font-medium">Custom URL Slug:</span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="custom-article-slug"
                  className="h-7 px-2 rounded-md border border-line bg-surface text-[12px] font-mono text-ink flex-1 max-w-sm focus:outline-none focus:border-accent"
                />
                <button
                  type="button"
                  onClick={() => {
                    setIsSlugCustom(false);
                    handleTitleChange(title);
                  }}
                  className="text-[11px] text-accent hover:underline flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset to Title</span>
                </button>
              </div>
            )}
          </div>

          {/* ─────────────────────────────────────────────────────────────
              3. INSTANT BLUEPRINTS (Quick-Start Templates)
              ───────────────────────────────────────────────────────────── */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-3 flex items-center gap-1 shrink-0">
              <Sparkles className="w-3 h-3 text-accent" />
              <span>Blueprints:</span>
            </span>
            {ARTICLE_BLUEPRINTS.map((bp) => (
              <button
                key={bp.id}
                type="button"
                onClick={() => handleApplyBlueprint(bp.content)}
                className="h-7 px-2.5 rounded-lg border border-line/80 bg-surface hover:border-accent hover:bg-accent-soft/40 text-[11.5px] font-medium text-ink hover:text-accent transition-all whitespace-nowrap shadow-2xs flex items-center gap-1"
                title={bp.desc}
              >
                <span>{bp.label}</span>
              </button>
            ))}
          </div>

          {/* ─────────────────────────────────────────────────────────────
              4. EDITOR WRAPPER (TOOLBAR + TEXTAREA + SPLIT VIEW)
              ───────────────────────────────────────────────────────────── */}
          <div className="border border-line rounded-xl overflow-hidden shadow-xs focus-within:border-accent transition-colors">
            {/* Rich Formatting Toolbar */}
            <div className="flex items-center gap-1 px-3 py-2 bg-surface-2 border-b border-line flex-wrap text-ink-2">
              {/* Headings */}
              <div className="flex items-center gap-0.5 bg-surface rounded-lg p-0.5 border border-line/60">
                <button
                  type="button"
                  onClick={() => insertMarkdown('\n# ', '\n')}
                  className="h-7 px-2 rounded hover:bg-surface-2 text-[11px] font-bold text-ink hover:text-accent flex items-center gap-0.5"
                  title="Heading 1"
                >
                  <Heading1 className="w-3.5 h-3.5" />
                  <span>H1</span>
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown('\n## ', '\n')}
                  className="h-7 px-2 rounded hover:bg-surface-2 text-[11px] font-bold text-ink hover:text-accent flex items-center gap-0.5"
                  title="Heading 2"
                >
                  <Heading2 className="w-3.5 h-3.5" />
                  <span>H2</span>
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown('\n### ', '\n')}
                  className="h-7 px-2 rounded hover:bg-surface-2 text-[11px] font-bold text-ink hover:text-accent flex items-center gap-0.5"
                  title="Heading 3"
                >
                  <Heading3 className="w-3.5 h-3.5" />
                  <span>H3</span>
                </button>
              </div>

              {/* Text Typography */}
              <div className="flex items-center gap-0.5 bg-surface rounded-lg p-0.5 border border-line/60">
                <button
                  type="button"
                  onClick={() => insertMarkdown('**', '**')}
                  className="h-7 w-7 rounded hover:bg-surface-2 flex items-center justify-center font-bold text-ink hover:text-accent"
                  title="Bold (Ctrl+B)"
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown('*', '*')}
                  className="h-7 w-7 rounded hover:bg-surface-2 flex items-center justify-center italic text-ink hover:text-accent"
                  title="Italic (Ctrl+I)"
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown('==', '==')}
                  className="h-7 w-7 rounded hover:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold transition-colors"
                  title="Highlight Text (==text==) [Ctrl+H]"
                >
                  <Highlighter className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown('[badge:green:', ']')}
                  className="h-7 px-1.5 rounded hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center gap-1 text-[11px] font-semibold transition-colors"
                  title="Insert Status Badge"
                >
                  <BadgeCheck className="w-3.5 h-3.5" />
                  <span>Badge</span>
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown('~~', '~~')}
                  className="h-7 w-7 rounded hover:bg-surface-2 flex items-center justify-center text-ink hover:text-accent"
                  title="Strikethrough"
                >
                  <Strikethrough className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown('`', '`')}
                  className="h-7 w-7 rounded hover:bg-surface-2 flex items-center justify-center font-mono text-[11px] text-ink hover:text-accent"
                  title="Inline Code"
                >
                  <Code className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Smart Lists (Bullets, Numbering, Checklists) */}
              <div className="flex items-center gap-0.5 bg-surface rounded-lg p-0.5 border border-line/60">
                <button
                  type="button"
                  onClick={toggleBulletList}
                  className="h-7 px-2 rounded hover:bg-surface-2 flex items-center gap-1 text-[12px] font-semibold text-ink hover:text-accent"
                  title="Smart Bullet List (- item)"
                >
                  <List className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Bullet</span>
                </button>
                <button
                  type="button"
                  onClick={toggleNumberedList}
                  className="h-7 px-2 rounded hover:bg-surface-2 flex items-center gap-1 text-[12px] font-semibold text-ink hover:text-accent"
                  title="Smart Numbered List (1. 2. 3.)"
                >
                  <ListOrdered className="w-3.5 h-3.5" />
                  <span className="text-[11px]">1. 2. 3.</span>
                </button>
                <button
                  type="button"
                  onClick={toggleTaskList}
                  className="h-7 px-2 rounded hover:bg-surface-2 flex items-center gap-1 text-[12px] font-semibold text-ink hover:text-accent"
                  title="Task Checklist (- [ ] item)"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Tasks</span>
                </button>
              </div>

              {/* Intercom / AquaFunded Callouts */}
              <div className="flex items-center gap-0.5 bg-surface rounded-lg p-0.5 border border-line/60">
                <button
                  type="button"
                  onClick={() => insertText('\n> [!NOTE]\n> Important guidance or key fact...\n\n')}
                  className="h-7 px-2 rounded hover:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[11px] font-semibold flex items-center gap-1"
                  title="Note Callout Box"
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span>Note</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    insertText(
                      '\n> [!SUCCESS]\n> **100% PROFIT SPLIT UPGRADE**\n> - Traders receive a **90% profit** split as standard.\n> - Upgrade add-on available at checkout for **100% PROFIT SPLIT**.\n\n'
                    )
                  }
                  className="h-7 px-2 rounded hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold flex items-center gap-1"
                  title="Bonus / Upgrade Callout (Green)"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Upgrade</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    insertText(
                      '\n> [!CTA]\n> **Trade with our capital and keep 100% of the profit**\n> *Take advantage of our limited time evaluation sale live now.*\n> [button:Get Funded](https://www.aquafunded.com/#Evaluations)\n\n'
                    )
                  }
                  className="h-7 px-2 rounded hover:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[11px] font-semibold flex items-center gap-1"
                  title="Featured CTA Banner (Blue with Button)"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>CTA Card</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    insertText(
                      '\n> [!WARNING]\n> **Important Risk Limit**\n> Floating loss exceeding -2% will result in automatic rule breach.\n\n'
                    )
                  }
                  className="h-7 px-2 rounded hover:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px] font-semibold flex items-center gap-1"
                  title="Warning Box"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Warn</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    insertText(
                      '\n> [!DANGER]\n> **Violation / Breach Notice**\n> Prohibited trading strategies will result in immediate account closure.\n\n'
                    )
                  }
                  className="h-7 px-2 rounded hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[11px] font-semibold flex items-center gap-1"
                  title="Violation / Danger Box (Red)"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Breach</span>
                </button>
              </div>

              {/* Rich Blocks: Images, Tables, Quotes, Links */}
              <div className="flex items-center gap-0.5 bg-surface rounded-lg p-0.5 border border-line/60">
                <button
                  type="button"
                  onClick={() => setShowImageModal(true)}
                  className="h-7 w-7 rounded hover:bg-surface-2 flex items-center justify-center text-ink hover:text-accent"
                  title="Insert Image"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown('[button:Get Funded](', 'https://)')}
                  className="h-7 px-2 rounded hover:bg-accent-soft text-accent text-[11px] font-semibold flex items-center gap-1"
                  title="Insert CTA Action Button"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>Button</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    insertText(
                      '\n| Feature | Free Plan | Pro Plan |\n|:---|:---|:---|\n| Support | Community | 24/7 Priority |\n| Storage | 5 GB | Unlimited |\n\n'
                    )
                  }
                  className="h-7 w-7 rounded hover:bg-surface-2 flex items-center justify-center text-ink hover:text-accent"
                  title="Insert Comparison Table"
                >
                  <TableIcon className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown('\n> ')}
                  className="h-7 w-7 rounded hover:bg-surface-2 flex items-center justify-center text-ink hover:text-accent"
                  title="Quote"
                >
                  <Quote className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertText('\n```javascript\n// Sample code snippet\nconst app = new Chatify();\n```\n\n')}
                  className="h-7 px-1.5 rounded hover:bg-surface-2 text-[11px] font-mono text-ink hover:text-accent"
                  title="Code Block"
                >
                  {'```'}
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown('[', '](https://)')}
                  className="h-7 w-7 rounded hover:bg-surface-2 flex items-center justify-center text-ink hover:text-accent"
                  title="Insert Link (Ctrl+K)"
                >
                  <Link2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertText('\n---\n\n')}
                  className="h-7 w-7 rounded hover:bg-surface-2 flex items-center justify-center text-ink hover:text-accent"
                  title="Divider Line"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Emoji Picker */}
              <div className="relative ml-auto">
                <button
                  type="button"
                  onClick={() => setShowContentEmojiPicker((prev) => !prev)}
                  className="h-7 px-2.5 rounded-lg bg-accent/10 border border-accent/20 hover:bg-accent/20 text-accent text-[11.5px] font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Smile className="w-3.5 h-3.5" />
                  <span>Emojis</span>
                </button>

                {showContentEmojiPicker && (
                  <div className="absolute right-0 top-8 z-50">
                    <EmojiPickerPopover
                      onSelect={(em) => insertText(em)}
                      onClose={() => setShowContentEmojiPicker(false)}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Editor Panes based on viewMode */}
            <div
              className={cn(
                'grid transition-all',
                viewMode === 'split' ? 'grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-line' : 'grid-cols-1'
              )}
            >
              {/* Write Textarea Pane */}
              {(viewMode === 'write' || viewMode === 'split') && (
                <div className="flex flex-col bg-surface relative">
                  {(bodyLoading || bodyError) && (
                    <div className="absolute inset-0 z-10 grid place-items-center bg-surface/85 backdrop-blur-[1px]">
                      {bodyError ? (
                        <p className="text-[13px] text-rose-500 px-6 text-center">
                          {bodyError}
                        </p>
                      ) : (
                        <p className="text-[13px] text-ink-3">Loading article…</p>
                      )}
                    </div>
                  )}
                  <textarea
                    ref={textareaRef}
                    rows={isFullscreen ? 26 : 16}
                    value={content}
                    disabled={bodyLoading || Boolean(bodyError)}
                    onChange={(e) => setContent(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Write your article content here...

Tip:
- Type '-' or '1.' and press Enter to auto-continue lists.
- Press Backspace on an empty bullet to exit the list.
- Use Tab to indent and Shift+Tab to outdent.
- Press Ctrl+B for Bold, Ctrl+I for Italic, Ctrl+K for Links, Ctrl+Enter to Save."
                    className="w-full h-full p-4.5 bg-transparent text-[14px] text-ink placeholder:text-ink-3 focus:outline-none resize-none font-mono leading-relaxed selection:bg-accent/20"
                  />
                </div>
              )}

              {/* Live Preview Pane */}
              {(viewMode === 'preview' || viewMode === 'split') && (
                <div
                  className={cn(
                    'p-6 bg-surface-2/40 overflow-y-auto leading-relaxed',
                    isFullscreen ? 'max-h-[calc(100vh-250px)]' : 'max-h-[500px] min-h-[320px]'
                  )}
                >
                  <div className="pb-2.5 mb-4 border-b border-line flex items-center justify-between text-[11.5px] text-ink-3">
                    <span className="font-semibold uppercase tracking-wider text-accent flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Live Customer Preview</span>
                    </span>
                    <span>Synchronized live rendering</span>
                  </div>
                  {content.trim() ? (
                    <MarkdownArticleContent content={content} />
                  ) : (
                    <div className="p-12 text-center text-ink-3 italic text-[13px] border border-dashed border-line rounded-xl space-y-2">
                      <LayoutTemplate className="w-8 h-8 text-ink-3 mx-auto stroke-1" />
                      <p>Nothing to preview yet.</p>
                      <p className="text-[12px] not-italic text-ink-3">
                        Pick a blueprint from the top or start typing to see real-time formatting.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            5. MODAL FOOTER WITH LIVE METRICS & 1-CLICK SAVE
            ───────────────────────────────────────────────────────────── */}
        <div className="px-5 py-3.5 border-t border-line flex items-center justify-between bg-surface-2/50 shrink-0">
          <div className="flex items-center gap-3 text-[12px] text-ink-3">
            <span className="font-medium">
              <strong className="text-ink font-semibold">{stats.words}</strong> words
            </span>
            <span>•</span>
            <span>
              <strong className="text-ink font-semibold">{stats.chars}</strong> chars
            </span>
            <span>•</span>
            <span>~{stats.readMinutes} min read</span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline text-ink-3">Press ⌘/Ctrl+Enter to save</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 rounded-xl border border-line bg-surface hover:bg-surface-2 text-ink text-[12.5px] font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="btn btn-primary h-9 px-5 text-[12.5px] font-semibold gap-1.5 shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : article ? 'Update Article' : 'Publish Article'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          IMAGE INSERTION MODAL
          ───────────────────────────────────────────────────────────── */}
      {showImageModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-surface border border-line rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-line pb-2.5">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-accent" />
                <h3 className="text-[14px] font-bold text-ink">Insert Image</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowImageModal(false)}
                className="text-ink-3 hover:text-ink"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[12px] font-semibold text-ink">Image Web URL (HTTPS)</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/images/guide-screenshot.png"
                  className="w-full h-9 px-3 rounded-lg border border-line bg-surface text-[13px] text-ink focus:outline-none focus:border-accent font-mono"
                  autoFocus
                />
              </div>

              <div className="space-y-1">
                <label className="text-[12px] font-semibold text-ink">Alt Text / Caption (Optional)</label>
                <input
                  type="text"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  placeholder="e.g. Dashboard Settings Panel"
                  className="w-full h-9 px-3 rounded-lg border border-line bg-surface text-[13px] text-ink focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
              <button
                type="button"
                onClick={() => setShowImageModal(false)}
                className="h-8.5 px-3 rounded-lg border border-line hover:bg-surface-2 text-[12px] text-ink font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!imageUrl.trim()}
                onClick={handleInsertImage}
                className="btn btn-primary h-8.5 px-4 text-[12px] font-semibold"
              >
                Insert into Article
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SHORTCUTS & TIPS POPUP
          ───────────────────────────────────────────────────────────── */}
      {showShortcutsModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-surface border border-line rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <Keyboard className="w-5 h-5 text-accent" />
                <h3 className="text-[15px] font-bold text-ink">Keyboard Shortcuts &amp; Markdown Tricks</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowShortcutsModal(false)}
                className="text-ink-3 hover:text-ink"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-[12.5px]">
              <div className="grid grid-cols-2 gap-2 text-ink">
                <div className="p-2.5 rounded-lg bg-surface-2/60 border border-line/60 flex items-center justify-between">
                  <span>Bold text</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-surface border border-line text-[11px] font-mono text-ink-2">Ctrl+B</kbd>
                </div>
                <div className="p-2.5 rounded-lg bg-surface-2/60 border border-line/60 flex items-center justify-between">
                  <span>Italic text</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-surface border border-line text-[11px] font-mono text-ink-2">Ctrl+I</kbd>
                </div>
                <div className="p-2.5 rounded-lg bg-surface-2/60 border border-line/60 flex items-center justify-between">
                  <span>Highlight text</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-surface border border-line text-[11px] font-mono text-ink-2">Ctrl+H</kbd>
                </div>
                <div className="p-2.5 rounded-lg bg-surface-2/60 border border-line/60 flex items-center justify-between">
                  <span>Insert Link</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-surface border border-line text-[11px] font-mono text-ink-2">Ctrl+K</kbd>
                </div>
                <div className="p-2.5 rounded-lg bg-surface-2/60 border border-line/60 flex items-center justify-between">
                  <span>Save Article</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-surface border border-line text-[11px] font-mono text-ink-2">Ctrl+Enter</kbd>
                </div>
                <div className="p-2.5 rounded-lg bg-surface-2/60 border border-line/60 flex items-center justify-between">
                  <span>Indent List</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-surface border border-line text-[11px] font-mono text-ink-2">Tab</kbd>
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-line/60">
                <h4 className="font-semibold text-ink text-[13px]">AquaFunded-Grade Article Features:</h4>
                <ul className="list-disc pl-5 space-y-1 text-ink-2 text-[12px]">
                  <li><strong className="text-ink">Highlighter:</strong> Wrap text with <code className="px-1 py-0.5 rounded bg-surface border border-line font-mono text-[11px]">==important figure==</code> or press <strong className="text-ink">Ctrl+H</strong>.</li>
                  <li><strong className="text-ink">Status Badges:</strong> Use <code className="px-1 py-0.5 rounded bg-surface border border-line font-mono text-[11px]">[badge:green:Active]</code> or <code className="px-1 py-0.5 rounded bg-surface border border-line font-mono text-[11px]">[badge:blue:90% Split]</code>.</li>
                  <li><strong className="text-ink">CTA Buttons:</strong> Use <code className="px-1 py-0.5 rounded bg-surface border border-line font-mono text-[11px]">[button:Get Funded](https://...)</code> to embed primary buttons.</li>
                  <li><strong className="text-ink">Callout Cards:</strong> Use <code className="px-1 py-0.5 rounded bg-surface border border-line font-mono text-[11px]">&gt; [!SUCCESS]</code> (green), <code className="px-1 py-0.5 rounded bg-surface border border-line font-mono text-[11px]">&gt; [!CTA]</code> (blue banner), <code className="px-1 py-0.5 rounded bg-surface border border-line font-mono text-[11px]">&gt; [!WARNING]</code> (amber), or <code className="px-1 py-0.5 rounded bg-surface border border-line font-mono text-[11px]">&gt; [!DANGER]</code> (red).</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-line">
              <button
                type="button"
                onClick={() => setShowShortcutsModal(false)}
                className="btn btn-primary h-8.5 px-4 text-[12px] font-semibold"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// REORDER ARTICLES MODAL COMPONENT
// ============================================================================
interface ReorderArticlesModalProps {
  workspaceId: string;
  section: HelpSection;
  articles: Article[];
  onClose: () => void;
  onSaved: (updatedSectionArticles: Article[]) => void;
}

function ReorderArticlesModal({
  workspaceId,
  section,
  articles,
  onClose,
  onSaved,
}: ReorderArticlesModalProps) {
  // Sort initially by order_index ascending, then created_at
  const [list, setList] = useState<Article[]>(() => {
    return [...articles].sort((a, b) => {
      const ao = a.order_index ?? 0;
      const bo = b.order_index ?? 0;
      if (ao !== bo) return ao - bo;
      return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
    });
  });

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Check if current order differs from initial
  const hasChanges = useMemo(() => {
    if (list.length !== articles.length) return true;
    return list.some((item, index) => item.id !== articles[index]?.id);
  }, [list, articles]);

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    const copy = [...list];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;
    setList(copy);
  };

  const handleMoveToTop = (index: number) => {
    if (index === 0) return;
    const copy = [...list];
    const [item] = copy.splice(index, 1);
    copy.unshift(item);
    setList(copy);
  };

  const handleMoveToBottom = (index: number) => {
    if (index === list.length - 1) return;
    const copy = [...list];
    const [item] = copy.splice(index, 1);
    copy.push(item);
    setList(copy);
  };

  const handleReset = () => {
    setList(
      [...articles].sort((a, b) => {
        const ao = a.order_index ?? 0;
        const bo = b.order_index ?? 0;
        if (ao !== bo) return ao - bo;
        return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
      })
    );
    setErrorMsg(null);
  };

  const handleSave = async () => {
    if (!workspaceId || list.length === 0) {
      onClose();
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    const updates = list.map((item, index) => ({
      id: item.id,
      order_index: index + 1,
    }));

    try {
      await reorderArticlesAction(workspaceId, updates);
      const updatedArticles = list.map((item, index) => ({
        ...item,
        order_index: index + 1,
      }));
      onSaved(updatedArticles);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save article order');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-surface border border-line rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="px-5 py-4 border-b border-line flex items-center justify-between bg-surface-2/60 shrink-0">
          <div className="flex items-center gap-3">
            <SectionIconPreview
              icon={section.icon}
              className="w-10 h-10 rounded-xl bg-surface border border-line shadow-xs text-[20px]"
              imgClassName="w-6 h-6 object-contain"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[16px] font-bold text-ink">Reorder Articles</h3>
                <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded-md bg-accent/10 text-accent border border-accent/20">
                  {section.name}
                </span>
              </div>
              <p className="text-[12px] text-ink-3">
                Change the sequence in which articles are displayed on help.business.com
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-surface-3 flex items-center justify-center text-ink-3 hover:text-ink transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-[12.5px] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="p-3.5 rounded-xl bg-accent-soft/30 border border-accent/20 flex items-start gap-2.5 text-[12.5px] text-ink-2">
            <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" />
            <span>
              Articles at the top appear first on your public Help Center and inside the widget. Use the <strong className="text-ink">Up</strong> and <strong className="text-ink">Down</strong> buttons to reorder.
            </span>
          </div>

          {list.length === 0 ? (
            <div className="py-12 text-center text-ink-3 text-[13px]">
              No articles found in this section.
            </div>
          ) : (
            <div className="space-y-2">
              {list.map((item, index) => {
                const isFirst = index === 0;
                const isLast = index === list.length - 1;
                const displayNum = String(index + 1).padStart(2, '0');

                return (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl border border-line bg-surface hover:bg-surface-2/60 transition-all flex items-center justify-between gap-3 shadow-2xs group"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 shrink-0">
                        <GripVertical className="w-4 h-4 text-ink-3/40 group-hover:text-ink-3 transition-colors" />
                        <span className="font-mono text-[12px] font-bold px-2 py-0.5 rounded-md bg-surface-2 border border-line text-accent">
                          #{displayNum}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className="text-[13.5px] font-semibold text-ink truncate">
                          {item.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-ink-3">
                          <span
                            className={cn(
                              'px-1.5 py-0.2 rounded font-medium',
                              item.status === 'published'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            )}
                          >
                            {item.status === 'published' ? 'Published' : 'Draft'}
                          </span>
                          {item.summary && (
                            <span className="truncate max-w-xs opacity-75">
                              • {item.summary}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Order Controls */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        disabled={isFirst}
                        onClick={() => handleMove(index, 'up')}
                        className="h-7.5 px-2 rounded-lg border border-line bg-surface hover:bg-surface-2 text-ink text-[12px] font-medium flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shadow-2xs"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5 text-accent" />
                        <span className="hidden sm:inline">Up</span>
                      </button>

                      <button
                        type="button"
                        disabled={isLast}
                        onClick={() => handleMove(index, 'down')}
                        className="h-7.5 px-2 rounded-lg border border-line bg-surface hover:bg-surface-2 text-ink text-[12px] font-medium flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shadow-2xs"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5 text-accent" />
                        <span className="hidden sm:inline">Down</span>
                      </button>

                      <button
                        type="button"
                        disabled={isFirst}
                        onClick={() => handleMoveToTop(index)}
                        className="h-7.5 w-7.5 rounded-lg border border-line bg-surface hover:bg-surface-2 text-ink-3 hover:text-ink flex items-center justify-center transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move to Top"
                      >
                        <span className="text-[11px] font-bold font-mono">⇈</span>
                      </button>

                      <button
                        type="button"
                        disabled={isLast}
                        onClick={() => handleMoveToBottom(index)}
                        className="h-7.5 w-7.5 rounded-lg border border-line bg-surface hover:bg-surface-2 text-ink-3 hover:text-ink flex items-center justify-center transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move to Bottom"
                      >
                        <span className="text-[11px] font-bold font-mono">⇊</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-line flex items-center justify-between bg-surface-2/40 shrink-0">
          <button
            type="button"
            onClick={handleReset}
            disabled={saving || !hasChanges}
            className="text-[12px] text-ink-3 hover:text-ink flex items-center gap-1 cursor-pointer font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Order</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-8.5 px-3.5 rounded-lg border border-line bg-surface text-ink text-[12.5px] font-medium hover:bg-surface-2 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="h-8.5 px-4 rounded-lg bg-accent text-accent-ink text-[12.5px] font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save & Apply Order'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// QUICK RENAME / EDIT SECTION MODAL
// ============================================================================
interface QuickRenameSectionModalProps {
  workspaceId: string;
  section: HelpSection;
  onClose: () => void;
  onUpdated: (updatedSection: HelpSection) => void;
  onDeleteRequest: (section: HelpSection) => void;
}

function QuickRenameSectionModal({
  workspaceId,
  section,
  onClose,
  onUpdated,
  onDeleteRequest,
}: QuickRenameSectionModalProps) {
  const [name, setName] = useState(section.name);
  const [description, setDescription] = useState(section.description || '');
  const [icon, setIcon] = useState(section.icon || '📚');
  const [orderIndex, setOrderIndex] = useState(section.order_index ?? 1);
  const [iconTab, setIconTab] = useState<'presets' | 'custom'>(
    section.icon && (section.icon.startsWith('http') || section.icon.startsWith('/'))
      ? 'custom'
      : 'presets'
  );
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingIcon(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.url) setIcon(data.url);
    } catch {
      setErrorMsg('Failed to upload icon image');
    } finally {
      setUploadingIcon(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Section name is required');
      return;
    }
    setSaving(true);
    setErrorMsg(null);
    try {
      const res = await updateHelpSectionAction(workspaceId, section.id, {
        name: name.trim(),
        description: description.trim(),
        icon: icon.trim() || '📚',
        order_index: orderIndex,
      });
      if (res.section) {
        onUpdated(res.section);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to rename section');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-surface border border-line rounded-2xl shadow-2xl max-w-lg w-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-line flex items-center justify-between bg-surface-2/50">
          <div>
            <h2 className="text-[16px] font-bold text-ink">Rename Section</h2>
            <p className="text-[11.5px] text-ink-3">
              Change section name, display order, or custom logo.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-surface-3 flex items-center justify-center text-ink-3 hover:text-ink transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[12px] font-medium">
              {errorMsg}
            </div>
          )}

          {/* Live Preview */}
          <div className="p-3 rounded-xl border border-line bg-surface-2/60 flex items-center gap-3">
            <SectionIconPreview
              icon={icon}
              className="w-11 h-11 rounded-xl text-[20px]"
              imgClassName="w-7 h-7"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-surface border border-line text-ink-3 shrink-0">
                  #{String(orderIndex > 0 ? orderIndex : 1).padStart(2, '0')}
                </span>
                <span className="text-[14px] font-bold text-ink truncate">
                  {name.trim() || 'Section Name'}
                </span>
              </div>
              <p className="text-[11.5px] text-ink-3 truncate mt-0.5">
                {description.trim() || 'Section description will appear here'}
              </p>
            </div>
            <span className="text-[10.5px] font-medium px-2 py-0.5 rounded bg-surface border border-line text-ink-3 shrink-0">
              Live Preview
            </span>
          </div>

          {/* Name & Order */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-3">
              <label className="text-[11.5px] font-semibold text-ink-2 block mb-1">
                Section Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Account Management, Rules, Payouts"
                required
                className="w-full h-9 px-3 rounded-lg border border-line bg-surface text-[13px] text-ink focus:outline-none focus:border-accent"
                autoFocus
              />
            </div>
            <div className="sm:col-span-1">
              <label className="text-[11.5px] font-semibold text-ink-2 block mb-1" title="Order Index">
                Section #
              </label>
              <input
                type="number"
                min={1}
                value={orderIndex || ''}
                onChange={(e) => setOrderIndex(Math.max(1, parseInt(e.target.value, 10) || 1))}
                placeholder="1, 2, 3..."
                className="w-full h-9 px-3 rounded-lg border border-line bg-surface text-[13px] font-mono text-ink focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-[11.5px] font-semibold text-ink-2 block mb-1">
              Short Description (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Understand guidelines, payout split, and account types"
              className="w-full h-9 px-3 rounded-lg border border-line bg-surface text-[13px] text-ink focus:outline-none focus:border-accent"
            />
          </div>

          {/* Icon Tabs */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-[11.5px] font-semibold text-ink-2">Section Icon / Logo</label>
              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-surface-2 border border-line text-[11px]">
                <button
                  type="button"
                  onClick={() => setIconTab('presets')}
                  className={`px-2 py-0.5 rounded font-medium transition-all ${
                    iconTab === 'presets'
                      ? 'bg-accent text-white shadow-xs'
                      : 'text-ink-3 hover:text-ink'
                  }`}
                >
                  Icon Presets
                </button>
                <button
                  type="button"
                  onClick={() => setIconTab('custom')}
                  className={`px-2 py-0.5 rounded font-medium transition-all ${
                    iconTab === 'custom'
                      ? 'bg-accent text-white shadow-xs'
                      : 'text-ink-3 hover:text-ink'
                  }`}
                >
                  Custom Logo / URL
                </button>
              </div>
            </div>

            {iconTab === 'presets' ? (
              <div className="p-3 rounded-xl border border-line bg-surface-2/40 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    className="w-14 h-8 px-2 text-center text-[18px] rounded-lg border border-line bg-surface focus:outline-none focus:border-accent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker((prev) => !prev)}
                    className="h-8 px-2.5 rounded-lg border border-line bg-surface hover:bg-surface-2 text-ink text-[11.5px] shrink-0 font-medium inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>😊</span>
                    <span>More Emojis</span>
                  </button>
                  {showEmojiPicker && (
                    <div className="absolute z-50 mt-10">
                      <EmojiPickerPopover
                        onSelect={(em) => {
                          setIcon(em);
                          setShowEmojiPicker(false);
                        }}
                        onClose={() => setShowEmojiPicker(false)}
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 pt-1">
                  {SECTION_ICON_GROUPS.map((grp) => (
                    <div key={grp.name} className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-ink-3 w-28 shrink-0 font-medium">
                        {grp.name}:
                      </span>
                      {grp.icons.map((em) => (
                        <button
                          key={em}
                          type="button"
                          onClick={() => setIcon(em)}
                          className={`w-6 h-6 rounded flex items-center justify-center text-[13px] transition-all cursor-pointer ${
                            icon === em ? 'bg-accent text-white scale-110' : 'hover:bg-surface'
                          }`}
                        >
                          {em}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl border border-line bg-surface-2/40 space-y-2.5">
                <div className="flex items-center gap-2">
                  <label className="h-8 px-3 rounded-lg border border-line bg-surface hover:bg-surface-2 text-ink text-[11.5px] font-medium inline-flex items-center gap-1.5 cursor-pointer shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingIcon ? 'Uploading…' : 'Upload Logo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploadingIcon}
                      onChange={handleUpload}
                      className="hidden"
                    />
                  </label>
                  <span className="text-[11px] text-ink-3">or paste image link:</span>
                </div>

                <input
                  type="url"
                  value={icon.startsWith('http') || icon.startsWith('/') ? icon : ''}
                  onChange={(e) => setIcon(e.target.value)}
                  placeholder="https://example.com/icon.svg"
                  className="w-full h-8 px-3 rounded-lg border border-line bg-surface text-[11.5px] text-ink focus:outline-none focus:border-accent"
                />
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-line flex items-center justify-between">
            <button
              type="button"
              onClick={() => onDeleteRequest(section)}
              className="text-[12px] text-rose-500 hover:text-rose-600 hover:underline flex items-center gap-1 cursor-pointer font-medium"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete this section</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="h-8 px-3 rounded-lg border border-line bg-surface text-ink text-[12px] font-medium hover:bg-surface-2 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || uploadingIcon}
                className="h-8 px-4 rounded-lg bg-accent text-accent-ink text-[12px] font-semibold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// DELETE SECTION CONFIRM MODAL
// ============================================================================
interface DeleteSectionConfirmModalProps {
  section: HelpSection;
  articleCount: number;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

function DeleteSectionConfirmModal({
  section,
  articleCount,
  isDeleting,
  onClose,
  onConfirm,
}: DeleteSectionConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-surface border border-line rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95">
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-[16px] font-bold text-ink">Delete Section?</h3>
              <p className="text-[12.5px] text-ink-3 mt-1">
                Are you sure you want to delete <strong className="text-ink">"{section.name}"</strong>?
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl border border-line bg-surface-2/60 space-y-2">
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-ink-3">Articles in this section:</span>
              <span className="font-bold text-ink">{articleCount}</span>
            </div>
            <p className="text-[11.5px] text-ink-3 leading-relaxed">
              {articleCount > 0 ? (
                <span>
                  Articles will <strong className="text-ink">NOT</strong> be deleted. Their section assignment will be cleared and they will remain accessible in your Help Center as general articles.
                </span>
              ) : (
                <span>This section has no articles and will be safely removed.</span>
              )}
            </p>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              disabled={isDeleting}
              onClick={onClose}
              className="h-8 px-3.5 rounded-lg border border-line bg-surface text-ink text-[12.5px] font-medium hover:bg-surface-2 transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isDeleting}
              onClick={onConfirm}
              className="h-8 px-4 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[12.5px] font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isDeleting ? 'Deleting...' : 'Delete Section'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SECTIONS MANAGER MODAL COMPONENT
// ============================================================================
interface SectionsManagerModalProps {
  workspaceId: string;
  sections: HelpSection[];
  initialEditingSection?: HelpSection | null;
  onClose: () => void;
  onSectionsChanged: () => void;
}

function SectionsManagerModal({
  workspaceId,
  sections,
  initialEditingSection,
  onClose,
  onSectionsChanged,
}: SectionsManagerModalProps) {
  const [sectionList, setSectionList] = useState<HelpSection[]>(sections);
  const [editingSec, setEditingSec] = useState<HelpSection | null>(null);

  useEffect(() => {
    setSectionList(sections);
  }, [sections]);

  useEffect(() => {
    if (initialEditingSection) {
      handleStartEdit(initialEditingSection);
    }
  }, [initialEditingSection]);

  const sortedSectionList = useMemo(() => {
    return [...sectionList].sort((a, b) => {
      const ao = a.order_index ?? 0;
      const bo = b.order_index ?? 0;
      if (ao !== bo) return ao - bo;
      return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
    });
  }, [sectionList]);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('📚');
  const [iconTab, setIconTab] = useState<'presets' | 'custom'>('presets');
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [orderIndex, setOrderIndex] = useState(sections.length + 1);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showSectionEmojiPicker, setShowSectionEmojiPicker] = useState(false);

  const handleStartEdit = (sec: HelpSection) => {
    setEditingSec(sec);
    setName(sec.name);
    setDescription(sec.description || '');
    setIcon(sec.icon || '📚');
    setOrderIndex(sec.order_index ?? 0);
    if (sec.icon && (sec.icon.startsWith('http') || sec.icon.startsWith('/'))) {
      setIconTab('custom');
    } else {
      setIconTab('presets');
    }
  };

  const handleResetForm = () => {
    setEditingSec(null);
    setName('');
    setDescription('');
    setIcon('📚');
    setIconTab('presets');
    setOrderIndex(sectionList.length + 1);
  };

  const handleUploadIcon = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingIcon(true);
    try {
      const uploadData = new FormData();
      uploadData.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadData,
      });
      const data = await res.json();
      if (data.url) {
        setIcon(data.url);
      }
    } catch {
      setErrorMsg('Failed to upload icon image');
    } finally {
      setUploadingIcon(false);
    }
  };

  const handleSaveSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Section name is required');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    try {
      if (editingSec?.id) {
        const res = await updateHelpSectionAction(workspaceId, editingSec.id, {
          name,
          description,
          icon,
          order_index: orderIndex,
        });
        if (res.section) {
          setSectionList((prev) =>
            prev.map((s) => (s.id === editingSec.id ? res.section : s))
          );
        }
      } else {
        const res = await createHelpSectionAction(workspaceId, {
          name,
          description,
          icon,
          order_index: orderIndex,
        });
        if (res.section) {
          setSectionList((prev) => [...prev, res.section]);
        }
      }
      handleResetForm();
      onSectionsChanged();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save section');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSection = async (secId: string, secName: string) => {
    if (!confirm(`Delete section "${secName}"? Articles in this section will be unassigned.`)) {
      return;
    }

    try {
      await deleteHelpSectionAction(workspaceId, secId);
      setSectionList((prev) => prev.filter((s) => s.id !== secId));
      onSectionsChanged();
    } catch (err: any) {
      alert(err.message || 'Failed to delete section');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-surface border border-line rounded-2xl shadow-2xl max-w-xl w-full max-h-[88vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-line flex items-center justify-between bg-surface-2/50">
          <div>
            <h2 className="text-[16px] font-bold text-ink">Manage Help Sections</h2>
            <p className="text-[11.5px] text-ink-3">
              Categories &amp; custom section icons/logos for your Help Center.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-surface-3 flex items-center justify-center text-ink-3 hover:text-ink transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Create / Edit Form */}
          <form onSubmit={handleSaveSection} className="p-4 rounded-xl border border-line bg-surface-2/60 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[12.5px] font-bold text-ink">
                {editingSec ? `Edit Section: ${editingSec.name}` : 'Add New Section'}
              </span>
              {editingSec && (
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="text-[11px] text-accent hover:underline cursor-pointer"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            {errorMsg && (
              <p className="text-[11.5px] text-rose-500 font-medium">{errorMsg}</p>
            )}

            {/* Live Section Preview Card */}
            <div className="p-3 rounded-xl border border-line bg-surface flex items-center gap-3">
              <SectionIconPreview
                icon={icon}
                className="w-11 h-11 rounded-xl text-[20px]"
                imgClassName="w-7 h-7"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-surface-2 border border-line text-ink-3 shrink-0">
                    #{String(orderIndex > 0 ? orderIndex : (sectionList.length + 1)).padStart(2, '0')}
                  </span>
                  <div className="text-[14px] font-bold text-ink truncate">
                    {name.trim() || 'Section Title Preview'}
                  </div>
                </div>
                <div className="text-[11.5px] text-ink-3 truncate mt-0.5">
                  {description.trim() || 'Short description preview will appear here'}
                </div>
              </div>
              <span className="text-[10.5px] font-medium px-2 py-0.5 rounded bg-surface-2 border border-line text-ink-3">
                Live Preview
              </span>
            </div>

            {/* Section Name & Description */}
            <div className="space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                <div className="sm:col-span-3">
                  <label className="text-[11px] font-semibold text-ink-2">Section Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Account Types, Withdrawals, Risk Limits"
                    className="w-full h-8 px-3 rounded-lg border border-line bg-surface text-[12.5px] text-ink focus:outline-none focus:border-accent"
                  />
                </div>
                <div className="sm:col-span-1">
                  <label className="text-[11px] font-semibold text-ink-2" title="Display Order Number">
                    Section #
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={orderIndex || ''}
                    onChange={(e) => setOrderIndex(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    placeholder="1, 2, 3..."
                    className="w-full h-8 px-3 rounded-lg border border-line bg-surface text-[12.5px] font-mono text-ink focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-ink-2">Short Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Learn about live accounts, funded steps, and payout rules"
                  className="w-full h-8 px-3 rounded-lg border border-line bg-surface text-[12.5px] text-ink focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            {/* Section Icon / Logo Picker Tabs */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-ink-2">Section Icon / Logo</label>
                <div className="flex items-center gap-1 p-0.5 rounded-lg bg-surface border border-line text-[11px]">
                  <button
                    type="button"
                    onClick={() => setIconTab('presets')}
                    className={`px-2 py-0.5 rounded font-medium transition-all ${
                      iconTab === 'presets'
                        ? 'bg-accent text-white shadow-xs'
                        : 'text-ink-3 hover:text-ink'
                    }`}
                  >
                    Icon Presets
                  </button>
                  <button
                    type="button"
                    onClick={() => setIconTab('custom')}
                    className={`px-2 py-0.5 rounded font-medium transition-all ${
                      iconTab === 'custom'
                        ? 'bg-accent text-white shadow-xs'
                        : 'text-ink-3 hover:text-ink'
                    }`}
                  >
                    Custom Logo / URL
                  </button>
                </div>
              </div>

              {iconTab === 'presets' ? (
                <div className="p-2.5 rounded-xl border border-line bg-surface space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={icon}
                      onChange={(e) => setIcon(e.target.value)}
                      className="w-16 h-8 px-2 text-center text-[17px] rounded-lg border border-line bg-surface-2 focus:outline-none focus:border-accent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSectionEmojiPicker((prev) => !prev)}
                      className="h-8 px-2.5 rounded-lg border border-line bg-surface hover:bg-surface-2 text-ink text-[11.5px] shrink-0 font-medium inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>😊</span>
                      <span>More Emojis</span>
                    </button>
                    {showSectionEmojiPicker && (
                      <div className="absolute left-10 z-50">
                        <EmojiPickerPopover
                          onSelect={(em) => {
                            setIcon(em);
                            setShowSectionEmojiPicker(false);
                          }}
                          onClose={() => setShowSectionEmojiPicker(false)}
                        />
                      </div>
                    )}
                  </div>

                  {/* Categorized Icon Presets */}
                  <div className="space-y-1.5 pt-1">
                    {SECTION_ICON_GROUPS.map((grp) => (
                      <div key={grp.name} className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] text-ink-3 w-28 shrink-0 font-medium">
                          {grp.name}:
                        </span>
                        {grp.icons.map((em) => (
                          <button
                            key={em}
                            type="button"
                            onClick={() => setIcon(em)}
                            className={`w-6 h-6 rounded flex items-center justify-center text-[13px] transition-all cursor-pointer ${
                              icon === em ? 'bg-accent text-white scale-110' : 'hover:bg-surface-2'
                            }`}
                          >
                            {em}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Custom Logo / Image URL or Upload */
                <div className="p-3 rounded-xl border border-line bg-surface space-y-2.5">
                  <div className="flex items-center gap-2">
                    <label className="h-8 px-3 rounded-lg border border-line bg-surface hover:bg-surface-2 text-ink text-[11.5px] font-medium inline-flex items-center gap-1.5 cursor-pointer shrink-0">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploadingIcon ? 'Uploading…' : 'Upload Section Logo'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploadingIcon}
                        onChange={handleUploadIcon}
                        className="hidden"
                      />
                    </label>
                    <span className="text-[11px] text-ink-3">or paste image link:</span>
                  </div>

                  <input
                    type="url"
                    value={icon.startsWith('http') || icon.startsWith('/') ? icon : ''}
                    onChange={(e) => setIcon(e.target.value)}
                    placeholder="https://example.com/section-icon.png"
                    className="w-full h-8 px-3 rounded-lg border border-line bg-surface text-[11.5px] text-ink focus:outline-none focus:border-accent"
                  />
                  <p className="text-[10.5px] text-ink-3">
                    Supports SVG, PNG, WebP, JPG. Displays directly on the section card in your Help Center.
                  </p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting || uploadingIcon}
              className="w-full h-8 px-4 rounded-lg bg-accent text-accent-ink text-[12px] font-semibold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Saving...' : editingSec ? 'Update Section' : '+ Add Section'}
            </button>
          </form>

          {/* Current Sections List */}
          <div className="space-y-2">
            <span className="text-[12px] font-semibold text-ink uppercase tracking-wider">
              Existing Sections ({sortedSectionList.length})
            </span>

            {sortedSectionList.length === 0 ? (
              <p className="text-[12px] text-ink-3 italic">No sections created yet.</p>
            ) : (
              <div className="border border-line rounded-xl divide-y divide-line/80 overflow-hidden bg-surface">
                {sortedSectionList.map((sec, idx) => {
                  const displayNum = String(
                    sec.order_index && sec.order_index > 0 ? sec.order_index : idx + 1
                  ).padStart(2, '0');
                  return (
                    <div
                      key={sec.id}
                      className="p-3 flex items-center justify-between gap-3 hover:bg-surface-2/50 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-surface-2 border border-line text-ink-3 shrink-0">
                          #{displayNum}
                        </span>
                        <SectionIconPreview
                          icon={sec.icon}
                          className="w-8 h-8 rounded-lg text-[16px]"
                          imgClassName="w-5 h-5"
                        />
                        <div className="min-w-0">
                          <div className="text-[13px] font-semibold text-ink truncate">{sec.name}</div>
                          {sec.description && (
                            <div className="text-[11.5px] text-ink-3 truncate">{sec.description}</div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(sec)}
                          className="h-7 px-2.5 rounded-lg border border-line bg-surface hover:bg-surface-2 text-ink text-[11.5px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                          title="Rename or edit section"
                        >
                          <Edit2 className="w-3 h-3 text-accent" />
                          <span>Rename</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteSection(sec.id, sec.name)}
                          className="h-7 px-2.5 rounded-lg border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/15 text-rose-600 dark:text-rose-400 text-[11.5px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                          title="Delete section"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-line flex items-center justify-end bg-surface-2/40">
          <button
            onClick={onClose}
            className="h-8 px-4 rounded-lg bg-surface border border-line text-ink text-[12px] font-medium hover:bg-surface-2 transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function SimpleMarkdownRenderer({ content }: { content: string }) {
  return <MarkdownArticleContent content={content} />;
}

// ============================================================================
// WIDGET TAB SETTINGS MODAL COMPONENT (Rename & Customize Tab on Website)
// ============================================================================
interface WidgetTabSettingsModalProps {
  workspace: Workspace;
  onClose: () => void;
  onUpdated: (ws: Workspace) => void;
}

function WidgetTabSettingsModal({
  workspace,
  onClose,
  onUpdated,
}: WidgetTabSettingsModalProps) {
  const [tabLabel, setTabLabel] = useState(workspace.help_center_tab_label || 'Help');
  const [showTab, setShowTab] = useState(workspace.show_help_tab !== false);
  const [tabIcon, setTabIcon] = useState(workspace.help_center_tab_icon || '📖');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const SUGGESTED_NAMES = [
    'Help',
    'Help Center',
    'Knowledge Base',
    'Guides',
    'FAQs',
    'Support Docs',
    'Madad',
    'Docs',
    'Resources',
  ];

  const TAB_ICONS = ['📖', '📚', '💡', '❓', '🔍', '🎧', '⚡', '🤖', '🤝', '📌'];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tabLabel.trim()) {
      setErrorMsg('Please enter a tab name');
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    try {
      const res = await updateHelpTabSettingsAction(workspace.id, {
        label: tabLabel.trim(),
        showTab,
        icon: tabIcon,
      });
      if (res.workspace) {
        onUpdated(res.workspace);
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update widget tab settings');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-surface border border-line rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-line flex items-center justify-between bg-surface-2/50">
          <div>
            <h2 className="text-[16px] font-bold text-ink">Customize Website Widget Tab</h2>
            <p className="text-[11.5px] text-ink-3">
              Rename the Help tab, select icon, and control visibility on your website.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-surface-3 flex items-center justify-center text-ink-3 hover:text-ink transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-[12px] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Visibility Switch */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-line bg-surface-2/40">
            <div>
              <div className="text-[13px] font-semibold text-ink">Show Tab on Website Widget</div>
              <div className="text-[11.5px] text-ink-3">
                Toggle whether visitors can browse articles in the chat launcher.
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showTab}
                onChange={(e) => setShowTab(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-surface-3 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-line after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
            </label>
          </div>

          {/* Tab Label Name Input */}
          <div className="space-y-2">
            <label className="text-[12px] font-semibold text-ink-2">
              Tab Label Name <span className="font-normal text-ink-3">(Displayed to visitors)</span>
            </label>
            <input
              type="text"
              value={tabLabel}
              onChange={(e) => setTabLabel(e.target.value)}
              placeholder="e.g. Help Center, FAQs, Guides, Madad..."
              className="w-full h-10 px-3 rounded-xl border border-line bg-surface text-[13.5px] text-ink focus:outline-none focus:border-accent"
            />

            {/* Quick Suggestions */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[10.5px] text-ink-3">Presets:</span>
              {SUGGESTED_NAMES.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setTabLabel(name)}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors border ${
                    tabLabel === name
                      ? 'bg-accent text-accent-ink border-accent'
                      : 'bg-surface-2 border-line text-ink-2 hover:bg-surface-3 hover:text-ink'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Icon Selection */}
          <div className="space-y-1.5">
            <label className="text-[12px] font-semibold text-ink-2">Tab Icon</label>
            <div className="flex items-center gap-1.5 flex-wrap">
              {TAB_ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setTabIcon(icon)}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-[18px] transition-transform border ${
                    tabIcon === icon
                      ? 'border-accent bg-accent/10 scale-110 shadow-xs'
                      : 'border-line bg-surface hover:bg-surface-2'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Live Visitor Preview */}
          <div className="p-3.5 rounded-xl border border-line bg-surface-2/60 space-y-2">
            <span className="text-[11px] font-bold text-ink-3 uppercase tracking-wider block">
              Live Visitor Preview (Widget Bottom Bar)
            </span>
            <div className="bg-surface rounded-xl border border-line p-2 flex items-center justify-around shadow-sm max-w-xs mx-auto">
              <div className="flex flex-col items-center gap-0.5 text-slate-400 text-[10.5px]">
                <span className="text-[14px]">🏠</span>
                <span>Home</span>
              </div>
              <div className="flex flex-col items-center gap-0.5 text-slate-400 text-[10.5px]">
                <span className="text-[14px]">💬</span>
                <span>Messages</span>
              </div>
              <div className={`flex flex-col items-center gap-0.5 font-bold text-[10.5px] ${showTab ? 'text-blue-600 dark:text-blue-400 scale-105' : 'opacity-30 line-through'}`}>
                <span className="text-[14px]">{tabIcon}</span>
                <span>{tabLabel || 'Help'}</span>
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-line">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 rounded-xl border border-line bg-surface hover:bg-surface-2 text-ink text-[12.5px] font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="h-9 px-5 rounded-xl bg-accent text-accent-ink hover:opacity-90 text-[12.5px] font-semibold transition-all shadow-xs disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save & Update Widget'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
