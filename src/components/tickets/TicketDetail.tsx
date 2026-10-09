'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Bot,
  CornerDownRight,
  History,
  Lock,
  Mail,
  MapPin,
  MessageSquare,
  Monitor,
  Paperclip,
  Plus,
  Send,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { Avatar } from '@/components/ui/Avatar';
import { ChatMarkdown } from '@/components/ui/ChatMarkdown';
import { Menu } from '@/components/ui/Menu';
import {
  getTicketAction,
  replyToTicketAction,
  updateTicketAction,
  type TicketDetail as Detail,
  type TicketPatch,
} from '@/app/actions/tickets';
import { actorLabel, describeEvent } from '@/lib/tickets/events';
import {
  CHANNEL_LABEL,
  PRIORITY_LABEL,
  SETTABLE_STATUSES,
  STATUS_LABEL,
  TICKET_PRIORITIES,
  TICKET_TYPES,
  TYPE_LABEL,
  normalizeTag,
} from '@/lib/tickets/views';
import type { TicketGroup, TicketPriority, TicketStatus, TicketType } from '@/types/database';
import { ChannelIcon, StatusBadge, fullTime, inputClass, timeAgo } from './TicketBits';

interface Props {
  workspaceId: string;
  ticketId: string;
  agents: { id: string; name: string }[];
  groups: TicketGroup[];
  onBack: () => void;
  onOpenTicket: (id: string) => void;
  /** Something changed that the list and counts should reflect. */
  onChanged: () => void;
}

