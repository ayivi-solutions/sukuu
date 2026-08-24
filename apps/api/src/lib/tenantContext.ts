import { AsyncLocalStorage } from 'async_hooks';
import { createHmac } from 'crypto';
import { prisma } from './prisma';
import type { Prisma } from '@prisma/client';

export interface TenantCtx {
  schoolId: string;
  userId: string;
  role: string;
  sessionId?: string;
}

const storage = new AsyncLocalStorage<TenantCtx>();

export function runWithTenantContext<T>(
  ctx: TenantCtx,
  fn: () => Promise<T>
): Promise<T> {
  return storage.run(ctx, fn);
}

export function getTenantContext(): TenantCtx | undefined {
  return storage.getStore();
}

function buildSessionProof(sessionId: string, userId: string): string {
  if (!sessionId) return '';

  const secret = process.env.RLS_CONTEXT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      'RLS_CONTEXT_SECRET is required for session-bound database access'
    );
  }

  return createHmac('sha256', secret)
    .update(`${sessionId}:${userId}`)
    .digest('hex');
}

/**
 * Stage 3B trusted context.
 *
 * Ambient authenticated identity always wins over explicit service arguments.
 * Phase 1 also sets the legacy app.current_* values so the additive candidate
 * can be tested before the RLS policy cutover. Phase 2 will ignore those
 * legacy values completely.
 */
export async function withTenantContext<TResult>(
  explicitCtx: Partial<TenantCtx> | undefined,
  fn: (tx: Prisma.TransactionClient) => Promise<TResult>
): Promise<TResult> {
  const ambient = getTenantContext();

  const ctx: TenantCtx = {
    sessionId: ambient?.sessionId ?? explicitCtx?.sessionId ?? '',
    schoolId: ambient?.schoolId ?? explicitCtx?.schoolId ?? '',
    userId: ambient?.userId ?? explicitCtx?.userId ?? '',
    role: ambient?.role ?? explicitCtx?.role ?? '',
  };

  const proof = buildSessionProof(ctx.sessionId || '', ctx.userId);

  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`
      SELECT set_config('app.session_id', ${ctx.sessionId || ''}, true)
    `;
    await tx.$queryRaw`
      SELECT set_config('app.session_user_id', ${ctx.userId}, true)
    `;
    await tx.$queryRaw`
      SELECT set_config('app.session_proof', ${proof}, true)
    `;

    // Transitional compatibility only.
    await tx.$queryRaw`
      SELECT set_config('app.current_school_id', ${ctx.schoolId}, true)
    `;
    await tx.$queryRaw`
      SELECT set_config('app.current_user_id', ${ctx.userId}, true)
    `;
    await tx.$queryRaw`
      SELECT set_config('app.actor_role', ${ctx.role}, true)
    `;

    return await fn(tx);
  }, {
    timeout: 15000,
    maxWait: 10000,
  });
}
