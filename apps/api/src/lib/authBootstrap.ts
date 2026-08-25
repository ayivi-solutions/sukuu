import { prisma } from './prisma';

export type AuthAttemptStatus = 'SUCCESS' | 'FAILED' | 'LOCKED';

export interface AuthBootstrapUser {
  id: string;
  email: string;
  password_hash: string;
  is_active: boolean;
  is_verified: boolean;
  last_login_at: Date | null;
  failed_login_count: number;
  locked_until: Date | null;
  must_reset_password: boolean;
  status: string;
}

export interface AuthBootstrapSession {
  session_id: string;
  user_id: string;
  school_id: string | null;
  role_key: string | null;
  refresh_token_hash: string;
  is_active: boolean;
  expires_at: Date;
  last_activity_at: Date;
  invalidated_at: Date | null;
  user_is_active: boolean;
  user_status: string;
  must_reset_password: boolean;
  auth_assurance: string;
  mfa_verified_at: Date | null;
  step_up_verified_at: Date | null;
  step_up_expires_at: Date | null;
}

export interface AuthVerifiedRole {
  id: string;
  name: string;
  label: string;
}

export interface AuthVerifyResult {
  ok: boolean;
  reason?: 'INVALID' | 'TEMP_LOCK' | 'SUSPENDED' | 'CLOSED' | 'LOCKED' | 'NO_CONTEXT';
  retrySeconds?: number;
  ticketId?: string;
  userId?: string;
  email?: string;
  isVerified?: boolean;
  mustResetPassword?: boolean;
  status?: string;
  schoolId?: string;
  roles?: AuthVerifiedRole[];
}

/**
 * Legacy Stage 3A bootstrap lookup. Kept temporarily so the additive database
 * migration remains backward-compatible with an already-running Stage 3A API.
 * New Stage 3B login code does not use this password-hash-returning path.
 */
export async function lookupAuthUserByEmail(
  email: string
): Promise<AuthBootstrapUser | null> {
  const normalizedEmail = email.trim().toLowerCase();

  const rows = await prisma.$queryRaw<AuthBootstrapUser[]>`
    SELECT * FROM system.auth_lookup_user(${normalizedEmail})
  `;

  return rows[0] ?? null;
}

export async function lookupAuthSession(
  sessionId: string,
  userId: string
): Promise<AuthBootstrapSession | null> {
  const rows = await prisma.$queryRaw<AuthBootstrapSession[]>`
    SELECT * FROM system.auth_lookup_session(${sessionId}, ${userId})
  `;

  return rows[0] ?? null;
}

export async function verifyAuthCredentials(
  email: string,
  password: string,
  ipAddress: string | null,
  userAgent: string | null
): Promise<AuthVerifyResult> {
  const normalizedEmail = email.trim().toLowerCase();

  const rows = await prisma.$queryRaw<Array<{ result: AuthVerifyResult }>>`
    SELECT system.auth_verify_credentials(
      ${normalizedEmail},
      ${password},
      ${ipAddress},
      ${userAgent}
    ) AS result
  `;

  return rows[0]?.result ?? {
    ok: false,
    reason: 'INVALID',
  };
}

export interface AuthRefreshRotationResult {
  ok: boolean;
  reason?:
    | 'INVALID'
    | 'REPLAY'
    | 'NO_RESULT';
  schoolId?: string;
  roleKey?: string;
  mustResetPassword?: boolean;
  expiresAt?: string;
  authAssurance?: string;
}

export async function rotateAuthRefreshSession(
  sessionId: string,
  userId: string,
  presentedRefreshDigest: string,
  newRefreshTokenDigest: string,
  ipAddress: string | null,
  userAgent: string | null
): Promise<AuthRefreshRotationResult> {
  const rows =
    await prisma.$queryRaw<
      Array<{
        result:
          AuthRefreshRotationResult;
      }>
    >`
      SELECT
        system.auth_rotate_refresh_session(
          ${sessionId},
          ${userId},
          ${presentedRefreshDigest},
          ${newRefreshTokenDigest},
          ${ipAddress},
          ${userAgent}
        ) AS result
    `;

  return rows[0]?.result ?? {
    ok: false,
    reason: 'NO_RESULT',
  };
}

