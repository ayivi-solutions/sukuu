import { Response, NextFunction } from 'express';
import { AuthRequest } from './authenticate';
import { runWithTenantContext } from '../lib/tenantContext';

/**
 * Must run AFTER authenticate (needs req.schoolId/userId/roleKey already
 * populated). Wraps the rest of the request in AsyncLocalStorage so every
 * withTenantContext() call downstream — in any service function, without
 * needing the context threaded through every function signature — picks up
 * the correct actor automatically.
 */
export function attachTenantContext(req: AuthRequest, res: Response, next: NextFunction) {
  runWithTenantContext(
    { schoolId: req.schoolId || '', userId: req.userId || '', role: req.roleKey || '' },
    async () => next()
  ).catch(next);
}
