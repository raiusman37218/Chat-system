import { beforeEach, describe, expect, it, vi } from 'vitest';

const OWNER_ID = '11111111-1111-4111-8111-111111111111';
const ADMIN_ID = '22222222-2222-4222-8222-222222222222';
const NORMAL_USER_ID = '33333333-3333-4333-8333-333333333333';
const EXISTING_MEMBER_ID = '44444444-4444-4444-8444-444444444444';

const fakeState = vi.hoisted(() => {
  return {
    OWNER_ID: '11111111-1111-4111-8111-111111111111',
    ADMIN_ID: '22222222-2222-4222-8222-222222222222',
    NORMAL_USER_ID: '33333333-3333-4333-8333-333333333333',
    EXISTING_MEMBER_ID: '44444444-4444-4444-8444-444444444444',
    user: { id: '11111111-1111-4111-8111-111111111111', email: 'zentry385@gmail.com' } as any,
    agent: {
      id: '11111111-1111-4111-8111-111111111111',
      name: 'ZenTry Owner',
      email: 'zentry385@gmail.com',
      role: 'owner',
      workspace_id: null,
      is_active: true,
      is_super_admin: true,
      is_platform_owner: true,
    } as any,
    authUsers: [
      { id: '11111111-1111-4111-8111-111111111111', email: 'zentry385@gmail.com', user_metadata: { name: 'ZenTry Owner' } },
      { id: '22222222-2222-4222-8222-222222222222', email: 'admin@platform.test', user_metadata: { name: 'Operational Admin' } },
      { id: '33333333-3333-4333-8333-333333333333', email: 'regular@user.test', user_metadata: { name: 'Regular User' } },
      { id: '44444444-4444-4444-8444-444444444444', email: 'existing@agent.test', user_metadata: { name: 'Existing Agent' } },
    ] as any[],
    agents: [
      {
        id: '11111111-1111-4111-8111-111111111111',
        name: 'ZenTry Owner',
        email: 'zentry385@gmail.com',
        role: 'owner',
        workspace_id: null,
        is_active: true,
        is_super_admin: true,
        is_platform_owner: true,
      },
      {
        id: '22222222-2222-4222-8222-222222222222',
        name: 'Operational Admin',
        email: 'admin@platform.test',
        role: 'agent',
        workspace_id: null,
        is_active: true,
        is_super_admin: true,
        is_platform_owner: false,
      },
      {
        id: '33333333-3333-4333-8333-333333333333',
        name: 'Regular User',
        email: 'regular@user.test',
        role: 'agent',
        workspace_id: 'ws-1',
        is_active: true,
        is_super_admin: false,
        is_platform_owner: false,
      },
      {
        id: '44444444-4444-4444-8444-444444444444',
        name: 'Existing Agent',
        email: 'existing@agent.test',
        role: 'agent',
        workspace_id: 'ws-2',
        is_active: true,
        is_super_admin: false,
        is_platform_owner: false,
      },
    ] as any[],
    platformAccess: [
      {
        id: 'pa-owner',
        user_id: '11111111-1111-4111-8111-111111111111',
        role: 'owner',
        granted_by: '11111111-1111-4111-8111-111111111111',
        granted_at: new Date().toISOString(),
      },
      {
        id: 'pa-admin',
        user_id: '22222222-2222-4222-8222-222222222222',
        role: 'admin',
        granted_by: '11111111-1111-4111-8111-111111111111',
        granted_at: new Date().toISOString(),
      },
    ] as any[],
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
            users: fakeState.authUsers,
          },
          error: null,
        })),
        createUser: vi.fn(async ({ email, user_metadata }: any) => {
          const id = `created-${fakeState.authUsers.length + 1}`;
          const u = { id, email, user_metadata };
          fakeState.authUsers.push(u);
          return { data: { user: u }, error: null };
        }),
        updateUserById: vi.fn(async () => ({ error: null })),
        deleteUser: vi.fn(async () => ({ error: null })),
      },
    },
    from: vi.fn((table: string) => {
      let isSingle = false;
      let isMaybeSingle = false;
      const filters: Array<{ op: string; args: any[] }> = [];
      let updatePayload: any = null;
      let insertPayload: any = null;
      let isDelete = false;

      const builder: any = {
        select: vi.fn(() => builder),
        order: vi.fn(() => builder),
        limit: vi.fn(() => builder),
        single: vi.fn(() => {
          isSingle = true;
          return builder;
        }),
        maybeSingle: vi.fn(() => {
          isMaybeSingle = true;
          return builder;
        }),
        eq: vi.fn((col: string, val: any) => {
          filters.push({ op: 'eq', args: [col, val] });
          return builder;
        }),
        delete: vi.fn(() => {
          isDelete = true;
          return builder;
        }),
        update: vi.fn((payload: any) => {
          updatePayload = payload;
          return builder;
        }),
        insert: vi.fn((payload: any) => {
          insertPayload = payload;
          return builder;
        }),
        then: (resolve: (v: any) => any, reject?: (e: any) => any) => {
          try {
            if (isDelete) {
              const eqUserId = filters.find((f) => f.op === 'eq' && f.args[0] === 'user_id')?.args[1];
              if (table === 'platform_access' && eqUserId) {
                const idx = fakeState.platformAccess.findIndex((p: any) => p.user_id === eqUserId);
                if (idx !== -1) fakeState.platformAccess.splice(idx, 1);
              }
              return resolve({ data: null, error: null });
            }

            if (insertPayload) {
              if (table === 'platform_access') {
                const newRow = {
                  id: `pa-${Date.now()}`,
                  ...insertPayload,
                };
                fakeState.platformAccess.push(newRow);
                return resolve({ data: newRow, error: null });
              }
              if (table === 'super_admin_audit_logs') {
                fakeState.auditLogs.push(insertPayload);
                return resolve({ data: insertPayload, error: null });
              }
              return resolve({ data: insertPayload, error: null });
            }

            if (updatePayload) {
              const eqId = filters.find((f) => f.op === 'eq' && f.args[0] === 'id')?.args[1];
              if (table === 'agents' && eqId) {
                const target = fakeState.agents.find((a: any) => a.id === eqId);
                if (target) Object.assign(target, updatePayload);
              }
              return resolve({ data: updatePayload, error: null });
            }

            let sourceData: any[] = [];
            if (table === 'platform_access') {
              sourceData = fakeState.platformAccess;
            } else if (table === 'agents') {
              sourceData = fakeState.agents;
            } else if (table === 'super_admin_audit_logs') {
              sourceData = fakeState.auditLogs;
            }

            let filtered = [...sourceData];
            for (const f of filters) {
              if (f.op === 'eq') {
                const [col, val] = f.args;
                filtered = filtered.filter((row: any) => row[col] === val);
              }
            }

            if (isSingle) {
              return resolve({ data: filtered[0] || null, error: filtered[0] ? null : { message: 'Not found' } });
            }
            if (isMaybeSingle) {
              return resolve({ data: filtered[0] || null, error: null });
            }
            return resolve({ data: filtered, error: null });
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
  assertSuperAdmin,
  assertPlatformOwner,
  getPlatformAccessListAction,
  grantAdminAccessAction,
  revokeAdminAccessAction,
} from './platform';

describe('Requirement 8: Platform Admin Access Security Suite', () => {
  beforeEach(() => {
    fakeState.user = { id: fakeState.OWNER_ID, email: 'zentry385@gmail.com' };
    fakeState.platformAccess = [
      {
        id: 'pa-owner',
        user_id: fakeState.OWNER_ID,
        role: 'owner',
        granted_by: fakeState.OWNER_ID,
        granted_at: new Date().toISOString(),
      },
      {
        id: 'pa-admin',
        user_id: fakeState.ADMIN_ID,
        role: 'admin',
        granted_by: fakeState.OWNER_ID,
        granted_at: new Date().toISOString(),
      },
    ];
    fakeState.authUsers = [
      { id: fakeState.OWNER_ID, email: 'zentry385@gmail.com', user_metadata: { name: 'ZenTry Owner' } },
      { id: fakeState.ADMIN_ID, email: 'admin@platform.test', user_metadata: { name: 'Operational Admin' } },
      { id: fakeState.NORMAL_USER_ID, email: 'regular@user.test', user_metadata: { name: 'Regular User' } },
      { id: fakeState.EXISTING_MEMBER_ID, email: 'existing@agent.test', user_metadata: { name: 'Existing Agent' } },
    ];
    fakeState.auditLogs = [];
  });

  describe('1. A user without access gets 403 on admin routes and guards', () => {
    it('denies unauthenticated callers with 401', async () => {
      fakeState.user = null;
      await expect(assertSuperAdmin()).rejects.toThrow(/401 Unauthorized/);
      await expect(assertPlatformOwner()).rejects.toThrow(/401 Unauthorized/);
    });

    it('strictly denies callers without platform access with 403', async () => {
      // Normal user logged in
      fakeState.user = { id: fakeState.NORMAL_USER_ID, email: 'regular@user.test' };

      await expect(assertSuperAdmin()).rejects.toThrow(/403 Forbidden: Platform super admin privileges required/);
      await expect(assertPlatformOwner()).rejects.toThrow(/403 Forbidden/);
    });

    it('denies access list retrieval to unauthorized callers with error', async () => {
      fakeState.user = { id: fakeState.NORMAL_USER_ID, email: 'regular@user.test' };
      const res = await getPlatformAccessListAction();
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/403 Forbidden/);
    });
  });

  describe('2. An admin cannot grant or remove access', () => {
    beforeEach(() => {
      // Switch caller to admin (who has admin role in platform_access, but NOT owner)
      fakeState.user = { id: fakeState.ADMIN_ID, email: 'admin@platform.test' };
    });

    it('allows admin to pass assertSuperAdmin but strictly rejects assertPlatformOwner with 403', async () => {
      const superRes = await assertSuperAdmin();
      expect(superRes.accessRole).toBe('admin');
      expect(superRes.agent.is_super_admin).toBe(true);
      expect(superRes.agent.is_platform_owner).toBe(false);

      await expect(assertPlatformOwner()).rejects.toThrow(
        /403 Forbidden: Only the platform owner can manage admin access/
      );
    });

    it('strictly forbids admin from granting access to others', async () => {
      await expect(grantAdminAccessAction('existing@agent.test')).rejects.toThrow(
        /403 Forbidden: Only the platform owner can manage admin access/
      );
    });

    it('strictly forbids admin from removing access of any account', async () => {
      await expect(revokeAdminAccessAction(fakeState.EXISTING_MEMBER_ID)).rejects.toThrow(
        /403 Forbidden: Only the platform owner can manage admin access/
      );
    });
  });

  describe('3. The owner cannot be removed', () => {
    it('rejects attempt to remove or revoke the owner account', async () => {
      fakeState.user = { id: fakeState.OWNER_ID, email: 'zentry385@gmail.com' };

      const res = await revokeAdminAccessAction(fakeState.OWNER_ID);
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/The platform owner account cannot be removed or revoked/);

      // Verify owner row still exists in platform_access
      const ownerInDb = fakeState.platformAccess.find((p: any) => p.user_id === fakeState.OWNER_ID);
      expect(ownerInDb).toBeDefined();
      expect(ownerInDb.role).toBe('owner');
    });
  });

  describe('4. Granting to a non-existing email creates nothing', () => {
    it('returns a clear message and creates no accounts when email does not exist', async () => {
      fakeState.user = { id: fakeState.OWNER_ID, email: 'zentry385@gmail.com' };
      const initialAuthCount = fakeState.authUsers.length;
      const initialAccessCount = fakeState.platformAccess.length;

      const nonExistentEmail = 'ghost-never-registered@zentry.test';
      const res = await grantAdminAccessAction(nonExistentEmail);

      expect(res.success).toBe(false);
      expect(res.error).toMatch(/No existing Zentry account found/);

      // Proves nothing was created in auth or platform access
      expect(fakeState.authUsers.length).toBe(initialAuthCount);
      expect(fakeState.platformAccess.length).toBe(initialAccessCount);
      expect(fakeState.platformAccess.some((p: any) => p.email === nonExistentEmail)).toBe(false);
    });
  });

  describe('5. Platform owner can grant and revoke admin access for existing users with audit logging', () => {
    it('grants admin access to an existing Zentry user and writes to audit log', async () => {
      fakeState.user = { id: fakeState.OWNER_ID, email: 'zentry385@gmail.com' };

      const res = await grantAdminAccessAction('existing@agent.test');
      expect(res.success).toBe(true);
      expect(res.member?.role).toBe('admin');
      expect(res.member?.user_id).toBe(fakeState.EXISTING_MEMBER_ID);

      // Verify row inserted in platform_access
      const row = fakeState.platformAccess.find((p: any) => p.user_id === fakeState.EXISTING_MEMBER_ID);
      expect(row).toBeDefined();
      expect(row.role).toBe('admin');

      // Verify audit log recorded
      const auditLog = fakeState.auditLogs.find((a: any) => a.action === 'platform_admin_access_granted');
      expect(auditLog).toBeDefined();
      expect(auditLog.details.granted_to_email).toBe('existing@agent.test');
    });

    it('rejects granting access if user already has platform access', async () => {
      fakeState.user = { id: fakeState.OWNER_ID, email: 'zentry385@gmail.com' };

      const res = await grantAdminAccessAction('admin@platform.test');
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/already has admin access/);
    });

    it('successfully revokes admin access and writes to audit log', async () => {
      fakeState.user = { id: fakeState.OWNER_ID, email: 'zentry385@gmail.com' };

      const res = await revokeAdminAccessAction(fakeState.ADMIN_ID);
      expect(res.success).toBe(true);

      // Verify row removed from platform_access
      const row = fakeState.platformAccess.find((p: any) => p.user_id === fakeState.ADMIN_ID);
      expect(row).toBeUndefined();

      // Verify audit log recorded
      const auditLog = fakeState.auditLogs.find((a: any) => a.action === 'platform_admin_access_revoked');
      expect(auditLog).toBeDefined();
      expect(auditLog.details.revoked_user_id).toBe(fakeState.ADMIN_ID);
    });
  });
});
