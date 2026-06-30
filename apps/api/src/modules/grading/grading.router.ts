import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireModuleAccess } from '../../middleware/requireModuleAccess';
import * as ctrl from './grading.controller';

export const gradingRouter = Router();
const R = requireModuleAccess('grading', 'read');
const F = requireModuleAccess('grading', 'full');

gradingRouter.get('/assessments', authenticate, R, ctrl.getAssessments);
gradingRouter.post('/assessments', authenticate, F, ctrl.postAssessment);
gradingRouter.patch('/assessments/:id', authenticate, F, ctrl.patchAssessment);
gradingRouter.patch('/assessments/:id/archive', authenticate, F, ctrl.patchArchiveAssessment);

gradingRouter.get('/assessments/:id/scores', authenticate, R, ctrl.getAssessmentScores);
gradingRouter.post('/assessments/:id/scores', authenticate, F, ctrl.postScore);
gradingRouter.post('/assessments/:id/scores/bulk', authenticate, F, ctrl.postBulkScores);
gradingRouter.patch('/scores/:id/archive', authenticate, F, ctrl.patchArchiveScore);

gradingRouter.get('/assessments/:id/moderations', authenticate, R, ctrl.getModerations);
gradingRouter.post('/assessments/:id/moderations', authenticate, F, ctrl.postModeration);

gradingRouter.get('/scales', authenticate, R, ctrl.getScales);
gradingRouter.post('/scales', authenticate, F, ctrl.postScaleBand);
gradingRouter.patch('/scales/:id', authenticate, F, ctrl.patchScaleBand);
gradingRouter.patch('/scales/:id/archive', authenticate, F, ctrl.patchArchiveScaleBand);

gradingRouter.get('/components', authenticate, R, ctrl.getComponents);
gradingRouter.post('/components', authenticate, F, ctrl.postComponent);
gradingRouter.patch('/components/:id/archive', authenticate, F, ctrl.patchArchiveComponent);

gradingRouter.get('/policies', authenticate, R, ctrl.getPolicies);
gradingRouter.post('/policies', authenticate, F, ctrl.postPolicy);
gradingRouter.patch('/policies/:id', authenticate, F, ctrl.patchPolicy);
gradingRouter.patch('/policies/:id/archive', authenticate, F, ctrl.patchArchivePolicy);

gradingRouter.get('/enrollments/:enrollmentId/remarks', authenticate, R, ctrl.getRemarks);
gradingRouter.post('/remarks', authenticate, F, ctrl.postRemark);

gradingRouter.post('/compute/subject-result', authenticate, F, ctrl.postComputeSubjectResult);
gradingRouter.post('/compute/class-results', authenticate, F, ctrl.postComputeClassResults);

gradingRouter.get('/enrollments/:enrollmentId/result', authenticate, R, ctrl.getEnrollmentResult);
gradingRouter.get('/enrollments/:enrollmentId/subject-results', authenticate, R, ctrl.getEnrollmentSubjectResults);
gradingRouter.get('/class-results', authenticate, R, ctrl.getClassResults);

gradingRouter.get('/approvals', authenticate, R, ctrl.getApprovals);
gradingRouter.post('/approvals', authenticate, F, ctrl.postApproval);
gradingRouter.patch('/approvals/:id', authenticate, F, ctrl.patchApproval);

gradingRouter.get('/publications', authenticate, R, ctrl.getPublications);
gradingRouter.post('/publish', authenticate, F, ctrl.postPublish);

gradingRouter.get('/locks', authenticate, R, ctrl.getLocks);
gradingRouter.post('/locks', authenticate, F, ctrl.postLock);
gradingRouter.delete('/locks/:id', authenticate, F, ctrl.deleteLock);

gradingRouter.get('/reports', authenticate, R, ctrl.getReports);
gradingRouter.post('/reports', authenticate, F, ctrl.postReport);
