import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma';

async function logAuthAttempt(userId: string | null, status: 'SUCCESS' | 'FAILED' | 'LOCKED') {
  await prisma.systemAuthenticationLog.create({
    data: { user_id: userId, login_status: status, ip_address: null, user_agent: null },
  });
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.systemUser.findFirst({ where: { email, is_active: true } });
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

  await prisma.systemUser.update({
    where: { id: user.id },
    data: { failed_login_count: 0, locked_until: null, last_login_at: new Date() },
  });
  await logAuthAttempt(user.id, 'SUCCESS');

  const staff = await prisma.staffStaff.findFirst({ where: { user_id: user.id } });
  const employment = staff
    ? await prisma.staffEmployment.findFirst({ where: { staff_id: staff.id, is_current: true } })
    : null;
  const role = employment
    ? await prisma.systemRole.findFirst({ where: { id: employment.role_id } })
    : null;

  const schoolId = employment?.school_id || '';
  const roleKey  = role?.name || 'school_admin';

  const accessToken = jwt.sign(
    { userId: user.id, schoolId, roleKey, staffId: staff?.id || null },
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
      roleLabel: role?.label || roleKey,
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
  const role = employment
    ? await prisma.systemRole.findFirst({ where: { id: employment.role_id } })
    : null;

  const accessToken = jwt.sign(
    {
      userId:   user.id,
      schoolId: employment?.school_id || '',
      roleKey:  role?.name || 'school_admin',
      staffId:  staff?.id || null,
    },
    process.env.JWT_SECRET!,
    { expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as any }
  );

  return { accessToken };
}
