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
  refresh_token_hash: string;
  is_active: boolean;
  expires_at: Date;
  last_activity_at: Date;
  invalidated_at: Date | null;
  user_is_active: boolean;
  user_status: string;
  must_reset_password: boolean;
}

/**
 * Narrow pre-authentication lookup.
 *
 * system.system_user is protected by FORCE RLS, so a future non-bypass
 * application role cannot query a user by email before it knows the user's
 * identity. The database migration creates SECURITY DEFINER functions with
 * a fixed search_path and only the minimum fields needed by authentication.
 *
 * Do not replace these with a second privileged PrismaClient. Keeping the
 * bypass inside narrowly-scoped database functions avoids putting a broad
 * owner/BYPASSRLS credential in the API process.
 */
export async function lookupAuthUserByEmail(email: string): Promise<AuthBootstrapUser | null> {
  const normalizedEmail = email.trim().toLowerCase();
  const rows = await prisma.$queryRaw<AuthBootstrapUser[]>`
    SELECT * FROM system.auth_lookup_user(${normalizedEmail})
  `;
  return rows[0] ?? null;
}

/**
 * Session lookup is bound to BOTH the signed JWT's session id and user id.
 * This prevents a caller from using one valid claim with another user's
 * session identifier.
 */
export async function lookupAuthSession(
  sessionId: string,
  userId: string
): Promise<AuthBootstrapSession | null> {
  const rows = await prisma.$queryRaw<AuthBootstrapSession[]>`
    SELECT * FROM system.auth_lookup_session(${sessionId}, ${userId})
  `;
  return rows[0] ?? null;
}

/**
 * Authentication attempts must also be recordable before an RLS identity
 * context exists (including unknown-email failures where user_id is NULL).
 * The SQL function validates the status and owns the insert.
 */
export async function recordAuthAttempt(
  userId: string | null,
  status: AuthAttemptStatus,
  ipAddress: string | null,
  userAgent: string | null
): Promise<void> {
  await prisma.$executeRaw`
    SELECT system.auth_record_attempt(${userId}, ${status}, ${ipAddress}, ${userAgent})
  `;
}
