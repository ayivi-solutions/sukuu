import { Request, Response } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import {
  listRoles, listPermissions, getRolePermissions,
  listUsers, setUserActive, createUser,
  listFeatureFlags, toggleFeatureFlag, createFeatureFlag, listAuditEvents, listSessions, revokeSession, listAuthLog, updateUser, archiveUser, updateRole, createRole, logAuditEvent, listUserIdentities, createUserIdentity, getPasswordPolicy, upsertPasswordPolicy, listSecurityPolicies, upsertSecurityPolicy, listApiKeys, createApiKey, revokeApiKey, listWebhooks, createWebhook, toggleWebhook, assignPermission, removePermission,
} from './system.service';

export async function getRoles(req: AuthRequest, res: Response) {
  try {
    const roles = await listRoles(req.schoolId);
    res.json(roles);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch roles' });
  }
}

export async function getPermissions(_req: Request, res: Response) {
  try {
    const permissions = await listPermissions();
    res.json(permissions);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch permissions' });
  }
}

export async function getRolePermissionsHandler(req: Request, res: Response) {
  try {
    const { roleId } = req.params;
    const permissions = await getRolePermissions(roleId);
    res.json(permissions);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch role permissions' });
  }
}

export async function getUsers(req: AuthRequest, res: Response) {
  try {
    if (!req.schoolId) return res.status(400).json({ error: 'No school associated with this user' });
    const users = await listUsers(req.schoolId);
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch users' });
  }
}

