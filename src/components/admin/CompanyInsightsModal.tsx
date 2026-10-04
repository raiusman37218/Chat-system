'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  BookOpen,
  ExternalLink,
  Users,
  MessageSquare,
  Radio,
  Clock,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Zap,
  TrendingUp,
  HelpCircle,
  Smile,
  ShieldCheck,
  Bot,
  UserCheck,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import {
  getCompanyDrilldownAction,
  getCompanyAnalyticsAction,
  CompanyMetricItem,
  CompanyAnalyticsData,
} from '@/app/actions/platform';
import { Agent, Workspace } from '@/types/database';
import { getWorkspaceHelpCenterUrl } from '@/lib/domain';
import { cn } from '@/lib/utils';

interface CompanyInsightsModalProps {
  workspaceId: string;
  activeCompany?: CompanyMetricItem | null;
  onClose: () => void;
  onSwitchWorkspace?: (workspace: Workspace) => void;
  onCopyId: (id: string, label: string) => void;
  copiedId: string | null;
}

function formatNumber(val: number | null | undefined): string {
  if (val === null || val === undefined) return '0';
  return Number(val).toLocaleString();
}

function formatSeats(count: number | null | undefined): string {
  const c = count ?? 0;
  return `${formatNumber(c)} ${c === 1 ? 'seat' : 'seats'}`;
}

function formatSecondsToTime(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || seconds <= 0) return '—';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  }
  const hours = Math.floor(seconds / 3600);
  const remainingMins = Math.floor((seconds % 3600) / 60);
  return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
}

