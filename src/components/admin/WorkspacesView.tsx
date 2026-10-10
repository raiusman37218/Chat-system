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
} from 'lucide-react';
import {
  getPlatformWorkspacesTableAction,
  suspendWorkspaceAction,
  reactivateWorkspaceAction,
  PlatformWorkspaceItem,
} from '@/app/actions/platform';
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
                <SortHeader
                  label="Last Activity"
                  active={sortField === 'last_activity_at'}
                  direction={sortOrder}
                  onSort={() => handleSort('last_activity_at')}
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

                  {/* Last Activity */}
                  <td className="p-3 text-2xs text-ink-3 whitespace-nowrap">
                    {w.last_activity_at ? (
                      new Date(w.last_activity_at).toLocaleDateString()
                    ) : (
                      <span className="italic">Never</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="p-3 text-right">
                    <div className="inline-flex items-center gap-1.5 justify-end">
                      <Link href={`/admin/workspaces/${w.id}`}>
                        <Button variant="ghost" size="xs" title="View workspace detail">
                          <Eye className="w-3.5 h-3.5" />
                          <span className="text-2xs">View</span>
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
                          <span className="text-2xs">Reactivate</span>
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
                          <span className="text-2xs">Suspend</span>
                        </Button>
                      )}
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
    </div>
  );
}