export function TicketDetail({ workspaceId, ticketId, agents, groups, onBack, onOpenTicket, onChanged }: Props) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [tab, setTab] = useState<'conversation' | 'audit'>('conversation');

  const load = useCallback(async () => {
    try {
      setDetail(await getTicketAction(workspaceId, ticketId));
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    }
  }, [workspaceId, ticketId]);

  // The parent keys this component by ticket, so state starts fresh per ticket.
  useEffect(() => {
    let cancelled = false;
    getTicketAction(workspaceId, ticketId)
      .then((d) => !cancelled && setDetail(d))
      .catch((err: Error) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [workspaceId, ticketId]);

  // Live: new chat messages and changes made by anyone else.
  const conversationId = detail?.ticket.conversation_id;
  useEffect(() => {
    const supabase = createClient();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const refresh = () => {
      clearTimeout(timer);
      timer = setTimeout(load, 250);
    };
    const channel = supabase.channel(`ticket-${ticketId}-${Math.random().toString(36).slice(2, 7)}`);
    channel.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tickets', filter: `id=eq.${ticketId}` }, refresh);
    if (conversationId) {
      channel.on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        refresh
      );
    }
    channel.subscribe();
    return () => {
      clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [ticketId, conversationId, load]);

  const people = useMemo(() => {
    const map: Record<string, string> = { ...(detail?.people || {}) };
    for (const a of agents) map[a.id] = a.name;
    return map;
  }, [detail, agents]);
  const groupNames = useMemo(() => Object.fromEntries(groups.map((g) => [g.id, g.name])), [groups]);

  const update = async (patch: TicketPatch) => {
    try {
      await updateTicketAction(workspaceId, ticketId, patch);
      await load();
      onChanged();
    } catch (err) {
      setNotice((err as Error).message);
    }
  };

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-[13px] text-ink-2">
        <p>{error}</p>
        <button type="button" className="btn btn-secondary btn-sm" onClick={onBack}>
          Back to tickets
        </button>
      </div>
    );
  }
  if (!detail) {
    return <div className="flex-1 flex items-center justify-center text-[13px] text-ink-3">Loading ticket…</div>;
  }

  const { ticket } = detail;
  const closed = ticket.status === 'closed';
  const followUp = detail.related.find((r) => r.follow_up_of_id === ticket.id);
  const followUpOf = detail.related.find((r) => r.id === ticket.follow_up_of_id);
  const mergedInto = detail.related.find((r) => r.id === ticket.merged_into_id);
  const mergedFrom = detail.related.filter((r) => r.merged_into_id === ticket.id);

  return (
    <div className="flex-1 flex min-h-0 min-w-0">
      <section className="flex-1 flex flex-col min-w-0 border-r border-line">
        <header className="px-4 py-3 border-b border-line flex items-start gap-3 shrink-0">
          <button type="button" className="btn btn-ghost btn-icon shrink-0" onClick={onBack} aria-label="Back to tickets">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-[12px] text-ink-3">
              <ChannelIcon channel={ticket.channel} />
              <span className="tabular-nums">#{ticket.number}</span>
              <StatusBadge status={ticket.status} />
              <span>· {CHANNEL_LABEL[ticket.channel]} · opened {timeAgo(ticket.created_at)}</span>
            </div>
            <SubjectEditor
              key={ticket.subject}
              value={ticket.subject}
              disabled={closed}
              onSave={(subject) => update({ subject })}
            />
          </div>
        </header>

        {closed && (
          <div className="px-4 py-2.5 bg-surface-2 border-b border-line text-[12.5px] text-ink-2 flex items-center gap-2 shrink-0">
            <Lock className="w-3.5 h-3.5 shrink-0" />
            <span>
              This ticket is closed and read-only.
              {mergedInto ? (
                <>
                  {' '}It was merged into{' '}
                  <LinkButton onClick={() => onOpenTicket(mergedInto.id)}>#{mergedInto.number}</LinkButton>.
                </>
              ) : followUp ? (
                <>
                  {' '}The customer&apos;s later messages are on{' '}
                  <LinkButton onClick={() => onOpenTicket(followUp.id)}>follow-up #{followUp.number}</LinkButton>.
                </>
              ) : (
                ' A new message from the customer will open a follow-up ticket.'
              )}
            </span>
          </div>
        )}
        {followUpOf && (
          <div className="px-4 py-2 border-b border-line text-[12.5px] text-ink-2 flex items-center gap-2 shrink-0">
            <CornerDownRight className="w-3.5 h-3.5 shrink-0" />
            Follow-up to <LinkButton onClick={() => onOpenTicket(followUpOf.id)}>#{followUpOf.number}</LinkButton>
            <span className="truncate text-ink-3">{followUpOf.subject}</span>
          </div>
        )}
        {mergedFrom.length > 0 && (
          <div className="px-4 py-2 border-b border-line text-[12.5px] text-ink-2 flex flex-wrap items-center gap-x-2 shrink-0">
            Merged into this ticket:
            {mergedFrom.map((m) => (
              <LinkButton key={m.id} onClick={() => onOpenTicket(m.id)}>
                #{m.number}
              </LinkButton>
            ))}
          </div>
        )}
        {notice && (
          <div className="px-4 py-2 bg-warn-soft border-b border-warn-line text-[12.5px] text-ink flex items-center gap-2 shrink-0" role="status">
            <span className="flex-1">{notice}</span>
            <button type="button" className="btn btn-ghost btn-xs" onClick={() => setNotice(null)} aria-label="Dismiss">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="flex items-center gap-1 px-4 pt-2 border-b border-line shrink-0" role="tablist">
          {(
            [
              ['conversation', 'Conversation', MessageSquare],
              ['audit', `Audit log (${detail.events.length})`, History],
            ] as const
          ).map(([key, label, Icon]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 h-9 text-[12.5px] font-semibold border-b-2 -mb-px',
                tab === key ? 'border-accent text-ink' : 'border-transparent text-ink-3 hover:text-ink-2'
              )}
            >
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>

        {tab === 'conversation' ? (
          <>
            <Thread detail={detail} people={people} />
            {!closed && (
              <Composer
                key={ticket.id}
                status={ticket.status}
                channel={ticket.channel}
                onSend={async (body, internal, submitAs) => {
                  const result = await replyToTicketAction(workspaceId, ticketId, { body, internal, submitAs });
                  if (result.emailError) setNotice(result.emailError);
                  else if (result.emailed) setNotice('Reply emailed to the requester.');
                  // Not awaited: the composer clears as soon as the reply is saved,
                  // so nothing typed meanwhile is wiped by a late clear.
                  load();
                  onChanged();
                }}
              />
            )}
          </>
        ) : (
          <AuditLog detail={detail} people={people} groups={groupNames} />
        )}
      </section>

      <aside className="w-[300px] shrink-0 overflow-y-auto bg-surface hidden md:block" aria-label="Ticket details">
        <Properties detail={detail} agents={agents} groups={groups} disabled={closed} onUpdate={update} />
        <Requester detail={detail} onOpenTicket={onOpenTicket} />
      </aside>
    </div>
  );
}

function LinkButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="font-semibold text-accent hover:underline">
      {children}
    </button>
  );
}

function SubjectEditor({ value, disabled, onSave }: { value: string; disabled: boolean; onSave: (v: string) => void }) {
  const [draft, setDraft] = useState(value);
  return (
    <input
      value={draft}
      disabled={disabled}
      aria-label="Subject"
      placeholder="Add a subject"
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => draft.trim() !== value && onSave(draft)}
      onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
      className="w-full mt-1 bg-transparent text-[17px] font-bold text-ink placeholder:text-ink-3 rounded-md px-1 -mx-1 hover:bg-surface-2 focus:bg-surface-2 focus:outline-none disabled:hover:bg-transparent"
    />
  );
}

