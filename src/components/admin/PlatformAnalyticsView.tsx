'use client';

import React from 'react';
import {
  TrendingUp,
  Building2,
  MessageSquare,
  Radio,
  DollarSign,
  Users,
  Calendar,
  RefreshCw,
  Download,
  Flame,
  Bot,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Award,
  CheckCircle2,
  ThumbsUp,
  ShieldCheck,
  Clock,
  BookOpen,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { PlatformAnalyticsData, PlatformTopCompany, PlatformOverviewData } from '@/app/actions/platform';
import { cn } from '@/lib/utils';

interface PlatformAnalyticsViewProps {
  analytics: PlatformAnalyticsData | null;
  overview?: PlatformOverviewData | null;
  loading: boolean;
  rangeDays: 7 | 30 | 90;
  onRangeChange: (days: 7 | 30 | 90) => void;
  onOpenCompanyInsights: (workspaceId: string) => void;
  onRefresh: () => void;
  refreshing: boolean;
  onExportCsv: () => void;
}

function formatDuration(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || isNaN(seconds) || seconds < 0) return '—';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  if (hours < 24) return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}

function formatNumber(val: number | null | undefined): string {
  if (val === null || val === undefined) return '0';
  return Number(val).toLocaleString();
}

function formatCurrency(val: number | null | undefined): string {
  if (val === null || val === undefined) return '$0.00';
  if (val > 0 && val < 0.01) return '< $0.01';
  return `$${Number(val).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function PlatformAnalyticsView({
  analytics,
  overview,
  loading,
  rangeDays,
  onRangeChange,
  onOpenCompanyInsights,
  onRefresh,
  refreshing,
  onExportCsv,
}: PlatformAnalyticsViewProps) {
  const timeSeries = analytics?.time_series || [];
  const weeklyCompanies = analytics?.weekly_companies || [];
  const topCompanies = analytics?.top_10_companies || [];
  const overviewTicketsPerDay = overview?.tickets_per_day || [];
  const topHelpArticles = overview?.top_articles || [];

  return (
    <div className="space-y-7 animate-in fade-in duration-200">
      {/* Analytics Toolbar: Date Range Picker & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-surface border border-line shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center font-bold">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-ink">Platform Overview &amp; Executive Radar</h2>
              {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin text-accent" />}
            </div>
            <p className="text-xs text-ink-3">
              {analytics
                ? `Window: ${analytics.start_date} to ${analytics.end_date} (${rangeDays} days)`
                : 'Loading platform intelligence metrics...'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Date Range Picker (Requirement 4) */}
          <div className="flex items-center p-1 rounded-xl border border-line bg-surface-2 shadow-2xs">
            {([7, 30, 90] as const).map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => onRangeChange(days)}
                disabled={loading}
                className={cn(
                  'h-7.5 px-3 rounded-lg text-xs font-semibold transition-all disabled:opacity-50',
                  rangeDays === days
                    ? 'bg-accent text-accent-ink shadow-xs'
                    : 'text-ink-3 hover:text-ink hover:bg-surface/50'
                )}
              >
                {days} Days
              </button>
            ))}
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing || loading}
            className="h-8.5 px-3 rounded-xl border border-line bg-surface hover:bg-surface-2 text-ink text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
            title="Refresh analytics data"
          >
            <RefreshCw className={cn('w-3.5 h-3.5 text-ink-3', (refreshing || loading) && 'animate-spin')} />
            <span>Refresh</span>
          </button>

          {/* CSV Export Button (Requirement 4) */}
          <button
            type="button"
            onClick={onExportCsv}
            className="h-8.5 px-3.5 rounded-xl border border-line bg-surface hover:bg-surface-2 text-ink text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
            title="Download full platform companies CSV report"
          >
            <Download className="w-3.5 h-3.5 text-accent" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* SECTION 1: PLATFORM OVERVIEW (TOTALS ACROSS ALL WORKSPACES)           */}
      {/* ===================================================================== */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-ink uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-accent" />
              <span>Platform Totals Across All Workspaces</span>
            </h3>
            <p className="text-xs text-ink-3">
              Aggregated support ticket volume, response latency, resolution rates, and knowledge views
            </p>
          </div>
          {overview && (
            <span className="text-2xs font-semibold text-ink-3">
              {overview.total_workspaces} total workspaces ({overview.active_workspaces} active, {overview.suspended_workspaces} suspended)
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* 1. Tickets (30d and Total) */}
          <div className="p-4.5 rounded-2xl border border-line bg-surface shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-ink-3">
              <span className="text-2xs font-bold uppercase tracking-wider text-accent">Tickets (30d)</span>
              <MessageSquare className="w-4 h-4 text-accent" />
            </div>
            <div className="text-2xl font-extrabold text-ink tracking-tight tabular-nums">
              {loading ? '—' : formatNumber(overview?.tickets_30d ?? analytics?.totals?.total_conversations)}
            </div>
            <div className="text-xs text-ink-3">
              {loading ? '—' : `${formatNumber(overview?.total_tickets)} total all-time tickets`}
            </div>
          </div>

          {/* 2. Average First Reply Time */}
          <div className="p-4.5 rounded-2xl border border-line bg-surface shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-ink-3">
              <span className="text-2xs font-bold uppercase tracking-wider text-warn">Avg First Reply</span>
              <Clock className="w-4 h-4 text-warn" />
            </div>
            <div className="text-2xl font-extrabold text-ink tracking-tight tabular-nums">
              {loading ? '—' : formatDuration(overview?.avg_first_reply_seconds)}
            </div>
            <div className="text-xs text-ink-3">First reply speed across all tenants</div>
          </div>

          {/* 3. Resolution Rate */}
          <div className="p-4.5 rounded-2xl border border-line bg-surface shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-ink-3">
              <span className="text-2xs font-bold uppercase tracking-wider text-success">Resolution Rate</span>
              <CheckCircle2 className="w-4 h-4 text-success" />
            </div>
            <div className="text-2xl font-extrabold text-ink tracking-tight tabular-nums">
              {loading ? '—' : `${overview?.resolution_rate_percent ?? 0}%`}
            </div>
            <div className="text-xs text-ink-3">Solved / closed tickets ratio</div>
          </div>

          {/* 4. Total Platform Members */}
          <div className="p-4.5 rounded-2xl border border-line bg-surface shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-ink-3">
              <span className="text-2xs font-bold uppercase tracking-wider text-accent">Total Members</span>
              <Users className="w-4 h-4 text-accent" />
            </div>
            <div className="text-2xl font-extrabold text-ink tracking-tight tabular-nums">
              {loading ? '—' : formatNumber(overview?.total_members ?? analytics?.totals?.total_new_companies)}
            </div>
            <div className="text-xs text-ink-3">
              Registered workspace agents &amp; admins
            </div>
          </div>
        </div>

        {/* Tickets per Day Chart across all workspaces */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 p-6 rounded-2xl border border-line bg-surface shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-accent" />
                  <span>Platform Tickets per Day ({rangeDays} Days)</span>
                </h3>
                <p className="text-xs text-ink-3">
                  Daily ticket volume created versus solved across all workspaces
                </p>
              </div>
              <div className="flex items-center gap-3 text-2xs font-medium text-ink-3">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[var(--ds-accent)]" />
                  Created
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  Solved
                </span>
              </div>
            </div>

            <div className="h-64 w-full pt-2">
              {overviewTicketsPerDay.length === 0 ? (
                <div className="h-full flex items-center justify-center text-ink-3 text-xs">
                  No ticket activity logged across platform in this date range.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={overviewTicketsPerDay} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="platTicketCreatedGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--ds-accent)" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="var(--ds-accent)" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="platTicketSolvedGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                    <XAxis
                      dataKey="formatted_date"
                      tick={{ fontSize: 11, fill: 'currentColor' }}
                      tickLine={false}
                      axisLine={{ stroke: 'rgba(150, 150, 150, 0.2)' }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: 'currentColor' }}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(20, 24, 33, 0.95)',
                        backdropFilter: 'blur(8px)',
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '12px',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                        fontSize: '12px',
                        color: '#ffffff',
                      }}
                      labelStyle={{ color: '#cbd5e1', fontWeight: 600, marginBottom: '4px' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="tickets"
                      name="Tickets Created"
                      stroke="var(--ds-accent)"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#platTicketCreatedGrad)"
                    />
                    <Area
                      type="monotone"
                      dataKey="solved"
                      name="Tickets Solved"
                      stroke="#10b981"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#platTicketSolvedGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* AI Bot Resolved vs Handed to Human across all workspaces */}
          <div className="p-6 rounded-2xl border border-line bg-surface shadow-2xs space-y-4 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                <Bot className="w-4 h-4 text-accent" />
                <span>AI Bot vs Human Handover</span>
              </h3>
              <p className="text-xs text-ink-3 mt-0.5">
                Automated resolutions vs support agent escalations platform-wide
              </p>
            </div>

            <div className="space-y-3.5 my-auto">
              <div className="p-4 rounded-xl border border-line bg-surface-2/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-2xs text-ink-3 uppercase font-semibold">Bot Resolved</div>
                    <div className="text-xl font-bold text-ink tabular-nums">
                      {formatNumber(overview?.bot_resolved_count)}
                    </div>
                    <div className="text-2xs text-ink-3">Handled entirely by AI bot</div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-line bg-surface-2/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center font-bold">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-2xs text-ink-3 uppercase font-semibold">Handed to Human</div>
                    <div className="text-xl font-bold text-ink tabular-nums">
                      {formatNumber(overview?.bot_handover_count)}
                    </div>
                    <div className="text-2xs text-ink-3">Escalated to human support agent</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-2xs text-ink-3 border-t border-line pt-3 text-center">
              AI deflection rate: {overview && (overview.bot_resolved_count + overview.bot_handover_count) > 0
                ? `${Math.round((overview.bot_resolved_count / (overview.bot_resolved_count + overview.bot_handover_count)) * 100)}%`
                : '—'}
            </div>
          </div>
        </div>

        {/* Top Help Articles Viewed across Platform */}
        <div className="p-6 rounded-2xl border border-line bg-surface shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-accent" />
                <span>Top Help Articles Viewed (Platform-Wide)</span>
              </h3>
              <p className="text-xs text-ink-3 mt-0.5">
                Most viewed self-service articles across all tenant help centers
              </p>
            </div>
            <span className="text-2xs text-ink-3">
              {topHelpArticles.length} published articles
            </span>
          </div>

          {topHelpArticles.length === 0 ? (
            <div className="py-6 text-center text-xs text-ink-3 border border-line/60 rounded-xl bg-surface-2/30">
              No help articles published across workspaces yet.
            </div>
          ) : (
            <div className="border border-line rounded-xl overflow-hidden divide-y divide-line bg-surface">
              {topHelpArticles.map((art) => (
                <div key={art.id} className="p-3.5 flex items-center justify-between gap-4 text-xs">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-ink truncate flex items-center gap-2">
                      <span>{art.title}</span>
                      <span className="px-1.5 py-0.2 rounded text-2xs font-semibold bg-accent/10 text-accent">
                        {art.workspace_name}
                      </span>
                    </div>
                    <div className="text-2xs text-ink-3 truncate mt-0.5">
                      Slug: /{art.slug}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 text-ink-3">
                    <span className="inline-flex items-center gap-1 font-semibold text-ink">
                      <span>{formatNumber(art.views_count)}</span>
                      <span className="text-2xs font-normal text-ink-3">views</span>
                    </span>
                    {art.helpful_count > 0 && (
                      <span className="inline-flex items-center gap-1 text-emerald-500 font-medium text-2xs">
                        <ThumbsUp className="w-3 h-3" />
                        <span>{formatNumber(art.helpful_count)}</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* KPI Platform Stat Cards (Requirement 1) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* 1. Active Companies (had conversation in last 7 days) */}
        <div className="p-4.5 rounded-2xl border border-line bg-surface shadow-2xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-ink-3">
            <span className="text-2xs font-bold uppercase tracking-wider text-success">
              Active Companies
            </span>
            <div className="w-7 h-7 rounded-lg bg-success/10 text-success flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-ink tracking-tight">
              {loading ? '—' : `${formatNumber(analytics?.active_companies_7d_count)} / ${formatNumber(analytics?.total_companies_count)}`}
            </div>
            <div className="text-xs text-ink-3 font-medium mt-0.5">
              {loading ? 'Calculating...' : `${analytics?.active_companies_7d_percent ?? 0}% had chats in last 7d`}
            </div>
          </div>
        </div>

        {/* 2. New Companies in Range */}
        <div className="p-4.5 rounded-2xl border border-line bg-surface shadow-2xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-ink-3">
            <span className="text-2xs font-bold uppercase tracking-wider text-accent">
              New Companies
            </span>
            <div className="w-7 h-7 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-ink tracking-tight">
              {loading ? '—' : `+${formatNumber(analytics?.totals?.total_new_companies)}`}
            </div>
            <div className="text-xs text-ink-3 font-medium mt-0.5">
              Joined in past {rangeDays} days
            </div>
          </div>
        </div>

        {/* 3. Conversations */}
        <div className="p-4.5 rounded-2xl border border-line bg-surface shadow-2xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-ink-3">
            <span className="text-2xs font-bold uppercase tracking-wider text-success">
              Conversations
            </span>
            <div className="w-7 h-7 rounded-lg bg-success/10 text-success flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-ink tracking-tight">
              {loading ? '—' : formatNumber(analytics?.totals?.total_conversations)}
            </div>
            <div className="text-xs text-ink-3 font-medium mt-0.5">
              Total volume in {rangeDays}d
            </div>
          </div>
        </div>

        {/* 4. Messages */}
        <div className="p-4.5 rounded-2xl border border-line bg-surface shadow-2xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-ink-3">
            <span className="text-2xs font-bold uppercase tracking-wider text-accent">
              Messages
            </span>
            <div className="w-7 h-7 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-ink tracking-tight">
              {loading ? '—' : formatNumber(analytics?.totals?.total_messages)}
            </div>
            <div className="text-xs text-ink-3 font-medium mt-0.5">
              Sum across all tenants
            </div>
          </div>
        </div>

        {/* 5. Visitors */}
        <div className="p-4.5 rounded-2xl border border-line bg-surface shadow-2xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-ink-3">
            <span className="text-2xs font-bold uppercase tracking-wider text-warn">
              Total Visitors
            </span>
            <div className="w-7 h-7 rounded-lg bg-warn/10 text-warn flex items-center justify-center">
              <Radio className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-ink tracking-tight">
              {loading ? '—' : formatNumber(analytics?.totals?.total_visitors)}
            </div>
            <div className="text-xs text-ink-3 font-medium mt-0.5">
              Unique tracked visitors
            </div>
          </div>
        </div>

        {/* 6. AI Replies & Cost Estimate */}
        <div className="p-4.5 rounded-2xl border border-line bg-surface shadow-2xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-ink-3">
            <span className="text-2xs font-bold uppercase tracking-wider text-accent">
              AI Cost Estimate
            </span>
            <div className="w-7 h-7 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-ink tracking-tight">
              {loading ? '—' : formatCurrency(analytics?.total_estimated_ai_cost)}
            </div>
            <div className="text-xs text-ink-3 font-medium mt-0.5" title="$0.002 per AI message reply">
              {loading ? '—' : `${formatNumber(analytics?.totals?.total_ai_replies)} replies ($0.002/ea)`}
            </div>
          </div>
        </div>
      </section>

      {/* Visual Analytics Grid 1: Daily Volume Trends */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Conversations and Messages per Day */}
        <div className="p-6 rounded-2xl border border-line bg-surface shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-success" />
                <span>Conversations &amp; Messages per Day</span>
              </h3>
              <p className="text-xs text-ink-3">
                Daily activity volume across all active tenants
              </p>
            </div>
            <div className="flex items-center gap-3 text-2xs font-medium text-ink-3">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-accent" />
                Messages
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-success" />
                Conversations
              </span>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            {timeSeries.length === 0 ? (
              <div className="h-full flex items-center justify-center text-ink-3 text-xs">
                No activity data available in this date range.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="msgGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--ds-accent)" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="var(--ds-accent)" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="convGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--ds-success)" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="var(--ds-success)" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                  <XAxis
                    dataKey="formatted_date"
                    tick={{ fontSize: 11, fill: 'currentColor' }}
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(150, 150, 150, 0.2)' }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'currentColor' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v)}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(20, 24, 33, 0.95)',
                      backdropFilter: 'blur(8px)',
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                      fontSize: '12px',
                      color: '#ffffff',
                    }}
                    labelStyle={{ color: '#cbd5e1', fontWeight: 600, marginBottom: '4px' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="messages"
                    name="Messages"
                    stroke="var(--ds-accent)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#msgGradient)"
                  />
                  <Area
                    type="monotone"
                    dataKey="conversations"
                    name="Conversations"
                    stroke="var(--ds-success)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#convGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 2: Total Visitors per Day */}
        <div className="p-6 rounded-2xl border border-line bg-surface shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                <Radio className="w-4 h-4 text-warn" />
                <span>Total Visitors per Day</span>
              </h3>
              <p className="text-xs text-ink-3">
                Daily unique visitor radar across all customer widgets
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-2xs font-medium text-ink-3">
              <span className="w-2.5 h-2.5 rounded-full bg-warn" />
              Unique Visitors
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            {timeSeries.length === 0 ? (
              <div className="h-full flex items-center justify-center text-ink-3 text-xs">
                No visitor data available in this range.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="visGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--ds-warn)" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="var(--ds-warn)" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                  <XAxis
                    dataKey="formatted_date"
                    tick={{ fontSize: 11, fill: 'currentColor' }}
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(150, 150, 150, 0.2)' }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'currentColor' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v)}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(20, 24, 33, 0.95)',
                      backdropFilter: 'blur(8px)',
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                      fontSize: '12px',
                      color: '#ffffff',
                    }}
                    labelStyle={{ color: '#cbd5e1', fontWeight: 600, marginBottom: '4px' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="visitors"
                    name="Visitors"
                    stroke="var(--ds-warn)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#visGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </section>

      {/* Visual Analytics Grid 2: AI Replies & Weekly Companies */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 3: AI Replies & Cost per Day */}
        <div className="p-6 rounded-2xl border border-line bg-surface shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                <Bot className="w-4 h-4 text-accent" />
                <span>AI Replies per Day &amp; AI Cost Estimate</span>
              </h3>
              <p className="text-xs text-ink-3">
                Daily bot responses with estimated OpenAI/Anthropic token cost ($0.002/reply)
              </p>
            </div>
            <div className="text-2xs font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-full">
              {formatCurrency(analytics?.total_estimated_ai_cost)} total
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            {timeSeries.length === 0 ? (
              <div className="h-full flex items-center justify-center text-ink-3 text-xs">
                No AI replies logged in this range.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                  <XAxis
                    dataKey="formatted_date"
                    tick={{ fontSize: 11, fill: 'currentColor' }}
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(150, 150, 150, 0.2)' }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'currentColor' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    formatter={(value: any, name: any, item: any) => {
                      if (name === 'AI Replies') {
                        const cost = (Number(value) * 0.002).toFixed(3);
                        return [`${value} replies (~$${cost})`, 'AI Volume & Cost'];
                      }
                      return [value, name];
                    }}
                    contentStyle={{
                      backgroundColor: 'rgba(20, 24, 33, 0.95)',
                      backdropFilter: 'blur(8px)',
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                      fontSize: '12px',
                      color: '#ffffff',
                    }}
                    labelStyle={{ color: '#cbd5e1', fontWeight: 600, marginBottom: '4px' }}
                  />
                  <Bar
                    dataKey="ai_replies"
                    name="AI Replies"
                    fill="var(--ds-accent)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 4: New Companies per Week */}
        <div className="p-6 rounded-2xl border border-line bg-surface shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                <Building2 className="w-4 h-4 text-accent" />
                <span>New Companies per Week (Last 12 Weeks)</span>
              </h3>
              <p className="text-xs text-ink-3">
                Weekly tenant signup velocity and onboarding momentum
              </p>
            </div>
            <div className="text-2xs font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-full">
              {weeklyCompanies.reduce((acc, curr) => acc + curr.new_companies, 0)} new companies
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            {weeklyCompanies.length === 0 ? (
              <div className="h-full flex items-center justify-center text-ink-3 text-xs">
                No company creation history available.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyCompanies} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                  <XAxis
                    dataKey="week_label"
                    tick={{ fontSize: 10, fill: 'currentColor' }}
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(150, 150, 150, 0.2)' }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'currentColor' }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(20, 24, 33, 0.95)',
                      backdropFilter: 'blur(8px)',
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                      fontSize: '12px',
                      color: '#ffffff',
                    }}
                    labelStyle={{ color: '#cbd5e1', fontWeight: 600, marginBottom: '4px' }}
                  />
                  <Bar
                    dataKey="new_companies"
                    name="New Companies"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </section>

      {/* Top 10 Companies Leaderboard (Requirement 1) */}
      <section className="p-6 rounded-2xl border border-line bg-surface shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-md font-bold text-ink flex items-center gap-2">
              <Award className="w-4.5 h-4.5 text-warn" />
              <span>Top 10 Companies by Conversations</span>
            </h3>
            <p className="text-xs text-ink-3">
              Highest volume tenants ranked by total conversations handled in the selected period
            </p>
          </div>
          <span className="text-xs font-medium text-ink-3">
            Ranked by conversation share %
          </span>
        </div>

        <div className="border border-line rounded-xl overflow-hidden bg-surface">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-line bg-surface-2/60 text-ink-3 font-semibold uppercase text-2xs tracking-wider">
                  <th className="py-3 px-4 w-14">Rank</th>
                  <th className="py-3 px-4">Company</th>
                  <th className="py-3 px-4">Plan</th>
                  <th className="py-3 px-4">Conversations</th>
                  <th className="py-3 px-4 w-44">Volume Share</th>
                  <th className="py-3 px-4">Messages</th>
                  <th className="py-3 px-4">Visitors</th>
                  <th className="py-3 px-4 text-right">Drilldown</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {topCompanies.map((c, index) => {
                  const rank = index + 1;
                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-surface-2/50 transition-colors"
                    >
                      {/* Rank badge */}
                      <td className="py-3 px-4">
                        <span
                          className={cn(
                            'w-6 h-6 rounded-full inline-flex items-center justify-center font-bold text-xs shadow-2xs',
                            rank === 1
                              ? 'bg-warn/20 text-warn border border-warn/40'
                              : rank === 2
                              ? 'bg-ink-3/20 text-ink-2 border border-line-3/40'
                              : rank === 3
                              ? 'bg-warn/20 text-warn border border-warn/40'
                              : 'bg-surface-3 text-ink-3'
                          )}
                        >
                          {rank}
                        </span>
                      </td>

                      {/* Company Name & Avatar */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5 min-w-[180px]">
                          <div
                            className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center font-bold text-white shadow-2xs text-ui"
                            style={{ backgroundColor: c.brand_color || 'var(--ds-accent)' }}
                          >
                            {c.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-ink truncate">{c.name}</div>
                            {c.website_url ? (
                              <a
                                href={c.website_url.startsWith('http') ? c.website_url : `https://${c.website_url}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-2xs text-accent hover:underline flex items-center gap-1 truncate max-w-[160px]"
                              >
                                <span>{c.website_url.replace(/^https?:\/\//, '')}</span>
                                <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                              </a>
                            ) : (
                              <span className="text-2xs text-ink-3 italic">No website domain</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Plan Badge */}
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-2xs font-bold bg-accent/10 text-accent uppercase tracking-wider">
                          {c.plan || 'Free'}
                        </span>
                      </td>

                      {/* Conversations Count */}
                      <td className="py-3 px-4">
                        <span className="font-bold text-ink text-ui">
                          {formatNumber(c.conversations_count)}
                        </span>
                      </td>

                      {/* Volume Share % Bar */}
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-2xs">
                            <span className="text-ink-3 font-medium">Platform Share</span>
                            <span className="font-bold text-ink">{c.share_percent}%</span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-surface-3 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-success transition-all duration-500"
                              style={{ width: `${Math.min(100, Math.max(2, c.share_percent))}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Messages Count */}
                      <td className="py-3 px-4 font-medium text-ink-2">
                        {formatNumber(c.messages_count)}
                      </td>

                      {/* Visitors Count */}
                      <td className="py-3 px-4 font-medium text-ink-2">
                        {formatNumber(c.visitors_count)}
                      </td>

                      {/* Drilldown Action */}
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => onOpenCompanyInsights(c.id)}
                          className="h-7.5 px-3 rounded-lg border border-line bg-surface hover:bg-surface-2 text-ink text-xs font-medium inline-flex items-center gap-1 transition-colors shadow-2xs"
                        >
                          <span>Insights</span>
                          <ChevronRight className="w-3 h-3 text-ink-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {topCompanies.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-ink-3 text-xs">
                      No companies with conversations in this period yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
