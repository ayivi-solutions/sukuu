import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  userId?:   string;
  schoolId?: string;
  roleKey?:  string;
  staffId?:  string;
  mustResetPassword?: boolean;
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const token = auth.slice(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    req.userId   = decoded.userId;
    req.schoolId = decoded.schoolId;
    req.roleKey  = decoded.roleKey;
    req.staffId  = decoded.staffId;
    req.mustResetPassword = !!decoded.mustResetPassword;

    // A real boundary, not just a frontend suggestion — must_reset_password
    // used to be data with nothing checking it, which meant a temp
    // password worked exactly like a real one everywhere in the app. Only
    // /api/v1/auth/* stays reachable (change-password itself, logout, me)
    // until the flag clears. req.originalUrl is used rather than req.path
    // because authenticate runs mounted inside many different routers, so
    // req.path alone would be relative to whichever router called it, not
    // the actual full request path.
    if (req.mustResetPassword && !req.originalUrl.startsWith('/api/v1/auth/')) {
      return res.status(403).json({ error: 'You must set a new password before continuing.', mustResetPassword: true });
    }

    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
