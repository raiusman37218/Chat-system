import { beforeEach, describe, expect, it, vi } from 'vitest';

const fakeState = vi.hoisted(() => {
  const OWNER_ID = '11111111-1111-4111-8111-111111111111';
  const ADMIN_ID = '22222222-2222-4222-8222-222222222222';
  const AGENT_ID = '33333333-3333-4333-8333-333333333333';
  return {
    OWNER_ID,
    ADMIN_ID,
    AGENT_ID,
    user: { id: OWNER_ID, email: 'musmanrai372@gmail.com' } as any,
    agent: {
      id: OWNER_ID,
      name: 'ZenTry Owner',
      email: 'musmanrai372@gmail.com',
      role: 'owner',
      workspace_id: null,
      is_active: true,
      is_super_admin: true,
      is_platform_owner: true,
    } as any,
    agents: [
      {
        id: OWNER_ID,
        name: 'ZenTry Owner',
        email: 'musmanrai372@gmail.com',
        role: 'owner',
        workspace_id: null,
        is_active: true,
        is_super_admin: true,
        is_platform_owner: true,
        created_at: new Date().toISOString(),
      },
      {
        id: ADMIN_ID,
        name: 'Regular Super Admin',
        email: 'admin2@platform.test',
        role: 'admin',
        workspace_id: null,
        is_active: true,
        is_super_admin: true,
        is_platform_owner: false,
        created_at: new Date().toISOString(),
      },
      {
        id: AGENT_ID,
        name: 'Normal Agent',
        email: 'agent@workspace.test',
        role: 'agent',
        workspace_id: 'ws-1',
        is_active: true,
        is_super_admin: false,
        is_platform_owner: false,
        created_at: new Date().toISOString(),
      },
    ] as any[],
    invitations: [] as any[],
    auditLogs: [] as any[],
  };
});

vi.mock('server-only', () => ({}));
vi.mock('@/lib/vercel-domains', () => ({
  addDomain: vi.fn(),
  removeDomain: vi.fn(),
}));

function createMockSupabaseClient() {
  return {
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: fakeState.user },
        error: fakeState.user ? null : { message: 'Not authenticated' },
      })),
      admin: {
        listUsers: vi.fn(async () => ({
          data: {
            users: fakeState.agents.map((a: any) => ({
              id: a.id,
              email: a.email,
              user_metadata: { name: a.name },
            })),
          },
          error: null,
        })),
        createUser: vi.fn(async ({ email, user_metadata }: any) => {
          const id = `user-${fakeState.agents.length + 1}`;
          return { data: { user: { id, email, user_metadata } }, error: null };
        }),
        updateUserById: vi.fn(async () => ({ error: null })),
        deleteUser: vi.fn(async () => ({ error: null })),
      },
    },
    rpc: vi.fn(async () => ({ data: null, error: { message: 'RPC not in unit test DB' } })),
    from: vi.fn((table: string) => {
      let isSingle = false;
      let isMaybeSingle = false;
      const filters: Array<{ op: string; args: any[] }> = [];
      let updatePayload: any = null;
      let insertPayload: any = null;
      let isDelete = false;

      const builder: any = {
        select: vi.fn(() => builder),
        delete: vi.fn(() => {
          isDelete = true;
          return builder;
        }),
        eq: vi.fn((col: string, val: any) => {
          filters.push({ op: 'eq', args: [col, val] });
          return builder;
        }),
        order: vi.fn(() => builder),
        single: vi.fn(() => {
          isSingle = true;
          return builder;
        }),
        maybeSingle: vi.fn(() => {
          isMaybeSingle = true;
          return builder;
        }),
        update: vi.fn((payload: any) => {
          updatePayload = payload;
          return builder;
        }),
        insert: vi.fn((payload: any) => {
          insertPayload = payload;
          if (table === 'super_admin_audit_logs') {
            fakeState.auditLogs.push(payload);
          }
          if (table === 'platform_super_admin_invitations') {
            const row = { id: `inv-${fakeState.invitations.length + 1}`, ...payload };
            fakeState.invitations.push(row);
          }
          return builder;
        }),
        upsert: vi.fn((payload: any) => {
          const existing = fakeState.agents.find((a: any) => a.id === payload.id || a.email === payload.email);
          if (existing) {
            Object.assign(existing, payload);
          } else {
            fakeState.agents.push(payload);
          }
          return builder;
        }),
        then: (resolve: (v: any) => any, reject?: (e: any) => any) => {
          try {
            if (insertPayload) {
              if (table === 'platform_super_admin_invitations') {
                return resolve({ data: fakeState.invitations[fakeState.invitations.length - 1], error: null });
              }
              return resolve({ data: insertPayload, error: null });
            }

            if (updatePayload) {
              const eqId = filters.find((f) => f.op === 'eq' && f.args[0] === 'id')?.args[1];
              const eqEmail = filters.find((f) => f.op === 'eq' && f.args[0] === 'email')?.args[1];
              if (table === 'agents') {
                const target = fakeState.agents.find((a: any) => a.id === eqId || a.email === eqEmail);
                if (target) Object.assign(target, updatePayload);
              }
              if (table === 'platform_super_admin_invitations') {
                const target = fakeState.invitations.find((i: any) => i.id === eqId);
                if (target) Object.assign(target, updatePayload);
              }
              return resolve({ data: updatePayload, error: null });
            }

            if (isDelete) {
              const eqId = filters.find((f) => f.op === 'eq' && f.args[0] === 'id')?.args[1];
              const eqEmail = filters.find((f) => f.op === 'eq' && f.args[0] === 'email')?.args[1];
              if (table === 'agents') {
                fakeState.agents = fakeState.agents.filter((a: any) => a.id !== eqId && a.email !== eqEmail);
              }
              if (table === 'platform_super_admin_invitations') {
                fakeState.invitations = fakeState.invitations.filter((i: any) => i.id !== eqId && i.email !== eqEmail);
              }
              return resolve({ data: null, error: null });
            }

            let sourceData: any[] = [];
            if (table === 'agents') {
              sourceData = fakeState.agents;
            } else if (table === 'platform_super_admin_invitations') {
              sourceData = fakeState.invitations;
            } else if (table === 'super_admin_audit_logs') {
              sourceData = fakeState.auditLogs;
            } else if (table === 'platform_settings') {
              sourceData = [
                {
                  id: 'default',
                  platform_name: 'ZenTry',
                  platform_url: 'https://zen-try.site',
                  smtp_settings: null,
                },
              ];
            }

            if (table === 'agents') {
              const eqId = filters.find((f) => f.op === 'eq' && f.args[0] === 'id')?.args[1];
              if (eqId === fakeState.user?.id && fakeState.agent) {
                return resolve({ data: fakeState.agent, error: null });
              }
            }

            let filtered = [...sourceData];
            for (const f of filters) {
              if (f.op === 'eq') {
                const [col, val] = f.args;
                filtered = filtered.filter((row: any) => row[col] === val);
              }
            }

            if (isSingle) {
              const item = filtered[0];
              if (!item) return resolve({ data: null, error: { message: 'Row not found' } });
              return resolve({ data: item, error: null });
            }

            if (isMaybeSingle) {
              return resolve({ data: filtered[0] || null, error: null });
            }

            return resolve({ data: filtered, error: null, count: filtered.length });
          } catch (err) {
            if (reject) return reject(err);
            return resolve({ data: null, error: err });
          }
        },
      };

      return builder;
    }),
  };
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => createMockSupabaseClient()),
}));

