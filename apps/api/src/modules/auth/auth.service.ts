import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { prisma } from '../../lib/prisma';
import { getActiveRoleNames } from '../../lib/roleGrants';
import { withTenantContext } from '../../lib/tenantContext';
import {
  lookupAuthSession,
  lookupAuthUserByEmail,
  recordAuthAttempt,
  type AuthAttemptStatus,
} from '../../lib/authBootstrap';

export interface AuthMeta {
  ipAddress?: string | null;
  userAgent?: string | null;
}

async function logAuthAttempt(
  userId: string | null,
  status: AuthAttemptStatus,
  meta: AuthMeta = {}
) {
  await recordAuthAttempt(
    userId,
    status,
    meta.ipAddress ?? null,
    meta.userAgent ?? null
  );
}

function isBlockedAccountStatus(status: string): boolean {
  return status === 'SUSPENDED' || status === 'CLOSED' || status === 'LOCKED';
}

async function resolveUserContext(userId: string) {
  const staff = await prisma.staffStaff.findFirst({ where: { user_id: userId } });
  const employment = staff
    ? await prisma.staffEmployment.findFirst({ where: { staff_id: staff.id, is_current: true } })
    : null;

  const schoolId = employment?.school_id || '';

  const employmentRole = employment
    ? await withTenantContext(
        { schoolId, userId, role: '' },
        tx => tx.systemRole.findFirst({ where: { id: employment.role_id } })
      )
    : null;

  const activeRoleNames = schoolId
    ? await getActiveRoleNames(userId, schoolId)
    : new Set<string>();

  const primaryRoleKey = activeRoleNames.has('superadmin')
    ? 'superadmin'
    : (employmentRole?.name || [...activeRoleNames][0] || 'school_admin');

  const primaryRole = await withTenantContext(
    { schoolId, userId, role: '' },
    tx => tx.systemRole.findFirst({ where: { name: primaryRoleKey } })
  );

  return {
    staff,
    employment,
    schoolId,
    activeRoleNames,
    primaryRoleKey,
    primaryRole,
  };
}

export async function loginUser(email: string, password: string, meta: AuthMeta = {}) {
  // Pre-authentication lookup goes through the narrow SECURITY DEFINER
  // function introduced by Stage 3A. This is the bootstrap that lets the
  // application later run as sukuu_app_runtime without weakening RLS.
  const user = await lookupAuthUserByEmail(email);

  if (!user) {
    await logAuthAttempt(null, 'FAILED', meta);
    throw new Error('Invalid credentials');
  }

  if (user.locked_until && user.locked_until > new Date()) {
    const secs = Math.ceil((user.locked_until.getTime() - Date.now()) / 1000);
    await logAuthAttempt(user.id, 'LOCKED', meta);
    throw new Error('Account locked — try again in ' + secs + ' seconds');
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    const count = (user.failed_login_count || 0) + 1;
    const backoffMs = count >= 5 ? Math.min(Math.pow(2, count) * 1000, 3600000) : 0;

    await withTenantContext(
      { schoolId: '', userId: user.id, role: '' },
      tx => tx.systemUser.update({
        where: { id: user.id },
        data: {
          failed_login_count: count,
          locked_until: backoffMs > 0 ? new Date(Date.now() + backoffMs) : null,
        },
      })
    );

    await logAuthAttempt(user.id, 'FAILED', meta);
    throw new Error('Invalid credentials');
  }

  // A specific account-state reason is only returned after the password has
  // already been proven, avoiding account-existence disclosure.
  if (user.status === 'SUSPENDED') {
    await logAuthAttempt(user.id, 'FAILED', meta);
    throw new Error('This account is suspended. Contact your administrator.');
  }
  if (user.status === 'CLOSED') {
    await logAuthAttempt(user.id, 'FAILED', meta);
    throw new Error('This account has been closed. Contact your administrator.');
  }
  if (user.status === 'LOCKED') {
    await logAuthAttempt(user.id, 'FAILED', meta);
    throw new Error('This account is locked. Contact your administrator.');
  }

  const activationData =
    user.status === 'INVITED' || user.status === 'PENDING_VERIFICATION'
      ? {
          status: 'ACTIVE',
          is_active: true,
          is_verified: true,
          row_version: { increment: 1 },
        }
      : {};

  await withTenantContext(
    { schoolId: '', userId: user.id, role: '' },
    tx => tx.systemUser.update({
      where: { id: user.id },
      data: {
        ...activationData,
        failed_login_count: 0,
        locked_until: null,
        last_login_at: new Date(),
      } as any,
    })
  );

  await logAuthAttempt(user.id, 'SUCCESS', meta);

  const {
    staff,
    schoolId,
    activeRoleNames,
    primaryRoleKey,
    primaryRole,
  } = await resolveUserContext(user.id);

  const sessionId = randomUUID();

  const accessToken = jwt.sign(
    {
      userId: user.id,
      schoolId,
      roleKey: primaryRoleKey,
      staffId: staff?.id || null,
      sessionId,
      mustResetPassword: !!user.must_reset_password,
    },
    process.env.JWT_SECRET!,
    { expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as any }
  );

  const refreshToken = jwt.sign(
    { userId: user.id, sessionId },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as any }
  );

  const refreshClaims = jwt.decode(refreshToken) as jwt.JwtPayload | null;
  if (!refreshClaims?.exp) {
    throw new Error('Could not determine refresh-token expiry');
  }

  await withTenantContext(
    { schoolId, userId: user.id, role: primaryRoleKey },
    tx => tx.systemSession.create({
      data: {
        id: sessionId,
        user_id: user.id,
        refresh_token_hash: bcrypt.hashSync(refreshToken, 10),
        ip_address: meta.ipAddress ?? null,
        user_agent: meta.userAgent ?? null,
        is_active: true,
        expires_at: new Date(refreshClaims.exp * 1000),
        last_activity_at: new Date(),
      },
    })
  );

  if (schoolId) {
    await withTenantContext(
      { schoolId, userId: user.id, role: primaryRoleKey },
      tx => tx.systemLog.create({
        data: {
          event_type: 'LOGIN',
          entity_type: 'system_user',
          entity_id: user.id,
          user_id: user.id,
          school_id: schoolId,
          ip_address: meta.ipAddress ?? '',
          payload: JSON.stringify({ email: user.email, roleKey: primaryRoleKey, sessionId }),
        },
      })
    );
  }

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      firstName: staff?.first_name || null,
      lastName: staff?.last_name || null,
      staffId: staff?.id || null,
      roleKey: primaryRoleKey,
      roleLabel: primaryRole?.label || primaryRoleKey,
      roles: [...activeRoleNames],
      mustResetPassword: !!user.must_reset_password,
    },
    school: { id: schoolId },
  };
}

