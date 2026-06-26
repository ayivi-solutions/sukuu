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
  { key: 'ops', label: 'Platform Ops' },
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
  const [ops, setOps] = useState<any>({ config: [], departments: [], integrations: [], backups: [], jobs: [], health: [], rateLimits: [], retention: [], errors: [], services: [] });
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', roleId: '' });
  const [createMsg, setCreateMsg] = useState('');
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', email: '', phone: '' });
  const [editingRole, setEditingRole] = useState<any>(null);
  const [roleForm, setRoleForm] = useState({ label: '', description: '' });

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
    loadOps(t);
  }

  function loadOps(t: string) {
    Promise.all([
      authedFetch('/api/v1/ops/config', t),
      authedFetch('/api/v1/ops/departments', t),
      authedFetch('/api/v1/ops/integrations', t),
      authedFetch('/api/v1/ops/backups', t),
      authedFetch('/api/v1/ops/jobs', t),
      authedFetch('/api/v1/ops/health-checks', t),
      authedFetch('/api/v1/ops/rate-limits', t),
      authedFetch('/api/v1/ops/retention', t),
      authedFetch('/api/v1/ops/errors', t),
      authedFetch('/api/v1/ops/services', t),
    ]).then(([config, departments, integrations, backups, jobs, health, rateLimits, retention, errors, services]) => {
      setOps({ config, departments, integrations, backups, jobs, health, rateLimits, retention, errors, services });
    });
  }

  async function handleSuspend(id: string) {
    await authedFetch(`/api/v1/system/users/${id}/suspend`, token, { method: 'PATCH' });
    loadAll(token);
  }
  async function handleReinstate(id: string) {
    await authedFetch(`/api/v1/system/users/${id}/reinstate`, token, { method: 'PATCH' });
    loadAll(token);
  }
  async function handleArchive(id: string) {
    if (!confirm('Archive this user? They will be deactivated permanently but the record is retained.')) return;
    await authedFetch(`/api/v1/system/users/${id}/archive`, token, { method: 'PATCH' });
    loadAll(token);
  }
  function openEdit(u: any) {
    setEditingUser(u);
    const parts = u.name.split(' ');
    setEditForm({ firstName: parts[0] || '', lastName: parts.slice(1).join(' ') || '', email: u.email, phone: u.phone || '' });
  }
  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    await authedFetch(`/api/v1/system/users/${editingUser.id}`, token, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    });
    setEditingUser(null);
    loadAll(token);
  }
  function openRoleEdit(r: any) {
    setEditingRole(r);
    setRoleForm({ label: r.label, description: r.description || '' });
  }
  async function handleSaveRole(e: React.FormEvent) {
    e.preventDefault();
    const res = await authedFetch(`/api/v1/system/roles/${editingRole.id}`, token, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(roleForm),
    });
    if (!res.error) setEditingRole(null);
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
  async function handleRunHealthCheck() {
    await authedFetch('/api/v1/ops/health-check', token, { method: 'POST' });
    loadOps(token);
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
            <div className="ph-sub">Authentication · RBAC · Sessions · Audit · Feature Flags · Security · CRUAA enforced (no hard deletes)</div>
          </div>
          <button onClick={() => setShowCreate(true)} style={{
            background: 'var(--navy)', color: 'var(--gold)', padding: '9px 16px',
            borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600,
          }}>+ Create User</button>
        </div>
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
                  <td onClick={e => e.stopPropagation()} style={{ whiteSpace: 'nowrap', display: 'flex', gap: 6 }}>
                    <button onClick={() => openEdit(u)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--soft)', color: 'var(--ink)', fontWeight: 600 }}>Edit</button>
                    {u.status === 'ACTIVE'
                      ? <button onClick={() => handleSuspend(u.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--wnB)', color: 'var(--wn)', fontWeight: 600 }}>Suspend</button>
                      : <button onClick={() => handleReinstate(u.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--okB)', color: 'var(--ok)', fontWeight: 600 }}>Reinstate</button>}
                    <button onClick={() => handleArchive(u.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--erB)', color: 'var(--er)', fontWeight: 600 }}>Archive</button>
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
            <thead><tr><th>Role</th><th>Key</th><th>Users</th><th>Type</th><th></th></tr></thead>
            <tbody>
              {roles.map(r => (
                <tr key={r.id}>
                  <td><strong>{r.label}</strong></td>
                  <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{r.name}</td>
                  <td><span className="bdg bin">{users.filter(u => u.role === r.name).length}</span></td>
                  <td><span className={`bdg ${r.is_system ? 'ber' : 'bok'}`}>{r.is_system ? 'System' : 'Custom'}</span></td>
                  <td onClick={e => e.stopPropagation()}>
                    {!r.is_system && <button onClick={() => openRoleEdit(r)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--soft)', color: 'var(--ink)', fontWeight: 600 }}>Edit</button>}
                    {r.is_system && <span style={{ fontSize: 10, color: 'var(--muted)' }}>Locked</span>}
                  </td>
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
      {tab === 'ops' && (
        <div style={{ padding: 'var(--pad)' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button onClick={handleRunHealthCheck} style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Run Health Check</button>
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">HEALTH CHECKS</span></div>
            {ops.health.slice(0, 5).map((h: any) => (
              <div key={h.id} className="ri na">
                <div className="ri-b"><div className="ri-t">{h.metric_name}: {h.metric_value}</div><div className="ri-s">{new Date(h.checked_at).toLocaleString()}</div></div>
                <span className={`bdg ${h.status === 'ok' ? 'bok' : 'ber'}`}>{h.status}</span>
              </div>
            ))}
            {ops.health.length === 0 && <div className="ri na"><div className="ri-s">No health checks recorded yet.</div></div>}
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">SERVICES</span></div>
            {ops.services.map((s: any) => (
              <div key={s.id} className="ri na"><div className="ri-b"><div className="ri-t">{s.service_name}</div><div className="ri-s">{s.service_description}</div></div></div>
            ))}
            {ops.services.length === 0 && <div className="ri na"><div className="ri-s">No services registered yet.</div></div>}
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">DEPARTMENTS</span></div>
            {ops.departments.map((d: any) => (
              <div key={d.id} className="ri na"><div className="ri-b"><div className="ri-t">{d.name}</div><div className="ri-s">{d.description}</div></div></div>
            ))}
            {ops.departments.length === 0 && <div className="ri na"><div className="ri-s">No platform departments configured yet.</div></div>}
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">INTEGRATIONS</span></div>
            {ops.integrations.map((i: any) => (
              <div key={i.id} className="ri na"><div className="ri-b"><div className="ri-t">{i.name}</div><div className="ri-s">{i.type}</div></div><span className={`bdg ${i.is_active ? 'bok' : 'ber'}`}>{i.is_active ? 'Active' : 'Inactive'}</span></div>
            ))}
            {ops.integrations.length === 0 && <div className="ri na"><div className="ri-s">No integrations configured yet.</div></div>}
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">ERROR LOG</span></div>
            {ops.errors.slice(0, 10).map((e: any) => (
              <div key={e.id} className="ri na"><div className="ri-b"><div className="ri-t">{e.error_type}</div><div className="ri-s">{e.message}</div></div></div>
            ))}
            {ops.errors.length === 0 && <div className="ri na"><div className="ri-s">No errors logged yet.</div></div>}
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">BACKUPS</span></div>
            {ops.backups.map((b: any) => (
              <div key={b.id} className="ri na"><div className="ri-b"><div className="ri-t">{b.backup_type}</div><div className="ri-s">{b.status}</div></div></div>
            ))}
            {ops.backups.length === 0 && <div className="ri na"><div className="ri-s">No backups recorded yet.</div></div>}
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">BACKGROUND JOBS</span></div>
            {ops.jobs.map((j: any) => (
              <div key={j.id} className="ri na"><div className="ri-b"><div className="ri-t">{j.job_type}</div><div className="ri-s">{j.status}</div></div></div>
            ))}
            {ops.jobs.length === 0 && <div className="ri na"><div className="ri-s">No background jobs queued yet.</div></div>}
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">DATA RETENTION POLICIES</span></div>
            {ops.retention.map((r: any) => (
              <div key={r.id} className="ri na"><div className="ri-b"><div className="ri-t">{r.policy_name}</div><div className="ri-s">{r.retention_years} years — {r.description}</div></div></div>
            ))}
            {ops.retention.length === 0 && <div className="ri na"><div className="ri-s">No retention policies configured yet.</div></div>}
          </div>

          <div className="card">
            <div className="ch"><span className="ch-t">RATE LIMITS</span></div>
            {ops.rateLimits.map((r: any) => (
              <div key={r.id} className="ri na"><div className="ri-b"><div className="ri-t">{r.endpoint}</div><div className="ri-s">{r.max_requests} requests / {r.time_window_seconds}s</div></div></div>
            ))}
            {ops.rateLimits.length === 0 && <div className="ri na"><div className="ri-s">No rate limits configured yet.</div></div>}
          </div>
        </div>
      )}

      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(4,13,52,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setShowCreate(false)}>
          <form onSubmit={handleCreateUser} onClick={e => e.stopPropagation()} style={{ background: 'var(--white)', padding: 24, borderRadius: 'var(--r)', width: 360, boxShadow: 'var(--shL)' }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, marginBottom: 16 }}>Create User</h3>
            {createMsg && <div className="alert al-ok" style={{ marginBottom: 12 }}>{createMsg}</div>}
            <div className="fg"><label className="fl">FIRST NAME</label><input className="fi" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} required /></div>
            <div className="fg"><label className="fl">LAST NAME</label><input className="fi" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} required /></div>
            <div className="fg"><label className="fl">EMAIL</label><input className="fi" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required /></div>
            <div className="fg"><label className="fl">PHONE</label><input className="fi" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
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

      {editingUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(4,13,52,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setEditingUser(null)}>
          <form onSubmit={handleSaveEdit} onClick={e => e.stopPropagation()} style={{ background: 'var(--white)', padding: 24, borderRadius: 'var(--r)', width: 360, boxShadow: 'var(--shL)' }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, marginBottom: 16 }}>Edit User</h3>
            <div className="fg"><label className="fl">FIRST NAME</label><input className="fi" value={editForm.firstName} onChange={e => setEditForm({ ...editForm, firstName: e.target.value })} /></div>
            <div className="fg"><label className="fl">LAST NAME</label><input className="fi" value={editForm.lastName} onChange={e => setEditForm({ ...editForm, lastName: e.target.value })} /></div>
            <div className="fg"><label className="fl">EMAIL</label><input className="fi" type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} /></div>
            <div className="fg"><label className="fl">PHONE</label><input className="fi" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} /></div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button type="submit" style={{ flex: 1, background: 'var(--navy)', color: 'var(--gold)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Save</button>
              <button type="button" onClick={() => setEditingUser(null)} style={{ flex: 1, background: 'var(--soft)', color: 'var(--ink)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {editingRole && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(4,13,52,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setEditingRole(null)}>
          <form onSubmit={handleSaveRole} onClick={e => e.stopPropagation()} style={{ background: 'var(--white)', padding: 24, borderRadius: 'var(--r)', width: 360, boxShadow: 'var(--shL)' }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, marginBottom: 16 }}>Edit Role</h3>
            <div className="fg"><label className="fl">LABEL</label><input className="fi" value={roleForm.label} onChange={e => setRoleForm({ ...roleForm, label: e.target.value })} required /></div>
            <div className="fg"><label className="fl">DESCRIPTION</label><input className="fi" value={roleForm.description} onChange={e => setRoleForm({ ...roleForm, description: e.target.value })} /></div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button type="submit" style={{ flex: 1, background: 'var(--navy)', color: 'var(--gold)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Save</button>
              <button type="button" onClick={() => setEditingRole(null)} style={{ flex: 1, background: 'var(--soft)', color: 'var(--ink)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Cancel</button>
            </div>
          </form>
        </div>
      )}
    </AppShell>
  );
}
