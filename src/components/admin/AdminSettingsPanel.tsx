'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
  AlertTriangle,
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
  Search,
  ChevronDown,
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
  connectCustomDomainAction,
  getCustomDomainGuideAction,
  updateWorkspaceDomainAction,
  verifyWorkspaceDomainAction,
  removeWorkspaceDomainAction,
  checkWorkspaceSlugAvailabilityAction,
  updateWorkspaceSlugAction,
} from '@/app/actions/domain';
import {
  getWorkspaceHelpCenterUrl,
  cleanDomain,
  getDefaultSubdomain,
  getExpectedDnsRecords,
  validateCustomDomainInput,
  splitDomain,
  HELP_BASE_DOMAIN,
  DnsProviderGuide,
  CNAME_TARGET,
} from '@/lib/domain';
import { cn } from '@/lib/utils';
import { NavbarPreviewModal } from '@/components/dashboard/NavbarPreviewModal';

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

const ALL_TIMEZONES: string[] = (() => {
  try {
    if (typeof Intl !== 'undefined' && 'supportedValuesOf' in Intl) {
      return (Intl as any).supportedValuesOf('timeZone');
    }
  } catch {
    // fallback below
  }
  return [
    'UTC',
    'Africa/Cairo',
    'Africa/Casablanca',
    'Africa/Johannesburg',
    'Africa/Lagos',
    'Africa/Nairobi',
    'America/Anchorage',
    'America/Argentina/Buenos_Aires',
    'America/Bogota',
    'America/Chicago',
    'America/Denver',
    'America/Halifax',
    'America/Los_Angeles',
    'America/Mexico_City',
    'America/New_York',
    'America/Phoenix',
    'America/Santiago',
    'America/Sao_Paulo',
    'America/Toronto',
    'America/Vancouver',
    'Asia/Bangkok',
    'Asia/Colombo',
    'Asia/Dhaka',
    'Asia/Dubai',
    'Asia/Hong_Kong',
    'Asia/Jakarta',
    'Asia/Jerusalem',
    'Asia/Karachi',
    'Asia/Kolkata',
    'Asia/Kuala_Lumpur',
    'Asia/Manila',
    'Asia/Riyadh',
    'Asia/Seoul',
    'Asia/Shanghai',
    'Asia/Singapore',
    'Asia/Taipei',
    'Asia/Tokyo',
    'Atlantic/Reykjavik',
    'Australia/Melbourne',
    'Australia/Perth',
    'Australia/Sydney',
    'Europe/Amsterdam',
    'Europe/Athens',
    'Europe/Berlin',
    'Europe/Brussels',
    'Europe/Dublin',
    'Europe/Helsinki',
    'Europe/Istanbul',
    'Europe/Lisbon',
    'Europe/London',
    'Europe/Madrid',
    'Europe/Paris',
    'Europe/Rome',
    'Europe/Stockholm',
    'Europe/Vienna',
    'Europe/Warsaw',
    'Europe/Zurich',
    'Pacific/Auckland',
    'Pacific/Honolulu',
  ];
})();

