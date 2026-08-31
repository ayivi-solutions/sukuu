import { AsyncLocalStorage } from 'async_hooks';
import { createHmac } from 'crypto';
import { prisma } from './prisma';
import type { Prisma } from '@prisma/client';

export interface ProviderCtx {
  providerId: string;
  sessionId: string;
}

const storage = new AsyncLocalStorage<ProviderCtx>();

export function runWithProviderContext<T>(
  ctx: ProviderCtx,
  fn: () => Promise<T>
): Promise<T> {
  return storage.run(ctx, fn);
}

export function getProviderContext(): ProviderCtx | undefined {
  return storage.getStore();
}

function providerSessionProof(
  sessionId: string,
  providerId: string
): string {
  const secret = process.env.RLS_CONTEXT_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error(
      'RLS_CONTEXT_SECRET is required for provider database authority'
    );
  }

  return createHmac('sha256', secret)
    .update(`provider:${sessionId}:${providerId}`, 'utf8')
    .digest('hex');
}

export async function withProviderContext<TResult>(
  explicitCtx: Partial<ProviderCtx> | undefined,
  fn: (tx: Prisma.TransactionClient) => Promise<TResult>
): Promise<TResult> {
  const ambient = getProviderContext();

  const ctx: ProviderCtx = {
    providerId:
      ambient?.providerId ??
      explicitCtx?.providerId ??
      '',
    sessionId:
      ambient?.sessionId ??
      explicitCtx?.sessionId ??
      '',
  };

  if (!ctx.providerId || !ctx.sessionId) {
    throw new Error(
      'An active provider session is required for provider authority'
    );
  }

  const proof = providerSessionProof(
    ctx.sessionId,
    ctx.providerId
  );

  return prisma.$transaction(
    async tx => {
      await tx.$queryRaw`
        SELECT set_config(
          'app.provider_session_id',
          ${ctx.sessionId},
          true
        )
      `;
      await tx.$queryRaw`
        SELECT set_config(
          'app.provider_user_id',
          ${ctx.providerId},
          true
        )
      `;
      await tx.$queryRaw`
        SELECT set_config(
          'app.provider_session_proof',
          ${proof},
          true
        )
      `;

      return fn(tx);
    },
    {
      timeout: 15000,
      maxWait: 10000,
    }
  );
}
