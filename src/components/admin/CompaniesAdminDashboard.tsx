'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  Users,
  MessageSquare,
  Radio,
  Search,
  ExternalLink,
  Plus,
  RefreshCw,
  ArrowRight,
  CheckCircle2,
  Clock,
  Globe,
  BookOpen,
  Sliders,
  X,
  Mail,
  MapPin,
  Sparkles,
  ChevronRight,
  ShieldAlert,
  Copy,
  Check,
  AlertTriangle,
  Database,
  Filter,
  LayoutGrid,
  Table as TableIcon,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Trash2,
  PauseCircle,
  PlayCircle,
  Settings2,
  GitMerge,
  RotateCcw,
  Zap,
  TrendingUp,
  Download,
  AlertCircle,
  Flame,
} from 'lucide-react';
import { Workspace, Agent } from '@/types/database';
import { getWorkspaceHelpCenterUrl } from '@/lib/domain';
import {
  getPlatformCompaniesAction,
  getPlatformAnalyticsAction,
  getCompanyDrilldownAction,
  createCompanyAction,
  switchWorkspaceAction,
  suspendCompanyAction,
  reactivateCompanyAction,
  softDeleteCompanyAction,
  restoreCompanyAction,
  assignWorkspaceOwnerAction,
  updateCompanySettingsAction,
  mergeWorkspacesAction,
  resyncCustomDomainsAction,
  PlatformCompaniesData,
  PlatformAnalyticsData,
  CompanyMetricItem,
  CompanyPlanLimits,
  PlatformDataIssues,
  OrphanAgent,
  OrphanConversation,
  OrphanMessage,
  OrphanVisitor,
} from '@/app/actions/platform';
import { exportCompaniesToCsv } from '@/lib/csv-export';
import { PlatformAnalyticsView } from './PlatformAnalyticsView';
import { CompanyInsightsModal } from './CompanyInsightsModal';
import { cn } from '@/lib/utils';

// Helper for formatting numbers with thousands separators
function formatNumber(val: number | null | undefined): string {
  if (val === null || val === undefined) return '0';
  return Number(val).toLocaleString();
}

// Helper for properly pluralizing seat / seats
function formatSeats(count: number | null | undefined): string {
  const c = count ?? 0;
  return `${formatNumber(c)} ${c === 1 ? 'seat' : 'seats'}`;
}

// Clean and normalize website domain for comparison
function normalizeDomain(url: string | null | undefined): string {
  if (!url) return '';
  return url
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/.*$/, '')
    .trim();
}

