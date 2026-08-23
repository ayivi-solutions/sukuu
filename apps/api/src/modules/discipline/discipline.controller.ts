import { Response } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import * as svc from './discipline.service';

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

export const getIncidents = wrap(req => svc.listIncidents(req.schoolId || '', req.query.studentId as string | undefined));
export const postIncident = wrapCreate(req => svc.createIncident(req.schoolId || '', req.userId || '', req.body));

export const getActions = wrap(req => svc.listActions(req.schoolId || '', req.query.incidentId as string | undefined));
export const postAction = wrapCreate(req => svc.createAction(req.schoolId || '', req.userId || '', req.body));
export const patchActionStatus = wrapMutateById(svc.getActionSchoolId, req => svc.updateActionStatus(req.params.id, req.body.status));

export const getSuspensions = wrap(req => svc.listSuspensions(req.schoolId || '', req.query.studentId as string | undefined));
export const postSuspension = wrapCreate(req => svc.createSuspension(req.schoolId || '', req.userId || '', req.body));

export const getCommendations = wrap(req => svc.listCommendations(req.schoolId || '', req.query.studentId as string | undefined));
export const postCommendation = wrapCreate(req => svc.createCommendation(req.schoolId || '', req.userId || '', req.body));

export const getBehaviorScores = wrap(req => svc.listBehaviorScores(req.schoolId || '', req.query.studentId as string | undefined));
export const postBehaviorScore = wrapCreate(req => svc.createBehaviorScore(req.schoolId || '', req.body));

export const getSummary = wrap(req => svc.getDisciplineSummary(req.schoolId || ''));
