'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Globe,
  Users,
  MessageSquare,
  ArrowLeft,
  ExternalLink,
  PauseCircle,
  PlayCircle,
  Bot,
  Zap,
  BookOpen,
  Clock,
  ThumbsUp,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  LogOut,
  Mail,
  Share2,
  Check,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import type { WorkspaceDetailData } from '@/app/actions/platform';
import {
  getWorkspaceDetailAction,
  suspendWorkspaceAction,
  reactivateWorkspaceAction,
  switchWorkspaceAction,
} from '@/app/actions/platform';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState, ErrorState } from '@/components/ui/States';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

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

interface WorkspaceDetailPageProps {
  workspaceId: string;
  initialData?: WorkspaceDetailData | null;
}

export function WorkspaceDetailPage({ workspaceId, initialData }: WorkspaceDetailPageProps) {
  const router = useRouter();
  const toast = useToast();

  const [data, setData] = useState<WorkspaceDetailData | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [suspending, setSuspending] = useState(false);

  const [showReactivateModal, setShowReactivateModal] = useState(false);
  const [reactivating, setReactivating] = useState(false);

  const [switching, setSwitching] = useState(false);

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await getWorkspaceDetailAction(workspaceId);
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load workspace details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!initialData) {
      loadData();
    }
  }, [workspaceId]);

  const handleSuspend = async () => {
    setSuspending(true);
    try {
      await suspendWorkspaceAction(workspaceId, suspendReason);
      toast.success('Workspace has been suspended.');
      setShowSuspendModal(false);
      setSuspendReason('');
      await loadData(true);
    } catch (err: any) {
      toast.error(err.message || 'Failed to suspend workspace');
    } finally {
      setSuspending(false);
    }
  };

  const handleReactivate = async () => {
    setReactivating(true);
    try {
      await reactivateWorkspaceAction(workspaceId);
      toast.success('Workspace reactivated successfully.');
      setShowReactivateModal(false);
      await loadData(true);
    } catch (err: any) {
      toast.error(err.message || 'Failed to reactivate workspace');
    } finally {
      setReactivating(false);
    }
  };

  const handleSwitch = async () => {
    if (!data?.workspace) return;
    setSwitching(true);
    try {
      await switchWorkspaceAction({ workspaceId: data.workspace.id });
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Failed to switch workspace view');
      setSwitching(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
        <LoadingState label="Loading workspace details..." />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
        <ErrorState
          title="Could not load workspace"
          message={error || 'Workspace not found.'}
          onRetry={() => loadData()}
        />
      </div>
    );
  }

  const { workspace, tickets_per_day, avg_first_reply_seconds, resolution_rate_percent, bot_resolved_count, bot_handover_count, top_articles, members } = data;
  const isSuspended = workspace.is_suspended;

  return (
    <div className="flex-1 overflow-y-auto bg-canvas text-ink">
      <div className="p-4 sm:p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
        {/* Breadcrumb & Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-ink-3">
            <Link href="/admin" className="hover:text-ink transition-colors flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" />
              <span>Platform Admin</span>
            </Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/admin" className="hover:text-ink transition-colors">
              <span>Workspaces</span>
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="font-semibold text-ink truncate max-w-xs">{workspace.name}</span>
          </nav>

          <div className="flex items-center gap-2.5">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => loadData(true)}
              loading={refreshing}
            >
              <RefreshCw className={cn('w-3.5 h-3.5', refreshing && 'animate-spin')} />
              <span>Refresh</span>
            </Button>
            <Link href="/admin">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>All Workspaces</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Workspace Header Card */}
        <header className="card p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 border-line bg-surface shadow-xs">
          <div className="flex items-start gap-4 min-w-0">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-xs shrink-0"
              style={{ backgroundColor: workspace.brand_color || '#2563eb' }}
            >
              {workspace.name.charAt(0).toUpperCase()}
            </div>

            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-lg md:text-xl font-bold text-ink truncate">{workspace.name}</h1>
                <Badge tone={isSuspended ? 'warn' : 'success'}>
                  {isSuspended ? 'Suspended' : 'Active'}
                </Badge>
                <Badge tone="accent">
                  {workspace.plan.toUpperCase()}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-ink-3">
                {workspace.website_url ? (
                  <a
                    href={workspace.website_url.startsWith('http') ? workspace.website_url : `https://${workspace.website_url}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-accent hover:underline"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>{workspace.website_url.replace(/^https?:\/\//, '')}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="italic">No website domain linked</span>
                )}

                {workspace.owner_email && (
                  <span className="inline-flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-ink-3" />
                    <span>Owner: {workspace.owner_email}</span>
                  </span>
                )}

                <span className="inline-flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-ink-3" />
                  <span>Created {new Date(workspace.created_at).toLocaleDateString()}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Button
              variant="secondary"
              size="sm"
              loading={switching}
              onClick={handleSwitch}
              title="Open this workspace as super admin"
            >
              <span>Switch into Workspace</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>

            {isSuspended ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowReactivateModal(true)}
              >
                <PlayCircle className="w-3.5 h-3.5" />
                <span>Reactivate Workspace</span>
              </Button>
            ) : (
              <Button
                variant="danger"
                size="sm"
                onClick={() => setShowSuspendModal(true)}
              >
                <PauseCircle className="w-3.5 h-3.5" />
                <span>Suspend Workspace</span>
              </Button>
            )}
          </div>
        </header>

        {/* Suspended Notice Banner */}
        {isSuspended && (
          <div className="p-4 rounded-xl border border-warn/40 bg-warn/10 text-ink flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-warn shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-warn uppercase tracking-wider">Workspace is Currently Suspended</h4>
              <p className="text-xs text-ink-2">
                Reason: {workspace.suspension_reason || 'No specific reason provided'}.
                {workspace.suspended_at && ` Suspended on ${new Date(workspace.suspended_at).toLocaleString()}.`}
              </p>
            </div>
          </div>
        )}

        {/* Metric Cards Row */}
        <section aria-label="Key Performance Indicators" className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          {/* 1. Tickets (30d) */}
          <div className="card p-4 space-y-1">
            <span className="text-2xs font-semibold uppercase tracking-wider text-ink-3">
              Tickets (Last 30d)
            </span>
            <div className="text-xl md:text-2xl font-bold text-ink tabular-nums">
              {workspace.tickets_30d_count.toLocaleString()}
            </div>
            <div className="text-2xs text-ink-3">
              {workspace.total_tickets.toLocaleString()} all-time
            </div>
          </div>

          {/* 2. Average First Reply Time */}
          <div className="card p-4 space-y-1">
            <span className="text-2xs font-semibold uppercase tracking-wider text-ink-3">
              Avg First Reply Time
            </span>
            <div className="text-xl md:text-2xl font-bold text-ink tabular-nums">
              {formatDuration(avg_first_reply_seconds)}
            </div>
            <div className="text-2xs text-ink-3">
              First response speed
            </div>
          </div>

          {/* 3. Resolution Rate */}
          <div className="card p-4 space-y-1">
            <span className="text-2xs font-semibold uppercase tracking-wider text-ink-3">
              Resolution Rate
            </span>
            <div className="text-xl md:text-2xl font-bold text-ink tabular-nums">
              {resolution_rate_percent}%
            </div>
            <div className="text-2xs text-ink-3">
              Solved or closed tickets
            </div>
          </div>

          {/* 4. Connected Channels */}
          <div className="card p-4 space-y-1">
            <span className="text-2xs font-semibold uppercase tracking-wider text-ink-3">
              Connected Channels
            </span>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {workspace.connected_channels.length > 0 ? (
                workspace.connected_channels.map((ch) => (
                  <Badge key={ch} tone="accent">
                    {ch}
                  </Badge>
                ))
              ) : (
                <span className="text-2xs text-ink-3 italic">None connected</span>
              )}
            </div>
          </div>
        </section>

        {/* Section 1: Tickets per Day Chart */}
        <section className="card p-5 md:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-md font-bold text-ink flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-accent" />
                <span>Tickets per Day (Last 30 Days)</span>
              </h2>
              <p className="text-xs text-ink-3 mt-0.5">
                Daily volume of customer inquiries created versus resolved
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs text-ink-3 font-medium">
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
            {tickets_per_day.length === 0 ? (
              <EmptyState
                type="custom"
                title="No ticket activity"
                description="No tickets were logged in this period."
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={tickets_per_day} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="ticketCreatedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--ds-accent)" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="var(--ds-accent)" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="ticketSolvedGrad" x1="0" y1="0" x2="0" y2="1">
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
                    fill="url(#ticketCreatedGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="solved"
                    name="Tickets Solved"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#ticketSolvedGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        {/* Section 2: AI Bot Performance */}
        <section className="card p-5 md:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-md font-bold text-ink flex items-center gap-2">
                <Bot className="w-4 h-4 text-accent" />
                <span>AI Bot Resolved vs Handed to Human</span>
              </h2>
              <p className="text-xs text-ink-3 mt-0.5">
                Breakdown of automated resolution versus human support escalation
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-line bg-surface-2/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-ink-3 uppercase font-semibold">Bot Resolved</div>
                  <div className="text-xl font-bold text-ink tabular-nums">{bot_resolved_count.toLocaleString()}</div>
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
                  <div className="text-xs text-ink-3 uppercase font-semibold">Handed to Human</div>
                  <div className="text-xl font-bold text-ink tabular-nums">{bot_handover_count.toLocaleString()}</div>
                  <div className="text-2xs text-ink-3">Escalated to human support agent</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Top Help Articles Viewed */}
        <section className="card p-5 md:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-md font-bold text-ink flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-accent" />
                <span>Top Help Articles Viewed</span>
              </h2>
              <p className="text-xs text-ink-3 mt-0.5">
                Most read knowledge base articles for self-service support
              </p>
            </div>
            <span className="text-2xs text-ink-3">
              {top_articles.length} articles
            </span>
          </div>

          {top_articles.length === 0 ? (
            <div className="py-6 text-center text-xs text-ink-3 border border-line/60 rounded-xl bg-surface-2/30">
              No help articles published in this workspace yet.
            </div>
          ) : (
            <div className="border border-line rounded-xl overflow-hidden divide-y divide-line bg-surface">
              {top_articles.map((art) => (
                <div key={art.id} className="p-3.5 flex items-center justify-between gap-4 text-xs">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-ink truncate">{art.title}</div>
                    <div className="text-2xs text-ink-3 truncate mt-0.5">
                      Slug: /{art.slug}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 text-ink-3">
                    <span className="inline-flex items-center gap-1 font-semibold text-ink">
                      <span>{art.views_count.toLocaleString()}</span>
                      <span className="text-2xs font-normal text-ink-3">views</span>
                    </span>
                    {art.helpful_count > 0 && (
                      <span className="inline-flex items-center gap-1 text-emerald-500 font-medium text-2xs">
                        <ThumbsUp className="w-3 h-3" />
                        <span>{art.helpful_count}</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Section 4: Workspace's Members */}
        <section className="card p-5 md:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-md font-bold text-ink flex items-center gap-2">
                <Users className="w-4 h-4 text-accent" />
                <span>Workspace Members</span>
              </h2>
              <p className="text-xs text-ink-3 mt-0.5">
                Registered team agents and administrators
              </p>
            </div>
            <span className="text-2xs text-ink-3">
              {members.length} team members
            </span>
          </div>

          {members.length === 0 ? (
            <div className="py-6 text-center text-xs text-ink-3 border border-line/60 rounded-xl bg-surface-2/30">
              No team members registered yet.
            </div>
          ) : (
            <div className="border border-line rounded-xl overflow-hidden divide-y divide-line bg-surface">
              {members.map((m) => (
                <div key={m.id} className="p-3.5 flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={m.name} size="sm" />
                    <div className="min-w-0">
                      <div className="font-semibold text-ink truncate flex items-center gap-2">
                        <span>{m.name}</span>
                        {!m.is_active && (
                          <Badge tone="warn">Deactivated</Badge>
                        )}
                      </div>
                      <div className="text-2xs text-ink-3 truncate">{m.email}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <Badge tone="neutral" className="uppercase font-semibold text-2xs">
                      {m.role}
                    </Badge>
                    <Badge
                      tone={
                        m.status === 'online'
                          ? 'success'
                          : m.status === 'away'
                          ? 'warn'
                          : 'neutral'
                      }
                      className="capitalize text-2xs"
                    >
                      {m.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Suspend Confirmation Modal */}
      {showSuspendModal && (
        <Modal
          title="Suspend Workspace"
          description="Are you sure you want to suspend this workspace?"
          onClose={() => setShowSuspendModal(false)}
          footer={
            <div className="flex items-center justify-end gap-2.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSuspendModal(false)}
                disabled={suspending}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                loading={suspending}
                onClick={handleSuspend}
              >
                Confirm Suspension
              </Button>
            </div>
          }
        >
          <div className="space-y-4 text-xs text-ink-2">
            <p>
              Suspending <strong>{workspace.name}</strong> will immediately disable the website widget
              and block all workspace agents from logging in. All data, tickets, and messages will be preserved.
            </p>
            <div className="space-y-1.5">
              <label htmlFor="suspend-reason-input" className="text-xs font-semibold text-ink">Reason for suspension (Audit Log)</label>
              <input
                id="suspend-reason-input"
                type="text"
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="e.g. Terms violation, overdue payment, customer request"
                className="input input-sm w-full"
              />
            </div>
          </div>
        </Modal>
      )}

      {/* Reactivate Confirmation Modal */}
      {showReactivateModal && (
        <Modal
          title="Reactivate Workspace"
          description="Restore normal operations for this workspace?"
          onClose={() => setShowReactivateModal(false)}
          footer={
            <div className="flex items-center justify-end gap-2.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReactivateModal(false)}
                disabled={reactivating}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={reactivating}
                onClick={handleReactivate}
              >
                Confirm Reactivation
              </Button>
            </div>
          }
        >
          <div className="text-xs text-ink-2 space-y-2">
            <p>
              Reactivating <strong>{workspace.name}</strong> will restore access for all registered
              agents and re-enable website widget chat delivery immediately.
            </p>
            <p className="text-2xs text-ink-3">
              This action will be stamped in the platform audit log.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}