// Relative time helper for last activity
function formatRelativeTime(dateStr: string | null | undefined): string {
  if (!dateStr) return 'No activity';
  const time = new Date(dateStr).getTime();
  if (isNaN(time)) return 'No activity';
  const diffMs = Date.now() - time;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

// Days remaining until 30-day soft delete purge
function getDaysUntilPurge(deletedAt: string | null | undefined): number {
  if (!deletedAt) return 30;
  const deletedTime = new Date(deletedAt).getTime();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const remainingMs = deletedTime + thirtyDaysMs - Date.now();
  return Math.max(0, Math.ceil(remainingMs / (24 * 60 * 60 * 1000)));
}

interface CompaniesAdminDashboardProps {
  currentWorkspace?: Workspace | null;
  currentAgent?: Agent | null;
  onSwitchWorkspace?: (workspace: Workspace) => void;
}

export function CompaniesAdminDashboard({
  currentWorkspace,
  currentAgent,
  onSwitchWorkspace,
}: CompaniesAdminDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<PlatformCompaniesData | null>(null);

  // Platform Analytics & Radar State (Requirements 1 & 4)
  const [dashboardTab, setDashboardTab] = useState<'overview' | 'companies'>('overview');
  const [platformDays, setPlatformDays] = useState<7 | 30 | 90>(30);
  const [platformAnalytics, setPlatformAnalytics] = useState<PlatformAnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Vercel Custom Domains Resync Backfill State (Requirement 7)
  const [resyncingDomains, setResyncingDomains] = useState(false);
  const [resyncNotice, setResyncNotice] = useState<string | null>(null);

  const handleResyncDomains = async () => {
    setResyncingDomains(true);
    setResyncNotice(null);
    try {
      const res = await resyncCustomDomainsAction();
      if (res.success) {
        setResyncNotice(`Successfully re-synced ${res.synced} / ${res.total} custom domains with Vercel project.`);
        loadData(true);
      }
    } catch (err: any) {
      setResyncNotice(`Re-sync error: ${err.message}`);
    } finally {
      setResyncingDomains(false);
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'conversations' | 'visitors' | 'agents' | 'newest'>('newest');
  const [filterType, setFilterType] = useState<
    'all' | 'health_issues' | 'active' | 'conversations' | 'helpdesk' | 'no_owner' | 'duplicates'
  >('all');

  // View mode and pagination (Requirement 7)
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [hasUserSwitchedView, setHasUserSwitchedView] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [tableSortColumn, setTableSortColumn] = useState<string>('last_activity_at');
  const [tableSortDirection, setTableSortDirection] = useState<'asc' | 'desc'>('desc');

  // Management modals state (Requirements 1 - 5)
  const [suspendModalCompany, setSuspendModalCompany] = useState<CompanyMetricItem | null>(null);
  const [deleteModalCompany, setDeleteModalCompany] = useState<CompanyMetricItem | null>(null);
  const [changeOwnerModalCompany, setChangeOwnerModalCompany] = useState<CompanyMetricItem | null>(null);
  const [editCompanyModalCompany, setEditCompanyModalCompany] = useState<CompanyMetricItem | null>(null);
  const [mergeModalCompany, setMergeModalCompany] = useState<CompanyMetricItem | null>(null);

  // Drilldown modal state (Requirement 2 & 3)
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  // Data Issues modal state
  const [isDataIssuesOpen, setIsDataIssuesOpen] = useState(false);

  // Create modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [switchingId, setSwitchingId] = useState<string | null>(null);

  // Status feedback toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (text: string) => {
    setToastMessage(text);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSwitch = async (comp: CompanyMetricItem) => {
    try {
      setSwitchingId(comp.id);
      const res = await switchWorkspaceAction({
        workspaceId: comp.id,
        workspaceName: comp.name,
      });
      if (res.success && res.workspace) {
        if (onSwitchWorkspace) {
          onSwitchWorkspace(res.workspace);
        }
        showToast(`Switched active workspace to "${comp.name}"! Audit log recorded.`);
      }
    } catch (err: any) {
      console.error('Failed to switch workspace:', err);
      showToast(err.message || 'Failed to switch workspace');
    } finally {
      setSwitchingId(null);
    }
  };

  const loadAnalytics = async (days: 7 | 30 | 90) => {
    try {
      setAnalyticsLoading(true);
      const res = await getPlatformAnalyticsAction(days);
      setPlatformAnalytics(res);
    } catch (err: any) {
      console.error('Failed to load platform analytics:', err);
      showToast(err.message || 'Failed to load platform analytics');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const loadData = async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);
      const [compRes, analyticsRes] = await Promise.all([
        getPlatformCompaniesAction(),
        getPlatformAnalyticsAction(platformDays),
      ]);
      setData(compRes);
      setPlatformAnalytics(analyticsRes);
      // Requirement 7: Automatically default to Table view if more than 20 companies
      if (!hasUserSwitchedView && compRes.companies && compRes.companies.length > 20) {
        setViewMode('table');
      }
    } catch (err: any) {
      console.error('Failed to load platform data:', err);
      showToast(err.message || 'Failed to load companies data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handlePlatformRangeChange = (days: 7 | 30 | 90) => {
    setPlatformDays(days);
    loadAnalytics(days);
  };

  const handleExportCsv = () => {
    if (!data?.companies || data.companies.length === 0) {
      showToast('No company data available to export.');
      return;
    }
    exportCompaniesToCsv(data.companies);
    showToast(`Exported ${data.companies.length} companies to CSV successfully!`);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Management Action Handlers
  const handleSuspendConfirm = async (company: CompanyMetricItem, reason: string) => {
    await suspendCompanyAction(company.id, reason);
    showToast(`Workspace "${company.name}" suspended. Widget disabled and logins paused.`);
    loadData(true);
  };

  const handleReactivate = async (company: CompanyMetricItem) => {
    try {
      await reactivateCompanyAction(company.id);
      showToast(`Workspace "${company.name}" reactivated successfully!`);
      loadData(true);
    } catch (err: any) {
      showToast(err.message || 'Failed to reactivate company');
    }
  };

  const handleDeleteConfirm = async (company: CompanyMetricItem) => {
    await softDeleteCompanyAction(company.id);
    showToast(`Workspace "${company.name}" moved to trash (soft-deleted for 30 days).`);
    loadData(true);
  };

  const handleRestore = async (company: CompanyMetricItem) => {
    try {
      await restoreCompanyAction(company.id);
      showToast(`Workspace "${company.name}" restored successfully!`);
      loadData(true);
    } catch (err: any) {
      showToast(err.message || 'Failed to restore company');
    }
  };

  const handleChangeOwnerConfirm = async (company: CompanyMetricItem, newOwnerEmail: string) => {
    await assignWorkspaceOwnerAction(company.id, newOwnerEmail);
    showToast(`Owner of "${company.name}" assigned to ${newOwnerEmail}.`);
    loadData(true);
  };

  const handleEditCompanyConfirm = async (
    company: CompanyMetricItem,
    updateData: {
      name: string;
      website_url?: string | null;
      plan: string;
      plan_limits: CompanyPlanLimits;
    }
  ) => {
    await updateCompanySettingsAction(company.id, updateData);
    showToast(`Settings for "${updateData.name}" updated successfully.`);
    loadData(true);
  };

  const handleMergeConfirm = async (sourceId: string, targetId: string) => {
    const res = await mergeWorkspacesAction({ sourceWorkspaceId: sourceId, targetWorkspaceId: targetId });
    showToast(
      `Merged workspaces! ${res.result?.conversations_moved ?? 0} conversations and ${res.result?.visitors_moved ?? 0} visitors moved.`
    );
    loadData(true);
  };

  const openDrilldown = (workspaceId: string) => {
    setSelectedCompanyId(workspaceId);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    showToast('Copied to clipboard!');
  };

  // Duplicate detection by name + domain
  const duplicateGroups = useMemo(() => {
    const map = new Map<string, string[]>();
    if (!data?.companies) return map;
    for (const comp of data.companies) {
      const cleanName = (comp.name || '').trim().toLowerCase();
      const cleanDomain = normalizeDomain(comp.website_url);
      const key = `${cleanName}:::${cleanDomain}`;
      const list = map.get(key) || [];
      list.push(comp.id);
      map.set(key, list);
    }
    return map;
  }, [data?.companies]);

  // Workspaces with issues
  const noOwnerCompanies = useMemo(() => {
    return (data?.companies || []).filter((c) => c.agents_count === 0);
  }, [data?.companies]);

  const healthIssueCompanies = useMemo(() => {
    return (data?.companies || []).filter((c) => c.health_flags && c.health_flags.length > 0);
  }, [data?.companies]);

  const duplicateCompanies = useMemo(() => {
    return (data?.companies || []).filter((c) => {
      const cleanName = (c.name || '').trim().toLowerCase();
      const cleanDomain = normalizeDomain(c.website_url);
      const key = `${cleanName}:::${cleanDomain}`;
      return (duplicateGroups.get(key)?.length || 0) > 1;
    });
  }, [data?.companies, duplicateGroups]);

  const totalOrphanCount = data?.data_issues?.total_orphan_count || 0;

  // Filter companies
  const filteredCompanies = useMemo(() => {
    return (data?.companies || [])
      .filter((comp) => {
        // Search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchesName = comp.name?.toLowerCase().includes(q);
          const matchesUrl = comp.website_url?.toLowerCase().includes(q);
          const matchesId = comp.id?.toLowerCase().includes(q);
          const matchesOwner = comp.owner_email?.toLowerCase().includes(q);
          if (!matchesName && !matchesUrl && !matchesId && !matchesOwner) return false;
        }

        // Filter
        if (filterType === 'health_issues') {
          return Boolean(comp.health_flags && comp.health_flags.length > 0);
        }
        if (filterType === 'active') return comp.active_visitors_count > 0;
        if (filterType === 'conversations') return comp.conversations_count > 0;
        if (filterType === 'helpdesk') return comp.articles_count > 0;
        if (filterType === 'no_owner') return comp.agents_count === 0;
        if (filterType === 'duplicates') {
          const cleanName = (comp.name || '').trim().toLowerCase();
          const cleanDomain = normalizeDomain(comp.website_url);
          const key = `${cleanName}:::${cleanDomain}`;
          return (duplicateGroups.get(key)?.length || 0) > 1;
        }

        return true;
      });
  }, [data?.companies, searchQuery, filterType, duplicateGroups]);

  // Sorted companies: table view uses tableSortColumn; cards view uses sortBy
  const sortedCompanies = useMemo(() => {
    if (viewMode === 'table') {
      return [...filteredCompanies].sort((a, b) => {
        let valA: any = (a as any)[tableSortColumn];
        let valB: any = (b as any)[tableSortColumn];

        if (tableSortColumn === 'owner') {
          valA = a.owner_email || '';
          valB = b.owner_email || '';
        } else if (tableSortColumn === 'status') {
          valA = a.deleted_at ? 3 : a.is_suspended ? 2 : 1;
          valB = b.deleted_at ? 3 : b.is_suspended ? 2 : 1;
        } else if (tableSortColumn === 'last_activity_at') {
          valA = new Date(a.last_activity_at || a.created_at || 0).getTime();
          valB = new Date(b.last_activity_at || b.created_at || 0).getTime();
        } else if (tableSortColumn === 'created_at') {
          valA = new Date(a.created_at || 0).getTime();
          valB = new Date(b.created_at || 0).getTime();
        }

        if (typeof valA === 'string') {
          const comp = valA.localeCompare(valB || '');
          return tableSortDirection === 'asc' ? comp : -comp;
        }
        if (typeof valA === 'boolean') {
          const numA = valA ? 1 : 0;
          const numB = valB ? 1 : 0;
          return tableSortDirection === 'asc' ? numA - numB : numB - numA;
        }
        const numA = Number(valA ?? 0);
        const numB = Number(valB ?? 0);
        return tableSortDirection === 'asc' ? numA - numB : numB - numA;
      });
    }

    return [...filteredCompanies].sort((a, b) => {
      if (sortBy === 'conversations') return b.conversations_count - a.conversations_count;
      if (sortBy === 'visitors') return b.visitors_count - a.visitors_count;
      if (sortBy === 'agents') return b.agents_count - a.agents_count;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [filteredCompanies, viewMode, tableSortColumn, tableSortDirection, sortBy]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(sortedCompanies.length / pageSize));
  const paginatedCompanies = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedCompanies.slice(start, start + pageSize);
  }, [sortedCompanies, currentPage, pageSize]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterType, sortBy, tableSortColumn, tableSortDirection]);

  // Resolved company object for active drilldown
  const activeDrilldownCompany = useMemo(() => {
    return data?.companies?.find((c) => c.id === selectedCompanyId) || null;
  }, [data?.companies, selectedCompanyId]);

  return (
    <div className="flex-1 flex flex-col h-screen overflow-y-auto bg-canvas">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-ink text-canvas text-[13px] font-medium shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner Header */}
      <header className="px-8 py-6 border-b border-line bg-surface sticky top-0 z-20 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                <Building2 className="w-4.5 h-4.5" />
              </div>
              <h1 className="text-[20px] font-bold text-ink tracking-tight">
                Companies &amp; Platform Administration
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                Super Admin
              </span>
            </div>
            <p className="text-[12.5px] text-ink-3 mt-1">
              Complete multi-tenant visibility across all customer companies, traffic radar, and chat metrics.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Data Issues Panel Trigger */}
            <button
              onClick={() => setIsDataIssuesOpen(true)}
              className={cn(
                'h-9 px-3.5 rounded-xl border text-[12.5px] font-semibold flex items-center gap-2 transition-all shadow-xs',
                totalOrphanCount > 0
                  ? 'border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20'
                  : 'border-line bg-surface-2 hover:bg-surface text-ink-3 hover:text-ink'
              )}
              title="Inspect orphan data rows and database integrity issues"
            >
              <ShieldAlert className={cn('w-4 h-4', totalOrphanCount > 0 ? 'text-amber-500 animate-pulse' : 'text-ink-3')} />
              <span>Data Issues</span>
              <span className={cn(
                'px-1.5 py-0.2 rounded-full text-[10.5px] font-bold',
                totalOrphanCount > 0 ? 'bg-amber-500 text-white' : 'bg-surface-3 text-ink-3'
              )}>
                {formatNumber(totalOrphanCount)}
              </span>
            </button>

            <button
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="h-9 px-3.5 rounded-xl border border-line bg-surface-2 hover:bg-surface text-ink text-[12.5px] font-medium flex items-center gap-2 transition-all disabled:opacity-50"
              title="Refresh platform statistics"
            >
              <RefreshCw className={cn('w-3.5 h-3.5 text-ink-3', refreshing && 'animate-spin')} />
              <span>Refresh</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="h-9 px-3.5 rounded-xl border border-line bg-surface-2 hover:bg-surface text-ink text-[12.5px] font-semibold flex items-center gap-1.5 transition-all shadow-xs"
              title="Download platform companies CSV export"
            >
              <Download className="w-3.5 h-3.5 text-accent" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handleResyncDomains}
              disabled={resyncingDomains}
              className="h-9 px-3.5 rounded-xl border border-line bg-surface-2 hover:bg-surface text-ink text-[12.5px] font-semibold flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50"
              title="Re-sync all workspace custom domains with Vercel project"
            >
              <Globe className={cn('w-3.5 h-3.5 text-blue-500', resyncingDomains && 'animate-spin')} />
              <span>{resyncingDomains ? 'Syncing...' : 'Re-sync domains with Vercel'}</span>
            </button>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="h-9 px-4 rounded-xl bg-accent text-accent-ink hover:opacity-90 text-[12.5px] font-semibold flex items-center gap-1.5 transition-all shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>New Company</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="p-8 space-y-7 max-w-7xl w-full mx-auto">
        {resyncNotice && (
          <div className="p-4 rounded-2xl border border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300 text-sm flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-blue-500" />
              <span>{resyncNotice}</span>
            </div>
            <button onClick={() => setResyncNotice(null)} className="p-1 hover:bg-blue-500/20 rounded-lg text-blue-500">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {/* Navigation Mode Switcher: Platform Executive Radar vs Companies Directory */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-5">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface-2 border border-line">
            <button
              type="button"
              onClick={() => setDashboardTab('overview')}
              className={cn(
                'h-9 px-4 rounded-lg text-[13px] font-semibold flex items-center gap-2 transition-all',
                dashboardTab === 'overview'
                  ? 'bg-surface text-ink shadow-xs'
                  : 'text-ink-3 hover:text-ink hover:bg-surface/50'
              )}
            >
              <TrendingUp className="w-4 h-4 text-accent" />
              <span>Platform Analytics &amp; Radar</span>
            </button>
            <button
              type="button"
              onClick={() => setDashboardTab('companies')}
              className={cn(
                'h-9 px-4 rounded-lg text-[13px] font-semibold flex items-center gap-2 transition-all',
                dashboardTab === 'companies'
                  ? 'bg-surface text-ink shadow-xs'
                  : 'text-ink-3 hover:text-ink hover:bg-surface/50'
              )}
            >
              <Building2 className="w-4 h-4 text-blue-500" />
              <span>Companies Directory ({formatNumber(data?.companies?.length || 0)})</span>
            </button>
          </div>

          {/* Quick Date Range Picker & CSV Export */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center p-0.5 rounded-lg border border-line bg-surface-2">
              {([7, 30, 90] as const).map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => handlePlatformRangeChange(days)}
                  disabled={analyticsLoading}
                  className={cn(
                    'h-7.5 px-3 rounded-md text-[11.5px] font-semibold transition-all disabled:opacity-50',
                    platformDays === days
                      ? 'bg-accent text-accent-ink shadow-2xs'
                      : 'text-ink-3 hover:text-ink'
                  )}
                >
                  {days} Days
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleExportCsv}
              className="h-8.5 px-3.5 rounded-xl border border-line bg-surface hover:bg-surface-2 text-ink text-[12px] font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
              title="Download full companies CSV export"
            >
              <Download className="w-3.5 h-3.5 text-accent" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {dashboardTab === 'overview' ? (
          <PlatformAnalyticsView
            analytics={platformAnalytics}
            loading={analyticsLoading}
            rangeDays={platformDays}
            onRangeChange={handlePlatformRangeChange}
            onOpenCompanyInsights={(id) => openDrilldown(id)}
            onRefresh={() => loadData(true)}
            refreshing={refreshing}
            onExportCsv={handleExportCsv}
          />
        ) : (
          <>
            {/* KPI Platform Stat Cards */}
            <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="p-4.5 rounded-2xl border border-line bg-surface shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-ink-3">
                  <span className="text-[11.5px] font-semibold uppercase tracking-wider">Companies</span>
                  <Building2 className="w-4 h-4 text-blue-500" />
                </div>
                <div className="text-[26px] font-extrabold text-ink tracking-tight">
                  {loading ? '—' : formatNumber(data?.total_companies)}
                </div>
                <div className="text-[11.5px] text-ink-3">Registered tenants</div>
              </div>

              <div className="p-4.5 rounded-2xl border border-line bg-surface shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-ink-3">
                  <span className="text-[11.5px] font-semibold uppercase tracking-wider">Conversations</span>
                  <MessageSquare className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="text-[26px] font-extrabold text-ink tracking-tight">
                  {loading ? '—' : formatNumber(data?.total_conversations)}
                </div>
                <div className="text-[11.5px] text-ink-3">Sum of company chats</div>
              </div>

              <div className="p-4.5 rounded-2xl border border-line bg-surface shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-ink-3">
                  <span className="text-[11.5px] font-semibold uppercase tracking-wider">Messages</span>
                  <MessageSquare className="w-4 h-4 text-purple-500" />
                </div>
                <div className="text-[26px] font-extrabold text-ink tracking-tight">
                  {loading ? '—' : formatNumber(data?.total_messages)}
                </div>
                <div className="text-[11.5px] text-ink-3">Sum of company messages</div>
              </div>

              <div className="p-4.5 rounded-2xl border border-line bg-surface shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-ink-3">
                  <span className="text-[11.5px] font-semibold uppercase tracking-wider">Visitors</span>
                  <Radio className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-[26px] font-extrabold text-ink tracking-tight">
                  {loading ? '—' : formatNumber(data?.total_visitors)}
                </div>
                <div className="text-[11.5px] text-ink-3">Sum of company visitors</div>
              </div>

              <div className="p-4.5 rounded-2xl border border-line bg-surface shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-ink-3">
                  <span className="text-[11.5px] font-semibold uppercase tracking-wider">Support Agents</span>
                  <Users className="w-4 h-4 text-indigo-500" />
                </div>
                <div className="text-[26px] font-extrabold text-ink tracking-tight">
                  {loading ? '—' : formatNumber(data?.total_agents)}
                </div>
                <div className="text-[11.5px] text-ink-3">Sum of company seats</div>
              </div>
            </section>

            {/* Filters and Search Bar */}
            <section className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {[
                  ['all', `All (${formatNumber(data?.companies?.length || 0)})`],
                  ['health_issues', `Health Issues (${formatNumber(healthIssueCompanies.length)})`],
                  ['no_owner', `No Owner (${formatNumber(noOwnerCompanies.length)})`],
                  ['duplicates', `Duplicates (${formatNumber(duplicateCompanies.length)})`],
                  ['active', 'Active Traffic 🟢'],
                  ['conversations', 'Has Chats 💬'],
                  ['helpdesk', 'Has Help Center 📚'],
                ].map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => setFilterType(val as any)}
                    className={cn(
                      'h-8 px-3 rounded-lg text-[12px] font-medium transition-all whitespace-nowrap flex items-center gap-1.5',
                      filterType === val
                        ? 'bg-accent text-accent-ink shadow-xs font-semibold'
                        : 'bg-surface-2 text-ink-2 hover:bg-surface-3 hover:text-ink'
                    )}
                  >
                    {val === 'health_issues' && healthIssueCompanies.length > 0 && (
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    )}
                    {val === 'no_owner' && noOwnerCompanies.length > 0 && (
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                    )}
                    {val === 'duplicates' && duplicateCompanies.length > 0 && (
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                    )}
                    <span>{label}</span>
                  </button>
                ))}
              </div>

          {/* Search, Sort & View Mode Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* View Switcher: Cards vs Table (Requirement 7) */}
            <div className="flex items-center p-0.5 rounded-lg border border-line bg-surface-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setViewMode('cards');
                  setHasUserSwitchedView(true);
                }}
                className={cn(
                  'h-7.5 px-2.5 rounded-md text-[11.5px] font-medium flex items-center gap-1.5 transition-all',
                  viewMode === 'cards'
                    ? 'bg-surface text-ink font-semibold shadow-2xs'
                    : 'text-ink-3 hover:text-ink'
                )}
                title="Card View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Cards</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setViewMode('table');
                  setHasUserSwitchedView(true);
                }}
                className={cn(
                  'h-7.5 px-2.5 rounded-md text-[11.5px] font-medium flex items-center gap-1.5 transition-all',
                  viewMode === 'table'
                    ? 'bg-surface text-ink font-semibold shadow-2xs'
                    : 'text-ink-3 hover:text-ink'
                )}
                title="Sortable Table View with Pagination"
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>Table</span>
              </button>
            </div>

            <div className="relative w-full sm:w-60">
              <Search className="w-3.5 h-3.5 text-ink-3 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, domain, owner..."
                className="w-full h-8.5 pl-8.5 pr-3 rounded-lg border border-line bg-surface text-[12.5px] text-ink placeholder:text-ink-3 focus:outline-none focus:border-accent"
              />
            </div>

            {viewMode === 'cards' && (
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="h-8.5 px-2.5 rounded-lg border border-line bg-surface text-[12px] text-ink focus:outline-none"
              >
                <option value="newest">Sort: Newest</option>
                <option value="conversations">Sort: Most Chats</option>
                <option value="visitors">Sort: Most Visitors</option>
                <option value="agents">Sort: Most Agents</option>
              </select>
            )}
          </div>
        </section>

        {/* Companies Listing (Cards or Table View) */}
        <section className="space-y-4">
          {loading ? (
            <div className="p-12 text-center text-ink-3 text-[13px] space-y-2 bg-surface border border-line rounded-2xl">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-accent" />
              <p>Loading registered companies and data metrics...</p>
            </div>
          ) : sortedCompanies.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-line bg-surface text-ink-3 space-y-2">
              <Building2 className="w-8 h-8 mx-auto text-ink-3/60" />
              <p className="font-semibold text-ink">No companies found</p>
              <p className="text-[12px]">Try adjusting your search query or filter criteria.</p>
            </div>
          ) : viewMode === 'table' ? (
            /* Table View with sorting and pagination (Requirement 7) */
            <CompaniesTableView
              companies={paginatedCompanies}
              currentWorkspaceId={currentWorkspace?.id}
              sortColumn={tableSortColumn}
              sortDirection={tableSortDirection}
              onSort={(col) => {
                if (tableSortColumn === col) {
                  setTableSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
                } else {
                  setTableSortColumn(col);
                  setTableSortDirection('desc');
                }
              }}
              onOpenDrilldown={openDrilldown}
              onSwitchWorkspace={handleSwitch}
              switchingId={switchingId}
              onOpenEdit={(c) => setEditCompanyModalCompany(c)}
              onOpenChangeOwner={(c) => setChangeOwnerModalCompany(c)}
              onOpenSuspend={(c) => setSuspendModalCompany(c)}
              onReactivate={handleReactivate}
              onOpenMerge={(c) => setMergeModalCompany(c)}
              onOpenDelete={(c) => setDeleteModalCompany(c)}
              onRestore={handleRestore}
            />
          ) : (
            /* Cards View with all 7 fields (Requirement 6) */
            <div className="space-y-3.5">
              {paginatedCompanies.map((comp) => {
                const isCurrent = currentWorkspace?.id === comp.id;

                // Duplicate calculation
                const cleanName = (comp.name || '').trim().toLowerCase();
                const cleanDomain = normalizeDomain(comp.website_url);
                const dupKey = `${cleanName}:::${cleanDomain}`;
                const dupList = duplicateGroups.get(dupKey) || [];
                const isDuplicate = dupList.length > 1;
                const hasNoOwner = comp.agents_count === 0;
                const isSuspended = Boolean(comp.is_suspended && !comp.deleted_at);
                const isDeleted = Boolean(comp.deleted_at);
                const daysUntilPurge = getDaysUntilPurge(comp.deleted_at);

                return (
                  <div
                    key={comp.id}
                    className={cn(
                      'p-5 rounded-2xl border transition-all bg-surface hover:shadow-md flex flex-col gap-4',
                      isCurrent
                        ? 'border-accent ring-1 ring-accent/30 shadow-xs'
                        : isDeleted
                        ? 'border-rose-500/40 bg-rose-500/5'
                        : isSuspended
                        ? 'border-amber-500/40 bg-amber-500/5'
                        : hasNoOwner
                        ? 'border-rose-500/30'
                        : isDuplicate
                        ? 'border-amber-500/30'
                        : 'border-line'
                    )}
                  >
                    {/* Top Row: Brand Avatar, Name, Status Badges, Action Buttons */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex items-start gap-3.5 min-w-0 flex-1">
                        {/* Brand Color Avatar */}
                        <div
                          className="w-11 h-11 rounded-2xl shrink-0 flex items-center justify-center font-bold text-white shadow-xs text-[15px]"
                          style={{ backgroundColor: comp.brand_color || '#2563eb' }}
                        >
                          {comp.name.charAt(0).toUpperCase()}
                        </div>

                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-[15.5px] font-bold text-ink truncate leading-tight">
                              {comp.name}
                            </h3>

                            {isCurrent && (
                              <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-accent text-accent-ink shadow-2xs">
                                Active Workspace
                              </span>
                            )}

                            {/* Suspended Badge (Requirement 1) */}
                            {isSuspended && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                <PauseCircle className="w-3 h-3 text-amber-500" />
                                <span>Suspended</span>
                              </span>
                            )}

                            {/* Soft-Deleted Badge (Requirement 2) */}
                            {isDeleted && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                                <Trash2 className="w-3 h-3 text-rose-500" />
                                <span>Soft-Deleted ({daysUntilPurge}d left)</span>
                              </span>
                            )}

                            {/* Traffic Radar: Browsing Now */}
                            {comp.active_visitors_count > 0 && !isSuspended && !isDeleted && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                {formatNumber(comp.active_visitors_count)} browsing now
                              </span>
                            )}

                            {/* Flag 1: Workspaces with no owner ("0 seats") */}
                            {hasNoOwner && (
                              <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                                title="Workspace has no owner or active agents registered"
                              >
                                <AlertTriangle className="w-3 h-3 text-rose-500" />
                                <span>No Owner (0 seats)</span>
                              </span>
                            )}

                            {/* Flag 2: Duplicates by name plus domain */}
                            {isDuplicate && (
                              <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                                title={`Duplicate workspace detected: ${dupList.length} companies share name "${comp.name}" and domain "${cleanDomain || '(none)'}"`}
                              >
                                <Copy className="w-3 h-3 text-amber-500" />
                                <span>Duplicate ({dupList.length}x)</span>
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-[12px] text-ink-3 flex-wrap">
                            {comp.website_url ? (
                              <a
                                href={comp.website_url.startsWith('http') ? comp.website_url : `https://${comp.website_url}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-accent hover:underline flex items-center gap-1 truncate max-w-xs"
                              >
                                <Globe className="w-3 h-3" />
                                <span>{comp.website_url.replace(/^https?:\/\//, '')}</span>
                                <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                              </a>
                            ) : (
                              <span className="text-ink-3 italic">No website URL set</span>
                            )}
                          </div>

                          {/* Health Flags per Company (Requirement 3) */}
                          {comp.health_flags && comp.health_flags.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5 pt-1">
                              <span className="text-[10px] font-bold text-ink-3 uppercase tracking-wider flex items-center gap-1 mr-0.5">
                                <AlertTriangle className="w-3 h-3 text-amber-500" />
                                Health:
                              </span>
                              {comp.health_flags.map((flag, idx) => (
                                <span
                                  key={idx}
                                  className={cn(
                                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border',
                                    flag.includes('waiting over 24h')
                                      ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                                      : flag === 'widget not installed'
                                      ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/25'
                                      : flag === 'no agent online for 7 days'
                                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25'
                                      : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/25'
                                  )}
                                >
                                  <AlertCircle className="w-2.5 h-2.5 shrink-0" />
                                  <span>{flag}</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Main Action Buttons: Insights & Switch */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => openDrilldown(comp.id)}
                          className="h-8.5 px-3 rounded-xl border border-line bg-surface hover:bg-surface-2 text-ink text-[12px] font-medium flex items-center gap-1.5 transition-colors shadow-2xs"
                          title="View deep company metrics, recent activity & team members"
                        >
                          <span>Insights</span>
                          <ChevronRight className="w-3.5 h-3.5 text-ink-3" />
                        </button>

                        {isCurrent ? (
                          <div className="h-8.5 px-3 rounded-xl bg-surface-2 border border-line text-ink-3 text-[12px] font-medium flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Current</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleSwitch(comp)}
                            disabled={switchingId === comp.id || isSuspended || isDeleted}
                            className="h-8.5 px-3.5 rounded-xl bg-accent text-accent-ink hover:opacity-90 text-[12px] font-semibold flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-40"
                            title={isSuspended ? 'Workspace suspended' : isDeleted ? 'Workspace soft-deleted' : 'Switch into workspace'}
                          >
                            {switchingId === comp.id ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <ArrowRight className="w-3.5 h-3.5" />
                            )}
                            <span>{switchingId === comp.id ? 'Switching...' : 'Switch'}</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Requirement 6: Detailed Metadata Row on Each Card */}
                    {/* Owner Email, Plan, Created Date, Last Activity, Widget Installed, AI ON/OFF, Published Articles */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5 p-3 rounded-xl bg-surface-2/60 border border-line/60 text-[11.5px]">
                      {/* 1. Owner Email */}
                      <div className="min-w-0">
                        <div className="text-ink-3 text-[10px] font-semibold uppercase flex items-center gap-1">
                          <Mail className="w-3 h-3 text-blue-500" />
                          <span>Owner</span>
                        </div>
                        <div className="truncate font-medium text-ink mt-0.5" title={comp.owner_email || 'No owner'}>
                          {comp.owner_email ? (
                            <span className="text-accent">{comp.owner_email}</span>
                          ) : (
                            <span className="text-rose-500 italic">No owner</span>
                          )}
                        </div>
                      </div>

                      {/* 2. Plan Badge */}
                      <div>
                        <div className="text-ink-3 text-[10px] font-semibold uppercase flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-purple-500" />
                          <span>Plan</span>
                        </div>
                        <div className="mt-0.5">
                          <span className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                            {comp.plan || 'Free'}
                          </span>
                        </div>
                      </div>

                      {/* 3. Created Date */}
                      <div>
                        <div className="text-ink-3 text-[10px] font-semibold uppercase flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>Created</span>
                        </div>
                        <div className="text-ink font-medium mt-0.5">
                          {new Date(comp.created_at).toLocaleDateString()}
                        </div>
                      </div>

                      {/* 4. Last Activity */}
                      <div>
                        <div className="text-ink-3 text-[10px] font-semibold uppercase flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-500" />
                          <span>Last Activity</span>
                        </div>
                        <div className="text-ink font-medium mt-0.5" title={comp.last_activity_at || comp.created_at}>
                          {formatRelativeTime(comp.last_activity_at)}
                        </div>
                      </div>

                      {/* 5. Widget Installed (Yes/No) */}
                      <div>
                        <div className="text-ink-3 text-[10px] font-semibold uppercase flex items-center gap-1">
                          <Radio className="w-3 h-3 text-emerald-500" />
                          <span>Widget</span>
                        </div>
                        <div className="mt-0.5">
                          {comp.widget_installed ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Installed
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-surface-3 text-ink-3">
                              Not active
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 6. AI On/Off */}
                      <div>
                        <div className="text-ink-3 text-[10px] font-semibold uppercase flex items-center gap-1">
                          <Zap className="w-3 h-3 text-amber-500" />
                          <span>AI Engine</span>
                        </div>
                        <div className="mt-0.5">
                          {comp.ai_enabled ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                              <Zap className="w-2.5 h-2.5" />
                              AI: ON
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-surface-3 text-ink-3">
                              AI: OFF
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 7. Published Articles Count */}
                      <div>
                        <div className="text-ink-3 text-[10px] font-semibold uppercase flex items-center gap-1">
                          <BookOpen className="w-3 h-3 text-blue-500" />
                          <span>Articles</span>
                        </div>
                        <div className="text-ink font-semibold mt-0.5">
                          {formatNumber(comp.published_articles_count ?? 0)}{' '}
                          <span className="text-[10px] text-ink-3 font-normal">published</span>
                        </div>
                      </div>
                    </div>

                    {/* Stats Summary & Management Action Buttons */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-line/40">
                      {/* Metric summary numbers */}
                      <div className="flex items-center gap-4 text-[12px] text-ink-3 flex-wrap">
                        <span>
                          <strong className="text-ink font-bold">{formatNumber(comp.conversations_count)}</strong> chats (
                          {formatNumber(comp.open_conversations_count)} open)
                        </span>
                        <span>•</span>
                        <span>
                          <strong className="text-ink font-bold">{formatNumber(comp.messages_count)}</strong> messages
                        </span>
                        <span>•</span>
                        <span>
                          <strong className="text-ink font-bold">{formatNumber(comp.visitors_count)}</strong> visitors
                        </span>
                        <span>•</span>
                        <span className={cn(hasNoOwner && 'text-rose-500 font-bold')}>
                          {formatSeats(comp.agents_count)}
                        </span>
                      </div>

                      {/* Management Action Bar (Requirements 1-5) */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* 1. Edit Name, Domain, Plan & Limits */}
                        <button
                          onClick={() => setEditCompanyModalCompany(comp)}
                          className="h-7 px-2.5 rounded-lg border border-line bg-surface hover:bg-surface-2 text-ink text-[11px] font-medium flex items-center gap-1 transition-colors"
                          title="Edit company name, website domain, plan and limits"
                        >
                          <Settings2 className="w-3 h-3 text-ink-3" />
                          <span>Edit</span>
                        </button>

                        {/* 2. Assign / Change Owner */}
                        <button
                          onClick={() => setChangeOwnerModalCompany(comp)}
                          className="h-7 px-2.5 rounded-lg border border-line bg-surface hover:bg-surface-2 text-ink text-[11px] font-medium flex items-center gap-1 transition-colors"
                          title="Assign or change workspace owner by email"
                        >
                          <Mail className="w-3 h-3 text-ink-3" />
                          <span>Owner</span>
                        </button>

                        {/* 3. Suspend / Reactivate */}
                        {comp.is_suspended ? (
                          <button
                            onClick={() => handleReactivate(comp)}
                            className="h-7 px-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-medium flex items-center gap-1 transition-colors"
                            title="Reactivate company widget and agent logins"
                          >
                            <PlayCircle className="w-3 h-3 text-emerald-500" />
                            <span>Reactivate</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => setSuspendModalCompany(comp)}
                            className="h-7 px-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[11px] font-medium flex items-center gap-1 transition-colors"
                            title="Suspend company (stops widget and logins, keeps data)"
                          >
                            <PauseCircle className="w-3 h-3 text-amber-500" />
                            <span>Suspend</span>
                          </button>
                        )}

                        {/* 4. Merge Duplicate Workspaces */}
                        {isDuplicate && (
                          <button
                            onClick={() => setMergeModalCompany(comp)}
                            className="h-7 px-2.5 rounded-lg border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 text-[11px] font-medium flex items-center gap-1 transition-colors"
                            title="Merge this duplicate workspace into another company"
                          >
                            <GitMerge className="w-3 h-3 text-purple-500" />
                            <span>Merge</span>
                          </button>
                        )}

                        {/* 5. Delete (Soft-Delete) / Restore */}
                        {isDeleted ? (
                          <button
                            onClick={() => handleRestore(comp)}
                            className="h-7 px-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-medium flex items-center gap-1 transition-colors"
                            title="Restore workspace from 30-day trash"
                          >
                            <RotateCcw className="w-3 h-3 text-emerald-500" />
                            <span>Restore</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => setDeleteModalCompany(comp)}
                            className="h-7 px-2.5 rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-[11px] font-medium flex items-center gap-1 transition-colors"
                            title="Soft delete with 30-day recovery window"
                          >
                            <Trash2 className="w-3 h-3 text-rose-500" />
                            <span>Delete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination Controls (Requirement 7) */}
          {!loading && sortedCompanies.length > 0 && (
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={sortedCompanies.length}
              onPageChange={setCurrentPage}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setCurrentPage(1);
              }}
            />
          )}
        </section>
          </>
        )}
      </main>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* COMPANY DRILLDOWN INSIGHTS MODAL (Requirements 2, 3, 4)             */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {selectedCompanyId && (
        <CompanyInsightsModal
          workspaceId={selectedCompanyId}
          activeCompany={activeDrilldownCompany}
          onClose={() => setSelectedCompanyId(null)}
          onSwitchWorkspace={onSwitchWorkspace}
          onCopyId={copyToClipboard}
          copiedId={copiedId}
        />
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* DATA ISSUES & ORPHAN RECORDS PANEL                                  */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {isDataIssuesOpen && (
        <DataIssuesModal
          dataIssues={data?.data_issues}
          noOwnerCompanies={noOwnerCompanies}
          duplicateCompanies={duplicateCompanies}
          duplicateGroups={duplicateGroups}
          onClose={() => setIsDataIssuesOpen(false)}
          onOpenCompanyDrilldown={(id) => {
            setIsDataIssuesOpen(false);
            openDrilldown(id);
          }}
        />
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MANAGEMENT ACTION MODALS                                            */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {suspendModalCompany && (
        <SuspendCompanyModal
          company={suspendModalCompany}
          onClose={() => setSuspendModalCompany(null)}
          onConfirm={handleSuspendConfirm}
        />
      )}

      {deleteModalCompany && (
        <DeleteCompanyModal
          company={deleteModalCompany}
          onClose={() => setDeleteModalCompany(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}

      {changeOwnerModalCompany && (
        <ChangeOwnerModal
          company={changeOwnerModalCompany}
          onClose={() => setChangeOwnerModalCompany(null)}
          onConfirm={handleChangeOwnerConfirm}
        />
      )}

      {editCompanyModalCompany && (
        <EditCompanyModal
          company={editCompanyModalCompany}
          onClose={() => setEditCompanyModalCompany(null)}
          onConfirm={handleEditCompanyConfirm}
        />
      )}

      {mergeModalCompany && (
        <MergeWorkspacesModal
          sourceCompany={mergeModalCompany}
          allCompanies={data?.companies || []}
          duplicateGroups={duplicateGroups}
          onClose={() => setMergeModalCompany(null)}
          onConfirm={handleMergeConfirm}
        />
      )}

      {isCreateModalOpen && (
        <CreateCompanyModal
          allCompanies={data?.companies || []}
          onClose={() => setIsCreateModalOpen(false)}
          onCreated={(newWs) => {
            setIsCreateModalOpen(false);
            loadData(true);
            showToast(`Company "${newWs.name}" registered successfully!`);
          }}
        />
      )}
    </div>
  );
}

// ============================================================================
// CREATE COMPANY MODAL (Requirement 3)
// Requires owner email, sends invite, warns on duplicate name or domain.
// ============================================================================
interface CreateCompanyModalProps {
  allCompanies: CompanyMetricItem[];
  onClose: () => void;
  onCreated: (workspace: Workspace) => void;
}

function CreateCompanyModal({ allCompanies, onClose, onCreated }: CreateCompanyModalProps) {
  const [name, setName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [brandColor, setBrandColor] = useState('#2563eb');
  const [greetingTitle, setGreetingTitle] = useState('Welcome to Support! 👋');
  const [plan, setPlan] = useState('free');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const COLOR_PRESETS = ['#2563eb', '#059669', '#8b5cf6', '#e11d48', '#f97316', '#0f172a'];

  // Requirement 3: Live Duplicate Warning for Name
  const duplicateNameWarning = useMemo(() => {
    if (!name.trim()) return null;
    const clean = name.trim().toLowerCase();
    const match = allCompanies.find((c) => (c.name || '').trim().toLowerCase() === clean);
    return match ? match.name : null;
  }, [name, allCompanies]);

  // Requirement 3: Live Duplicate Warning for Domain
  const duplicateDomainWarning = useMemo(() => {
    if (!websiteUrl.trim()) return null;
    const clean = normalizeDomain(websiteUrl);
    if (!clean) return null;
    const match = allCompanies.find((c) => normalizeDomain(c.website_url) === clean);
    return match ? { name: match.name, domain: clean } : null;
  }, [websiteUrl, allCompanies]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Company name is required');
      return;
    }
    if (!ownerEmail.trim() || !ownerEmail.includes('@')) {
      setErrorMsg('A valid owner email is required to register a new company');
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    try {
      const res = await createCompanyAction({
        name: name.trim(),
        owner_email: ownerEmail.trim(),
        website_url: websiteUrl.trim() || undefined,
        brand_color: brandColor,
        greeting_title: greetingTitle.trim(),
        plan,
      });
      if (res.workspace) {
        onCreated(res.workspace);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create company');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-surface border border-line rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-line flex items-center justify-between bg-surface-2/60">
          <div>
            <h2 className="text-[16px] font-bold text-ink">Register New Company</h2>
            <p className="text-[11.5px] text-ink-3">Create an isolated multi-tenant workspace</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-surface-3 flex items-center justify-center text-ink-3 hover:text-ink transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Dynamic Duplicate Warnings (Requirement 3) */}
          {duplicateNameWarning && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
              <div>
                <strong>Warning: Duplicate Company Name</strong>
                <p className="text-[11.5px] mt-0.5">
                  A company named &quot;{duplicateNameWarning}&quot; already exists.
                </p>
              </div>
            </div>
          )}

          {duplicateDomainWarning && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
              <div>
                <strong>Warning: Duplicate Website Domain</strong>
                <p className="text-[11.5px] mt-0.5">
                  Domain &quot;{duplicateDomainWarning.domain}&quot; is already in use by company &quot;{duplicateDomainWarning.name}&quot;.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[12px] font-semibold text-ink-2">Company / Business Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Acme Corp, TechWave Labs"
              className="w-full h-9.5 px-3 rounded-xl border border-line bg-surface text-[13px] text-ink focus:outline-none focus:border-accent"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-semibold text-ink-2">Owner Email *</label>
            <input
              type="email"
              required
              value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
              placeholder="owner@acmecorp.com"
              className="w-full h-9.5 px-3 rounded-xl border border-line bg-surface text-[13px] text-ink focus:outline-none focus:border-accent"
            />
            <p className="text-[11px] text-ink-3">An invite will be automatically sent to this email.</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-semibold text-ink-2">Website Domain / URL</label>
            <input
              type="text"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="e.g. https://acmecorp.com"
              className="w-full h-9.5 px-3 rounded-xl border border-line bg-surface text-[13px] text-ink focus:outline-none focus:border-accent"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-semibold text-ink-2">Subscription Plan</label>
            <select
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              className="w-full h-9.5 px-3 rounded-xl border border-line bg-surface text-[13px] text-ink focus:outline-none focus:border-accent capitalize"
            >
              <option value="free">Free (5 seats, 1,000 chats, 500 AI replies)</option>
              <option value="starter">Starter (10 seats, 5,000 chats, 2,000 AI replies)</option>
              <option value="pro">Pro (25 seats, 20,000 chats, 10,000 AI replies)</option>
              <option value="enterprise">Enterprise (100 seats, 100,000 chats, 50,000 AI replies)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-semibold text-ink-2">Brand Color Theme</label>
            <div className="flex items-center gap-2">
              {COLOR_PRESETS.map((col) => (
                <button
                  key={col}
                  type="button"
                  onClick={() => setBrandColor(col)}
                  className={`w-7 h-7 rounded-lg transition-transform ${
                    brandColor === col ? 'scale-115 ring-2 ring-accent ring-offset-2' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: col }}
                />
              ))}
              <input
                type="color"
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                className="w-7 h-7 rounded-lg cursor-pointer bg-transparent"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-semibold text-ink-2">Initial Greeting Title</label>
            <input
              type="text"
              value={greetingTitle}
              onChange={(e) => setGreetingTitle(e.target.value)}
              className="w-full h-9.5 px-3 rounded-xl border border-line bg-surface text-[13px] text-ink focus:outline-none focus:border-accent"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-line">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 rounded-xl border border-line bg-surface hover:bg-surface-2 text-ink text-[12px] font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="h-9 px-5 rounded-xl bg-accent text-accent-ink hover:opacity-90 text-[12px] font-semibold disabled:opacity-50"
            >
              {saving ? 'Creating & Sending Invite...' : 'Register Company'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// SUSPEND COMPANY MODAL (Requirement 1)
// ============================================================================
interface SuspendCompanyModalProps {
  company: CompanyMetricItem;
  onClose: () => void;
  onConfirm: (company: CompanyMetricItem, reason: string) => Promise<void>;
}

function SuspendCompanyModal({ company, onClose, onConfirm }: SuspendCompanyModalProps) {
  const [reason, setReason] = useState('Terms of service review / account administrative suspension');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      await onConfirm(company, reason.trim());
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to suspend company');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-surface border border-line rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-line flex items-center justify-between bg-surface-2/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
              <PauseCircle className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-[16px] font-bold text-ink">Suspend Workspace</h2>
              <p className="text-[11.5px] text-ink-3">{company.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-surface-3 flex items-center justify-center text-ink-3 hover:text-ink transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs">
              {errorMsg}
            </div>
          )}

          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs space-y-1.5">
            <div className="font-semibold flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Suspension Impact</span>
            </div>
            <ul className="list-disc pl-4 space-y-1 text-[11.5px]">
              <li>The chat widget will NOT load on the customer&apos;s website</li>
              <li>Support agents cannot log into the dashboard</li>
              <li>All historical conversations, visitors, and articles are kept safely</li>
              <li>You can reactivate this company anytime</li>
            </ul>
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-semibold text-ink-2">Suspension Reason</label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Provide a reason for suspension..."
              className="w-full p-2.5 rounded-xl border border-line bg-surface text-[12.5px] text-ink focus:outline-none focus:border-accent"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-line">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 rounded-xl border border-line bg-surface hover:bg-surface-2 text-ink text-[12px] font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="h-9 px-5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[12px] font-semibold disabled:opacity-50 flex items-center gap-1.5"
            >
              {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <PauseCircle className="w-3.5 h-3.5" />}
              <span>{loading ? 'Suspending...' : 'Suspend Workspace'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// DELETE COMPANY MODAL (Requirement 2)
// Typed confirmation ("DELETE"), soft delete for 30 days.
// ============================================================================
interface DeleteCompanyModalProps {
  company: CompanyMetricItem;
  onClose: () => void;
  onConfirm: (company: CompanyMetricItem) => Promise<void>;
}

function DeleteCompanyModal({ company, onClose, onConfirm }: DeleteCompanyModalProps) {
  const [typedConfirm, setTypedConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (typedConfirm !== 'DELETE') return;
    setLoading(true);
    setErrorMsg(null);
    try {
      await onConfirm(company);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to soft delete company');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-surface border border-line rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-line flex items-center justify-between bg-surface-2/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold">
              <Trash2 className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-[16px] font-bold text-ink">Delete Company Workspace</h2>
              <p className="text-[11.5px] text-ink-3">{company.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-surface-3 flex items-center justify-center text-ink-3 hover:text-ink transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs">
              {errorMsg}
            </div>
          )}

          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs space-y-1.5">
            <div className="font-semibold flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>30-Day Soft Delete Retention</span>
            </div>
            <p className="text-[11.5px] leading-relaxed">
              This workspace will be soft-deleted. The chat widget and agent logins will immediately stop working. All historical data is kept for <strong>30 days</strong> and can be restored at any time during this period.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-semibold text-ink-2">
              Type <span className="font-mono text-rose-500 font-bold">DELETE</span> to confirm:
            </label>
            <input
              type="text"
              required
              value={typedConfirm}
              onChange={(e) => setTypedConfirm(e.target.value)}
              placeholder="DELETE"
              className="w-full h-9.5 px-3 rounded-xl border border-line bg-surface text-[13px] font-mono text-ink focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-line">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 rounded-xl border border-line bg-surface hover:bg-surface-2 text-ink text-[12px] font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={typedConfirm !== 'DELETE' || loading}
              className="h-9 px-5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[12px] font-semibold disabled:opacity-40 flex items-center gap-1.5"
            >
              {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              <span>{loading ? 'Deleting...' : 'Confirm Soft Delete (30 Days)'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// ASSIGN / CHANGE OWNER MODAL (Requirement 3)
// ============================================================================
interface ChangeOwnerModalProps {
  company: CompanyMetricItem;
  onClose: () => void;
  onConfirm: (company: CompanyMetricItem, newOwnerEmail: string) => Promise<void>;
}

function ChangeOwnerModal({ company, onClose, onConfirm }: ChangeOwnerModalProps) {
  const [email, setEmail] = useState(company.owner_email || '');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      await onConfirm(company, email.trim());
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to assign owner');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-surface border border-line rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-line flex items-center justify-between bg-surface-2/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
              <Mail className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-[16px] font-bold text-ink">Assign / Change Owner</h2>
              <p className="text-[11.5px] text-ink-3">{company.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-surface-3 flex items-center justify-center text-ink-3 hover:text-ink transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs">
              {errorMsg}
            </div>
          )}

          <div className="space-y-1">
            <span className="text-[11px] text-ink-3 uppercase font-semibold">Current Owner</span>
            <div className="font-semibold text-ink text-sm">
              {company.owner_email ? (
                <span className="text-accent">{company.owner_email}</span>
              ) : (
                <span className="text-rose-500 italic">No owner assigned (0 seats)</span>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-semibold text-ink-2">New Owner Email Address *</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="owner@company.com"
              className="w-full h-9.5 px-3 rounded-xl border border-line bg-surface text-[13px] text-ink focus:outline-none focus:border-accent"
            />
            <p className="text-[11px] text-ink-3">
              This email will be assigned the workspace owner role and linked to this workspace.
            </p>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-line">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 rounded-xl border border-line bg-surface hover:bg-surface-2 text-ink text-[12px] font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="h-9 px-5 rounded-xl bg-accent text-accent-ink hover:opacity-90 text-[12px] font-semibold disabled:opacity-50 flex items-center gap-1.5"
            >
              {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
              <span>{loading ? 'Saving...' : 'Assign Owner'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// EDIT COMPANY SETTINGS MODAL (Requirement 4)
// Name, Domain, Plan & Limits (Seats, Monthly Conversations, AI Replies)
// ============================================================================
interface EditCompanyModalProps {
  company: CompanyMetricItem;
  onClose: () => void;
  onConfirm: (
    company: CompanyMetricItem,
    data: {
      name: string;
      website_url?: string | null;
      plan: string;
      plan_limits: CompanyPlanLimits;
    }
  ) => Promise<void>;
}

function EditCompanyModal({ company, onClose, onConfirm }: EditCompanyModalProps) {
  const [name, setName] = useState(company.name);
  const [websiteUrl, setWebsiteUrl] = useState(company.website_url || '');
  const [plan, setPlan] = useState(company.plan || 'free');
  const [maxSeats, setMaxSeats] = useState(company.plan_limits?.max_seats ?? 5);
  const [maxMonthlyConvs, setMaxMonthlyConvs] = useState(company.plan_limits?.max_monthly_conversations ?? 1000);
  const [maxAiReplies, setMaxAiReplies] = useState(company.plan_limits?.max_ai_replies ?? 500);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Company name is required');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      await onConfirm(company, {
        name: name.trim(),
        website_url: websiteUrl.trim() || null,
        plan,
        plan_limits: {
          max_seats: Number(maxSeats),
          max_monthly_conversations: Number(maxMonthlyConvs),
          max_ai_replies: Number(maxAiReplies),
        },
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update company settings');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-surface border border-line rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-line flex items-center justify-between bg-surface-2/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold">
              <Settings2 className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-[16px] font-bold text-ink">Edit Company Details</h2>
              <p className="text-[11.5px] text-ink-3">Manage name, domain, plan and usage limits</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-surface-3 flex items-center justify-center text-ink-3 hover:text-ink transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs">
              {errorMsg}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[12px] font-semibold text-ink-2">Company Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-9.5 px-3 rounded-xl border border-line bg-surface text-[13px] text-ink focus:outline-none focus:border-accent"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-semibold text-ink-2">Website Domain / URL</label>
            <input
              type="text"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="e.g. acme.com"
              className="w-full h-9.5 px-3 rounded-xl border border-line bg-surface text-[13px] text-ink focus:outline-none focus:border-accent"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-semibold text-ink-2">Subscription Plan</label>
            <select
              value={plan}
              onChange={(e) => {
                const newPlan = e.target.value;
                setPlan(newPlan);
                if (newPlan === 'free') {
                  setMaxSeats(5);
                  setMaxMonthlyConvs(1000);
                  setMaxAiReplies(500);
                } else if (newPlan === 'starter') {
                  setMaxSeats(10);
                  setMaxMonthlyConvs(5000);
                  setMaxAiReplies(2000);
                } else if (newPlan === 'pro') {
                  setMaxSeats(25);
                  setMaxMonthlyConvs(20000);
                  setMaxAiReplies(10000);
                } else if (newPlan === 'enterprise') {
                  setMaxSeats(100);
                  setMaxMonthlyConvs(100000);
                  setMaxAiReplies(50000);
                }
              }}
              className="w-full h-9.5 px-3 rounded-xl border border-line bg-surface text-[13px] text-ink focus:outline-none focus:border-accent capitalize"
            >
              <option value="free">Free</option>
              <option value="starter">Starter</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>

          <div className="space-y-3 pt-2 border-t border-line">
            <h4 className="text-[11.5px] font-bold text-ink uppercase tracking-wider">Plan Limits</h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[11.5px] text-ink-3">Max Seats</label>
                <input
                  type="number"
                  min={1}
                  value={maxSeats}
                  onChange={(e) => setMaxSeats(Number(e.target.value))}
                  className="w-full h-9 px-2.5 rounded-lg border border-line bg-surface text-[12.5px] text-ink focus:outline-none focus:border-accent"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11.5px] text-ink-3">Monthly Chats</label>
                <input
                  type="number"
                  min={0}
                  value={maxMonthlyConvs}
                  onChange={(e) => setMaxMonthlyConvs(Number(e.target.value))}
                  className="w-full h-9 px-2.5 rounded-lg border border-line bg-surface text-[12.5px] text-ink focus:outline-none focus:border-accent"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11.5px] text-ink-3">AI Replies</label>
                <input
                  type="number"
                  min={0}
                  value={maxAiReplies}
                  onChange={(e) => setMaxAiReplies(Number(e.target.value))}
                  className="w-full h-9 px-2.5 rounded-lg border border-line bg-surface text-[12.5px] text-ink focus:outline-none focus:border-accent"
                />
              </div>
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-line">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 rounded-xl border border-line bg-surface hover:bg-surface-2 text-ink text-[12px] font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="h-9 px-5 rounded-xl bg-accent text-accent-ink hover:opacity-90 text-[12px] font-semibold disabled:opacity-50 flex items-center gap-1.5"
            >
              {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>{loading ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// MERGE WORKSPACES MODAL (Requirement 5)
// ============================================================================
interface MergeWorkspacesModalProps {
  sourceCompany: CompanyMetricItem;
  allCompanies: CompanyMetricItem[];
  duplicateGroups: Map<string, string[]>;
  onClose: () => void;
  onConfirm: (sourceId: string, targetId: string) => Promise<void>;
}

function MergeWorkspacesModal({
  sourceCompany,
  allCompanies,
  duplicateGroups,
  onClose,
  onConfirm,
}: MergeWorkspacesModalProps) {
  const otherCompanies = useMemo(() => {
    return allCompanies.filter((c) => c.id !== sourceCompany.id && !c.deleted_at);
  }, [allCompanies, sourceCompany.id]);

  const cleanName = (sourceCompany.name || '').trim().toLowerCase();
  const cleanDomain = normalizeDomain(sourceCompany.website_url);
  const dupKey = `${cleanName}:::${cleanDomain}`;
  const dupIds = duplicateGroups.get(dupKey) || [];

  const sortedTargetOptions = useMemo(() => {
    return [...otherCompanies].sort((a, b) => {
      const aIsDup = dupIds.includes(a.id) ? 1 : 0;
      const bIsDup = dupIds.includes(b.id) ? 1 : 0;
      return bIsDup - aIsDup;
    });
  }, [otherCompanies, dupIds]);

  const [selectedTargetId, setSelectedTargetId] = useState<string>(
    sortedTargetOptions[0]?.id || ''
  );
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const targetCompany = otherCompanies.find((c) => c.id === selectedTargetId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTargetId || !confirmed) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      await onConfirm(sourceCompany.id, selectedTargetId);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to merge workspaces');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-surface border border-line rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-line flex items-center justify-between bg-surface-2/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              <GitMerge className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-[16px] font-bold text-ink">Merge Duplicate Workspaces</h2>
              <p className="text-[11.5px] text-ink-3">Consolidate data into a single destination workspace</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-surface-3 flex items-center justify-center text-ink-3 hover:text-ink transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Source Workspace Card */}
          <div className="p-3.5 rounded-xl border border-line bg-surface-2/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-ink-3 uppercase tracking-wider">
                Source Workspace (Will be deactivated)
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-surface-3 text-ink-2">Source</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-xs"
                style={{ backgroundColor: sourceCompany.brand_color || '#2563eb' }}
              >
                {sourceCompany.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-ink text-[13.5px] truncate">{sourceCompany.name}</div>
                <div className="text-[11.5px] text-ink-3">
                  {sourceCompany.website_url || 'No domain'} • {formatSeats(sourceCompany.agents_count)}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 pt-1 text-center text-[11px] text-ink-3">
              <div className="bg-surface p-1.5 rounded-lg border border-line">
                <div className="font-bold text-ink">{sourceCompany.conversations_count}</div>
                <div>Chats</div>
              </div>
              <div className="bg-surface p-1.5 rounded-lg border border-line">
                <div className="font-bold text-ink">{sourceCompany.messages_count}</div>
                <div>Messages</div>
              </div>
              <div className="bg-surface p-1.5 rounded-lg border border-line">
                <div className="font-bold text-ink">{sourceCompany.visitors_count}</div>
                <div>Visitors</div>
              </div>
              <div className="bg-surface p-1.5 rounded-lg border border-line">
                <div className="font-bold text-ink">{sourceCompany.articles_count}</div>
                <div>Articles</div>
              </div>
            </div>
          </div>

          {/* Target Workspace Selector */}
          <div className="space-y-1.5">
            <label className="text-[12px] font-semibold text-ink-2">Select Target Destination Workspace *</label>
            <select
              value={selectedTargetId}
              onChange={(e) => setSelectedTargetId(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-line bg-surface text-[13px] text-ink focus:outline-none focus:border-accent font-medium"
            >
              {sortedTargetOptions.map((c) => {
                const isDup = dupIds.includes(c.id);
                return (
                  <option key={c.id} value={c.id}>
                    {isDup ? '★ [Duplicate Match] ' : ''}{c.name} ({c.website_url || 'No URL'}) — {formatNumber(c.conversations_count)} chats
                  </option>
                );
              })}
            </select>
          </div>

          {targetCompany && (
            <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-1.5 text-xs">
              <div className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Destination: {targetCompany.name}</span>
              </div>
              <p className="text-ink-3 text-[11.5px]">
                All {sourceCompany.conversations_count} conversations, {sourceCompany.visitors_count} visitors, {sourceCompany.articles_count} help articles, and non-conflicting agents will be transferred into <strong>{targetCompany.name}</strong>.
              </p>
            </div>
          )}

          <div className="pt-2">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-0.5 rounded border-line text-accent focus:ring-accent"
              />
              <span className="text-[11.5px] text-ink-2">
                I understand this operation moves all records permanently from <strong>{sourceCompany.name}</strong> into the target workspace and soft-deletes the source.
              </span>
            </label>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-line">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 rounded-xl border border-line bg-surface hover:bg-surface-2 text-ink text-[12px] font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!confirmed || !selectedTargetId || loading}
              className="h-9 px-5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-[12px] font-semibold disabled:opacity-40 flex items-center gap-1.5"
            >
              {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <GitMerge className="w-3.5 h-3.5" />}
              <span>{loading ? 'Merging...' : 'Merge Workspaces'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// SORTABLE TABLE VIEW (Requirement 7)
// ============================================================================
interface CompaniesTableViewProps {
  companies: CompanyMetricItem[];
  currentWorkspaceId?: string;
  sortColumn: string;
  sortDirection: 'asc' | 'desc';
  onSort: (column: string) => void;
  onOpenDrilldown: (workspaceId: string) => void;
  onSwitchWorkspace: (comp: CompanyMetricItem) => void;
  switchingId: string | null;
  onOpenEdit: (comp: CompanyMetricItem) => void;
  onOpenChangeOwner: (comp: CompanyMetricItem) => void;
  onOpenSuspend: (comp: CompanyMetricItem) => void;
  onReactivate: (comp: CompanyMetricItem) => void;
  onOpenMerge: (comp: CompanyMetricItem) => void;
  onOpenDelete: (comp: CompanyMetricItem) => void;
  onRestore: (comp: CompanyMetricItem) => void;
}

function CompaniesTableView({
  companies,
  currentWorkspaceId,
  sortColumn,
  sortDirection,
  onSort,
  onOpenDrilldown,
  onSwitchWorkspace,
  switchingId,
  onOpenEdit,
  onOpenChangeOwner,
  onOpenSuspend,
  onReactivate,
  onOpenMerge,
  onOpenDelete,
  onRestore,
}: CompaniesTableViewProps) {
  const renderSortIndicator = (column: string) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="w-3 h-3 opacity-40 ml-1 inline" />;
    }
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-3 h-3 text-accent ml-1 inline" />
    ) : (
      <ChevronDown className="w-3 h-3 text-accent ml-1 inline" />
    );
  };

  return (
    <div className="border border-line rounded-2xl overflow-hidden bg-surface shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-[12px]">
          <thead>
            <tr className="border-b border-line bg-surface-2/60 text-ink-3 font-semibold uppercase text-[10.5px] tracking-wider select-none">
              <th className="py-3 px-4 cursor-pointer hover:text-ink" onClick={() => onSort('name')}>
                Company {renderSortIndicator('name')}
              </th>
              <th className="py-3 px-3 cursor-pointer hover:text-ink" onClick={() => onSort('owner')}>
                Owner {renderSortIndicator('owner')}
              </th>
              <th className="py-3 px-3 cursor-pointer hover:text-ink" onClick={() => onSort('status')}>
                Status {renderSortIndicator('status')}
              </th>
              <th className="py-3 px-3 cursor-pointer hover:text-ink" onClick={() => onSort('plan')}>
                Plan {renderSortIndicator('plan')}
              </th>
              <th className="py-3 px-3 cursor-pointer hover:text-ink" onClick={() => onSort('conversations_count')}>
                Chats {renderSortIndicator('conversations_count')}
              </th>
              <th className="py-3 px-3 cursor-pointer hover:text-ink" onClick={() => onSort('messages_count')}>
                Messages {renderSortIndicator('messages_count')}
              </th>
              <th className="py-3 px-3 cursor-pointer hover:text-ink" onClick={() => onSort('visitors_count')}>
                Visitors {renderSortIndicator('visitors_count')}
              </th>
              <th className="py-3 px-3 cursor-pointer hover:text-ink" onClick={() => onSort('agents_count')}>
                Seats {renderSortIndicator('agents_count')}
              </th>
              <th className="py-3 px-3 cursor-pointer hover:text-ink" onClick={() => onSort('widget_installed')}>
                Widget {renderSortIndicator('widget_installed')}
              </th>
              <th className="py-3 px-3 cursor-pointer hover:text-ink" onClick={() => onSort('ai_enabled')}>
                AI {renderSortIndicator('ai_enabled')}
              </th>
              <th className="py-3 px-3 cursor-pointer hover:text-ink" onClick={() => onSort('published_articles_count')}>
                Articles {renderSortIndicator('published_articles_count')}
              </th>
              <th className="py-3 px-3">
                Health Flags
              </th>
              <th className="py-3 px-3 cursor-pointer hover:text-ink" onClick={() => onSort('last_activity_at')}>
                Last Activity {renderSortIndicator('last_activity_at')}
              </th>
              <th className="py-3 px-3 cursor-pointer hover:text-ink" onClick={() => onSort('created_at')}>
                Created {renderSortIndicator('created_at')}
              </th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {companies.map((comp) => {
              const isCurrent = currentWorkspaceId === comp.id;
              const isSuspended = Boolean(comp.is_suspended && !comp.deleted_at);
              const isDeleted = Boolean(comp.deleted_at);
              const daysLeft = getDaysUntilPurge(comp.deleted_at);

              return (
                <tr
                  key={comp.id}
                  className={cn(
                    'hover:bg-surface-2/40 transition-colors',
                    isCurrent && 'bg-accent/5',
                    isDeleted && 'bg-rose-500/5',
                    isSuspended && 'bg-amber-500/5'
                  )}
                >
                  {/* 1. Company */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5 min-w-[160px]">
                      <div
                        className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center font-bold text-white text-xs"
                        style={{ backgroundColor: comp.brand_color || '#2563eb' }}
                      >
                        {comp.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-ink truncate flex items-center gap-1.5">
                          <span>{comp.name}</span>
                          {isCurrent && (
                            <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-accent text-accent-ink">
                              Active
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-ink-3 truncate max-w-[150px]">
                          {comp.website_url ? (
                            <a
                              href={comp.website_url.startsWith('http') ? comp.website_url : `https://${comp.website_url}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-accent hover:underline"
                            >
                              {comp.website_url.replace(/^https?:\/\//, '')}
                            </a>
                          ) : (
                            <span className="italic">No domain</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* 2. Owner */}
                  <td className="py-3 px-3">
                    <div className="min-w-[130px]">
                      {comp.owner_email ? (
                        <span className="text-accent truncate block" title={comp.owner_email}>
                          {comp.owner_email}
                        </span>
                      ) : (
                        <span className="text-rose-500 italic">No owner</span>
                      )}
                    </div>
                  </td>

                  {/* 3. Status */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    {isDeleted ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-600 border border-rose-500/30">
                        Soft-Deleted ({daysLeft}d)
                      </span>
                    ) : isSuspended ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-600 border border-amber-500/30">
                        Suspended
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
                        Active
                      </span>
                    )}
                  </td>

                  {/* 4. Plan */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                      {comp.plan || 'Free'}
                    </span>
                  </td>

                  {/* 5. Chats */}
                  <td className="py-3 px-3 whitespace-nowrap font-medium text-ink">
                    {formatNumber(comp.conversations_count)}{' '}
                    <span className="text-[10.5px] text-ink-3">({formatNumber(comp.open_conversations_count)})</span>
                  </td>

                  {/* 6. Messages */}
                  <td className="py-3 px-3 whitespace-nowrap font-medium text-ink">
                    {formatNumber(comp.messages_count)}
                  </td>

                  {/* 7. Visitors */}
                  <td className="py-3 px-3 whitespace-nowrap font-medium text-ink">
                    {formatNumber(comp.visitors_count)}
                    {comp.active_visitors_count > 0 && !isSuspended && !isDeleted && (
                      <span className="ml-1 inline-flex items-center px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-emerald-500/15 text-emerald-600">
                        🟢 {comp.active_visitors_count}
                      </span>
                    )}
                  </td>

                  {/* 8. Seats */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className={cn(comp.agents_count === 0 ? 'text-rose-500 font-bold' : 'text-ink font-medium')}>
                      {formatSeats(comp.agents_count)}
                    </span>
                  </td>

                  {/* 9. Widget */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    {comp.widget_installed ? (
                      <span className="text-emerald-500 font-semibold">Yes 🟢</span>
                    ) : (
                      <span className="text-ink-3">No ⚪</span>
                    )}
                  </td>

                  {/* 10. AI */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    {comp.ai_enabled ? (
                      <span className="text-indigo-500 font-bold">ON ⚡</span>
                    ) : (
                      <span className="text-ink-3">OFF</span>
                    )}
                  </td>

                  {/* 11. Articles */}
                  <td className="py-3 px-3 whitespace-nowrap text-ink font-medium">
                    {formatNumber(comp.published_articles_count ?? 0)}
                  </td>

                  {/* 12. Health Flags (Requirement 3) */}
                  <td className="py-3 px-3">
                    {comp.health_flags && comp.health_flags.length > 0 ? (
                      <div className="flex flex-wrap gap-1 max-w-[190px]">
                        {comp.health_flags.map((flag, idx) => (
                          <span
                            key={idx}
                            className={cn(
                              'inline-flex items-center px-1.5 py-0.5 rounded text-[9.5px] font-semibold border',
                              flag.includes('waiting over 24h')
                                ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                                : flag === 'widget not installed'
                                ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/25'
                                : flag === 'no agent online for 7 days'
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25'
                                : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/25'
                            )}
                            title={flag}
                          >
                            {flag}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3 h-3" />
                        Healthy
                      </span>
                    )}
                  </td>

                  {/* 13. Last Activity */}
                  <td className="py-3 px-3 whitespace-nowrap text-ink-3" title={comp.last_activity_at || ''}>
                    {formatRelativeTime(comp.last_activity_at)}
                  </td>

                  {/* 13. Created Date */}
                  <td className="py-3 px-3 whitespace-nowrap text-ink-3">
                    {new Date(comp.created_at).toLocaleDateString()}
                  </td>

                  {/* 14. Actions */}
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onOpenDrilldown(comp.id)}
                        className="h-7 px-2 rounded-lg border border-line bg-surface hover:bg-surface-2 text-ink text-[11px] font-medium"
                        title="View Insights"
                      >
                        Insights
                      </button>

                      {!isCurrent && (
                        <button
                          onClick={() => onSwitchWorkspace(comp)}
                          disabled={switchingId === comp.id || isSuspended || isDeleted}
                          className="h-7 px-2 rounded-lg bg-accent text-accent-ink hover:opacity-90 text-[11px] font-semibold disabled:opacity-40"
                          title="Switch into workspace"
                        >
                          Switch
                        </button>
                      )}

                      <button
                        onClick={() => onOpenEdit(comp)}
                        className="h-7 px-2 rounded-lg border border-line bg-surface hover:bg-surface-2 text-ink text-[11px]"
                        title="Edit name, domain, plan and limits"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => onOpenChangeOwner(comp)}
                        className="h-7 px-2 rounded-lg border border-line bg-surface hover:bg-surface-2 text-ink text-[11px]"
                        title="Change Owner"
                      >
                        Owner
                      </button>

                      {isSuspended ? (
                        <button
                          onClick={() => onReactivate(comp)}
                          className="h-7 px-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 text-[11px]"
                          title="Reactivate Workspace"
                        >
                          Reactivate
                        </button>
                      ) : (
                        <button
                          onClick={() => onOpenSuspend(comp)}
                          className="h-7 px-2 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-600 text-[11px]"
                          title="Suspend Workspace"
                        >
                          Suspend
                        </button>
                      )}

                      <button
                        onClick={() => onOpenMerge(comp)}
                        className="h-7 px-2 rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-600 text-[11px]"
                        title="Merge Workspace"
                      >
                        Merge
                      </button>

                      {isDeleted ? (
                        <button
                          onClick={() => onRestore(comp)}
                          className="h-7 px-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 text-[11px]"
                          title="Restore from Trash"
                        >
                          Restore
                        </button>
                      ) : (
                        <button
                          onClick={() => onOpenDelete(comp)}
                          className="h-7 px-2 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-600 text-[11px]"
                          title="Soft Delete Workspace"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// PAGINATION CONTROLS (Requirement 7)
// ============================================================================
interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

function PaginationControls({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
}: PaginationControlsProps) {
  const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 text-[12px] text-ink-3 border-t border-line">
      <div className="flex items-center gap-2">
        <span>
          Showing <strong className="text-ink">{start}</strong> to <strong className="text-ink">{end}</strong> of{' '}
          <strong className="text-ink">{totalItems}</strong> companies
        </span>
        <span>•</span>
        <div className="flex items-center gap-1.5">
          <span>Per page:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="h-7 px-2 rounded-lg border border-line bg-surface text-ink text-xs focus:outline-none"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="h-8 px-2.5 rounded-lg border border-line bg-surface hover:bg-surface-2 text-ink disabled:opacity-40 disabled:pointer-events-none transition-colors"
        >
          Previous
        </button>

        {Array.from({ length: Math.min(totalPages, 7) }, (_, idx) => {
          let pageNum: number;
          if (totalPages <= 7) {
            pageNum = idx + 1;
          } else if (currentPage <= 4) {
            pageNum = idx + 1;
          } else if (currentPage >= totalPages - 3) {
            pageNum = totalPages - 6 + idx;
          } else {
            pageNum = currentPage - 3 + idx;
          }
          return (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={cn(
                'h-8 min-w-8 px-2 rounded-lg border text-xs font-medium transition-colors',
                currentPage === pageNum
                  ? 'border-accent bg-accent text-accent-ink font-bold shadow-2xs'
                  : 'border-line bg-surface hover:bg-surface-2 text-ink'
              )}
            >
              {pageNum}
            </button>
          );
        })}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="h-8 px-2.5 rounded-lg border border-line bg-surface hover:bg-surface-2 text-ink disabled:opacity-40 disabled:pointer-events-none transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// DATA ISSUES PANEL MODAL
// ============================================================================
interface DataIssuesModalProps {
  dataIssues?: PlatformDataIssues;
  noOwnerCompanies: CompanyMetricItem[];
  duplicateCompanies: CompanyMetricItem[];
  duplicateGroups: Map<string, string[]>;
  onClose: () => void;
  onOpenCompanyDrilldown: (workspaceId: string) => void;
}

function DataIssuesModal({
  dataIssues,
  noOwnerCompanies,
  duplicateCompanies,
  duplicateGroups,
  onClose,
  onOpenCompanyDrilldown,
}: DataIssuesModalProps) {
  const [activeTab, setActiveTab] = useState<
    'all' | 'agents' | 'conversations' | 'messages' | 'visitors' | 'workspaces'
  >('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const orphanAgents = dataIssues?.orphan_agents || [];
  const orphanConversations = dataIssues?.orphan_conversations || [];
  const orphanMessages = dataIssues?.orphan_messages || [];
  const orphanVisitors = dataIssues?.orphan_visitors || [];
  const totalOrphans = dataIssues?.total_orphan_count || 0;
  const workspaceAnomaliesCount = noOwnerCompanies.length + duplicateCompanies.length;

  const q = searchTerm.toLowerCase().trim();

  const filteredAgents = orphanAgents.filter(
    (a) => !q || a.name?.toLowerCase().includes(q) || a.email?.toLowerCase().includes(q) || a.id.toLowerCase().includes(q)
  );

  const filteredConversations = orphanConversations.filter(
    (c) =>
      !q ||
      c.id.toLowerCase().includes(q) ||
      c.visitor_id.toLowerCase().includes(q) ||
      c.channel.toLowerCase().includes(q) ||
      c.issue_reason.toLowerCase().includes(q)
  );

  const filteredMessages = orphanMessages.filter(
    (m) =>
      !q ||
      m.id.toLowerCase().includes(q) ||
      m.conversation_id.toLowerCase().includes(q) ||
      m.content_preview.toLowerCase().includes(q) ||
      m.issue_reason.toLowerCase().includes(q)
  );

  const filteredVisitors = orphanVisitors.filter(
    (v) =>
      !q ||
      v.name?.toLowerCase().includes(q) ||
      v.email?.toLowerCase().includes(q) ||
      v.current_url?.toLowerCase().includes(q) ||
      v.id.toLowerCase().includes(q) ||
      v.issue_reason.toLowerCase().includes(q)
  );

  const filteredNoOwner = noOwnerCompanies.filter(
    (c) => !q || c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q) || c.website_url?.toLowerCase().includes(q)
  );

  const filteredDuplicates = duplicateCompanies.filter(
    (c) => !q || c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q) || c.website_url?.toLowerCase().includes(q)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-surface border border-line rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-line flex items-center justify-between bg-surface-2/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[17px] font-bold text-ink">Data Integrity &amp; Orphan Issues Panel</h2>
                <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  {formatNumber(totalOrphans + workspaceAnomaliesCount)} issues detected
                </span>
              </div>
              <p className="text-[11.5px] text-ink-3">
                Orphan database records unassociated with active companies and workspace anomalies.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-surface-3 flex items-center justify-center text-ink-3 hover:text-ink transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Informative Explanation Banner */}
        <div className="px-6 py-3 bg-blue-500/5 border-b border-blue-500/10 flex items-start gap-2.5 text-[12px] text-ink-2">
          <Database className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
          <p>
            <strong>Platform Accounting Rule:</strong> Platform totals strictly equal the sum of registered per-company cards. Orphan records lacking a valid workspace association are listed below for audit and maintenance.
          </p>
        </div>

        {/* Quick KPI Overview */}
        <div className="px-6 py-3.5 border-b border-line bg-surface grid grid-cols-2 sm:grid-cols-6 gap-2">
          <div className="p-2.5 rounded-xl border border-line bg-surface-2/40 text-center">
            <div className="text-[10px] uppercase font-bold text-ink-3">Orphan Agents</div>
            <div className="text-[16px] font-extrabold text-ink mt-0.5">{formatNumber(orphanAgents.length)}</div>
          </div>
          <div className="p-2.5 rounded-xl border border-line bg-surface-2/40 text-center">
            <div className="text-[10px] uppercase font-bold text-ink-3">Orphan Chats</div>
            <div className="text-[16px] font-extrabold text-ink mt-0.5">{formatNumber(orphanConversations.length)}</div>
          </div>
          <div className="p-2.5 rounded-xl border border-line bg-surface-2/40 text-center">
            <div className="text-[10px] uppercase font-bold text-ink-3">Orphan Msgs</div>
            <div className="text-[16px] font-extrabold text-ink mt-0.5">{formatNumber(orphanMessages.length)}</div>
          </div>
          <div className="p-2.5 rounded-xl border border-line bg-surface-2/40 text-center">
            <div className="text-[10px] uppercase font-bold text-ink-3">Orphan Visitors</div>
            <div className="text-[16px] font-extrabold text-ink mt-0.5">{formatNumber(orphanVisitors.length)}</div>
          </div>
          <div className="p-2.5 rounded-xl border border-line bg-surface-2/40 text-center">
            <div className="text-[10px] uppercase font-bold text-rose-500">0 Seats (No Owner)</div>
            <div className="text-[16px] font-extrabold text-rose-600 dark:text-rose-400 mt-0.5">{formatNumber(noOwnerCompanies.length)}</div>
          </div>
          <div className="p-2.5 rounded-xl border border-line bg-surface-2/40 text-center">
            <div className="text-[10px] uppercase font-bold text-amber-500">Duplicates</div>
            <div className="text-[16px] font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">{formatNumber(duplicateCompanies.length)}</div>
          </div>
        </div>

        {/* Tabs & Search Filter */}
        <div className="px-6 py-3 border-b border-line flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface-2/30">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {[
              ['all', `All (${formatNumber(totalOrphans + workspaceAnomaliesCount)})`],
              ['agents', `Agents (${formatNumber(orphanAgents.length)})`],
              ['conversations', `Chats (${formatNumber(orphanConversations.length)})`],
              ['messages', `Messages (${formatNumber(orphanMessages.length)})`],
              ['visitors', `Visitors (${formatNumber(orphanVisitors.length)})`],
              ['workspaces', `Workspace Flags (${formatNumber(workspaceAnomaliesCount)})`],
            ].map(([tab, label]) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={cn(
                  'h-8 px-3 rounded-lg text-[12px] font-medium transition-all whitespace-nowrap',
                  activeTab === tab
                    ? 'bg-accent text-accent-ink shadow-xs font-semibold'
                    : 'bg-surface-2 text-ink-2 hover:bg-surface-3 hover:text-ink'
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-60 shrink-0">
            <Search className="w-3.5 h-3.5 text-ink-3 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search orphan records..."
              className="w-full h-8 pl-8.5 pr-3 rounded-lg border border-line bg-surface text-[12px] text-ink placeholder:text-ink-3 focus:outline-none focus:border-accent"
            />
          </div>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-[12.5px]">
          {/* 1. AGENTS TAB / ALL */}
          {(activeTab === 'all' || activeTab === 'agents') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-ink uppercase tracking-wider text-[11.5px] flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Orphan Agents ({formatNumber(filteredAgents.length)})</span>
                </h3>
                <span className="text-[11px] text-ink-3">Agents registered without an active workspace</span>
              </div>

              {filteredAgents.length === 0 ? (
                <div className="p-4 text-center text-ink-3 border border-dashed border-line rounded-xl text-xs">
                  No orphan agents found.
                </div>
              ) : (
                <div className="border border-line rounded-xl overflow-hidden divide-y divide-line bg-surface">
                  {filteredAgents.map((ag) => (
                    <div key={ag.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-ink">{ag.name}</span>
                          <span className="text-[11px] text-ink-3">({ag.email})</span>
                          <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-600 uppercase">
                            {ag.role}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-ink-3">
                          <span className="text-rose-500 font-medium">{ag.issue_reason}</span>
                          <span>•</span>
                          <span>Joined {new Date(ag.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <code className="text-[11px] text-ink-3 font-mono bg-surface-2 px-2 py-1 rounded">
                          {ag.id}
                        </code>
                        <button
                          onClick={() => copyId(ag.id)}
                          className="p-1.5 rounded-lg hover:bg-surface-2 text-ink-3 hover:text-ink transition-colors"
                          title="Copy Agent ID"
                        >
                          {copiedId === ag.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 2. CONVERSATIONS TAB / ALL */}
          {(activeTab === 'all' || activeTab === 'conversations') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-ink uppercase tracking-wider text-[11.5px] flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Orphan Conversations ({formatNumber(filteredConversations.length)})</span>
                </h3>
                <span className="text-[11px] text-ink-3">Customer chats missing workspace ID</span>
              </div>

              {filteredConversations.length === 0 ? (
                <div className="p-4 text-center text-ink-3 border border-dashed border-line rounded-xl text-xs">
                  No orphan conversations found.
                </div>
              ) : (
                <div className="border border-line rounded-xl overflow-hidden divide-y divide-line bg-surface">
                  {filteredConversations.map((c) => (
                    <div key={c.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-ink">Conversation</span>
                          <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 uppercase">
                            {c.status}
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] bg-surface-2 text-ink-3 uppercase">
                            {c.channel}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-ink-3">
                          <span className="text-rose-500 font-medium">{c.issue_reason}</span>
                          <span>•</span>
                          <span>Visitor: {c.visitor_id.slice(0, 8)}...</span>
                          <span>•</span>
                          <span>Created {new Date(c.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <code className="text-[11px] text-ink-3 font-mono bg-surface-2 px-2 py-1 rounded">
                          {c.id}
                        </code>
                        <button
                          onClick={() => copyId(c.id)}
                          className="p-1.5 rounded-lg hover:bg-surface-2 text-ink-3 hover:text-ink transition-colors"
                          title="Copy Conversation ID"
                        >
                          {copiedId === c.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 3. MESSAGES TAB / ALL */}
          {(activeTab === 'all' || activeTab === 'messages') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-ink uppercase tracking-wider text-[11.5px] flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-purple-500" />
                  <span>Orphan Messages ({formatNumber(filteredMessages.length)})</span>
                </h3>
                <span className="text-[11px] text-ink-3">Messages linked to orphan conversations</span>
              </div>

              {filteredMessages.length === 0 ? (
                <div className="p-4 text-center text-ink-3 border border-dashed border-line rounded-xl text-xs">
                  No orphan messages found.
                </div>
              ) : (
                <div className="border border-line rounded-xl overflow-hidden divide-y divide-line bg-surface">
                  {filteredMessages.map((m) => (
                    <div key={m.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-ink">"{m.content_preview}..."</span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] bg-purple-500/10 text-purple-600 font-bold uppercase">
                            {m.sender_type}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-ink-3">
                          <span className="text-rose-500 font-medium">{m.issue_reason}</span>
                          <span>•</span>
                          <span>Parent Conv: {m.conversation_id ? `${m.conversation_id.slice(0, 8)}...` : 'None'}</span>
                          <span>•</span>
                          <span>{new Date(m.created_at).toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <code className="text-[11px] text-ink-3 font-mono bg-surface-2 px-2 py-1 rounded">
                          {m.id}
                        </code>
                        <button
                          onClick={() => copyId(m.id)}
                          className="p-1.5 rounded-lg hover:bg-surface-2 text-ink-3 hover:text-ink transition-colors"
                          title="Copy Message ID"
                        >
                          {copiedId === m.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 4. VISITORS TAB / ALL */}
          {(activeTab === 'all' || activeTab === 'visitors') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-ink uppercase tracking-wider text-[11.5px] flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-amber-500" />
                  <span>Orphan Visitors ({formatNumber(filteredVisitors.length)})</span>
                </h3>
                <span className="text-[11px] text-ink-3">Visitors without an assigned workspace ID</span>
              </div>

              {filteredVisitors.length === 0 ? (
                <div className="p-4 text-center text-ink-3 border border-dashed border-line rounded-xl text-xs">
                  No orphan visitors found.
                </div>
              ) : (
                <div className="border border-line rounded-xl overflow-hidden divide-y divide-line bg-surface">
                  {filteredVisitors.map((v) => (
                    <div key={v.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-ink">{v.name || 'Anonymous Visitor'}</span>
                          {v.email && <span className="text-[11px] text-ink-3">({v.email})</span>}
                          {v.location && (
                            <span className="text-[11px] text-ink-3 flex items-center gap-0.5">
                              <MapPin className="w-2.5 h-2.5" />
                              {v.location}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-ink-3 truncate">
                          <span className="text-rose-500 font-medium">{v.issue_reason}</span>
                          <span>•</span>
                          <span className="truncate max-w-xs">{v.current_url || 'Unknown page'}</span>
                          <span>•</span>
                          <span>Last seen {v.last_seen ? new Date(v.last_seen).toLocaleString() : 'N/A'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <code className="text-[11px] text-ink-3 font-mono bg-surface-2 px-2 py-1 rounded">
                          {v.id}
                        </code>
                        <button
                          onClick={() => copyId(v.id)}
                          className="p-1.5 rounded-lg hover:bg-surface-2 text-ink-3 hover:text-ink transition-colors"
                          title="Copy Visitor ID"
                        >
                          {copiedId === v.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 5. WORKSPACES TAB / ALL (No owner & Duplicates) */}
          {(activeTab === 'all' || activeTab === 'workspaces') && (
            <div className="space-y-4">
              {/* No Owner Workspaces */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider text-[11.5px] flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                    <span>Workspaces with No Owner ("0 seats") ({formatNumber(filteredNoOwner.length)})</span>
                  </h3>
                  <span className="text-[11px] text-ink-3">Workspaces having 0 registered agents</span>
                </div>

                {filteredNoOwner.length === 0 ? (
                  <div className="p-4 text-center text-ink-3 border border-dashed border-line rounded-xl text-xs">
                    All workspaces have assigned owners.
                  </div>
                ) : (
                  <div className="border border-line rounded-xl overflow-hidden divide-y divide-line bg-surface">
                    {filteredNoOwner.map((c) => (
                      <div key={c.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-ink">{c.name}</span>
                            <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20">
                              0 Seats
                            </span>
                          </div>
                          <div className="text-[11px] text-ink-3">
                            Domain: {c.website_url || 'None'} • Created {new Date(c.created_at).toLocaleDateString()}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onOpenCompanyDrilldown(c.id)}
                            className="h-8 px-3 rounded-lg border border-line bg-surface hover:bg-surface-2 text-ink text-xs font-medium"
                          >
                            Inspect Workspace
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Duplicates by Name + Domain */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider text-[11.5px] flex items-center gap-1.5">
                    <Copy className="w-3.5 h-3.5 text-amber-500" />
                    <span>Duplicate Workspaces by Name &amp; Domain ({formatNumber(filteredDuplicates.length)})</span>
                  </h3>
                  <span className="text-[11px] text-ink-3">Workspaces sharing identical normalized name and domain</span>
                </div>

                {filteredDuplicates.length === 0 ? (
                  <div className="p-4 text-center text-ink-3 border border-dashed border-line rounded-xl text-xs">
                    No duplicate workspaces detected.
                  </div>
                ) : (
                  <div className="border border-line rounded-xl overflow-hidden divide-y divide-line bg-surface">
                    {filteredDuplicates.map((c) => {
                      const cleanName = (c.name || '').trim().toLowerCase();
                      const cleanDomain = normalizeDomain(c.website_url);
                      const dupKey = `${cleanName}:::${cleanDomain}`;
                      const count = duplicateGroups.get(dupKey)?.length || 0;

                      return (
                        <div key={c.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-ink">{c.name}</span>
                              <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                                Duplicate ({count} workspaces)
                              </span>
                            </div>
                            <div className="text-[11px] text-ink-3">
                              Normalized Key: <code className="text-accent">{cleanName} @ {cleanDomain || '(empty)'}</code> • ID: {c.id}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => onOpenCompanyDrilldown(c.id)}
                              className="h-8 px-3 rounded-lg border border-line bg-surface hover:bg-surface-2 text-ink text-xs font-medium"
                            >
                              Inspect Workspace
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-line flex items-center justify-between bg-surface-2/40">
          <span className="text-[11.5px] text-ink-3">Super Admin Data Correctness &amp; Auditing Suite</span>
          <button
            onClick={onClose}
            className="h-8.5 px-4 rounded-xl border border-line bg-surface hover:bg-surface-2 text-ink text-[12px] font-medium"
          >
            Close Panel
          </button>
        </div>
      </div>
    </div>
  );
}

