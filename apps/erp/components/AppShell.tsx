'use client';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const NAV_SECTIONS = [
  { sec: 'PLATFORM', items: [
    { icon: '🏠', label: 'Dashboard', href: '/dashboard' },
    { icon: '⚙️', label: 'SystemX', href: '/systemx' },
    { icon: '🏫', label: 'SchoolX', href: '/schoolx' },
  ]},
  { sec: 'ACADEMIC', items: [
    { icon: '🎓', label: 'AcademicX', href: '/academicx' },
    { icon: '📋', label: 'AdmissionX', href: '/admissions' },
    { icon: '🗓️', label: 'ScheduleX', href: '/schedulex' },
    { icon: '📊', label: 'GradingX', href: '/gradingx' },
    { icon: '✅', label: 'AttendanceX', href: '/attendancex' },
    { icon: '📊', label: 'GradingX', href: '/gradingx' },
    { icon: '📜', label: 'TranscriptX', href: '/transcriptx' },
  ]},
  { sec: 'PEOPLE', items: [
    { icon: '🧑‍🎒', label: 'StudentX', href: '/students' },
    { icon: '👩‍🏫', label: 'StaffX', href: '/staff' },
  ]},
  { sec: 'FINANCE', items: [
    { icon: '💰', label: 'FinanceX', href: '/financex' },
    { icon: '🧾', label: 'PayrollX', href: '/payrollx' },
  ]},
];

const BOTTOM_NAV: Record<string, { icon: string; label: string; href: string }[]> = {
  superadmin:   [
    { icon: '🏠', label: 'HOME', href: '/dashboard' },
    { icon: '⚙️', label: 'SYSTEM', href: '/systemx' },
    { icon: '🏫', label: 'SCHOOL', href: '/schoolx' },
    { icon: '🧑‍🎒', label: 'STUDENTS', href: '/students' },
    { icon: '💰', label: 'FINANCE', href: '/financex' },
  ],
  headmaster:   [
    { icon: '🏠', label: 'HOME', href: '/dashboard' },
    { icon: '🧑‍🎒', label: 'STUDENTS', href: '/students' },
    { icon: '✅', label: 'ATTEND.', href: '/attendancex' },
    { icon: '💰', label: 'FINANCE', href: '/financex' },
    { icon: '📊', label: 'GRADES', href: '/gradingx' },
  ],
  school_admin: [
    { icon: '🏠', label: 'HOME', href: '/dashboard' },
    { icon: '🧑‍🎒', label: 'STUDENTS', href: '/students' },
    { icon: '👩‍🏫', label: 'STAFF', href: '/staff' },
    { icon: '✅', label: 'ATTEND.', href: '/attendancex' },
    { icon: '📋', label: 'ADMISS.', href: '/admissions' },
  ],
  bursar:       [
    { icon: '🏠', label: 'HOME', href: '/dashboard' },
    { icon: '💰', label: 'FINANCE', href: '/financex' },
    { icon: '🧾', label: 'PAYROLL', href: '/payrollx' },
    { icon: '🧑‍🎒', label: 'STUDENTS', href: '/students' },
    { icon: '🏫', label: 'SCHOOL', href: '/schoolx' },
  ],
  hod:          [
    { icon: '🏠', label: 'HOME', href: '/dashboard' },
    { icon: '✅', label: 'ATTEND.', href: '/attendancex' },
    { icon: '📊', label: 'GRADES', href: '/gradingx' },
    { icon: '🗓️', label: 'SCHEDULE', href: '/schedulex' },
    { icon: '📊', label: 'GradingX', href: '/gradingx' },
    { icon: '🧑‍🎒', label: 'STUDENTS', href: '/students' },
  ],
  teacher:      [
    { icon: '🏠', label: 'HOME', href: '/dashboard' },
    { icon: '🗓️', label: 'SCHEDULE', href: '/schedulex' },
    { icon: '📊', label: 'GradingX', href: '/gradingx' },
    { icon: '✅', label: 'ATTEND.', href: '/attendancex' },
    { icon: '📊', label: 'GRADES', href: '/gradingx' },
    { icon: '🧑‍🎒', label: 'STUDENTS', href: '/students' },
  ],
  registrar:    [
    { icon: '🏠', label: 'HOME', href: '/dashboard' },
    { icon: '🧑‍🎒', label: 'STUDENTS', href: '/students' },
    { icon: '📋', label: 'ADMISS.', href: '/admissions' },
    { icon: '📜', label: 'TRANSCRIPTS', href: '/transcriptx' },
    { icon: '🎓', label: 'ACADEMIC', href: '/academicx' },
  ],
};
const DEFAULT_BNAV = [{ icon: '🏠', label: 'HOME', href: '/dashboard' }];

function NavList({ pathname, onNavigate }: { pathname: string; onNavigate: (href: string) => void }) {
  return (
    <div className="sd-nav">
      {NAV_SECTIONS.map(section => (
        <div key={section.sec}>
          <div className="sd-sec">{section.sec}</div>
          {section.items.map(item => (
            <a key={item.href} className={`sd-item${pathname.startsWith(item.href) && item.href !== '/dashboard' ? ' act' : pathname === item.href ? ' act' : ''}`}
               onClick={() => onNavigate(item.href)} style={{ cursor: 'pointer' }}>
              <span className="sd-icon">{item.icon}</span>
              <span className="sd-lbl">{item.label}</span>
            </a>
          ))}
        </div>
      ))}
    </div>
  );
}

