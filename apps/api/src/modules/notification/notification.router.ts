import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireModuleAccess } from '../../middleware/requireModuleAccess';
import * as ctrl from './notification.controller';

export const notificationRouter = Router();
const R = requireModuleAccess('notification', 'read');
const F = requireModuleAccess('notification', 'full');

notificationRouter.get('/mine', authenticate, ctrl.getMyNotifications);
notificationRouter.post('/', authenticate, F, ctrl.postNotification);
notificationRouter.patch('/:id/read', authenticate, ctrl.patchMarkRead);

notificationRouter.get('/templates', authenticate, R, ctrl.getTemplates);
notificationRouter.post('/templates', authenticate, F, ctrl.postTemplate);

notificationRouter.get('/deliveries', authenticate, R, ctrl.getDeliveries);
notificationRouter.post('/deliveries', authenticate, F, ctrl.postDelivery);

notificationRouter.get('/channels', authenticate, R, ctrl.getChannels);
notificationRouter.put('/channels', authenticate, F, ctrl.putChannel);

notificationRouter.get('/preferences', authenticate, ctrl.getPreferences);
notificationRouter.put('/preferences', authenticate, ctrl.putPreference);

notificationRouter.get('/queue', authenticate, R, ctrl.getQueue);
notificationRouter.patch('/queue/:id/status', authenticate, F, ctrl.patchQueueStatus);

notificationRouter.get('/sms-logs', authenticate, R, ctrl.getSmsLogs);
notificationRouter.get('/email-logs', authenticate, R, ctrl.getEmailLogs);

notificationRouter.get('/summary', authenticate, R, ctrl.getSummary);
