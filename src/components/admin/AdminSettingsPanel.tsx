'use client';

import React, { useState } from 'react';
import { testAiProviderAction } from '@/app/actions/knowledge';
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
  BookOpen,
  Link as LinkIcon,
  LayoutGrid,
  Grid3X3,
  Columns4,
  Rows3,
  Mail,
  Monitor,
  Smartphone,
  Laptop,
  Eye,
} from 'lucide-react';
import { SMTPSettingsSection } from '@/components/admin/SMTPSettingsSection';
import {
  Workspace,
  Agent,
  CannedResponse,
  BusinessHoursConfig,
  AutoAssignmentConfig,
  AISettingsConfig,
  NavbarTriggerConfig,
} from '@/types/database';
import {
  updateWidgetSettingsAction,
  updateBusinessHoursAction,
  updateAutoAssignmentRulesAction,
  updateAISettingsAction,
  updateHelpCenterBrandingAction,
  updateNavbarTriggerConfigAction,
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
  | 'helpcenter'
  | 'domain'
  | 'hours'
  | 'team'
  | 'canned'
  | 'assignment'
  | 'ai'
  | 'email'
  | 'snippet';

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
  const [showLauncherLogo, setShowLauncherLogo] = useState(
    workspace.show_launcher_logo !== false
  );
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
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [widgetVisibilityDevice, setWidgetVisibilityDevice] = useState<'all' | 'desktop' | 'mobile'>('all');
  const [showOnlineStatusBadge, setShowOnlineStatusBadge] = useState<boolean>(true);

  const handleSaveWidget = async () => {
    setSaving(true);
    try {
      const res = await updateWidgetSettingsAction(workspace.id, {
        brand_color: brandColor,
        logo_url: logoUrl,
        show_launcher_logo: showLauncherLogo,
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
  // SECTION: HELP CENTER BRANDING STATE
  // ──────────────────────────────────────────────────────────────────────────
  const [helpCenterTitle, setHelpCenterTitle] = useState(workspace.help_center_title || '');
  const [helpCenterSubtitle, setHelpCenterSubtitle] = useState(workspace.help_center_subtitle || '');
  const [helpCenterLogoUrl, setHelpCenterLogoUrl] = useState(workspace.help_center_logo_url || '');
  const [helpCenterHeaderLinks, setHelpCenterHeaderLinks] = useState<
    Array<{ label: string; url: string; target?: string }>
  >(
    Array.isArray(workspace.help_center_header_links)
      ? (workspace.help_center_header_links as any)
      : []
  );
  const [helpCenterFooterText, setHelpCenterFooterText] = useState(workspace.help_center_footer_text || '');
  const [helpCenterLayout, setHelpCenterLayout] = useState<'grid-2' | 'grid-3' | 'grid-4' | 'list'>(
    (workspace as any).help_center_layout || 'grid-2'
  );
  const [savingHelpCenter, setSavingHelpCenter] = useState(false);
  const [newLinkLabel, setNewLinkLabel] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkTarget, setNewLinkTarget] = useState<'_blank' | '_self'>('_blank');

  const handleSaveHelpCenter = async () => {
    setSavingHelpCenter(true);
    try {
      const res = await updateHelpCenterBrandingAction(workspace.id, {
        help_center_title: helpCenterTitle.trim() || null,
        help_center_subtitle: helpCenterSubtitle.trim() || null,
        help_center_logo_url: helpCenterLogoUrl.trim() || null,
        help_center_header_links: helpCenterHeaderLinks,
        help_center_footer_text: helpCenterFooterText.trim() || null,
        help_center_layout: helpCenterLayout,
      });

      if (res.workspace) {
        setWorkspace(res.workspace);
        onWorkspaceUpdated?.(res.workspace);
        showStatus('Help Center branding saved successfully!');
      }
    } catch (err: any) {
      showStatus(err.message || 'Failed to save Help Center branding', 'error');
    } finally {
      setSavingHelpCenter(false);
    }
  };

  const handleAddHeaderLink = () => {
    if (!newLinkLabel.trim() || !newLinkUrl.trim()) return;
    setHelpCenterHeaderLinks((prev) => [
      ...prev,
      {
        label: newLinkLabel.trim(),
        url: newLinkUrl.trim(),
        target: newLinkTarget,
      },
    ]);
    setNewLinkLabel('');
    setNewLinkUrl('');
    setNewLinkTarget('_blank');
  };

  const handleRemoveHeaderLink = (index: number) => {
    setHelpCenterHeaderLinks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleHelpCenterLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
        setHelpCenterLogoUrl(data.url);
        showStatus('Help Center logo uploaded!');
      } else {
        showStatus(data.error || 'Upload failed', 'error');
      }
    } catch {
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
    if (!inviteName.trim() || !inviteEmail.trim()) return;

    setInviting(true);
    try {
      const res = await inviteAgentAction(workspace.id, {
        name: inviteName.trim(),
        email: inviteEmail.trim(),
        role: inviteRole,
      });

      if (!res.success) {
        showStatus(res.error || 'Failed to invite agent', 'error');
        return;
      }

      if (res.agent) {
        setAgents((prev) => {
          const exists = prev.some((a) => a.id === res.agent!.id);
          if (exists) {
            return prev.map((a) => (a.id === res.agent!.id ? res.agent! : a));
          }
          return [...prev, res.agent!];
        });
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
      if (!res.success) {
        showStatus(res.error || 'Failed to update agent role', 'error');
        return;
      }
      if (res.agent) {
        setAgents((prev) => prev.map((a) => (a.id === agentId ? res.agent! : a)));
        showStatus(`Updated role to ${newRole}`);
      }
    } catch (err: any) {
      showStatus(err.message || 'Failed to update agent role', 'error');
    }
  };

  const handleRemoveAgent = async (agentId: string, agentName: string) => {
    if (!confirm(`Are you sure you want to remove ${agentName} from the workspace?`)) return;

    try {
      const res = await removeAgentAction(workspace.id, agentId);
      if (!res.success) {
        showStatus(res.error || 'Failed to remove agent', 'error');
        return;
      }
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
  const [aiSettings, setAiSettings] = useState<AISettingsConfig>({
    enabled: true,
    auto_response_enabled: true,
    auto_response_delay_seconds: 20,
    suggested_replies_enabled: true,
    auto_tagging_enabled: true,
    summary_enabled: true,
    sentiment_enabled: true,
    provider: 'anthropic',
    api_key: '',
    base_url: '',
    anthropic_api_key: '',
    model: 'claude-3-5-sonnet-20241022',
    ...(workspace.ai_settings || {}),
  });

  const [testingProvider, setTestingProvider] = useState(false);
  const [providerTest, setProviderTest] = useState<{
    ok: boolean;
    model?: string;
    error?: string;
    warning?: string;
  } | null>(null);

  const handleTestAiProvider = async () => {
    setTestingProvider(true);
    setProviderTest(null);
    try {
      // Tests what is on screen, including a key typed but not yet saved —
      // otherwise the owner has to save a possibly-wrong key to find out.
      const res = await testAiProviderAction(workspace.id, {
        provider: (aiSettings.provider || 'anthropic') as any,
        model: aiSettings.model || null,
        apiKey: aiSettings.api_key || null,
        baseUrl: aiSettings.base_url || null,
      });
      setProviderTest(res);
    } catch (err: any) {
      setProviderTest({ ok: false, error: err?.message || 'Test failed' });
    } finally {
      setTestingProvider(false);
    }
  };

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
  const origin =
    typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_ORIGIN || '';
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
    status: 'verified' | 'pending' | 'failed';
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
        } else if (res.data.status === 'pending') {
          showStatus('DNS records detected! Verification in progress.');
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

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 9: ZERO-CODE NAVBAR AUTO-TRIGGER BUTTON STATE & HANDLER
  // ──────────────────────────────────────────────────────────────────────────
  const [navbarConfig, setNavbarConfig] = useState<NavbarTriggerConfig>(
    workspace.navbar_trigger_config || {
      enabled: false,
      label: 'FAQ',
      action: 'help',
      auto_inject: false,
      style: 'navbar_link',
    }
  );
  const [savingNavbar, setSavingNavbar] = useState(false);

  const handleSaveNavbarConfig = async () => {
    setSavingNavbar(true);
    try {
      const res = await updateNavbarTriggerConfigAction(workspace.id, navbarConfig);
      if (res.workspace) {
        setWorkspace(res.workspace);
        onWorkspaceUpdated?.(res.workspace);
        showStatus('Navbar button updated! Changes are live on your website.');
      }
    } catch (err: any) {
      showStatus(err.message || 'Failed to update navbar button settings', 'error');
    } finally {
      setSavingNavbar(false);
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
          { id: 'helpcenter', label: 'Help Center Branding', icon: BookOpen },
          { id: 'domain', label: 'Custom Domains', icon: Globe },
          { id: 'hours', label: 'Business Hours', icon: Clock },
          { id: 'team', label: 'Team & Roles', icon: Users, badge: agents.length },
          { id: 'canned', label: 'Canned Replies', icon: MessageSquareText, badge: cannedResponses.length },
          { id: 'assignment', label: 'Auto-Assignment', icon: Sliders },
          { id: 'ai', label: 'AI assistant', icon: Sparkles },
          { id: 'email', label: 'Email & Hostinger SMTP', icon: Mail },
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

      {/* Global Status Message Toast / Banner for both Embedded and Standalone */}
      {statusMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-rise pointer-events-none">
          <div
            className={`px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-2.5 shadow-2xl border ${
              statusMessage.type === 'success'
                ? 'bg-emerald-600 text-white border-emerald-500'
                : 'bg-rose-600 text-white border-rose-500'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-white shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        </div>
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
              {/* Header Action Bar */}
              <div className="card p-5.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface border-2 border-line-2 shadow-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-xs" />
                    <h3 className="text-[17px] font-extrabold text-ink tracking-tight">
                      Live Chat Widget Configuration
                    </h3>
                  </div>
                  <p className="text-[13px] text-ink-2 mt-0.5">
                    Customize brand colors, logo, floating launcher button &amp; greetings in real time.
                  </p>
                </div>
                <button
                  onClick={handleSaveWidget}
                  disabled={saving}
                  className="btn btn-sm btn-primary gap-2 shadow-md font-bold px-4 py-2 shrink-0 text-[13px]"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving…</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Save All Changes</span>
                    </>
                  )}
                </button>
              </div>

              {/* Step 1: Brand Color & Visual Theme */}
              <div className="card p-6 space-y-5 border-2 border-line-2 shadow-xs">
                <div className="flex items-center gap-3 border-b border-line-2 pb-4">
                  <span className="w-7 h-7 rounded-xl bg-accent text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-xs">
                    1
                  </span>
                  <div>
                    <h4 className="text-[15px] font-bold text-ink">Brand Color &amp; Accent</h4>
                    <p className="text-[12.5px] text-ink-2 mt-0.5">
                      Themes the widget header, floating launcher button, and active chat elements.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3.5">
                    <div className="relative flex items-center">
                      <input
                        type="color"
                        value={brandColor}
                        onChange={(e) => setBrandColor(e.target.value)}
                        className="w-12 h-12 rounded-xl border-2 border-line-2 cursor-pointer p-0.5 bg-surface-2 shadow-xs hover:border-accent transition-colors"
                        title="Pick custom color"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={brandColor}
                          onChange={(e) => setBrandColor(e.target.value)}
                          placeholder="#2563eb"
                          className="input w-36 font-mono font-bold text-sm uppercase text-ink border-2 border-line-2 focus:border-accent shadow-xs"
                        />
                        <span className="text-[12px] font-semibold text-ink-2">Custom Hex Code</span>
                      </div>
                    </div>
                  </div>

                  {/* Preset Swatches */}
                  <div>
                    <div className="text-[11.5px] font-extrabold text-ink-2 uppercase tracking-wider mb-2.5">
                      Popular Brand Themes
                    </div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      {[
                        { color: '#2563eb', label: 'Chatify Blue' },
                        { color: '#0d9488', label: 'Teal' },
                        { color: '#10b981', label: 'Emerald' },
                        { color: '#8b5cf6', label: 'Violet' },
                        { color: '#ec4899', label: 'Pink' },
                        { color: '#f97316', label: 'Orange' },
                        { color: '#0f172a', label: 'Midnight Slate' },
                      ].map(({ color, label }) => {
                        const isSelected = brandColor.toLowerCase() === color.toLowerCase();
                        return (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setBrandColor(color)}
                            className={cn(
                              'flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 text-[12px] font-bold transition-all shadow-2xs',
                              isSelected
                                ? 'border-accent bg-accent/15 text-accent ring-2 ring-accent/30 shadow-xs'
                                : 'border-line-2 bg-surface hover:bg-surface-2 text-ink hover:border-line-3'
                            )}
                          >
                            <span
                              className="w-3.5 h-3.5 rounded-full shrink-0 border border-black/20 shadow-xs"
                              style={{ backgroundColor: color }}
                            />
                            <span>{label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2: Logo & Floating Launcher Button */}
              <div className="card p-6 space-y-5 border-2 border-line-2 shadow-xs">
                <div className="flex items-center gap-3 border-b border-line-2 pb-4">
                  <span className="w-7 h-7 rounded-xl bg-accent text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-xs">
                    2
                  </span>
                  <div>
                    <h4 className="text-[15px] font-bold text-ink">Logo &amp; Floating Launcher Icon</h4>
                    <p className="text-[12.5px] text-ink-2 mt-0.5">
                      Display your company logo inside the chat and on the website button.
                    </p>
                  </div>
                </div>

                {/* Logo Image Upload */}
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 rounded-2xl border-2 border-line-2 bg-surface-2 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <MessageSquare className="w-8 h-8 text-ink-2" />
                    )}
                  </div>
                  <div className="space-y-2.5 flex-1">
                    <div className="flex items-center gap-2.5">
                      <label className="btn btn-sm btn-secondary font-bold text-xs cursor-pointer inline-flex items-center gap-2 border-2 border-line-2 hover:border-line-3 shadow-xs">
                        <Upload className="w-4 h-4 text-accent" />
                        <span>Upload New Logo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                      </label>
                      {logoUrl && (
                        <button
                          type="button"
                          onClick={() => setLogoUrl('')}
                          className="text-[12px] font-semibold text-rose-500 hover:text-rose-600 hover:underline px-2 py-1"
                        >
                          Remove Logo
                        </button>
                      )}
                    </div>
                    <input
                      type="url"
                      placeholder="Or paste direct image URL (https://example.com/logo.png)"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      className="input text-[12.5px] border-2 border-line-2 focus:border-accent text-ink font-medium"
                    />
                    <p className="text-[11.5px] text-ink-2">
                      Recommended: 256x256 square PNG, JPG or SVG with a clean transparent or solid background.
                    </p>
                  </div>
                </div>

                {/* Toggle: Show Logo on Floating Launcher Button */}
                <div className="p-4.5 rounded-2xl border-2 border-line-2 bg-surface-2/70 space-y-3.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5 pr-4">
                      <div className="flex items-center gap-2.5">
                        <label
                          className="text-[14px] font-bold text-ink cursor-pointer"
                          htmlFor="toggle-launcher-logo"
                        >
                          Show Company Logo on Floating Chat Button
                        </label>
                        <span
                          className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full shadow-2xs ${
                            showLauncherLogo
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-300 dark:bg-slate-700 text-ink'
                          }`}
                        >
                          {showLauncherLogo ? 'ACTIVE (ON)' : 'MUTED (OFF)'}
                        </span>
                      </div>
                      <p className="text-[12px] text-ink-2">
                        Choose whether visitors see your company logo or a classic chat bubble icon before clicking.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        id="toggle-launcher-logo"
                        type="checkbox"
                        checked={showLauncherLogo}
                        onChange={(e) => setShowLauncherLogo(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-12 h-6.5 bg-line-2 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5.5 after:w-5.5 after:transition-all peer-checked:bg-accent shadow-xs"></div>
                    </label>
                  </div>

                  {/* Visual Comparison Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-line-2">
                    <div
                      className={cn(
                        'p-3 rounded-xl border-2 text-xs flex items-center gap-3 transition-all',
                        showLauncherLogo
                          ? 'border-emerald-500 bg-emerald-500/10 text-ink font-semibold shadow-xs ring-1 ring-emerald-500/20'
                          : 'border-line-2 bg-surface opacity-75 text-ink-2'
                      )}
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-md ring-2 ring-white/50"
                        style={{ backgroundColor: brandColor }}
                      >
                        {logoUrl ? (
                          <img src={logoUrl} alt="Logo" className="w-5 h-5 rounded-full object-cover" />
                        ) : (
                          <span className="text-[10px] text-white font-extrabold">Logo</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-[12px] text-ink flex items-center gap-1.5">
                          <span>Logo Icon Mode</span>
                          {showLauncherLogo && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                        </div>
                        <div className="text-[11px] text-ink-2 truncate">Displays your uploaded logo</div>
                      </div>
                    </div>

                    <div
                      className={cn(
                        'p-3 rounded-xl border-2 text-xs flex items-center gap-3 transition-all',
                        !showLauncherLogo
                          ? 'border-emerald-500 bg-emerald-500/10 text-ink font-semibold shadow-xs ring-1 ring-emerald-500/20'
                          : 'border-line-2 bg-surface opacity-75 text-ink-2'
                      )}
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-md ring-2 ring-white/50"
                        style={{ backgroundColor: brandColor }}
                      >
                        <MessageSquare className="w-4 h-4 text-white" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-[12px] text-ink flex items-center gap-1.5">
                          <span>Classic Bubble Mode</span>
                          {!showLauncherLogo && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                        </div>
                        <div className="text-[11px] text-ink-2 truncate">Standard chat bubble icon</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3: Screen Placement */}
              <div className="card p-6 space-y-4 border-2 border-line-2 shadow-xs">
                <div className="flex items-center gap-3 border-b border-line-2 pb-4">
                  <span className="w-7 h-7 rounded-xl bg-accent text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-xs">
                    3
                  </span>
                  <div>
                    <h4 className="text-[15px] font-bold text-ink">Screen Placement</h4>
                    <p className="text-[12.5px] text-ink-2 mt-0.5">
                      Position of the floating chat launcher on your website.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <button
                    type="button"
                    onClick={() => setWidgetPosition('right')}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${
                      widgetPosition === 'right'
                        ? 'border-accent bg-accent/10 ring-2 ring-accent/30 text-ink shadow-sm'
                        : 'border-line-2 bg-surface hover:bg-surface-2 text-ink-2'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {widgetPosition === 'right' ? (
                          <CheckCircle2 className="w-4 h-4 text-accent" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border-2 border-line-2" />
                        )}
                        <span className="font-bold text-[13.5px] text-ink">Bottom Right</span>
                      </div>
                      <span className="text-[10.5px] px-2 py-0.5 rounded-full bg-accent text-white font-extrabold shadow-2xs">
                        Recommended
                      </span>
                    </div>
                    <div className="text-ink-2 text-[12px] leading-relaxed pl-6">
                      Standard placement on 95% of websites. Maximum visibility for visitors.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setWidgetPosition('left')}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${
                      widgetPosition === 'left'
                        ? 'border-accent bg-accent/10 ring-2 ring-accent/30 text-ink shadow-sm'
                        : 'border-line-2 bg-surface hover:bg-surface-2 text-ink-2'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {widgetPosition === 'left' ? (
                          <CheckCircle2 className="w-4 h-4 text-accent" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border-2 border-line-2" />
                        )}
                        <span className="font-bold text-[13.5px] text-ink">Bottom Left</span>
                      </div>
                      <span className="text-[10.5px] px-2 py-0.5 rounded-full bg-surface-3 text-ink-2 font-bold border border-line-2">
                        Alternate
                      </span>
                    </div>
                    <div className="text-ink-2 text-[12px] leading-relaxed pl-6">
                      Great if your website already has a WhatsApp button or Back-to-Top on the right.
                    </div>
                  </button>
                </div>
              </div>

              {/* Step 4: Greetings & Welcome Message */}
              <div className="card p-6 space-y-4 border-2 border-line-2 shadow-xs">
                <div className="flex items-center gap-3 border-b border-line-2 pb-4">
                  <span className="w-7 h-7 rounded-xl bg-accent text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-xs">
                    4
                  </span>
                  <div>
                    <h4 className="text-[15px] font-bold text-ink">Greeting &amp; Welcome Message</h4>
                    <p className="text-[12.5px] text-ink-2 mt-0.5">
                      The first messages visitors read when opening the live chat.
                    </p>
                  </div>
                </div>

                <div className="space-y-3.5">
                  <div>
                    <label className="field-label text-ink font-bold text-[13px]">Greeting Title</label>
                    <input
                      type="text"
                      value={greetingTitle}
                      onChange={(e) => setGreetingTitle(e.target.value)}
                      placeholder="Hi there 👋"
                      className="input text-sm font-semibold border-2 border-line-2 focus:border-accent text-ink"
                    />
                  </div>
                  <div>
                    <label className="field-label text-ink font-bold text-[13px]">Welcome Message Text</label>
                    <textarea
                      rows={3}
                      value={greetingMessage}
                      onChange={(e) => setGreetingMessage(e.target.value)}
                      placeholder="We're here to help! Ask us anything or browse our quick answers."
                      className="input resize-none text-[13px] leading-relaxed border-2 border-line-2 focus:border-accent text-ink"
                    />
                  </div>
                </div>
              </div>

              {/* Step 5: In-Widget Self-Service Help Desk Tab */}
              <div className="card p-6 space-y-4 border-2 border-line-2 shadow-xs">
                <div className="flex items-center gap-3 border-b border-line-2 pb-4">
                  <span className="w-7 h-7 rounded-xl bg-accent text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-xs">
                    5
                  </span>
                  <div>
                    <h4 className="text-[15px] font-bold text-ink">Self-Service Help Center Tab</h4>
                    <p className="text-[12.5px] text-ink-2 mt-0.5">
                      Allow visitors to browse knowledge base articles directly inside the chat window.
                    </p>
                  </div>
                </div>

                <div className="space-y-3.5">
                  <div className="flex items-center justify-between p-4 rounded-xl border-2 border-line-2 bg-surface-2/70 shadow-2xs">
                    <div>
                      <div className="text-[13.5px] font-bold text-ink">Show Help Tab in Widget</div>
                      <p className="text-[12px] text-ink-2">
                        Visitors can search helpful articles without leaving the chat launcher.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showHelpTab}
                        onChange={(e) => setShowHelpTab(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-line-2 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent shadow-xs"></div>
                    </label>
                  </div>

                  <div>
                    <label className="field-label text-ink font-bold text-[13px]">Help Tab Custom Button Label</label>
                    <input
                      type="text"
                      value={helpTabLabel}
                      onChange={(e) => setHelpTabLabel(e.target.value)}
                      placeholder="e.g. Help, FAQs, Guides"
                      className="input text-sm border-2 border-line-2 focus:border-accent text-ink font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Step 6: Widget Visibility & Device Display Rules */}
              <div className="card p-6 space-y-4 border-2 border-line-2 shadow-xs">
                <div className="flex items-center gap-3 border-b border-line-2 pb-4">
                  <span className="w-7 h-7 rounded-xl bg-accent text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-xs">
                    6
                  </span>
                  <div>
                    <h4 className="text-[15px] font-bold text-ink">Widget Visibility &amp; Device Rules</h4>
                    <p className="text-[12.5px] text-ink-2 mt-0.5">
                      Control which devices show the widget and configure live presence visibility.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Device Visibility Selector */}
                  <div>
                    <label className="field-label text-ink font-bold text-[13px] mb-2.5 flex items-center justify-between">
                      <span>Device Visibility</span>
                      <span className="text-[11.5px] text-accent font-semibold">Active: {widgetVisibilityDevice === 'all' ? 'All Devices' : widgetVisibilityDevice === 'desktop' ? 'Desktop Only' : 'Mobile Only'}</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2.5">
                      {[
                        { id: 'all', label: 'All Devices', sub: 'Desktop + Mobile', icon: Monitor },
                        { id: 'desktop', label: 'Desktop Only', sub: 'Laptops & PCs', icon: Laptop },
                        { id: 'mobile', label: 'Mobile Only', sub: 'Phones & Tablets', icon: Smartphone },
                      ].map((item) => {
                        const Icon = item.icon;
                        const isSelected = widgetVisibilityDevice === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              setWidgetVisibilityDevice(item.id as any);
                              if (item.id === 'mobile') setPreviewDevice('mobile');
                              if (item.id === 'desktop') setPreviewDevice('desktop');
                            }}
                            className={cn(
                              'p-3 rounded-xl border-2 text-center flex flex-col items-center gap-1.5 transition-all shadow-2xs',
                              isSelected
                                ? 'border-accent bg-accent/15 ring-2 ring-accent/30 text-accent font-bold shadow-xs'
                                : 'border-line-2 bg-surface hover:bg-surface-2 text-ink-2 hover:text-ink'
                            )}
                          >
                            <Icon className="w-5 h-5" />
                            <div className="text-[12px] font-bold leading-tight">{item.label}</div>
                            <div className="text-[10px] text-ink-2 leading-none font-medium">{item.sub}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Online Presence Status Toggle */}
                  <div className="flex items-center justify-between p-4 rounded-xl border-2 border-line-2 bg-surface-2/80 shadow-2xs">
                    <div>
                      <div className="text-[13.5px] font-bold text-ink flex items-center gap-2">
                        <span>Show Live Presence Indicator</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
                      </div>
                      <p className="text-[12px] text-ink-2 mt-0.5">
                        Display a green &ldquo;We reply immediately&rdquo; status badge in the chat window header.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={showOnlineStatusBadge}
                        onChange={(e) => setShowOnlineStatusBadge(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-line-2 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent shadow-xs"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Bottom Sticky Save Bar */}
              <div className="sticky bottom-6 z-10 card p-4.5 flex items-center justify-between bg-surface/95 backdrop-blur-md border-2 border-line-2 shadow-xl">
                <div className="flex items-center gap-2.5 text-xs text-ink font-semibold">
                  <Sparkles className="w-4 h-4 text-accent shrink-0" />
                  <span>Changes apply to your website immediately after clicking save.</span>
                </div>
                <button
                  onClick={handleSaveWidget}
                  disabled={saving}
                  className="btn btn-sm btn-primary gap-2 shadow-md font-bold px-6 py-2.5 shrink-0 text-[13px]"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving…</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right Column: Interactive Live Preview with Realistic Browser Frame */}
            <div className="lg:col-span-5 sticky top-28 space-y-3">
              <div className="panel p-4 space-y-3 bg-surface border-2 border-line-2 shadow-md">
                <div className="flex items-center justify-between border-b border-line-2 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-accent" />
                    <span className="text-[14px] font-extrabold text-ink">Interactive Live Preview</span>
                  </div>

                  {/* Device Toggle + Open/Close */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-surface-2 p-0.5 rounded-lg border border-line-2">
                      <button
                        type="button"
                        onClick={() => setPreviewDevice('desktop')}
                        className={cn(
                          'p-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1',
                          previewDevice === 'desktop'
                            ? 'bg-surface text-accent shadow-xs'
                            : 'text-ink-2 hover:text-ink'
                        )}
                        title="Desktop view"
                      >
                        <Laptop className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Desktop</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewDevice('mobile')}
                        className={cn(
                          'p-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1',
                          previewDevice === 'mobile'
                            ? 'bg-surface text-accent shadow-xs'
                            : 'text-ink-2 hover:text-ink'
                        )}
                        title="Mobile view"
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Mobile</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setPreviewOpen(!previewOpen)}
                      className="text-[12px] font-bold text-accent hover:underline px-2.5 py-1 rounded-md hover:bg-accent/10 border border-accent/20"
                    >
                      {previewOpen ? 'Minimize' : 'Open'}
                    </button>
                  </div>
                </div>

                {/* Realistic Simulated Webpage Canvas */}
                <div
                  className={cn(
                    'relative h-[530px] rounded-2xl bg-canvas border-2 border-line-2 overflow-hidden flex flex-col justify-between shadow-inner transition-all duration-300',
                    previewDevice === 'mobile' ? 'max-w-[340px] mx-auto ring-4 ring-black/10 dark:ring-white/10' : 'w-full'
                  )}
                >
                  {/* Browser Window Title Bar */}
                  <div className="h-8.5 bg-surface border-b border-line-2 px-3 flex items-center gap-2 shrink-0 select-none shadow-2xs">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block shadow-2xs" />
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block shadow-2xs" />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shadow-2xs" />
                    </div>
                    <div className="flex-1 max-w-[220px] mx-auto h-5.5 rounded-md bg-surface-2 border border-line-2 px-2.5 flex items-center justify-center gap-1.5 text-[11px] font-mono text-ink font-semibold truncate shadow-2xs">
                      <Globe className="w-3 h-3 text-accent shrink-0" />
                      <span className="truncate">{cleanDomain(workspace.website_url) || 'yourwebsite.com'}</span>
                    </div>
                  </div>

                  {/* Simulated Website Hero Mockup (Crisp & High Contrast) */}
                  <div className="p-4 space-y-3.5 select-none overflow-hidden">
                    <div className="flex items-center justify-between pb-2 border-b-2 border-line-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-[11px] text-white font-extrabold shadow-xs"
                          style={{ backgroundColor: brandColor }}
                        >
                          {(workspace.name || 'W').charAt(0)}
                        </div>
                        <span className="font-extrabold text-[13px] text-ink">{workspace.name}</span>
                      </div>
                      <div className="flex gap-2.5 text-[11px] text-ink-2 font-semibold">
                        <span className="text-ink font-bold border-b border-ink">Home</span>
                        <span>Catalog</span>
                        <span>Support</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-surface border-2 border-line-2 shadow-xs space-y-2 mt-2">
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10.5px] font-bold text-emerald-700 dark:text-emerald-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                        <span>Support Team Available</span>
                      </div>
                      <div className="font-extrabold text-[14px] text-ink leading-tight">Welcome to our Online Store</div>
                      <p className="text-[12px] text-ink-2 leading-relaxed font-normal">
                        Have a question about an order, shipment, or feature? Chat with our team in real-time.
                      </p>
                      <div className="pt-1 flex gap-2">
                        <div
                          className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-white shadow-xs cursor-default"
                          style={{ backgroundColor: brandColor }}
                        >
                          Explore Products
                        </div>
                        <div className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-surface-2 border border-line-2 text-ink cursor-default">
                          Contact Sales
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Opened Widget Window Preview */}
                  {previewOpen && (
                    <div
                      className={cn(
                        'absolute bottom-16 rounded-2xl bg-surface shadow-2xl border-2 border-line-2 overflow-hidden animate-rise flex flex-col z-20',
                        previewDevice === 'mobile'
                          ? 'inset-x-2 bottom-14 max-h-[440px]'
                          : widgetPosition === 'right'
                          ? 'right-3 w-76 max-h-[400px]'
                          : 'left-3 w-76 max-h-[400px]'
                      )}
                    >
                      {/* Widget Header */}
                      <div
                        className="p-3.5 text-white flex items-center justify-between shadow-xs shrink-0"
                        style={{ backgroundColor: brandColor }}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8.5 h-8.5 rounded-full bg-white/20 border border-white/40 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                            {logoUrl ? (
                              <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                            ) : (
                              <img src="/chat-icon-white.png" alt="Logo" className="w-5.5 h-5.5 object-contain" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-extrabold text-[13px] leading-tight truncate text-white drop-shadow-xs">
                              {workspace.name}
                            </div>
                            {showOnlineStatusBadge && (
                              <div className="text-[10.5px] text-white/95 flex items-center gap-1 font-semibold">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 inline-block animate-pulse" />
                                <span>We reply immediately</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => setPreviewOpen(false)}
                          className="text-white/90 hover:text-white p-1 rounded-lg hover:bg-white/15 transition-colors"
                          title="Minimize preview"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Widget Body */}
                      <div className="p-3.5 space-y-3 flex-1 overflow-y-auto bg-surface-2/70 text-xs">
                        {/* Welcome Card */}
                        <div className="p-3.5 rounded-xl bg-surface border-2 border-line-2 shadow-xs space-y-1">
                          <div className="font-extrabold text-[13.5px] text-ink">{greetingTitle}</div>
                          <p className="text-ink-2 text-[12px] leading-relaxed font-normal">
                            {greetingMessage}
                          </p>
                        </div>

                        {/* Sample Bot/Agent Bubble */}
                        <div className="flex gap-2 items-start">
                          <div
                            className="w-6.5 h-6.5 rounded-full flex items-center justify-center text-[10.5px] text-white font-extrabold shrink-0 shadow-xs"
                            style={{ backgroundColor: brandColor }}
                          >
                            {(workspace.name || 'A').charAt(0)}
                          </div>
                          <div className="p-3 rounded-2xl rounded-tl-xs bg-surface border-2 border-line-2 text-ink text-[12px] shadow-xs font-semibold leading-relaxed">
                            How can our support team assist you today?
                          </div>
                        </div>

                        {/* Self Service Help Center preview pill if enabled */}
                        {showHelpTab && (
                          <div className="p-2.5 rounded-xl bg-accent/10 border border-accent/25 flex items-center justify-between text-[11.5px] text-accent font-bold">
                            <span className="flex items-center gap-1.5">
                              <BookOpen className="w-3.5 h-3.5" />
                              <span>{helpTabLabel || 'Help Articles'}</span>
                            </span>
                            <span className="text-[10px] bg-accent text-white px-2 py-0.5 rounded-md font-extrabold">Instant</span>
                          </div>
                        )}
                      </div>

                      {/* Widget Footer Input */}
                      <div className="p-2.5 bg-surface border-t-2 border-line-2 flex items-center gap-2 shrink-0">
                        <input
                          type="text"
                          disabled
                          placeholder="Send a message…"
                          className="flex-1 text-[12px] px-3 py-1.5 rounded-lg bg-surface-2 border border-line-2 text-ink placeholder:text-ink-2 outline-none font-medium"
                        />
                        <button
                          type="button"
                          style={{ backgroundColor: brandColor }}
                          className="w-8 h-8 rounded-lg text-white flex items-center justify-center shrink-0 shadow-xs"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Floating Launcher Bubble */}
                  <div
                    className={cn(
                      'absolute bottom-3 z-10',
                      previewDevice === 'mobile'
                        ? 'right-3'
                        : widgetPosition === 'right'
                        ? 'right-4'
                        : 'left-4'
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => setPreviewOpen(!previewOpen)}
                      style={{ backgroundColor: brandColor }}
                      className="w-13 h-13 rounded-full text-white flex items-center justify-center shadow-2xl ring-4 ring-black/15 dark:ring-white/15 transition-transform hover:scale-105 active:scale-95"
                      title={previewOpen ? 'Close widget preview' : 'Open widget preview'}
                    >
                      {previewOpen ? (
                        <X className="w-5.5 h-5.5 text-white" />
                      ) : showLauncherLogo && logoUrl ? (
                        <img
                          src={logoUrl}
                          alt="Chat"
                          className="w-8.5 h-8.5 rounded-full object-cover bg-white p-0.5 shadow-sm"
                        />
                      ) : (
                        <img
                          src="/chat-icon-white.png"
                          alt="Chat"
                          className="w-6.5 h-6.5 object-contain"
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
        {/* TAB: HELP CENTER BRANDING & LIVE PREVIEW */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        {activeTab === 'helpcenter' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-rise">
            {/* Left Column: Form Controls */}
            <div className="lg:col-span-7 space-y-6">
              {/* Card 1: Identity & Messaging */}
              <div className="card p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-line pb-4">
                  <div>
                    <h3 className="text-[15px] font-semibold text-ink">Help Center Identity</h3>
                    <p className="text-[12px] text-ink-3">
                      Customize your public knowledge base branding, titles, and messaging.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={getWorkspaceHelpCenterUrl(workspace)}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-xs btn-secondary gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Live Site</span>
                    </a>
                    <button
                      onClick={handleSaveHelpCenter}
                      disabled={savingHelpCenter}
                      className="btn btn-sm btn-primary gap-1.5 shadow-xs"
                    >
                      {savingHelpCenter ? 'Saving…' : 'Save Changes'}
                    </button>
                  </div>
                </div>

                {/* Help Center Title */}
                <div>
                  <label className="field-label">Help Center Title</label>
                  <input
                    type="text"
                    value={helpCenterTitle}
                    onChange={(e) => setHelpCenterTitle(e.target.value)}
                    placeholder={`${workspace.name} Help Center`}
                    className="input"
                  />
                  <p className="text-[11.5px] text-ink-3 mt-1">
                    Appears in the header navigation, browser tab, and search engine previews.
                  </p>
                </div>

                {/* Help Center Subtitle / Tagline */}
                <div>
                  <label className="field-label">Hero Search Subtitle / Tagline</label>
                  <textarea
                    rows={2}
                    value={helpCenterSubtitle}
                    onChange={(e) => setHelpCenterSubtitle(e.target.value)}
                    placeholder="Search our guides, troubleshooting steps, and documentation for instant answers."
                    className="input resize-none"
                  />
                  <p className="text-[11.5px] text-ink-3 mt-1">
                    Displayed prominently below the main heading in the hero search area.
                  </p>
                </div>

                {/* Custom Logo */}
                <div>
                  <label className="field-label">Help Center Logo</label>
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl border border-line bg-surface-2 flex items-center justify-center overflow-hidden shrink-0">
                      {helpCenterLogoUrl || logoUrl ? (
                        <img
                          src={helpCenterLogoUrl || logoUrl}
                          alt="Logo"
                          className="w-full h-full object-contain p-1"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center text-white font-bold text-base"
                          style={{ backgroundColor: brandColor }}
                        >
                          {workspace.name.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <label className="btn btn-xs btn-secondary cursor-pointer inline-flex items-center gap-1.5">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload Logo</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleHelpCenterLogoUpload}
                            className="hidden"
                          />
                        </label>
                        {logoUrl && (
                          <button
                            type="button"
                            onClick={() => setHelpCenterLogoUrl(logoUrl)}
                            className="btn btn-xs btn-ghost text-ink-3 hover:text-ink text-[11px]"
                          >
                            Use Main Workspace Logo
                          </button>
                        )}
                        {helpCenterLogoUrl && (
                          <button
                            type="button"
                            onClick={() => setHelpCenterLogoUrl('')}
                            className="btn btn-xs btn-ghost text-rose-500 hover:text-rose-600 text-[11px]"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                      <input
                        type="url"
                        placeholder="Or enter image URL: https://example.com/logo.png"
                        value={helpCenterLogoUrl}
                        onChange={(e) => setHelpCenterLogoUrl(e.target.value)}
                        className="input text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Collections Layout Variation (Intercom-style) */}
                <div>
                  <label className="field-label">Default Section Layout (Intercom Style)</label>
                  <p className="text-[11.5px] text-ink-3 mb-2.5">
                    Choose how collections and sections are displayed on your public Help Center.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      {
                        id: 'list',
                        label: 'Row-wise',
                        desc: 'Full-width stacked rows (1 per row)',
                        icon: Rows3,
                      },
                      {
                        id: 'grid-2',
                        label: '2 Columns',
                        desc: 'Spacious 2 in a line cards',
                        icon: LayoutGrid,
                      },
                      {
                        id: 'grid-3',
                        label: '3 Columns',
                        desc: 'Classic 3 in a line grid',
                        icon: Grid3X3,
                      },
                      {
                        id: 'grid-4',
                        label: '4 Columns',
                        desc: 'Compact 4 in a line grid',
                        icon: Columns4,
                      },
                    ].map((opt) => {
                      const Icon = opt.icon;
                      const active = helpCenterLayout === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setHelpCenterLayout(opt.id as any)}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            active
                              ? 'border-accent bg-accent/5 ring-2 ring-accent/20'
                              : 'border-line bg-surface hover:border-ink-3/30'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1.5">
                            <div
                              className={`w-7 h-7 rounded-lg grid place-items-center ${
                                active
                                  ? 'bg-accent text-white'
                                  : 'bg-surface-2 text-ink-2'
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <span className="text-[12.5px] font-semibold text-ink">
                              {opt.label}
                            </span>
                          </div>
                          <p className="text-[10.5px] text-ink-3 leading-tight">
                            {opt.desc}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Footer Text */}
                <div>
                  <label className="field-label">Custom Footer Text / Copyright</label>
                  <input
                    type="text"
                    value={helpCenterFooterText}
                    onChange={(e) => setHelpCenterFooterText(e.target.value)}
                    placeholder={`© ${new Date().getFullYear()} ${workspace.name}. Powered by Chatify.`}
                    className="input"
                  />
                  <p className="text-[11.5px] text-ink-3 mt-1">
                    Displayed at the bottom of every Help Center page and article.
                  </p>
                </div>
              </div>

              {/* Card 2: Header Navigation Links */}
              <div className="card p-6 space-y-5">
                <div className="border-b border-line pb-4">
                  <h3 className="text-[15px] font-semibold text-ink">Header Navigation Links</h3>
                  <p className="text-[12px] text-ink-3">
                    Add custom links in the Help Center navigation bar (e.g. to your main website, API docs, or status page).
                  </p>
                </div>

                {/* Current Links List */}
                <div className="space-y-2">
                  {helpCenterHeaderLinks.length === 0 ? (
                    <div className="p-4 rounded-xl border border-dashed border-line text-center text-[12px] text-ink-3">
                      No custom header links added yet. Use the form below to add navigation links.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {helpCenterHeaderLinks.map((link, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 rounded-xl border border-line bg-surface-2/60 text-[13px]"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <LinkIcon className="w-3.5 h-3.5 text-ink-3 shrink-0" />
                            <span className="font-semibold text-ink truncate">{link.label}</span>
                            <span className="text-ink-3 text-[11.5px] truncate font-mono">
                              ({link.url})
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface border border-line text-ink-3 font-mono">
                              {link.target === '_self' ? 'Same Tab' : 'New Tab'}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveHeaderLink(idx)}
                            className="text-ink-3 hover:text-rose-500 p-1 transition-colors"
                            title="Remove Link"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Add Link Form */}
                <div className="pt-2 border-t border-line/60 space-y-3">
                  <h4 className="text-[13px] font-semibold text-ink">Add Navigation Link</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                    <div className="sm:col-span-4 space-y-1">
                      <label className="text-[11px] font-medium text-ink-3">Link Label</label>
                      <input
                        type="text"
                        value={newLinkLabel}
                        onChange={(e) => setNewLinkLabel(e.target.value)}
                        placeholder="e.g. Main Website"
                        className="input text-xs"
                      />
                    </div>
                    <div className="sm:col-span-5 space-y-1">
                      <label className="text-[11px] font-medium text-ink-3">URL</label>
                      <input
                        type="url"
                        value={newLinkUrl}
                        onChange={(e) => setNewLinkUrl(e.target.value)}
                        placeholder="https://mycompany.com"
                        className="input text-xs font-mono"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <button
                        type="button"
                        onClick={handleAddHeaderLink}
                        disabled={!newLinkLabel.trim() || !newLinkUrl.trim()}
                        className="btn btn-sm btn-secondary w-full gap-1 text-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Link</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Live Interactive Preview */}
            <div className="lg:col-span-5 sticky top-32 space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-[12px] font-semibold text-ink uppercase tracking-wider">
                  Live Preview
                </span>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Updates in Real Time
                </span>
              </div>

              {/* Mock Browser Container */}
              <div className="rounded-2xl border border-line bg-surface shadow-md overflow-hidden text-[12px]">
                {/* Browser Top Bar */}
                <div className="px-3 py-2 bg-surface-2 border-b border-line flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  </div>
                  <div className="flex-1 px-2 py-0.5 rounded bg-surface border border-line text-[10.5px] font-mono text-ink-3 truncate text-center">
                    {getWorkspaceHelpCenterUrl(workspace)}
                  </div>
                </div>

                {/* Help Center Navigation Bar */}
                <div className="px-4 py-3 border-b border-line bg-surface flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {helpCenterLogoUrl || logoUrl ? (
                      <img
                        src={helpCenterLogoUrl || logoUrl}
                        alt="Logo"
                        className="w-6 h-6 rounded-lg object-contain bg-surface-2 p-0.5 border border-line shrink-0"
                      />
                    ) : (
                      <div
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-white font-bold text-[11px] shadow-xs shrink-0"
                        style={{ backgroundColor: brandColor }}
                      >
                        {workspace.name.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <span className="text-[12px] font-bold text-ink truncate block">
                        {helpCenterTitle || workspace.name}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {helpCenterHeaderLinks.slice(0, 2).map((l, i) => (
                      <span key={i} className="text-[11px] text-ink-3 font-medium truncate max-w-[80px]">
                        {l.label}
                      </span>
                    ))}
                    <span
                      className="px-2 py-1 rounded-md text-white text-[10.5px] font-semibold"
                      style={{ backgroundColor: brandColor }}
                    >
                      Ask Support
                    </span>
                  </div>
                </div>

                {/* Help Center Hero Section */}
                <div
                  className="px-5 py-8 text-center relative overflow-hidden"
                  style={{
                    background: `radial-gradient(ellipse 90% 60% at 50% -20%, ${brandColor}25, transparent 80%)`,
                  }}
                >
                  <h4 className="text-[16px] font-extrabold text-ink tracking-tight">
                    Advice and answers from the {helpCenterTitle || workspace.name} Team
                  </h4>
                  <p className="text-[11.5px] text-ink-2 mt-1.5 max-w-xs mx-auto leading-relaxed">
                    {helpCenterSubtitle ||
                      'Search our guides, troubleshooting steps, and documentation for instant answers.'}
                  </p>

                  <div className="mt-4 max-w-xs mx-auto">
                    <div className="h-8 rounded-xl border border-line bg-surface text-ink-3 text-[11px] flex items-center px-3 gap-2 shadow-xs">
                      <span>🔍</span>
                      <span>Search for articles, features...</span>
                    </div>
                  </div>
                </div>

                {/* Mock Sample Collections Grid */}
                <div className="p-4 bg-surface-2/40 border-t border-line space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-xl border border-line bg-surface space-y-1">
                      <div className="text-[14px]">📚</div>
                      <div className="text-[11px] font-bold text-ink truncate">Getting Started</div>
                      <div className="text-[10px] text-ink-3">3 articles</div>
                    </div>
                    <div className="p-2.5 rounded-xl border border-line bg-surface space-y-1">
                      <div className="text-[14px]">💳</div>
                      <div className="text-[11px] font-bold text-ink truncate">Account & Billing</div>
                      <div className="text-[10px] text-ink-3">2 articles</div>
                    </div>
                  </div>
                </div>

                {/* Mock Footer */}
                <div className="px-4 py-2.5 bg-surface border-t border-line text-center text-[10px] text-ink-3">
                  {helpCenterFooterText || `© ${new Date().getFullYear()} ${workspace.name}. Powered by Chatify.`}
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
                    AI assistant
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
                      AI live support assistant
                      {aiSettings.enabled && (
                        <span className="text-[10.5px] px-2 py-0.5 rounded-full bg-success-soft text-success font-bold">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] text-ink-3">
                      Turns the assistant on for this workspace. With no API key it still answers from your help centre and team notes.
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

              {/* System Prompt */}
              <div className="p-5 rounded-2xl border border-line bg-surface space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-[13.5px] font-semibold text-ink">System prompt</h4>
                    <p className="text-[11.5px] text-ink-3">
                      Who the assistant is and how it answers. Facts always come from your published help desk articles.
                    </p>
                  </div>
                  <span className="text-[10.5px] text-ink-3 font-mono shrink-0">
                    {(aiSettings.system_prompt || '').length.toLocaleString()} chars
                  </span>
                </div>
                <textarea
                  value={aiSettings.system_prompt || ''}
                  onChange={(e) => setAiSettings({ ...aiSettings, system_prompt: e.target.value })}
                  rows={14}
                  placeholder="You are the support assistant for… Answer only from the knowledge base…"
                  className="w-full px-3 py-2.5 rounded-xl border border-line bg-surface-2 text-[12.5px] leading-relaxed font-mono text-ink resize-y focus:outline-none focus:ring-1 focus:ring-accent"
                />
                <p className="text-[11px] text-ink-3">
                  Leave empty to use the built-in default. Used for website chat, WhatsApp, Messenger, Instagram and LinkedIn.
                </p>
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
                      If no human agent responds within this duration, the assistant checks documentation and answers.
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

              {/* Model provider credentials */}
              <div className="p-5 rounded-2xl border border-line bg-surface-2 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-[14px] font-semibold text-ink">Model provider</h4>
                    <p className="text-[12px] text-ink-3">
                      Your API key is used strictly on server-side API routes and is never sent to browser clients.
                    </p>
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-surface border border-line text-ink-3">
                    Server-Side Only
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="field-label">Provider</label>
                      <select
                        value={aiSettings.provider || 'anthropic'}
                        onChange={(e) =>
                          setAiSettings({
                            ...aiSettings,
                            provider: e.target.value as AISettingsConfig['provider'],
                            // The old model name means nothing to a new
                            // provider; clearing it falls back to that
                            // provider's default rather than sending a 404.
                            model: '',
                          })
                        }
                        className="input text-xs"
                      >
                        <option value="anthropic">Anthropic (Claude)</option>
                        <option value="openai">OpenAI</option>
                        <option value="google">Google (Gemini)</option>
                        <option value="deepseek">DeepSeek</option>
                        <option value="compatible">Other — OpenAI-compatible URL</option>
                      </select>
                      <p className="text-[11px] text-ink-3">
                        {aiSettings.provider === 'compatible'
                          ? 'OpenRouter, Groq, Together, a local Ollama — anything that serves /chat/completions.'
                          : aiSettings.provider === 'deepseek'
                          ? 'Uses api.deepseek.com. Models: deepseek-chat, or deepseek-reasoner for harder questions.'
                          : 'Switch provider any time; your help centre answers stay the same either way.'}
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="field-label">Model</label>
                      <input
                        type="text"
                        value={aiSettings.model || ''}
                        onChange={(e) => setAiSettings({ ...aiSettings, model: e.target.value })}
                        placeholder={
                          aiSettings.provider === 'openai'
                            ? 'gpt-5'
                            : aiSettings.provider === 'google'
                            ? 'gemini-2.5-pro'
                            : aiSettings.provider === 'deepseek'
                            ? 'deepseek-chat'
                            : aiSettings.provider === 'compatible'
                            ? 'provider/model-name'
                            : 'claude-opus-5'
                        }
                        className="input font-mono text-xs"
                      />
                      <p className="text-[11px] text-ink-3">
                        {/* Typed rather than picked from a list: model names
                            change faster than this page can be redeployed. */}
                        Leave empty for the provider&apos;s default.
                      </p>
                    </div>
                  </div>

                  {aiSettings.provider === 'compatible' && (
                    <div className="space-y-1.5">
                      <label className="field-label">Base URL</label>
                      <input
                        type="text"
                        value={aiSettings.base_url || ''}
                        onChange={(e) => setAiSettings({ ...aiSettings, base_url: e.target.value })}
                        placeholder="https://openrouter.ai/api/v1"
                        className="input font-mono text-xs"
                      />
                      <p className="text-[11px] text-ink-3">
                        Without the trailing <code className="font-mono">/chat/completions</code> — we add it.
                      </p>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="field-label">API key</label>
                    <input
                      type="password"
                      placeholder={
                        aiSettings.api_key || aiSettings.anthropic_api_key
                          ? '•••••••••• (saved — type to replace)'
                          : 'Paste your key'
                      }
                      value={aiSettings.api_key || ''}
                      onChange={(e) => setAiSettings({ ...aiSettings, api_key: e.target.value })}
                      className="input font-mono text-xs"
                    />
                    <p className="text-[11px] text-ink-3">
                      Stored server-side and never sent to the browser. Leave blank to keep
                      the saved key. With no key, answers come from your help centre
                      articles and team notes — which still works.
                    </p>
                  </div>

                  <div className="space-y-2 pt-1">
                    <div className="flex items-center flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={handleTestAiProvider}
                        disabled={testingProvider}
                        className="btn btn-sm btn-secondary gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        {testingProvider ? 'Testing…' : 'Test connection'}
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveAISettings}
                        disabled={saving}
                        className="btn btn-sm btn-primary gap-1.5 shadow-xs"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{saving ? 'Saving…' : 'Save AI Settings'}</span>
                      </button>
                      {providerTest && (
                        <span
                          className={cn(
                            'text-[12px] font-medium',
                            providerTest.ok ? 'text-success' : 'text-danger'
                          )}
                        >
                          {providerTest.ok
                            ? `Connected — ${providerTest.model} replied.`
                            : providerTest.error}
                        </span>
                      )}
                    </div>

                    {/* A server-side prerequisite the owner cannot see any
                        other way, and which silently disables everything. */}
                    {providerTest?.warning && (
                      <p className="text-[12px] text-warn bg-warn-soft border border-warn-line rounded-lg px-3 py-2">
                        {providerTest.warning}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* TAB: EMAIL & HOSTINGER SMTP */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        {activeTab === 'email' && (
          <div className="space-y-6 animate-rise">
            <SMTPSettingsSection
              workspace={workspace}
              onWorkspaceUpdated={(ws) => {
                setWorkspace(ws);
                onWorkspaceUpdated?.(ws);
              }}
            />
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
                          : verificationResult.status === 'pending'
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
                          : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
                      )}
                    >
                      {verificationResult.verified ? (
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500 mt-0.5" />
                      ) : verificationResult.status === 'pending' ? (
                        <Clock className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                      )}
                      <div>
                        <div className="font-semibold">
                          {verificationResult.verified
                            ? 'Verification Successful!'
                            : verificationResult.status === 'pending'
                            ? 'DNS Records Detected — Verification Pending'
                            : 'DNS Records Not Detected'}
                        </div>
                        <p className="mt-0.5 text-[11.5px] opacity-90">{verificationResult.details}</p>
                      </div>
                    </div>
                  )}

                  {/* Table of DNS Records */}
                  <div className="rounded-xl border-2 border-line-2 bg-surface overflow-hidden text-[12.5px] shadow-xs">
                    <div className="grid grid-cols-12 px-4 py-2.5 bg-surface-2 border-b-2 border-line-2 font-bold text-ink text-[12px]">
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
                          <div className="grid grid-cols-12 px-4 py-3 border-b border-line-2 items-center">
                            <div className="col-span-2 font-mono font-extrabold text-accent">{records.primary.type}</div>
                            <div className="col-span-3 font-mono text-ink font-semibold truncate">{records.primary.name}</div>
                            <div className="col-span-5 font-mono text-ink font-semibold truncate">{records.primary.value}</div>
                            <div className="col-span-2 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(records.primary.value);
                                  setCopiedCname(true);
                                  setTimeout(() => setCopiedCname(false), 2000);
                                  showStatus(`${records.primary.type} target copied!`);
                                }}
                                className="btn btn-xs btn-secondary font-bold border-2 border-line-2 hover:border-line-3"
                              >
                                {copiedCname ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                <span>{copiedCname ? 'Copied' : 'Copy'}</span>
                              </button>
                            </div>
                          </div>

                          {/* TXT RECORD */}
                          <div className="grid grid-cols-12 px-4 py-3 items-center">
                            <div className="col-span-2 font-mono font-extrabold text-amber-500">{records.txt.type}</div>
                            <div className="col-span-3 font-mono text-ink font-semibold truncate">{records.txt.name}</div>
                            <div className="col-span-5 font-mono text-ink font-semibold truncate">{records.txt.value}</div>
                            <div className="col-span-2 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(records.txt.value);
                                  setCopiedToken(true);
                                  setTimeout(() => setCopiedToken(false), 2000);
                                  showStatus('TXT verification value copied!');
                                }}
                                className="btn btn-xs btn-secondary font-bold border-2 border-line-2 hover:border-line-3"
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

            {/* 3. Website Navbar Launcher Button (Zero-Code) */}
            <div className="card p-6 space-y-5 border border-accent/30 bg-surface">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10.5px] font-bold uppercase tracking-wider bg-accent/10 text-accent border border-accent/20">
                      Zero-Code Automation
                    </span>
                    <h3 className="text-[16px] font-semibold text-ink flex items-center gap-1.5">
                      <span>Website Navbar Button Auto-Injector</span>
                    </h3>
                  </div>
                  <p className="text-[12px] text-ink-3">
                    Automatically connects to or injects a button into your website navbar (e.g. on <code className="font-mono text-ink">{cleanDomain(workspace.website_url) || 'yourbrand.com'}</code>) without touching your website code.
                  </p>
                </div>

                {/* Main Toggle */}
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={navbarConfig.enabled}
                    onChange={(e) => setNavbarConfig({ ...navbarConfig, enabled: e.target.checked })}
                  />
                  <div className="w-11 h-6 bg-surface-3 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                </label>
              </div>

              {navbarConfig.enabled && (
                <div className="space-y-5 pt-1 animate-in fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Button Name Input */}
                    <div className="space-y-1.5">
                      <label className="field-label flex items-center justify-between">
                        <span>Button Text / Name in Navbar</span>
                        <span className="text-[11px] text-ink-3">Case-insensitive</span>
                      </label>
                      <input
                        type="text"
                        value={navbarConfig.label}
                        onChange={(e) => setNavbarConfig({ ...navbarConfig, label: e.target.value })}
                        placeholder="FAQ"
                        className="input font-semibold text-[14px]"
                      />
                      <p className="text-[11px] text-ink-3">
                        If your website already has a link named &quot;{navbarConfig.label || 'FAQ'}&quot;, the widget auto-hooks it. If not, it creates a new one.
                      </p>
                    </div>

                    {/* Action Selector */}
                    <div className="space-y-1.5">
                      <label className="field-label">When Clicked By Visitor</label>
                      <select
                        value={navbarConfig.action}
                        onChange={(e) =>
                          setNavbarConfig({
                            ...navbarConfig,
                            action: e.target.value as 'help' | 'messages' | 'redirect',
                          })
                        }
                        className="input text-[13px]"
                      >
                        <option value="help">📖 Open Help &amp; FAQs Slide-out Panel</option>
                        <option value="messages">💬 Open Live Chat Messenger</option>
                        <option value="redirect">
                          🌐 Open Dedicated Help Center ({workspace.custom_domain ? `https://${workspace.custom_domain}` : 'Custom Domain'})
                        </option>
                      </select>
                      <p className="text-[11px] text-ink-3">
                        Choose whether to slide open the in-page Help &amp; FAQ modal or redirect.
                      </p>
                    </div>
                  </div>

                  {/* Auto-Inject & Styling Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-line/60">
                    <label className="flex items-start gap-3 p-3.5 rounded-xl border border-line bg-surface-2 cursor-pointer hover:border-accent/40 transition-colors">
                      <input
                        type="checkbox"
                        checked={navbarConfig.auto_inject}
                        onChange={(e) => setNavbarConfig({ ...navbarConfig, auto_inject: e.target.checked })}
                        className="mt-0.5 rounded border-line text-accent focus:ring-accent"
                      />
                      <div>
                        <div className="text-[13px] font-semibold text-ink">Auto-Inject if not present</div>
                        <p className="text-[11.5px] text-ink-3 mt-0.5">
                          If your navbar does not already have an &quot;{navbarConfig.label}&quot; link, the widget will dynamically append it into your navbar.
                        </p>
                      </div>
                    </label>

                    <div className="space-y-1.5 p-3.5 rounded-xl border border-line bg-surface-2">
                      <label className="text-[12.5px] font-semibold text-ink block">Button Styling Variant</label>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <button
                          type="button"
                          onClick={() => setNavbarConfig({ ...navbarConfig, style: 'navbar_link' })}
                          className={cn(
                            'px-3 py-1.5 rounded-lg border text-center text-[12px] font-medium transition-all',
                            navbarConfig.style === 'navbar_link'
                              ? 'border-accent bg-accent/10 text-accent font-semibold'
                              : 'border-line bg-surface text-ink-2 hover:bg-surface-3'
                          )}
                        >
                          Auto-Match Nav Links
                        </button>
                        <button
                          type="button"
                          onClick={() => setNavbarConfig({ ...navbarConfig, style: 'pill' })}
                          className={cn(
                            'px-3 py-1.5 rounded-lg border text-center text-[12px] font-medium transition-all',
                            navbarConfig.style === 'pill'
                              ? 'border-accent bg-accent/10 text-accent font-semibold'
                              : 'border-line bg-surface text-ink-2 hover:bg-surface-3'
                          )}
                        >
                          Modern Pill Button
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Simulated Navbar Live Preview */}
                  <div className="space-y-2 pt-2">
                    <span className="text-[11.5px] font-semibold text-ink-3 uppercase tracking-wider">Live Simulation Preview</span>
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between shadow-inner">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-[11px]">
                          R4
                        </div>
                        <span className="font-bold text-white text-[13px] tracking-wide">{workspace.name || 'BRAND'}</span>
                      </div>

                      <div className="flex items-center gap-3 text-[13px]">
                        <span className="text-slate-400 hover:text-white cursor-default">Accounts</span>
                        <span className="text-slate-400 hover:text-white cursor-default">Rules</span>
                        {/* The Configured Button Preview */}
                        {navbarConfig.style === 'pill' ? (
                          <span
                            className="px-3 py-1 rounded-full text-white font-semibold text-[12px] shadow-sm animate-pulse"
                            style={{ backgroundColor: workspace.brand_color || '#480576' }}
                          >
                            {navbarConfig.label || 'FAQ'}
                          </span>
                        ) : (
                          <span className="text-white font-semibold underline decoration-accent underline-offset-4 cursor-pointer">
                            {navbarConfig.label || 'FAQ'}
                          </span>
                        )}
                        <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-200 text-[12px] font-medium">Dashboard</span>
                      </div>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[11.5px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Zero-code: Updates live on your website instantly upon saving.</span>
                    </span>

                    <button
                      type="button"
                      onClick={handleSaveNavbarConfig}
                      disabled={savingNavbar}
                      className="btn btn-primary px-5 gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{savingNavbar ? 'Saving…' : 'Save & Activate on Website'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* TAB 9: INSTALL SNIPPET & EMBED CODE HELPER */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        {activeTab === 'snippet' && (
          <div className="space-y-8 animate-rise max-w-5xl">
            {/* Header Banner */}
            <div className="card p-6 border-accent/20 bg-gradient-to-r from-accent/5 via-surface to-surface">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                      <Code className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-[17px] font-bold text-ink">Install Chatify &amp; Help Center Widget</h3>
                      <p className="text-[12.5px] text-ink-3">
                        Embed live chat, knowledge base search, and custom Help buttons onto any website or app.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <a
                    href={`/demo.html?workspaceId=${workspace.id}&name=${encodeURIComponent(workspace.name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm btn-primary gap-1.5 shadow-sm shrink-0"
                  >
                    <span>Test in Simulator</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>

            {/* Step 1: Base Script Tag */}
            <div className="card p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center text-[12px] font-bold">
                    1
                  </span>
                  <div>
                    <h4 className="text-[14px] font-semibold text-ink">Add the Widget Script Tag</h4>
                    <p className="text-[12px] text-ink-3">
                      Paste this script right before the closing <code className="font-mono text-accent text-xs">&lt;/body&gt;</code> tag on your HTML pages.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const host = typeof window !== 'undefined' ? window.location.origin : 'https://chatify.com';
                    const snippet = `<script\n  src="${host}/widget.js"\n  data-workspace-id="${workspace.id}"\n  data-color="${workspace.brand_color || '#2563eb'}"\n  data-title="${workspace.name} Support"\n  async>\n</script>`;
                    navigator.clipboard.writeText(snippet);
                    setCopiedSnippet(true);
                    setTimeout(() => setCopiedSnippet(false), 2000);
                    showStatus('Widget embed script copied to clipboard!');
                  }}
                  className="btn btn-sm btn-secondary gap-1.5 shadow-xs"
                >
                  {copiedSnippet ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSnippet ? 'Copied!' : 'Copy Script Tag'}</span>
                </button>
              </div>

              {/* Code Display */}
              {(() => {
                const host = typeof window !== 'undefined' ? window.location.origin : 'https://chatify.com';
                const snippet = `<script\n  src="${host}/widget.js"\n  data-workspace-id="${workspace.id}"\n  data-color="${workspace.brand_color || '#2563eb'}"\n  data-title="${workspace.name} Support"\n  async>\n</script>`;
                return (
                  <div className="relative rounded-xl border border-line bg-surface-2 p-4 font-mono text-[12.5px] text-ink overflow-x-auto leading-relaxed">
                    <pre><code>{snippet}</code></pre>
                  </div>
                );
              })()}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-[12px] text-ink-3">
                <div className="p-3 rounded-xl border border-line/60 bg-surface">
                  <div className="font-semibold text-ink text-[12.5px]">Workspace ID</div>
                  <div className="font-mono text-xs text-accent mt-0.5 truncate">{workspace.id}</div>
                </div>
                <div className="p-3 rounded-xl border border-line/60 bg-surface">
                  <div className="font-semibold text-ink text-[12.5px]">Brand Color</div>
                  <div className="font-mono text-xs text-ink mt-0.5">{workspace.brand_color || '#2563eb'}</div>
                </div>
                <div className="p-3 rounded-xl border border-line/60 bg-surface">
                  <div className="font-semibold text-ink text-[12.5px]">Bundle Optimization</div>
                  <div className="text-xs text-ink mt-0.5">Asynchronous zero-blocking loading</div>
                </div>
              </div>
            </div>

            {/* Step 2: Help Button & Trigger Triggers */}
            <div className="card p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center text-[12px] font-bold">
                    2
                  </span>
                  <div>
                    <h4 className="text-[14px] font-semibold text-ink">Add a Help Button to Your Website Navbar</h4>
                    <p className="text-[12px] text-ink-3">
                      Use declarative HTML data attributes to trigger the widget tabs without writing any JavaScript.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {/* Help Trigger */}
                <div className="p-4 rounded-xl border border-line bg-surface space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-ink">1. Dedicated Help &amp; FAQs Button</span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-semibold">Recommended</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const code = `<button data-chatify-help class="help-btn">\n  📖 Help & FAQs\n</button>`;
                        navigator.clipboard.writeText(code);
                        showStatus('Help button trigger copied!');
                      }}
                      className="btn btn-xs btn-secondary gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </button>
                  </div>
                  <p className="text-[12px] text-ink-3">
                    Clicking this element opens the widget directly into the Help tab and focuses the article search bar.
                  </p>
                  <div className="rounded-lg bg-surface-2 p-3 font-mono text-xs text-ink overflow-x-auto">
                    <code>&lt;button data-chatify-help class=&quot;help-btn&quot;&gt;&#10;  📖 Help &amp; FAQs&#10;&lt;/button&gt;</code>
                  </div>
                </div>

                {/* Specific Article Trigger */}
                <div className="p-4 rounded-xl border border-line bg-surface space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-semibold text-ink">2. Deep Link to a Specific Article</span>
                    <button
                      type="button"
                      onClick={() => {
                        const code = `<button data-chatify-article="your-article-slug">\n  Read Getting Started Guide ↗\n</button>`;
                        navigator.clipboard.writeText(code);
                        showStatus('Article trigger copied!');
                      }}
                      className="btn btn-xs btn-secondary gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </button>
                  </div>
                  <p className="text-[12px] text-ink-3">
                    Directly opens and expands an article accordion inside the widget using its slug or ID.
                  </p>
                  <div className="rounded-lg bg-surface-2 p-3 font-mono text-xs text-ink overflow-x-auto">
                    <code>&lt;button data-chatify-article=&quot;your-article-slug&quot;&gt;&#10;  Read Getting Started Guide ↗&#10;&lt;/button&gt;</code>
                  </div>
                </div>

                {/* Open Chat Trigger */}
                <div className="p-4 rounded-xl border border-line bg-surface space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-semibold text-ink">3. Open Live Chat Directly</span>
                    <button
                      type="button"
                      onClick={() => {
                        const code = `<button data-chatify-open data-chatify-tab="messages">\n  Chat with Support\n</button>`;
                        navigator.clipboard.writeText(code);
                        showStatus('Live chat trigger copied!');
                      }}
                      className="btn btn-xs btn-secondary gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </button>
                  </div>
                  <p className="text-[12px] text-ink-3">
                    Opens the widget straight into the live chat messenger screen.
                  </p>
                  <div className="rounded-lg bg-surface-2 p-3 font-mono text-xs text-ink overflow-x-auto">
                    <code>&lt;button data-chatify-open data-chatify-tab=&quot;messages&quot;&gt;&#10;  Chat with Support&#10;&lt;/button&gt;</code>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: JavaScript SDK API */}
            <div className="card p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center text-[12px] font-bold">
                    3
                  </span>
                  <div>
                    <h4 className="text-[14px] font-semibold text-ink">JavaScript SDK API (`window.Chatify`)</h4>
                    <p className="text-[12px] text-ink-3">
                      Control the widget programmatically in your frontend framework (React, Vue, Angular, Next.js).
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const jsCode = `// Open Help Center Tab directly\nwindow.Chatify.openHelp();\n\n// Open Live Chat screen\nwindow.Chatify.openMessages();\n\n// Search articles programmatically\nwindow.Chatify.search('billing');\n\n// Open specific article by slug\nwindow.Chatify.openArticle('how-to-reset-password');\n\n// Toggle widget\nwindow.Chatify.toggle();\n\n// Check if widget is open\nconsole.log(window.Chatify.isOpen());`;
                    navigator.clipboard.writeText(jsCode);
                    showStatus('JavaScript SDK cheat-sheet copied!');
                  }}
                  className="btn btn-sm btn-secondary gap-1.5 shadow-xs"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy SDK Code</span>
                </button>
              </div>

              <div className="rounded-xl border border-line bg-surface-2 p-4 font-mono text-[12px] text-ink overflow-x-auto leading-relaxed">
                <pre><code>{`// 1. Open Help Center Tab directly
window.Chatify.openHelp();

// 2. Open Live Chat screen
window.Chatify.openMessages();

// 3. Search articles programmatically
window.Chatify.search('billing');

// 4. Open specific article by slug
window.Chatify.openArticle('how-to-reset-password');

// 5. Toggle or close widget
window.Chatify.toggle();
window.Chatify.close();`}</code></pre>
              </div>
            </div>

            {/* Step 4: Next.js & React Frameworks */}
            <div className="card p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center text-[12px] font-bold">
                    4
                  </span>
                  <div>
                    <h4 className="text-[14px] font-semibold text-ink">Next.js &amp; React Integration</h4>
                    <p className="text-[12px] text-ink-3">
                      Using Next.js App Router or Pages Router? Use the <code className="font-mono text-accent text-xs">next/script</code> component.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const host = typeof window !== 'undefined' ? window.location.origin : 'https://chatify.com';
                    const nextSnippet = `import Script from 'next/script';\n\nexport default function RootLayout({ children }) {\n  return (\n    <html lang="en">\n      <body>\n        {children}\n        <Script\n          src="${host}/widget.js"\n          data-workspace-id="${workspace.id}"\n          strategy="afterInteractive"\n        />\n      </body>\n    </html>\n  );\n}`;
                    navigator.clipboard.writeText(nextSnippet);
                    showStatus('Next.js component snippet copied!');
                  }}
                  className="btn btn-sm btn-secondary gap-1.5 shadow-xs"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Next.js Snippet</span>
                </button>
              </div>

              {(() => {
                const host = typeof window !== 'undefined' ? window.location.origin : 'https://chatify.com';
                const nextSnippet = `import Script from 'next/script';\n\nexport default function RootLayout({ children }) {\n  return (\n    <html lang="en">\n      <body>\n        {children}\n        <Script\n          src="${host}/widget.js"\n          data-workspace-id="${workspace.id}"\n          strategy="afterInteractive"\n        />\n      </body>\n    </html>\n  );\n}`;
                return (
                  <div className="rounded-xl border border-line bg-surface-2 p-4 font-mono text-[12px] text-ink overflow-x-auto leading-relaxed">
                    <pre><code>{nextSnippet}</code></pre>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
