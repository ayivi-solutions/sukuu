import { createHash, createHmac } from 'crypto';
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
import { prisma } from '../../lib/prisma';


export interface MfaContext {
  sessionId: string;
  schoolId: string;
  userId: string;
  role: string;
}



function proofSecret(): string {

  const raw =
    process.env.MFA_PROOF_SECRET;


  if (!raw) {

    throw new Error(
      'MFA_PROOF_SECRET is required'
    );

  }


  /*
   * Validate that the configured value represents exactly
   * 256 bits of random secret material.
   *
   * IMPORTANT:
   * The canonical base64 TEXT is deliberately used as the
   * HMAC key rather than the decoded Buffer.
   *
   * PostgreSQL receives the same secret_value as text through
   * system._hmac_sha256_hex(), so both runtimes must use the
   * identical byte representation of the key.
   */
  const decoded =
    Buffer.from(
      raw,
      'base64'
    );


  if (
    decoded.length !== 32
  ) {

    throw new Error(
      'MFA_PROOF_SECRET must decode to exactly 32 bytes'
    );

  }


  return raw;

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
              CAST(
                ${600}
                AS integer
              )
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


interface MfaRecoveryMaterial {
  ok: boolean;
  reason?: string;
  userId?: string;
  schoolId?: string;
  secretEnvelope?: string;
}


function recoveryTokenHash(
  token: string
): string {

  const normalized =
    String(
      token ||
      ''
    ).trim();


  if (
    normalized.length < 32 ||
    normalized.length > 256
  ) {

    throw new Error(
      'MFA recovery authorization failed'
    );

  }


  return createHash(
    'sha256'
  )
    .update(
      normalized,
      'utf8'
    )
    .digest(
      'hex'
    );

}


function recoveryVerificationProof(
  tokenHash: string,
  userId: string,
  schoolId: string,
  counter: number
): string {

  const message =
    [
      'RECOVERY',
      tokenHash,
      userId,
      schoolId,
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


export async function beginMfaRecovery(
  email: string,
  password: string,
  recoveryToken: string
) {

  const normalizedEmail =
    String(
      email ||
      ''
    ).trim();


  const normalizedPassword =
    String(
      password ||
      ''
    );


  if (
    !normalizedEmail ||
    !normalizedPassword
  ) {

    throw new Error(
      'MFA recovery authorization failed'
    );

  }


  const tokenHash =
    recoveryTokenHash(
      recoveryToken
    );


  const secret =
    generateTotpSecret();


  const envelope =
    encryptTotpSecret(
      secret
    );


  const rows =
    await prisma.$queryRaw<
      Array<{
        result: {
          ok: boolean;
          reason?: string;
        };
      }>
    >`
      SELECT
        system.auth_mfa_recovery_authorize(
          ${tokenHash},
          ${normalizedEmail},
          ${normalizedPassword},
          ${envelope}
        ) AS result
    `;


  const result =
    rows[0]?.result;


  if (!result?.ok) {

    throw new Error(
      'MFA recovery authorization failed'
    );

  }


  return {
    success: true,
    method: 'TOTP',
    secret,
    otpAuthUri:
      buildOtpAuthUri(
        normalizedEmail,
        secret
      ),
  };

}


export async function verifyMfaRecovery(
  email: string,
  recoveryToken: string,
  code: string
) {

  const normalizedEmail =
    String(
      email ||
      ''
    ).trim();


  const tokenHash =
    recoveryTokenHash(
      recoveryToken
    );


  const materialRows =
    await prisma.$queryRaw<
      Array<{
        result:
          MfaRecoveryMaterial;
      }>
    >`
      SELECT
        system.auth_mfa_recovery_material(
          ${tokenHash},
          ${normalizedEmail}
        ) AS result
    `;


  const material =
    materialRows[0]?.result;


  if (
    !material?.ok ||
    !material.userId ||
    !material.schoolId ||
    !material.secretEnvelope
  ) {

    throw new Error(
      'MFA recovery verification failed'
    );

  }


  const secret =
    decryptTotpSecret(
      material.secretEnvelope
    );


  const counter =
    verifyTotp(
      secret,
      code
    );


  if (counter === null) {

    await prisma.$queryRaw`
      SELECT
        system.auth_mfa_recovery_record_failure(
          ${tokenHash},
          ${normalizedEmail}
        )
    `;


    throw new Error(
      'MFA recovery verification failed'
    );

  }


  const proof =
    recoveryVerificationProof(
      tokenHash,
      material.userId,
      material.schoolId,
      counter
    );


  const completeRows =
    await prisma.$queryRaw<
      Array<{
        result: {
          ok: boolean;
          success?: boolean;
          method?: string;
        };
      }>
    >`
      SELECT
        system.auth_mfa_recovery_complete(
          ${tokenHash},
          ${normalizedEmail},
          ${BigInt(counter)},
          ${proof}
        ) AS result
    `;


  const completed =
    completeRows[0]?.result;


  if (
    !completed?.ok ||
    completed.success !== true
  ) {

    throw new Error(
      'MFA recovery verification failed'
    );

  }


  return {
    success: true,
    method: 'TOTP',
    message:
      'MFA recovery completed. Sign in again using the replacement authenticator.',
  };

}
