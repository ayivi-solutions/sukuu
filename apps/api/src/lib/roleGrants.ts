import { prisma } from './prisma';
import { withTenantContext } from './tenantContext';

export async function getActiveRoleNames(
  userId: string,
  schoolId: string
): Promise<Set<string>> {
  const now = new Date();
  const names = new Set<string>();

  const [userRoles, staff] = await Promise.all([
    withTenantContext(
      { schoolId, userId, role: '' },
      tx => tx.systemUserRole.findMany({
        where: {
          user_id: userId,
          school_id: schoolId,
          OR: [
            { expires_at: null },
            { expires_at: { gt: now } },
          ],
        },
      })
    ),
    prisma.staffStaff.findFirst({
      where: { user_id: userId },
    }),
  ]);

  if (userRoles.length > 0) {
    const roleIds = userRoles.map(ur => ur.role_id);

    const roles = await withTenantContext(
      { schoolId, userId, role: '' },
      tx => tx.systemRole.findMany({
        where: {
          id: { in: roleIds },
          archived_at: null,
        } as any,
      })
    );

    for (const role of roles) {
      names.add(role.name);
    }
  }

  if (staff) {
    const employment =
      await prisma.staffEmployment.findFirst({
        where: {
          staff_id: staff.id,
          is_current: true,
        },
      });

    if (employment) {
      const role = await withTenantContext(
        { schoolId, userId, role: '' },
        tx => tx.systemRole.findFirst({
          where: {
            id: employment.role_id,
            archived_at: null,
          } as any,
        })
      );

      if (role) names.add(role.name);
    }
  }

  return names;
}

export async function getMyModuleAccess(
  userId: string,
  schoolId: string
): Promise<Record<string, 'read' | 'full'>> {
  const roleNames =
    await getActiveRoleNames(userId, schoolId);

  if (roleNames.size === 0) return {};

  const roles = await withTenantContext(
    { schoolId, userId, role: '' },
    tx => tx.systemRole.findMany({
      where: {
        name: { in: [...roleNames] },
        archived_at: null,
      } as any,
    })
  );

  const roleIds = roles.map(r => r.id);
  if (roleIds.length === 0) return {};

  const grants =
    await prisma.systemRolePermission.findMany({
      where: {
        role_id: { in: roleIds },
      },
    });

  const permIds =
    [...new Set(grants.map(g => g.permission_id))];

  const perms =
    await prisma.systemPermission.findMany({
      where: {
        id: { in: permIds },
      },
    });

  const access:
    Record<string, 'read' | 'full'> = {};

  for (const p of perms) {
    if (p.action === 'full') {
      access[p.module] = 'full';
    } else if (
      p.action === 'read' &&
      access[p.module] !== 'full'
    ) {
      access[p.module] = 'read';
    }
  }

  return access;
}

export async function hasModuleGrant(
  userId: string,
  schoolId: string,
  module: string,
  minLevel: 'read' | 'full'
): Promise<{
  granted: boolean;
  matchedRole?: string;
}> {
  const roleNames =
    await getActiveRoleNames(userId, schoolId);

  if (roleNames.size === 0) {
    return { granted: false };
  }

  const roles = await withTenantContext(
    { schoolId, userId, role: '' },
    tx => tx.systemRole.findMany({
      where: {
        name: { in: [...roleNames] },
        archived_at: null,
      } as any,
    })
  );

  const roleIds = roles.map(r => r.id);

  const levelsToCheck =
    minLevel === 'read'
      ? ['read', 'full']
      : ['full'];

  const perms =
    await prisma.systemPermission.findMany({
      where: {
        module,
        action: { in: levelsToCheck },
      },
    });

  const permIds = perms.map(p => p.id);

  if (permIds.length === 0) {
    return { granted: false };
  }

  const grant =
    await prisma.systemRolePermission.findFirst({
      where: {
        role_id: { in: roleIds },
        permission_id: { in: permIds },
      },
    });

  if (!grant) {
    return { granted: false };
  }

  const matchedRole =
    roles.find(r => r.id === grant.role_id)?.name;

  return {
    granted: true,
    matchedRole,
  };
}
