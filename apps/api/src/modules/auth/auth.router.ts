import { Router } from 'express';
import { login, refresh, logout, me, changePassword } from './auth.controller';
import { authenticate } from '../../middleware/authenticate';

export const authRouter = Router();

authRouter.post('/login',   login);
authRouter.post('/refresh', refresh);
authRouter.post('/logout',  authenticate, logout);
authRouter.get('/me',       authenticate, me);
authRouter.post('/change-password', authenticate, changePassword);
