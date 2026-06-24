import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  userId?:   string;
  schoolId?: string;
  roleKey?:  string;
  staffId?:  string;
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
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
