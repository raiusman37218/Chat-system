'use client';

import React, { useState, useEffect, useTransition } from 'react';
import {
  Sliders,
  Bell,
  Settings,
  Mail,
  Bot,
  ShieldAlert,
  Users,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  AlertTriangle,
  Send,
  Eye,
  RefreshCw,
  Power,
  Lock,
  Search,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import {
  PlatformFeatureFlag,
  PlatformAnnouncement,
  PlatformSettings,
  PlatformEmailTemplate,
  EmailTemplateKey,
  WorkspaceAiUsageDaily,
  PlatformBlockedDomain,
  PlatformStaffMember,
  PlatformStaffRole,
} from '@/types/platform-management';
import {
  getPlatformFeatureFlagsAction,
  savePlatformFeatureFlagAction,
  deletePlatformFeatureFlagAction,
  getPlatformAnnouncementsAction,
  savePlatformAnnouncementAction,
  deletePlatformAnnouncementAction,
  getPlatformSettingsAction,
  savePlatformSettingsAction,
  getPlatformEmailTemplatesAction,
  savePlatformEmailTemplateAction,
  sendTestSystemEmailAction,
  getWorkspaceAiUsageMetricsAction,
  updateWorkspaceAiTokenCapAction,
  getAbuseFlaggedWorkspacesAction,
  toggleWorkspaceOutboundBlockedAction,
  getBlockedDomainsAction,
  addBlockedDomainAction,
  removeBlockedDomainAction,
  getPlatformStaffListAction,
  updatePlatformStaffRoleAction,
  revokePlatformStaffAccessAction,
} from '@/app/actions/platform-management';
import { getPlatformPlansAction } from '@/app/actions/plans';
import { PlatformPlan } from '@/types/plans';

type OpsTab = 'flags' | 'announcements' | 'settings' | 'emails' | 'ai' | 'safety' | 'staff';

export function PlatformOpsView() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<OpsTab>('flags');
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Data states
  const [flags, setFlags] = useState<PlatformFeatureFlag[]>([]);
  const [announcements, setAnnouncements] = useState<PlatformAnnouncement[]>([]);
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [templates, setTemplates] = useState<PlatformEmailTemplate[]>([]);
  const [aiUsage, setAiUsage] = useState<{
    daily: WorkspaceAiUsageDaily[];
    totalTokens: number;
    totalCostUsd: number;
    totalRequests: number;
  }>({ daily: [], totalTokens: 0, totalCostUsd: 0, totalRequests: 0 });
  const [flaggedWorkspaces, setFlaggedWorkspaces] = useState<any[]>([]);
  const [blockedDomains, setBlockedDomains] = useState<PlatformBlockedDomain[]>([]);
  const [staff, setStaff] = useState<PlatformStaffMember[]>([]);
  const [plans, setPlans] = useState<PlatformPlan[]>([]);

  // Modals & form state
  const [flagModalOpen, setFlagModalOpen] = useState(false);
  const [editingFlag, setEditingFlag] = useState<Partial<PlatformFeatureFlag> | null>(null);

  const [announcementModalOpen, setAnnouncementModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Partial<PlatformAnnouncement> | null>(null);

  const [previewTemplate, setPreviewTemplate] = useState<PlatformEmailTemplate | null>(null);
  const [testEmailRecipient, setTestEmailRecipient] = useState('');

  const [newBlockedDomain, setNewBlockedDomain] = useState('');
  const [newBlockedReason, setNewBlockedReason] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [f, a, s, t, ai, abuse, domains, st, pRes] = await Promise.all([
        getPlatformFeatureFlagsAction(),
        getPlatformAnnouncementsAction(),
        getPlatformSettingsAction(),
        getPlatformEmailTemplatesAction(),
        getWorkspaceAiUsageMetricsAction(),
        getAbuseFlaggedWorkspacesAction(),
        getBlockedDomainsAction(),
        getPlatformStaffListAction(),
        getPlatformPlansAction(),
      ]);

      setFlags(f);
      setAnnouncements(a);
      setSettings(s);
      setTemplates(t);
      setAiUsage(ai);
      setFlaggedWorkspaces(abuse);
      setBlockedDomains(domains);
      setStaff(st);
      setPlans(pRes.plans);
    } catch (e: any) {
      toast.error(e.message || 'Failed to load platform operations data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // --------------------------------------------------------------------------
  // Tab 1: Feature Flags Handlers
  // --------------------------------------------------------------------------
  const handleSaveFlag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFlag?.key || !editingFlag?.name) return;

    startTransition(async () => {
      const res = await savePlatformFeatureFlagAction(editingFlag);
      if (res.success) {
        toast.success('Feature flag saved.');
        setFlagModalOpen(false);
        setEditingFlag(null);
        loadData();
      } else {
        toast.error(res.error || 'Failed to save feature flag');
      }
    });
  };

  const handleDeleteFlag = async (id: string) => {
    if (!confirm('Are you sure you want to delete this feature flag?')) return;
    const res = await deletePlatformFeatureFlagAction(id);
    if (res.success) {
      toast.success('Feature flag deleted.');
      loadData();
    }
  };

  // --------------------------------------------------------------------------
  // Tab 2: Announcements Handlers
  // --------------------------------------------------------------------------
  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAnnouncement?.title || !editingAnnouncement?.message) return;

    startTransition(async () => {
      const res = await savePlatformAnnouncementAction(editingAnnouncement);
      if (res.success) {
        toast.success('Announcement saved.');
        setAnnouncementModalOpen(false);
        setEditingAnnouncement(null);
        loadData();
      } else {
        toast.error(res.error || 'Failed to save announcement');
      }
    });
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm('Delete this announcement?')) return;
    const res = await deletePlatformAnnouncementAction(id);
    if (res.success) {
      toast.success('Announcement deleted.');
      loadData();
    }
  };

  // --------------------------------------------------------------------------
  // Tab 3: Settings Save Handler
  // --------------------------------------------------------------------------
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    startTransition(async () => {
      const res = await savePlatformSettingsAction(settings);
      if (res.success) {
        toast.success('Platform settings updated.');
        loadData();
      } else {
        toast.error(res.error || 'Failed to save settings');
      }
    });
  };

  // --------------------------------------------------------------------------
  // Tab 4: Email Template Handlers
  // --------------------------------------------------------------------------
  const handleSaveTemplate = async (tpl: PlatformEmailTemplate) => {
    startTransition(async () => {
      const res = await savePlatformEmailTemplateAction({
        template_key: tpl.template_key,
        subject: tpl.subject,
        body_text: tpl.body_text,
        body_html: tpl.body_html,
      });
      if (res.success) {
        toast.success('Email template updated.');
        loadData();
      } else {
        toast.error(res.error || 'Failed to save template');
      }
    });
  };

  const handleSendTestEmail = async (template_key: EmailTemplateKey) => {
    if (!testEmailRecipient.trim()) {
      toast.error('Enter recipient email address.');
      return;
    }

    startTransition(async () => {
      const res = await sendTestSystemEmailAction({
        template_key,
        recipientEmail: testEmailRecipient.trim(),
      });
      if (res.success) {
        toast.success(res.message || 'Test email sent.');
      } else {
        toast.error(res.error || 'Failed to send test email');
      }
    });
  };

  // --------------------------------------------------------------------------
  // Tab 6: Abuse & Domain Handlers
  // --------------------------------------------------------------------------
  const handleAddBlockedDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlockedDomain.trim()) return;

    startTransition(async () => {
      const res = await addBlockedDomainAction(newBlockedDomain.trim(), newBlockedReason.trim());
      if (res.success) {
        toast.success(`Domain ${newBlockedDomain} blocked.`);
        setNewBlockedDomain('');
        setNewBlockedReason('');
        loadData();
      } else {
        toast.error(res.error || 'Failed to block domain');
      }
    });
  };

  const handleRemoveBlockedDomain = async (id: string) => {
    await removeBlockedDomainAction(id);
    toast.success('Domain unblocked.');
    loadData();
  };

  const handleToggleOutbound = async (wsId: string, currentBlocked: boolean) => {
    const res = await toggleWorkspaceOutboundBlockedAction(wsId, !currentBlocked, 'Admin toggled outbound blocking');
    if (res.success) {
      toast.success(currentBlocked ? 'Outbound messaging unblocked.' : 'Outbound messaging blocked.');
      loadData();
    }
  };

  // --------------------------------------------------------------------------
  // Tab 7: Staff Role Handlers
  // --------------------------------------------------------------------------
  const handleUpdateStaffRole = async (agentId: string, role: PlatformStaffRole) => {
    startTransition(async () => {
      const res = await updatePlatformStaffRoleAction(agentId, role);
      if (res.success) {
        toast.success('Staff role updated.');
        loadData();
      } else {
        toast.error(res.error || 'Failed to update role');
      }
    });
  };

  const handleRevokeStaff = async (agentId: string) => {
    if (!confirm('Revoke platform staff access for this user?')) return;
    startTransition(async () => {
      const res = await revokePlatformStaffAccessAction(agentId);
      if (res.success) {
        toast.success('Staff access revoked.');
        loadData();
      } else {
        toast.error(res.error || 'Failed to revoke access');
      }
    });
  };

  if (loading) {
    return (
      <div className="p-12 text-center">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-ink-3" />
        <p className="mt-3 text-xs text-ink-3">Loading platform operations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line">
        <div>
          <h2 className="text-xl font-bold text-ink">Platform Operations & Control</h2>
          <p className="text-xs text-ink-3 mt-1">
            Global feature flags, platform announcements, system settings, email templates, AI cost analytics, and staff RBAC.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          className="btn btn-sm btn-outline text-xs flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-1 border-b border-line overflow-x-auto pb-px">
        {[
          { id: 'flags', label: 'Feature Flags', icon: Sliders },
          { id: 'announcements', label: 'Announcements', icon: Bell },
          { id: 'settings', label: 'Platform Settings', icon: Settings },
          { id: 'emails', label: 'System Emails', icon: Mail },
          { id: 'ai', label: 'AI Usage & Cost', icon: Bot },
          { id: 'safety', label: 'Abuse & Safety', icon: ShieldAlert },
          { id: 'staff', label: 'Platform Staff', icon: Users },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as OpsTab)}
              className={`px-3.5 py-2 rounded-t-lg text-xs font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                isActive
                  ? 'border-accent text-ink bg-surface'
                  : 'border-transparent text-ink-3 hover:text-ink hover:bg-surface-2'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 1: Feature Flags                                          */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'flags' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-ink-3">
              Enable or disable capabilities globally, restrict to specific plans, or target test workspaces.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setEditingFlag({
                  is_enabled_globally: false,
                  enabled_plan_ids: [],
                  enabled_workspace_ids: [],
                  disabled_workspace_ids: [],
                });
                setFlagModalOpen(true);
              }}
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              New Feature Flag
            </Button>
          </div>

          <div className="rounded-xl border border-line bg-surface overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-line bg-surface-2 text-ink-3 font-semibold">
                  <th className="p-3">Flag Key & Name</th>
                  <th className="p-3">Global Status</th>
                  <th className="p-3">Plan Restrictions</th>
                  <th className="p-3">Workspace Overrides</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {flags.map((f) => (
                  <tr key={f.id} className="hover:bg-surface-2/40 transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-ink">{f.name}</div>
                      <div className="font-mono text-2xs text-ink-3">{f.key}</div>
                      {f.description && <div className="text-3xs text-ink-2 mt-0.5">{f.description}</div>}
                    </td>
                    <td className="p-3">
                      {f.is_enabled_globally ? (
                        <Badge tone="success">Enabled Globally</Badge>
                      ) : (
                        <Badge tone="neutral">Disabled Globally</Badge>
                      )}
                    </td>
                    <td className="p-3">
                      {f.enabled_plan_ids && f.enabled_plan_ids.length > 0 ? (
                        <span className="text-2xs text-ink-2">
                          {f.enabled_plan_ids.length} plans enabled
                        </span>
                      ) : (
                        <span className="text-2xs text-ink-3">All plans inherit global</span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="text-2xs space-y-0.5">
                        {f.enabled_workspace_ids?.length ? (
                          <div className="text-success font-medium">+{f.enabled_workspace_ids.length} workspaces allowed</div>
                        ) : null}
                        {f.disabled_workspace_ids?.length ? (
                          <div className="text-danger font-medium">-{f.disabled_workspace_ids.length} workspaces blocked</div>
                        ) : null}
                        {!f.enabled_workspace_ids?.length && !f.disabled_workspace_ids?.length ? (
                          <span className="text-ink-3">None</span>
                        ) : null}
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => {
                            setEditingFlag(f);
                            setFlagModalOpen(true);
                          }}
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => handleDeleteFlag(f.id)}
                        >
                          <Trash2 className="w-3 h-3 text-danger" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 2: Announcements                                          */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'announcements' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-ink-3">
              Broadcast critical advisories, scheduled maintenance notices, or product release highlights.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setEditingAnnouncement({
                  display_type: 'banner',
                  tone: 'info',
                  target_audience: 'all',
                  is_dismissible: true,
                  is_active: true,
                });
                setAnnouncementModalOpen(true);
              }}
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              New Announcement
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {announcements.map((a) => (
              <div
                key={a.id}
                className={`p-4 rounded-xl border flex flex-col justify-between gap-3 ${
                  a.is_active ? 'border-line bg-surface shadow-xs' : 'border-line/50 bg-surface-2/40 opacity-70'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-2xs uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-accent-soft text-accent">
                      {a.tone} • {a.display_type}
                    </span>
                    <span className="text-3xs text-ink-3">
                      {a.is_active ? 'Active' : 'Archived'}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-ink mt-2">{a.title}</h4>
                  <p className="text-xs text-ink-2 mt-1 leading-relaxed">{a.message}</p>
                </div>

                <div className="pt-3 border-t border-line flex items-center justify-between text-2xs text-ink-3">
                  <span>Audience: {a.target_audience}</span>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => {
                        setEditingAnnouncement(a);
                        setAnnouncementModalOpen(true);
                      }}
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => handleDeleteAnnouncement(a.id)}
                    >
                      <Trash2 className="w-3 h-3 text-danger" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 3: Platform Settings                                      */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'settings' && settings && (
        <form onSubmit={handleSaveSettings} className="space-y-6 max-w-3xl">
          <div className="p-6 rounded-xl border border-line bg-surface space-y-4">
            <h3 className="text-sm font-bold text-ink">Signup & Default Workspace Tier</h3>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-2xs font-bold uppercase tracking-wider text-ink-3">
                  Default Plan for New Signups
                </label>
                <select
                  value={settings.default_plan_slug}
                  onChange={(e) => setSettings({ ...settings, default_plan_slug: e.target.value })}
                  className="select w-full mt-1.5 text-xs"
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.slug}>
                      {p.name} ({p.slug})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-2xs font-bold uppercase tracking-wider text-ink-3">
                  Free Trial Duration (Days)
                </label>
                <input
                  type="number"
                  min="0"
                  max="90"
                  value={settings.default_trial_days}
                  onChange={(e) => setSettings({ ...settings, default_trial_days: Number(e.target.value) })}
                  className="input w-full mt-1.5 text-xs"
                />
              </div>

              <div>
                <label className="text-2xs font-bold uppercase tracking-wider text-ink-3">
                  Signup Access Policy
                </label>
                <select
                  value={settings.signup_mode}
                  onChange={(e) => setSettings({ ...settings, signup_mode: e.target.value as any })}
                  className="select w-full mt-1.5 text-xs"
                >
                  <option value="open">Open Registration (Anyone can create workspace)</option>
                  <option value="invite_only">Invite Only (Requires platform owner invitation)</option>
                </select>
              </div>

              <div>
                <label className="text-2xs font-bold uppercase tracking-wider text-ink-3">
                  Default AI Model
                </label>
                <input
                  type="text"
                  value={settings.default_ai_model}
                  onChange={(e) => setSettings({ ...settings, default_ai_model: e.target.value })}
                  className="input w-full mt-1.5 text-xs font-mono"
                />
              </div>
            </div>
          </div>

          <div className="p-6 rounded-xl border border-line bg-surface space-y-4">
            <h3 className="text-sm font-bold text-ink">Platform Maintenance Mode</h3>
            <div className="flex items-center justify-between p-3 rounded-lg bg-surface-2 border border-line">
              <div>
                <h4 className="text-xs font-semibold text-ink">Enable Maintenance Mode</h4>
                <p className="text-3xs text-ink-3 mt-0.5">
                  Restricts client dashboard access and shows a maintenance overlay.
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.is_maintenance_mode}
                onChange={(e) => setSettings({ ...settings, is_maintenance_mode: e.target.checked })}
                className="toggle"
              />
            </div>

            <div>
              <label className="text-2xs font-bold uppercase tracking-wider text-ink-3">
                Custom Maintenance Notice Message
              </label>
              <textarea
                rows={2}
                value={settings.maintenance_message}
                onChange={(e) => setSettings({ ...settings, maintenance_message: e.target.value })}
                className="input w-full mt-1.5 text-xs"
              />
            </div>
          </div>

          <div className="p-6 rounded-xl border border-line bg-surface space-y-4">
            <h3 className="text-sm font-bold text-ink">System Email Branding</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-2xs font-bold uppercase tracking-wider text-ink-3">
                  Sender Display Name
                </label>
                <input
                  type="text"
                  value={settings.email_sender_name}
                  onChange={(e) => setSettings({ ...settings, email_sender_name: e.target.value })}
                  className="input w-full mt-1.5 text-xs"
                />
              </div>

              <div>
                <label className="text-2xs font-bold uppercase tracking-wider text-ink-3">
                  Sender Email Address
                </label>
                <input
                  type="email"
                  value={settings.email_sender_address}
                  onChange={(e) => setSettings({ ...settings, email_sender_address: e.target.value })}
                  className="input w-full mt-1.5 text-xs"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button variant="primary" size="md" type="submit" disabled={isPending}>
              {isPending ? 'Saving Settings...' : 'Save Platform Settings'}
            </Button>
          </div>
        </form>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 4: System Email Templates                                 */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'emails' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-xs text-ink-3">
              Customize automated lifecycle notifications with dynamic merge variables.
            </p>
            <div className="flex items-center gap-2">
              <input
                type="email"
                placeholder="test-recipient@example.com"
                value={testEmailRecipient}
                onChange={(e) => setTestEmailRecipient(e.target.value)}
                className="input input-sm text-xs w-56"
              />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {templates.map((tpl) => (
              <div key={tpl.id} className="p-5 rounded-xl border border-line bg-surface space-y-3">
                <div className="flex items-center justify-between">
                  <Badge tone="accent">{tpl.name}</Badge>
                  <span className="font-mono text-3xs text-ink-3">{tpl.template_key}</span>
                </div>

                <div>
                  <label className="text-3xs uppercase font-bold text-ink-3">Subject Line</label>
                  <input
                    type="text"
                    value={tpl.subject}
                    onChange={(e) => {
                      const updated = templates.map((t) =>
                        t.id === tpl.id ? { ...t, subject: e.target.value } : t
                      );
                      setTemplates(updated);
                    }}
                    className="input input-sm w-full mt-1 text-xs"
                  />
                </div>

                <div>
                  <label className="text-3xs uppercase font-bold text-ink-3">Plain Text Content</label>
                  <textarea
                    rows={4}
                    value={tpl.body_text}
                    onChange={(e) => {
                      const updated = templates.map((t) =>
                        t.id === tpl.id ? { ...t, body_text: e.target.value } : t
                      );
                      setTemplates(updated);
                    }}
                    className="input w-full mt-1 text-xs font-mono"
                  />
                </div>

                {/* Available Variables */}
                <div className="flex flex-wrap gap-1 items-center pt-2">
                  <span className="text-3xs text-ink-3 mr-1">Variables:</span>
                  {(tpl.available_variables || []).map((v) => (
                    <span
                      key={v}
                      className="px-1.5 py-0.5 rounded text-3xs font-mono bg-surface-2 text-ink-2 border border-line"
                    >
                      {`{{${v}}}`}
                    </span>
                  ))}
                </div>

                <div className="pt-3 border-t border-line flex items-center justify-between">
                  <Button
                    variant="secondary"
                    size="xs"
                    onClick={() => handleSendTestEmail(tpl.template_key)}
                    disabled={isPending || !testEmailRecipient}
                  >
                    <Send className="w-3 h-3 mr-1" />
                    Send Test
                  </Button>

                  <Button
                    variant="primary"
                    size="xs"
                    onClick={() => handleSaveTemplate(tpl)}
                    disabled={isPending}
                  >
                    Save Template
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 5: AI Daily Usage & Costs                                 */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'ai' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="card p-4">
              <div className="text-2xs font-bold uppercase tracking-wider text-ink-3">
                Total Tokens (30 Days)
              </div>
              <div className="text-2xl font-bold text-ink mt-1 tabular-nums">
                {aiUsage.totalTokens.toLocaleString()}
              </div>
            </div>

            <div className="card p-4">
              <div className="text-2xs font-bold uppercase tracking-wider text-ink-3">
                Estimated Cost (USD)
              </div>
              <div className="text-2xl font-bold text-ink mt-1 tabular-nums">
                ${aiUsage.totalCostUsd.toFixed(2)}
              </div>
            </div>

            <div className="card p-4">
              <div className="text-2xs font-bold uppercase tracking-wider text-ink-3">
                AI Invocations
              </div>
              <div className="text-2xl font-bold text-ink mt-1 tabular-nums">
                {aiUsage.totalRequests.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Daily Table */}
          <div className="rounded-xl border border-line bg-surface overflow-hidden shadow-xs">
            <div className="p-4 border-b border-line">
              <h3 className="text-sm font-bold text-ink">Daily Token Breakdown</h3>
            </div>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-line bg-surface-2 text-ink-3 font-semibold">
                  <th className="p-3">Date</th>
                  <th className="p-3">Requests</th>
                  <th className="p-3">Prompt Tokens</th>
                  <th className="p-3">Completion Tokens</th>
                  <th className="p-3">Total Tokens</th>
                  <th className="p-3 text-right">Estimated Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {aiUsage.daily.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-ink-3">
                      No AI usage logs recorded in the last 30 days.
                    </td>
                  </tr>
                ) : (
                  aiUsage.daily.map((d) => (
                    <tr key={d.id} className="hover:bg-surface-2/40 transition-colors">
                      <td className="p-3 font-mono">{d.usage_date}</td>
                      <td className="p-3 tabular-nums">{d.requests_count}</td>
                      <td className="p-3 tabular-nums">{d.prompt_tokens.toLocaleString()}</td>
                      <td className="p-3 tabular-nums">{d.completion_tokens.toLocaleString()}</td>
                      <td className="p-3 tabular-nums font-semibold text-ink">
                        {d.total_tokens.toLocaleString()}
                      </td>
                      <td className="p-3 text-right tabular-nums font-bold text-ink">
                        ${Number(d.estimated_cost_usd || 0).toFixed(4)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 6: Abuse & Safety                                         */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'safety' && (
        <div className="space-y-6">
          {/* Blocked Domains Manager */}
          <div className="p-6 rounded-xl border border-line bg-surface space-y-4">
            <h3 className="text-sm font-bold text-ink">Blocked Email Domains (Blacklist)</h3>
            <p className="text-2xs text-ink-3">
              Domains blacklisted here are prevented from signing up or receiving outbound channel messages.
            </p>

            <form onSubmit={handleAddBlockedDomain} className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="spamdomain.com"
                value={newBlockedDomain}
                onChange={(e) => setNewBlockedDomain(e.target.value)}
                className="input input-sm text-xs flex-1 font-mono"
              />
              <input
                type="text"
                placeholder="Reason (e.g. Disposable spam)"
                value={newBlockedReason}
                onChange={(e) => setNewBlockedReason(e.target.value)}
                className="input input-sm text-xs flex-1"
              />
              <Button variant="primary" size="sm" type="submit">
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Domain
              </Button>
            </form>

            <div className="flex flex-wrap gap-2 pt-2">
              {blockedDomains.map((bd) => (
                <div
                  key={bd.id}
                  className="px-2.5 py-1 rounded-lg border border-line bg-surface-2 flex items-center gap-2 text-xs"
                >
                  <span className="font-mono text-ink">{bd.domain}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveBlockedDomain(bd.id)}
                    className="text-ink-3 hover:text-danger"
                    title="Remove domain"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Flagged / Blocked Workspaces */}
          <div className="rounded-xl border border-line bg-surface overflow-hidden shadow-xs">
            <div className="p-4 border-b border-line">
              <h3 className="text-sm font-bold text-ink">Flagged & Blocked Workspaces</h3>
            </div>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-line bg-surface-2 text-ink-3 font-semibold">
                  <th className="p-3">Workspace</th>
                  <th className="p-3">Outbound Messaging</th>
                  <th className="p-3">Deletion Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {flaggedWorkspaces.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-ink-3">
                      No workspaces are currently flagged for abuse or scheduled for deletion.
                    </td>
                  </tr>
                ) : (
                  flaggedWorkspaces.map((fw) => (
                    <tr key={fw.id} className="hover:bg-surface-2/40 transition-colors">
                      <td className="p-3 font-semibold text-ink">{fw.name}</td>
                      <td className="p-3">
                        {fw.is_outbound_blocked ? (
                          <Badge tone="danger">Outbound Blocked</Badge>
                        ) : (
                          <Badge tone="success">Allowed</Badge>
                        )}
                      </td>
                      <td className="p-3">
                        {fw.scheduled_deletion_at ? (
                          <span className="text-2xs text-danger font-medium">
                            Deletion scheduled on {new Date(fw.scheduled_deletion_at).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-2xs text-ink-3">Normal</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <Button
                          variant={fw.is_outbound_blocked ? 'secondary' : 'danger'}
                          size="xs"
                          onClick={() => handleToggleOutbound(fw.id, fw.is_outbound_blocked)}
                        >
                          {fw.is_outbound_blocked ? 'Unblock Outbound' : 'Block Outbound'}
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 7: Platform Staff Team RBAC                               */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'staff' && (
        <div className="space-y-4">
          <p className="text-xs text-ink-3">
            Manage platform super administrator staff and grant scoped access (Owner, Support, Finance).
          </p>

          <div className="rounded-xl border border-line bg-surface overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-line bg-surface-2 text-ink-3 font-semibold">
                  <th className="p-3">Staff Member</th>
                  <th className="p-3">Role Level</th>
                  <th className="p-3">Permissions Scope</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {staff.map((st) => (
                  <tr key={st.id} className="hover:bg-surface-2/40 transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-ink">{st.name}</div>
                      <div className="text-2xs text-ink-3">{st.email}</div>
                    </td>
                    <td className="p-3">
                      {st.is_platform_owner ? (
                        <Badge tone="accent">Platform Owner</Badge>
                      ) : (
                        <select
                          value={st.role}
                          onChange={(e) => handleUpdateStaffRole(st.id, e.target.value as PlatformStaffRole)}
                          className="select select-sm text-2xs"
                        >
                          <option value="owner">Owner (Full access)</option>
                          <option value="support">Support (Workspaces & Impersonation)</option>
                          <option value="finance">Finance (Revenue & Invoicing)</option>
                        </select>
                      )}
                    </td>
                    <td className="p-3 text-2xs text-ink-3">
                      {st.role === 'owner'
                        ? 'Full platform authority'
                        : st.role === 'finance'
                        ? 'Revenue, manual payments, and invoicing only'
                        : 'Customer support, support sessions, and abuse management'}
                    </td>
                    <td className="p-3 text-right">
                      {!st.is_platform_owner && (
                        <Button
                          variant="danger"
                          size="xs"
                          onClick={() => handleRevokeStaff(st.id)}
                        >
                          Revoke Access
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Feature Flag Modal */}
      {flagModalOpen && editingFlag && (
        <Modal
          open={flagModalOpen}
          onClose={() => setFlagModalOpen(false)}
          title={editingFlag.id ? 'Edit Feature Flag' : 'New Feature Flag'}
        >
          <form onSubmit={handleSaveFlag} className="space-y-4">
            <div>
              <label className="text-2xs font-bold uppercase text-ink-3">Flag Key</label>
              <input
                type="text"
                required
                disabled={Boolean(editingFlag.id)}
                value={editingFlag.key || ''}
                onChange={(e) => setEditingFlag({ ...editingFlag, key: e.target.value })}
                placeholder="e.g. ai_copilot_beta"
                className="input w-full mt-1 text-xs font-mono"
              />
            </div>

            <div>
              <label className="text-2xs font-bold uppercase text-ink-3">Display Name</label>
              <input
                type="text"
                required
                value={editingFlag.name || ''}
                onChange={(e) => setEditingFlag({ ...editingFlag, name: e.target.value })}
                placeholder="e.g. AI Copilot Beta"
                className="input w-full mt-1 text-xs"
              />
            </div>

            <div>
              <label className="text-2xs font-bold uppercase text-ink-3">Description</label>
              <textarea
                rows={2}
                value={editingFlag.description || ''}
                onChange={(e) => setEditingFlag({ ...editingFlag, description: e.target.value })}
                className="input w-full mt-1 text-xs"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-surface-2 border border-line">
              <span className="text-xs font-semibold text-ink">Enabled Globally</span>
              <input
                type="checkbox"
                checked={Boolean(editingFlag.is_enabled_globally)}
                onChange={(e) => setEditingFlag({ ...editingFlag, is_enabled_globally: e.target.checked })}
                className="toggle"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-line">
              <Button variant="ghost" size="sm" type="button" onClick={() => setFlagModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" disabled={isPending}>
                Save Flag
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Announcement Modal */}
      {announcementModalOpen && editingAnnouncement && (
        <Modal
          open={announcementModalOpen}
          onClose={() => setAnnouncementModalOpen(false)}
          title={editingAnnouncement.id ? 'Edit Announcement' : 'New Announcement'}
        >
          <form onSubmit={handleSaveAnnouncement} className="space-y-4">
            <div>
              <label className="text-2xs font-bold uppercase text-ink-3">Title</label>
              <input
                type="text"
                required
                value={editingAnnouncement.title || ''}
                onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, title: e.target.value })}
                className="input w-full mt-1 text-xs"
              />
            </div>

            <div>
              <label className="text-2xs font-bold uppercase text-ink-3">Message</label>
              <textarea
                rows={3}
                required
                value={editingAnnouncement.message || ''}
                onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, message: e.target.value })}
                className="input w-full mt-1 text-xs"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-2xs font-bold uppercase text-ink-3">Tone</label>
                <select
                  value={editingAnnouncement.tone || 'info'}
                  onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, tone: e.target.value as any })}
                  className="select w-full mt-1 text-xs"
                >
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="success">Success</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="text-2xs font-bold uppercase text-ink-3">Display Type</label>
                <select
                  value={editingAnnouncement.display_type || 'banner'}
                  onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, display_type: e.target.value as any })}
                  className="select w-full mt-1 text-xs"
                >
                  <option value="banner">Top Banner</option>
                  <option value="modal">Popup Modal</option>
                  <option value="card">Dashboard Card</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-line">
              <Button variant="ghost" size="sm" type="button" onClick={() => setAnnouncementModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" disabled={isPending}>
                Save Announcement
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
