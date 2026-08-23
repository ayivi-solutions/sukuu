import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireModuleAccess } from '../../middleware/requireModuleAccess';
import * as ctrl from './inventory.controller';

export const inventoryRouter = Router();
const R = requireModuleAccess('inventory', 'read');
const F = requireModuleAccess('inventory', 'full');

inventoryRouter.get('/items', authenticate, R, ctrl.getItems);
inventoryRouter.post('/items', authenticate, F, ctrl.postItem);

inventoryRouter.get('/stock-entries', authenticate, R, ctrl.getStockEntries);
inventoryRouter.post('/stock-entries', authenticate, F, ctrl.postStockEntry);

inventoryRouter.get('/stock-issues', authenticate, R, ctrl.getStockIssues);
inventoryRouter.post('/stock-issues', authenticate, F, ctrl.postStockIssue);

inventoryRouter.get('/suppliers', authenticate, R, ctrl.getSuppliers);
inventoryRouter.post('/suppliers', authenticate, F, ctrl.postSupplier);

inventoryRouter.get('/purchase-orders', authenticate, R, ctrl.getPurchaseOrders);
inventoryRouter.post('/purchase-orders', authenticate, F, ctrl.postPurchaseOrder);
inventoryRouter.patch('/purchase-orders/:id/status', authenticate, F, ctrl.patchPurchaseOrderStatus);

inventoryRouter.get('/assets', authenticate, R, ctrl.getAssets);
inventoryRouter.post('/assets', authenticate, F, ctrl.postAsset);
inventoryRouter.patch('/assets/:id/status', authenticate, F, ctrl.patchAssetStatus);

inventoryRouter.get('/summary', authenticate, R, ctrl.getSummary);
