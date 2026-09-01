const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../../..');
const src=p=>fs.readFileSync(path.join(root,p),'utf8').replace(/\r\n/g,'\n');

const migration=src('packages/database/prisma/migrations/20260901020000_superadmin_name_capture/migration.sql');
const schema=src('packages/database/prisma/schema.prisma');
const authService=src('apps/api/src/modules/auth/auth.service.ts');
const systemService=src('apps/api/src/modules/system/system.service.ts');
const appShell=src('apps/erp/components/AppShell.tsx');

test('SystemUser gains first_name/last_name so Superadmin identity is representable', () => {
  assert.match(schema, /model SystemUser \{[\s\S]*?first_name\s+String\?[\s\S]*?last_name\s+String\?/);
});

test('name capture columns are added without breaking existing rows (nullable, IF NOT EXISTS)', () => {
  assert.match(migration, /ADD COLUMN IF NOT EXISTS first_name text/);
  assert.match(migration, /ADD COLUMN IF NOT EXISTS last_name text/);
});

test('already-activated Superadmins are backfilled from their retained nomination record', () => {
  assert.match(migration, /UPDATE system\.system_user u\s*\nSET first_name = n\.first_name,\s*\n\s*last_name = n\.last_name\s*\nFROM sukuux\.school_delegate_nomination n\s*\nWHERE n\.activated_user_id = u\.id/);
});

test('name capture happens going forward at activation time, not just backfilled once', () => {
  assert.match(migration, /INSERT INTO system\.system_user \(\s*\n\s*id,\s*\n\s*email,\s*\n\s*phone,\s*\n\s*first_name,\s*\n\s*last_name,/);
  assert.match(migration, /v_nomination\.first_name,\s*\n\s*v_nomination\.last_name,/);
});

test('own session presentation (/auth/me) falls back to systemUser name when no staff record exists', () => {
  assert.match(authService, /staff\?\.first_name \|\| user\?\.first_name \|\| null/);
  assert.match(authService, /staff\?\.last_name \|\| user\?\.last_name \|\| null/);
});

test('listUsers includes users with a direct role grant and no staff record (e.g. Superadmin)', () => {
  assert.match(systemService, /directRoleGrants/);
  assert.match(systemService, /systemUserRole\.findMany\(\{\s*\n\s*where: \{ school_id: ctx\.schoolId, user_id: \{ notIn: \[\.\.\.staffUserIdSet\] \} \}/);
  assert.match(systemService, /return \[\.\.\.staffRows, \.\.\.directRows\];/);
});

test('direct-role-grant users get a display name derived from first_name/last_name, falling back to email', () => {
  assert.match(systemService, /name: name \|\| user\.email/);
});

test('sidebar has a My Profile entry available to every user, separate from the gated Admin/SystemX link', () => {
  assert.match(appShell, /navigate\('\/my-profile'\)/);
  assert.match(appShell, />My Profile<\/button>/);
  assert.doesNotMatch(appShell, />Settings<\/button>/);
});

test('the Admin/SystemX link remains gated behind canAccessSystem, unlike My Profile', () => {
  const block = appShell.slice(appShell.indexOf("navigate('/my-profile')") - 20, appShell.indexOf("Sign Out"));
  assert.match(block, /canAccessSystem && <button className="sd-ftn" onClick=\{\(\) => navigate\('\/systemx'\)\}>/);
});
