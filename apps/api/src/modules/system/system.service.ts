import { prisma } from '../../lib/prisma';
import { withTenantContext, TenantCtx } from '../../lib/tenantContext';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

// ═══════════════════════════════════════════════════════════════════════
// STATE MACHINE (EFS-SYS-0032, EEAS-SYS-0021..0025)
// ═══════════════════════════════════════════════════════════════════════

export type UserStatus = 'INVITED' | 'PENDING_VERIFICATION' | 'ACTIVE' | 'LOCKED' | 'SUSPENDED' | 'CLOSED';

const ALLOWED_TRANSITIONS: Record<UserStatus, UserStatus[]> = {
  INVITED: ['PENDING_VERIFICATION', 'CLOSED'],
  PENDING_VERIFICATION: ['ACTIVE', 'CLOSED'],
  ACTIVE: ['LOCKED', 'SUSPENDED', 'CLOSED'],
  LOCKED: ['ACTIVE', 'CLOSED'],
  SUSPENDED: ['ACTIVE', 'CLOSED'],
  CLOSED: [], // terminal — a closed account is not reopened; a new record is issued instead
};

export class InvalidTransitionError extends Error {
  constructor(public currentState: string, public attemptedState: string) {
    super(`Cannot transition from ${currentState} to ${attemptedState}. Allowed: ${ALLOWED_TRANSITIONS[currentState as UserStatus]?.join(', ') || 'none (terminal state)'}`);
    this.name = 'InvalidTransitionError';
  }
}

/**
 * The ONLY function permitted to change system_user.status. Validates the
 * transition, increments row_version, and atomically writes the audit
 * event + outbox event in the same transaction (PDDS-SYS-0010).
 */
export async function transitionUserStatus(
  ctx: TenantCtx,
  userId: string,
  newStatus: UserStatus,
  reason: string,
) {
  return withTenantContext(ctx, async (tx) => {
    const user = await tx.systemUser.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found or not visible in current context');
    const currentStatus = (user as any).status as UserStatus;

    if (!ALLOWED_TRANSITIONS[currentStatus]?.includes(newStatus)) {
      throw new InvalidTransitionError(currentStatus, newStatus);
    }

    const updated = await tx.systemUser.update({
      where: { id: userId },
      data: {
        status: newStatus,
        row_version: { increment: 1 },
        // Keep the legacy boolean fields in sync so existing code paths
        // that still read is_active continue to behave correctly.
        is_active: newStatus === 'ACTIVE',
        archived_at: newStatus === 'CLOSED' ? new Date() : (user as any).archived_at,
      } as any,
    });

    await tx.systemAuditEvent.create({
      data: {
        school_id: ctx.schoolId || null,
        user_id: ctx.userId || null,
        action: `STATUS_TRANSITION:${currentStatus}->${newStatus}`,
        entity_type: 'system_user',
        entity_id: userId,
        before_state: currentStatus,
        after_state: newStatus,
      },
    });

    await emitEvent(tx, {
      aggregateType: 'SystemUser',
      aggregateId: userId,
      eventType: statusEventName(newStatus),
      tenantId: ctx.schoolId,
      correlationId: randomUUID(),
      payload: { priorState: currentStatus, newState: newStatus, reason, actorId: ctx.userId },
    });

    return updated;
  });
}

function statusEventName(status: UserStatus): string {
  switch (status) {
    case 'PENDING_VERIFICATION': return 'UserInvited';
    case 'ACTIVE': return 'UserActivated';
    case 'SUSPENDED': return 'AccountSuspended';
    default: return 'UserStatusChanged';
  }
}

// ═══════════════════════════════════════════════════════════════════════
// EVENT OUTBOX (EEAS-SYS-0026..0030, ETAS-ARC-015)
// ═══════════════════════════════════════════════════════════════════════

interface EmitEventInput {
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  tenantId?: string;
  correlationId: string;
  causationId?: string;
  payload: Record<string, any>;
}

/** Writes a domain event into the outbox within the CALLER's transaction — never opens its own, so it stays atomic with whatever wrote the underlying fact. */
export async function emitEvent(tx: any, input: EmitEventInput) {
  return tx.systemDomainEvent.create({
    data: {
      aggregate_type: input.aggregateType,
      aggregate_id: input.aggregateId,
      event_type: input.eventType,
      tenant_id: input.tenantId || null,
      correlation_id: input.correlationId,
      causation_id: input.causationId || null,
      payload: input.payload,
      status: 'PENDING',
    },
  });
}

// ═══════════════════════════════════════════════════════════════════════
// IDEMPOTENCY (EEAS-SYS-0027, EFS-SYS-0023)
// ═══════════════════════════════════════════════════════════════════════

/**
 * Wraps a command so that retrying the same operationId returns the
 * original result instead of re-executing. Call BEFORE opening your own
 * tenant-context transaction — this does its own bookkeeping transaction
 * around the whole thing.
 */
