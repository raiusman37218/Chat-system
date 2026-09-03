'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart2,
  Clock,
  CheckCircle2,
  Star,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  MessageSquare,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Workspace, Agent } from '@/types/database';

interface AnalyticsDashboardProps {
  workspace: Workspace;
  currentAgent: Agent;
}

interface AnalyticsData {
  summary: {
    totalConversations: number;
    volumeChangePercent: number;
    avgFirstResponseSeconds: number | null;
    avgResolutionSeconds: number | null;
    avgCsat: number | null;
    positiveCsatPercent: number | null;
    totalCsatRatings: number;
  };
  statusBreakdown: Array<{ name: string; value: number; color: string }>;
  timelineData: Array<{
    date: string;
    total: number;
    resolved: number;
    /** null on days with no ratings, so the trend line breaks instead of lying. */
    csat: number | null;
  }>;
  perAgentPerformance: Array<{
    id: string;
    name: string;
    email: string;
    status: string;
    role: string;
    handled: number;
    resolved: number;
    resolutionRate: number | null;
    avgFrt: number | null;
    avgResolution: number | null;
    csatScore: number | null;
    csatCount: number;
  }>;
}

/** An em dash beats a made-up number when there is nothing to average. */
function formatDuration(seconds: number | null): string {
  if (seconds === null || seconds === undefined) return '—';
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const remSecs = seconds % 60;
  if (mins < 60) {
    return remSecs > 0 ? `${mins}m ${remSecs}s` : `${mins}m`;
  }
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  return `${hours}h ${remMins}m`;
}

