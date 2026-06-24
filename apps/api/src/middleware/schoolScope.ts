import { Response, NextFunction } from 'express';
import { AuthRequest } from './authenticate';

export function schoolScope(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.schoolId) {
    return res.status(403).json({ error: 'No school context in token' });
  }
  next();
}