export async function withIdempotency<T>(
  ctx: TenantCtx,
  operationId: string,
  commandType: string,
  fn: () => Promise<T>,
): Promise<{ result: T; replayed: boolean }> {
  const existing = await prisma.systemCommandLog.findUnique({ where: { operation_id: operationId } });
  if (existing && existing.completed_at) {
    return { result: existing.result_body as any as T, replayed: true };
  }
  if (existing && !existing.completed_at) {
    throw new Error('This operation is already in progress — please wait before retrying.');
  }

  await prisma.systemCommandLog.create({
    data: { operation_id: operationId, tenant_id: ctx.schoolId || null, actor_id: ctx.userId || null, command_type: commandType },
  });

  try {
    const result = await fn();
    await prisma.systemCommandLog.update({
      where: { operation_id: operationId },
      data: { completed_at: new Date(), result_status: 200, result_body: result as any },
    });
    return { result, replayed: false };
  } catch (err: any) {
    await prisma.systemCommandLog.update({
      where: { operation_id: operationId },
      data: { completed_at: new Date(), result_status: 500, result_body: { error: err.message } },
    });
    throw err;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// CORE CRUD — ported from the pre-RLS version, now RLS-aware
// ═══════════════════════════════════════════════════════════════════════

export async function listRoles(ctx: TenantCtx) {
  return withTenantContext(ctx, tx => tx.systemRole.findMany({
    where: { OR: [{ school_id: ctx.schoolId }, { is_system: true }], archived_at: null } as any,
    orderBy: { name: 'asc' },
  }));
}

export async function listPermissions(ctx: TenantCtx) {
  return withTenantContext(ctx, tx => tx.systemPermission.findMany({ orderBy: [{ module: 'asc' }, { action: 'asc' }] }));
}

export async function getRolePermissions(ctx: TenantCtx, roleId: string) {
  return withTenantContext(ctx, async (tx) => {
    const links = await tx.systemRolePermission.findMany({ where: { role_id: roleId } });
    const permissionIds = links.map(l => l.permission_id);
    return tx.systemPermission.findMany({ where: { id: { in: permissionIds } } });
  });
}

export async function listUsers(ctx: TenantCtx) {
  return withTenantContext(ctx, async (tx) => {
    const employments = await prisma.staffEmployment.findMany({ where: { school_id: ctx.schoolId, is_current: true } });
    const staffIds = employments.map(e => e.staff_id);
    const roleIds = [...new Set(employments.map(e => e.role_id))];

    // Sequential, not Promise.all: an interactive transaction is bound to a
    // single database connection, so concurrent queries against the same
    // `tx` don't actually run in parallel — they race on one connection,
    // which Prisma explicitly warns can misbehave or error. The prisma.*
    // calls (sukuux tables, no RLS yet) are safe to run concurrently with
    // each other via the pool, but not interleaved with tx.* calls.
    const allStaffRecords = await prisma.staffStaff.findMany({ where: { id: { in: staffIds } } });
    // Roster entries with no linked login (user_id: null) are not system
    // users — they belong on the roster list, not here. Filtering them
    // out before the lookups below also avoids passing a null into
    // Prisma's `in` filter, which id (a non-nullable String field) can't
    // match against.
    const staffRecords = allStaffRecords.filter(s => s.user_id);
    const roles = await tx.systemRole.findMany({ where: { id: { in: roleIds } } });

    const userIds = staffRecords.map(s => s.user_id!);
    const users = await tx.systemUser.findMany({ where: { id: { in: userIds } } });
    const mfaRecords = await tx.systemMfa.findMany({ where: { user_id: { in: userIds } } });

    await logSensitiveView(ctx, 'system_user', 'LIST');

    return staffRecords.map(staff => {
      const employment = employments.find(e => e.staff_id === staff.id);
      const role = roles.find(r => r.id === employment?.role_id);
      const user: any = users.find(u => u.id === staff.user_id);
      const mfa = mfaRecords.find(m => m.user_id === staff.user_id);
      return {
        id: user?.id || staff.user_id,
        name: `${staff.first_name} ${staff.last_name}`,
        email: user?.email || staff.email,
        phone: user?.phone || staff.phone,
        role: role?.name || null,
        roleLabel: role?.label || null,
        status: user?.status || (user?.is_active ? 'ACTIVE' : 'SUSPENDED'),
        mfa: mfa?.is_enabled || false,
        lastLogin: user?.last_login_at || null,
      };
    });
  });
}

/** Thin compatibility wrapper — routes through the state machine gate rather than writing is_active directly. */
export async function setUserActive(ctx: TenantCtx, userId: string, isActive: boolean) {
  return transitionUserStatus(ctx, userId, isActive ? 'ACTIVE' : 'SUSPENDED', isActive ? 'Reinstated via setUserActive' : 'Suspended via setUserActive');
}

// ═══════════════════════════════════════════════════════════════════════
// STAFF ROSTER — EFS's own primary workflow: create staff profile -> verify
// -> approve appointment -> assign role and department -> activate
// service. "Activate service" — granting a login — is explicitly the LAST
// step, not simultaneous with creating the person. Split accordingly:
// addStaffRosterEntry creates the person + their role/department with no
// login at all; grantSystemAccess links an EXISTING, unlinked roster
// entry to a brand new SystemUser. There is no path that lets someone who
// isn't already a real staff record become a system user.
// ═══════════════════════════════════════════════════════════════════════

export async function listUnlinkedStaff(ctx: TenantCtx) {
  return withTenantContext(ctx, tx => tx.staffStaff.findMany({
    where: { school_id: ctx.schoolId, user_id: null },
    orderBy: { first_name: 'asc' },
  }));
}

export async function addStaffRosterEntry(ctx: TenantCtx, input: {
  firstName: string; lastName: string; gender: string; dateOfBirth: string;
  phone: string; email: string; roleId: string; departmentId?: string;
  employmentType?: string;
}) {
  return withTenantContext(ctx, async (tx) => {
    // Duplicate check belongs here now — this is the moment a person's
    // identity is actually first established in the system, not at
    // login-grant time (EFS-SYS-0017).
    const existing = await tx.staffStaff.findFirst({ where: { school_id: ctx.schoolId, email: input.email } });
    if (existing) throw new Error(`A staff record with email ${input.email} already exists on the roster (id: ${existing.id})`);

    const staff = await tx.staffStaff.create({
      data: {
        school_id: ctx.schoolId, staff_id: `STF-${Date.now().toString(36).toUpperCase()}`,
        user_id: null, first_name: input.firstName, last_name: input.lastName,
        gender: input.gender as any, date_of_birth: input.dateOfBirth,
        phone: input.phone, email: input.email, employment_status: 'ACTIVE',
      } as any,
    });

    await tx.staffEmployment.create({
      data: {
        staff_id: staff.id, school_id: ctx.schoolId, role_id: input.roleId,
        department_id: input.departmentId || null,
        employment_type: (input.employmentType || 'PERMANENT') as any,
        start_date: new Date().toISOString().slice(0, 10), is_current: true,
      },
    });

    await tx.systemAuditEvent.create({
      data: { school_id: ctx.schoolId, user_id: ctx.userId, action: 'ADD_TO_ROSTER', entity_type: 'staff_staff', entity_id: staff.id, after_state: 'ACTIVE, no login' },
    });

    return staff;
  });
}

export async function grantSystemAccess(ctx: TenantCtx, staffId: string, overrideEmail?: string, overrideRoleId?: string) {
  const tempPassword = 'Sukuu@' + Math.random().toString(36).slice(2, 8) + '!';
  const hash = await bcrypt.hash(tempPassword, 12);
  const correlationId = randomUUID();

  const result = await withTenantContext(ctx, async (tx) => {
    const staff = await tx.staffStaff.findUnique({ where: { id: staffId } });
    if (!staff || staff.school_id !== ctx.schoolId) throw new Error('Staff record not found in this school');
    if (staff.user_id) throw new Error(`This person already has system access (user id: ${staff.user_id})`);

    const email = overrideEmail || staff.email;
    const existingUser = await tx.systemUser.findFirst({ where: { email } });
    if (existingUser) throw new Error(`A login already exists for ${email} (id: ${existingUser.id})`);

    const employment = await tx.staffEmployment.findFirst({ where: { staff_id: staff.id, is_current: true } });
    const roleId = overrideRoleId || employment?.role_id;
    if (!roleId) throw new Error('This staff record has no current role/employment on file — set one before granting access');

    const user = await tx.systemUser.create({
      data: {
        email, phone: staff.phone, password_hash: hash,
        is_active: false, is_verified: false,
        failed_login_count: 0, must_reset_password: true,
        status: 'INVITED', row_version: 1,
      } as any,
    });

    await tx.staffStaff.update({ where: { id: staff.id }, data: { user_id: user.id, ...(overrideEmail && { email: overrideEmail }) } });

    await tx.systemUserRole.create({
      data: { user_id: user.id, role_id: roleId, school_id: ctx.schoolId, assigned_at: new Date(), assigned_by: ctx.userId || null },
    });

    await tx.systemAuditEvent.create({
      data: { school_id: ctx.schoolId, user_id: ctx.userId, action: 'GRANT_ACCESS', entity_type: 'system_user', entity_id: user.id, before_state: `staff:${staff.id} (no login)`, after_state: 'INVITED' },
    });

    await emitEvent(tx, {
      aggregateType: 'SystemUser', aggregateId: user.id, eventType: 'UserInvited',
      tenantId: ctx.schoolId, correlationId,
      payload: { email, staffId: staff.id, roleId, invitedBy: ctx.userId },
    });

    return { user, tempPassword, staffName: `${staff.first_name} ${staff.last_name}` };
  });

  return result;
}

export async function listFeatureFlags(ctx: TenantCtx) {
  return withTenantContext(ctx, tx => tx.systemFeatureFlag.findMany({
    where: { OR: [{ school_id: ctx.schoolId }, { school_id: null }] },
    orderBy: { flag_key: 'asc' },
  }));
}

export async function toggleFeatureFlag(ctx: TenantCtx, flagId: string, isEnabled: boolean) {
  return withTenantContext(ctx, async (tx) => {
    const before = await tx.systemFeatureFlag.findUnique({ where: { id: flagId } });
    const updated = await tx.systemFeatureFlag.update({
      where: { id: flagId },
      data: { is_enabled: isEnabled, row_version: { increment: 1 } } as any,
    });
    await tx.systemAuditEvent.create({
      data: { school_id: ctx.schoolId, user_id: ctx.userId, action: 'TOGGLE', entity_type: 'system_feature_flag', entity_id: flagId, before_state: String(before?.is_enabled), after_state: String(isEnabled) },
    });
    await emitEvent(tx, {
      aggregateType: 'SystemFeatureFlag', aggregateId: flagId, eventType: 'FeatureFlagChanged',
      tenantId: ctx.schoolId, correlationId: randomUUID(),
      payload: { flagKey: before?.flag_key, before: before?.is_enabled, after: isEnabled, changedBy: ctx.userId },
    });
    return updated;
  });
}

export async function listAuditEvents(ctx: TenantCtx) {
  return withTenantContext(ctx, tx => tx.systemAuditEvent.findMany({
    where: { school_id: ctx.schoolId },
    orderBy: { created_at: 'desc' },
    take: 100,
  }));
}

export async function listSessions(ctx: TenantCtx, userIds: string[]) {
  return withTenantContext(ctx, tx => tx.systemSession.findMany({
    where: { user_id: { in: userIds }, is_active: true },
    orderBy: { last_activity_at: 'desc' },
  }));
}

export async function revokeSession(ctx: TenantCtx, sessionId: string) {
  return withTenantContext(ctx, async (tx) => {
    const updated = await tx.systemSession.update({
      where: { id: sessionId },
      data: { is_active: false, invalidated_at: new Date() },
    });
    await tx.systemAuditEvent.create({
      data: { school_id: ctx.schoolId, user_id: ctx.userId, action: 'REVOKE', entity_type: 'system_session', entity_id: sessionId },
    });
    await emitEvent(tx, {
      aggregateType: 'SystemSession', aggregateId: sessionId, eventType: 'SessionRevoked',
      tenantId: ctx.schoolId, correlationId: randomUUID(),
      payload: { revokedBy: ctx.userId, userId: updated.user_id },
    });
    return updated;
  });
}

export async function listAuthLog(ctx: TenantCtx, limit = 50) {
  return withTenantContext(ctx, tx => tx.systemAuthenticationLog.findMany({ orderBy: { created_at: 'desc' }, take: limit }));
}

export async function updateUser(ctx: TenantCtx, userId: string, data: {
  firstName?: string; lastName?: string; email?: string; phone?: string;
}) {
  return withTenantContext(ctx, async (tx) => {
    if (data.email || data.phone) {
      await tx.systemUser.update({
        where: { id: userId },
        data: { ...(data.email && { email: data.email }), ...(data.phone && { phone: data.phone }), row_version: { increment: 1 } } as any,
      });
    }
    const staff = await tx.staffStaff.findFirst({ where: { user_id: userId } });
    if (staff) {
      await tx.staffStaff.update({
        where: { id: staff.id },
        data: {
          ...(data.firstName && { first_name: data.firstName }),
          ...(data.lastName && { last_name: data.lastName }),
          ...(data.email && { email: data.email }),
          ...(data.phone && { phone: data.phone }),
        },
      });
    }
    await tx.systemAuditEvent.create({
      data: { school_id: ctx.schoolId, user_id: ctx.userId, action: 'UPDATE', entity_type: 'system_user', entity_id: userId },
    });
  });
}

/** Compatibility wrapper — routes through the state machine gate (CLOSED). */
export async function archiveUser(ctx: TenantCtx, userId: string) {
  return transitionUserStatus(ctx, userId, 'CLOSED', 'Archived via archiveUser');
}

export async function updateRole(ctx: TenantCtx, roleId: string, data: { label?: string; description?: string }) {
  return withTenantContext(ctx, async (tx) => {
    const role = await tx.systemRole.findUnique({ where: { id: roleId } });
    if (role?.is_system) throw new Error('System roles cannot be edited');
    return tx.systemRole.update({ where: { id: roleId }, data: { ...data, row_version: { increment: 1 } } as any });
  });
}

/**
 * Kept at its ORIGINAL positional signature (schoolId, userId, action,
 * entityType, entityId?) — academic.controller.ts, admission.controller.ts,
 * staffx.controller.ts and student.controller.ts all import this directly
 * and call it that way, and none of those modules are in scope for this
 * SystemX pass. The only change from the pre-RLS version is routing the
 * write through withTenantContext, since system_audit_event now has FORCE
 * RLS (Category A, tenant_match) — a plain prisma.systemAuditEvent.create()
 * would be silently rejected by the WITH CHECK clause the moment
 * DATABASE_URL points at the non-owner runtime role. role is left blank
 * since these callers never had a role to pass; the tenant_match policy
 * only needs school_id to line up with the row being inserted, which it
 * always does here, so this still succeeds without the superadmin branch.
 */
export async function logAuditEvent(schoolId: string, userId: string, action: string, entityType: string, entityId?: string) {
  return withTenantContext({ schoolId, userId, role: '' }, tx => tx.systemAuditEvent.create({
    data: { school_id: schoolId, user_id: userId, action, entity_type: entityType, entity_id: entityId },
  })).catch(err => { console.error('[AuditEvent write failed]', err.message); return null; });
}

export async function listUserIdentities(ctx: TenantCtx, userId: string) {
  return withTenantContext(ctx, tx => tx.systemUserIdentity.findMany({ where: { user_id: userId } }));
}
export async function createUserIdentity(ctx: TenantCtx, userId: string, identityType: any, identityId: string) {
  return withTenantContext(ctx, tx => tx.systemUserIdentity.create({ data: { user_id: userId, identity_type: identityType, identity_id: identityId } }));
}

export async function getPasswordPolicy(ctx: TenantCtx) {
  return withTenantContext(ctx, tx => tx.systemPasswordPolicy.findFirst({ where: { school_id: ctx.schoolId } }));
}
export async function upsertPasswordPolicy(ctx: TenantCtx, data: any) {
  return withTenantContext(ctx, async (tx) => {
    const existing = await tx.systemPasswordPolicy.findFirst({ where: { school_id: ctx.schoolId } });
    if (existing) return tx.systemPasswordPolicy.update({ where: { id: existing.id }, data });
    return tx.systemPasswordPolicy.create({ data: { school_id: ctx.schoolId, ...data } });
  });
}

export async function listSecurityPolicies(ctx: TenantCtx) {
  return withTenantContext(ctx, tx => tx.systemSecurityPolicy.findMany({ where: { school_id: ctx.schoolId } }));
}
export async function upsertSecurityPolicy(ctx: TenantCtx, policyName: string, policyValue: string) {
  return withTenantContext(ctx, async (tx) => {
    const existing = await tx.systemSecurityPolicy.findFirst({ where: { school_id: ctx.schoolId, policy_name: policyName } });
    if (existing) return tx.systemSecurityPolicy.update({ where: { id: existing.id }, data: { policy_value: policyValue } });
    return tx.systemSecurityPolicy.create({ data: { school_id: ctx.schoolId, policy_name: policyName, policy_value: policyValue } });
  });
}

export async function listApiKeys(ctx: TenantCtx) {
  return withTenantContext(ctx, tx => tx.systemApiKey.findMany({ where: { school_id: ctx.schoolId } }));
}
export async function createApiKey(ctx: TenantCtx, label: string, scopes: string) {
  const rawKey = 'sk_' + Buffer.from(Math.random().toString(36) + Date.now()).toString('base64').slice(0, 32);
  const hash = await bcrypt.hash(rawKey, 8);
  const created = await withTenantContext(ctx, tx => tx.systemApiKey.create({
    data: { school_id: ctx.schoolId, key_hash: hash, label, scopes, is_active: true, created_by: ctx.userId },
  }));
  return { ...created, rawKey };
}
export async function revokeApiKey(ctx: TenantCtx, id: string) {
  return withTenantContext(ctx, tx => tx.systemApiKey.update({ where: { id }, data: { is_active: false } }));
}

export async function listWebhooks(ctx: TenantCtx) {
  return withTenantContext(ctx, tx => tx.systemWebhook.findMany({ where: { school_id: ctx.schoolId } }));
}
export async function createWebhook(ctx: TenantCtx, url: string, events: string) {
  return withTenantContext(ctx, tx => tx.systemWebhook.create({
    data: { school_id: ctx.schoolId, url, secret: Math.random().toString(36).slice(2), events, is_active: true, created_by: ctx.userId },
  }));
}
export async function toggleWebhook(ctx: TenantCtx, id: string, isActive: boolean) {
  return withTenantContext(ctx, tx => tx.systemWebhook.update({ where: { id }, data: { is_active: isActive } }));
}

// ═══════════════════════════════════════════════════════════════════════
// PERMISSION GRANTS — with maker-checker self-approval prevention
// (EFS-SYS-0008, ESS-SYS-142: named threat "self-approval")
// ═══════════════════════════════════════════════════════════════════════

export async function assignPermission(ctx: TenantCtx, roleId: string, permissionId: string) {
  return withTenantContext(ctx, async (tx) => {
    // Self-grant prevention: an actor cannot grant a permission to a role
    // that is currently assigned only to themselves via a direct 1:1 role,
    // and specifically cannot be the sole approver of their OWN elevation.
    // Concretely: reject if the actor granting the permission is the same
    // person who would be its only current holder through this role.
    //
    // staff_id here is StaffEmployment's FK to StaffStaff.id — NOT the
    // linked login's user_id. Those used to always be equal by
    // construction (the old createUser forced staff.id = user.id), but
    // since staff records can now exist independently of a login (staff
    // roster, decoupled from account creation), that's no longer
    // guaranteed for anyone onboarded through the new flow. Resolve the
    // real user_id explicitly rather than comparing staff_id directly.
    const holders = await prisma.staffEmployment.findMany({ where: { role_id: roleId, is_current: true }, select: { staff_id: true } });
    const holderStaff = await prisma.staffStaff.findMany({ where: { id: { in: holders.map(h => h.staff_id) } }, select: { user_id: true } });
    const holderUserIds = holderStaff.map(s => s.user_id).filter((id): id is string => !!id);
    const permission = await tx.systemPermission.findUnique({ where: { id: permissionId } });
    const isPrivileged = permission?.action === 'full';

    if (isPrivileged && holderUserIds.length === 1 && holderUserIds[0] === ctx.userId) {
      throw new Error('Maker-checker: you cannot grant a privileged permission to a role held only by yourself. Ask another administrator to approve this grant.');
    }

    const grant = await tx.systemRolePermission.create({
      data: { role_id: roleId, permission_id: permissionId, granted_at: new Date(), granted_by: ctx.userId },
    });

    await tx.systemAuditEvent.create({
      data: { school_id: ctx.schoolId, user_id: ctx.userId, action: 'GRANT', entity_type: 'system_role_permission', entity_id: grant.id, after_state: `${roleId}:${permissionId}` },
    });

    await emitEvent(tx, {
      aggregateType: 'SystemRole', aggregateId: roleId, eventType: 'RoleGranted',
      tenantId: ctx.schoolId, correlationId: randomUUID(),
      payload: { permissionId, grantedBy: ctx.userId },
    });

    return grant;
  });
}

export async function removePermission(ctx: TenantCtx, roleId: string, permissionId: string) {
  return withTenantContext(ctx, async (tx) => {
    const link = await tx.systemRolePermission.findFirst({ where: { role_id: roleId, permission_id: permissionId } });
    if (link) {
      await tx.systemRolePermission.delete({ where: { id: link.id } });
      await tx.systemAuditEvent.create({
        data: { school_id: ctx.schoolId, user_id: ctx.userId, action: 'REVOKE', entity_type: 'system_role_permission', entity_id: link.id, before_state: `${roleId}:${permissionId}` },
      });
    }
    return { removed: true };
  });
}

export async function createRole(ctx: TenantCtx, name: string, label: string, description?: string) {
  return withTenantContext(ctx, tx => tx.systemRole.create({
    data: { name, label, description, is_system: false, school_id: ctx.schoolId, row_version: 1 } as any,
  }));
}

// ═══════════════════════════════════════════════════════════════════════
// USER ROLE ASSIGNMENT (multi-role, temporary assignment — EFS-COM-0024,
// EFS-COM-0025). SystemUserRole is now the primary grant mechanism;
// requireModuleAccess checks it live via roleGrants.ts on every request.
// ═══════════════════════════════════════════════════════════════════════

export async function listUserRoleAssignments(ctx: TenantCtx, userId: string) {
  return withTenantContext(ctx, async (tx) => {
    const assignments = await tx.systemUserRole.findMany({
      where: { user_id: userId, school_id: ctx.schoolId },
      orderBy: { assigned_at: 'desc' },
    });
    const roleIds = [...new Set(assignments.map(a => a.role_id))];
    const roles = await tx.systemRole.findMany({ where: { id: { in: roleIds } } });
    const now = new Date();
    return assignments.map(a => {
      const role = roles.find(r => r.id === a.role_id);
      const isExpired = !!(a.expires_at && a.expires_at <= now);
      return { ...a, roleName: role?.name, roleLabel: role?.label, status: isExpired ? 'EXPIRED' : 'ACTIVE' };
    });
  });
}

export async function assignRoleToUser(ctx: TenantCtx, userId: string, roleId: string, expiresAt?: string) {
  return withTenantContext(ctx, async (tx) => {
    // Same self-approval guard as assignPermission: an actor cannot grant
    // a privileged (is_system) role to themselves. Ordinary roles are
    // unaffected — this specifically targets the ESS-named "self-approval"
    // threat for the highest-impact case (elevating your own access).
    const role = await tx.systemRole.findUnique({ where: { id: roleId } });
    if (role?.is_system && userId === ctx.userId) {
      throw new Error('Maker-checker: you cannot assign yourself a system role. Ask another administrator to approve this.');
    }

    const existing = await tx.systemUserRole.findFirst({ where: { user_id: userId, role_id: roleId, school_id: ctx.schoolId } });
    if (existing) throw new Error('This role is already assigned to this user. Revoke the existing assignment first if you want to change its expiry.');

    const assignment = await tx.systemUserRole.create({
      data: {
        user_id: userId, role_id: roleId, school_id: ctx.schoolId,
        assigned_at: new Date(), assigned_by: ctx.userId || null,
        expires_at: expiresAt ? new Date(expiresAt) : null,
      },
    });

    await tx.systemAuditEvent.create({
      data: { school_id: ctx.schoolId, user_id: ctx.userId, action: 'ASSIGN_ROLE', entity_type: 'system_user_role', entity_id: assignment.id, after_state: `user:${userId} role:${roleId}${expiresAt ? ` until:${expiresAt}` : ' (permanent)'}` },
    });

    await emitEvent(tx, {
      aggregateType: 'SystemUser', aggregateId: userId, eventType: 'RoleGranted',
      tenantId: ctx.schoolId, correlationId: randomUUID(),
      payload: { roleId, assignedBy: ctx.userId, expiresAt: expiresAt || null },
    });

    return assignment;
  });
}

/**
 * Revocation is immediate expiry (expires_at = now), not a delete — this
 * keeps the assignment's history intact (who granted it, when, to whom)
 * while making it stop counting toward access on the very next request,
 * consistent with the rest of SystemX's archive-don't-delete pattern.
 */
export async function revokeRoleAssignment(ctx: TenantCtx, assignmentId: string) {
  return withTenantContext(ctx, async (tx) => {
    const assignment = await tx.systemUserRole.findUnique({ where: { id: assignmentId } });
    if (!assignment || assignment.school_id !== ctx.schoolId) throw new Error('Role assignment not found in this context');

    const updated = await tx.systemUserRole.update({ where: { id: assignmentId }, data: { expires_at: new Date() } });

    await tx.systemAuditEvent.create({
      data: { school_id: ctx.schoolId, user_id: ctx.userId, action: 'REVOKE_ROLE', entity_type: 'system_user_role', entity_id: assignmentId, before_state: `user:${assignment.user_id} role:${assignment.role_id}` },
    });

    return updated;
  });
}

/**
 * Admin-driven password reset — works regardless of the target's current
 * status (an ACTIVE user forgetting their password is the normal case,
 * but this also covers re-issuing credentials to someone stuck in
 * INVITED if their original temp password was lost). Does not require
 * the target to log in first or prove anything — that authority comes
 * from the calling admin already having system:full access, checked by
 * requireModuleAccess before this ever runs.
 */
export async function adminResetPassword(ctx: TenantCtx, userId: string) {
  const newTempPassword = 'Sukuu@' + Math.random().toString(36).slice(2, 8) + '!';
  const hash = await bcrypt.hash(newTempPassword, 12);

  return withTenantContext(ctx, async (tx) => {
    const user = await tx.systemUser.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found or not visible in current context');

    await tx.systemUser.update({
      where: { id: userId },
      data: { password_hash: hash, must_reset_password: true, failed_login_count: 0, locked_until: null, row_version: { increment: 1 } } as any,
    });

    await tx.systemAuditEvent.create({
      data: { school_id: ctx.schoolId, user_id: ctx.userId, action: 'ADMIN_RESET_PASSWORD', entity_type: 'system_user', entity_id: userId },
    });

    return { tempPassword: newTempPassword };
  });
}

export async function createFeatureFlag(ctx: TenantCtx, flagKey: string, description?: string) {
  return withTenantContext(ctx, tx => tx.systemFeatureFlag.create({
    data: { flag_key: flagKey, is_enabled: false, school_id: ctx.schoolId, description, row_version: 1 } as any,
  }));
}

export async function getSystemSummary(ctx: TenantCtx) {
  return withTenantContext(ctx, async (tx) => {
    const employments = await prisma.staffEmployment.findMany({ where: { school_id: ctx.schoolId, is_current: true } });
    const rosterFilteredIds = (await prisma.staffStaff.findMany({
      where: { id: { in: employments.map(e => e.staff_id) } },
      select: { user_id: true },
    }));
    // Roster entries can now have a current employment with no linked
    // login yet (addStaffRosterEntry creates the employment immediately,
    // per EFS's own order — role/department assigned before access is
    // granted). Filter those out before building userIds, same reason as
    // the equivalent fix in listUsers: a null in this array can't be
    // matched against id (a non-nullable String field).
    const userIds = rosterFilteredIds.map(s => s.user_id).filter((id): id is string => !!id);

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Sequential — see the comment on listUsers above for why: these all
    // share one transaction-bound connection, so Promise.all here was
    // racing 12 queries against a single connection rather than genuinely
    // parallelizing, which is exactly what broke this endpoint.
    const usersTotal = await tx.systemUser.count({ where: { id: { in: userIds } } });
    const usersActive = await tx.systemUser.count({ where: { id: { in: userIds }, status: 'ACTIVE' } as any });
    const mfaEnabledCount = await tx.systemMfa.count({ where: { user_id: { in: userIds }, is_enabled: true } });
    const roles = await tx.systemRole.count({ where: { OR: [{ school_id: ctx.schoolId }, { is_system: true }] } });
    const flags = await tx.systemFeatureFlag.count({ where: { OR: [{ school_id: ctx.schoolId }, { school_id: null }] } });
    const flagsEnabled = await tx.systemFeatureFlag.count({ where: { OR: [{ school_id: ctx.schoolId }, { school_id: null }], is_enabled: true } });
    const auditLast24h = await tx.systemAuditEvent.count({ where: { school_id: ctx.schoolId, created_at: { gte: oneDayAgo } } });
    const activeSessions = await tx.systemSession.count({ where: { user_id: { in: userIds }, is_active: true } });
    const activeApiKeys = await tx.systemApiKey.count({ where: { school_id: ctx.schoolId, is_active: true } });
    const activeWebhooks = await tx.systemWebhook.count({ where: { school_id: ctx.schoolId, is_active: true } });
    const passwordPolicy = await tx.systemPasswordPolicy.findFirst({ where: { school_id: ctx.schoolId } });
    const pendingEvents = await tx.systemDomainEvent.count({ where: { tenant_id: ctx.schoolId, status: 'PENDING' } });

    return {
      users: { total: usersTotal, active: usersActive, mfaEnabled: mfaEnabledCount },
      roles: { total: roles },
      featureFlags: { total: flags, enabled: flagsEnabled },
      auditEventsLast24h: auditLast24h,
      activeSessions,
      pendingOutboxEvents: pendingEvents,
      security: {
        activeApiKeys,
        activeWebhooks,
        passwordPolicyConfigured: !!passwordPolicy,
      },
    };
  });
}

// ═══════════════════════════════════════════════════════════════════════
// AUDIT-ON-VIEW (EFS-SYS-0039, PDDS-SYS-0020: "record ... privileged reads")
// ═══════════════════════════════════════════════════════════════════════

export async function logSensitiveView(ctx: TenantCtx, entityType: string, entityId: string) {
  return prisma.systemAuditEvent.create({
    data: { school_id: ctx.schoolId || null, user_id: ctx.userId || null, action: 'VIEW', entity_type: entityType, entity_id: entityId },
  }).catch(err => { console.error('[Audit-on-view write failed]', err.message); return null; });
}

// ═══════════════════════════════════════════════════════════════════════
// BULK IMPORT (EFS-SYS-0020: preview -> validate -> error file -> commit)
// ═══════════════════════════════════════════════════════════════════════

export interface BulkUserRow {
  rowNumber: number;
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  roleId: string;
}

export interface BulkRowOutcome {
  rowNumber: number;
  status: 'valid' | 'error' | 'created' | 'skipped' | 'failed';
  errors: string[];
  userId?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_GENDERS = new Set(['MALE', 'FEMALE', 'OTHER']);

/** Validates every row without writing anything. Safe to call repeatedly. */
export async function previewBulkUserImport(ctx: TenantCtx, rows: BulkUserRow[]): Promise<BulkRowOutcome[]> {
  return withTenantContext(ctx, async (tx) => {
    const validRoleIds = new Set((await tx.systemRole.findMany({
      where: { OR: [{ school_id: ctx.schoolId }, { is_system: true }] },
      select: { id: true },
    })).map(r => r.id));

    const emailsInFile = new Map<string, number>();
    const outcomes: BulkRowOutcome[] = [];

    for (const row of rows) {
      const errors: string[] = [];
      if (!row.firstName?.trim()) errors.push('First name is required');
      if (!row.lastName?.trim()) errors.push('Last name is required');
      if (!row.gender?.trim()) errors.push('Gender is required');
      else if (!VALID_GENDERS.has(row.gender.toUpperCase())) errors.push('Gender must be MALE, FEMALE, or OTHER');
      if (!row.dateOfBirth?.trim()) errors.push('Date of birth is required');
      if (!row.phone?.trim()) errors.push('Phone is required');
      if (!row.email?.trim()) errors.push('Email is required');
      else if (!EMAIL_RE.test(row.email)) errors.push('Email format is invalid');
      if (!row.roleId) errors.push('Role is required');
      else if (!validRoleIds.has(row.roleId)) errors.push('Role does not exist or is not available to this school');

      if (row.email) {
        const dupInFile = emailsInFile.get(row.email.toLowerCase());
        if (dupInFile) errors.push(`Duplicate email within this file (also row ${dupInFile})`);
        else emailsInFile.set(row.email.toLowerCase(), row.rowNumber);

        const existingUser = await tx.systemUser.findFirst({ where: { email: row.email } });
        if (existingUser) errors.push(`A login already exists for this email (user ${existingUser.id})`);
        const existingStaff = await tx.staffStaff.findFirst({ where: { school_id: ctx.schoolId, email: row.email } });
        if (existingStaff) errors.push(`This email is already on the staff roster (id: ${existingStaff.id})`);
      }

      outcomes.push({ rowNumber: row.rowNumber, status: errors.length ? 'error' : 'valid', errors });
    }

    return outcomes;
  });
}

/**
 * Re-validates (state may have changed since preview — EFS-SYS-0016/0017)
 * and commits only rows that are still valid. Each row goes through the
 * SAME two real steps as doing it by hand — add to the roster, then grant
 * access — rather than a bulk-only shortcut that would recreate the exact
 * "typed-in phantom person" problem this whole redesign exists to close,
 * just via a different code path. Returns full row-level outcome evidence
 * for both created and skipped/failed rows — this is the "error file"
 * data the UI renders or offers as a download.
 */
export async function commitBulkUserImport(ctx: TenantCtx, rows: BulkUserRow[]): Promise<BulkRowOutcome[]> {
  const preview = await previewBulkUserImport(ctx, rows);
  const validRowNumbers = new Set(preview.filter(p => p.status === 'valid').map(p => p.rowNumber));
  const outcomes: BulkRowOutcome[] = [];
  const batchCorrelationId = randomUUID();

  for (const row of rows) {
    if (!validRowNumbers.has(row.rowNumber)) {
      const pre = preview.find(p => p.rowNumber === row.rowNumber)!;
      outcomes.push({ rowNumber: row.rowNumber, status: 'skipped', errors: pre.errors });
      continue;
    }
    try {
      const staff = await addStaffRosterEntry(ctx, {
        firstName: row.firstName, lastName: row.lastName, gender: row.gender.toUpperCase(),
        dateOfBirth: row.dateOfBirth, phone: row.phone, email: row.email, roleId: row.roleId,
      });
      const { user } = await grantSystemAccess(ctx, staff.id);
      outcomes.push({ rowNumber: row.rowNumber, status: 'created', errors: [], userId: user.id });
    } catch (err: any) {
      outcomes.push({ rowNumber: row.rowNumber, status: 'failed', errors: [err.message] });
    }
  }

  await withTenantContext(ctx, tx => tx.systemAuditEvent.create({
    data: {
      school_id: ctx.schoolId, user_id: ctx.userId, action: 'BULK_IMPORT',
      entity_type: 'system_user', entity_id: batchCorrelationId,
      after_state: JSON.stringify({ total: rows.length, created: outcomes.filter(o => o.status === 'created').length, skipped: outcomes.filter(o => o.status !== 'created').length }),
    },
  }));

  return outcomes;
}

// ═══════════════════════════════════════════════════════════════════════
// SIX NAMED GOVERNED REPORTS (EFS-SYS-0040)
// ═══════════════════════════════════════════════════════════════════════

/** 1. User and role register */
export async function reportUserAndRoleRegister(ctx: TenantCtx) {
  await logSensitiveView(ctx, 'report:user_and_role_register', ctx.schoolId);
  return listUsers(ctx);
}

/** 2. Privileged access review — who holds 'full' grants, via which role */
export async function reportPrivilegedAccessReview(ctx: TenantCtx) {
  return withTenantContext(ctx, async (tx) => {
    await logSensitiveView(ctx, 'report:privileged_access_review', ctx.schoolId);
    const fullPerms = await tx.systemPermission.findMany({ where: { action: 'full' } });
    const permIds = fullPerms.map(p => p.id);
    const grants = await tx.systemRolePermission.findMany({ where: { permission_id: { in: permIds } } });
    const roleIds = [...new Set(grants.map(g => g.role_id))];
    const roles = await tx.systemRole.findMany({ where: { id: { in: roleIds }, OR: [{ school_id: ctx.schoolId }, { is_system: true }] } });
    const employments = await prisma.staffEmployment.findMany({ where: { role_id: { in: roleIds }, school_id: ctx.schoolId, is_current: true } });
    const staff = await prisma.staffStaff.findMany({ where: { id: { in: employments.map(e => e.staff_id) } } });

    return roles.map(role => ({
      roleId: role.id,
      roleName: role.name,
      roleLabel: role.label,
      privilegedPermissions: fullPerms.filter(p => grants.some(g => g.role_id === role.id && g.permission_id === p.id)).map(p => `${p.module}:${p.action}`),
      holders: employments.filter(e => e.role_id === role.id).map(e => {
        const s = staff.find(x => x.id === e.staff_id);
        return s ? `${s.first_name} ${s.last_name}` : e.staff_id;
      }),
    }));
  });
}

/** 3. Active session register */
export async function reportActiveSessionRegister(ctx: TenantCtx) {
  return withTenantContext(ctx, async (tx) => {
    const employments = await prisma.staffEmployment.findMany({ where: { school_id: ctx.schoolId, is_current: true } });
    const staffIds = employments.map(e => e.staff_id);
    const staff = await prisma.staffStaff.findMany({ where: { id: { in: staffIds } } });
    // Roster entries with no linked login yet have no sessions to report —
    // filter before the query rather than pass a null into a non-nullable
    // `in` filter (same fix as listUsers/getSystemSummary above).
    const userIds = staff.map(s => s.user_id).filter((id): id is string => !!id);
    const sessions = await tx.systemSession.findMany({ where: { user_id: { in: userIds }, is_active: true }, orderBy: { last_activity_at: 'desc' } });
    return sessions.map(s => {
      const owner = staff.find(x => x.user_id === s.user_id);
      return { ...s, userName: owner ? `${owner.first_name} ${owner.last_name}` : s.user_id };
    });
  });
}

/** 4. Failed login trend — daily counts over the last 30 days */
export async function reportFailedLoginTrend(ctx: TenantCtx) {
  return withTenantContext(ctx, async (tx) => {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const logs = await tx.systemAuthenticationLog.findMany({
      where: { created_at: { gte: since }, login_status: 'FAILED' },
      orderBy: { created_at: 'asc' },
    }).catch(() => [] as any[]);
    const byDay = new Map<string, number>();
    for (const log of logs) {
      const day = new Date(log.created_at).toISOString().slice(0, 10);
      byDay.set(day, (byDay.get(day) || 0) + 1);
    }
    return Array.from(byDay.entries()).map(([date, count]) => ({ date, failedLogins: count }));
  });
}

/** 5. Feature flag history — reconstructed from the audit trail written by toggleFeatureFlag */
export async function reportFeatureFlagHistory(ctx: TenantCtx) {
  return withTenantContext(ctx, tx => tx.systemAuditEvent.findMany({
    where: { school_id: ctx.schoolId, entity_type: 'system_feature_flag' },
    orderBy: { created_at: 'desc' },
    take: 200,
  }));
}

/** 6. Audit export — filtered raw audit trail for compliance/export use */
export async function reportAuditExport(ctx: TenantCtx, filters: { entityType?: string; action?: string; fromDate?: string; toDate?: string }) {
  return withTenantContext(ctx, async (tx) => {
    await logSensitiveView(ctx, 'report:audit_export', ctx.schoolId);
    return tx.systemAuditEvent.findMany({
      where: {
        school_id: ctx.schoolId,
        ...(filters.entityType && { entity_type: filters.entityType }),
        ...(filters.action && { action: { contains: filters.action } }),
        ...(filters.fromDate || filters.toDate ? {
          created_at: {
            ...(filters.fromDate && { gte: new Date(filters.fromDate) }),
            ...(filters.toDate && { lte: new Date(filters.toDate) }),
          },
        } : {}),
      },
      orderBy: { created_at: 'desc' },
      take: 1000,
    });
  });
}

// ═══════════════════════════════════════════════════════════════════════
// EVENT LOG VIEWER (surfaces the outbox for verification/debugging —
// EUIXS-REQ-0711: every metric/record needs a visible source and freshness)
// ═══════════════════════════════════════════════════════════════════════

export async function listDomainEvents(ctx: TenantCtx, limit = 100) {
  // Not wrapped in withTenantContext: system_domain_event's RLS policy is
  // deliberately permissive (internal plumbing, written by trusted server
  // code after authorization already happened for the underlying action —
  // see 02_rls_and_role.sql section 7). We still scope by tenant_id at the
  // query level so a school only sees its own event history here.
  return prisma.systemDomainEvent.findMany({
    where: ctx.schoolId ? { tenant_id: ctx.schoolId } : {},
    orderBy: { occurred_at: 'desc' },
    take: limit,
  });
}
