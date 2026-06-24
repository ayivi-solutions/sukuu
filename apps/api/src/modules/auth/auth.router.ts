import { Router } from 'express';
import { login, refresh, logout, me } from './auth.controller';
import { authenticate } from '../../middleware/authenticate';

export const authRouter = Router();

authRouter.post('/login',   login);
authRouter.post('/refresh', refresh);
authRouter.post('/logout',  authenticate, logout);
authRouter.get('/me',       authenticate, me);
