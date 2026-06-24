import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { getProfile, patchProfile, getSettings } from './school.controller';

export const schoolRouter = Router();

schoolRouter.get('/profile', authenticate, getProfile);
schoolRouter.patch('/profile', authenticate, patchProfile);
schoolRouter.get('/settings', authenticate, getSettings);
