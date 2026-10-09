'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Bot,
  Clock,
  Code2,
  MessageSquareText,
  Palette,
  Share2,
  Users,
  Globe,
  Mail,
  Search,
  X,
  ExternalLink,
  Copy,
  Check,
  ChevronRight,
  ChevronDown,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Menu,
  ShieldCheck,
  Smartphone,
  Network,
} from 'lucide-react';
import { Agent, CannedResponse, Workspace } from '@/types/database';
import { cn } from '@/lib/utils';
import { InstallationGuide } from '@/components/dashboard/InstallationGuide';
import { MobileAppSettingsCard } from '@/components/dashboard/MobileAppSettingsCard';
import { SMTPSettingsSection } from '@/components/admin/SMTPSettingsSection';
import {
  IntegrationsSettings,
  type IntegrationTab,
} from '@/components/dashboard/IntegrationsSettings';
import { ChannelsSettings } from '@/components/channels/ChannelsSettings';
import {
  AdminSettingsPanel,
  type AdminTab,
} from '@/components/admin/AdminSettingsPanel';
import { TeamSettings } from '@/components/team/TeamSettings';
import { GroupsSettings } from '@/components/team/GroupsSettings';
import { createClient } from '@/lib/supabase/client';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export type SectionId =
  | 'widget'
  | 'install'
  | 'mobile'
  | 'channels'
  | 'email'
  | 'domains'
  | 'team'
  | 'groups'
  | 'routing'
  | 'replies'
  | 'ai';

export interface SettingItem {
  id: SectionId;
  label: string;
  description: string;
  Icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
  keywords: string[];
  getBadge?: (ctx: {
    workspace: Workspace | null;
    agents: Agent[];
    cannedResponses: CannedResponse[];
    hasVisitors: boolean;
    connectedChannelsCount?: number;
  }) => { text: string; variant: 'emerald' | 'amber' | 'blue' | 'neutral' } | null;
}

export interface SettingGroup {
  id: string;
  title: string;
  description?: string;
  items: SettingItem[];
}

