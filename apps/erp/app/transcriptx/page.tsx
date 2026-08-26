'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authedFetch } from '../../lib/api';
import AppShell from '../../components/AppShell';

const TABS = [
  { key: 'records', label: 'Transcript Records' },
  { key: 'requests', label: 'Requests & Issuance' },
  { key: 'verification', label: 'Verification' },
  { key: 'config', label: 'Grade Scales & Policies' },
];

export default function TranscriptXPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [user, setUser] = useState<any>(null);
  const [school, setSchool] = useState<any>(null);
  const [tab, setTab] = useState('records');
  const [error, setError] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);

  const [records, setRecords] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [verifications, setVerifications] = useState<any[]>([]);
  const [gradeScales, setGradeScales] = useState<any[]>([]);
  const [gpaPolicies, setGpaPolicies] = useState<any[]>([]);

  const [recordForm, setRecordForm] = useState({ enrollmentId: '', termId: '', gpa: '', cgpa: '' });
  const [requestForm, setRequestForm] = useState({ studentId: '', purpose: '', recipientInstitution: '', copiesRequested: '1' });
  const [verifyForm, setVerifyForm] = useState({ transcriptId: '', verificationMethod: 'MANUAL', verifyingInstitution: '', isAuthentic: true });
  const [scaleForm, setScaleForm] = useState({ name: '', minScore: '', maxScore: '', grade: '', gradePoint: '' });
  const [policyForm, setPolicyForm] = useState({ name: '', calculationMethod: 'UNWEIGHTED', scaleMax: '4.0' });

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
    authedFetch('/api/v1/students', t).then(d => Array.isArray(d) ? setStudents(d) : setError(d?.error));
    authedFetch('/api/v1/academic/terms', t).then(d => Array.isArray(d) && setTerms(d));
    authedFetch('/api/v1/transcript/records', t).then(d => Array.isArray(d) && setRecords(d));
    authedFetch('/api/v1/transcript/requests', t).then(d => Array.isArray(d) && setRequests(d));
    authedFetch('/api/v1/transcript/verifications', t).then(d => Array.isArray(d) && setVerifications(d));
    authedFetch('/api/v1/transcript/grade-scales', t).then(d => Array.isArray(d) && setGradeScales(d));
    authedFetch('/api/v1/transcript/gpa-policies', t).then(d => Array.isArray(d) && setGpaPolicies(d));
    setSummaryLoading(true);
    authedFetch('/api/v1/transcript/summary', t)
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
            <div className="ph-ey">SUKUU ERP · TRANSCRIPTX · 17 TABLES · sukuux SCHEMA</div>
            <div className="ph-title">📜 TranscriptX</div>
            <div className="ph-sub">Verified Academic History · Issue · Correction · Verification</div>
          </div>
        </div>
      </div>

      {summaryError && <div style={{ padding: '0 var(--pad)', marginBottom: 'var(--gap)' }}><div className="alert al-er"><span className="al-ic">⚠️</span><div>Couldn't load the transcript overview: {summaryError}.</div></div></div>}

      {summaryLoading ? (
        <div className="fx-overview"><div className="stat-grid">{[1, 2, 3, 4].map(i => <div key={i} className="skel skel-card" />)}</div></div>
      ) : summary && (
        <div className="fx-overview">
          <div className="stat-grid">
            <button className="fx-card-btn" onClick={() => setTab('records')}>
              <div className="sc" title="Total transcript records, locked count highlighted"><div className="sc-top"><div className="sc-icon" style={{ background: 'var(--inB)' }}>📜</div></div><div className="sc-val">{summary.totalRecords}</div><div className="sc-lbl">TRANSCRIPT RECORDS</div><div className="sc-foot">{summary.lockedRecords} locked</div></div>
            </button>
            <button className="fx-card-btn" onClick={() => setTab('requests')}>
              <div className="sc" title="Transcript requests with status PENDING"><div className="sc-top"><div className="sc-icon" style={{ background: summary.pendingRequests > 0 ? 'var(--erB)' : 'var(--okB)' }}>📥</div></div><div className="sc-val">{summary.pendingRequests}</div><div className="sc-lbl">PENDING REQUESTS</div></div>
            </button>
            <button className="fx-card-btn" onClick={() => setTab('requests')}>
              <div className="sc" title="Transcripts issued so far this calendar month"><div className="sc-top"><div className="sc-icon" style={{ background: 'var(--okB)' }}>✅</div></div><div className="sc-val">{summary.issuedThisMonth}</div><div className="sc-lbl">ISSUED THIS MONTH</div></div>
            </button>
            <button className="fx-card-btn" onClick={() => setTab('records')}>
              <div className="sc" title="Graduation statuses with status GRADUATED"><div className="sc-top"><div className="sc-icon" style={{ background: 'var(--puB)' }}>🎓</div></div><div className="sc-val">{summary.graduatedCount}</div><div className="sc-lbl">GRADUATED</div></div>
            </button>
          </div>
        </div>
      )}

      <div className="sys-tabs">{TABS.map(t => <button key={t.key} className={`sys-tab-btn${tab === t.key ? ' act' : ''}`} onClick={() => setTab(t.key)}>{t.label}</button>)}</div>

      {tab === 'records' && (
        <div style={{ padding: 'var(--pad)' }}>
          <form className="card" onSubmit={e => { e.preventDefault(); post('/api/v1/transcript/records', recordForm, () => setRecordForm({ enrollmentId: '', termId: '', gpa: '', cgpa: '' })); }}>
            <div className="ch"><span className="ch-t">TRANSCRIPT RECORDS</span></div>
            <div className="cb" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input className="fi" placeholder="Enrollment ID" value={recordForm.enrollmentId} onChange={e => setRecordForm({ ...recordForm, enrollmentId: e.target.value })} required style={{ flex: 1, minWidth: 160 }} />
              <select className="fi" value={recordForm.termId} onChange={e => setRecordForm({ ...recordForm, termId: e.target.value })} required><option value="">Term...</option>{terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
              <input className="fi" type="number" step="0.01" placeholder="GPA" value={recordForm.gpa} onChange={e => setRecordForm({ ...recordForm, gpa: e.target.value })} required style={{ width: 100 }} />
              <input className="fi" type="number" step="0.01" placeholder="CGPA" value={recordForm.cgpa} onChange={e => setRecordForm({ ...recordForm, cgpa: e.target.value })} required style={{ width: 100 }} />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Add Record</button>
            </div>
            <div className="tbl">
              <table className="data-table">
                <thead><tr><th>Enrollment</th><th>GPA</th><th>CGPA</th><th>Status</th><th></th></tr></thead>
                <tbody>
                  {records.map(r => (
                    <tr key={r.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{r.enrollment_id.slice(0, 8)}</td><td>{r.gpa}</td><td>{r.cgpa}</td>
                      <td><span className={`bdg ${r.is_locked ? 'bok' : 'bwn'}`}>{r.is_locked ? 'Locked' : 'Open'}</span></td>
                      <td>{!r.is_locked && <button onClick={() => patch(`/api/v1/transcript/records/${r.id}/lock`, {})} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--soft)', color: 'var(--ink)', fontWeight: 600 }}>Lock</button>}</td>
                    </tr>
                  ))}
                  {records.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>No transcript records yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </form>
        </div>
      )}

      {tab === 'requests' && (
        <div style={{ padding: 'var(--pad)' }}>
          <form className="card" onSubmit={e => { e.preventDefault(); post('/api/v1/transcript/requests', requestForm, () => setRequestForm({ studentId: '', purpose: '', recipientInstitution: '', copiesRequested: '1' })); }}>
            <div className="ch"><span className="ch-t">TRANSCRIPT REQUESTS</span></div>
            <div className="cb" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <select className="fi" value={requestForm.studentId} onChange={e => setRequestForm({ ...requestForm, studentId: e.target.value })} required><option value="">Student...</option>{students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}</select>
              <input className="fi" placeholder="Purpose" value={requestForm.purpose} onChange={e => setRequestForm({ ...requestForm, purpose: e.target.value })} style={{ flex: 1, minWidth: 140 }} />
              <input className="fi" placeholder="Recipient institution" value={requestForm.recipientInstitution} onChange={e => setRequestForm({ ...requestForm, recipientInstitution: e.target.value })} style={{ flex: 1, minWidth: 140 }} />
              <input className="fi" type="number" placeholder="Copies" value={requestForm.copiesRequested} onChange={e => setRequestForm({ ...requestForm, copiesRequested: e.target.value })} style={{ width: 90 }} />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Request</button>
            </div>
            <div className="tbl">
              <table className="data-table">
                <thead><tr><th>Student</th><th>Purpose</th><th>Recipient</th><th>Status</th><th></th></tr></thead>
                <tbody>
                  {requests.map(r => (
                    <tr key={r.id}>
                      <td>{studentName(r.student_id)}</td><td>{r.purpose || '—'}</td><td>{r.recipient_institution || '—'}</td>
                      <td><span className={`bdg ${r.status === 'ISSUED' ? 'bok' : r.status === 'REJECTED' ? 'ber' : 'bwn'}`}>{r.status}</span></td>
                      <td>
                        <select className="fi" style={{ fontSize: 11, padding: '4px 8px' }} value={r.status} onChange={e => patch(`/api/v1/transcript/requests/${r.id}/status`, { status: e.target.value })}>
                          <option value="PENDING">Pending</option><option value="PROCESSING">Processing</option><option value="ISSUED">Issued</option><option value="REJECTED">Rejected</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                  {requests.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>No requests yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </form>
        </div>
      )}

      {tab === 'verification' && (
        <div style={{ padding: 'var(--pad)' }}>
          <form className="card" onSubmit={e => { e.preventDefault(); post('/api/v1/transcript/verifications', verifyForm, () => setVerifyForm({ transcriptId: '', verificationMethod: 'MANUAL', verifyingInstitution: '', isAuthentic: true })); }}>
            <div className="ch"><span className="ch-t">VERIFICATION LOG</span></div>
            <div className="cb" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <select className="fi" value={verifyForm.transcriptId} onChange={e => setVerifyForm({ ...verifyForm, transcriptId: e.target.value })} required><option value="">Transcript record...</option>{records.map(r => <option key={r.id} value={r.id}>{r.enrollment_id.slice(0, 8)} · {r.term_id.slice(0, 8)}</option>)}</select>
              <select className="fi" value={verifyForm.verificationMethod} onChange={e => setVerifyForm({ ...verifyForm, verificationMethod: e.target.value })}><option value="MANUAL">Manual</option><option value="QR_CODE">QR Code</option><option value="TOKEN">Token</option><option value="API">API</option></select>
              <input className="fi" placeholder="Verifying institution" value={verifyForm.verifyingInstitution} onChange={e => setVerifyForm({ ...verifyForm, verifyingInstitution: e.target.value })} style={{ flex: 1, minWidth: 140 }} />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Log Verification</button>
            </div>
            {verifications.map(v => <div key={v.id} className="ri na"><div className="ri-b"><div className="ri-t">{v.verifying_institution || 'Unnamed institution'}</div><div className="ri-s">{v.verification_method} · {v.is_authentic ? 'Confirmed authentic' : 'Flagged'}</div></div></div>)}
            {verifications.length === 0 && <div className="ri na"><div className="ri-s">No verification records yet.</div></div>}
          </form>
        </div>
      )}

      {tab === 'config' && (
        <div style={{ padding: 'var(--pad)' }}>
          <form className="card" onSubmit={e => { e.preventDefault(); post('/api/v1/transcript/grade-scales', scaleForm, () => setScaleForm({ name: '', minScore: '', maxScore: '', grade: '', gradePoint: '' })); }} style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">GRADE SCALES</span></div>
            <div className="cb" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input className="fi" placeholder="Scale name" value={scaleForm.name} onChange={e => setScaleForm({ ...scaleForm, name: e.target.value })} required style={{ flex: 1, minWidth: 120 }} />
              <input className="fi" type="number" placeholder="Min" value={scaleForm.minScore} onChange={e => setScaleForm({ ...scaleForm, minScore: e.target.value })} required style={{ width: 80 }} />
              <input className="fi" type="number" placeholder="Max" value={scaleForm.maxScore} onChange={e => setScaleForm({ ...scaleForm, maxScore: e.target.value })} required style={{ width: 80 }} />
              <input className="fi" placeholder="Grade" value={scaleForm.grade} onChange={e => setScaleForm({ ...scaleForm, grade: e.target.value })} required style={{ width: 80 }} />
              <input className="fi" type="number" step="0.1" placeholder="Grade point" value={scaleForm.gradePoint} onChange={e => setScaleForm({ ...scaleForm, gradePoint: e.target.value })} required style={{ width: 110 }} />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Add</button>
            </div>
            {gradeScales.map(g => <div key={g.id} className="ri na"><div className="ri-b"><div className="ri-t">{g.grade} — {g.name}</div><div className="ri-s">{g.min_score}–{g.max_score} · {g.grade_point} pts</div></div></div>)}
            {gradeScales.length === 0 && <div className="ri na"><div className="ri-s">No grade scales yet.</div></div>}
          </form>
          <form className="card" onSubmit={e => { e.preventDefault(); post('/api/v1/transcript/gpa-policies', policyForm, () => setPolicyForm({ name: '', calculationMethod: 'UNWEIGHTED', scaleMax: '4.0' })); }}>
            <div className="ch"><span className="ch-t">GPA POLICIES</span></div>
            <div className="cb" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input className="fi" placeholder="Policy name" value={policyForm.name} onChange={e => setPolicyForm({ ...policyForm, name: e.target.value })} required style={{ flex: 1, minWidth: 140 }} />
              <select className="fi" value={policyForm.calculationMethod} onChange={e => setPolicyForm({ ...policyForm, calculationMethod: e.target.value })}><option value="UNWEIGHTED">Unweighted</option><option value="WEIGHTED">Weighted</option><option value="CREDIT_HOUR">Credit Hour</option></select>
              <input className="fi" type="number" step="0.1" placeholder="Scale max" value={policyForm.scaleMax} onChange={e => setPolicyForm({ ...policyForm, scaleMax: e.target.value })} style={{ width: 110 }} />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Add Policy</button>
            </div>
            {gpaPolicies.map(p => <div key={p.id} className="ri na"><div className="ri-b"><div className="ri-t">{p.name}</div><div className="ri-s">{p.calculation_method} · max {p.scale_max}</div></div></div>)}
            {gpaPolicies.length === 0 && <div className="ri na"><div className="ri-s">No GPA policies yet.</div></div>}
          </form>
        </div>
      )}
    </AppShell>
  );
}
