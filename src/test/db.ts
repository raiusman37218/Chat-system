/**
 * Helpers for tests that run against a real Postgres (`npm run test:db`).
 *
 * scripts/test-db.sh boots a throwaway database with the real migrations and
 * sets TEST_DATABASE_URL. Without it these tests are skipped, so `npm test`
 * stays fast and needs nothing installed.
 *
 * Each test runs inside a transaction that is rolled back, and switches role
 * the way PostgREST does: `anon` for the widget, `authenticated` plus JWT
 * claims for a signed-in agent, `service_role` for server code.
 */
import { Client } from 'pg';
import { afterAll, beforeAll, beforeEach, afterEach } from 'vitest';

export const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;
export const hasDatabase = Boolean(TEST_DATABASE_URL);

export type Actor =
  | { kind: 'superuser' }
  | { kind: 'anon' }
  | { kind: 'service' }
  | { kind: 'user'; id: string };

export class Db {
  constructor(readonly client: Client) {}

  /** Runs `sql` as `actor`, then returns to the superuser for fixtures. */
  async as<T extends Record<string, unknown> = Record<string, unknown>>(
    actor: Actor,
    sql: string,
    params: unknown[] = []
  ): Promise<T[]> {
    await this.become(actor);
    try {
      const res = await this.client.query(sql, params);
      return res.rows as T[];
    } finally {
      await this.become({ kind: 'superuser' });
    }
  }

  /** Runs as superuser (bypasses RLS): for fixtures and assertions. */
  async q<T extends Record<string, unknown> = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
    return this.as<T>({ kind: 'superuser' }, sql, params);
  }

  async one<T extends Record<string, unknown> = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T> {
    const rows = await this.q<T>(sql, params);
    if (rows.length !== 1) throw new Error(`expected one row, got ${rows.length}: ${sql}`);
    return rows[0];
  }

  /** Expects `sql` as `actor` to fail; returns the Postgres error message. */
  async rejects(actor: Actor, sql: string, params: unknown[] = []): Promise<string> {
    await this.client.query('SAVEPOINT expect_error');
    await this.become(actor);
    try {
      await this.client.query(sql, params);
    } catch (err) {
      // The failed statement aborted the savepoint; roll back to it first.
      await this.client.query('ROLLBACK TO SAVEPOINT expect_error');
      await this.become({ kind: 'superuser' });
      return (err as Error).message;
    }
    await this.become({ kind: 'superuser' });
    await this.client.query('RELEASE SAVEPOINT expect_error');
    throw new Error(`expected to fail but succeeded: ${sql}`);
  }

  private async become(actor: Actor) {
    const claims =
      actor.kind === 'user'
        ? { sub: actor.id, role: 'authenticated' }
        : actor.kind === 'anon'
        ? { role: 'anon' }
        : actor.kind === 'service'
        ? { role: 'service_role' }
        : null;
    const role =
      actor.kind === 'user' ? 'authenticated' : actor.kind === 'anon' ? 'anon' : actor.kind === 'service' ? 'service_role' : null;
    await this.client.query(`SELECT set_config('request.jwt.claims', $1, true)`, [claims ? JSON.stringify(claims) : '']);
    await this.client.query(role ? `SET LOCAL ROLE ${role}` : 'RESET ROLE');
  }
}

/**
 * Opens one connection for the file and wraps every test in a transaction
 * that is rolled back, so tests cannot see each other's rows.
 */
export function useTestDatabase(): { db: () => Db } {
  let client: Client | null = null;
  let db: Db | null = null;

  beforeAll(async () => {
    if (!hasDatabase) return;
    client = new Client({ connectionString: TEST_DATABASE_URL });
    await client.connect();
    db = new Db(client);
  });
  afterAll(async () => {
    await client?.end();
  });
  beforeEach(async () => {
    await client?.query('BEGIN');
  });
  afterEach(async () => {
    await client?.query('ROLLBACK');
  });

  return {
    db: () => {
      if (!db) throw new Error('No test database; run `npm run test:db`.');
      return db;
    },
  };
}

/* ── Fixtures ─────────────────────────────────────────────────────────── */

export interface WorkspaceFixture {
  id: string;
  ownerId: string;
  adminId: string;
  agentId: string;
  visitorId: string;
}

let counter = 0;
const uid = () => crypto.randomUUID();

