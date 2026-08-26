'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '../../components/AppShell';
import { authedFetch } from '../../lib/api';

const TABS = [
  { key: 'runs', label: 'Payroll Runs' },
  { key: 'salary', label: 'Salary & Structures' },
  { key: 'loans', label: 'Loans & Reimbursements' },
  { key: 'bonuses', label: 'Bonuses & Periods' },
  { key: 'config', label: 'PAYE & SSNIT Config' },
  { key: 'audit', label: 'Audit Log' },
];

export default function PayrollXPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [user, setUser] = useState<any>(null);
  const [school, setSchool] = useState<any>(null);
  const [tab, setTab] = useState('runs');
  const [error, setError] = useState('');

  const [staffList, setStaffList] = useState<any[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState('');

  const [structures, setStructures] = useState<any[]>([]);
  const [staffSalary, setStaffSalary] = useState<any[]>([]);
  const [allowances, setAllowances] = useState<any[]>([]);
  const [deductions, setDeductions] = useState<any[]>([]);
  const [bonuses, setBonuses] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [reimbursements, setReimbursements] = useState<any[]>([]);
  const [periods, setPeriods] = useState<any[]>([]);
  const [runs, setRuns] = useState<any[]>([]);
  const [taxRules, setTaxRules] = useState<any[]>([]);
  const [ssnitRules, setSsnitRules] = useState<any[]>([]);
  const [statutoryDeductions, setStatutoryDeductions] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [auditLog, setAuditLog] = useState<any[]>([]);

  const [structureForm, setStructureForm] = useState({ structureName: '', description: '' });
  const [salaryForm, setSalaryForm] = useState({ baseSalary: '', effectiveFrom: '', structureId: '' });
  const [allowanceForm, setAllowanceForm] = useState({ allowanceType: 'TRANSPORT', label: '', amount: '', isTaxable: true, effectiveFrom: '' });
  const [deductionForm, setDeductionForm] = useState({ deductionType: 'OTHER', label: '', amount: '', isRecurring: true, effectiveFrom: '' });
  const [bonusForm, setBonusForm] = useState({ amount: '', bonusType: 'PERFORMANCE', reason: '', dateAwarded: '' });
  const [loanForm, setLoanForm] = useState({ loanAmount: '', interestRate: '', loanDate: '' });
  const [reimbursementForm, setReimbursementForm] = useState({ expenseType: '', amount: '' });
  const [periodForm, setPeriodForm] = useState({ month: '', year: '', startDate: '', endDate: '' });
  const [taxRuleForm, setTaxRuleForm] = useState({ effectiveYear: '', bandLabel: '', incomeFrom: '', incomeTo: '', ratePct: '' });
  const [ssnitForm, setSsnitForm] = useState({ effectiveFrom: '', employeeRatePct: '', employerRatePct: '' });
  const [statutoryForm, setStatutoryForm] = useState({ deductionName: '', percentage: '' });

  const [viewingRun, setViewingRun] = useState<any>(null);
  const [payslips, setPayslips] = useState<any[]>([]);
  const [viewingPayslip, setViewingPayslip] = useState<any>(null);
  const [payslipItems, setPayslipItems] = useState<any[]>([]);
  const [payslipPayments, setPayslipPayments] = useState<any[]>([]);
  const [paymentForm, setPaymentForm] = useState({ paymentMethod: 'BANK_TRANSFER', amount: '', referenceNumber: '' });
  const [runPeriodId, setRunPeriodId] = useState('');

  const [viewingLoan, setViewingLoan] = useState<any>(null);
  const [loanRepayments, setLoanRepayments] = useState<any[]>([]);
  const [repaymentForm, setRepaymentForm] = useState({ repaymentAmount: '', repaymentDate: '' });

  useEffect(() => {
    const t = 'cookie';
    const userStr = sessionStorage.getItem('sukuu_user');
    if (!t) { router.push('/login'); return; }
    setToken(t);
    setUser(userStr ? JSON.parse(userStr) : null);
    loadAll(t);
  }, [router]);

  useEffect(() => { if (selectedStaffId && token) loadStaffScoped(token, selectedStaffId); }, [selectedStaffId]);

  function loadAll(t: string) {
    authedFetch('/api/v1/school/profile', t).then(d => d && !d.error && setSchool(d));
    authedFetch('/api/v1/staff', t).then(d => Array.isArray(d) && setStaffList(d));
    authedFetch('/api/v1/payroll/structures', t).then(d => Array.isArray(d) ? setStructures(d) : setError(d?.error));
    authedFetch('/api/v1/payroll/loans', t).then(d => Array.isArray(d) && setLoans(d));
    authedFetch('/api/v1/payroll/reimbursements', t).then(d => Array.isArray(d) && setReimbursements(d));
    authedFetch('/api/v1/payroll/periods', t).then(d => Array.isArray(d) && setPeriods(d));
    authedFetch('/api/v1/payroll/runs', t).then(d => Array.isArray(d) && setRuns(d));
    authedFetch('/api/v1/payroll/tax-rules', t).then(d => Array.isArray(d) && setTaxRules(d));
    authedFetch('/api/v1/payroll/ssnit-rules', t).then(d => Array.isArray(d) && setSsnitRules(d));
    authedFetch('/api/v1/payroll/statutory-deductions', t).then(d => Array.isArray(d) && setStatutoryDeductions(d));
    authedFetch('/api/v1/payroll/batches', t).then(d => Array.isArray(d) && setBatches(d));
    authedFetch('/api/v1/payroll/audit-log', t).then(d => Array.isArray(d) && setAuditLog(d));
  }
  function loadStaffScoped(t: string, staffId: string) {
    authedFetch(`/api/v1/payroll/staff/${staffId}/salary`, t).then(d => Array.isArray(d) && setStaffSalary(d));
    authedFetch(`/api/v1/payroll/staff/${staffId}/allowances`, t).then(d => Array.isArray(d) && setAllowances(d));
    authedFetch(`/api/v1/payroll/staff/${staffId}/deductions`, t).then(d => Array.isArray(d) && setDeductions(d));
    authedFetch(`/api/v1/payroll/staff/${staffId}/bonuses`, t).then(d => Array.isArray(d) && setBonuses(d));
  }
  function staffName(id: string) { const s = staffList.find(x => x.id === id); return s ? `${s.first_name} ${s.last_name}` : id?.slice(0, 8) || '—'; }
  function periodName(id: string) { const p = periods.find(x => x.id === id); return p ? `${p.month}/${p.year}` : id?.slice(0, 8) || '—'; }

  async function handleAddStructure(e: React.FormEvent) { e.preventDefault(); await authedFetch('/api/v1/payroll/structures', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(structureForm) }); setStructureForm({ structureName: '', description: '' }); loadAll(token); }
  async function handleArchiveStructure(id: string) { await authedFetch(`/api/v1/payroll/structures/${id}/archive`, token, { method: 'PATCH' }); loadAll(token); }
  async function handleAssignSalary(e: React.FormEvent) { e.preventDefault(); await authedFetch(`/api/v1/payroll/staff/${selectedStaffId}/salary`, token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(salaryForm) }); setSalaryForm({ baseSalary: '', effectiveFrom: '', structureId: '' }); loadStaffScoped(token, selectedStaffId); }
  async function handleAddAllowance(e: React.FormEvent) { e.preventDefault(); await authedFetch(`/api/v1/payroll/staff/${selectedStaffId}/allowances`, token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(allowanceForm) }); setAllowanceForm({ allowanceType: 'TRANSPORT', label: '', amount: '', isTaxable: true, effectiveFrom: '' }); loadStaffScoped(token, selectedStaffId); }
  async function handleEndAllowance(id: string) { await authedFetch(`/api/v1/payroll/allowances/${id}/end`, token, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ effectiveTo: new Date().toISOString().slice(0, 10) }) }); loadStaffScoped(token, selectedStaffId); }
  async function handleAddDeduction(e: React.FormEvent) { e.preventDefault(); await authedFetch(`/api/v1/payroll/staff/${selectedStaffId}/deductions`, token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(deductionForm) }); setDeductionForm({ deductionType: 'OTHER', label: '', amount: '', isRecurring: true, effectiveFrom: '' }); loadStaffScoped(token, selectedStaffId); }
  async function handleEndDeduction(id: string) { await authedFetch(`/api/v1/payroll/deductions/${id}/end`, token, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ effectiveTo: new Date().toISOString().slice(0, 10) }) }); loadStaffScoped(token, selectedStaffId); }
  async function handleAddBonus(e: React.FormEvent) { e.preventDefault(); await authedFetch(`/api/v1/payroll/staff/${selectedStaffId}/bonuses`, token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(bonusForm) }); setBonusForm({ amount: '', bonusType: 'PERFORMANCE', reason: '', dateAwarded: '' }); loadStaffScoped(token, selectedStaffId); }
  async function handleAddLoan(e: React.FormEvent) { e.preventDefault(); await authedFetch(`/api/v1/payroll/staff/${selectedStaffId}/loans`, token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(loanForm) }); setLoanForm({ loanAmount: '', interestRate: '', loanDate: '' }); loadAll(token); }
  async function handleAddReimbursement(e: React.FormEvent) { e.preventDefault(); await authedFetch(`/api/v1/payroll/staff/${selectedStaffId}/reimbursements`, token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(reimbursementForm) }); setReimbursementForm({ expenseType: '', amount: '' }); loadAll(token); }
  async function handleReimbursementStatus(id: string, status: string) { await authedFetch(`/api/v1/payroll/reimbursements/${id}/status`, token, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) }); loadAll(token); }
  async function handleAddPeriod(e: React.FormEvent) { e.preventDefault(); await authedFetch('/api/v1/payroll/periods', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(periodForm) }); setPeriodForm({ month: '', year: '', startDate: '', endDate: '' }); loadAll(token); }
  async function handleAddTaxRule(e: React.FormEvent) { e.preventDefault(); await authedFetch('/api/v1/payroll/tax-rules', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(taxRuleForm) }); setTaxRuleForm({ effectiveYear: '', bandLabel: '', incomeFrom: '', incomeTo: '', ratePct: '' }); loadAll(token); }
  async function handleAddSsnitRule(e: React.FormEvent) { e.preventDefault(); await authedFetch('/api/v1/payroll/ssnit-rules', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(ssnitForm) }); setSsnitForm({ effectiveFrom: '', employeeRatePct: '', employerRatePct: '' }); loadAll(token); }
  async function handleAddStatutory(e: React.FormEvent) { e.preventDefault(); await authedFetch('/api/v1/payroll/statutory-deductions', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(statutoryForm) }); setStatutoryForm({ deductionName: '', percentage: '' }); loadAll(token); }

  async function handleRunPayroll(e: React.FormEvent) {
    e.preventDefault();
    const res = await authedFetch('/api/v1/payroll/runs', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ periodId: runPeriodId }) });
    if (res?.error) alert(res.error);
    else { setRunPeriodId(''); loadAll(token); }
  }
  async function handleApproveRun(id: string) { await authedFetch(`/api/v1/payroll/runs/${id}/approve`, token, { method: 'PATCH' }); loadAll(token); setViewingRun(null); }
  async function handleReverseRun(id: string) { await authedFetch(`/api/v1/payroll/runs/${id}/reverse`, token, { method: 'PATCH' }); loadAll(token); setViewingRun(null); }
  async function openRun(r: any) { setViewingRun(r); const p = await authedFetch(`/api/v1/payroll/runs/${r.id}/payslips`, token); setPayslips(Array.isArray(p) ? p : []); }
  async function openPayslip(p: any) {
    setViewingPayslip(p);
    const items = await authedFetch(`/api/v1/payroll/payslips/${p.id}/items`, token);
    setPayslipItems(Array.isArray(items) ? items : []);
    const pays = await authedFetch(`/api/v1/payroll/payslips/${p.id}/payments`, token);
    setPayslipPayments(Array.isArray(pays) ? pays : []);
  }
  async function handleRecordPayment(e: React.FormEvent) {
    e.preventDefault();
    await authedFetch(`/api/v1/payroll/payslips/${viewingPayslip.id}/payments`, token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(paymentForm) });
    setPaymentForm({ paymentMethod: 'BANK_TRANSFER', amount: '', referenceNumber: '' });
    openPayslip(viewingPayslip);
  }
  async function openLoan(l: any) { setViewingLoan(l); const r = await authedFetch(`/api/v1/payroll/loans/${l.id}/repayments`, token); setLoanRepayments(Array.isArray(r) ? r : []); }
  async function handleAddRepayment(e: React.FormEvent) {
    e.preventDefault();
    await authedFetch(`/api/v1/payroll/loans/${viewingLoan.id}/repayments`, token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(repaymentForm) });
    setRepaymentForm({ repaymentAmount: '', repaymentDate: '' });
    const r = await authedFetch(`/api/v1/payroll/loans/${viewingLoan.id}/repayments`, token);
    setLoanRepayments(Array.isArray(r) ? r : []);
    loadAll(token);
  }

  if (error) return <AppShell user={user}><div style={{ padding: 40, color: 'var(--er)' }}>{error}</div></AppShell>;

  return (
    <AppShell user={user} schoolName={school?.name}>
      <div className="ph">
        <div className="ph-row">
          <div>
            <div className="ph-ey">SUKUU ERP · PAYROLLX · 20 TABLES · sukuux SCHEMA</div>
            <div className="ph-title">🧾 PayrollX</div>
            <div className="ph-sub">Salary · Allowances · Loans · Payroll Runs · PAYE & SSNIT · CRUAA + RBAC enforced</div>
          </div>
        </div>
      </div>

      <div className="fx-overview">
        <div className="stat-grid">
          <button className="fx-card-btn" onClick={() => setTab('bonuses')}>
            <div className="sc" title="The payroll period with status OPEN, if any">
              <div className="sc-top"><div className="sc-icon" style={{ background: periods.some((p: any) => p.status === 'OPEN') ? 'var(--okB)' : 'var(--erB)' }}>📆</div></div>
              <div className="sc-val" style={{ fontSize: 18 }}>{(() => { const p = periods.find((p: any) => p.status === 'OPEN'); return p ? `${p.month}/${p.year}` : 'None open'; })()}</div>
              <div className="sc-lbl">OPEN PERIOD</div>
            </div>
          </button>
          <button className="fx-card-btn" onClick={() => setTab('runs')}>
            <div className="sc" title="Status of the most recently run payroll run, most recent run_at first">
              <div className="sc-top"><div className="sc-icon" style={{ background: 'var(--inB)' }}>🧾</div></div>
              <div className="sc-val" style={{ fontSize: 18 }}>{[...runs].sort((a: any, b: any) => new Date(b.run_at).getTime() - new Date(a.run_at).getTime())[0]?.status || 'No runs yet'}</div>
              <div className="sc-lbl">LATEST RUN STATUS</div>
            </div>
          </button>
          <button className="fx-card-btn" onClick={() => setTab('loans')}>
            <div className="sc" title="Sum of outstanding_balance across loans with status ACTIVE">
              <div className="sc-top"><div className="sc-icon" style={{ background: 'var(--puB)' }}>💵</div></div>
              <div className="sc-val" style={{ fontSize: 18 }}>GHS {loans.filter((l: any) => l.status === 'ACTIVE').reduce((s: number, l: any) => s + Number(l.outstanding_balance), 0).toLocaleString()}</div>
              <div className="sc-lbl">OUTSTANDING LOANS</div>
            </div>
          </button>
          <button className="fx-card-btn" onClick={() => setTab('loans')}>
            <div className="sc" title="Reimbursement requests with status PENDING">
              <div className="sc-top">
                <div className="sc-icon" style={{ background: reimbursements.filter((r: any) => r.status === 'PENDING').length > 0 ? 'var(--erB)' : 'var(--okB)' }}>🧾</div>
              </div>
              <div className="sc-val">{reimbursements.filter((r: any) => r.status === 'PENDING').length}</div>
              <div className="sc-lbl">PENDING REIMBURSEMENTS</div>
            </div>
          </button>
        </div>
      </div>

      <div className="sys-tabs">
        {TABS.map(t => <button key={t.key} className={`sys-tab-btn${tab === t.key ? ' act' : ''}`} onClick={() => setTab(t.key)}>{t.label}</button>)}
      </div>

      {tab === 'runs' && (
        <div style={{ padding: 'var(--pad)' }}>
          <form className="card" onSubmit={handleRunPayroll} style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">RUN PAYROLL</span></div>
            <div className="cb" style={{ display: 'flex', gap: 8 }}>
              <select className="fi" value={runPeriodId} onChange={e => setRunPeriodId(e.target.value)} required style={{ flex: 1 }}>
                <option value="">Select Pay Period...</option>
                {periods.filter(p => p.status === 'OPEN').map(p => <option key={p.id} value={p.id}>{p.month}/{p.year} ({p.start_date} - {p.end_date})</option>)}
              </select>
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>▶ Run Payroll</button>
            </div>
          </form>
          <div className="tbl">
            <table className="data-table">
              <thead><tr><th>Period</th><th>Gross</th><th>Deductions</th><th>Net</th><th>Staff</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {runs.map(r => (
                  <tr key={r.id} onClick={() => openRun(r)} style={{ cursor: 'pointer' }}>
                    <td>{periodName(r.period_id)}</td><td>GHS {Number(r.total_gross).toFixed(2)}</td><td>GHS {Number(r.total_deductions).toFixed(2)}</td><td>GHS {Number(r.total_net).toFixed(2)}</td><td>{r.staff_count}</td>
                    <td><span className={`bdg ${r.status === 'APPROVED' || r.status === 'PAID' ? 'bok' : r.status === 'REVERSED' ? 'ber' : 'bwn'}`}>{r.status}</span></td>
                    <td><button onClick={e => { e.stopPropagation(); openRun(r); }} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--soft)', color: 'var(--ink)', fontWeight: 600 }}>View</button></td>
                  </tr>
                ))}
                {runs.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>No payroll runs yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'salary' && (
        <div style={{ padding: 'var(--pad)' }}>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">SALARY STRUCTURES</span></div>
            {structures.map(s => (<div key={s.id} className="ri na"><div className="ri-b"><div className="ri-t">{s.structure_name}</div><div className="ri-s">{s.description || '—'}</div></div><button onClick={() => handleArchiveStructure(s.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--erB)', color: 'var(--er)', fontWeight: 600 }}>Archive</button></div>))}
            {structures.length === 0 && <div className="ri na"><div className="ri-s">None yet.</div></div>}
            <form onSubmit={handleAddStructure} style={{ display: 'flex', gap: 8, padding: 12, flexWrap: 'wrap' }}>
              <input className="fi" placeholder="Senior Teacher Grade" value={structureForm.structureName} onChange={e => setStructureForm({ ...structureForm, structureName: e.target.value })} required style={{ flex: 1 }} />
              <input className="fi" placeholder="Description" value={structureForm.description} onChange={e => setStructureForm({ ...structureForm, description: e.target.value })} />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Add</button>
            </form>
          </div>
          <div className="card" style={{ marginBottom: 16, padding: 12 }}>
            <label className="fl">SELECT STAFF MEMBER</label>
            <select className="fi" value={selectedStaffId} onChange={e => setSelectedStaffId(e.target.value)}>
              <option value="">Choose staff...</option>
              {staffList.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
            </select>
          </div>
          {selectedStaffId && (
            <>
              <div className="card" style={{ marginBottom: 16 }}>
                <div className="ch"><span className="ch-t">SALARY HISTORY — {staffName(selectedStaffId)}</span></div>
                {staffSalary.map(s => (<div key={s.id} className="ri na"><div className="ri-b"><div className="ri-t">GHS {s.base_salary}</div><div className="ri-s">From {s.effective_from} {s.effective_to && `to ${s.effective_to}`}</div></div><span className={`bdg ${s.is_current ? 'bok' : 'ber'}`}>{s.is_current ? 'Current' : 'Past'}</span></div>))}
                {staffSalary.length === 0 && <div className="ri na"><div className="ri-s">No salary assigned yet.</div></div>}
                <form onSubmit={handleAssignSalary} style={{ display: 'flex', gap: 8, padding: 12, flexWrap: 'wrap' }}>
                  <select className="fi" value={salaryForm.structureId} onChange={e => setSalaryForm({ ...salaryForm, structureId: e.target.value })}><option value="">Structure (optional)...</option>{structures.map(s => <option key={s.id} value={s.id}>{s.structure_name}</option>)}</select>
                  <input className="fi" type="number" placeholder="Base Salary" value={salaryForm.baseSalary} onChange={e => setSalaryForm({ ...salaryForm, baseSalary: e.target.value })} required style={{ width: 120 }} />
                  <input className="fi" type="date" value={salaryForm.effectiveFrom} onChange={e => setSalaryForm({ ...salaryForm, effectiveFrom: e.target.value })} required />
                  <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Assign</button>
                </form>
              </div>
              <div className="card" style={{ marginBottom: 16 }}>
                <div className="ch"><span className="ch-t">ALLOWANCES</span></div>
                {allowances.map(a => (<div key={a.id} className="ri na"><div className="ri-b"><div className="ri-t">{a.label}</div><div className="ri-s">{a.allowance_type} · GHS {a.amount}</div></div>{!a.effective_to ? <button onClick={() => handleEndAllowance(a.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--erB)', color: 'var(--er)', fontWeight: 600 }}>End</button> : <span className="bdg ber">Ended</span>}</div>))}
                {allowances.length === 0 && <div className="ri na"><div className="ri-s">None yet.</div></div>}
                <form onSubmit={handleAddAllowance} style={{ display: 'flex', gap: 8, padding: 12, flexWrap: 'wrap' }}>
                  <select className="fi" value={allowanceForm.allowanceType} onChange={e => setAllowanceForm({ ...allowanceForm, allowanceType: e.target.value })}><option value="HOUSING">Housing</option><option value="TRANSPORT">Transport</option><option value="MEAL">Meal</option><option value="MEDICAL">Medical</option><option value="PHONE">Phone</option><option value="OTHER">Other</option></select>
                  <input className="fi" placeholder="Label" value={allowanceForm.label} onChange={e => setAllowanceForm({ ...allowanceForm, label: e.target.value })} required style={{ flex: 1 }} />
                  <input className="fi" type="number" placeholder="Amount" value={allowanceForm.amount} onChange={e => setAllowanceForm({ ...allowanceForm, amount: e.target.value })} required style={{ width: 110 }} />
                  <input className="fi" type="date" value={allowanceForm.effectiveFrom} onChange={e => setAllowanceForm({ ...allowanceForm, effectiveFrom: e.target.value })} required />
                  <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Add</button>
                </form>
              </div>
              <div className="card">
                <div className="ch"><span className="ch-t">DEDUCTIONS</span></div>
                {deductions.map(d => (<div key={d.id} className="ri na"><div className="ri-b"><div className="ri-t">{d.label}</div><div className="ri-s">{d.deduction_type} · {d.amount ? `GHS ${d.amount}` : `${d.percentage}%`}</div></div>{!d.effective_to ? <button onClick={() => handleEndDeduction(d.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--erB)', color: 'var(--er)', fontWeight: 600 }}>End</button> : <span className="bdg ber">Ended</span>}</div>))}
                {deductions.length === 0 && <div className="ri na"><div className="ri-s">None yet.</div></div>}
                <form onSubmit={handleAddDeduction} style={{ display: 'flex', gap: 8, padding: 12, flexWrap: 'wrap' }}>
                  <select className="fi" value={deductionForm.deductionType} onChange={e => setDeductionForm({ ...deductionForm, deductionType: e.target.value })}><option value="ABSENCE">Absence</option><option value="LOAN">Loan</option><option value="UNION_DUES">Union Dues</option><option value="OTHER">Other</option></select>
                  <input className="fi" placeholder="Label" value={deductionForm.label} onChange={e => setDeductionForm({ ...deductionForm, label: e.target.value })} required style={{ flex: 1 }} />
                  <input className="fi" type="number" placeholder="Amount" value={deductionForm.amount} onChange={e => setDeductionForm({ ...deductionForm, amount: e.target.value })} style={{ width: 110 }} />
                  <input className="fi" type="date" value={deductionForm.effectiveFrom} onChange={e => setDeductionForm({ ...deductionForm, effectiveFrom: e.target.value })} required />
                  <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Add</button>
                </form>
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'loans' && (
        <div style={{ padding: 'var(--pad)' }}>
          <div className="card" style={{ marginBottom: 16, padding: 12 }}>
            <label className="fl">SELECT STAFF MEMBER (FOR NEW LOAN/REIMBURSEMENT)</label>
            <select className="fi" value={selectedStaffId} onChange={e => setSelectedStaffId(e.target.value)}>
              <option value="">Choose staff...</option>
              {staffList.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
            </select>
          </div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">LOANS</span></div>
            {loans.map(l => (<div key={l.id} className="ri na" onClick={() => openLoan(l)} style={{ cursor: 'pointer' }}><div className="ri-b"><div className="ri-t">{staffName(l.staff_id)}</div><div className="ri-s">GHS {l.loan_amount} · Outstanding GHS {l.outstanding_balance}</div></div><span className={`bdg ${l.status === 'CLOSED' ? 'bok' : l.status === 'DEFAULTED' ? 'ber' : 'bwn'}`}>{l.status}</span></div>))}
            {loans.length === 0 && <div className="ri na"><div className="ri-s">None yet.</div></div>}
            {selectedStaffId && (
              <form onSubmit={handleAddLoan} style={{ display: 'flex', gap: 8, padding: 12, flexWrap: 'wrap' }}>
                <input className="fi" type="number" placeholder="Loan Amount" value={loanForm.loanAmount} onChange={e => setLoanForm({ ...loanForm, loanAmount: e.target.value })} required style={{ width: 130 }} />
                <input className="fi" type="number" placeholder="Interest %" value={loanForm.interestRate} onChange={e => setLoanForm({ ...loanForm, interestRate: e.target.value })} style={{ width: 110 }} />
                <input className="fi" type="date" value={loanForm.loanDate} onChange={e => setLoanForm({ ...loanForm, loanDate: e.target.value })} required />
                <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Issue Loan to {staffName(selectedStaffId)}</button>
              </form>
            )}
          </div>
          <div className="card">
            <div className="ch"><span className="ch-t">REIMBURSEMENTS</span></div>
            {reimbursements.map(r => (<div key={r.id} className="ri na"><div className="ri-b"><div className="ri-t">{staffName(r.staff_id)}</div><div className="ri-s">{r.expense_type} · GHS {r.amount}</div></div>
              <span className={`bdg ${r.status === 'APPROVED' ? 'bok' : r.status === 'REJECTED' ? 'ber' : 'bwn'}`} style={{ marginRight: 8 }}>{r.status}</span>
              {r.status === 'PENDING' && (<><button onClick={() => handleReimbursementStatus(r.id, 'APPROVED')} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--okB)', color: 'var(--ok)', fontWeight: 600, marginRight: 6 }}>Approve</button><button onClick={() => handleReimbursementStatus(r.id, 'REJECTED')} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--erB)', color: 'var(--er)', fontWeight: 600 }}>Reject</button></>)}
            </div>))}
            {reimbursements.length === 0 && <div className="ri na"><div className="ri-s">None yet.</div></div>}
            {selectedStaffId && (
              <form onSubmit={handleAddReimbursement} style={{ display: 'flex', gap: 8, padding: 12, flexWrap: 'wrap' }}>
                <input className="fi" placeholder="Expense type" value={reimbursementForm.expenseType} onChange={e => setReimbursementForm({ ...reimbursementForm, expenseType: e.target.value })} required style={{ flex: 1 }} />
                <input className="fi" type="number" placeholder="Amount" value={reimbursementForm.amount} onChange={e => setReimbursementForm({ ...reimbursementForm, amount: e.target.value })} required style={{ width: 120 }} />
                <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Request for {staffName(selectedStaffId)}</button>
              </form>
            )}
          </div>
        </div>
      )}

      {tab === 'bonuses' && (
        <div style={{ padding: 'var(--pad)' }}>
          <div className="card" style={{ marginBottom: 16, padding: 12 }}>
            <label className="fl">SELECT STAFF MEMBER (FOR NEW BONUS)</label>
            <select className="fi" value={selectedStaffId} onChange={e => setSelectedStaffId(e.target.value)}>
              <option value="">Choose staff...</option>
              {staffList.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
            </select>
          </div>
          {selectedStaffId && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="ch"><span className="ch-t">BONUSES — {staffName(selectedStaffId)}</span></div>
              {bonuses.map(b => (<div key={b.id} className="ri na"><div className="ri-b"><div className="ri-t">{b.bonus_type}</div><div className="ri-s">GHS {b.amount} · {b.date_awarded} · {b.reason || '—'}</div></div></div>))}
              {bonuses.length === 0 && <div className="ri na"><div className="ri-s">None yet.</div></div>}
              <form onSubmit={handleAddBonus} style={{ display: 'flex', gap: 8, padding: 12, flexWrap: 'wrap' }}>
                <select className="fi" value={bonusForm.bonusType} onChange={e => setBonusForm({ ...bonusForm, bonusType: e.target.value })}><option value="PERFORMANCE">Performance</option><option value="END_OF_YEAR">End of Year</option><option value="HOUSING">Housing</option><option value="TRANSPORT">Transport</option><option value="SPECIAL">Special</option></select>
                <input className="fi" type="number" placeholder="Amount" value={bonusForm.amount} onChange={e => setBonusForm({ ...bonusForm, amount: e.target.value })} required style={{ width: 110 }} />
                <input className="fi" placeholder="Reason" value={bonusForm.reason} onChange={e => setBonusForm({ ...bonusForm, reason: e.target.value })} style={{ flex: 1 }} />
                <input className="fi" type="date" value={bonusForm.dateAwarded} onChange={e => setBonusForm({ ...bonusForm, dateAwarded: e.target.value })} required />
                <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Add</button>
              </form>
            </div>
          )}
          <div className="card">
            <div className="ch"><span className="ch-t">PAY PERIODS</span></div>
            {periods.map(p => (<div key={p.id} className="ri na"><div className="ri-b"><div className="ri-t">{p.month}/{p.year}</div><div className="ri-s">{p.start_date} → {p.end_date}</div></div><span className={`bdg ${p.status === 'CLOSED' ? 'bok' : p.status === 'PROCESSING' ? 'bwn' : 'bin'}`}>{p.status}</span></div>))}
            {periods.length === 0 && <div className="ri na"><div className="ri-s">None yet.</div></div>}
            <form onSubmit={handleAddPeriod} style={{ display: 'flex', gap: 8, padding: 12, flexWrap: 'wrap' }}>
              <input className="fi" type="number" placeholder="Month" value={periodForm.month} onChange={e => setPeriodForm({ ...periodForm, month: e.target.value })} required style={{ width: 80 }} />
              <input className="fi" type="number" placeholder="Year" value={periodForm.year} onChange={e => setPeriodForm({ ...periodForm, year: e.target.value })} required style={{ width: 90 }} />
              <input className="fi" type="date" value={periodForm.startDate} onChange={e => setPeriodForm({ ...periodForm, startDate: e.target.value })} required />
              <input className="fi" type="date" value={periodForm.endDate} onChange={e => setPeriodForm({ ...periodForm, endDate: e.target.value })} required />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Add</button>
            </form>
          </div>
        </div>
      )}

      {tab === 'config' && (
        <div style={{ padding: 'var(--pad)' }}>
          <div className="alert al-in" style={{ marginBottom: 16 }}><span className="al-ic">ℹ️</span><div>PAYE and SSNIT rates are global (Ghana GRA-mandated) — shared across all schools on the platform.</div></div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">PAYE TAX BANDS</span></div>
            {taxRules.map(t => (<div key={t.id} className="ri na"><div className="ri-b"><div className="ri-t">{t.band_label}</div><div className="ri-s">GHS {t.income_from} - {t.income_to || '∞'} · {t.rate_pct}%</div></div></div>))}
            {taxRules.length === 0 && <div className="ri na"><div className="ri-s">None yet.</div></div>}
            <form onSubmit={handleAddTaxRule} style={{ display: 'flex', gap: 8, padding: 12, flexWrap: 'wrap' }}>
              <input className="fi" type="number" placeholder="Year" value={taxRuleForm.effectiveYear} onChange={e => setTaxRuleForm({ ...taxRuleForm, effectiveYear: e.target.value })} required style={{ width: 90 }} />
              <input className="fi" placeholder="Band label" value={taxRuleForm.bandLabel} onChange={e => setTaxRuleForm({ ...taxRuleForm, bandLabel: e.target.value })} required style={{ flex: 1 }} />
              <input className="fi" type="number" placeholder="From" value={taxRuleForm.incomeFrom} onChange={e => setTaxRuleForm({ ...taxRuleForm, incomeFrom: e.target.value })} required style={{ width: 100 }} />
              <input className="fi" type="number" placeholder="To (blank=∞)" value={taxRuleForm.incomeTo} onChange={e => setTaxRuleForm({ ...taxRuleForm, incomeTo: e.target.value })} style={{ width: 110 }} />
              <input className="fi" type="number" placeholder="Rate %" value={taxRuleForm.ratePct} onChange={e => setTaxRuleForm({ ...taxRuleForm, ratePct: e.target.value })} required style={{ width: 90 }} />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Add</button>
            </form>
          </div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">SSNIT RULES</span></div>
            {ssnitRules.map(s => (<div key={s.id} className="ri na"><div className="ri-b"><div className="ri-t">From {s.effective_from}</div><div className="ri-s">Employee {s.employee_rate_pct}% · Employer {s.employer_rate_pct}%</div></div><span className={`bdg ${s.is_active ? 'bok' : 'ber'}`}>{s.is_active ? 'Active' : 'Inactive'}</span></div>))}
            {ssnitRules.length === 0 && <div className="ri na"><div className="ri-s">None yet.</div></div>}
            <form onSubmit={handleAddSsnitRule} style={{ display: 'flex', gap: 8, padding: 12, flexWrap: 'wrap' }}>
              <input className="fi" type="date" value={ssnitForm.effectiveFrom} onChange={e => setSsnitForm({ ...ssnitForm, effectiveFrom: e.target.value })} required />
              <input className="fi" type="number" placeholder="Employee %" value={ssnitForm.employeeRatePct} onChange={e => setSsnitForm({ ...ssnitForm, employeeRatePct: e.target.value })} required style={{ width: 110 }} />
              <input className="fi" type="number" placeholder="Employer %" value={ssnitForm.employerRatePct} onChange={e => setSsnitForm({ ...ssnitForm, employerRatePct: e.target.value })} required style={{ width: 110 }} />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Add</button>
            </form>
          </div>
          <div className="card">
            <div className="ch"><span className="ch-t">OTHER STATUTORY DEDUCTIONS (NHIL, TIER 2, ETC.)</span></div>
            {statutoryDeductions.map(s => (<div key={s.id} className="ri na"><div className="ri-b"><div className="ri-t">{s.deduction_name}</div><div className="ri-s">{s.percentage}%</div></div><span className={`bdg ${s.is_active ? 'bok' : 'ber'}`}>{s.is_active ? 'Active' : 'Inactive'}</span></div>))}
            {statutoryDeductions.length === 0 && <div className="ri na"><div className="ri-s">None yet.</div></div>}
            <form onSubmit={handleAddStatutory} style={{ display: 'flex', gap: 8, padding: 12, flexWrap: 'wrap' }}>
              <input className="fi" placeholder="Deduction name" value={statutoryForm.deductionName} onChange={e => setStatutoryForm({ ...statutoryForm, deductionName: e.target.value })} required style={{ flex: 1 }} />
              <input className="fi" type="number" placeholder="Percentage" value={statutoryForm.percentage} onChange={e => setStatutoryForm({ ...statutoryForm, percentage: e.target.value })} required style={{ width: 110 }} />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Add</button>
            </form>
          </div>
        </div>
      )}

      {tab === 'audit' && (
        <div className="tbl" style={{ padding: 'var(--pad)' }}>
          <table className="data-table">
            <thead><tr><th>Action</th><th>Entity Type</th><th>Performed By</th><th>When</th><th>Notes</th></tr></thead>
            <tbody>
              {auditLog.map(a => (<tr key={a.id}><td>{a.action}</td><td>{a.entity_type}</td><td>{a.performed_by}</td><td style={{ fontSize: 11 }}>{new Date(a.timestamp).toLocaleString()}</td><td>{a.notes || '—'}</td></tr>))}
              {auditLog.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>No audit entries yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {viewingRun && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(4,13,52,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setViewingRun(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--white)', padding: 24, borderRadius: 'var(--r)', width: 460, maxHeight: '80vh', overflowY: 'auto', boxShadow: 'var(--shL)' }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, marginBottom: 4 }}>Payroll Run — {periodName(viewingRun.period_id)}</h3>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>{viewingRun.status} · {viewingRun.staff_count} staff · Net GHS {viewingRun.total_net}</div>
            {payslips.map(p => (
              <div key={p.id} className="ri na" onClick={() => openPayslip(p)} style={{ cursor: 'pointer' }}>
                <div className="ri-b"><div className="ri-t">{staffName(p.staff_id)}</div><div className="ri-s">Gross GHS {p.gross_salary} · Net GHS {p.net_salary}</div></div>
                <span className={`bdg ${p.is_paid ? 'bok' : 'bwn'}`}>{p.is_paid ? 'Paid' : 'Unpaid'}</span>
              </div>
            ))}
            {payslips.length === 0 && <div style={{ color: 'var(--muted)', fontSize: 12, padding: 8 }}>No payslips yet.</div>}
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              {viewingRun.status === 'PENDING_APPROVAL' && <button onClick={() => handleApproveRun(viewingRun.id)} style={{ flex: 1, background: 'var(--okB)', color: 'var(--ok)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Approve Run</button>}
              {viewingRun.status !== 'REVERSED' && <button onClick={() => handleReverseRun(viewingRun.id)} style={{ flex: 1, background: 'var(--erB)', color: 'var(--er)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Reverse</button>}
              <button onClick={() => setViewingRun(null)} style={{ flex: 1, background: 'var(--soft)', color: 'var(--ink)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {viewingPayslip && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(4,13,52,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 101 }} onClick={() => setViewingPayslip(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--white)', padding: 24, borderRadius: 'var(--r)', width: 400, maxHeight: '80vh', overflowY: 'auto', boxShadow: 'var(--shL)' }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, marginBottom: 4 }}>{staffName(viewingPayslip.staff_id)}</h3>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>Net Pay: GHS {viewingPayslip.net_salary}</div>
            {payslipItems.map(it => (<div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--bd)', fontSize: 13 }}><span>{it.component_name}</span><span style={{ color: Number(it.amount) < 0 ? 'var(--er)' : 'var(--ink)' }}>GHS {it.amount}</span></div>))}
            <div style={{ fontWeight: 600, fontSize: 12, marginTop: 16, marginBottom: 6 }}>PAYMENTS</div>
            {payslipPayments.map(p => (<div key={p.id} style={{ fontSize: 13, padding: '4px 0' }}>{p.payment_method} · GHS {p.amount} · {p.reference_number || '—'}</div>))}
            {!viewingPayslip.is_paid && (
              <form onSubmit={handleRecordPayment} style={{ marginTop: 12 }}>
                <select className="fi" value={paymentForm.paymentMethod} onChange={e => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })} style={{ marginBottom: 8 }}><option value="BANK_TRANSFER">Bank Transfer</option><option value="MOMO">Mobile Money</option><option value="CHEQUE">Cheque</option><option value="CASH">Cash</option></select>
                <input className="fi" type="number" placeholder="Amount" value={paymentForm.amount} onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })} required style={{ marginBottom: 8 }} />
                <input className="fi" placeholder="Reference Number" value={paymentForm.referenceNumber} onChange={e => setPaymentForm({ ...paymentForm, referenceNumber: e.target.value })} style={{ marginBottom: 8 }} />
                <button type="submit" style={{ width: '100%', background: 'var(--navy)', color: 'var(--gold)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Record Payment</button>
              </form>
            )}
            <button onClick={() => setViewingPayslip(null)} style={{ marginTop: 12, width: '100%', background: 'var(--soft)', color: 'var(--ink)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Close</button>
          </div>
        </div>
      )}

      {viewingLoan && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(4,13,52,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setViewingLoan(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--white)', padding: 24, borderRadius: 'var(--r)', width: 380, maxHeight: '80vh', overflowY: 'auto', boxShadow: 'var(--shL)' }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, marginBottom: 4 }}>{staffName(viewingLoan.staff_id)}'s Loan</h3>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>GHS {viewingLoan.loan_amount} · Outstanding GHS {viewingLoan.outstanding_balance}</div>
            {loanRepayments.map(r => (<div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--bd)', fontSize: 13 }}><span>{r.repayment_date}</span><span>GHS {r.repayment_amount}</span></div>))}
            {loanRepayments.length === 0 && <div style={{ color: 'var(--muted)', fontSize: 12, padding: 8 }}>No repayments yet.</div>}
            {viewingLoan.status === 'ACTIVE' && (
              <form onSubmit={handleAddRepayment} style={{ marginTop: 12 }}>
                <input className="fi" type="number" placeholder="Amount" value={repaymentForm.repaymentAmount} onChange={e => setRepaymentForm({ ...repaymentForm, repaymentAmount: e.target.value })} required style={{ marginBottom: 8 }} />
                <input className="fi" type="date" value={repaymentForm.repaymentDate} onChange={e => setRepaymentForm({ ...repaymentForm, repaymentDate: e.target.value })} required style={{ marginBottom: 8 }} />
                <button type="submit" style={{ width: '100%', background: 'var(--navy)', color: 'var(--gold)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Record Repayment</button>
              </form>
            )}
            <button onClick={() => setViewingLoan(null)} style={{ marginTop: 12, width: '100%', background: 'var(--soft)', color: 'var(--ink)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Close</button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