const SETTING_GROUPS: SettingGroup[] = [
  {
    id: 'appearance',
    title: 'Chat Widget & Setup',
    description: 'Customize live chat design, launcher and embed on your website',
    items: [
      {
        id: 'widget',
        label: 'Widget & Branding',
        description: 'Brand colors, logo, floating launcher button, greetings & help tab',
        Icon: Palette,
        adminOnly: true,
        keywords: [
          'widget',
          'brand',
          'color',
          'logo',
          'avatar',
          'launcher',
          'icon',
          'theme',
          'position',
          'greeting',
          'welcome',
          'help tab',
        ],
        getBadge: ({ workspace }) => {
          if (workspace?.brand_color || workspace?.logo_url) {
            return { text: 'Customized', variant: 'emerald' };
          }
          return { text: 'Default Theme', variant: 'neutral' };
        },
      },
      {
        id: 'install',
        label: 'Website Installation',
        description: '1-click copy embed script for HTML, WordPress, Shopify, Next.js',
        Icon: Code2,
        adminOnly: false,
        keywords: [
          'install',
          'embed',
          'script',
          'code',
          'snippet',
          'wordpress',
          'shopify',
          'html',
          'react',
          'nextjs',
          'tracking',
        ],
        getBadge: ({ hasVisitors }) =>
          hasVisitors
            ? { text: 'Live Traffic', variant: 'emerald' }
            : { text: 'Ready to Embed', variant: 'blue' },
      },
      {
        id: 'mobile',
        label: 'Mobile App & Shortcuts',
        description: 'Add Zen-try to your Android or iPhone home screen without Play Store',
        Icon: Smartphone,
        adminOnly: false,
        keywords: [
          'mobile',
          'app',
          'pwa',
          'android',
          'iphone',
          'ios',
          'shortcut',
          'home screen',
          'install',
          'play store',
          'qr',
        ],
        getBadge: () => ({ text: 'PWA Ready', variant: 'emerald' }),
      },
      {
        id: 'channels',
        label: 'Omnichannel Chat',
        description: 'Connect WhatsApp through the official Business API, plus Messenger, LinkedIn & Slack alerts',
        Icon: Share2,
        adminOnly: true,
        keywords: [
          'channels',
          'whatsapp',
          'meta',
          'instagram',
          'facebook',
          'slack',
          'omnichannel',
          'social',
          'alerts',
          'notifications',
        ],
        getBadge: ({ connectedChannelsCount = 0 }) => ({
          text: `${connectedChannelsCount} connected`,
          variant: connectedChannelsCount > 0 ? 'emerald' : 'neutral',
        }),
      },
    ],
  },
  {
    id: 'delivery',
    title: 'Email & Domains',
    description: 'Outbox email credentials and custom branded domains',
    items: [
      {
        id: 'email',
        label: 'Email (SMTP)',
        description: 'SMTP credentials, delivery testing & 5-minute unread email alerts',
        Icon: Mail,
        adminOnly: true,
        keywords: [
          'email',
          'smtp',
          'hostinger',
          'gmail',
          'outlook',
          'zoho',
          'mail',
          'unread',
          'notifications',
          'port',
          'password',
          'alert',
          'outbox',
        ],
        getBadge: ({ workspace }) => {
          const user = (workspace?.smtp_settings as any)?.user;
          return user
            ? { text: 'SMTP Active', variant: 'emerald' }
            : { text: 'Setup Required', variant: 'amber' };
        },
      },
      {
        id: 'domains',
        label: 'Custom Domains & DNS',
        description: 'Help Center custom subdomain, CNAME setup & SSL verification',
        Icon: Globe,
        adminOnly: true,
        keywords: [
          'domain',
          'cname',
          'dns',
          'help center',
          'ssl',
          'subdomain',
          'url',
          'custom domain',
          'branding',
        ],
        getBadge: ({ workspace }) => {
          if (!workspace?.custom_domain?.trim()) {
            return { text: 'Live', variant: 'emerald' };
          }
          if (workspace?.custom_domain_status === 'verified') {
            return { text: 'Domain Verified', variant: 'emerald' };
          }
          if (workspace?.custom_domain_status === 'failed') {
            return { text: 'DNS Check Failed', variant: 'amber' };
          }
          return { text: 'DNS Pending', variant: 'amber' };
        },
      },
    ],
  },
  {
    id: 'teamwork',
    title: 'Team & Availability',
    description: 'Manage agents, business hours, routing and quick shortcuts',
    items: [
      {
        id: 'team',
        label: 'Team Members & Roles',
        description: 'Invite colleagues by email, set roles, capacity and deactivate people',
        Icon: Users,
        adminOnly: true,
        keywords: [
          'team',
          'agent',
          'member',
          'invite',
          'role',
          'admin',
          'agents',
          'permission',
          'teammates',
          'coworkers',
        ],
        getBadge: ({ agents }) => ({
          text: `${agents.length} Member${agents.length === 1 ? '' : 's'}`,
          variant: 'neutral',
        }),
      },
      {
        id: 'groups',
        label: 'Groups & Routing',
        description: 'Billing, Technical and other groups, who is in them, and round-robin assignment',
        Icon: Network,
        adminOnly: true,
        keywords: ['group', 'groups', 'billing', 'technical', 'round robin', 'round-robin', 'assignment', 'queue', 'capacity', 'routing'],
        getBadge: () => null,
      },
      {
        id: 'routing',
        label: 'Hours & Availability',
        description: 'Weekly business hours schedule and auto-assignment rules',
        Icon: Clock,
        adminOnly: true,
        keywords: [
          'hours',
          'schedule',
          'availability',
          'business hours',
          'timezone',
          'offline',
          'assignment',
          'routing',
          'auto assign',
        ],
        getBadge: ({ workspace }) => {
          const bh = workspace?.business_hours as any;
          if (!bh || !bh.enabled) {
            return { text: '24/7 Always Open', variant: 'neutral' };
          }
          const schedule = bh.schedule || {};
          const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
          const activeDays = days.filter((d) => schedule[d]?.enabled);
          if (activeDays.length === 0) {
            return { text: 'Closed', variant: 'amber' };
          }
          if (activeDays.length === 5 && !schedule.saturday?.enabled && !schedule.sunday?.enabled) {
            const mon = schedule.monday;
            return { text: `Mon–Fri ${mon?.start || '09:00'}–${mon?.end || '17:00'}`, variant: 'emerald' };
          }
          if (activeDays.length === 7) {
            const mon = schedule.monday;
            return { text: `Everyday ${mon?.start || '09:00'}–${mon?.end || '17:00'}`, variant: 'emerald' };
          }
          return { text: `${activeDays.length} Days/wk`, variant: 'emerald' };
        },
      },
      {
        id: 'replies',
        label: 'Saved Quick Replies',
        description: 'Pre-written response templates for lightning-fast customer support',
        Icon: MessageSquareText,
        adminOnly: true,
        keywords: [
          'canned',
          'replies',
          'saved replies',
          'templates',
          'shortcuts',
          'macros',
          'quick response',
        ],
        getBadge: ({ cannedResponses }) => ({
          text: `${cannedResponses.length} Saved`,
          variant: 'neutral',
        }),
      },
    ],
  },
  {
    id: 'intelligence',
    title: 'AI & Automation',
    description: 'Self-service AI replies, model choices and agent copilot',
    items: [
      {
        id: 'ai',
        label: 'AI Assistant & Knowledge Agent',
        description: 'Unified AI assistant, knowledge base auto-pilot and model provider',
        Icon: Bot,
        adminOnly: true,
        keywords: [
          'ai',
          'bot',
          'copilot',
          'llm',
          'model',
          'openrouter',
          'gpt',
          'claude',
          'langgraph',
          'assistant',
          'smart reply',
          'knowledge base',
          'autopilot',
        ],
        getBadge: ({ workspace }) => {
          const enabled = (workspace?.ai_settings as any)?.enabled;
          return enabled !== false
            ? { text: 'AI Active', variant: 'emerald' }
            : { text: 'Disabled', variant: 'neutral' };
        },
      },
    ],
  },
];