/** A workspace with an owner, an admin, an agent and one visitor. */
export async function createWorkspace(db: Db, name = `Workspace ${++counter}`): Promise<WorkspaceFixture> {
  const ownerId = uid();
  const adminId = uid();
  const agentId = uid();
  for (const id of [ownerId, adminId, agentId]) {
    await db.q('INSERT INTO auth.users (id, email) VALUES ($1, $2)', [id, `${id}@example.test`]);
  }
  const { id } = await db.one<{ id: string }>(
    `INSERT INTO workspaces (name, owner_id, slug, auto_assignment)
     VALUES ($1, $2, $3, '{"enabled": false}') RETURNING id`,
    [name, ownerId, `ws-${counter}-${ownerId.slice(0, 6)}`]
  );
  const agents: [string, string][] = [
    [ownerId, 'owner'],
    [adminId, 'admin'],
    [agentId, 'agent'],
  ];
  for (const [agent, role] of agents) {
    await db.q(
      // Offline, so auto-assignment leaves new chats alone unless a test opts in.
      `INSERT INTO agents (id, name, email, role, status, workspace_id) VALUES ($1, $2, $3, $4, 'offline', $5)`,
      [agent, `${role} of ${name}`, `${agent}@example.test`, role, id]
    );
  }
  const visitorId = await createVisitor(db, id, `Visitor of ${name}`);
  return { id, ownerId, adminId, agentId, visitorId };
}

export async function createVisitor(db: Db, workspaceId: string, name: string, email?: string): Promise<string> {
  const { id } = await db.one<{ id: string }>(
    `INSERT INTO visitors (name, email, workspace_id) VALUES ($1, $2, $3) RETURNING id`,
    [name, email ?? `${name.replace(/\W+/g, '.').toLowerCase()}@example.test`, workspaceId]
  );
  return id;
}

/** What the widget does: an anonymous conversation, then the visitor's message. */
export async function startChat(db: Db, ws: WorkspaceFixture, firstMessage: string, visitorId = ws.visitorId) {
  const [conv] = await db.as<{ id: string }>(
    { kind: 'anon' },
    `INSERT INTO conversations (visitor_id, workspace_id, status, channel) VALUES ($1, $2, 'open', 'web') RETURNING id`,
    [visitorId, ws.id]
  );
  await visitorSays(db, conv.id, firstMessage);
  const ticket = await ticketOf(db, conv.id);
  return { conversationId: conv.id, ticket };
}

export async function visitorSays(db: Db, conversationId: string, content: string) {
  await db.as({ kind: 'anon' }, `INSERT INTO messages (conversation_id, sender_type, content) VALUES ($1, 'visitor', $2)`, [
    conversationId,
    content,
  ]);
}

export async function agentSays(db: Db, conversationId: string, agentId: string, content: string, internal = false) {
  await db.as(
    { kind: 'user', id: agentId },
    `INSERT INTO messages (conversation_id, sender_type, sender_id, content, is_internal) VALUES ($1, 'agent', $2, $3, $4)`,
    [conversationId, agentId, content, internal]
  );
}

export interface TicketRow extends Record<string, unknown> {
  id: string;
  number: number;
  status: string;
  priority: string;
  subject: string;
  assignee_id: string | null;
  requester_id: string | null;
  conversation_id: string | null;
  follow_up_of_id: string | null;
  merged_into_id: string | null;
  channel: string;
  tags: string[];
  solved_at: Date | null;
  closed_at: Date | null;
}

/** The conversation's current ticket. */
export async function ticketOf(db: Db, conversationId: string): Promise<TicketRow> {
  return db.one<TicketRow>(
    `SELECT t.* FROM tickets t JOIN conversations c ON c.current_ticket_id = t.id WHERE c.id = $1`,
    [conversationId]
  );
}

export async function ticket(db: Db, id: string): Promise<TicketRow> {
  return db.one<TicketRow>('SELECT * FROM tickets WHERE id = $1', [id]);
}

export type MemberRole = 'owner' | 'admin' | 'agent' | 'light_agent';

/** Adds another member to a workspace: offline, active, no capacity limit unless given. */
export async function addMember(
  db: Db,
  workspaceId: string,
  role: MemberRole,
  opts: { name?: string; status?: 'online' | 'away' | 'offline'; maxOpen?: number | null; active?: boolean } = {}
): Promise<string> {
  const id = uid();
  await db.q('INSERT INTO auth.users (id, email) VALUES ($1, $2)', [id, `${id}@example.test`]);
  await db.q(
    `INSERT INTO agents (id, name, email, role, status, workspace_id, max_open_tickets, is_active, deactivated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CASE WHEN $8 THEN NULL ELSE now() END)`,
    [id, opts.name ?? `${role} ${id.slice(0, 4)}`, `${id}@example.test`, role, opts.status ?? 'offline', workspaceId, opts.maxOpen ?? null, opts.active ?? true]
  );
  return id;
}
