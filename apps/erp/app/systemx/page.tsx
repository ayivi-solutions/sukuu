'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '../../components/AppShell';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001';
const TABS = [
  { key: 'users', label: 'Users' },
  { key: 'roles', label: 'Roles & Permissions' },
  { key: 'flags', label: 'Feature Flags' },
  { key: 'audit', label: 'Audit Log' },
  { key: 'sessions', label: 'Sessions' },
  { key: 'security', label: 'Security' },
];

function authedFetch(path: string, token: string, opts: RequestInit = {}) {
  return fetch(`${API_URL}${path}`, {
    ...opts,
    headers: { ...(opts.headers || {}), Authorization: `Bearer ${token}` },
  }).then(res => res.json());
}

export default function SystemXPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [user, setUser] = useState<any>(null);
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [flags, setFlags] = useState<any[]>([]);
  const [audit, setAudit] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [authLog, setAuthLog] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', roleId: '' });
  const [createMsg, setCreateMsg] = useState('');

  useEffect(() => {
    const t = localStorage.getItem('sukuu_token');
    const userStr = localStorage.getItem('sukuu_user');
    if (!t) { router.push('/login'); return; }
    setToken(t);
    setUser(userStr ? JSON.parse(userStr) : null);
    loadAll(t);
  }, [router]);

  function loadAll(t: string) {
    authedFetch('/api/v1/system/users', t).then(d => Array.isArray(d) ? setUsers(d) : setError(d.error));
    authedFetch('/api/v1/system/roles', t).then(d => Array.isArray(d) && setRoles(d));
    authedFetch('/api/v1/system/flags', t).then(d => Array.isArray(d) && setFlags(d));
    authedFetch('/api/v1/system/audit-log', t).then(d => Array.isArray(d) && setAudit(d));
    authedFetch('/api/v1/system/sessions', t).then(d => Array.isArray(d) && setSessions(d));
    authedFetch('/api/v1/system/auth-log', t).then(d => Array.isArray(d) && setAuthLog(d));
  }

  async function handleSuspend(id: string) {
    await authedFetch(`/api/v1/system/users/${id}/suspend`, token, { method: 'PATCH' });
    loadAll(token);
  }
  async function handleReinstate(id: string) {
    await authedFetch(`/api/v1/system/users/${id}/reinstate`, token, { method: 'PATCH' });
    loadAll(token);
  }
  async function handleToggleFlag(flagId: string, current: boolean) {
    await authedFetch(`/api/v1/system/flags/${flagId}`, token, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isEnabled: !current }),
    });
    loadAll(token);
  }
  async function handleRevokeSession(id: string) {
    await authedFetch(`/api/v1/system/sessions/${id}/revoke`, token, { method: 'PATCH' });
    loadAll(token);
  }
  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    const res = await authedFetch('/api/v1/system/users', token, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.error) { setCreateMsg(res.error); return; }
    setCreateMsg(`Created. Temp password: ${res.tempPassword}`);
    loadAll(token);
  }

  if (error) return <AppShell user={user}><div style={{ padding: 40, color: 'var(--er)' }}>{error}</div></AppShell>;

  return (
    <AppShell user={user}>
      <div className="ph">
        <div className="ph-row">
          <div>
            <div className="ph-ey">SUKUU ERP · SYSTEMX · 37 TABLES · sukuux SCHEMA</div>
            <div className="ph-title">⚙️ SystemX</div>
            <div className="ph-sub">Authentication · RBAC · Sessions · Audit · Feature Flags · Security</div>
          </div>
          <button onClick={() => setShowCreate(true)} style={{
            background: 'var(--navy)', color: 'var(--gold)', padding: '9px 16px',
            borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600,
          }}>+ Create User</button>
        </div>
      </div>

      <div style={{ background: 'var(--inB)', padding: '10px var(--pad)', borderBottom: '1px solid rgba(11,61,97,.15)' }}>
        <p style={{ fontSize: 12, color: 'var(--in)', lineHeight: 1.55, padding: '0 var(--pad)' }}>
          Platform foundation managing all user accounts, role assignments, JWT sessions, audit log, feature flags, and security policy. Every action in Sukuu ERP is traceable here.
        </p>
      </div>

      <div className="sys-tabs">
        {TABS.map(t => (
          <button key={t.key} className={`sys-tab-btn${tab === t.key ? ' act' : ''}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'users' && (
        <div className="tbl" style={{ padding: 'var(--pad)' }}>
          <table className="data-table">
            <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>MFA</th><th>Last Login</th><th></th></tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{u.id.slice(0, 8)}</td>
                  <td><strong>{u.name}</strong></td>
                  <td style={{ fontSize: 11 }}>{u.email}</td>
                  <td><span className="bdg bin">{u.roleLabel}</span></td>
                  <td><span className={`bdg ${u.status === 'ACTIVE' ? 'bok' : 'ber'}`}>{u.status}</span></td>
                  <td style={{ textAlign: 'center' }}>{u.mfa ? '✅' : '—'}</td>
                  <td style={{ fontSize: 11, color: 'var(--muted)' }}>{u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'Never'}</td>
                  <td onClick={e => e.stopPropagation()}>
                    {u.status === 'ACTIVE'
                      ? <button onClick={() => handleSuspend(u.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--erB)', color: 'var(--er)', fontWeight: 600 }}>Suspend</button>
                      : <button onClick={() => handleReinstate(u.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--okB)', color: 'var(--ok)', fontWeight: 600 }}>Reinstate</button>}
                  </td>
                </tr>
              ))}
              {users.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>No users found</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'roles' && (
        <div className="tbl" style={{ padding: 'var(--pad)' }}>
          <table className="data-table">
            <thead><tr><th>Role</th><th>Key</th><th>Users</th><th>Type</th></tr></thead>
            <tbody>
              {roles.map(r => (
                <tr key={r.id}>
                  <td><strong>{r.label}</strong></td>
                  <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{r.name}</td>
                  <td><span className="bdg bin">{users.filter(u => u.role === r.name).length}</span></td>
                  <td><span className={`bdg ${r.is_system ? 'ber' : 'bok'}`}>{r.is_system ? 'System' : 'Custom'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'flags' && (
        <div style={{ padding: 'var(--pad)' }}>
          <div className="alert al-wn" style={{ marginBottom: 16 }}>
            <span className="al-ic">⚠️</span>
            <div>Feature flags control module availability. Changes take effect immediately and are logged in the audit trail.</div>
          </div>
          <div className="card">
            {flags.map(f => (
              <div key={f.id} className="ri na" style={{ gap: 14 }}>
                <div style={{ flex: 1 }}>
                  <div className="ri-t" style={{ fontFamily: 'monospace', fontSize: 11 }}>{f.flag_key}</div>
                  <div className="ri-s">{f.description}</div>
                </div>
                <div className={`tog ${f.is_enabled ? 'on' : 'off'}`} onClick={() => handleToggleFlag(f.id, f.is_enabled)} />
              </div>
            ))}
            {flags.length === 0 && <div className="ri na"><div className="ri-s">No feature flags configured.</div></div>}
          </div>
        </div>
      )}

      {tab === 'audit' && (
        <div className="tbl" style={{ padding: 'var(--pad)' }}>
          <table className="data-table">
            <thead><tr><th>ID</th><th>Action</th><th>Entity</th><th>Timestamp</th></tr></thead>
            <tbody>
              {audit.map(a => (
                <tr key={a.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{a.id.slice(0, 8)}</td>
                  <td><span className="bdg bin">{a.action}</span></td>
                  <td style={{ fontSize: 11 }}>{a.entity_type} {a.entity_id ? `· ${a.entity_id}` : ''}</td>
                  <td style={{ fontSize: 11, color: 'var(--muted)' }}>{new Date(a.created_at).toLocaleString()}</td>
                </tr>
              ))}
              {audit.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>No audit events recorded yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'sessions' && (
        <div className="tbl" style={{ padding: 'var(--pad)' }}>
          <table className="data-table">
            <thead><tr><th>User</th><th>Created</th><th>Last Activity</th><th>Expires</th><th></th></tr></thead>
            <tbody>
              {sessions.map(s => {
                const u = users.find(usr => usr.id === s.user_id);
                return (
                  <tr key={s.id}>
                    <td><strong>{u?.name || s.user_id}</strong></td>
                    <td style={{ fontSize: 11 }}>{new Date(s.created_at).toLocaleString()}</td>
                    <td style={{ fontSize: 11 }}>{new Date(s.last_activity_at).toLocaleString()}</td>
                    <td style={{ fontSize: 11, color: 'var(--muted)' }}>{new Date(s.expires_at).toLocaleString()}</td>
                    <td><button onClick={() => handleRevokeSession(s.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--erB)', color: 'var(--er)', fontWeight: 600 }}>Revoke</button></td>
                  </tr>
                );
              })}
              {sessions.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>No active sessions.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'security' && (
        <div className="tbl" style={{ padding: 'var(--pad)' }}>
          <div className="ph-sub" style={{ marginBottom: 12 }}>Authentication attempts (success / failed / locked)</div>
          <table className="data-table">
            <thead><tr><th>User</th><th>Status</th><th>Timestamp</th></tr></thead>
            <tbody>
              {authLog.map(l => {
                const u = users.find(usr => usr.id === l.user_id);
                return (
                  <tr key={l.id}>
                    <td>{u?.name || l.user_id || 'Unknown'}</td>
                    <td><span className={`bdg ${l.login_status === 'SUCCESS' ? 'bok' : l.login_status === 'LOCKED' ? 'bwn' : 'ber'}`}>{l.login_status}</span></td>
                    <td style={{ fontSize: 11, color: 'var(--muted)' }}>{new Date(l.created_at).toLocaleString()}</td>
                  </tr>
                );
              })}
              {authLog.length === 0 && <tr><td colSpan={3} style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>No login attempts recorded yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(4,13,52,.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 100,
        }} onClick={() => setShowCreate(false)}>
          <form onSubmit={handleCreateUser} onClick={e => e.stopPropagation()} style={{
            background: 'var(--white)', padding: 24, borderRadius: 'var(--r)', width: 360, boxShadow: 'var(--shL)',
          }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, marginBottom: 16 }}>Create User</h3>
            {createMsg && <div className="alert al-ok" style={{ marginBottom: 12 }}>{createMsg}</div>}
            <div className="fg"><label className="fl">FIRST NAME</label>
              <input className="fi" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} required />
            </div>
            <div className="fg"><label className="fl">LAST NAME</label>
              <input className="fi" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} required />
            </div>
            <div className="fg"><label className="fl">EMAIL</label>
              <input className="fi" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="fg"><label className="fl">PHONE</label>
              <input className="fi" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="fg"><label className="fl">ROLE</label>
              <select className="fi" value={form.roleId} onChange={e => setForm({ ...form, roleId: e.target.value })} required>
                <option value="">Select a role…</option>
                {roles.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button type="submit" style={{ flex: 1, background: 'var(--navy)', color: 'var(--gold)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Create</button>
              <button type="button" onClick={() => setShowCreate(false)} style={{ flex: 1, background: 'var(--soft)', color: 'var(--ink)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Cancel</button>
            </div>
          </form>
        </div>
      )}
    </AppShell>
  );
}
