import { Response } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import * as svc from './hostel.service';

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

export const getHostels = wrap(req => svc.listHostels(req.schoolId || ''));
export const postHostel = wrapCreate(req => svc.createHostel(req.schoolId || '', req.body));

export const getDormitories = wrap(req => svc.listDormitories(req.schoolId || '', req.query.hostelId as string | undefined));
export const postDormitory = wrapCreate(req => svc.createDormitory(req.schoolId || '', req.body));

export const getBeds = wrap(req => svc.listBeds(req.schoolId || '', req.query.dormitoryId as string | undefined));
export const postBed = wrapCreate(req => svc.createBed(req.schoolId || '', req.body));
export const patchBedStatus = wrapMutateById(svc.getBedSchoolId, req => svc.updateBedStatus(req.params.id, req.body.status));

export const getAssignments = wrap(req => svc.listAssignments(req.schoolId || '', req.query.studentId as string | undefined));
export const postAssignment = wrapCreate(req => svc.createAssignment(req.schoolId || '', req.body));
export const patchVacateAssignment = wrapMutateById(svc.getAssignmentSchoolId, req => svc.vacateAssignment(req.params.id));

export const getStaffAssignments = wrap(req => svc.listStaffAssignments(req.schoolId || '', req.query.hostelId as string | undefined));
export const postStaffAssignment = wrapCreate(req => svc.createStaffAssignment(req.schoolId || '', req.body));

export const getIncidents = wrap(req => svc.listIncidents(req.schoolId || '', req.query.hostelId as string | undefined));
export const postIncident = wrapCreate(req => svc.createIncident(req.schoolId || '', req.userId || '', req.body));

export const getSummary = wrap(req => svc.getHostelSummary(req.schoolId || ''));
