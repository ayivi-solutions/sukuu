import { Response, NextFunction } from 'express';
import { AuthRequest } from './authenticate';
import { hasModuleGrant } from '../lib/roleGrants';

/**
 * Signature is UNCHANGED from the original — every one of the 24 modules'
 * routers calls this exactly as before (`requireModuleAccess('exam',
 * 'read')`), so this rewrite touches zero other module files. What changed
 * is entirely internal: this used to trust a single role name frozen into
 * the JWT at login (req.roleKey); it now checks live, against every
 * currently-active role the user holds (see roleGrants.ts), so a role
 * change or a temporary assignment takes effect on the very next request
 * rather than requiring the user to log out and back in.
 */
export function requireModuleAccess(module: string, minLevel: 'read' | 'full') {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId || !req.schoolId) {
        return res.status(403).json({ error: 'No authenticated school context', module, required: minLevel });
      }
      const { granted, matchedRole } = await hasModuleGrant(req.userId, req.schoolId, module, minLevel);
      if (!granted) {
        return res.status(403).json({ error: 'Insufficient module access', module, required: minLevel });
      }
      // Kept for any downstream code that still reads req.roleKey for
      // display purposes — reflects whichever active role actually
      // satisfied this specific check, not a stale JWT claim.
      if (matchedRole) req.roleKey = matchedRole;
      next();
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };
}
