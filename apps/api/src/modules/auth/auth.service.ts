import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma';
import { getActiveRoleNames } from '../../lib/roleGrants';

async function logAuthAttempt(userId: string | null, status: 'SUCCESS' | 'FAILED' | 'LOCKED') {
  await prisma.systemAuthenticationLog.create({
    data: { user_id: userId, login_status: status, ip_address: null, user_agent: null },
  });
}

export async function loginUser(email: string, password: string) {
  // Deliberately NOT filtering by is_active here. Every user granted
  // access starts INVITED (is_active: false) — that's correct for the
  // state machine, but it meant this lookup could never find a brand new
  // user at all, so their very first login attempt failed before the
  // password was ever checked. The temp password wasn't wrong; the
  // account was simply invisible to this query. Status-based decisions
  // now happen AFTER the password is verified, not before.
  const user = await prisma.systemUser.findFirst({ where: { email } });
  if (!user) {
    await logAuthAttempt(null, 'FAILED');
    throw new Error('Invalid credentials');
  }

  if (user.locked_until && user.locked_until > new Date()) {
    const secs = Math.ceil((user.locked_until.getTime() - Date.now()) / 1000);
    await logAuthAttempt(user.id, 'LOCKED');
    throw new Error('Account locked — try again in ' + secs + ' seconds');
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    const count = (user.failed_login_count || 0) + 1;
    const backoffMs = count >= 5 ? Math.min(Math.pow(2, count) * 1000, 3600000) : 0;
    await prisma.systemUser.update({
      where: { id: user.id },
      data: {
        failed_login_count: count,
        locked_until: backoffMs > 0 ? new Date(Date.now() + backoffMs) : null,
      },
    });
    await logAuthAttempt(user.id, 'FAILED');
    throw new Error('Invalid credentials');
  }

  // Password is now verified correct — safe to give a specific reason for
  // any further block, since an unauthenticated caller who doesn't know
  // the password never reaches this point (they got a generic "Invalid
  // credentials" above, same as always — no account-existence leak).
  const status = (user as any).status as string;
  if (status === 'SUSPENDED') {
    await logAuthAttempt(user.id, 'FAILED');
    throw new Error('This account is suspended. Contact your administrator.');
  }
  if (status === 'CLOSED') {
    await logAuthAttempt(user.id, 'FAILED');
    throw new Error('This account has been closed. Contact your administrator.');
  }
  if (status === 'LOCKED') {
    await logAuthAttempt(user.id, 'FAILED');
    throw new Error('This account is locked. Contact your administrator.');
  }
  // INVITED / PENDING_VERIFICATION reaching here means the temp password
  // was correct — that's effectively proof of receiving real credentials
  // from a legitimate admin, so this login itself completes activation
  // rather than requiring a separate step the user has no way to trigger.
  if (status === 'INVITED' || status === 'PENDING_VERIFICATION') {
    await prisma.systemUser.update({ where: { id: user.id }, data: { status: 'ACTIVE', is_active: true, is_verified: true, row_version: { increment: 1 } } as any });
  }

  await prisma.systemUser.update({
    where: { id: user.id },
    data: { failed_login_count: 0, locked_until: null, last_login_at: new Date() },
  });
  await logAuthAttempt(user.id, 'SUCCESS');

  const staff = await prisma.staffStaff.findFirst({ where: { user_id: user.id } });
  const employment = staff
    ? await prisma.staffEmployment.findFirst({ where: { staff_id: staff.id, is_current: true } })
    : null;
  const employmentRole = employment
    ? await prisma.systemRole.findFirst({ where: { id: employment.role_id } })
    : null;

  const schoolId = employment?.school_id || '';

  // Full active role set (SystemUserRole grants + the employment fallback
  // — see roleGrants.ts) — this is what requireModuleAccess actually
  // checks, live, on every request. What goes into the JWT below is only
  // a single "primary" role for RLS's superadmin-bypass check and for
  // display; it is NOT the source of authorization truth anymore.
  const activeRoleNames = schoolId ? await getActiveRoleNames(user.id, schoolId) : new Set<string>();
  const primaryRoleKey = activeRoleNames.has('superadmin')
    ? 'superadmin'
    : (employmentRole?.name || [...activeRoleNames][0] || 'school_admin');
  const roleKey = primaryRoleKey;
  // Look up the role matching whatever primaryRoleKey actually resolved
  // to — it may not be employmentRole (e.g. primary ends up 'superadmin'
  // via a SystemUserRole grant while the employment record says
  // 'teacher'), so employmentRole?.label would show the wrong thing.
  const primaryRole = primaryRoleKey === employmentRole?.name
    ? employmentRole
    : await prisma.systemRole.findFirst({ where: { name: primaryRoleKey } });

  const accessToken = jwt.sign(
    { userId: user.id, schoolId, roleKey, staffId: staff?.id || null, mustResetPassword: !!user.must_reset_password },
    process.env.JWT_SECRET!,
    { expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as any }
  );

  const refreshToken = jwt.sign(
    { userId: user.id },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as any }
  );

  await prisma.systemSession.create({
    data: {
      user_id: user.id,
      refresh_token_hash: await bcrypt.hash(refreshToken, 8),
      is_active: true,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      last_activity_at: new Date(),
    },
  });

  if (schoolId) {
    await prisma.systemLog.create({
      data: {
        event_type:  'LOGIN',
        entity_type: 'system_user',
        entity_id:   user.id,
        user_id:     user.id,
        school_id:   schoolId,
        ip_address:  '',
        payload:     JSON.stringify({ email, roleKey }),
      },
    });
  }

  return {
    accessToken,
    refreshToken,
    user: {
      id:        user.id,
      email:     user.email,
      firstName: staff?.first_name  || null,
      lastName:  staff?.last_name   || null,
      staffId:   staff?.id          || null,
      roleKey,
      roleLabel: primaryRole?.label || roleKey,
      roles:     [...activeRoleNames],
      mustResetPassword: !!user.must_reset_password,
    },
    school: { id: schoolId },
  };
}

