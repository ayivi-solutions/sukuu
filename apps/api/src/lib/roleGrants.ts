import { prisma } from './prisma';
import { withTenantContext } from './tenantContext';

/**
 * Returns the set of role names currently active for this user in this
 * school — checked live, every call, never cached in a JWT. This is the
 * union of two sources, deliberately additive rather than a cutover:
 *
 *   1. SystemUserRole — real multi-role, expiry-aware assignments
 *      (EFS-COM-0024/0025: activation needs approving authority and a
 *      start time; temporary assignment expires automatically).
 *   2. StaffEmployment.role_id — the pre-existing single-role-per-
 *      employment path every current user's access already runs through.
 *
 * Every existing user has zero SystemUserRole rows today (createUser
 * never wrote one), so treating (1) as the only source would silently
 * revoke everyone's access the moment this ships. Keeping (2) as a
 * permanent fallback — not a one-time backfill — means there is no
 * discontinuity moment, and no risk if a future employment change isn't
 * mirrored into SystemUserRole for some reason.
 *
 * system_user_role and system_role both carry FORCE ROW LEVEL SECURITY.
 * Today that's invisible because the app still connects as the table
 * owner, which bypasses RLS regardless of session context — but the
 * queries here are wrapped in withTenantContext anyway, so nothing
 * changes the moment DATABASE_URL is switched to the non-owner runtime
 * role. Passing role: '' is deliberate and correct, not a placeholder —
 * this function's entire job is to DISCOVER what role(s) the caller
 * holds, so there is no role to pass in yet. That's fine: the tenant-
 * match branch of these policies only needs schoolId/userId to be set
 * correctly, and system_role's is_system=true rows (every currently-
 * seeded role) are visible unconditionally regardless of role. A
 * school-defined custom role (is_system=false) would only be visible
 * here once its owning school's context is the one being checked, which
 * is exactly the case this function is always called with.
 */
export async function getActiveRoleNames(userId: string, schoolId: string): Promise<Set<string>> {
  const now = new Date();
  const names = new Set<string>();
  const ctx = { schoolId, userId, role: '' };

  const [userRoles, staff] = await Promise.all([
    withTenantContext(ctx, tx => tx.systemUserRole.findMany({
      where: {
        user_id: userId,
        school_id: schoolId,
        OR: [{ expires_at: null }, { expires_at: { gt: now } }],
      },
    })),
    prisma.staffStaff.findFirst({ where: { user_id: userId } }),
  ]);
  // (Promise.all here is safe — withTenantContext opens its own
  // transaction internally, and the staffStaff call uses the plain,
  // separately-pooled `prisma` client. Neither shares a connection with
  // the other, so this genuinely runs concurrently rather than racing a
  // single connection the way a shared `tx` would.)

  if (userRoles.length > 0) {
    const roleIds = userRoles.map(ur => ur.role_id);
    const roles = await withTenantContext(ctx, tx => tx.systemRole.findMany({ where: { id: { in: roleIds } } }));
    for (const r of roles) names.add(r.name);
  }

  if (staff) {
    const employment = await prisma.staffEmployment.findFirst({ where: { staff_id: staff.id, is_current: true } });
    if (employment) {
      const role = await withTenantContext(ctx, tx => tx.systemRole.findFirst({ where: { id: employment.role_id } }));
      if (role) names.add(role.name);
    }
  }

  return names;
}

/**
 * True if ANY of the user's active roles (see getActiveRoleNames) grants
 * the requested module at the requested level or higher.
 *
 * system_permission and system_role_permission are NOT wrapped in
 * withTenantContext below — both carry an unconditional `using (true)`
 * SELECT policy (they have to: requireModuleAccess reads them on every
 * request across all 24 modules, most of which have no tenant context
 * mechanism at all yet), so a plain prisma call is genuinely safe for
 * those two specifically, not an oversight.
 */
export async function hasModuleGrant(userId: string, schoolId: string, module: string, minLevel: 'read' | 'full'): Promise<{ granted: boolean; matchedRole?: string }> {
  const roleNames = await getActiveRoleNames(userId, schoolId);
  if (roleNames.size === 0) return { granted: false };

  const roles = await withTenantContext({ schoolId, userId, role: '' }, tx => tx.systemRole.findMany({ where: { name: { in: [...roleNames] } } }));
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