export function CompanyInsightsModal({
  workspaceId,
  activeCompany,
  onClose,
  onSwitchWorkspace,
  onCopyId,
  copiedId,
}: CompanyInsightsModalProps) {
  const [rangeDays, setRangeDays] = useState<7 | 30 | 90>(30);
  const [loading, setLoading] = useState(true);
  const [drilldownData, setDrilldownData] = useState<any | null>(null);
  const [analyticsData, setAnalyticsData] = useState<CompanyAnalyticsData | null>(null);
  const [showUnansweredList, setShowUnansweredList] = useState(false);
  const [showKnowledgeGaps, setShowKnowledgeGaps] = useState(false);

  // Load both drilldown team/activity and analytics data
  const loadData = async (days: 7 | 30 | 90) => {
    try {
      setLoading(true);
      const [drillRes, analyticsRes] = await Promise.all([
        getCompanyDrilldownAction(workspaceId),
        getCompanyAnalyticsAction(workspaceId, days),
      ]);
      setDrilldownData(drillRes);
      setAnalyticsData(analyticsRes);
    } catch (err) {
      console.error('Failed to load company insights:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(rangeDays);
  }, [workspaceId, rangeDays]);

  const companyName =
    drilldownData?.workspace?.name || activeCompany?.name || 'Company';
  const brandColor =
    drilldownData?.workspace?.brand_color ||
    activeCompany?.brand_color ||
    '#2563eb';

  const healthFlags = analyticsData?.health_flags || activeCompany?.health_flags || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-surface border border-line rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header: Company Name, Brand Avatar, Date Range Picker, Close */}
        <div className="px-6 py-4 border-b border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-2/60">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-xs shrink-0 text-[15px]"
              style={{ backgroundColor: brandColor }}
            >
              {companyName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[17px] font-bold text-ink truncate max-w-md">
                  {companyName} — Insights &amp; Health
                </h2>
                {loading && (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-accent" />
                )}
              </div>
              <p className="text-[11.5px] text-ink-3">
                Workspace ID: <code className="text-accent font-mono">{workspaceId}</code>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-center">
            {/* Date Range Picker (Requirement 4) */}
            <div className="flex items-center p-0.5 rounded-lg border border-line bg-surface shrink-0">
              {([7, 30, 90] as const).map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setRangeDays(days)}
                  disabled={loading}
                  className={cn(
                    'h-7 px-2.5 rounded-md text-[11px] font-semibold transition-all disabled:opacity-50',
                    rangeDays === days
                      ? 'bg-accent text-accent-ink shadow-2xs'
                      : 'text-ink-3 hover:text-ink'
                  )}
                >
                  {days}d
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => onCopyId(workspaceId, 'modal-id')}
              className="p-1.5 rounded-lg hover:bg-surface-3 text-ink-3 hover:text-ink transition-colors"
              title="Copy Workspace ID"
            >
              {copiedId === 'modal-id' ? (
                <Check className="w-4 h-4 text-emerald-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-surface-3 flex items-center justify-center text-ink-3 hover:text-ink transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-[13px]">
          {/* Diagnostic Health Flags Banner (Requirement 3) */}
          <div
            className={cn(
              'p-4 rounded-xl border flex flex-col gap-2.5 transition-all',
              healthFlags.length > 0
                ? 'bg-amber-500/10 border-amber-500/30'
                : 'bg-emerald-500/10 border-emerald-500/25'
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {healthFlags.length > 0 ? (
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                ) : (
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                )}
                <span className="font-bold text-[13px] text-ink">
                  {healthFlags.length > 0
                    ? `Health Diagnostic Issues (${healthFlags.length})`
                    : 'Company Health Status: All Systems Operational'}
                </span>
              </div>
              <span className="text-[11px] text-ink-3">Live Tenant Monitor</span>
            </div>

            {healthFlags.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {healthFlags.map((flag, idx) => {
                  let hint = '';
                  if (flag === 'widget not installed') {
                    hint = 'Widget embed script not active on customer website';
                  } else if (flag === 'no agent online for 7 days') {
                    hint = 'No support agents logged in or replied in past week';
                  } else if (flag.includes('waiting over 24h')) {
                    hint = 'Customer chats currently waiting > 24 hours for a response';
                  } else if (flag === 'no help articles') {
                    hint = 'Zero published articles in public knowledge base';
                  }

                  return (
                    <div
                      key={idx}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11.5px] font-semibold border',
                        flag.includes('waiting over 24h')
                          ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                          : flag === 'widget not installed'
                          ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/25'
                          : flag === 'no agent online for 7 days'
                          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                          : 'bg-surface-2 text-ink-2 border-line'
                      )}
                      title={hint}
                    >
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{flag}</span>
                      {hint && <span className="opacity-75 font-normal text-[10.5px]">({hint})</span>}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-[12px] text-emerald-600 dark:text-emerald-400 font-medium">
                Widget is installed and communicating, support agents are active, and no customer chats are waiting unanswered over 24 hours.
              </p>
            )}
          </div>

          {/* Primary Performance Metrics Grid (Requirement 2) */}
          <div className="space-y-3">
            <h4 className="text-[12px] font-bold text-ink-3 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-accent" />
                <span>Performance &amp; Support Velocity ({rangeDays}d window)</span>
              </span>
              <span className="text-[11px] font-normal text-ink-3 lowercase">per-company analytics</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* 1. Avg First Response Time */}
              <div className="p-3.5 rounded-xl border border-line bg-surface shadow-2xs space-y-1">
                <div className="text-ink-3 text-[11px] font-semibold uppercase flex items-center gap-1">
                  <Clock className="w-3 h-3 text-blue-500" />
                  <span>Avg First Response</span>
                </div>
                <div className="text-[20px] font-extrabold text-ink">
                  {formatSecondsToTime(analyticsData?.avg_first_response_time_seconds)}
                </div>
                <div className="text-[10.5px] text-ink-3">Speed to first reply</div>
              </div>

              {/* 2. Avg Resolution Time */}
              <div className="p-3.5 rounded-xl border border-line bg-surface shadow-2xs space-y-1">
                <div className="text-ink-3 text-[11px] font-semibold uppercase flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  <span>Avg Resolution</span>
                </div>
                <div className="text-[20px] font-extrabold text-ink">
                  {formatSecondsToTime(analyticsData?.avg_resolution_time_seconds)}
                </div>
                <div className="text-[10.5px] text-ink-3">From open to closed</div>
              </div>

              {/* 3. CSAT Rating */}
              <div className="p-3.5 rounded-xl border border-line bg-surface shadow-2xs space-y-1">
                <div className="text-ink-3 text-[11px] font-semibold uppercase flex items-center gap-1">
                  <Smile className="w-3 h-3 text-amber-500" />
                  <span>CSAT Score</span>
                </div>
                <div className="text-[20px] font-extrabold text-ink flex items-baseline gap-1">
                  {analyticsData?.csat_score !== null && analyticsData?.csat_score !== undefined ? (
                    <>
                      <span>{Number(analyticsData.csat_score).toFixed(1)}</span>
                      <span className="text-[11px] font-normal text-ink-3">/ 5.0</span>
                    </>
                  ) : (
                    '—'
                  )}
                </div>
                <div className="text-[10.5px] text-ink-3">
                  {analyticsData?.csat_ratings_count
                    ? `${analyticsData.csat_ratings_count} ratings (${analyticsData.csat_positive_percent ?? 0}% positive)`
                    : 'No CSAT feedback'}
                </div>
              </div>

              {/* 4. AI-Only Chats */}
              <div className="p-3.5 rounded-xl border border-line bg-surface shadow-2xs space-y-1">
                <div className="text-ink-3 text-[11px] font-semibold uppercase flex items-center gap-1">
                  <Bot className="w-3 h-3 text-purple-500" />
                  <span>AI Only Chats</span>
                </div>
                <div className="text-[20px] font-extrabold text-ink">
                  {analyticsData?.ai_only_chats_percent ?? 0}%
                </div>
                <div className="text-[10.5px] text-ink-3">
                  {analyticsData?.ai_only_chats_count ?? 0} chats 100% automated
                </div>
              </div>

              {/* 5. Handover Rate */}
              <div className="p-3.5 rounded-xl border border-line bg-surface shadow-2xs space-y-1">
                <div className="text-ink-3 text-[11px] font-semibold uppercase flex items-center gap-1">
                  <UserCheck className="w-3 h-3 text-indigo-500" />
                  <span>Handover Rate</span>
                </div>
                <div className="text-[20px] font-extrabold text-ink">
                  {analyticsData?.ai_handover_percent ?? 0}%
                </div>
                <div className="text-[10.5px] text-ink-3">
                  {analyticsData?.ai_handover_chats_count ?? 0} AI chats sent to human
                </div>
              </div>

              {/* 6. Open vs Resolved */}
              <div className="p-3.5 rounded-xl border border-line bg-surface shadow-2xs space-y-1">
                <div className="text-ink-3 text-[11px] font-semibold uppercase flex items-center gap-1">
                  <MessageSquare className="w-3 h-3 text-teal-500" />
                  <span>Open vs Resolved</span>
                </div>
                <div className="text-[18px] font-bold text-ink">
                  {analyticsData?.open_conversations_count ?? 0} /{' '}
                  {analyticsData?.resolved_conversations_count ?? 0}
                </div>
                <div className="text-[10.5px] text-ink-3">
                  {analyticsData?.resolution_rate_percent ?? 0}% resolution rate
                </div>
              </div>

              {/* 7. Unanswered > 24h */}
              <div
                className={cn(
                  'p-3.5 rounded-xl border shadow-2xs space-y-1 cursor-pointer transition-colors',
                  (analyticsData?.unanswered_older_24h_count ?? 0) > 0
                    ? 'border-rose-500/40 bg-rose-500/5 hover:bg-rose-500/10'
                    : 'border-line bg-surface'
                )}
                onClick={() =>
                  (analyticsData?.unanswered_older_24h_count ?? 0) > 0 &&
                  setShowUnansweredList(!showUnansweredList)
                }
              >
                <div className="text-ink-3 text-[11px] font-semibold uppercase flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <AlertTriangle
                      className={cn(
                        'w-3 h-3',
                        (analyticsData?.unanswered_older_24h_count ?? 0) > 0
                          ? 'text-rose-500'
                          : 'text-ink-3'
                      )}
                    />
                    <span>Unanswered &gt; 24h</span>
                  </div>
                  {(analyticsData?.unanswered_older_24h_count ?? 0) > 0 && (
                    <span className="text-[10px] text-accent flex items-center gap-0.5">
                      {showUnansweredList ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </span>
                  )}
                </div>
                <div
                  className={cn(
                    'text-[20px] font-extrabold',
                    (analyticsData?.unanswered_older_24h_count ?? 0) > 0
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-ink'
                  )}
                >
                  {analyticsData?.unanswered_older_24h_count ?? 0}
                </div>
                <div className="text-[10.5px] text-ink-3">
                  {(analyticsData?.unanswered_older_24h_count ?? 0) > 0
                    ? 'Click to inspect chats'
                    : 'All chats replied'}
                </div>
              </div>

              {/* 8. Knowledge Gaps */}
              <div
                className={cn(
                  'p-3.5 rounded-xl border shadow-2xs space-y-1 cursor-pointer transition-colors',
                  (analyticsData?.knowledge_gaps_count ?? 0) > 0
                    ? 'border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/10'
                    : 'border-line bg-surface'
                )}
                onClick={() =>
                  (analyticsData?.knowledge_gaps_count ?? 0) > 0 &&
                  setShowKnowledgeGaps(!showKnowledgeGaps)
                }
              >
                <div className="text-ink-3 text-[11px] font-semibold uppercase flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <HelpCircle
                      className={cn(
                        'w-3 h-3',
                        (analyticsData?.knowledge_gaps_count ?? 0) > 0
                          ? 'text-amber-500'
                          : 'text-ink-3'
                      )}
                    />
                    <span>Knowledge Gaps</span>
                  </div>
                  {(analyticsData?.knowledge_gaps_count ?? 0) > 0 && (
                    <span className="text-[10px] text-accent flex items-center gap-0.5">
                      {showKnowledgeGaps ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </span>
                  )}
                </div>
                <div
                  className={cn(
                    'text-[20px] font-extrabold',
                    (analyticsData?.knowledge_gaps_count ?? 0) > 0
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-ink'
                  )}
                >
                  {analyticsData?.knowledge_gaps_count ?? 0}
                </div>
                <div className="text-[10.5px] text-ink-3">
                  {(analyticsData?.knowledge_gaps_count ?? 0) > 0
                    ? 'Unanswered questions'
                    : 'No gaps detected'}
                </div>
              </div>
            </div>

            {/* Expandable Unanswered Chats List */}
            {showUnansweredList && analyticsData?.unanswered_older_24h_list && (
              <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/5 space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-rose-600 dark:text-rose-400 text-[12px] flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Unanswered Conversations Waiting Over 24 Hours</span>
                  </h5>
                  <button
                    onClick={() => setShowUnansweredList(false)}
                    className="text-[11px] text-ink-3 hover:text-ink"
                  >
                    Hide
                  </button>
                </div>
                <div className="divide-y divide-rose-500/20 max-h-48 overflow-y-auto">
                  {analyticsData.unanswered_older_24h_list.map((c) => (
                    <div key={c.id} className="py-2 flex items-center justify-between text-[11.5px]">
                      <div>
                        <span className="font-semibold text-ink">{c.visitor_name}</span>
                        <span className="text-ink-3 ml-2">Channel: {c.channel}</span>
                      </div>
                      <span className="font-bold text-rose-600 dark:text-rose-400">
                        {Math.round(c.waiting_hours)} hours waiting
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Expandable Knowledge Gaps List */}
            {showKnowledgeGaps && analyticsData?.knowledge_gaps_sample && (
              <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-amber-600 dark:text-amber-400 text-[12px] flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Questions Visitors Asked That Had No Answer</span>
                  </h5>
                  <button
                    onClick={() => setShowKnowledgeGaps(false)}
                    className="text-[11px] text-ink-3 hover:text-ink"
                  >
                    Hide
                  </button>
                </div>
                <div className="divide-y divide-amber-500/20 max-h-48 overflow-y-auto">
                  {analyticsData.knowledge_gaps_sample.map((kg) => (
                    <div key={kg.id} className="py-2 flex items-center justify-between text-[11.5px]">
                      <span className="font-medium text-ink italic">&quot;{kg.question}&quot;</span>
                      <span className="font-semibold text-amber-600 dark:text-amber-400 shrink-0 ml-3">
                        Asked {kg.times_asked}x
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Conversations per Day Chart (Requirement 2) */}
          <div className="p-4.5 rounded-xl border border-line bg-surface shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-[13px] font-bold text-ink flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-500" />
                  <span>Conversations per Day ({rangeDays} Days)</span>
                </h4>
                <p className="text-[11px] text-ink-3">Daily customer inquiry volume</p>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-medium text-ink-3">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  Chats
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                  Messages
                </span>
              </div>
            </div>

            <div className="h-48 w-full pt-1">
              {!analyticsData?.conversations_per_day ||
              analyticsData.conversations_per_day.length === 0 ? (
                <div className="h-full flex items-center justify-center text-ink-3 text-xs">
                  No conversation activity recorded in this period.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={analyticsData.conversations_per_day}
                    margin={{ top: 5, right: 10, left: -25, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="companyConvGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                    <XAxis
                      dataKey="formatted_date"
                      tick={{ fontSize: 10, fill: 'currentColor' }}
                      tickLine={false}
                      axisLine={{ stroke: 'rgba(150, 150, 150, 0.2)' }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: 'currentColor' }}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(20, 24, 33, 0.95)',
                        backdropFilter: 'blur(8px)',
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '10px',
                        boxShadow: '0 8px 20px -4px rgba(0, 0, 0, 0.5)',
                        fontSize: '11.5px',
                        color: '#ffffff',
                      }}
                      labelStyle={{ color: '#cbd5e1', fontWeight: 600 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="conversations"
                      name="Conversations"
                      stroke="#10b981"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#companyConvGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Quick Links & Simulator */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a
              href={`/demo.html?workspaceId=${workspaceId}`}
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
              href={
                drilldownData?.workspace
                  ? getWorkspaceHelpCenterUrl(drilldownData.workspace)
                  : `/help/${workspaceId}`
              }
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

          {/* Support Team Agents */}
          <div className="space-y-2.5">
            <h4 className="text-[12px] font-bold text-ink-3 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-500" />
              <span>Support Team Agents ({formatSeats(drilldownData?.agents?.length || 0)})</span>
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

          {/* Recent Customer Conversations */}
          <div className="space-y-2.5">
            <h4 className="text-[12px] font-bold text-ink-3 uppercase tracking-wider flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                <span>
                  Recent Customer Conversations (
                  {formatNumber(drilldownData?.recentConversations?.length || 0)})
                </span>
              </div>
              <span className="text-[11px] font-normal text-ink-3 lowercase">
                sorted by last activity
              </span>
            </h4>
            <div className="border border-line rounded-xl overflow-hidden divide-y divide-line bg-surface">
              {drilldownData?.recentConversations?.map((conv: any) => {
                const activityDate = new Date(conv.updated_at || conv.created_at);
                return (
                  <div
                    key={conv.id}
                    className="p-3 flex items-center justify-between gap-3 text-[12px]"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-ink truncate flex items-center gap-2">
                        <span>{conv.visitor?.name || 'Anonymous Visitor'}</span>
                        {conv.channel && conv.channel !== 'web' && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] bg-surface-2 text-ink-3 uppercase font-medium">
                            {conv.channel}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-ink-3 truncate mt-0.5">
                        {conv.visitor?.email || 'No email provided'} • Last active{' '}
                        <span className="font-medium text-ink-2">
                          {activityDate.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0',
                        conv.status === 'open'
                          ? 'bg-emerald-500/10 text-emerald-600'
                          : 'bg-slate-500/10 text-slate-500'
                      )}
                    >
                      {conv.status}
                    </span>
                  </div>
                );
              })}
              {drilldownData?.recentConversations?.length === 0 && (
                <div className="p-4 text-center text-ink-3 text-xs">
                  No conversations logged yet.
                </div>
              )}
            </div>
          </div>

          {/* Recent Visitors */}
          <div className="space-y-2.5">
            <h4 className="text-[12px] font-bold text-ink-3 uppercase tracking-wider flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-amber-500" />
                <span>
                  Recent Website Visitors (
                  {formatNumber(drilldownData?.visitorsCount ?? activeCompany?.visitors_count ?? 0)}{' '}
                  total •{' '}
                  {formatNumber(
                    drilldownData?.activeVisitorsCount ?? activeCompany?.active_visitors_count ?? 0
                  )}{' '}
                  browsing now)
                </span>
              </div>
            </h4>
            <div className="border border-line rounded-xl overflow-hidden divide-y divide-line bg-surface">
              {drilldownData?.recentVisitors?.map((vis: any) => (
                <div key={vis.id} className="p-3 flex items-center justify-between gap-3 text-[12px]">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-ink truncate flex items-center gap-2 flex-wrap">
                      <span>{vis.name || 'Anonymous Visitor'}</span>
                      {vis.is_browsing_now && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Browsing now
                        </span>
                      )}
                      {vis.location && (
                        <span className="text-[11px] text-ink-3 flex items-center gap-0.5">
                          <MapPin className="w-2.5 h-2.5" />
                          {vis.location}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-ink-3 truncate max-w-md mt-0.5">
                      {vis.current_url || 'Unknown page'}
                    </div>
                  </div>
                  <span className="text-[10.5px] text-ink-3 shrink-0">
                    {vis.last_seen ? new Date(vis.last_seen).toLocaleTimeString() : 'Recently'}
                  </span>
                </div>
              ))}
              {drilldownData?.recentVisitors?.length === 0 && (
                <div className="p-4 text-center text-ink-3 text-xs">No visitors recorded yet.</div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-line flex items-center justify-between bg-surface-2/40">
          <span className="text-[11.5px] text-ink-3">Live Multi-Tenant Database Sync</span>
          <button
            type="button"
            onClick={onClose}
            className="h-8.5 px-4 rounded-xl border border-line bg-surface hover:bg-surface-2 text-ink text-[12px] font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
