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
import { PlatformAnalyticsData, PlatformTopCompany } from '@/app/actions/platform';
import { cn } from '@/lib/utils';

interface PlatformAnalyticsViewProps {
  analytics: PlatformAnalyticsData | null;
  loading: boolean;
  rangeDays: 7 | 30 | 90;
  onRangeChange: (days: 7 | 30 | 90) => void;
  onOpenCompanyInsights: (workspaceId: string) => void;
  onRefresh: () => void;
  refreshing: boolean;
  onExportCsv: () => void;
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
              <h2 className="text-[16px] font-bold text-ink">Platform Executive Radar</h2>
              {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin text-accent" />}
            </div>
            <p className="text-[12px] text-ink-3">
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
                  'h-7.5 px-3 rounded-lg text-[12px] font-semibold transition-all disabled:opacity-50',
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
            className="h-8.5 px-3 rounded-xl border border-line bg-surface hover:bg-surface-2 text-ink text-[12px] font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
            title="Refresh analytics data"
          >
            <RefreshCw className={cn('w-3.5 h-3.5 text-ink-3', (refreshing || loading) && 'animate-spin')} />
            <span>Refresh</span>
          </button>

          {/* CSV Export Button (Requirement 4) */}
          <button
            type="button"
            onClick={onExportCsv}
            className="h-8.5 px-3.5 rounded-xl border border-line bg-surface hover:bg-surface-2 text-ink text-[12px] font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
            title="Download full platform companies CSV report"
          >
            <Download className="w-3.5 h-3.5 text-accent" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Platform Stat Cards (Requirement 1) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* 1. Active Companies (had conversation in last 7 days) */}
        <div className="p-4.5 rounded-2xl border border-line bg-surface shadow-2xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-ink-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Active Companies
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[24px] font-extrabold text-ink tracking-tight">
              {loading ? '—' : `${formatNumber(analytics?.active_companies_7d_count)} / ${formatNumber(analytics?.total_companies_count)}`}
            </div>
            <div className="text-[11.5px] text-ink-3 font-medium mt-0.5">
              {loading ? 'Calculating...' : `${analytics?.active_companies_7d_percent ?? 0}% had chats in last 7d`}
            </div>
          </div>
        </div>

        {/* 2. New Companies in Range */}
        <div className="p-4.5 rounded-2xl border border-line bg-surface shadow-2xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-ink-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              New Companies
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[24px] font-extrabold text-ink tracking-tight">
              {loading ? '—' : `+${formatNumber(analytics?.totals?.total_new_companies)}`}
            </div>
            <div className="text-[11.5px] text-ink-3 font-medium mt-0.5">
              Joined in past {rangeDays} days
            </div>
          </div>
        </div>

        {/* 3. Conversations */}
        <div className="p-4.5 rounded-2xl border border-line bg-surface shadow-2xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-ink-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Conversations
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[24px] font-extrabold text-ink tracking-tight">
              {loading ? '—' : formatNumber(analytics?.totals?.total_conversations)}
            </div>
            <div className="text-[11.5px] text-ink-3 font-medium mt-0.5">
              Total volume in {rangeDays}d
            </div>
          </div>
        </div>

        {/* 4. Messages */}
        <div className="p-4.5 rounded-2xl border border-line bg-surface shadow-2xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-ink-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Messages
            </span>
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[24px] font-extrabold text-ink tracking-tight">
              {loading ? '—' : formatNumber(analytics?.totals?.total_messages)}
            </div>
            <div className="text-[11.5px] text-ink-3 font-medium mt-0.5">
              Sum across all tenants
            </div>
          </div>
        </div>

        {/* 5. Visitors */}
        <div className="p-4.5 rounded-2xl border border-line bg-surface shadow-2xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-ink-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Total Visitors
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Radio className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[24px] font-extrabold text-ink tracking-tight">
              {loading ? '—' : formatNumber(analytics?.totals?.total_visitors)}
            </div>
            <div className="text-[11.5px] text-ink-3 font-medium mt-0.5">
              Unique tracked visitors
            </div>
          </div>
        </div>