export async function refreshAccessToken(token: string) {
  const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as jwt.JwtPayload & {
    userId?: string;
    sessionId?: string;
  };

  if (!decoded.userId || !decoded.sessionId) {
    // Refresh tokens issued before Stage 3A deliberately require a fresh
    // sign-in because they cannot be bound to a server-side session row.
    throw new Error('Refresh session is not valid. Please sign in again.');
  }

  const session = await lookupAuthSession(decoded.sessionId, decoded.userId);
  if (
    !session ||
    session.user_id !== decoded.userId ||
    !session.is_active ||
    session.invalidated_at ||
    session.expires_at <= new Date()
  ) {
    throw new Error('Session is no longer active');
  }

  if (!session.user_is_active || isBlockedAccountStatus(session.user_status)) {
    throw new Error('User not found or inactive');
  }

  const tokenMatchesSession = await bcrypt.compare(token, session.refresh_token_hash);
  if (!tokenMatchesSession) {
    throw new Error('Refresh token does not match the active session');
  }

  const {
    staff,
    schoolId,
    primaryRoleKey,
  } = await resolveUserContext(decoded.userId);

  await withTenantContext(
    { schoolId, userId: decoded.userId, role: primaryRoleKey },
    tx => tx.systemSession.update({
      where: { id: session.session_id },
      data: { last_activity_at: new Date() },
    })
  );

  const accessToken = jwt.sign(
    {
      userId: decoded.userId,
      schoolId,
      roleKey: primaryRoleKey,
      staffId: staff?.id || null,
      sessionId: session.session_id,
      mustResetPassword: !!session.must_reset_password,
    },
    process.env.JWT_SECRET!,
    { expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as any }
  );

  return { accessToken };
}

export async function logoutSession(userId: string, sessionId?: string) {
  const now = new Date();

  await withTenantContext(
    { schoolId: '', userId, role: '' },
    tx => tx.systemSession.updateMany({
      where: sessionId
        ? { id: sessionId, user_id: userId, is_active: true }
        : { user_id: userId, is_active: true },
      data: {
        is_active: false,
        invalidated_at: now,
        last_activity_at: now,
      },
    })
  );

  return { success: true };
}

/**
 * Self-service password change. The current session remains active, while
 * all other active sessions are invalidated. For a transitional legacy
 * access token with no session id, every active session is invalidated.
 */
export async function changeOwnPassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
  currentSessionId?: string
) {
  const user = await withTenantContext(
    { schoolId: '', userId, role: '' },
    tx => tx.systemUser.findUnique({ where: { id: userId } })
  );
  if (!user) throw new Error('User not found');

  const valid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!valid) throw new Error('Current password is incorrect');

  if (newPassword.length < 8) {
    throw new Error('New password must be at least 8 characters');
  }

  const hash = await bcrypt.hash(newPassword, 12);
  const now = new Date();

  await withTenantContext(
    { schoolId: '', userId, role: '' },
    async tx => {
      await tx.systemUser.update({
        where: { id: userId },
        data: {
          password_hash: hash,
          must_reset_password: false,
          row_version: { increment: 1 },
        } as any,
      });

      await tx.systemSession.updateMany({
        where: {
          user_id: userId,
          is_active: true,
          ...(currentSessionId ? { id: { not: currentSessionId } } : {}),
        },
        data: {
          is_active: false,
          invalidated_at: now,
          last_activity_at: now,
        },
      });
    }
  );

  return { success: true };
}
