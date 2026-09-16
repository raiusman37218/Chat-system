'use client';

import React, { useState } from 'react';
import {
  Mail,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
  Sparkles,
  Eye,
  EyeOff,
  ShieldCheck,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { SMTPSettingsConfig, Workspace } from '@/types/database';
import { updateSMTPSettingsAction } from '@/app/actions/admin';

interface SMTPSettingsSectionProps {
  workspace: Workspace;
  onWorkspaceUpdated?: (updated: Workspace) => void;
}

export function SMTPSettingsSection({
  workspace,
  onWorkspaceUpdated,
}: SMTPSettingsSectionProps) {
  const initialSmtp = (workspace.smtp_settings as SMTPSettingsConfig | null) || {
    enabled: true,
    host: 'smtp.hostinger.com',
    port: 465,
    secure: true,
    user: '',
    pass: '',
    from_email: '',
    from_name: workspace.name || 'Support Desk',
    unread_threshold_minutes: 5,
  };

  const [smtp, setSmtp] = useState<SMTPSettingsConfig>(initialSmtp);
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [checkingCron, setCheckingCron] = useState(false);
  const [testEmailTo, setTestEmailTo] = useState('');
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  const applyHostingerPreset = () => {
    setSmtp((prev) => ({
      ...prev,
      host: 'smtp.hostinger.com',
      port: 465,
      secure: true,
      from_name: prev.from_name || workspace.name || 'Support Desk',
    }));
    setStatusMessage({
      type: 'info',
      text: 'Hostinger SMTP defaults applied (smtp.hostinger.com:465 SSL). Please enter your Hostinger email and password.',
    });
  };

  const handleTestConnection = async (withTestEmail: boolean = false) => {
    setTesting(true);
    setStatusMessage(null);
    try {
      if (!smtp.host || !smtp.port || !smtp.user || !smtp.pass) {
        setStatusMessage({
          type: 'error',
          text: 'Please fill in Host, Port, Username and Password before testing.',
        });
        setTesting(false);
        return;
      }

      const res = await fetch('/api/workspace/smtp/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: smtp,
          sendTestTo: withTestEmail ? (testEmailTo || smtp.from_email || smtp.user) : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setStatusMessage({
          type: 'error',
          text: data.error || 'Connection failed. Please verify your Hostinger email & password.',
        });
      } else {
        setStatusMessage({
          type: 'success',
          text: data.message || 'Hostinger SMTP connection verified successfully!',
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to connect to SMTP server.',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setStatusMessage(null);
    try {
      const res = await updateSMTPSettingsAction(workspace.id, smtp);
      if (res.workspace) {
        onWorkspaceUpdated?.(res.workspace);
        setStatusMessage({
          type: 'success',
          text: 'Hostinger SMTP settings and 5-minute email alerts saved successfully!',
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to save SMTP settings.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTriggerCronCheck = async () => {
    setCheckingCron(true);
    try {
      const res = await fetch('/api/cron/unread-notifications', { method: 'POST' });
      const data = await res.json();
      if (data.sentEmails > 0) {
        setStatusMessage({
          type: 'success',
          text: `Check complete! Sent ${data.sentEmails} unread email alert(s).`,
        });
      } else {
        setStatusMessage({
          type: 'info',
          text: `Check complete: No unread messages older than 5 minutes needed an email alert right now.`,
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Cron check failed.',
      });
    } finally {
      setCheckingCron(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-indigo-500/10 p-3 text-indigo-500">
              <Mail className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Email &amp; Hostinger SMTP Integration
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                Configure your custom workspace email credentials. When a user has not seen a query reply for 5 minutes, an automatic professional email notification is sent to them.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={applyHostingerPreset}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition-colors shrink-0"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Auto-fill Hostinger Settings
          </button>
        </div>
      </div>

      {/* Main Form */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-6">
        {/* Toggle 5-min alert */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/40 border border-border">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-indigo-500" />
              <label htmlFor="smtp-enabled-toggle" className="text-sm font-semibold text-foreground cursor-pointer">
                Automated 5-Minute Unread Email Notifications
              </label>
            </div>
            <p className="text-xs text-muted-foreground">
              If a customer leaves the site or doesn&apos;t read an agent&apos;s reply within 5 minutes, email them the reply automatically with a direct link to the conversation.
            </p>
          </div>
          <input
            id="smtp-enabled-toggle"
            type="checkbox"
            checked={smtp.enabled}
            onChange={(e) => setSmtp({ ...smtp, enabled: e.target.checked })}
            className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
          />
        </div>

        {/* Credentials Form */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              SMTP Host
            </label>
            <input
              type="text"
              value={smtp.host}
              onChange={(e) => setSmtp({ ...smtp, host: e.target.value })}
              placeholder="smtp.hostinger.com"
              className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Hostinger default is <code className="text-indigo-600 dark:text-indigo-400">smtp.hostinger.com</code>
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              SMTP Port &amp; Encryption
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={smtp.port}
                onChange={(e) => {
                  const portNum = parseInt(e.target.value, 10) || 465;
                  setSmtp({
                    ...smtp,
                    port: portNum,
                    secure: portNum === 465,
                  });
                }}
                placeholder="465"
                className="w-28 rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <select
                value={smtp.port === 465 ? '465' : '587'}
                onChange={(e) => {
                  const portNum = parseInt(e.target.value, 10);
                  setSmtp({
                    ...smtp,
                    port: portNum,
                    secure: portNum === 465,
                  });
                }}
                className="flex-1 rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-indigo-500 focus:outline-none"
              >
                <option value="465">Port 465 (SSL - Recommended)</option>
                <option value="587">Port 587 (TLS / STARTTLS)</option>
              </select>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Use Port 465 for secure Hostinger SSL transmission
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Hostinger Email Address (Username)
            </label>
            <input
              type="email"
              value={smtp.user}
              onChange={(e) => {
                const val = e.target.value;
                setSmtp({
                  ...smtp,
                  user: val,
                  from_email: smtp.from_email || val,
                });
              }}
              placeholder="support@yourdomain.com"
              className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Email Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={smtp.pass}
                onChange={(e) => setSmtp({ ...smtp, pass: e.target.value })}
                placeholder="••••••••••••••••"
                className="w-full rounded-lg border border-input bg-background pl-3.5 pr-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Sender Email (&quot;From&quot; Address)
            </label>
            <input
              type="email"
              value={smtp.from_email}
              onChange={(e) => setSmtp({ ...smtp, from_email: e.target.value })}
              placeholder={smtp.user || 'support@yourdomain.com'}
              className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Sender Name
            </label>
            <input
              type="text"
              value={smtp.from_name}
              onChange={(e) => setSmtp({ ...smtp, from_name: e.target.value })}
              placeholder={workspace.name || 'Range HELP Desk'}
              className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Status Alerts */}
        {statusMessage && (
          <div
            className={`p-4 rounded-lg text-sm flex items-start gap-3 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : statusMessage.type === 'error'
                ? 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                : 'bg-indigo-50 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
            }`}
          >
            {statusMessage.type === 'success' && <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />}
            {statusMessage.type === 'error' && <AlertCircle className="h-5 w-5 shrink-0 text-rose-500" />}
            {statusMessage.type === 'info' && <ShieldCheck className="h-5 w-5 shrink-0 text-indigo-500" />}
            <div className="flex-1 whitespace-pre-wrap">{statusMessage.text}</div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-4 border-t border-border flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={testing}
              onClick={() => handleTestConnection(false)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border transition-colors disabled:opacity-50"
            >
              {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
              Test Connection
            </button>

            <div className="flex items-center gap-1.5">
              <input
                type="email"
                placeholder="test@example.com"
                value={testEmailTo}
                onChange={(e) => setTestEmailTo(e.target.value)}
                className="w-44 rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                disabled={testing}
                onClick={() => handleTestConnection(true)}
                className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition-colors disabled:opacity-50"
              >
                <Send className="h-3 w-3" />
                Send Test Email
              </button>
            </div>

            <button
              type="button"
              disabled={checkingCron}
              onClick={handleTriggerCronCheck}
              title="Manually trigger the 5-minute unread check"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              {checkingCron ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Clock className="h-3.5 w-3.5" />}
              Run 5m Unread Check
            </button>
          </div>

          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
