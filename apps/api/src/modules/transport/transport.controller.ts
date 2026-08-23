import { Response } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import * as svc from './transport.service';

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

export const getVehicles = wrap(req => svc.listVehicles(req.schoolId || ''));
export const postVehicle = wrapCreate(req => svc.createVehicle(req.schoolId || '', req.body));
export const patchVehicleStatus = wrapMutateById(svc.getVehicleSchoolId, req => svc.updateVehicleStatus(req.params.id, req.body.status));

export const getDrivers = wrap(req => svc.listDrivers(req.schoolId || ''));
export const postDriver = wrapCreate(req => svc.createDriver(req.schoolId || '', req.body));

export const getRoutes = wrap(req => svc.listRoutes(req.schoolId || ''));
export const postRoute = wrapCreate(req => svc.createRoute(req.schoolId || '', req.body));

export const getStops = wrap(req => svc.listStops(req.schoolId || '', req.query.routeId as string | undefined));
export const postStop = wrapCreate(req => svc.createStop(req.schoolId || '', req.body));

export const getAssignments = wrap(req => svc.listAssignments(req.schoolId || '', req.query.studentId as string | undefined));
export const postAssignment = wrapCreate(req => svc.createAssignment(req.schoolId || '', req.body));
export const patchDeactivateAssignment = wrapMutateById(svc.getAssignmentSchoolId, req => svc.deactivateAssignment(req.params.id));

export const getTripLogs = wrap(req => svc.listTripLogs(req.schoolId || '', req.query.vehicleId as string | undefined));
export const postTripLog = wrapCreate(req => svc.createTripLog(req.schoolId || '', req.body));
export const patchCompleteTripLog = wrapMutateById(svc.getTripLogSchoolId, req => svc.completeTripLog(req.params.id));

export const getSummary = wrap(req => svc.getTransportSummary(req.schoolId || ''));
