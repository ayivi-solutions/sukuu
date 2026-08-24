import {
  Response,
  NextFunction,
} from 'express';

import {
  AuthRequest,
} from './authenticate';


export function requireStepUp(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {

  if (
    req.authAssurance !== 'MFA'
  ) {

    return res
      .status(403)
      .json({
        error:
          'Multi-factor authentication is required for this operation.',
        stepUpRequired:
          true,
      });

  }


  if (
    !req.stepUpExpiresAt ||
    req.stepUpExpiresAt <=
      new Date()
  ) {

    return res
      .status(403)
      .json({
        error:
          'Fresh authentication is required for this operation.',
        stepUpRequired:
          true,
      });

  }


  return next();

}
