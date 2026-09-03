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
} from 'lucide-react';
import { Agent, Article, HelpSection, Workspace } from '@/types/database';
import { EmojiPickerPopover } from '@/components/dashboard/EmojiPickerPopover';
import { MarkdownArticleContent } from '@/components/dashboard/MarkdownArticleContent';
import {
  getHelpDeskDataAction,
  createHelpSectionAction,
  updateHelpSectionAction,
  deleteHelpSectionAction,
  createArticleAction,
  updateArticleAction,
  deleteArticleAction,
  toggleArticleStatusAction,
  updateHelpTabSettingsAction,
} from '@/app/actions/helpdesk';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';

interface HelpDeskDashboardProps {
  workspace: Workspace | null;
  currentAgent: Agent | null;
  onArticlesCountChange?: (count: number) => void;
}

const COMMON_EMOJIS = ['🚀', '💳', '⚙️', '📦', '🔒', '💡', '❓', '📖', '🛠️', '🎯', '📱', '🔔'];

export function HelpDeskDashboard({
  workspace,
  currentAgent,
  onArticlesCountChange,
}: HelpDeskDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState<HelpSection[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [metrics, setMetrics] = useState({
    totalArticles: 0,
    publishedCount: 0,
    draftCount: 0,
    totalViews: 0,
    totalHelpful: 0,
    totalNotHelpful: 0,
    helpfulRate: 100,
  });

  // Filter and search state
  const [selectedSectionId, setSelectedSectionId] = useState<string | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'published' | 'draft'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isArticleModalOpen, setIsArticleModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<HelpSection | null>(null);
  const [isTabSettingsModalOpen, setIsTabSettingsModalOpen] = useState(false);
  const [workspaceState, setWorkspaceState] = useState<Workspace | null>(workspace);

  useEffect(() => {
    setWorkspaceState(workspace);
  }, [workspace]);

  // Status feedback toast
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

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
      setMetrics(data.metrics);
      onArticlesCountChange?.(data.metrics.totalArticles);
    } catch (err: any) {
      showToast(err.message || 'Failed to load Help Desk data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHelpDeskData();
  }, [workspace?.id]);

  // Filtered Articles
  const filteredArticles = useMemo(() => {
    return articles.filter((art) => {
      if (selectedSectionId !== 'all' && art.section_id !== selectedSectionId) {
        return false;
      }
      if (selectedStatus !== 'all' && art.status !== selectedStatus) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = art.title.toLowerCase().includes(q);
        const matchesSummary = art.summary?.toLowerCase().includes(q);
        const matchesContent = art.content.toLowerCase().includes(q);
        const matchesCategory = art.category?.toLowerCase().includes(q);
        return matchesTitle || matchesSummary || matchesContent || matchesCategory;
      }
      return true;
    });
  }, [articles, selectedSectionId, selectedStatus, searchQuery]);

  const handleToggleStatus = async (article: Article) => {
    if (!workspace?.id) return;
    const nextStatus = article.status === 'published' ? 'draft' : 'published';
    try {
      const res = await toggleArticleStatusAction(workspace.id, article.id, nextStatus);
      if (res.article) {
        setArticles((prev) => prev.map((a) => (a.id === article.id ? res.article : a)));
        showToast(
          `Article ${nextStatus === 'published' ? 'published to help center!' : 'saved as draft.'}`
        );
        loadHelpDeskData();
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
      showToast('Article deleted successfully');
      loadHelpDeskData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete article', 'error');
    }
  };

  const handleOpenPublicHelpCenter = () => {
    if (!workspace?.id) return;
    window.open(`/help/${workspace.id}`, '_blank');
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
          <div className="flex items-center gap-2">
            <h1 className="text-[20px] font-bold text-ink tracking-tight">Help Desk &amp; Knowledge Base</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent-soft text-accent uppercase tracking-wider">
              Intercom Style
            </span>
          </div>
          <p className="text-[12.5px] text-ink-3 mt-0.5">
            Empower your customers with self-service help sections and search-ready articles.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleOpenPublicHelpCenter}
            className="h-9 px-3.5 rounded-lg border border-line bg-surface-2 hover:bg-surface hover:border-ink-3/40 text-ink text-[12.5px] font-medium flex items-center gap-1.5 transition-all shadow-xs"
            title="Open hosted public help center"
          >
            <ExternalLink className="w-3.5 h-3.5 text-ink-3" />
            <span>View Public Help Center</span>
          </button>

          <button
            onClick={() => {
              setEditingSection(null);
              setIsSectionModalOpen(true);
            }}
            className="h-9 px-3.5 rounded-lg border border-line bg-surface-2 hover:bg-surface hover:border-ink-3/40 text-ink text-[12.5px] font-medium flex items-center gap-1.5 transition-all shadow-xs"
          >
            <Layers className="w-3.5 h-3.5 text-accent" />
            <span>Manage Sections</span>
          </button>

          <button
            onClick={() => setIsTabSettingsModalOpen(true)}
            className="h-9 px-3.5 rounded-lg border border-line bg-surface-2 hover:bg-surface hover:border-ink-3/40 text-ink text-[12.5px] font-medium flex items-center gap-1.5 transition-all shadow-xs"
            title="Rename and customize the Help tab on your website widget"
          >
            <Settings className="w-3.5 h-3.5 text-accent" />
            <span>
              Widget Tab: <strong className="text-accent font-semibold">{workspaceState?.help_center_tab_label || 'Help'}</strong>
            </span>
          </button>

          <button
            onClick={() => {
              setEditingArticle(null);
              setIsArticleModalOpen(true);
            }}
            className="h-9 px-4 rounded-lg bg-accent text-accent-ink hover:opacity-90 text-[13px] font-semibold flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Article</span>
          </button>
        </div>
      </header>

      <main className="p-8 space-y-6 max-w-7xl mx-auto w-full">
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
            <div className="text-[26px] font-bold text-ink mt-2">{metrics.helpfulRate}%</div>
            <div className="text-[11.5px] text-ink-3 mt-1 flex items-center gap-2">
              <span>👍 {metrics.totalHelpful} positive</span>
              <span>•</span>
              <span>👎 {metrics.totalNotHelpful} unhelpful</span>
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

              {sections.map((sec) => (
                <button
                  key={sec.id}
                  onClick={() => setSelectedSectionId(sec.id)}
                  className={cn(
                    'h-8 px-3 rounded-lg text-[12.5px] font-medium transition-all whitespace-nowrap flex items-center gap-1.5 border border-transparent',
                    selectedSectionId === sec.id
                      ? 'bg-accent text-accent-ink shadow-xs'
                      : 'bg-surface-2 text-ink-2 hover:bg-surface-3 hover:text-ink'
                  )}
                >
                  <span>{sec.icon || '📚'}</span>
                  <span>{sec.name}</span>
                  <span className="text-[11px] opacity-75">({sec.article_count || 0})</span>
                </button>
              ))}

              <button
                onClick={() => {
                  setEditingSection(null);
                  setIsSectionModalOpen(true);
                }}
                className="h-8 px-2.5 rounded-lg border border-dashed border-line text-[12px] text-ink-3 hover:text-accent hover:border-accent flex items-center gap-1 transition-all whitespace-nowrap"
              >
                <Plus className="w-3 h-3" />
                <span>Add Section</span>
              </button>
            </div>
          </div>

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

                        {article.section ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-surface-2 text-ink-2 border border-line/60">
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
      </main>

      {/* ARTICLE EDITOR MODAL */}
      {isArticleModalOpen && (
        <ArticleEditorModal
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
          onClose={() => setIsSectionModalOpen(false)}
          onSectionsChanged={() => {
            loadHelpDeskData();
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
  workspaceId: string;
  sections: HelpSection[];
  article: Article | null;
  onClose: () => void;
  onSaved: (article: Article) => void;
}

function ArticleEditorModal({
  workspaceId,
  sections,
  article,
  onClose,
  onSaved,
}: ArticleEditorModalProps) {
  const [title, setTitle] = useState(article?.title || '');
  const [sectionId, setSectionId] = useState<string>(article?.section_id || sections[0]?.id || '');
  const [summary, setSummary] = useState(article?.summary || '');
  const [content, setContent] = useState(article?.content || '');
  const [status, setStatus] = useState<'published' | 'draft'>(article?.status || 'published');
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [showContentEmojiPicker, setShowContentEmojiPicker] = useState(false);
  const [showTitleEmojiPicker, setShowTitleEmojiPicker] = useState(false);

  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const insertMarkdown = (prefix: string, suffix: string = '') => {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = el.value;
    const selected = text.substring(start, end) || 'text';
    const replacement = `${prefix}${selected}${suffix}`;

    setContent(text.substring(0, start) + replacement + text.substring(end));
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    }, 50);
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
    }, 50);
  };

  const handleSave = async () => {
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
          section_id: sectionId || null,
          summary,
          content,
          status,
        });
        if (res.article) onSaved(res.article);
      } else {
        const res = await createArticleAction(workspaceId, {
          title,
          section_id: sectionId || null,
          summary,
          content,
          status,
        });
        if (res.article) onSaved(res.article);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save article');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-surface border border-line rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-line flex items-center justify-between bg-surface-2/50">
          <div>
            <h2 className="text-[16px] font-bold text-ink">
              {article ? 'Edit Knowledge Base Article' : 'Author New Help Article'}
            </h2>
            <p className="text-[11.5px] text-ink-3">
              Write rich guides, FAQs, and solutions formatted for customers & AI.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-surface-3 flex items-center justify-center text-ink-3 hover:text-ink transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-[12px] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Title & Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2 space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11.5px] font-semibold text-ink-2">Article Title</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowTitleEmojiPicker((prev) => !prev)}
                    className="text-[11px] text-accent hover:underline flex items-center gap-1"
                  >
                    <Smile className="w-3.5 h-3.5" />
                    <span>Insert Emoji</span>
                  </button>
                  {showTitleEmojiPicker && (
                    <div className="absolute right-0 top-6 z-50">
                      <EmojiPickerPopover
                        onSelect={(em) => setTitle((prev) => (prev ? `${prev} ${em}` : `${em} `))}
                        onClose={() => setShowTitleEmojiPicker(false)}
                      />
                    </div>
                  )}
                </div>
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. 🚀 How to install the chat widget on WordPress"
                className="w-full h-9.5 px-3 rounded-lg border border-line bg-surface text-[13px] text-ink focus:outline-none focus:border-accent"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11.5px] font-semibold text-ink-2">Section / Category</label>
              <select
                value={sectionId}
                onChange={(e) => setSectionId(e.target.value)}
                className="w-full h-9.5 px-2.5 rounded-lg border border-line bg-surface text-[13px] text-ink focus:outline-none focus:border-accent"
              >
                <option value="">(No Section)</option>
                {sections.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.icon} {sec.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Excerpt / Summary */}
          <div className="space-y-1">
            <label className="text-[11.5px] font-semibold text-ink-2">
              Short Summary <span className="font-normal text-ink-3">(Search result snippet)</span>
            </label>
            <input
              type="text"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Brief summary shown in search results and cards..."
              className="w-full h-9 px-3 rounded-lg border border-line bg-surface text-[13px] text-ink focus:outline-none focus:border-accent"
            />
          </div>

          {/* Status Switcher */}
          <div className="flex items-center gap-4 p-3 rounded-xl bg-surface-2/60 border border-line/70">
            <span className="text-[12px] font-semibold text-ink">Publish Status:</span>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 cursor-pointer text-[12.5px] text-ink">
                <input
                  type="radio"
                  name="status"
                  value="published"
                  checked={status === 'published'}
                  onChange={() => setStatus('published')}
                  className="text-accent"
                />
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  Published (Live)
                </span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer text-[12.5px] text-ink ml-3">
                <input
                  type="radio"
                  name="status"
                  value="draft"
                  checked={status === 'draft'}
                  onChange={() => setStatus('draft')}
                  className="text-accent"
                />
                <span className="font-medium text-amber-600 dark:text-amber-400">
                  Draft (Team only)
                </span>
              </label>
            </div>
          </div>

          {/* Content Editor with Toolbar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11.5px] font-semibold text-ink-2">
                Article Content (Rich Markdown with Emojis &amp; Callouts)
              </label>
              <div className="flex items-center gap-1 bg-surface-2 rounded-lg p-0.5 border border-line">
                <button
                  type="button"
                  onClick={() => setActiveTab('write')}
                  className={cn(
                    'px-3 py-1 rounded text-[11px] font-semibold transition-all',
                    activeTab === 'write' ? 'bg-surface text-ink shadow-xs' : 'text-ink-3 hover:text-ink'
                  )}
                >
                  Write
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className={cn(
                    'px-3 py-1 rounded text-[11px] font-semibold transition-all',
                    activeTab === 'preview' ? 'bg-surface text-ink shadow-xs' : 'text-ink-3 hover:text-ink'
                  )}
                >
                  Preview
                </button>
              </div>
            </div>

            {activeTab === 'write' ? (
              <div className="border border-line rounded-xl overflow-hidden focus-within:border-accent">
                {/* Advanced Formatting Toolbar */}
                <div className="flex items-center gap-1 px-2.5 py-2 bg-surface-2 border-b border-line flex-wrap text-ink-2">
                  {/* Headings */}
                  <div className="flex items-center gap-0.5 bg-surface rounded-lg p-0.5 border border-line/60">
                    <button
                      type="button"
                      onClick={() => insertMarkdown('\n# ', '\n')}
                      className="h-7 px-1.5 rounded hover:bg-surface-2 text-[11px] font-bold text-ink hover:text-accent flex items-center gap-0.5"
                      title="Heading 1"
                    >
                      <Heading1 className="w-3.5 h-3.5" />
                      <span>H1</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown('\n## ', '\n')}
                      className="h-7 px-1.5 rounded hover:bg-surface-2 text-[11px] font-bold text-ink hover:text-accent flex items-center gap-0.5"
                      title="Heading 2"
                    >
                      <Heading2 className="w-3.5 h-3.5" />
                      <span>H2</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown('\n### ', '\n')}
                      className="h-7 px-1.5 rounded hover:bg-surface-2 text-[11px] font-bold text-ink hover:text-accent flex items-center gap-0.5"
                      title="Heading 3"
                    >
                      <Heading3 className="w-3.5 h-3.5" />
                      <span>H3</span>
                    </button>
                  </div>

                  {/* Text Formatting */}
                  <div className="flex items-center gap-0.5 bg-surface rounded-lg p-0.5 border border-line/60">
                    <button
                      type="button"
                      onClick={() => insertMarkdown('**', '**')}
                      className="h-7 w-7 rounded hover:bg-surface-2 flex items-center justify-center font-bold text-ink hover:text-accent"
                      title="Bold (**text**)"
                    >
                      <Bold className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown('*', '*')}
                      className="h-7 w-7 rounded hover:bg-surface-2 flex items-center justify-center italic text-ink hover:text-accent"
                      title="Italic (*text*)"
                    >
                      <Italic className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown('~~', '~~')}
                      className="h-7 w-7 rounded hover:bg-surface-2 flex items-center justify-center text-ink hover:text-accent"
                      title="Strikethrough (~~text~~)"
                    >
                      <Strikethrough className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown('`', '`')}
                      className="h-7 w-7 rounded hover:bg-surface-2 flex items-center justify-center font-mono text-[11px] text-ink hover:text-accent"
                      title="Inline Code (`code`)"
                    >
                      <Code className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Lists & Tasks */}
                  <div className="flex items-center gap-0.5 bg-surface rounded-lg p-0.5 border border-line/60">
                    <button
                      type="button"
                      onClick={() => insertMarkdown('\n- ')}
                      className="h-7 w-7 rounded hover:bg-surface-2 flex items-center justify-center text-ink hover:text-accent"
                      title="Bullet List (- item)"
                    >
                      <List className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown('\n1. ')}
                      className="h-7 w-7 rounded hover:bg-surface-2 flex items-center justify-center text-ink hover:text-accent"
                      title="Numbered List (1. item)"
                    >
                      <ListOrdered className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertText('\n- [ ] ')}
                      className="h-7 w-7 rounded hover:bg-surface-2 flex items-center justify-center text-ink hover:text-accent"
                      title="Checklist Task (- [ ] item)"
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Callouts (Intercom / GitHub Style) */}
                  <div className="flex items-center gap-0.5 bg-surface rounded-lg p-0.5 border border-line/60">
                    <button
                      type="button"
                      onClick={() => insertText('\n> [!NOTE]\n> Add important guidance or notice here...\n\n')}
                      className="h-7 px-1.5 rounded hover:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[11px] font-semibold flex items-center gap-1"
                      title="Info Note Box"
                    >
                      <Lightbulb className="w-3.5 h-3.5" />
                      <span>Note</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => insertText('\n> [!TIP]\n> Pro-tip or best practice recommendation...\n\n')}
                      className="h-7 px-1.5 rounded hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold flex items-center gap-1"
                      title="Pro-Tip Box"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Tip</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => insertText('\n> [!WARNING]\n> Caution: Make sure you do not skip this step...\n\n')}
                      className="h-7 px-1.5 rounded hover:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px] font-semibold flex items-center gap-1"
                      title="Warning Box"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Warn</span>
                    </button>
                  </div>

                  {/* Blocks & Extras */}
                  <div className="flex items-center gap-0.5 bg-surface rounded-lg p-0.5 border border-line/60">
                    <button
                      type="button"
                      onClick={() => insertMarkdown('\n> ')}
                      className="h-7 w-7 rounded hover:bg-surface-2 flex items-center justify-center text-ink hover:text-accent"
                      title="Blockquote (> quote)"
                    >
                      <Quote className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertText('\n| Column 1 | Column 2 | Column 3 |\n|:---|:---|:---|\n| Feature A | Starter plan | Included |\n| Feature B | Pro plan | Optional |\n\n')}
                      className="h-7 w-7 rounded hover:bg-surface-2 flex items-center justify-center text-ink hover:text-accent"
                      title="Insert Table"
                    >
                      <TableIcon className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertText('\n```javascript\n// Code snippet\nconst app = new ChatifyClient();\n```\n\n')}
                      className="h-7 px-1.5 rounded hover:bg-surface-2 text-[11px] font-mono text-ink hover:text-accent flex items-center gap-1"
                      title="Code Block"
                    >
                      <span>```</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => insertText('\n---\n\n')}
                      className="h-7 w-7 rounded hover:bg-surface-2 flex items-center justify-center text-ink hover:text-accent"
                      title="Horizontal Divider (---)"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown('[', '](https://example.com)')}
                      className="h-7 w-7 rounded hover:bg-surface-2 flex items-center justify-center text-ink hover:text-accent"
                      title="Insert Link ([text](url))"
                    >
                      <Link2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Emoji Picker Button */}
                  <div className="relative ml-auto">
                    <button
                      type="button"
                      onClick={() => setShowContentEmojiPicker((prev) => !prev)}
                      className="h-7 px-2.5 rounded-lg bg-accent/10 border border-accent/20 hover:bg-accent/20 text-accent text-[11.5px] font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                      title="Insert Emoji"
                    >
                      <Smile className="w-3.5 h-3.5" />
                      <span>😊 Emojis</span>
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

                <textarea
                  ref={textareaRef}
                  rows={12}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write comprehensive article steps, tips, and guidelines here... Full Markdown & Emojis supported."
                  className="w-full p-4 bg-surface text-[13px] text-ink placeholder:text-ink-3 focus:outline-none resize-y font-mono leading-relaxed"
                />
              </div>
            ) : (
              <div className="border border-line rounded-xl p-5 bg-surface min-h-[260px] max-h-[420px] overflow-y-auto leading-relaxed shadow-inner">
                {content.trim() ? (
                  <MarkdownArticleContent content={content} />
                ) : (
                  <p className="text-ink-3 italic text-[13px]">Nothing to preview yet. Switch to Write tab to add content.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-line flex items-center justify-end gap-2.5 bg-surface-2/40">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 rounded-lg border border-line bg-surface hover:bg-surface-2 text-ink text-[12.5px] font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="h-9 px-5 rounded-lg bg-accent text-accent-ink hover:opacity-90 text-[12.5px] font-semibold transition-all shadow-xs disabled:opacity-50"
          >
            {saving ? 'Saving...' : article ? 'Update Article' : 'Publish Article'}
          </button>
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
  onClose: () => void;
  onSectionsChanged: () => void;
}

function SectionsManagerModal({
  workspaceId,
  sections,
  onClose,
  onSectionsChanged,
}: SectionsManagerModalProps) {
  const [sectionList, setSectionList] = useState<HelpSection[]>(sections);
  const [editingSec, setEditingSec] = useState<HelpSection | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('📚');
  const [orderIndex, setOrderIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showSectionEmojiPicker, setShowSectionEmojiPicker] = useState(false);

  const handleStartEdit = (sec: HelpSection) => {
    setEditingSec(sec);
    setName(sec.name);
    setDescription(sec.description || '');
    setIcon(sec.icon || '📚');
    setOrderIndex(sec.order_index ?? 0);
  };

  const handleResetForm = () => {
    setEditingSec(null);
    setName('');
    setDescription('');
    setIcon('📚');
    setOrderIndex(sectionList.length + 1);
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
      <div className="bg-surface border border-line rounded-2xl shadow-2xl max-w-xl w-full max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-line flex items-center justify-between bg-surface-2/50">
          <div>
            <h2 className="text-[16px] font-bold text-ink">Manage Help Sections</h2>
            <p className="text-[11.5px] text-ink-3">
              Categories help organize your guides for visitors &amp; AI answers.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-surface-3 flex items-center justify-center text-ink-3 hover:text-ink transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Create / Edit Form */}
          <form onSubmit={handleSaveSection} className="p-4 rounded-xl border border-line bg-surface-2/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[12.5px] font-bold text-ink">
                {editingSec ? `Edit Section: ${editingSec.name}` : 'Add New Section'}
              </span>
              {editingSec && (
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="text-[11px] text-accent hover:underline"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            {errorMsg && (
              <p className="text-[11.5px] text-rose-500 font-medium">{errorMsg}</p>
            )}

            <div className="grid grid-cols-4 gap-2">
              <div className="col-span-1 space-y-1">
                <label className="text-[11px] font-semibold text-ink-2">Icon / Emoji</label>
                <div className="flex items-center gap-1.5 relative">
                  <input
                    type="text"
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    className="w-full h-8 px-2 text-center text-[16px] rounded-lg border border-line bg-surface focus:outline-none focus:border-accent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSectionEmojiPicker((prev) => !prev)}
                    className="h-8 px-2 rounded-lg border border-line bg-surface hover:bg-surface-2 text-ink text-[12px] shrink-0"
                    title="Choose from emoji collection"
                  >
                    😊
                  </button>
                  {showSectionEmojiPicker && (
                    <div className="absolute left-0 top-9 z-50">
                      <EmojiPickerPopover
                        onSelect={(em) => setIcon(em)}
                        onClose={() => setShowSectionEmojiPicker(false)}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="col-span-3 space-y-1">
                <label className="text-[11px] font-semibold text-ink-2">Section Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Account & Billing"
                  className="w-full h-8 px-3 rounded-lg border border-line bg-surface text-[12.5px] text-ink focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            {/* Quick Emoji Presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10.5px] text-ink-3">Quick Icons:</span>
              {COMMON_EMOJIS.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setIcon(em)}
                  className="w-6 h-6 rounded hover:bg-surface-3 flex items-center justify-center text-[13px] transition-colors"
                >
                  {em}
                </button>
              ))}
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-ink-2">Short Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Invoices, subscriptions, and payment methods"
                className="w-full h-8 px-3 rounded-lg border border-line bg-surface text-[12.5px] text-ink focus:outline-none focus:border-accent"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="h-8 px-4 rounded-lg bg-accent text-accent-ink text-[12px] font-semibold transition-all shadow-xs disabled:opacity-50"
            >
              {submitting ? 'Saving...' : editingSec ? 'Update Section' : '+ Add Section'}
            </button>
          </form>

          {/* Current Sections List */}
          <div className="space-y-2">
            <span className="text-[12px] font-semibold text-ink uppercase tracking-wider">
              Existing Sections ({sectionList.length})
            </span>

            {sectionList.length === 0 ? (
              <p className="text-[12px] text-ink-3 italic">No sections created yet.</p>
            ) : (
              <div className="border border-line rounded-xl divide-y divide-line/80 overflow-hidden bg-surface">
                {sectionList.map((sec) => (
                  <div
                    key={sec.id}
                    className="p-3 flex items-center justify-between gap-3 hover:bg-surface-2/50 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-[18px]">{sec.icon || '📚'}</span>
                      <div className="min-w-0">
                        <div className="text-[13px] font-semibold text-ink truncate">{sec.name}</div>
                        {sec.description && (
                          <div className="text-[11.5px] text-ink-3 truncate">{sec.description}</div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleStartEdit(sec)}
                        className="h-7 w-7 rounded hover:bg-surface-2 flex items-center justify-center text-ink-2 hover:text-ink transition-colors"
                        title="Edit section"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>

                      <button
                        onClick={() => handleDeleteSection(sec.id, sec.name)}
                        className="h-7 w-7 rounded hover:bg-rose-500/10 flex items-center justify-center text-ink-3 hover:text-rose-500 transition-colors"
                        title="Delete section"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-line flex items-center justify-end bg-surface-2/40">
          <button
            onClick={onClose}
            className="h-8 px-4 rounded-lg bg-surface border border-line text-ink text-[12px] font-medium hover:bg-surface-2 transition-colors"
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
