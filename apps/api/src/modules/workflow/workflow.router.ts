import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireModuleAccess } from '../../middleware/requireModuleAccess';
import * as ctrl from './workflow.controller';

export const workflowRouter = Router();
const R = requireModuleAccess('workflow', 'read');
const F = requireModuleAccess('workflow', 'full');

workflowRouter.get('/definitions', authenticate, R, ctrl.getDefinitions);
workflowRouter.post('/definitions', authenticate, F, ctrl.postDefinition);

workflowRouter.get('/steps', authenticate, R, ctrl.getSteps);
workflowRouter.post('/steps', authenticate, F, ctrl.postStep);

workflowRouter.get('/instances', authenticate, R, ctrl.getInstances);
workflowRouter.post('/instances', authenticate, F, ctrl.postInstance);

workflowRouter.get('/approvals', authenticate, R, ctrl.getApprovals);
workflowRouter.post('/approvals', authenticate, F, ctrl.postApproval);

workflowRouter.get('/summary', authenticate, R, ctrl.getSummary);
