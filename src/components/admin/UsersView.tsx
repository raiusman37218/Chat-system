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
  ShieldAlert,
  ShieldCheck,
  UserPlus,
  Key,
  Copy,
  Check,
  Eye,
  EyeOff,
  Trash2,
  Mail,
  Lock,
} from 'lucide-react';
import {
  getPlatformUsersAction,
  deactivateUserAction,
  reactivateUserAction,
  getPlatformSuperAdminsListAction,
  inviteSuperAdminAction,
  revokeSuperAdminInviteAction,
  deleteSuperAdminInviteAction,
  revokeSuperAdminAccessAction,
  deleteSuperAdminAccessAction,
  deleteSuperAdminUserCompletelyAction,
  PlatformUserItem,
  PlatformSuperAdminInvitation,
} from '@/app/actions/platform';
import { Agent } from '@/types/database';
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

  const [activeTab, setActiveTab] = useState<'users' | 'super-admins'>('users');

  // Tenant Users
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

  // Confirmation Modals for Users
  const [targetUser, setTargetUser] = useState<PlatformUserItem | null>(null);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showReactivateModal, setShowReactivateModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Super Admins & Invitations
  const [superAdmins, setSuperAdmins] = useState<Agent[]>([]);
  const [invitations, setInvitations] = useState<PlatformSuperAdminInvitation[]>([]);
  const [isCurrentCallerOwner, setIsCurrentCallerOwner] = useState(false);
  const [superAdminsLoading, setSuperAdminsLoading] = useState(false);

  // Invite Modal State
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePassword, setInvitePassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);

  // Revoke / Delete Admin State
  const [targetAdminToRevoke, setTargetAdminToRevoke] = useState<Agent | null>(null);
  const [showRevokeAdminModal, setShowRevokeAdminModal] = useState(false);
  const [revokeLoading, setRevokeLoading] = useState(false);
  const [deleteAccountLoading, setDeleteAccountLoading] = useState(false);

  const loadTenantUsers = async (isRefresh = false) => {
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

  const loadSuperAdmins = async () => {
    setSuperAdminsLoading(true);
    try {
      const res = await getPlatformSuperAdminsListAction();
      setSuperAdmins(res.admins);
      setInvitations(res.invitations);
      setIsCurrentCallerOwner(res.isCurrentCallerOwner);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load platform super admins.');
    } finally {
      setSuperAdminsLoading(false);
    }
  };

  useEffect(() => {
    loadTenantUsers();
    loadSuperAdmins();
  }, [page, roleFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadTenantUsers();
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
        await loadTenantUsers(true);
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
        await loadTenantUsers(true);
      } else {
        toast.error(res.error || 'Failed to reactivate user.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to reactivate user.');
    } finally {
      setActionLoading(false);
    }
  };

  // Generate strong random password
  const generateStrongPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*';
    let pwd = '';
    for (let i = 0; i < 14; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setInvitePassword(pwd);
    setCopiedPassword(false);
  };

  const handleCopyPassword = () => {
    if (!invitePassword) return;
    navigator.clipboard.writeText(invitePassword);
    setCopiedPassword(true);
    toast.success('Password copied to clipboard!');
    setTimeout(() => setCopiedPassword(false), 2500);
  };

  const handleSendSuperAdminInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteName || !invitePassword) {
      toast.error('Please fill in all fields.');
      return;
    }
    if (invitePassword.length < 8) {
      toast.error('Password must be at least 8 characters long.');
      return;
    }

    setInviteLoading(true);
    try {
      const res = await inviteSuperAdminAction({
        name: inviteName,
        email: inviteEmail,
        password: invitePassword,
      });

      if (res.success) {
        toast.success(`Platform Super Admin invitation sent to ${inviteEmail}!`);
        setShowInviteModal(false);
        setInviteName('');
        setInviteEmail('');
        setInvitePassword('');
        await loadSuperAdmins();
      } else {
        toast.error(res.error || 'Failed to invite super admin.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to invite super admin.');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRevokeInvite = async (invitationId: string) => {
    try {
      const res = await revokeSuperAdminInviteAction(invitationId);
      if (res.success) {
        toast.success('Invitation revoked successfully.');
        await loadSuperAdmins();
      } else {
        toast.error(res.error || 'Failed to revoke invitation.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to revoke invitation.');
    }
  };

  const handleDeleteInvite = async (invitationId: string) => {
    try {
      const res = await deleteSuperAdminInviteAction(invitationId);
      if (res.success) {
        toast.success('Invitation deleted permanently.');
        await loadSuperAdmins();
      } else {
        toast.error(res.error || 'Failed to delete invitation.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete invitation.');
    }
  };

  const handleConfirmRevokeAccess = async () => {
    if (!targetAdminToRevoke) return;
    setRevokeLoading(true);
    try {
      const res = await deleteSuperAdminAccessAction(targetAdminToRevoke.id);
      if (res.success) {
        toast.success(`Super admin access revoked for ${targetAdminToRevoke.email}.`);
        setShowRevokeAdminModal(false);
        setTargetAdminToRevoke(null);
        await Promise.all([loadSuperAdmins(), loadTenantUsers()]);
      } else {
        toast.error(res.error || 'Failed to remove super admin access.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove super admin access.');
    } finally {
      setRevokeLoading(false);
    }
  };

  const handleConfirmDeleteUserCompletely = async () => {
    if (!targetAdminToRevoke) return;
    setDeleteAccountLoading(true);
    try {
      const res = await deleteSuperAdminUserCompletelyAction(targetAdminToRevoke.id);
      if (res.success) {
        toast.success(`User ${targetAdminToRevoke.email} permanently deleted.`);
        setShowRevokeAdminModal(false);
        setTargetAdminToRevoke(null);
        await Promise.all([loadSuperAdmins(), loadTenantUsers()]);
      } else {
        toast.error(res.error || 'Failed to delete super admin account.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete super admin account.');
    } finally {
      setDeleteAccountLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-ink tracking-tight">System Users & Administrators</h2>
          <p className="text-xs text-ink-3 mt-0.5">
            Manage workspace tenants, agents, and platform-level Super Admins authorized by the owner.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isCurrentCallerOwner && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                generateStrongPassword();
                setShowInviteModal(true);
              }}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Grant Super Admin Access</span>
            </Button>
          )}

          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              loadTenantUsers(true);
              loadSuperAdmins();
            }}
            loading={refreshing}
          >
            <RefreshCw className={cn('w-3.5 h-3.5', refreshing && 'animate-spin')} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Tabs Control */}
      <div className="flex border-b border-line gap-6 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={cn(
            'pb-3 transition-colors relative flex items-center gap-2',
            activeTab === 'users'
              ? 'text-accent border-b-2 border-accent'
              : 'text-ink-3 hover:text-ink'
          )}
        >
          <Users className="w-4 h-4" />
          <span>All Workspace Users ({totalCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('super-admins')}
          className={cn(
            'pb-3 transition-colors relative flex items-center gap-2',
            activeTab === 'super-admins'
              ? 'text-accent border-b-2 border-accent'
              : 'text-ink-3 hover:text-ink'
          )}
        >
          <Shield className="w-4 h-4 text-accent" />
          <span>Platform Super Admins ({superAdmins.length})</span>
          {invitations.filter((i) => i.status === 'pending').length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-2xs bg-accent/20 text-accent font-bold">
              {invitations.filter((i) => i.status === 'pending').length} pending
            </span>
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ALL WORKSPACE USERS */}
      {/* ========================================================================= */}
      {activeTab === 'users' && (
        <div className="space-y-6">
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

            <div className="flex items-center justify-between text-2xs text-ink-3 pt-1">
              <span>Showing {users.length} of {totalCount} platform users</span>
              {(search || roleFilter !== 'all' || statusFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setRoleFilter('all');
                    setStatusFilter('all');
                    setPage(1);
                  }}
                  className="hover:text-accent font-medium transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>
          </div>

          {/* Table Container */}
          <div className="card border border-line bg-surface shadow-xs overflow-hidden">
            {loading ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <SkeletonBlock key={i} className="h-12 w-full rounded-md" />
                ))}
              </div>
            ) : users.length === 0 ? (
              <EmptyState
                type="no-search-results"
                title="No users found"
                description="Try adjusting your search criteria or clearing filters."
              />
            ) : (
              <Table>
                <thead>
                  <tr className="border-b border-line bg-surface-2/60 text-2xs uppercase text-ink-3 font-semibold">
                    <th className="p-3 text-left">User</th>
                    <th className="p-3 text-left">Workspace</th>
                    <th className="p-3 text-left">Role</th>
                    <th className="p-3 text-left">Status</th>
                    <th className="p-3 text-left">Joined</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line text-ui">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-surface-2/40 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={u.name} size="sm" />
                          <div className="min-w-0">
                            <div className="font-semibold text-ink truncate flex items-center gap-1.5">
                              <span>{u.name}</span>
                              {u.is_super_admin && (
                                <Badge tone="accent" className="text-3xs py-0 px-1">
                                  Super Admin
                                </Badge>
                              )}
                            </div>
                            <div className="text-2xs text-ink-3 truncate">{u.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="p-3">
                        {u.workspace_id ? (
                          <Link
                            href={`/admin/workspaces/${u.workspace_id}`}
                            className="inline-flex items-center gap-1 text-xs text-ink hover:text-accent font-medium"
                          >
                            <Building2 className="w-3.5 h-3.5 text-ink-3" />
                            <span className="truncate max-w-[140px]">{u.workspace_name || 'View Workspace'}</span>
                          </Link>
                        ) : (
                          <span className="text-2xs text-ink-3 italic">Platform Owner / Unassigned</span>
                        )}
                      </td>

                      <td className="p-3">
                        <Badge
                          tone={u.role === 'owner' ? 'accent' : u.role === 'admin' ? 'info' : 'neutral'}
                          className="capitalize"
                        >
                          {u.role}
                        </Badge>
                      </td>

                      <td className="p-3">
                        {u.is_active ? (
                          <span className="inline-flex items-center gap-1.5 text-2xs font-semibold text-success">
                            <span className="w-1.5 h-1.5 rounded-full bg-success" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-2xs font-semibold text-ink-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-ink-3" />
                            Deactivated
                          </span>
                        )}
                      </td>

                      <td className="p-3 text-2xs text-ink-3">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>

                      <td className="p-3 text-right">
                        {u.is_super_admin ? (
                          isCurrentCallerOwner && !u.is_platform_owner && !['musmanrai372@gmail.com', 'raiusman37218@gmail.com', 'agent@zentry.io'].includes(u.email.toLowerCase()) ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-danger hover:text-danger hover:bg-danger/10"
                              onClick={() => {
                                setTargetAdminToRevoke(u as any);
                                setShowRevokeAdminModal(true);
                              }}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete Access</span>
                            </Button>
                          ) : (
                            <span className="text-2xs text-ink-3 font-medium">Platform Owner</span>
                          )
                        ) : u.is_active ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-danger hover:text-danger hover:bg-danger/10"
                            onClick={() => {
                              setTargetUser(u);
                              setShowDeactivateModal(true);
                            }}
                          >
                            <UserX className="w-3.5 h-3.5" />
                            <span>Deactivate</span>
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-success hover:text-success hover:bg-success/10"
                            onClick={() => {
                              setTargetUser(u);
                              setShowReactivateModal(true);
                            }}
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Reactivate</span>
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
              <div className="flex items-center justify-between p-3.5 border-t border-line bg-surface-2/30 text-xs">
                <span className="text-ink-3">Page {page} of {totalPages}</span>
                <div className="flex items-center gap-1.5">
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PLATFORM SUPER ADMINS & INVITATIONS */}
      {/* ========================================================================= */}
      {activeTab === 'super-admins' && (
        <div className="space-y-6">
          {/* Owner Advisory Banner */}
          <div className="p-4 rounded-xl border border-accent/20 bg-accent/5 flex items-start gap-3.5">
            <ShieldCheck className="w-5 h-5 text-accent shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <strong className="text-ink font-semibold block">Platform Owner Access Control</strong>
              <p className="text-ink-3 leading-relaxed">
                Super admin access gives global authority across all workspaces. As per security policy, only the
                ZenTry platform owner can grant super admin access. The owner creates their temporary password and
                dispatches an email invitation with an activation link.
              </p>
            </div>
          </div>

          {/* Active Super Admins Table */}
          <div className="card border border-line bg-surface shadow-xs overflow-hidden">
            <div className="p-4 border-b border-line bg-surface-2/30 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-ink uppercase tracking-wider">Active System Administrators</h3>
                <p className="text-2xs text-ink-3 mt-0.5">Accounts with global platform administration rights</p>
              </div>
            </div>

            {superAdminsLoading ? (
              <div className="p-6 space-y-3">
                {[1, 2].map((i) => (
                  <SkeletonBlock key={i} className="h-12 w-full rounded-md" />
                ))}
              </div>
            ) : (
              <Table>
                <thead>
                  <tr className="border-b border-line bg-surface-2/60 text-2xs uppercase text-ink-3 font-semibold">
                    <th className="p-3 text-left">Admin</th>
                    <th className="p-3 text-left">Role Authority</th>
                    <th className="p-3 text-left">Status</th>
                    <th className="p-3 text-left">Granted On</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line text-ui">
                  {superAdmins.map((adm) => (
                    <tr key={adm.id} className="hover:bg-surface-2/40 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={adm.name} size="sm" />
                          <div className="min-w-0">
                            <div className="font-semibold text-ink truncate">{adm.name}</div>
                            <div className="text-2xs text-ink-3 truncate">{adm.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="p-3">
                        {adm.is_platform_owner || ['musmanrai372@gmail.com', 'raiusman37218@gmail.com', 'agent@zentry.io'].includes(adm.email.toLowerCase()) ? (
                          <Badge tone="accent" className="font-bold">
                            👑 Platform Owner
                          </Badge>
                        ) : (
                          <Badge tone="info">
                            🛡 Super Admin
                          </Badge>
                        )}
                      </td>

                      <td className="p-3">
                        <span className="inline-flex items-center gap-1.5 text-2xs font-semibold text-success">
                          <span className="w-1.5 h-1.5 rounded-full bg-success" />
                          Active
                        </span>
                      </td>

                      <td className="p-3 text-2xs text-ink-3">
                        {new Date(adm.created_at).toLocaleDateString()}
                      </td>

                      <td className="p-3 text-right">
                        {adm.is_platform_owner || ['musmanrai372@gmail.com', 'raiusman37218@gmail.com', 'agent@zentry.io'].includes(adm.email.toLowerCase()) ? (
                          <span className="text-2xs text-ink-3 italic">Permanent Owner</span>
                        ) : isCurrentCallerOwner ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-danger hover:text-danger hover:bg-danger/10"
                            onClick={() => {
                              setTargetAdminToRevoke(adm);
                              setShowRevokeAdminModal(true);
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete Access</span>
                          </Button>
                        ) : (
                          <span className="text-2xs text-ink-3">Owner Managed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </div>

          {/* Pending Invitations Table */}
          <div className="card border border-line bg-surface shadow-xs overflow-hidden">
            <div className="p-4 border-b border-line bg-surface-2/30 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-ink uppercase tracking-wider">Super Admin Invitations</h3>
                <p className="text-2xs text-ink-3 mt-0.5">Invitations dispatched with passwords set by the owner</p>
              </div>
            </div>

            {invitations.length === 0 ? (
              <div className="p-8 text-center text-xs text-ink-3">
                No super admin invitations dispatched.
              </div>
            ) : (
              <Table>
                <thead>
                  <tr className="border-b border-line bg-surface-2/60 text-2xs uppercase text-ink-3 font-semibold">
                    <th className="p-3 text-left">Invitee</th>
                    <th className="p-3 text-left">Invited By</th>
                    <th className="p-3 text-left">Status</th>
                    <th className="p-3 text-left">Sent Date</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line text-ui">
                  {invitations.map((inv) => (
                    <tr key={inv.id} className="hover:bg-surface-2/40 transition-colors">
                      <td className="p-3">
                        <div className="font-semibold text-ink text-xs">{inv.name}</div>
                        <div className="text-2xs text-ink-3 font-mono">{inv.email}</div>
                      </td>

                      <td className="p-3 text-2xs text-ink-3">
                        {inv.invited_by_email}
                      </td>

                      <td className="p-3">
                        <Badge
                          tone={
                            inv.status === 'accepted'
                              ? 'success'
                              : inv.status === 'revoked'
                              ? 'danger'
                              : 'warn'
                          }
                        >
                          {inv.status}
                        </Badge>
                      </td>

                      <td className="p-3 text-2xs text-ink-3">
                        {new Date(inv.created_at).toLocaleDateString()}
                      </td>

                      <td className="p-3 text-right space-x-2">
                        {inv.status === 'pending' && (
                          <>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                const url = `${window.location.origin}/accept-super-admin-invite?token=${inv.token}`;
                                navigator.clipboard.writeText(url);
                                toast.success('Invite link copied!');
                              }}
                            >
                              <Copy className="w-3 h-3 mr-1" />
                              <span>Copy Link</span>
                            </Button>

                            {isCurrentCallerOwner && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-ink-3 hover:text-ink"
                                onClick={() => handleRevokeInvite(inv.id)}
                              >
                                <span>Revoke</span>
                              </Button>
                            )}
                          </>
                        )}

                        {isCurrentCallerOwner && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-danger hover:text-danger hover:bg-danger/10"
                            onClick={() => handleDeleteInvite(inv.id)}
                            title="Delete invitation permanently"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: GRANT SUPER ADMIN ACCESS (OWNER ONLY) */}
      {/* ========================================================================= */}
      <Modal
        open={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title="Grant Platform Super Admin Access"
        description="As the platform owner of ZenTry, create credentials and send an official activation link to the new administrator."
      >
        <form onSubmit={handleSendSuperAdminInvite} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">
              Administrator Full Name <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              required
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              placeholder="e.g. Sarah Jenkins"
              className="w-full h-9 px-3 rounded-md border border-line bg-surface text-xs text-ink focus:outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">
              Email Address <span className="text-danger">*</span>
            </label>
            <input
              type="email"
              required
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="admin@example.com"
              className="w-full h-9 px-3 rounded-md border border-line bg-surface text-xs text-ink focus:outline-none focus:border-accent"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-ink">
                Admin Password (Defined by Owner) <span className="text-danger">*</span>
              </label>
              <button
                type="button"
                onClick={generateStrongPassword}
                className="text-2xs text-accent hover:underline font-semibold flex items-center gap-1"
              >
                <Key className="w-3 h-3" />
                <span>Generate Strong Password</span>
              </button>
            </div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={invitePassword}
                onChange={(e) => setInvitePassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full h-9 pl-3 pr-20 rounded-md border border-line bg-surface text-xs font-mono text-ink focus:outline-none focus:border-accent"
              />

              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 text-ink-3 hover:text-ink transition-colors"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>

                <button
                  type="button"
                  onClick={handleCopyPassword}
                  className="p-1 text-ink-3 hover:text-ink transition-colors"
                  title="Copy password"
                >
                  {copiedPassword ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <p className="text-3xs text-ink-3 mt-1">
              You as the owner define this password. It will be emailed to the admin with their activation link.
            </p>
          </div>

          <div className="p-3 rounded-xl border border-line bg-surface-2 text-2xs text-ink-3 space-y-1">
            <strong className="text-ink font-semibold flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-accent" />
              Email Dispatch
            </strong>
            <p>
              An invitation email will be sent via ZenTry Platform SMTP containing this password and the activation URL.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setShowInviteModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={inviteLoading}
            >
              <UserPlus className="w-3.5 h-3.5 mr-1" />
              <span>Send Super Admin Invitation</span>
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2: DELETE / REVOKE SUPER ADMIN ACCESS */}
      {/* ========================================================================= */}
      <Modal
        open={showRevokeAdminModal}
        onClose={() => {
          if (!revokeLoading && !deleteAccountLoading) {
            setShowRevokeAdminModal(false);
            setTargetAdminToRevoke(null);
          }
        }}
        title="Delete Super Admin Access"
        description="Choose whether to revoke privileges or permanently delete this admin account."
      >
        <div className="p-5 space-y-4">
          <div className="p-4 rounded-xl border border-danger/20 bg-danger/5 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-danger shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <strong className="text-danger font-semibold">Administrator Access Control</strong>
              <p className="text-ink-3">
                Target User: <span className="font-semibold text-ink">{targetAdminToRevoke?.name}</span> ({targetAdminToRevoke?.email})
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            <div className="p-3.5 rounded-xl border border-line bg-surface-2/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold text-ink">Revoke Access Only</div>
                <p className="text-2xs text-ink-3 mt-0.5">
                  Immediately removes Super Admin privileges and restricts platform administration.
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                loading={revokeLoading}
                disabled={deleteAccountLoading}
                onClick={handleConfirmRevokeAccess}
                className="shrink-0"
              >
                Revoke Privileges
              </Button>
            </div>

            <div className="p-3.5 rounded-xl border border-danger/30 bg-danger/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold text-danger">Permanently Delete Account</div>
                <p className="text-2xs text-ink-3 mt-0.5">
                  Completely erases this account, Supabase authentication login, and invitations.
                </p>
              </div>
              <Button
                variant="danger"
                size="sm"
                loading={deleteAccountLoading}
                disabled={revokeLoading}
                onClick={handleConfirmDeleteUserCompletely}
                className="shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                Delete Completely
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-end pt-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={revokeLoading || deleteAccountLoading}
              onClick={() => {
                setShowRevokeAdminModal(false);
                setTargetAdminToRevoke(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Deactivate Tenant User */}
      <Modal
        open={showDeactivateModal}
        onClose={() => setShowDeactivateModal(false)}
        title="Deactivate User Account"
        description="Deactivating will prevent this user from signing in across all workspaces."
      >
        <div className="p-5 space-y-4">
          <p className="text-xs text-ink-3">
            User <strong className="text-ink">{targetUser?.name}</strong> ({targetUser?.email}) will be deactivated immediately.
          </p>
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setShowDeactivateModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" loading={actionLoading} onClick={handleConfirmDeactivate}>
              Deactivate
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Reactivate Tenant User */}
      <Modal
        open={showReactivateModal}
        onClose={() => setShowReactivateModal(false)}
        title="Reactivate User Account"
        description="Reactivating will restore login access for this account."
      >
        <div className="p-5 space-y-4">
          <p className="text-xs text-ink-3">
            User <strong className="text-ink">{targetUser?.name}</strong> ({targetUser?.email}) will be reactivated immediately.
          </p>
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setShowReactivateModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" loading={actionLoading} onClick={handleConfirmReactivate}>
              Reactivate
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
