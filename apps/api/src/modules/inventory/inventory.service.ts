import { prisma } from '../../lib/prisma';

export async function listItems(schoolId: string) { return prisma.inventoryItem.findMany({ where: { school_id: schoolId } }); }
export async function createItem(schoolId: string, data: any) {
  return prisma.inventoryItem.create({ data: { school_id: schoolId, name: data.name, category: data.category, unit: data.unit, reorder_level: data.reorderLevel || 0 } });
}
export async function getItemSchoolId(id: string) { return (await prisma.inventoryItem.findUnique({ where: { id } }))?.school_id; }

export async function listStockEntries(schoolId: string, itemId?: string) { return prisma.inventoryStockEntry.findMany({ where: { school_id: schoolId, ...(itemId && { item_id: itemId }) } }); }
export async function createStockEntry(schoolId: string, data: any) {
  return prisma.inventoryStockEntry.create({ data: { school_id: schoolId, item_id: data.itemId, quantity: data.quantity, unit_cost: data.unitCost, supplier_id: data.supplierId || null, entry_date: data.entryDate } });
}

export async function listStockIssues(schoolId: string, itemId?: string) { return prisma.inventoryStockIssue.findMany({ where: { school_id: schoolId, ...(itemId && { item_id: itemId }) } }); }
export async function createStockIssue(schoolId: string, data: any) {
  return prisma.inventoryStockIssue.create({ data: { school_id: schoolId, item_id: data.itemId, quantity: data.quantity, issued_to: data.issuedTo, issue_date: data.issueDate } });
}

export async function listSuppliers(schoolId: string) { return prisma.inventorySupplier.findMany({ where: { school_id: schoolId } }); }
export async function createSupplier(schoolId: string, data: any) {
  return prisma.inventorySupplier.create({ data: { school_id: schoolId, name: data.name, phone: data.phone, email: data.email, address: data.address } });
}
export async function getSupplierSchoolId(id: string) { return (await prisma.inventorySupplier.findUnique({ where: { id } }))?.school_id; }

export async function listPurchaseOrders(schoolId: string) { return prisma.inventoryPurchaseOrder.findMany({ where: { school_id: schoolId } }); }
export async function createPurchaseOrder(schoolId: string, data: any) {
  return prisma.inventoryPurchaseOrder.create({ data: { school_id: schoolId, supplier_id: data.supplierId, order_date: data.orderDate, status: 'DRAFT', total_amount: data.totalAmount } });
}
export async function updatePurchaseOrderStatus(id: string, status: string) { return prisma.inventoryPurchaseOrder.update({ where: { id }, data: { status: status as any } }); }
export async function getPurchaseOrderSchoolId(id: string) { return (await prisma.inventoryPurchaseOrder.findUnique({ where: { id } }))?.school_id; }

export async function listAssets(schoolId: string) { return prisma.inventoryAsset.findMany({ where: { school_id: schoolId } }); }
export async function createAsset(schoolId: string, data: any) {
  return prisma.inventoryAsset.create({ data: { school_id: schoolId, asset_code: data.assetCode, name: data.name, purchase_date: data.purchaseDate, value: data.value, assigned_to: data.assignedTo, status: data.status || 'ACTIVE' } });
}
export async function updateAssetStatus(id: string, status: string) { return prisma.inventoryAsset.update({ where: { id }, data: { status: status as any } }); }
export async function getAssetSchoolId(id: string) { return (await prisma.inventoryAsset.findUnique({ where: { id } }))?.school_id; }

export async function getInventorySummary(schoolId: string) {
  const [totalItems, entries, issues, pendingOrders, activeAssets] = await Promise.all([
    prisma.inventoryItem.count({ where: { school_id: schoolId } }),
    prisma.inventoryStockEntry.groupBy({ by: ['item_id'], where: { school_id: schoolId }, _sum: { quantity: true } }),
    prisma.inventoryStockIssue.groupBy({ by: ['item_id'], where: { school_id: schoolId }, _sum: { quantity: true } }),
    prisma.inventoryPurchaseOrder.count({ where: { school_id: schoolId, status: { in: ['DRAFT', 'SUBMITTED'] } } }),
    prisma.inventoryAsset.count({ where: { school_id: schoolId, status: 'ACTIVE' } }),
  ]);
  const items = await prisma.inventoryItem.findMany({ where: { school_id: schoolId } });
  const entryMap = new Map<string, number>(
    entries.map(e => [e.item_id, Number(e._sum.quantity ?? 0)] as [string, number])
  );
  const issueMap = new Map<string, number>(
    issues.map(i => [i.item_id, Number(i._sum.quantity ?? 0)] as [string, number])
  );
  const lowStockItems = items.filter(
    it => (entryMap.get(it.id) ?? 0) - (issueMap.get(it.id) ?? 0) <= it.reorder_level
  ).length;
  return { totalItems, lowStockItems, pendingOrders, activeAssets };
}
