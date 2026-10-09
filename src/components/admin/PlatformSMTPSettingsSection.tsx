'use client';

import React, { useState, useEffect } from 'react';
import {
  Mail,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Send,
  Eye,
  EyeOff,
  Sparkles,
  Server,
  Lock,
  Globe,
  Building2,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
} from 'lucide-react';
import { SMTPSettingsConfig } from '@/types/database';
import {
  getPlatformSettingsAction,
  updatePlatformSMTPSettingsAction,
  testPlatformSMTPSettingsAction,
} from '@/app/actions/platform';
import { cn } from '@/lib/utils';

const isValidEmail = (email: string | undefined | null) => {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
};

export function PlatformSMTPSettingsSection() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [platformName, setPlatformName] = useState('ZenTry');
  const [platformUrl, setPlatformUrl] = useState('https://zen-try.site');
  const [smtp, setSmtp] = useState<SMTPSettingsConfig>({
    enabled: true,
    host: 'smtp.hostinger.com',
    port: 465,
    secure: true,
    user: '',
    pass: '',
    from_name: 'ZenTry',
    from_email: '',
  });

  const [testEmailTo, setTestEmailTo] = useState('');
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  // Load current platform SMTP settings from DB
  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        const data = await getPlatformSettingsAction();
        setPlatformName(data.platform_name || 'ZenTry');
        setPlatformUrl(data.platform_url || 'https://zen-try.site');
        if (data.smtp_settings) {
          setSmtp({
            enabled: data.smtp_settings.enabled ?? true,
            host: data.smtp_settings.host || 'smtp.hostinger.com',
            port: data.smtp_settings.port || 465,
            secure: data.smtp_settings.secure ?? true,
            user: data.smtp_settings.user || '',
            pass: data.smtp_settings.pass || '',
            from_name: data.smtp_settings.from_name || 'ZenTry',
            from_email: data.smtp_settings.from_email || '',
          });
        }
      } catch (err: any) {
        console.error('Failed to load platform settings:', err);
        setStatusMessage({
          type: 'error',
          text: err.message || 'Could not load platform settings.',
        });
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const applyPreset = (preset: 'hostinger' | 'gmail' | 'custom') => {
    if (preset === 'hostinger') {
      setSmtp((prev) => ({
        ...prev,
        host: 'smtp.hostinger.com',
        port: 465,
        secure: true,
        from_name: prev.from_name || 'ZenTry',
        from_email: isValidEmail(prev.from_email) ? prev.from_email : (prev.user || ''),
      }));
      setStatusMessage({
        type: 'info',
        text: 'Hostinger SMTP defaults applied (smtp.hostinger.com:465 SSL). Use your full ZenTry email as the username.',
      });
    } else if (preset === 'gmail') {
      setSmtp((prev) => ({
        ...prev,
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        from_name: prev.from_name || 'ZenTry',
        from_email: isValidEmail(prev.from_email) ? prev.from_email : (prev.user || ''),
      }));
      setStatusMessage({
        type: 'info',
        text: 'Google Workspace/Gmail SMTP applied (smtp.gmail.com:465 SSL). Note: Requires a Google 16-character App Password.',
      });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMessage(null);

    try {
      const effectiveFrom = (smtp.from_email && isValidEmail(smtp.from_email))
        ? smtp.from_email.trim()
        : smtp.user.trim();

      const normalized: SMTPSettingsConfig = {
        ...smtp,
        host: (smtp.host || 'smtp.hostinger.com').trim(),
        port: Number(smtp.port) || 465,
        user: smtp.user.trim(),
        pass: smtp.pass,
        from_name: (smtp.from_name || 'ZenTry').trim(),
        from_email: effectiveFrom,
        secure: Number(smtp.port) === 465,
      };

      if (!normalized.host || !normalized.user || !normalized.pass) {
        setStatusMessage({
          type: 'error',
          text: 'Please enter SMTP Host, Username (your ZenTry email), and Password before saving.',
        });
        setSaving(false);
        return;
      }

      await updatePlatformSMTPSettingsAction(normalized);
      setSmtp(normalized);
      setStatusMessage({
        type: 'success',
        text: '✓ ZenTry Platform Super Admin email settings saved successfully!',
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to save platform email settings.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setStatusMessage(null);

    try {
      const effectiveFrom = (smtp.from_email && isValidEmail(smtp.from_email))
        ? smtp.from_email.trim()
        : smtp.user.trim();

      const normalized: SMTPSettingsConfig = {
        ...smtp,
        host: (smtp.host || 'smtp.hostinger.com').trim(),
        port: Number(smtp.port) || 465,
        user: smtp.user.trim(),
        pass: smtp.pass,
        from_name: (smtp.from_name || 'ZenTry').trim(),
        from_email: effectiveFrom,
        secure: Number(smtp.port) === 465,
      };

      if (!normalized.host || !normalized.user || !normalized.pass) {
        setStatusMessage({
          type: 'error',
          text: 'Please enter Host, Username and Password first before testing.',
        });
        setTesting(false);
        return;
      }

      if (testEmailTo && !isValidEmail(testEmailTo)) {
        setStatusMessage({
          type: 'error',
          text: 'Please enter a valid recipient email address for the test.',
        });
        setTesting(false);
        return;
      }

      const res = await testPlatformSMTPSettingsAction(
        normalized,
        testEmailTo ? testEmailTo.trim() : undefined
      );

      if (res.success) {
        setStatusMessage({
          type: 'success',
          text: testEmailTo
            ? `✓ Connected successfully! A test verification email was delivered to ${testEmailTo}.`
            : '✓ SMTP connection verified successfully! ZenTry email credentials are fully working.',
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: res.message || 'Failed to verify SMTP credentials.',
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Connection test failed.',
      });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-ink-3">
        <RefreshCw className="w-8 h-8 animate-spin text-accent mb-3" />
        <p className="text-sm font-medium">Loading ZenTry Platform Email Settings…</p>
      </div>
    );
  }

  const isConfigured = Boolean(smtp.host && smtp.user && smtp.pass);

  return (
    <div className="flex-1 overflow-y-auto bg-surface-2 p-6 md:p-10">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Super Admin Top Header */}
        <div className="card border-2 border-line bg-surface p-6 shadow-sm rounded-2xl space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-accent text-accent-ink flex items-center justify-center shadow-sm shrink-0">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-xl font-bold text-ink">
                    ZenTry Master Platform Email
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-2xs font-bold tracking-wide uppercase bg-accent/10 text-accent border border-accent/20">
                    Super Admin Only
                  </span>
                </div>
                <p className="text-ui text-ink-2 mt-1 leading-relaxed">
                  The primary system email for the <strong>ZenTry SaaS platform</strong> ({platformUrl}). This email is used to verify every new customer and business who signs up to create a workspace and install the chat widget on their website.
                </p>
              </div>
            </div>

            {/* Quick Status Pill */}
            <div className="shrink-0 flex items-center gap-2">
              {isConfigured ? (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-success/10 border border-success/25 text-success text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>ZenTry Mail Active</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-warn/10 border border-warn/25 text-warn text-xs font-bold">
                  <AlertCircle className="w-4 h-4" />
                  <span>Setup Pending</span>
                </div>
              )}
            </div>
          </div>

          {/* Architectural Separation Notice */}
          <div className="rounded-xl bg-surface-2 border border-line p-3.5 flex items-start gap-3 text-xs text-ink-2">
            <Building2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
            <div>
              <strong className="text-ink font-semibold">Tenant Isolation Guarantee:</strong> Individual client companies (such as <em>Range4ex</em>, <em>Genzprop</em>, or <em>Clothing Brand</em>) configure their own helpdesk emails inside their respective workspace profiles. They will never see or overwrite this ZenTry master email.
            </div>
          </div>
        </div>

        {/* Status Alert Banner */}
        {statusMessage && (
          <div
            role="alert"
            className={cn(
              'p-4 rounded-xl border flex items-start gap-3 text-sm shadow-xs transition-all',
              statusMessage.type === 'success' && 'bg-success-soft border-success-line text-success',
              statusMessage.type === 'error' && 'bg-danger-soft border-danger-line text-danger',
              statusMessage.type === 'info' && 'bg-accent-soft border-accent-line text-accent'
            )}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
            ) : statusMessage.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
            ) : (
              <Sparkles className="w-5 h-5 text-accent shrink-0 mt-0.5" />
            )}
            <div className="flex-1 font-medium">{statusMessage.text}</div>
          </div>
        )}

        {/* Master SMTP Configuration Form */}
        <form onSubmit={handleSave} className="card border-2 border-line bg-surface p-6 md:p-8 rounded-2xl shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-4">
            <div>
              <h2 className="text-base font-bold text-ink flex items-center gap-2">
                <Server className="w-4 h-4 text-accent" />
                ZenTry SMTP Credentials
              </h2>
              <p className="text-xs text-ink-3 mt-0.5">
                Enter your official ZenTry company email account credentials (Hostinger, Google Workspace, or custom).
              </p>
            </div>

            {/* Presets */}
            <div className="flex items-center gap-2">
              <span className="text-2xs font-bold text-ink-3 uppercase tracking-wider">
                Preset:
              </span>
              <button
                type="button"
                onClick={() => applyPreset('hostinger')}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors',
                  smtp.host === 'smtp.hostinger.com'
                    ? 'bg-accent/10 border-accent text-accent'
                    : 'bg-surface-2 border-line text-ink-2 hover:bg-surface'
                )}
              >
                Hostinger
              </button>
              <button
                type="button"
                onClick={() => applyPreset('gmail')}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors',
                  smtp.host === 'smtp.gmail.com'
                    ? 'bg-accent/10 border-accent text-accent'
                    : 'bg-surface-2 border-line text-ink-2 hover:bg-surface'
                )}
              >
                Google Workspace
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Sender Name */}
            <div>
              <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
                Platform Sender Name
              </label>
              <input
                type="text"
                value={smtp.from_name}
                onChange={(e) => setSmtp({ ...smtp, from_name: e.target.value })}
                placeholder="ZenTry"
                required
                className="input w-full text-sm"
              />
              <span className="text-2xs text-ink-3 mt-1 block">
                The name displayed in the recipient&apos;s inbox (e.g. &quot;ZenTry&quot; or &quot;ZenTry Verification&quot;).
              </span>
            </div>

            {/* From Email */}
            <div>
              <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
                Sender Email (&quot;From&quot; Address)
              </label>
              <input
                type="email"
                value={smtp.from_email}
                onChange={(e) => setSmtp({ ...smtp, from_email: e.target.value })}
                placeholder="noreply@zen-try.site"
                required
                className="input w-full text-sm font-mono"
              />
              <span className="text-2xs text-ink-3 mt-1 block">
                Must match your authenticated ZenTry email (e.g. <span className="font-mono text-accent">noreply@zen-try.site</span>).
              </span>
            </div>

            {/* SMTP Host */}
            <div>
              <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
                SMTP Host Server
              </label>
              <input
                type="text"
                value={smtp.host}
                onChange={(e) => setSmtp({ ...smtp, host: e.target.value })}
                placeholder="smtp.hostinger.com"
                required
                className="input w-full text-sm font-mono"
              />
              <span className="text-2xs text-ink-3 mt-1 block">
                Hostinger: <span className="font-mono">smtp.hostinger.com</span>
              </span>
            </div>

            {/* SMTP Port */}
            <div>
              <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
                SMTP Port &amp; Encryption
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={smtp.port}
                  onChange={(e) => setSmtp({ ...smtp, port: Number(e.target.value) })}
                  placeholder="465"
                  required
                  className="input w-28 text-sm font-mono"
                />
                <label className="flex items-center gap-2 text-xs font-medium text-ink-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={smtp.secure}
                    onChange={(e) => setSmtp({ ...smtp, secure: e.target.checked })}
                    className="checkbox"
                  />
                  <span>SSL Security (Recommended for Port 465)</span>
                </label>
              </div>
              <span className="text-2xs text-ink-3 mt-1 block">
                Use 465 with SSL enabled, or 587 for TLS.
              </span>
            </div>

            {/* SMTP User */}
            <div>
              <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
                SMTP Username / Mailbox
              </label>
              <input
                type="text"
                value={smtp.user}
                onChange={(e) => setSmtp({ ...smtp, user: e.target.value })}
                placeholder="noreply@zen-try.site"
                required
                className="input w-full text-sm font-mono"
              />
              <span className="text-2xs text-ink-3 mt-1 block">
                Your full ZenTry email login address created in Hostinger / Webmail.
              </span>
            </div>

            {/* SMTP Password */}
            <div>
              <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
                SMTP Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={smtp.pass}
                  onChange={(e) => setSmtp({ ...smtp, pass: e.target.value })}
                  placeholder="••••••••••••"
                  required
                  className="input w-full text-sm font-mono pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <span className="text-2xs text-ink-3 mt-1 block">
                {smtp.host.includes('gmail')
                  ? 'Gmail requires a 16-character App Password (e.g. abcd efgh ijkl mnop).'
                  : 'The password for this specific email address.'}
              </span>
            </div>

            {/* Google App Password Guide Banner */}
            {smtp.host.includes('gmail') && (
              <div className="md:col-span-2 rounded-xl bg-accent/10 border border-accent/25 p-4 text-xs space-y-2">
                <div className="font-bold text-accent flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>Important for Google / Gmail:</span>
                </div>
                <p className="text-ink-2 leading-relaxed">
                  Google does not accept your standard account password for automated SMTP. You must generate a <strong>16-character Google App Password</strong>:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-ink-2 pl-1">
                  <li>
                    Open your Google Account: <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" className="text-accent underline font-mono font-semibold">https://myaccount.google.com/apppasswords</a>
                  </li>
                  <li>Type &quot;ZenTry&quot; as the app name and click <strong>Create</strong>.</li>
                  <li>Copy the 16-character password generated by Google (e.g. <span className="font-mono bg-surface px-1 py-0.5 rounded border border-line">xxxx xxxx xxxx xxxx</span>) and paste it into the <strong>SMTP Password</strong> box above.</li>
                </ol>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-4">
            <label className="flex items-center gap-2 text-xs font-semibold text-ink cursor-pointer select-none">
              <input
                type="checkbox"
                checked={smtp.enabled}
                onChange={(e) => setSmtp({ ...smtp, enabled: e.target.checked })}
                className="checkbox"
              />
              <span>Enable ZenTry Platform Email Dispatch</span>
            </label>

            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary font-bold text-sm px-6 py-2.5 shadow-sm min-w-[200px]"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Saving Settings…
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Save ZenTry Master Settings
                </>
              )}
            </button>
          </div>
        </form>

        {/* Live Delivery Testing Panel */}
        <div className="card border-2 border-line bg-surface p-6 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-accent/10 text-accent shrink-0">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-ink">
                Test Verification Delivery
              </h3>
              <p className="text-xs text-ink-2 mt-0.5">
                Send a real test email from your ZenTry master email to verify delivery without having to register a fake business.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <input
              type="email"
              value={testEmailTo}
              onChange={(e) => setTestEmailTo(e.target.value)}
              placeholder="Enter your personal email (e.g. you@gmail.com)"
              className="input flex-1 text-sm font-mono"
            />
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing || !smtp.user || !smtp.pass}
              className="btn btn-secondary font-bold text-xs px-5 py-2.5 border-line hover:border-line-3 shrink-0"
            >
              {testing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Verifying Connection…
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Send Test Verification Email
                </>
              )}
            </button>
          </div>
        </div>

        {/* How New Business Verification Works */}
        <div className="card border-2 border-line bg-surface p-6 md:p-8 rounded-2xl shadow-sm space-y-6">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-accent/10 text-accent shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-ink">
                How Business Signup Verification Works
              </h3>
              <p className="text-xs text-ink-2 mt-0.5">
                Connecting ZenTry&apos;s email to Supabase Auth so new business registrations receive clean, branded verification emails.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-surface-2 border border-line space-y-2">
              <div className="w-7 h-7 rounded-lg bg-accent text-accent-ink font-bold text-xs flex items-center justify-center">
                1
              </div>
              <h4 className="text-xs font-bold text-ink">New Business Signs Up</h4>
              <p className="text-xs text-ink-3 leading-relaxed">
                A business owner registers at <span className="font-mono text-accent">zen-try.site/signup</span> to create their company workspace and install chat on their website.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-surface-2 border border-line space-y-2">
              <div className="w-7 h-7 rounded-lg bg-accent text-accent-ink font-bold text-xs flex items-center justify-center">
                2
              </div>
              <h4 className="text-xs font-bold text-ink">ZenTry Verification Sent</h4>
              <p className="text-xs text-ink-3 leading-relaxed">
                Supabase Auth sends the activation link to the business owner&apos;s email from your authenticated <span className="font-mono text-accent">{smtp.from_email || 'noreply@zen-try.site'}</span> address.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-surface-2 border border-line space-y-2">
              <div className="w-7 h-7 rounded-lg bg-accent text-accent-ink font-bold text-xs flex items-center justify-center">
                3
              </div>
              <h4 className="text-xs font-bold text-ink">Workspace Activated</h4>
              <p className="text-xs text-ink-3 leading-relaxed">
                Once verified, the user is redirected to onboarding to set up their company, get their widget code, and configure their own workspace email.
              </p>
            </div>
          </div>

          {/* Quick Copy Box for Supabase Dashboard */}
          <div className="rounded-xl border border-line bg-surface-2 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-ink uppercase tracking-wider">
                  Sync with Supabase Auth (Custom SMTP)
                </h4>
                <p className="text-xs text-ink-3 mt-0.5">
                  To ensure Supabase Auth sends new business verification emails via your ZenTry mailbox, copy these values into your Supabase Dashboard:
                </p>
              </div>
              <a
                href="https://supabase.com/dashboard/project/vfjsaynnubxywdbevxtx/auth/templates"
                target="_blank"
                rel="noreferrer"
                className="btn btn-xs btn-secondary gap-1.5 text-xs font-bold"
              >
                <span>Open Supabase SMTP</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-surface border border-line space-y-1">
                <span className="text-2xs font-bold text-ink-3 uppercase">Sender Email</span>
                <div className="font-mono text-ink font-semibold truncate flex items-center justify-between">
                  <span>{smtp.from_email || 'noreply@zen-try.site'}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(smtp.from_email || 'noreply@zen-try.site', 'from_email')}
                    className="text-ink-3 hover:text-accent ml-1"
                  >
                    {copiedField === 'from_email' ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-surface border border-line space-y-1">
                <span className="text-2xs font-bold text-ink-3 uppercase">Host</span>
                <div className="font-mono text-ink font-semibold truncate flex items-center justify-between">
                  <span>{smtp.host || 'smtp.hostinger.com'}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(smtp.host || 'smtp.hostinger.com', 'host')}
                    className="text-ink-3 hover:text-accent ml-1"
                  >
                    {copiedField === 'host' ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-surface border border-line space-y-1">
                <span className="text-2xs font-bold text-ink-3 uppercase">Port</span>
                <div className="font-mono text-ink font-semibold truncate flex items-center justify-between">
                  <span>{smtp.port || 465}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(String(smtp.port || 465), 'port')}
                    className="text-ink-3 hover:text-accent ml-1"
                  >
                    {copiedField === 'port' ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-surface border border-line space-y-1">
                <span className="text-2xs font-bold text-ink-3 uppercase">Username</span>
                <div className="font-mono text-ink font-semibold truncate flex items-center justify-between">
                  <span>{smtp.user || 'your-email@zen-try.site'}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(smtp.user || '', 'user')}
                    className="text-ink-3 hover:text-accent ml-1"
                  >
                    {copiedField === 'user' ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
