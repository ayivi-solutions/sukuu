import { createHash, randomBytes } from 'crypto';
import { prisma } from '../../lib/prisma';

type JsonResult = { ok: boolean; reason?: string; [key: string]: any };

async function jsonFunction(
  sql: Promise<Array<{ result: JsonResult }>>
): Promise<JsonResult> {
  const rows = await sql;
  return rows[0]?.result || { ok: false, reason: 'NO_RESULT' };
}

function generateBootstrapToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString('base64url');
  const hash = createHash('sha256').update(raw, 'utf8').digest('hex');
  return { raw, hash };
}

/**
 * Locked-out Platform Owner requests a credential reset by login_name.
 * Always returns a generic success message, regardless of whether a
 * matching ACTIVE provider was found, to avoid account enumeration.
 */
export async function requestProviderCredentialReset(
  loginName: string,
  reason: string
) {
  await jsonFunction(
    prisma.$queryRaw<Array<{ result: JsonResult }>>`
      SELECT system.provider_credential_reset_request(${loginName}, ${reason}) AS result
    `
  );

  return {
    ok: true,
    message:
      'If a matching Platform Owner account exists, a reset request has been recorded. It now requires two other Platform Owners to approve it before it takes effect.',
  };
}

/**
 * Requests currently awaiting this Platform Owner's decision. Never
 * includes the caller's own request, and never re-lists a request
 * they've already decided on.
 */
export async function listPendingProviderCredentialResets(
  approverProviderId: string
) {
  const result = await jsonFunction(
    prisma.$queryRaw<Array<{ result: JsonResult }>>`
      SELECT system.provider_credential_reset_pending_for_approver(${approverProviderId}) AS result
    `
  );
  if (!result.ok) {
    throw new Error('Could not list pending credential reset requests');
  }
  return result.requests || [];
}

export class ProviderCredentialResetDecisionError extends Error {
  constructor(public reasonCode: string) {
    super(`Credential reset decision rejected: ${reasonCode}`);
    this.name = 'ProviderCredentialResetDecisionError';
  }
}

/**
 * Records one approve/reject decision from one OTHER Platform Owner.
 * Only on the SECOND distinct APPROVE does this finalize: existing
 * authenticators are revoked, the target's status reverts to
 * PENDING_ENROLLMENT, and a fresh bootstrap token is issued. The raw
 * (unhashed) token is returned ONLY on that finalizing call, to the
 * approver who triggered it — it is never persisted anywhere, and must
 * be relayed out-of-band to the locked-out Platform Owner, the same
 * way the initial bootstrap token was originally issued.
 */
export async function decideProviderCredentialReset(input: {
  requestId: string;
  approverProviderId: string;
  decision: 'APPROVE' | 'REJECT';
  reason?: string;
}) {
  const token =
    input.decision === 'APPROVE' ? generateBootstrapToken() : null;
  const newExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes to complete re-registration

  const result = await jsonFunction(
    prisma.$queryRaw<Array<{ result: JsonResult }>>`
      SELECT system.provider_credential_reset_decide(
        ${input.requestId},
        ${input.approverProviderId},
        ${input.decision},
        ${input.reason || null},
        ${token?.hash || null},
        ${token ? newExpiry : null}
      ) AS result
    `
  );

  if (!result.ok) {
    throw new ProviderCredentialResetDecisionError(result.reason || 'UNKNOWN');
  }

  if (result.finalized && result.outcome === 'APPROVED') {
    return {
      finalized: true,
      outcome: 'APPROVED',
      bootstrapToken: token!.raw,
      bootstrapExpiresAt: newExpiry,
      note: 'Relay this token to the affected Platform Owner out-of-band. It will not be shown again and expires in 30 minutes.',
    };
  }

  return {
    finalized: !!result.finalized,
    outcome: result.outcome || 'PENDING',
    approvalCount: result.approvalCount,
  };
}
