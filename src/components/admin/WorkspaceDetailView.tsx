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
  AlertTriangle,
  RefreshCw,
  Mail,
  ShieldCheck,
  ChevronRight,
  FileText,
  Activity,
  Layers,
  Send,
  Lock,
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
import {
  getPlatformWorkspaceDetailAction,
  suspendWorkspaceAction,
  reactivateWorkspaceAction,
  saveWorkspaceNotesAction,
  PolishedWorkspaceDetailData,
} from '@/app/actions/platform';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';
import { Tabs } from '@/components/ui/Tabs';
import { Table } from '@/components/ui/Table';
import { SkeletonBlock, ErrorState } from '@/components/ui/States';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

interface WorkspaceDetailViewProps {
  workspaceId: string;
}

export function WorkspaceDetailView({ workspaceId }: WorkspaceDetailViewProps) {
  const router = useRouter();
  const toast = useToast();

  const [data, setData] = useState<PolishedWorkspaceDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'channels' | 'usage' | 'activity' | 'notes'>('overview');

  // Modal states
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [suspending, setSuspending] = useState(false);

  const [showReactivateModal, setShowReactivateModal] = useState(false);
  const [reactivating, setReactivating] = useState(false);

  // Private note composer state
  const [newNote, setNewNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await getPlatformWorkspaceDetailAction(workspaceId);
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load workspace details.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
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
      toast.error(err.message || 'Failed to suspend workspace.');
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
      toast.error(err.message || 'Failed to reactivate workspace.');
    } finally {
      setReactivating(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setSavingNote(true);
    try {
      const res = await saveWorkspaceNotesAction(workspaceId, newNote.trim());
      if (res.success && res.note) {
        toast.success('Private owner note saved.');
        setNewNote('');
        if (data) {
          setData({
            ...data,
            notes: [res.note, ...data.notes],
          });
        }
      } else {
        toast.error(res.error || 'Failed to save note.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to save note.');
    } finally {
      setSavingNote(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonBlock className="h-6 w-64" />
        <SkeletonBlock className="h-28 rounded-xl" />
        <SkeletonBlock className="h-10 w-96" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <SkeletonBlock className="h-72 rounded-xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <ErrorState
        title="Could not load workspace"
        message={error || 'Workspace could not be located.'}
        onRetry={() => loadData()}
      />
    );
  }

  const { workspace, metrics, tickets_per_day, top_articles, members, channels, usage, recent_activity, notes } = data;
  const isSuspended = workspace.is_suspended;

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-ink-3">
        <Link href="/admin" className="hover:text-ink transition-colors flex items-center gap-1">
          <Building2 className="w-3.5 h-3.5" />
          <span>Platform Admin</span>
        </Link>
        <ChevronRight className="w-3 h-3" />
        <Link href="/admin/workspaces" className="hover:text-ink transition-colors">
          <span>Workspaces</span>
        </Link>
        <ChevronRight className="w-3 h-3" />
        <span className="font-semibold text-ink truncate max-w-xs">{workspace.name}</span>
      </nav>

      {/* Header Card */}
      <header className="card p-5 border border-line bg-surface shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-start gap-4 min-w-0">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-xs shrink-0"
            style={{ backgroundColor: workspace.brand_color || '#2563eb' }}
          >
            {workspace.name.charAt(0).toUpperCase()}
          </div>

          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-lg font-bold text-ink truncate">{workspace.name}</h2>
              <Badge tone={isSuspended ? 'warn' : 'success'}>
                {isSuspended ? 'Suspended' : 'Active'}
              </Badge>
              <Badge tone="neutral" className="uppercase font-semibold">
                {workspace.plan}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-3.5 text-xs text-ink-3">
              {workspace.website_url ? (
                <a
                  href={workspace.website_url.startsWith('http') ? workspace.website_url : `https://${workspace.website_url}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-accent hover:underline"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>{workspace.website_url.replace(/^https?:\/\//, '')}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <span className="italic">No domain linked</span>
              )}

              {workspace.owner_email && (
                <span className="inline-flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-ink-3" />
                  <span>Owner: {workspace.owner_email}</span>
                </span>
              )}

              <span className="inline-flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-ink-3" />
                <span>Created {new Date(workspace.created_at).toLocaleDateString()}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => loadData(true)}
            loading={refreshing}
          >
            <RefreshCw className={cn('w-3.5 h-3.5', refreshing && 'animate-spin')} />
            <span>Refresh</span>
          </Button>

          {isSuspended ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowReactivateModal(true)}
            >
              <PlayCircle className="w-3.5 h-3.5" />
              <span>Reactivate</span>
            </Button>
          ) : (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowSuspendModal(true)}
            >
              <PauseCircle className="w-3.5 h-3.5" />
              <span>Suspend</span>
            </Button>
          )}
        </div>
      </header>

      {/* Suspension Alert Banner */}
      {isSuspended && (
        <div className="p-3.5 rounded-lg border border-warn/30 bg-warn/10 text-ink flex items-start gap-2.5 text-xs">
          <AlertTriangle className="w-4 h-4 text-warn shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold text-warn">This workspace is suspended.</strong>{' '}
            Reason: {workspace.suspension_reason || 'No specific reason provided'}.
            {workspace.suspended_at && ` (Suspended on ${new Date(workspace.suspended_at).toLocaleDateString()})`}
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <Tabs
        variant="pill"
        label="Workspace view tabs"
        items={[
          { id: 'overview', label: 'Overview & Metrics' },
          { id: 'members', label: 'Members', count: members.length },
          { id: 'channels', label: 'Channels', count: channels.length },
          { id: 'usage', label: 'Usage' },
          { id: 'activity', label: 'Recent Activity' },
          { id: 'notes', label: 'Owner Notes', count: notes.length },
        ]}
        value={activeTab}
        onChange={(id) => setActiveTab(id)}
      />

      {/* TAB 1: OVERVIEW & METRICS */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            <div className="card p-4 border border-line bg-surface shadow-xs space-y-1">
              <span className="text-2xs font-semibold uppercase tracking-wider text-ink-3">
                Tickets (30d)
              </span>
              <div className="text-2xl font-bold text-ink tabular-nums">
                {metrics.tickets_30d_count.toLocaleString()}
              </div>
              <div className="text-2xs text-ink-3">{metrics.total_tickets} all-time</div>
            </div>

            <div className="card p-4 border border-line bg-surface shadow-xs space-y-1">
              <span className="text-2xs font-semibold uppercase tracking-wider text-ink-3">
                Resolution Rate
              </span>
              <div className="text-2xl font-bold text-ink tabular-nums">
                {metrics.resolution_rate_percent}%
              </div>
              <div className="text-2xs text-ink-3">Solved / closed tickets</div>
            </div>

            <div className="card p-4 border border-line bg-surface shadow-xs space-y-1">
              <span className="text-2xs font-semibold uppercase tracking-wider text-ink-3">
                Team Size
              </span>
              <div className="text-2xl font-bold text-ink tabular-nums">
                {metrics.agents_count}
              </div>
              <div className="text-2xs text-ink-3">Active support agents</div>
            </div>

            <div className="card p-4 border border-line bg-surface shadow-xs space-y-1">
              <span className="text-2xs font-semibold uppercase tracking-wider text-ink-3">
                Channels
              </span>
              <div className="text-2xl font-bold text-ink tabular-nums">
                {channels.length}
              </div>
              <div className="text-2xs text-ink-3">Configured integrations</div>
            </div>
          </div>

          {/* 30-Day Tickets Chart */}
          <section className="card p-5 border border-line bg-surface shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-ink">Ticket Volume & Resolution (Last 30 Days)</h3>
                <p className="text-xs text-ink-3 mt-0.5">Customer inquiries logged and solved daily</p>
              </div>
              <div className="flex items-center gap-3 text-xs text-ink-3 font-medium">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-accent" />
                  Created
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-success" />
                  Solved
                </span>
              </div>
            </div>

            <div className="h-64 w-full pt-2">
              {tickets_per_day.length === 0 ? (
                <EmptyState
                  type="custom"
                  title="No ticket volume"
                  description="No tickets logged during this 30-day window."
                />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={tickets_per_day} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="wsTicketCreatedGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--ds-accent)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--ds-accent)" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="wsTicketSolvedGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--ds-success)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--ds-success)" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                    <XAxis
                      dataKey="formatted_date"
                      tick={{ fontSize: 11, fill: 'currentColor' }}
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
                        backgroundColor: 'var(--ds-surface)',
                        borderColor: 'var(--ds-line)',
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: 'var(--ds-ink)',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="tickets"
                      name="Tickets Created"
                      stroke="var(--ds-accent)"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#wsTicketCreatedGrad)"
                    />
                    <Area
                      type="monotone"
                      dataKey="solved"
                      name="Tickets Solved"
                      stroke="var(--ds-success)"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#wsTicketSolvedGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>

          {/* AI Bot & Top Articles Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bot Resolution */}
            <section className="card p-5 border border-line bg-surface shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                <Bot className="w-4 h-4 text-accent" />
                <span>AI Automated Resolution</span>
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-lg border border-line bg-surface-2/40 space-y-1">
                  <span className="text-2xs text-ink-3 uppercase font-semibold">Bot Resolved</span>
                  <div className="text-xl font-bold text-ink tabular-nums">
                    {metrics.bot_resolved_count}
                  </div>
                  <div className="text-2xs text-ink-3">Handled without human agent</div>
                </div>

                <div className="p-3.5 rounded-lg border border-line bg-surface-2/40 space-y-1">
                  <span className="text-2xs text-ink-3 uppercase font-semibold">Handed to Human</span>
                  <div className="text-xl font-bold text-ink tabular-nums">
                    {metrics.bot_handover_count}
                  </div>
                  <div className="text-2xs text-ink-3">Escalated to team agent</div>
                </div>
              </div>
            </section>

            {/* Top Knowledge Articles */}
            <section className="card p-5 border border-line bg-surface shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-accent" />
                <span>Top Help Articles</span>
              </h3>

              {top_articles.length === 0 ? (
                <div className="py-6 text-center text-xs text-ink-3 border border-line/40 rounded-lg">
                  No published knowledge articles yet.
                </div>
              ) : (
                <div className="divide-y divide-line/60 border border-line rounded-lg overflow-hidden bg-surface">
                  {top_articles.slice(0, 5).map((a) => (
                    <div key={a.id} className="p-2.5 flex items-center justify-between gap-3 text-xs">
                      <div className="truncate font-medium text-ink">{a.title}</div>
                      <div className="text-2xs text-ink-3 shrink-0 flex items-center gap-1.5">
                        <span className="font-semibold text-ink">{a.views_count}</span>
                        <span>views</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      )}

      {/* TAB 2: MEMBERS */}
      {activeTab === 'members' && (
        <div className="card border border-line bg-surface shadow-xs overflow-hidden animate-in fade-in duration-150">
          <Table>
            <thead>
              <tr className="border-b border-line bg-surface-2/60 text-2xs uppercase text-ink-3 font-semibold">
                <th className="p-3 text-left">Member</th>
                <th className="p-3 text-left">Role</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Active</th>
                <th className="p-3 text-left">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-ui">
              {members.map((m) => (
                <tr key={m.id} className="hover:bg-surface-3/50 transition-colors">
                  <td className="p-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar name={m.name} size="sm" />
                      <div className="min-w-0">
                        <div className="font-semibold text-ink truncate">{m.name}</div>
                        <div className="text-2xs text-ink-3 truncate">{m.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <Badge tone="neutral" className="uppercase text-2xs">
                      {m.role}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <span className="text-xs text-ink-2 capitalize">{m.status}</span>
                  </td>
                  <td className="p-3">
                    <Badge tone={m.is_active ? 'success' : 'warn'}>
                      {m.is_active ? 'Active' : 'Deactivated'}
                    </Badge>
                  </td>
                  <td className="p-3 text-2xs text-ink-3">
                    {new Date(m.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      {/* TAB 3: CHANNELS & STATUS */}
      {activeTab === 'channels' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {channels.map((ch, idx) => (
              <div key={idx} className="card p-4 border border-line bg-surface shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-ink">{ch.channel}</span>
                  <Badge tone={ch.status === 'connected' ? 'success' : 'warn'}>
                    {ch.status}
                  </Badge>
                </div>
                <p className="text-xs text-ink-3">{ch.details}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: USAGE */}
      {activeTab === 'usage' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in duration-150">
          <div className="card p-5 border border-line bg-surface shadow-xs space-y-1">
            <span className="text-2xs font-semibold uppercase text-ink-3">Conversations Logged</span>
            <div className="text-2xl font-bold text-ink tabular-nums">{usage.conversations_count}</div>
            <div className="text-2xs text-ink-3">Total customer conversation sessions</div>
          </div>
          <div className="card p-5 border border-line bg-surface shadow-xs space-y-1">
            <span className="text-2xs font-semibold uppercase text-ink-3">Knowledge Base Articles</span>
            <div className="text-2xl font-bold text-ink tabular-nums">{usage.articles_count}</div>
            <div className="text-2xs text-ink-3">Self-service support articles</div>
          </div>
          <div className="card p-5 border border-line bg-surface shadow-xs space-y-1">
            <span className="text-2xs font-semibold uppercase text-ink-3">Assigned Plan</span>
            <div className="text-2xl font-bold text-ink uppercase">{workspace.plan}</div>
            <div className="text-2xs text-ink-3">Subscription tier tier limits</div>
          </div>
        </div>
      )}

      {/* TAB 5: RECENT ACTIVITY */}
      {activeTab === 'activity' && (
        <div className="card border border-line bg-surface shadow-xs divide-y divide-line overflow-hidden animate-in fade-in duration-150">
          {recent_activity.length === 0 ? (
            <div className="p-8 text-center text-xs text-ink-3">
              No recent ticket or conversation activity logged.
            </div>
          ) : (
            recent_activity.map((act) => (
              <div key={act.id} className="p-3.5 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <MessageSquare className="w-4 h-4 text-accent shrink-0" />
                  <div className="truncate font-medium text-ink">{act.title}</div>
                </div>
                <div className="flex items-center gap-3 shrink-0 text-ink-3">
                  <Badge tone="neutral" className="uppercase text-2xs">
                    {act.status}
                  </Badge>
                  <span className="text-2xs">{new Date(act.created_at).toLocaleString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 6: PLATFORM OWNER NOTES */}
      {activeTab === 'notes' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Note Composer */}
          <form onSubmit={handleAddNote} className="card p-4 border border-line bg-surface shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-ink">
              <Lock className="w-3.5 h-3.5 text-accent" />
              <span>Private Platform Owner Note (Confidential)</span>
            </div>
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Record confidential notes about this workspace (account status, billing inquiries, escalations, special instructions). Only visible to platform super admins."
              rows={3}
              className="w-full p-2.5 rounded-md border border-line bg-surface-2/40 text-xs text-ink placeholder:text-ink-3 focus:outline-none focus:border-accent"
            />
            <div className="flex justify-end">
              <Button type="submit" variant="primary" size="sm" loading={savingNote}>
                <Send className="w-3.5 h-3.5" />
                <span>Save Private Note</span>
              </Button>
            </div>
          </form>

          {/* Notes List */}
          <div className="space-y-3">
            {notes.length === 0 ? (
              <div className="p-8 text-center border border-line/60 rounded-lg bg-surface text-xs text-ink-3">
                No private owner notes recorded for this workspace yet.
              </div>
            ) : (
              notes.map((n) => (
                <div key={n.id} className="card p-4 border border-line bg-surface shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-2xs text-ink-3">
                    <span className="font-semibold text-ink">{n.admin_email || 'Super Admin'}</span>
                    <span>{new Date(n.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-ink whitespace-pre-wrap">{n.content}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Suspend Confirmation Modal */}
      <Modal
        open={showSuspendModal}
        onClose={() => setShowSuspendModal(false)}
        title="Suspend Workspace"
      >
        <div className="space-y-4 text-ui">
          <p className="text-xs text-ink-2">
            Are you sure you want to suspend <strong className="text-ink">{workspace.name}</strong>?
          </p>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-ink">Suspension Reason</label>
            <textarea
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              placeholder="Reason for suspension..."
              rows={3}
              className="w-full p-2.5 rounded-md border border-line bg-surface text-xs text-ink focus:outline-none focus:border-accent"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-line">
            <Button variant="ghost" size="sm" onClick={() => setShowSuspendModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" loading={suspending} onClick={handleSuspend}>
              Confirm Suspend
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reactivate Confirmation Modal */}
      <Modal
        open={showReactivateModal}
        onClose={() => setShowReactivateModal(false)}
        title="Reactivate Workspace"
      >
        <div className="space-y-4 text-ui">
          <p className="text-xs text-ink-2">
            Are you sure you want to reactivate <strong className="text-ink">{workspace.name}</strong>?
          </p>
          <div className="flex justify-end gap-2 pt-2 border-t border-line">
            <Button variant="ghost" size="sm" onClick={() => setShowReactivateModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" loading={reactivating} onClick={handleReactivate}>
              Confirm Reactivate
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
