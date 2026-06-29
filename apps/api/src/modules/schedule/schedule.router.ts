import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireModuleAccess } from '../../middleware/requireModuleAccess';
import * as ctrl from './schedule.controller';

export const scheduleRouter = Router();
const R = requireModuleAccess('schedule', 'read');
const F = requireModuleAccess('schedule', 'full');

scheduleRouter.get('/rooms', authenticate, R, ctrl.getRooms);
scheduleRouter.post('/rooms', authenticate, F, ctrl.postRoom);
scheduleRouter.patch('/rooms/:id', authenticate, F, ctrl.patchRoom);

scheduleRouter.get('/periods', authenticate, R, ctrl.getPeriods);
scheduleRouter.post('/periods', authenticate, F, ctrl.postPeriod);
scheduleRouter.patch('/periods/:id/archive', authenticate, F, ctrl.patchArchivePeriod);

scheduleRouter.get('/days', authenticate, R, ctrl.getDays);
scheduleRouter.post('/days', authenticate, F, ctrl.postDay);
scheduleRouter.patch('/days/:id/archive', authenticate, F, ctrl.patchArchiveDay);

scheduleRouter.get('/timetable', authenticate, R, ctrl.getTimetable);
scheduleRouter.post('/timetable', authenticate, F, ctrl.postTimetableEntry);
scheduleRouter.patch('/timetable/:id', authenticate, F, ctrl.patchTimetableEntry);
scheduleRouter.patch('/timetable/:id/archive', authenticate, F, ctrl.patchArchiveTimetableEntry);
scheduleRouter.get('/timetable/:id/revisions', authenticate, R, ctrl.getRevisions);
scheduleRouter.get('/teachers/:teacherId/schedule', authenticate, R, ctrl.getTeacherSchedule);
scheduleRouter.get('/rooms/:roomId/schedule', authenticate, R, ctrl.getRoomSchedule);

scheduleRouter.get('/conflicts', authenticate, R, ctrl.getConflicts);
scheduleRouter.patch('/conflicts/:id/resolve', authenticate, F, ctrl.patchResolveConflict);

scheduleRouter.get('/timetable/:id/substitutions', authenticate, R, ctrl.getSubstitutions);
scheduleRouter.post('/timetable/:id/substitutions', authenticate, F, ctrl.postSubstitution);
scheduleRouter.patch('/substitutions/:id/cancel', authenticate, F, ctrl.patchCancelSubstitution);

scheduleRouter.get('/events', authenticate, R, ctrl.getEvents);
scheduleRouter.post('/events', authenticate, F, ctrl.postEvent);
scheduleRouter.patch('/events/:id/archive', authenticate, F, ctrl.patchArchiveEvent);

scheduleRouter.get('/locks', authenticate, R, ctrl.getLocks);
scheduleRouter.post('/locks', authenticate, F, ctrl.postLock);
scheduleRouter.patch('/locks/:id/unlock', authenticate, F, ctrl.patchUnlock);

scheduleRouter.get('/templates', authenticate, R, ctrl.getTemplates);
scheduleRouter.post('/templates', authenticate, F, ctrl.postTemplate);
scheduleRouter.patch('/templates/:id/archive', authenticate, F, ctrl.patchArchiveTemplate);

scheduleRouter.get('/exam-slots', authenticate, R, ctrl.getExamSlots);
scheduleRouter.post('/exam-slots', authenticate, F, ctrl.postExamSlot);
scheduleRouter.patch('/exam-slots/:id/archive', authenticate, F, ctrl.patchArchiveExamSlot);
