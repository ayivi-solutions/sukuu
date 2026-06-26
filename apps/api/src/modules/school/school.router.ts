import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import {
  getProfile, patchProfile, getSettings,
  getAccreditations, postAccreditation, patchArchiveAccreditation, getSchoolAuditLog,
} from './school.controller';
export const schoolRouter = Router();
schoolRouter.get('/profile', authenticate, getProfile);
schoolRouter.patch('/profile', authenticate, patchProfile);
schoolRouter.get('/settings', authenticate, getSettings);
schoolRouter.get('/accreditations', authenticate, getAccreditations);
schoolRouter.post('/accreditations', authenticate, postAccreditation);
schoolRouter.patch('/accreditations/:accreditationId/archive', authenticate, patchArchiveAccreditation);
schoolRouter.get('/audit-log', authenticate, getSchoolAuditLog);
