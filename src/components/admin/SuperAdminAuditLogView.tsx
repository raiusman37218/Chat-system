'use client';

import React, { useState, useEffect } from 'react';
import { ErrorState, LoadingState } from '@/components/ui/States';
import {
  ShieldAlert,
  Search,
  RefreshCw,
  Clock,
  ArrowRightLeft,
  Building2,
  Eye,
  PlusCircle,
  LogOut,
  ChevronDown,
  ChevronRight,
  Filter,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { SuperAdminAuditLog } from '@/types/database';
import { getSuperAdminAuditLogsAction } from '@/app/actions/platform';
import { cn } from '@/lib/utils';

export function SuperAdminAuditLogView() {
  const [logs, setLogs] = useState<SuperAdminAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchLogs = async (showSpin = false) => {
    try {
      if (showSpin) setRefreshing(true);
      else setLoading(true);
      const res = await getSuperAdminAuditLogsAction({
        actionFilter: actionFilter === 'all' ? undefined : actionFilter,
        limit: 100,
      });
      setLogs(res.logs);
      setTotalCount(res.totalCount);
      setLoadError(null);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
      setLoadError((err as Error).message || 'Audit records could not be loaded.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  const filteredLogs = logs.filter((log) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      log.admin_email.toLowerCase().includes(q) ||
      (log.admin_name && log.admin_name.toLowerCase().includes(q)) ||
      (log.workspace_name && log.workspace_name.toLowerCase().includes(q)) ||
      (log.workspace_id && log.workspace_id.toLowerCase().includes(q)) ||
      log.action.toLowerCase().includes(q)
    );
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'switch_workspace':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-2xs font-bold bg-warn/10 text-warn border border-warn/20">
            <ArrowRightLeft className="w-3 h-3" />
            Switch Workspace
          </span>
        );
      case 'create_company':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-2xs font-bold bg-success/10 text-success border border-success/20">
            <PlusCircle className="w-3 h-3" />
            Create Company
          </span>
        );
      case 'view_company_drilldown':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-2xs font-bold bg-accent/10 text-accent border border-accent/20">
            <Eye className="w-3 h-3" />
            View Drilldown
          </span>
        );
      case 'exit_switched_workspace':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-2xs font-bold bg-ink-3/10 text-ink-2 border border-line-3/20">
            <LogOut className="w-3 h-3" />
            Exit Switch
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-2xs font-bold bg-accent/10 text-accent border border-accent/20">
            <ShieldAlert className="w-3 h-3" />
            {action}
          </span>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-y-auto bg-canvas">
      {/* Top Header */}
      <header className="px-8 py-6 border-b border-line bg-surface sticky top-0 z-20 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-accent/10 text-accent flex items-center justify-center font-bold">
                <ShieldAlert className="w-4.5 h-4.5" />
              </div>
              <h1 className="text-xl font-bold text-ink tracking-tight">
                Super Admin Audit Logs
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-2xs font-bold bg-accent/10 text-accent uppercase tracking-wider">
                {totalCount} Actions Recorded
              </span>
            </div>
            <p className="text-xs text-ink-3 mt-1">
              Immutable audit trail recording all platform super admin operations, workspace switches, and tenant management.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => fetchLogs(true)}
              disabled={refreshing}
              className="h-9 px-3.5 rounded-xl border border-line bg-surface-2 hover:bg-surface text-ink text-xs font-medium flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <RefreshCw className={cn('w-3.5 h-3.5 text-ink-3', refreshing && 'animate-spin')} />
              <span>Refresh Log</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-8 space-y-6 max-w-7xl w-full mx-auto">
        {/* Filter & Search Bar */}
        <section className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {[
              ['all', 'All Actions'],
              ['switch_workspace', 'Workspace Switches 🔄'],
              ['create_company', 'Company Creations 🏢'],
              ['view_company_drilldown', 'Company Drilldowns 🔍'],
            ].map(([val, label]) => (
              <button
                key={val}
                onClick={() => setActionFilter(val)}
                className={cn(
                  'h-8 px-3 rounded-lg text-xs font-medium transition-all whitespace-nowrap',
                  actionFilter === val
                    ? 'bg-accent text-accent-ink shadow-xs'
                    : 'bg-surface-2 text-ink-2 hover:bg-surface-3 hover:text-ink'
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-ink-3 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search admin, company, or action..."
              className="w-full h-8.5 pl-8.5 pr-3 rounded-lg border border-line bg-surface text-xs text-ink placeholder:text-ink-3 focus:outline-none focus:border-accent"
            />
          </div>
        </section>

        {/* Audit Log Table */}
        <section className="border border-line rounded-2xl bg-surface overflow-hidden shadow-2xs">
          {loading ? (
            <LoadingState label="Loading audit records…" className="p-16" />
          ) : loadError ? (
            <ErrorState title="Couldn't load the audit log" message={loadError} onRetry={() => fetchLogs()} className="p-16" />
          ) : filteredLogs.length === 0 ? (
            <div className="p-16 text-center text-ink-3 space-y-3">
              <ShieldAlert className="w-10 h-10 mx-auto text-ink-3/50" />
              <p className="text-sm font-bold text-ink">No audit entries found</p>
              <p className="text-xs max-w-sm mx-auto">
                No super admin actions match your selected filter. All super admin activities like switching workspaces are automatically recorded here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-line">
              {/* Header row */}
              <div className="grid grid-cols-12 px-6 py-3 bg-surface-2/60 text-2xs font-bold uppercase tracking-wider text-ink-3">
                <div className="col-span-3">Timestamp</div>
                <div className="col-span-3">Super Admin</div>
                <div className="col-span-2">Action</div>
                <div className="col-span-3">Target Workspace</div>
                <div className="col-span-1 text-right">Details</div>
              </div>

              {/* Rows */}
              {filteredLogs.map((log) => {
                const isExpanded = expandedId === log.id;
                const date = new Date(log.created_at);

                return (
                  <div key={log.id} className="transition-colors hover:bg-surface-2/30">
                    <div
                      onClick={() => setExpandedId(isExpanded ? null : log.id)}
                      className="grid grid-cols-12 px-6 py-4 items-center cursor-pointer text-xs"
                    >
                      {/* Timestamp */}
                      <div className="col-span-3 flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-ink-3 shrink-0" />
                        <div>
                          <div className="font-semibold text-ink">
                            {date.toLocaleDateString()} {date.toLocaleTimeString()}
                          </div>
                          <div className="text-2xs text-ink-3">
                            {formatRelativeTime(date)}
                          </div>
                        </div>
                      </div>

                      {/* Super Admin */}
                      <div className="col-span-3 flex items-center gap-2.5 min-w-0 pr-2">
                        <div className="w-7 h-7 rounded-full bg-accent/10 text-accent font-bold text-2xs flex items-center justify-center shrink-0 border border-accent/20">
                          {(log.admin_name || log.admin_email).slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-ink truncate">
                            {log.admin_name || log.admin_email.split('@')[0]}
                          </div>
                          <div className="text-2xs text-ink-3 truncate">
                            {log.admin_email}
                          </div>
                        </div>
                      </div>

                      {/* Action Badge */}
                      <div className="col-span-2">
                        {getActionBadge(log.action)}
                      </div>

                      {/* Target Workspace */}
                      <div className="col-span-3 min-w-0 pr-2">
                        {log.workspace_name ? (
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Building2 className="w-3.5 h-3.5 text-ink-3 shrink-0" />
                            <span className="font-semibold text-ink truncate">
                              {log.workspace_name}
                            </span>
                          </div>
                        ) : log.workspace_id ? (
                          <span className="font-mono text-2xs text-ink-3 truncate">
                            {log.workspace_id}
                          </span>
                        ) : (
                          <span className="text-ink-3 italic text-xs">Global / None</span>
                        )}
                      </div>

                      {/* Expand Toggle */}
                      <div className="col-span-1 flex justify-end">
                        <button
                          type="button"
                          className="p-1 rounded-lg text-ink-3 hover:text-ink hover:bg-surface-3 transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-accent" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Details Accordion */}
                    {isExpanded && (
                      <div className="px-6 py-4 bg-surface-2/40 border-t border-line/60 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          <div className="space-y-1">
                            <span className="font-semibold text-ink-3 uppercase text-2xs">
                              Admin ID:
                            </span>
                            <div className="font-mono text-ink bg-surface px-2.5 py-1.5 rounded-lg border border-line">
                              {log.admin_id}
                            </div>
                          </div>
                          {log.workspace_id && (
                            <div className="space-y-1">
                              <span className="font-semibold text-ink-3 uppercase text-2xs">
                                Target Workspace ID:
                              </span>
                              <div className="font-mono text-ink bg-surface px-2.5 py-1.5 rounded-lg border border-line">
                                {log.workspace_id}
                              </div>
                            </div>
                          )}
                        </div>

                        {log.details && Object.keys(log.details).length > 0 && (
                          <div className="space-y-1">
                            <span className="font-semibold text-ink-3 uppercase text-2xs">
                              Metadata &amp; Context:
                            </span>
                            <pre className="font-mono text-2xs bg-surface p-3 rounded-xl border border-line overflow-x-auto text-ink">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}
