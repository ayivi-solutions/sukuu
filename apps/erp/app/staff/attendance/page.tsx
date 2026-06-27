'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '../../../components/AppShell';
import { authedFetch } from '../../../lib/api';

function todayStr() { return new Date().toISOString().slice(0, 10); }

export default function StaffAttendancePage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [user, setUser] = useState<any>(null);
  const [school, setSchool] = useState<any>(null);
  const [staff, setStaff] = useState<any[]>([]);
  const [records, setRecords] = useState<Record<string, any>>({});
  const [error, setError] = useState('');
  const date = todayStr();

  useEffect(() => {
    const t = localStorage.getItem('sukuu_token');
    const userStr = localStorage.getItem('sukuu_user');
    if (!t) { router.push('/login'); return; }
    setToken(t);
    setUser(userStr ? JSON.parse(userStr) : null);
    load(t);
  }, [router]);

  async function load(t: string) {
    authedFetch('/api/v1/school/profile', t).then(d => d && !d.error && setSchool(d));
    const staffList = await authedFetch('/api/v1/staff', t);
    if (!Array.isArray(staffList)) { setError(staffList?.error); return; }
    setStaff(staffList);
    const results = await Promise.all(staffList.map((s: any) => authedFetch(`/api/v1/staff/${s.id}/attendance`, t)));
    const map: Record<string, any> = {};
    staffList.forEach((s: any, i: number) => {
      const todayRecord = Array.isArray(results[i]) ? results[i].find((r: any) => r.date === date) : null;
      map[s.id] = todayRecord || null;
    });
    setRecords(map);
  }

  async function handleCheckIn(staffId: string) {
    await authedFetch(`/api/v1/staff/${staffId}/attendance/check-in`, token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ date }) });
    load(token);
  }
  async function handleCheckOut(staffId: string) {
    await authedFetch(`/api/v1/staff/${staffId}/attendance/check-out`, token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ date }) });
    load(token);
  }

  if (error) return <AppShell user={user}><div style={{ padding: 40, color: 'var(--er)' }}>{error}</div></AppShell>;

  return (
    <AppShell user={user} schoolName={school?.name}>
      <div className="ph">
        <div className="ph-row">
          <div>
            <div className="ph-ey">STAFFX · DAILY ATTENDANCE</div>
            <div className="ph-title">🕘 Staff Attendance</div>
            <div className="ph-sub">{new Date(date).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
          </div>
        </div>
      </div>
      <div className="tbl" style={{ padding: 'var(--pad)' }}>
        <table className="data-table">
          <thead><tr><th>Staff</th><th>Check In</th><th>Check Out</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {staff.map(s => {
              const r = records[s.id];
              return (
                <tr key={s.id}>
                  <td><strong>{s.first_name} {s.last_name}</strong></td>
                  <td style={{ fontSize: 11 }}>{r?.check_in ? new Date(r.check_in).toLocaleTimeString() : '—'}</td>
                  <td style={{ fontSize: 11 }}>{r?.check_out ? new Date(r.check_out).toLocaleTimeString() : '—'}</td>
                  <td>{r ? <span className="bdg bok">{r.status}</span> : <span className="bdg ber">Not checked in</span>}</td>
                  <td style={{ display: 'flex', gap: 6 }}>
                    {!r?.check_in && <button onClick={() => handleCheckIn(s.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--okB)', color: 'var(--ok)', fontWeight: 600 }}>Check In</button>}
                    {r?.check_in && !r?.check_out && <button onClick={() => handleCheckOut(s.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--wnB)', color: 'var(--wn)', fontWeight: 600 }}>Check Out</button>}
                  </td>
                </tr>
              );
            })}
            {staff.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>No staff records</td></tr>}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