/* ── Conversation ─────────────────────────────────────────────────────── */

function Thread({ detail, people }: { detail: Detail; people: Record<string, string> }) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [detail.messages.length]);

  const requesterName = detail.requester?.name || detail.requester?.email || 'Customer';

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-canvas">
      {detail.messages.length === 0 && <p className="text-center text-[13px] text-ink-3 py-10">No messages yet.</p>}
      {detail.messages.map((m) => {
        const time = <span title={fullTime(m.created_at)}>{timeAgo(m.created_at)}</span>;
        if (m.sender_type === 'system' && !m.is_internal) {
          return (
            <p key={m.id} className="text-center text-[11.5px] text-ink-3">
              {m.content} · {time}
            </p>
          );
        }
        if (m.is_internal) {
          const author =
            m.sender_type === 'agent' ? people[m.sender_id || ''] || 'Agent' : m.sender_type === 'ai' ? 'Bot' : 'System';
          return (
            <article key={m.id} className="rounded-xl border border-warn-line bg-warn-soft px-3.5 py-2.5" aria-label="Internal note">
              <header className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-warn mb-1">
                <Lock className="w-3 h-3" /> Internal note · <span className="normal-case tracking-normal">{author}</span>
                <span className="ml-auto font-medium normal-case tracking-normal text-ink-3">{time}</span>
              </header>
              <div className="text-[13px] text-ink whitespace-pre-wrap break-words">{m.content}</div>
            </article>
          );
        }
        const fromCustomer = m.sender_type === 'visitor';
        const author = fromCustomer ? requesterName : m.sender_type === 'ai' ? 'Bot' : people[m.sender_id || ''] || 'Agent';
        return (
          <div key={m.id} className={cn('flex gap-2.5', fromCustomer ? '' : 'flex-row-reverse')}>
            {m.sender_type === 'ai' ? (
              <span className="w-8 h-8 rounded-full bg-surface-3 flex items-center justify-center shrink-0" aria-hidden>
                <Bot className="w-4 h-4 text-ink-2" />
              </span>
            ) : (
              <Avatar name={author} seed={fromCustomer ? detail.requester?.id : m.sender_id || undefined} size="sm" />
            )}
            <div className={cn('max-w-[75%] min-w-0', fromCustomer ? '' : 'text-right')}>
              <div className="text-[11.5px] text-ink-3 mb-0.5">
                <span className="font-semibold text-ink-2">{author}</span> · {time}
              </div>
              <div
                className={cn(
                  'inline-block text-left rounded-2xl px-3.5 py-2 text-[13px] break-words',
                  fromCustomer ? 'bg-surface border border-line text-ink' : 'bg-bubble-out text-bubble-out-ink'
                )}
              >
                {m.content && <ChatMarkdown content={m.content} />}
                {m.attachment_url && (
                  <a
                    href={m.attachment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1 underline underline-offset-2"
                  >
                    <Paperclip className="w-3.5 h-3.5" /> Attachment
                  </a>
                )}
              </div>
            </div>
          </div>
        );
      })}
      <div ref={endRef} />
    </div>
  );
}

