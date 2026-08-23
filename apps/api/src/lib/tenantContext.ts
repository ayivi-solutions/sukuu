import { AsyncLocalStorage } from 'async_hooks';
import { prisma } from './prisma';
import type { Prisma } from '@prisma/client';

export interface TenantCtx {
  schoolId: string;
  userId: string;
  role: string;
}

const storage = new AsyncLocalStorage<TenantCtx>();

/**
 * Runs `fn` with tenant context available to any withTenantContext() call
 * nested inside it (directly or via async descendants). Intended to be
 * called once per request from middleware; individual service functions
 * then call withTenantContext() around their actual Prisma work.
 */
export function runWithTenantContext<T>(ctx: TenantCtx, fn: () => Promise<T>): Promise<T> {
  return storage.run(ctx, fn);
}

export function getTenantContext(): TenantCtx | undefined {
  return storage.getStore();
}

/**
 * Postgres SET LOCAL does not support bind parameters — the value must be a
 * literal in the SQL text. We therefore validate strictly (reject, never
 * silently strip) rather than escape, since these values are UUIDs / role
 * keys we control, not free-text user input that legitimately needs escaping.
 */
function assertSafe(value: string, label: string): string {
  if (!/^[a-zA-Z0-9_-]*$/.test(value)) {
    throw new Error(`Refusing unsafe ${label} for session context: ${JSON.stringify(value)}`);
  }
  return value;
}

/**
 * Opens a Postgres transaction, sets the RLS session variables for the
 * current tenant context via SET LOCAL (transaction-scoped, auto-reset at
 * COMMIT/ROLLBACK — safe under connection pooling, unlike SET SESSION),
 * then runs `fn` against that same transaction client. Every SystemX
 * service function that touches system.* tables goes through this.
 *
 * If no tenant context is available (e.g. a background job or a seed
 * script), runs with empty session variables — RLS policies then apply
 * their "no context = no rows" default rather than accidentally granting
 * broad access.
 */
export async function withTenantContext<TResult>(
  explicitCtx: Partial<TenantCtx> | undefined,
  fn: (tx: Prisma.TransactionClient) => TResult
): Promise<Awaited<TResult>> {
  const ambient = getTenantContext();
  const ctx: TenantCtx = {
    schoolId: explicitCtx?.schoolId ?? ambient?.schoolId ?? '',
    userId: explicitCtx?.userId ?? ambient?.userId ?? '',
    role: explicitCtx?.role ?? ambient?.role ?? '',
  };

  const schoolId = assertSafe(ctx.schoolId, 'schoolId');
  const userId = assertSafe(ctx.userId, 'userId');
  const role = assertSafe(ctx.role, 'role');

  return prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SET LOCAL app.current_school_id = '${schoolId}'`);
    await tx.$executeRawUnsafe(`SET LOCAL app.current_user_id = '${userId}'`);
    await tx.$executeRawUnsafe(`SET LOCAL app.actor_role = '${role}'`);
    return await fn(tx);
  }, {
    // Prisma's default is 5000ms, which assumes low-latency access to the
    // database. A typical SystemX write (createUser, for example) makes
    // several sequential round trips inside one transaction — three SET
    // LOCAL statements plus a handful of creates — and over a real network
    // path that can add up past 5 seconds even though each individual
    // query is fast. 15s/10s gives real headroom without masking a
    // genuinely stuck transaction.
    timeout: 15000,
    maxWait: 10000,
  });
}
