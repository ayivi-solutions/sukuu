import { Router } from 'express';
import { login, refresh, logout, me, changePassword, myAccess, activateCredential } from './auth.controller';
import { authenticate } from '../../middleware/authenticate';

export const authRouter = Router();

authRouter.post('/activate-credential', activateCredential);
authRouter.post('/login',   login);
authRouter.post('/refresh', refresh);
authRouter.post('/logout',  authenticate, logout);
authRouter.get('/me',       authenticate, me);
authRouter.post('/change-password', authenticate, changePassword);
authRouter.get('/my-access', authenticate, myAccess);
