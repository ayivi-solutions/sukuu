'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '../../components/AppShell';
import { authedFetch } from '../../lib/api';

export default function StaffRegisterPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [user, setUser] = useState<any>(null);
  const [school, setSchool] = useState<any>(null);
  const [staff, setStaff] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ staffId: '', firstName: '', lastName: '', gender: 'MALE', dateOfBirth: '', phone: '', email: '' });

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
    authedFetch('/api/v1/staff', t).then(d => Array.isArray(d) ? setStaff(d) : setError(d?.error));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const res = await authedFetch('/api/v1/staff', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (!res?.error) { setShowCreate(false); setForm({ staffId: '', firstName: '', lastName: '', gender: 'MALE', dateOfBirth: '', phone: '', email: '' }); load(token); }
  }

  const shown = staff.filter(s => !query || `${s.first_name} ${s.last_name} ${s.staff_id}`.toLowerCase().includes(query.toLowerCase()));

  if (error) return <AppShell user={user}><div style={{ padding: 40, color: 'var(--er)' }}>{error}</div></AppShell>;

  return (
    <AppShell user={user} schoolName={school?.name}>
      <div className="ph">
        <div className="ph-row">
          <div>
            <div className="ph-ey">SUKUU ERP · STAFFX · 19 TABLES · sukuux SCHEMA</div>
            <div className="ph-title">👩‍🏫 StaffX</div>
            <div className="ph-sub">HR · Employment · Leave · Qualifications · Attendance · CRUAA enforced</div>
          </div>
          <button onClick={() => setShowCreate(true)} style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>+ Add Staff</button>
        </div>
      </div>
      <div style={{ padding: 'var(--pad) var(--pad) 8px' }}>
        <input className="fi" placeholder="Search name or ID…" value={query} onChange={e => setQuery(e.target.value)} style={{ maxWidth: 280 }} />
      </div>
      <div className="tbl" style={{ padding: '0 var(--pad) var(--pad)' }}>
        <table className="data-table">
          <thead><tr><th>ID</th><th>Name</th><th>Phone</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {shown.map(s => (
              <tr key={s.id}>
                <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{s.staff_id}</td>
                <td><strong>{s.first_name} {s.last_name}</strong></td>
                <td style={{ fontSize: 11 }}>{s.phone}</td>
                <td><span className={`bdg ${s.employment_status === 'ACTIVE' ? 'bok' : 'ber'}`}>{s.employment_status}</span></td>
                <td><button style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--soft)', color: 'var(--ink)', fontWeight: 600 }}>View</button></td>
              </tr>
            ))}
            {shown.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>No staff match</td></tr>}
          </tbody>
        </table>
      </div>
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(4,13,52,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setShowCreate(false)}>
          <form onSubmit={handleCreate} onClick={e => e.stopPropagation()} style={{ background: 'var(--white)', padding: 24, borderRadius: 'var(--r)', width: 360, boxShadow: 'var(--shL)' }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, marginBottom: 16 }}>Add Staff</h3>
            <div className="fg"><label className="fl">STAFF ID</label><input className="fi" value={form.staffId} onChange={e => setForm({ ...form, staffId: e.target.value })} required /></div>
            <div className="fg"><label className="fl">FIRST NAME</label><input className="fi" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} required /></div>
            <div className="fg"><label className="fl">LAST NAME</label><input className="fi" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} required /></div>
            <div className="fg"><label className="fl">GENDER</label><select className="fi" value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}><option value="MALE">Male</option><option value="FEMALE">Female</option></select></div>
            <div className="fg"><label className="fl">DOB</label><input className="fi" type="date" value={form.dateOfBirth} onChange={e => setForm({ ...form, dateOfBirth: e.target.value })} required /></div>
            <div className="fg"><label className="fl">PHONE</label><input className="fi" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required /></div>
            <div className="fg"><label className="fl">EMAIL</label><input className="fi" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required /></div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button type="submit" style={{ flex: 1, background: 'var(--navy)', color: 'var(--gold)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Add</button>
              <button type="button" onClick={() => setShowCreate(false)} style={{ flex: 1, background: 'var(--soft)', color: 'var(--ink)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Cancel</button>
            </div>
          </form>
        </div>
      )}
    </AppShell>
  );
}
