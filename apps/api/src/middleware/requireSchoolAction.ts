import { Response, NextFunction } from 'express';
import { AuthRequest } from './authenticate';
import { evaluateSchoolAction, SchoolAction } from '../lib/schoolAuthorization';

export function requireSchoolAction(action: SchoolAction, purpose: string) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const decision = await evaluateSchoolAction({
        userId: req.userId,
        schoolId: req.schoolId,
        action,
        purpose,
      });
      res.locals.schoolPolicyDecision = decision;
      if (!decision.granted) {
        return res.status(403).json({ error: 'Action not permitted', code: decision.code });
      }
      req.roleKey = decision.matchedRole || req.roleKey;
      next();
    } catch {
      return res.status(500).json({ error: 'Authorization decision failed' });
    }
  };
}
