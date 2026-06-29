import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireModuleAccess } from '../../middleware/requireModuleAccess';
import * as ctrl from './attendance.controller';

export const attendanceRouter = Router();
const R = requireModuleAccess('attendance', 'read');
const F = requireModuleAccess('attendance', 'full');

attendanceRouter.get('/sessions', authenticate, R, ctrl.getSessions);
attendanceRouter.post('/sessions', authenticate, F, ctrl.postSession);
attendanceRouter.patch('/sessions/:id', authenticate, F, ctrl.patchSession);
attendanceRouter.patch('/sessions/:id/archive', authenticate, F, ctrl.patchArchiveSession);

attendanceRouter.get('/sessions/:id/marks', authenticate, R, ctrl.getSessionMarks);
attendanceRouter.post('/sessions/:id/marks', authenticate, F, ctrl.postMark);
attendanceRouter.post('/sessions/:id/marks/bulk', authenticate, F, ctrl.postBulkMark);
attendanceRouter.patch('/marks/:id', authenticate, F, ctrl.patchMark);
attendanceRouter.patch('/marks/:id/archive', authenticate, F, ctrl.patchArchiveMark);
attendanceRouter.get('/students/:studentId/history', authenticate, R, ctrl.getStudentHistory);

attendanceRouter.get('/devices', authenticate, R, ctrl.getDevices);
attendanceRouter.post('/devices', authenticate, F, ctrl.postDevice);
attendanceRouter.patch('/devices/:id', authenticate, F, ctrl.patchDevice);

attendanceRouter.get('/events', authenticate, R, ctrl.getEvents);
attendanceRouter.post('/events', authenticate, F, ctrl.postEvent);
attendanceRouter.post('/events/:id/process', authenticate, F, ctrl.postProcessEvent);

attendanceRouter.get('/exceptions', authenticate, R, ctrl.getExceptions);
attendanceRouter.post('/exceptions', authenticate, F, ctrl.postException);
attendanceRouter.patch('/exceptions/:id', authenticate, F, ctrl.patchException);
attendanceRouter.patch('/exceptions/:id/archive', authenticate, F, ctrl.patchArchiveException);

attendanceRouter.get('/policies', authenticate, R, ctrl.getPolicies);
attendanceRouter.post('/policies', authenticate, F, ctrl.postPolicy);
attendanceRouter.patch('/policies/:id', authenticate, F, ctrl.patchPolicy);
attendanceRouter.patch('/policies/:id/archive', authenticate, F, ctrl.patchArchivePolicy);

attendanceRouter.get('/students/:studentId/summaries', authenticate, R, ctrl.getStudentSummaries);
attendanceRouter.get('/summaries', authenticate, R, ctrl.getClassSummaries);