const COLOR_PRESETS = [
  '#2563eb', // Zen-try Blue
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
  const [cannedResponses, setCannedResponses] = useState<CannedResponse[]>(() =>
    (initialCannedResponses || []).filter(
      (c) => c.shortcut !== 'sla_guarantee' && c.shortcut !== '/sla_guarantee'
    )
  );

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
  const [launcherOffsetBottom, setLauncherOffsetBottom] = useState<number>(
    workspace.launcher_offset_bottom ?? 20
  );
  const [launcherOffsetSide, setLauncherOffsetSide] = useState<number>(
    workspace.launcher_offset_side ?? 20
  );
  const [widgetZIndex, setWidgetZIndex] = useState<number>(
    workspace.widget_z_index ?? 2147483000
  );
  const [enableProactiveWelcome, setEnableProactiveWelcome] = useState<boolean>(
    workspace.enable_proactive_welcome !== false
  );
  const [proactiveDelaySeconds, setProactiveDelaySeconds] = useState<number>(
    Math.max(8, workspace.proactive_delay_seconds ?? 8)
  );
  const [previewOpen, setPreviewOpen] = useState(true);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [widgetVisibilityDevice, setWidgetVisibilityDevice] = useState<'all' | 'desktop' | 'mobile'>('all');
  const [showOnlineStatusBadge, setShowOnlineStatusBadge] = useState<boolean>(true);

  const isWidgetDirty = useMemo(() => {
    return (
      brandColor !== (workspace.brand_color || '#2563eb') ||
      logoUrl !== (workspace.logo_url || '') ||
      showLauncherLogo !== (workspace.show_launcher_logo !== false) ||
      widgetPosition !== (workspace.widget_position || 'right') ||
      greetingTitle !== (workspace.greeting_title || 'Hi there 👋') ||
      greetingMessage !== (workspace.greeting_message || "We're here to help! Send us a message and we'll reply shortly.") ||
      helpTabLabel !== (workspace.help_center_tab_label || 'Help') ||
      showHelpTab !== (workspace.show_help_tab !== false) ||
      launcherOffsetBottom !== (workspace.launcher_offset_bottom ?? 20) ||
      launcherOffsetSide !== (workspace.launcher_offset_side ?? 20) ||
      widgetZIndex !== (workspace.widget_z_index ?? 2147483000) ||
      enableProactiveWelcome !== (workspace.enable_proactive_welcome !== false) ||
      proactiveDelaySeconds !== Math.max(8, workspace.proactive_delay_seconds ?? 8)
    );
  }, [
    brandColor,
    logoUrl,
    showLauncherLogo,
    widgetPosition,
    greetingTitle,
    greetingMessage,
    helpTabLabel,
    showHelpTab,
    launcherOffsetBottom,
    launcherOffsetSide,
    widgetZIndex,
    enableProactiveWelcome,
    proactiveDelaySeconds,
    workspace,
  ]);

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
        launcher_offset_bottom: launcherOffsetBottom,
        launcher_offset_side: launcherOffsetSide,
        widget_z_index: widgetZIndex,
        enable_proactive_welcome: enableProactiveWelcome,
        proactive_delay_seconds: proactiveDelaySeconds,
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

  const isHelpCenterDirty = useMemo(() => {
    return (
      helpCenterTitle !== (workspace.help_center_title || '') ||
      helpCenterSubtitle !== (workspace.help_center_subtitle || '') ||
      helpCenterLogoUrl !== (workspace.help_center_logo_url || '') ||
      helpCenterFooterText !== (workspace.help_center_footer_text || '') ||
      helpCenterLayout !== ((workspace as any).help_center_layout || 'grid-2') ||
      JSON.stringify(helpCenterHeaderLinks) !== JSON.stringify(workspace.help_center_header_links || [])
    );
  }, [
    helpCenterTitle,
    helpCenterSubtitle,
    helpCenterLogoUrl,
    helpCenterFooterText,
    helpCenterLayout,
    helpCenterHeaderLinks,
    workspace,
  ]);
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
  const [tzSearch, setTzSearch] = useState('');
  const [tzDropdownOpen, setTzDropdownOpen] = useState(false);

  const filteredTimezones = useMemo(() => {
    if (!tzSearch.trim()) return ALL_TIMEZONES.slice(0, 100);
    const q = tzSearch.toLowerCase().replace(/\s+/g, '_');
    return ALL_TIMEZONES.filter(
      (tz) =>
        tz.toLowerCase().includes(q) ||
        tz.toLowerCase().replace(/_/g, ' ').includes(tzSearch.toLowerCase())
    );
  }, [tzSearch]);

  const isHoursDirty = useMemo(() => {
    const orig = workspace.business_hours || DEFAULT_SCHEDULE;
    return JSON.stringify(businessHours) !== JSON.stringify(orig);
  }, [businessHours, workspace.business_hours]);

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

  const isAutoAssignDirty = useMemo(() => {
    const orig = workspace.auto_assignment || { enabled: true, max_conversations_per_agent: 5 };
    return JSON.stringify(autoAssign) !== JSON.stringify(orig);
  }, [autoAssign, workspace.auto_assignment]);

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
    auto_pilot: false,
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

  const isAiDirty = useMemo(() => {
    const orig = {
      enabled: true,
      auto_response_enabled: true,
      auto_response_delay_seconds: 20,
      auto_pilot: false,
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
    };
    return JSON.stringify(aiSettings) !== JSON.stringify(orig);
  }, [aiSettings, workspace.ai_settings]);

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
  const installSnippetCode = `<!-- Zen-try Live Chat Tracker & Widget -->
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
  // SECTION 8: 1-STEP CUSTOM DOMAIN & HELP CENTER STATE & HANDLERS
  // ──────────────────────────────────────────────────────────────────────────
  const [customDomainInput, setCustomDomainInput] = useState(
    workspace.custom_domain || ''
  );
  const [connectingDomain, setConnectingDomain] = useState(false);
  const [domainValidationError, setDomainValidationError] = useState<string | null>(null);
  const [dnsProviderGuide, setDnsProviderGuide] = useState<DnsProviderGuide | null>(null);
  const [expectedDnsData, setExpectedDnsData] = useState<any | null>(null);
  const [verifyingDomain, setVerifyingDomain] = useState(false);
  const [isPollingDomain, setIsPollingDomain] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    verified: boolean;
    status: 'verified' | 'pending' | 'failed';
    details: string;
  } | null>(null);
  const [copiedHost, setCopiedHost] = useState(false);
  const [copiedCname, setCopiedCname] = useState(false);
  const [copiedTxt, setCopiedTxt] = useState(false);
  const [copiedPublicUrl, setCopiedPublicUrl] = useState(false);

  // Subdomain & Slug customization state
  const [slugInput, setSlugInput] = useState(workspace.slug || '');
  const [slugAvailability, setSlugAvailability] = useState<{
    checking: boolean;
    available?: boolean;
    error?: string;
    formattedSlug?: string;
  }>({ checking: false });
  const [savingSlug, setSavingSlug] = useState(false);
  const [isEditingSlug, setIsEditingSlug] = useState(false);
  const [showSlugConfirm, setShowSlugConfirm] = useState(false);
  const isOwner = currentAgent.role === 'owner';
  const hasCustomizedSlug = (workspace.slug_changes_count ?? 0) >= 1;

  // Auto-polling for pending custom domain verification
  useEffect(() => {
    if (!workspace.custom_domain) {
      setDnsProviderGuide(null);
      setExpectedDnsData(null);
      return;
    }

    // Load provider guide & expected records
    getCustomDomainGuideAction(workspace.id).then((res) => {
      if (res.success && res.data) {
        setDnsProviderGuide(res.data.dnsProvider);
        setExpectedDnsData(res.data.expectedRecords);
      }
    });

    if (workspace.custom_domain_status === 'verified') {
      setIsPollingDomain(false);
      return;
    }

    // Automatic polling every 30 seconds for pending domains
    setIsPollingDomain(true);
    let active = true;
    let timer: NodeJS.Timeout;

    const pollVerification = async () => {
      if (!active) return;
      try {
        const res = await verifyWorkspaceDomainAction(workspace.id);
        if (res.data?.verified) {
          const updatedWs: Workspace = {
            ...workspace,
            custom_domain: cleanDomain(workspace.custom_domain),
            custom_domain_status: 'verified',
            custom_domain_verified_at: new Date().toISOString(),
          };
          setWorkspace(updatedWs);
          onWorkspaceUpdated?.(updatedWs);
          setIsPollingDomain(false);
          showStatus('Your Help Center custom domain is now Live with SSL! 🎉', 'success');
          return;
        }
      } catch (err) {
        // Silent failure in background poll
      }
      if (active) {
        timer = setTimeout(pollVerification, 30000);
      }
    };

    // First auto-check after 15s, then every 30s
    timer = setTimeout(pollVerification, 15000);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [workspace.id, workspace.custom_domain, workspace.custom_domain_status]);

  // Debounced check availability when slugInput changes
  useEffect(() => {
    const trimmed = slugInput.trim().toLowerCase();
    if (!isEditingSlug || trimmed === (workspace.slug || '').toLowerCase()) {
      setSlugAvailability({ checking: false });
      return;
    }

    if (trimmed.length < 2) {
      setSlugAvailability({ checking: false, available: false, error: 'Slug must be at least 2 characters.' });
      return;
    }

    setSlugAvailability({ checking: true });
    const timer = setTimeout(async () => {
      try {
        const res = await checkWorkspaceSlugAvailabilityAction(workspace.id, trimmed);
        setSlugAvailability({
          checking: false,
          available: res.available,
          error: res.error,
          formattedSlug: res.formattedSlug,
        });
      } catch (err: any) {
        setSlugAvailability({ checking: false, available: false, error: err.message || 'Error checking availability' });
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [slugInput, isEditingSlug, workspace.id, workspace.slug]);

  const handleSaveSlug = async () => {
    if (!isOwner) {
      showStatus('Only the workspace owner can customize the subdomain slug.', 'error');
      return;
    }
    if (hasCustomizedSlug) {
      showStatus('The workspace slug can only be customized once.', 'error');
      return;
    }
    setSavingSlug(true);
    try {
      const res = await updateWorkspaceSlugAction(workspace.id, slugInput);
      if (res.success && res.data) {
        setWorkspace(res.data.workspace);
        onWorkspaceUpdated?.(res.data.workspace);
        setIsEditingSlug(false);
        setShowSlugConfirm(false);
        showStatus('Subdomain slug successfully saved! Your Help Center is live at the new address.', 'success');
      } else {
        showStatus(res.error || 'Failed to update slug', 'error');
      }
    } catch (err: any) {
      showStatus(err.message || 'Error updating slug', 'error');
    } finally {
      setSavingSlug(false);
    }
  };

  const handleConnectDomain = async () => {
    setDomainValidationError(null);

    // Validate input: automatically strip https://, trailing slashes, paths, and reject apex domains
    const validation = validateCustomDomainInput(customDomainInput);
    if (!validation.valid || !validation.domain) {
      setDomainValidationError(validation.error || 'Please enter a valid subdomain.');
      showStatus(validation.error || 'Please enter a valid subdomain.', 'error');
      return;
    }

    setConnectingDomain(true);
    setVerificationResult(null);
    try {
      const res = await connectCustomDomainAction(workspace.id, customDomainInput);
      if (res.success && res.data) {
        setWorkspace(res.data.workspace);
        onWorkspaceUpdated?.(res.data.workspace);
        setDnsProviderGuide(res.data.dnsProvider);
        setExpectedDnsData(res.data.expectedRecords);
        setCustomDomainInput(res.data.domain);
        showStatus('Domain connected! One DNS record needed below.', 'success');
      } else {
        setDomainValidationError(res.error || 'Failed to connect domain');
        showStatus(res.error || 'Failed to connect domain', 'error');
      }
    } catch (err: any) {
      setDomainValidationError(err.message || 'Error connecting domain');
      showStatus(err.message || 'Error connecting domain', 'error');
    } finally {
      setConnectingDomain(false);
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
          const updatedWs: Workspace = {
            ...workspace,
            custom_domain: cleanDomain(workspace.custom_domain || customDomainInput),
            custom_domain_status: 'verified',
            custom_domain_verified_at: new Date().toISOString(),
          };
          setWorkspace(updatedWs);
          onWorkspaceUpdated?.(updatedWs);
          showStatus('Domain verified! SSL certificate is active.', 'success');
        } else {
          showStatus(res.data.details || 'DNS not detected yet. Checking automatically...', 'error');
        }
      } else {
        showStatus(res.error || 'Verification check failed', 'error');
      }
    } catch (err: any) {
      showStatus(err.message || 'Error running verification check', 'error');
    } finally {
      setVerifyingDomain(false);
    }
  };

  const handleRemoveDomain = async () => {
    if (
      !confirm(
        'Are you sure you want to remove this custom domain? It will be disconnected from Vercel and your Help Center will instantly fall back to your platform subdomain.'
      )
    )
      return;
    try {
      const res = await removeWorkspaceDomainAction(workspace.id);
      if (res.success) {
        const updatedWs: Workspace = {
          ...workspace,
          custom_domain: null,
          custom_domain_status: null,
          custom_domain_verified_at: null,
          custom_domain_connected_at: null,
          custom_domain_last_checked_at: null,
          custom_domain_notification_sent: null,
        };
        setWorkspace(updatedWs);
        onWorkspaceUpdated?.(updatedWs);
        setCustomDomainInput('');
        setDnsProviderGuide(null);
        setExpectedDnsData(null);
        setVerificationResult(null);
        setDomainValidationError(null);
        showStatus('Custom domain removed. Reverted to platform subdomain.', 'success');
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
      label: 'Help',
      action: 'help',
      auto_inject: true,
      style: 'navbar_link',
      position: 'end',
    }
  );
  const [savingNavbar, setSavingNavbar] = useState(false);
  const [isNavbarSimulatorOpen, setIsNavbarSimulatorOpen] = useState(false);

  // Requirement 4: Settings must always load and show the saved values (label, action, on/off)
  useEffect(() => {
    if (workspace.navbar_trigger_config) {
      setNavbarConfig({
        enabled: Boolean(workspace.navbar_trigger_config.enabled),
        label: workspace.navbar_trigger_config.label || 'Help',
        action: workspace.navbar_trigger_config.action || 'help',
        style: workspace.navbar_trigger_config.style || 'navbar_link',
        position: (workspace.navbar_trigger_config as any).position || 'end',
        auto_inject: workspace.navbar_trigger_config.auto_inject !== false,
        target_selector: workspace.navbar_trigger_config.target_selector || '',
        dismissed_prompt: workspace.navbar_trigger_config.dismissed_prompt,
      });
    }
  }, [workspace.navbar_trigger_config]);

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
          ? 'w-full relative'
          : 'flex-1 flex flex-col h-full bg-canvas overflow-y-auto relative'
      }
    >
      {/* Toast Notification (Visible at top-right on save across all tabs) */}
      {statusMessage && (
        <div
          role="status"
          aria-live="polite"
          className={cn(
            'fixed top-5 right-5 z-[9999] px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 shadow-2xl border animate-rise transition-all backdrop-blur-md',
            statusMessage.type === 'success'
              ? 'bg-emerald-50/95 text-emerald-900 border-emerald-300 dark:bg-emerald-950/95 dark:text-emerald-100 dark:border-emerald-700'
              : 'bg-rose-50/95 text-rose-900 border-rose-300 dark:bg-rose-950/95 dark:text-rose-100 dark:border-rose-700'
          )}
        >
          {statusMessage.type === 'success' ? (
            <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
          ) : (
            <div className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0">
              <AlertCircle className="w-3.5 h-3.5 stroke-[3]" />
            </div>
          )}
          <span className="text-[13px]">{statusMessage.text}</span>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="ml-1 text-ink-3 hover:text-ink p-0.5 rounded-md"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
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
          { id: 'email', label: 'Email (SMTP)', icon: Mail },
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
                        { color: '#2563eb', label: 'Zen-try Blue' },
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

                {/* Launcher Offsets & Widget Z-Index */}
                <div className="pt-4 border-t border-line-2 space-y-3.5">
                  <div>
                    <h5 className="text-[13px] font-bold text-ink">Launcher Offsets &amp; Z-Index</h5>
                    <p className="text-[11.5px] text-ink-2">
                      Adjust exact pixel spacing and stack order so the chat button never blocks your site's navigation or buttons.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="field-label text-ink font-semibold text-[12px] mb-1 block">
                        Bottom Offset (px)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={300}
                        value={launcherOffsetBottom}
                        onChange={(e) => setLauncherOffsetBottom(Number(e.target.value))}
                        className="input text-xs border-2 border-line-2 focus:border-accent text-ink font-semibold"
                        placeholder="20"
                      />
                      <p className="text-[11px] text-ink-2 mt-1">Default: 20px</p>
                    </div>

                    <div>
                      <label className="field-label text-ink font-semibold text-[12px] mb-1 block">
                        Side Offset (px)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={300}
                        value={launcherOffsetSide}
                        onChange={(e) => setLauncherOffsetSide(Number(e.target.value))}
                        className="input text-xs border-2 border-line-2 focus:border-accent text-ink font-semibold"
                        placeholder="20"
                      />
                      <p className="text-[11px] text-ink-2 mt-1">Default: 20px</p>
                    </div>

                    <div>
                      <label className="field-label text-ink font-semibold text-[12px] mb-1 block">
                        Widget Z-Index
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={2147483647}
                        value={widgetZIndex}
                        onChange={(e) => setWidgetZIndex(Number(e.target.value))}
                        className="input text-xs border-2 border-line-2 focus:border-accent text-ink font-semibold"
                        placeholder="2147483000"
                      />
                      <p className="text-[11px] text-ink-2 mt-1">Default: 2147483000</p>
                    </div>
                  </div>
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
                      placeholder={`Welcome to ${workspace.name || 'our support'}`}
                      className="input resize-none text-[13px] leading-relaxed border-2 border-line-2 focus:border-accent text-ink"
                    />
                    <p className="text-[11px] text-ink-2 mt-1">
                      Customise the welcome message sent when visitors start a conversation.
                    </p>
                  </div>

                  {/* Proactive Welcome Bubble Setting */}
                  <div className="p-4 rounded-xl border-2 border-line-2 bg-surface-2/70 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5 pr-4">
                        <label className="text-[13.5px] font-bold text-ink cursor-pointer" htmlFor="toggle-proactive-welcome">
                          Proactive Welcome Bubble
                        </label>
                        <p className="text-[12px] text-ink-2">
                          Show an unobtrusive bubble invitation next to the launcher. Automatically delayed and suppressed when host page modals or overlays are open.
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          id="toggle-proactive-welcome"
                          type="checkbox"
                          checked={enableProactiveWelcome}
                          onChange={(e) => setEnableProactiveWelcome(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-line-2 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent shadow-xs"></div>
                      </label>
                    </div>

                    {enableProactiveWelcome && (
                      <div className="pt-2 border-t border-line-2 flex items-center justify-between gap-4">
                        <div>
                          <label className="text-[12px] font-semibold text-ink block">
                            Display Delay (Seconds)
                          </label>
                          <span className="text-[11px] text-ink-2">Minimum delay is 8 seconds after page load</span>
                        </div>
                        <input
                          type="number"
                          min={8}
                          max={120}
                          value={proactiveDelaySeconds}
                          onChange={(e) => setProactiveDelaySeconds(Math.max(8, Number(e.target.value)))}
                          className="input w-24 text-xs font-semibold text-center border-2 border-line-2 focus:border-accent text-ink"
                        />
                      </div>
                    )}
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

              {/* Slim Sticky Footer Bar */}
              <div className="sticky bottom-0 z-20 px-6 py-3 border-t border-line bg-surface/95 backdrop-blur-sm flex items-center justify-between gap-4 shadow-sm -mx-6 md:-mx-8">
                <div className="flex items-center gap-2 text-xs text-ink-2 truncate">
                  <Sparkles className="w-3.5 h-3.5 text-accent shrink-0" />
                  <span className="truncate">Changes apply to your website immediately after clicking save.</span>
                </div>
                <button
                  type="button"
                  onClick={handleSaveWidget}
                  disabled={!isWidgetDirty || saving}
                  className="btn btn-sm btn-primary gap-2 shadow-xs font-semibold px-4 py-2 shrink-0 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
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
                        'absolute rounded-2xl bg-surface shadow-2xl border-2 border-line-2 overflow-hidden animate-rise flex flex-col z-20',
                        previewDevice === 'mobile'
                          ? 'inset-0 w-full h-full max-h-none rounded-none'
                          : widgetPosition === 'right'
                          ? 'right-3 bottom-16 w-76 max-h-[400px]'
                          : 'left-3 bottom-16 w-76 max-h-[400px]'
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
                              <span className="text-[12px] font-bold text-white uppercase flex items-center justify-center w-full h-full select-none">
                                {(workspace.name || 'W').charAt(0)}
                              </span>
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
                          className={cn(
                            'text-white/90 hover:text-white transition-colors flex items-center justify-center shrink-0',
                            previewDevice === 'mobile'
                              ? 'w-8 h-8 rounded-full bg-white/20 hover:bg-white/30'
                              : 'p-1 rounded-lg hover:bg-white/15'
                          )}
                          title="Close preview"
                          aria-label="Close preview"
                        >
                          <X className="w-4.5 h-4.5" />
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
                      previewDevice === 'mobile' && previewOpen ? 'hidden' : 'block',
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
                      disabled={!isHelpCenterDirty || savingHelpCenter}
                      className="btn btn-sm btn-primary gap-1.5 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
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
                    placeholder={`© ${new Date().getFullYear()} ${workspace.name}. Powered by Zen-try.`}
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
                  {helpCenterFooterText || `© ${new Date().getFullYear()} ${workspace.name}. Powered by Zen-try.`}
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
                    disabled={!isHoursDirty || saving}
                    className="btn btn-sm btn-primary gap-1.5 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
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

              {/* Timezone Selector with Full IANA Search */}
              <div className="space-y-1.5 max-w-md">
                <label className="field-label mb-0">Workspace Timezone (Full IANA List)</label>
                <div className="relative">
                  <div
                    onClick={() => setTzDropdownOpen(!tzDropdownOpen)}
                    className="input flex items-center justify-between cursor-pointer text-xs font-mono select-none"
                  >
                    <span className="truncate">{businessHours.timezone || 'UTC'}</span>
                    <ChevronDown className={cn("w-4 h-4 text-ink-3 transition-transform", tzDropdownOpen && "rotate-180")} />
                  </div>

                  {tzDropdownOpen && (
                    <div className="absolute left-0 top-full mt-1.5 w-full bg-surface border border-line rounded-xl shadow-xl z-30 p-2 space-y-2 animate-rise">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-3" />
                        <input
                          type="text"
                          autoFocus
                          placeholder="Search IANA timezone (e.g. New York, Karachi, London, Tokyo)…"
                          value={tzSearch}
                          onChange={(e) => setTzSearch(e.target.value)}
                          className="input pl-8 py-1.5 text-xs w-full font-sans"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div className="max-h-56 overflow-y-auto divide-y divide-line/40 text-xs font-mono">
                        {filteredTimezones.length === 0 ? (
                          <div className="p-3 text-center text-ink-3 font-sans">No matching timezone found</div>
                        ) : (
                          filteredTimezones.map((tz) => {
                            const isSelected = businessHours.timezone === tz;
                            return (
                              <button
                                key={tz}
                                type="button"
                                onClick={() => {
                                  setBusinessHours({ ...businessHours, timezone: tz });
                                  setTzDropdownOpen(false);
                                  setTzSearch('');
                                }}
                                className={cn(
                                  "w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between hover:bg-surface-2 transition-colors",
                                  isSelected ? "bg-accent/10 text-accent font-semibold" : "text-ink"
                                )}
                              >
                                <span>{tz.replace(/_/g, ' ')}</span>
                                {isSelected && <Check className="w-3.5 h-3.5 text-accent" />}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-ink-3">
                  All active business hour evaluations run against this local timezone.
                </p>
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
                      className="p-4 px-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 hover:bg-surface-2/40 transition-colors"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="relative shrink-0">
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
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-[13.5px] text-ink break-words">
                              {agent.name}
                            </span>
                            {isSelf && (
                              <span className="text-[10.5px] px-1.5 py-0.5 rounded bg-surface-2 text-ink-2 font-medium shrink-0">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-[12px] text-ink-3 break-all">{agent.email}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-wrap sm:shrink-0 self-start sm:self-auto pl-13 sm:pl-0">
                        {/* Role Selector */}
                        {isOwner ? (
                          <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 font-semibold text-xs flex items-center gap-1 shrink-0">
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
                            className="input py-1 text-xs font-semibold w-28 shrink-0"
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
                            className="p-1.5 rounded-lg text-ink-3 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors shrink-0"
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
                  disabled={!isAutoAssignDirty || saving}
                  className="btn btn-sm btn-primary gap-1.5 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
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
        {/* TAB 7: AI ASSISTANT & KNOWLEDGE BASE AGENT */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        {activeTab === 'ai' && (
          <div className="space-y-6 animate-rise">
            <div className="card p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-line pb-4">
                <div>
                  <h3 className="text-[16px] font-semibold text-ink flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-accent" />
                    AI Assistant & Knowledge Base Agent
                  </h3>
                  <p className="text-[12.5px] text-ink-3 mt-0.5">
                    Unified AI support assistant and autonomous knowledge base agent across website live chat and omnichannel integrations.
                  </p>
                </div>
              </div>

              {/* Master Switch */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-line bg-surface-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent-soft text-accent flex items-center justify-center">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[14px] font-semibold text-ink flex items-center gap-2">
                      Master AI Agent
                      {aiSettings.enabled ? (
                        <span className="text-[10.5px] px-2 py-0.5 rounded-full bg-success-soft text-success font-bold">
                          ACTIVE
                        </span>
                      ) : (
                        <span className="text-[10.5px] px-2 py-0.5 rounded-full bg-surface-3 text-ink-3 font-medium">
                          DISABLED
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] text-ink-3">
                      Master toggle for this workspace. Formulates responses directly from your published help desk articles and notes.
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
                    <h4 className="text-[13.5px] font-semibold text-ink">System Prompt & Agent Persona</h4>
                    <p className="text-[11.5px] text-ink-3">
                      Defines who the assistant is, its tone, and response constraints. Facts are always anchored in your published articles.
                    </p>
                  </div>
                  <span className="text-[10.5px] text-ink-3 font-mono shrink-0">
                    {(aiSettings.system_prompt || '').length.toLocaleString()} chars
                  </span>
                </div>
                <textarea
                  value={aiSettings.system_prompt || ''}
                  onChange={(e) => setAiSettings({ ...aiSettings, system_prompt: e.target.value })}
                  rows={8}
                  placeholder="You are the support assistant for… Answer only from the knowledge base…"
                  className="w-full px-3 py-2.5 rounded-xl border border-line bg-surface-2 text-[12.5px] leading-relaxed font-mono text-ink resize-y focus:outline-none focus:ring-1 focus:ring-accent"
                />
                <p className="text-[11px] text-ink-3">
                  Leave empty to use the built-in default. Applies to web widget, WhatsApp, Messenger, Instagram, and LinkedIn.
                </p>
              </div>

              {/* Automation Modes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* 1. Auto First-Reply with Delay */}
                <div className="p-5 rounded-2xl border border-line bg-surface space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                        <Zap className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-[13.5px] font-semibold text-ink">Auto First Reply</h4>
                        <p className="text-[11.5px] text-ink-3">Answers incoming questions if no agent claims the chat</p>
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
                      <span className="text-ink-2 font-medium">Auto-reply delay (seconds unassigned):</span>
                      <span className="font-bold text-accent px-2 py-0.5 rounded bg-surface-2 border border-line">
                        {aiSettings.auto_response_delay_seconds}s
                      </span>
                    </div>
                    <input
                      type="range"
                      min={5}
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
                      Waits this many seconds before consulting knowledge base articles to draft and send the first answer.
                    </p>
                  </div>
                </div>

                {/* 2. Full Autopilot */}
                <div className="p-5 rounded-2xl border border-line bg-surface space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-[13.5px] font-semibold text-ink">Full Autopilot</h4>
                        <p className="text-[11.5px] text-ink-3">Continuously answers follow-up visitor messages</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={aiSettings.auto_pilot ?? false}
                        onChange={(e) => setAiSettings({ ...aiSettings, auto_pilot: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-surface-3 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent"></div>
                    </label>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-line text-xs">
                    <p className="text-[12px] text-ink-2 leading-relaxed">
                      Operates the AI as an autonomous knowledge agent throughout conversation lifecycles. Automatically yields back to human agents when escalated or claimed.
                    </p>
                  </div>
                </div>
              </div>

              {/* Agent Copilot Enhancements */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                {/* Suggested Replies */}
                <div className="p-4 rounded-xl border border-line bg-surface space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-blue-500" />
                      <span className="text-[13px] font-semibold text-ink">Suggested Replies</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={aiSettings.suggested_replies_enabled}
                        onChange={(e) => setAiSettings({ ...aiSettings, suggested_replies_enabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-8 h-4 bg-surface-3 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-accent"></div>
                    </label>
                  </div>
                  <p className="text-[11px] text-ink-3">Clickable pills above composer for agents.</p>
                </div>

                {/* Auto-Tagging */}
                <div className="p-4 rounded-xl border border-line bg-surface space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-500" />
                      <span className="text-[13px] font-semibold text-ink">Auto-Tagging</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={aiSettings.auto_tagging_enabled}
                        onChange={(e) => setAiSettings({ ...aiSettings, auto_tagging_enabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-8 h-4 bg-surface-3 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-accent"></div>
                    </label>
                  </div>
                  <p className="text-[11px] text-ink-3">Categorizes threads by intent (#Billing, #Bug).</p>
                </div>

                {/* Sentiment & Summary */}
                <div className="p-4 rounded-xl border border-line bg-surface space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-500" />
                      <span className="text-[13px] font-semibold text-ink">Sentiment & Summary</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={aiSettings.sentiment_enabled}
                        onChange={(e) => setAiSettings({ ...aiSettings, sentiment_enabled: e.target.checked, summary_enabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-8 h-4 bg-surface-3 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-accent"></div>
                    </label>
                  </div>
                  <p className="text-[11px] text-ink-3">Mood flags and quick summaries on long threads.</p>
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

              {/* Slim Sticky Footer Bar */}
              <div className="sticky bottom-0 z-20 px-6 py-3 border-t border-line bg-surface/95 backdrop-blur-sm flex items-center justify-between gap-4 shadow-sm -mx-6 md:-mx-8">
                <div className="flex items-center gap-2 text-xs text-ink-2 truncate">
                  <Sparkles className="w-3.5 h-3.5 text-accent shrink-0" />
                  <span className="truncate">Changes to AI assistant settings take effect immediately.</span>
                </div>
                <button
                  type="button"
                  onClick={handleSaveAISettings}
                  disabled={!isAiDirty || saving}
                  className="btn btn-sm btn-primary gap-2 shadow-xs font-semibold px-4 py-2 shrink-0 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving…</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Save AI Settings</span>
                    </>
                  )}
                </button>
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
            {/* 1. Live Ready-Made Help Center URL & Subdomain Slug */}
            <div className="card p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent-soft text-accent flex items-center justify-center font-bold">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-semibold text-ink">Ready-Made Public Help Center URL</h3>
                    <p className="text-[12px] text-ink-3">
                      Every workspace has a live, ready-made Help Center with zero setup required.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Live</span>
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
                    <span>{copiedPublicUrl ? 'Copied' : 'Copy'}</span>
                  </button>

                  <a
                    href={getWorkspaceHelpCenterUrl(workspace)}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-sm btn-primary gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open</span>
                  </a>
                </div>
              </div>

              {/* Workspace Subdomain Slug Configuration */}
              <div className="pt-4 border-t border-line space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-[13.5px] font-semibold text-ink flex items-center gap-2">
                      <span>Subdomain Slug</span>
                      {hasCustomizedSlug ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-surface-3 text-ink-3 border border-line">
                          Slug Customized (Locked)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-accent-soft text-accent border border-accent/20">
                          1 Customization Allowed
                        </span>
                      )}
                    </h4>
                    <p className="text-[12px] text-ink-3 mt-0.5">
                      {hasCustomizedSlug
                        ? 'Your subdomain slug has already been customized. It is locked to prevent broken links.'
                        : 'You can customize your ready-made subdomain slug once. Choose a permanent, unique name.'}
                    </p>
                  </div>

                  {!hasCustomizedSlug && isOwner && !isEditingSlug && (
                    <button
                      type="button"
                      onClick={() => {
                        setSlugInput(workspace.slug || '');
                        setIsEditingSlug(true);
                      }}
                      className="btn btn-sm btn-secondary text-[12px]"
                    >
                      Customize Slug
                    </button>
                  )}
                </div>

                {isEditingSlug && !hasCustomizedSlug && isOwner ? (
                  <div className="p-4 rounded-xl bg-surface-2 border border-line space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-medium text-ink-2">
                        Choose Subdomain Slug:
                      </label>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <div className="relative flex-1 flex items-center rounded-xl bg-surface border border-line focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 overflow-hidden">
                          <input
                            type="text"
                            value={slugInput}
                            onChange={(e) => setSlugInput(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                            placeholder="my-company"
                            maxLength={48}
                            className="flex-1 px-3 py-2 text-[13px] font-mono bg-transparent text-ink placeholder:text-ink-3 outline-none"
                          />
                          <span className="px-3 py-2 text-[12.5px] font-mono text-ink-3 bg-surface-2 border-l border-line select-none">
                            .{HELP_BASE_DOMAIN}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setIsEditingSlug(false);
                              setSlugInput(workspace.slug || '');
                              setShowSlugConfirm(false);
                            }}
                            disabled={savingSlug}
                            className="btn btn-sm btn-secondary"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowSlugConfirm(true)}
                            disabled={
                              savingSlug ||
                              slugAvailability.checking ||
                              slugAvailability.available === false ||
                              !slugInput.trim() ||
                              slugInput.trim().toLowerCase() === (workspace.slug || '').toLowerCase()
                            }
                            className="btn btn-sm btn-primary"
                          >
                            {savingSlug ? 'Saving...' : 'Save Slug'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Availability Status Feedback */}
                    <div className="text-[12px]">
                      {slugAvailability.checking ? (
                        <div className="flex items-center gap-1.5 text-ink-3">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Checking availability...</span>
                        </div>
                      ) : slugAvailability.available === true ? (
                        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>https://{slugAvailability.formattedSlug}.{HELP_BASE_DOMAIN} is available!</span>
                        </div>
                      ) : slugAvailability.error ? (
                        <div className="flex items-center gap-1.5 text-rose-500 font-medium">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>{slugAvailability.error}</span>
                        </div>
                      ) : (
                        <span className="text-ink-3">
                          Only lowercase letters, numbers, and hyphens (min 2 chars).
                        </span>
                      )}
                    </div>

                    {/* Confirmation Modal / Alert */}
                    {showSlugConfirm && (
                      <div className="p-3.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200 text-[12.5px] space-y-2.5">
                        <div className="font-semibold flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>Are you sure you want to change your slug?</span>
                        </div>
                        <p className="text-[12px] opacity-90 leading-relaxed">
                          Your Help Center will be permanently moved to <strong className="font-mono text-ink">https://{slugInput.trim().toLowerCase()}.{HELP_BASE_DOMAIN}</strong>. You can only customize this once.
                        </p>
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={handleSaveSlug}
                            disabled={savingSlug}
                            className="btn btn-sm btn-primary bg-amber-600 hover:bg-amber-700 text-white border-none"
                          >
                            {savingSlug ? 'Saving...' : 'Yes, Permanently Save Slug'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowSlugConfirm(false)}
                            className="btn btn-sm btn-secondary"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-[13px] font-mono text-ink-2 bg-surface-2 px-3 py-2 rounded-lg border border-line">
                    <span className="text-ink font-semibold">{workspace.slug || workspace.id}</span>
                    <span className="text-ink-3">.{HELP_BASE_DOMAIN}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 2. Custom Domain Configuration Form */}
            <div className="card p-6 space-y-5">
              <div className="border-b border-line pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-[15px] font-semibold text-ink">Custom Help Center Domain</h3>
                    {workspace.custom_domain && (
                      workspace.custom_domain_status === 'verified' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Live</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          <span>DNS Pending</span>
                        </span>
                      )
                    )}
                  </div>
                  <p className="text-[12px] text-ink-3 mt-1">
                    Connect your own domain (e.g. <code className="font-mono text-ink">help.{cleanDomain(workspace.website_url) || 'yourcompany.com'}</code>) with a single CNAME record. SSL is automatically provisioned.
                  </p>
                </div>

                {workspace.custom_domain && (
                  <button
                    type="button"
                    onClick={handleRemoveDomain}
                    className="btn btn-sm btn-secondary text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 gap-1.5 self-start sm:self-auto shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove Custom Domain</span>
                  </button>
                )}
              </div>

              {/* Connected / Live State */}
              {workspace.custom_domain && workspace.custom_domain_status === 'verified' ? (
                <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                        Active Custom Domain
                      </div>
                      <a
                        href={`https://${cleanDomain(workspace.custom_domain)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-[15px] font-bold text-emerald-800 dark:text-emerald-200 hover:underline truncate block"
                      >
                        https://{cleanDomain(workspace.custom_domain)}
                      </a>
                      <p className="text-[11.5px] text-emerald-700 dark:text-emerald-300/80">
                        Your Help Center is live with active SSL encryption. Traffic to your platform subdomain (<span className="font-mono font-medium">{workspace.slug || workspace.id}.{HELP_BASE_DOMAIN}</span>) and widget links automatically redirect here.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`https://${cleanDomain(workspace.custom_domain!)}`);
                          setCopiedPublicUrl(true);
                          setTimeout(() => setCopiedPublicUrl(false), 2000);
                          showStatus('Live URL copied to clipboard!');
                        }}
                        className="btn btn-sm btn-secondary gap-1.5"
                      >
                        {copiedPublicUrl ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedPublicUrl ? 'Copied' : 'Copy URL'}</span>
                      </button>

                      <a
                        href={`https://${cleanDomain(workspace.custom_domain)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-sm btn-primary bg-emerald-600 hover:bg-emerald-700 text-white border-none gap-1.5"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Visit Site</span>
                      </a>
                    </div>
                  </div>
                </div>
              ) : workspace.custom_domain ? (
                /* Connected / Pending DNS Verification State */
                <div className="space-y-5">
                  {/* Automated Polling Notice */}
                  <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200 text-[12.5px] flex items-start gap-2.5">
                    <RefreshCw className="w-4 h-4 shrink-0 text-amber-500 animate-spin mt-0.5" />
                    <div className="flex-1">
                      <div className="font-semibold text-amber-900 dark:text-amber-100 flex items-center justify-between">
                        <span>Waiting for DNS propagation for {cleanDomain(workspace.custom_domain)}</span>
                        <button
                          type="button"
                          onClick={handleVerifyDomain}
                          disabled={verifyingDomain}
                          className="text-[11.5px] font-bold text-amber-900 dark:text-amber-200 underline hover:opacity-80"
                        >
                          {verifyingDomain ? 'Checking now…' : 'Check Now'}
                        </button>
                      </div>
                      <p className="mt-0.5 text-[11.5px] opacity-90">
                        Our servers poll verification automatically every 30 seconds for the first 30 minutes, then hourly. Your Help Center will flip to <strong>Live</strong> and issue an SSL certificate automatically without you having to click verify.
                      </p>
                    </div>
                  </div>

                  {/* Exactly ONE Record to Add Card */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[13px] font-bold text-ink flex items-center gap-1.5">
                        <span>Step 1: Add exactly ONE record to your DNS</span>
                      </h4>
                      <span className="text-[11px] font-medium text-ink-3">CNAME record only</span>
                    </div>

                    {(() => {
                      const domain = cleanDomain(workspace.custom_domain);
                      const { hostRecord } = splitDomain(domain);
                      return (
                        <div className="rounded-xl border-2 border-line-2 bg-surface overflow-hidden text-[12.5px] shadow-xs">
                          <div className="grid grid-cols-12 px-4 py-2.5 bg-surface-2 border-b-2 border-line-2 font-bold text-ink text-[12px]">
                            <div className="col-span-2">Type</div>
                            <div className="col-span-4">Name / Host</div>
                            <div className="col-span-4">Target / Value</div>
                            <div className="col-span-2 text-right">Copy</div>
                          </div>

                          <div className="grid grid-cols-12 px-4 py-3 border-b border-line-2 items-center">
                            <div className="col-span-2 font-mono font-extrabold text-accent">CNAME</div>
                            <div className="col-span-4 font-mono text-ink font-semibold flex items-center gap-1.5">
                              <span className="truncate">{hostRecord}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(hostRecord);
                                  setCopiedHost(true);
                                  setTimeout(() => setCopiedHost(false), 2000);
                                  showStatus(`Copied host "${hostRecord}"`);
                                }}
                                className="text-ink-3 hover:text-ink shrink-0"
                                title="Copy Host"
                              >
                                {copiedHost ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </div>
                            <div className="col-span-4 font-mono text-ink font-semibold flex items-center gap-1.5">
                              <span className="truncate">{CNAME_TARGET}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(CNAME_TARGET);
                                  setCopiedCname(true);
                                  setTimeout(() => setCopiedCname(false), 2000);
                                  showStatus(`Copied target "${CNAME_TARGET}"`);
                                }}
                                className="text-ink-3 hover:text-ink shrink-0"
                                title="Copy Target"
                              >
                                {copiedCname ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </div>
                            <div className="col-span-2 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(CNAME_TARGET);
                                  setCopiedCname(true);
                                  setTimeout(() => setCopiedCname(false), 2000);
                                  showStatus(`Copied target "${CNAME_TARGET}"`);
                                }}
                                className="btn btn-xs btn-secondary font-bold"
                              >
                                {copiedCname ? 'Copied' : 'Copy'}
                              </button>
                            </div>
                          </div>

                          {/* Extra TXT Challenge ONLY if Vercel reported domain is owned by another account */}
                          {expectedDnsData?.hasTxtChallenge && expectedDnsData.records
                            ?.filter((r: any) => r.type === 'TXT')
                            .map((txtRec: any, idx: number) => (
                              <div key={idx} className="grid grid-cols-12 px-4 py-3 bg-amber-500/5 border-t border-amber-500/20 items-center">
                                <div className="col-span-2 font-mono font-extrabold text-amber-500">{txtRec.type}</div>
                                <div className="col-span-4 font-mono text-ink font-semibold truncate">{txtRec.name}</div>
                                <div className="col-span-4 font-mono text-ink font-semibold truncate">{txtRec.value}</div>
                                <div className="col-span-2 text-right">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(txtRec.value);
                                      setCopiedTxt(true);
                                      setTimeout(() => setCopiedTxt(false), 2000);
                                      showStatus('Copied verification TXT record!');
                                    }}
                                    className="btn btn-xs btn-secondary font-bold"
                                  >
                                    {copiedTxt ? 'Copied' : 'Copy'}
                                  </button>
                                </div>
                              </div>
                            ))}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Step 2: Detected DNS Provider Specific Instructions */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[13px] font-bold text-ink flex items-center gap-2">
                        <span>Step 2: Follow instructions for your DNS provider</span>
                        {dnsProviderGuide && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-surface-3 text-ink-2 border border-line">
                            Detected: {dnsProviderGuide.name}
                          </span>
                        )}
                      </h4>
                    </div>

                    {/* Critical Cloudflare Warning Banner if Cloudflare is detected */}
                    {dnsProviderGuide?.isCloudflare && (
                      <div className="p-3.5 rounded-xl border-2 border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-100 text-[12.5px] space-y-1.5">
                        <div className="font-bold flex items-center gap-1.5 text-amber-800 dark:text-amber-200">
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>CRITICAL FOR CLOUDFLARE: Set Proxy Status to &ldquo;DNS only&rdquo;</span>
                        </div>
                        <p className="text-[12px] opacity-95 leading-relaxed">
                          Turn off the orange cloud proxy by toggling <strong>Proxy status</strong> to <strong>DNS only (gray cloud)</strong>. Cloudflare&apos;s proxy hides the CNAME target from Vercel, preventing SSL certificate generation.
                        </p>
                      </div>
                    )}

                    {/* Step-by-step checklist */}
                    {dnsProviderGuide?.steps && (
                      <div className="p-4 rounded-xl bg-surface-2 border border-line space-y-2 text-[12.5px]">
                        <ol className="list-decimal list-inside space-y-1.5 text-ink-2 leading-relaxed">
                          {dnsProviderGuide.steps.map((step, idx) => (
                            <li key={idx} className="pl-1">
                              <span className="text-ink">{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Unconnected / 1-Step Connect Form */
                <div className="space-y-3">
                  <label className="field-label font-semibold text-ink">
                    Help Center Subdomain:
                  </label>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="relative flex-1 flex items-center rounded-xl bg-surface border border-line focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 overflow-hidden">
                      <span className="px-3 py-2 text-[13px] font-mono text-ink-3 bg-surface-2 border-r border-line select-none">
                        https://
                      </span>
                      <input
                        type="text"
                        value={customDomainInput}
                        onChange={(e) => {
                          const val = e.target.value.toLowerCase().trim();
                          setCustomDomainInput(val);
                          setDomainValidationError(null);
                        }}
                        placeholder={`help.${cleanDomain(workspace.website_url) || 'yourcompany.com'}`}
                        className="flex-1 px-3 py-2 text-[13px] font-mono bg-transparent text-ink placeholder:text-ink-3 outline-none"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleConnectDomain}
                      disabled={connectingDomain || !customDomainInput.trim()}
                      className="btn btn-primary px-5 gap-1.5 shrink-0"
                    >
                      {connectingDomain ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Connecting…</span>
                        </>
                      ) : (
                        <span>Connect</span>
                      )}
                    </button>
                  </div>

                  {/* Inline Error / Apex Explanation */}
                  {domainValidationError ? (
                    <div className="p-3 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[12px] flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{domainValidationError}</span>
                    </div>
                  ) : (
                    <p className="text-[11.5px] text-ink-3">
                      Enter a subdomain such as <code className="font-mono text-ink">help.{cleanDomain(workspace.website_url) || 'yourcompany.com'}</code>. Root apex domains (e.g. <code className="font-mono">{cleanDomain(workspace.website_url) || 'yourcompany.com'}</code>) cannot use CNAME records and require a subdomain prefix.
                    </p>
                  )}
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
                        <span className="text-[11px] text-ink-3">Default: Help</span>
                      </label>
                      <input
                        type="text"
                        value={navbarConfig.label}
                        onChange={(e) => setNavbarConfig({ ...navbarConfig, label: e.target.value })}
                        placeholder="Help"
                        className="input font-semibold text-[14px]"
                      />
                      <p className="text-[11px] text-ink-3">
                        Always adds a new link with this text into your website menu. Never alters or hijacks existing website links.
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
                        <option value="redirect">
                          🌐 Open Help Center in new tab (Recommended)
                        </option>
                        <option value="help">📖 Open Help &amp; FAQs Slide-out Panel</option>
                        <option value="messages">💬 Open Live Chat Messenger</option>
                      </select>
                      <p className="text-[11px] text-ink-3">
                        Opens your Help Center ({getWorkspaceHelpCenterUrl(workspace)}) or slides open the chat widget.
                      </p>
                    </div>
                  </div>

                  {/* Position & Styling Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-line/60">
                    <div className="space-y-1.5 p-3.5 rounded-xl border border-line bg-surface-2">
                      <label className="text-[12.5px] font-semibold text-ink block">Placement Position</label>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <button
                          type="button"
                          onClick={() => setNavbarConfig({ ...navbarConfig, position: 'end' })}
                          className={cn(
                            'px-3 py-1.5 rounded-lg border text-center text-[12px] font-medium transition-all',
                            navbarConfig.position !== 'start'
                              ? 'border-accent bg-accent/10 text-accent font-semibold'
                              : 'border-line bg-surface text-ink-2 hover:bg-surface-3'
                          )}
                        >
                          End of Menu (Default)
                        </button>
                        <button
                          type="button"
                          onClick={() => setNavbarConfig({ ...navbarConfig, position: 'start' })}
                          className={cn(
                            'px-3 py-1.5 rounded-lg border text-center text-[12px] font-medium transition-all',
                            navbarConfig.position === 'start'
                              ? 'border-accent bg-accent/10 text-accent font-semibold'
                              : 'border-line bg-surface text-ink-2 hover:bg-surface-3'
                          )}
                        >
                          Start of Menu
                        </button>
                      </div>
                      <p className="text-[11px] text-ink-3 mt-1">
                        Appends the link at the end of your main navigation bar or prepends it as the first item.
                      </p>
                    </div>

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
                      <p className="text-[11px] text-ink-3 mt-1">
                        Copies fonts and spacing from existing menu links or styles as a prominent pill badge.
                      </p>
                    </div>
                  </div>

                  {/* Simulator Preview & Trigger */}
                  <div className="p-4 rounded-xl border border-line bg-surface-2/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <span className="text-[13px] font-semibold text-ink flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-accent" />
                        <span>Interactive Website Simulator</span>
                      </span>
                      <p className="text-[11.5px] text-ink-3">
                        Test and see how your menu link looks live on your site layout.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsNavbarSimulatorOpen(true)}
                      className="btn btn-sm btn-secondary gap-1.5 shrink-0"
                    >
                      <Laptop className="w-3.5 h-3.5" />
                      <span>Preview in Simulator</span>
                    </button>
                  </div>

                  {/* HTML Snippet & Optional Selector Fallback */}
                  <div className="p-4 rounded-xl border border-line/80 bg-surface-2/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-semibold text-ink flex items-center gap-1.5">
                        <Code className="w-3.5 h-3.5 text-ink-3" />
                        <span>Manual HTML Snippet (If Automatic Detection is not preferred)</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg p-2 font-mono text-[12px] text-slate-300">
                      <input
                        type="text"
                        readOnly
                        value={`<a href="${getWorkspaceHelpCenterUrl(workspace)}" target="_blank" rel="noopener noreferrer">${navbarConfig.label || 'Help'}</a>`}
                        className="bg-transparent border-none outline-hidden flex-1 text-slate-300 font-mono text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(
                            `<a href="${getWorkspaceHelpCenterUrl(workspace)}" target="_blank" rel="noopener noreferrer">${navbarConfig.label || 'Help'}</a>`
                          );
                          showStatus('HTML snippet copied to clipboard!');
                        }}
                        className="btn btn-xs btn-primary shrink-0 gap-1"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Copy HTML</span>
                      </button>
                    </div>

                    <div className="space-y-1 pt-1">
                      <label className="text-[11.5px] font-semibold text-ink block">
                        Optional Custom CSS Selector
                      </label>
                      <input
                        type="text"
                        value={navbarConfig.target_selector || ''}
                        onChange={(e) => setNavbarConfig({ ...navbarConfig, target_selector: e.target.value })}
                        placeholder="header nav ul, #primary-navigation"
                        className="input h-8 text-[12px] font-mono"
                      />
                      <p className="text-[11px] text-ink-3">
                        Leave blank to automatically detect the main navigation header list.
                      </p>
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
                      <h3 className="text-[17px] font-bold text-ink">Install Zen-try &amp; Help Center Widget</h3>
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
                    const host = typeof window !== 'undefined' ? window.location.origin : 'https://zen-try.com';
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
                const host = typeof window !== 'undefined' ? window.location.origin : 'https://zen-try.com';
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
                        const code = `<button data-zentry-help class="help-btn">\n  📖 Help & FAQs\n</button>`;
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
                    <code>&lt;button data-zentry-help class=&quot;help-btn&quot;&gt;&#10;  📖 Help &amp; FAQs&#10;&lt;/button&gt;</code>
                  </div>
                </div>

                {/* Specific Article Trigger */}
                <div className="p-4 rounded-xl border border-line bg-surface space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-semibold text-ink">2. Deep Link to a Specific Article</span>
                    <button
                      type="button"
                      onClick={() => {
                        const code = `<button data-zentry-article="your-article-slug">\n  Read Getting Started Guide ↗\n</button>`;
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
                    <code>&lt;button data-zentry-article=&quot;your-article-slug&quot;&gt;&#10;  Read Getting Started Guide ↗&#10;&lt;/button&gt;</code>
                  </div>
                </div>

                {/* Open Chat Trigger */}
                <div className="p-4 rounded-xl border border-line bg-surface space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-semibold text-ink">3. Open Live Chat Directly</span>
                    <button
                      type="button"
                      onClick={() => {
                        const code = `<button data-zentry-open data-zentry-tab="messages">\n  Chat with Support\n</button>`;
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
                    <code>&lt;button data-zentry-open data-zentry-tab=&quot;messages&quot;&gt;&#10;  Chat with Support&#10;&lt;/button&gt;</code>
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
                    <h4 className="text-[14px] font-semibold text-ink">JavaScript SDK API (`window.Zentry`)</h4>
                    <p className="text-[12px] text-ink-3">
                      Control the widget programmatically in your frontend framework (React, Vue, Angular, Next.js).
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const jsCode = `// Open Help Center Tab directly\nwindow.Zentry.openHelp();\n\n// Open Live Chat screen\nwindow.Zentry.openMessages();\n\n// Search articles programmatically\nwindow.Zentry.search('billing');\n\n// Open specific article by slug\nwindow.Zentry.openArticle('how-to-reset-password');\n\n// Toggle widget\nwindow.Zentry.toggle();\n\n// Check if widget is open\nconsole.log(window.Zentry.isOpen());`;
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
window.Zentry.openHelp();

// 2. Open Live Chat screen
window.Zentry.openMessages();

// 3. Search articles programmatically
window.Zentry.search('billing');

// 4. Open specific article by slug
window.Zentry.openArticle('how-to-reset-password');

// 5. Toggle or close widget
window.Zentry.toggle();
window.Zentry.close();`}</code></pre>
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
                    const host = typeof window !== 'undefined' ? window.location.origin : 'https://zen-try.com';
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
                const host = typeof window !== 'undefined' ? window.location.origin : 'https://zen-try.com';
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
        {/* WEBSITE NAVBAR BUTTON SIMULATOR & PREVIEW MODAL */}
        {isNavbarSimulatorOpen && (
          <NavbarPreviewModal
            isOpen={isNavbarSimulatorOpen}
            onClose={() => setIsNavbarSimulatorOpen(false)}
            workspace={workspace}
            onConfigSaved={(updatedWs) => {
              setWorkspace(updatedWs);
              onWorkspaceUpdated?.(updatedWs);
              showStatus('Navbar settings saved! Live on your website.');
            }}
            showToast={(msg, type) => showStatus(msg, type)}
          />
        )}
      </div>
    </div>
  );
}
