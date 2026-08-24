import bcrypt from 'bcryptjs';
import { createHash } from 'crypto';
import { prisma } from '../../lib/prisma';

export interface CredentialRedeemResult {
  ok: boolean;
  reason?:
    | 'INVALID'
    | 'WEAK_PASSWORD'
    | 'PASSWORD_REUSED';
}

export function validateCredentialPassword(
  password: string
): void {
  if (password.length < 12) {
    throw new Error(
      'Password must be at least 12 characters'
    );
  }

  if (!/[A-Z]/.test(password)) {
    throw new Error(
      'Password must include an uppercase letter'
    );
  }

  if (!/[a-z]/.test(password)) {
    throw new Error(
      'Password must include a lowercase letter'
    );
  }

  if (!/[0-9]/.test(password)) {
    throw new Error(
      'Password must include a number'
    );
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    throw new Error(
      'Password must include a symbol'
    );
  }
}

export async function activateCredentialWithToken(
  token: string,
  newPassword: string
) {
  if (
    typeof token !== 'string' ||
    token.length < 32 ||
    token.length > 256
  ) {
    throw new Error(
      'Activation token is invalid or expired'
    );
  }

  validateCredentialPassword(
    newPassword
  );

  const tokenHash =
    createHash('sha256')
      .update(token)
      .digest('hex');

  const newPasswordHash =
    await bcrypt.hash(
      newPassword,
      12
    );

  const rows =
    await prisma.$queryRaw<
      Array<{
        result:
          CredentialRedeemResult;
      }>
    >`
      SELECT
        system.auth_redeem_credential_challenge(
          ${tokenHash},
          ${newPassword},
          ${newPasswordHash}
        ) AS result
    `;

  const result =
    rows[0]?.result;

  if (!result?.ok) {

    if (
      result?.reason ===
      'PASSWORD_REUSED'
    ) {
      throw new Error(
        'Choose a password that has not previously been used for this account'
      );
    }

    if (
      result?.reason ===
      'WEAK_PASSWORD'
    ) {
      throw new Error(
        'Password does not meet the credential policy'
      );
    }

    throw new Error(
      'Activation token is invalid or expired'
    );
  }

  return {
    success: true,
    message:
      'Credential established. Sign in with the new password.',
  };
}
