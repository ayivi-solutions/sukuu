'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '../../components/AppShell';
import { authedFetch } from '../../lib/api';

const TABS = [
  { key: 'fees', label: 'Fee Structures' },
  { key: 'invoices', label: 'Invoices' },
  { key: 'payments', label: 'Payments & Receipts' },
  { key: 'ledger', label: 'Ledger & Journals' },
  { key: 'budget', label: 'Budget & Expenses' },
];

export default function FinanceXPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [user, setUser] = useState<any>(null);
  const [school, setSchool] = useState<any>(null);
  const [tab, setTab] = useState('fees');
  const [error, setError] = useState('');

  const [classes, setClasses] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [financialYears, setFinancialYears] = useState<any[]>([]);

  const [feeStructures, setFeeStructures] = useState<any[]>([]);
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [scholarships, setScholarships] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [journals, setJournals] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [reconciliations, setReconciliations] = useState<any[]>([]);

  const [structureForm, setStructureForm] = useState({ name: '', classId: '', termId: '', totalAmount: '', dueDate: '' });
  const [discountForm, setDiscountForm] = useState({ name: '', discountType: 'PERCENTAGE', value: '', applicableTo: 'FULL_INVOICE' });
  const [scholarshipForm, setScholarshipForm] = useState({ name: '', sponsor: '', coverageType: 'FULL', coveragePct: '' });
  const [assignForm, setAssignForm] = useState({ studentId: '', feeStructureId: '' });
  const [paymentForm, setPaymentForm] = useState({ invoiceId: '', amount: '', paymentMethod: 'MOMO' });
  const [accountForm, setAccountForm] = useState({ name: '', accountCode: '', accountType: 'ASSET' });
  const [journalForm, setJournalForm] = useState({ journalType: 'ADJUSTMENT', reference: '', description: '', journalDate: '' });
  const [yearForm, setYearForm] = useState({ name: '', startDate: '', endDate: '' });
  const [budgetForm, setBudgetForm] = useState({ financialYearId: '', budgetName: '', budgetedAmount: '' });
  const [expenseForm, setExpenseForm] = useState({ accountId: '', budgetId: '', description: '', amount: '', expenseDate: '' });
  const [reconForm, setReconForm] = useState({ accountId: '', periodStart: '', periodEnd: '', statementBalance: '', bookBalance: '' });

  const [managingStructure, setManagingStructure] = useState<any>(null);
  const [editingAccount, setEditingAccount] = useState<any>(null);
  const [accountEditForm, setAccountEditForm] = useState({ name: '', accountCode: '', isActive: true });
  const [editingStructure, setEditingStructure] = useState<any>(null);
  const [structureEditForm, setStructureEditForm] = useState({ name: '', totalAmount: '', dueDate: '' });
  const [components, setComponents] = useState<any[]>([]);
  const [componentForm, setComponentForm] = useState({ name: '', amount: '', isCompulsory: true });

  const [viewingInvoice, setViewingInvoice] = useState<any>(null);
  const [invoiceItems, setInvoiceItems] = useState<any[]>([]);
  const [invoicePayments, setInvoicePayments] = useState<any[]>([]);

  const [managingJournal, setManagingJournal] = useState<any>(null);
  const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);
  const [entryForm, setEntryForm] = useState({ accountId: '', entryType: 'DEBIT', amount: '', description: '' });

  const [viewingPayment, setViewingPayment] = useState<any>(null);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [refunds, setRefunds] = useState<any[]>([]);
  const [refundForm, setRefundForm] = useState({ studentId: '', amount: '', reason: '', refundMethod: 'CASH' });

  useEffect(() => {
    const t = localStorage.getItem('sukuu_token');
    const userStr = localStorage.getItem('sukuu_user');
    if (!t) { router.push('/login'); return; }
    setToken(t);
    setUser(userStr ? JSON.parse(userStr) : null);
    loadAll(t);
  }, [router]);

  function loadAll(t: string) {
    authedFetch('/api/v1/school/profile', t).then(d => d && !d.error && setSchool(d));
    authedFetch('/api/v1/academic/classes', t).then(d => Array.isArray(d) && setClasses(d));
    authedFetch('/api/v1/academic/terms', t).then(d => Array.isArray(d) && setTerms(d));
    authedFetch('/api/v1/students', t).then(d => Array.isArray(d) && setStudents(d));
    authedFetch('/api/v1/finance/accounts', t).then(d => Array.isArray(d) ? setAccounts(d) : setError(d?.error));
    authedFetch('/api/v1/finance/financial-years', t).then(d => Array.isArray(d) && setFinancialYears(d));
    authedFetch('/api/v1/finance/fee-structures', t).then(d => Array.isArray(d) && setFeeStructures(d));
    authedFetch('/api/v1/finance/discounts', t).then(d => Array.isArray(d) && setDiscounts(d));
    authedFetch('/api/v1/finance/scholarships', t).then(d => Array.isArray(d) && setScholarships(d));
    authedFetch('/api/v1/finance/invoices', t).then(d => Array.isArray(d) && setInvoices(d));
    authedFetch('/api/v1/finance/payments', t).then(d => Array.isArray(d) && setPayments(d));
    authedFetch('/api/v1/finance/journals', t).then(d => Array.isArray(d) && setJournals(d));
    authedFetch('/api/v1/finance/budgets', t).then(d => Array.isArray(d) && setBudgets(d));
    authedFetch('/api/v1/finance/expenses', t).then(d => Array.isArray(d) && setExpenses(d));
    authedFetch('/api/v1/finance/reconciliations', t).then(d => Array.isArray(d) && setReconciliations(d));
  }

  function nameOf(list: any[], id: string, field = 'name') { return list.find(x => x.id === id)?.[field] || id?.slice(0, 8) || '—'; }
  function studentName(id: string) { const s = students.find(x => x.id === id); return s ? `${s.first_name} ${s.last_name}` : id?.slice(0, 8) || '—'; }

  // Fee Structures
  async function handleAddStructure(e: React.FormEvent) { e.preventDefault(); await authedFetch('/api/v1/finance/fee-structures', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(structureForm) }); setStructureForm({ name: '', classId: '', termId: '', totalAmount: '', dueDate: '' }); loadAll(token); }
  async function handleArchiveStructure(id: string) { await authedFetch(`/api/v1/finance/fee-structures/${id}/archive`, token, { method: 'PATCH' }); loadAll(token); }
  async function openManageStructure(s: any) { setManagingStructure(s); const c = await authedFetch(`/api/v1/finance/fee-structures/${s.id}/components`, token); setComponents(Array.isArray(c) ? c : []); }
  async function handleAddComponent(e: React.FormEvent) { e.preventDefault(); await authedFetch(`/api/v1/finance/fee-structures/${managingStructure.id}/components`, token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(componentForm) }); setComponentForm({ name: '', amount: '', isCompulsory: true }); const c = await authedFetch(`/api/v1/finance/fee-structures/${managingStructure.id}/components`, token); setComponents(Array.isArray(c) ? c : []); }
  async function handleArchiveComponent(id: string) { await authedFetch(`/api/v1/finance/fee-components/${id}/archive`, token, { method: 'PATCH' }); const c = await authedFetch(`/api/v1/finance/fee-structures/${managingStructure.id}/components`, token); setComponents(Array.isArray(c) ? c : []); }

  async function handleAddDiscount(e: React.FormEvent) { e.preventDefault(); await authedFetch('/api/v1/finance/discounts', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(discountForm) }); setDiscountForm({ name: '', discountType: 'PERCENTAGE', value: '', applicableTo: 'FULL_INVOICE' }); loadAll(token); }
  async function handleArchiveDiscount(id: string) { await authedFetch(`/api/v1/finance/discounts/${id}/archive`, token, { method: 'PATCH' }); loadAll(token); }
  async function handleAddScholarship(e: React.FormEvent) { e.preventDefault(); await authedFetch('/api/v1/finance/scholarships', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(scholarshipForm) }); setScholarshipForm({ name: '', sponsor: '', coverageType: 'FULL', coveragePct: '' }); loadAll(token); }
  async function handleArchiveScholarship(id: string) { await authedFetch(`/api/v1/finance/scholarships/${id}/archive`, token, { method: 'PATCH' }); loadAll(token); }

  // Invoices
  async function handleAssignAndGenerate(e: React.FormEvent) {
    e.preventDefault();
    const assign = await authedFetch(`/api/v1/finance/students/${assignForm.studentId}/fee-assignments`, token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ feeStructureId: assignForm.feeStructureId }) });
    if (assign?.id) {
      await authedFetch('/api/v1/finance/invoices/generate', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ feeAssignmentId: assign.id }) });
      setAssignForm({ studentId: '', feeStructureId: '' });
      loadAll(token);
    }
  }
  async function openInvoice(inv: any) {
    setViewingInvoice(inv);
    const items = await authedFetch(`/api/v1/finance/invoices/${inv.id}/items`, token);
    setInvoiceItems(Array.isArray(items) ? items : []);
    const pays = await authedFetch(`/api/v1/finance/invoices/${inv.id}/payments`, token);
    setInvoicePayments(Array.isArray(pays) ? pays : []);
  }

  // Payments
  async function handleRecordPayment(e: React.FormEvent) {
    e.preventDefault();
    await authedFetch('/api/v1/finance/payments', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(paymentForm) });
    setPaymentForm({ invoiceId: '', amount: '', paymentMethod: 'MOMO' });
    loadAll(token);
  }
  async function handleReversePayment(id: string) { await authedFetch(`/api/v1/finance/payments/${id}/reverse`, token, { method: 'PATCH' }); loadAll(token); }
  async function openPayment(p: any) {
    setViewingPayment(p);
    const r = await authedFetch(`/api/v1/finance/payments/${p.id}/receipts`, token);
    setReceipts(Array.isArray(r) ? r : []);
    const rf = await authedFetch(`/api/v1/finance/payments/${p.id}/refunds`, token);
    setRefunds(Array.isArray(rf) ? rf : []);
  }
  async function handleAddRefund(e: React.FormEvent) {
    e.preventDefault();
    await authedFetch(`/api/v1/finance/payments/${viewingPayment.id}/refunds`, token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(refundForm) });
    setRefundForm({ studentId: '', amount: '', reason: '', refundMethod: 'CASH' });
    const rf = await authedFetch(`/api/v1/finance/payments/${viewingPayment.id}/refunds`, token);
    setRefunds(Array.isArray(rf) ? rf : []);
  }

  // Ledger
  async function handleAddAccount(e: React.FormEvent) { e.preventDefault(); await authedFetch('/api/v1/finance/accounts', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(accountForm) }); setAccountForm({ name: '', accountCode: '', accountType: 'ASSET' }); loadAll(token); }
  async function handleAddJournal(e: React.FormEvent) { e.preventDefault(); await authedFetch('/api/v1/finance/journals', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(journalForm) }); setJournalForm({ journalType: 'ADJUSTMENT', reference: '', description: '', journalDate: '' }); loadAll(token); }
  async function openJournal(j: any) { setManagingJournal(j); const e = await authedFetch(`/api/v1/finance/journals/${j.id}/entries`, token); setLedgerEntries(Array.isArray(e) ? e : []); }
  async function handleAddEntry(e: React.FormEvent) {
    e.preventDefault();
    await authedFetch(`/api/v1/finance/journals/${managingJournal.id}/entries`, token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(entryForm) });
    setEntryForm({ accountId: '', entryType: 'DEBIT', amount: '', description: '' });
    const en = await authedFetch(`/api/v1/finance/journals/${managingJournal.id}/entries`, token);
    setLedgerEntries(Array.isArray(en) ? en : []);
  }
  async function handlePostJournal() {
    const res = await authedFetch(`/api/v1/finance/journals/${managingJournal.id}/post`, token, { method: 'PATCH' });
    if (res?.error) alert(res.error);
    else { setManagingJournal(null); loadAll(token); }
  }

  // Budget & Expenses
  async function handleAddYear(e: React.FormEvent) { e.preventDefault(); await authedFetch('/api/v1/finance/financial-years', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(yearForm) }); setYearForm({ name: '', startDate: '', endDate: '' }); loadAll(token); }
  async function handleCloseYear(id: string) { await authedFetch(`/api/v1/finance/financial-years/${id}/close`, token, { method: 'PATCH' }); loadAll(token); }
  async function handleAddBudget(e: React.FormEvent) { e.preventDefault(); await authedFetch('/api/v1/finance/budgets', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(budgetForm) }); setBudgetForm({ financialYearId: '', budgetName: '', budgetedAmount: '' }); loadAll(token); }
  async function handleBudgetStatus(id: string, status: string) { await authedFetch(`/api/v1/finance/budgets/${id}/status`, token, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) }); loadAll(token); }
  async function handleAddExpense(e: React.FormEvent) { e.preventDefault(); await authedFetch('/api/v1/finance/expenses', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(expenseForm) }); setExpenseForm({ accountId: '', budgetId: '', description: '', amount: '', expenseDate: '' }); loadAll(token); }
  async function handleArchiveExpense(id: string) { await authedFetch(`/api/v1/finance/expenses/${id}/archive`, token, { method: 'PATCH' }); loadAll(token); }
  async function handleAddRecon(e: React.FormEvent) { e.preventDefault(); await authedFetch('/api/v1/finance/reconciliations', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(reconForm) }); setReconForm({ accountId: '', periodStart: '', periodEnd: '', statementBalance: '', bookBalance: '' }); loadAll(token); }
  async function handleMarkReconciled(id: string) { await authedFetch(`/api/v1/finance/reconciliations/${id}/reconcile`, token, { method: 'PATCH' }); loadAll(token); }

  async function handleSaveAccount(e: React.FormEvent) { e.preventDefault(); await authedFetch(`/api/v1/finance/accounts/${editingAccount.id}`, token, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(accountEditForm) }); setEditingAccount(null); loadAll(token); }
  async function handleSaveStructure(e: React.FormEvent) { e.preventDefault(); await authedFetch(`/api/v1/finance/fee-structures/${editingStructure.id}`, token, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(structureEditForm) }); setEditingStructure(null); loadAll(token); }

  if (error) return <AppShell user={user}><div style={{ padding: 40, color: 'var(--er)' }}>{error}</div></AppShell>;

  return (
    <AppShell user={user} schoolName={school?.name}>
      <div className="ph">
        <div className="ph-row">
          <div>
            <div className="ph-ey">SUKUU ERP · FINANCEX · 19 TABLES · sukuux SCHEMA</div>
            <div className="ph-title">💰 FinanceX</div>
            <div className="ph-sub">Fee Structures · Invoicing · Payments · Double-Entry Ledger · Budgets · CRUAA + RBAC enforced</div>
          </div>
        </div>
      </div>

      <div className="sys-tabs">
        {TABS.map(t => <button key={t.key} className={`sys-tab-btn${tab === t.key ? ' act' : ''}`} onClick={() => setTab(t.key)}>{t.label}</button>)}
      </div>

      {tab === 'fees' && (
        <div style={{ padding: 'var(--pad)' }}>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">FEE STRUCTURES</span></div>
            {feeStructures.map(s => (
              <div key={s.id} className="ri na"><div className="ri-b"><div className="ri-t">{s.name}</div><div className="ri-s">{nameOf(classes, s.class_id)} · {nameOf(terms, s.term_id)} · GHS {s.total_amount}</div></div>
                <span className={`bdg ${s.is_active ? 'bok' : 'ber'}`} style={{ marginRight: 8 }}>{s.is_active ? 'Active' : 'Inactive'}</span>
                <button onClick={() => { setEditingStructure(s); setStructureEditForm({ name: s.name, totalAmount: s.total_amount, dueDate: s.due_date }); }} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--soft)', color: 'var(--ink)', fontWeight: 600, marginRight: 6 }}>Edit</button>
                <button onClick={() => openManageStructure(s)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--inB)', color: 'var(--in)', fontWeight: 600, marginRight: 6 }}>Components</button>
                <button onClick={() => handleArchiveStructure(s.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--erB)', color: 'var(--er)', fontWeight: 600 }}>Archive</button>
              </div>
            ))}
            {feeStructures.length === 0 && <div className="ri na"><div className="ri-s">No fee structures yet.</div></div>}
            <form onSubmit={handleAddStructure} style={{ display: 'flex', gap: 8, padding: 12, flexWrap: 'wrap' }}>
              <input className="fi" placeholder="Term 2 Fees" value={structureForm.name} onChange={e => setStructureForm({ ...structureForm, name: e.target.value })} required style={{ flex: 1 }} />
              <select className="fi" value={structureForm.classId} onChange={e => setStructureForm({ ...structureForm, classId: e.target.value })} required><option value="">Class...</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
              <select className="fi" value={structureForm.termId} onChange={e => setStructureForm({ ...structureForm, termId: e.target.value })} required><option value="">Term...</option>{terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
              <input className="fi" type="number" placeholder="Total" value={structureForm.totalAmount} onChange={e => setStructureForm({ ...structureForm, totalAmount: e.target.value })} required style={{ width: 110 }} />
              <input className="fi" type="date" value={structureForm.dueDate} onChange={e => setStructureForm({ ...structureForm, dueDate: e.target.value })} required />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Add</button>
            </form>
          </div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">DISCOUNTS</span></div>
            {discounts.map(d => (<div key={d.id} className="ri na"><div className="ri-b"><div className="ri-t">{d.name}</div><div className="ri-s">{d.discount_type === 'PERCENTAGE' ? `${d.value}%` : `GHS ${d.value}`} · {d.applicable_to}</div></div><button onClick={() => handleArchiveDiscount(d.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--erB)', color: 'var(--er)', fontWeight: 600 }}>Archive</button></div>))}
            {discounts.length === 0 && <div className="ri na"><div className="ri-s">None yet.</div></div>}
            <form onSubmit={handleAddDiscount} style={{ display: 'flex', gap: 8, padding: 12, flexWrap: 'wrap' }}>
              <input className="fi" placeholder="Sibling Discount" value={discountForm.name} onChange={e => setDiscountForm({ ...discountForm, name: e.target.value })} required style={{ flex: 1 }} />
              <select className="fi" value={discountForm.discountType} onChange={e => setDiscountForm({ ...discountForm, discountType: e.target.value })}><option value="PERCENTAGE">Percentage</option><option value="FLAT_AMOUNT">Flat Amount</option></select>
              <input className="fi" type="number" placeholder="Value" value={discountForm.value} onChange={e => setDiscountForm({ ...discountForm, value: e.target.value })} required style={{ width: 90 }} />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Add</button>
            </form>
          </div>
          <div className="card">
            <div className="ch"><span className="ch-t">SCHOLARSHIPS</span></div>
            {scholarships.map(s => (<div key={s.id} className="ri na"><div className="ri-b"><div className="ri-t">{s.name}</div><div className="ri-s">{s.sponsor || '—'} · {s.coverage_type} {s.coverage_pct ? `(${s.coverage_pct}%)` : ''}</div></div><button onClick={() => handleArchiveScholarship(s.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--erB)', color: 'var(--er)', fontWeight: 600 }}>Archive</button></div>))}
            {scholarships.length === 0 && <div className="ri na"><div className="ri-s">None yet.</div></div>}
            <form onSubmit={handleAddScholarship} style={{ display: 'flex', gap: 8, padding: 12, flexWrap: 'wrap' }}>
              <input className="fi" placeholder="GES Bursary" value={scholarshipForm.name} onChange={e => setScholarshipForm({ ...scholarshipForm, name: e.target.value })} required style={{ flex: 1 }} />
              <input className="fi" placeholder="Sponsor" value={scholarshipForm.sponsor} onChange={e => setScholarshipForm({ ...scholarshipForm, sponsor: e.target.value })} />
              <select className="fi" value={scholarshipForm.coverageType} onChange={e => setScholarshipForm({ ...scholarshipForm, coverageType: e.target.value })}><option value="FULL">Full</option><option value="PARTIAL">Partial</option></select>
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Add</button>
            </form>
          </div>
        </div>
      )}

      {tab === 'invoices' && (
        <div style={{ padding: 'var(--pad)' }}>
          <form className="card" onSubmit={handleAssignAndGenerate} style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">ASSIGN FEE & GENERATE INVOICE</span></div>
            <div className="cb" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <select className="fi" value={assignForm.studentId} onChange={e => setAssignForm({ ...assignForm, studentId: e.target.value })} required><option value="">Student...</option>{students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}</select>
              <select className="fi" value={assignForm.feeStructureId} onChange={e => setAssignForm({ ...assignForm, feeStructureId: e.target.value })} required><option value="">Fee Structure...</option>{feeStructures.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Assign & Generate Invoice</button>
            </div>
          </form>
          <div className="tbl">
            <table className="data-table">
              <thead><tr><th>Invoice #</th><th>Student</th><th>Total</th><th>Paid</th><th>Balance</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv.id} onClick={() => openInvoice(inv)} style={{ cursor: 'pointer' }}>
                    <td>{inv.invoice_number}</td><td>{studentName(inv.student_id)}</td><td>GHS {inv.total_amount}</td><td>GHS {inv.amount_paid}</td><td>GHS {inv.balance_due}</td>
                    <td><span className={`bdg ${inv.status === 'PAID' ? 'bok' : inv.status === 'CANCELLED' ? 'ber' : inv.status === 'PARTIAL' ? 'bwn' : 'bin'}`}>{inv.status}</span></td>
                    <td><button onClick={e => { e.stopPropagation(); openInvoice(inv); }} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--soft)', color: 'var(--ink)', fontWeight: 600 }}>View</button></td>
                  </tr>
                ))}
                {invoices.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>No invoices yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'payments' && (
        <div style={{ padding: 'var(--pad)' }}>
          <form className="card" onSubmit={handleRecordPayment} style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">RECORD PAYMENT</span></div>
            <div className="cb" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <select className="fi" value={paymentForm.invoiceId} onChange={e => setPaymentForm({ ...paymentForm, invoiceId: e.target.value })} required style={{ flex: 1 }}>
                <option value="">Invoice...</option>
                {invoices.filter(i => i.status !== 'PAID' && i.status !== 'CANCELLED').map(i => <option key={i.id} value={i.id}>{i.invoice_number} - {studentName(i.student_id)} (Bal: GHS {i.balance_due})</option>)}
              </select>
              <input className="fi" type="number" placeholder="Amount" value={paymentForm.amount} onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })} required style={{ width: 120 }} />
              <select className="fi" value={paymentForm.paymentMethod} onChange={e => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}><option value="MOMO">Mobile Money</option><option value="CASH">Cash</option><option value="CARD">Card</option><option value="BANK_TRANSFER">Bank Transfer</option><option value="CHEQUE">Cheque</option></select>
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Record</button>
            </div>
          </form>
          <div className="tbl">
            <table className="data-table">
              <thead><tr><th>Amount</th><th>Method</th><th>Date</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id} onClick={() => openPayment(p)} style={{ cursor: 'pointer' }}>
                    <td>GHS {p.amount}</td><td>{p.payment_method}</td><td style={{ fontSize: 11 }}>{new Date(p.paid_date).toLocaleString()}</td>
                    <td><span className={`bdg ${p.status === 'CONFIRMED' ? 'bok' : p.status === 'REVERSED' ? 'ber' : 'bwn'}`}>{p.status}</span></td>
                    <td onClick={e => e.stopPropagation()}>{p.status === 'CONFIRMED' && <button onClick={() => handleReversePayment(p.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--erB)', color: 'var(--er)', fontWeight: 600 }}>Reverse</button>}</td>
                  </tr>
                ))}
                {payments.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>No payments yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'ledger' && (
        <div style={{ padding: 'var(--pad)' }}>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">CHART OF ACCOUNTS</span></div>
            {accounts.map(a => (<div key={a.id} className="ri na"><div className="ri-b"><div className="ri-t">{a.name} ({a.account_code})</div><div className="ri-s">{a.account_type}</div></div><strong style={{ marginRight: 8 }}>GHS {a.current_balance}</strong><button onClick={() => { setEditingAccount(a); setAccountEditForm({ name: a.name, accountCode: a.account_code, isActive: a.is_active }); }} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--soft)', color: 'var(--ink)', fontWeight: 600 }}>Edit</button></div>))}
            {accounts.length === 0 && <div className="ri na"><div className="ri-s">No accounts yet.</div></div>}
            <form onSubmit={handleAddAccount} style={{ display: 'flex', gap: 8, padding: 12, flexWrap: 'wrap' }}>
              <input className="fi" placeholder="Account name" value={accountForm.name} onChange={e => setAccountForm({ ...accountForm, name: e.target.value })} required style={{ flex: 1 }} />
              <input className="fi" placeholder="Code" value={accountForm.accountCode} onChange={e => setAccountForm({ ...accountForm, accountCode: e.target.value })} required style={{ width: 90 }} />
              <select className="fi" value={accountForm.accountType} onChange={e => setAccountForm({ ...accountForm, accountType: e.target.value })}><option value="ASSET">Asset</option><option value="LIABILITY">Liability</option><option value="EQUITY">Equity</option><option value="INCOME">Income</option><option value="EXPENSE">Expense</option></select>
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Add</button>
            </form>
          </div>
          <div className="card">
            <div className="ch"><span className="ch-t">JOURNALS</span></div>
            {journals.map(j => (<div key={j.id} className="ri na"><div className="ri-b"><div className="ri-t">{j.reference}</div><div className="ri-s">{j.journal_type} · {j.description}</div></div>
              <span className={`bdg ${j.is_posted ? 'bok' : 'bwn'}`} style={{ marginRight: 8 }}>{j.is_posted ? 'Posted' : 'Draft'}</span>
              <button onClick={() => openJournal(j)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--soft)', color: 'var(--ink)', fontWeight: 600 }}>Entries</button>
            </div>))}
            {journals.length === 0 && <div className="ri na"><div className="ri-s">No journals yet.</div></div>}
            <form onSubmit={handleAddJournal} style={{ display: 'flex', gap: 8, padding: 12, flexWrap: 'wrap' }}>
              <select className="fi" value={journalForm.journalType} onChange={e => setJournalForm({ ...journalForm, journalType: e.target.value })}><option value="ADJUSTMENT">Adjustment</option><option value="PAYMENT">Payment</option><option value="PAYROLL">Payroll</option><option value="RECEIPT">Receipt</option><option value="REFUND">Refund</option></select>
              <input className="fi" placeholder="Reference" value={journalForm.reference} onChange={e => setJournalForm({ ...journalForm, reference: e.target.value })} required />
              <input className="fi" placeholder="Description" value={journalForm.description} onChange={e => setJournalForm({ ...journalForm, description: e.target.value })} required style={{ flex: 1 }} />
              <input className="fi" type="date" value={journalForm.journalDate} onChange={e => setJournalForm({ ...journalForm, journalDate: e.target.value })} required />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Create</button>
            </form>
          </div>
        </div>
      )}

      {tab === 'budget' && (
        <div style={{ padding: 'var(--pad)' }}>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">FINANCIAL YEARS</span></div>
            {financialYears.map(y => (<div key={y.id} className="ri na"><div className="ri-b"><div className="ri-t">{y.name}</div><div className="ri-s">{y.start_date} → {y.end_date}</div></div><span className={`bdg ${y.is_closed ? 'ber' : 'bok'}`} style={{ marginRight: 8 }}>{y.is_closed ? 'Closed' : 'Open'}</span>{!y.is_closed && <button onClick={() => handleCloseYear(y.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--erB)', color: 'var(--er)', fontWeight: 600 }}>Close</button>}</div>))}
            {financialYears.length === 0 && <div className="ri na"><div className="ri-s">None yet.</div></div>}
            <form onSubmit={handleAddYear} style={{ display: 'flex', gap: 8, padding: 12, flexWrap: 'wrap' }}>
              <input className="fi" placeholder="FY 2026/2027" value={yearForm.name} onChange={e => setYearForm({ ...yearForm, name: e.target.value })} required style={{ flex: 1 }} />
              <input className="fi" type="date" value={yearForm.startDate} onChange={e => setYearForm({ ...yearForm, startDate: e.target.value })} required />
              <input className="fi" type="date" value={yearForm.endDate} onChange={e => setYearForm({ ...yearForm, endDate: e.target.value })} required />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Add</button>
            </form>
          </div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">BUDGETS</span></div>
            {budgets.map(b => (<div key={b.id} className="ri na"><div className="ri-b"><div className="ri-t">{b.budget_name}</div><div className="ri-s">Budgeted GHS {b.budgeted_amount} · Spent GHS {b.spent_amount} · Remaining GHS {b.remaining_amount}</div></div>
              <select value={b.status} onChange={e => handleBudgetStatus(b.id, e.target.value)} style={{ fontSize: 11, padding: '4px 8px', borderRadius: 6, border: '1px solid var(--bd)' }}>
                <option value="DRAFT">Draft</option><option value="APPROVED">Approved</option><option value="ACTIVE">Active</option><option value="CLOSED">Closed</option>
              </select>
            </div>))}
            {budgets.length === 0 && <div className="ri na"><div className="ri-s">None yet.</div></div>}
            <form onSubmit={handleAddBudget} style={{ display: 'flex', gap: 8, padding: 12, flexWrap: 'wrap' }}>
              <select className="fi" value={budgetForm.financialYearId} onChange={e => setBudgetForm({ ...budgetForm, financialYearId: e.target.value })} required><option value="">Financial Year...</option>{financialYears.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}</select>
              <input className="fi" placeholder="Budget name" value={budgetForm.budgetName} onChange={e => setBudgetForm({ ...budgetForm, budgetName: e.target.value })} required style={{ flex: 1 }} />
              <input className="fi" type="number" placeholder="Amount" value={budgetForm.budgetedAmount} onChange={e => setBudgetForm({ ...budgetForm, budgetedAmount: e.target.value })} required style={{ width: 120 }} />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Add</button>
            </form>
          </div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">EXPENSES</span></div>
            {expenses.map(ex => (<div key={ex.id} className="ri na"><div className="ri-b"><div className="ri-t">{ex.description}</div><div className="ri-s">{nameOf(accounts, ex.account_id)} · {ex.expense_date}</div></div><strong style={{ marginRight: 8 }}>GHS {ex.amount}</strong><button onClick={() => handleArchiveExpense(ex.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--erB)', color: 'var(--er)', fontWeight: 600 }}>Archive</button></div>))}
            {expenses.length === 0 && <div className="ri na"><div className="ri-s">None yet.</div></div>}
            <form onSubmit={handleAddExpense} style={{ display: 'flex', gap: 8, padding: 12, flexWrap: 'wrap' }}>
              <select className="fi" value={expenseForm.accountId} onChange={e => setExpenseForm({ ...expenseForm, accountId: e.target.value })} required><option value="">Account...</option>{accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
              <select className="fi" value={expenseForm.budgetId} onChange={e => setExpenseForm({ ...expenseForm, budgetId: e.target.value })}><option value="">Budget (optional)...</option>{budgets.map(b => <option key={b.id} value={b.id}>{b.budget_name}</option>)}</select>
              <input className="fi" placeholder="Description" value={expenseForm.description} onChange={e => setExpenseForm({ ...expenseForm, description: e.target.value })} required style={{ flex: 1 }} />
              <input className="fi" type="number" placeholder="Amount" value={expenseForm.amount} onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })} required style={{ width: 110 }} />
              <input className="fi" type="date" value={expenseForm.expenseDate} onChange={e => setExpenseForm({ ...expenseForm, expenseDate: e.target.value })} required />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Add</button>
            </form>
          </div>
          <div className="card">
            <div className="ch"><span className="ch-t">BANK RECONCILIATION</span></div>
            {reconciliations.map(r => (<div key={r.id} className="ri na"><div className="ri-b"><div className="ri-t">{nameOf(accounts, r.account_id)}</div><div className="ri-s">{r.period_start} → {r.period_end} · Diff: GHS {r.difference}</div></div><span className={`bdg ${r.is_reconciled ? 'bok' : 'bwn'}`} style={{ marginRight: 8 }}>{r.is_reconciled ? 'Reconciled' : 'Pending'}</span>{!r.is_reconciled && <button onClick={() => handleMarkReconciled(r.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--okB)', color: 'var(--ok)', fontWeight: 600 }}>Mark Reconciled</button>}</div>))}
            {reconciliations.length === 0 && <div className="ri na"><div className="ri-s">None yet.</div></div>}
            <form onSubmit={handleAddRecon} style={{ display: 'flex', gap: 8, padding: 12, flexWrap: 'wrap' }}>
              <select className="fi" value={reconForm.accountId} onChange={e => setReconForm({ ...reconForm, accountId: e.target.value })} required><option value="">Account...</option>{accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
              <input className="fi" type="date" value={reconForm.periodStart} onChange={e => setReconForm({ ...reconForm, periodStart: e.target.value })} required />
              <input className="fi" type="date" value={reconForm.periodEnd} onChange={e => setReconForm({ ...reconForm, periodEnd: e.target.value })} required />
              <input className="fi" type="number" placeholder="Statement Bal." value={reconForm.statementBalance} onChange={e => setReconForm({ ...reconForm, statementBalance: e.target.value })} required style={{ width: 110 }} />
              <input className="fi" type="number" placeholder="Book Bal." value={reconForm.bookBalance} onChange={e => setReconForm({ ...reconForm, bookBalance: e.target.value })} required style={{ width: 110 }} />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Add</button>
            </form>
          </div>
        </div>
      )}

      {editingAccount && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(4,13,52,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setEditingAccount(null)}>
          <form onSubmit={handleSaveAccount} onClick={e => e.stopPropagation()} style={{ background: 'var(--white)', padding: 24, borderRadius: 'var(--r)', width: 340, boxShadow: 'var(--shL)' }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, marginBottom: 16 }}>Edit Account</h3>
            <div className="fg"><label className="fl">NAME</label><input className="fi" value={accountEditForm.name} onChange={e => setAccountEditForm({ ...accountEditForm, name: e.target.value })} required /></div>
            <div className="fg"><label className="fl">CODE</label><input className="fi" value={accountEditForm.accountCode} onChange={e => setAccountEditForm({ ...accountEditForm, accountCode: e.target.value })} required /></div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}><input type="checkbox" checked={accountEditForm.isActive} onChange={e => setAccountEditForm({ ...accountEditForm, isActive: e.target.checked })} /> Active</label>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button type="submit" style={{ flex: 1, background: 'var(--navy)', color: 'var(--gold)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Save</button>
              <button type="button" onClick={() => setEditingAccount(null)} style={{ flex: 1, background: 'var(--soft)', color: 'var(--ink)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {editingStructure && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(4,13,52,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setEditingStructure(null)}>
          <form onSubmit={handleSaveStructure} onClick={e => e.stopPropagation()} style={{ background: 'var(--white)', padding: 24, borderRadius: 'var(--r)', width: 360, boxShadow: 'var(--shL)' }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, marginBottom: 16 }}>Edit Fee Structure</h3>
            <div className="fg"><label className="fl">NAME</label><input className="fi" value={structureEditForm.name} onChange={e => setStructureEditForm({ ...structureEditForm, name: e.target.value })} required /></div>
            <div className="fg"><label className="fl">TOTAL AMOUNT</label><input className="fi" type="number" value={structureEditForm.totalAmount} onChange={e => setStructureEditForm({ ...structureEditForm, totalAmount: e.target.value })} required /></div>
            <div className="fg"><label className="fl">DUE DATE</label><input className="fi" type="date" value={structureEditForm.dueDate} onChange={e => setStructureEditForm({ ...structureEditForm, dueDate: e.target.value })} required /></div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button type="submit" style={{ flex: 1, background: 'var(--navy)', color: 'var(--gold)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Save</button>
              <button type="button" onClick={() => setEditingStructure(null)} style={{ flex: 1, background: 'var(--soft)', color: 'var(--ink)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {managingStructure && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(4,13,52,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setManagingStructure(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--white)', padding: 24, borderRadius: 'var(--r)', width: 400, maxHeight: '80vh', overflowY: 'auto', boxShadow: 'var(--shL)' }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, marginBottom: 16 }}>Components: {managingStructure.name}</h3>
            {components.map(c => (<div key={c.id} className="ri na"><div className="ri-b"><div className="ri-t">{c.name}</div><div className="ri-s">GHS {c.amount} {c.is_compulsory && '· Compulsory'}</div></div><button onClick={() => handleArchiveComponent(c.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--erB)', color: 'var(--er)', fontWeight: 600 }}>Archive</button></div>))}
            {components.length === 0 && <div style={{ color: 'var(--muted)', fontSize: 12, padding: 8 }}>No components yet.</div>}
            <form onSubmit={handleAddComponent} style={{ marginTop: 12 }}>
              <div className="fg"><label className="fl">NAME</label><input className="fi" value={componentForm.name} onChange={e => setComponentForm({ ...componentForm, name: e.target.value })} required /></div>
              <div className="fg"><label className="fl">AMOUNT</label><input className="fi" type="number" value={componentForm.amount} onChange={e => setComponentForm({ ...componentForm, amount: e.target.value })} required /></div>
              <button type="submit" style={{ width: '100%', background: 'var(--navy)', color: 'var(--gold)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Add Component</button>
            </form>
            <button onClick={() => setManagingStructure(null)} style={{ marginTop: 12, width: '100%', background: 'var(--soft)', color: 'var(--ink)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Close</button>
          </div>
        </div>
      )}

      {viewingInvoice && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(4,13,52,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setViewingInvoice(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--white)', padding: 24, borderRadius: 'var(--r)', width: 420, maxHeight: '80vh', overflowY: 'auto', boxShadow: 'var(--shL)' }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, marginBottom: 4 }}>{viewingInvoice.invoice_number}</h3>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>{studentName(viewingInvoice.student_id)} · {viewingInvoice.status}</div>
            <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 6 }}>LINE ITEMS</div>
            {invoiceItems.map(it => (<div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--bd)', fontSize: 13 }}><span>{it.description} {it.is_adjustment && '(adj.)'}</span><span>GHS {it.amount}</span></div>))}
            <div style={{ fontWeight: 600, fontSize: 12, marginTop: 16, marginBottom: 6 }}>PAYMENTS</div>
            {invoicePayments.map(p => (<div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--bd)', fontSize: 13 }}><span>{p.payment_method} · {new Date(p.paid_date).toLocaleDateString()}</span><span>GHS {p.amount}</span></div>))}
            {invoicePayments.length === 0 && <div style={{ color: 'var(--muted)', fontSize: 12 }}>No payments yet.</div>}
            <button onClick={() => setViewingInvoice(null)} style={{ marginTop: 16, width: '100%', background: 'var(--soft)', color: 'var(--ink)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Close</button>
          </div>
        </div>
      )}

      {managingJournal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(4,13,52,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setManagingJournal(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--white)', padding: 24, borderRadius: 'var(--r)', width: 420, maxHeight: '80vh', overflowY: 'auto', boxShadow: 'var(--shL)' }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, marginBottom: 16 }}>Entries: {managingJournal.reference}</h3>
            {ledgerEntries.map(en => (<div key={en.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--bd)', fontSize: 13 }}><span>{nameOf(accounts, en.account_id)} ({en.entry_type})</span><span>GHS {en.amount}</span></div>))}
            {ledgerEntries.length === 0 && <div style={{ color: 'var(--muted)', fontSize: 12, padding: 8 }}>No entries yet.</div>}
            {!managingJournal.is_posted && (
              <form onSubmit={handleAddEntry} style={{ marginTop: 12 }}>
                <select className="fi" value={entryForm.accountId} onChange={e => setEntryForm({ ...entryForm, accountId: e.target.value })} required style={{ marginBottom: 8 }}><option value="">Account...</option>{accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
                <select className="fi" value={entryForm.entryType} onChange={e => setEntryForm({ ...entryForm, entryType: e.target.value })} style={{ marginBottom: 8 }}><option value="DEBIT">Debit</option><option value="CREDIT">Credit</option></select>
                <input className="fi" type="number" placeholder="Amount" value={entryForm.amount} onChange={e => setEntryForm({ ...entryForm, amount: e.target.value })} required style={{ marginBottom: 8 }} />
                <button type="submit" style={{ width: '100%', background: 'var(--navy)', color: 'var(--gold)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Add Entry</button>
              </form>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              {!managingJournal.is_posted && <button onClick={handlePostJournal} style={{ flex: 1, background: 'var(--okB)', color: 'var(--ok)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Post Journal</button>}
              <button onClick={() => setManagingJournal(null)} style={{ flex: 1, background: 'var(--soft)', color: 'var(--ink)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {viewingPayment && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(4,13,52,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setViewingPayment(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--white)', padding: 24, borderRadius: 'var(--r)', width: 400, maxHeight: '80vh', overflowY: 'auto', boxShadow: 'var(--shL)' }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, marginBottom: 16 }}>Payment GHS {viewingPayment.amount}</h3>
            <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 6 }}>RECEIPTS</div>
            {receipts.map(r => (<div key={r.id} style={{ fontSize: 13, padding: '4px 0' }}>{r.receipt_number} · {new Date(r.issued_at).toLocaleDateString()}</div>))}
            <div style={{ fontWeight: 600, fontSize: 12, marginTop: 16, marginBottom: 6 }}>REFUNDS</div>
            {refunds.map(r => (<div key={r.id} style={{ fontSize: 13, padding: '4px 0' }}>GHS {r.amount} · {r.status} · {r.reason}</div>))}
            {refunds.length === 0 && <div style={{ color: 'var(--muted)', fontSize: 12 }}>None yet.</div>}
            <form onSubmit={handleAddRefund} style={{ marginTop: 12 }}>
              <input className="fi" placeholder="Student ID" value={refundForm.studentId} onChange={e => setRefundForm({ ...refundForm, studentId: e.target.value })} required style={{ marginBottom: 8 }} />
              <input className="fi" type="number" placeholder="Amount" value={refundForm.amount} onChange={e => setRefundForm({ ...refundForm, amount: e.target.value })} required style={{ marginBottom: 8 }} />
              <input className="fi" placeholder="Reason" value={refundForm.reason} onChange={e => setRefundForm({ ...refundForm, reason: e.target.value })} required style={{ marginBottom: 8 }} />
              <button type="submit" style={{ width: '100%', background: 'var(--navy)', color: 'var(--gold)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Issue Refund</button>
            </form>
            <button onClick={() => setViewingPayment(null)} style={{ marginTop: 12, width: '100%', background: 'var(--soft)', color: 'var(--ink)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Close</button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
