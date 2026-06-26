'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '../../components/AppShell';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001';
const TABS = [
  { key: 'profile', label: 'Profile' },
  { key: 'accreditations', label: 'Accreditations' },
  { key: 'audit', label: 'Audit Log' },
  { key: 'settings', label: 'Settings' },
];

function authedFetch(path: string, token: string, opts: RequestInit = {}) {
  return fetch(`${API_URL}${path}`, {
    ...opts,
    headers: { ...(opts.headers || {}), Authorization: `Bearer ${token}` },
  }).then(res => res.json());
}

export default function SchoolXPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [user, setUser] = useState<any>(null);
  const [tab, setTab] = useState('profile');
  const [school, setSchool] = useState<any>(null);
  const [accreditations, setAccreditations] = useState<any[]>([]);
  const [audit, setAudit] = useState<any[]>([]);
  const [settings, setSettings] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showAccredForm, setShowAccredForm] = useState(false);
  const [accredForm, setAccredForm] = useState({ authority: '', accreditationNumber: '', issueDate: '', expiryDate: '' });

  useEffect(() => {
    const t = localStorage.getItem('sukuu_token');
    const userStr = localStorage.getItem('sukuu_user');
    if (!t) { router.push('/login'); return; }
    setToken(t);
    setUser(userStr ? JSON.parse(userStr) : null);
    loadAll(t);
  }, [router]);

  function loadAll(t: string) {
    authedFetch('/api/v1/school/profile', t).then(d => d.error ? setError(d.error) : setSchool(d));
    authedFetch('/api/v1/school/accreditations', t).then(d => Array.isArray(d) && setAccreditations(d));
    authedFetch('/api/v1/school/audit-log', t).then(d => Array.isArray(d) && setAudit(d));
    authedFetch('/api/v1/school/settings', t).then(d => Array.isArray(d) && setSettings(d));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const updated = await authedFetch('/api/v1/school/profile', token, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: school.phone, email: school.email, website: school.website }),
    });
    setSchool(updated);
    setSaving(false);
  }

  async function handleAddAccreditation(e: React.FormEvent) {
    e.preventDefault();
    await authedFetch('/api/v1/school/accreditations', token, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(accredForm),
    });
    setShowAccredForm(false);
    setAccredForm({ authority: '', accreditationNumber: '', issueDate: '', expiryDate: '' });
    loadAll(token);
  }

  async function handleArchiveAccreditation(id: string) {
    if (!confirm('Archive this accreditation record?')) return;
    await authedFetch(`/api/v1/school/accreditations/${id}/archive`, token, { method: 'PATCH' });
    loadAll(token);
  }

  if (error) return <AppShell user={user}><div style={{ padding: 40, color: 'var(--er)' }}>{error}</div></AppShell>;
  if (!school) return <AppShell user={user}><div style={{ padding: 40 }}>Loading…</div></AppShell>;

  return (
    <AppShell user={user} schoolName={school.name}>
      <div className="ph">
        <div className="ph-row">
          <div>
            <div className="ph-ey">SCHOOLX · INSTITUTIONAL TENANT ENGINE</div>
            <div className="ph-title">{school.name}</div>
            <div className="ph-sub">{school.code} · {school.city}, {school.region} · CRUAA enforced</div>
          </div>
        </div>
      </div>

      <div className="sys-tabs">
        {TABS.map(t => (
          <button key={t.key} className={`sys-tab-btn${tab === t.key ? ' act' : ''}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <div className="two-col">
          <form className="card" onSubmit={handleSave}>
            <div className="ch"><span className="ch-t">INSTITUTION PROFILE</span></div>
            <div className="cb">
              <div className="fg"><label className="fl">PHONE</label>
                <input className="fi" value={school.phone || ''} onChange={e => setSchool({ ...school, phone: e.target.value })} />
              </div>
              <div className="fg"><label className="fl">EMAIL</label>
                <input className="fi" value={school.email || ''} onChange={e => setSchool({ ...school, email: e.target.value })} />
              </div>
              <div className="fg"><label className="fl">WEBSITE</label>
                <input className="fi" value={school.website || ''} onChange={e => setSchool({ ...school, website: e.target.value })} />
              </div>
              <button type="submit" disabled={saving} style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '11px 20px', borderRadius: 'var(--rS)', fontSize: 13, fontWeight: 600 }}>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
          <div className="card">
            <div className="ch"><span className="ch-t">REGISTRATION DETAILS</span></div>
            {[['Registration No.', school.registration_number], ['School Type', school.school_type], ['Address', school.address], ['Status', school.is_active ? 'Active' : 'Inactive']].map(([k, v]) => (
              <div key={k} className="ri na"><div className="ri-b"><div className="ri-t">{k as string}</div><div className="ri-s">{v as string}</div></div></div>
            ))}
          </div>
        </div>
      )}

      {tab === 'accreditations' && (
        <div style={{ padding: 'var(--pad)' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button onClick={() => setShowAccredForm(true)} style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>+ Add Accreditation</button>
          </div>
          <div className="tbl">
            <table className="data-table">
              <thead><tr><th>Authority</th><th>Number</th><th>Issued</th><th>Expires</th><th></th></tr></thead>
              <tbody>
                {accreditations.map(a => (
                  <tr key={a.id}>
                    <td><strong>{a.authority}</strong></td>
                    <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{a.accreditation_number}</td>
                    <td style={{ fontSize: 11 }}>{a.issue_date}</td>
                    <td style={{ fontSize: 11 }}>{a.expiry_date}</td>
                    <td><button onClick={() => handleArchiveAccreditation(a.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--erB)', color: 'var(--er)', fontWeight: 600 }}>Archive</button></td>
                  </tr>
                ))}
                {accreditations.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>No accreditation records yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'audit' && (
        <div className="tbl" style={{ padding: 'var(--pad)' }}>
          <table className="data-table">
            <thead><tr><th>Action</th><th>By</th><th>Timestamp</th></tr></thead>
            <tbody>
              {audit.map(a => (
                <tr key={a.id}>
                  <td style={{ fontSize: 12 }}>{a.action}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{a.performed_by}</td>
                  <td style={{ fontSize: 11, color: 'var(--muted)' }}>{new Date(a.created_at).toLocaleString()}</td>
                </tr>
              ))}
              {audit.length === 0 && <tr><td colSpan={3} style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>No audit events recorded yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'settings' && (
        <div className="card" style={{ margin: 'var(--pad)' }}>
          <div className="ch"><span className="ch-t">SETTINGS ({settings.length})</span></div>
          {settings.map(s => (
            <div key={s.id} className="ri na"><div className="ri-b"><div className="ri-t">{s.key}</div><div className="ri-s">{s.value}</div></div></div>
          ))}
          {settings.length === 0 && <div className="ri na"><div className="ri-s">No custom settings configured yet.</div></div>}
        </div>
      )}

      {showAccredForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(4,13,52,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setShowAccredForm(false)}>
          <form onSubmit={handleAddAccreditation} onClick={e => e.stopPropagation()} style={{ background: 'var(--white)', padding: 24, borderRadius: 'var(--r)', width: 360, boxShadow: 'var(--shL)' }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, marginBottom: 16 }}>Add Accreditation</h3>
            <div className="fg"><label className="fl">AUTHORITY</label><input className="fi" value={accredForm.authority} onChange={e => setAccredForm({ ...accredForm, authority: e.target.value })} required /></div>
            <div className="fg"><label className="fl">ACCREDITATION NUMBER</label><input className="fi" value={accredForm.accreditationNumber} onChange={e => setAccredForm({ ...accredForm, accreditationNumber: e.target.value })} required /></div>
            <div className="fg"><label className="fl">ISSUE DATE</label><input className="fi" type="date" value={accredForm.issueDate} onChange={e => setAccredForm({ ...accredForm, issueDate: e.target.value })} required /></div>
            <div className="fg"><label className="fl">EXPIRY DATE</label><input className="fi" type="date" value={accredForm.expiryDate} onChange={e => setAccredForm({ ...accredForm, expiryDate: e.target.value })} required /></div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button type="submit" style={{ flex: 1, background: 'var(--navy)', color: 'var(--gold)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Add</button>
              <button type="button" onClick={() => setShowAccredForm(false)} style={{ flex: 1, background: 'var(--soft)', color: 'var(--ink)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Cancel</button>
            </div>
          </form>
        </div>
      )}
    </AppShell>
  );
}
