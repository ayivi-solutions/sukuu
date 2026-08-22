'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '../../components/AppShell';
import { authedFetch } from '../../lib/api';

export default function StudentsRegisterPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [user, setUser] = useState<any>(null);
  const [school, setSchool] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ studentId: '', firstName: '', middleName: '', lastName: '', gender: 'MALE', dateOfBirth: '', nationality: 'Ghanaian', admissionDate: '' });

  useEffect(() => {
    const t = localStorage.getItem('sukuu_token');
    const userStr = localStorage.getItem('sukuu_user');
    if (!t) { router.push('/login'); return; }
    setToken(t);
    setUser(userStr ? JSON.parse(userStr) : null);
    load(t);
  }, [router]);

  function load(t: string) {
    authedFetch('/api/v1/school/profile', t).then(d => d && !d.error && setSchool(d));
    authedFetch('/api/v1/students', t).then(d => Array.isArray(d) ? setStudents(d) : setError(d?.error));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const res = await authedFetch('/api/v1/students', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (!res?.error) {
      setShowCreate(false);
      setForm({ studentId: '', firstName: '', middleName: '', lastName: '', gender: 'MALE', dateOfBirth: '', nationality: 'Ghanaian', admissionDate: '' });
      load(token);
    }
  }

  const shown = students.filter(s => {
    if (statusFilter === 'TRANSFERRED_WITHDRAWN') { if (s.status !== 'TRANSFERRED' && s.status !== 'WITHDRAWN') return false; }
    else if (statusFilter && s.status !== statusFilter) return false;
    if (query && !`${s.first_name} ${s.last_name} ${s.student_id}`.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  if (error) return <AppShell user={user}><div style={{ padding: 40, color: 'var(--er)' }}>{error}</div></AppShell>;

  return (
    <AppShell user={user} schoolName={school?.name}>
      <div className="ph">
        <div className="ph-row">
          <div>
            <div className="ph-ey">SUKUU ERP · STUDENTX · 21 TABLES · sukuux SCHEMA</div>
            <div className="ph-title">🧑‍🎒 StudentX</div>
            <div className="ph-sub">Records · Guardians · Enrolment · Medical · Documents · Behaviour · CRUAA enforced</div>
          </div>
          <button onClick={() => setShowCreate(true)} style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>+ Enrol Student</button>
        </div>
      </div>

      <div className="fx-overview">
        <div className="stat-grid">
          <button className="fx-card-btn" onClick={() => setStatusFilter('ACTIVE')}>
            <div className="sc" title="Students with status ACTIVE, out of all students on record — click to filter the list below">
              <div className="sc-top"><div className="sc-icon" style={{ background: 'var(--inB)' }}>🧑‍🎓</div></div>
              <div className="sc-val">{students.filter(s => s.status === 'ACTIVE').length}<span style={{ fontSize: 14, color: 'var(--muted)', fontWeight: 500 }}> / {students.length}</span></div>
              <div className="sc-lbl">ACTIVE STUDENTS</div>
            </div>
          </button>
          <button className="fx-card-btn" onClick={() => setStatusFilter('SUSPENDED')}>
            <div className="sc" title="Students with status SUSPENDED — click to filter the list below">
              <div className="sc-top"><div className="sc-icon" style={{ background: 'var(--erB)' }}>⛔</div></div>
              <div className="sc-val">{students.filter(s => s.status === 'SUSPENDED').length}</div>
              <div className="sc-lbl">SUSPENDED</div>
            </div>
          </button>
          <button className="fx-card-btn" onClick={() => setStatusFilter('GRADUATED')}>
            <div className="sc" title="Students with status GRADUATED — click to filter the list below">
              <div className="sc-top"><div className="sc-icon" style={{ background: 'var(--okB)' }}>🎓</div></div>
              <div className="sc-val">{students.filter(s => s.status === 'GRADUATED').length}</div>
              <div className="sc-lbl">GRADUATED</div>
            </div>
          </button>
          <button className="fx-card-btn" onClick={() => setStatusFilter('TRANSFERRED_WITHDRAWN')}>
            <div className="sc" title="Students with status TRANSFERRED or WITHDRAWN — click to filter the list below">
              <div className="sc-top"><div className="sc-icon" style={{ background: 'var(--puB)' }}>↪️</div></div>
              <div className="sc-val">{students.filter(s => s.status === 'TRANSFERRED' || s.status === 'WITHDRAWN').length}</div>
              <div className="sc-lbl">TRANSFERRED / WITHDRAWN</div>
            </div>
          </button>
        </div>
        {statusFilter && (
          <div style={{ marginTop: 8 }}>
            <button onClick={() => setStatusFilter('')} className="bdg bin" style={{ border: 'none', cursor: 'pointer' }}>Filtering: {statusFilter.replace('_', ' / ')} · click to clear ✕</button>
          </div>
        )}
      </div>

      <div style={{ padding: 'var(--pad) var(--pad) 8px', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <input className="fi" placeholder="Search name or ID…" value={query} onChange={e => setQuery(e.target.value)} style={{ flex: 1, minWidth: 160, maxWidth: 280 }} />
        <select className="fi" style={{ width: 'auto' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="GRADUATED">Graduated</option>
          <option value="TRANSFERRED">Transferred</option>
          <option value="WITHDRAWN">Withdrawn</option>
        </select>
        <span style={{ fontSize: 11, color: 'var(--muted)' }}>{shown.length} students</span>
      </div>

      <div className="tbl" style={{ padding: '0 var(--pad) var(--pad)' }}>
        <table className="data-table">
          <thead><tr><th>ID</th><th>Name</th><th>Gender</th><th>DOB</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {shown.map(s => (
              <tr key={s.id} onClick={() => router.push(`/students/${s.id}`)}>
                <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{s.student_id}</td>
                <td><strong>{s.first_name} {s.last_name}</strong></td>
                <td>{s.gender}</td>
                <td style={{ fontSize: 11 }}>{s.date_of_birth}</td>
                <td><span className={`bdg ${s.status === 'ACTIVE' ? 'bok' : s.status === 'SUSPENDED' ? 'bwn' : 'ber'}`}>{s.status}</span></td>
                <td onClick={e => e.stopPropagation()}><button onClick={() => router.push(`/students/${s.id}`)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--soft)', color: 'var(--ink)', fontWeight: 600 }}>View</button></td>
              </tr>
            ))}
            {shown.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>No students match</td></tr>}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(4,13,52,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setShowCreate(false)}>
          <form onSubmit={handleCreate} onClick={e => e.stopPropagation()} style={{ background: 'var(--white)', padding: 24, borderRadius: 'var(--r)', width: 380, maxHeight: '85vh', overflowY: 'auto', boxShadow: 'var(--shL)' }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, marginBottom: 16 }}>Enrol Student</h3>
            <div className="fg"><label className="fl">STUDENT ID</label><input className="fi" value={form.studentId} onChange={e => setForm({ ...form, studentId: e.target.value })} required /></div>
            <div className="fg"><label className="fl">FIRST NAME</label><input className="fi" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} required /></div>
            <div className="fg"><label className="fl">MIDDLE NAME</label><input className="fi" value={form.middleName} onChange={e => setForm({ ...form, middleName: e.target.value })} /></div>
            <div className="fg"><label className="fl">LAST NAME</label><input className="fi" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} required /></div>
            <div className="fg"><label className="fl">GENDER</label>
              <select className="fi" value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
                <option value="MALE">Male</option><option value="FEMALE">Female</option><option value="OTHER">Other</option>
              </select>
            </div>
            <div className="fg"><label className="fl">DATE OF BIRTH</label><input className="fi" type="date" value={form.dateOfBirth} onChange={e => setForm({ ...form, dateOfBirth: e.target.value })} required /></div>
            <div className="fg"><label className="fl">NATIONALITY</label><input className="fi" value={form.nationality} onChange={e => setForm({ ...form, nationality: e.target.value })} /></div>
            <div className="fg"><label className="fl">ADMISSION DATE</label><input className="fi" type="date" value={form.admissionDate} onChange={e => setForm({ ...form, admissionDate: e.target.value })} required /></div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button type="submit" style={{ flex: 1, background: 'var(--navy)', color: 'var(--gold)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Enrol</button>
              <button type="button" onClick={() => setShowCreate(false)} style={{ flex: 1, background: 'var(--soft)', color: 'var(--ink)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Cancel</button>
            </div>
          </form>
        </div>
      )}
    </AppShell>
  );
}
