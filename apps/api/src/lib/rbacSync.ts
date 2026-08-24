import { prisma } from './prisma';
import { withTenantContext } from './tenantContext';

// Order: [system,school,academic,admission,student,staff,schedule,grading,transcript,finance,payroll,notification,communication,attendance,
//         exam,learn,discipline,hostel,clinic,library,transport,inventory,workflow,analytics] -- 24 modules total, matching the ECD's 24-module ERP register.
const MODULES = ['system','school','academic','admission','student','staff','schedule','grading','transcript','finance','payroll','notification','communication','attendance','exam','learn','discipline','hostel','clinic','library','transport','inventory','workflow','analytics'];

// ERP scope is staff/employee/internal users only (per direction: parent
// and student access belongs to the future App product, not the ERP).
// EFS-COM-0020 lists "guardian" and "learner" as real role families in the
// enterprise-wide model, so this isn't a deviation from the spec — it's
// recognizing their access POINT is the App, not this login system.
const OUT_OF_SCOPE_ROLES = ['parent', 'student'];

type Level = 'F' | 'R' | 'N';

const MATRIX: Record<string, Level[]> = {
  superadmin:       ['F','F','F','F','F','F','F','F','F','F','F','F','F','F', 'F','F','F','F','F','F','F','F','F','F'],
  headmaster:       ['R','F','F','F','F','F','F','F','F','F','F','F','F','F', 'F','F','F','F','F','F','F','F','F','F'],
  school_admin:     ['N','F','F','F','F','F','F','F','F','F','F','F','F','F', 'F','F','F','F','F','F','F','F','F','F'],
  bursar:           ['N','N','N','N','N','N','N','N','N','F','F','N','N','N', 'N','N','N','N','N','N','N','F','N','N'],
  hod:              ['N','N','F','N','N','F','F','F','N','N','N','F','F','F', 'F','F','N','N','N','N','N','N','N','R'],
  teacher:          ['N','N','F','N','R','N','F','F','N','N','N','F','F','F', 'F','F','R','N','N','R','N','N','N','N'],
  registrar:        ['N','N','F','F','F','N','F','F','F','N','N','N','N','F', 'F','N','F','F','N','N','F','N','N','N'],
  staff:            ['N','N','N','N','N','N','N','N','N','N','N','F','F','N', 'N','N','N','F','F','F','F','F','F','N'],
  auditor:          ['R','N','N','N','N','N','N','N','N','N','N','N','N','N', 'N','N','N','N','N','N','N','N','N','N'],
  support_operator: ['R','N','N','N','N','N','N','N','N','N','N','N','N','N', 'N','N','N','N','N','N','N','N','N','N'],
};

const SELF_CREATED_ROLES: { name: string; label: string; description: string }[] = [
  { name: 'superadmin', label: 'Superadmin', description: 'Tenant owner, proprietor, governing authority or formally delegated authority - highest governance authority within one tenant' },
  { name: 'staff', label: 'General Staff', description: 'Non-teaching support staff' },
  { name: 'auditor', label: 'Auditor', description: 'Read-only review of system records, audit trail and security policy - named actor in ESS-SYS-141' },
  { name: 'support_operator', label: 'Support Operator', description: 'Read-only support/diagnosis access - named actor in ESS-SYS-141' },
];

/**
 * Transitional Stage 3B bootstrap context only.
 *
 * IMPORTANT:
 *   - superadmin is the highest authority WITHIN one tenant.
 *   - superadmin is NOT an Ayivi/provider platform identity.
 *   - this context must not be treated as platform authority.
 *
 * The legacy reconciliation routine is disabled by default below.
 * Phase 2C/2D introduces the dedicated privileged platform identity
 * and Phase 2E removes legacy actor-role RLS authority completely.
 */
const TRANSITIONAL_TENANT_ADMIN_CTX = {
  schoolId: '',
  userId: '',
  role: 'superadmin',
};

export interface RbacSyncSummary {
  rolesCreated: number;
  rolesMissing: string[];
  permissionsSeeded: number;
  grantsCreated: number;
  rolesArchived: number;
  grantsRevokedForArchivedRoles: number;
  employmentGrantsBackfilled: number;
}

/**
 * Runs the full RBAC reconciliation: role catalogue, permission catalogue,
 * grants, out-of-scope role archival, and the StaffEmployment ->
 * SystemUserRole backfill. Every step is a create-if-missing upsert or an
 * explicit existence check first, so this is safe to call on every single
 * server boot — including ones where nothing changed — the way Nexus
 * EFOS's syncPermissionsAndRoles does it. This replaces "remember to run
 * seed_rbac.js after every deploy" with "it's always correct."
 *
 * Deliberately does NOT create the bootstrap superadmin user — that stays
 * a manual, one-time step in seed_rbac.js, not something that runs
 * automatically with a known password on every server start.
 */