export async function postUser(req: AuthRequest, res: Response) {
  try {
    if (!req.schoolId) return res.status(400).json({ error: 'No school associated with this user' });
    const { firstName, lastName, email, phone, roleId } = req.body;
    if (!firstName || !lastName || !email || !roleId) {
      return res.status(400).json({ error: 'firstName, lastName, email, roleId are required' });
    }
    const result = await createUser(req.schoolId, {
      firstName, lastName, email, phone, roleId, assignedBy: req.userId || '',
    });
    await logAuditEvent(req.schoolId, req.userId || '', 'CREATE_USER', 'system_user', result.user.id);
    res.status(201).json({
      user: { id: result.user.id, email: result.user.email },
      tempPassword: result.tempPassword,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create user' });
  }
}

export async function patchSuspend(req: AuthRequest, res: Response) {
  try {
    const updated = await setUserActive(req.params.userId, false);
    if (req.schoolId) await logAuditEvent(req.schoolId, req.userId || '', 'SUSPEND_USER', 'system_user', req.params.userId);
    res.json({ id: updated.id, status: 'SUSPENDED' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to suspend user' });
  }
}

export async function patchReinstate(req: AuthRequest, res: Response) {
  try {
    const updated = await setUserActive(req.params.userId, true);
    if (req.schoolId) await logAuditEvent(req.schoolId, req.userId || '', 'REINSTATE_USER', 'system_user', req.params.userId);
    res.json({ id: updated.id, status: 'ACTIVE' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to reinstate user' });
  }
}

export async function getFlags(req: AuthRequest, res: Response) {
  try {
    if (!req.schoolId) return res.status(400).json({ error: 'No school associated with this user' });
    const flags = await listFeatureFlags(req.schoolId);
    res.json(flags);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch feature flags' });
  }
}

export async function patchFlag(req: AuthRequest, res: Response) {
  try {
    const { isEnabled } = req.body;
    const updated = await toggleFeatureFlag(req.params.flagId, !!isEnabled);
    res.json(updated);
    if (req.schoolId) await logAuditEvent(req.schoolId, req.userId || '', 'TOGGLE_FLAG', 'system_feature_flag', req.params.flagId);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update feature flag' });
  }
}

export async function getAuditLog(req: AuthRequest, res: Response) {
  try {
    if (!req.schoolId) return res.status(400).json({ error: 'No school associated with this user' });
    const events = await listAuditEvents(req.schoolId);
    res.json(events);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch audit log' });
  }
}

export async function getSessions(req: AuthRequest, res: Response) {
  try {
    if (!req.schoolId) return res.status(400).json({ error: 'No school associated with this user' });
    const users = await listUsers(req.schoolId);
    const sessions = await listSessions(users.map(u => u.id));
    res.json(sessions);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch sessions' });
  }
}

export async function patchRevoke(req: Request, res: Response) {
  try {
    const revoked = await revokeSession(req.params.sessionId);
    res.json({ id: revoked.id, status: 'REVOKED' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to revoke session' });
  }
}

export async function getAuthLog(_req: Request, res: Response) {
  try {
    const logs = await listAuthLog();
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch auth log' });
  }
}

export async function patchUser(req: AuthRequest, res: Response) {
  try {
    await updateUser(req.params.userId, req.body);
    if (req.schoolId) await logAuditEvent(req.schoolId, req.userId || '', 'UPDATE_USER', 'system_user', req.params.userId);
    res.json({ id: req.params.userId, updated: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update user' });
  }
}

export async function patchArchiveUser(req: AuthRequest, res: Response) {
  try {
    const archived = await archiveUser(req.params.userId);
    if (req.schoolId) await logAuditEvent(req.schoolId, req.userId || '', 'ARCHIVE_USER', 'system_user', req.params.userId);
    res.json({ id: archived.id, status: 'ARCHIVED' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to archive user' });
  }
}

export async function patchRole(req: AuthRequest, res: Response) {
  try {
    const updated = await updateRole(req.params.roleId, req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(403).json({ error: err.message || 'Failed to update role' });
  }
}

export async function getUserIdentities(req: Request, res: Response) {
  try { res.json(await listUserIdentities(req.params.userId)); }
  catch (err: any) { res.status(500).json({ error: err.message }); }
}
export async function postUserIdentity(req: Request, res: Response) {
  try { res.status(201).json(await createUserIdentity(req.params.userId, req.body.identityType, req.body.identityId)); }
  catch (err: any) { res.status(500).json({ error: err.message }); }
}
export async function getPwdPolicy(req: AuthRequest, res: Response) {
  try { res.json(await getPasswordPolicy(req.schoolId || '')); }
  catch (err: any) { res.status(500).json({ error: err.message }); }
}
export async function putPwdPolicy(req: AuthRequest, res: Response) {
  try { const r = await upsertPasswordPolicy(req.schoolId || '', req.body); if (req.schoolId) await logAuditEvent(req.schoolId, req.userId || '', 'UPDATE_PASSWORD_POLICY', 'system_password_policy', ''); res.json(r); }
  catch (err: any) { res.status(500).json({ error: err.message }); }
}
export async function getSecPolicies(req: AuthRequest, res: Response) {
  try { res.json(await listSecurityPolicies(req.schoolId || '')); }
  catch (err: any) { res.status(500).json({ error: err.message }); }
}
export async function putSecPolicy(req: AuthRequest, res: Response) {
  try { const r = await upsertSecurityPolicy(req.schoolId || '', req.body.policyName, req.body.policyValue); if (req.schoolId) await logAuditEvent(req.schoolId, req.userId || '', 'UPDATE_SECURITY_POLICY', 'system_security_policy', ''); res.json(r); }
  catch (err: any) { res.status(500).json({ error: err.message }); }
}
export async function getApiKeys(req: AuthRequest, res: Response) {
  try { res.json(await listApiKeys(req.schoolId || '')); }
  catch (err: any) { res.status(500).json({ error: err.message }); }
}
export async function postApiKey(req: AuthRequest, res: Response) {
  try { const r = await createApiKey(req.schoolId || '', req.body.label, req.body.scopes, req.userId || ''); if (req.schoolId) await logAuditEvent(req.schoolId, req.userId || '', 'CREATE_API_KEY', 'system_api_key', r.id); res.status(201).json(r); }
  catch (err: any) { res.status(500).json({ error: err.message }); }
}
export async function patchRevokeApiKey(req: AuthRequest, res: Response) {
  try { const r = await revokeApiKey(req.params.id); if (req.schoolId) await logAuditEvent(req.schoolId, req.userId || '', 'REVOKE_API_KEY', 'system_api_key', req.params.id); res.json(r); }
  catch (err: any) { res.status(500).json({ error: err.message }); }
}
export async function getWebhooks(req: AuthRequest, res: Response) {
  try { res.json(await listWebhooks(req.schoolId || '')); }
  catch (err: any) { res.status(500).json({ error: err.message }); }
}
export async function postWebhook(req: AuthRequest, res: Response) {
  try { const r = await createWebhook(req.schoolId || '', req.body.url, req.body.events, req.userId || ''); if (req.schoolId) await logAuditEvent(req.schoolId, req.userId || '', 'CREATE_WEBHOOK', 'system_webhook', r.id); res.status(201).json(r); }
  catch (err: any) { res.status(500).json({ error: err.message }); }
}
export async function patchWebhook(req: AuthRequest, res: Response) {
  try { res.json(await toggleWebhook(req.params.id, !!req.body.isActive)); }
  catch (err: any) { res.status(500).json({ error: err.message }); }
}
export async function postAssignPermission(req: AuthRequest, res: Response) {
  try {
    const result = await assignPermission(req.params.roleId, req.body.permissionId, req.userId || '');
    if (req.schoolId) await logAuditEvent(req.schoolId, req.userId || '', 'GRANT_PERMISSION', 'system_role', req.params.roleId);
    res.status(201).json(result);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
}
export async function deleteRemovePermission(req: AuthRequest, res: Response) {
  try {
    const result = await removePermission(req.params.roleId, req.params.permissionId);
    if (req.schoolId) await logAuditEvent(req.schoolId, req.userId || '', 'REVOKE_PERMISSION', 'system_role', req.params.roleId);
    res.json(result);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
}

export async function postRole(req: AuthRequest, res: Response) {
  try {
    if (!req.schoolId) return res.status(400).json({ error: 'No school associated with this user' });
    const { name, label, description } = req.body;
    if (!name || !label) return res.status(400).json({ error: 'name and label are required' });
    const r = await createRole(req.schoolId, name, label, description);
    await logAuditEvent(req.schoolId, req.userId || '', 'CREATE_ROLE', 'system_role', r.id);
    res.status(201).json(r);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create role' });
  }
}

export async function postFlag(req: AuthRequest, res: Response) {
  try {
    const r = await createFeatureFlag(req.schoolId || '', req.body.flagKey, req.body.description);
    if (req.schoolId) await logAuditEvent(req.schoolId, req.userId || '', 'CREATE_FLAG', 'system_feature_flag', r.id);
    res.status(201).json(r);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
}
