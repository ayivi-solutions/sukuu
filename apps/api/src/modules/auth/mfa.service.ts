import { createHmac } from 'crypto';
import {
  buildOtpAuthUri,
  decryptTotpSecret,
  encryptTotpSecret,
  generateTotpSecret,
  verifyTotp,
} from '../../lib/mfaCrypto';

import {
  withTenantContext,
} from '../../lib/tenantContext';


export interface MfaContext {
  sessionId: string;
  schoolId: string;
  userId: string;
  role: string;
}



function proofSecret(): Buffer {

  const raw =
    process.env.MFA_PROOF_SECRET;


  if (!raw) {

    throw new Error(
      'MFA_PROOF_SECRET is required'
    );

  }


  const secret =
    Buffer.from(
      raw,
      'base64'
    );


  if (
    secret.length !== 32
  ) {

    throw new Error(
      'MFA_PROOF_SECRET must decode to exactly 32 bytes'
    );

  }


  return secret;

}


function verificationProof(
  ctx: MfaContext,
  purpose:
    'ENROLL' |
    'STEP_UP',
  counter: number
): string {

  const message =
    [
      purpose,
      ctx.sessionId,
      ctx.userId,
      ctx.schoolId,
      String(counter),
    ].join(':');


  return createHmac(
    'sha256',
    proofSecret()
  )
    .update(
      message,
      'utf8'
    )
    .digest(
      'hex'
    );

}


interface MfaResult {
  ok: boolean;
  reason?: string;
  privileged?: boolean;
  email?: string;
  configured?: boolean;
  enabled?: boolean;
  method?: string | null;
  verifiedAt?: string | null;
  lockedUntil?: string | null;
  secretEnvelope?: string | null;
  stepUpExpiresAt?: string | null;
}


async function callResult(
  ctx: MfaContext,
  sql:
    (
      tx: any
    ) =>
      Promise<
        Array<{
          result: MfaResult;
        }>
      >
): Promise<MfaResult> {

  const rows =
    await withTenantContext(
      ctx,
      sql
    );


  return (
    rows[0]?.result ||
    {
      ok: false,
      reason: 'NO_RESULT',
    }
  );

}


export async function getMfaStatus(
  ctx: MfaContext
) {

  const result =
    await callResult(
      ctx,
      tx =>
        tx.$queryRaw`
          SELECT
            system.auth_mfa_status()
            AS result
        `
    );


  if (!result.ok) {

    throw new Error(
      result.reason ||
      'Could not determine MFA status'
    );

  }


  return result;

}


export async function beginTotpEnrollment(
  ctx: MfaContext
) {

  const status =
    await getMfaStatus(
      ctx
    );


  if (!status.privileged) {

    throw new Error(
      'Privileged MFA enrollment is not available for this account'
    );

  }


  if (status.enabled) {

    throw new Error(
      'MFA is already enabled for this account'
    );

  }


  if (!status.email) {

    throw new Error(
      'MFA account identity could not be resolved'
    );

  }


  const secret =
    generateTotpSecret();


  const envelope =
    encryptTotpSecret(
      secret
    );


  const result =
    await callResult(
      ctx,
      tx =>
        tx.$queryRaw`
          SELECT
            system.auth_mfa_begin_totp_enrollment(
              ${envelope}
            )
            AS result
        `
    );


  if (!result.ok) {

    throw new Error(
      result.reason ||
      'Could not begin MFA enrollment'
    );

  }


  return {
    method: 'TOTP',
    secret,
    otpAuthUri:
      buildOtpAuthUri(
        status.email,
        secret
      ),
  };

}


async function currentMaterial(
  ctx: MfaContext
) {

  const result =
    await callResult(
      ctx,
      tx =>
        tx.$queryRaw`
          SELECT
            system.auth_mfa_material()
            AS result
        `
    );


  if (!result.ok) {

    throw new Error(
      result.reason ||
      'MFA material is unavailable'
    );

  }


  if (!result.secretEnvelope) {

    throw new Error(
      'MFA secret material is unavailable'
    );

  }


  return result;

}


async function recordFailure(
  ctx: MfaContext
) {

  await callResult(
    ctx,
    tx =>
      tx.$queryRaw`
        SELECT
          system.auth_mfa_record_failure()
          AS result
      `
  );

}


export async function verifyTotpEnrollment(
  ctx: MfaContext,
  code: string
) {

  const material =
    await currentMaterial(
      ctx
    );


  const secret =
    decryptTotpSecret(
      material.secretEnvelope!
    );


  const counter =
    verifyTotp(
      secret,
      code
    );


  if (counter === null) {

    await recordFailure(
      ctx
    );


    throw new Error(
      'Authenticator code is invalid'
    );

  }


  const result =
    await callResult(
      ctx,
      tx =>
        tx.$queryRaw`
          SELECT
            system.auth_mfa_complete_enrollment(
              ${BigInt(counter)},
              ${verificationProof(
                ctx,
                'ENROLL',
                counter
              )}
            )
            AS result
        `
    );


  if (!result.ok) {

    throw new Error(
      result.reason ||
      'Could not complete MFA enrollment'
    );

  }


  return {
    success: true,
    method: 'TOTP',
    assurance: 'MFA',
  };

}


export async function verifyTotpStepUp(
  ctx: MfaContext,
  code: string
) {

  const material =
    await currentMaterial(
      ctx
    );


  if (!material.enabled) {

    throw new Error(
      'MFA must be enrolled before step-up authentication'
    );

  }


  const secret =
    decryptTotpSecret(
      material.secretEnvelope!
    );


  const counter =
    verifyTotp(
      secret,
      code
    );


  if (counter === null) {

    await recordFailure(
      ctx
    );


    throw new Error(
      'Authenticator code is invalid'
    );

  }


  const result =
    await callResult(
      ctx,
      tx =>
        tx.$queryRaw`
          SELECT
            system.auth_mfa_complete_step_up(
              ${BigInt(counter)},
              ${verificationProof(
                ctx,
                'STEP_UP',
                counter
              )},
              ${600}
            )
            AS result
        `
    );


  if (!result.ok) {

    throw new Error(
      result.reason ||
      'Step-up authentication failed'
    );

  }


  return {
    success: true,
    assurance: 'MFA',
    stepUpExpiresAt:
      result.stepUpExpiresAt ||
      null,
  };

}
