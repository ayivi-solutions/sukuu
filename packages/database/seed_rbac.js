const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

const MODULES = ['system','school','academic','admission','student','staff','schedule','grading','transcript','finance','payroll','notification','communication','attendance'];

const MATRIX = {
  superadmin:    ['F','F','F','F','F','F','F','F','F','F','F','F','F','F'],
  headmaster:    ['F','F','F','F','F','F','F','F','F','F','F','F','F','F'],
  school_admin:  ['N','F','F','F','F','F','F','F','F','F','F','F','F','F'],
  bursar:        ['N','N','N','N','N','N','N','N','N','F','F','N','N','N'],
  hod:           ['N','N','F','N','N','F','F','F','N','N','N','F','F','F'],
  teacher:       ['N','N','F','N','R','N','F','F','N','N','N','F','F','F'],
  registrar:     ['N','N','F','F','F','N','F','F','F','N','N','N','N','F'],
  staff:         ['N','N','N','N','N','N','N','N','N','N','N','F','F','N'],
  student:       ['N','N','N','N','R','N','N','N','R','N','N','N','F','R'],
  parent:        ['N','N','N','N','R','N','N','N','N','N','N','N','F','R'],
};

async function main() {
  let superadminRole = await prisma.systemRole.findFirst({ where: { name: 'superadmin' } });
  if (!superadminRole) {
    superadminRole = await prisma.systemRole.create({ data: { id: 'ROL-010', name: 'superadmin', label: 'Superadmin', description: 'School owner or proprietor - full system access', is_system: true, school_id: null } });
    console.log('Created superadmin role');
  } else console.log('superadmin role already exists');

  let staffRole = await prisma.systemRole.findFirst({ where: { name: 'staff' } });
  if (!staffRole) {
    staffRole = await prisma.systemRole.create({ data: { id: 'ROL-011', name: 'staff', label: 'General Staff', description: 'Non-teaching support staff', is_system: true, school_id: null } });
    console.log('Created staff role');
  } else console.log('staff role already exists');

  const permMap = {};
  for (const mod of MODULES) {
    for (const level of ['full', 'read']) {
      let perm = await prisma.systemPermission.findFirst({ where: { module: mod, action: level, resource: '*' } });
      if (!perm) perm = await prisma.systemPermission.create({ data: { module: mod, action: level, resource: '*', label: `${mod} - ${level}`, description: null } });
      permMap[`${mod}:${level}`] = perm.id;
    }
  }
  console.log('Permissions seeded:', Object.keys(permMap).length);

  const allRoles = await prisma.systemRole.findMany();
  let grantCount = 0;
  for (const [roleName, levels] of Object.entries(MATRIX)) {
    const role = allRoles.find(r => r.name === roleName);
    if (!role) { console.log('SKIP - role not found:', roleName); continue; }
    for (let i = 0; i < MODULES.length; i++) {
      const level = levels[i];
      if (level === 'N') continue;
      const permKey = level === 'F' ? `${MODULES[i]}:full` : `${MODULES[i]}:read`;
      const permId = permMap[permKey];
      const existing = await prisma.systemRolePermission.findFirst({ where: { role_id: role.id, permission_id: permId } });
      if (!existing) {
        await prisma.systemRolePermission.create({ data: { role_id: role.id, permission_id: permId, granted_at: new Date() } });
        grantCount++;
      }
    }
  }
  console.log('Grants created:', grantCount);

  const existingUser = await prisma.systemUser.findFirst({ where: { email: 'superadmin@presec.edu.gh' } });
  if (!existingUser) {
    const hash = await bcrypt.hash('Sukuu@Super2026!', 10);
    const user = await prisma.systemUser.create({ data: { email: 'superadmin@presec.edu.gh', password_hash: hash, is_active: true, is_verified: true, must_reset_password: false, failed_login_count: 0 } });
    await prisma.systemUserRole.create({ data: { user_id: user.id, role_id: superadminRole.id, school_id: 'SCH-001', assigned_at: new Date() } });
    console.log('Created superadmin user: superadmin@presec.edu.gh / Sukuu@Super2026!');
  } else console.log('Superadmin user already exists');
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
