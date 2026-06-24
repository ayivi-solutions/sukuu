import { Request, Response } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import { listRoles, listPermissions, getRolePermissions } from './system.service';

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
