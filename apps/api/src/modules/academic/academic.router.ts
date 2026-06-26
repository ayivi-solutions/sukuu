import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import * as ctrl from './academic.controller';

export const academicRouter = Router();

academicRouter.get('/years', authenticate, ctrl.getYears);
academicRouter.post('/years', authenticate, ctrl.postYear);
academicRouter.patch('/years/:id', authenticate, ctrl.patchYear);
academicRouter.patch('/years/:id/activate', authenticate, ctrl.patchActivateYear);
academicRouter.patch('/years/:id/archive', authenticate, ctrl.patchArchiveYear);

academicRouter.get('/terms', authenticate, ctrl.getTerms);
academicRouter.post('/terms', authenticate, ctrl.postTerm);
academicRouter.patch('/terms/:id', authenticate, ctrl.patchTerm);
academicRouter.patch('/terms/:id/archive', authenticate, ctrl.patchArchiveTerm);

academicRouter.get('/classes', authenticate, ctrl.getClasses);
academicRouter.post('/classes', authenticate, ctrl.postClass);
academicRouter.patch('/classes/:id', authenticate, ctrl.patchClass);
academicRouter.patch('/classes/:id/archive', authenticate, ctrl.patchArchiveClass);

academicRouter.get('/streams', authenticate, ctrl.getStreams);
academicRouter.post('/streams', authenticate, ctrl.postStream);
academicRouter.patch('/streams/:id', authenticate, ctrl.patchStream);
academicRouter.patch('/streams/:id/archive', authenticate, ctrl.patchArchiveStream);

academicRouter.get('/subjects', authenticate, ctrl.getSubjects);
academicRouter.post('/subjects', authenticate, ctrl.postSubject);
academicRouter.patch('/subjects/:id', authenticate, ctrl.patchSubject);
academicRouter.patch('/subjects/:id/archive', authenticate, ctrl.patchArchiveSubject);

academicRouter.get('/departments', authenticate, ctrl.getDepartments);
academicRouter.post('/departments', authenticate, ctrl.postDepartment);
academicRouter.patch('/departments/:id', authenticate, ctrl.patchDepartment);
academicRouter.patch('/departments/:id/archive', authenticate, ctrl.patchArchiveDepartment);

academicRouter.get('/subject-assignments', authenticate, ctrl.getSubjectAssignments);
academicRouter.post('/subject-assignments', authenticate, ctrl.postSubjectAssignment);
academicRouter.patch('/subject-assignments/:id/archive', authenticate, ctrl.patchArchiveSubjectAssignment);

academicRouter.get('/class-subjects', authenticate, ctrl.getClassSubjects);
academicRouter.post('/class-subjects', authenticate, ctrl.postClassSubject);
academicRouter.patch('/class-subjects/:id/archive', authenticate, ctrl.patchArchiveClassSubject);

academicRouter.get('/stream-subjects', authenticate, ctrl.getStreamSubjects);
academicRouter.post('/stream-subjects', authenticate, ctrl.postStreamSubject);
academicRouter.patch('/stream-subjects/:id/archive', authenticate, ctrl.patchArchiveStreamSubject);

academicRouter.get('/subject-groups', authenticate, ctrl.getSubjectGroups);
academicRouter.post('/subject-groups', authenticate, ctrl.postSubjectGroup);
academicRouter.patch('/subject-groups/:id/archive', authenticate, ctrl.patchArchiveSubjectGroup);

academicRouter.get('/curricula', authenticate, ctrl.getCurricula);
academicRouter.post('/curricula', authenticate, ctrl.postCurriculum);
academicRouter.patch('/curricula/:id', authenticate, ctrl.patchCurriculum);
academicRouter.patch('/curricula/:id/archive', authenticate, ctrl.patchArchiveCurriculum);

academicRouter.get('/curricula/:curriculumId/topics', authenticate, ctrl.getTopics);
academicRouter.post('/curricula/:curriculumId/topics', authenticate, ctrl.postTopic);
academicRouter.patch('/topics/:id/archive', authenticate, ctrl.patchArchiveTopic);

academicRouter.get('/topics/:topicId/objectives', authenticate, ctrl.getObjectives);
academicRouter.post('/topics/:topicId/objectives', authenticate, ctrl.postObjective);
academicRouter.patch('/objectives/:id/archive', authenticate, ctrl.patchArchiveObjective);

academicRouter.get('/outcomes', authenticate, ctrl.getOutcomes);
academicRouter.post('/outcomes', authenticate, ctrl.postOutcome);
academicRouter.patch('/outcomes/:id/archive', authenticate, ctrl.patchArchiveOutcome);

academicRouter.get('/promotion-rules', authenticate, ctrl.getPromotionRules);
academicRouter.post('/promotion-rules', authenticate, ctrl.postPromotionRule);
academicRouter.patch('/promotion-rules/:id/archive', authenticate, ctrl.patchArchivePromotionRule);

academicRouter.get('/class-teachers', authenticate, ctrl.getClassTeachers);
academicRouter.post('/class-teachers', authenticate, ctrl.postClassTeacher);
academicRouter.patch('/class-teachers/:id/archive', authenticate, ctrl.patchArchiveClassTeacher);
