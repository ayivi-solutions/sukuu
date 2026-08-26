'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '../../../components/AppShell';
import { authedFetch } from '../../../lib/api';

export default function StaffLeavePage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [user, setUser] = useState<any>(null);
  const [school, setSchool] = useState<any>(null);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const t = 'cookie';
    const userStr = sessionStorage.getItem('sukuu_user');
    if (!t) { router.push('/login'); return; }
    setToken(t);
    setUser(userStr ? JSON.parse(userStr) : null);
    load(t);
  }, [router]);

  function load(t: string) {
    authedFetch('/api/v1/school/profile', t).then(d => d && !d.error && setSchool(d));
    authedFetch('/api/v1/staff', t).then(d => Array.isArray(d) && setStaff(d));
    authedFetch('/api/v1/staff/leave', t).then(d => Array.isArray(d) ? setLeaveRequests(d) : setError(d?.error));
  }

  async function handleDecide(id: string, decision: 'APPROVED' | 'REJECTED') {
    await authedFetch(`/api/v1/staff/leave/${id}/decide`, token, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ decision }) });
    load(token);
  }

  function staffName(id: string) { const s = staff.find(x => x.id === id); return s ? `${s.first_name} ${s.last_name}` : id?.slice(0, 8); }

  const shown = leaveRequests.filter(l => !statusFilter || l.status === statusFilter);

  if (error) return <AppShell user={user}><div style={{ padding: 40, color: 'var(--er)' }}>{error}</div></AppShell>;

  return (
    <AppShell user={user} schoolName={school?.name}>
      <div className="ph">
        <div className="ph-row">
          <div>
            <div className="ph-ey">STAFFX · LEAVE MANAGEMENT</div>
            <div className="ph-title">🗓️ Staff Leave</div>
            <div className="ph-sub">Review and decide on staff leave requests across the institution</div>
          </div>
        </div>
      </div>
      <div style={{ padding: 'var(--pad) var(--pad) 8px' }}>
        <select className="fi" style={{ width: 'auto' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>
      <div className="tbl" style={{ padding: '0 var(--pad) var(--pad)' }}>
        <table className="data-table">
          <thead><tr><th>Staff</th><th>Type</th><th>Dates</th><th>Days</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {shown.map(l => (
              <tr key={l.id}>
                <td><strong>{staffName(l.staff_id)}</strong></td>
                <td>{l.leave_type}</td>
                <td style={{ fontSize: 11 }}>{l.start_date} → {l.end_date}</td>
                <td>{l.days_requested}</td>
                <td><span className={`bdg ${l.status === 'APPROVED' ? 'bok' : l.status === 'REJECTED' ? 'ber' : 'bwn'}`}>{l.status}</span></td>
                <td style={{ display: 'flex', gap: 6 }}>
                  {l.status === 'PENDING' && (
                    <>
                      <button onClick={() => handleDecide(l.id, 'APPROVED')} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--okB)', color: 'var(--ok)', fontWeight: 600 }}>Approve</button>
                      <button onClick={() => handleDecide(l.id, 'REJECTED')} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--erB)', color: 'var(--er)', fontWeight: 600 }}>Reject</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {shown.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>No leave requests</td></tr>}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
