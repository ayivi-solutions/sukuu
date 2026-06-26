import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
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

export async function listUsers(schoolId: string) {
  const employments = await prisma.staffEmployment.findMany({ where: { school_id: schoolId, is_current: true } });
  const staffIds = employments.map(e => e.staff_id);
  const roleIds = [...new Set(employments.map(e => e.role_id))];

  const [staffRecords, roles] = await Promise.all([
    prisma.staffStaff.findMany({ where: { id: { in: staffIds } } }),
    prisma.systemRole.findMany({ where: { id: { in: roleIds } } }),
  ]);

  const userIds = staffRecords.map(s => s.user_id);
  const [users, mfaRecords] = await Promise.all([
    prisma.systemUser.findMany({ where: { id: { in: userIds } } }),
    prisma.systemMfa.findMany({ where: { user_id: { in: userIds } } }),
  ]);

  return staffRecords.map(staff => {
    const employment = employments.find(e => e.staff_id === staff.id);
    const role = roles.find(r => r.id === employment?.role_id);
    const user = users.find(u => u.id === staff.user_id);
    const mfa = mfaRecords.find(m => m.user_id === staff.user_id);
    return {
      id: user?.id || staff.user_id,
      name: `${staff.first_name} ${staff.last_name}`,
      email: user?.email || staff.email,
      phone: user?.phone || staff.phone,
      role: role?.name || null,
      roleLabel: role?.label || null,
      status: user?.is_active ? 'ACTIVE' : 'SUSPENDED',
      mfa: mfa?.is_enabled || false,
      lastLogin: user?.last_login_at || null,
    };
  });
}

export async function setUserActive(userId: string, isActive: boolean) {
  return prisma.systemUser.update({ where: { id: userId }, data: { is_active: isActive } });
}

export async function createUser(schoolId: string, input: {
  firstName: string; lastName: string; email: string; phone?: string; roleId: string; assignedBy: string;
}) {
  const tempPassword = 'Sukuu@' + Math.random().toString(36).slice(2, 8) + '!';
  const hash = await bcrypt.hash(tempPassword, 12);

  const user = await prisma.systemUser.create({
    data: {
      email: input.email, phone: input.phone, password_hash: hash,
      is_active: true, is_verified: false,
      failed_login_count: 0, must_reset_password: true,
    },
  });

  await prisma.staffStaff.create({
    data: {
      id: user.id, school_id: schoolId, staff_id: user.id, user_id: user.id,
      first_name: input.firstName, last_name: input.lastName,
      gender: 'OTHER', date_of_birth: '2000-01-01',
      phone: input.phone || '', email: input.email,
      employment_status: 'ACTIVE',
    },
  });

  await prisma.staffEmployment.create({
    data: {
      staff_id: user.id, school_id: schoolId, role_id: input.roleId,
      employment_type: 'PERMANENT', start_date: new Date().toISOString().slice(0, 10),
      is_current: true,
    },
  });

  return { user, tempPassword };
}

export async function listFeatureFlags(schoolId: string) {
  return prisma.systemFeatureFlag.findMany({
    where: { OR: [{ school_id: schoolId }, { school_id: null }] },
    orderBy: { flag_key: 'asc' },
  });
}

export async function toggleFeatureFlag(flagId: string, isEnabled: boolean) {
  return prisma.systemFeatureFlag.update({ where: { id: flagId }, data: { is_enabled: isEnabled } });
}

export async function listAuditEvents(schoolId: string) {
  return prisma.systemAuditEvent.findMany({
    where: { school_id: schoolId },
    orderBy: { created_at: 'desc' },
    take: 100,
  });
}

export async function listSessions(userIds: string[]) {
  return prisma.systemSession.findMany({
    where: { user_id: { in: userIds }, is_active: true },
    orderBy: { last_activity_at: 'desc' },
  });
}

export async function revokeSession(sessionId: string) {
  return prisma.systemSession.update({
    where: { id: sessionId },
    data: { is_active: false, invalidated_at: new Date() },
  });
}

export async function listAuthLog(limit = 50) {
  return prisma.systemAuthenticationLog.findMany({ orderBy: { created_at: 'desc' }, take: limit });
}

export async function updateUser(userId: string, data: {
  firstName?: string; lastName?: string; email?: string; phone?: string;
}) {
  if (data.email || data.phone) {
    await prisma.systemUser.update({
      where: { id: userId },
      data: { ...(data.email && { email: data.email }), ...(data.phone && { phone: data.phone }) },
    });
  }
  const staff = await prisma.staffStaff.findFirst({ where: { user_id: userId } });
  if (staff) {
    await prisma.staffStaff.update({
      where: { id: staff.id },
      data: {
        ...(data.firstName && { first_name: data.firstName }),
        ...(data.lastName && { last_name: data.lastName }),
        ...(data.email && { email: data.email }),
        ...(data.phone && { phone: data.phone }),
      },
    });
  }
}

