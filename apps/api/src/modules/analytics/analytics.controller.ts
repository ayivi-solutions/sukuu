import { Response } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import * as svc from './analytics.service';

function wrap(fn: (req: AuthRequest) => Promise<any>) {
  return async (req: AuthRequest, res: Response) => { try { res.json(await fn(req)); } catch (err: any) { res.status(500).json({ error: err.message }); } };
}
function wrapCreate(fn: (req: AuthRequest) => Promise<any>) {
  return async (req: AuthRequest, res: Response) => { try { res.status(201).json(await fn(req)); } catch (err: any) { res.status(500).json({ error: err.message }); } };
}

export const getKpis = wrap(req => svc.listKpis(req.schoolId || '', req.query.metricName as string | undefined));
export const postKpi = wrapCreate(req => svc.createKpi(req.schoolId || '', req.body));

export const getStudentRisks = wrap(req => svc.listStudentRisks(req.schoolId || '', req.query.studentId as string | undefined));
export const postStudentRisk = wrapCreate(req => svc.createStudentRisk(req.schoolId || '', req.body));

export const getReports = wrap(req => svc.listReports(req.schoolId || ''));
export const postReport = wrapCreate(req => svc.createReport(req.schoolId || '', req.userId || '', req.body));

export const getEvents = wrap(req => svc.listEvents(req.schoolId || '', req.query.eventType as string | undefined));
export const postEvent = wrapCreate(req => svc.logEvent(req.schoolId || '', req.body));

export const getSummary = wrap(req => svc.getAnalyticsSummary(req.schoolId || ''));