export async function finalizeAuthSession(
  ticketId: string,
  sessionId: string,
  refreshTokenDigest: string,
  ipAddress: string | null,
  userAgent: string | null,
  expiresAt: Date
): Promise<void> {
  await prisma.$executeRaw`
    SELECT system.auth_finalize_session(
      ${ticketId},
      ${sessionId},
      ${refreshTokenDigest},
      ${ipAddress},
      ${userAgent},
      ${expiresAt}
    )
  `;
}

export interface AuthMfaLoginMaterial {
  ok: boolean;
  reason?: string;
  required?: boolean;
  method?: string;
  userId?: string;
  schoolId?: string;
  email?: string;
  secretEnvelope?: string;
  lastVerifiedCounter?: number | null;
  lockedUntil?: string | null;
}

export async function requirePrivilegedMfaLogin(
  ticketId: string
) {
  const rows =
    await prisma.$queryRaw<
      Array<{
        result: {
          ok: boolean;
          reason?: string;
          required?: boolean;
          method?: string;
        };
      }>
    >`
      SELECT
        system.auth_mfa_login_requirement(
          ${ticketId}
        ) AS result
    `;

  return rows[0]?.result ?? {
    ok: false,
    reason: 'NO_RESULT',
  };
}

export async function lookupPrivilegedMfaLoginMaterial(
  ticketId: string
): Promise<AuthMfaLoginMaterial> {
  const rows =
    await prisma.$queryRaw<
      Array<{
        result: AuthMfaLoginMaterial;
      }>
    >`
      SELECT
        system.auth_mfa_login_material(
          ${ticketId}
        ) AS result
    `;

  return rows[0]?.result ?? {
    ok: false,
    reason: 'NO_RESULT',
  };
}

export async function recordPrivilegedMfaLoginFailure(
  ticketId: string,
  ipAddress: string | null,
  userAgent: string | null
) {
  const rows =
    await prisma.$queryRaw<
      Array<{
        result: {
          ok: boolean;
          reason?: string;
          failedAttempts?: number;
          lockedUntil?: string | null;
        };
      }>
    >`
      SELECT
        system.auth_mfa_login_record_failure(
          ${ticketId},
          ${ipAddress},
          ${userAgent}
        ) AS result
    `;

  return rows[0]?.result ?? {
    ok: false,
    reason: 'NO_RESULT',
  };
}

export async function finalizeMfaAuthSession(
  ticketId: string,
  sessionId: string,
  refreshTokenDigest: string,
  ipAddress: string | null,
  userAgent: string | null,
  expiresAt: Date,
  counter: bigint,
  proof: string
) {
  const rows =
    await prisma.$queryRaw<
      Array<{
        result: {
          ok: boolean;
          reason?: string;
          assurance?: string;
        };
      }>
    >`
      SELECT
        system.auth_finalize_mfa_session(
          ${ticketId},
          ${sessionId},
          ${refreshTokenDigest},
          ${ipAddress},
          ${userAgent},
          ${expiresAt},
          ${counter},
          ${proof}
        ) AS result
    `;

  return rows[0]?.result ?? {
    ok: false,
    reason: 'NO_RESULT',
  };
}

/**
 * Stage 3A compatibility helper. The new Stage 3B login path does not call it.
 */
export async function recordAuthAttempt(
  userId: string | null,
  status: AuthAttemptStatus,
  ipAddress: string | null,
  userAgent: string | null
): Promise<void> {
  await prisma.$executeRaw`
    SELECT system.auth_record_attempt(
      ${userId},
      ${status},
      ${ipAddress},
      ${userAgent}
    )
  `;
}
