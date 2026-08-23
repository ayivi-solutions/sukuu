'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authedFetch } from '../../lib/api';
import AppShell from '../../components/AppShell';

const TABS = [
  { key: 'hostels', label: 'Hostels & Dormitories' },
  { key: 'beds', label: 'Beds & Allocation' },
  { key: 'staff', label: 'Staff Assignments' },
  { key: 'incidents', label: 'Incidents' },
];

export default function HostelXPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [user, setUser] = useState<any>(null);
  const [school, setSchool] = useState<any>(null);
  const [tab, setTab] = useState('hostels');
  const [error, setError] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);

  const [hostels, setHostels] = useState<any[]>([]);
  const [dormitories, setDormitories] = useState<any[]>([]);
  const [beds, setBeds] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [staffAssignments, setStaffAssignments] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);

  const [hostelForm, setHostelForm] = useState({ name: '', gender: 'MIXED', capacity: '' });
  const [dormForm, setDormForm] = useState({ hostelId: '', name: '', capacity: '' });
  const [bedForm, setBedForm] = useState({ dormitoryId: '', bedNumber: '' });
  const [assignForm, setAssignForm] = useState({ studentId: '', bedId: '', assignedDate: '' });
  const [staffForm, setStaffForm] = useState({ hostelId: '', staffId: '', role: 'Warden' });
  const [incidentForm, setIncidentForm] = useState({ studentId: '', hostelId: '', incidentType: '', description: '', incidentDate: '' });

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
    authedFetch('/api/v1/staff', t).then(d => Array.isArray(d) && setStaff(d));
    authedFetch('/api/v1/hostel/hostels', t).then(d => Array.isArray(d) && setHostels(d));
    authedFetch('/api/v1/hostel/dormitories', t).then(d => Array.isArray(d) && setDormitories(d));
    authedFetch('/api/v1/hostel/beds', t).then(d => Array.isArray(d) && setBeds(d));
    authedFetch('/api/v1/hostel/assignments', t).then(d => Array.isArray(d) && setAssignments(d));
    authedFetch('/api/v1/hostel/staff-assignments', t).then(d => Array.isArray(d) && setStaffAssignments(d));
    authedFetch('/api/v1/hostel/incidents', t).then(d => Array.isArray(d) && setIncidents(d));
    setSummaryLoading(true);
    authedFetch('/api/v1/hostel/summary', t)
      .then(d => { if (d && !d.error) { setSummary(d); setSummaryError(''); } else setSummaryError(d?.error || 'Failed to load summary'); })
      .catch(() => setSummaryError('Failed to load summary')).finally(() => setSummaryLoading(false));
  }

  function studentName(id: string) { const s = students.find(x => x.id === id); return s ? `${s.first_name} ${s.last_name}` : id?.slice(0, 8) || '—'; }
  function staffName(id: string) { const s = staff.find(x => x.id === id); return s ? `${s.first_name} ${s.last_name}` : id?.slice(0, 8) || '—'; }
  function hostelName(id: string) { return hostels.find(h => h.id === id)?.name || id?.slice(0, 8) || '—'; }
  async function post(url: string, body: any, resetFn: () => void) { await authedFetch(url, token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); resetFn(); loadAll(token); }
  async function patch(url: string, body: any = {}) { await authedFetch(url, token, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); loadAll(token); }

  if (error) return <AppShell user={user}><div style={{ padding: 40, color: 'var(--er)' }}>{error}</div></AppShell>;

  return (
    <AppShell user={user} schoolName={school?.name}>
      <div className="ph">
        <div className="ph-row">
          <div>
            <div className="ph-ey">SUKUU ERP · HOSTELX · 6 TABLES · sukuux SCHEMA</div>
            <div className="ph-title">🏠 HostelX</div>
            <div className="ph-sub">Boarding Allocation · Beds · Leave · Residence Operations</div>
          </div>
        </div>
      </div>

      {summaryError && <div style={{ padding: '0 var(--pad)', marginBottom: 'var(--gap)' }}><div className="alert al-er"><span className="al-ic">⚠️</span><div>Couldn't load the hostel overview: {summaryError}.</div></div></div>}

      {summaryLoading ? (
        <div className="fx-overview"><div className="stat-grid">{[1, 2, 3, 4].map(i => <div key={i} className="skel skel-card" />)}</div></div>
      ) : summary && (
        <div className="fx-overview">
          <div className="stat-grid">
            <button className="fx-card-btn" onClick={() => setTab('hostels')}>
              <div className="sc" title="Active hostels on record"><div className="sc-top"><div className="sc-icon" style={{ background: 'var(--inB)' }}>🏠</div></div><div className="sc-val">{summary.totalHostels}</div><div className="sc-lbl">ACTIVE HOSTELS</div></div>
            </button>
            <button className="fx-card-btn" onClick={() => setTab('beds')}>
              <div className="sc" title="Occupied beds ÷ total beds"><div className="sc-top"><div className="sc-icon" style={{ background: 'var(--okB)' }}>🛏️</div></div><div className="sc-val">{summary.occupancyPct !== null ? `${summary.occupancyPct}%` : '—'}</div><div className="sc-lbl">OCCUPANCY</div><div className="sc-foot">{summary.occupiedBeds} of {summary.totalBeds} beds</div></div>
            </button>
            <button className="fx-card-btn" onClick={() => setTab('beds')}>
              <div className="sc" title="Beds with status AVAILABLE"><div className="sc-top"><div className="sc-icon" style={{ background: 'var(--puB)' }}>🟢</div></div><div className="sc-val">{summary.availableBeds}</div><div className="sc-lbl">AVAILABLE BEDS</div></div>
            </button>
            <button className="fx-card-btn" onClick={() => setTab('incidents')}>
              <div className="sc" title="Hostel incidents on record"><div className="sc-top"><div className="sc-icon" style={{ background: summary.recentIncidents > 0 ? 'var(--erB)' : 'var(--okB)' }}>⚠️</div></div><div className="sc-val">{summary.recentIncidents}</div><div className="sc-lbl">INCIDENTS</div></div>
            </button>
          </div>
        </div>
      )}

      <div className="sys-tabs">{TABS.map(t => <button key={t.key} className={`sys-tab-btn${tab === t.key ? ' act' : ''}`} onClick={() => setTab(t.key)}>{t.label}</button>)}</div>

      {tab === 'hostels' && (
        <div style={{ padding: 'var(--pad)' }}>
          <form className="card" onSubmit={e => { e.preventDefault(); post('/api/v1/hostel/hostels', hostelForm, () => setHostelForm({ name: '', gender: 'MIXED', capacity: '' })); }} style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">HOSTELS</span></div>
            <div className="cb" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input className="fi" placeholder="Name" value={hostelForm.name} onChange={e => setHostelForm({ ...hostelForm, name: e.target.value })} required style={{ flex: 1, minWidth: 140 }} />
              <select className="fi" value={hostelForm.gender} onChange={e => setHostelForm({ ...hostelForm, gender: e.target.value })}><option value="MALE">Male</option><option value="FEMALE">Female</option><option value="MIXED">Mixed</option></select>
              <input className="fi" type="number" placeholder="Capacity" value={hostelForm.capacity} onChange={e => setHostelForm({ ...hostelForm, capacity: e.target.value })} required style={{ width: 110 }} />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Add</button>
            </div>
            {hostels.map(h => <div key={h.id} className="ri na"><div className="ri-b"><div className="ri-t">{h.name}</div><div className="ri-s">{h.gender} · Capacity {h.capacity}</div></div></div>)}
            {hostels.length === 0 && <div className="ri na"><div className="ri-s">No hostels yet.</div></div>}
          </form>
          <form className="card" onSubmit={e => { e.preventDefault(); post('/api/v1/hostel/dormitories', dormForm, () => setDormForm({ hostelId: '', name: '', capacity: '' })); }}>
            <div className="ch"><span className="ch-t">DORMITORIES</span></div>
            <div className="cb" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <select className="fi" value={dormForm.hostelId} onChange={e => setDormForm({ ...dormForm, hostelId: e.target.value })} required><option value="">Hostel...</option>{hostels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}</select>
              <input className="fi" placeholder="Name" value={dormForm.name} onChange={e => setDormForm({ ...dormForm, name: e.target.value })} required style={{ flex: 1, minWidth: 140 }} />
              <input className="fi" type="number" placeholder="Capacity" value={dormForm.capacity} onChange={e => setDormForm({ ...dormForm, capacity: e.target.value })} required style={{ width: 110 }} />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Add</button>
            </div>
            {dormitories.map(d => <div key={d.id} className="ri na"><div className="ri-b"><div className="ri-t">{d.name}</div><div className="ri-s">{hostelName(d.hostel_id)} · Capacity {d.capacity}</div></div></div>)}
            {dormitories.length === 0 && <div className="ri na"><div className="ri-s">No dormitories yet.</div></div>}
          </form>
        </div>
      )}

      {tab === 'beds' && (
        <div style={{ padding: 'var(--pad)' }}>
          <form className="card" onSubmit={e => { e.preventDefault(); post('/api/v1/hostel/beds', bedForm, () => setBedForm({ dormitoryId: '', bedNumber: '' })); }} style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">BEDS</span></div>
            <div className="cb" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <select className="fi" value={bedForm.dormitoryId} onChange={e => setBedForm({ ...bedForm, dormitoryId: e.target.value })} required><option value="">Dormitory...</option>{dormitories.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
              <input className="fi" placeholder="Bed number" value={bedForm.bedNumber} onChange={e => setBedForm({ ...bedForm, bedNumber: e.target.value })} required style={{ width: 130 }} />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Add Bed</button>
            </div>
            <div className="tbl">
              <table className="data-table">
                <thead><tr><th>Bed #</th><th>Dormitory</th><th>Status</th></tr></thead>
                <tbody>
                  {beds.map(b => <tr key={b.id}><td>{b.bed_number}</td><td>{dormitories.find(d => d.id === b.dormitory_id)?.name || '—'}</td><td><span className={`bdg ${b.status === 'AVAILABLE' ? 'bok' : b.status === 'OCCUPIED' ? 'bin' : 'bwn'}`}>{b.status}</span></td></tr>)}
                  {beds.length === 0 && <tr><td colSpan={3} style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>No beds yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </form>
          <form className="card" onSubmit={e => { e.preventDefault(); post('/api/v1/hostel/assignments', assignForm, () => setAssignForm({ studentId: '', bedId: '', assignedDate: '' })); }}>
            <div className="ch"><span className="ch-t">ALLOCATION</span></div>
            <div className="cb" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <select className="fi" value={assignForm.studentId} onChange={e => setAssignForm({ ...assignForm, studentId: e.target.value })} required><option value="">Student...</option>{students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}</select>
              <select className="fi" value={assignForm.bedId} onChange={e => setAssignForm({ ...assignForm, bedId: e.target.value })} required><option value="">Bed...</option>{beds.filter(b => b.status === 'AVAILABLE').map(b => <option key={b.id} value={b.id}>{b.bed_number}</option>)}</select>
              <input className="fi" type="date" value={assignForm.assignedDate} onChange={e => setAssignForm({ ...assignForm, assignedDate: e.target.value })} required />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Allocate</button>
            </div>
            {assignments.filter(a => !a.vacated_date).map(a => (
              <div key={a.id} className="ri na"><div className="ri-b"><div className="ri-t">{studentName(a.student_id)}</div><div className="ri-s">Since {a.assigned_date}</div></div><button onClick={() => patch(`/api/v1/hostel/assignments/${a.id}/vacate`)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--erB)', color: 'var(--er)', fontWeight: 600 }}>Vacate</button></div>
            ))}
            {assignments.filter(a => !a.vacated_date).length === 0 && <div className="ri na"><div className="ri-s">No active allocations.</div></div>}
          </form>
        </div>
      )}

      {tab === 'staff' && (
        <div style={{ padding: 'var(--pad)' }}>
          <form className="card" onSubmit={e => { e.preventDefault(); post('/api/v1/hostel/staff-assignments', staffForm, () => setStaffForm({ hostelId: '', staffId: '', role: 'Warden' })); }}>
            <div className="ch"><span className="ch-t">STAFF ASSIGNMENTS</span></div>
            <div className="cb" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <select className="fi" value={staffForm.hostelId} onChange={e => setStaffForm({ ...staffForm, hostelId: e.target.value })} required><option value="">Hostel...</option>{hostels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}</select>
              <select className="fi" value={staffForm.staffId} onChange={e => setStaffForm({ ...staffForm, staffId: e.target.value })} required><option value="">Staff...</option>{staff.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}</select>
              <input className="fi" placeholder="Role" value={staffForm.role} onChange={e => setStaffForm({ ...staffForm, role: e.target.value })} style={{ width: 140 }} />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Assign</button>
            </div>
            {staffAssignments.map(s => <div key={s.id} className="ri na"><div className="ri-b"><div className="ri-t">{staffName(s.staff_id)}</div><div className="ri-s">{hostelName(s.hostel_id)} · {s.role}</div></div></div>)}
            {staffAssignments.length === 0 && <div className="ri na"><div className="ri-s">No staff assigned yet.</div></div>}
          </form>
        </div>
      )}

      {tab === 'incidents' && (
        <div style={{ padding: 'var(--pad)' }}>
          <form className="card" onSubmit={e => { e.preventDefault(); post('/api/v1/hostel/incidents', incidentForm, () => setIncidentForm({ studentId: '', hostelId: '', incidentType: '', description: '', incidentDate: '' })); }}>
            <div className="ch"><span className="ch-t">INCIDENTS</span></div>
            <div className="cb" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <select className="fi" value={incidentForm.studentId} onChange={e => setIncidentForm({ ...incidentForm, studentId: e.target.value })} required><option value="">Student...</option>{students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}</select>
              <select className="fi" value={incidentForm.hostelId} onChange={e => setIncidentForm({ ...incidentForm, hostelId: e.target.value })} required><option value="">Hostel...</option>{hostels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}</select>
              <input className="fi" placeholder="Type" value={incidentForm.incidentType} onChange={e => setIncidentForm({ ...incidentForm, incidentType: e.target.value })} required style={{ width: 140 }} />
              <input className="fi" type="date" value={incidentForm.incidentDate} onChange={e => setIncidentForm({ ...incidentForm, incidentDate: e.target.value })} required />
              <input className="fi" placeholder="Description" value={incidentForm.description} onChange={e => setIncidentForm({ ...incidentForm, description: e.target.value })} required style={{ flex: 1, minWidth: 160 }} />
              <button type="submit" style={{ background: 'var(--erB)', color: 'var(--er)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Record</button>
            </div>
            {incidents.map(i => <div key={i.id} className="ri na"><div className="ri-b"><div className="ri-t">{studentName(i.student_id)} · {i.incident_type}</div><div className="ri-s">{hostelName(i.hostel_id)} · {i.incident_date}</div></div></div>)}
            {incidents.length === 0 && <div className="ri na"><div className="ri-s">No incidents recorded.</div></div>}
          </form>
        </div>
      )}
    </AppShell>
  );
}