        {/* 6. AI Replies & Cost Estimate */}
        <div className="p-4.5 rounded-2xl border border-line bg-surface shadow-2xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-ink-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
              AI Cost Estimate
            </span>
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[24px] font-extrabold text-ink tracking-tight">
              {loading ? '—' : formatCurrency(analytics?.total_estimated_ai_cost)}
            </div>
            <div className="text-[11.5px] text-ink-3 font-medium mt-0.5" title="$0.002 per AI message reply">
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
              <h3 className="text-[14.5px] font-bold text-ink flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-500" />
                <span>Conversations &amp; Messages per Day</span>
              </h3>
              <p className="text-[11.5px] text-ink-3">
                Daily activity volume across all active tenants
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-medium text-ink-3">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                Messages
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
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
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="convGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
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
                    stroke="#6366f1"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#msgGradient)"
                  />
                  <Area
                    type="monotone"
                    dataKey="conversations"
                    name="Conversations"
                    stroke="#10b981"
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
              <h3 className="text-[14.5px] font-bold text-ink flex items-center gap-2">
                <Radio className="w-4 h-4 text-amber-500" />
                <span>Total Visitors per Day</span>
              </h3>
              <p className="text-[11.5px] text-ink-3">
                Daily unique visitor radar across all customer widgets
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-ink-3">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
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
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
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
                    stroke="#f59e0b"
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
              <h3 className="text-[14.5px] font-bold text-ink flex items-center gap-2">
                <Bot className="w-4 h-4 text-purple-500" />
                <span>AI Replies per Day &amp; AI Cost Estimate</span>
              </h3>
              <p className="text-[11.5px] text-ink-3">
                Daily bot responses with estimated OpenAI/Anthropic token cost ($0.002/reply)
              </p>
            </div>
            <div className="text-[11px] font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full">
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
                    fill="#8b5cf6"
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
              <h3 className="text-[14.5px] font-bold text-ink flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-500" />
                <span>New Companies per Week (Last 12 Weeks)</span>
              </h3>
              <p className="text-[11.5px] text-ink-3">
                Weekly tenant signup velocity and onboarding momentum
              </p>
            </div>
            <div className="text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">
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
            <h3 className="text-[15.5px] font-bold text-ink flex items-center gap-2">
              <Award className="w-4.5 h-4.5 text-amber-500" />
              <span>Top 10 Companies by Conversations</span>
            </h3>
            <p className="text-[12px] text-ink-3">
              Highest volume tenants ranked by total conversations handled in the selected period
            </p>
          </div>
          <span className="text-[11.5px] font-medium text-ink-3">
            Ranked by conversation share %
          </span>
        </div>

        <div className="border border-line rounded-xl overflow-hidden bg-surface">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[12.5px]">
              <thead>
                <tr className="border-b border-line bg-surface-2/60 text-ink-3 font-semibold uppercase text-[10.5px] tracking-wider">
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
                              ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40'
                              : rank === 2
                              ? 'bg-slate-400/20 text-slate-600 dark:text-slate-300 border border-slate-400/40'
                              : rank === 3
                              ? 'bg-amber-700/20 text-amber-700 dark:text-amber-500 border border-amber-700/40'
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
                            className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center font-bold text-white shadow-2xs text-[13px]"
                            style={{ backgroundColor: c.brand_color || '#2563eb' }}
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
                                className="text-[11px] text-accent hover:underline flex items-center gap-1 truncate max-w-[160px]"
                              >
                                <span>{c.website_url.replace(/^https?:\/\//, '')}</span>
                                <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                              </a>
                            ) : (
                              <span className="text-[11px] text-ink-3 italic">No website domain</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Plan Badge */}
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                          {c.plan || 'Free'}
                        </span>
                      </td>

                      {/* Conversations Count */}
                      <td className="py-3 px-4">
                        <span className="font-bold text-ink text-[13.5px]">
                          {formatNumber(c.conversations_count)}
                        </span>
                      </td>

                      {/* Volume Share % Bar */}
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-ink-3 font-medium">Platform Share</span>
                            <span className="font-bold text-ink">{c.share_percent}%</span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-surface-3 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
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
                          className="h-7.5 px-3 rounded-lg border border-line bg-surface hover:bg-surface-2 text-ink text-[11.5px] font-medium inline-flex items-center gap-1 transition-colors shadow-2xs"
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
