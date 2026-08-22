'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getDashboardSummary } from '../../lib/api';
import AppShell from '../../components/AppShell';

type Summary = {
  school: { id: string; name: string; code: string } | null;
  term: string | null;
  academicYear: string | null;
  staff: { total: number; active: number };
  students: { total: number; active: number };
  attendance: { presentToday: number; markedToday: number; ratePct: number | null };
  finance: { outstandingBalance: number; overdueInvoices: number; collectedThisMonth: number };
  needsAttention: { admissionsPending: number; leavePending: number; overdueInvoices: number };
};

function money(n: number) {
  return 'GH₵ ' + n.toLocaleString('en-GH', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function SkeletonDashboard() {
  return (
    <>
      <div className="ph">
        <div className="skel skel-line" style={{ width: 140 }} />
        <div className="skel skel-line" style={{ width: 220, height: 22 }} />
      </div>
      <div style={{ padding: '0 var(--pad)' }}>
        <div className="skel" style={{ height: 84, borderRadius: 'var(--r)', marginTop: 16 }} />
      </div>
      <div className="stat-grid">
        {[1, 2, 3, 4].map((i) => <div key={i} className="skel skel-card" />)}
      </div>
    </>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('sukuu_token');
    const userStr = localStorage.getItem('sukuu_user');
    if (!token) { router.push('/login'); return; }
    setUser(userStr ? JSON.parse(userStr) : null);
    getDashboardSummary(token)
      .then((d) => { setData(d); setLoading(false); })
      .catch((err) => { setError(err.message); setLoading(false); });
  }, [router]);

  if (error) {
    return (
      <AppShell user={user}>
        <div style={{ padding: 'var(--pad)' }}>
          <div className="alert al-er">
            <span className="al-ic">⚠️</span>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 2 }}>Couldn't load your dashboard</div>
              <div>{error}. Try refreshing — if this keeps happening, contact your system administrator.</div>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  if (loading || !data) {
    return <AppShell user={user}><SkeletonDashboard /></AppShell>;
  }

  const attn: { key: string; icon: string; title: string; sub: string; count: number; urgent?: boolean; href: string }[] = [
    data.needsAttention.overdueInvoices > 0 && {
      key: 'overdue', icon: '💰', title: 'Overdue invoices', sub: `${money(data.finance.outstandingBalance)} outstanding`,
      count: data.needsAttention.overdueInvoices, urgent: true, href: '/financex',
    },
    data.needsAttention.admissionsPending > 0 && {
      key: 'admissions', icon: '📋', title: 'Applications awaiting review', sub: 'Pending or under review',
      count: data.needsAttention.admissionsPending, href: '/admissions',
    },
    data.needsAttention.leavePending > 0 && {
      key: 'leave', icon: '🗓️', title: 'Staff leave requests', sub: 'Awaiting approval',
      count: data.needsAttention.leavePending, href: '/staff/leave',
    },
  ].filter(Boolean) as any;

  const termLabel = data.term && data.academicYear
    ? `${data.term.toUpperCase()} · ${data.academicYear}`
    : data.academicYear
    ? data.academicYear.toUpperCase()
    : 'NO ACTIVE TERM SET';

  return (
    <AppShell user={user} schoolName={data.school?.name}>
      <div className="ph">
        <div className="ph-row">
          <div>
            <div className="ph-ey">{data.school?.name?.toUpperCase()} · {termLabel}</div>
            <div className="ph-title">{user?.roleLabel ? `${user.roleLabel}'s Dashboard` : 'Dashboard'}</div>
            <div className="ph-sub">Here's what's happening across {data.school?.name || 'your school'} today.</div>
          </div>
        </div>
      </div>

      <div className="today-ribbon">
        <div className="tr-top">
          <div>
            <div className="tr-lbl">TODAY'S ATTENDANCE</div>
            {data.attendance.ratePct !== null
              ? <div className="tr-val">{data.attendance.ratePct}% present</div>
              : <div className="tr-empty">No attendance sessions recorded yet today</div>}
          </div>
          {data.attendance.markedToday > 0 && (
            <div className="tr-sub">{data.attendance.presentToday} of {data.attendance.markedToday} marked</div>
          )}
        </div>
        {data.attendance.ratePct !== null && (
          <div className="tr-track"><div className="tr-fill" style={{ width: `${data.attendance.ratePct}%` }} /></div>
        )}
      </div>

      <div className="stat-grid">
        <a href="/students" className="sc sc-link">
          <div className="sc-top">
            <div className="sc-icon" style={{ background: 'var(--inB)' }}>🧑‍🎒</div>
            <span className="bdg bin">{data.students.active} active</span>
          </div>
          <div className="sc-val">{data.students.total}</div>
          <div className="sc-lbl">STUDENTS</div>
        </a>
        <a href="/staff" className="sc sc-link">
          <div className="sc-top">
            <div className="sc-icon" style={{ background: 'var(--okB)' }}>👩‍🏫</div>
            <span className="bdg bok">{data.staff.active} active</span>
          </div>
          <div className="sc-val">{data.staff.total}</div>
          <div className="sc-lbl">STAFF MEMBERS</div>
        </a>
        <a href="/financex" className="sc sc-link">
          <div className="sc-top">
            <div className="sc-icon" style={{ background: data.finance.overdueInvoices > 0 ? 'var(--erB)' : 'var(--goldF)' }}>💰</div>
            {data.finance.overdueInvoices > 0 && <span className="bdg ber">{data.finance.overdueInvoices} overdue</span>}
          </div>
          <div className="sc-val" style={{ fontSize: 20 }}>{money(data.finance.outstandingBalance)}</div>
          <div className="sc-lbl">OUTSTANDING FEES</div>
          <div className="sc-foot">{money(data.finance.collectedThisMonth)} collected this month</div>
        </a>
        <a href="/admissions" className="sc sc-link">
          <div className="sc-top">
            <div className="sc-icon" style={{ background: 'var(--puB)' }}>📋</div>
            {data.needsAttention.admissionsPending > 0 && <span className="bdg bin">{data.needsAttention.admissionsPending} pending</span>}
          </div>
          <div className="sc-val">{data.needsAttention.admissionsPending}</div>
          <div className="sc-lbl">APPLICATIONS TO REVIEW</div>
        </a>
      </div>

      <div className="two-col">
        <div className="card">
          <div className="ch"><span className="ch-t">NEEDS ATTENTION</span></div>
          {attn.length === 0 ? (
            <div className="empty-state">
              <div className="empty-ic">✅</div>
              <div className="empty-t">You're all caught up</div>
              <div className="empty-s">No overdue invoices, pending applications, or leave requests right now.</div>
            </div>
          ) : (
            attn.map((item: any) => (
              <a key={item.key} href={item.href} className="attn-row">
                <div className={`attn-count${item.urgent ? ' urgent' : ''}`}>{item.count}</div>
                <div className="attn-b">
                  <div className="attn-t">{item.title}</div>
                  <div className="attn-s">{item.sub}</div>
                </div>
                <span className="attn-chev">›</span>
              </a>
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}