function AutoCloseSettingsCard({
  workspace,
  onWorkspaceUpdated,
}: {
  workspace: Workspace | null;
  onWorkspaceUpdated?: (ws: Workspace) => void;
}) {
  const [days, setDays] = useState<number>(
    workspace?.auto_close_days ?? 7
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isRunningNow, setIsRunningNow] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspace?.id) return;
    setIsSaving(true);
    setStatusMsg(null);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('workspaces')
        .update({ auto_close_days: days })
        .eq('id', workspace.id);

      if (error) throw error;
      onWorkspaceUpdated?.({ ...workspace, auto_close_days: days });
      setStatusMsg({ text: 'Auto-close rule updated successfully.', type: 'success' });
      setTimeout(() => setStatusMsg(null), 3500);
    } catch (err: any) {
      setStatusMsg({ text: err.message || 'Failed to save rule.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRunNow = async () => {
    if (!workspace?.id || isRunningNow) return;
    setIsRunningNow(true);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/conversations/auto-close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace_id: workspace.id, days }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMsg({
          text: `Auto-close check complete: ${data.closed_count} inactive conversation(s) resolved.`,
          type: 'success',
        });
      } else {
        throw new Error(data.error || 'Failed to run auto-close');
      }
    } catch (err: any) {
      setStatusMsg({ text: err.message || 'Auto-close run failed.', type: 'error' });
    } finally {
      setIsRunningNow(false);
    }
  };

  return (
    <div className="p-4 rounded-2xl border border-line bg-surface-2 space-y-3.5">
      <form onSubmit={handleSave} className="flex flex-wrap items-center gap-3">
        <label className="text-xs font-medium text-ink flex items-center gap-2">
          <span>Resolve conversations inactive for</span>
          <input
            type="number"
            min={1}
            max={365}
            value={days}
            onChange={(e) => setDays(Math.max(1, parseInt(e.target.value) || 1))}
            className="input input-sm w-20 text-center font-bold text-ui bg-surface border-line"
          />
          <span>days (default: 7)</span>
        </label>

        <div className="flex items-center gap-2 ml-auto">
          <button
            type="submit"
            disabled={isSaving}
            className="btn btn-sm btn-primary shadow-xs"
          >
            {isSaving ? 'Saving…' : 'Save Rule'}
          </button>
          <button
            type="button"
            onClick={handleRunNow}
            disabled={isRunningNow}
            className="btn btn-sm btn-secondary gap-1.5 shadow-xs"
            title="Scan and resolve stale conversations immediately"
          >
            <Clock className={cn('w-3.5 h-3.5', isRunningNow && 'animate-spin text-accent')} />
            <span>{isRunningNow ? 'Running…' : 'Run Rule Now'}</span>
          </button>
        </div>
      </form>

      {statusMsg && (
        <div
          className={cn(
            'p-2.5 rounded-xl text-xs font-medium flex items-center gap-2 animate-in fade-in duration-150',
            statusMsg.type === 'success'
              ? 'bg-success/10 text-success border border-success/20'
              : 'bg-danger/10 text-danger border border-danger/20'
          )}
        >
          {statusMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}
    </div>
  );
}

interface SettingsHubProps {
  workspace: Workspace | null;
  currentAgent: Agent | null;
  agents: Agent[];
  cannedResponses: CannedResponse[];
  hasVisitors?: boolean;
  latestVisitorUrl?: string;
  initialSection?: SectionId;
  /** Bumped by the command palette so picking the same section again still jumps there. */
  sectionNonce?: number;
  onWorkspaceUpdated?: (ws: Workspace) => void;
}

/** Settings sections the caller may open, for the command palette. */
export function settingsSections(isAdmin: boolean): { id: SectionId; label: string; description: string; keywords: string[]; group: string }[] {
  return SETTING_GROUPS.flatMap((g) =>
    g.items
      .filter((item) => !item.adminOnly || isAdmin)
      .map((item) => ({ id: item.id, label: item.label, description: item.description, keywords: item.keywords, group: g.title }))
  );
}

export function SettingsHub({
  workspace,
  currentAgent,
  agents,
  cannedResponses,
  hasVisitors = false,
  latestVisitorUrl,
  initialSection,
  sectionNonce,
  onWorkspaceUpdated,
}: SettingsHubProps) {
  const isAdmin =
    currentAgent?.role === 'admin' || currentAgent?.role === 'owner';

  const [active, setActive] = useState<SectionId>(initialSection || 'widget');
  const [searchQuery, setSearchQuery] = useState('');
  const [channelTab, setChannelTab] = useState<IntegrationTab | 'channels'>('channels');
  const [copiedWsId, setCopiedWsId] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [topDropdownOpen, setTopDropdownOpen] = useState(false);
  const [integrations, setIntegrations] = useState<any>(null);
  const [liveChannels, setLiveChannels] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialSection) {
      setActive(initialSection);
    }
  }, [initialSection, sectionNonce]);

  useEffect(() => {
    if (!workspace?.id) return;
    const supabase = createClient();
    supabase
      .from('workspace_integrations')
      .select('*')
      .eq('workspace_id', workspace.id)
      .maybeSingle()
      .then(({ data }: { data: any }) => {
        if (data) setIntegrations(data);
      });
    // Channels on the channel framework (WhatsApp today).
    supabase
      .from('channel_connections')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspace.id)
      .neq('status', 'disconnected')
      .then(({ count }: { count: number | null }) => setLiveChannels(count || 0));
  }, [workspace?.id]);

  const connectedChannelsCount = useMemo(() => {
    let count = liveChannels;
    if (!integrations) return count;
    if (integrations.meta_enabled && integrations.meta_page_access_token?.trim()) count++;
    if (integrations.linkedin_enabled && integrations.linkedin_access_token?.trim()) count++;
    if (integrations.slack_enabled && integrations.slack_webhook_url?.trim()) count++;
    return count;
  }, [integrations, liveChannels]);

  // Scroll content to top whenever switching tabs
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [active, channelTab]);

  const handleSelectTab = (tabId: SectionId) => {
    setActive(tabId);
    setMobileMenuOpen(false);
    setTopDropdownOpen(false);
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  const allAllowedItems = useMemo(() => {
    return SETTING_GROUPS.flatMap((g) => g.items.filter((item) => !item.adminOnly || isAdmin));
  }, [isAdmin]);

  // Filter groups and sections based on role and search query
  const filteredGroups = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return SETTING_GROUPS.map((group) => {
      const allowedItems = group.items.filter(
        (item) => !item.adminOnly || isAdmin
      );

      if (!q) {
        return {
          ...group,
          items: allowedItems,
        };
      }

      const matchingItems = allowedItems.filter((item) => {
        const matchLabel = item.label.toLowerCase().includes(q);
        const matchDesc = item.description.toLowerCase().includes(q);
        const matchKeywords = item.keywords.some((k) => k.toLowerCase().includes(q));
        return matchLabel || matchDesc || matchKeywords;
      });

      return {
        ...group,
        items: matchingItems,
      };
    }).filter((group) => group.items.length > 0);
  }, [searchQuery, isAdmin]);

  // Find active item definition
  const allAvailableItems = useMemo(() => {
    return SETTING_GROUPS.flatMap((g) => g.items).filter(
      (item) => !item.adminOnly || isAdmin
    );
  }, [isAdmin]);

  const currentItem =
    allAvailableItems.find((item) => item.id === active) ||
    allAvailableItems[0] ||
    SETTING_GROUPS[0].items[0];

  // Find parent group for breadcrumb
  const currentGroup = useMemo(() => {
    return SETTING_GROUPS.find((group) =>
      group.items.some((item) => item.id === currentItem.id)
    );
  }, [currentItem.id]);

  const copyWorkspaceId = () => {
    if (!workspace?.id) return;
    navigator.clipboard.writeText(workspace.id);
    setCopiedWsId(true);
    setTimeout(() => setCopiedWsId(false), 2000);
  };

  const adminTabFor: Partial<Record<SectionId, AdminTab>> = {
    widget: 'widget',
    domains: 'domain',
    team: 'team',
    replies: 'canned',
    routing: 'hours',
    ai: 'ai',
  };

  const renderAdmin = (tab: AdminTab) =>
    workspace && currentAgent ? (
      <AdminSettingsPanel
        embedded
        tab={tab}
        workspace={workspace}
        currentAgent={currentAgent}
        initialAgents={agents}
        initialCannedResponses={cannedResponses}
        onWorkspaceUpdated={onWorkspaceUpdated}
      />
    ) : null;

  const renderIntegrations = (tab: IntegrationTab) => (
    <IntegrationsSettings embedded tab={tab} workspace={workspace} />
  );

  return (
    <div className="flex-1 min-w-0 h-screen flex flex-col bg-canvas text-ink overflow-hidden font-sans">
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 1. TOP HEADER & WORKSPACE QUICK BAR */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <header className="shrink-0 px-4 md:px-7 h-16 flex items-center justify-between border-b border-line bg-surface z-10">
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile / Narrow Screen Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="min-[1100px]:hidden p-1.5 rounded-lg border border-line bg-surface-2 hover:bg-surface-3 text-ink-2"
            title="Toggle Settings Navigation"
          >
            <Menu className="w-4 h-4" />
          </button>

          {/* Workspace Avatar & Name */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-surface-2 border border-line flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
              {workspace?.logo_url ? (
                <img
                  src={workspace.logo_url}
                  alt={workspace.name || 'Workspace'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="font-bold text-xs text-accent">
                  {(workspace?.name || 'W').charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm tracking-tight truncate text-ink">
                  {workspace?.name || 'Workspace Settings'}
                </span>
                <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-2xs font-medium bg-surface-3 text-ink-3">
                  Settings Hub
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Quick Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Copy Workspace ID */}
          {workspace?.id && (
            <button
              onClick={copyWorkspaceId}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-line bg-surface-2/60 hover:bg-surface-3 text-xs text-ink-2 font-mono transition-colors shadow-xs"
              title="Click to copy your unique Workspace ID"
            >
              {copiedWsId ? (
                <>
                  <Check className="w-3.5 h-3.5 text-success" />
                  <span className="text-success font-sans font-medium text-2xs">
                    Copied!
                  </span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-ink-3" />
                  <span className="text-2xs truncate max-w-[120px]">
                    {workspace.id}
                  </span>
                </>
              )}
            </button>
          )}

          {/* Test Live Widget / Open Demo */}
          <button
            onClick={() => {
              const url = workspace?.id
                ? `/demo.html?workspaceId=${workspace.id}&workspaceName=${encodeURIComponent(workspace.name || '')}`
                : '/demo.html';
              window.open(url, '_blank');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-white hover:opacity-95 text-xs font-medium transition-all shadow-xs"
            title="Open test website simulator in a new tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Test Live Widget</span>
            <span className="sm:hidden">Test</span>
          </button>

          {/* Theme switcher inside Settings */}
          <ThemeToggle className="shrink-0" />
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 2. MAIN LAYOUT: CATEGORIZED SIDEBAR + SECTION CONTENT */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex min-h-0 relative">
        {/* Left Navigation Sidebar */}
        <nav
          className={cn(
            'w-72 shrink-0 border-r border-line-2 bg-surface flex flex-col transition-all duration-200 z-20 shadow-xs',
            mobileMenuOpen
              ? 'fixed inset-y-0 left-0 w-72 shadow-2xl bg-surface z-50 flex'
              : 'hidden min-[1100px]:flex'
          )}
        >
          {/* Search Box */}
          <div className="p-3 border-b border-line-2 bg-surface-2/40 shrink-0">
            <div className="relative flex items-center rounded-xl bg-surface border border-line-2 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 transition-all shadow-2xs">
              <Search className="w-4 h-4 text-ink-2 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search settings (logo, smtp, team)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9.5 pl-9 pr-8 text-ui bg-transparent text-ink placeholder:text-ink-2/70 font-medium focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-2 hover:text-ink p-1 rounded-md hover:bg-surface-3"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Categorized Navigation List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-5">
            {filteredGroups.length === 0 ? (
              <div className="p-6 text-center space-y-2.5 bg-surface-2/60 rounded-xl border border-line-2">
                <AlertCircle className="w-6 h-6 text-accent mx-auto" />
                <p className="text-ui font-semibold text-ink">
                  No settings match &ldquo;{searchQuery}&rdquo;
                </p>
                <p className="text-xs text-ink-2">
                  Try searching for keywords like <code className="font-mono bg-surface-3 px-1 py-0.5 rounded text-ink">logo</code>, <code className="font-mono bg-surface-3 px-1 py-0.5 rounded text-ink">smtp</code>, or <code className="font-mono bg-surface-3 px-1 py-0.5 rounded text-ink">team</code>.
                </p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="btn btn-xs btn-secondary font-semibold text-accent mt-1"
                >
                  Reset search
                </button>
              </div>
            ) : (
              filteredGroups.map((group) => (
                <div key={group.id} className="space-y-1.5">
                  <div className="px-2 py-1 flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-ink-2 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block" />
                      <span>{group.title}</span>
                    </span>
                    <span className="text-2xs px-1.5 py-0.5 rounded-md bg-surface-3 text-ink-2 font-bold font-mono">
                      {group.items.length}
                    </span>
                  </div>

                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const isActive = active === item.id;
                      const Icon = item.Icon;
                      const badge = item.getBadge?.({
                        workspace,
                        agents,
                        cannedResponses,
                        hasVisitors,
                        connectedChannelsCount,
                      });

                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSelectTab(item.id)}
                          aria-current={isActive ? 'page' : undefined}
                          className={cn(
                            'w-full min-h-[42px] px-3 py-2 rounded-xl flex items-center gap-2.5 text-left text-ui transition-all group',
                            isActive
                              ? 'bg-accent/10 border border-accent/40 text-accent font-bold shadow-xs ring-1 ring-accent/30 dark:bg-accent/20'
                              : 'text-ink/90 hover:bg-surface-2 hover:text-ink font-medium border border-transparent hover:border-line'
                          )}
                        >
                          <div
                            className={cn(
                              'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors',
                              isActive
                                ? 'bg-accent text-white shadow-xs'
                                : 'bg-surface-2 border border-line-2 text-ink-2 group-hover:text-accent group-hover:border-accent/40'
                            )}
                          >
                            <Icon className="w-4 h-4" />
                          </div>

                          <span className="flex-1 font-semibold text-ui leading-snug text-left line-clamp-2 break-words">{item.label}</span>

                          {badge && (
                            <span
                              className={cn(
                                'text-2xs px-2 py-0.5 rounded-full font-bold shrink-0 tracking-tight',
                                badge.variant === 'emerald' &&
                                  'bg-success/15 text-success border border-success/30',
                                badge.variant === 'amber' &&
                                  'bg-warn/15 text-warn border border-warn/30',
                                badge.variant === 'blue' &&
                                  'bg-accent/15 text-accent border border-accent/30',
                                badge.variant === 'neutral' &&
                                  'bg-surface-3 text-ink font-semibold border border-line-2'
                              )}
                            >
                              {badge.text}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Quick status bar at bottom of nav */}
          <div className="p-3 border-t border-line-2 bg-surface-2/60 text-xs text-ink-2 flex items-center justify-between font-medium">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-success inline-block shadow-xs animate-pulse" />
              <span className="font-semibold text-ink">System Online</span>
            </span>
            <span className="text-2xs font-mono font-bold px-1.5 py-0.5 rounded bg-surface-3 border border-line-2">v2.4 Pro</span>
          </div>
        </nav>

        {/* Backdrop for mobile drawer */}
        {mobileMenuOpen && (
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="min-[1100px]:hidden fixed inset-0 bg-overlay z-40"
          />
        )}

        {/* ───────────────────────────────────────────────────────────────── */}
        {/* 3. RIGHT CONTENT AREA: SECTION BODY */}
        {/* ───────────────────────────────────────────────────────────────── */}
        <main ref={contentRef} className="flex-1 min-w-0 overflow-y-auto flex flex-col bg-canvas">
          {/* Below 1100px Sub-navigation Bar: Collapsible Dropdown & Fast Horizontal Chips */}
          <div className="min-[1100px]:hidden shrink-0 border-b border-line-2 bg-surface px-4 py-2.5 space-y-2 sticky top-0 z-30 shadow-2xs bg-surface">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <button
                  type="button"
                  onClick={() => setTopDropdownOpen(!topDropdownOpen)}
                  className="w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl border border-line bg-surface-2 hover:bg-surface-3 text-left transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-6 h-6 rounded-lg bg-accent text-white flex items-center justify-center shrink-0">
                      <currentItem.Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-ui font-bold text-ink truncate">
                      {currentItem.label}
                    </span>
                    {currentGroup && (
                      <span className="text-2xs text-ink-3 hidden sm:inline">
                        ({currentGroup.title})
                      </span>
                    )}
                  </div>
                  <ChevronDown className={cn("w-4 h-4 text-ink-2 shrink-0 transition-transform", topDropdownOpen && "rotate-180")} />
                </button>

                {topDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 max-h-80 overflow-y-auto rounded-xl border border-line bg-surface shadow-2xl z-50 p-2 space-y-3">
                    {SETTING_GROUPS.map((group) => {
                      const groupItems = group.items.filter((item) => !item.adminOnly || isAdmin);
                      if (groupItems.length === 0) return null;
                      return (
                        <div key={group.id} className="space-y-1">
                          <div className="px-2 py-1 text-2xs font-bold uppercase tracking-wider text-ink-3">
                            {group.title}
                          </div>
                          {groupItems.map((item) => {
                            const isSelected = item.id === active;
                            const Icon = item.Icon;
                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => handleSelectTab(item.id)}
                                className={cn(
                                  'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-ui transition-colors',
                                  isSelected
                                    ? 'bg-accent/10 text-accent font-bold'
                                    : 'text-ink hover:bg-surface-2 font-medium'
                                )}
                              >
                                <Icon className="w-4 h-4 shrink-0 text-ink-2" />
                                <span className="flex-1 line-clamp-2 break-words leading-tight">{item.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Horizontal Scroll Bar */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
              {allAllowedItems.map((item) => {
                const isSelected = item.id === active;
                const Icon = item.Icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectTab(item.id)}
                    className={cn(
                      'shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap',
                      isSelected
                        ? 'bg-accent text-white font-bold shadow-xs'
                        : 'bg-surface-2 hover:bg-surface-3 text-ink-2 border border-line-2 hover:text-ink'
                    )}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          {/* Section Breadcrumb & Header Banner */}
          {currentItem && (
            <div className="px-6 md:px-8 pt-6 pb-5 border-b border-line-2 bg-surface shadow-2xs">
              <div className="max-w-5xl">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-xs font-medium text-ink-2 mb-2.5">
                  <span className="hover:text-ink cursor-pointer">Settings</span>
                  <span className="text-ink-3">/</span>
                  <span>{currentGroup?.title || 'Configuration'}</span>
                  <span className="text-ink-3">/</span>
                  <span className="text-ink font-bold">{currentItem.label}</span>
                </div>

                {/* Section Title & Description */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-accent text-white flex items-center justify-center shrink-0 shadow-md ring-2 ring-accent/20">
                      <currentItem.Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-extrabold tracking-tight text-ink">
                        {currentItem.label}
                      </h2>
                      <p className="text-ui text-ink-2 mt-0.5 leading-relaxed font-normal">
                        {currentItem.description}
                      </p>
                    </div>
                  </div>

                  {/* Channel Subtabs if in channels section */}
                  {active === 'channels' && (
                    <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface-2 border-2 border-line-2 w-fit shrink-0 shadow-2xs">
                      {(
                        [
                          ['channels', 'Channels'],
                          ['meta', 'Messenger'],
                          ['linkedin', 'LinkedIn'],
                          ['slack', 'Slack'],
                        ] as [IntegrationTab | 'channels', string][]
                      ).map(([id, label]) => (
                        <button
                          key={id}
                          onClick={() => setChannelTab(id)}
                          className={cn(
                            'h-8 px-3.5 rounded-lg text-xs font-semibold transition-all',
                            channelTab === id
                              ? 'bg-accent text-white shadow-xs'
                              : 'text-ink-2 hover:text-ink hover:bg-surface-3'
                          )}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Section Dynamic Components */}
          <div className="flex-1 p-6 md:p-8">
            <div className="max-w-5xl mx-auto w-full">
              {/* Widget & Branding */}
              {active === 'widget' && renderAdmin('widget')}

              {/* Website Installation */}
              {active === 'install' && (
                <InstallationGuide
                  embedded
                  workspace={workspace}
                  hasVisitors={hasVisitors}
                  latestVisitorUrl={latestVisitorUrl}
                />
              )}

              {/* Mobile App & Shortcuts */}
              {active === 'mobile' && <MobileAppSettingsCard />}

              {/* Omnichannel Chat Channels */}
              {active === 'channels' && (
                <div className="space-y-6">
                  {channelTab === 'channels' ? (
                    workspace && <ChannelsSettings workspaceId={workspace.id} />
                  ) : (
                    renderIntegrations(channelTab)
                  )}
                </div>
              )}

              {/* Email & SMTP */}
              {active === 'email' && workspace && (
                <SMTPSettingsSection
                  workspace={workspace}
                  onWorkspaceUpdated={onWorkspaceUpdated}
                />
              )}

              {/* Custom Domains & DNS */}
              {active === 'domains' && renderAdmin('domain')}

              {/* Team Members */}
              {active === 'team' && workspace && <TeamSettings workspaceId={workspace.id} />}

              {/* Groups & Routing */}
              {active === 'groups' && workspace && <GroupsSettings workspaceId={workspace.id} />}

              {/* Hours & Availability */}
              {active === 'routing' && (
                <div className="space-y-8">
                  {renderAdmin('hours')}
                  <div className="pt-2 border-t border-line">
                    <h3 className="text-sm font-semibold text-ink mb-1">
                      Conversation Assignment
                    </h3>
                    <p className="text-xs text-ink-3 mb-4">
                      Configure round-robin and agent routing for incoming chats
                    </p>
                    {renderAdmin('assignment')}
                  </div>
                  <div className="pt-2 border-t border-line">
                    <h3 className="text-sm font-semibold text-ink mb-1 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-accent" />
                      Auto-Close Inactivity Rule
                    </h3>
                    <p className="text-xs text-ink-3 mb-4">
                      Automatically resolve open conversations that have had no customer or agent activity for a specified period.
                    </p>
                    <AutoCloseSettingsCard
                      workspace={workspace}
                      onWorkspaceUpdated={onWorkspaceUpdated}
                    />
                  </div>
                </div>
              )}

              {/* Saved Quick Replies */}
              {active === 'replies' && renderAdmin('canned')}

              {/* AI Assistant & Copilot */}
              {active === 'ai' && (
                <div className="space-y-10">
                  {renderAdmin('ai')}
                  <div className="pt-4 border-t border-line">
                    <div className="mb-4">
                      <h3 className="text-md font-semibold text-ink">
                        LangGraph &amp; Custom LLM Pipelines
                      </h3>
                      <p className="text-xs text-ink-3">
                        Optionally connect specialized multi-agent workflows or LangGraph endpoints
                      </p>
                    </div>
                    {renderIntegrations('langgraph')}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
