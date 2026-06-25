import { Request, Response } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import {
  listRoles, listPermissions, getRolePermissions,
  listUsers, setUserActive, createUser,
  listFeatureFlags, toggleFeatureFlag, listAuditEvents, listSessions, revokeSession, listAuthLog,
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
    res.status(201).json({
      user: { id: result.user.id, email: result.user.email },
      tempPassword: result.tempPassword,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create user' });
  }
}

export async function patchSuspend(req: Request, res: Response) {
  try {
    const updated = await setUserActive(req.params.userId, false);
    res.json({ id: updated.id, status: 'SUSPENDED' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to suspend user' });
  }
}

export async function patchReinstate(req: Request, res: Response) {
  try {
    const updated = await setUserActive(req.params.userId, true);
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

export async function patchFlag(req: Request, res: Response) {
  try {
    const { isEnabled } = req.body;
    const updated = await toggleFeatureFlag(req.params.flagId, !!isEnabled);
    res.json(updated);
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
