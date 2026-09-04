'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { Workspace, Agent } from '@/types/database';
import { getWorkspaceHelpCenterUrl } from '@/lib/domain';
import {
  getPlatformCompaniesAction,
  getCompanyDrilldownAction,
  createCompanyAction,
  PlatformCompaniesData,
  CompanyMetricItem,
} from '@/app/actions/platform';
import { cn } from '@/lib/utils';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'conversations' | 'visitors' | 'agents' | 'newest'>('newest');
  const [filterType, setFilterType] = useState<'all' | 'active' | 'conversations' | 'helpdesk'>('all');

  // Drilldown modal state
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [drilldownLoading, setDrilldownLoading] = useState(false);
  const [drilldownData, setDrilldownData] = useState<any | null>(null);

  // Create modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Status feedback toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (text: string) => {
    setToastMessage(text);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);
      const res = await getPlatformCompaniesAction();
      setData(res);
    } catch (err: any) {
      console.error('Failed to load platform companies:', err);
      showToast(err.message || 'Failed to load companies data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openDrilldown = async (workspaceId: string) => {
    setSelectedCompanyId(workspaceId);
    setDrilldownLoading(true);
    try {
      const res = await getCompanyDrilldownAction(workspaceId);
      setDrilldownData(res);
    } catch (err: any) {
      console.error('Failed to load drilldown:', err);
      showToast('Could not load company details');
    } finally {
      setDrilldownLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    showToast('Copied to clipboard!');
  };

  // Filter & Sort companies
  const filteredCompanies = (data?.companies || [])
    .filter((comp) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = comp.name?.toLowerCase().includes(q);
        const matchesUrl = comp.website_url?.toLowerCase().includes(q);
        const matchesId = comp.id?.toLowerCase().includes(q);
        if (!matchesName && !matchesUrl && !matchesId) return false;
      }

      // Filter
      if (filterType === 'active') return comp.active_visitors_count > 0;
      if (filterType === 'conversations') return comp.conversations_count > 0;
      if (filterType === 'helpdesk') return comp.articles_count > 0;

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'conversations') return b.conversations_count - a.conversations_count;
      if (sortBy === 'visitors') return b.visitors_count - a.visitors_count;
      if (sortBy === 'agents') return b.agents_count - a.agents_count;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

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
        {/* KPI Platform Stat Cards */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="p-4.5 rounded-2xl border border-line bg-surface shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-ink-3">
              <span className="text-[11.5px] font-semibold uppercase tracking-wider">Companies</span>
              <Building2 className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-[26px] font-extrabold text-ink tracking-tight">
              {loading ? '—' : data?.total_companies || 0}
            </div>
            <div className="text-[11.5px] text-ink-3">Registered tenants</div>
          </div>

          <div className="p-4.5 rounded-2xl border border-line bg-surface shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-ink-3">
              <span className="text-[11.5px] font-semibold uppercase tracking-wider">Conversations</span>
              <MessageSquare className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-[26px] font-extrabold text-ink tracking-tight">
              {loading ? '—' : data?.total_conversations || 0}
            </div>
            <div className="text-[11.5px] text-ink-3">Total customer chats</div>
          </div>

          <div className="p-4.5 rounded-2xl border border-line bg-surface shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-ink-3">
              <span className="text-[11.5px] font-semibold uppercase tracking-wider">Messages</span>
              <MessageSquare className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-[26px] font-extrabold text-ink tracking-tight">
              {loading ? '—' : data?.total_messages || 0}
            </div>
            <div className="text-[11.5px] text-ink-3">Exchanged on platform</div>
          </div>

          <div className="p-4.5 rounded-2xl border border-line bg-surface shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-ink-3">
              <span className="text-[11.5px] font-semibold uppercase tracking-wider">Visitors</span>
              <Radio className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-[26px] font-extrabold text-ink tracking-tight">
              {loading ? '—' : data?.total_visitors || 0}
            </div>
            <div className="text-[11.5px] text-ink-3">Tracked across sites</div>
          </div>

          <div className="p-4.5 rounded-2xl border border-line bg-surface shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-ink-3">
              <span className="text-[11.5px] font-semibold uppercase tracking-wider">Support Agents</span>
              <Users className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-[26px] font-extrabold text-ink tracking-tight">
              {loading ? '—' : data?.total_agents || 0}
            </div>
            <div className="text-[11.5px] text-ink-3">Active team seats</div>
          </div>
        </section>

        {/* Filters and Search Bar */}
        <section className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {[
              ['all', `All (${data?.companies?.length || 0})`],
              ['active', 'Active Traffic 🟢'],
              ['conversations', 'Has Chats 💬'],
              ['helpdesk', 'Has Help Center 📚'],
            ].map(([val, label]) => (
              <button
                key={val}
                onClick={() => setFilterType(val as any)}
                className={cn(
                  'h-8 px-3 rounded-lg text-[12px] font-medium transition-all whitespace-nowrap',
                  filterType === val
                    ? 'bg-accent text-accent-ink shadow-xs'
                    : 'bg-surface-2 text-ink-2 hover:bg-surface-3 hover:text-ink'
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Search & Sort Controls */}
          <div className="flex items-center gap-2.5">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-ink-3 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search company or domain..."
                className="w-full h-8.5 pl-8.5 pr-3 rounded-lg border border-line bg-surface text-[12.5px] text-ink placeholder:text-ink-3 focus:outline-none focus:border-accent"
              />
            </div>

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
          </div>
        </section>

        {/* Companies Grid List */}
        <section className="space-y-3.5">
          {loading ? (
            <div className="p-12 text-center text-ink-3 text-[13px] space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-accent" />
              <p>Loading registered companies and data metrics...</p>
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-line bg-surface text-ink-3 space-y-2">
              <Building2 className="w-8 h-8 mx-auto text-ink-3/60" />
              <p className="font-semibold text-ink">No companies found</p>
              <p className="text-[12px]">Try adjusting your search query or filter criteria.</p>
            </div>
          ) : (
            filteredCompanies.map((comp) => {
              const isCurrent = currentWorkspace?.id === comp.id;

              return (
                <div
                  key={comp.id}
                  className={cn(
                    'p-5 rounded-2xl border transition-all bg-surface hover:shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-5',
                    isCurrent ? 'border-accent ring-1 ring-accent/30 shadow-xs' : 'border-line'
                  )}
                >
                  {/* Company Info */}
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
                        <h3 className="text-[15px] font-bold text-ink truncate leading-tight">
                          {comp.name}
                        </h3>
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-accent text-accent-ink shadow-2xs">
                            Active Workspace
                          </span>
                        )}
                        {comp.active_visitors_count > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            {comp.active_visitors_count} browsing now
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

                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Joined {new Date(comp.created_at).toLocaleDateString()}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Data Metrics Badges */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0 bg-surface-2/60 p-2.5 rounded-xl border border-line/60 text-[12px]">
                    <div className="px-2.5 py-1">
                      <div className="text-ink-3 text-[10.5px] font-medium uppercase">Chats</div>
                      <div className="font-bold text-ink text-[14px]">
                        {comp.conversations_count}
                        <span className="text-[11px] font-normal text-ink-3 ml-1">
                          ({comp.open_conversations_count} open)
                        </span>
                      </div>
                    </div>

                    <div className="px-2.5 py-1">
                      <div className="text-ink-3 text-[10.5px] font-medium uppercase">Messages</div>
                      <div className="font-bold text-ink text-[14px]">{comp.messages_count}</div>
                    </div>

                    <div className="px-2.5 py-1">
                      <div className="text-ink-3 text-[10.5px] font-medium uppercase">Visitors</div>
                      <div className="font-bold text-ink text-[14px]">{comp.visitors_count}</div>
                    </div>

                    <div className="px-2.5 py-1">
                      <div className="text-ink-3 text-[10.5px] font-medium uppercase">Agents</div>
                      <div className="font-bold text-ink text-[14px]">{comp.agents_count} seats</div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => openDrilldown(comp.id)}
                      className="h-9 px-3.5 rounded-xl border border-line bg-surface hover:bg-surface-2 text-ink text-[12px] font-medium flex items-center gap-1.5 transition-colors shadow-2xs"
                      title="View deep company metrics & team members"
                    >
                      <span>Insights</span>
                      <ChevronRight className="w-3.5 h-3.5 text-ink-3" />
                    </button>

                    {isCurrent ? (
                      <div className="h-9 px-3.5 rounded-xl bg-surface-2 border border-line text-ink-3 text-[12px] font-medium flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Current</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          if (onSwitchWorkspace) {
                            onSwitchWorkspace(comp as any);
                            showToast(`Switched active workspace to "${comp.name}"!`);
                          }
                        }}
                        className="h-9 px-3.5 rounded-xl bg-accent text-accent-ink hover:opacity-90 text-[12px] font-semibold flex items-center gap-1.5 transition-all shadow-xs"
                        title="Switch into this workspace inbox and dashboard"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                        <span>Switch</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </section>
      </main>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* COMPANY DRILLDOWN INSIGHTS MODAL                                   */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {selectedCompanyId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-surface border border-line rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-line flex items-center justify-between bg-surface-2/60">
              <div className="flex items-center gap-3">
                {drilldownData?.workspace && (
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shadow-xs"
                    style={{ backgroundColor: drilldownData.workspace.brand_color || '#2563eb' }}
                  >
                    {drilldownData.workspace.name?.charAt(0)}
                  </div>
                )}
                <div>
                  <h2 className="text-[16px] font-bold text-ink">
                    {drilldownLoading ? 'Loading Insights...' : drilldownData?.workspace?.name}
                  </h2>
                  <p className="text-[11.5px] text-ink-3">
                    Workspace ID: <code className="text-accent">{selectedCompanyId}</code>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyToClipboard(selectedCompanyId, 'modal-id')}
                  className="p-1.5 rounded-lg hover:bg-surface-3 text-ink-3 hover:text-ink transition-colors"
                  title="Copy Workspace ID"
                >
                  {copiedId === 'modal-id' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setSelectedCompanyId(null)}
                  className="w-8 h-8 rounded-lg hover:bg-surface-3 flex items-center justify-center text-ink-3 hover:text-ink transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Drilldown Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-[13px]">
              {drilldownLoading ? (
                <div className="p-12 text-center text-ink-3 space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-accent" />
                  <p>Fetching company team and activity data...</p>
                </div>
              ) : (
                <>
                  {/* Quick Links & Simulator */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <a
                      href={`/demo.html?workspaceId=${selectedCompanyId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-3.5 rounded-xl border border-line bg-surface-2/50 hover:bg-surface-2 transition-colors flex items-center justify-between text-ink"
                    >
                      <div className="flex items-center gap-2.5">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <div>
                          <div className="font-semibold text-[13px]">Test Website Simulator</div>
                          <div className="text-[11px] text-ink-3">Live chat widget preview</div>
                        </div>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-ink-3" />
                    </a>

                    <a
                      href={drilldownData?.workspace ? getWorkspaceHelpCenterUrl(drilldownData.workspace) : `/help/${selectedCompanyId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-3.5 rounded-xl border border-line bg-surface-2/50 hover:bg-surface-2 transition-colors flex items-center justify-between text-ink"
                    >
                      <div className="flex items-center gap-2.5">
                        <BookOpen className="w-4 h-4 text-blue-500" />
                        <div>
                          <div className="font-semibold text-[13px]">Public Help Center</div>
                          <div className="text-[11px] text-ink-3">Branded knowledge base</div>
                        </div>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-ink-3" />
                    </a>
                  </div>

                  {/* Team Members */}
                  <div className="space-y-2.5">
                    <h4 className="text-[12px] font-bold text-ink-3 uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Support Team Agents ({drilldownData?.agents?.length || 0})</span>
                    </h4>
                    <div className="border border-line rounded-xl overflow-hidden divide-y divide-line bg-surface">
                      {drilldownData?.agents?.map((ag: Agent) => (
                        <div key={ag.id} className="p-3 flex items-center justify-between gap-3 text-[12.5px]">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-surface-2 flex items-center justify-center font-bold text-accent text-xs">
                              {ag.name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-ink truncate">{ag.name}</div>
                              <div className="text-[11px] text-ink-3 truncate">{ag.email}</div>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10.5px] font-semibold bg-surface-2 text-ink-2 uppercase">
                            {ag.role}
                          </span>
                        </div>
                      ))}
                      {drilldownData?.agents?.length === 0 && (
                        <div className="p-4 text-center text-ink-3 text-xs">No registered agents yet.</div>
                      )}
                    </div>
                  </div>

                  {/* Recent Conversations */}
                  <div className="space-y-2.5">
                    <h4 className="text-[12px] font-bold text-ink-3 uppercase tracking-wider flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Recent Customer Conversations ({drilldownData?.recentConversations?.length || 0})</span>
                    </h4>
                    <div className="border border-line rounded-xl overflow-hidden divide-y divide-line bg-surface">
                      {drilldownData?.recentConversations?.map((conv: any) => (
                        <div key={conv.id} className="p-3 flex items-center justify-between gap-3 text-[12px]">
                          <div className="min-w-0">
                            <div className="font-semibold text-ink truncate">
                              {conv.visitor?.name || 'Anonymous Visitor'}
                            </div>
                            <div className="text-[11px] text-ink-3 truncate">
                              {conv.visitor?.email || 'No email provided'} • {new Date(conv.created_at).toLocaleString()}
                            </div>
                          </div>
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded text-[10px] font-bold uppercase',
                              conv.status === 'open'
                                ? 'bg-emerald-500/10 text-emerald-600'
                                : 'bg-slate-500/10 text-slate-500'
                            )}
                          >
                            {conv.status}
                          </span>
                        </div>
                      ))}
                      {drilldownData?.recentConversations?.length === 0 && (
                        <div className="p-4 text-center text-ink-3 text-xs">No conversations logged yet.</div>
                      )}
                    </div>
                  </div>

                  {/* Recent Visitors */}
                  <div className="space-y-2.5">
                    <h4 className="text-[12px] font-bold text-ink-3 uppercase tracking-wider flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-amber-500" />
                      <span>Recent Website Visitors ({drilldownData?.recentVisitors?.length || 0})</span>
                    </h4>
                    <div className="border border-line rounded-xl overflow-hidden divide-y divide-line bg-surface">
                      {drilldownData?.recentVisitors?.map((vis: any) => (
                        <div key={vis.id} className="p-3 flex items-center justify-between gap-3 text-[12px]">
                          <div className="min-w-0">
                            <div className="font-semibold text-ink truncate flex items-center gap-1.5">
                              <span>{vis.name || 'Anonymous Visitor'}</span>
                              {vis.location && (
                                <span className="text-[11px] text-ink-3 flex items-center gap-0.5">
                                  <MapPin className="w-2.5 h-2.5" />
                                  {vis.location}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-ink-3 truncate max-w-md">
                              {vis.current_url || 'Unknown page'}
                            </div>
                          </div>
                          <span className="text-[10.5px] text-ink-3 shrink-0">
                            {new Date(vis.last_seen).toLocaleTimeString()}
                          </span>
                        </div>
                      ))}
                      {drilldownData?.recentVisitors?.length === 0 && (
                        <div className="p-4 text-center text-ink-3 text-xs">No visitors recorded yet.</div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-line flex items-center justify-between bg-surface-2/40">
              <span className="text-[11.5px] text-ink-3">Live Multi-Tenant Database Sync</span>
              <button
                onClick={() => setSelectedCompanyId(null)}
                className="h-8.5 px-4 rounded-xl border border-line bg-surface hover:bg-surface-2 text-ink text-[12px] font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* REGISTER NEW COMPANY MODAL                                          */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {isCreateModalOpen && (
        <CreateCompanyModal
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
// CREATE COMPANY MODAL
// ============================================================================
interface CreateCompanyModalProps {
  onClose: () => void;
  onCreated: (workspace: Workspace) => void;
}

function CreateCompanyModal({ onClose, onCreated }: CreateCompanyModalProps) {
  const [name, setName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [brandColor, setBrandColor] = useState('#2563eb');
  const [greetingTitle, setGreetingTitle] = useState('Welcome to Support! 👋');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const COLOR_PRESETS = ['#2563eb', '#059669', '#8b5cf6', '#e11d48', '#f97316', '#0f172a'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Company name is required');
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    try {
      const res = await createCompanyAction({
        name: name.trim(),
        website_url: websiteUrl.trim() || undefined,
        brand_color: brandColor,
        greeting_title: greetingTitle.trim(),
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
      <div className="bg-surface border border-line rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col">
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs">
              {errorMsg}
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
              {saving ? 'Creating...' : 'Register Company'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