export async function syncRbac(): Promise<RbacSyncSummary> {
  if (process.env.ALLOW_TRANSITIONAL_RBAC_SYNC !== 'true') {
    throw new Error(
      'Legacy RBAC reconciliation is disabled during Stage 3B privileged-authority remediation.'
    );
  }

  const summary: RbacSyncSummary = {
    rolesCreated: 0, rolesMissing: [], permissionsSeeded: 0, grantsCreated: 0,
    rolesArchived: 0, grantsRevokedForArchivedRoles: 0, employmentGrantsBackfilled: 0,
  };

  // 1. Self-created system roles
  for (const r of SELF_CREATED_ROLES) {
    const existing = await withTenantContext(TRANSITIONAL_TENANT_ADMIN_CTX, tx => tx.systemRole.findFirst({ where: { name: r.name } }));
    if (!existing) {
      await withTenantContext(TRANSITIONAL_TENANT_ADMIN_CTX, tx => tx.systemRole.create({
        data: { name: r.name, label: r.label, description: r.description, is_system: true, school_id: null } as any,
      }));
      summary.rolesCreated++;
    }
  }

  // 2. Permission catalogue (system_permission has an unconditional read
  //    policy but an admin-only write policy — reads are fine as plain
  //    prisma, the create() calls still need platform context)
  const permMap: Record<string, string> = {};
  for (const mod of MODULES) {
    for (const level of ['full', 'read']) {
      let perm = await prisma.systemPermission.findFirst({ where: { module: mod, action: level, resource: '*' } });
      if (!perm) {
        perm = await withTenantContext(TRANSITIONAL_TENANT_ADMIN_CTX, tx => tx.systemPermission.create({
          data: { module: mod, action: level, resource: '*', label: `${mod} - ${level}`, description: null },
        }));
        summary.permissionsSeeded++;
      }
      permMap[`${mod}:${level}`] = perm.id;
    }
  }

  // 3. Grants from MATRIX (system_role_permission: same read-open,
  //    write-admin-only shape as system_permission)
  const allRoles = await withTenantContext(TRANSITIONAL_TENANT_ADMIN_CTX, tx => tx.systemRole.findMany());
  for (const [roleName, levels] of Object.entries(MATRIX)) {
    const role = allRoles.find(r => r.name === roleName);
    if (!role) { summary.rolesMissing.push(roleName); continue; }
    for (let i = 0; i < MODULES.length; i++) {
      const level = levels[i];
      if (level === 'N') continue;
      const permKey = level === 'F' ? `${MODULES[i]}:full` : `${MODULES[i]}:read`;
      const permId = permMap[permKey];
      const existing = await prisma.systemRolePermission.findFirst({ where: { role_id: role.id, permission_id: permId } });
      if (!existing) {
        await withTenantContext(TRANSITIONAL_TENANT_ADMIN_CTX, tx => tx.systemRolePermission.create({
          data: { role_id: role.id, permission_id: permId, granted_at: new Date() },
        }));
        summary.grantsCreated++;
      }
    }
  }

  // 4. Archive out-of-scope roles and revoke their grants (CRUAA — archive,
  //    never hard-delete the role row itself; grants are junction rows,
  //    safe to actually remove since they're relationships, not records).
  for (const roleName of OUT_OF_SCOPE_ROLES) {
    const role = allRoles.find(r => r.name === roleName);
    if (!role || (role as any).archived_at) continue;
    await withTenantContext(TRANSITIONAL_TENANT_ADMIN_CTX, tx => tx.systemRole.update({ where: { id: role.id }, data: { archived_at: new Date() } as any }));
    summary.rolesArchived++;
    const revoked = await withTenantContext(TRANSITIONAL_TENANT_ADMIN_CTX, tx => tx.systemRolePermission.deleteMany({ where: { role_id: role.id } }));
    summary.grantsRevokedForArchivedRoles += revoked.count;
  }

  // 5. Backfill: every current employment gets a matching SystemUserRole
  //    if one doesn't already exist. Purely additive — never removes or
  //    changes an existing grant, so a role assigned through the new
  //    management UI is never silently overwritten by this running again.
  //    system_user_role's tenant_match policy needs school_id to line up
  //    with each specific employment's own school, but role: 'superadmin'
  //    bypasses that regardless — same platform-trust reasoning as above.
  const employments = await prisma.staffEmployment.findMany({ where: { is_current: true } });
  for (const emp of employments) {
    const staff = await prisma.staffStaff.findUnique({ where: { id: emp.staff_id } });
    if (!staff || !staff.user_id) continue; // roster entry with no login yet — nothing to grant
    const existing = await withTenantContext(TRANSITIONAL_TENANT_ADMIN_CTX, tx => tx.systemUserRole.findFirst({
      where: { user_id: staff.user_id!, role_id: emp.role_id, school_id: emp.school_id },
    }));
    if (!existing) {
      await withTenantContext(TRANSITIONAL_TENANT_ADMIN_CTX, tx => tx.systemUserRole.create({
        data: { user_id: staff.user_id!, role_id: emp.role_id, school_id: emp.school_id, assigned_at: new Date(), assigned_by: null },
      }));
      summary.employmentGrantsBackfilled++;
    }
  }

  return summary;
}
