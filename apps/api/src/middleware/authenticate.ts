import {
  Request,
  Response,
  NextFunction,
} from 'express';
import jwt from 'jsonwebtoken';
import { lookupAuthSession } from '../lib/authBootstrap';
import { runWithTenantContext } from '../lib/tenantContext';
import {
  isTrustedBrowserRequest,
  isUnsafeMethod,
  readAccessTokenCookie,
} from '../lib/browserAuthTransport';

export interface AuthRequest extends Request {
  userId?: string;
  schoolId?: string;
  roleKey?: string;
  staffId?: string;
  sessionId?: string;
  mustResetPassword?: boolean;
  authAssurance?: string;
  mfaVerifiedAt?: Date | null;
  stepUpVerifiedAt?: Date | null;
  stepUpExpiresAt?: Date | null;
  authTransport?: 'bearer' | 'cookie';
}

export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const authorization =
    req.headers.authorization;

  const bearerToken =
    authorization?.startsWith('Bearer ')
      ? authorization.slice(7)
      : null;

  const cookieToken =
    bearerToken
      ? null
      : readAccessTokenCookie(req);

  const token =
    bearerToken || cookieToken;

  if (!token) {
    return res.status(401).json({
      error: 'No token provided',
    });
  }

  if (
    cookieToken &&
    isUnsafeMethod(req.method) &&
    !isTrustedBrowserRequest(req)
  ) {
    return res.status(403).json({
      error: 'Request origin verification failed',
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as jwt.JwtPayload & {
      userId?: string;
      schoolId?: string;
      roleKey?: string;
      staffId?: string | null;
      sessionId?: string;
      mustResetPassword?: boolean;
    };

    if (
      !decoded.userId ||
      !decoded.sessionId
    ) {
      return res.status(401).json({
        error:
          'A valid session-bound token is required',
      });
    }

    const session =
      await lookupAuthSession(
        decoded.sessionId,
        decoded.userId
      );

    if (
      !session ||
      !session.is_active ||
      session.invalidated_at ||
      session.expires_at <= new Date() ||
      !session.user_is_active ||
      !session.school_id ||
      !session.role_key ||
      [
        'LOCKED',
        'SUSPENDED',
        'CLOSED',
      ].includes(session.user_status)
    ) {
      return res.status(401).json({
        error:
          'Session is no longer active',
      });
    }

    req.authTransport =
      cookieToken
        ? 'cookie'
        : 'bearer';

    // JWT context claims are compatibility data only. Authority is rebuilt
    // from the live server-side session and its current role relationship.
    req.userId = session.user_id;
    req.schoolId = session.school_id;
    req.roleKey = session.role_key;
    req.staffId =
      decoded.staffId || undefined;
    req.sessionId = session.session_id;
    req.mustResetPassword =
      !!session.must_reset_password;
    req.authAssurance =
      session.auth_assurance;
    req.mfaVerifiedAt =
      session.mfa_verified_at;
    req.stepUpVerifiedAt =
      session.step_up_verified_at;
    req.stepUpExpiresAt =
      session.step_up_expires_at;

    if (
      req.mustResetPassword &&
      !req.originalUrl.startsWith(
        '/api/v1/auth/'
      )
    ) {
      return res.status(403).json({
        error:
          'You must set a new password before continuing.',
        mustResetPassword: true,
      });
    }

    return runWithTenantContext(
      {
        sessionId: req.sessionId,
        schoolId: req.schoolId,
        userId: req.userId,
        role: req.roleKey,
      },
      async () => {
        next();
      }
    ).catch(next);
  } catch {
    return res.status(401).json({
      error: 'Invalid or expired token',
    });
  }
}
