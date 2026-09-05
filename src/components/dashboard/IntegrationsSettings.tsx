'use client';

import React, { useState, useEffect } from 'react';
import {
  Bell,
  BookOpen,
  Bot,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  Globe,
  Link2,
  Mail,
  Phone,
  Save,
  Share2,
  Sparkles,
} from 'lucide-react';
import { Workspace, WorkspaceIntegration } from '@/types/database';
import { createClient } from '@/lib/supabase/client';

interface IntegrationsSettingsProps {
  workspace: Workspace | null;
  /** Controlled section; when set the internal tab bar is bypassed. */
  tab?: IntegrationTab;
  /** Hides this panel's own header and tab bar (used by the Settings hub). */
  embedded?: boolean;
}

export type IntegrationTab =
  | 'langgraph'
  | 'whatsapp'
  | 'meta'
  | 'linkedin'
  | 'slack';

export function IntegrationsSettings({
  workspace,
  tab,
  embedded = false,
}: IntegrationsSettingsProps) {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Active integration tab: 'langgraph' | 'whatsapp' | 'meta' | 'linkedin' | 'slack'
  const [internalTab, setActiveTab] = useState<IntegrationTab>('langgraph');
  const activeTab: IntegrationTab = tab ?? internalTab;

  // Integration Form State
  const [formData, setFormData] = useState<Partial<WorkspaceIntegration>>({
    langgraph_enabled: true,
    langgraph_webhook_url: '',
    langgraph_api_key: '',
    langgraph_system_prompt:
      'You are Chatify AI Support Assistant. Be polite, concise, and helpful. Escalate to a human agent when needed.',
    langgraph_auto_pilot: true,
    whatsapp_enabled: false,
    whatsapp_phone_number_id: '',
    whatsapp_access_token: '',
    whatsapp_business_account_id: '',
    meta_enabled: false,
    meta_page_access_token: '',
    meta_verify_token: 'chatify_meta_verify_secret',
    meta_app_secret: '',
    linkedin_enabled: false,
    linkedin_access_token: '',
    linkedin_organization_urn: '',
    slack_enabled: false,
    slack_webhook_url: '',
    email_offline_notifications: true,
  });

  // Test LangGraph connection state
  const [testTesting, setTestTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Test Slack connection state
  const [testSlackTesting, setTestSlackTesting] = useState(false);
  const [slackTestResult, setSlackTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Help Desk stats for Built-in Knowledge Agent
  const [helpStats, setHelpStats] = useState<{ sectionsCount: number; articlesCount: number }>({
    sectionsCount: 0,
    articlesCount: 0,
  });
  const [showAdvancedWebhook, setShowAdvancedWebhook] = useState(false);

  // 1. Fetch current integration settings
  useEffect(() => {
    if (!workspace?.id) return;

    async function loadIntegrations() {
      try {
        const [{ data }, { count: secCount }, { count: artCount }] = await Promise.all([
          supabase
            .from('workspace_integrations')
            .select('*')
            .eq('workspace_id', workspace!.id)
            .maybeSingle(),
          supabase
            .from('help_sections')
            .select('id', { count: 'exact', head: true })
            .eq('workspace_id', workspace!.id),
          supabase
            .from('articles')
            .select('id', { count: 'exact', head: true })
            .eq('workspace_id', workspace!.id)
            .eq('status', 'published'),
        ]);

        if (data) {
          setFormData((prev) => ({ ...prev, ...data }));
          if (data.langgraph_webhook_url) {
            setShowAdvancedWebhook(true);
          }
        }

        setHelpStats({
          sectionsCount: secCount || 0,
          articlesCount: artCount || 0,
        });
      } catch (err) {
        console.error('Error fetching integrations:', err);
      } finally {
        setLoading(false);
      }
    }

    loadIntegrations();
  }, [workspace?.id, supabase]);

  // 2. Save settings
  const handleSave = async () => {
    if (!workspace?.id) return;
    setSaving(true);
    setSaveSuccess(false);

    try {
      const payload = {
        ...formData,
        workspace_id: workspace.id,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('workspace_integrations')
        .upsert(payload, { onConflict: 'workspace_id' });

      if (error) throw error;

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error('Failed to save integrations:', err);
      alert(err.message || 'Failed to save integrations.');
    } finally {
      setSaving(false);
    }
  };

  // 3. Test AI Agent connection (Built-in Help Desk RAG or external webhook)
  const handleTestLangGraph = async () => {
    setTestTesting(true);
    setTestResult(null);

    try {
      if (formData.langgraph_webhook_url?.trim()) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        const res = await fetch(formData.langgraph_webhook_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(formData.langgraph_api_key ? { Authorization: `Bearer ${formData.langgraph_api_key}` } : {}),
          },
          body: JSON.stringify({
            conversation_id: 'test-ping-123',
            workspace_id: workspace?.id,
            channel: 'test',
            visitor: { name: 'Chatify Test User' },
            current_message: 'ping',
            history: [],
          }),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (res.ok) {
          const json = await res.json().catch(() => ({}));
          setTestResult({
            success: true,
            message: `External agent replied: "${json.response || json.content || json.message || 'OK'}"`,
          });
        } else {
          const text = await res.text().catch(() => '');
          setTestResult({
            success: false,
            message: `Agent endpoint returned HTTP ${res.status}: ${text.slice(0, 120)}`,
          });
        }
      } else {
        // Test Built-in Help Desk Knowledge Agent
        const res = await fetch('/api/agent/suggest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversation_id: 'test-knowledge-conv',
            workspace_id: workspace?.id,
            incoming_message: 'Hello, what services or support articles do you have?',
            visitor: { name: 'Test Visitor' },
          }),
        });

        const json = await res.json();
        const reply = json.draft || '';
        setTestResult({
          success: true,
          message: `✓ Built-in Help Desk AI responded: "${reply.slice(0, 160)}${reply.length > 160 ? '...' : ''}"`,
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.name === 'AbortError' ? 'Connection timed out (10s).' : err.message || 'Connection failed.',
      });
    } finally {
      setTestTesting(false);
    }
  };

  // Test Slack Webhook
  const handleTestSlack = async () => {
    if (!formData.slack_webhook_url) {
      setSlackTestResult({ success: false, message: 'Please enter a Slack Webhook URL first.' });
      return;
    }

    setTestSlackTesting(true);
    setSlackTestResult(null);

    try {
      const res = await fetch('/api/notifications/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'test_slack',
          webhook_url: formData.slack_webhook_url,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSlackTestResult({
          success: true,
          message: 'Test message posted to Slack channel successfully!',
        });
      } else {
        setSlackTestResult({
          success: false,
          message: data.error || 'Slack webhook request failed.',
        });
      }
    } catch (err: any) {
      setSlackTestResult({
        success: false,
        message: err.message || 'Failed to trigger Slack test.',
      });
    } finally {
      setTestSlackTesting(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const appOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com';
  const metaWebhookUrl = `${appOrigin}/api/webhooks/meta`;
  const linkedinWebhookUrl = `${appOrigin}/api/webhooks/linkedin`;

  if (loading) {
    return (
      <div className="flex-1 h-screen flex flex-col items-center justify-center gap-3">
        <span className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent animate-spin" />
        <p className="text-[13px] text-ink-3 font-medium">Loading integrations…</p>
      </div>
    );
  }

  return (
    <div className={embedded ? 'w-full' : 'flex-1 h-screen overflow-y-auto bg-canvas'}>
      {!embedded && (
      <>
      {/* Header */}
      <div className="sticky top-0 z-20 px-8 py-5 border-b border-line bg-surface/90 backdrop-blur-md flex items-center justify-between">
        <div>
          <h1 className="text-[1.35rem] font-semibold tracking-tight text-ink flex items-center gap-2.5">
            <Share2 className="w-5 h-5 text-accent" />
            Integrations & Omnichannel Hub
          </h1>
          <p className="mt-0.5 text-[13px] text-ink-3">
            Connect your LangGraph AI agent and sync customer messages from WhatsApp, Facebook, Instagram and LinkedIn.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="btn btn-md btn-primary gap-2 shadow-xs"
        >
          {saving ? (
            <>
              <span className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
              Saving…
            </>
          ) : saveSuccess ? (
            <>
              <Check className="w-3.5 h-3.5 text-success" />
              Saved!
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              Save Settings
            </>
          )}
        </button>
      </div>

      </>
      )}

      <div className={embedded ? 'space-y-8' : 'p-8 max-w-5xl mx-auto space-y-8'}>
        {!embedded && (
        <>
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-line pb-px">
          {[
            { id: 'langgraph', label: 'AI Knowledge Agent', icon: Bot, activeClass: 'text-accent border-accent' },
            { id: 'whatsapp', label: 'WhatsApp Business', icon: Phone, activeClass: 'text-[#25D366] border-[#25D366]' },
            { id: 'meta', label: 'Facebook & Instagram', icon: Globe, activeClass: 'text-[#0084FF] border-[#0084FF]' },
            { id: 'linkedin', label: 'LinkedIn Messaging', icon: Link2, activeClass: 'text-[#0A66C2] border-[#0A66C2]' },
            { id: 'slack', label: 'Slack & Alerts', icon: Bell, activeClass: 'text-[#E01E5A] border-[#E01E5A]' },
          ].map((tab) => {
            const active = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 text-[13px] font-medium border-b-2 transition-colors -mb-px ${
                  active
                    ? tab.activeClass
                    : 'border-transparent text-ink-3 hover:text-ink hover:border-line-2'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
        </>
        )}

        {/* ── TAB 1: BUILT-IN HELP DESK AI AGENT ── */}
        {activeTab === 'langgraph' && (
          <div className="space-y-6 animate-rise">
            <div className="card p-6 space-y-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-[15px] font-semibold text-ink flex items-center gap-2">
                      <Bot className="w-4 h-4 text-accent" />
                      AI Knowledge Base Agent
                    </h3>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium">
                      Built-in RAG (Zero-Config)
                    </span>
                  </div>
                  <p className="mt-1 text-[12.5px] text-ink-3 max-w-2xl">
                    Automatically answers customer questions across Website Widget, WhatsApp, Instagram, Messenger, and LinkedIn using your Help Desk sections and articles. Zero external server or webhook URL required!
                  </p>
                </div>

                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <span className="text-[12.5px] font-medium text-ink-2">
                    {formData.langgraph_enabled ? 'Agent Active' : 'Agent Disabled'}
                  </span>
                  <input
                    type="checkbox"
                    checked={formData.langgraph_enabled}
                    onChange={(e) => setFormData({ ...formData, langgraph_enabled: e.target.checked })}
                    className="w-4 h-4 accent-accent rounded"
                  />
                </label>
              </div>

              {/* Connected Help Desk Knowledge Status Card */}
              <div className="p-4 rounded-xl bg-surface-2 border border-line flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-[13px] font-semibold text-ink">Ground Truth: Help Desk Documentation</h4>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-success-soft text-success font-medium">
                        ✓ Connected
                      </span>
                    </div>
                    <p className="text-[12px] text-ink-3 mt-0.5">
                      Trained on <strong className="text-ink">{helpStats.sectionsCount} Sections</strong> and <strong className="text-ink">{helpStats.articlesCount} Published Articles</strong>. The AI formulates answers strictly from your documented knowledge base.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                {/* Auto-Pilot Toggle */}
                <div className="flex items-center gap-6 py-2 border-b border-line">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.langgraph_auto_pilot}
                      onChange={(e) => setFormData({ ...formData, langgraph_auto_pilot: e.target.checked })}
                      className="w-4 h-4 accent-accent rounded"
                    />
                    <div>
                      <span className="text-[13px] font-medium text-ink block">Auto-Pilot Mode</span>
                      <span className="text-[11.5px] text-ink-3 block">
                        Automatically send AI replies immediately when a customer asks a question across any channel.
                      </span>
                    </div>
                  </label>
                </div>

                {/* System Prompt Instructions */}
                <div>
                  <label className="field-label flex items-center justify-between">
                    <span>Agent Persona & Guidelines (Optional)</span>
                    <span className="text-[11px] text-ink-3">Tone instructions</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. You are the official AI Support Assistant. Be polite, concise, and helpful. Answer based strictly on our Help Desk documentation and escalate to a human agent when needed."
                    value={formData.langgraph_system_prompt || ''}
                    onChange={(e) => setFormData({ ...formData, langgraph_system_prompt: e.target.value })}
                    className="input resize-none py-2"
                  />
                </div>

                {/* Custom API Key */}
                <div>
                  <label className="field-label flex items-center justify-between">
                    <span>Anthropic Claude API Key (Optional)</span>
                    <span className="text-[11px] text-ink-3">Leave blank to use system default / semantic engine</span>
                  </label>
                  <input
                    type="password"
                    placeholder="sk-ant-api03-..."
                    value={formData.langgraph_api_key || ''}
                    onChange={(e) => setFormData({ ...formData, langgraph_api_key: e.target.value })}
                    className="input"
                  />
                </div>

                {/* Test Agent Connection */}
                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleTestLangGraph}
                    disabled={testTesting}
                    className="btn btn-sm btn-secondary gap-2"
                  >
                    {testTesting ? (
                      <>
                        <span className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                        Generating Test Reply…
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-accent" />
                        Test AI Agent Response
                      </>
                    )}
                  </button>

                  {testResult && (
                    <div
                      className={`text-[12px] px-3 py-1.5 rounded-lg flex items-center gap-2 max-w-xl ${
                        testResult.success ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'
                      }`}
                    >
                      {testResult.success ? <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" /> : null}
                      <span className="truncate">{testResult.message}</span>
                    </div>
                  )}
                </div>

                {/* Advanced External Webhook Accordion */}
                <div className="pt-4 border-t border-line">
                  <button
                    type="button"
                    onClick={() => setShowAdvancedWebhook(!showAdvancedWebhook)}
                    className="flex items-center gap-2 text-[12.5px] font-medium text-ink-3 hover:text-ink transition-colors"
                  >
                    {showAdvancedWebhook ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    <span>Advanced: External Custom Webhook (LangGraph / FastAPI)</span>
                  </button>

                  {showAdvancedWebhook && (
                    <div className="mt-4 p-4 rounded-xl bg-surface-2 border border-line space-y-4 animate-rise">
                      <p className="text-[12px] text-ink-3">
                        If you have a dedicated Python LangGraph server and wish to use external custom tools instead of the built-in Help Desk RAG, enter your endpoint URL below.
                      </p>
                      <div>
                        <label className="field-label">External Webhook URL</label>
                        <input
                          type="url"
                          placeholder="https://your-agent-server.com/chat"
                          value={formData.langgraph_webhook_url || ''}
                          onChange={(e) => setFormData({ ...formData, langgraph_webhook_url: e.target.value })}
                          className="input"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* LangGraph Inbound Webhook Card */}
            <div className="panel p-5 space-y-3">
              <h4 className="text-[13.5px] font-semibold text-ink flex items-center gap-2">
                <Link2 className="w-4 h-4 text-ink-3" />
                Chatify Inbound Webhook for LangGraph
              </h4>
              <p className="text-[12px] text-ink-3 leading-relaxed">
                If your LangGraph agent executes long-running background tasks or asynchronous tools, it can post replies directly back to Chatify via:
              </p>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-2 border border-line font-mono text-[12px]">
                <span className="text-ink truncate">{appOrigin}/api/agent/webhook</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(`${appOrigin}/api/agent/webhook`, 'agent-webhook')}
                  className="btn btn-xs btn-ghost text-ink-3 hover:text-ink gap-1"
                >
                  {copiedField === 'agent-webhook' ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
                  {copiedField === 'agent-webhook' ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: WHATSAPP BUSINESS CLOUD API ── */}
        {activeTab === 'whatsapp' && (
          <div className="space-y-6 animate-rise">
            <div className="card p-6 space-y-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-[15px] font-semibold text-ink flex items-center gap-2">
                    <Phone className="w-4 h-4 text-[#25D366]" />
                    WhatsApp Business Cloud API
                  </h3>
                  <p className="mt-1 text-[12.5px] text-ink-3 max-w-2xl">
                    Receive and reply to WhatsApp messages from your official business number inside Chatify. Powered by Meta Cloud API.
                  </p>
                </div>

                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <span className="text-[12.5px] font-medium text-ink-2">Enable WhatsApp</span>
                  <input
                    type="checkbox"
                    checked={formData.whatsapp_enabled}
                    onChange={(e) => setFormData({ ...formData, whatsapp_enabled: e.target.checked })}
                    className="w-4 h-4 accent-accent rounded"
                  />
                </label>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <label className="field-label">Phone Number ID</label>
                  <input
                    type="text"
                    placeholder="e.g. 104829104810294"
                    value={formData.whatsapp_phone_number_id || ''}
                    onChange={(e) => setFormData({ ...formData, whatsapp_phone_number_id: e.target.value })}
                    className="input"
                  />
                  <p className="mt-1 text-[11.5px] text-ink-3">
                    Found in Meta for Developers &gt; WhatsApp &gt; API Setup &gt; Phone number ID.
                  </p>
                </div>

                <div>
                  <label className="field-label">System User Permanent Access Token</label>
                  <input
                    type="password"
                    placeholder="EAABwz..."
                    value={formData.whatsapp_access_token || ''}
                    onChange={(e) => setFormData({ ...formData, whatsapp_access_token: e.target.value })}
                    className="input"
                  />
                  <p className="mt-1 text-[11.5px] text-ink-3">
                    Generate a permanent token with <code>whatsapp_business_messaging</code> and <code>whatsapp_business_management</code> permissions.
                  </p>
                </div>

                <div>
                  <label className="field-label">WhatsApp Business Account ID (WABA)</label>
                  <input
                    type="text"
                    placeholder="e.g. 192837465019283"
                    value={formData.whatsapp_business_account_id || ''}
                    onChange={(e) => setFormData({ ...formData, whatsapp_business_account_id: e.target.value })}
                    className="input"
                  />
                </div>
              </div>
            </div>

            {/* Meta Webhook Setup Instructions */}
            <div className="panel p-5 space-y-3">
              <h4 className="text-[13.5px] font-semibold text-ink">Webhook Setup in Meta Developer Dashboard</h4>
              <p className="text-[12px] text-ink-3 leading-relaxed">
                Copy and paste these exact settings into Meta for Developers &gt; WhatsApp &gt; Configuration &gt; Callback URL:
              </p>

              <div className="space-y-2">
                <div>
                  <span className="text-[11px] font-semibold text-ink-3 uppercase">Callback URL</span>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-2 border border-line font-mono text-[12px] mt-1">
                    <span className="text-ink truncate">{metaWebhookUrl}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(metaWebhookUrl, 'meta-url')}
                      className="btn btn-xs btn-ghost text-ink-3 hover:text-ink gap-1"
                    >
                      {copiedField === 'meta-url' ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
                      {copiedField === 'meta-url' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-ink-3 uppercase">Verify Token</span>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-2 border border-line font-mono text-[12px] mt-1">
                    <span className="text-ink">{formData.meta_verify_token || 'chatify_meta_verify_secret'}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(formData.meta_verify_token || 'chatify_meta_verify_secret', 'meta-token')}
                      className="btn btn-xs btn-ghost text-ink-3 hover:text-ink gap-1"
                    >
                      {copiedField === 'meta-token' ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
                      {copiedField === 'meta-token' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>

              <p className="text-[11.5px] text-ink-3 pt-1">
                Under Webhook fields, click <strong>Manage</strong> and subscribe to <code>messages</code>.
              </p>
            </div>
          </div>
        )}

        {/* ── TAB 3: FACEBOOK, INSTAGRAM & THREADS ── */}
        {activeTab === 'meta' && (
          <div className="space-y-6 animate-rise">
            <div className="card p-6 space-y-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-[15px] font-semibold text-ink flex items-center gap-2">
                    <Globe className="w-4 h-4 text-[#0084FF]" />
                    Facebook Messenger & Instagram Direct
                  </h3>
                  <p className="mt-1 text-[12.5px] text-ink-3 max-w-2xl">
                    Unified inbox for customer inquiries from your Facebook Business Page and Instagram professional profile.
                  </p>
                </div>

                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <span className="text-[12.5px] font-medium text-ink-2">Enable Meta Channels</span>
                  <input
                    type="checkbox"
                    checked={formData.meta_enabled}
                    onChange={(e) => setFormData({ ...formData, meta_enabled: e.target.checked })}
                    className="w-4 h-4 accent-accent rounded"
                  />
                </label>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <label className="field-label">Meta Page Access Token</label>
                  <input
                    type="password"
                    placeholder="EAABwz..."
                    value={formData.meta_page_access_token || ''}
                    onChange={(e) => setFormData({ ...formData, meta_page_access_token: e.target.value })}
                    className="input"
                  />
                  <p className="mt-1 text-[11.5px] text-ink-3">
                    Page token with <code>pages_messaging</code> and <code>instagram_manage_messages</code> permissions.
                  </p>
                </div>

                <div>
                  <label className="field-label">App Secret (Optional for SHA256 validation)</label>
                  <input
                    type="password"
                    placeholder="App secret from Meta App Settings > Basic"
                    value={formData.meta_app_secret || ''}
                    onChange={(e) => setFormData({ ...formData, meta_app_secret: e.target.value })}
                    className="input"
                  />
                </div>
              </div>
            </div>

            <div className="panel p-5 space-y-3">
              <h4 className="text-[13.5px] font-semibold text-ink">Webhook Configuration</h4>
              <p className="text-[12px] text-ink-3">
                In your Meta Developer App, configure the Messenger and Instagram webhooks using the same endpoint:
              </p>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-2 border border-line font-mono text-[12px]">
                <span className="text-ink truncate">{metaWebhookUrl}</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(metaWebhookUrl, 'meta-page-url')}
                  className="btn btn-xs btn-ghost text-ink-3 hover:text-ink gap-1"
                >
                  {copiedField === 'meta-page-url' ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
                  {copiedField === 'meta-page-url' ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 4: LINKEDIN MESSAGING ── */}
        {activeTab === 'linkedin' && (
          <div className="space-y-6 animate-rise">
            <div className="card p-6 space-y-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-[15px] font-semibold text-ink flex items-center gap-2">
                    <Link2 className="w-4 h-4 text-[#0A66C2]" />
                    LinkedIn Messaging API
                  </h3>
                  <p className="mt-1 text-[12.5px] text-ink-3 max-w-2xl">
                    Manage LinkedIn page direct messages inside your Chatify inbox.
                  </p>
                </div>

                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <span className="text-[12.5px] font-medium text-ink-2">Enable LinkedIn</span>
                  <input
                    type="checkbox"
                    checked={formData.linkedin_enabled}
                    onChange={(e) => setFormData({ ...formData, linkedin_enabled: e.target.checked })}
                    className="w-4 h-4 accent-accent rounded"
                  />
                </label>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <label className="field-label">LinkedIn Organization URN</label>
                  <input
                    type="text"
                    placeholder="urn:li:organization:12345678"
                    value={formData.linkedin_organization_urn || ''}
                    onChange={(e) => setFormData({ ...formData, linkedin_organization_urn: e.target.value })}
                    className="input"
                  />
                </div>

                <div>
                  <label className="field-label">LinkedIn OAuth Access Token</label>
                  <input
                    type="password"
                    placeholder="AQV..."
                    value={formData.linkedin_access_token || ''}
                    onChange={(e) => setFormData({ ...formData, linkedin_access_token: e.target.value })}
                    className="input"
                  />
                </div>
              </div>
            </div>

            <div className="panel p-5 space-y-3">
              <h4 className="text-[13.5px] font-semibold text-ink">LinkedIn Webhook Endpoint</h4>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-2 border border-line font-mono text-[12px]">
                <span className="text-ink truncate">{linkedinWebhookUrl}</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(linkedinWebhookUrl, 'li-url')}
                  className="btn btn-xs btn-ghost text-ink-3 hover:text-ink gap-1"
                >
                  {copiedField === 'li-url' ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
                  {copiedField === 'li-url' ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 5: SLACK & AGENT NOTIFICATIONS ── */}
        {activeTab === 'slack' && (
          <div className="space-y-6 animate-rise">
            {/* Slack Incoming Webhook Card */}
            <div className="card p-6 space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#E01E5A]/10 text-[#E01E5A] flex items-center justify-center font-bold text-sm">
                      #
                    </div>
                    <h3 className="text-[16px] font-semibold text-ink">
                      Slack Channel Notifications
                    </h3>
                  </div>
                  <p className="mt-1 text-[12.5px] text-ink-3 max-w-2xl">
                    Automatically post an alert to your company Slack channel whenever a customer initiates a new conversation on your website, complete with a direct button to open the ticket in your dashboard.
                  </p>
                </div>

                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <span className="text-[12.5px] font-medium text-ink-2">
                    Enable Slack Alerts
                  </span>
                  <input
                    type="checkbox"
                    checked={formData.slack_enabled}
                    onChange={(e) =>
                      setFormData({ ...formData, slack_enabled: e.target.checked })
                    }
                    className="w-4 h-4 accent-accent rounded"
                  />
                </label>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <label className="field-label">Slack Incoming Webhook URL</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://hooks.slack.com/services/T000/B000/XXXXXX"
                      value={formData.slack_webhook_url || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          slack_webhook_url: e.target.value.trim(),
                        })
                      }
                      className="input flex-1 font-mono text-[12px]"
                    />
                    <button
                      type="button"
                      onClick={handleTestSlack}
                      disabled={!formData.slack_webhook_url || testSlackTesting}
                      className="btn btn-md btn-secondary shrink-0 gap-1.5"
                    >
                      {testSlackTesting ? (
                        <>
                          <span className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                          Testing…
                        </>
                      ) : (
                        'Test Webhook'
                      )}
                    </button>
                  </div>
                  <p className="mt-1.5 text-[11.5px] text-ink-3">
                    Create an Incoming Webhook in your Slack workspace under <strong>Apps &rarr; Incoming Webhooks</strong> and paste the URL here.
                  </p>
                </div>

                {/* Test Result Message */}
                {slackTestResult && (
                  <div
                    className={`p-3 rounded-xl border text-[12.5px] flex items-center gap-2 ${
                      slackTestResult.success
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                        : 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300'
                    }`}
                  >
                    {slackTestResult.success ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                    ) : (
                      <span className="font-bold">⚠️</span>
                    )}
                    <span>{slackTestResult.message}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Offline Agent Email Notifications Card */}
            <div className="card p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                      <Mail className="w-4 h-4" />
                    </div>
                    <h3 className="text-[16px] font-semibold text-ink">
                      Offline Agent Email Notifications
                    </h3>
                  </div>
                  <p className="mt-1 text-[12.5px] text-ink-3 max-w-2xl">
                    When an agent is offline or away and an assigned customer sends a reply, send an email alert to the agent with the customer's message and a direct link to reply.
                  </p>
                </div>

                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <span className="text-[12.5px] font-medium text-ink-2">
                    Enable Offline Emails
                  </span>
                  <input
                    type="checkbox"
                    checked={formData.email_offline_notifications ?? true}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        email_offline_notifications: e.target.checked,
                      })
                    }
                    className="w-4 h-4 accent-accent rounded"
                  />
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
