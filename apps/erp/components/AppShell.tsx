'use client';
import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { icon: '🏠', label: 'Dashboard', href: '/dashboard' },
  { icon: '⚙️', label: 'SystemX', href: '/systemx' },
  { icon: '🏫', label: 'SchoolX', href: '/schoolx' },
];

function NavList({ pathname, onNavigate }: { pathname: string; onNavigate: (href: string) => void }) {
  return (
    <div className="sd-nav">
      <div className="sd-sec">MAIN</div>
      {NAV_ITEMS.map(item => (
        <a key={item.href} className={`sd-item${pathname === item.href ? ' act' : ''}`}
           onClick={() => onNavigate(item.href)} style={{ cursor: 'pointer' }}>
          <span className="sd-icon">{item.icon}</span>
          <span className="sd-lbl">{item.label}</span>
        </a>
      ))}
    </div>
  );
}

export default function AppShell({ children, user, schoolName }: {
  children: React.ReactNode; user: any; schoolName?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  function logout() {
    if (!confirm('Are you sure you want to sign out?')) return;
    localStorage.removeItem('sukuu_token');
    localStorage.removeItem('sukuu_user');
    router.push('/login');
  }
  function navigate(href: string) {
    setDrawerOpen(false);
    router.push(href);
  }

  const initials = user ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}` : '';

  return (
    <div id="app">
      <nav id="sidebar">
        <div className="sd-brand">
          <div className="sd-mark">S</div>
          <div className="sd-product">
            <div className="sd-pname">Sukuu ERP</div>
            <div className="sd-pver">V1.0 · AYIVI SOLUTIONS</div>
          </div>
        </div>
        <div className="sd-school" onClick={() => navigate('/schoolx')}>
          <div className="sd-sav">{schoolName?.[0] || 'S'}</div>
          <div className="sd-sinf">
            <div className="sd-sname">{schoolName || 'School'}</div>
            <div className="sd-srole">{user?.roleLabel}</div>
          </div>
          <span style={{ color: 'rgba(242,230,201,.3)', fontSize: 12 }}>⌄</span>
        </div>
        <NavList pathname={pathname} onNavigate={navigate} />
        <div className="sd-foot">
          <button className="sd-ftn" onClick={() => navigate('/systemx')}><span>⚙️</span>Settings</button>
          <button className="sd-ftn" onClick={logout}><span>🚪</span>Sign Out</button>
        </div>
      </nav>

      <div id="panel">
        <header id="topbar">
          <button className="tb-hbg" onClick={() => setDrawerOpen(true)}>☰</button>
          <div className="tb-brand">
            <div className="tb-mark">S</div>
            <span className="tb-name">Sukuu <em>ERP</em></span>
          </div>
          <div className="tb-right">
            <button className="tb-btn" title="Notifications">🔔</button>
            <div className="tb-av">{initials || 'U'}</div>
          </div>
        </header>
        <div id="stack">{children}</div>
        <nav id="bnav">
          {NAV_ITEMS.map(item => (
            <button key={item.href} className={`bn${pathname === item.href ? ' act' : ''}`} onClick={() => navigate(item.href)}>
              <span className="bn-i">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
          <button className="bn" onClick={logout}>
            <span className="bn-i">🚪</span>
            <span>Sign Out</span>
          </button>
        </nav>
      </div>

      <div id="dov" className={drawerOpen ? 'open' : ''} onClick={() => setDrawerOpen(false)} />
      <div id="drawer" style={{ transform: drawerOpen ? 'translateX(0)' : 'translateX(-100%)', transition: 'transform .24s' }}>
        <div className="sd-brand">
          <div className="sd-mark">S</div>
          <div className="sd-product">
            <div className="sd-pname">Sukuu ERP</div>
            <div className="sd-pver">V1.0 · AYIVI SOLUTIONS</div>
          </div>
        </div>
        <NavList pathname={pathname} onNavigate={navigate} />
        <div className="sd-foot">
          <button className="sd-ftn" onClick={logout}><span>🚪</span>Sign Out</button>
        </div>
      </div>
    </div>
  );
}