export async function refreshAccessToken(token: string) {
  const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as any;
  const user = await prisma.systemUser.findUnique({ where: { id: decoded.userId } });
  if (!user || !user.is_active) throw new Error('User not found or inactive');

  const staff = await prisma.staffStaff.findFirst({ where: { user_id: user.id } });
  const employment = staff
    ? await prisma.staffEmployment.findFirst({ where: { staff_id: staff.id, is_current: true } })
    : null;
  const employmentRole = employment
    ? await prisma.systemRole.findFirst({ where: { id: employment.role_id } })
    : null;
  const schoolId = employment?.school_id || '';

  // Same resolution as loginUser — without this, a refreshed token (every
  // 15 minutes, on every active session) would silently fall back to
  // single-role behavior even for a user with an active multi-role grant.
  const activeRoleNames = schoolId ? await getActiveRoleNames(user.id, schoolId) : new Set<string>();
  const primaryRoleKey = activeRoleNames.has('superadmin')
    ? 'superadmin'
    : (employmentRole?.name || [...activeRoleNames][0] || 'school_admin');

  const accessToken = jwt.sign(
    {
      userId:   user.id,
      schoolId,
      roleKey:  primaryRoleKey,
      staffId:  staff?.id || null,
      mustResetPassword: !!user.must_reset_password,
    },
    process.env.JWT_SECRET!,
    { expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as any }
  );

  return { accessToken };
}

/**
 * Self-service — requires knowing the CURRENT password (whether that's
 * the original admin-issued temp password or a password they'd already
 * set), which is what actually completes the must_reset_password loop.
 * Without this, someone told "you must reset your password" would have
 * no way to do it and would be stuck on the admin-issued temp password
 * indefinitely, which defeats the point of it being temporary.
 */
export async function changeOwnPassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await prisma.systemUser.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');

  const valid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!valid) throw new Error('Current password is incorrect');

  if (newPassword.length < 8) throw new Error('New password must be at least 8 characters');

  const hash = await bcrypt.hash(newPassword, 12);
  await prisma.systemUser.update({
    where: { id: userId },
    data: { password_hash: hash, must_reset_password: false, row_version: { increment: 1 } } as any,
  });

  return { success: true };
}
