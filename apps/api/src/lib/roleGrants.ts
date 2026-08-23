import { prisma } from './prisma';
import { withTenantContext } from './tenantContext';

/**
 * Returns the set of role names currently active for this user in this
 * school — checked live, every call, never cached in a JWT. Union of:
 *
 *   1. SystemUserRole — real multi-role, expiry-aware assignments
 *      (EFS-COM-0024/0025).
 *   2. StaffEmployment.role_id — the pre-existing single-role fallback
 *      every account still has, so nothing loses access if (1) is empty.
 *
 * Only ONE transaction now, not three. system_role reads (both here and
 * in hasModuleGrant below) use the plain prisma client — every currently-
 * seeded role is is_system=true, which bypasses RLS unconditionally
 * regardless of session context, so wrapping those reads in
 * withTenantContext bought nothing except three extra round trips per
 * check. Only system_user_role's tenant_match policy genuinely depends
 * on context, so it's the only one still wrapped.
 *
 * This matters concretely, not just in principle: requireModuleAccess
 * calls this on every one of the ~15 requests a single SystemX page load
 * fires simultaneously. At 3 transactions each that's up to 45 concurrent
 * interactive transactions to open one page — real pressure on a finite
 * connection pool, and the likely cause of newly-created accounts (which
 * take a different code path than the directly-seeded superadmin) failing
 * under that load. At 1 transaction each it's at most 15.
 */
export async function getActiveRoleNames(userId: string, schoolId: string): Promise<Set<string>> {
  const now = new Date();
  const names = new Set<string>();

  const [userRoles, staff] = await Promise.all([
    withTenantContext({ schoolId, userId, role: '' }, tx => tx.systemUserRole.findMany({
      where: {
        user_id: userId,
        school_id: schoolId,
        OR: [{ expires_at: null }, { expires_at: { gt: now } }],
      },
    })),
    prisma.staffStaff.findFirst({ where: { user_id: userId } }),
  ]);

  if (userRoles.length > 0) {
    const roleIds = userRoles.map(ur => ur.role_id);
    const roles = await prisma.systemRole.findMany({ where: { id: { in: roleIds } } });
    for (const r of roles) names.add(r.name);
  }

  if (staff) {
    const employment = await prisma.staffEmployment.findFirst({ where: { staff_id: staff.id, is_current: true } });
    if (employment) {
      const role = await prisma.systemRole.findFirst({ where: { id: employment.role_id } });
      if (role) names.add(role.name);
    }
  }

  return names;
}

/**
 * Every module the user has at least read access to, in one pass — used
 * by the nav (to only show what someone can actually use) and by each
 * page's own early access check (so a page with no access shows one
 * clean message immediately, instead of firing its full set of data
 * requests and letting every one of them fail independently).
 */
export async function getMyModuleAccess(userId: string, schoolId: string): Promise<Record<string, 'read' | 'full'>> {
  const roleNames = await getActiveRoleNames(userId, schoolId);
  if (roleNames.size === 0) return {};

  const roles = await prisma.systemRole.findMany({ where: { name: { in: [...roleNames] } } });
  const roleIds = roles.map(r => r.id);
  if (roleIds.length === 0) return {};

  const grants = await prisma.systemRolePermission.findMany({ where: { role_id: { in: roleIds } } });
  const permIds = [...new Set(grants.map(g => g.permission_id))];
  const perms = await prisma.systemPermission.findMany({ where: { id: { in: permIds } } });

  const access: Record<string, 'read' | 'full'> = {};
  for (const p of perms) {
    if (p.action === 'full') access[p.module] = 'full';
    else if (p.action === 'read' && access[p.module] !== 'full') access[p.module] = 'read';
  }
  return access;
}

/**
 * True if ANY of the user's active roles (see getActiveRoleNames) grants
 * the requested module at the requested level or higher.
 *
 * Nothing in this function opens a transaction at all now — system_role,
 * system_permission and system_role_permission are all read via the plain
 * client (system_permission/system_role_permission already had
 * unconditional read policies; system_role's is_system=true rows bypass
 * regardless of context, same reasoning as getActiveRoleNames above).
 */
export async function hasModuleGrant(userId: string, schoolId: string, module: string, minLevel: 'read' | 'full'): Promise<{ granted: boolean; matchedRole?: string }> {
  const roleNames = await getActiveRoleNames(userId, schoolId);
  if (roleNames.size === 0) return { granted: false };

  const roles = await prisma.systemRole.findMany({ where: { name: { in: [...roleNames] } } });
  const roleIds = roles.map(r => r.id);

  const levelsToCheck = minLevel === 'read' ? ['read', 'full'] : ['full'];
  const perms = await prisma.systemPermission.findMany({ where: { module, action: { in: levelsToCheck } } });
  const permIds = perms.map(p => p.id);
  if (permIds.length === 0) return { granted: false };

  const grant = await prisma.systemRolePermission.findFirst({ where: { role_id: { in: roleIds }, permission_id: { in: permIds } } });
  if (!grant) return { granted: false };

  const matchedRole = roles.find(r => r.id === grant.role_id)?.name;
  return { granted: true, matchedRole };
}
