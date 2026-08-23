import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireModuleAccess } from '../../middleware/requireModuleAccess';
import * as ctrl from './communication.controller';

export const communicationRouter = Router();
const R = requireModuleAccess('communication', 'read');
const F = requireModuleAccess('communication', 'full');

communicationRouter.get('/conversations', authenticate, ctrl.getConversations);
communicationRouter.post('/conversations', authenticate, ctrl.postConversation);

communicationRouter.get('/messages', authenticate, ctrl.getMessages);
communicationRouter.post('/messages', authenticate, ctrl.postMessage);
communicationRouter.patch('/messages/:id/read', authenticate, ctrl.patchMarkMessageRead);

communicationRouter.get('/participants', authenticate, ctrl.getParticipants);

communicationRouter.get('/broadcasts', authenticate, R, ctrl.getBroadcasts);
communicationRouter.post('/broadcasts', authenticate, F, ctrl.postBroadcast);

communicationRouter.get('/deliveries', authenticate, R, ctrl.getDeliveries);

communicationRouter.get('/summary', authenticate, ctrl.getSummary);
