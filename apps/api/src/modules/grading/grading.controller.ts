import { Response } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import * as svc from './grading.service';

function wrap(fn: (req: AuthRequest) => Promise<any>) {
  return async (req: AuthRequest, res: Response) => {
    try { res.json(await fn(req)); } catch (err: any) { res.status(500).json({ error: err.message }); }
  };
}
function wrapCreate(fn: (req: AuthRequest) => Promise<any>) {
  return async (req: AuthRequest, res: Response) => {
    try { res.status(201).json(await fn(req)); } catch (err: any) { res.status(400).json({ error: err.message }); }
  };
}
function wrapMutateById(getSchoolId: (id: string) => Promise<string | undefined>, fn: (req: AuthRequest) => Promise<any>) {
  return async (req: AuthRequest, res: Response) => {
    try {
      const sid = await getSchoolId(req.params.id);
      if (!sid || sid !== req.schoolId) return res.status(403).json({ error: 'Not authorized for this record' });
      res.json(await fn(req));
    } catch (err: any) { res.status(400).json({ error: err.message }); }
  };
}

// Assessments
export const getAssessments = wrap(req => svc.listAssessments(req.schoolId || '', req.query));
export const postAssessment = wrapCreate(req => svc.createAssessment(req.schoolId || '', req.body));
export const patchAssessment = wrapMutateById(svc.getAssessmentSchoolId, req => svc.updateAssessment(req.params.id, req.body));
export const patchArchiveAssessment = wrapMutateById(svc.getAssessmentSchoolId, req => svc.archiveAssessment(req.params.id));

// Scores
export const getAssessmentScores = wrap(req => svc.listAssessmentScores(req.params.id));
export const postScore = async (req: AuthRequest, res: Response) => {
  try {
    const sid = await svc.getAssessmentSchoolId(req.params.id);
    if (!sid || sid !== req.schoolId) return res.status(403).json({ error: 'Not authorized for this assessment' });
    res.status(201).json(await svc.recordScore(req.params.id, req.body.enrollmentId, req.body, req.userId || ''));
  } catch (err: any) { res.status(400).json({ error: err.message }); }
};
export const postBulkScores = async (req: AuthRequest, res: Response) => {
  try {
    const sid = await svc.getAssessmentSchoolId(req.params.id);
    if (!sid || sid !== req.schoolId) return res.status(403).json({ error: 'Not authorized for this assessment' });
    res.status(201).json(await svc.bulkRecordScores(req.params.id, req.body.scores, req.userId || ''));
  } catch (err: any) { res.status(400).json({ error: err.message }); }
};
export const patchArchiveScore = wrapMutateById(svc.getScoreSchoolId, req => svc.archiveScore(req.params.id));

// Moderation
export const getModerations = wrap(req => svc.listModerations(req.params.id));
export const postModeration = async (req: AuthRequest, res: Response) => {
  try {
    const sid = await svc.getAssessmentSchoolId(req.params.id);
    if (!sid || sid !== req.schoolId) return res.status(403).json({ error: 'Not authorized for this assessment' });
    res.status(201).json(await svc.createModeration(req.params.id, req.body, req.userId || ''));
  } catch (err: any) { res.status(400).json({ error: err.message }); }
};

// Grade Scales
export const getScales = wrap(req => svc.listScales(req.schoolId || ''));
export const postScaleBand = wrapCreate(req => svc.createScaleBand(req.schoolId || '', req.body));
export const patchScaleBand = wrapMutateById(svc.getScaleSchoolId, req => svc.updateScaleBand(req.params.id, req.body));
export const patchArchiveScaleBand = wrapMutateById(svc.getScaleSchoolId, req => svc.archiveScaleBand(req.params.id));

// Components
export const getComponents = wrap(req => svc.listComponents(req.schoolId || '', req.query.classId as string, req.query.termId as string));
export const postComponent = wrapCreate(req => svc.createComponent(req.schoolId || '', req.body));
export const patchArchiveComponent = wrapMutateById(svc.getComponentSchoolId, req => svc.archiveComponent(req.params.id));

// Policies
export const getPolicies = wrap(req => svc.listPolicies(req.schoolId || ''));
export const postPolicy = wrapCreate(req => svc.createPolicy(req.schoolId || '', req.body));
export const patchPolicy = wrapMutateById(svc.getPolicySchoolId, req => svc.updatePolicy(req.params.id, req.body));
export const patchArchivePolicy = wrapMutateById(svc.getPolicySchoolId, req => svc.archivePolicy(req.params.id));

// Remarks
export const getRemarks = wrap(req => svc.listRemarks(req.params.enrollmentId, req.query.termId as string));
export const postRemark = wrapCreate(req => svc.upsertRemark(req.body, req.userId || ''));

// Compute
export const postComputeSubjectResult = wrapCreate(req => svc.computeSubjectResult(req.body.enrollmentId, req.body.subjectId, req.body.classId, req.body.termId, req.schoolId || ''));
export const postComputeClassResults = wrapCreate(req => svc.computeClassResults(req.body.classId, req.body.termId, req.schoolId || ''));

// Results
export const getEnrollmentResult = wrap(req => svc.getEnrollmentResult(req.params.enrollmentId, req.query.termId as string));
export const getEnrollmentSubjectResults = wrap(req => svc.getEnrollmentSubjectResults(req.params.enrollmentId, req.query.termId as string));
export const getClassResults = wrap(req => svc.listClassResults(req.query.classId as string, req.query.termId as string));

// Approval
export const getApprovals = wrap(req => svc.listApprovals(req.schoolId || '', req.query.classId as string, req.query.termId as string));
export const postApproval = wrapCreate(req => svc.requestApproval(req.schoolId || '', req.body, req.userId || ''));
export const patchApproval = wrapMutateById(svc.getApprovalSchoolId, req => svc.decideApproval(req.params.id, req.body.status));

// Publication
export const getPublications = wrap(req => svc.listPublications(req.schoolId || ''));
export const postPublish = wrapCreate(req => svc.publishResults(req.schoolId || '', req.body.classId, req.body.termId, req.userId || '', req.body));

// Lock
export const getLocks = wrap(req => svc.listLocks(req.schoolId || ''));
export const postLock = wrapCreate(req => svc.lockResults(req.body.classId, req.body.termId, req.userId || ''));
export const deleteLock = async (req: AuthRequest, res: Response) => {
  try { res.json(await svc.unlockResults(req.params.id)); } catch (err: any) { res.status(400).json({ error: err.message }); }
};

// Reports
export const getReports = wrap(req => svc.listReports(req.schoolId || ''));
export const postReport = wrapCreate(req => svc.generateReport(req.schoolId || '', req.body, req.userId || ''));
