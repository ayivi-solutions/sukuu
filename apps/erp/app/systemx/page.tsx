'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authedFetch as baseAuthedFetch, verifyFreshStepUp } from '../../lib/api';
import AppShell from '../../components/AppShell';

const TABS = [
  { key: 'users', label: 'Users' },
  { key: 'roles', label: 'Roles & Permissions' },
  { key: 'flags', label: 'Feature Flags' },
  { key: 'audit', label: 'Audit Log' },
  { key: 'sessions', label: 'Sessions' },
  { key: 'security', label: 'Security' },
  { key: 'ops', label: 'Platform Ops' },
  { key: 'bulk', label: 'Bulk Import' },
  { key: 'reports', label: 'Reports' },
  { key: 'events', label: 'Event Log' },
];

const REPORTS = [
  { key: 'user-role-register', label: 'User & Role Register' },
  { key: 'privileged-access-review', label: 'Privileged Access Review' },
  { key: 'active-session-register', label: 'Active Session Register' },
  { key: 'failed-login-trend', label: 'Failed Login Trend' },
  { key: 'feature-flag-history', label: 'Feature Flag History' },
  { key: 'audit-export', label: 'Audit Export' },
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
  const [showAddRoster, setShowAddRoster] = useState(false);
  const [rosterForm, setRosterForm] = useState({ firstName: '', lastName: '', gender: 'MALE', dateOfBirth: '', phone: '', email: '', roleId: '', employmentType: 'PERMANENT' });
  const [rosterMsg, setRosterMsg] = useState('');
  const [showGrantAccess, setShowGrantAccess] = useState(false);
  const [unlinkedStaff, setUnlinkedStaff] = useState<any[]>([]);
  const [grantForm, setGrantForm] = useState({ staffId: '', email: '', roleId: '' });
  const [grantMsg, setGrantMsg] = useState('');
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', email: '', phone: '' });
  const [editingRole, setEditingRole] = useState<any>(null);
  const [roleForm, setRoleForm] = useState({ label: '', description: '' });
  const [managingRole, setManagingRole] = useState<any>(null);

  // Single reusable dialog — replaces every native alert()/confirm()/
  // prompt() in this page with one styled, on-brand modal instead of
  // browser-chrome dialogs that don't match the app and give the user no
  // reliable way to keep something like a temp password once dismissed.
  const [dialog, setDialog] = useState<
    | null
    | { type: 'confirm'; title: string; message: string; danger?: boolean; confirmLabel?: string; onConfirm: () => void }
    | { type: 'reason'; title: string; message: string; onConfirm: (reason: string) => void }
    | { type: 'info'; title: string; message: string; copyable?: string }
  >(null);
  const [dialogReason, setDialogReason] = useState('');
  const [dialogCopied, setDialogCopied] = useState(false);
  const [stepUpRequest, setStepUpRequest] = useState<
    | null
    | {
        retry: () => Promise<any>;
        resolve: (value: any) => void;
      }
  >(null);
  const [stepUpCode, setStepUpCode] = useState('');
  const [stepUpBusy, setStepUpBusy] = useState(false);
  const [stepUpError, setStepUpError] = useState('');
  const [managingUserRoles, setManagingUserRoles] = useState<any>(null);
  const [userRoleAssignments, setUserRoleAssignments] = useState<any[]>([]);
  const [assignRoleForm, setAssignRoleForm] = useState({ roleId: '', expiresAt: '' });
  const [assignRoleBusy, setAssignRoleBusy] = useState(false);
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

  // Bulk import (EFS-SYS-0020)
  const [bulkCsv, setBulkCsv] = useState('');
  const [bulkPreview, setBulkPreview] = useState<any[] | null>(null);
  const [bulkResult, setBulkResult] = useState<any[] | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);

  // Six named governed reports (EFS-SYS-0040)
  const [activeReport, setActiveReport] = useState('user-role-register');
  const [reportData, setReportData] = useState<any>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [auditExportFilters, setAuditExportFilters] = useState({ entityType: '', action: '', fromDate: '', toDate: '' });

  // Event log (EEAS-SYS-0026)
  const [events, setEvents] = useState<any[]>([]);

  const [summary, setSummary] = useState<any>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState('');
  const [accessChecked, setAccessChecked] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  async function systemFetch(
    path: string,
    requestToken: string,
    opts: RequestInit = {}
  ) {
    try {
      return await baseAuthedFetch(
        path,
        requestToken,
        opts
      );
    } catch (err: any) {
      if (
        err?.stepUpRequired !== true
      ) {
        throw err;
      }

      return await new Promise<any>(
        resolve => {
          setStepUpCode('');
          setStepUpError('');

          setStepUpRequest({
            retry: () =>
              baseAuthedFetch(
                path,
                requestToken,
                opts
              ),
            resolve,
          });
        }
      );
    }
  }

  async function handleFreshStepUp(
    e: React.FormEvent
  ) {
    e.preventDefault();

    if (
      !stepUpRequest ||
      !/^\d{6}$/.test(
        stepUpCode
      )
    ) {
      return;
    }

    setStepUpBusy(true);
    setStepUpError('');

    const request =
      stepUpRequest;

    try {
      await verifyFreshStepUp(
        token,
        stepUpCode
      );

      const result =
        await request.retry();

      request.resolve(
        result
      );

      setStepUpRequest(
        null
      );

      setStepUpCode(
        ''
      );

    } catch (err: any) {

      setStepUpError(
        err?.message ||
        'Fresh authentication failed.'
      );

      setStepUpCode(
        ''
      );

    } finally {

      setStepUpBusy(
        false
      );

    }
  }

  function cancelFreshStepUp() {
    const request =
      stepUpRequest;

    setStepUpRequest(
      null
    );

    setStepUpCode(
      ''
    );

    setStepUpError(
      ''
    );

    request?.resolve({
      error:
        'Fresh authentication cancelled.',
      stepUpRequired:
        true,
    });
  }

  useEffect(() => {
    const t = 'cookie';
    const userStr = sessionStorage.getItem('sukuu_user');
    if (!t) { router.push('/login'); return; }
    setToken(t);
    setUser(userStr ? JSON.parse(userStr) : null);

    // One lightweight check before the page's ~15 data requests fire —
    // if this role has no system access, say so once, cleanly, instead
    // of letting every one of those requests fail independently.
    baseAuthedFetch(
      '/api/v1/auth/my-access',
      t
    )
      .then(access => {
        setAccessChecked(true);
        if (!access || typeof access !== 'object' || !('system' in access)) {
          setAccessDenied(true);
          return;
        }
        loadAll(t);
      })
      .catch(() => { setAccessChecked(true); setAccessDenied(true); });
  }, [router]);

  function loadAll(t: string) {
    systemFetch('/api/v1/system/users', t).then(d => Array.isArray(d) ? setUsers(d) : setError(d.error));
    systemFetch('/api/v1/system/roles', t).then(d => Array.isArray(d) && setRoles(d));
    systemFetch('/api/v1/system/permissions', t).then(d => Array.isArray(d) && setPermissions(d));
    systemFetch('/api/v1/system/flags', t).then(d => Array.isArray(d) && setFlags(d));
    systemFetch('/api/v1/system/audit-log', t).then(d => Array.isArray(d) && setAudit(d));
    systemFetch('/api/v1/system/sessions', t).then(d => Array.isArray(d) && setSessions(d));
    systemFetch('/api/v1/system/auth-log', t).then(d => Array.isArray(d) && setAuthLog(d));
    systemFetch('/api/v1/system/password-policy', t).then(d => d && !d.error && setPwdPolicy(d));
    systemFetch('/api/v1/system/security-policies', t).then(d => Array.isArray(d) && setSecPolicies(d));
    systemFetch('/api/v1/system/api-keys', t).then(d => Array.isArray(d) && setApiKeys(d));
    systemFetch('/api/v1/system/webhooks', t).then(d => Array.isArray(d) && setWebhooks(d));
    systemFetch('/api/v1/system/events', t).then(d => Array.isArray(d) && setEvents(d));
    loadOps(t);
    setSummaryLoading(true);
    systemFetch('/api/v1/system/summary', t)
      .then(d => { if (d && !d.error) { setSummary(d); setSummaryError(''); } else { setSummaryError(d?.error || 'Failed to load summary'); } })
      .catch(() => setSummaryError('Failed to load summary'))
      .finally(() => setSummaryLoading(false));
  }

  function loadOps(t: string) {
    Promise.all([
      systemFetch('/api/v1/ops/config', t),
      systemFetch('/api/v1/ops/departments', t),
      systemFetch('/api/v1/ops/integrations', t),
      systemFetch('/api/v1/ops/backups', t),
      systemFetch('/api/v1/ops/jobs', t),
      systemFetch('/api/v1/ops/health-checks', t),
      systemFetch('/api/v1/ops/rate-limits', t),
      systemFetch('/api/v1/ops/retention', t),
      systemFetch('/api/v1/ops/errors', t),
      systemFetch('/api/v1/ops/services', t),
    ]).then(([config, departments, integrations, backups, jobs, health, rateLimits, retention, errors, services]) => {
      setOps({ config, departments, integrations, backups, jobs, health, rateLimits, retention, errors, services });
    });
  }

  async function handleSuspend(id: string, name: string) {
    setDialog({
      type: 'reason',
      title: `Suspend ${name}?`,
      message: 'They will lose access immediately. This is reversible via Reinstate. The reason becomes part of the permanent audit record.',
      onConfirm: async (reason) => {
        const res = await systemFetch(`/api/v1/system/users/${id}/suspend`, token, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason }) });
        if (res?.error) { setDialog({ type: 'info', title: 'Could not suspend', message: res.error }); return; }
        setDialog({ type: 'info', title: 'Suspended', message: `${name} has been suspended. Reason recorded: "${reason}". Reversible via Reinstate.` });
        loadAll(token);
      },
    });
  }
  async function handleReinstate(id: string, name: string) {
    setDialog({
      type: 'reason',
      title: `Reinstate ${name}?`,
      message: 'They will regain the access they had before being suspended. The reason becomes part of the permanent audit record.',
      onConfirm: async (reason) => {
        const res = await systemFetch(`/api/v1/system/users/${id}/reinstate`, token, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason }) });
        if (res?.error) { setDialog({ type: 'info', title: 'Could not reinstate', message: res.error }); return; }
        setDialog({ type: 'info', title: 'Reinstated', message: `${name} has been reinstated. Reason recorded: "${reason}".` });
        loadAll(token);
      },
    });
  }
  async function handleArchive(id: string) {
    setDialog({
      type: 'confirm', danger: true, title: 'Archive this user?',
      message: 'They will be deactivated permanently but the record is retained (no hard deletes).',
      onConfirm: async () => {
        await systemFetch(`/api/v1/system/users/${id}/archive`, token, { method: 'PATCH' });
        loadAll(token);
      },
    });
  }
  function openEdit(u: any) {
    setEditingUser(u);
    const parts = u.name.split(' ');
    setEditForm({ firstName: parts[0] || '', lastName: parts.slice(1).join(' ') || '', email: u.email, phone: u.phone || '' });
  }
  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    await systemFetch(`/api/v1/system/users/${editingUser.id}`, token, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editForm) });
    setEditingUser(null);
    loadAll(token);
  }
  function openRoleEdit(r: any) { setEditingRole(r); setRoleForm({ label: r.label, description: r.description || '' }); }

  async function openUserRoles(u: any) {
    setManagingUserRoles(u);
    const res = await systemFetch(`/api/v1/system/users/${u.id}/role-assignments`, token);
    setUserRoleAssignments(Array.isArray(res) ? res : []);
  }
  async function handleAssignRole(e: React.FormEvent) {
    e.preventDefault();
    setAssignRoleBusy(true);
    const res = await systemFetch(`/api/v1/system/users/${managingUserRoles.id}/role-assignments`, token, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roleId: assignRoleForm.roleId, expiresAt: assignRoleForm.expiresAt || undefined }),
    });
    setAssignRoleBusy(false);
    if (res?.error) { setDialog({ type: 'info', title: 'Could not assign role', message: res.error }); return; }
    setAssignRoleForm({ roleId: '', expiresAt: '' });
    openUserRoles(managingUserRoles);
    loadAll(token);
  }
  async function handleRevokeRoleAssignment(assignmentId: string) {
    setDialog({
      type: 'confirm', title: 'Revoke this role assignment?',
      message: 'Takes effect on their very next request — no need for them to log out.',
      onConfirm: async () => {
        await systemFetch(`/api/v1/system/role-assignments/${assignmentId}/revoke`, token, { method: 'PATCH' });
        openUserRoles(managingUserRoles);
        loadAll(token);
      },
    });
  }
  async function handleSaveRole(e: React.FormEvent) {
    e.preventDefault();
    const res = await systemFetch(`/api/v1/system/roles/${editingRole.id}`, token, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(roleForm) });
    if (!res.error) setEditingRole(null);
    loadAll(token);
  }
  async function handleCreateRole(e: React.FormEvent) {
    e.preventDefault();
    await systemFetch('/api/v1/system/roles', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(createRoleForm) });
    setShowCreateRole(false);
    setCreateRoleForm({ name: '', label: '', description: '' });
    loadAll(token);
  }
  async function openManagePerms(r: any) {
    setManagingRole(r);
    const current = await systemFetch(`/api/v1/system/roles/${r.id}/permissions`, token);
    setRolePerms(Array.isArray(current) ? current.map((p: any) => p.id) : []);
  }
  async function togglePermission(permId: string, isGranted: boolean) {
    if (isGranted) {
      await systemFetch(`/api/v1/system/roles/${managingRole.id}/permissions/${permId}`, token, { method: 'DELETE' });
      setRolePerms(rolePerms.filter(id => id !== permId));
    } else {
      await systemFetch(`/api/v1/system/roles/${managingRole.id}/permissions`, token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ permissionId: permId }) });
      setRolePerms([...rolePerms, permId]);
    }
    loadAll(token);
  }
  async function handleToggleFlag(flagId: string, current: boolean) {
    await systemFetch(`/api/v1/system/flags/${flagId}`, token, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isEnabled: !current }) });
    loadAll(token);
  }
  async function handleCreateFlag(e: React.FormEvent) {
    e.preventDefault();
    await systemFetch('/api/v1/system/flags', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(flagForm) });
    setFlagForm({ flagKey: '', description: '' });
    loadAll(token);
  }
  async function handleRevokeSession(id: string) { await systemFetch(`/api/v1/system/sessions/${id}/revoke`, token, { method: 'PATCH' }); loadAll(token); }
  const [justAdded, setJustAdded] = useState<any>(null);
  const [staffPickerOpen, setStaffPickerOpen] = useState(false);
  const [staffPickerQuery, setStaffPickerQuery] = useState('');
  const [selectedStaffLabel, setSelectedStaffLabel] = useState('');
  async function handleAddRosterEntry(e: React.FormEvent) {
    e.preventDefault();
    const res = await systemFetch('/api/v1/system/staff-roster', token, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(rosterForm),
    });
    if (res.error) { setRosterMsg(res.error); return; }
    setJustAdded(res);
    setRosterMsg(`Added ${rosterForm.firstName} ${rosterForm.lastName} to the roster.`);
    setRosterForm({ firstName: '', lastName: '', gender: 'MALE', dateOfBirth: '', phone: '', email: '', roleId: '', employmentType: 'PERMANENT' });
    loadAll(token);
  }
  function grantAccessToJustAdded() {
    if (!justAdded) return;
    setGrantForm({ staffId: justAdded.id, email: justAdded.email, roleId: '' });
    setSelectedStaffLabel(`${justAdded.first_name} ${justAdded.last_name} — ${justAdded.staff_id}`);
    setShowAddRoster(false);
    setShowGrantAccess(true);
    setJustAdded(null);
  }
  function closeGrantAccessModal() {
    setShowGrantAccess(false);
    setStaffPickerOpen(false);
    setStaffPickerQuery('');
    setSelectedStaffLabel('');
    setGrantForm({ staffId: '', email: '', roleId: '' });
  }
  async function handleResetPassword(id: string, name: string) {
    setDialog({
      type: 'confirm', danger: true, title: `Reset ${name}'s password?`,
      message: 'Their current password stops working immediately.',
      confirmLabel: 'Reset Password',
      onConfirm: async () => {
        const res = await systemFetch(`/api/v1/system/users/${id}/reset-password`, token, { method: 'PATCH' });
        if (res?.error) { setDialog({ type: 'info', title: 'Could not reset', message: res.error }); return; }
        setDialog({ type: 'info', title: 'New Temporary Password', message: `For ${name}. Record this now — it will not be shown again.`, copyable: res.tempPassword });
      },
    });
  }
  async function loadUnlinkedStaff() {
    const res = await systemFetch('/api/v1/system/staff-roster/unlinked', token);
    setUnlinkedStaff(Array.isArray(res) ? res : []);
  }
  async function handleGrantAccess(e: React.FormEvent) {
    e.preventDefault();
    // Client-generated operationId makes this safe to retry (double-tap,
    // flaky connection, browser back) without granting access twice —
    // the API returns the original result instead of re-running the command.
    const operationId = crypto.randomUUID();
    const res = await systemFetch('/api/v1/system/users', token, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Operation-Id': operationId },
      body: JSON.stringify(grantForm),
    });
    if (res.error) { setGrantMsg(res.error); return; }
    setGrantMsg(res.replayed
      ? `Already granted (this was a repeat submission). Temp password: ${res.tempPassword}`
      : `Access granted to ${res.staffName}. Temp password: ${res.tempPassword} — record this now, it will not be shown again.`);
    setGrantForm({ staffId: '', email: '', roleId: '' });
    setSelectedStaffLabel('');
    loadUnlinkedStaff();
    loadAll(token);
  }
  async function handleSavePwdPolicy(e: React.FormEvent) {
    e.preventDefault();
    const r = await systemFetch('/api/v1/system/password-policy', token, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pwdPolicy) });
    setPwdPolicy(r);
    loadAll(token);
  }
  async function handleAddSecPolicy(e: React.FormEvent) {
    e.preventDefault();
    await systemFetch('/api/v1/system/security-policies', token, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(secPolicyForm) });
    setSecPolicyForm({ policyName: '', policyValue: '' });
    loadAll(token);
  }
  async function handleCreateApiKey(e: React.FormEvent) {
    e.preventDefault();
    const r = await systemFetch('/api/v1/system/api-keys', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(apiKeyForm) });
    setApiKeyResult(r.rawKey ? `Save this now — won't be shown again: ${r.rawKey}` : '');
    setApiKeyForm({ label: '', scopes: '' });
    loadAll(token);
  }
  async function handleRevokeApiKey(id: string) { await systemFetch(`/api/v1/system/api-keys/${id}/revoke`, token, { method: 'PATCH' }); loadAll(token); }
  async function handleCreateWebhook(e: React.FormEvent) {
    e.preventDefault();
    await systemFetch('/api/v1/system/webhooks', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(webhookForm) });
    setWebhookForm({ url: '', events: '' });
    loadAll(token);
  }
  async function handleToggleWebhook(id: string, current: boolean) {
    await systemFetch(`/api/v1/system/webhooks/${id}`, token, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !current }) });
    loadAll(token);
  }
  async function handleRunHealthCheck() { await systemFetch('/api/v1/ops/health-check', token, { method: 'POST' }); loadOps(token); }
  async function handleSaveConfig(e: React.FormEvent) {
    e.preventDefault();
    await systemFetch('/api/v1/ops/config', token, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(configForm) });
    setConfigForm({ key: '', value: '' });
    loadOps(token);
  }
  async function handleAddDept(e: React.FormEvent) {
    e.preventDefault();
    await systemFetch('/api/v1/ops/departments', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(deptForm) });
    setDeptForm({ name: '', description: '' });
    loadOps(token);
  }
  async function handleAddIntegration(e: React.FormEvent) {
    e.preventDefault();
    await systemFetch('/api/v1/ops/integrations', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(integrationForm) });
    setIntegrationForm({ name: '', type: '', config: '' });
    loadOps(token);
  }
  async function handleToggleIntegration(id: string, current: boolean) {
    await systemFetch(`/api/v1/ops/integrations/${id}`, token, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !current }) });
    loadOps(token);
  }
  async function handleAddRateLimit(e: React.FormEvent) {
    e.preventDefault();
    await systemFetch('/api/v1/ops/rate-limits', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(rateLimitForm) });
    setRateLimitForm({ endpoint: '', maxRequests: 100, windowSeconds: 60 });
    loadOps(token);
  }
  async function handleAddRetention(e: React.FormEvent) {
    e.preventDefault();
    await systemFetch('/api/v1/ops/retention', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(retentionForm) });
    setRetentionForm({ policyName: '', retentionYears: 7, description: '' });
    loadOps(token);
  }

  // ── Bulk import (EFS-SYS-0020: preview -> validate -> error file -> commit) ──
  function parseBulkCsv(): any[] {
    const lines = bulkCsv.trim().split('\n').filter(l => l.trim());
    const dataLines = lines[0]?.toLowerCase().includes('firstname') ? lines.slice(1) : lines;
    return dataLines.map((line, i) => {
      const [firstName, lastName, email, phone, roleId] = line.split(',').map(s => s.trim());
      return { rowNumber: i + 1, firstName, lastName, email, phone, roleId };
    });
  }
  async function handleBulkPreview() {
    setBulkBusy(true);
    setBulkResult(null);
    const rows = parseBulkCsv();
    const res = await systemFetch('/api/v1/system/users/bulk/preview', token, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rows }),
    });
    setBulkPreview(Array.isArray(res) ? res : []);
    setBulkBusy(false);
  }
  async function handleBulkCommit() {
    setDialog({
      type: 'confirm', title: 'Commit this import?', confirmLabel: 'Commit',
      message: 'Valid rows will create real user accounts immediately.',
      onConfirm: async () => {
        setBulkBusy(true);
        const rows = parseBulkCsv();
        const res = await systemFetch('/api/v1/system/users/bulk/commit', token, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rows }),
        });
        setBulkResult(Array.isArray(res) ? res : []);
        setBulkPreview(null);
        setBulkBusy(false);
        loadAll(token);
      },
    });
  }
  function downloadBulkErrorFile() {
    const rows = bulkResult || bulkPreview || [];
    const failed = rows.filter((r: any) => r.status === 'error' || r.status === 'skipped' || r.status === 'failed');
    const csv = 'rowNumber,status,errors\n' + failed.map((r: any) => `${r.rowNumber},${r.status},"${r.errors.join('; ')}"`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'bulk-import-errors.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  // ── Six named governed reports (EFS-SYS-0040) ──
  async function loadReport(key: string) {
    setActiveReport(key);
    setReportLoading(true);
    let url = `/api/v1/system/reports/${key}`;
    if (key === 'audit-export') {
      const params = new URLSearchParams();
      if (auditExportFilters.entityType) params.set('entityType', auditExportFilters.entityType);
      if (auditExportFilters.action) params.set('action', auditExportFilters.action);
      if (auditExportFilters.fromDate) params.set('fromDate', auditExportFilters.fromDate);
      if (auditExportFilters.toDate) params.set('toDate', auditExportFilters.toDate);
      url += `?${params.toString()}`;
    }
    const res = await systemFetch(url, token);
    setReportData(Array.isArray(res) ? res : (res?.error ? [] : res));
    setReportLoading(false);
  }
  function downloadReportCsv() {
    if (!Array.isArray(reportData) || reportData.length === 0) return;
    const keys = Object.keys(reportData[0]);
    const csv = keys.join(',') + '\n' + reportData.map((row: any) => keys.map(k => JSON.stringify(row[k] ?? '')).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${activeReport}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  if (accessDenied) {
    return (
      <AppShell user={user}>
        <div style={{ padding: '60px 40px', textAlign: 'center', maxWidth: 440, margin: '0 auto' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, marginBottom: 8 }}>You don't have access to SystemX</h2>
          <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>
            Your current role doesn't include system administration. If you believe this is wrong, ask an administrator to check your role assignment.
          </p>
        </div>
      </AppShell>
    );
  }
  if (!accessChecked) {
    return <AppShell user={user}><div style={{ padding: 40, color: 'var(--muted)' }}>Checking access…</div></AppShell>;
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
          <button onClick={() => setShowAddRoster(true)} style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>+ Add to Roster</button>
          <button onClick={() => { setShowGrantAccess(true); loadUnlinkedStaff(); }} style={{ background: 'var(--soft)', color: 'var(--ink)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600, marginLeft: 8 }}>+ Grant System Access</button>
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
                    <button onClick={() => openUserRoles(u)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--inB)', color: 'var(--in)', fontWeight: 600 }}>Roles</button>
                    <button onClick={() => handleResetPassword(u.id, u.name)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--soft)', color: 'var(--ink)', fontWeight: 600 }}>Reset Password</button>
                    {u.status === 'ACTIVE'
                      ? <button onClick={() => handleSuspend(u.id, u.name)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--wnB)', color: 'var(--wn)', fontWeight: 600 }}>Suspend</button>
                      : <button onClick={() => handleReinstate(u.id, u.name)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--okB)', color: 'var(--ok)', fontWeight: 600 }}>Reinstate</button>}
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

      {showAddRoster && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(4,13,52,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setShowAddRoster(false)}>
          <form onSubmit={handleAddRosterEntry} onClick={e => e.stopPropagation()} style={{ background: 'var(--white)', padding: 24, borderRadius: 'var(--r)', width: 380, maxHeight: '85vh', overflowY: 'auto', boxShadow: 'var(--shL)' }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, marginBottom: 4 }}>Add to Staff Roster</h3>
            <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 16 }}>Adds a real person and their role/department to the roster. This does not grant them a login — that's a separate step, once they're ready.</p>
            {rosterMsg && (
              <div className="alert al-ok" style={{ marginBottom: 12 }}>
                {rosterMsg}
                {justAdded && (
                  <button type="button" onClick={grantAccessToJustAdded} style={{ display: 'block', marginTop: 6, fontSize: 11, fontWeight: 600, color: 'var(--navy)', textDecoration: 'underline' }}>
                    Grant them system access now →
                  </button>
                )}
              </div>
            )}
            <div className="fg"><label className="fl">FIRST NAME</label><input className="fi" value={rosterForm.firstName} onChange={e => setRosterForm({ ...rosterForm, firstName: e.target.value })} required /></div>
            <div className="fg"><label className="fl">LAST NAME</label><input className="fi" value={rosterForm.lastName} onChange={e => setRosterForm({ ...rosterForm, lastName: e.target.value })} required /></div>
            <div className="fg"><label className="fl">GENDER</label>
              <select className="fi" value={rosterForm.gender} onChange={e => setRosterForm({ ...rosterForm, gender: e.target.value })}><option value="MALE">Male</option><option value="FEMALE">Female</option><option value="OTHER">Other</option></select>
            </div>
            <div className="fg"><label className="fl">DATE OF BIRTH</label><input className="fi" type="date" value={rosterForm.dateOfBirth} onChange={e => setRosterForm({ ...rosterForm, dateOfBirth: e.target.value })} required /></div>
            <div className="fg"><label className="fl">PHONE</label><input className="fi" value={rosterForm.phone} onChange={e => setRosterForm({ ...rosterForm, phone: e.target.value })} required /></div>
            <div className="fg"><label className="fl">EMAIL</label><input className="fi" type="email" value={rosterForm.email} onChange={e => setRosterForm({ ...rosterForm, email: e.target.value })} required /></div>
            <div className="fg"><label className="fl">ROLE</label>
              <select className="fi" value={rosterForm.roleId} onChange={e => setRosterForm({ ...rosterForm, roleId: e.target.value })} required>
                <option value="">Select a role…</option>
                {roles.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
              </select>
            </div>
            <div className="fg"><label className="fl">EMPLOYMENT TYPE</label>
              <select className="fi" value={rosterForm.employmentType} onChange={e => setRosterForm({ ...rosterForm, employmentType: e.target.value })}>
                <option value="PERMANENT">Permanent</option><option value="CONTRACT">Contract</option><option value="PART_TIME">Part-time</option><option value="VOLUNTEER">Volunteer</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button type="submit" style={{ flex: 1, background: 'var(--soft)', color: 'var(--ink)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Add to Roster</button>
              <button type="button" onClick={() => setShowAddRoster(false)} style={{ flex: 1, background: 'var(--soft)', color: 'var(--ink)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Close</button>
            </div>
          </form>
        </div>
      )}

      {showGrantAccess && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(4,13,52,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={closeGrantAccessModal}>
          <form onSubmit={handleGrantAccess} onClick={e => e.stopPropagation()} style={{ background: 'var(--white)', padding: 24, borderRadius: 'var(--r)', width: 380, boxShadow: 'var(--shL)' }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, marginBottom: 4 }}>Grant System Access</h3>
            <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 16 }}>Only people already on the staff roster can be selected here — type to search.</p>
            {grantMsg && <div className="alert al-ok" style={{ marginBottom: 12 }}>{grantMsg}</div>}
            <div className="fg">
              <label className="fl">STAFF MEMBER</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="fi"
                  placeholder="Click to see everyone, or type to filter…"
                  value={staffPickerOpen ? staffPickerQuery : selectedStaffLabel}
                  onFocus={() => { setStaffPickerOpen(true); setStaffPickerQuery(''); }}
                  onChange={e => setStaffPickerQuery(e.target.value)}
                  onBlur={() => setTimeout(() => setStaffPickerOpen(false), 150)}
                  autoComplete="off"
                  required={!grantForm.staffId}
                />
                {staffPickerOpen && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: 'var(--white)', border: '1px solid var(--bd)', borderRadius: 8, maxHeight: 220, overflowY: 'auto', boxShadow: 'var(--shL)', zIndex: 10 }}>
                    {unlinkedStaff
                      .filter(s => `${s.first_name} ${s.last_name}`.toLowerCase().includes(staffPickerQuery.toLowerCase()))
                      .map(s => (
                        <div
                          key={s.id}
                          // onMouseDown (not onClick) fires before the input's
                          // onBlur closes the panel — using onClick here would
                          // mean blur closes it first and the click never lands.
                          onMouseDown={() => {
                            setGrantForm({ ...grantForm, staffId: s.id, email: s.email });
                            setSelectedStaffLabel(`${s.first_name} ${s.last_name} — ${s.staff_id}`);
                            setStaffPickerOpen(false);
                          }}
                          style={{ padding: '9px 12px', cursor: 'pointer', fontSize: 12, borderBottom: '1px solid var(--faint)' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'var(--faint)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <div style={{ fontWeight: 600 }}>{s.first_name} {s.last_name}</div>
                          <div style={{ fontSize: 10, color: 'var(--muted)' }}>{s.staff_id} · {s.email}</div>
                        </div>
                      ))}
                    {unlinkedStaff.filter(s => `${s.first_name} ${s.last_name}`.toLowerCase().includes(staffPickerQuery.toLowerCase())).length === 0 && unlinkedStaff.length > 0 && (
                      <div style={{ padding: '9px 12px', fontSize: 12, color: 'var(--muted)' }}>No match for "{staffPickerQuery}"</div>
                    )}
                  </div>
                )}
              </div>
              {unlinkedStaff.length === 0 && (
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8, padding: 10, background: 'var(--faint)', borderRadius: 8 }}>
                  Nobody available to grant access to yet.
                  <button
                    type="button"
                    onClick={() => { closeGrantAccessModal(); setShowAddRoster(true); }}
                    style={{ display: 'block', marginTop: 6, fontSize: 11, fontWeight: 600, color: 'var(--navy)', textDecoration: 'underline' }}
                  >
                    Add someone to the roster now →
                  </button>
                </div>
              )}
            </div>
            {grantForm.staffId && (
              <>
                <div className="fg"><label className="fl">LOGIN EMAIL</label><input className="fi" type="email" value={grantForm.email} onChange={e => setGrantForm({ ...grantForm, email: e.target.value })} required /></div>
                <div className="fg"><label className="fl">SYSTEM ROLE (optional override — defaults to their roster role)</label>
                  <select className="fi" value={grantForm.roleId} onChange={e => setGrantForm({ ...grantForm, roleId: e.target.value })}>
                    <option value="">Use their roster role</option>
                    {roles.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                  </select>
                </div>
              </>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button type="submit" disabled={!grantForm.staffId} style={{ flex: 1, background: 'var(--navy)', color: 'var(--gold)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Grant Access</button>
              <button type="button" onClick={closeGrantAccessModal} style={{ flex: 1, background: 'var(--soft)', color: 'var(--ink)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Close</button>
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

      {managingUserRoles && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(4,13,52,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setManagingUserRoles(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--white)', padding: 24, borderRadius: 'var(--r)', width: 460, maxHeight: '80vh', overflowY: 'auto', boxShadow: 'var(--shL)' }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, marginBottom: 4 }}>Roles: {managingUserRoles.name}</h3>
            <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 16 }}>
              A person can hold more than one role at once, permanently or with an expiry date. Changes take effect on their very next request — no need for them to log out.
            </p>

            <div style={{ marginBottom: 16 }}>
              {userRoleAssignments.map(a => (
                <div key={a.id} className="ri na">
                  <div className="ri-b">
                    <div className="ri-t">{a.roleLabel || a.roleName}</div>
                    <div className="ri-s">
                      {a.expires_at ? `Until ${new Date(a.expires_at).toLocaleDateString()}` : 'Permanent'}
                      {a.assigned_by ? ` · assigned by ${String(a.assigned_by).slice(0, 8)}` : ''}
                    </div>
                  </div>
                  <span className={`bdg ${a.status === 'ACTIVE' ? 'bok' : 'ber'}`}>{a.status}</span>
                  {a.status === 'ACTIVE' && (
                    <button onClick={() => handleRevokeRoleAssignment(a.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--erB)', color: 'var(--er)', fontWeight: 600, marginLeft: 8 }}>Revoke</button>
                  )}
                </div>
              ))}
              {userRoleAssignments.length === 0 && <div className="ri na"><div className="ri-s">No role assignments on record for this school.</div></div>}
            </div>

            <form onSubmit={handleAssignRole} style={{ borderTop: '1px solid var(--bd)', paddingTop: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.04em', color: 'var(--muted)', marginBottom: 8 }}>ASSIGN A ROLE</div>
              <select className="fi" value={assignRoleForm.roleId} onChange={e => setAssignRoleForm({ ...assignRoleForm, roleId: e.target.value })} required style={{ width: '100%', marginBottom: 8 }}>
                <option value="">Select a role...</option>
                {roles.map((r: any) => <option key={r.id} value={r.id}>{r.label}</option>)}
              </select>
              <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Expires (optional — leave blank for permanent)</label>
              <input className="fi" type="date" value={assignRoleForm.expiresAt} onChange={e => setAssignRoleForm({ ...assignRoleForm, expiresAt: e.target.value })} style={{ width: '100%', marginBottom: 12 }} />
              <button type="submit" disabled={assignRoleBusy || !assignRoleForm.roleId} style={{ width: '100%', background: 'var(--navy)', color: 'var(--gold)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>
                {assignRoleBusy ? 'Assigning…' : 'Assign Role'}
              </button>
            </form>

            <button onClick={() => setManagingUserRoles(null)} style={{ marginTop: 16, width: '100%', background: 'var(--soft)', color: 'var(--ink)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Close</button>
          </div>
        </div>
      )}

      {tab === 'bulk' && (
        <div style={{ padding: 'var(--pad)' }}>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">BULK USER IMPORT</span></div>
            <div className="cb">
              <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>
                Paste CSV rows: firstName,lastName,email,phone,roleId (header row optional). Preview validates every row — including duplicate-email checks against existing users and duplicates within the file — before anything is created.
              </p>
              <textarea
                className="fi"
                style={{ width: '100%', minHeight: 140, fontFamily: 'monospace', fontSize: 12 }}
                placeholder={'firstName,lastName,email,phone,roleId\nJane,Doe,jane@school.edu,0244000000,ROL-013'}
                value={bulkCsv}
                onChange={e => { setBulkCsv(e.target.value); setBulkPreview(null); setBulkResult(null); }}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button onClick={handleBulkPreview} disabled={bulkBusy || !bulkCsv.trim()} style={{ background: 'var(--soft)', color: 'var(--ink)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>
                  {bulkBusy ? 'Validating…' : 'Preview & Validate'}
                </button>
                {bulkPreview && (
                  <button onClick={handleBulkCommit} disabled={bulkBusy || bulkPreview.every(r => r.status === 'error')} style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>
                    {bulkBusy ? 'Committing…' : `Commit ${bulkPreview.filter(r => r.status === 'valid').length} Valid Row(s)`}
                  </button>
                )}
                {(bulkPreview || bulkResult) && (bulkResult || bulkPreview)!.some((r: any) => r.status !== 'valid' && r.status !== 'created') && (
                  <button onClick={downloadBulkErrorFile} style={{ background: 'var(--erB)', color: 'var(--er)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Download Error File</button>
                )}
              </div>
            </div>
          </div>

          {(bulkPreview || bulkResult) && (
            <div className="card">
              <div className="ch"><span className="ch-t">{bulkResult ? 'IMPORT RESULT' : 'PREVIEW — nothing has been created yet'}</span></div>
              <div className="tbl">
                <table className="data-table">
                  <thead><tr><th>Row</th><th>Status</th><th>Details</th></tr></thead>
                  <tbody>
                    {(bulkResult || bulkPreview)!.map((r: any) => (
                      <tr key={r.rowNumber}>
                        <td>{r.rowNumber}</td>
                        <td><span className={`bdg ${r.status === 'valid' || r.status === 'created' ? 'bok' : r.status === 'error' || r.status === 'failed' ? 'ber' : 'bwn'}`}>{r.status}</span></td>
                        <td style={{ fontSize: 12 }}>{r.errors?.length ? r.errors.join('; ') : (r.userId ? `Created — id ${r.userId}` : '—')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {bulkResult && (
                <div style={{ padding: 12, fontSize: 12, color: 'var(--muted)' }}>
                  {bulkResult.filter((r: any) => r.status === 'created').length} created · {bulkResult.filter((r: any) => r.status !== 'created').length} skipped or failed
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {tab === 'reports' && (
        <div style={{ padding: 'var(--pad)' }}>
          <div className="sys-tabs" style={{ marginBottom: 16 }}>
            {REPORTS.map(r => (
              <button key={r.key} className={`sys-tab-btn${activeReport === r.key ? ' act' : ''}`} onClick={() => loadReport(r.key)}>{r.label}</button>
            ))}
          </div>

          {activeReport === 'audit-export' && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="ch"><span className="ch-t">FILTERS</span></div>
              <div className="cb" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <input className="fi" placeholder="Entity type" value={auditExportFilters.entityType} onChange={e => setAuditExportFilters({ ...auditExportFilters, entityType: e.target.value })} style={{ width: 160 }} />
                <input className="fi" placeholder="Action contains…" value={auditExportFilters.action} onChange={e => setAuditExportFilters({ ...auditExportFilters, action: e.target.value })} style={{ width: 160 }} />
                <input className="fi" type="date" value={auditExportFilters.fromDate} onChange={e => setAuditExportFilters({ ...auditExportFilters, fromDate: e.target.value })} />
                <input className="fi" type="date" value={auditExportFilters.toDate} onChange={e => setAuditExportFilters({ ...auditExportFilters, toDate: e.target.value })} />
                <button onClick={() => loadReport('audit-export')} style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Apply</button>
              </div>
            </div>
          )}

          <div className="card">
            <div className="ch" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="ch-t">{REPORTS.find(r => r.key === activeReport)?.label}</span>
              {Array.isArray(reportData) && reportData.length > 0 && (
                <button onClick={downloadReportCsv} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--soft)', color: 'var(--ink)', fontWeight: 600 }}>Export CSV</button>
              )}
            </div>
            <div style={{ padding: 12, fontSize: 11, color: 'var(--muted)' }}>
              Source: system.* live records, school-scoped to your current tenant · refreshed on load
            </div>
            {reportLoading ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--muted)' }}>Loading…</div>
            ) : !Array.isArray(reportData) || reportData.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--muted)' }}>No data for this report yet.</div>
            ) : (
              <div className="tbl" style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead><tr>{Object.keys(reportData[0]).map(k => <th key={k}>{k}</th>)}</tr></thead>
                  <tbody>
                    {reportData.map((row: any, i: number) => (
                      <tr key={i}>{Object.keys(reportData[0]).map(k => <td key={k} style={{ fontSize: 11 }}>{typeof row[k] === 'object' ? JSON.stringify(row[k]) : String(row[k] ?? '—')}</td>)}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'events' && (
        <div style={{ padding: 'var(--pad)' }}>
          <div className="card">
            <div className="ch"><span className="ch-t">DOMAIN EVENT OUTBOX</span></div>
            <div style={{ padding: 12, fontSize: 11, color: 'var(--muted)' }}>
              UserInvited · UserActivated · RoleGranted · SessionRevoked · AccountSuspended · FeatureFlagChanged — every consequential SystemX action, most recent first.
            </div>
            <div className="tbl">
              <table className="data-table">
                <thead><tr><th>Event</th><th>Aggregate</th><th>Occurred</th><th>Status</th><th>Correlation</th></tr></thead>
                <tbody>
                  {events.map(e => (
                    <tr key={e.id}>
                      <td><span className="bdg bin">{e.event_type}</span></td>
                      <td style={{ fontSize: 11 }}>{e.aggregate_type} · {String(e.aggregate_id).slice(0, 8)}</td>
                      <td style={{ fontSize: 11 }}>{new Date(e.occurred_at).toLocaleString()}</td>
                      <td><span className={`bdg ${e.status === 'PUBLISHED' ? 'bok' : e.status === 'FAILED' ? 'ber' : 'bwn'}`}>{e.status}</span></td>
                      <td style={{ fontFamily: 'monospace', fontSize: 10, color: 'var(--muted)' }}>{String(e.correlation_id).slice(0, 8)}</td>
                    </tr>
                  ))}
                  {events.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>No events recorded yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {stepUpRequest && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(4,13,52,.62)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 220,
        }}>
          <form
            onSubmit={handleFreshStepUp}
            style={{
              background: 'var(--white)',
              padding: 24,
              borderRadius: 'var(--r)',
              width: 390,
              boxShadow: 'var(--shL)',
            }}
          >
            <div style={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: 1.4,
              color: 'var(--gold)',
              marginBottom: 8,
            }}>
              PRIVILEGED ACTION · FRESH AUTHENTICATION
            </div>

            <h3 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 20,
              marginBottom: 8,
            }}>
              Verify Fresh Access
            </h3>

            <p style={{
              fontSize: 13,
              color: 'var(--muted)',
              lineHeight: 1.55,
              marginBottom: 14,
            }}>
              This SystemX change requires a fresh authenticator check.
              Verification authorizes protected administrative actions for
              approximately 10 minutes. If you just signed in, wait for the
              next authenticator code before verifying.
            </p>

            <label style={{
              display: 'block',
              fontSize: 11,
              fontWeight: 700,
              marginBottom: 6,
            }}>
              Authenticator Code
            </label>

            <input
              className="fi"
              type="text"
              value={stepUpCode}
              onChange={e =>
                setStepUpCode(
                  e.target.value
                    .replace(/\D/g, '')
                    .slice(0, 6)
                )
              }
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="6-digit code"
              autoFocus
              disabled={stepUpBusy}
              style={{
                width: '100%',
                marginBottom: stepUpError ? 8 : 14,
              }}
            />

            {stepUpError && (
              <div style={{
                color: 'var(--er)',
                fontSize: 12,
                lineHeight: 1.45,
                marginBottom: 12,
              }}>
                {stepUpError}
              </div>
            )}

            <div style={{
              display: 'flex',
              gap: 8,
            }}>
              <button
                type="submit"
                disabled={
                  stepUpBusy ||
                  !/^\d{6}$/.test(
                    stepUpCode
                  )
                }
                style={{
                  flex: 1,
                  background: 'var(--navy)',
                  color: 'white',
                  padding: 11,
                  borderRadius: 'var(--rS)',
                  fontWeight: 700,
                  opacity:
                    stepUpBusy ||
                    !/^\d{6}$/.test(
                      stepUpCode
                    )
                      ? .55
                      : 1,
                }}
              >
                {stepUpBusy
                  ? 'Verifying…'
                  : 'Verify & Continue'}
              </button>

              <button
                type="button"
                onClick={cancelFreshStepUp}
                disabled={stepUpBusy}
                style={{
                  flex: 1,
                  background: 'var(--soft)',
                  color: 'var(--ink)',
                  padding: 11,
                  borderRadius: 'var(--rS)',
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {dialog && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(4,13,52,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div style={{ background: 'var(--white)', padding: 24, borderRadius: 'var(--r)', width: 380, boxShadow: 'var(--shL)' }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 19, marginBottom: 10 }}>{dialog.title}</h3>
            <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5, marginBottom: dialog.type === 'reason' ? 12 : 0 }}>{dialog.message}</p>

            {dialog.type === 'reason' && (
              <textarea
                className="fi" rows={2} placeholder="Reason (required — becomes part of the permanent audit record)"
                value={dialogReason} onChange={e => setDialogReason(e.target.value)}
                style={{ width: '100%', resize: 'vertical' }} autoFocus
              />
            )}

            {dialog.type === 'info' && dialog.copyable && (
              <div style={{ marginTop: 16, padding: 12, background: 'var(--faint)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <code style={{ fontSize: 14, fontWeight: 700, letterSpacing: '.02em', wordBreak: 'break-all' }}>{dialog.copyable}</code>
                <button
                  type="button"
                  onClick={() => { navigator.clipboard.writeText(dialog.copyable!); setDialogCopied(true); setTimeout(() => setDialogCopied(false), 2000); }}
                  style={{ flexShrink: 0, fontSize: 11, padding: '6px 10px', borderRadius: 6, background: dialogCopied ? 'var(--okB)' : 'var(--soft)', color: dialogCopied ? 'var(--ok)' : 'var(--ink)', fontWeight: 600 }}
                >
                  {dialogCopied ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
              {dialog.type === 'confirm' && (
                <>
                  <button
                    type="button"
                    onClick={() => { const d = dialog; setDialog(null); d.onConfirm(); }}
                    style={{ flex: 1, background: dialog.danger ? 'var(--erB)' : 'var(--navy)', color: dialog.danger ? 'var(--er)' : 'var(--gold)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}
                  >
                    {dialog.confirmLabel || 'Confirm'}
                  </button>
                  <button type="button" onClick={() => setDialog(null)} style={{ flex: 1, background: 'var(--soft)', color: 'var(--ink)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Cancel</button>
                </>
              )}
              {dialog.type === 'reason' && (
                <>
                  <button
                    type="button"
                    disabled={!dialogReason.trim()}
                    onClick={() => { const d = dialog; const reason = dialogReason; setDialog(null); setDialogReason(''); d.onConfirm(reason); }}
                    style={{ flex: 1, background: dialogReason.trim() ? 'var(--navy)' : 'var(--soft)', color: dialogReason.trim() ? 'var(--gold)' : 'var(--muted)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}
                  >
                    Confirm
                  </button>
                  <button type="button" onClick={() => { setDialog(null); setDialogReason(''); }} style={{ flex: 1, background: 'var(--soft)', color: 'var(--ink)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Cancel</button>
                </>
              )}
              {dialog.type === 'info' && (
                <button type="button" onClick={() => setDialog(null)} style={{ flex: 1, background: 'var(--navy)', color: 'var(--gold)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>
                  {dialog.copyable ? "I've saved this" : 'Close'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
