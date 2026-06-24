import { Response, NextFunction } from 'express';
import { AuthRequest } from './authenticate';

export function authorize(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.roleKey || !roles.includes(req.roleKey)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        required: roles,
        current: req.roleKey || 'none',
      });
    }
    next();
  };
}
