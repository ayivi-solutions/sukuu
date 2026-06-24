import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function listRoles(schoolId?: string) {
  return prisma.systemRole.findMany({
    where: schoolId ? { OR: [{ school_id: schoolId }, { is_system: true }] } : undefined,
    orderBy: { name: 'asc' },
  });
}

export async function listPermissions() {
  return prisma.systemPermission.findMany({ orderBy: [{ module: 'asc' }, { action: 'asc' }] });
}

export async function getRolePermissions(roleId: string) {
  const links = await prisma.systemRolePermission.findMany({ where: { role_id: roleId } });
  const permissionIds = links.map(l => l.permission_id);
  return prisma.systemPermission.findMany({ where: { id: { in: permissionIds } } });
}
