import { Request, Response } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import {
  listRoles, listPermissions, getRolePermissions,
  listUsers, setUserActive, createUser,
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