function Composer({
  status,
  channel,
  onSend,
}: {
  status: TicketStatus;
  channel: Detail['ticket']['channel'];
  onSend: (body: string, internal: boolean, submitAs?: TicketStatus) => Promise<void>;
}) {
  const [internal, setInternal] = useState(false);
  const [body, setBody] = useState('');
  const [submitAs, setSubmitAs] = useState<TicketStatus>(status === 'new' ? 'open' : status);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    if (!body.trim() || sending) return;
    setSending(true);
    setError(null);
    try {
      await onSend(body, internal, internal ? undefined : submitAs);
      setBody('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={cn('border-t px-4 py-3 shrink-0', internal ? 'border-warn-line bg-warn-soft/60' : 'border-line bg-surface')}>
      <div className="flex items-center gap-1 mb-2" role="tablist" aria-label="Reply type">
        {([false, true] as const).map((isNote) => (
          <button
            key={String(isNote)}
            type="button"
            role="tab"
            aria-selected={internal === isNote}
            onClick={() => setInternal(isNote)}
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 h-7 rounded-lg text-[12px] font-semibold',
              internal === isNote
                ? isNote
                  ? 'bg-warn-soft text-warn border border-warn-line'
                  : 'bg-accent-soft text-accent border border-accent-line'
                : 'text-ink-3 hover:text-ink-2'
            )}
          >
            {isNote ? <Lock className="w-3.5 h-3.5" /> : channel === 'chat' ? <MessageSquare className="w-3.5 h-3.5" /> : <Mail className="w-3.5 h-3.5" />}
            {isNote ? 'Internal note' : channel === 'chat' ? 'Public reply (chat)' : 'Public reply (email)'}
          </button>
        ))}
      </div>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) send();
        }}
        rows={3}
        aria-label={internal ? 'Internal note' : 'Reply'}
        placeholder={internal ? 'Only your team can see this note' : 'Write a reply to the customer'}
        className={cn(inputClass, 'h-auto py-2 resize-y min-h-[76px]', internal && 'bg-surface border-warn-line')}
      />
      {error && <p className="text-[12px] text-danger mt-1.5">{error}</p>}
      <div className="flex items-center justify-end gap-2 mt-2">
        {!internal && (
          <Menu<TicketStatus>
            value={submitAs}
            onChange={setSubmitAs}
            label="Status after sending"
            side="top"
            options={SETTABLE_STATUSES.filter((s) => s !== 'closed').map((s) => ({ value: s, label: `Submit as ${STATUS_LABEL[s]}` }))}
          />
        )}
        <button type="button" className={cn('btn btn-sm', internal ? 'btn-secondary' : 'btn-accent')} onClick={send} disabled={sending || !body.trim()}>
          <Send className="w-3.5 h-3.5" /> {sending ? 'Sending…' : internal ? 'Add note' : 'Send'}
        </button>
      </div>
    </div>
  );
}

