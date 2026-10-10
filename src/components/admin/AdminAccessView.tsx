'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  ShieldCheck,
  UserPlus,
  Trash2,
  KeyRound,
  Lock,
  Search,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Clock,
  Mail,
  User,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import {
  getPlatformAccessListAction,
  grantAdminAccessAction,
  revokeAdminAccessAction,
} from '@/app/actions/platform';
import { PlatformAccessMember } from '@/types/database';
import { cn } from '@/lib/utils';

export function AdminAccessView() {
  const toast = useToast();

  const [members, setMembers] = useState<PlatformAccessMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search filter
  const [search, setSearch] = useState('');

  // Give access modal state
  const [giveModalOpen, setGiveModalOpen] = useState(false);
  const [grantEmail, setGrantEmail] = useState('');
  const [grantLoading, setGrantLoading] = useState(false);
  const [grantError, setGrantError] = useState<string | null>(null);

  // Remove access modal state
  const [removeTarget, setRemoveTarget] = useState<PlatformAccessMember | null>(null);
  const [removeLoading, setRemoveLoading] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getPlatformAccessListAction();
      if (!res.success) {
        setError(res.error || 'Failed to load access list.');
      } else {
        setMembers(res.members || []);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load platform access members.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Handle Grant Access
  const handleGrantAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = grantEmail.trim().toLowerCase();
    if (!cleanEmail) {
      setGrantError('Please enter an email address.');
      return;
    }

    setGrantLoading(true);
    setGrantError(null);

    try {
      const res = await grantAdminAccessAction(cleanEmail);
      if (!res.success) {
        setGrantError(res.error || 'Failed to grant admin access.');
      } else {
        toast.success(`Successfully granted admin access to ${cleanEmail}.`);
        setGiveModalOpen(false);
        setGrantEmail('');
        await fetchMembers();
      }
    } catch (err: any) {
      setGrantError(err?.message || 'An unexpected error occurred.');
    } finally {
      setGrantLoading(false);
    }
  };

  // Handle Revoke Access
  const handleRevokeAccess = async () => {
    if (!removeTarget) return;

    setRemoveLoading(true);
    setRemoveError(null);

    try {
      const res = await revokeAdminAccessAction(removeTarget.user_id);
      if (!res.success) {
        setRemoveError(res.error || 'Failed to revoke admin access.');
      } else {
        toast.success(`Revoked admin privileges for ${removeTarget.email}.`);
        setRemoveTarget(null);
        await fetchMembers();
      }
    } catch (err: any) {
      setRemoveError(err?.message || 'Failed to revoke access.');
    } finally {
      setRemoveLoading(false);
    }
  };

  const filteredMembers = members.filter((m) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    return (
      m.email.toLowerCase().includes(q) ||
      m.name.toLowerCase().includes(q) ||
      m.role.toLowerCase().includes(q)
    );
  });

  const ownerMember = members.find((m) => m.role === 'owner');
  const adminCount = members.filter((m) => m.role === 'admin').length;

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-surface border border-line rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-ink tracking-tight flex items-center gap-2">
                <span>Admin Access Control</span>
                <Badge tone="accent" className="text-2xs uppercase">
                  Owner Only
                </Badge>
              </h2>
              <p className="text-xs text-ink-3">
                Manage who has access to the ZenTry platform administration panel. Only the platform owner can grant or revoke access.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchMembers}
            disabled={loading}
            title="Refresh access list"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setGrantError(null);
              setGrantEmail('');
              setGiveModalOpen(true);
            }}
          >
            <UserPlus className="w-4 h-4 mr-1.5" />
            <span>Give Access</span>
          </Button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-line bg-surface space-y-1">
          <div className="text-2xs font-semibold uppercase tracking-wider text-ink-3 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-accent" />
            <span>Platform Owner</span>
          </div>
          <div className="text-sm font-bold text-ink truncate">
            {ownerMember?.email || 'zentry385@gmail.com'}
          </div>
          <div className="text-2xs text-ink-3 flex items-center gap-1">
            <Lock className="w-3 h-3 text-warn" />
            <span>Permanent Root • Non-removable</span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-line bg-surface space-y-1">
          <div className="text-2xs font-semibold uppercase tracking-wider text-ink-3 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-accent" />
            <span>Active Administrators</span>
          </div>
          <div className="text-xl font-bold text-ink">
            {adminCount}
          </div>
          <div className="text-2xs text-ink-3">
            Operational super admins with platform panel access
          </div>
        </div>

        <div className="p-4 rounded-xl border border-line bg-surface space-y-1">
          <div className="text-2xs font-semibold uppercase tracking-wider text-ink-3 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-accent" />
            <span>Security Rule</span>
          </div>
          <div className="text-xs font-semibold text-ink">
            Strict Single Source of Truth
          </div>
          <div className="text-2xs text-ink-3">
            Enforced by database table & RLS policies
          </div>
        </div>
      </div>

      {/* Main Members Table Area */}
      <div className="bg-surface border border-line rounded-2xl overflow-hidden shadow-xs space-y-4 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-ink-3 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by name, email, or role..."
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-line bg-canvas text-xs text-ink placeholder:text-ink-3 focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          <div className="text-2xs text-ink-3">
            Showing <strong className="text-ink">{filteredMembers.length}</strong> of{' '}
            <strong className="text-ink">{members.length}</strong> accounts
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl border border-danger/30 bg-danger/5 text-xs text-danger flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{error}</div>
            <button
              onClick={fetchMembers}
              className="underline text-xs hover:text-danger/80"
            >
              Retry
            </button>
          </div>
        )}

        {/* Table Content */}
        <div className="border border-line rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-2/60 border-b border-line text-ink-3 uppercase text-2xs font-semibold tracking-wider select-none">
                <tr>
                  <th className="py-3 px-4">Account</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Granted By</th>
                  <th className="py-3 px-4">Granted At</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-ink-3">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="w-5 h-5 text-accent animate-spin" />
                        <span>Loading platform access members...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-ink-3">
                      No accounts found matching your filter.
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map((member) => {
                    const isOwner = member.role === 'owner';
                    return (
                      <tr
                        key={member.user_id}
                        className="hover:bg-surface-2/50 transition-colors"
                      >
                        {/* User identity */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <Avatar name={member.name || member.email} size="sm" />
                            <div className="min-w-0">
                              <div className="font-semibold text-ink truncate flex items-center gap-1.5">
                                <span>{member.name || 'Admin'}</span>
                                {isOwner && (
                                  <span title="Permanent Platform Owner" className="inline-flex items-center">
                                    <Lock className="w-3 h-3 text-warn inline shrink-0" />
                                  </span>
                                )}
                              </div>
                              <div className="text-2xs text-ink-3 font-mono truncate">
                                {member.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Role Badge */}
                        <td className="py-3.5 px-4">
                          {isOwner ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-semibold bg-warn/10 text-warn border border-warn/20">
                              <Shield className="w-3 h-3" />
                              <span>Owner</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-semibold bg-accent/10 text-accent border border-accent/20">
                              <ShieldCheck className="w-3 h-3" />
                              <span>Admin</span>
                            </span>
                          )}
                        </td>

                        {/* Granted By */}
                        <td className="py-3.5 px-4 text-ink-2">
                          {isOwner ? (
                            <span className="text-2xs text-ink-3 italic">
                              Root System Assignment
                            </span>
                          ) : (
                            <span className="text-2xs font-mono text-ink-2 truncate block max-w-xs">
                              {member.granted_by_email || 'Owner'}
                            </span>
                          )}
                        </td>

                        {/* Granted At */}
                        <td className="py-3.5 px-4 text-ink-3">
                          <span className="text-2xs">
                            {member.granted_at
                              ? new Date(member.granted_at).toLocaleDateString(undefined, {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })
                              : '—'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          {isOwner ? (
                            <span
                              className="text-2xs text-ink-3 bg-surface-2 px-2.5 py-1 rounded-md border border-line/60 inline-flex items-center gap-1 select-none"
                              title="The platform owner can never be removed or demoted."
                            >
                              <Lock className="w-3 h-3 text-ink-3" />
                              <span>Protected</span>
                            </span>
                          ) : (
                            <Button
                              variant="danger"
                              size="sm"
                              className="h-8 text-2xs px-2.5"
                              onClick={() => {
                                setRemoveError(null);
                                setRemoveTarget(member);
                              }}
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-1" />
                              <span>Remove</span>
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Give Access Modal */}
      <Modal
        open={giveModalOpen}
        onClose={() => {
          if (!grantLoading) setGiveModalOpen(false);
        }}
        title="Give Admin Access"
      >
        <form onSubmit={handleGrantAccess} className="space-y-4">
          <p className="text-xs text-ink-3">
            Enter the email address of an <strong>existing Zentry account</strong>. The user must already have registered. If no account exists for this email, access will not be granted and no account will be created.
          </p>

          {grantError && (
            <div className="p-3.5 rounded-xl border border-danger/30 bg-danger/5 text-xs text-danger flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{grantError}</div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-2xs font-semibold text-ink uppercase tracking-wider block">
              Zentry User Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-ink-3 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                required
                value={grantEmail}
                onChange={(e) => setGrantEmail(e.target.value)}
                placeholder="colleague@example.com"
                className="w-full h-10 pl-9 pr-3 rounded-lg border border-line bg-surface text-xs text-ink placeholder:text-ink-3 focus:outline-none focus:border-accent transition-colors"
                disabled={grantLoading}
                autoFocus
              />
            </div>
            <p className="text-2xs text-ink-3">
              Once granted, they can sign in with their normal Zentry login credentials and access the admin panel.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-line">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setGiveModalOpen(false)}
              disabled={grantLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={grantLoading}
            >
              <UserPlus className="w-3.5 h-3.5 mr-1" />
              <span>Grant Admin Access</span>
            </Button>
          </div>
        </form>
      </Modal>

      {/* Remove Access Confirmation Modal */}
      <Modal
        open={!!removeTarget}
        onClose={() => {
          if (!removeLoading) setRemoveTarget(null);
        }}
        title="Revoke Admin Access"
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl border border-warn/30 bg-warn/5 flex items-start gap-2.5 text-xs text-warn">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <strong>Confirm Access Revocation</strong>
              <p className="text-2xs text-warn/90 mt-0.5">
                Are you sure you want to revoke admin access for{' '}
                <strong className="font-mono text-ink">{removeTarget?.email}</strong>?
              </p>
            </div>
          </div>

          <p className="text-xs text-ink-3">
            This will immediately remove their privileges from the platform access table. They will no longer be able to open or view any page in the platform admin area.
          </p>

          {removeError && (
            <div className="p-3 rounded-xl border border-danger/30 bg-danger/5 text-xs text-danger">
              {removeError}
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-line">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setRemoveTarget(null)}
              disabled={removeLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              loading={removeLoading}
              onClick={handleRevokeAccess}
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              <span>Confirm Revocation</span>
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
