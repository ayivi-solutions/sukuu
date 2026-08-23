'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authedFetch } from '../../lib/api';
import AppShell from '../../components/AppShell';

const TABS = [
  { key: 'visits', label: 'Visits' },
  { key: 'medications', label: 'Medications & Prescriptions' },
  { key: 'referrals', label: 'Referrals' },
  { key: 'immunizations', label: 'Immunizations' },
];

export default function ClinicXPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [user, setUser] = useState<any>(null);
  const [school, setSchool] = useState<any>(null);
  const [tab, setTab] = useState('visits');
  const [error, setError] = useState('');
  const [students, setStudents] = useState<any[]>([]);

  const [visits, setVisits] = useState<any[]>([]);
  const [medications, setMedications] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [immunizations, setImmunizations] = useState<any[]>([]);

  const [visitForm, setVisitForm] = useState({ studentId: '', complaint: '' });
  const [medForm, setMedForm] = useState({ name: '', dosage: '', stockQuantity: '', reorderLevel: '' });
  const [rxForm, setRxForm] = useState({ visitId: '', medicationId: '', dosage: '', durationDays: '', instructions: '' });
  const [refForm, setRefForm] = useState({ visitId: '', hospitalName: '', reason: '', referralDate: '', parentNotified: false });
  const [immForm, setImmForm] = useState({ studentId: '', vaccineName: '', dateAdministered: '', nextDueDate: '' });

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
    authedFetch('/api/v1/clinic/visits', t).then(d => Array.isArray(d) && setVisits(d));
    authedFetch('/api/v1/clinic/medications', t).then(d => Array.isArray(d) && setMedications(d));
    authedFetch('/api/v1/clinic/prescriptions', t).then(d => Array.isArray(d) && setPrescriptions(d));
    authedFetch('/api/v1/clinic/referrals', t).then(d => Array.isArray(d) && setReferrals(d));
    authedFetch('/api/v1/clinic/immunizations', t).then(d => Array.isArray(d) && setImmunizations(d));
    setSummaryLoading(true);
    authedFetch('/api/v1/clinic/summary', t)
      .then(d => { if (d && !d.error) { setSummary(d); setSummaryError(''); } else setSummaryError(d?.error || 'Failed to load summary'); })
      .catch(() => setSummaryError('Failed to load summary')).finally(() => setSummaryLoading(false));
  }

  function studentName(id: string) { const s = students.find(x => x.id === id); return s ? `${s.first_name} ${s.last_name}` : id?.slice(0, 8) || '—'; }
  async function post(url: string, body: any, resetFn: () => void) { await authedFetch(url, token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); resetFn(); loadAll(token); }

  if (error) return <AppShell user={user}><div style={{ padding: 40, color: 'var(--er)' }}>{error}</div></AppShell>;

  return (
    <AppShell user={user} schoolName={school?.name}>
      <div className="ph">
        <div className="ph-row">
          <div>
            <div className="ph-ey">SUKUU ERP · CLINICX · 5 TABLES · sukuux SCHEMA</div>
            <div className="ph-title">🏥 ClinicX</div>
            <div className="ph-sub">Visits · Conditions · Treatment Notes · Medication · Referral</div>
          </div>
        </div>
      </div>

      {summaryError && <div style={{ padding: '0 var(--pad)', marginBottom: 'var(--gap)' }}><div className="alert al-er"><span className="al-ic">⚠️</span><div>Couldn't load the clinic overview: {summaryError}.</div></div></div>}

      {summaryLoading ? (
        <div className="fx-overview"><div className="stat-grid">{[1, 2, 3, 4].map(i => <div key={i} className="skel skel-card" />)}</div></div>
      ) : summary && (
        <div className="fx-overview">
          <div className="stat-grid">
            <button className="fx-card-btn" onClick={() => setTab('visits')}>
              <div className="sc" title="Clinic visits with visit_date today"><div className="sc-top"><div className="sc-icon" style={{ background: 'var(--inB)' }}>🏥</div></div><div className="sc-val">{summary.visitsToday}</div><div className="sc-lbl">VISITS TODAY</div><div className="sc-foot">{summary.totalVisits} all time</div></div>
            </button>
            <button className="fx-card-btn" onClick={() => setTab('medications')}>
              <div className="sc" title="Active medications where stock_quantity is at or below reorder_level"><div className="sc-top"><div className="sc-icon" style={{ background: summary.lowStockMeds > 0 ? 'var(--erB)' : 'var(--okB)' }}>💊</div></div><div className="sc-val">{summary.lowStockMeds}</div><div className="sc-lbl">LOW STOCK MEDICATIONS</div></div>
            </button>
            <button className="fx-card-btn" onClick={() => setTab('referrals')}>
              <div className="sc" title="Referrals on record"><div className="sc-top"><div className="sc-icon" style={{ background: 'var(--puB)' }}>🚑</div></div><div className="sc-val">{summary.pendingReferrals}</div><div className="sc-lbl">REFERRALS ON FILE</div></div>
            </button>
            <button className="fx-card-btn" onClick={() => setTab('immunizations')}>
              <div className="sc" title="Immunization records with a next_due_date set"><div className="sc-top"><div className="sc-icon" style={{ background: 'var(--goldF)' }}>💉</div></div><div className="sc-val">{summary.upcomingImmunizations}</div><div className="sc-lbl">UPCOMING DUE DATES</div></div>
            </button>
          </div>
        </div>
      )}

      <div className="sys-tabs">{TABS.map(t => <button key={t.key} className={`sys-tab-btn${tab === t.key ? ' act' : ''}`} onClick={() => setTab(t.key)}>{t.label}</button>)}</div>

      {tab === 'visits' && (
        <div style={{ padding: 'var(--pad)' }}>
          <form className="card" onSubmit={e => { e.preventDefault(); post('/api/v1/clinic/visits', visitForm, () => setVisitForm({ studentId: '', complaint: '' })); }}>
            <div className="ch"><span className="ch-t">LOG VISIT</span></div>
            <div className="cb" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <select className="fi" value={visitForm.studentId} onChange={e => setVisitForm({ ...visitForm, studentId: e.target.value })} required><option value="">Student...</option>{students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}</select>
              <input className="fi" placeholder="Complaint" value={visitForm.complaint} onChange={e => setVisitForm({ ...visitForm, complaint: e.target.value })} required style={{ flex: 1, minWidth: 180 }} />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Log Visit</button>
            </div>
            <div className="tbl">
              <table className="data-table">
                <thead><tr><th>Student</th><th>Complaint</th><th>Diagnosis</th><th>Date</th></tr></thead>
                <tbody>
                  {visits.map(v => <tr key={v.id}><td>{studentName(v.student_id)}</td><td>{v.complaint}</td><td>{v.diagnosis || '—'}</td><td style={{ fontSize: 11 }}>{new Date(v.visit_date).toLocaleDateString()}</td></tr>)}
                  {visits.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>No visits logged yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </form>
        </div>
      )}

      {tab === 'medications' && (
        <div style={{ padding: 'var(--pad)' }}>
          <form className="card" onSubmit={e => { e.preventDefault(); post('/api/v1/clinic/medications', medForm, () => setMedForm({ name: '', dosage: '', stockQuantity: '', reorderLevel: '' })); }} style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">MEDICATIONS</span></div>
            <div className="cb" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input className="fi" placeholder="Name" value={medForm.name} onChange={e => setMedForm({ ...medForm, name: e.target.value })} required style={{ flex: 1, minWidth: 140 }} />
              <input className="fi" placeholder="Dosage" value={medForm.dosage} onChange={e => setMedForm({ ...medForm, dosage: e.target.value })} required style={{ width: 120 }} />
              <input className="fi" type="number" placeholder="Stock" value={medForm.stockQuantity} onChange={e => setMedForm({ ...medForm, stockQuantity: e.target.value })} style={{ width: 100 }} />
              <input className="fi" type="number" placeholder="Reorder at" value={medForm.reorderLevel} onChange={e => setMedForm({ ...medForm, reorderLevel: e.target.value })} style={{ width: 110 }} />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Add</button>
            </div>
            {medications.map(m => <div key={m.id} className="ri na"><div className="ri-b"><div className="ri-t">{m.name}</div><div className="ri-s">{m.dosage} · Stock {m.stock_quantity}</div></div>{m.stock_quantity <= m.reorder_level && <span className="bdg ber">Low stock</span>}</div>)}
            {medications.length === 0 && <div className="ri na"><div className="ri-s">No medications yet.</div></div>}
          </form>
          <form className="card" onSubmit={e => { e.preventDefault(); post('/api/v1/clinic/prescriptions', rxForm, () => setRxForm({ visitId: '', medicationId: '', dosage: '', durationDays: '', instructions: '' })); }}>
            <div className="ch"><span className="ch-t">PRESCRIPTIONS</span></div>
            <div className="cb" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <select className="fi" value={rxForm.visitId} onChange={e => setRxForm({ ...rxForm, visitId: e.target.value })} required><option value="">Visit...</option>{visits.map(v => <option key={v.id} value={v.id}>{studentName(v.student_id)} - {v.complaint}</option>)}</select>
              <select className="fi" value={rxForm.medicationId} onChange={e => setRxForm({ ...rxForm, medicationId: e.target.value })} required><option value="">Medication...</option>{medications.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select>
              <input className="fi" placeholder="Dosage" value={rxForm.dosage} onChange={e => setRxForm({ ...rxForm, dosage: e.target.value })} required style={{ width: 120 }} />
              <input className="fi" type="number" placeholder="Days" value={rxForm.durationDays} onChange={e => setRxForm({ ...rxForm, durationDays: e.target.value })} required style={{ width: 90 }} />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Prescribe</button>
            </div>
            {prescriptions.map(p => <div key={p.id} className="ri na"><div className="ri-b"><div className="ri-t">{medications.find(m => m.id === p.medication_id)?.name || '—'}</div><div className="ri-s">{p.dosage} for {p.duration_days} days</div></div></div>)}
            {prescriptions.length === 0 && <div className="ri na"><div className="ri-s">No prescriptions yet.</div></div>}
          </form>
        </div>
      )}

      {tab === 'referrals' && (
        <div style={{ padding: 'var(--pad)' }}>
          <form className="card" onSubmit={e => { e.preventDefault(); post('/api/v1/clinic/referrals', refForm, () => setRefForm({ visitId: '', hospitalName: '', reason: '', referralDate: '', parentNotified: false })); }}>
            <div className="ch"><span className="ch-t">REFERRALS</span></div>
            <div className="cb" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <select className="fi" value={refForm.visitId} onChange={e => setRefForm({ ...refForm, visitId: e.target.value })} required><option value="">Visit...</option>{visits.map(v => <option key={v.id} value={v.id}>{studentName(v.student_id)} - {v.complaint}</option>)}</select>
              <input className="fi" placeholder="Hospital" value={refForm.hospitalName} onChange={e => setRefForm({ ...refForm, hospitalName: e.target.value })} required style={{ flex: 1, minWidth: 140 }} />
              <input className="fi" placeholder="Reason" value={refForm.reason} onChange={e => setRefForm({ ...refForm, reason: e.target.value })} required style={{ flex: 1, minWidth: 140 }} />
              <input className="fi" type="date" value={refForm.referralDate} onChange={e => setRefForm({ ...refForm, referralDate: e.target.value })} required />
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}><input type="checkbox" checked={refForm.parentNotified} onChange={e => setRefForm({ ...refForm, parentNotified: e.target.checked })} /> Parent notified</label>
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Refer</button>
            </div>
            {referrals.map(r => <div key={r.id} className="ri na"><div className="ri-b"><div className="ri-t">{r.hospital_name}</div><div className="ri-s">{r.reason} · {r.referral_date}</div></div></div>)}
            {referrals.length === 0 && <div className="ri na"><div className="ri-s">No referrals yet.</div></div>}
          </form>
        </div>
      )}

      {tab === 'immunizations' && (
        <div style={{ padding: 'var(--pad)' }}>
          <form className="card" onSubmit={e => { e.preventDefault(); post('/api/v1/clinic/immunizations', immForm, () => setImmForm({ studentId: '', vaccineName: '', dateAdministered: '', nextDueDate: '' })); }}>
            <div className="ch"><span className="ch-t">IMMUNIZATIONS</span></div>
            <div className="cb" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <select className="fi" value={immForm.studentId} onChange={e => setImmForm({ ...immForm, studentId: e.target.value })} required><option value="">Student...</option>{students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}</select>
              <input className="fi" placeholder="Vaccine" value={immForm.vaccineName} onChange={e => setImmForm({ ...immForm, vaccineName: e.target.value })} required style={{ width: 160 }} />
              <input className="fi" type="date" value={immForm.dateAdministered} onChange={e => setImmForm({ ...immForm, dateAdministered: e.target.value })} required />
              <input className="fi" type="date" placeholder="Next due" value={immForm.nextDueDate} onChange={e => setImmForm({ ...immForm, nextDueDate: e.target.value })} />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Record</button>
            </div>
            {immunizations.map(i => <div key={i.id} className="ri na"><div className="ri-b"><div className="ri-t">{studentName(i.student_id)} · {i.vaccine_name}</div><div className="ri-s">Given {i.date_administered}{i.next_due_date ? ` · Next due ${i.next_due_date}` : ''}</div></div></div>)}
            {immunizations.length === 0 && <div className="ri na"><div className="ri-s">No immunization records yet.</div></div>}
          </form>
        </div>
      )}
    </AppShell>
  );
}
