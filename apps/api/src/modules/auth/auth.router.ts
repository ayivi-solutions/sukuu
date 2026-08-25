import { Router } from 'express';
import {
  login,
  refresh,
  logout,
  me,
  changePassword,
  myAccess,
  activateCredential,
  mfaStatus,
  mfaEnrollStart,
  mfaEnrollVerify,
  mfaStepUpVerify,
  mfaRecoveryStart,
  mfaRecoveryVerify,
} from './auth.controller';
import { authenticate } from '../../middleware/authenticate';
import {
  authActivationIpLimiter,
  authActivationTokenLimiter,
  authLoginIdentityLimiter,
  authLoginIpLimiter,
  authMfaActionLimiter,
  authMfaVerifyLimiter,
  authPasswordChangeLimiter,
  authRecoveryIdentityLimiter,
  authRecoveryIpLimiter,
  authRefreshIpLimiter,
  authRefreshTokenLimiter,
} from '../../middleware/rateLimiter';

export const authRouter = Router();

authRouter.post(
  '/activate-credential',
  authActivationIpLimiter,
  authActivationTokenLimiter,
  activateCredential
);

authRouter.post(
  '/mfa/recovery/start',
  authRecoveryIpLimiter,
  authRecoveryIdentityLimiter,
  mfaRecoveryStart
);

authRouter.post(
  '/mfa/recovery/verify',
  authRecoveryIpLimiter,
  authRecoveryIdentityLimiter,
  mfaRecoveryVerify
);

authRouter.post(
  '/login',
  authLoginIpLimiter,
  authLoginIdentityLimiter,
  login
);

authRouter.post(
  '/refresh',
  authRefreshIpLimiter,
  authRefreshTokenLimiter,
  refresh
);

authRouter.post(
  '/logout',
  authenticate,
  logout
);

authRouter.get(
  '/me',
  authenticate,
  me
);

authRouter.post(
  '/change-password',
  authenticate,
  authPasswordChangeLimiter,
  changePassword
);

authRouter.get(
  '/my-access',
  authenticate,
  myAccess
);

authRouter.get(
  '/mfa/status',
  authenticate,
  mfaStatus
);

authRouter.post(
  '/mfa/enroll/start',
  authenticate,
  authMfaActionLimiter,
  mfaEnrollStart
);

authRouter.post(
  '/mfa/enroll/verify',
  authenticate,
  authMfaVerifyLimiter,
  mfaEnrollVerify
);

authRouter.post(
  '/mfa/step-up/verify',
  authenticate,
  authMfaVerifyLimiter,
  mfaStepUpVerify
);
