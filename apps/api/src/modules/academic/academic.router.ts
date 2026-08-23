import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireModuleAccess } from '../../middleware/requireModuleAccess';
import * as ctrl from './academic.controller';

export const academicRouter = Router();
const R = requireModuleAccess('academic', 'read');
const F = requireModuleAccess('academic', 'full');

academicRouter.get('/years', authenticate, R, ctrl.getYears);
academicRouter.post('/years', authenticate, F, ctrl.postYear);
academicRouter.patch('/years/:id', authenticate, F, ctrl.patchYear);
academicRouter.patch('/years/:id/activate', authenticate, F, ctrl.patchActivateYear);
academicRouter.patch('/years/:id/archive', authenticate, F, ctrl.patchArchiveYear);

academicRouter.get('/terms', authenticate, R, ctrl.getTerms);
academicRouter.post('/terms', authenticate, F, ctrl.postTerm);
academicRouter.patch('/terms/:id', authenticate, F, ctrl.patchTerm);
academicRouter.patch('/terms/:id/archive', authenticate, F, ctrl.patchArchiveTerm);

academicRouter.get('/classes', authenticate, R, ctrl.getClasses);
academicRouter.post('/classes', authenticate, F, ctrl.postClass);
academicRouter.patch('/classes/:id', authenticate, F, ctrl.patchClass);
academicRouter.patch('/classes/:id/archive', authenticate, F, ctrl.patchArchiveClass);

academicRouter.get('/streams', authenticate, R, ctrl.getStreams);
academicRouter.post('/streams', authenticate, F, ctrl.postStream);
academicRouter.patch('/streams/:id', authenticate, F, ctrl.patchStream);
academicRouter.patch('/streams/:id/archive', authenticate, F, ctrl.patchArchiveStream);

academicRouter.get('/subjects', authenticate, R, ctrl.getSubjects);
academicRouter.post('/subjects', authenticate, F, ctrl.postSubject);
academicRouter.patch('/subjects/:id', authenticate, F, ctrl.patchSubject);
academicRouter.patch('/subjects/:id/archive', authenticate, F, ctrl.patchArchiveSubject);

academicRouter.get('/departments', authenticate, R, ctrl.getDepartments);
academicRouter.post('/departments', authenticate, F, ctrl.postDepartment);
academicRouter.patch('/departments/:id', authenticate, F, ctrl.patchDepartment);
academicRouter.patch('/departments/:id/archive', authenticate, F, ctrl.patchArchiveDepartment);

academicRouter.get('/subject-assignments', authenticate, R, ctrl.getSubjectAssignments);
academicRouter.post('/subject-assignments', authenticate, F, ctrl.postSubjectAssignment);
academicRouter.patch('/subject-assignments/:id/archive', authenticate, F, ctrl.patchArchiveSubjectAssignment);

academicRouter.get('/class-subjects', authenticate, R, ctrl.getClassSubjects);
academicRouter.post('/class-subjects', authenticate, F, ctrl.postClassSubject);
academicRouter.patch('/class-subjects/:id/archive', authenticate, F, ctrl.patchArchiveClassSubject);

academicRouter.get('/stream-subjects', authenticate, R, ctrl.getStreamSubjects);
academicRouter.post('/stream-subjects', authenticate, F, ctrl.postStreamSubject);
academicRouter.patch('/stream-subjects/:id/archive', authenticate, F, ctrl.patchArchiveStreamSubject);

academicRouter.get('/subject-groups', authenticate, R, ctrl.getSubjectGroups);
academicRouter.post('/subject-groups', authenticate, F, ctrl.postSubjectGroup);
academicRouter.patch('/subject-groups/:id/archive', authenticate, F, ctrl.patchArchiveSubjectGroup);

academicRouter.get('/curricula', authenticate, R, ctrl.getCurricula);
academicRouter.post('/curricula', authenticate, F, ctrl.postCurriculum);
academicRouter.patch('/curricula/:id', authenticate, F, ctrl.patchCurriculum);
academicRouter.patch('/curricula/:id/archive', authenticate, F, ctrl.patchArchiveCurriculum);

academicRouter.get('/curricula/:curriculumId/topics', authenticate, R, ctrl.getTopics);
academicRouter.post('/curricula/:curriculumId/topics', authenticate, F, ctrl.postTopic);
academicRouter.patch('/topics/:id/archive', authenticate, F, ctrl.patchArchiveTopic);

academicRouter.get('/topics/:topicId/objectives', authenticate, R, ctrl.getObjectives);
academicRouter.post('/topics/:topicId/objectives', authenticate, F, ctrl.postObjective);
academicRouter.patch('/objectives/:id/archive', authenticate, F, ctrl.patchArchiveObjective);

academicRouter.get('/outcomes', authenticate, R, ctrl.getOutcomes);
academicRouter.post('/outcomes', authenticate, F, ctrl.postOutcome);
academicRouter.patch('/outcomes/:id/archive', authenticate, F, ctrl.patchArchiveOutcome);

academicRouter.get('/promotion-rules', authenticate, R, ctrl.getPromotionRules);
academicRouter.post('/promotion-rules', authenticate, F, ctrl.postPromotionRule);
academicRouter.patch('/promotion-rules/:id/archive', authenticate, F, ctrl.patchArchivePromotionRule);

academicRouter.get('/class-teachers', authenticate, R, ctrl.getClassTeachers);
academicRouter.post('/class-teachers', authenticate, F, ctrl.postClassTeacher);
academicRouter.patch('/class-teachers/:id/archive', authenticate, F, ctrl.patchArchiveClassTeacher);