export function AnalyticsDashboard({ workspace, currentAgent }: AnalyticsDashboardProps) {
  const [range, setRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [granularity, setGranularity] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<AnalyticsData | null>(null);

  const fetchAnalytics = async () => {
    try {
      setRefreshing(true);
      const res = await fetch(
        `/api/analytics?workspace_id=${workspace.id}&range=${range}&granularity=${granularity}`
      );
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [workspace.id, range, granularity]);

  // Empty, not "typical". This renders while loading and on error, where a
  // plausible-looking 4.8 would be indistinguishable from a real measurement.
  const summary = data?.summary || {
    totalConversations: 0,
    volumeChangePercent: 0,
    avgFirstResponseSeconds: null,
    avgResolutionSeconds: null,
    avgCsat: null,
    positiveCsatPercent: null,
    totalCsatRatings: 0,
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-surface-2 overflow-y-auto">
      {/* Header */}
      <div className="h-16 px-8 border-b border-line flex items-center justify-between bg-surface sticky top-0 z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent/10 text-accent flex items-center justify-center font-bold">
            <BarChart2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[17px] font-bold text-ink tracking-tight">Support Analytics</h1>
              <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Aggregations
              </span>
            </div>
            <p className="text-[12px] text-ink-3">
              Real-time insights across conversation volume, first-response times, resolution speed, and CSAT.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          {/* Time Range Selector */}
          <div className="flex items-center bg-surface-2 p-0.5 rounded-xl border border-line text-xs font-medium">
            {(
              [
                ['7d', 'Last 7 Days'],
                ['30d', 'Last 30 Days'],
                ['90d', 'Last 90 Days'],
              ] as const
            ).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setRange(val)}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  range === val
                    ? 'bg-white dark:bg-slate-800 text-ink shadow-xs font-semibold'
                    : 'text-ink-3 hover:text-ink'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Granularity Switcher */}
          <div className="flex items-center bg-surface-2 p-0.5 rounded-xl border border-line text-xs font-medium">
            {(
              [
                ['daily', 'Day'],
                ['weekly', 'Week'],
                ['monthly', 'Month'],
              ] as const
            ).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setGranularity(val)}
                className={`px-2.5 py-1.5 rounded-lg capitalize transition-colors ${
                  granularity === val
                    ? 'bg-white dark:bg-slate-800 text-ink shadow-xs font-semibold'
                    : 'text-ink-3 hover:text-ink'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchAnalytics}
            disabled={refreshing}
            className="btn btn-sm btn-secondary p-2"
            title="Refresh Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div className="p-8 max-w-7xl mx-auto w-full space-y-8 pb-20">
        {/* 1. TOP 4 KPI CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* KPI 1: Total Conversations */}
          <div className="card p-5 space-y-2">
            <div className="flex items-center justify-between text-ink-3 text-xs font-medium">
              <span>Total Conversations</span>
              <MessageSquare className="w-4 h-4 text-accent" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-ink tracking-tight">
                {summary.totalConversations}
              </span>
              {summary.volumeChangePercent !== 0 && (
                <span
                  className={`text-xs font-semibold flex items-center gap-0.5 ${
                    summary.volumeChangePercent > 0 ? 'text-emerald-600' : 'text-amber-600'
                  }`}
                >
                  {summary.volumeChangePercent > 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {summary.volumeChangePercent > 0 ? '+' : ''}
                  {summary.volumeChangePercent}%
                </span>
              )}
            </div>
            <p className="text-[11.5px] text-ink-3">Inbound visitor messages</p>
          </div>

          {/* KPI 2: Avg First Response Time */}
          <div className="card p-5 space-y-2">
            <div className="flex items-center justify-between text-ink-3 text-xs font-medium">
              <span>Avg First Response (FRT)</span>
              <Clock className="w-4 h-4 text-blue-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-ink tracking-tight">
                {formatDuration(summary.avgFirstResponseSeconds)}
              </span>
              {/* "Fast" used to show unconditionally, including on a fabricated
                  average. It is a judgement, so it needs a real number first. */}
              {summary.avgFirstResponseSeconds !== null &&
                summary.avgFirstResponseSeconds < 120 && (
                  <span className="text-xs font-semibold text-emerald-600 flex items-center gap-0.5">
                    <CheckCircle2 className="w-3 h-3" /> Fast
                  </span>
                )}
            </div>
            <p className="text-[11.5px] text-ink-3">
              {summary.avgFirstResponseSeconds === null
                ? 'No replies measured yet'
                : 'Time until first agent reply'}
            </p>
          </div>

          {/* KPI 3: Avg Resolution Time */}
          <div className="card p-5 space-y-2">
            <div className="flex items-center justify-between text-ink-3 text-xs font-medium">
              <span>Avg Resolution Time</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-ink tracking-tight">
                {formatDuration(summary.avgResolutionSeconds)}
              </span>
            </div>
            <p className="text-[11.5px] text-ink-3">
              {summary.avgResolutionSeconds === null
                ? 'No conversations resolved yet'
                : 'From start to closed ticket'}
            </p>
          </div>

          {/* KPI 4: CSAT Satisfaction Score */}
          <div className="card p-5 space-y-2">
            <div className="flex items-center justify-between text-ink-3 text-xs font-medium">
              <span>Customer Satisfaction (CSAT)</span>
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-ink tracking-tight flex items-center gap-1">
                {summary.avgCsat ?? '—'}
                {summary.avgCsat !== null && (
                  <span className="text-amber-500 text-lg">★</span>
                )}
              </span>
              {summary.positiveCsatPercent !== null && (
                <span
                  className={`text-xs font-semibold ${
                    summary.positiveCsatPercent >= 60
                      ? 'text-emerald-600'
                      : 'text-amber-600'
                  }`}
                >
                  {summary.positiveCsatPercent}% positive
                </span>
              )}
            </div>
            <p className="text-[11.5px] text-ink-3">
              {summary.totalCsatRatings > 0
                ? `Based on ${summary.totalCsatRatings} post-chat rating${
                    summary.totalCsatRatings === 1 ? '' : 's'
                  }`
                : 'No ratings collected yet'}
            </p>
          </div>
        </div>

        {/* 2. CHARTS ROW 1: VOLUME TIMELINE & STATUS BREAKDOWN */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Chart: Conversation Volume Over Time */}
          <div className="lg:col-span-8 card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[15px] font-semibold text-ink">
                  Conversation Volume Over Time
                </h3>
                <p className="text-[12px] text-ink-3">
                  Total incoming conversations vs resolved tickets per {granularity}.
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-medium">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#2563eb]" />
                  Total Conversations
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
                  Resolved
                </span>
              </div>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={data?.timelineData || []}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-line, #e2e8f0)" opacity={0.6} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: 'var(--color-ink-3, #94a3b8)' }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: 'var(--color-ink-3, #94a3b8)' }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-surface-0, #ffffff)',
                      borderColor: 'var(--color-line, #e2e8f0)',
                      borderRadius: '12px',
                      fontSize: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    name="Inbound Chats"
                    stroke="#2563eb"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorTotal)"
                  />
                  <Area
                    type="monotone"
                    dataKey="resolved"
                    name="Resolved"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorResolved)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right Chart: Status Breakdown Donut */}
          <div className="lg:col-span-4 card p-6 space-y-4">
            <div>
              <h3 className="text-[15px] font-semibold text-ink">Status Breakdown</h3>
              <p className="text-[12px] text-ink-3">Current distribution of tickets.</p>
            </div>

            <div className="h-56 w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data?.statusBreakdown || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={62}
                    outerRadius={86}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {(data?.statusBreakdown || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-surface-0, #ffffff)',
                      borderColor: 'var(--color-line, #e2e8f0)',
                      borderRadius: '10px',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Center Stat */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold text-ink">{summary.totalConversations}</span>
                <span className="text-[10.5px] text-ink-3 uppercase tracking-wider font-semibold">
                  Total
                </span>
              </div>
            </div>

            {/* Legend List */}
            <div className="space-y-2 pt-1 border-t border-line">
              {(data?.statusBreakdown || []).map((item) => {
                const pct =
                  summary.totalConversations > 0
                    ? Math.round((item.value / summary.totalConversations) * 100)
                    : 0;
                return (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-ink font-medium">{item.name}</span>
                    </span>
                    <span className="text-ink-3 font-semibold">
                      {item.value} ({pct}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 3. CHARTS ROW 2: CSAT TREND OVER TIME */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[15px] font-semibold text-ink">CSAT Satisfaction Trend</h3>
              <p className="text-[12px] text-ink-3">
                Average visitor rating score (1.0 - 5.0) submitted via the post-chat widget survey.
              </p>
            </div>
            <div className="flex items-center gap-2 bg-amber-500/10 text-amber-600 px-3 py-1 rounded-full text-xs font-bold">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>Goal: &ge; 4.5 Stars</span>
            </div>
          </div>

          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data?.timelineData || []}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-line, #e2e8f0)" opacity={0.6} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: 'var(--color-ink-3, #94a3b8)' }}
                />
                <YAxis
                  domain={[1, 5]}
                  ticks={[1, 2, 3, 4, 5]}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: 'var(--color-ink-3, #94a3b8)' }}
                />
                <Tooltip
                  formatter={(val: any) => [`${val} ★`, 'CSAT Score']}
                  contentStyle={{
                    backgroundColor: 'var(--color-surface-0, #ffffff)',
                    borderColor: 'var(--color-line, #e2e8f0)',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="csat"
                  name="CSAT Score"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#f59e0b' }}
                  activeDot={{ r: 5 }}
                  // Days without ratings are gaps, not a continuation.
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. PER-AGENT PERFORMANCE BENCHMARK TABLE */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-line pb-4">
            <div>
              <h3 className="text-[16px] font-semibold text-ink">Per-Agent Performance</h3>
              <p className="text-[12.5px] text-ink-3 mt-0.5">
                Workload distribution, response efficiency, and customer satisfaction by team member.
              </p>
            </div>
            <span className="text-xs font-medium text-ink-3">
              {data?.perAgentPerformance.length || 0} Agent(s)
            </span>
          </div>

          <div className="border border-line rounded-xl overflow-hidden divide-y divide-line">
            {/* Table Header */}
            <div className="p-3 px-5 bg-surface-2/60 text-[11.5px] font-semibold text-ink-3 uppercase tracking-wider grid grid-cols-12 gap-4 items-center">
              <div className="col-span-4">Agent Name</div>
              <div className="col-span-2 text-center">Handled</div>
              <div className="col-span-2 text-center">Avg Response (FRT)</div>
              <div className="col-span-2 text-center">Resolution Time</div>
              <div className="col-span-2 text-right">CSAT Score</div>
            </div>

            {/* Table Rows */}
            {(data?.perAgentPerformance || []).length === 0 ? (
              <div className="p-8 text-center text-xs text-ink-3">
                No active conversations assigned to agents in this timeframe.
              </div>
            ) : (
              (data?.perAgentPerformance || []).map((agent) => (
                <div
                  key={agent.id}
                  className="p-3.5 px-5 grid grid-cols-12 gap-4 items-center hover:bg-surface-2/30 transition-colors text-xs"
                >
                  {/* Agent Identity */}
                  <div className="col-span-4 flex items-center gap-3">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-accent/10 text-accent font-bold text-xs flex items-center justify-center">
                        {agent.name.slice(0, 2).toUpperCase()}
                      </div>
                      <span
                        className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-900 ${
                          agent.status === 'online'
                            ? 'bg-emerald-500'
                            : agent.status === 'away'
                            ? 'bg-amber-500'
                            : 'bg-slate-400'
                        }`}
                      />
                    </div>
                    <div>
                      <div className="font-semibold text-[13px] text-ink">{agent.name}</div>
                      <div className="text-[11px] text-ink-3">{agent.email}</div>
                    </div>
                  </div>

                  {/* Handled Conversations */}
                  <div className="col-span-2 text-center">
                    <span className="font-bold text-ink text-sm">{agent.handled}</span>
                    <div className="text-[10.5px] text-ink-3">
                      {agent.resolutionRate === null
                        ? 'No conversations'
                        : `${agent.resolutionRate}% resolved`}
                    </div>
                  </div>

                  {/* Avg First Response */}
                  <div className="col-span-2 text-center font-mono font-medium text-ink">
                    {formatDuration(agent.avgFrt)}
                  </div>

                  {/* Avg Resolution */}
                  <div className="col-span-2 text-center font-mono font-medium text-ink">
                    {formatDuration(agent.avgResolution)}
                  </div>

                  {/* CSAT Score */}
                  <div className="col-span-2 flex items-center justify-end gap-1.5">
                    {agent.csatScore === null ? (
                      <span className="text-[12px] text-ink-3">—</span>
                    ) : (
                      <>
                        <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold text-xs flex items-center gap-1">
                          <Star className="w-3 h-3 fill-current text-amber-500" />
                          {agent.csatScore}
                        </span>
                        <span className="text-[11px] text-ink-3 font-medium">
                          ({agent.csatCount})
                        </span>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
