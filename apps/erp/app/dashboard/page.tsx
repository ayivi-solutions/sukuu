'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getDashboardSummary } from '../../lib/api';
import AppShell from '../../components/AppShell';

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('sukuu_token');
    const userStr = localStorage.getItem('sukuu_user');
    if (!token) { router.push('/login'); return; }
    setUser(userStr ? JSON.parse(userStr) : null);
    getDashboardSummary(token).then(setData).catch(err => setError(err.message));
  }, [router]);

  if (error) return <div style={{ padding: 40, color: 'var(--er)' }}>{error}</div>;
  if (!data) return <div style={{ padding: 40 }}>Loading…</div>;

  return (
    <AppShell user={user} schoolName={data.school?.name}>
      <div className="ph">
        <div className="ph-row">
          <div>
            <div className="ph-ey">{data.school?.name?.toUpperCase()} · TERM 2 · 2025/2026</div>
            <div className="ph-title">{user?.roleLabel}'s Dashboard</div>
            <div className="ph-sub">{data.note}</div>
          </div>
        </div>
      </div>

      <div className="stat-grid">
        <div className="sc">
          <div className="sc-top">
            <div className="sc-icon" style={{ background: 'var(--okB)' }}>👨‍🏫</div>
            <span className="bdg bok">{data.staff?.active === data.staff?.total ? 'All Active' : 'Mixed'}</span>
          </div>
          <div className="sc-val">{data.staff?.total}</div>
          <div className="sc-lbl">STAFF MEMBERS</div>
        </div>
        <div className="sc">
          <div className="sc-top">
            <div className="sc-icon" style={{ background: 'var(--okB)' }}>✅</div>
            <span className="bdg bok">Active</span>
          </div>
          <div className="sc-val">{data.staff?.active}</div>
          <div className="sc-lbl">ACTIVE STAFF</div>
        </div>
        <div className="sc">
          <div className="sc-top">
            <div className="sc-icon" style={{ background: 'var(--goldF)' }}>🏫</div>
            <span className="bdg bgo">{data.school?.code}</span>
          </div>
          <div className="sc-val" style={{ fontSize: 16 }}>{data.school?.name}</div>
          <div className="sc-lbl">INSTITUTION</div>
        </div>
      </div>

      <div className="two-col">
        <div className="card">
          <div className="ch"><span className="ch-t">PENDING MODULES</span></div>
          <div className="ri na">
            <div className="ri-ic" style={{ background: 'var(--inB)' }}>🧑‍🎒</div>
            <div className="ri-b">
              <div className="ri-t">StudentX</div>
              <div className="ri-s">Student records — not yet built</div>
            </div>
          </div>
          <div className="ri na">
            <div className="ri-ic" style={{ background: 'var(--inB)' }}>💰</div>
            <div className="ri-b">
              <div className="ri-t">FinanceX</div>
              <div className="ri-s">Fees & billing — not yet built</div>
            </div>
          </div>
          <div className="ri na">
            <div className="ri-ic" style={{ background: 'var(--inB)' }}>✅</div>
            <div className="ri-b">
              <div className="ri-t">AttendanceX</div>
              <div className="ri-s">Attendance tracking — not yet built</div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
