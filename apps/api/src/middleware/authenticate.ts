import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { lookupAuthSession } from '../lib/authBootstrap';

export interface AuthRequest extends Request {
  userId?: string;
  schoolId?: string;
  roleKey?: string;
  staffId?: string;
  sessionId?: string;
  mustResetPassword?: boolean;
}

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const token = auth.slice(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as jwt.JwtPayload & {
      userId?: string;
      schoolId?: string;
      roleKey?: string;
      staffId?: string | null;
      sessionId?: string;
      mustResetPassword?: boolean;
    };

    if (!decoded.userId) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    let mustResetPassword = !!decoded.mustResetPassword;

    if (decoded.sessionId) {
      // Stage 3A access tokens are session-bound. This makes logout and
      // administrative/session revocation effective immediately instead of
      // waiting for the 15-minute access-token expiry.
      const session = await lookupAuthSession(decoded.sessionId, decoded.userId);

      if (
        !session ||
        !session.is_active ||
        session.invalidated_at ||
        session.expires_at <= new Date() ||
        !session.user_is_active ||
        ['LOCKED', 'SUSPENDED', 'CLOSED'].includes(session.user_status)
      ) {
        return res.status(401).json({ error: 'Session is no longer active' });
      }

      mustResetPassword = !!session.must_reset_password;
    }

    // Access tokens issued before Stage 3A do not contain sessionId. They
    // remain valid only until their normal short access-token expiry. Their
    // old refresh tokens cannot be refreshed and therefore converge to a
    // fresh session-bound login without an abrupt all-user cut-off.

    req.userId = decoded.userId;
    req.schoolId = decoded.schoolId;
    req.roleKey = decoded.roleKey;
    req.staffId = decoded.staffId || undefined;
    req.sessionId = decoded.sessionId;
    req.mustResetPassword = mustResetPassword;

    if (req.mustResetPassword && !req.originalUrl.startsWith('/api/v1/auth/')) {
      return res.status(403).json({
        error: 'You must set a new password before continuing.',
        mustResetPassword: true,
      });
    }

    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
