import { Response } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import * as svc from './notification.service';

function wrap(fn: (req: AuthRequest) => Promise<any>) {
  return async (req: AuthRequest, res: Response) => { try { res.json(await fn(req)); } catch (err: any) { res.status(500).json({ error: err.message }); } };
}
function wrapCreate(fn: (req: AuthRequest) => Promise<any>) {
  return async (req: AuthRequest, res: Response) => { try { res.status(201).json(await fn(req)); } catch (err: any) { res.status(500).json({ error: err.message }); } };
}

export const getMyNotifications = wrap(req => svc.listNotifications(req.userId || ''));
export const postNotification = wrapCreate(req => svc.createNotification(req.schoolId || '', req.body));
export const patchMarkRead = async (req: AuthRequest, res: Response) => {
  try {
    const ownerId = await svc.getNotificationUserId(req.params.id);
    if (!ownerId || ownerId !== req.userId) return res.status(403).json({ error: 'Not authorized for this record' });
    res.json(await svc.markRead(req.params.id));
  } catch (err: any) { res.status(500).json({ error: err.message }); }
};

export const getTemplates = wrap(req => svc.listTemplates(req.schoolId || ''));
export const postTemplate = wrapCreate(req => svc.createTemplate(req.schoolId || '', req.body));

export const getDeliveries = wrap(req => svc.listDeliveries(req.query.notificationId as string | undefined));
export const postDelivery = wrapCreate(req => svc.createDelivery(req.body));

export const getChannels = wrap(req => svc.listChannels(req.schoolId || ''));
export const putChannel = wrapCreate(req => svc.upsertChannel(req.schoolId || '', req.body));

export const getPreferences = wrap(req => svc.listPreferences(req.userId || ''));
export const putPreference = wrapCreate(req => svc.upsertPreference(req.userId || '', req.body));

export const getQueue = wrap(req => svc.listQueue(req.schoolId || ''));
export const patchQueueStatus = async (req: AuthRequest, res: Response) => {
  try { res.json(await svc.updateQueueStatus(req.params.id, req.body.status)); } catch (err: any) { res.status(500).json({ error: err.message }); }
};

export const getSmsLogs = wrap(req => svc.listSmsLogs(req.schoolId || ''));
export const getEmailLogs = wrap(req => svc.listEmailLogs(req.schoolId || ''));

export const getSummary = wrap(req => svc.getNotificationSummary(req.schoolId || ''));
