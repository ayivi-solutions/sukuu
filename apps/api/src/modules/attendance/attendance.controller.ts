import { Response } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import * as svc from './attendance.service';

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

export const getSessions = wrap(req => svc.listSessions(req.schoolId || '', req.query));
export const postSession = wrapCreate(req => svc.createSession(req.schoolId || '', req.body));
export const patchSession = wrapMutateById(svc.getSessionSchoolId, req => svc.updateSession(req.params.id, req.body));
export const patchArchiveSession = wrapMutateById(svc.getSessionSchoolId, req => svc.archiveSession(req.params.id));

export const getSessionMarks = wrap(req => svc.listSessionMarks(req.params.id));
export const postMark = async (req: AuthRequest, res: Response) => {
  try {
    const sid = await svc.getSessionSchoolId(req.params.id);
    if (!sid || sid !== req.schoolId) return res.status(403).json({ error: 'Not authorized for this session' });
    res.status(201).json(await svc.markAttendance(req.params.id, req.body.studentId, req.body.status, req.userId || ''));
  } catch (err: any) { res.status(400).json({ error: err.message }); }
};
export const postBulkMark = async (req: AuthRequest, res: Response) => {
  try {
    const sid = await svc.getSessionSchoolId(req.params.id);
    if (!sid || sid !== req.schoolId) return res.status(403).json({ error: 'Not authorized for this session' });
    res.status(201).json(await svc.bulkMarkAttendance(req.params.id, req.body.marks, req.userId || ''));
  } catch (err: any) { res.status(400).json({ error: err.message }); }
};
export const patchMark = wrapMutateById(svc.getMarkSchoolId, req => svc.updateMark(req.params.id, req.body.status));
export const patchArchiveMark = wrapMutateById(svc.getMarkSchoolId, req => svc.archiveMark(req.params.id));
export const getStudentHistory = wrap(req => svc.getStudentSessionHistory(req.params.studentId));

export const getDevices = wrap(req => svc.listDevices(req.schoolId || ''));
export const postDevice = wrapCreate(req => svc.createDevice(req.schoolId || '', req.body));
export const patchDevice = wrapMutateById(svc.getDeviceSchoolId, req => svc.updateDevice(req.params.id, req.body));

export const getEvents = wrap(req => svc.listEvents(req.schoolId || '', req.query.deviceId as string));
export const postEvent = wrapCreate(req => svc.recordEvent(req.schoolId || '', req.body));
export const postProcessEvent = wrapMutateById(svc.getEventSchoolId, req => svc.processEvent(req.params.id, req.body.sessionId, req.userId || ''));

export const getExceptions = wrap(req => svc.listExceptions(req.schoolId || ''));
export const postException = wrapCreate(req => svc.createException(req.schoolId || '', { ...req.body, approvedBy: req.userId }));
export const patchException = wrapMutateById(svc.getExceptionSchoolId, req => svc.updateException(req.params.id, req.body));
export const patchArchiveException = wrapMutateById(svc.getExceptionSchoolId, req => svc.archiveException(req.params.id));

export const getPolicies = wrap(req => svc.listPolicies(req.schoolId || ''));
export const postPolicy = wrapCreate(req => svc.createPolicy(req.schoolId || '', req.body));
export const patchPolicy = wrapMutateById(svc.getPolicySchoolId, req => svc.updatePolicy(req.params.id, req.body));
export const patchArchivePolicy = wrapMutateById(svc.getPolicySchoolId, req => svc.archivePolicy(req.params.id));

export const getStudentSummaries = wrap(req => svc.getStudentSummary(req.params.studentId));
export const getClassSummaries = wrap(req => svc.listClassSummaries(req.schoolId || '', req.query.classId as string));