vi.mock('@/lib/supabase/service', () => ({
  serviceClient: vi.fn(() => createMockSupabaseClient()),
}));

import {
  assertPlatformOwner,
  getPlatformSuperAdminsListAction,
  inviteSuperAdminAction,
  acceptSuperAdminInviteAction,
  revokeSuperAdminInviteAction,
  deleteSuperAdminInviteAction,
  revokeSuperAdminAccessAction,
  deleteSuperAdminAccessAction,
  deleteSuperAdminUserCompletelyAction,
} from './platform';

describe('Platform Owner Super Admin Access Control Suite', () => {
  beforeEach(() => {
    fakeState.user = { id: fakeState.OWNER_ID, email: 'musmanrai372@gmail.com' };
    fakeState.agent = {
      id: fakeState.OWNER_ID,
      name: 'ZenTry Owner',
      email: 'musmanrai372@gmail.com',
      role: 'owner',
      workspace_id: null,
      is_active: true,
      is_super_admin: true,
      is_platform_owner: true,
    };
    fakeState.invitations = [];
    fakeState.auditLogs = [];
  });

  describe('Authorization: assertPlatformOwner guard', () => {
    it('denies unauthenticated callers with 401', async () => {
      fakeState.user = null;
      await expect(assertPlatformOwner()).rejects.toThrow(/401 Unauthorized/);
    });

    it('strictly denies regular workspace agents with 403', async () => {
      fakeState.user = { id: fakeState.AGENT_ID, email: 'agent@workspace.test' };
      fakeState.agent = {
        id: fakeState.AGENT_ID,
        name: 'Normal Agent',
        email: 'agent@workspace.test',
        role: 'agent',
        workspace_id: 'ws-1',
        is_active: true,
        is_super_admin: false,
        is_platform_owner: false,
      };

      await expect(assertPlatformOwner()).rejects.toThrow(/403 Forbidden/);
    });

    it('strictly denies non-owner super admins from managing super admin access with 403', async () => {
      fakeState.user = { id: fakeState.ADMIN_ID, email: 'admin2@platform.test' };
      fakeState.agent = {
        id: fakeState.ADMIN_ID,
        name: 'Regular Super Admin',
        email: 'admin2@platform.test',
        role: 'admin',
        workspace_id: null,
        is_active: true,
        is_super_admin: true,
        is_platform_owner: false,
      };

      await expect(assertPlatformOwner()).rejects.toThrow(/Only the ZenTry platform owner/);
    });

    it('allows ZenTry platform owner to access owner controls', async () => {
      const res = await assertPlatformOwner();
      expect(res.user.email).toBe('musmanrai372@gmail.com');
      expect(res.agent.is_platform_owner).toBe(true);
    });
  });

  describe('Platform Owner Super Admin Actions Execution', () => {
    it('inviteSuperAdminAction requires strong password (min 8 chars)', async () => {
      const res = await inviteSuperAdminAction({
        name: 'New Admin',
        email: 'newadmin@platform.test',
        password: 'short',
      });
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/at least 8 characters/);
    });

    it('allows platform owner to invite a new super admin and records audit log', async () => {
      const res = await inviteSuperAdminAction({
        name: 'Sarah Connor',
        email: 'sarah@platform.test',
        password: 'SecureAdminPassword2026!',
      });

      expect(res.success).toBe(true);
      expect(res.token).toBeDefined();
      expect(fakeState.invitations.length).toBe(1);
      expect(fakeState.invitations[0].email).toBe('sarah@platform.test');
      expect(fakeState.invitations[0].status).toBe('pending');

      // Audit log check
      const audit = fakeState.auditLogs.find((a: any) => a.action === 'super_admin_invited');
      expect(audit).toBeDefined();
      expect(audit.details.invited_email).toBe('sarah@platform.test');
    });

    it('acceptSuperAdminInviteAction activates is_super_admin privilege', async () => {
      const inviteRes = await inviteSuperAdminAction({
        name: 'John Matrix',
        email: 'matrix@platform.test',
        password: 'SecureMatrixPassword2026!',
      });

      const token = inviteRes.token!;
      const acceptRes = await acceptSuperAdminInviteAction(token);
      expect(acceptRes.success).toBe(true);
      expect(acceptRes.email).toBe('matrix@platform.test');

      const targetAgent = fakeState.agents.find((a: any) => a.email === 'matrix@platform.test');
      expect(targetAgent).toBeDefined();
      expect(targetAgent.is_super_admin).toBe(true);
    });

    it('revokeSuperAdminInviteAction marks invitation revoked', async () => {
      const inviteRes = await inviteSuperAdminAction({
        name: 'Temporary Admin',
        email: 'temp@platform.test',
        password: 'TempPassword123!',
      });

      const invId = inviteRes.invitationId!;
      const revokeRes = await revokeSuperAdminInviteAction(invId);
      expect(revokeRes.success).toBe(true);

      const targetInv = fakeState.invitations.find((i: any) => i.id === invId);
      expect(targetInv.status).toBe('revoked');
    });

    it('revokeSuperAdminAccessAction prevents owner from self-revoking', async () => {
      const res = await revokeSuperAdminAccessAction(fakeState.OWNER_ID);
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/cannot (revoke|delete) (or delete )?your own platform owner access/i);
    });

    it('allows owner to revoke super admin privileges from another admin', async () => {
      const res = await revokeSuperAdminAccessAction(fakeState.ADMIN_ID);
      expect(res.success).toBe(true);

      const revoked = fakeState.agents.find((a: any) => a.id === fakeState.ADMIN_ID);
      expect(revoked.is_super_admin).toBe(false);
      expect(revoked.is_active).toBe(false); // Standalone admin with no workspace is deactivated
    });

    it('deleteSuperAdminInviteAction permanently removes an invitation from the database', async () => {
      const inviteRes = await inviteSuperAdminAction({
        name: 'Delete Me',
        email: 'deleteme@platform.test',
        password: 'DeletePassword123!',
      });
      const invId = inviteRes.invitationId!;
      expect(fakeState.invitations.some((i: any) => i.id === invId)).toBe(true);

      const delRes = await deleteSuperAdminInviteAction(invId);
      expect(delRes.success).toBe(true);
      expect(fakeState.invitations.some((i: any) => i.id === invId)).toBe(false);
    });

    it('deleteSuperAdminUserCompletelyAction removes user from agents and auth permanently', async () => {
      const inviteRes = await inviteSuperAdminAction({
        name: 'Ephemeral Admin',
        email: 'ephemeral@platform.test',
        password: 'EphemeralPassword123!',
      });
      await acceptSuperAdminInviteAction(inviteRes.token!);

      const created = fakeState.agents.find((a: any) => a.email === 'ephemeral@platform.test');
      expect(created).toBeDefined();

      const delRes = await deleteSuperAdminUserCompletelyAction(created.id);
      expect(delRes.success).toBe(true);
      expect(fakeState.agents.some((a: any) => a.email === 'ephemeral@platform.test')).toBe(false);
    });

    it('deleteSuperAdminUserCompletelyAction prevents owner from deleting self or other owners', async () => {
      const res = await deleteSuperAdminUserCompletelyAction(fakeState.OWNER_ID);
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/cannot delete your own platform owner account/);
    });
  });
});