function AuditLog({ detail, people, groups }: { detail: Detail; people: Record<string, string>; groups: Record<string, string> }) {
  const ctx = { people, groups };
  return (
    <ol className="flex-1 overflow-y-auto px-4 py-3 space-y-0.5 bg-canvas" aria-label="Audit log">
      {[...detail.events].reverse().map((e) => (
        <li key={e.id} className="flex items-start gap-3 py-2 border-b border-line/70 text-[12.5px]">
          <span className="w-36 shrink-0 text-ink-3 tabular-nums" title={e.created_at}>
            {fullTime(e.created_at)}
          </span>
          <span className="w-32 shrink-0 font-semibold text-ink truncate">{actorLabel(e, ctx)}</span>
          <span className="text-ink-2 min-w-0 break-words">{describeEvent(e, ctx)}</span>
        </li>
      ))}
    </ol>
  );
}

/* ── Sidebar ──────────────────────────────────────────────────────────── */

function Properties({
  detail,
  agents,
  groups,
  disabled,
  onUpdate,
}: {
  detail: Detail;
  agents: { id: string; name: string }[];
  groups: TicketGroup[];
  disabled: boolean;
  onUpdate: (patch: TicketPatch) => Promise<void>;
}) {
  const { ticket } = detail;
  const [tag, setTag] = useState('');
  const row = (label: string, control: React.ReactNode) => (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-[12px] text-ink-3 shrink-0">{label}</span>
      <div className={cn('min-w-0', disabled && 'pointer-events-none opacity-60')}>{control}</div>
    </div>
  );
  const statusOptions = (ticket.status === 'new' ? (['new', ...SETTABLE_STATUSES] as TicketStatus[]) : [...SETTABLE_STATUSES]).map((s) => ({
    value: s,
    label: STATUS_LABEL[s],
  }));

  return (
    <section className="p-4 border-b border-line">
      <h3 className="text-[11px] font-bold uppercase tracking-wide text-ink-3 mb-2">Properties</h3>
      {row(
        'Status',
        <Menu<TicketStatus> value={ticket.status} label="Status" onChange={(status) => status !== 'new' && onUpdate({ status })} options={statusOptions} />
      )}
      {row(
        'Priority',
        <Menu<TicketPriority>
          value={ticket.priority}
          label="Priority"
          onChange={(priority) => onUpdate({ priority })}
          options={TICKET_PRIORITIES.map((p) => ({ value: p, label: PRIORITY_LABEL[p] }))}
        />
      )}
      {row(
        'Type',
        <Menu<TicketType>
          value={ticket.type}
          label="Type"
          onChange={(type) => onUpdate({ type })}
          options={TICKET_TYPES.map((t) => ({ value: t, label: TYPE_LABEL[t] }))}
        />
      )}
      {row(
        'Assignee',
        <Menu<string>
          value={ticket.assignee_id ?? '__none'}
          label="Assignee"
          onChange={(v) => onUpdate({ assignee_id: v === '__none' ? null : v })}
          options={[{ value: '__none', label: 'Unassigned' }, ...agents.map((a) => ({ value: a.id, label: a.name }))]}
        />
      )}
      {row(
        'Group',
        <Menu<string>
          value={ticket.group_id ?? '__none'}
          label="Group"
          onChange={(v) => onUpdate({ group_id: v === '__none' ? null : v })}
          options={[{ value: '__none', label: 'No group' }, ...groups.map((g) => ({ value: g.id, label: g.name }))]}
        />
      )}
      <div className="py-1.5">
        <span className="text-[12px] text-ink-3">Tags</span>
        <div className="flex flex-wrap gap-1 mt-1.5">
          {ticket.tags.map((t) => (
            <span key={t} className="inline-flex items-center gap-1 pl-2 pr-1 h-6 rounded-md bg-surface-3 text-[11.5px] text-ink-2">
              {t}
              {!disabled && (
                <button
                  type="button"
                  aria-label={`Remove tag ${t}`}
                  className="rounded hover:bg-line p-0.5"
                  onClick={() => onUpdate({ tags: ticket.tags.filter((x) => x !== t) })}
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </span>
          ))}
          {!disabled && (
            <form
              className="inline-flex"
              onSubmit={(e) => {
                e.preventDefault();
                const clean = normalizeTag(tag);
                if (clean && !ticket.tags.includes(clean)) onUpdate({ tags: [...ticket.tags, clean] });
                setTag('');
              }}
            >
              <input
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                placeholder="Add tag"
                aria-label="Add tag"
                className="h-6 w-24 px-2 rounded-md border border-dashed border-line-2 bg-transparent text-[11.5px] focus:outline-none focus:border-accent"
              />
              <button type="submit" className="sr-only">
                <Plus /> Add
              </button>
            </form>
          )}
        </div>
      </div>
      <dl className="mt-3 pt-3 border-t border-line grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[11.5px]">
        {(
          [
            ['Created', ticket.created_at],
            ['Updated', ticket.updated_at],
            ['Solved', ticket.solved_at],
            ['Closed', ticket.closed_at],
          ] as const
        )
          .filter(([, v]) => v)
          .map(([k, v]) => (
            <React.Fragment key={k}>
              <dt className="text-ink-3">{k}</dt>
              <dd className="text-ink-2 text-right" title={v || ''}>
                {fullTime(v)}
              </dd>
            </React.Fragment>
          ))}
      </dl>
    </section>
  );
}

function Requester({ detail, onOpenTicket }: { detail: Detail; onOpenTicket: (id: string) => void }) {
  const r = detail.requester;
  const location = r?.location || [r?.ip_location_city, r?.ip_location_country].filter(Boolean).join(', ');
  return (
    <>
      <section className="p-4 border-b border-line">
        <h3 className="text-[11px] font-bold uppercase tracking-wide text-ink-3 mb-2">Requester</h3>
        {r ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <Avatar name={r.name || r.email || '?'} seed={r.id} size="md" />
              <div className="min-w-0">
                <div className="font-semibold text-[13.5px] text-ink truncate">{r.name || 'Unnamed visitor'}</div>
                {r.email && (
                  <a href={`mailto:${r.email}`} className="text-[12px] text-accent truncate block">
                    {r.email}
                  </a>
                )}
              </div>
            </div>
            <ul className="text-[12px] text-ink-2 space-y-1">
              {location && (
                <li className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-ink-3" /> {location}
                </li>
              )}
              {(r.browser || r.os || r.device) && (
                <li className="flex items-center gap-1.5">
                  <Monitor className="w-3.5 h-3.5 text-ink-3" /> {[r.browser, r.os, r.device].filter(Boolean).join(' · ')}
                </li>
              )}
              {r.language && <li className="text-ink-3">Language: {r.language}</li>}
              {r.timezone && <li className="text-ink-3">Time zone: {r.timezone}</li>}
              {r.last_seen_at && <li className="text-ink-3">Last seen {timeAgo(r.last_seen_at)}</li>}
            </ul>
          </div>
        ) : (
          <p className="text-[12.5px] text-ink-3">No requester on this ticket.</p>
        )}
      </section>
      <section className="p-4">
        <h3 className="text-[11px] font-bold uppercase tracking-wide text-ink-3 mb-2">
          Previous tickets ({detail.previousTickets.length})
        </h3>
        {detail.previousTickets.length === 0 ? (
          <p className="text-[12.5px] text-ink-3">This is their first ticket.</p>
        ) : (
          <ul className="space-y-1">
            {detail.previousTickets.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => onOpenTicket(t.id)}
                  className="w-full text-left flex items-center gap-2 px-2 py-1.5 -mx-2 rounded-lg hover:bg-surface-2"
                >
                  <span className="text-[11.5px] text-ink-3 tabular-nums">#{t.number}</span>
                  <span className="text-[12.5px] text-ink truncate flex-1">{t.subject || '(no subject)'}</span>
                  <StatusBadge status={t.status} className="scale-90 origin-right" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
