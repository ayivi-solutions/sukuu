import { Response } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import * as svc from './exam.service';

function wrap(fn: (req: AuthRequest) => Promise<any>) {
  return async (req: AuthRequest, res: Response) => {
    try { res.json(await fn(req)); } catch (err: any) { res.status(500).json({ error: err.message }); }
  };
}
function wrapCreate(fn: (req: AuthRequest) => Promise<any>) {
  return async (req: AuthRequest, res: Response) => {
    try { res.status(201).json(await fn(req)); } catch (err: any) { res.status(500).json({ error: err.message }); }
  };
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

export const getExams = wrap(req => svc.listExams(req.schoolId || ''));
export const postExam = wrapCreate(req => svc.createExam(req.schoolId || '', req.body));
export const patchExamStatus = wrapMutateById(svc.getExamSchoolId, req => svc.updateExamStatus(req.params.id, req.body.status));

export const getSubjectPapers = wrap(req => svc.listSubjectPapers(req.schoolId || '', req.query.examId as string | undefined));
export const postSubjectPaper = wrapCreate(req => svc.createSubjectPaper(req.schoolId || '', req.body));

export const getExamRooms = wrap(req => svc.listExamRooms(req.schoolId || ''));
export const postExamRoom = wrapCreate(req => svc.createExamRoom(req.schoolId || '', req.body));

export const getSchedule = wrap(req => svc.listSchedule(req.schoolId || '', req.query.examId as string | undefined));
export const postScheduleEntry = wrapCreate(req => svc.createScheduleEntry(req.schoolId || '', req.body));

export const getSeating = wrap(req => svc.listSeating(req.schoolId || '', req.query.scheduleId as string | undefined));
export const postSeating = wrapCreate(req => svc.createSeating(req.schoolId || '', req.body));

export const getInvigilators = wrap(req => svc.listInvigilators(req.schoolId || '', req.query.scheduleId as string | undefined));
export const postInvigilator = wrapCreate(req => svc.createInvigilator(req.schoolId || '', req.body));

export const getScripts = wrap(req => svc.listScripts(req.schoolId || '', req.query.paperId as string | undefined));
export const postScript = wrapCreate(req => svc.createScript(req.schoolId || '', req.body));
export const patchScriptStatus = wrapMutateById(svc.getScriptSchoolId, req => svc.updateScriptStatus(req.params.id, req.body.status));

export const getModerations = wrap(req => svc.listModerations(req.schoolId || '', req.query.paperId as string | undefined));
export const postModeration = wrapCreate(req => svc.createModeration(req.schoolId || '', req.body));
export const patchModerationStatus = wrapMutateById(svc.getModerationSchoolId, req => svc.updateModerationStatus(req.params.id, req.body.status));

export const getMalpractice = wrap(req => svc.listMalpractice(req.schoolId || ''));
export const postMalpractice = wrapCreate(req => svc.createMalpractice(req.schoolId || '', req.body));

export const getSummary = wrap(req => svc.getExamSummary(req.schoolId || ''));
