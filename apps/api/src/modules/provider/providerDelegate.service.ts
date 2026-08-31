import bcrypt from 'bcryptjs';
import {
  createHash,
  createHmac,
} from 'crypto';
import { prisma } from '../../lib/prisma';
import {
  buildOtpAuthUri,
  decryptTotpSecret,
  encryptTotpSecret,
  generateTotpSecret,
  verifyTotp,
} from '../../lib/mfaCrypto';
import {
  validateCredentialPassword,
} from '../auth/credential.service';

type DelegateResult = {
  ok: boolean;
  reason?: string;
  schoolId?: string;
  email?: string;
  displayName?: string;
  secretEnvelope?: string;
  userId?: string;
};

function delegateTokenHash(
  token: string
): string {
  const value =
    String(token || '').trim();

  if (
    value.length < 32 ||
    value.length > 256
  ) {
    throw new Error(
      'Delegate invitation is invalid or expired'
    );
  }

  return createHash('sha256')
    .update(value, 'utf8')
    .digest('hex');
}

function proofSecret(): string {
  const raw =
    process.env.MFA_PROOF_SECRET;

  if (!raw) {
    throw new Error(
      'MFA_PROOF_SECRET is required'
    );
  }

  const decoded =
    Buffer.from(raw, 'base64');

  if (decoded.length !== 32) {
    throw new Error(
      'MFA_PROOF_SECRET must decode to exactly 32 bytes'
    );
  }

  return raw;
}

async function callResult(
  query:
    Promise<
      Array<{
        result: DelegateResult;
      }>
    >
): Promise<DelegateResult> {
  const rows = await query;

  return (
    rows[0]?.result || {
      ok: false,
      reason: 'NO_RESULT',
    }
  );
}

export async function beginDelegateAcceptance(
  invitationToken: string
) {
  const tokenHash =
    delegateTokenHash(
      invitationToken
    );

  const secret =
    generateTotpSecret();

  const envelope =
    encryptTotpSecret(secret);

  const result =
    await callResult(
      prisma.$queryRaw`
        SELECT
          system.provider_delegate_accept_begin(
            ${tokenHash},
            ${envelope}
          ) AS result
      `
    );

  if (
    !result.ok ||
    !result.email
  ) {
    throw new Error(
      'Delegate invitation is invalid or expired'
    );
  }

  return {
    success: true,
    email: result.email,
    displayName:
      result.displayName || null,
    method: 'TOTP',
    secret,
    otpAuthUri:
      buildOtpAuthUri(
        result.email,
        secret
      ),
  };
}

export async function completeDelegateAcceptance(
  invitationToken: string,
  password: string,
  totpCode: string
) {
  const tokenHash =
    delegateTokenHash(
      invitationToken
    );

  validateCredentialPassword(
    password
  );

  const material =
    await callResult(
      prisma.$queryRaw`
        SELECT
          system.provider_delegate_accept_material(
            ${tokenHash}
          ) AS result
      `
    );

  if (
    !material.ok ||
    !material.schoolId ||
    !material.email ||
    !material.secretEnvelope
  ) {
    throw new Error(
      'Delegate invitation is invalid or expired'
    );
  }

  const secret =
    decryptTotpSecret(
      material.secretEnvelope
    );

  const counter =
    verifyTotp(
      secret,
      String(totpCode || '')
    );

  if (counter === null) {
    await prisma.$queryRaw`
      SELECT
        system.provider_delegate_accept_failure(
          ${tokenHash}
        )
    `;

    throw new Error(
      'Authenticator code is invalid'
    );
  }

  const passwordHash =
    await bcrypt.hash(
      password,
      12
    );

  const proof =
    createHmac(
      'sha256',
      proofSecret()
    )
      .update(
        [
          'DELEGATE',
          tokenHash,
          material.schoolId,
          String(counter),
        ].join(':'),
        'utf8'
      )
      .digest('hex');

  const completed =
    await callResult(
      prisma.$queryRaw`
        SELECT
          system.provider_delegate_accept_complete(
            ${tokenHash},
            ${password},
            ${passwordHash},
            ${BigInt(counter)},
            ${proof}
          ) AS result
      `
    );

  if (
    !completed.ok ||
    !completed.userId
  ) {
    throw new Error(
      completed.reason ||
      'Delegate activation failed'
    );
  }

  return {
    success: true,
    userId:
      completed.userId,
    schoolId:
      completed.schoolId,
    message:
      'Tenant Superadmin activation completed. Sign in with your password and authenticator code.',
  };
}
