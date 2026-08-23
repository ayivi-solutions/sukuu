import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireModuleAccess } from '../../middleware/requireModuleAccess';
import * as ctrl from './transport.controller';

export const transportRouter = Router();
const R = requireModuleAccess('transport', 'read');
const F = requireModuleAccess('transport', 'full');

transportRouter.get('/vehicles', authenticate, R, ctrl.getVehicles);
transportRouter.post('/vehicles', authenticate, F, ctrl.postVehicle);
transportRouter.patch('/vehicles/:id/status', authenticate, F, ctrl.patchVehicleStatus);

transportRouter.get('/drivers', authenticate, R, ctrl.getDrivers);
transportRouter.post('/drivers', authenticate, F, ctrl.postDriver);

transportRouter.get('/routes', authenticate, R, ctrl.getRoutes);
transportRouter.post('/routes', authenticate, F, ctrl.postRoute);

transportRouter.get('/stops', authenticate, R, ctrl.getStops);
transportRouter.post('/stops', authenticate, F, ctrl.postStop);

transportRouter.get('/assignments', authenticate, R, ctrl.getAssignments);
transportRouter.post('/assignments', authenticate, F, ctrl.postAssignment);
transportRouter.patch('/assignments/:id/deactivate', authenticate, F, ctrl.patchDeactivateAssignment);

transportRouter.get('/trip-logs', authenticate, R, ctrl.getTripLogs);
transportRouter.post('/trip-logs', authenticate, F, ctrl.postTripLog);
transportRouter.patch('/trip-logs/:id/complete', authenticate, F, ctrl.patchCompleteTripLog);

transportRouter.get('/summary', authenticate, R, ctrl.getSummary);