export async function archiveUser(userId: string) {
  return prisma.systemUser.update({
    where: { id: userId },
    data: { is_active: false, archived_at: new Date() },
  });
}

export async function updateRole(roleId: string, data: { label?: string; description?: string }) {
  const role = await prisma.systemRole.findUnique({ where: { id: roleId } });
  if (role?.is_system) throw new Error('System roles cannot be edited');
  return prisma.systemRole.update({ where: { id: roleId }, data });
}

export async function logAuditEvent(schoolId: string, userId: string, action: string, entityType: string, entityId?: string) {
  return prisma.systemAuditEvent.create({
    data: { school_id: schoolId, user_id: userId, action, entity_type: entityType, entity_id: entityId },
  }).catch(err => { console.error("[AuditEvent write failed]", err.message); return null; });
}

// User identities
export async function listUserIdentities(userId: string) {
  return prisma.systemUserIdentity.findMany({ where: { user_id: userId } });
}
export async function createUserIdentity(userId: string, identityType: any, identityId: string) {
  return prisma.systemUserIdentity.create({ data: { user_id: userId, identity_type: identityType, identity_id: identityId } });
}

// Password policy (single row per school)
export async function getPasswordPolicy(schoolId: string) {
  return prisma.systemPasswordPolicy.findFirst({ where: { school_id: schoolId } });
}
export async function upsertPasswordPolicy(schoolId: string, data: any) {
  const existing = await prisma.systemPasswordPolicy.findFirst({ where: { school_id: schoolId } });
  if (existing) return prisma.systemPasswordPolicy.update({ where: { id: existing.id }, data });
  return prisma.systemPasswordPolicy.create({ data: { school_id: schoolId, ...data } });
}

// Security policies (key/value per school)
export async function listSecurityPolicies(schoolId: string) {
  return prisma.systemSecurityPolicy.findMany({ where: { school_id: schoolId } });
}
export async function upsertSecurityPolicy(schoolId: string, policyName: string, policyValue: string) {
  const existing = await prisma.systemSecurityPolicy.findFirst({ where: { school_id: schoolId, policy_name: policyName } });
  if (existing) return prisma.systemSecurityPolicy.update({ where: { id: existing.id }, data: { policy_value: policyValue } });
  return prisma.systemSecurityPolicy.create({ data: { school_id: schoolId, policy_name: policyName, policy_value: policyValue } });
}

// API keys
export async function listApiKeys(schoolId: string) {
  return prisma.systemApiKey.findMany({ where: { school_id: schoolId } });
}
export async function createApiKey(schoolId: string, label: string, scopes: string, createdBy: string) {
  const rawKey = 'sk_' + Buffer.from(Math.random().toString(36) + Date.now()).toString('base64').slice(0, 32);
  const hash = await bcrypt.hash(rawKey, 8);
  const created = await prisma.systemApiKey.create({
    data: { school_id: schoolId, key_hash: hash, label, scopes, is_active: true, created_by: createdBy },
  });
  return { ...created, rawKey };
}
export async function revokeApiKey(id: string) {
  return prisma.systemApiKey.update({ where: { id }, data: { is_active: false } });
}

// Webhooks
export async function listWebhooks(schoolId: string) {
  return prisma.systemWebhook.findMany({ where: { school_id: schoolId } });
}
export async function createWebhook(schoolId: string, url: string, events: string, createdBy: string) {
  return prisma.systemWebhook.create({ data: { school_id: schoolId, url, secret: Math.random().toString(36).slice(2), events, is_active: true, created_by: createdBy } });
}
export async function toggleWebhook(id: string, isActive: boolean) {
  return prisma.systemWebhook.update({ where: { id }, data: { is_active: isActive } });
}

// Role-permission assignment
export async function assignPermission(roleId: string, permissionId: string, grantedBy: string) {
  return prisma.systemRolePermission.create({ data: { role_id: roleId, permission_id: permissionId, granted_at: new Date(), granted_by: grantedBy } });
}
export async function removePermission(roleId: string, permissionId: string) {
  const link = await prisma.systemRolePermission.findFirst({ where: { role_id: roleId, permission_id: permissionId } });
  if (link) await prisma.systemRolePermission.delete({ where: { id: link.id } });
  return { removed: true };
}
