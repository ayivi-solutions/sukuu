import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { prisma } from '../../lib/prisma';
import { withTenantContext } from '../../lib/tenantContext';
import {
  finalizeAuthSession,
  lookupAuthSession,
  verifyAuthCredentials,
  type AuthVerifiedRole,
} from '../../lib/authBootstrap';

export interface AuthMeta {
  ipAddress?: string | null;
  userAgent?: string | null;
}

function isBlockedAccountStatus(
  status: string
): boolean {
  return (
    status === 'SUSPENDED' ||
    status === 'CLOSED' ||
    status === 'LOCKED'
  );
}

function verificationFailure(result: {
  reason?: string;
  retrySeconds?: number;
}): Error {
  switch (result.reason) {
    case 'TEMP_LOCK':
      return new Error(
        'Account locked - try again in ' +
          Math.max(
            1,
            Number(result.retrySeconds || 1)
          ) +
          ' seconds'
      );

    case 'SUSPENDED':
      return new Error(
        'This account is suspended. Contact your administrator.'
      );

    case 'CLOSED':
      return new Error(
        'This account has been closed. Contact your administrator.'
      );

    case 'LOCKED':
      return new Error(
        'This account is locked. Contact your administrator.'
      );

    case 'NO_CONTEXT':
      return new Error(
        'This account does not have one valid active school context. Contact your administrator.'
      );

    default:
      return new Error('Invalid credentials');
  }
}

async function resolveLoginPresentation(
  userId: string,
  roles: AuthVerifiedRole[]
) {
  const staff =
    await prisma.staffStaff.findFirst({
      where: { user_id: userId },
    });

  const employment = staff
    ? await prisma.staffEmployment.findFirst({
        where: {
          staff_id: staff.id,
          is_current: true,
        },
      })
    : null;

  const activeRoleNames =
    new Set(
      roles.map(role => role.name)
    );

  const primaryRole =
    roles.find(
      role => role.name === 'superadmin'
    ) ||
    roles.find(
      role => role.id === employment?.role_id
    ) ||
    roles[0];

  if (!primaryRole) {
    throw new Error(
      'No active role is available for this account.'
    );
  }

  return {
    staff,
    activeRoleNames,
    primaryRoleKey: primaryRole.name,
    primaryRoleLabel:
      primaryRole.label || primaryRole.name,
  };
}

export async function loginUser(
  email: string,
  password: string,
  meta: AuthMeta = {}
) {
  const verified =
    await verifyAuthCredentials(
      email,
      password,
      meta.ipAddress ?? null,
      meta.userAgent ?? null
    );

  if (
    !verified.ok ||
    !verified.ticketId ||
    !verified.userId ||
    !verified.email ||
    !verified.schoolId ||
    !verified.roles?.length
  ) {
    throw verificationFailure(verified);
  }

  const {
    staff,
    activeRoleNames,
    primaryRoleKey,
    primaryRoleLabel,
  } = await resolveLoginPresentation(
    verified.userId,
    verified.roles
  );

  const sessionId = randomUUID();

  const accessToken = jwt.sign(
    {
      userId: verified.userId,
      schoolId: verified.schoolId,
      roleKey: primaryRoleKey,
      staffId: staff?.id || null,
      sessionId,
      mustResetPassword:
        !!verified.mustResetPassword,
    },
    process.env.JWT_SECRET!,
    {
      expiresIn:
        (process.env.JWT_EXPIRES_IN ||
          '15m') as any,
    }
  );

  const refreshToken = jwt.sign(
    {
      userId: verified.userId,
      sessionId,
    },
    process.env.JWT_REFRESH_SECRET!,
    {
      expiresIn:
        (process.env.JWT_REFRESH_EXPIRES_IN ||
          '7d') as any,
    }
  );

  const refreshClaims =
    jwt.decode(
      refreshToken
    ) as jwt.JwtPayload | null;

  if (!refreshClaims?.exp) {
    throw new Error(
      'Could not determine refresh-token expiry'
    );
  }

  const refreshTokenHash =
    await bcrypt.hash(
      refreshToken,
      10
    );

  await finalizeAuthSession(
    verified.ticketId,
    sessionId,
    refreshTokenHash,
    meta.ipAddress ?? null,
    meta.userAgent ?? null,
    new Date(refreshClaims.exp * 1000)
  );

  await withTenantContext(
    {
      sessionId,
      schoolId: verified.schoolId,
      userId: verified.userId,
      role: primaryRoleKey,
    },
    tx => tx.systemLog.create({
      data: {
        event_type: 'LOGIN',
        entity_type: 'system_user',
        entity_id: verified.userId,
        user_id: verified.userId,
        school_id: verified.schoolId,
        ip_address:
          meta.ipAddress ?? '',
        payload: JSON.stringify({
          email: verified.email,
          roleKey: primaryRoleKey,
          sessionId,
        }),
      },
    })
  );

  return {
    accessToken,
    refreshToken,
    user: {
      id: verified.userId,
      email: verified.email,
      firstName:
        staff?.first_name || null,
      lastName:
        staff?.last_name || null,
      staffId:
        staff?.id || null,
      roleKey:
        primaryRoleKey,
      roleLabel:
        primaryRoleLabel,
      roles:
        [...activeRoleNames],
      mustResetPassword:
        !!verified.mustResetPassword,
    },
    school: {
      id: verified.schoolId,
    },
  };
}

