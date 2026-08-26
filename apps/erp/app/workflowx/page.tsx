'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authedFetch } from '../../lib/api';
import AppShell from '../../components/AppShell';

const TABS = [
  { key: 'definitions', label: 'Workflow Definitions' },
  { key: 'instances', label: 'Active Requests' },
];

export default function WorkflowXPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [user, setUser] = useState<any>(null);
  const [school, setSchool] = useState<any>(null);
  const [tab, setTab] = useState('definitions');
  const [error, setError] = useState('');

  const [definitions, setDefinitions] = useState<any[]>([]);
  const [steps, setSteps] = useState<any[]>([]);
  const [instances, setInstances] = useState<any[]>([]);
  const [approvals, setApprovals] = useState<any[]>([]);

  const [defForm, setDefForm] = useState({ name: '', entityType: '', description: '' });
  const [stepForm, setStepForm] = useState({ workflowId: '', stepOrder: '1', stepName: '', approverRole: '' });
  const [instanceForm, setInstanceForm] = useState({ workflowId: '', entityId: '', entityType: '' });
  const [approvalForm, setApprovalForm] = useState({ instanceId: '', stepId: '', decision: 'APPROVED', comments: '', isFinalStep: true });

  const [summary, setSummary] = useState<any>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState('');

  useEffect(() => {
    const t = 'cookie';
    const userStr = sessionStorage.getItem('sukuu_user');
    if (!t) { router.push('/login'); return; }
    setToken(t); setUser(userStr ? JSON.parse(userStr) : null);
    loadAll(t);
  }, [router]);

  function loadAll(t: string) {
    authedFetch('/api/v1/school/profile', t).then(d => d && !d.error && setSchool(d));
    authedFetch('/api/v1/workflow/definitions', t).then(d => Array.isArray(d) ? setDefinitions(d) : setError(d?.error));
    authedFetch('/api/v1/workflow/steps', t).then(d => Array.isArray(d) && setSteps(d));
    authedFetch('/api/v1/workflow/instances', t).then(d => Array.isArray(d) && setInstances(d));
    authedFetch('/api/v1/workflow/approvals', t).then(d => Array.isArray(d) && setApprovals(d));
    setSummaryLoading(true);
    authedFetch('/api/v1/workflow/summary', t)
      .then(d => { if (d && !d.error) { setSummary(d); setSummaryError(''); } else setSummaryError(d?.error || 'Failed to load summary'); })
      .catch(() => setSummaryError('Failed to load summary')).finally(() => setSummaryLoading(false));
  }

  function defName(id: string) { return definitions.find(d => d.id === id)?.name || id?.slice(0, 8) || '—'; }
  async function post(url: string, body: any, resetFn: () => void) { await authedFetch(url, token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); resetFn(); loadAll(token); }

  if (error) return <AppShell user={user}><div style={{ padding: 40, color: 'var(--er)' }}>{error}</div></AppShell>;

  return (
    <AppShell user={user} schoolName={school?.name}>
      <div className="ph">
        <div className="ph-row">
          <div>
            <div className="ph-ey">SUKUU ERP · WORKFLOWX · 4 TABLES · sukuux SCHEMA</div>
            <div className="ph-title">🔁 WorkflowX</div>
            <div className="ph-sub">Reusable Requests · Approval · Escalation · Delegation · Evidence</div>
          </div>
        </div>
      </div>

      {summaryError && <div style={{ padding: '0 var(--pad)', marginBottom: 'var(--gap)' }}><div className="alert al-er"><span className="al-ic">⚠️</span><div>Couldn't load the workflow overview: {summaryError}.</div></div></div>}

      {summaryLoading ? (
        <div className="fx-overview"><div className="stat-grid">{[1, 2, 3, 4].map(i => <div key={i} className="skel skel-card" />)}</div></div>
      ) : summary && (
        <div className="fx-overview">
          <div className="stat-grid">
            <button className="fx-card-btn" onClick={() => setTab('definitions')}>
              <div className="sc" title="Workflow definitions with is_active true"><div className="sc-top"><div className="sc-icon" style={{ background: 'var(--inB)' }}>🔁</div></div><div className="sc-val">{summary.activeDefinitions}</div><div className="sc-lbl">ACTIVE WORKFLOWS</div></div>
            </button>
            <button className="fx-card-btn" onClick={() => setTab('instances')}>
              <div className="sc" title="Instances with status PENDING or IN_PROGRESS"><div className="sc-top"><div className="sc-icon" style={{ background: summary.pendingInstances > 0 ? 'var(--erB)' : 'var(--okB)' }}>⏳</div></div><div className="sc-val">{summary.pendingInstances}</div><div className="sc-lbl">AWAITING APPROVAL</div></div>
            </button>
            <button className="fx-card-btn" onClick={() => setTab('instances')}>
              <div className="sc" title="Instances approved so far this calendar month"><div className="sc-top"><div className="sc-icon" style={{ background: 'var(--okB)' }}>✅</div></div><div className="sc-val">{summary.approvedThisMonth}</div><div className="sc-lbl">APPROVED THIS MONTH</div></div>
            </button>
            <button className="fx-card-btn" onClick={() => setTab('instances')}>
              <div className="sc" title="Instances rejected so far this calendar month"><div className="sc-top"><div className="sc-icon" style={{ background: 'var(--puB)' }}>❌</div></div><div className="sc-val">{summary.rejectedThisMonth}</div><div className="sc-lbl">REJECTED THIS MONTH</div></div>
            </button>
          </div>
        </div>
      )}

      <div className="sys-tabs">{TABS.map(t => <button key={t.key} className={`sys-tab-btn${tab === t.key ? ' act' : ''}`} onClick={() => setTab(t.key)}>{t.label}</button>)}</div>

      {tab === 'definitions' && (
        <div style={{ padding: 'var(--pad)' }}>
          <form className="card" onSubmit={e => { e.preventDefault(); post('/api/v1/workflow/definitions', defForm, () => setDefForm({ name: '', entityType: '', description: '' })); }} style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">WORKFLOW DEFINITIONS</span></div>
            <div className="cb" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input className="fi" placeholder="Name" value={defForm.name} onChange={e => setDefForm({ ...defForm, name: e.target.value })} required style={{ flex: 1, minWidth: 140 }} />
              <input className="fi" placeholder="Entity type" value={defForm.entityType} onChange={e => setDefForm({ ...defForm, entityType: e.target.value })} required style={{ width: 140 }} />
              <input className="fi" placeholder="Description" value={defForm.description} onChange={e => setDefForm({ ...defForm, description: e.target.value })} style={{ flex: 1, minWidth: 160 }} />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Add</button>
            </div>
            {definitions.map(d => <div key={d.id} className="ri na"><div className="ri-b"><div className="ri-t">{d.name}</div><div className="ri-s">{d.entity_type} · {steps.filter(s => s.workflow_id === d.id).length} steps</div></div></div>)}
            {definitions.length === 0 && <div className="ri na"><div className="ri-s">No workflow definitions yet.</div></div>}
          </form>
          <form className="card" onSubmit={e => { e.preventDefault(); post('/api/v1/workflow/steps', { ...stepForm, stepOrder: Number(stepForm.stepOrder) }, () => setStepForm({ workflowId: '', stepOrder: '1', stepName: '', approverRole: '' })); }}>
            <div className="ch"><span className="ch-t">STEPS</span></div>
            <div className="cb" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <select className="fi" value={stepForm.workflowId} onChange={e => setStepForm({ ...stepForm, workflowId: e.target.value })} required><option value="">Workflow...</option>{definitions.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
              <input className="fi" type="number" placeholder="Order" value={stepForm.stepOrder} onChange={e => setStepForm({ ...stepForm, stepOrder: e.target.value })} required style={{ width: 80 }} />
              <input className="fi" placeholder="Step name" value={stepForm.stepName} onChange={e => setStepForm({ ...stepForm, stepName: e.target.value })} required style={{ flex: 1, minWidth: 140 }} />
              <input className="fi" placeholder="Approver role" value={stepForm.approverRole} onChange={e => setStepForm({ ...stepForm, approverRole: e.target.value })} required style={{ width: 140 }} />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Add Step</button>
            </div>
            {steps.map(s => <div key={s.id} className="ri na"><div className="ri-b"><div className="ri-t">{s.step_order}. {s.step_name}</div><div className="ri-s">{defName(s.workflow_id)} · Approver: {s.approver_role}</div></div></div>)}
            {steps.length === 0 && <div className="ri na"><div className="ri-s">No steps defined yet.</div></div>}
          </form>
        </div>
      )}

      {tab === 'instances' && (
        <div style={{ padding: 'var(--pad)' }}>
          <form className="card" onSubmit={e => { e.preventDefault(); post('/api/v1/workflow/instances', instanceForm, () => setInstanceForm({ workflowId: '', entityId: '', entityType: '' })); }} style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">RAISE REQUEST</span></div>
            <div className="cb" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <select className="fi" value={instanceForm.workflowId} onChange={e => setInstanceForm({ ...instanceForm, workflowId: e.target.value })} required><option value="">Workflow...</option>{definitions.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
              <input className="fi" placeholder="Entity ID" value={instanceForm.entityId} onChange={e => setInstanceForm({ ...instanceForm, entityId: e.target.value })} required style={{ flex: 1, minWidth: 160 }} />
              <input className="fi" placeholder="Entity type" value={instanceForm.entityType} onChange={e => setInstanceForm({ ...instanceForm, entityType: e.target.value })} required style={{ width: 140 }} />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Raise</button>
            </div>
            <div className="tbl">
              <table className="data-table">
                <thead><tr><th>Workflow</th><th>Entity</th><th>Status</th></tr></thead>
                <tbody>
                  {instances.map(i => <tr key={i.id}><td>{defName(i.workflow_id)}</td><td>{i.entity_type} · {i.entity_id.slice(0, 8)}</td><td><span className={`bdg ${i.status === 'APPROVED' ? 'bok' : i.status === 'REJECTED' || i.status === 'CANCELLED' ? 'ber' : 'bwn'}`}>{i.status}</span></td></tr>)}
                  {instances.length === 0 && <tr><td colSpan={3} style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>No requests raised yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </form>
          <form className="card" onSubmit={e => { e.preventDefault(); post('/api/v1/workflow/approvals', approvalForm, () => setApprovalForm({ instanceId: '', stepId: '', decision: 'APPROVED', comments: '', isFinalStep: true })); }}>
            <div className="ch"><span className="ch-t">RECORD DECISION</span></div>
            <div className="cb" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <select className="fi" value={approvalForm.instanceId} onChange={e => setApprovalForm({ ...approvalForm, instanceId: e.target.value })} required><option value="">Request...</option>{instances.filter(i => i.status === 'PENDING' || i.status === 'IN_PROGRESS').map(i => <option key={i.id} value={i.id}>{defName(i.workflow_id)} - {i.entity_id.slice(0, 8)}</option>)}</select>
              <select className="fi" value={approvalForm.stepId} onChange={e => setApprovalForm({ ...approvalForm, stepId: e.target.value })} required><option value="">Step...</option>{steps.map(s => <option key={s.id} value={s.id}>{s.step_name}</option>)}</select>
              <select className="fi" value={approvalForm.decision} onChange={e => setApprovalForm({ ...approvalForm, decision: e.target.value })}><option value="APPROVED">Approve</option><option value="REJECTED">Reject</option><option value="ESCALATED">Escalate</option></select>
              <input className="fi" placeholder="Comments" value={approvalForm.comments} onChange={e => setApprovalForm({ ...approvalForm, comments: e.target.value })} style={{ flex: 1, minWidth: 140 }} />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Submit Decision</button>
            </div>
            {approvals.map(a => <div key={a.id} className="ri na"><div className="ri-b"><div className="ri-t">{a.decision}</div><div className="ri-s">{a.comments || 'No comments'}</div></div></div>)}
            {approvals.length === 0 && <div className="ri na"><div className="ri-s">No decisions recorded yet.</div></div>}
          </form>
        </div>
      )}
    </AppShell>
  );
}
