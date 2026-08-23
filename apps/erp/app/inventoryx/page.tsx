'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authedFetch } from '../../lib/api';
import AppShell from '../../components/AppShell';

const TABS = [
  { key: 'items', label: 'Items & Stock' },
  { key: 'suppliers', label: 'Suppliers & Orders' },
  { key: 'assets', label: 'Assets' },
];

export default function InventoryXPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [user, setUser] = useState<any>(null);
  const [school, setSchool] = useState<any>(null);
  const [tab, setTab] = useState('items');
  const [error, setError] = useState('');
  const [staff, setStaff] = useState<any[]>([]);

  const [items, setItems] = useState<any[]>([]);
  const [stockEntries, setStockEntries] = useState<any[]>([]);
  const [stockIssues, setStockIssues] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);

  const [itemForm, setItemForm] = useState({ name: '', category: '', unit: '', reorderLevel: '' });
  const [entryForm, setEntryForm] = useState({ itemId: '', quantity: '', unitCost: '', entryDate: '' });
  const [issueForm, setIssueForm] = useState({ itemId: '', quantity: '', issuedTo: '', issueDate: '' });
  const [supplierForm, setSupplierForm] = useState({ name: '', phone: '', email: '' });
  const [poForm, setPoForm] = useState({ supplierId: '', orderDate: '', totalAmount: '' });
  const [assetForm, setAssetForm] = useState({ assetCode: '', name: '', purchaseDate: '', value: '', assignedTo: '' });

  const [summary, setSummary] = useState<any>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState('');

  const stockOnHand = (itemId: string) => stockEntries.filter(e => e.item_id === itemId).reduce((s, e) => s + e.quantity, 0) - stockIssues.filter(i => i.item_id === itemId).reduce((s, i) => s + i.quantity, 0);

  useEffect(() => {
    const t = localStorage.getItem('sukuu_token');
    const userStr = localStorage.getItem('sukuu_user');
    if (!t) { router.push('/login'); return; }
    setToken(t); setUser(userStr ? JSON.parse(userStr) : null);
    loadAll(t);
  }, [router]);

  function loadAll(t: string) {
    authedFetch('/api/v1/school/profile', t).then(d => d && !d.error && setSchool(d));
    authedFetch('/api/v1/staff', t).then(d => Array.isArray(d) && setStaff(d));
    authedFetch('/api/v1/inventory/items', t).then(d => Array.isArray(d) ? setItems(d) : setError(d?.error));
    authedFetch('/api/v1/inventory/stock-entries', t).then(d => Array.isArray(d) && setStockEntries(d));
    authedFetch('/api/v1/inventory/stock-issues', t).then(d => Array.isArray(d) && setStockIssues(d));
    authedFetch('/api/v1/inventory/suppliers', t).then(d => Array.isArray(d) && setSuppliers(d));
    authedFetch('/api/v1/inventory/purchase-orders', t).then(d => Array.isArray(d) && setPurchaseOrders(d));
    authedFetch('/api/v1/inventory/assets', t).then(d => Array.isArray(d) && setAssets(d));
    setSummaryLoading(true);
    authedFetch('/api/v1/inventory/summary', t)
      .then(d => { if (d && !d.error) { setSummary(d); setSummaryError(''); } else setSummaryError(d?.error || 'Failed to load summary'); })
      .catch(() => setSummaryError('Failed to load summary')).finally(() => setSummaryLoading(false));
  }

  async function post(url: string, body: any, resetFn: () => void) { await authedFetch(url, token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); resetFn(); loadAll(token); }
  async function patch(url: string, body: any) { await authedFetch(url, token, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); loadAll(token); }

  if (error) return <AppShell user={user}><div style={{ padding: 40, color: 'var(--er)' }}>{error}</div></AppShell>;

  return (
    <AppShell user={user} schoolName={school?.name}>
      <div className="ph">
        <div className="ph-row">
          <div>
            <div className="ph-ey">SUKUU ERP · INVENTORYX · 6 TABLES · sukuux SCHEMA</div>
            <div className="ph-title">📦 InventoryX</div>
            <div className="ph-sub">Items · Procurement · Stock · Assets · Issue · Reconciliation</div>
          </div>
        </div>
      </div>

      {summaryError && <div style={{ padding: '0 var(--pad)', marginBottom: 'var(--gap)' }}><div className="alert al-er"><span className="al-ic">⚠️</span><div>Couldn't load the inventory overview: {summaryError}.</div></div></div>}

      {summaryLoading ? (
        <div className="fx-overview"><div className="stat-grid">{[1, 2, 3, 4].map(i => <div key={i} className="skel skel-card" />)}</div></div>
      ) : summary && (
        <div className="fx-overview">
          <div className="stat-grid">
            <button className="fx-card-btn" onClick={() => setTab('items')}>
              <div className="sc" title="Distinct inventory items on record"><div className="sc-top"><div className="sc-icon" style={{ background: 'var(--inB)' }}>📦</div></div><div className="sc-val">{summary.totalItems}</div><div className="sc-lbl">ITEMS TRACKED</div></div>
            </button>
            <button className="fx-card-btn" onClick={() => setTab('items')}>
              <div className="sc" title="Items whose stock-on-hand (entries minus issues) is at or below reorder level"><div className="sc-top"><div className="sc-icon" style={{ background: summary.lowStockItems > 0 ? 'var(--erB)' : 'var(--okB)' }}>⚠️</div></div><div className="sc-val">{summary.lowStockItems}</div><div className="sc-lbl">LOW STOCK ITEMS</div></div>
            </button>
            <button className="fx-card-btn" onClick={() => setTab('suppliers')}>
              <div className="sc" title="Purchase orders with status DRAFT or SUBMITTED"><div className="sc-top"><div className="sc-icon" style={{ background: 'var(--puB)' }}>🧾</div></div><div className="sc-val">{summary.pendingOrders}</div><div className="sc-lbl">PENDING PURCHASE ORDERS</div></div>
            </button>
            <button className="fx-card-btn" onClick={() => setTab('assets')}>
              <div className="sc" title="Assets with status ACTIVE"><div className="sc-top"><div className="sc-icon" style={{ background: 'var(--okB)' }}>🏷️</div></div><div className="sc-val">{summary.activeAssets}</div><div className="sc-lbl">ACTIVE ASSETS</div></div>
            </button>
          </div>
        </div>
      )}

      <div className="sys-tabs">{TABS.map(t => <button key={t.key} className={`sys-tab-btn${tab === t.key ? ' act' : ''}`} onClick={() => setTab(t.key)}>{t.label}</button>)}</div>

      {tab === 'items' && (
        <div style={{ padding: 'var(--pad)' }}>
          <form className="card" onSubmit={e => { e.preventDefault(); post('/api/v1/inventory/items', itemForm, () => setItemForm({ name: '', category: '', unit: '', reorderLevel: '' })); }} style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">ITEMS</span></div>
            <div className="cb" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input className="fi" placeholder="Name" value={itemForm.name} onChange={e => setItemForm({ ...itemForm, name: e.target.value })} required style={{ flex: 1, minWidth: 140 }} />
              <input className="fi" placeholder="Category" value={itemForm.category} onChange={e => setItemForm({ ...itemForm, category: e.target.value })} required style={{ width: 140 }} />
              <input className="fi" placeholder="Unit" value={itemForm.unit} onChange={e => setItemForm({ ...itemForm, unit: e.target.value })} required style={{ width: 100 }} />
              <input className="fi" type="number" placeholder="Reorder at" value={itemForm.reorderLevel} onChange={e => setItemForm({ ...itemForm, reorderLevel: e.target.value })} style={{ width: 110 }} />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Add Item</button>
            </div>
            <div className="tbl">
              <table className="data-table">
                <thead><tr><th>Item</th><th>Category</th><th>On Hand</th><th>Status</th></tr></thead>
                <tbody>
                  {items.map(it => { const onHand = stockOnHand(it.id); return <tr key={it.id}><td>{it.name}</td><td>{it.category}</td><td>{onHand} {it.unit}</td><td><span className={`bdg ${onHand <= it.reorder_level ? 'ber' : 'bok'}`}>{onHand <= it.reorder_level ? 'Reorder' : 'OK'}</span></td></tr>; })}
                  {items.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>No items yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </form>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <form className="card" onSubmit={e => { e.preventDefault(); post('/api/v1/inventory/stock-entries', entryForm, () => setEntryForm({ itemId: '', quantity: '', unitCost: '', entryDate: '' })); }} style={{ flex: 1, minWidth: 280 }}>
              <div className="ch"><span className="ch-t">STOCK ENTRY (RECEIVE)</span></div>
              <div className="cb" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <select className="fi" value={entryForm.itemId} onChange={e => setEntryForm({ ...entryForm, itemId: e.target.value })} required><option value="">Item...</option>{items.map(it => <option key={it.id} value={it.id}>{it.name}</option>)}</select>
                <input className="fi" type="number" placeholder="Quantity" value={entryForm.quantity} onChange={e => setEntryForm({ ...entryForm, quantity: e.target.value })} required style={{ width: 100 }} />
                <input className="fi" type="number" placeholder="Unit cost" value={entryForm.unitCost} onChange={e => setEntryForm({ ...entryForm, unitCost: e.target.value })} required style={{ width: 110 }} />
                <input className="fi" type="date" value={entryForm.entryDate} onChange={e => setEntryForm({ ...entryForm, entryDate: e.target.value })} required />
                <button type="submit" style={{ background: 'var(--okB)', color: 'var(--ok)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Receive</button>
              </div>
            </form>
            <form className="card" onSubmit={e => { e.preventDefault(); post('/api/v1/inventory/stock-issues', issueForm, () => setIssueForm({ itemId: '', quantity: '', issuedTo: '', issueDate: '' })); }} style={{ flex: 1, minWidth: 280 }}>
              <div className="ch"><span className="ch-t">STOCK ISSUE</span></div>
              <div className="cb" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <select className="fi" value={issueForm.itemId} onChange={e => setIssueForm({ ...issueForm, itemId: e.target.value })} required><option value="">Item...</option>{items.map(it => <option key={it.id} value={it.id}>{it.name}</option>)}</select>
                <input className="fi" type="number" placeholder="Quantity" value={issueForm.quantity} onChange={e => setIssueForm({ ...issueForm, quantity: e.target.value })} required style={{ width: 100 }} />
                <input className="fi" placeholder="Issued to" value={issueForm.issuedTo} onChange={e => setIssueForm({ ...issueForm, issuedTo: e.target.value })} required style={{ width: 130 }} />
                <input className="fi" type="date" value={issueForm.issueDate} onChange={e => setIssueForm({ ...issueForm, issueDate: e.target.value })} required />
                <button type="submit" style={{ background: 'var(--erB)', color: 'var(--er)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Issue</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {tab === 'suppliers' && (
        <div style={{ padding: 'var(--pad)' }}>
          <form className="card" onSubmit={e => { e.preventDefault(); post('/api/v1/inventory/suppliers', supplierForm, () => setSupplierForm({ name: '', phone: '', email: '' })); }} style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">SUPPLIERS</span></div>
            <div className="cb" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input className="fi" placeholder="Name" value={supplierForm.name} onChange={e => setSupplierForm({ ...supplierForm, name: e.target.value })} required style={{ flex: 1, minWidth: 140 }} />
              <input className="fi" placeholder="Phone" value={supplierForm.phone} onChange={e => setSupplierForm({ ...supplierForm, phone: e.target.value })} style={{ width: 140 }} />
              <input className="fi" placeholder="Email" value={supplierForm.email} onChange={e => setSupplierForm({ ...supplierForm, email: e.target.value })} style={{ width: 180 }} />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Add Supplier</button>
            </div>
            {suppliers.map(s => <div key={s.id} className="ri na"><div className="ri-b"><div className="ri-t">{s.name}</div><div className="ri-s">{s.phone || 'No phone'} · {s.email || 'No email'}</div></div></div>)}
            {suppliers.length === 0 && <div className="ri na"><div className="ri-s">No suppliers yet.</div></div>}
          </form>
          <form className="card" onSubmit={e => { e.preventDefault(); post('/api/v1/inventory/purchase-orders', poForm, () => setPoForm({ supplierId: '', orderDate: '', totalAmount: '' })); }}>
            <div className="ch"><span className="ch-t">PURCHASE ORDERS</span></div>
            <div className="cb" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <select className="fi" value={poForm.supplierId} onChange={e => setPoForm({ ...poForm, supplierId: e.target.value })} required><option value="">Supplier...</option>{suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
              <input className="fi" type="date" value={poForm.orderDate} onChange={e => setPoForm({ ...poForm, orderDate: e.target.value })} required />
              <input className="fi" type="number" placeholder="Total amount" value={poForm.totalAmount} onChange={e => setPoForm({ ...poForm, totalAmount: e.target.value })} required style={{ width: 130 }} />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Create PO</button>
            </div>
            <div className="tbl">
              <table className="data-table">
                <thead><tr><th>Supplier</th><th>Amount</th><th>Status</th><th></th></tr></thead>
                <tbody>
                  {purchaseOrders.map(p => (
                    <tr key={p.id}>
                      <td>{suppliers.find(s => s.id === p.supplier_id)?.name || '—'}</td><td>GHS {p.total_amount}</td>
                      <td><span className={`bdg ${p.status === 'RECEIVED' ? 'bok' : p.status === 'CANCELLED' ? 'ber' : 'bwn'}`}>{p.status}</span></td>
                      <td>
                        <select className="fi" style={{ fontSize: 11, padding: '4px 8px' }} value={p.status} onChange={e => patch(`/api/v1/inventory/purchase-orders/${p.id}/status`, { status: e.target.value })}>
                          <option value="DRAFT">Draft</option><option value="SUBMITTED">Submitted</option><option value="APPROVED">Approved</option><option value="RECEIVED">Received</option><option value="CANCELLED">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                  {purchaseOrders.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>No purchase orders yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </form>
        </div>
      )}

      {tab === 'assets' && (
        <div style={{ padding: 'var(--pad)' }}>
          <form className="card" onSubmit={e => { e.preventDefault(); post('/api/v1/inventory/assets', assetForm, () => setAssetForm({ assetCode: '', name: '', purchaseDate: '', value: '', assignedTo: '' })); }}>
            <div className="ch"><span className="ch-t">ASSETS</span></div>
            <div className="cb" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input className="fi" placeholder="Asset code" value={assetForm.assetCode} onChange={e => setAssetForm({ ...assetForm, assetCode: e.target.value })} required style={{ width: 130 }} />
              <input className="fi" placeholder="Name" value={assetForm.name} onChange={e => setAssetForm({ ...assetForm, name: e.target.value })} required style={{ flex: 1, minWidth: 140 }} />
              <input className="fi" type="date" value={assetForm.purchaseDate} onChange={e => setAssetForm({ ...assetForm, purchaseDate: e.target.value })} required />
              <input className="fi" type="number" placeholder="Value" value={assetForm.value} onChange={e => setAssetForm({ ...assetForm, value: e.target.value })} required style={{ width: 110 }} />
              <input className="fi" placeholder="Assigned to" value={assetForm.assignedTo} onChange={e => setAssetForm({ ...assetForm, assignedTo: e.target.value })} style={{ width: 140 }} />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Register</button>
            </div>
            <div className="tbl">
              <table className="data-table">
                <thead><tr><th>Code</th><th>Name</th><th>Value</th><th>Status</th><th></th></tr></thead>
                <tbody>
                  {assets.map(a => (
                    <tr key={a.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{a.asset_code}</td><td>{a.name}</td><td>GHS {a.value}</td>
                      <td><span className={`bdg ${a.status === 'ACTIVE' ? 'bok' : a.status === 'DAMAGED' || a.status === 'LOST' ? 'ber' : 'bwn'}`}>{a.status}</span></td>
                      <td>
                        <select className="fi" style={{ fontSize: 11, padding: '4px 8px' }} value={a.status} onChange={e => patch(`/api/v1/inventory/assets/${a.id}/status`, { status: e.target.value })}>
                          <option value="ACTIVE">Active</option><option value="DAMAGED">Damaged</option><option value="LOST">Lost</option><option value="DISPOSED">Disposed</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                  {assets.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>No assets registered.</td></tr>}
                </tbody>
              </table>
            </div>
          </form>
        </div>
      )}
    </AppShell>
  );
}
