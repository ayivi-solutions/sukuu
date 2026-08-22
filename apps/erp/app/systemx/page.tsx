'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authedFetch } from '../../lib/api';
import AppShell from '../../components/AppShell';

const TABS = [
  { key: 'users', label: 'Users' },
  { key: 'roles', label: 'Roles & Permissions' },
  { key: 'flags', label: 'Feature Flags' },
  { key: 'audit', label: 'Audit Log' },
  { key: 'sessions', label: 'Sessions' },
  { key: 'security', label: 'Security' },
  { key: 'ops', label: 'Platform Ops' },
];


export default function SystemXPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [user, setUser] = useState<any>(null);
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [flags, setFlags] = useState<any[]>([]);
  const [audit, setAudit] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [authLog, setAuthLog] = useState<any[]>([]);
  const [pwdPolicy, setPwdPolicy] = useState<any>({ min_length: 8, require_uppercase: true, require_lowercase: true, require_numbers: true, require_symbols: false, password_expiry_days: 90 });
  const [secPolicies, setSecPolicies] = useState<any[]>([]);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [ops, setOps] = useState<any>({ config: [], departments: [], integrations: [], backups: [], jobs: [], health: [], rateLimits: [], retention: [], errors: [], services: [] });
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', roleId: '' });
  const [createMsg, setCreateMsg] = useState('');
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', email: '', phone: '' });
  const [editingRole, setEditingRole] = useState<any>(null);
  const [roleForm, setRoleForm] = useState({ label: '', description: '' });
  const [managingRole, setManagingRole] = useState<any>(null);
  const [rolePerms, setRolePerms] = useState<string[]>([]);
  const [secPolicyForm, setSecPolicyForm] = useState({ policyName: '', policyValue: '' });
  const [apiKeyForm, setApiKeyForm] = useState({ label: '', scopes: '' });
  const [apiKeyResult, setApiKeyResult] = useState('');
  const [webhookForm, setWebhookForm] = useState({ url: '', events: '' });
  const [showCreateRole, setShowCreateRole] = useState(false);
  const [createRoleForm, setCreateRoleForm] = useState({ name: '', label: '', description: '' });
  const [flagForm, setFlagForm] = useState({ flagKey: '', description: '' });
  const [configForm, setConfigForm] = useState({ key: '', value: '' });
  const [deptForm, setDeptForm] = useState({ name: '', description: '' });
  const [integrationForm, setIntegrationForm] = useState({ name: '', type: '', config: '' });
  const [rateLimitForm, setRateLimitForm] = useState({ endpoint: '', maxRequests: 100, windowSeconds: 60 });
  const [retentionForm, setRetentionForm] = useState({ policyName: '', retentionYears: 7, description: '' });

  const [summary, setSummary] = useState<any>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState('');

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
    authedFetch('/api/v1/system/permissions', t).then(d => Array.isArray(d) && setPermissions(d));
    authedFetch('/api/v1/system/flags', t).then(d => Array.isArray(d) && setFlags(d));
    authedFetch('/api/v1/system/audit-log', t).then(d => Array.isArray(d) && setAudit(d));
    authedFetch('/api/v1/system/sessions', t).then(d => Array.isArray(d) && setSessions(d));
    authedFetch('/api/v1/system/auth-log', t).then(d => Array.isArray(d) && setAuthLog(d));
    authedFetch('/api/v1/system/password-policy', t).then(d => d && !d.error && setPwdPolicy(d));
    authedFetch('/api/v1/system/security-policies', t).then(d => Array.isArray(d) && setSecPolicies(d));
    authedFetch('/api/v1/system/api-keys', t).then(d => Array.isArray(d) && setApiKeys(d));
    authedFetch('/api/v1/system/webhooks', t).then(d => Array.isArray(d) && setWebhooks(d));
    loadOps(t);
    setSummaryLoading(true);
    authedFetch('/api/v1/system/summary', t)
      .then(d => { if (d && !d.error) { setSummary(d); setSummaryError(''); } else { setSummaryError(d?.error || 'Failed to load summary'); } })
      .catch(() => setSummaryError('Failed to load summary'))
      .finally(() => setSummaryLoading(false));
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

  async function handleSuspend(id: string) { await authedFetch(`/api/v1/system/users/${id}/suspend`, token, { method: 'PATCH' }); loadAll(token); }
  async function handleReinstate(id: string) { await authedFetch(`/api/v1/system/users/${id}/reinstate`, token, { method: 'PATCH' }); loadAll(token); }
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
    await authedFetch(`/api/v1/system/users/${editingUser.id}`, token, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editForm) });
    setEditingUser(null);
    loadAll(token);
  }
  function openRoleEdit(r: any) { setEditingRole(r); setRoleForm({ label: r.label, description: r.description || '' }); }
  async function handleSaveRole(e: React.FormEvent) {
    e.preventDefault();
    const res = await authedFetch(`/api/v1/system/roles/${editingRole.id}`, token, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(roleForm) });
    if (!res.error) setEditingRole(null);
    loadAll(token);
  }
  async function handleCreateRole(e: React.FormEvent) {
    e.preventDefault();
    await authedFetch('/api/v1/system/roles', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(createRoleForm) });
    setShowCreateRole(false);
    setCreateRoleForm({ name: '', label: '', description: '' });
    loadAll(token);
  }
  async function openManagePerms(r: any) {
    setManagingRole(r);
    const current = await authedFetch(`/api/v1/system/roles/${r.id}/permissions`, token);
    setRolePerms(Array.isArray(current) ? current.map((p: any) => p.id) : []);
  }
  async function togglePermission(permId: string, isGranted: boolean) {
    if (isGranted) {
      await authedFetch(`/api/v1/system/roles/${managingRole.id}/permissions/${permId}`, token, { method: 'DELETE' });
      setRolePerms(rolePerms.filter(id => id !== permId));
    } else {
      await authedFetch(`/api/v1/system/roles/${managingRole.id}/permissions`, token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ permissionId: permId }) });
      setRolePerms([...rolePerms, permId]);
    }
    loadAll(token);
  }
  async function handleToggleFlag(flagId: string, current: boolean) {
    await authedFetch(`/api/v1/system/flags/${flagId}`, token, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isEnabled: !current }) });
    loadAll(token);
  }
  async function handleCreateFlag(e: React.FormEvent) {
    e.preventDefault();
    await authedFetch('/api/v1/system/flags', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(flagForm) });
    setFlagForm({ flagKey: '', description: '' });
    loadAll(token);
  }
  async function handleRevokeSession(id: string) { await authedFetch(`/api/v1/system/sessions/${id}/revoke`, token, { method: 'PATCH' }); loadAll(token); }
  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    const res = await authedFetch('/api/v1/system/users', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (res.error) { setCreateMsg(res.error); return; }
    setCreateMsg(`Created. Temp password: ${res.tempPassword}`);
    loadAll(token);
  }
  async function handleSavePwdPolicy(e: React.FormEvent) {
    e.preventDefault();
    const r = await authedFetch('/api/v1/system/password-policy', token, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pwdPolicy) });
    setPwdPolicy(r);
    loadAll(token);
  }
  async function handleAddSecPolicy(e: React.FormEvent) {
    e.preventDefault();
    await authedFetch('/api/v1/system/security-policies', token, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(secPolicyForm) });
    setSecPolicyForm({ policyName: '', policyValue: '' });
    loadAll(token);
  }
  async function handleCreateApiKey(e: React.FormEvent) {
    e.preventDefault();
    const r = await authedFetch('/api/v1/system/api-keys', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(apiKeyForm) });
    setApiKeyResult(r.rawKey ? `Save this now — won't be shown again: ${r.rawKey}` : '');
    setApiKeyForm({ label: '', scopes: '' });
    loadAll(token);
  }
  async function handleRevokeApiKey(id: string) { await authedFetch(`/api/v1/system/api-keys/${id}/revoke`, token, { method: 'PATCH' }); loadAll(token); }
  async function handleCreateWebhook(e: React.FormEvent) {
    e.preventDefault();
    await authedFetch('/api/v1/system/webhooks', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(webhookForm) });
    setWebhookForm({ url: '', events: '' });
    loadAll(token);
  }
  async function handleToggleWebhook(id: string, current: boolean) {
    await authedFetch(`/api/v1/system/webhooks/${id}`, token, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !current }) });
    loadAll(token);
  }
  async function handleRunHealthCheck() { await authedFetch('/api/v1/ops/health-check', token, { method: 'POST' }); loadOps(token); }
  async function handleSaveConfig(e: React.FormEvent) {
    e.preventDefault();
    await authedFetch('/api/v1/ops/config', token, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(configForm) });
    setConfigForm({ key: '', value: '' });
    loadOps(token);
  }
  async function handleAddDept(e: React.FormEvent) {
    e.preventDefault();
    await authedFetch('/api/v1/ops/departments', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(deptForm) });
    setDeptForm({ name: '', description: '' });
    loadOps(token);
  }
  async function handleAddIntegration(e: React.FormEvent) {
    e.preventDefault();
    await authedFetch('/api/v1/ops/integrations', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(integrationForm) });
    setIntegrationForm({ name: '', type: '', config: '' });
    loadOps(token);
  }
  async function handleToggleIntegration(id: string, current: boolean) {
    await authedFetch(`/api/v1/ops/integrations/${id}`, token, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !current }) });
    loadOps(token);
  }
  async function handleAddRateLimit(e: React.FormEvent) {
    e.preventDefault();
    await authedFetch('/api/v1/ops/rate-limits', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(rateLimitForm) });
    setRateLimitForm({ endpoint: '', maxRequests: 100, windowSeconds: 60 });
    loadOps(token);
  }
  async function handleAddRetention(e: React.FormEvent) {
    e.preventDefault();
    await authedFetch('/api/v1/ops/retention', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(retentionForm) });
    setRetentionForm({ policyName: '', retentionYears: 7, description: '' });
    loadOps(token);
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
          <button onClick={() => setShowCreate(true)} style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>+ Create User</button>
        </div>
      </div>

      {summaryError && (
        <div style={{ padding: '0 var(--pad)', marginBottom: 'var(--gap)' }}>
          <div className="alert al-er"><span className="al-ic">⚠️</span><div>Couldn't load the system overview: {summaryError}. Figures below may be out of date.</div></div>
        </div>
      )}

      {summaryLoading ? (
        <div className="fx-overview">
          <div className="stat-grid">
            {[1, 2, 3, 4].map(i => <div key={i} className="skel skel-card" />)}
          </div>
        </div>
      ) : summary && (
        <div className="fx-overview">
          <div className="stat-grid">
            <button className="fx-card-btn" onClick={() => setTab('users')}>
              <div className="sc" title="Count of system users tied to this school's current staff employments · live">
                <div className="sc-top">
                  <div className="sc-icon" style={{ background: 'var(--inB)' }}>👥</div>
                  <span className="bdg bin">{summary.users.mfaEnabled} MFA</span>
                </div>
                <div className="sc-val">{summary.users.active}<span style={{ fontSize: 14, color: 'var(--muted)', fontWeight: 500 }}> / {summary.users.total}</span></div>
                <div className="sc-lbl">ACTIVE USERS</div>
              </div>
            </button>

            <button className="fx-card-btn" onClick={() => setTab('flags')}>
              <div className="sc" title="Feature flags scoped to this school or global, count currently enabled · live">
                <div className="sc-top"><div className="sc-icon" style={{ background: 'var(--okB)' }}>🚩</div></div>
                <div className="sc-val">{summary.featureFlags.enabled}<span style={{ fontSize: 14, color: 'var(--muted)', fontWeight: 500 }}> / {summary.featureFlags.total}</span></div>
                <div className="sc-lbl">FLAGS ENABLED</div>
              </div>
            </button>

            <button className="fx-card-btn" onClick={() => setTab('audit')}>
              <div className="sc" title="System audit events with created_at in the last 24 hours, this school only · live">
                <div className="sc-top"><div className="sc-icon" style={{ background: 'var(--puB)' }}>📜</div></div>
                <div className="sc-val">{summary.auditEventsLast24h}</div>
                <div className="sc-lbl">AUDIT EVENTS (24H)</div>
              </div>
            </button>

            <button className="fx-card-btn" onClick={() => setTab('security')}>
              <div className="sc" title="Active sessions across this school's users; active API keys and webhooks; whether a password policy is configured — Security-team owned">
                <div className="sc-top">
                  <div className="sc-icon" style={{ background: summary.security.passwordPolicyConfigured ? 'var(--okB)' : 'var(--erB)' }}>🔐</div>
                  {!summary.security.passwordPolicyConfigured && <span className="bdg ber">no policy set</span>}
                </div>
                <div className="sc-val">{summary.activeSessions}</div>
                <div className="sc-lbl">ACTIVE SESSIONS</div>
                <div className="sc-foot">{summary.security.activeApiKeys} API keys · {summary.security.activeWebhooks} webhooks</div>
              </div>
            </button>
          </div>
        </div>
      )}

      <div className="sys-tabs">
        {TABS.map(t => (
          <button key={t.key} className={`sys-tab-btn${tab === t.key ? ' act' : ''}`} onClick={() => setTab(t.key)}>{t.label}</button>
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
        <div style={{ padding: 'var(--pad)' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button onClick={() => setShowCreateRole(true)} style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>+ Create Role</button>
          </div>
          <div className="tbl">
            <table className="data-table">
              <thead><tr><th>Role</th><th>Key</th><th>Users</th><th>Type</th><th></th></tr></thead>
              <tbody>
                {roles.map(r => (
                  <tr key={r.id}>
                    <td><strong>{r.label}</strong></td>
                    <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{r.name}</td>
                    <td><span className="bdg bin">{users.filter(u => u.role === r.name).length}</span></td>
                    <td><span className={`bdg ${r.is_system ? 'ber' : 'bok'}`}>{r.is_system ? 'System' : 'Custom'}</span></td>
                    <td onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: 6 }}>
                      {!r.is_system && <button onClick={() => openRoleEdit(r)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--soft)', color: 'var(--ink)', fontWeight: 600 }}>Edit</button>}
                      <button onClick={() => openManagePerms(r)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--inB)', color: 'var(--in)', fontWeight: 600 }}>Permissions</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'flags' && (
        <div style={{ padding: 'var(--pad)' }}>
          <div className="alert al-wn" style={{ marginBottom: 16 }}><span className="al-ic">⚠️</span><div>Feature flags control module availability. Changes take effect immediately and are logged in the audit trail.</div></div>
          <div className="card" style={{ marginBottom: 16 }}>
            {flags.map(f => (
              <div key={f.id} className="ri na" style={{ gap: 14 }}>
                <div style={{ flex: 1 }}><div className="ri-t" style={{ fontFamily: 'monospace', fontSize: 11 }}>{f.flag_key}</div><div className="ri-s">{f.description}</div></div>
                <div className={`tog ${f.is_enabled ? 'on' : 'off'}`} onClick={() => handleToggleFlag(f.id, f.is_enabled)} />
              </div>
            ))}
            {flags.length === 0 && <div className="ri na"><div className="ri-s">No feature flags configured.</div></div>}
          </div>
          <form className="card" onSubmit={handleCreateFlag}>
            <div className="ch"><span className="ch-t">CREATE FEATURE FLAG</span></div>
            <div className="cb" style={{ display: 'flex', gap: 8 }}>
              <input className="fi" placeholder="flag_key e.g. enable_library_module" value={flagForm.flagKey} onChange={e => setFlagForm({ ...flagForm, flagKey: e.target.value })} required />
              <input className="fi" placeholder="description" value={flagForm.description} onChange={e => setFlagForm({ ...flagForm, description: e.target.value })} />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>Create</button>
            </div>
          </form>
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
        <div style={{ padding: 'var(--pad)' }}>
          <form className="card" onSubmit={handleSavePwdPolicy} style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">PASSWORD POLICY</span></div>
            <div className="cb" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 12 }}>
              <div className="fg"><label className="fl">MIN LENGTH</label><input className="fi" type="number" value={pwdPolicy.min_length} onChange={e => setPwdPolicy({ ...pwdPolicy, min_length: +e.target.value })} /></div>
              <div className="fg"><label className="fl">EXPIRY (DAYS)</label><input className="fi" type="number" value={pwdPolicy.password_expiry_days} onChange={e => setPwdPolicy({ ...pwdPolicy, password_expiry_days: +e.target.value })} /></div>
              {['require_uppercase', 'require_lowercase', 'require_numbers', 'require_symbols'].map(key => (
                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                  <input type="checkbox" checked={!!pwdPolicy[key]} onChange={e => setPwdPolicy({ ...pwdPolicy, [key]: e.target.checked })} />
                  {key.replace('require_', 'Require ')}
                </label>
              ))}
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Save Policy</button>
            </div>
          </form>

          <div className="card" style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">SECURITY POLICIES</span></div>
            {secPolicies.map(p => (
              <div key={p.id} className="ri na"><div className="ri-b"><div className="ri-t">{p.policy_name}</div><div className="ri-s">{p.policy_value}</div></div></div>
            ))}
            <form onSubmit={handleAddSecPolicy} style={{ display: 'flex', gap: 8, padding: 12 }}>
              <input className="fi" placeholder="policy name e.g. max_login_attempts" value={secPolicyForm.policyName} onChange={e => setSecPolicyForm({ ...secPolicyForm, policyName: e.target.value })} required />
              <input className="fi" placeholder="value" value={secPolicyForm.policyValue} onChange={e => setSecPolicyForm({ ...secPolicyForm, policyValue: e.target.value })} required />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>Add</button>
            </form>
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">API KEYS</span></div>
            {apiKeyResult && <div className="alert al-wn" style={{ margin: 12 }}>{apiKeyResult}</div>}
            {apiKeys.map(k => (
              <div key={k.id} className="ri na"><div className="ri-b"><div className="ri-t">{k.label}</div><div className="ri-s">{k.scopes}</div></div>
                <span className={`bdg ${k.is_active ? 'bok' : 'ber'}`}>{k.is_active ? 'Active' : 'Revoked'}</span>
                {k.is_active && <button onClick={() => handleRevokeApiKey(k.id)} style={{ marginLeft: 8, fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--erB)', color: 'var(--er)', fontWeight: 600 }}>Revoke</button>}
              </div>
            ))}
            <form onSubmit={handleCreateApiKey} style={{ display: 'flex', gap: 8, padding: 12 }}>
              <input className="fi" placeholder="label" value={apiKeyForm.label} onChange={e => setApiKeyForm({ ...apiKeyForm, label: e.target.value })} required />
              <input className="fi" placeholder="scopes e.g. read,write" value={apiKeyForm.scopes} onChange={e => setApiKeyForm({ ...apiKeyForm, scopes: e.target.value })} required />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>Create</button>
            </form>
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">WEBHOOKS</span></div>
            {webhooks.map(w => (
              <div key={w.id} className="ri na"><div className="ri-b"><div className="ri-t">{w.url}</div><div className="ri-s">{w.events}</div></div>
                <div className={`tog ${w.is_active ? 'on' : 'off'}`} onClick={() => handleToggleWebhook(w.id, w.is_active)} />
              </div>
            ))}
            <form onSubmit={handleCreateWebhook} style={{ display: 'flex', gap: 8, padding: 12 }}>
              <input className="fi" placeholder="https://your-endpoint.com/hook" value={webhookForm.url} onChange={e => setWebhookForm({ ...webhookForm, url: e.target.value })} required />
              <input className="fi" placeholder="events e.g. user.created" value={webhookForm.events} onChange={e => setWebhookForm({ ...webhookForm, events: e.target.value })} required />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>Add</button>
            </form>
          </div>

          <div className="tbl">
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
              <div key={h.id} className="ri na"><div className="ri-b"><div className="ri-t">{h.metric_name}: {h.metric_value}</div><div className="ri-s">{new Date(h.checked_at).toLocaleString()}</div></div><span className={`bdg ${h.status === 'ok' ? 'bok' : 'ber'}`}>{h.status}</span></div>
            ))}
            {ops.health.length === 0 && <div className="ri na"><div className="ri-s">No health checks recorded yet.</div></div>}
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">GLOBAL CONFIGURATION</span></div>
            {ops.config.map((c: any) => (<div key={c.id} className="ri na"><div className="ri-b"><div className="ri-t">{c.config_key}</div><div className="ri-s">{c.config_value}</div></div></div>))}
            {ops.config.length === 0 && <div className="ri na"><div className="ri-s">No configuration set yet.</div></div>}
            <form onSubmit={handleSaveConfig} style={{ display: 'flex', gap: 8, padding: 12 }}>
              <input className="fi" placeholder="key e.g. timezone" value={configForm.key} onChange={e => setConfigForm({ ...configForm, key: e.target.value })} required />
              <input className="fi" placeholder="value" value={configForm.value} onChange={e => setConfigForm({ ...configForm, value: e.target.value })} required />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>Save</button>
            </form>
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">SERVICES</span></div>
            {ops.services.map((s: any) => (<div key={s.id} className="ri na"><div className="ri-b"><div className="ri-t">{s.service_name}</div><div className="ri-s">{s.service_description}</div></div></div>))}
            {ops.services.length === 0 && <div className="ri na"><div className="ri-s">No services registered yet.</div></div>}
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">DEPARTMENTS</span></div>
            {ops.departments.map((d: any) => (<div key={d.id} className="ri na"><div className="ri-b"><div className="ri-t">{d.name}</div><div className="ri-s">{d.description}</div></div></div>))}
            {ops.departments.length === 0 && <div className="ri na"><div className="ri-s">No platform departments configured yet.</div></div>}
            <form onSubmit={handleAddDept} style={{ display: 'flex', gap: 8, padding: 12 }}>
              <input className="fi" placeholder="name e.g. Academics" value={deptForm.name} onChange={e => setDeptForm({ ...deptForm, name: e.target.value })} required />
              <input className="fi" placeholder="description" value={deptForm.description} onChange={e => setDeptForm({ ...deptForm, description: e.target.value })} />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>Add</button>
            </form>
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">INTEGRATIONS</span></div>
            {ops.integrations.map((i: any) => (
              <div key={i.id} className="ri na"><div className="ri-b"><div className="ri-t">{i.name}</div><div className="ri-s">{i.type}</div></div>
                <div className={`tog ${i.is_active ? 'on' : 'off'}`} onClick={() => handleToggleIntegration(i.id, i.is_active)} />
              </div>
            ))}
            {ops.integrations.length === 0 && <div className="ri na"><div className="ri-s">No integrations configured yet.</div></div>}
            <form onSubmit={handleAddIntegration} style={{ display: 'flex', gap: 8, padding: 12 }}>
              <input className="fi" placeholder="name" value={integrationForm.name} onChange={e => setIntegrationForm({ ...integrationForm, name: e.target.value })} required />
              <input className="fi" placeholder="type e.g. SMS Gateway" value={integrationForm.type} onChange={e => setIntegrationForm({ ...integrationForm, type: e.target.value })} required />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>Add</button>
            </form>
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">ERROR LOG</span></div>
            {ops.errors.slice(0, 10).map((e: any) => (<div key={e.id} className="ri na"><div className="ri-b"><div className="ri-t">{e.error_type}</div><div className="ri-s">{e.message}</div></div></div>))}
            {ops.errors.length === 0 && <div className="ri na"><div className="ri-s">No errors logged yet.</div></div>}
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">BACKUPS</span></div>
            {ops.backups.map((b: any) => (<div key={b.id} className="ri na"><div className="ri-b"><div className="ri-t">{b.backup_type}</div><div className="ri-s">{b.status}</div></div></div>))}
            {ops.backups.length === 0 && <div className="ri na"><div className="ri-s">No backups recorded yet.</div></div>}
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">BACKGROUND JOBS</span></div>
            {ops.jobs.map((j: any) => (<div key={j.id} className="ri na"><div className="ri-b"><div className="ri-t">{j.job_type}</div><div className="ri-s">{j.status}</div></div></div>))}
            {ops.jobs.length === 0 && <div className="ri na"><div className="ri-s">No background jobs queued yet.</div></div>}
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">DATA RETENTION POLICIES</span></div>
            {ops.retention.map((r: any) => (<div key={r.id} className="ri na"><div className="ri-b"><div className="ri-t">{r.policy_name}</div><div className="ri-s">{r.retention_years} years — {r.description}</div></div></div>))}
            {ops.retention.length === 0 && <div className="ri na"><div className="ri-s">No retention policies configured yet.</div></div>}
            <form onSubmit={handleAddRetention} style={{ display: 'flex', gap: 8, padding: 12 }}>
              <input className="fi" placeholder="policy name" value={retentionForm.policyName} onChange={e => setRetentionForm({ ...retentionForm, policyName: e.target.value })} required />
              <input className="fi" type="number" placeholder="years" value={retentionForm.retentionYears} onChange={e => setRetentionForm({ ...retentionForm, retentionYears: +e.target.value })} required />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>Add</button>
            </form>
          </div>

          <div className="card">
            <div className="ch"><span className="ch-t">RATE LIMITS</span></div>
            {ops.rateLimits.map((r: any) => (<div key={r.id} className="ri na"><div className="ri-b"><div className="ri-t">{r.endpoint}</div><div className="ri-s">{r.max_requests} requests / {r.time_window_seconds}s</div></div></div>))}
            {ops.rateLimits.length === 0 && <div className="ri na"><div className="ri-s">No rate limits configured yet.</div></div>}
            <form onSubmit={handleAddRateLimit} style={{ display: 'flex', gap: 8, padding: 12 }}>
              <input className="fi" placeholder="endpoint e.g. /api/v1/auth/login" value={rateLimitForm.endpoint} onChange={e => setRateLimitForm({ ...rateLimitForm, endpoint: e.target.value })} required />
              <input className="fi" type="number" placeholder="max requests" value={rateLimitForm.maxRequests} onChange={e => setRateLimitForm({ ...rateLimitForm, maxRequests: +e.target.value })} required />
              <input className="fi" type="number" placeholder="window (s)" value={rateLimitForm.windowSeconds} onChange={e => setRateLimitForm({ ...rateLimitForm, windowSeconds: +e.target.value })} required />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>Add</button>
            </form>
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

      {showCreateRole && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(4,13,52,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setShowCreateRole(false)}>
          <form onSubmit={handleCreateRole} onClick={e => e.stopPropagation()} style={{ background: 'var(--white)', padding: 24, borderRadius: 'var(--r)', width: 360, boxShadow: 'var(--shL)' }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, marginBottom: 16 }}>Create Role</h3>
            <div className="fg"><label className="fl">NAME (key)</label><input className="fi" placeholder="e.g. librarian" value={createRoleForm.name} onChange={e => setCreateRoleForm({ ...createRoleForm, name: e.target.value })} required /></div>
            <div className="fg"><label className="fl">LABEL (display)</label><input className="fi" placeholder="e.g. Librarian" value={createRoleForm.label} onChange={e => setCreateRoleForm({ ...createRoleForm, label: e.target.value })} required /></div>
            <div className="fg"><label className="fl">DESCRIPTION</label><input className="fi" value={createRoleForm.description} onChange={e => setCreateRoleForm({ ...createRoleForm, description: e.target.value })} /></div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button type="submit" style={{ flex: 1, background: 'var(--navy)', color: 'var(--gold)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Create</button>
              <button type="button" onClick={() => setShowCreateRole(false)} style={{ flex: 1, background: 'var(--soft)', color: 'var(--ink)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {managingRole && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(4,13,52,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setManagingRole(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--white)', padding: 24, borderRadius: 'var(--r)', width: 400, maxHeight: '80vh', overflowY: 'auto', boxShadow: 'var(--shL)' }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, marginBottom: 16 }}>Permissions: {managingRole.label}</h3>
            {permissions.map(p => (
              <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--bd)', fontSize: 12 }}>
                <input type="checkbox" checked={rolePerms.includes(p.id)} onChange={() => togglePermission(p.id, rolePerms.includes(p.id))} />
                <div><strong>{p.action}</strong> <span style={{ color: 'var(--muted)' }}>· {p.module}</span></div>
              </label>
            ))}
            {permissions.length === 0 && <div style={{ color: 'var(--muted)', fontSize: 12 }}>No permissions defined in the system yet.</div>}
            <button onClick={() => setManagingRole(null)} style={{ marginTop: 16, width: '100%', background: 'var(--navy)', color: 'var(--gold)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Done</button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
