'use client';
import { useRouter, usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { icon: '🏠', label: 'Dashboard', href: '/dashboard' },
  { icon: '⚙️', label: 'SystemX', href: '/systemx' },
  { icon: '🏫', label: 'SchoolX', href: '/schoolx' },
];

export default function AppShell({ children, user, schoolName }: {
  children: React.ReactNode; user: any; schoolName?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  function logout() {
    localStorage.removeItem('sukuu_token');
    localStorage.removeItem('sukuu_user');
    router.push('/login');
  }

  const initials = user ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}` : '';

  return (
    <div id="app">
      <nav id="sidebar" className="visible">
        <div className="sd-brand">
          <div className="sd-mark">S</div>
          <div className="sd-product">
            <div className="sd-pname">Sukuu ERP</div>
            <div className="sd-pver">V1.0 · AYIVI SOLUTIONS</div>
          </div>
        </div>
        <div className="sd-school" onClick={() => router.push('/schoolx')}>
          <div className="sd-sav">{schoolName?.[0] || 'S'}</div>
          <div className="sd-sinf">
            <div className="sd-sname">{schoolName || 'School'}</div>
            <div className="sd-srole">{user?.roleLabel}</div>
          </div>
          <span style={{ color: 'rgba(242,230,201,.3)', fontSize: 12 }}>⌄</span>
        </div>
        <div className="sd-nav">
          <div className="sd-sec">MAIN</div>
          {NAV_ITEMS.map(item => (
            <a key={item.href} className={`sd-item${pathname === item.href ? ' act' : ''}`}
               onClick={() => router.push(item.href)} style={{ cursor: 'pointer' }}>
              <span className="sd-icon">{item.icon}</span>
              <span className="sd-lbl">{item.label}</span>
            </a>
          ))}
        </div>
        <div className="sd-foot">
          <button className="sd-ftn" onClick={() => router.push('/systemx')}><span>⚙️</span>Settings</button>
          <button className="sd-ftn" onClick={logout}><span>🚪</span>Sign Out</button>
        </div>
      </nav>

      <div id="panel">
        <header id="topbar">
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
      </div>
    </div>
  );
}