export default function AppShell({ children, user, schoolName }: {
  children: React.ReactNode; user: any; schoolName?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let ro: ResizeObserver | null = null;
    let currentEl: HTMLElement | null = null;
    const setHeight = (el: HTMLElement) => document.documentElement.style.setProperty('--ph-height', `${el.offsetHeight}px`);
    const tryAttach = () => {
      const el = document.querySelector('#stack .ph') as HTMLElement | null;
      if (el && el !== currentEl) {
        if (ro) ro.disconnect();
        currentEl = el;
        setHeight(el);
        ro = new ResizeObserver(() => setHeight(el));
        ro.observe(el);
      }
    };
    tryAttach();
    const stackEl = document.getElementById('stack');
    const mo = stackEl ? new MutationObserver(tryAttach) : null;
    if (stackEl && mo) mo.observe(stackEl, { childList: true, subtree: true });
    return () => { if (ro) ro.disconnect(); if (mo) mo.disconnect(); };
  }, [pathname]);

  useEffect(() => {
    const t = localStorage.getItem('sukuu_token');
    if (!t) return;
    fetch((process.env.NEXT_PUBLIC_API_URL || '') + '/api/v1/school/branding', { headers: { Authorization: `Bearer ${t}` } })
      .then(r => r.json())
      .then(b => {
        if (b?.primary_color) document.documentElement.style.setProperty('--navy', b.primary_color);
        if (b?.secondary_color) document.documentElement.style.setProperty('--gold', b.secondary_color);
        if (b?.crest_url) setCrestUrl(b.crest_url);
      })
      .catch(() => {});
  }, []);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [crestUrl, setCrestUrl] = useState('');

  function logout() {
    localStorage.removeItem('sukuu_token');
    localStorage.removeItem('sukuu_user');
    router.push('/login');
  }
  function navigate(href: string) {
    setDrawerOpen(false);
    router.push(href);
  }

  const initials = user ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}` : '';
  const roleKey = user?.roleKey || '';
  const bnavItems = BOTTOM_NAV[roleKey] || DEFAULT_BNAV;

  return (
    <div id="app">
      <nav id="sidebar">
        <div className="sd-brand">
          <div className="sd-mark"><img src="/sukuu-icon.png" alt="Sukuu" /></div>
          <div className="sd-product">
            <div className="sd-pname">Sukuu ERP</div>
            <div className="sd-pver">V1.0 · AYIVI SOLUTIONS</div>
          </div>
        </div>
        <div className="sd-school" onClick={() => navigate('/schoolx')}>
          <div className="sd-sav">{crestUrl ? <img src={crestUrl} alt="Crest" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} /> : (schoolName?.[0] || 'S')}</div>
          <div className="sd-sinf">
            <div className="sd-sname">{schoolName || 'School'}</div>
            <div className="sd-srole">{user?.roleLabel}</div>
          </div>
          <span style={{ color: 'rgba(242,230,201,.3)', fontSize: 12 }}>⌄</span>
        </div>
        <NavList pathname={pathname} onNavigate={navigate} />
        <div className="sd-foot">
          <button className="sd-ftn" onClick={() => navigate('/systemx')}><span>⚙️</span>Settings</button>
          <button className="sd-ftn" onClick={() => setShowLogoutConfirm(true)}><span>🚪</span>Sign Out</button>
        </div>
      </nav>

      <div id="panel">
        <header id="topbar">
          <button className="tb-hbg" onClick={() => setDrawerOpen(true)}>☰</button>
          <div className="tb-brand">
            <div className="tb-mark"><img src="/sukuu-icon.png" alt="Sukuu" /></div>
            <span className="tb-name">Sukuu <em>ERP</em></span>
          </div>
          <div className="tb-right">
            <img src="/ges-coa.png" alt="GES" title="Regulated by Ghana Education Service" style={{ height: 22, width: 'auto', marginRight: 4 }} />
            <button className="tb-btn" title="Notifications">🔔</button>
            <div className="tb-av">{initials || 'U'}</div>
          </div>
        </header>
        <div id="stack">{children}</div>
        <nav id="bnav">
          {bnavItems.map(item => (
            <button key={item.href} className={`bn${pathname === item.href ? ' act' : ''}`} onClick={() => navigate(item.href)}>
              <span className="bn-i">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
          <button className="bn" onClick={() => setShowLogoutConfirm(true)}>
            <span className="bn-i">🚪</span>
            <span>OUT</span>
          </button>
        </nav>
      </div>

      <div id="dov" className={drawerOpen ? 'open' : ''} onClick={() => setDrawerOpen(false)} />
      <div id="drawer" style={{ transform: drawerOpen ? 'translateX(0)' : 'translateX(-100%)', transition: 'transform .24s' }}>
        <div className="sd-brand">
          <div className="sd-mark"><img src="/sukuu-icon.png" alt="Sukuu" /></div>
          <div className="sd-product">
            <div className="sd-pname">Sukuu ERP</div>
            <div className="sd-pver">V1.0 · AYIVI SOLUTIONS</div>
          </div>
        </div>
        <NavList pathname={pathname} onNavigate={navigate} />
        <div className="sd-foot">
          <button className="sd-ftn" onClick={() => setShowLogoutConfirm(true)}><span>🚪</span>Sign Out</button>
        </div>
      </div>

      {showLogoutConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(4,13,52,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }} onClick={() => setShowLogoutConfirm(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--white)', padding: 28, borderRadius: 'var(--r)', width: 340, boxShadow: 'var(--shL)', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🚪</div>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, marginBottom: 8 }}>Sign out of Sukuu ERP?</h3>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>You'll need to sign in again to access your workspace.</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowLogoutConfirm(false)} style={{ flex: 1, background: 'var(--soft)', color: 'var(--ink)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Cancel</button>
              <button onClick={logout} style={{ flex: 1, background: 'var(--erB)', color: 'var(--er)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Sign Out</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
