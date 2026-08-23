import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireModuleAccess } from '../../middleware/requireModuleAccess';
import * as ctrl from './analytics.controller';

export const analyticsRouter = Router();
const R = requireModuleAccess('analytics', 'read');
const F = requireModuleAccess('analytics', 'full');

analyticsRouter.get('/kpis', authenticate, R, ctrl.getKpis);
analyticsRouter.post('/kpis', authenticate, F, ctrl.postKpi);

analyticsRouter.get('/student-risks', authenticate, R, ctrl.getStudentRisks);
analyticsRouter.post('/student-risks', authenticate, F, ctrl.postStudentRisk);

analyticsRouter.get('/reports', authenticate, R, ctrl.getReports);
analyticsRouter.post('/reports', authenticate, F, ctrl.postReport);

analyticsRouter.get('/events', authenticate, R, ctrl.getEvents);
analyticsRouter.post('/events', authenticate, F, ctrl.postEvent);

analyticsRouter.get('/summary', authenticate, R, ctrl.getSummary);
