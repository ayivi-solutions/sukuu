import { Response } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import * as svc from './workflow.service';

function wrap(fn: (req: AuthRequest) => Promise<any>) {
  return async (req: AuthRequest, res: Response) => { try { res.json(await fn(req)); } catch (err: any) { res.status(500).json({ error: err.message }); } };
}
function wrapCreate(fn: (req: AuthRequest) => Promise<any>) {
  return async (req: AuthRequest, res: Response) => { try { res.status(201).json(await fn(req)); } catch (err: any) { res.status(500).json({ error: err.message }); } };
}

export const getDefinitions = wrap(req => svc.listDefinitions(req.schoolId || ''));
export const postDefinition = wrapCreate(req => svc.createDefinition(req.schoolId || '', req.body));

export const getSteps = wrap(req => svc.listSteps(req.schoolId || '', req.query.workflowId as string | undefined));
export const postStep = wrapCreate(req => svc.createStep(req.schoolId || '', req.body));

export const getInstances = wrap(req => svc.listInstances(req.schoolId || '', req.query.workflowId as string | undefined));
export const postInstance = wrapCreate(req => svc.createInstance(req.schoolId || '', req.userId || '', req.body));

export const getApprovals = wrap(req => svc.listApprovals(req.schoolId || '', req.query.instanceId as string | undefined));
export const postApproval = wrapCreate(req => svc.createApproval(req.schoolId || '', req.userId || '', req.body));

export const getSummary = wrap(req => svc.getWorkflowSummary(req.schoolId || ''));
