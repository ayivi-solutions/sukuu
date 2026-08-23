import { Response } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import * as svc from './clinic.service';

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

export const getVisits = wrap(req => svc.listVisits(req.schoolId || '', req.query.studentId as string | undefined));
export const postVisit = wrapCreate(req => svc.createVisit(req.schoolId || '', req.userId || '', req.body));
export const patchVisit = wrapMutateById(svc.getVisitSchoolId, req => svc.updateVisit(req.params.id, req.body));

export const getMedications = wrap(req => svc.listMedications(req.schoolId || ''));
export const postMedication = wrapCreate(req => svc.createMedication(req.schoolId || '', req.body));

export const getPrescriptions = wrap(req => svc.listPrescriptions(req.schoolId || '', req.query.visitId as string | undefined));
export const postPrescription = wrapCreate(req => svc.createPrescription(req.schoolId || '', req.body));

export const getReferrals = wrap(req => svc.listReferrals(req.schoolId || '', req.query.visitId as string | undefined));
export const postReferral = wrapCreate(req => svc.createReferral(req.schoolId || '', req.body));

export const getImmunizations = wrap(req => svc.listImmunizations(req.schoolId || '', req.query.studentId as string | undefined));
export const postImmunization = wrapCreate(req => svc.createImmunization(req.schoolId || '', req.body));

export const getSummary = wrap(req => svc.getClinicSummary(req.schoolId || ''));
