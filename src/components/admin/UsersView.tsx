'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Filter,
  RefreshCw,
  UserX,
  UserCheck,
  Building2,
  ChevronLeft,
  ChevronRight,
  Shield,
} from 'lucide-react';
import {
  getPlatformUsersAction,
  deactivateUserAction,
  reactivateUserAction,
  PlatformUserItem,
} from '@/app/actions/platform';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';
import { Table } from '@/components/ui/Table';
import { SkeletonBlock } from '@/components/ui/States';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

export function UsersView() {
  const toast = useToast();

  const [users, setUsers] = useState<PlatformUserItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Confirmation Modals
  const [targetUser, setTargetUser] = useState<PlatformUserItem | null>(null);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showReactivateModal, setShowReactivateModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await getPlatformUsersAction({
        search,
        role: roleFilter,
        status: statusFilter,
        page,
        pageSize: 15,
      });

      setUsers(res.users);
      setTotalCount(res.totalCount);
      setTotalPages(res.totalPages);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load platform users.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, roleFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadData();
  };

  const handleConfirmDeactivate = async () => {
    if (!targetUser) return;
    setActionLoading(true);
    try {
      const res = await deactivateUserAction(targetUser.id);
      if (res.success) {
        toast.success(`User ${targetUser.name} has been deactivated.`);
        setShowDeactivateModal(false);
        setTargetUser(null);
        await loadData(true);
      } else {
        toast.error(res.error || 'Failed to deactivate user.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to deactivate user.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmReactivate = async () => {
    if (!targetUser) return;
    setActionLoading(true);
    try {
      const res = await reactivateUserAction(targetUser.id);
      if (res.success) {
        toast.success(`User ${targetUser.name} has been reactivated.`);
        setShowReactivateModal(false);
        setTargetUser(null);
        await loadData(true);
      } else {
        toast.error(res.error || 'Failed to reactivate user.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to reactivate user.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-ink tracking-tight">Platform Users</h2>
          <p className="text-xs text-ink-3 mt-0.5">
            Search all users across workspaces, see team affiliations, and manage user access.
          </p>
        </div>

        <Button variant="secondary" size="sm" onClick={() => loadData(true)} loading={refreshing}>
          <RefreshCw className={cn('w-3.5 h-3.5', refreshing && 'animate-spin')} />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Filter / Search Bar */}
      <div className="card p-4 border border-line bg-surface shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-ink-3 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or workspace..."
              className="w-full h-9 pl-9 pr-4 rounded-md border border-line bg-surface-2/40 text-xs text-ink placeholder:text-ink-3 focus:outline-none focus:border-accent"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="h-9 px-3 rounded-md border border-line bg-surface text-xs text-ink focus:outline-none focus:border-accent"
          >
            <option value="all">All Roles</option>
            <option value="owner">Owners</option>
            <option value="admin">Admins</option>
            <option value="agent">Agents</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="h-9 px-3 rounded-md border border-line bg-surface text-xs text-ink focus:outline-none focus:border-accent"
          >
            <option value="all">All Account Status</option>
            <option value="active">Active Accounts</option>
            <option value="deactivated">Deactivated</option>
          </select>

          <Button type="submit" variant="primary" size="sm">
            <span>Filter</span>
          </Button>
        </form>

        <div className="flex items-center justify-between text-2xs text-ink-3 pt-1 border-t border-line/40">
          <span>
            Total: <strong className="text-ink">{totalCount}</strong> users
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
              Clear search
            </button>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="card border border-line bg-surface shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonBlock key={i} className="h-12 rounded-lg" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <EmptyState
            type="custom"
            title="No users match your criteria"
            description="Try modifying search keywords or resetting filters."
          />
        ) : (
          <Table>
            <thead>
              <tr className="border-b border-line bg-surface-2/60 text-2xs uppercase text-ink-3 font-semibold">
                <th className="p-3 text-left">User</th>
                <th className="p-3 text-left">Workspace</th>
                <th className="p-3 text-left">Role</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Account</th>
                <th className="p-3 text-left">Joined</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-ui">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-surface-3/50 transition-colors">
                  {/* User info */}
                  <td className="p-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar name={u.name} size="sm" />
                      <div className="min-w-0">
                        <div className="font-semibold text-ink flex items-center gap-1.5 truncate">
                          <span>{u.name}</span>
                          {u.is_super_admin && (
                            <Badge tone="accent" className="text-2xs py-0 px-1">
                              Super Admin
                            </Badge>
                          )}
                        </div>
                        <div className="text-2xs text-ink-3 truncate">{u.email}</div>
                      </div>
                    </div>
                  </td>

                  {/* Workspace */}
                  <td className="p-3">
                    {u.workspace_id ? (
                      <Link
                        href={`/admin/workspaces/${u.workspace_id}`}
                        className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline"
                      >
                        <Building2 className="w-3.5 h-3.5" />
                        <span className="truncate max-w-xs">{u.workspace_name}</span>
                      </Link>
                    ) : (
                      <span className="text-2xs text-ink-3 italic">None</span>
                    )}
                  </td>

                  {/* Role */}
                  <td className="p-3">
                    <Badge tone="neutral" className="uppercase text-2xs font-semibold">
                      {u.role}
                    </Badge>
                  </td>

                  {/* Online/Offline status */}
                  <td className="p-3">
                    <span className="text-xs text-ink-2 capitalize">{u.status}</span>
                  </td>

                  {/* Active/Deactivated */}
                  <td className="p-3">
                    <Badge tone={u.is_active ? 'success' : 'warn'}>
                      {u.is_active ? 'Active' : 'Deactivated'}
                    </Badge>
                  </td>

                  {/* Joined */}
                  <td className="p-3 text-2xs text-ink-3 whitespace-nowrap">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>

                  {/* Actions */}
                  <td className="p-3 text-right">
                    {u.is_active ? (
                      <Button
                        variant="secondary"
                        size="xs"
                        disabled={u.is_super_admin}
                        onClick={() => {
                          setTargetUser(u);
                          setShowDeactivateModal(true);
                        }}
                        title={u.is_super_admin ? 'Cannot deactivate super admin' : 'Deactivate user'}
                      >
                        <UserX className="w-3.5 h-3.5 text-warn" />
                        <span className="hidden sm:inline text-2xs">Deactivate</span>
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        size="xs"
                        onClick={() => {
                          setTargetUser(u);
                          setShowReactivateModal(true);
                        }}
                        title="Reactivate user"
                      >
                        <UserCheck className="w-3.5 h-3.5 text-success" />
                        <span className="hidden sm:inline text-2xs">Reactivate</span>
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}

        {/* Pagination */}
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

      {/* Deactivate User Modal */}
      <Modal
        open={showDeactivateModal}
        onClose={() => {
          if (!actionLoading) {
            setShowDeactivateModal(false);
            setTargetUser(null);
          }
        }}
        title={`Deactivate User: ${targetUser?.name || ''}`}
      >
        <div className="space-y-4 text-ui">
          <p className="text-xs text-ink-2">
            Are you sure you want to deactivate <strong className="text-ink">{targetUser?.name}</strong> ({targetUser?.email})? The user will be logged out and cannot sign in until reactivated.
          </p>
          <div className="flex justify-end gap-2.5 pt-2 border-t border-line">
            <Button
              variant="ghost"
              size="sm"
              disabled={actionLoading}
              onClick={() => {
                setShowDeactivateModal(false);
                setTargetUser(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={actionLoading}
              onClick={handleConfirmDeactivate}
            >
              <UserX className="w-4 h-4" />
              <span>Confirm Deactivate</span>
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reactivate User Modal */}
      <Modal
        open={showReactivateModal}
        onClose={() => {
          if (!actionLoading) {
            setShowReactivateModal(false);
            setTargetUser(null);
          }
        }}
        title={`Reactivate User: ${targetUser?.name || ''}`}
      >
        <div className="space-y-4 text-ui">
          <p className="text-xs text-ink-2">
            Are you sure you want to reactivate <strong className="text-ink">{targetUser?.name}</strong>? Their login permissions and workspace access will be restored immediately.
          </p>
          <div className="flex justify-end gap-2.5 pt-2 border-t border-line">
            <Button
              variant="ghost"
              size="sm"
              disabled={actionLoading}
              onClick={() => {
                setShowReactivateModal(false);
                setTargetUser(null);
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
              <UserCheck className="w-4 h-4" />
              <span>Confirm Reactivate</span>
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
