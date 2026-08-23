import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireModuleAccess } from '../../middleware/requireModuleAccess';
import * as ctrl from './transcript.controller';

export const transcriptRouter = Router();
const R = requireModuleAccess('transcript', 'read');
const F = requireModuleAccess('transcript', 'full');

transcriptRouter.get('/records', authenticate, R, ctrl.getRecords);
transcriptRouter.post('/records', authenticate, F, ctrl.postRecord);
transcriptRouter.patch('/records/:id/lock', authenticate, F, ctrl.patchLockRecord);

transcriptRouter.get('/course-records', authenticate, R, ctrl.getCourseRecords);
transcriptRouter.post('/course-records', authenticate, F, ctrl.postCourseRecord);

transcriptRouter.get('/gpa-summaries', authenticate, R, ctrl.getGpaSummaries);
transcriptRouter.post('/gpa-summaries', authenticate, F, ctrl.postGpaSummary);

transcriptRouter.get('/graduation-statuses', authenticate, R, ctrl.getGraduationStatuses);
transcriptRouter.put('/graduation-statuses', authenticate, F, ctrl.putGraduationStatus);

transcriptRouter.get('/requests', authenticate, R, ctrl.getRequests);
transcriptRouter.post('/requests', authenticate, F, ctrl.postRequest);
transcriptRouter.patch('/requests/:id/status', authenticate, F, ctrl.patchRequestStatus);

transcriptRouter.get('/issue-logs', authenticate, R, ctrl.getIssueLogs);
transcriptRouter.post('/issue-logs', authenticate, F, ctrl.postIssueLog);

transcriptRouter.get('/verifications', authenticate, R, ctrl.getVerifications);
transcriptRouter.post('/verifications', authenticate, F, ctrl.postVerification);

transcriptRouter.get('/templates', authenticate, R, ctrl.getTemplates);
transcriptRouter.post('/templates', authenticate, F, ctrl.postTemplate);

transcriptRouter.get('/grade-scales', authenticate, R, ctrl.getGradeScales);
transcriptRouter.post('/grade-scales', authenticate, F, ctrl.postGradeScale);

transcriptRouter.get('/academic-standings', authenticate, R, ctrl.getAcademicStandings);
transcriptRouter.post('/academic-standings', authenticate, F, ctrl.postAcademicStanding);

transcriptRouter.get('/transfer-credits', authenticate, R, ctrl.getTransferCredits);
transcriptRouter.post('/transfer-credits', authenticate, F, ctrl.postTransferCredit);

transcriptRouter.get('/signatures', authenticate, R, ctrl.getSignatures);
transcriptRouter.post('/signatures', authenticate, F, ctrl.postSignature);

transcriptRouter.get('/versions', authenticate, R, ctrl.getVersions);
transcriptRouter.post('/versions', authenticate, F, ctrl.postVersion);

transcriptRouter.get('/gpa-policies', authenticate, R, ctrl.getGpaPolicies);
transcriptRouter.post('/gpa-policies', authenticate, F, ctrl.postGpaPolicy);

transcriptRouter.get('/graduation-requirements', authenticate, R, ctrl.getGraduationRequirements);
transcriptRouter.post('/graduation-requirements', authenticate, F, ctrl.postGraduationRequirement);

transcriptRouter.get('/access-logs', authenticate, R, ctrl.getAccessLogs);
transcriptRouter.post('/access-logs', authenticate, F, ctrl.postAccessLog);

transcriptRouter.get('/summary', authenticate, R, ctrl.getSummary);
