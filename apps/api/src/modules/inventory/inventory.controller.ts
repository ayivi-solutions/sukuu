import { Response } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import * as svc from './inventory.service';

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

export const getItems = wrap(req => svc.listItems(req.schoolId || ''));
export const postItem = wrapCreate(req => svc.createItem(req.schoolId || '', req.body));

export const getStockEntries = wrap(req => svc.listStockEntries(req.schoolId || '', req.query.itemId as string | undefined));
export const postStockEntry = wrapCreate(req => svc.createStockEntry(req.schoolId || '', req.body));

export const getStockIssues = wrap(req => svc.listStockIssues(req.schoolId || '', req.query.itemId as string | undefined));
export const postStockIssue = wrapCreate(req => svc.createStockIssue(req.schoolId || '', req.body));

export const getSuppliers = wrap(req => svc.listSuppliers(req.schoolId || ''));
export const postSupplier = wrapCreate(req => svc.createSupplier(req.schoolId || '', req.body));

export const getPurchaseOrders = wrap(req => svc.listPurchaseOrders(req.schoolId || ''));
export const postPurchaseOrder = wrapCreate(req => svc.createPurchaseOrder(req.schoolId || '', req.body));
export const patchPurchaseOrderStatus = wrapMutateById(svc.getPurchaseOrderSchoolId, req => svc.updatePurchaseOrderStatus(req.params.id, req.body.status));

export const getAssets = wrap(req => svc.listAssets(req.schoolId || ''));
export const postAsset = wrapCreate(req => svc.createAsset(req.schoolId || '', req.body));
export const patchAssetStatus = wrapMutateById(svc.getAssetSchoolId, req => svc.updateAssetStatus(req.params.id, req.body.status));

export const getSummary = wrap(req => svc.getInventorySummary(req.schoolId || ''));
