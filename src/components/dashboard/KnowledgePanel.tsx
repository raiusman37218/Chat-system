'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Search,
  Trash2,
  Edit2,
  X,
  Lock,
  Bot,
  MessageSquareWarning,
  Check,
  EyeOff,
  FileText,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  listKnowledgeNotesAction,
  saveKnowledgeNoteAction,
  deleteKnowledgeNoteAction,
  listUnansweredQuestionsAction,
  updateUnansweredStatusAction,
  type KnowledgeNote,
  type UnansweredQuestion,
} from '@/app/actions/knowledge';

/**
 * Two things the help centre could not hold.
 *
 * **Team knowledge** is everything a team needs on hand that should never be
 * published — refund thresholds, escalation paths, the workaround for last
 * month's bug. Before this it either went into a public article or nowhere.
 *
 * **Gaps** are the questions customers asked that nothing answered. They used
 * to be handed to a person and then forgotten, so the same hole was
 * rediscovered every week instead of being written up once.
 */

type Tab = 'notes' | 'gaps';

export function KnowledgePanel({
  workspaceId,
  onCreateArticle,
  newNoteSignal,
}: {
  workspaceId: string;
  /** Turns a gap straight into a draft article. */
  onCreateArticle?: (title: string) => void;
  /**
   * Changes when the page header's primary button is pressed. A counter rather
   * than a boolean so pressing it twice in a row still opens the editor.
   */
  newNoteSignal?: number;
}) {
  const [tab, setTab] = useState<Tab>('notes');
  const [notes, setNotes] = useState<KnowledgeNote[]>([]);
  const [gaps, setGaps] = useState<UnansweredQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<Partial<KnowledgeNote> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true);
    setError(null);
    try {
      const [n, g] = await Promise.all([
        listKnowledgeNotesAction(workspaceId),
        listUnansweredQuestionsAction(workspaceId, 'open'),
      ]);
      setNotes(n);
      setGaps(g);
    } catch (err: any) {
      setError(err?.message || 'Could not load this workspace’s knowledge.');
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!newNoteSignal) return;
    setTab('notes');
    setEditing({ title: '', content: '', tags: [], visibility: 'agent_only' });
  }, [newNoteSignal]);

  const filteredNotes = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        n.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [notes, query]);

  const handleSave = async (note: Partial<KnowledgeNote>) => {
    try {
      const saved = await saveKnowledgeNoteAction(workspaceId, {
        id: note.id,
        title: note.title || '',
        content: note.content || '',
        tags: note.tags || [],
        visibility: note.visibility || 'agent_only',
      });
      setNotes((prev) => {
        const without = prev.filter((n) => n.id !== saved.id);
        return [saved, ...without];
      });
      setEditing(null);
    } catch (err: any) {
      setError(err?.message || 'Could not save that note.');
    }
  };

  const handleDelete = async (note: KnowledgeNote) => {
    if (!confirm(`Delete “${note.title}”? This cannot be undone.`)) return;
    setBusyId(note.id);
    try {
      await deleteKnowledgeNoteAction(workspaceId, note.id);
      setNotes((prev) => prev.filter((n) => n.id !== note.id));
    } catch (err: any) {
      setError(err?.message || 'Could not delete that note.');
    } finally {
      setBusyId(null);
    }
  };

  const resolveGap = async (
    gap: UnansweredQuestion,
    status: 'answered' | 'ignored'
  ) => {
    setBusyId(gap.id);
    try {
      await updateUnansweredStatusAction(workspaceId, gap.id, status);
      setGaps((prev) => prev.filter((g) => g.id !== gap.id));
    } catch (err: any) {
      setError(err?.message || 'Could not update that question.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center p-0.5 rounded-lg bg-surface-2 border border-line">
          {(
            [
              ['notes', 'Team knowledge', notes.length],
              ['gaps', 'Gaps', gaps.length],
            ] as const
          ).map(([id, label, count]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                'h-7 px-3 rounded-md text-[12.5px] font-medium transition-all inline-flex items-center gap-1.5',
                tab === id
                  ? 'bg-surface text-ink font-semibold shadow-xs'
                  : 'text-ink-3 hover:text-ink'
              )}
            >
              {id === 'notes' ? (
                <Lock className="w-3.5 h-3.5" />
              ) : (
                <MessageSquareWarning className="w-3.5 h-3.5" />
              )}
              {label}
              {count > 0 && <span className="text-[11px] opacity-70">({count})</span>}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {tab === 'notes' && (
            <>
              <div className="relative w-56">
                <Search className="w-3.5 h-3.5 text-ink-3 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search notes"
                  className="w-full h-8 pl-8 pr-2.5 rounded-lg border border-line bg-surface-2/70 text-[12.5px] text-ink placeholder:text-ink-3 focus:outline-none focus:border-accent"
                />
              </div>
              <button
                type="button"
                onClick={() =>
                  setEditing({ title: '', content: '', tags: [], visibility: 'agent_only' })
                }
                className="h-8 px-3 rounded-lg bg-accent text-accent-ink text-[12.5px] font-semibold inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                New note
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-danger-line bg-danger-soft px-4 py-2.5 text-[12.5px] text-danger flex items-center justify-between gap-3">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} className="shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-ink-3 text-[13px] flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading…
        </div>
      ) : tab === 'notes' ? (
        <NotesList
          notes={filteredNotes}
          busyId={busyId}
          onEdit={setEditing}
          onDelete={handleDelete}
          onNew={() =>
            setEditing({ title: '', content: '', tags: [], visibility: 'agent_only' })
          }
          searching={Boolean(query.trim())}
        />
      ) : (
        <GapsList
          gaps={gaps}
          busyId={busyId}
          onResolve={resolveGap}
          onCreateArticle={onCreateArticle}
          onCreateNote={(q) =>
            setEditing({
              title: q.question.slice(0, 120),
              content: '',
              tags: ['from-a-real-question'],
              visibility: 'assistant',
            })
          }
        />
      )}

      {editing && (
        <NoteEditor
          note={editing}
          onCancel={() => setEditing(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

/* ── Notes ────────────────────────────────────────────────────────────── */

function NotesList({
  notes,
  busyId,
  onEdit,
  onDelete,
  onNew,
  searching,
}: {
  notes: KnowledgeNote[];
  busyId: string | null;
  onEdit: (n: KnowledgeNote) => void;
  onDelete: (n: KnowledgeNote) => void;
  onNew: () => void;
  searching: boolean;
}) {
  if (notes.length === 0) {
    return (
      <div className="p-12 rounded-2xl border border-dashed border-line text-center space-y-3 bg-surface-2/40">
        <Lock className="w-9 h-9 text-ink-3 mx-auto stroke-[1.5]" />
        <div className="text-[15px] font-semibold text-ink">
          {searching ? 'No notes match that' : 'Nothing here yet'}
        </div>
        <p className="text-[12.5px] text-ink-3 max-w-md mx-auto">
          {searching
            ? 'Try a different word.'
            : 'Keep the things your team needs but customers should not read — internal policies, escalation paths, known issues and their workarounds.'}
        </p>
        {!searching && (
          <button
            type="button"
            onClick={onNew}
            className="h-8 px-3.5 rounded-lg bg-accent text-accent-ink text-[12.5px] font-semibold inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Write the first note
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="border border-line rounded-xl overflow-hidden bg-surface divide-y divide-line/80">
      {notes.map((note) => (
        <div
          key={note.id}
          className="p-4 hover:bg-surface-2/50 transition-colors flex items-start justify-between gap-4 group"
        >
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <VisibilityBadge visibility={note.visibility} />
              {note.tags.map((t) => (
                <span
                  key={t}
                  className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-surface-2 text-ink-3 border border-line/60"
                >
                  {t}
                </span>
              ))}
            </div>
            <button
              type="button"
              onClick={() => onEdit(note)}
              className="block text-left text-[14.5px] font-semibold text-ink hover:text-accent transition-colors"
            >
              {note.title}
            </button>
            {note.content && (
              <p className="text-[12.5px] text-ink-2 line-clamp-2 max-w-3xl">
                {note.content}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => onEdit(note)}
              title="Edit note"
              className="h-8 w-8 rounded-md hover:bg-surface-2 grid place-items-center text-ink-2 hover:text-ink transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(note)}
              disabled={busyId === note.id}
              title="Delete note"
              className="h-8 w-8 rounded-md hover:bg-rose-500/10 grid place-items-center text-ink-3 hover:text-rose-500 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function VisibilityBadge({ visibility }: { visibility: KnowledgeNote['visibility'] }) {
  const isAssistant = visibility === 'assistant';
  return (
    <span
      title={
        isAssistant
          ? 'The assistant may answer customers using this note.'
          : 'Only your team can see this. The assistant will never quote it.'
      }
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border',
        isAssistant
          ? 'bg-accent-soft text-accent border-accent-line'
          : 'bg-surface-2 text-ink-3 border-line/60'
      )}
    >
      {isAssistant ? <Bot className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
      {isAssistant ? 'Assistant can use' : 'Team only'}
    </span>
  );
}

function NoteEditor({
  note,
  onCancel,
  onSave,
}: {
  note: Partial<KnowledgeNote>;
  onCancel: () => void;
  onSave: (n: Partial<KnowledgeNote>) => void;
}) {
  const [title, setTitle] = useState(note.title || '');
  const [content, setContent] = useState(note.content || '');
  const [tags, setTags] = useState((note.tags || []).join(', '));
  const [visibility, setVisibility] = useState<KnowledgeNote['visibility']>(
    note.visibility || 'agent_only'
  );
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    await onSave({
      id: note.id,
      title,
      content,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      visibility,
    });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-line bg-surface shadow-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-line flex items-center justify-between">
          <h3 className="text-[15px] font-semibold text-ink">
            {note.id ? 'Edit note' : 'New team note'}
          </h3>
          <button
            type="button"
            onClick={onCancel}
            className="w-7 h-7 grid place-items-center rounded-md text-ink-3 hover:text-ink hover:bg-surface-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-ink-2">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              placeholder="Refund policy for annual plans"
              className="w-full h-9 px-3 rounded-lg border border-line bg-surface-2/60 text-[13.5px] text-ink focus:outline-none focus:border-accent"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-ink-2">Details</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={9}
              placeholder="Anything the team needs on hand. Plain text or markdown."
              className="w-full px-3 py-2.5 rounded-lg border border-line bg-surface-2/60 text-[13.5px] leading-relaxed text-ink focus:outline-none focus:border-accent resize-y"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-ink-2">
              Tags <span className="text-ink-3 font-normal">(comma separated)</span>
            </label>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="billing, escalation"
              className="w-full h-9 px-3 rounded-lg border border-line bg-surface-2/60 text-[13px] text-ink focus:outline-none focus:border-accent"
            />
          </div>

          <fieldset className="space-y-2">
            <legend className="text-[12px] font-medium text-ink-2 mb-1.5">
              Who can use this
            </legend>
            {(
              [
                [
                  'agent_only',
                  'Team only',
                  'Visible in the dashboard. The assistant will never quote it to a customer.',
                ],
                [
                  'assistant',
                  'Assistant can use it',
                  'The assistant may answer customers from this. Only put things here you would be happy for a customer to read.',
                ],
              ] as const
            ).map(([value, label, hint]) => (
              <label
                key={value}
                className={cn(
                  'flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-colors',
                  visibility === value
                    ? 'border-accent bg-accent-soft/40'
                    : 'border-line hover:bg-surface-2/60'
                )}
              >
                <input
                  type="radio"
                  name="visibility"
                  checked={visibility === value}
                  onChange={() => setVisibility(value)}
                  className="mt-0.5"
                />
                <span className="min-w-0">
                  <span className="block text-[13px] font-medium text-ink">{label}</span>
                  <span className="block text-[12px] text-ink-3 mt-0.5">{hint}</span>
                </span>
              </label>
            ))}
          </fieldset>
        </div>

        <div className="px-5 py-3.5 border-t border-line flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-9 px-3.5 rounded-lg border border-line text-[13px] font-medium text-ink hover:bg-surface-2"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={saving || !title.trim()}
            className="h-9 px-4 rounded-lg bg-accent text-accent-ink text-[13px] font-semibold disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save note'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Gaps ─────────────────────────────────────────────────────────────── */

function GapsList({
  gaps,
  busyId,
  onResolve,
  onCreateArticle,
  onCreateNote,
}: {
  gaps: UnansweredQuestion[];
  busyId: string | null;
  onResolve: (g: UnansweredQuestion, status: 'answered' | 'ignored') => void;
  onCreateArticle?: (title: string) => void;
  onCreateNote: (g: UnansweredQuestion) => void;
}) {
  if (gaps.length === 0) {
    return (
      <div className="p-12 rounded-2xl border border-dashed border-line text-center space-y-2 bg-surface-2/40">
        <Check className="w-9 h-9 text-emerald-500 mx-auto stroke-[1.5]" />
        <div className="text-[15px] font-semibold text-ink">No open gaps</div>
        <p className="text-[12.5px] text-ink-3 max-w-md mx-auto">
          Every question customers have asked was covered by an article or a note.
          Anything the assistant cannot answer will show up here.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-line rounded-xl overflow-hidden bg-surface divide-y divide-line/80">
      {gaps.map((gap) => (
        <div key={gap.id} className="p-4 flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              {gap.times_asked > 1 && (
                <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  asked {gap.times_asked}×
                </span>
              )}
              <span className="text-[11px] text-ink-3">
                last {new Date(gap.last_asked_at).toLocaleDateString()}
              </span>
            </div>
            <p className="text-[14px] font-medium text-ink">“{gap.question}”</p>
            {gap.reason && (
              <p className="text-[11.5px] text-ink-3">Why it went unanswered: {gap.reason}</p>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {onCreateArticle && (
              <button
                type="button"
                onClick={() => onCreateArticle(gap.question)}
                title="Write a public article answering this"
                className="h-8 px-2.5 rounded-lg border border-line text-[12px] font-medium text-ink hover:bg-surface-2 inline-flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                Article
              </button>
            )}
            <button
              type="button"
              onClick={() => onCreateNote(gap)}
              title="Answer it in a team note instead"
              className="h-8 px-2.5 rounded-lg border border-line text-[12px] font-medium text-ink hover:bg-surface-2 inline-flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5" />
              Note
            </button>
            <button
              type="button"
              onClick={() => onResolve(gap, 'answered')}
              disabled={busyId === gap.id}
              title="Mark as covered"
              className="h-8 w-8 rounded-md hover:bg-emerald-500/10 grid place-items-center text-ink-3 hover:text-emerald-500 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onResolve(gap, 'ignored')}
              disabled={busyId === gap.id}
              title="Out of scope — stop showing this"
              className="h-8 w-8 rounded-md hover:bg-surface-2 grid place-items-center text-ink-3 hover:text-ink disabled:opacity-50"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
