'use client';

import React, { useState } from 'react';
import {
  Palette,
  Clock,
  Users,
  MessageSquareText,
  Sliders,
  Code,
  Check,
  Copy,
  Plus,
  Trash2,
  Edit2,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  Upload,
  Send,
  MessageSquare,
  X,
  Bot,
  Zap,
  Globe,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import {
  Workspace,
  Agent,
  CannedResponse,
  BusinessHoursConfig,
  AutoAssignmentConfig,
  AISettingsConfig,
} from '@/types/database';
import {
  updateWidgetSettingsAction,
  updateBusinessHoursAction,
  updateAutoAssignmentRulesAction,
  updateAISettingsAction,
  inviteAgentAction,
  updateAgentRoleAction,
  removeAgentAction,
  createCannedResponseAction,
  updateCannedResponseAction,
  deleteCannedResponseAction,
} from '@/app/actions/admin';
import {
  updateWorkspaceDomainAction,
  verifyWorkspaceDomainAction,
  removeWorkspaceDomainAction,
} from '@/app/actions/domain';
import {
  getWorkspaceHelpCenterUrl,
  cleanDomain,
  getDefaultSubdomain,
  getExpectedDnsRecords,
} from '@/lib/domain';
import { cn } from '@/lib/utils';

interface AdminSettingsPanelProps {
  workspace: Workspace;
  currentAgent: Agent;
  initialAgents: Agent[];
  initialCannedResponses: CannedResponse[];
  onWorkspaceUpdated?: (ws: Workspace) => void;
  /** Controlled section; when set the internal tab bar is bypassed. */
  tab?: AdminTab;
  /** Hides this panel's own header and tab bar (used by the Settings hub). */
  embedded?: boolean;
}

export type AdminTab =
  | 'widget'
  | 'hours'
  | 'team'
  | 'canned'
  | 'assignment'
  | 'ai'
  | 'snippet'
  | 'domain';

const DEFAULT_SCHEDULE: BusinessHoursConfig = {
  enabled: false,
  timezone: 'UTC',
  schedule: {
    monday: { enabled: true, start: '09:00', end: '17:00' },
    tuesday: { enabled: true, start: '09:00', end: '17:00' },
    wednesday: { enabled: true, start: '09:00', end: '17:00' },
    thursday: { enabled: true, start: '09:00', end: '17:00' },
    friday: { enabled: true, start: '09:00', end: '17:00' },
    saturday: { enabled: false, start: '09:00', end: '17:00' },
    sunday: { enabled: false, start: '09:00', end: '17:00' },
  },
};

const COLOR_PRESETS = [
  '#2563eb', // Chatify Blue
  '#0d9488', // Teal
  '#10b981', // Emerald
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#f97316', // Orange
  '#0f172a', // Midnight Slate
];

export function AdminSettingsPanel({
  workspace: initialWorkspace,
  currentAgent,
  initialAgents,
  initialCannedResponses,
  onWorkspaceUpdated,
  tab,
  embedded = false,
}: AdminSettingsPanelProps) {
  // When embedded in the Settings hub the parent owns the tab bar and header,
  // so the panel renders only the requested section.
  const [internalTab, setActiveTab] = useState<AdminTab>('widget');
  const activeTab: AdminTab = tab ?? internalTab;

  // Workspace state
  const [workspace, setWorkspace] = useState<Workspace>(initialWorkspace);
  const [agents, setAgents] = useState<Agent[]>(initialAgents);
  const [cannedResponses, setCannedResponses] = useState<CannedResponse[]>(initialCannedResponses);

  // Status & Feedback
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [saving, setSaving] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  const showStatus = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 3500);
  };

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 1: WIDGET CUSTOMIZATION STATE
  // ──────────────────────────────────────────────────────────────────────────
  const [brandColor, setBrandColor] = useState(workspace.brand_color || '#2563eb');
  const [logoUrl, setLogoUrl] = useState(workspace.logo_url || '');
  const [widgetPosition, setWidgetPosition] = useState<'right' | 'left'>(
    workspace.widget_position || 'right'
  );
  const [greetingTitle, setGreetingTitle] = useState(workspace.greeting_title || 'Hi there 👋');
  const [greetingMessage, setGreetingMessage] = useState(
    workspace.greeting_message || "We're here to help! Send us a message and we'll reply shortly."
  );
  const [helpTabLabel, setHelpTabLabel] = useState(workspace.help_center_tab_label || 'Help');
  const [showHelpTab, setShowHelpTab] = useState(workspace.show_help_tab !== false);
  const [previewOpen, setPreviewOpen] = useState(true);

  const handleSaveWidget = async () => {
    setSaving(true);
    try {
      const res = await updateWidgetSettingsAction(workspace.id, {
        brand_color: brandColor,
        logo_url: logoUrl,
        widget_position: widgetPosition,
        greeting_title: greetingTitle,
        greeting_message: greetingMessage,
        help_center_tab_label: helpTabLabel,
        show_help_tab: showHelpTab,
      });
      if (res.workspace) {
        setWorkspace(res.workspace);
        onWorkspaceUpdated?.(res.workspace);
        showStatus('Widget customization saved successfully!');
      }
    } catch (err: any) {
      showStatus(err.message || 'Failed to save widget settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploadData = new FormData();
    uploadData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadData,
      });
      const data = await res.json();
      if (data.url) {
        setLogoUrl(data.url);
        showStatus('Logo uploaded!');
      }
    } catch (err) {
      showStatus('Failed to upload logo', 'error');
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 2: BUSINESS HOURS STATE
  // ──────────────────────────────────────────────────────────────────────────
  const [businessHours, setBusinessHours] = useState<BusinessHoursConfig>(
    workspace.business_hours || DEFAULT_SCHEDULE
  );

  const handleSaveBusinessHours = async () => {
    setSaving(true);
    try {
      const res = await updateBusinessHoursAction(workspace.id, businessHours);
      if (res.workspace) {
        setWorkspace(res.workspace);
        onWorkspaceUpdated?.(res.workspace);
        showStatus('Business hours updated successfully!');
      }
    } catch (err: any) {
      showStatus(err.message || 'Failed to update business hours', 'error');
    } finally {
      setSaving(false);
    }
  };

  const updateDaySchedule = (
    day: keyof BusinessHoursConfig['schedule'],
    field: 'enabled' | 'start' | 'end',
    value: any
  ) => {
    setBusinessHours((prev) => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [day]: {
          ...prev.schedule[day],
          [field]: value,
        },
      },
    }));
  };

  const copyMondayToWeekdays = () => {
    const mon = businessHours.schedule.monday;
    setBusinessHours((prev) => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        tuesday: { ...mon },
        wednesday: { ...mon },
        thursday: { ...mon },
        friday: { ...mon },
      },
    }));
    showStatus('Copied Monday schedule to Tuesday-Friday');
  };

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 3: TEAM MANAGEMENT STATE
  // ──────────────────────────────────────────────────────────────────────────
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'agent'>('agent');
  const [inviting, setInviting] = useState(false);

  const handleInviteAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName || !inviteEmail) return;

    setInviting(true);
    try {
      const res = await inviteAgentAction(workspace.id, {
        name: inviteName,
        email: inviteEmail,
        role: inviteRole,
      });
      if (res.agent) {
        setAgents((prev) => [...prev, res.agent]);
        setInviteModalOpen(false);
        setInviteName('');
        setInviteEmail('');
        showStatus(`Invited ${res.agent.name} as ${res.agent.role}`);
      }
    } catch (err: any) {
      showStatus(err.message || 'Failed to invite agent', 'error');
    } finally {
      setInviting(false);
    }
  };

  const handleUpdateRole = async (agentId: string, newRole: 'admin' | 'agent') => {
    try {
      const res = await updateAgentRoleAction(workspace.id, agentId, newRole);
      if (res.agent) {
        setAgents((prev) => prev.map((a) => (a.id === agentId ? res.agent : a)));
        showStatus(`Updated role to ${newRole}`);
      }
    } catch (err: any) {
      showStatus(err.message || 'Failed to update agent role', 'error');
    }
  };

  const handleRemoveAgent = async (agentId: string, agentName: string) => {
    if (!confirm(`Are you sure you want to remove ${agentName} from the workspace?`)) return;

    try {
      await removeAgentAction(workspace.id, agentId);
      setAgents((prev) => prev.filter((a) => a.id !== agentId));
      showStatus(`Removed ${agentName}`);
    } catch (err: any) {
      showStatus(err.message || 'Failed to remove agent', 'error');
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 4: CANNED RESPONSES CRUD STATE
  // ──────────────────────────────────────────────────────────────────────────
  const [cannedModalOpen, setCannedModalOpen] = useState(false);
  const [editingCannedId, setEditingCannedId] = useState<string | null>(null);
  const [cannedShortcut, setCannedShortcut] = useState('');
  const [cannedTitle, setCannedTitle] = useState('');
  const [cannedContent, setCannedContent] = useState('');
  const [cannedScope, setCannedScope] = useState<'team' | 'agent'>('team');
  const [cannedSearch, setCannedSearch] = useState('');
  const [cannedFilter, setCannedFilter] = useState<'all' | 'team' | 'agent'>('all');

  const openCreateCanned = () => {
    setEditingCannedId(null);
    setCannedShortcut('/');
    setCannedTitle('');
    setCannedContent('');
    setCannedScope('team');
    setCannedModalOpen(true);
  };

  const openEditCanned = (item: CannedResponse) => {
    setEditingCannedId(item.id);
    setCannedShortcut(item.shortcut);
    setCannedTitle(item.title || '');
    setCannedContent(item.content);
    setCannedScope(item.agent_id ? 'agent' : 'team');
    setCannedModalOpen(true);
  };

  const handleSaveCanned = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cannedShortcut || !cannedTitle || !cannedContent) return;

    try {
      if (editingCannedId) {
        const res = await updateCannedResponseAction(workspace.id, editingCannedId, {
          shortcut: cannedShortcut,
          title: cannedTitle,
          content: cannedContent,
          scope: cannedScope,
        });
        if (res.cannedResponse) {
          setCannedResponses((prev) =>
            prev.map((c) => (c.id === editingCannedId ? res.cannedResponse : c))
          );
          showStatus('Canned reply updated');
        }
      } else {
        const res = await createCannedResponseAction(workspace.id, {
          shortcut: cannedShortcut,
          title: cannedTitle,
          content: cannedContent,
          scope: cannedScope,
          agent_id: currentAgent.id,
        });
        if (res.cannedResponse) {
          setCannedResponses((prev) => [...prev, res.cannedResponse]);
          showStatus('Canned reply created');
        }
      }
      setCannedModalOpen(false);
    } catch (err: any) {
      showStatus(err.message || 'Failed to save canned reply', 'error');
    }
  };

  const handleDeleteCanned = async (id: string, shortcut: string) => {
    if (!confirm(`Delete canned shortcut ${shortcut}?`)) return;
    try {
      await deleteCannedResponseAction(workspace.id, id);
      setCannedResponses((prev) => prev.filter((c) => c.id !== id));
      showStatus(`Deleted ${shortcut}`);
    } catch (err: any) {
      showStatus(err.message || 'Failed to delete canned reply', 'error');
    }
  };

  const filteredCanned = cannedResponses.filter((item) => {
    if (cannedFilter === 'team' && item.agent_id !== null) return false;
    if (cannedFilter === 'agent' && item.agent_id === null) return false;
    if (cannedSearch) {
      const q = cannedSearch.toLowerCase();
      return (
        item.shortcut.toLowerCase().includes(q) ||
        (item.title || '').toLowerCase().includes(q) ||
        item.content.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 5: AUTO-ASSIGNMENT RULES STATE
  // ──────────────────────────────────────────────────────────────────────────
  const [autoAssign, setAutoAssign] = useState<AutoAssignmentConfig>(
    workspace.auto_assignment || { enabled: true, max_conversations_per_agent: 5 }
  );

  const handleSaveAutoAssign = async () => {
    setSaving(true);
    try {
      const res = await updateAutoAssignmentRulesAction(workspace.id, autoAssign);
      if (res.workspace) {
        setWorkspace(res.workspace);
        onWorkspaceUpdated?.(res.workspace);
        showStatus('Auto-assignment rules saved!');
      }
    } catch (err: any) {
      showStatus(err.message || 'Failed to save auto-assignment rules', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 7: CLAUDE AI SETTINGS
  // ──────────────────────────────────────────────────────────────────────────
  const [aiSettings, setAiSettings] = useState<AISettingsConfig>(
    workspace.ai_settings || {
      enabled: true,
      auto_response_enabled: true,
      auto_response_delay_seconds: 20,
      suggested_replies_enabled: true,
      auto_tagging_enabled: true,
      summary_enabled: true,
      sentiment_enabled: true,
      anthropic_api_key: '',
      model: 'claude-3-5-sonnet-20241022',
    }
  );

  const handleSaveAISettings = async () => {
    setSaving(true);
    try {
      const res = await updateAISettingsAction(workspace.id, aiSettings);
      if (res.workspace) {
        setWorkspace(res.workspace);
        onWorkspaceUpdated?.(res.workspace);
        showStatus('AI settings saved successfully!');
      }
    } catch (err: any) {
      showStatus(err.message || 'Failed to save AI settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 6: INSTALL SNIPPET
  // ──────────────────────────────────────────────────────────────────────────
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://chatify.dev';
  const installSnippetCode = `<!-- Chatify Live Chat Tracker & Widget -->
<script
  src="${origin}/tracker.js"
  data-workspace-id="${workspace.id}"
  defer
></script>
<script
  src="${origin}/widget.js"
  data-workspace-id="${workspace.id}"
  defer
></script>`;

  const copySnippet = () => {
    navigator.clipboard.writeText(installSnippetCode);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
    showStatus('Code snippet copied to clipboard!');
  };

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 8: DOMAIN & HELP CENTER STATE & HANDLERS
  // ──────────────────────────────────────────────────────────────────────────
  const [customDomainInput, setCustomDomainInput] = useState(
    workspace.custom_domain || getDefaultSubdomain(workspace.website_url) || ''
  );
  const [domainMode, setDomainMode] = useState<'subdomain' | 'custom'>(
    workspace.custom_domain && !workspace.custom_domain.startsWith('help.') ? 'custom' : 'subdomain'
  );
  const [savingDomain, setSavingDomain] = useState(false);
  const [verifyingDomain, setVerifyingDomain] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    verified: boolean;
    status: 'verified' | 'failed';
    details: string;
  } | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedCname, setCopiedCname] = useState(false);
  const [copiedPublicUrl, setCopiedPublicUrl] = useState(false);

  const handleSaveDomain = async () => {
    if (!customDomainInput.trim()) {
      showStatus('Please provide a domain', 'error');
      return;
    }
    setSavingDomain(true);
    try {
      const res = await updateWorkspaceDomainAction(workspace.id, customDomainInput);
      if (res.success && res.data) {
        setWorkspace(res.data.workspace);
        onWorkspaceUpdated?.(res.data.workspace);
        showStatus('Domain saved! Now please configure your DNS records below.');
      } else {
        showStatus(res.error || 'Failed to update domain', 'error');
      }
    } catch (err: any) {
      showStatus(err.message || 'Error updating domain', 'error');
    } finally {
      setSavingDomain(false);
    }
  };

  const handleVerifyDomain = async () => {
    setVerifyingDomain(true);
    setVerificationResult(null);
    try {
      const res = await verifyWorkspaceDomainAction(workspace.id);
      if (res.data) {
        setVerificationResult(res.data);
        if (res.data.verified) {
          const updatedWs = {
            ...workspace,
            custom_domain: cleanDomain(customDomainInput),
            custom_domain_status: 'verified' as const,
            custom_domain_verified_at: new Date().toISOString(),
          };
          setWorkspace(updatedWs);
          onWorkspaceUpdated?.(updatedWs);
          showStatus('Domain successfully verified and active!', 'success');
        } else {
          showStatus('DNS records not detected yet. Check the instructions below.', 'error');
        }
      } else {
        showStatus(res.error || 'Verification failed', 'error');
      }
    } catch (err: any) {
      showStatus(err.message || 'Error running DNS verification', 'error');
    } finally {
      setVerifyingDomain(false);
    }
  };

  const handleRemoveDomain = async () => {
    if (!confirm('Are you sure you want to remove this custom domain? The Help Center will fall back to your platform URL.')) return;
    try {
      const res = await removeWorkspaceDomainAction(workspace.id);
      if (res.success) {
        const updatedWs = {
          ...workspace,
          custom_domain: null,
          custom_domain_status: null,
          custom_domain_verified_at: null,
        };
        setWorkspace(updatedWs);
        onWorkspaceUpdated?.(updatedWs);
        setCustomDomainInput(getDefaultSubdomain(workspace.website_url) || '');
        setVerificationResult(null);
        showStatus('Custom domain removed');
      }
    } catch (err: any) {
      showStatus(err.message || 'Failed to remove domain', 'error');
    }
  };

  return (
    <div
      className={
        embedded
          ? 'w-full'
          : 'flex-1 flex flex-col h-full bg-canvas overflow-y-auto'
      }
    >
      {!embedded && (
      <>
      {/* Header */}
      <div className="h-16 px-8 border-b border-line flex items-center justify-between bg-surface sticky top-0 z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent/10 text-accent flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[17px] font-bold text-ink tracking-tight">Admin Settings</h1>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-semibold">
                Admin Role Required
              </span>
            </div>
            <p className="text-[12px] text-ink-3">
              Configure workspace customization, business hours, permissions, and routing.
            </p>
          </div>
        </div>

        {statusMessage && (
          <div
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 shadow-sm animate-rise ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300 border border-red-200 dark:border-red-800'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5" />
            )}
            {statusMessage.text}
          </div>
        )}
      </div>

      {/* Tabs Bar */}
      <div className="px-8 border-b border-line bg-surface sticky top-16 z-10 flex gap-2">
        {[
          { id: 'widget', label: 'Widget Customization', icon: Palette },
          { id: 'hours', label: 'Business Hours', icon: Clock },
          { id: 'team', label: 'Team & Roles', icon: Users, badge: agents.length },
          { id: 'canned', label: 'Canned Replies', icon: MessageSquareText, badge: cannedResponses.length },
          { id: 'assignment', label: 'Auto-Assignment', icon: Sliders },
          { id: 'ai', label: 'Claude AI Assistant', icon: Sparkles },
          { id: 'domain', label: 'Custom Domains', icon: Globe },
          { id: 'snippet', label: 'Install Snippet', icon: Code },
        ].map((tab) => {
          const active = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-[13px] font-medium border-b-2 transition-colors -mb-px ${
                active
                  ? 'border-accent text-accent font-semibold'
                  : 'border-transparent text-ink-3 hover:text-ink hover:border-line-2'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-surface-2 text-ink-2">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      </>
      )}

      {/* Tab Panels */}
      <div className={embedded ? 'w-full space-y-8 pb-16' : 'p-8 max-w-6xl mx-auto w-full space-y-8 pb-20'}>
        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* TAB 1: WIDGET CUSTOMIZATION & LIVE PREVIEW */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        {activeTab === 'widget' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-rise">
            {/* Left Column: Form Controls */}
            <div className="lg:col-span-7 space-y-6">
              <div className="card p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-line pb-4">
                  <div>
                    <h3 className="text-[15px] font-semibold text-ink">Brand Identity</h3>
                    <p className="text-[12px] text-ink-3">
                      Match the chat widget to your company branding.
                    </p>
                  </div>
                  <button
                    onClick={handleSaveWidget}
                    disabled={saving}
                    className="btn btn-sm btn-primary gap-1.5 shadow-xs"
                  >
                    {saving ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>

                {/* Brand Color Picker */}
                <div>
                  <label className="field-label">Brand Color</label>
                  <div className="flex items-center gap-3">
                    <div className="relative flex items-center">
                      <input
                        type="color"
                        value={brandColor}
                        onChange={(e) => setBrandColor(e.target.value)}
                        className="w-10 h-10 rounded-xl border border-line cursor-pointer p-0.5 bg-transparent"
                      />
                    </div>
                    <input
                      type="text"
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      placeholder="#2563eb"
                      className="input w-32 font-mono text-sm uppercase"
                    />
                    <div className="flex items-center gap-1.5 ml-2">
                      {COLOR_PRESETS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setBrandColor(color)}
                          style={{ backgroundColor: color }}
                          className={`w-6 h-6 rounded-full border transition-transform hover:scale-110 ${
                            brandColor.toLowerCase() === color.toLowerCase()
                              ? 'ring-2 ring-accent ring-offset-2 scale-110'
                              : 'border-white/20'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Logo Upload */}
                <div>
                  <label className="field-label">Logo / Avatar</label>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl border border-line bg-surface-2 flex items-center justify-center overflow-hidden shrink-0">
                      {logoUrl ? (
                        <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <MessageSquare className="w-6 h-6 text-ink-3" />
                      )}
                    </div>
                    <div className="space-y-1 flex-1">
                      <label className="btn btn-xs btn-secondary cursor-pointer inline-flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload New Logo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                      </label>
                      <input
                        type="url"
                        placeholder="Or enter image URL: https://example.com/logo.png"
                        value={logoUrl}
                        onChange={(e) => setLogoUrl(e.target.value)}
                        className="input text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Widget Position */}
                <div>
                  <label className="field-label">Widget Screen Position</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setWidgetPosition('right')}
                      className={`p-3 rounded-xl border text-left text-xs font-medium transition-all ${
                        widgetPosition === 'right'
                          ? 'border-accent bg-accent/5 text-accent shadow-xs'
                          : 'border-line text-ink hover:bg-surface-2'
                      }`}
                    >
                      <div className="font-semibold text-[13px]">Bottom Right</div>
                      <div className="text-ink-3 text-[11.5px] mt-0.5">
                        Standard placement for live chat (recommended)
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setWidgetPosition('left')}
                      className={`p-3 rounded-xl border text-left text-xs font-medium transition-all ${
                        widgetPosition === 'left'
                          ? 'border-accent bg-accent/5 text-accent shadow-xs'
                          : 'border-line text-ink hover:bg-surface-2'
                      }`}
                    >
                      <div className="font-semibold text-[13px]">Bottom Left</div>
                      <div className="text-ink-3 text-[11.5px] mt-0.5">
                        Great if other buttons occupy the bottom right
                      </div>
                    </button>
                  </div>
                </div>

                {/* Welcome Message Text */}
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="field-label">Greeting Title</label>
                    <input
                      type="text"
                      value={greetingTitle}
                      onChange={(e) => setGreetingTitle(e.target.value)}
                      placeholder="Hi there 👋"
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="field-label">Welcome Message Text</label>
                    <textarea
                      rows={3}
                      value={greetingMessage}
                      onChange={(e) => setGreetingMessage(e.target.value)}
                      placeholder="We're here to help! Ask us anything or browse our quick answers."
                      className="input resize-none"
                    />
                  </div>

                  {/* Help Desk Tab Customization */}
                  <div className="pt-3 border-t border-line space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="field-label mb-0">Help Tab on Website Widget</label>
                        <p className="text-[11.5px] text-ink-3">Show self-service articles tab in the chat launcher</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showHelpTab}
                          onChange={(e) => setShowHelpTab(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-10 h-5.5 bg-surface-3 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-line after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-accent"></div>
                      </label>
                    </div>

                    <div>
                      <label className="field-label">Help Tab Custom Label</label>
                      <input
                        type="text"
                        value={helpTabLabel}
                        onChange={(e) => setHelpTabLabel(e.target.value)}
                        placeholder="e.g. Help Center, FAQs, Guides, Madad"
                        className="input"
                      />
                      <p className="text-[11px] text-ink-3 mt-1">Visitors see this text on the widget bottom navigation button.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Live Preview */}
            <div className="lg:col-span-5 sticky top-36">
              <div className="panel p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-accent" />
                    <span className="text-[13px] font-semibold text-ink">Interactive Live Preview</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPreviewOpen(!previewOpen)}
                    className="text-[11.5px] text-accent hover:underline"
                  >
                    {previewOpen ? 'Minimize Widget' : 'Expand Widget'}
                  </button>
                </div>

                {/* Simulated Webpage Canvas */}
                <div className="relative h-[480px] rounded-2xl bg-gradient-to-b from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-950 border border-line p-4 overflow-hidden flex flex-col justify-between shadow-inner">
                  {/* Fake Page Content */}
                  <div className="space-y-3 opacity-40 select-none">
                    <div className="h-4 w-28 bg-ink/20 rounded-full" />
                    <div className="h-7 w-48 bg-ink/30 rounded-lg" />
                    <div className="h-3 w-64 bg-ink/20 rounded-full" />
                    <div className="h-3 w-52 bg-ink/20 rounded-full" />
                  </div>

                  {/* Opened Widget Window Preview */}
                  {previewOpen && (
                    <div
                      className={`absolute bottom-16 ${
                        widgetPosition === 'right' ? 'right-4' : 'left-4'
                      } w-72 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-line overflow-hidden animate-rise flex flex-col z-20`}
                      style={{ maxHeight: '380px' }}
                    >
                      {/* Widget Header */}
                      <div
                        className="p-4 text-white flex items-center justify-between"
                        style={{ backgroundColor: brandColor }}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
                            {logoUrl ? (
                              <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                            ) : (
                              <img src="/chat-icon-white.png" alt="Logo" className="w-5 h-5 object-contain" />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-xs leading-tight">{workspace.name}</div>
                            <div className="text-[10px] opacity-80 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                              We reply immediately
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => setPreviewOpen(false)}
                          className="text-white/80 hover:text-white p-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Widget Body */}
                      <div className="p-3.5 space-y-3 flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900/50 text-xs">
                        {/* Welcome Card */}
                        <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-line shadow-xs space-y-1">
                          <div className="font-semibold text-[13px] text-ink">{greetingTitle}</div>
                          <p className="text-ink-3 text-[11.5px] leading-relaxed">
                            {greetingMessage}
                          </p>
                        </div>

                        {/* Sample Bot/Agent Bubble */}
                        <div className="flex gap-2">
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] text-white shrink-0"
                            style={{ backgroundColor: brandColor }}
                          >
                            C
                          </div>
                          <div className="p-2.5 rounded-xl rounded-tl-sm bg-white dark:bg-slate-800 border border-line text-ink text-[11px] shadow-xs">
                            How can our support team assist you today?
                          </div>
                        </div>
                      </div>

                      {/* Widget Footer Input */}
                      <div className="p-2 bg-white dark:bg-slate-900 border-t border-line flex items-center gap-1.5">
                        <input
                          type="text"
                          disabled
                          placeholder="Send a message…"
                          className="flex-1 text-[11px] px-2.5 py-1.5 rounded-lg bg-surface-2 border-0 outline-none"
                        />
                        <button
                          type="button"
                          style={{ backgroundColor: brandColor }}
                          className="w-7 h-7 rounded-lg text-white flex items-center justify-center shrink-0 shadow-xs"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Floating Launcher Bubble */}
                  <div
                    className={`absolute bottom-3 ${
                      widgetPosition === 'right' ? 'right-4' : 'left-4'
                    } z-10`}
                  >
                    <button
                      type="button"
                      onClick={() => setPreviewOpen(!previewOpen)}
                      style={{ backgroundColor: brandColor }}
                      className="w-12 h-12 rounded-full text-white flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95"
                    >
                      {previewOpen ? (
                        <X className="w-5 h-5 text-white" />
                      ) : (
                        <img
                          src={logoUrl || '/chat-icon-white.png'}
                          alt="Chat"
                          className="w-6 h-6 object-contain brightness-0 invert"
                        />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* TAB 2: BUSINESS HOURS */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        {activeTab === 'hours' && (
          <div className="space-y-6 animate-rise">
            <div className="card p-6 space-y-6">
              <div className="flex items-start justify-between border-b border-line pb-4">
                <div>
                  <h3 className="text-[16px] font-semibold text-ink">Operational Business Hours</h3>
                  <p className="text-[12.5px] text-ink-3 mt-0.5">
                    Define when your support agents are active. Outside these hours, the chat widget automatically displays an "Offline" message and prompts visitors to leave their email.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={copyMondayToWeekdays}
                    className="btn btn-sm btn-secondary text-xs"
                  >
                    Copy Mon &rarr; Fri
                  </button>
                  <button
                    onClick={handleSaveBusinessHours}
                    disabled={saving}
                    className="btn btn-sm btn-primary gap-1.5 shadow-xs"
                  >
                    {saving ? 'Saving…' : 'Save Schedule'}
                  </button>
                </div>
              </div>

              {/* Master Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-surface-2 border border-line">
                <div className="space-y-0.5">
                  <div className="text-[13.5px] font-semibold text-ink">Enforce Business Hours</div>
                  <div className="text-[12px] text-ink-3">
                    Automatically switch widget status to Offline outside the scheduled times.
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={businessHours.enabled}
                    onChange={(e) =>
                      setBusinessHours({ ...businessHours, enabled: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent" />
                </label>
              </div>

              {/* Timezone Selector */}
              <div className="flex items-center gap-4">
                <label className="field-label mb-0 shrink-0">Timezone</label>
                <select
                  value={businessHours.timezone}
                  onChange={(e) =>
                    setBusinessHours({ ...businessHours, timezone: e.target.value })
                  }
                  className="input w-64 text-xs font-medium"
                >
                  <option value="UTC">UTC (Universal Coordinated Time)</option>
                  <option value="America/New_York">Eastern Time (US & Canada)</option>
                  <option value="America/Chicago">Central Time (US & Canada)</option>
                  <option value="America/Denver">Mountain Time (US & Canada)</option>
                  <option value="America/Los_Angeles">Pacific Time (US & Canada)</option>
                  <option value="Europe/London">London (GMT / BST)</option>
                  <option value="Europe/Paris">Paris, Berlin, Rome (CET)</option>
                  <option value="Asia/Dubai">Dubai (GST)</option>
                  <option value="Asia/Karachi">Karachi, Islamabad (PKT)</option>
                  <option value="Asia/Tokyo">Tokyo, Osaka (JST)</option>
                  <option value="Australia/Sydney">Sydney (AEST)</option>
                </select>
              </div>

              {/* 7 Days Schedule Table */}
              <div className="divide-y divide-line border border-line rounded-xl overflow-hidden">
                {(
                  [
                    ['monday', 'Monday'],
                    ['tuesday', 'Tuesday'],
                    ['wednesday', 'Wednesday'],
                    ['thursday', 'Thursday'],
                    ['friday', 'Friday'],
                    ['saturday', 'Saturday'],
                    ['sunday', 'Sunday'],
                  ] as const
                ).map(([dayKey, dayLabel]) => {
                  const schedule = businessHours.schedule[dayKey];
                  return (
                    <div
                      key={dayKey}
                      className={`p-3.5 px-5 flex items-center justify-between transition-colors ${
                        schedule.enabled ? 'bg-surface' : 'bg-surface-2 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3 w-36">
                        <input
                          type="checkbox"
                          checked={schedule.enabled}
                          onChange={(e) =>
                            updateDaySchedule(dayKey, 'enabled', e.target.checked)
                          }
                          className="w-4 h-4 accent-accent rounded cursor-pointer"
                        />
                        <span className="text-[13px] font-medium text-ink">{dayLabel}</span>
                      </div>

                      {schedule.enabled ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="time"
                            value={schedule.start}
                            onChange={(e) =>
                              updateDaySchedule(dayKey, 'start', e.target.value)
                            }
                            className="input w-28 text-center text-xs font-mono py-1"
                          />
                          <span className="text-ink-3 text-xs">to</span>
                          <input
                            type="time"
                            value={schedule.end}
                            onChange={(e) =>
                              updateDaySchedule(dayKey, 'end', e.target.value)
                            }
                            className="input w-28 text-center text-xs font-mono py-1"
                          />
                        </div>
                      ) : (
                        <span className="text-xs font-medium text-ink-3 italic">
                          Closed / Offline All Day
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* TAB 3: TEAM MANAGEMENT & ROLE SWITCHER */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        {activeTab === 'team' && (
          <div className="space-y-6 animate-rise">
            <div className="card p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-line pb-4">
                <div>
                  <h3 className="text-[16px] font-semibold text-ink">Agents & Team Permissions</h3>
                  <p className="text-[12.5px] text-ink-3 mt-0.5">
                    Invite team members, assign administrator privileges, or revoke access.
                  </p>
                </div>
                <button
                  onClick={() => setInviteModalOpen(true)}
                  className="btn btn-sm btn-primary gap-1.5 shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Invite Agent</span>
                </button>
              </div>

              {/* Agents Table */}
              <div className="border border-line rounded-xl overflow-hidden divide-y divide-line">
                {agents.map((agent) => {
                  const isSelf = agent.id === currentAgent.id;
                  const isOwner = agent.role === 'owner';
                  return (
                    <div
                      key={agent.id}
                      className="p-4 px-6 flex items-center justify-between hover:bg-surface-2/40 transition-colors"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-accent/10 text-accent font-bold text-sm flex items-center justify-center">
                            {agent.name.slice(0, 2).toUpperCase()}
                          </div>
                          <span
                            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${
                              agent.status === 'online'
                                ? 'bg-emerald-500'
                                : agent.status === 'away'
                                ? 'bg-amber-500'
                                : 'bg-slate-400'
                            }`}
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[13.5px] text-ink">
                              {agent.name}
                            </span>
                            {isSelf && (
                              <span className="text-[10.5px] px-1.5 py-0.5 rounded bg-surface-2 text-ink-2 font-medium">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-[12px] text-ink-3">{agent.email}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {/* Role Selector */}
                        {isOwner ? (
                          <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 font-semibold text-xs flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Owner
                          </span>
                        ) : (
                          <select
                            value={agent.role}
                            disabled={isSelf}
                            onChange={(e) =>
                              handleUpdateRole(agent.id, e.target.value as 'admin' | 'agent')
                            }
                            className="input py-1 text-xs font-semibold w-28"
                          >
                            <option value="agent">Agent</option>
                            <option value="admin">Admin</option>
                          </select>
                        )}

                        {/* Remove Action */}
                        {!isSelf && !isOwner && (
                          <button
                            type="button"
                            onClick={() => handleRemoveAgent(agent.id, agent.name)}
                            title="Remove agent"
                            className="p-1.5 rounded-lg text-ink-3 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Invite Agent Modal */}
            {inviteModalOpen && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade">
                <div className="card max-w-md w-full p-6 space-y-5 animate-rise shadow-2xl">
                  <div className="flex items-center justify-between border-b border-line pb-3">
                    <h3 className="text-[16px] font-semibold text-ink">Invite New Agent</h3>
                    <button
                      onClick={() => setInviteModalOpen(false)}
                      className="text-ink-3 hover:text-ink"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleInviteAgent} className="space-y-4">
                    <div>
                      <label className="field-label">Full Name</label>
                      <input
                        type="text"
                        required
                        value={inviteName}
                        onChange={(e) => setInviteName(e.target.value)}
                        placeholder="Sarah Connor"
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="field-label">Email Address</label>
                      <input
                        type="email"
                        required
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="sarah@company.com"
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="field-label">Workspace Role</label>
                      <select
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value as any)}
                        className="input font-medium"
                      >
                        <option value="agent">Support Agent (Respond to chats)</option>
                        <option value="admin">Administrator (Full settings & team access)</option>
                      </select>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setInviteModalOpen(false)}
                        className="btn btn-sm btn-ghost"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={inviting}
                        className="btn btn-sm btn-primary"
                      >
                        {inviting ? 'Inviting…' : 'Send Invitation'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* TAB 4: CANNED RESPONSES (SAVED REPLIES CRUD) */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        {activeTab === 'canned' && (
          <div className="space-y-6 animate-rise">
            <div className="card p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-line pb-4">
                <div>
                  <h3 className="text-[16px] font-semibold text-ink">Canned Responses & Shortcuts</h3>
                  <p className="text-[12.5px] text-ink-3 mt-0.5">
                    Create reusable canned messages. Agents can type <code className="font-mono text-accent">/shortcut</code> in any active chat thread to quickly paste them.
                  </p>
                </div>
                <button
                  onClick={openCreateCanned}
                  className="btn btn-sm btn-primary gap-1.5 shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Canned Reply</span>
                </button>
              </div>

              {/* Search & Filter Strip */}
              <div className="flex items-center justify-between gap-4">
                <input
                  type="text"
                  placeholder="Search shortcuts or replies…"
                  value={cannedSearch}
                  onChange={(e) => setCannedSearch(e.target.value)}
                  className="input max-w-xs text-xs"
                />

                <div className="flex items-center gap-1 bg-surface-2 p-1 rounded-xl border border-line text-xs font-medium">
                  {(['all', 'team', 'agent'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setCannedFilter(filter)}
                      className={`px-3 py-1 rounded-lg capitalize transition-colors ${
                        cannedFilter === filter
                          ? 'bg-white dark:bg-slate-800 text-ink shadow-xs font-semibold'
                          : 'text-ink-3 hover:text-ink'
                      }`}
                    >
                      {filter === 'agent' ? 'Personal' : filter}
                    </button>
                  ))}
                </div>
              </div>

              {/* Canned Responses Table */}
              <div className="border border-line rounded-xl overflow-hidden divide-y divide-line">
                {filteredCanned.length === 0 ? (
                  <div className="p-8 text-center text-ink-3 text-xs">
                    No canned replies found matching your search.
                  </div>
                ) : (
                  filteredCanned.map((canned) => {
                    const isTeam = canned.agent_id === null;
                    return (
                      <div
                        key={canned.id}
                        className="p-4 px-6 flex items-start justify-between gap-4 hover:bg-surface-2/40 transition-colors"
                      >
                        <div className="space-y-1 max-w-xl">
                          <div className="flex items-center gap-2.5">
                            <span className="font-mono font-bold text-accent text-xs px-2 py-0.5 rounded bg-accent/10">
                              {canned.shortcut}
                            </span>
                            <span className="font-semibold text-[13.5px] text-ink">
                              {canned.title}
                            </span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                                isTeam
                                  ? 'bg-blue-500/10 text-blue-600'
                                  : 'bg-amber-500/10 text-amber-600'
                              }`}
                            >
                              {isTeam ? 'Team-Wide' : 'Personal'}
                            </span>
                          </div>
                          <p className="text-[12.5px] text-ink-3 line-clamp-2 leading-relaxed">
                            {canned.content}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => openEditCanned(canned)}
                            title="Edit shortcut"
                            className="p-1.5 rounded-lg text-ink-3 hover:text-ink hover:bg-surface-2"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCanned(canned.id, canned.shortcut)}
                            title="Delete shortcut"
                            className="p-1.5 rounded-lg text-ink-3 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Create/Edit Modal */}
            {cannedModalOpen && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade">
                <div className="card max-w-lg w-full p-6 space-y-5 animate-rise shadow-2xl">
                  <div className="flex items-center justify-between border-b border-line pb-3">
                    <h3 className="text-[16px] font-semibold text-ink">
                      {editingCannedId ? 'Edit Canned Response' : 'New Canned Response'}
                    </h3>
                    <button
                      onClick={() => setCannedModalOpen(false)}
                      className="text-ink-3 hover:text-ink"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveCanned} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="field-label">Shortcut</label>
                        <input
                          type="text"
                          required
                          value={cannedShortcut}
                          onChange={(e) => setCannedShortcut(e.target.value)}
                          placeholder="/pricing"
                          className="input font-mono text-sm"
                        />
                      </div>
                      <div>
                        <label className="field-label">Scope</label>
                        <select
                          value={cannedScope}
                          onChange={(e) => setCannedScope(e.target.value as any)}
                          className="input font-medium"
                        >
                          <option value="team">Team-Wide (All Agents)</option>
                          <option value="agent">Personal (Only You)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="field-label">Internal Title</label>
                      <input
                        type="text"
                        required
                        value={cannedTitle}
                        onChange={(e) => setCannedTitle(e.target.value)}
                        placeholder="Pricing plan details"
                        className="input"
                      />
                    </div>

                    <div>
                      <label className="field-label">Message Content</label>
                      <textarea
                        rows={4}
                        required
                        value={cannedContent}
                        onChange={(e) => setCannedContent(e.target.value)}
                        placeholder="Our standard plan starts at $29/mo and includes unlimited chat history..."
                        className="input resize-none"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setCannedModalOpen(false)}
                        className="btn btn-sm btn-ghost"
                      >
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-sm btn-primary">
                        {editingCannedId ? 'Save Changes' : 'Create Shortcut'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* TAB 5: AUTO-ASSIGNMENT RULES */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        {activeTab === 'assignment' && (
          <div className="space-y-6 animate-rise">
            <div className="card p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-line pb-4">
                <div>
                  <h3 className="text-[16px] font-semibold text-ink">
                    Round-Robin Auto-Assignment Rules
                  </h3>
                  <p className="text-[12.5px] text-ink-3 mt-0.5">
                    Automatically balance incoming customer conversations among online team members.
                  </p>
                </div>
                <button
                  onClick={handleSaveAutoAssign}
                  disabled={saving}
                  className="btn btn-sm btn-primary gap-1.5 shadow-xs"
                >
                  {saving ? 'Saving…' : 'Save Rules'}
                </button>
              </div>

              {/* Master Round-Robin Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-surface-2 border border-line">
                <div className="space-y-0.5">
                  <div className="text-[13.5px] font-semibold text-ink">
                    Enable Round-Robin Distribution
                  </div>
                  <div className="text-[12px] text-ink-3">
                    New unassigned conversations are assigned to the online agent with the lowest open ticket count.
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoAssign.enabled}
                    onChange={(e) =>
                      setAutoAssign({ ...autoAssign, enabled: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent" />
                </label>
              </div>

              {/* Max Active Conversations Cap */}
              <div className="space-y-2">
                <label className="field-label">Max Active Conversations per Agent</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={autoAssign.max_conversations_per_agent}
                    onChange={(e) =>
                      setAutoAssign({
                        ...autoAssign,
                        max_conversations_per_agent: parseInt(e.target.value) || 5,
                      })
                    }
                    className="input w-32 text-sm font-semibold"
                  />
                  <span className="text-[12px] text-ink-3">
                    Limits concurrent open chats to prevent agent overload. Additional tickets stay in the Unassigned queue.
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* TAB 7: CLAUDE AI ASSISTANT */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        {activeTab === 'ai' && (
          <div className="space-y-6 animate-rise">
            <div className="card p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-line pb-4">
                <div>
                  <h3 className="text-[16px] font-semibold text-ink flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-accent" />
                    Anthropic Claude AI Intelligence Layer
                  </h3>
                  <p className="text-[12.5px] text-ink-3 mt-0.5">
                    Configure AI auto-first-responses, smart suggested replies, auto-tagging, sentiment analysis, and summaries.
                  </p>
                </div>
                <button
                  onClick={handleSaveAISettings}
                  disabled={saving}
                  className="btn btn-sm btn-primary gap-1.5 shadow-xs"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{saving ? 'Saving…' : 'Save AI Settings'}</span>
                </button>
              </div>

              {/* Master Switch */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-line bg-surface-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent-soft text-accent flex items-center justify-center">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[14px] font-semibold text-ink flex items-center gap-2">
                      Claude AI Live Support Assistant
                      {aiSettings.enabled && (
                        <span className="text-[10.5px] px-2 py-0.5 rounded-full bg-success-soft text-success font-bold">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] text-ink-3">
                      Master toggle for all Claude AI capabilities across this workspace.
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={aiSettings.enabled}
                    onChange={(e) => setAiSettings({ ...aiSettings, enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-surface-3 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                </label>
              </div>

              {/* Feature Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* 1. Auto First-Response (RAG) */}
                <div className="p-5 rounded-2xl border border-line bg-surface space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                        <Zap className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-[13.5px] font-semibold text-ink">AI Auto-First-Response (RAG)</h4>
                        <p className="text-[11.5px] text-ink-3">Answers customer questions using Knowledge Base articles</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={aiSettings.auto_response_enabled}
                        onChange={(e) => setAiSettings({ ...aiSettings, auto_response_enabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-surface-3 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent"></div>
                    </label>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-line">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-ink-2 font-medium">Trigger delay (seconds unassigned):</span>
                      <span className="font-bold text-accent px-2 py-0.5 rounded bg-surface-2 border border-line">
                        {aiSettings.auto_response_delay_seconds}s
                      </span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={60}
                      step={5}
                      value={aiSettings.auto_response_delay_seconds}
                      onChange={(e) =>
                        setAiSettings({
                          ...aiSettings,
                          auto_response_delay_seconds: parseInt(e.target.value, 10),
                        })
                      }
                      className="w-full accent-accent cursor-pointer"
                    />
                    <p className="text-[11px] text-ink-3">
                      If no human agent responds within this duration, Claude checks documentation and answers.
                    </p>
                  </div>
                </div>

                {/* 2. Suggested Replies */}
                <div className="p-5 rounded-2xl border border-line bg-surface space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-[13.5px] font-semibold text-ink">AI Suggested Replies</h4>
                        <p className="text-[11.5px] text-ink-3">2-3 contextual response drafts for agents</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={aiSettings.suggested_replies_enabled}
                        onChange={(e) => setAiSettings({ ...aiSettings, suggested_replies_enabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-surface-3 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent"></div>
                    </label>
                  </div>
                  <p className="text-[11.5px] text-ink-3 leading-relaxed">
                    Displays 2-3 interactive response suggestion pills above the chat composer that agents can click to insert with 1 tap.
                  </p>
                </div>

                {/* 3. Auto-Tagging */}
                <div className="p-5 rounded-2xl border border-line bg-surface space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                        <Check className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-[13.5px] font-semibold text-ink">Auto-Tagging & Categorization</h4>
                        <p className="text-[11.5px] text-ink-3">Suggests #Billing, #Bug, #Refund, #VIP</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={aiSettings.auto_tagging_enabled}
                        onChange={(e) => setAiSettings({ ...aiSettings, auto_tagging_enabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-surface-3 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent"></div>
                    </label>
                  </div>
                  <p className="text-[11.5px] text-ink-3 leading-relaxed">
                    Extracts customer intent from incoming messages and applies tags automatically to simplify inbox triage.
                  </p>
                </div>

                {/* 4. Conversation Summary & Sentiment */}
                <div className="p-5 rounded-2xl border border-line bg-surface space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-[13.5px] font-semibold text-ink">Summary & Sentiment Badges</h4>
                        <p className="text-[11.5px] text-ink-3">2-line summary for long threads + mood tags</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="relative inline-flex items-center cursor-pointer" title="Sentiment Analysis">
                        <input
                          type="checkbox"
                          checked={aiSettings.sentiment_enabled}
                          onChange={(e) => setAiSettings({ ...aiSettings, sentiment_enabled: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-surface-3 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent"></div>
                      </label>
                    </div>
                  </div>
                  <div className="space-y-2 pt-1 border-t border-line text-xs">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={aiSettings.summary_enabled}
                        onChange={(e) => setAiSettings({ ...aiSettings, summary_enabled: e.target.checked })}
                        className="rounded border-line text-accent focus:ring-accent"
                      />
                      <span className="text-ink-2 font-medium">Generate 2-line AI summary for threads &ge; 4 messages</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={aiSettings.sentiment_enabled}
                        onChange={(e) => setAiSettings({ ...aiSettings, sentiment_enabled: e.target.checked })}
                        className="rounded border-line text-accent focus:ring-accent"
                      />
                      <span className="text-ink-2 font-medium">Flag conversations as Positive / Neutral / Negative</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Anthropic API Key Credentials */}
              <div className="p-5 rounded-2xl border border-line bg-surface-2 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-[14px] font-semibold text-ink">Anthropic Claude API Credentials</h4>
                    <p className="text-[12px] text-ink-3">
                      Your API key is used strictly on server-side API routes and is never sent to browser clients.
                    </p>
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-surface border border-line text-ink-3">
                    Server-Side Only
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="field-label">Anthropic API Key</label>
                    <input
                      type="password"
                      placeholder="sk-ant-api03-••••••••••••••••••••••••"
                      value={aiSettings.anthropic_api_key || ''}
                      onChange={(e) => setAiSettings({ ...aiSettings, anthropic_api_key: e.target.value })}
                      className="input font-mono text-xs"
                    />
                    <p className="text-[11px] text-ink-3">
                      Leave empty to use the system default or built-in heuristic simulation in development.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="field-label">Claude Model</label>
                    <select
                      value={aiSettings.model || 'claude-3-5-sonnet-20241022'}
                      onChange={(e) => setAiSettings({ ...aiSettings, model: e.target.value })}
                      className="input text-xs"
                    >
                      <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet (Recommended)</option>
                      <option value="claude-3-haiku-20240307">Claude 3 Haiku (Fast & Lightweight)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* TAB 6: INSTALL SNIPPET */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        {activeTab === 'snippet' && (
          <div className="space-y-6 animate-rise">
            <div className="card p-6 space-y-6">
              <div className="flex items-start justify-between border-b border-line pb-4">
                <div>
                  <h3 className="text-[16px] font-semibold text-ink">Live Chat Embed Snippet</h3>
                  <p className="text-[12.5px] text-ink-3 mt-0.5">
                    Embed this script tag into the <code className="font-mono text-accent">&lt;head&gt;</code> or bottom of the <code className="font-mono text-accent">&lt;body&gt;</code> of any website.
                  </p>
                </div>
                <button
                  onClick={copySnippet}
                  className="btn btn-sm btn-primary gap-1.5 shadow-xs"
                >
                  {copiedSnippet ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedSnippet ? 'Copied!' : 'Copy Snippet'}</span>
                </button>
              </div>

              {/* Code Snippet Card */}
              <div className="relative rounded-2xl bg-slate-950 p-5 font-mono text-[12.5px] text-slate-200 border border-slate-800 shadow-lg overflow-x-auto">
                <pre>{installSnippetCode}</pre>
              </div>

              {/* Platform Guides */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-xl border border-line bg-surface-2 space-y-1.5">
                  <div className="font-semibold text-[13px] text-ink">Custom HTML / Next.js</div>
                  <p className="text-[11.5px] text-ink-3">
                    Paste right before the closing <code className="font-mono text-ink">&lt;/body&gt;</code> tag in your layout or HTML file.
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-line bg-surface-2 space-y-1.5">
                  <div className="font-semibold text-[13px] text-ink">Shopify / Webflow</div>
                  <p className="text-[11.5px] text-ink-3">
                    Paste into Project Settings &rarr; Custom Code &rarr; Footer Code.
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-line bg-surface-2 space-y-1.5">
                  <div className="font-semibold text-[13px] text-ink">WordPress</div>
                  <p className="text-[11.5px] text-ink-3">
                    Use any "Insert Headers and Footers" plugin to add the snippet into the footer.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* TAB 8: CUSTOM DOMAINS & PUBLIC HELP CENTER */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        {activeTab === 'domain' && (
          <div className="space-y-6 animate-rise">
            {/* 1. Live Resolved Help Center URL */}
            <div className="card p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent-soft text-accent flex items-center justify-center font-bold">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-semibold text-ink">Public Help Center URL</h3>
                    <p className="text-[12px] text-ink-3">
                      Your knowledge base is scoped specifically to your business domain.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5',
                      workspace.custom_domain_status === 'verified'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : workspace.custom_domain_status === 'failed'
                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                    )}
                  >
                    {workspace.custom_domain_status === 'verified' ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Verified &amp; Live</span>
                      </>
                    ) : workspace.custom_domain_status === 'failed' ? (
                      <>
                        <XCircle className="w-3.5 h-3.5" />
                        <span>DNS Check Failed</span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-3.5 h-3.5" />
                        <span>DNS Verification Pending</span>
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* Resolved URL Display */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-surface-2 border border-line">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[12px] text-ink-3 shrink-0 font-medium">Public URL:</span>
                  <a
                    href={getWorkspaceHelpCenterUrl(workspace)}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-[13px] font-semibold text-accent hover:underline truncate"
                  >
                    {getWorkspaceHelpCenterUrl(workspace)}
                  </a>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(getWorkspaceHelpCenterUrl(workspace));
                      setCopiedPublicUrl(true);
                      setTimeout(() => setCopiedPublicUrl(false), 2000);
                      showStatus('Help Center URL copied to clipboard!');
                    }}
                    className="btn btn-sm btn-secondary gap-1.5"
                  >
                    {copiedPublicUrl ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPublicUrl ? 'Copied' : 'Copy Link'}</span>
                  </button>

                  <a
                    href={getWorkspaceHelpCenterUrl(workspace)}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-sm btn-primary gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Live</span>
                  </a>
                </div>
              </div>
            </div>

            {/* 2. Custom Domain Configuration Form */}
            <div className="card p-6 space-y-5">
              <div className="border-b border-line pb-4">
                <h3 className="text-[15px] font-semibold text-ink">Configure Custom Help Center Domain</h3>
                <p className="text-[12px] text-ink-3">
                  Point a custom subdomain (e.g. <code className="font-mono text-ink">help.{cleanDomain(workspace.website_url) || 'yourcompany.com'}</code> or <code className="font-mono text-ink">support.{cleanDomain(workspace.website_url) || 'yourcompany.com'}</code>) directly to your Help Center.
                </p>
              </div>

              {/* Mode Selection */}
              <div className="space-y-2">
                <label className="field-label">Domain Mode</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setDomainMode('subdomain');
                      setCustomDomainInput(getDefaultSubdomain(workspace.website_url) || 'help.yourbrand.com');
                    }}
                    className={cn(
                      'p-3.5 rounded-xl border text-left transition-all',
                      domainMode === 'subdomain'
                        ? 'border-accent bg-accent-soft/30 text-ink ring-1 ring-accent'
                        : 'border-line bg-surface hover:bg-surface-2 text-ink-2'
                    )}
                  >
                    <div className="font-semibold text-[13px] text-ink flex items-center justify-between">
                      <span>Subdomain Mode</span>
                      {domainMode === 'subdomain' && <Check className="w-4 h-4 text-accent" />}
                    </div>
                    <p className="text-[11.5px] text-ink-3 mt-1">
                      help.{cleanDomain(workspace.website_url) || 'yourdomain.com'} (Recommended)
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDomainMode('custom')}
                    className={cn(
                      'p-3.5 rounded-xl border text-left transition-all',
                      domainMode === 'custom'
                        ? 'border-accent bg-accent-soft/30 text-ink ring-1 ring-accent'
                        : 'border-line bg-surface hover:bg-surface-2 text-ink-2'
                    )}
                  >
                    <div className="font-semibold text-[13px] text-ink flex items-center justify-between">
                      <span>Fully Custom Domain</span>
                      {domainMode === 'custom' && <Check className="w-4 h-4 text-accent" />}
                    </div>
                    <p className="text-[11.5px] text-ink-3 mt-1">
                      support.mycompany.com, kb.brand.io, docs.company.com
                    </p>
                  </button>
                </div>
              </div>

              {/* Domain Input Field */}
              <div className="space-y-2">
                <label className="field-label">Target Domain / Subdomain</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-2.5 text-[13px] text-ink-3 font-mono">https://</span>
                    <input
                      type="text"
                      value={customDomainInput}
                      onChange={(e) => setCustomDomainInput(e.target.value)}
                      placeholder="help.yourcompany.com"
                      className="input pl-20 font-mono text-[13px]"
                    />
                  </div>
                  <button
                    onClick={handleSaveDomain}
                    disabled={savingDomain}
                    className="btn btn-primary px-4 gap-1.5 shrink-0"
                  >
                    {savingDomain ? 'Saving…' : 'Save Domain'}
                  </button>
                </div>
                <p className="text-[11.5px] text-ink-3">
                  Do not include https:// or slashes. Example: <code className="font-mono">help.{cleanDomain(workspace.website_url) || 'mycompany.com'}</code>
                </p>
              </div>

              {/* DNS Verification Records Box */}
              {workspace.custom_domain && (
                <div className="pt-4 border-t border-line space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-[13.5px] font-semibold text-ink">Required DNS Records</h4>
                      <p className="text-[11.5px] text-ink-3">
                        Add these records to your DNS manager (Cloudflare, GoDaddy, Namecheap, Vercel, etc.).
                      </p>
                    </div>

                    <button
                      onClick={handleVerifyDomain}
                      disabled={verifyingDomain}
                      className="btn btn-sm btn-primary gap-1.5 shadow-sm"
                    >
                      <RefreshCw className={cn('w-3.5 h-3.5', verifyingDomain && 'animate-spin')} />
                      <span>{verifyingDomain ? 'Verifying DNS…' : 'Verify DNS Records'}</span>
                    </button>
                  </div>

                  {/* Verification result diagnostics */}
                  {verificationResult && (
                    <div
                      className={cn(
                        'p-3.5 rounded-xl border text-[12.5px] flex items-start gap-2.5 animate-in fade-in',
                        verificationResult.verified
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                          : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
                      )}
                    >
                      {verificationResult.verified ? (
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                      )}
                      <div>
                        <div className="font-semibold">
                          {verificationResult.verified ? 'Verification Successful!' : 'DNS Records Not Detected'}
                        </div>
                        <p className="mt-0.5 text-[11.5px] opacity-90">{verificationResult.details}</p>
                      </div>
                    </div>
                  )}

                  {/* Table of DNS Records */}
                  <div className="rounded-xl border border-line bg-surface overflow-hidden text-[12.5px]">
                    <div className="grid grid-cols-12 px-4 py-2.5 bg-surface-2 border-b border-line font-semibold text-ink-2 text-[11.5px]">
                      <div className="col-span-2">Type</div>
                      <div className="col-span-3">Host / Name</div>
                      <div className="col-span-5">Target / Value</div>
                      <div className="col-span-2 text-right">Action</div>
                    </div>

                    {/* CNAME RECORD */}
                    {(() => {
                      const records = getExpectedDnsRecords(workspace);
                      return (
                        <>
                          <div className="grid grid-cols-12 px-4 py-3 border-b border-line/60 items-center">
                            <div className="col-span-2 font-mono font-bold text-accent">CNAME</div>
                            <div className="col-span-3 font-mono text-ink truncate">{records.cname.name}</div>
                            <div className="col-span-5 font-mono text-ink truncate">{records.cname.value}</div>
                            <div className="col-span-2 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(records.cname.value);
                                  setCopiedCname(true);
                                  setTimeout(() => setCopiedCname(false), 2000);
                                  showStatus('CNAME target copied!');
                                }}
                                className="btn btn-xs btn-secondary"
                              >
                                {copiedCname ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                <span>{copiedCname ? 'Copied' : 'Copy'}</span>
                              </button>
                            </div>
                          </div>

                          {/* TXT RECORD */}
                          <div className="grid grid-cols-12 px-4 py-3 items-center">
                            <div className="col-span-2 font-mono font-bold text-amber-500">TXT</div>
                            <div className="col-span-3 font-mono text-ink truncate">{records.txt.name}</div>
                            <div className="col-span-5 font-mono text-ink truncate">{records.txt.value}</div>
                            <div className="col-span-2 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(records.txt.value);
                                  setCopiedToken(true);
                                  setTimeout(() => setCopiedToken(false), 2000);
                                  showStatus('TXT verification value copied!');
                                }}
                                className="btn btn-xs btn-secondary"
                              >
                                {copiedToken ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                <span>{copiedToken ? 'Copied' : 'Copy'}</span>
                              </button>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <p className="text-[11.5px] text-ink-3">
                      Note: DNS changes can take up to a few minutes to propagate across global DNS resolvers.
                    </p>

                    <button
                      type="button"
                      onClick={handleRemoveDomain}
                      className="text-[11.5px] text-rose-500 hover:underline flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove Custom Domain</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
