import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { lookupAuthSession } from '../lib/authBootstrap';
import { runWithTenantContext } from '../lib/tenantContext';

export interface AuthRequest extends Request {
  userId?: string;
  schoolId?: string;
  roleKey?: string;
  staffId?: string;
  sessionId?: string;
  mustResetPassword?: boolean;
}

export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const auth = req.headers.authorization;

  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'No token provided',
    });
  }

  try {
    const token = auth.slice(7);

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

    if (!decoded.userId || !decoded.sessionId) {
      return res.status(401).json({
        error: 'A valid session-bound token is required',
      });
    }

    const session = await lookupAuthSession(
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
      ['LOCKED', 'SUSPENDED', 'CLOSED'].includes(session.user_status)
    ) {
      return res.status(401).json({
        error: 'Session is no longer active',
      });
    }

    // The JWT's schoolId/roleKey are compatibility claims only.
    // Authority is reconstructed from the server-side session and live roles.
    req.userId = session.user_id;
    req.schoolId = session.school_id;
    req.roleKey = session.role_key;
    req.staffId = decoded.staffId || undefined;
    req.sessionId = session.session_id;
    req.mustResetPassword = !!session.must_reset_password;

    if (
      req.mustResetPassword &&
      !req.originalUrl.startsWith('/api/v1/auth/')
    ) {
      return res.status(403).json({
        error: 'You must set a new password before continuing.',
        mustResetPassword: true,
      });
    }

    // Universal request scope: all 24 modules now inherit the authenticated
    // session context, including shared audit helpers.
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
