import { Response } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import * as svc from './schedule.service';

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

// Rooms, Periods, Days
export const getRooms = wrap(req => svc.listRooms(req.schoolId || ''));
export const postRoom = wrapCreate(req => svc.createRoom(req.schoolId || '', req.body));
export const patchRoom = wrapMutateById(svc.getRoomSchoolId, req => svc.updateRoom(req.params.id, req.body));

export const getPeriods = wrap(req => svc.listPeriods(req.schoolId || ''));
export const postPeriod = wrapCreate(req => svc.createPeriod(req.schoolId || '', req.body));
export const patchArchivePeriod = wrapMutateById(svc.getPeriodSchoolId, req => svc.archivePeriod(req.params.id));

export const getDays = wrap(req => svc.listDays(req.schoolId || ''));
export const postDay = wrapCreate(req => svc.createDay(req.schoolId || '', req.body));
export const patchArchiveDay = wrapMutateById(svc.getDaySchoolId, req => svc.archiveDay(req.params.id));

// Timetable
export const getTimetable = wrap(req => svc.listTimetable(req.schoolId || ''));
export const postTimetableEntry = wrapCreate(req => svc.createTimetableEntry(req.schoolId || '', req.body));
export const patchTimetableEntry = wrapMutateById(svc.getTimetableSchoolId, req => svc.updateTimetableEntry(req.params.id, req.userId || '', req.body));
export const patchArchiveTimetableEntry = wrapMutateById(svc.getTimetableSchoolId, req => svc.archiveTimetableEntry(req.params.id, req.userId || ''));
export const getTeacherSchedule = wrap(req => svc.getTeacherSchedule(req.params.teacherId));
export const getRoomSchedule = wrap(req => svc.getRoomSchedule(req.params.roomId));
export const getRevisions = wrap(req => svc.listRevisions(req.params.id));

// Conflicts
export const getConflicts = wrap(req => svc.listConflicts(req.schoolId || ''));
export const patchResolveConflict = wrapMutateById(svc.getConflictSchoolId, req => svc.resolveConflict(req.params.id));

// Substitutions
export const getSubstitutions = wrap(req => svc.listSubstitutions(req.params.id));
export const postSubstitution = async (req: AuthRequest, res: Response) => {
  try {
    const sid = await svc.getTimetableSchoolId(req.params.id);
    if (!sid || sid !== req.schoolId) return res.status(403).json({ error: 'Not authorized for this timetable entry' });
    res.status(201).json(await svc.createSubstitution(req.params.id, req.body));
  } catch (err: any) { res.status(400).json({ error: err.message }); }
};
export const patchCancelSubstitution = wrapMutateById(svc.getSubstitutionSchoolId, req => svc.cancelSubstitution(req.params.id));

// Calendar Events
export const getEvents = wrap(req => svc.listEvents(req.schoolId || ''));
export const postEvent = wrapCreate(req => svc.createEvent(req.schoolId || '', req.body));
export const patchArchiveEvent = wrapMutateById(svc.getEventSchoolId, req => svc.archiveEvent(req.params.id));

// Lock / Unlock
export const getLocks = wrap(req => svc.listLocks(req.schoolId || ''));
export const postLock = wrapCreate(req => svc.lockSchedule(req.schoolId || '', req.userId || '', req.body));
export const patchUnlock = wrapMutateById(svc.getLockSchoolId, req => svc.unlockSchedule(req.params.id, req.userId || '', req.body.reason));

// Templates
export const getTemplates = wrap(req => svc.listTemplates(req.schoolId || ''));
export const postTemplate = wrapCreate(req => svc.createTemplate(req.schoolId || '', req.userId || '', req.body));
export const patchArchiveTemplate = wrapMutateById(svc.getTemplateSchoolId, req => svc.archiveTemplate(req.params.id));

// Exam Slots
export const getExamSlots = wrap(req => svc.listExamSlots(req.schoolId || ''));
export const postExamSlot = wrapCreate(req => svc.createExamSlot(req.schoolId || '', req.body));
export const patchArchiveExamSlot = wrapMutateById(svc.getExamSlotSchoolId, req => svc.archiveExamSlot(req.params.id));
