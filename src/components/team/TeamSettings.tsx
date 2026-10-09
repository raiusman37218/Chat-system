'use client';

import React, { useMemo, useState } from 'react';
import { Gauge, Mail, Plus, UserCheck, UserMinus } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { ChipGroup, Field, Modal, inputClass, selectClass } from '@/components/tickets/TicketBits';
import { ErrorPanel, RoleBadge, StatusDot, TeamSkeleton, useTeam } from '@/components/team/TeamBits';
import {
  deactivateMemberAction,
  inviteMemberAction,
  reactivateMemberAction,
  setMemberCapacityAction,
  setMemberRoleAction,
  type ReassignMode,
  type TeamData,
  type TeamMember,
} from '@/app/actions/team';
import { ROLE_DESCRIPTIONS, ROLE_LABELS, assignableRoles, canManageMember, type Role } from '@/lib/team/permissions';
import { cn } from '@/lib/utils';

/** Settings → Team members & roles. Owners and admins only (the server checks too). */
export function TeamSettings({ workspaceId }: { workspaceId: string }) {
  const { team, error, loading, reload, replace } = useTeam(workspaceId);
  const [inviting, setInviting] = useState(false);
  const [capacityFor, setCapacityFor] = useState<TeamMember | null>(null);
  const [deactivating, setDeactivating] = useState<TeamMember | null>(null);
  const [notice, setNotice] = useState<{ text: string; tone: 'ok' | 'error' } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const active = useMemo(() => (team?.members || []).filter((m) => m.is_active), [team]);
  const inactive = useMemo(() => (team?.members || []).filter((m) => !m.is_active), [team]);

  async function run(memberId: string, work: () => Promise<TeamData>, okText: string) {
    setBusyId(memberId);
    setNotice(null);
    try {
      replace(await work());
      setNotice({ text: okText, tone: 'ok' });
    } catch (e) {
      setNotice({ text: (e as Error).message, tone: 'error' });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="space-y-5" aria-labelledby="team-heading">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id="team-heading" className="text-[16px] font-semibold text-ink">
            Team members &amp; roles
          </h2>
          <p className="text-[12.5px] text-ink-3 mt-0.5">Invite people, set what they can do, and manage who is on the team.</p>
        </div>
        {team && (
          <button type="button" className="btn btn-sm btn-primary" onClick={() => setInviting(true)}>
            <Plus className="w-3.5 h-3.5" /> Invite member
          </button>
        )}
      </header>

      {notice && (
        <div
          role={notice.tone === 'error' ? 'alert' : 'status'}
          className={cn(
            'px-3 py-2 rounded-lg border text-[12.5px]',
            notice.tone === 'error' ? 'bg-danger-soft border-danger-line text-danger' : 'bg-success-soft border-success-line text-ink'
          )}
        >
          {notice.text}
        </div>
      )}

      {loading && <TeamSkeleton />}
      {error && <ErrorPanel message={error} onRetry={reload} />}

      {team && (
        <>
          <RoleLegend />

          {active.length <= 1 && (
            <EmptyState
              type="custom"
              title="It's just you so far"
              description="Invite a colleague by email. They get a link to set a password and join this workspace."
              actionLabel="Invite member"
              onAction={() => setInviting(true)}
            />
          )}

          <ul className="space-y-2" aria-label="Team members">
            {active.map((m) => (
              <MemberRow
                key={m.id}
                member={m}
                team={team}
                busy={busyId === m.id}
                onRole={(role) => run(m.id, () => setMemberRoleAction(workspaceId, m.id, role), `${m.name} is now ${ROLE_LABELS[role].toLowerCase()}.`)}
                onCapacity={() => setCapacityFor(m)}
                onDeactivate={() => setDeactivating(m)}
              />
            ))}
          </ul>

          {inactive.length > 0 && (
            <div className="space-y-2">
              <h3 className="eyebrow">Deactivated</h3>
              <ul className="space-y-2" aria-label="Deactivated members">
                {inactive.map((m) => (
                  <MemberRow
                    key={m.id}
                    member={m}
                    team={team}
                    busy={busyId === m.id}
                    onReactivate={() => run(m.id, () => reactivateMemberAction(workspaceId, m.id), `${m.name} can sign in again.`)}
                  />
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {inviting && team && (
        <InviteDialog
          team={team}
          workspaceId={workspaceId}
          onClose={() => setInviting(false)}
          onDone={(next, email) => {
            replace(next);
            setInviting(false);
            setNotice({ text: `${email} has been added to the team.`, tone: 'ok' });
          }}
        />
      )}
      {capacityFor && (
        <CapacityDialog
          member={capacityFor}
          workspaceId={workspaceId}
          onClose={() => setCapacityFor(null)}
          onDone={(next) => {
            replace(next);
            setCapacityFor(null);
            setNotice({ text: 'Capacity updated.', tone: 'ok' });
          }}
        />
      )}
      {deactivating && team && (
        <DeactivateDialog
          member={deactivating}
          team={team}
          workspaceId={workspaceId}
          onClose={() => setDeactivating(null)}
          onDone={(next, moved) => {
            replace(next);
            setNotice({
              text: `${deactivating.name} was deactivated${moved ? ` and ${moved} open ticket${moved === 1 ? ' was' : 's were'} reassigned` : ''}.`,
              tone: 'ok',
            });
            setDeactivating(null);
          }}
        />
      )}
    </section>
  );
}

function RoleLegend() {
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {(['owner', 'admin', 'agent', 'light_agent'] as Role[]).map((r) => (
        <div key={r} className="p-3 rounded-xl border border-line bg-surface-2">
          <dt className="text-[12.5px] font-semibold text-ink">{ROLE_LABELS[r]}</dt>
          <dd className="text-[12px] text-ink-3 mt-0.5">{ROLE_DESCRIPTIONS[r]}</dd>
        </div>
      ))}
    </dl>
  );
}

function MemberRow({
  member: m,
  team,
  busy,
  onRole,
  onCapacity,
  onDeactivate,
  onReactivate,
}: {
  member: TeamMember;
  team: TeamData;
  busy: boolean;
  onRole?: (role: Role) => void;
  onCapacity?: () => void;
  onDeactivate?: () => void;
  onReactivate?: () => void;
}) {
  const me = { id: team.me.id, role: team.me.role };
  const manageable = canManageMember(me, { id: m.id, role: m.role });
  const roleOptions = assignableRoles(team.me.role);
  const groups = team.groups.filter((g) => m.group_ids.includes(g.id));
  const atCapacity = m.max_open_tickets !== null && m.open_tickets >= m.max_open_tickets;

  return (
    <li className={cn('p-3 rounded-xl border border-line bg-surface flex flex-wrap items-center gap-x-4 gap-y-3', !m.is_active && 'opacity-70')}>
      <div className="flex items-center gap-3 min-w-0 flex-1 basis-56">
        <Avatar name={m.name} seed={m.id} size="md" online={m.is_active && m.status === 'online'} />
        <div className="min-w-0">
          <div className="text-[13px] font-semibold text-ink truncate">
            {m.name}
            {m.id === team.me.id && <span className="text-ink-3 font-normal"> (you)</span>}
          </div>
          <div className="text-[12px] text-ink-3 truncate">{m.email}</div>
        </div>
      </div>

      <div className="flex items-center gap-2 min-w-0 basis-40">
        {manageable && m.is_active && onRole && roleOptions.length > 0 ? (
          <select
            aria-label={`Role for ${m.name}`}
            className={cn(selectClass, 'h-8 text-[12.5px] w-auto')}
            value={m.role}
            disabled={busy}
            onChange={(e) => onRole(e.target.value as Role)}
          >
            {Array.from(new Set([m.role, ...roleOptions])).map((r) => (
              <option key={r} value={r} disabled={!roleOptions.includes(r)}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        ) : (
          <RoleBadge role={m.role} />
        )}
        {!m.is_active && <span className="pill pill-warn">Deactivated</span>}
      </div>

      {m.is_active && (
        <div className="basis-44 space-y-1">
          <StatusDot status={m.status} />
          <div className={cn('text-[12px]', atCapacity ? 'text-warn font-medium' : 'text-ink-3')}>
            {m.role === 'light_agent'
              ? 'Not assignable'
              : `${m.open_tickets} open${m.max_open_tickets !== null ? ` of ${m.max_open_tickets}` : ' · no limit'}`}
          </div>
        </div>
      )}

      {groups.length > 0 && m.is_active && (
        <div className="flex flex-wrap gap-1 basis-40">
          {groups.map((g) => (
            <span key={g.id} className="pill pill-neutral">
              {g.name}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-1.5 ml-auto">
        {m.is_active && manageable && m.role !== 'light_agent' && onCapacity && (
          <button type="button" className="btn btn-sm btn-ghost" onClick={onCapacity} aria-label={`Set capacity for ${m.name}`}>
            <Gauge className="w-3.5 h-3.5" /> Capacity
          </button>
        )}
        {m.is_active && manageable && onDeactivate && (
          <button type="button" className="btn btn-sm btn-ghost" onClick={onDeactivate} aria-label={`Deactivate ${m.name}`}>
            <UserMinus className="w-3.5 h-3.5" /> Deactivate
          </button>
        )}
        {!m.is_active && manageable && onReactivate && (
          <button type="button" className="btn btn-sm btn-secondary" disabled={busy} onClick={onReactivate} aria-label={`Reactivate ${m.name}`}>
            <UserCheck className="w-3.5 h-3.5" /> Reactivate
          </button>
        )}
      </div>
    </li>
  );
}

function InviteDialog({
  team,
  workspaceId,
  onClose,
  onDone,
}: {
  team: TeamData;
  workspaceId: string;
  onClose: () => void;
  onDone: (team: TeamData, email: string) => void;
}) {
  const roles = assignableRoles(team.me.role);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>(roles.includes('agent') ? 'agent' : roles[0]);
  const [groupIds, setGroupIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      onDone(await inviteMemberAction(workspaceId, { name, email, role, groupIds }), email.trim());
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <Modal
      title="Invite a team member"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-sm btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="invite-form" className="btn btn-sm btn-primary" disabled={busy || !email.trim()}>
            <Mail className="w-3.5 h-3.5" /> {busy ? 'Inviting…' : 'Send invite'}
          </button>
        </>
      }
    >
      <form id="invite-form" onSubmit={submit} className="space-y-4">
        <Field label="Name">
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" autoFocus />
        </Field>
        <Field label="Email">
          <input className={inputClass} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" />
        </Field>
        <Field label="Role" hint={ROLE_DESCRIPTIONS[role]}>
          <select className={selectClass} value={role} onChange={(e) => setRole(e.target.value as Role)}>
            {roles.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </Field>
        {team.groups.length > 0 && role !== 'light_agent' && (
          <ChipGroup label="Groups" options={team.groups.map((g) => ({ value: g.id, label: g.name }))} value={groupIds} onChange={setGroupIds} />
        )}
        {error && (
          <p role="alert" className="text-[12.5px] text-danger">
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}

function CapacityDialog({
  member,
  workspaceId,
  onClose,
  onDone,
}: {
  member: TeamMember;
  workspaceId: string;
  onClose: () => void;
  onDone: (team: TeamData) => void;
}) {
  const [value, setValue] = useState(member.max_open_tickets === null ? '' : String(member.max_open_tickets));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      onDone(await setMemberCapacityAction(workspaceId, member.id, value.trim() === '' ? null : Number(value)));
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <Modal
      title={`Capacity for ${member.name}`}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-sm btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="capacity-form" className="btn btn-sm btn-primary" disabled={busy}>
            {busy ? 'Saving…' : 'Save'}
          </button>
        </>
      }
    >
      <form id="capacity-form" onSubmit={save} className="space-y-3">
        <Field
          label="Maximum open tickets"
          hint="Round-robin and auto-assignment skip this person once they have this many New or Open tickets. Leave empty for no limit. You can still assign tickets to them by hand."
        >
          <input className={inputClass} type="number" min={1} max={1000} inputMode="numeric" value={value} onChange={(e) => setValue(e.target.value)} placeholder="No limit" autoFocus />
        </Field>
        <p className="text-[12px] text-ink-3">Currently {member.open_tickets} open.</p>
        {error && (
          <p role="alert" className="text-[12.5px] text-danger">
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}

function DeactivateDialog({
  member,
  team,
  workspaceId,
  onClose,
  onDone,
}: {
  member: TeamMember;
  team: TeamData;
  workspaceId: string;
  onClose: () => void;
  onDone: (team: TeamData, moved: number) => void;
}) {
  const candidates = team.members.filter((m) => m.is_active && m.id !== member.id && m.role !== 'light_agent');
  const [mode, setMode] = useState<ReassignMode>(candidates.length ? 'agent' : 'unassign');
  const [to, setTo] = useState(candidates[0]?.id || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      const res = await deactivateMemberAction(workspaceId, member.id, { mode, to: mode === 'agent' ? to : null });
      onDone(res.team, res.moved);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  const options: { value: ReassignMode; label: string; hint: string; disabled?: boolean }[] = [
    { value: 'agent', label: 'Give them to one agent', hint: 'Every open ticket moves to the person you choose.', disabled: candidates.length === 0 },
    { value: 'round_robin', label: 'Send back to their groups', hint: 'Tickets in a group with round-robin go to the next available member; the rest wait unassigned.' },
    { value: 'unassign', label: 'Leave them unassigned', hint: 'Tickets keep their group and wait in the queue.' },
  ];

  return (
    <Modal
      title={`Deactivate ${member.name}?`}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-sm btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-sm btn-danger" disabled={busy || (mode === 'agent' && !to)} onClick={confirm}>
            {busy ? 'Deactivating…' : 'Deactivate'}
          </button>
        </>
      }
    >
      <p className="text-[13px] text-ink-2">
        They will be signed out of this workspace immediately. Their history stays. You can reactivate them later.
      </p>
      <fieldset className="space-y-2">
        <legend className="text-[11.5px] font-semibold text-ink-2 mb-1.5">
          {member.open_tickets > 0 ? `${member.open_tickets} open ticket${member.open_tickets === 1 ? '' : 's'} to reassign` : 'Open tickets'}
        </legend>
        {options.map((o) => (
          <label
            key={o.value}
            className={cn(
              'flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer',
              mode === o.value ? 'border-accent-line bg-accent-soft' : 'border-line bg-surface',
              o.disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <input type="radio" name="reassign" className="mt-0.5 accent-[var(--ds-accent)]" checked={mode === o.value} disabled={o.disabled} onChange={() => setMode(o.value)} />
            <span className="min-w-0">
              <span className="block text-[13px] font-medium text-ink">{o.label}</span>
              <span className="block text-[12px] text-ink-3">{o.hint}</span>
            </span>
          </label>
        ))}
      </fieldset>
      {mode === 'agent' && (
        <Field label="Give them to">
          <select className={selectClass} value={to} onChange={(e) => setTo(e.target.value)}>
            {candidates.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.open_tickets} open)
              </option>
            ))}
          </select>
        </Field>
      )}
      {error && (
        <p role="alert" className="text-[12.5px] text-danger">
          {error}
        </p>
      )}
    </Modal>
  );
}
