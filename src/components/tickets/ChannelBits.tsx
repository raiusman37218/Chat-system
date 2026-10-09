'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Check, CheckCheck, Clock, FileText, RotateCcw, Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select } from '@/components/ui/Input';
import { SkeletonBlock } from '@/components/ui/States';
import { listChannelTemplatesAction } from '@/app/actions/channels';
import type { ReplyOutcome, TicketChannelState } from '@/app/actions/tickets';
import { renderTemplate } from '@/lib/channels/templates';
import type { MessageTemplate } from '@/lib/channels/types';
import { formatRemaining, serviceWindow } from '@/lib/channels/window';
import type { ChannelMessageStatus } from '@/types/database';
import { cn } from '@/lib/utils';
import { timeAgo } from './TicketBits';

/**
 * The ticket screen's channel pieces: the 24-hour window banner, the
 * template composer used once that window has closed, and the delivery
 * status under each outgoing message.
 */

/** Re-renders every minute so the window countdown stays honest. */
export function useMinuteClock(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

export function useServiceWindow(state: TicketChannelState | null) {
  const now = useMinuteClock();
  return useMemo(() => (state ? serviceWindow(state.lastInboundAt, state.windowHours, now) : null), [state, now]);
}

export function ChannelBanner({ state, window: win }: { state: TicketChannelState; window: ReturnType<typeof serviceWindow> | null }) {
  if (state.connectionStatus === 'disconnected') {
    return (
      <div role="alert" className="mb-2 rounded-md border border-danger-line bg-danger-soft px-3 py-2 text-xs text-ink">
        <span className="font-semibold text-danger">{state.label} is not connected.</span> Replies cannot be sent until an admin reconnects it in
        Settings → Channels.
      </div>
    );
  }
  return (
    <>
      {state.connectionStatus === 'needs_attention' && (
        <div role="alert" className="mb-2 rounded-md border border-warn-line bg-warn-soft px-3 py-2 text-xs text-ink">
          <span className="font-semibold text-warn">{state.label} needs attention.</span> Sending may fail; an admin can check the error in Settings →
          Channels.
        </div>
      )}
      {win && state.windowHours !== null && win.open && (
        <p className="mb-2 flex items-center gap-1.5 text-xs text-ink-2">
          <Clock className="w-3.5 h-3.5 text-ink-3" aria-hidden="true" />
          Customer service window open · {formatRemaining(win.remainingMs)} left to reply freely
        </p>
      )}
      {win && state.windowHours !== null && !win.open && (
        <div role="status" className="mb-2 rounded-md border border-line bg-surface-2 px-3 py-2 text-xs text-ink">
          <p className="font-semibold flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-ink-3" aria-hidden="true" /> The {state.windowHours}-hour window has closed
          </p>
          <p className="mt-0.5 text-ink-2">
            {state.lastInboundAt ? `The customer last wrote ${timeAgo(state.lastInboundAt)}. ` : 'The customer has not written on this channel. '}
            {state.label} only lets a business send pre-approved templates until the customer writes again. Their next message reopens the
            window.
          </p>
        </div>
      )}
    </>
  );
}

export function TemplateComposer({
  workspaceId,
  channel,
  onSend,
}: {
  workspaceId: string;
  channel: string;
  onSend: (t: { name: string; language: string; body: string; params: string[] }) => Promise<void>;
}) {
  const [templates, setTemplates] = useState<MessageTemplate[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [key, setKey] = useState('');
  const [params, setParams] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listChannelTemplatesAction(workspaceId, channel)
      .catch((e: Error) => ({ success: false as const, error: e.message }))
      .then((res) => {
        if (cancelled) return;
        if (!res.success) return setLoadError(res.error);
        setTemplates(res.templates);
      });
    return () => {
      cancelled = true;
    };
  }, [workspaceId, channel, attempt]);

  const chosen = templates?.find((t) => `${t.name}|${t.language}` === key) || null;

  async function send() {
    if (!chosen || sending) return;
    setSending(true);
    setError(null);
    try {
      await onSend({ name: chosen.name, language: chosen.language, body: chosen.body, params: params.slice(0, chosen.paramCount) });
      setKey('');
      setParams([]);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSending(false);
    }
  }

  if (loadError) {
    return (
      <div role="alert" className="flex flex-wrap items-center gap-2 text-xs text-ink-2">
        <span>Templates could not be loaded: {loadError}</span>
        <Button
          size="xs"
          onClick={() => {
            setLoadError(null);
            setTemplates(null);
            setAttempt((n) => n + 1);
          }}
        >
          Try again
        </Button>
      </div>
    );
  }
  if (!templates) return <SkeletonBlock className="h-9 w-full rounded-sm" />;
  if (!templates.length) {
    return (
      <p className="text-xs text-ink-2">
        No approved templates yet. Create one in WhatsApp Manager (Account tools → Message templates); Meta usually reviews it within a day.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <Field label="Template">
        <Select
          value={key}
          onChange={(e) => {
            setKey(e.target.value);
            setParams([]);
          }}
        >
          <option value="">Choose an approved template…</option>
          {templates.map((t) => (
            <option key={`${t.name}|${t.language}`} value={`${t.name}|${t.language}`}>
              {t.name} ({t.language})
            </option>
          ))}
        </Select>
      </Field>
      {chosen && (
        <>
          {chosen.paramCount > 0 && (
            <div className="grid gap-2 sm:grid-cols-2">
              {Array.from({ length: chosen.paramCount }, (_, i) => (
                <Field key={i} label={`Value for {{${i + 1}}}`}>
                  <Input
                    value={params[i] || ''}
                    onChange={(e) =>
                      setParams((p) => {
                        const next = [...p];
                        next[i] = e.target.value;
                        return next;
                      })
                    }
                  />
                </Field>
              ))}
            </div>
          )}
          <div className="rounded-md border border-line bg-surface-2 px-3 py-2 text-ui text-ink whitespace-pre-wrap break-words">
            <p className="eyebrow mb-1 flex items-center gap-1">
              <FileText className="w-3 h-3" aria-hidden="true" /> Preview
            </p>
            {renderTemplate(chosen.body, params) || chosen.name}
          </div>
        </>
      )}
      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
      <div className="flex justify-end">
        <Button
          variant="primary"
          size="sm"
          loading={sending}
          disabled={!chosen || params.slice(0, chosen.paramCount).filter((p) => p?.trim()).length < chosen.paramCount}
          onClick={send}
        >
          <Send className="w-3.5 h-3.5" aria-hidden="true" /> Send template
        </Button>
      </div>
    </div>
  );
}

const STATUS_TEXT: Record<ChannelMessageStatus, string> = {
  queued: 'Sending…',
  sent: 'Sent',
  delivered: 'Delivered',
  read: 'Read',
  failed: 'Not delivered',
};

export function DeliveryStatus({
  status,
  error,
  onRetry,
}: {
  status: ChannelMessageStatus;
  error?: string | null;
  onRetry?: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const Icon = status === 'read' || status === 'delivered' ? CheckCheck : status === 'failed' ? AlertTriangle : status === 'queued' ? Clock : Check;
  return (
    <div className={cn('mt-0.5 text-2xs', status === 'failed' ? 'text-danger' : 'text-ink-3')}>
      <div className="flex items-center justify-end gap-1">
        <Icon className={cn('w-3 h-3', status === 'read' && 'text-accent')} aria-hidden="true" />
        <span>{STATUS_TEXT[status]}</span>
        {status === 'failed' && onRetry && (
          <Button
            size="xs"
            variant="ghost"
            loading={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await onRetry();
              } finally {
                setBusy(false);
              }
            }}
          >
            <RotateCcw className="w-3 h-3" aria-hidden="true" /> Retry
          </Button>
        )}
      </div>
      {status === 'failed' && error && <p className="text-ink-2 text-right break-words">{error}</p>}
    </div>
  );
}

/** One line for the notice bar after a channel send. */
export function channelNotice(outcome: ReplyOutcome['channel'], label: string): string | null {
  if (!outcome) return null;
  if (outcome.status === 'failed') return `Not sent on ${label}: ${outcome.error}`;
  if (outcome.status === 'queued') return `Saved. ${label} did not accept it yet; it will be retried automatically.`;
  return null;
}
