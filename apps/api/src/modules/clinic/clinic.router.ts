import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireModuleAccess } from '../../middleware/requireModuleAccess';
import * as ctrl from './clinic.controller';

export const clinicRouter = Router();
const R = requireModuleAccess('clinic', 'read');
const F = requireModuleAccess('clinic', 'full');

clinicRouter.get('/visits', authenticate, R, ctrl.getVisits);
clinicRouter.post('/visits', authenticate, F, ctrl.postVisit);
clinicRouter.patch('/visits/:id', authenticate, F, ctrl.patchVisit);

clinicRouter.get('/medications', authenticate, R, ctrl.getMedications);
clinicRouter.post('/medications', authenticate, F, ctrl.postMedication);

clinicRouter.get('/prescriptions', authenticate, R, ctrl.getPrescriptions);
clinicRouter.post('/prescriptions', authenticate, F, ctrl.postPrescription);

clinicRouter.get('/referrals', authenticate, R, ctrl.getReferrals);
clinicRouter.post('/referrals', authenticate, F, ctrl.postReferral);

clinicRouter.get('/immunizations', authenticate, R, ctrl.getImmunizations);
clinicRouter.post('/immunizations', authenticate, F, ctrl.postImmunization);

clinicRouter.get('/summary', authenticate, R, ctrl.getSummary);
