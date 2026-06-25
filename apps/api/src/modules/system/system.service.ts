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
