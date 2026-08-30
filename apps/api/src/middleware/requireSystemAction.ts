import {
  Response,
  NextFunction,
} from 'express';
import {
  AuthRequest,
} from './authenticate';
import {
  evaluateSystemAction,
  SystemAction,
} from '../lib/systemAuthorization';

export function requireSystemAction(
  action: SystemAction,
  purpose: string
) {
  return async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const decision =
        await evaluateSystemAction({
          userId: req.userId,
          schoolId: req.schoolId,
          action,
          purpose,
        });

      res.locals.systemPolicyDecision =
        decision;

      if (!decision.granted) {
        return res.status(403).json({
          error: 'Action not permitted',
          code: decision.code,
        });
      }

      req.roleKey =
        decision.matchedRole ||
        req.roleKey;

      next();
    } catch {
      return res.status(500).json({
        error: 'Authorization decision failed',
      });
    }
  };
}
