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

export const authRouter = Router();

authRouter.post('/activate-credential', activateCredential);
authRouter.post('/mfa/recovery/start', mfaRecoveryStart);
authRouter.post('/mfa/recovery/verify', mfaRecoveryVerify);
authRouter.post('/login',   login);
authRouter.post('/refresh', refresh);
authRouter.post('/logout',  authenticate, logout);
authRouter.get('/me',       authenticate, me);
authRouter.post('/change-password', authenticate, changePassword);
authRouter.get('/my-access', authenticate, myAccess);

authRouter.get('/mfa/status', authenticate, mfaStatus);
authRouter.post('/mfa/enroll/start', authenticate, mfaEnrollStart);
authRouter.post('/mfa/enroll/verify', authenticate, mfaEnrollVerify);
authRouter.post('/mfa/step-up/verify', authenticate, mfaStepUpVerify);
