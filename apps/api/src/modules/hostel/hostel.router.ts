import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireModuleAccess } from '../../middleware/requireModuleAccess';
import * as ctrl from './hostel.controller';

export const hostelRouter = Router();
const R = requireModuleAccess('hostel', 'read');
const F = requireModuleAccess('hostel', 'full');

hostelRouter.get('/hostels', authenticate, R, ctrl.getHostels);
hostelRouter.post('/hostels', authenticate, F, ctrl.postHostel);

hostelRouter.get('/dormitories', authenticate, R, ctrl.getDormitories);
hostelRouter.post('/dormitories', authenticate, F, ctrl.postDormitory);

hostelRouter.get('/beds', authenticate, R, ctrl.getBeds);
hostelRouter.post('/beds', authenticate, F, ctrl.postBed);
hostelRouter.patch('/beds/:id/status', authenticate, F, ctrl.patchBedStatus);

hostelRouter.get('/assignments', authenticate, R, ctrl.getAssignments);
hostelRouter.post('/assignments', authenticate, F, ctrl.postAssignment);
hostelRouter.patch('/assignments/:id/vacate', authenticate, F, ctrl.patchVacateAssignment);

hostelRouter.get('/staff-assignments', authenticate, R, ctrl.getStaffAssignments);
hostelRouter.post('/staff-assignments', authenticate, F, ctrl.postStaffAssignment);

hostelRouter.get('/incidents', authenticate, R, ctrl.getIncidents);
hostelRouter.post('/incidents', authenticate, F, ctrl.postIncident);

hostelRouter.get('/summary', authenticate, R, ctrl.getSummary);
