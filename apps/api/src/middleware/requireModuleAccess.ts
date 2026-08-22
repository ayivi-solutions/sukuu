import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from './authenticate';

export function requireModuleAccess(module: string, minLevel: 'read' | 'full') {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.roleKey) return res.status(403).json({ error: 'No role assigned', module, required: minLevel });
      const role = await prisma.systemRole.findFirst({ where: { name: req.roleKey } });
      if (!role) return res.status(403).json({ error: 'Role not recognized', module, required: minLevel });

      const levelsToCheck = minLevel === 'read' ? ['read', 'full'] : ['full'];
      const perms = await prisma.systemPermission.findMany({ where: { module, action: { in: levelsToCheck } } });
      const permIds = perms.map(p => p.id);
      const grant = await prisma.systemRolePermission.findFirst({ where: { role_id: role.id, permission_id: { in: permIds } } });

      if (!grant) return res.status(403).json({ error: 'Insufficient module access', module, required: minLevel, role: req.roleKey });
      next();
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };
}
