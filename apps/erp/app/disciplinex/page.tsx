'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authedFetch } from '../../lib/api';
import AppShell from '../../components/AppShell';

const TABS = [
  { key: 'incidents', label: 'Incidents & Actions' },
  { key: 'suspensions', label: 'Suspensions' },
  { key: 'commendations', label: 'Commendations' },
  { key: 'scores', label: 'Behavior Scores' },
];

export default function DisciplineXPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [user, setUser] = useState<any>(null);
  const [school, setSchool] = useState<any>(null);
  const [tab, setTab] = useState('incidents');
  const [error, setError] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);

  const [incidents, setIncidents] = useState<any[]>([]);
  const [actions, setActions] = useState<any[]>([]);
  const [suspensions, setSuspensions] = useState<any[]>([]);
  const [commendations, setCommendations] = useState<any[]>([]);
  const [scores, setScores] = useState<any[]>([]);

  const [incidentForm, setIncidentForm] = useState({ studentId: '', incidentType: '', severity: 'LOW', description: '', incidentDate: '' });
  const [actionForm, setActionForm] = useState({ incidentId: '', actionType: '', startDate: '', endDate: '' });
  const [suspensionForm, setSuspensionForm] = useState({ studentId: '', reason: '', startDate: '', endDate: '', parentNotified: false });
  const [commendationForm, setCommendationForm] = useState({ studentId: '', commendationType: '', awardDate: '', remarks: '' });
  const [scoreForm, setScoreForm] = useState({ studentId: '', termId: '', score: '', riskLevel: 'LOW' });

  const [summary, setSummary] = useState<any>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState('');

  useEffect(() => {
    const t = localStorage.getItem('sukuu_token');
    const userStr = localStorage.getItem('sukuu_user');
    if (!t) { router.push('/login'); return; }
    setToken(t); setUser(userStr ? JSON.parse(userStr) : null);
    loadAll(t);
  }, [router]);

  function loadAll(t: string) {
    authedFetch('/api/v1/school/profile', t).then(d => d && !d.error && setSchool(d));
    authedFetch('/api/v1/students', t).then(d => Array.isArray(d) ? setStudents(d) : setError(d?.error));
    authedFetch('/api/v1/academic/terms', t).then(d => Array.isArray(d) && setTerms(d));
    authedFetch('/api/v1/discipline/incidents', t).then(d => Array.isArray(d) && setIncidents(d));
    authedFetch('/api/v1/discipline/actions', t).then(d => Array.isArray(d) && setActions(d));
    authedFetch('/api/v1/discipline/suspensions', t).then(d => Array.isArray(d) && setSuspensions(d));
    authedFetch('/api/v1/discipline/commendations', t).then(d => Array.isArray(d) && setCommendations(d));
    authedFetch('/api/v1/discipline/behavior-scores', t).then(d => Array.isArray(d) && setScores(d));
    setSummaryLoading(true);
    authedFetch('/api/v1/discipline/summary', t)
      .then(d => { if (d && !d.error) { setSummary(d); setSummaryError(''); } else setSummaryError(d?.error || 'Failed to load summary'); })
      .catch(() => setSummaryError('Failed to load summary')).finally(() => setSummaryLoading(false));
  }

  function studentName(id: string) { const s = students.find(x => x.id === id); return s ? `${s.first_name} ${s.last_name}` : id?.slice(0, 8) || '—'; }
  async function post(url: string, body: any, resetFn: () => void) { await authedFetch(url, token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); resetFn(); loadAll(token); }
  async function patch(url: string, body: any) { await authedFetch(url, token, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); loadAll(token); }

  if (error) return <AppShell user={user}><div style={{ padding: 40, color: 'var(--er)' }}>{error}</div></AppShell>;

  return (
    <AppShell user={user} schoolName={school?.name}>
      <div className="ph">
        <div className="ph-row">
          <div>
            <div className="ph-ey">SUKUU ERP · DISCIPLINEX · 5 TABLES · sukuux SCHEMA</div>
            <div className="ph-title">⚖️ DisciplineX</div>
            <div className="ph-sub">Incidents · Response · Conduct · Restorative Follow-Up</div>
          </div>
        </div>
      </div>

      {summaryError && <div style={{ padding: '0 var(--pad)', marginBottom: 'var(--gap)' }}><div className="alert al-er"><span className="al-ic">⚠️</span><div>Couldn't load the discipline overview: {summaryError}.</div></div></div>}

      {summaryLoading ? (
        <div className="fx-overview"><div className="stat-grid">{[1, 2, 3, 4].map(i => <div key={i} className="skel skel-card" />)}</div></div>
      ) : summary && (
        <div className="fx-overview">
          <div className="stat-grid">
            <button className="fx-card-btn" onClick={() => setTab('incidents')}>
              <div className="sc" title="Total incidents on record"><div className="sc-top"><div className="sc-icon" style={{ background: 'var(--inB)' }}>📋</div></div><div className="sc-val">{summary.totalIncidents}</div><div className="sc-lbl">TOTAL INCIDENTS</div></div>
            </button>
            <button className="fx-card-btn" onClick={() => setTab('incidents')}>
              <div className="sc" title="Disciplinary actions with status PENDING"><div className="sc-top"><div className="sc-icon" style={{ background: summary.openIncidents > 0 ? 'var(--erB)' : 'var(--okB)' }}>⏳</div></div><div className="sc-val">{summary.openIncidents}</div><div className="sc-lbl">PENDING ACTIONS</div></div>
            </button>
            <button className="fx-card-btn" onClick={() => setTab('suspensions')}>
              <div className="sc" title="Suspensions with end_date today or later"><div className="sc-top"><div className="sc-icon" style={{ background: summary.activeSuspensions > 0 ? 'var(--erB)' : 'var(--okB)' }}>🚫</div></div><div className="sc-val">{summary.activeSuspensions}</div><div className="sc-lbl">ACTIVE SUSPENSIONS</div></div>
            </button>
            <button className="fx-card-btn" onClick={() => setTab('scores')}>
              <div className="sc" title="Behavior scores flagged CRITICAL risk"><div className="sc-top"><div className="sc-icon" style={{ background: summary.criticalRisk > 0 ? 'var(--erB)' : 'var(--okB)' }}>🔴</div></div><div className="sc-val">{summary.criticalRisk}</div><div className="sc-lbl">CRITICAL RISK STUDENTS</div></div>
            </button>
          </div>
        </div>
      )}

      <div className="sys-tabs">{TABS.map(t => <button key={t.key} className={`sys-tab-btn${tab === t.key ? ' act' : ''}`} onClick={() => setTab(t.key)}>{t.label}</button>)}</div>

      {tab === 'incidents' && (
        <div style={{ padding: 'var(--pad)' }}>
          <form className="card" onSubmit={e => { e.preventDefault(); post('/api/v1/discipline/incidents', incidentForm, () => setIncidentForm({ studentId: '', incidentType: '', severity: 'LOW', description: '', incidentDate: '' })); }} style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">RECORD INCIDENT</span></div>
            <div className="cb" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <select className="fi" value={incidentForm.studentId} onChange={e => setIncidentForm({ ...incidentForm, studentId: e.target.value })} required><option value="">Student...</option>{students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}</select>
              <input className="fi" placeholder="Type" value={incidentForm.incidentType} onChange={e => setIncidentForm({ ...incidentForm, incidentType: e.target.value })} required style={{ width: 140 }} />
              <select className="fi" value={incidentForm.severity} onChange={e => setIncidentForm({ ...incidentForm, severity: e.target.value })}><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="CRITICAL">Critical</option></select>
              <input className="fi" type="date" value={incidentForm.incidentDate} onChange={e => setIncidentForm({ ...incidentForm, incidentDate: e.target.value })} required />
              <input className="fi" placeholder="Description" value={incidentForm.description} onChange={e => setIncidentForm({ ...incidentForm, description: e.target.value })} required style={{ flex: 1, minWidth: 160 }} />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Record</button>
            </div>
            <div className="tbl">
              <table className="data-table">
                <thead><tr><th>Student</th><th>Type</th><th>Severity</th><th>Date</th></tr></thead>
                <tbody>
                  {incidents.map(i => <tr key={i.id}><td>{studentName(i.student_id)}</td><td>{i.incident_type}</td><td><span className={`bdg ${i.severity === 'CRITICAL' || i.severity === 'HIGH' ? 'ber' : i.severity === 'MEDIUM' ? 'bwn' : 'bin'}`}>{i.severity}</span></td><td style={{ fontSize: 11 }}>{i.incident_date}</td></tr>)}
                  {incidents.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>No incidents recorded.</td></tr>}
                </tbody>
              </table>
            </div>
          </form>
          <form className="card" onSubmit={e => { e.preventDefault(); post('/api/v1/discipline/actions', actionForm, () => setActionForm({ incidentId: '', actionType: '', startDate: '', endDate: '' })); }}>
            <div className="ch"><span className="ch-t">RESPONSE ACTIONS</span></div>
            <div className="cb" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <select className="fi" value={actionForm.incidentId} onChange={e => setActionForm({ ...actionForm, incidentId: e.target.value })} required><option value="">Incident...</option>{incidents.map(i => <option key={i.id} value={i.id}>{studentName(i.student_id)} - {i.incident_type}</option>)}</select>
              <input className="fi" placeholder="Action type" value={actionForm.actionType} onChange={e => setActionForm({ ...actionForm, actionType: e.target.value })} required style={{ width: 160 }} />
              <input className="fi" type="date" value={actionForm.startDate} onChange={e => setActionForm({ ...actionForm, startDate: e.target.value })} required />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Add Action</button>
            </div>
            {actions.map(a => (
              <div key={a.id} className="ri na">
                <div className="ri-b"><div className="ri-t">{a.action_type}</div><div className="ri-s">From {a.start_date}</div></div>
                <select className="fi" style={{ fontSize: 11, padding: '4px 8px' }} value={a.status} onChange={e => patch(`/api/v1/discipline/actions/${a.id}/status`, { status: e.target.value })}>
                  <option value="PENDING">Pending</option><option value="IN_PROGRESS">In Progress</option><option value="COMPLETED">Completed</option>
                </select>
              </div>
            ))}
            {actions.length === 0 && <div className="ri na"><div className="ri-s">No actions logged yet.</div></div>}
          </form>
        </div>
      )}

      {tab === 'suspensions' && (
        <div style={{ padding: 'var(--pad)' }}>
          <form className="card" onSubmit={e => { e.preventDefault(); post('/api/v1/discipline/suspensions', suspensionForm, () => setSuspensionForm({ studentId: '', reason: '', startDate: '', endDate: '', parentNotified: false })); }}>
            <div className="ch"><span className="ch-t">SUSPENSIONS</span></div>
            <div className="cb" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <select className="fi" value={suspensionForm.studentId} onChange={e => setSuspensionForm({ ...suspensionForm, studentId: e.target.value })} required><option value="">Student...</option>{students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}</select>
              <input className="fi" placeholder="Reason" value={suspensionForm.reason} onChange={e => setSuspensionForm({ ...suspensionForm, reason: e.target.value })} required style={{ flex: 1, minWidth: 140 }} />
              <input className="fi" type="date" value={suspensionForm.startDate} onChange={e => setSuspensionForm({ ...suspensionForm, startDate: e.target.value })} required />
              <input className="fi" type="date" value={suspensionForm.endDate} onChange={e => setSuspensionForm({ ...suspensionForm, endDate: e.target.value })} required />
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}><input type="checkbox" checked={suspensionForm.parentNotified} onChange={e => setSuspensionForm({ ...suspensionForm, parentNotified: e.target.checked })} /> Parent notified</label>
              <button type="submit" style={{ background: 'var(--erB)', color: 'var(--er)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Record</button>
            </div>
            <div className="tbl">
              <table className="data-table">
                <thead><tr><th>Student</th><th>Reason</th><th>Period</th><th>Parent Notified</th></tr></thead>
                <tbody>
                  {suspensions.map(s => <tr key={s.id}><td>{studentName(s.student_id)}</td><td>{s.reason}</td><td style={{ fontSize: 11 }}>{s.start_date} → {s.end_date}</td><td>{s.parent_notified ? '✅' : '—'}</td></tr>)}
                  {suspensions.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>No suspensions recorded.</td></tr>}
                </tbody>
              </table>
            </div>
          </form>
        </div>
      )}

      {tab === 'commendations' && (
        <div style={{ padding: 'var(--pad)' }}>
          <form className="card" onSubmit={e => { e.preventDefault(); post('/api/v1/discipline/commendations', commendationForm, () => setCommendationForm({ studentId: '', commendationType: '', awardDate: '', remarks: '' })); }}>
            <div className="ch"><span className="ch-t">COMMENDATIONS</span></div>
            <div className="cb" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <select className="fi" value={commendationForm.studentId} onChange={e => setCommendationForm({ ...commendationForm, studentId: e.target.value })} required><option value="">Student...</option>{students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}</select>
              <input className="fi" placeholder="Type" value={commendationForm.commendationType} onChange={e => setCommendationForm({ ...commendationForm, commendationType: e.target.value })} required style={{ width: 160 }} />
              <input className="fi" type="date" value={commendationForm.awardDate} onChange={e => setCommendationForm({ ...commendationForm, awardDate: e.target.value })} required />
              <input className="fi" placeholder="Remarks" value={commendationForm.remarks} onChange={e => setCommendationForm({ ...commendationForm, remarks: e.target.value })} style={{ flex: 1, minWidth: 140 }} />
              <button type="submit" style={{ background: 'var(--okB)', color: 'var(--ok)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Award</button>
            </div>
            {commendations.map(c => <div key={c.id} className="ri na"><div className="ri-b"><div className="ri-t">{studentName(c.student_id)}</div><div className="ri-s">{c.commendation_type} · {c.award_date}</div></div></div>)}
            {commendations.length === 0 && <div className="ri na"><div className="ri-s">No commendations yet.</div></div>}
          </form>
        </div>
      )}

      {tab === 'scores' && (
        <div style={{ padding: 'var(--pad)' }}>
          <form className="card" onSubmit={e => { e.preventDefault(); post('/api/v1/discipline/behavior-scores', scoreForm, () => setScoreForm({ studentId: '', termId: '', score: '', riskLevel: 'LOW' })); }}>
            <div className="ch"><span className="ch-t">BEHAVIOR SCORES</span></div>
            <div className="cb" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <select className="fi" value={scoreForm.studentId} onChange={e => setScoreForm({ ...scoreForm, studentId: e.target.value })} required><option value="">Student...</option>{students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}</select>
              <select className="fi" value={scoreForm.termId} onChange={e => setScoreForm({ ...scoreForm, termId: e.target.value })} required><option value="">Term...</option>{terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
              <input className="fi" type="number" placeholder="Score" value={scoreForm.score} onChange={e => setScoreForm({ ...scoreForm, score: e.target.value })} required style={{ width: 100 }} />
              <select className="fi" value={scoreForm.riskLevel} onChange={e => setScoreForm({ ...scoreForm, riskLevel: e.target.value })}><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="CRITICAL">Critical</option></select>
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Record</button>
            </div>
            <div className="tbl">
              <table className="data-table">
                <thead><tr><th>Student</th><th>Score</th><th>Risk</th></tr></thead>
                <tbody>
                  {scores.map(s => <tr key={s.id}><td>{studentName(s.student_id)}</td><td>{s.score}</td><td><span className={`bdg ${s.risk_level === 'CRITICAL' || s.risk_level === 'HIGH' ? 'ber' : s.risk_level === 'MEDIUM' ? 'bwn' : 'bok'}`}>{s.risk_level}</span></td></tr>)}
                  {scores.length === 0 && <tr><td colSpan={3} style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>No behavior scores yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </form>
        </div>
      )}
    </AppShell>
  );
}
