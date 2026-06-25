'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '../../components/AppShell';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001';

export default function SchoolXPage() {
  const router = useRouter();
  const [school, setSchool] = useState<any>(null);
  const [settings, setSettings] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('sukuu_token');
    const userStr = localStorage.getItem('sukuu_user');
    if (!token) { router.push('/login'); return; }
    setUser(userStr ? JSON.parse(userStr) : null);
    fetch(`${API_URL}/api/v1/school/profile`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json()).then(setSchool).catch(err => setError(err.message));
    fetch(`${API_URL}/api/v1/school/settings`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json()).then(d => Array.isArray(d) ? setSettings(d) : null);
  }, [router]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const token = localStorage.getItem('sukuu_token');
    try {
      const res = await fetch(`${API_URL}/api/v1/school/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ phone: school.phone, email: school.email, website: school.website }),
      });
      const updated = await res.json();
      setSchool(updated);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (error) return <AppShell user={user}><div style={{ padding: 40, color: 'var(--er)' }}>{error}</div></AppShell>;
  if (!school) return <AppShell user={user}><div style={{ padding: 40 }}>Loading…</div></AppShell>;

  return (
    <AppShell user={user} schoolName={school.name}>
      <div className="ph">
        <div className="ph-row">
          <div>
            <div className="ph-ey">SCHOOLX</div>
            <div className="ph-title">{school.name}</div>
            <div className="ph-sub">{school.code} · {school.city}, {school.region}</div>
          </div>
        </div>
      </div>

      <div className="two-col">
        <form className="card" onSubmit={handleSave}>
          <div className="ch"><span className="ch-t">INSTITUTION PROFILE</span></div>
          <div className="cb">
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>PHONE</label>
            <input value={school.phone || ''} onChange={e => setSchool({ ...school, phone: e.target.value })}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--bd)', borderRadius: 'var(--rS)', fontSize: 13, marginBottom: 14 }} />
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>EMAIL</label>
            <input value={school.email || ''} onChange={e => setSchool({ ...school, email: e.target.value })}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--bd)', borderRadius: 'var(--rS)', fontSize: 13, marginBottom: 14 }} />
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>WEBSITE</label>
            <input value={school.website || ''} onChange={e => setSchool({ ...school, website: e.target.value })}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--bd)', borderRadius: 'var(--rS)', fontSize: 13, marginBottom: 16 }} />
            <button type="submit" disabled={saving} style={{
              background: 'var(--navy)', color: 'var(--gold)', padding: '11px 20px',
              borderRadius: 'var(--rS)', fontSize: 13, fontWeight: 600,
            }}>{saving ? 'Saving…' : 'Save Changes'}</button>
          </div>
        </form>

        <div className="card">
          <div className="ch"><span className="ch-t">SETTINGS ({settings.length})</span></div>
          {settings.length === 0 && (
            <div className="ri na"><div className="ri-b"><div className="ri-s">No custom settings configured yet.</div></div></div>
          )}
          {settings.map(s => (
            <div key={s.id} className="ri na">
              <div className="ri-b">
                <div className="ri-t">{s.key}</div>
                <div className="ri-s">{s.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