export async function refreshAccessToken(
  token: string
) {
  const decoded = jwt.verify(
    token,
    process.env.JWT_REFRESH_SECRET!
  ) as jwt.JwtPayload & {
    userId?: string;
    sessionId?: string;
  };

  if (
    !decoded.userId ||
    !decoded.sessionId
  ) {
    throw new Error(
      'Refresh session is not valid. Please sign in again.'
    );
  }

  const session =
    await lookupAuthSession(
      decoded.sessionId,
      decoded.userId
    );

  if (
    !session ||
    session.user_id !== decoded.userId ||
    !session.is_active ||
    session.invalidated_at ||
    session.expires_at <= new Date() ||
    !session.school_id ||
    !session.role_key
  ) {
    throw new Error(
      'Session is no longer active'
    );
  }

  if (
    !session.user_is_active ||
    isBlockedAccountStatus(
      session.user_status
    )
  ) {
    throw new Error(
      'User not found or inactive'
    );
  }

  const tokenMatchesSession =
    await bcrypt.compare(
      token,
      session.refresh_token_hash
    );

  if (!tokenMatchesSession) {
    throw new Error(
      'Refresh token does not match the active session'
    );
  }

  const staff =
    await prisma.staffStaff.findFirst({
      where: {
        user_id: decoded.userId,
      },
    });

  await withTenantContext(
    {
      sessionId:
        session.session_id,
      schoolId:
        session.school_id,
      userId:
        decoded.userId,
      role:
        session.role_key,
    },
    tx => tx.systemSession.update({
      where: {
        id: session.session_id,
      },
      data: {
        last_activity_at:
          new Date(),
      },
    })
  );

  const accessToken = jwt.sign(
    {
      userId:
        decoded.userId,
      schoolId:
        session.school_id,
      roleKey:
        session.role_key,
      staffId:
        staff?.id || null,
      sessionId:
        session.session_id,
      mustResetPassword:
        !!session.must_reset_password,
    },
    process.env.JWT_SECRET!,
    {
      expiresIn:
        (process.env.JWT_EXPIRES_IN ||
          '15m') as any,
    }
  );

  return {
    accessToken,
  };
}

export async function logoutSession(
  userId: string,
  sessionId?: string
) {
  if (!sessionId) {
    throw new Error(
      'A session-bound login is required to log out.'
    );
  }

  const now = new Date();

  await withTenantContext(
    {
      sessionId,
      schoolId: '',
      userId,
      role: '',
    },
    tx => tx.systemSession.updateMany({
      where: {
        id: sessionId,
        user_id: userId,
        is_active: true,
      },
      data: {
        is_active: false,
        invalidated_at: now,
        last_activity_at: now,
      },
    })
  );

  return {
    success: true,
  };
}

export async function changeOwnPassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
  currentSessionId?: string
) {
  if (!currentSessionId) {
    throw new Error(
      'A session-bound login is required to change password.'
    );
  }

  const context = {
    sessionId: currentSessionId,
    schoolId: '',
    userId,
    role: '',
  };

  const user =
    await withTenantContext(
      context,
      tx => tx.systemUser.findUnique({
        where: { id: userId },
      })
    );

  if (!user) {
    throw new Error(
      'User not found'
    );
  }

  const valid =
    await bcrypt.compare(
      currentPassword,
      user.password_hash
    );

  if (!valid) {
    throw new Error(
      'Current password is incorrect'
    );
  }

  if (newPassword.length < 8) {
    throw new Error(
      'New password must be at least 8 characters'
    );
  }

  const hash =
    await bcrypt.hash(
      newPassword,
      12
    );

  const now = new Date();

  await withTenantContext(
    context,
    async tx => {
      await tx.systemUser.update({
        where: {
          id: userId,
        },
        data: {
          password_hash: hash,
          must_reset_password: false,
          row_version: {
            increment: 1,
          },
        } as any,
      });

      await tx.systemSession.updateMany({
        where: {
          user_id: userId,
          is_active: true,
          id: {
            not: currentSessionId,
          },
        },
        data: {
          is_active: false,
          invalidated_at: now,
          last_activity_at: now,
        },
      });
    }
  );

  return {
    success: true,
  };
}
