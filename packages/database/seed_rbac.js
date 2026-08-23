// This script now does ONE thing: bootstrap the very first superadmin
// user + role, for a brand-new deployment that has no users at all yet.
//
// Everything this file used to do beyond that — the permission catalogue,
// the role-to-permission grants, archiving out-of-scope roles — is now
// handled automatically by apps/api/src/lib/rbacSync.ts, which runs on
// every single API server boot. You no longer need to remember to run
// this after a deploy; the running server keeps itself correct. This
// file is kept only for the one thing that should NOT happen
// automatically on every boot: creating a user with a known password.
//
// Safe to run more than once — it checks for an existing superadmin user
// first and does nothing if one is already there.
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function main() {
  let superadminRole = await prisma.systemRole.findFirst({ where: { name: 'superadmin' } });
  if (!superadminRole) {
    superadminRole = await prisma.systemRole.create({
      data: { name: 'superadmin', label: 'Superadmin', description: 'School owner or proprietor - full system access', is_system: true, school_id: null },
    });
    console.log('Created superadmin role');
  } else {
    console.log('superadmin role already exists');
  }

  const existingUser = await prisma.systemUser.findFirst({ where: { email: 'superadmin@presec.edu.gh' } });
  if (existingUser) {
    console.log('Superadmin user already exists — nothing to do. Run the API server to reconcile permissions/roles automatically.');
    return;
  }

  const hash = await bcrypt.hash('Sukuu@Super2026!', 10);
  const user = await prisma.systemUser.create({
    data: {
      email: 'superadmin@presec.edu.gh', password_hash: hash,
      is_active: true, is_verified: true, must_reset_password: false, failed_login_count: 0,
      status: 'ACTIVE', row_version: 1,
    },
  });
  await prisma.systemUserRole.create({
    data: { user_id: user.id, role_id: superadminRole.id, school_id: 'SCH-001', assigned_at: new Date(), assigned_by: null },
  });
  console.log('Created superadmin user: superadmin@presec.edu.gh / Sukuu@Super2026!');
  console.log('Start the API server to seed the permission catalogue and role grants automatically.');
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
