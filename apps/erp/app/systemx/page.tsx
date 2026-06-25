'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '../../components/AppShell';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001';

export default function SystemXPage() {
  const router = useRouter();
  const [roles, setRoles] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('sukuu_token');
    const userStr = localStorage.getItem('sukuu_user');
    if (!token) { router.push('/login'); return; }
    setUser(userStr ? JSON.parse(userStr) : null);
    fetch(`${API_URL}/api/v1/system/roles`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(d => Array.isArray(d) ? setRoles(d) : setError(d.error || 'Failed to load'))
      .catch(err => setError(err.message));
  }, [router]);

  return (
    <AppShell user={user}>
      <div className="ph">
        <div className="ph-row">
          <div>
            <div className="ph-ey">SYSTEMX</div>
            <div className="ph-title">Auth · RBAC · Sessions</div>
            <div className="ph-sub">{roles.length} system roles configured</div>
          </div>
        </div>
      </div>

      {error && <div style={{ padding: 'var(--pad)', color: 'var(--er)' }}>{error}</div>}

      <div className="two-col">
        <div className="card">
          <div className="ch"><span className="ch-t">SYSTEM ROLES</span></div>
          {roles.map(role => (
            <div key={role.id} className="ri na">
              <div className="ri-ic" style={{ background: 'var(--inB)' }}>👤</div>
              <div className="ri-b">
                <div className="ri-t">{role.label}</div>
                <div className="ri-s">{role.name} · {role.is_system ? 'System role' : 'Custom role'}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
