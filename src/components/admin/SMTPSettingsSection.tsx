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
  Check,
} from 'lucide-react';
import { SMTPSettingsConfig, Workspace } from '@/types/database';
import { updateSMTPSettingsAction } from '@/app/actions/admin';

interface SMTPSettingsSectionProps {
  workspace: Workspace;
  onWorkspaceUpdated?: (updated: Workspace) => void;
}

const isValidEmail = (email: string | undefined | null) => {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
};

export function SMTPSettingsSection({
  workspace,
  onWorkspaceUpdated,
}: SMTPSettingsSectionProps) {
  const rawSmtp = (workspace.smtp_settings as SMTPSettingsConfig | null);
  const initialSmtp: SMTPSettingsConfig = {
    enabled: rawSmtp?.enabled ?? true,
    host: rawSmtp?.host || 'smtp.hostinger.com',
    port: rawSmtp?.port || 465,
    secure: rawSmtp?.secure ?? true,
    user: rawSmtp?.user || '',
    pass: rawSmtp?.pass || '',
    from_email: (rawSmtp?.from_email && isValidEmail(rawSmtp.from_email))
      ? rawSmtp.from_email
      : (rawSmtp?.user || ''),
    from_name: rawSmtp?.from_name || workspace.name || 'Support Desk',
    unread_threshold_minutes: rawSmtp?.unread_threshold_minutes || 5,
  };

  const [smtp, setSmtp] = useState<SMTPSettingsConfig>(initialSmtp);
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [checkingCron, setCheckingCron] = useState(false);
  const [testEmailTo, setTestEmailTo] = useState('raiusman671@gmail.com');
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
      from_email: isValidEmail(prev.from_email) ? prev.from_email : (prev.user || ''),
      from_name: prev.from_name || workspace.name || 'Support Desk',
    }));
    setStatusMessage({
      type: 'info',
      text: 'Hostinger SMTP defaults applied (smtp.hostinger.com:465 SSL). Please ensure your Hostinger email and password are entered.',
    });
  };

  const handleTestConnection = async (withTestEmail: boolean = false) => {
    setTesting(true);
    setStatusMessage(null);
    try {
      const effectiveFrom = (smtp.from_email && isValidEmail(smtp.from_email))
        ? smtp.from_email.trim()
        : smtp.user.trim();

      const normalizedConfig: SMTPSettingsConfig = {
        ...smtp,
        host: (smtp.host || 'smtp.hostinger.com').trim(),
        port: Number(smtp.port) || 465,
        user: smtp.user.trim(),
        pass: smtp.pass,
        from_name: (smtp.from_name || workspace.name || 'Support Desk').trim(),
        from_email: effectiveFrom,
        secure: Number(smtp.port) === 465,
        unread_threshold_minutes: Number(smtp.unread_threshold_minutes) || 5,
      };

      // Auto-correct on screen if invalid text was present
      if (smtp.from_email !== effectiveFrom) {
        setSmtp(normalizedConfig);
      }

      if (!normalizedConfig.host || !normalizedConfig.port || !normalizedConfig.user || !normalizedConfig.pass) {
        setStatusMessage({
          type: 'error',
          text: 'Please fill in Host, Port, Username and Password before testing.',
        });
        setTesting(false);
        return;
      }

      if (!isValidEmail(normalizedConfig.user)) {
        setStatusMessage({
          type: 'error',
          text: 'Hostinger Email Address (Username) must be a valid email (e.g. helpdesk@range4ex.com).',
        });
        setTesting(false);
        return;
      }

      let recipientToSend: string | undefined = undefined;
      if (withTestEmail) {
        const targetRecipient = testEmailTo.trim();
        if (!targetRecipient || !isValidEmail(targetRecipient)) {
          setStatusMessage({
            type: 'error',
            text: 'Please enter a valid recipient email (e.g. raiusman671@gmail.com) in the test email box.',
          });
          setTesting(false);
          return;
        }
        recipientToSend = targetRecipient;
      }

      const res = await fetch('/api/workspace/smtp/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: normalizedConfig,
          sendTestTo: recipientToSend,
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
      const effectiveFrom = (smtp.from_email && isValidEmail(smtp.from_email))
        ? smtp.from_email.trim()
        : smtp.user.trim();

      const normalizedConfig: SMTPSettingsConfig = {
        ...smtp,
        host: (smtp.host || 'smtp.hostinger.com').trim(),
        port: Number(smtp.port) || 465,
        user: smtp.user.trim(),
        pass: smtp.pass,
        from_name: (smtp.from_name || workspace.name || 'Support Desk').trim(),
        from_email: effectiveFrom,
        secure: Number(smtp.port) === 465,
        unread_threshold_minutes: Number(smtp.unread_threshold_minutes) || 5,
      };

      setSmtp(normalizedConfig);

      if (!normalizedConfig.host || !normalizedConfig.user || !normalizedConfig.pass) {
        setStatusMessage({
          type: 'error',
          text: 'Please fill in Host, Username and Password before saving.',
        });
        setSaving(false);
        return;
      }

      const res = await updateSMTPSettingsAction(workspace.id, normalizedConfig);
      if (res.workspace) {
        onWorkspaceUpdated?.(res.workspace);
        setStatusMessage({
          type: 'success',
          text: '✓ Hostinger SMTP settings and 5-minute automated email notifications saved and active!',
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
      <div className="card border-2 border-line-2 bg-surface p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-accent text-white p-3 shadow-sm">
              <Mail className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-ink">
                Email &amp; Hostinger SMTP Integration
              </h3>
              <p className="text-[13px] text-ink-2 mt-0.5 leading-relaxed">
                Configure your custom workspace email credentials. When a user has not seen a query reply for 5 minutes, an automatic professional email notification is sent to them.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={applyHostingerPreset}
            className="btn btn-sm btn-secondary font-bold text-xs gap-1.5 border-2 border-line-2 hover:border-line-3 text-accent shrink-0 shadow-xs"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Auto-fill Hostinger Settings
          </button>
        </div>
      </div>

      {/* Main Form */}
      <div className="card border-2 border-line-2 bg-surface p-6 shadow-xs space-y-6">
        {/* Toggle 5-min alert */}
        <div className="flex items-center justify-between p-4.5 rounded-xl bg-surface-2/70 border-2 border-line-2 shadow-2xs">
          <div className="space-y-0.5 pr-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-accent" />
              <label htmlFor="smtp-enabled-toggle" className="text-[14px] font-bold text-ink cursor-pointer">
                Automated 5-Minute Unread Email Notifications
              </label>
            </div>
            <p className="text-[12px] text-ink-2 leading-relaxed">
              If a customer leaves the site or doesn&apos;t read an agent&apos;s reply within 5 minutes, email them the reply automatically with a direct link to the conversation.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              id="smtp-enabled-toggle"
              type="checkbox"
              checked={smtp.enabled}
              onChange={(e) => setSmtp({ ...smtp, enabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-12 h-6.5 bg-line-2 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5.5 after:w-5.5 after:transition-all peer-checked:bg-accent shadow-xs"></div>
          </label>
        </div>

        {/* Credentials Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-[13px] font-bold text-ink mb-1.5">
              SMTP Host Server <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={smtp.host}
              onChange={(e) => setSmtp({ ...smtp, host: e.target.value })}
              placeholder="smtp.hostinger.com"
              className="input text-sm font-medium border-2 border-line-2 focus:border-accent text-ink"
            />
            <p className="text-[11.5px] text-ink-2 mt-1">
              Hostinger default is <code className="font-mono font-bold text-accent">smtp.hostinger.com</code>
            </p>
          </div>

          <div>
            <label className="block text-[13px] font-bold text-ink mb-1.5">
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
                className="input w-28 text-sm font-mono font-bold border-2 border-line-2 focus:border-accent text-ink"
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
                className="input flex-1 text-sm font-semibold border-2 border-line-2 focus:border-accent text-ink"
              >
                <option value="465">Port 465 (SSL - Recommended)</option>
                <option value="587">Port 587 (TLS / STARTTLS)</option>
              </select>
            </div>
            <p className="text-[11.5px] text-ink-2 mt-1">
              Use Port 465 for secure Hostinger SSL transmission
            </p>
          </div>

          <div>
            <label className="block text-[13px] font-bold text-ink mb-1.5">
              Hostinger Email Address (Username) <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              value={smtp.user}
              onChange={(e) => {
                const val = e.target.value;
                setSmtp((prev) => ({
                  ...prev,
                  user: val,
                  from_email: (!prev.from_email || prev.from_email === prev.user || !isValidEmail(prev.from_email))
                    ? val
                    : prev.from_email,
                }));
              }}
              placeholder="helpdesk@range4ex.com"
              className="input text-sm font-medium border-2 border-line-2 focus:border-accent text-ink"
            />
            <p className="text-[11.5px] text-ink-2 mt-1">
              Your primary mailbox address on Hostinger
            </p>
          </div>

          <div>
            <label className="block text-[13px] font-bold text-ink mb-1.5">
              Email Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={smtp.pass}
                onChange={(e) => setSmtp({ ...smtp, pass: e.target.value })}
                placeholder="••••••••••••••••"
                className="input text-sm font-medium pr-10 border-2 border-line-2 focus:border-accent text-ink"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-2 hover:text-ink p-1"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[13px] font-bold text-ink">
                Sender Email (&quot;From&quot; Address)
              </label>
              {smtp.user && smtp.from_email !== smtp.user && (
                <button
                  type="button"
                  onClick={() => setSmtp((prev) => ({ ...prev, from_email: prev.user.trim() }))}
                  className="text-[11.5px] font-bold text-accent hover:underline"
                >
                  Use Hostinger Email
                </button>
              )}
            </div>
            <input
              type="email"
              value={smtp.from_email}
              onChange={(e) => setSmtp({ ...smtp, from_email: e.target.value })}
              onBlur={() => {
                if (smtp.from_email && !isValidEmail(smtp.from_email)) {
                  if (smtp.user && isValidEmail(smtp.user)) {
                    setSmtp((prev) => ({ ...prev, from_email: prev.user.trim() }));
                  }
                }
              }}
              placeholder={smtp.user || 'helpdesk@range4ex.com'}
              className={`input text-sm font-medium border-2 ${
                smtp.from_email && !isValidEmail(smtp.from_email)
                  ? 'border-rose-500 focus:border-rose-500'
                  : 'border-line-2 focus:border-accent text-ink'
              }`}
            />
            {smtp.from_email && !isValidEmail(smtp.from_email) ? (
              <p className="text-[11.5px] text-rose-500 font-semibold mt-1 flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                Must be a valid email (e.g. {smtp.user || 'helpdesk@range4ex.com'}).
              </p>
            ) : (
              <p className="text-[11.5px] text-ink-2 mt-1">
                Must match your Hostinger mailbox address
              </p>
            )}
          </div>

          <div>
            <label className="block text-[13px] font-bold text-ink mb-1.5">
              Sender Name
            </label>
            <input
              type="text"
              value={smtp.from_name}
              onChange={(e) => setSmtp({ ...smtp, from_name: e.target.value })}
              placeholder={workspace.name || 'Range HELP Desk'}
              className="input text-sm font-semibold border-2 border-line-2 focus:border-accent text-ink"
            />
          </div>
        </div>

        {/* Status Alerts */}
        {statusMessage && (
          <div
            className={`p-4 rounded-xl text-sm font-semibold flex items-start gap-3 border-2 shadow-xs ${
              statusMessage.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                : statusMessage.type === 'error'
                ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30'
                : 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30'
            }`}
          >
            {statusMessage.type === 'success' && <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />}
            {statusMessage.type === 'error' && <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />}
            {statusMessage.type === 'info' && <ShieldCheck className="h-5 w-5 shrink-0 text-indigo-600" />}
            <div className="flex-1 whitespace-pre-wrap">{statusMessage.text}</div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-4 border-t-2 border-line-2 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              disabled={testing}
              onClick={() => handleTestConnection(false)}
              className="btn btn-sm btn-secondary font-bold text-xs gap-1.5 border-2 border-line-2 hover:border-line-3"
            >
              {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5 text-accent" />}
              Test Connection
            </button>

            <div className="flex items-center gap-1.5">
              <input
                type="email"
                placeholder="test@example.com"
                value={testEmailTo}
                onChange={(e) => setTestEmailTo(e.target.value)}
                className="input w-48 text-xs font-medium border-2 border-line-2 py-1.5 h-8"
              />
              <button
                type="button"
                disabled={testing}
                onClick={() => handleTestConnection(true)}
                className="btn btn-sm btn-accent font-bold text-xs gap-1.5 shadow-xs"
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
              className="btn btn-sm btn-ghost font-semibold text-xs text-ink-2 hover:text-ink gap-1.5"
            >
              {checkingCron ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Clock className="h-3.5 w-3.5" />}
              Run 5m Unread Check
            </button>
          </div>

          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="btn btn-sm btn-primary font-bold text-sm px-5 py-2 shadow-sm gap-2"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
