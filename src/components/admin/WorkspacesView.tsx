'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2,
  Search,
  Filter,
  RefreshCw,
  PauseCircle,
  PlayCircle,
  Eye,
  Globe,
  Mail,
  Clock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  LogIn,
  Download,
  Trash2,
  ShieldAlert,
} from 'lucide-react';
import {
  getPlatformWorkspacesTableAction,
  suspendWorkspaceAction,
  reactivateWorkspaceAction,
  PlatformWorkspaceItem,
} from '@/app/actions/platform';
import {
  startSupportSessionAction,
  exportWorkspaceDataAction,
  scheduleWorkspaceDeletionAction,
  cancelWorkspaceDeletionAction,
} from '@/app/actions/platform-management';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Table, SortHeader } from '@/components/ui/Table';
import { SkeletonBlock } from '@/components/ui/States';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

export function WorkspacesView() {
  const toast = useToast();

  const [workspaces, setWorkspaces] = useState<PlatformWorkspaceItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters & sorting
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [channelFilter, setChannelFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [sortField, setSortField] = useState<'name' | 'created_at' | 'tickets_30d_count' | 'agents_count' | 'last_activity_at'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Confirmation Modals
  const [targetWorkspace, setTargetWorkspace] = useState<PlatformWorkspaceItem | null>(null);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const [showReactivateModal, setShowReactivateModal] = useState(false);

  // Support Session Impersonation Modal
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [supportReason, setSupportReason] = useState('');
  const [supportLoading, setSupportLoading] = useState(false);

  // Data Export Loading
  const [exportingId, setExportingId] = useState<string | null>(null);

  // Deletion Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await getPlatformWorkspacesTableAction({
        search,
        status: statusFilter,
        channel: channelFilter,
        plan: planFilter,
        sort: sortField,
        order: sortOrder,
        page,
        pageSize: 15,
      });

      setWorkspaces(res.workspaces);
      setTotalCount(res.totalCount);
      setTotalPages(res.totalPages);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch workspaces.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, statusFilter, channelFilter, planFilter, sortField, sortOrder]);

  // Handle Search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadData();
  };

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleConfirmSuspend = async () => {
    if (!targetWorkspace) return;
    setActionLoading(true);
    try {
      await suspendWorkspaceAction(targetWorkspace.id, suspendReason);
      toast.success(`Workspace "${targetWorkspace.name}" suspended.`);
      setShowSuspendModal(false);
      setSuspendReason('');
      setTargetWorkspace(null);
      await loadData(true);
    } catch (err: any) {
      toast.error(err.message || 'Failed to suspend workspace.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmReactivate = async () => {
    if (!targetWorkspace) return;
    setActionLoading(true);
    try {
      await reactivateWorkspaceAction(targetWorkspace.id);
      toast.success(`Workspace "${targetWorkspace.name}" reactivated.`);
      setShowReactivateModal(false);
      setTargetWorkspace(null);
      await loadData(true);
    } catch (err: any) {
      toast.error(err.message || 'Failed to reactivate workspace.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartSupportSession = async () => {
    if (!targetWorkspace) return;
    setSupportLoading(true);
    try {
      const res = await startSupportSessionAction({
        workspaceId: targetWorkspace.id,
        reason: supportReason.trim() || 'Platform staff support investigation',
      });
      if (res.success) {
        toast.success(`Support session established for ${targetWorkspace.name}. Redirecting...`);
        setShowSupportModal(false);
        setSupportReason('');
        window.location.href = `/dashboard?workspace=${targetWorkspace.id}`;
      } else {
        toast.error(res.error || 'Failed to start support session.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to start support session.');
    } finally {
      setSupportLoading(false);
    }
  };

  const handleExportData = async (w: PlatformWorkspaceItem) => {
    setExportingId(w.id);
    try {
      const res = await exportWorkspaceDataAction(w.id);
      if (res.success && res.data) {
        const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `workspace-export-${w.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${w.id.slice(0, 8)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success(`Complete data package exported for ${w.name}`);
      } else {
        toast.error(res.error || 'Failed to export workspace data.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to export data.');
    } finally {
      setExportingId(null);
    }
  };

  const handleConfirmScheduleDeletion = async () => {
    if (!targetWorkspace) return;
    if (deleteConfirmName.trim() !== targetWorkspace.name.trim()) {
      toast.error(`Please type "${targetWorkspace.name}" exactly to confirm.`);
      return;
    }
    setDeleteLoading(true);
    try {
      const res = await scheduleWorkspaceDeletionAction({
        workspaceId: targetWorkspace.id,
        confirmName: deleteConfirmName,
        reason: deleteReason.trim() || 'Super admin requested workspace deletion',
      });
      if (res.success) {
        toast.success(`Workspace scheduled for permanent deletion in 30 days.`);
        setShowDeleteModal(false);
        setDeleteConfirmName('');
        setDeleteReason('');
        setTargetWorkspace(null);
        await loadData(true);
      } else {
        toast.error(res.error || 'Failed to schedule deletion.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to schedule deletion.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-ink tracking-tight">Workspaces Directory</h2>
          <p className="text-xs text-ink-3 mt-0.5">
            Manage all tenant workspaces, monitor capacity, and control suspension status.
          </p>
        </div>

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
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card p-4 border border-line bg-surface shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-ink-3 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by workspace name, domain, owner email, or ID..."
              className="w-full h-9 pl-9 pr-4 rounded-md border border-line bg-surface-2/40 text-xs text-ink placeholder:text-ink-3 focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as any);
              setPage(1);
            }}
            className="h-9 px-3 rounded-md border border-line bg-surface text-xs text-ink focus:outline-none focus:border-accent"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="suspended">Suspended Only</option>
          </select>

          {/* Channel Filter */}
          <select
            value={channelFilter}
            onChange={(e) => {
              setChannelFilter(e.target.value);
              setPage(1);
            }}
            className="h-9 px-3 rounded-md border border-line bg-surface text-xs text-ink focus:outline-none focus:border-accent"
          >
            <option value="all">All Channels</option>
            <option value="chat">Web Chat</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="instagram">Instagram</option>
            <option value="email">Email</option>
          </select>

          {/* Plan Filter */}
          <select
            value={planFilter}
            onChange={(e) => {
              setPlanFilter(e.target.value);
              setPage(1);
            }}
            className="h-9 px-3 rounded-md border border-line bg-surface text-xs text-ink focus:outline-none focus:border-accent"
          >
            <option value="all">All Plans</option>
            <option value="free">Free</option>
            <option value="starter">Starter</option>
            <option value="pro">Pro</option>
            <option value="enterprise">Enterprise</option>
          </select>

          <Button type="submit" variant="primary" size="sm">
            <span>Filter</span>
          </Button>
        </form>

        <div className="flex items-center justify-between text-2xs text-ink-3 pt-1 border-t border-line/40">
          <span>
            Showing <strong className="text-ink">{workspaces.length}</strong> of{' '}
            <strong className="text-ink">{totalCount}</strong> workspaces
          </span>
          {search && (
            <button
              onClick={() => {
                setSearch('');
                setPage(1);
                loadData();
              }}
              className="text-accent hover:underline"
            >
              Clear search filter
            </button>
          )}
        </div>
      </div>

      {/* Workspaces Table */}
      <div className="card border border-line bg-surface shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonBlock key={i} className="h-12 rounded-lg" />
            ))}
          </div>
        ) : workspaces.length === 0 ? (
          <EmptyState
            type="custom"
            title="No workspaces match your filters"
            description="Try modifying or clearing your search criteria to view workspaces."
            actionLabel="Reset All Filters"
            onAction={() => {
              setSearch('');
              setStatusFilter('all');
              setChannelFilter('all');
              setPlanFilter('all');
              setPage(1);
            }}
          />
        ) : (
          <Table>
            <thead>
              <tr className="border-b border-line bg-surface-2/60 text-2xs uppercase text-ink-3 font-semibold">
                <SortHeader
                  label="Workspace"
                  active={sortField === 'name'}
                  direction={sortOrder}
                  onSort={() => handleSort('name')}
                />
                <th className="p-3 text-left">Owner</th>
                <th className="p-3 text-left">Status</th>
                <SortHeader
                  label="Agents"
                  active={sortField === 'agents_count'}
                  direction={sortOrder}
                  onSort={() => handleSort('agents_count')}
                />
                <SortHeader
                  label="Tickets (30d)"
                  active={sortField === 'tickets_30d_count'}
                  direction={sortOrder}
                  onSort={() => handleSort('tickets_30d_count')}
                />
                <th className="p-3 text-left">Channels</th>
                <SortHeader
                  label="Created"
                  active={sortField === 'created_at'}
                  direction={sortOrder}
                  onSort={() => handleSort('created_at')}
                />
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-ui">
              {workspaces.map((w) => (
                <tr key={w.id} className="hover:bg-surface-3/50 transition-colors">
                  {/* Name */}
                  <td className="p-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0"
                        style={{ backgroundColor: w.brand_color }}
                      >
                        {w.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <Link
                          href={`/admin/workspaces/${w.id}`}
                          className="font-semibold text-ink hover:text-accent truncate block"
                        >
                          {w.name}
                        </Link>
                        {w.website_url ? (
                          <span className="text-2xs text-ink-3 truncate block">
                            {w.website_url.replace(/^https?:\/\//, '')}
                          </span>
                        ) : (
                          <span className="text-2xs text-ink-3 italic block">No domain</span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Owner */}
                  <td className="p-3 text-ink-2 truncate max-w-xs">
                    {w.owner_email || <span className="italic text-ink-3">None</span>}
                  </td>

                  {/* Status */}
                  <td className="p-3">
                    <Badge tone={w.is_suspended ? 'warn' : 'success'}>
                      {w.is_suspended ? 'Suspended' : 'Active'}
                    </Badge>
                  </td>

                  {/* Agents */}
                  <td className="p-3 tabular-nums text-ink">{w.agents_count}</td>

                  {/* Tickets (30d) */}
                  <td className="p-3 tabular-nums font-semibold text-ink">
                    {w.tickets_30d_count.toLocaleString()}
                  </td>

                  {/* Channels */}
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {w.connected_channels.map((ch) => (
                        <span
                          key={ch}
                          className="px-1.5 py-0.5 rounded text-2xs font-mono uppercase bg-surface-2 text-ink-2 border border-line"
                        >
                          {ch}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Created */}
                  <td className="p-3 text-2xs text-ink-3 whitespace-nowrap">
                    {new Date(w.created_at).toLocaleDateString()}
                  </td>

                  {/* Actions */}
                  <td className="p-3 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => {
                          setTargetWorkspace(w);
                          setShowSupportModal(true);
                        }}
                        title="Login as workspace (Support session)"
                        className="text-accent hover:text-accent hover:bg-accent/10"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        <span className="sr-only">Support Login</span>
                      </Button>

                      <Button
                        variant="ghost"
                        size="xs"
                        disabled={exportingId === w.id}
                        onClick={() => handleExportData(w)}
                        title="Export complete workspace JSON"
                      >
                        <Download className={`w-3.5 h-3.5 ${exportingId === w.id ? 'animate-bounce text-accent' : ''}`} />
                        <span className="sr-only">Export</span>
                      </Button>

                      <Link href={`/admin/workspaces/${w.id}`}>
                        <Button variant="ghost" size="xs" title="View workspace detail">
                          <Eye className="w-3.5 h-3.5" />
                          <span className="sr-only">View</span>
                        </Button>
                      </Link>

                      {w.is_suspended ? (
                        <Button
                          variant="secondary"
                          size="xs"
                          onClick={() => {
                            setTargetWorkspace(w);
                            setShowReactivateModal(true);
                          }}
                          title="Reactivate workspace"
                        >
                          <PlayCircle className="w-3.5 h-3.5 text-success" />
                          <span className="hidden sm:inline text-2xs">Reactivate</span>
                        </Button>
                      ) : (
                        <Button
                          variant="danger"
                          size="xs"
                          onClick={() => {
                            setTargetWorkspace(w);
                            setShowSuspendModal(true);
                          }}
                          title="Suspend workspace"
                        >
                          <PauseCircle className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline text-2xs">Suspend</span>
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => {
                          setTargetWorkspace(w);
                          setShowDeleteModal(true);
                        }}
                        title="Schedule 30-day workspace deletion"
                        className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-line bg-surface flex items-center justify-between text-xs text-ink-3">
            <div>
              Page <strong className="text-ink">{page}</strong> of{' '}
              <strong className="text-ink">{totalPages}</strong>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal: Suspend Workspace */}
      <Modal
        open={showSuspendModal}
        onClose={() => {
          if (!actionLoading) {
            setShowSuspendModal(false);
            setTargetWorkspace(null);
            setSuspendReason('');
          }
        }}
        title={`Suspend Workspace: ${targetWorkspace?.name || ''}`}
      >
        <div className="space-y-4 text-ui">
          <div className="p-3.5 rounded-lg border border-warn/30 bg-warn/10 text-ink flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-warn shrink-0 mt-0.5" />
            <p className="text-xs text-ink-2">
              Suspending this workspace prevents its agents and visitors from sending new messages or modifying settings until reactivated.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink">Reason for Suspension</label>
            <textarea
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              placeholder="e.g. Non-payment, Terms of Service violation, or customer request..."
              rows={3}
              className="w-full p-2.5 rounded-md border border-line bg-surface text-xs text-ink placeholder:text-ink-3 focus:outline-none focus:border-accent"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-line">
            <Button
              variant="ghost"
              size="sm"
              disabled={actionLoading}
              onClick={() => {
                setShowSuspendModal(false);
                setTargetWorkspace(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={actionLoading}
              onClick={handleConfirmSuspend}
            >
              <PauseCircle className="w-4 h-4" />
              <span>Confirm Suspension</span>
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirmation Modal: Reactivate Workspace */}
      <Modal
        open={showReactivateModal}
        onClose={() => {
          if (!actionLoading) {
            setShowReactivateModal(false);
            setTargetWorkspace(null);
          }
        }}
        title={`Reactivate Workspace: ${targetWorkspace?.name || ''}`}
      >
        <div className="space-y-4 text-ui">
          <p className="text-xs text-ink-2">
            Are you sure you want to reactivate <strong className="text-ink">{targetWorkspace?.name}</strong>? All agent and visitor communication access will be restored immediately.
          </p>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-line">
            <Button
              variant="ghost"
              size="sm"
              disabled={actionLoading}
              onClick={() => {
                setShowReactivateModal(false);
                setTargetWorkspace(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={actionLoading}
              onClick={handleConfirmReactivate}
            >
              <PlayCircle className="w-4 h-4" />
              <span>Confirm Reactivation</span>
            </Button>
          </div>
        </div>
      </Modal>

      {/* Support Session Impersonation Modal */}
      <Modal
        open={showSupportModal}
        onClose={() => {
          if (!supportLoading) {
            setShowSupportModal(false);
            setTargetWorkspace(null);
          }
        }}
        title={`Support Login: ${targetWorkspace?.name || ''}`}
        description="Open this workspace with an active support session. Customer passwords are never exposed."
      >
        <div className="space-y-4">
          <div className="p-3 rounded-lg border border-line bg-surface-2 text-xs text-ink-2 space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-ink">
              <ShieldAlert className="w-4 h-4 text-accent" />
              <span>Strict Support Session Safeguards</span>
            </div>
            <p>
              • A floating orange notification banner with an exit button and 60-minute countdown will appear.
            </p>
            <p>• Your platform identity and this reason will be recorded to the immutable audit log.</p>
            <p>• Zero customer passwords or credential secrets are ever accessed or decrypted.</p>
          </div>

          <div>
            <label className="block text-2xs font-semibold text-ink-2 mb-1">
              Audit Reason for Support Session *
            </label>
            <textarea
              rows={2}
              value={supportReason}
              onChange={(e) => setSupportReason(e.target.value)}
              placeholder="e.g. Assisting customer with inbox configuration and billing audit..."
              className="input input-sm w-full py-2"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-line">
            <Button
              variant="secondary"
              size="sm"
              disabled={supportLoading}
              onClick={() => {
                setShowSupportModal(false);
                setTargetWorkspace(null);
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              loading={supportLoading}
              onClick={handleStartSupportSession}
            >
              <LogIn className="w-3.5 h-3.5 mr-1" />
              <span>Launch Support Session</span>
            </Button>
          </div>
        </div>
      </Modal>

      {/* Schedule Workspace Deletion Modal */}
      <Modal
        open={showDeleteModal}
        onClose={() => {
          if (!deleteLoading) {
            setShowDeleteModal(false);
            setTargetWorkspace(null);
          }
        }}
        title={`Schedule Deletion: ${targetWorkspace?.name || ''}`}
        description="Workspaces enter a mandatory 30-day waiting period before permanent destruction."
      >
        <div className="space-y-4">
          <div className="p-3 rounded-lg border border-rose-500/20 bg-rose-500/10 text-xs text-rose-700 dark:text-rose-300 space-y-1">
            <div className="flex items-center gap-2 font-bold text-rose-600">
              <AlertTriangle className="w-4 h-4" />
              <span>30-Day Waiting Period & Immediate Suspension</span>
            </div>
            <p>
              Upon scheduling, this workspace will be suspended immediately. All data (tickets, agents, knowledge base) will be permanently purged after 30 days unless cancelled.
            </p>
          </div>

          <div>
            <label className="block text-2xs font-semibold text-ink-2 mb-1">Reason for Deletion</label>
            <input
              type="text"
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              placeholder="e.g. Customer request or permanent account closure"
              className="input input-sm w-full"
            />
          </div>

          <div>
            <label className="block text-2xs font-semibold text-ink-2 mb-1">
              Type <strong className="text-ink font-mono">{targetWorkspace?.name}</strong> to confirm:
            </label>
            <input
              type="text"
              value={deleteConfirmName}
              onChange={(e) => setDeleteConfirmName(e.target.value)}
              placeholder="Type exact workspace name..."
              className="input input-sm w-full font-mono text-2xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-line">
            <Button
              variant="secondary"
              size="sm"
              disabled={deleteLoading}
              onClick={() => {
                setShowDeleteModal(false);
                setTargetWorkspace(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={deleteLoading}
              disabled={deleteConfirmName.trim() !== (targetWorkspace?.name || '').trim()}
              onClick={handleConfirmScheduleDeletion}
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              <span>Schedule 30-Day Deletion</span>
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
