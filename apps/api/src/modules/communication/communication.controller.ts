import { Response } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import * as svc from './communication.service';

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

export const getConversations = wrap(req => svc.listConversations(req.schoolId || '', req.userId || ''));
export const postConversation = wrapCreate(req => svc.createConversation(req.schoolId || '', req.userId || '', req.body));

export const getMessages = wrap(req => svc.listMessages(req.query.conversationId as string));
export const postMessage = wrapCreate(req => svc.createMessage(req.schoolId || '', req.userId || '', req.body));

export const patchMarkMessageRead = async (req: AuthRequest, res: Response) => {
  try { res.json(await svc.markMessageRead(req.params.id, req.userId || '')); } catch (err: any) { res.status(500).json({ error: err.message }); }
};

export const getParticipants = wrap(req => svc.listParticipants(req.query.conversationId as string));

export const getBroadcasts = wrap(req => svc.listBroadcasts(req.schoolId || ''));
export const postBroadcast = wrapCreate(req => svc.createBroadcast(req.schoolId || '', req.userId || '', req.body));

export const getDeliveries = wrap(req => svc.listDeliveries(req.query.broadcastId as string));

export const getSummary = wrap(req => svc.getCommunicationSummary(req.schoolId || '', req.userId || ''));
