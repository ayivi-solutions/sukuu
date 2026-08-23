import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireModuleAccess } from '../../middleware/requireModuleAccess';
import * as ctrl from './discipline.controller';

export const disciplineRouter = Router();
const R = requireModuleAccess('discipline', 'read');
const F = requireModuleAccess('discipline', 'full');

disciplineRouter.get('/incidents', authenticate, R, ctrl.getIncidents);
disciplineRouter.post('/incidents', authenticate, F, ctrl.postIncident);

disciplineRouter.get('/actions', authenticate, R, ctrl.getActions);
disciplineRouter.post('/actions', authenticate, F, ctrl.postAction);
disciplineRouter.patch('/actions/:id/status', authenticate, F, ctrl.patchActionStatus);

disciplineRouter.get('/suspensions', authenticate, R, ctrl.getSuspensions);
disciplineRouter.post('/suspensions', authenticate, F, ctrl.postSuspension);

disciplineRouter.get('/commendations', authenticate, R, ctrl.getCommendations);
disciplineRouter.post('/commendations', authenticate, F, ctrl.postCommendation);

disciplineRouter.get('/behavior-scores', authenticate, R, ctrl.getBehaviorScores);
disciplineRouter.post('/behavior-scores', authenticate, F, ctrl.postBehaviorScore);

disciplineRouter.get('/summary', authenticate, R, ctrl.getSummary);
