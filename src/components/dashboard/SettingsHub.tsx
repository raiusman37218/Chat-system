'use client';

import React, { useState, useMemo } from 'react';
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
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Menu,
  ShieldCheck,
  Smartphone,
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
import {
  AdminSettingsPanel,
  type AdminTab,
} from '@/components/admin/AdminSettingsPanel';

export type SectionId =
  | 'widget'
  | 'install'
  | 'mobile'
  | 'channels'
  | 'email'
  | 'domains'
  | 'team'
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
        description: 'Add Chatify to your Android or iPhone home screen without Play Store',
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
        description: 'Connect WhatsApp, Facebook Messenger, Instagram & Slack alerts',
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
        getBadge: () => ({ text: '4 Channels', variant: 'neutral' }),
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
        label: 'Hostinger Email & SMTP',
        description: 'Hostinger credentials, delivery testing & 5-minute unread email alerts',
        Icon: Mail,
        adminOnly: true,
        keywords: [
          'email',
          'hostinger',
          'smtp',
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
            ? { text: 'Hostinger Active', variant: 'emerald' }
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
          if (workspace?.custom_domain_status === 'verified') {
            return { text: 'DNS Verified', variant: 'emerald' };
          }
          if (workspace?.custom_domain) {
            return { text: 'Pending DNS', variant: 'amber' };
          }
          return { text: 'Default Domain', variant: 'neutral' };
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
        description: 'Invite colleagues, manage agent roles and assign permissions',
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
          const enabled = (workspace?.business_hours as any)?.enabled;
          return enabled
            ? { text: 'Scheduled', variant: 'emerald' }
            : { text: '24/7 Always Open', variant: 'neutral' };
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
        label: 'AI Assistant & Copilot',
        description: 'Smart auto-replies, draft suggestions and model configuration',
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

interface SettingsHubProps {
  workspace: Workspace | null;
  currentAgent: Agent | null;
  agents: Agent[];
  cannedResponses: CannedResponse[];
  hasVisitors: boolean;
  latestVisitorUrl?: string;
  onWorkspaceUpdated?: (ws: Workspace) => void;
}

export function SettingsHub({
  workspace,
  currentAgent,
  agents,
  cannedResponses,
  hasVisitors,
  latestVisitorUrl,
  onWorkspaceUpdated,
}: SettingsHubProps) {
  const isAdmin =
    currentAgent?.role === 'admin' || currentAgent?.role === 'owner';

  const [active, setActive] = useState<SectionId>('widget');
  const [searchQuery, setSearchQuery] = useState('');
  const [channelTab, setChannelTab] = useState<IntegrationTab>('whatsapp');
  const [copiedWsId, setCopiedWsId] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-lg border border-line bg-surface-2 hover:bg-surface-3 text-ink-2"
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
                <span className="font-semibold text-[14.5px] tracking-tight truncate text-ink">
                  {workspace?.name || 'Workspace Settings'}
                </span>
                <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10.5px] font-medium bg-surface-3 text-ink-3">
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
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-line bg-surface-2/60 hover:bg-surface-3 text-[12px] text-ink-2 font-mono transition-colors shadow-xs"
              title="Click to copy your unique Workspace ID"
            >
              {copiedWsId ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-sans font-medium text-[11px]">
                    Copied!
                  </span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-ink-3" />
                  <span className="text-[11px] truncate max-w-[120px]">
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-white hover:opacity-95 text-[12px] font-medium transition-all shadow-xs"
            title="Open test website simulator in a new tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Test Live Widget</span>
            <span className="sm:hidden">Test</span>
          </button>
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
              ? 'absolute inset-y-0 left-0 w-72 shadow-2xl bg-surface'
              : 'hidden md:flex'
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
                className="w-full h-9.5 pl-9 pr-8 text-[13px] bg-transparent text-ink placeholder:text-ink-2/70 font-medium focus:outline-none"
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
                <p className="text-[13px] font-semibold text-ink">
                  No settings match &ldquo;{searchQuery}&rdquo;
                </p>
                <p className="text-[12px] text-ink-2">
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
                    <span className="text-[11.5px] font-extrabold uppercase tracking-wider text-ink-2 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block" />
                      <span>{group.title}</span>
                    </span>
                    <span className="text-[10.5px] px-1.5 py-0.5 rounded-md bg-surface-3 text-ink-2 font-bold font-mono">
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
                      });

                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActive(item.id);
                            setMobileMenuOpen(false);
                          }}
                          aria-current={isActive ? 'page' : undefined}
                          className={cn(
                            'w-full min-h-[42px] px-3 py-2 rounded-xl flex items-center gap-2.5 text-left text-[13px] transition-all group',
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

                          <span className="truncate flex-1 font-semibold">{item.label}</span>

                          {badge && (
                            <span
                              className={cn(
                                'text-[10.5px] px-2 py-0.5 rounded-full font-bold shrink-0 tracking-tight',
                                badge.variant === 'emerald' &&
                                  'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30',
                                badge.variant === 'amber' &&
                                  'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30',
                                badge.variant === 'blue' &&
                                  'bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30',
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
          <div className="p-3 border-t border-line-2 bg-surface-2/60 text-[12px] text-ink-2 flex items-center justify-between font-medium">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shadow-xs animate-pulse" />
              <span className="font-semibold text-ink">System Online</span>
            </span>
            <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded bg-surface-3 border border-line-2">v2.4 Pro</span>
          </div>
        </nav>

        {/* Backdrop for mobile drawer */}
        {mobileMenuOpen && (
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden fixed inset-0 bg-black/40 z-10"
          />
        )}

        {/* ───────────────────────────────────────────────────────────────── */}
        {/* 3. RIGHT CONTENT AREA: SECTION BODY */}
        {/* ───────────────────────────────────────────────────────────────── */}
        <main className="flex-1 min-w-0 overflow-y-auto flex flex-col bg-canvas">
          {/* Section Breadcrumb & Header Banner */}
          {currentItem && (
            <div className="px-6 md:px-8 pt-6 pb-5 border-b border-line-2 bg-surface shadow-2xs">
              <div className="max-w-5xl">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-[12.5px] font-medium text-ink-2 mb-2.5">
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
                      <h2 className="text-[21px] font-extrabold tracking-tight text-ink">
                        {currentItem.label}
                      </h2>
                      <p className="text-[13px] text-ink-2 mt-0.5 leading-relaxed font-normal">
                        {currentItem.description}
                      </p>
                    </div>
                  </div>

                  {/* Channel Subtabs if in channels section */}
                  {active === 'channels' && (
                    <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface-2 border-2 border-line-2 w-fit shrink-0 shadow-2xs">
                      {(
                        [
                          ['whatsapp', 'WhatsApp'],
                          ['meta', 'Messenger & Instagram'],
                          ['linkedin', 'LinkedIn'],
                          ['slack', 'Slack'],
                        ] as [IntegrationTab, string][]
                      ).map(([id, label]) => (
                        <button
                          key={id}
                          onClick={() => setChannelTab(id)}
                          className={cn(
                            'h-8 px-3.5 rounded-lg text-[12.5px] font-semibold transition-all',
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
                  {renderIntegrations(channelTab)}
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
              {active === 'team' && renderAdmin('team')}

              {/* Hours & Availability */}
              {active === 'routing' && (
                <div className="space-y-8">
                  {renderAdmin('hours')}
                  <div className="pt-2 border-t border-line">
                    <h3 className="text-[14px] font-semibold text-ink mb-1">
                      Conversation Assignment
                    </h3>
                    <p className="text-[12px] text-ink-3 mb-4">
                      Configure round-robin and agent routing for incoming chats
                    </p>
                    {renderAdmin('assignment')}
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
                      <h3 className="text-[15px] font-semibold text-ink">
                        LangGraph &amp; Custom LLM Pipelines
                      </h3>
                      <p className="text-[12px] text-ink-3">
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
