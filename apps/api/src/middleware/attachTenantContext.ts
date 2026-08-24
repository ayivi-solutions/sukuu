import { Response, NextFunction } from 'express';
import { AuthRequest } from './authenticate';
import {
  getTenantContext,
  runWithTenantContext,
} from '../lib/tenantContext';

/**
 * Compatibility middleware for routers that already use it explicitly.
 * authenticate() now establishes the ambient request scope globally.
 */
export function attachTenantContext(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) {
  if (getTenantContext()) {
    next();
    return;
  }

  runWithTenantContext(
    {
      sessionId: req.sessionId,
      schoolId: req.schoolId || '',
      userId: req.userId || '',
      role: req.roleKey || '',
    },
    async () => {
      next();
    }
  ).catch(next);
}
