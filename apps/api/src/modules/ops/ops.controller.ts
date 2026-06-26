import { Request, Response } from 'express';
import * as svc from './ops.service';

function wrap(fn: () => Promise<any>) {
  return async (_req: Request, res: Response) => {
    try { res.json(await fn()); } catch (err: any) { res.status(500).json({ error: err.message }); }
  };
}

export const getConfig = wrap(svc.listConfig);
export const putConfig = async (req: Request, res: Response) => {
  try { res.json(await svc.upsertConfig(req.body.key, req.body.value)); }
  catch (err: any) { res.status(500).json({ error: err.message }); }
};
export const getEnvironments = wrap(svc.listEnvironments);
export const getDepartments = wrap(svc.listDepartments);
export const postDepartment = async (req: Request, res: Response) => {
  try { res.status(201).json(await svc.createDepartment(req.body.name, req.body.description)); }
  catch (err: any) { res.status(500).json({ error: err.message }); }
};
export const getIntegrations = wrap(svc.listIntegrations);
export const postIntegration = async (req: Request, res: Response) => {
  try { res.status(201).json(await svc.createIntegration(req.body.name, req.body.type, req.body.config)); }
  catch (err: any) { res.status(500).json({ error: err.message }); }
};
export const patchIntegration = async (req: Request, res: Response) => {
  try { res.json(await svc.toggleIntegration(req.params.id, !!req.body.isActive)); }
  catch (err: any) { res.status(500).json({ error: err.message }); }
};
export const getBackups = wrap(svc.listBackups);
export const getBackupLogs = wrap(svc.listBackupLogs);
export const getJobs = wrap(svc.listJobs);
export const getJobExecutions = wrap(svc.listJobExecutions);
export const postHealthCheck = wrap(svc.recordHealthCheck);
export const getHealthChecks = wrap(svc.listHealthChecks);
export const getRateLimits = wrap(svc.listRateLimits);
export const postRateLimit = async (req: Request, res: Response) => {
  try { res.status(201).json(await svc.createRateLimit(req.body.endpoint, req.body.maxRequests, req.body.windowSeconds)); }
  catch (err: any) { res.status(500).json({ error: err.message }); }
};
export const getRetention = wrap(svc.listRetentionPolicies);
export const postRetention = async (req: Request, res: Response) => {
  try { res.status(201).json(await svc.createRetentionPolicy(req.body.policyName, req.body.retentionYears, req.body.description)); }
  catch (err: any) { res.status(500).json({ error: err.message }); }
};
export const getErrors = wrap(svc.listErrors);
export const getServices = wrap(svc.listServices);
export const getServiceStatuses = wrap(svc.listServiceStatuses);
