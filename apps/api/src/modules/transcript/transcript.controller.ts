import { Response } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import * as svc from './transcript.service';

function wrap(fn: (req: AuthRequest) => Promise<any>) {
  return async (req: AuthRequest, res: Response) => { try { res.json(await fn(req)); } catch (err: any) { res.status(500).json({ error: err.message }); } };
}
function wrapCreate(fn: (req: AuthRequest) => Promise<any>) {
  return async (req: AuthRequest, res: Response) => { try { res.status(201).json(await fn(req)); } catch (err: any) { res.status(500).json({ error: err.message }); } };
}
function wrapMutateById(getSchoolId: (id: string) => Promise<string | undefined>, fn: (req: AuthRequest) => Promise<any>) {
  return async (req: AuthRequest, res: Response) => {
    try {
      const sid = await getSchoolId(req.params.id);
      if (!sid || sid !== req.schoolId) return res.status(403).json({ error: 'Not authorized for this record' });
      res.json(await fn(req));
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  };
}

export const getRecords = wrap(req => svc.listRecords(req.schoolId || '', req.query.enrollmentId as string | undefined));
export const postRecord = wrapCreate(req => svc.createRecord(req.schoolId || '', req.body));
export const patchLockRecord = wrapMutateById(svc.getRecordSchoolId, req => svc.lockRecord(req.params.id, req.userId || '', req.body.reason));

export const getCourseRecords = wrap(req => svc.listCourseRecords(req.query.transcriptRecordId as string));
export const postCourseRecord = wrapCreate(req => svc.createCourseRecord(req.body));

export const getGpaSummaries = wrap(req => svc.listGpaSummaries(req.schoolId || '', req.query.enrollmentId as string | undefined));
export const postGpaSummary = wrapCreate(req => svc.createGpaSummary(req.body));

export const getGraduationStatuses = wrap(req => svc.listGraduationStatuses(req.schoolId || ''));
export const putGraduationStatus = wrapCreate(req => svc.upsertGraduationStatus(req.body));

export const getRequests = wrap(req => svc.listRequests(req.schoolId || ''));
export const postRequest = wrapCreate(req => svc.createRequest(req.schoolId || '', req.body));
export const patchRequestStatus = wrapMutateById(svc.getRequestSchoolId, req => svc.updateRequestStatus(req.params.id, req.body.status));

export const getIssueLogs = wrap(req => svc.listIssueLogs(req.query.requestId as string));
export const postIssueLog = wrapCreate(req => svc.createIssueLog(req.userId || '', req.body));

export const getVerifications = wrap(req => svc.listVerifications(req.query.transcriptId as string | undefined));
export const postVerification = wrapCreate(req => svc.createVerification(req.body));

export const getTemplates = wrap(req => svc.listTemplates(req.schoolId || ''));
export const postTemplate = wrapCreate(req => svc.createTemplate(req.schoolId || '', req.body));

export const getGradeScales = wrap(req => svc.listGradeScales(req.schoolId || ''));
export const postGradeScale = wrapCreate(req => svc.createGradeScale(req.schoolId || '', req.body));

export const getAcademicStandings = wrap(req => svc.listAcademicStandings(req.schoolId || ''));
export const postAcademicStanding = wrapCreate(req => svc.createAcademicStanding(req.body));

export const getTransferCredits = wrap(req => svc.listTransferCredits(req.query.studentId as string | undefined));
export const postTransferCredit = wrapCreate(req => svc.createTransferCredit(req.userId || '', req.body));

export const getSignatures = wrap(req => svc.listSignatures(req.query.transcriptId as string));
export const postSignature = wrapCreate(req => svc.createSignature(req.body));

export const getVersions = wrap(req => svc.listVersions(req.query.transcriptId as string));
export const postVersion = wrapCreate(req => svc.createVersion(req.userId || '', req.body));

export const getGpaPolicies = wrap(req => svc.listGpaPolicies(req.schoolId || ''));
export const postGpaPolicy = wrapCreate(req => svc.createGpaPolicy(req.schoolId || '', req.body));

export const getGraduationRequirements = wrap(req => svc.listGraduationRequirements(req.schoolId || '', req.query.classId as string | undefined));
export const postGraduationRequirement = wrapCreate(req => svc.createGraduationRequirement(req.schoolId || '', req.body));

export const getAccessLogs = wrap(req => svc.listAccessLogs(req.query.transcriptId as string));
export const postAccessLog = wrapCreate(req => svc.logAccess(req.body));

export const getSummary = wrap(req => svc.getTranscriptSummary(req.schoolId || ''));
