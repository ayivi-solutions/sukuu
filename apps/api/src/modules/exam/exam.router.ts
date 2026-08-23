import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireModuleAccess } from '../../middleware/requireModuleAccess';
import * as ctrl from './exam.controller';

export const examRouter = Router();
const R = requireModuleAccess('exam', 'read');
const F = requireModuleAccess('exam', 'full');

examRouter.get('/exams', authenticate, R, ctrl.getExams);
examRouter.post('/exams', authenticate, F, ctrl.postExam);
examRouter.patch('/exams/:id/status', authenticate, F, ctrl.patchExamStatus);

examRouter.get('/subject-papers', authenticate, R, ctrl.getSubjectPapers);
examRouter.post('/subject-papers', authenticate, F, ctrl.postSubjectPaper);

examRouter.get('/rooms', authenticate, R, ctrl.getExamRooms);
examRouter.post('/rooms', authenticate, F, ctrl.postExamRoom);

examRouter.get('/schedule', authenticate, R, ctrl.getSchedule);
examRouter.post('/schedule', authenticate, F, ctrl.postScheduleEntry);

examRouter.get('/seating', authenticate, R, ctrl.getSeating);
examRouter.post('/seating', authenticate, F, ctrl.postSeating);

examRouter.get('/invigilators', authenticate, R, ctrl.getInvigilators);
examRouter.post('/invigilators', authenticate, F, ctrl.postInvigilator);

examRouter.get('/scripts', authenticate, R, ctrl.getScripts);
examRouter.post('/scripts', authenticate, F, ctrl.postScript);
examRouter.patch('/scripts/:id/status', authenticate, F, ctrl.patchScriptStatus);

examRouter.get('/moderations', authenticate, R, ctrl.getModerations);
examRouter.post('/moderations', authenticate, F, ctrl.postModeration);
examRouter.patch('/moderations/:id/status', authenticate, F, ctrl.patchModerationStatus);

examRouter.get('/malpractice', authenticate, R, ctrl.getMalpractice);
examRouter.post('/malpractice', authenticate, F, ctrl.postMalpractice);

examRouter.get('/summary', authenticate, R, ctrl.getSummary);
