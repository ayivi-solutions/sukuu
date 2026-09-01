const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repo = path.resolve(__dirname, '..', '..', '..');
const read = rel => fs.readFileSync(path.join(repo, rel), 'utf8');

const router = read('apps/api/src/modules/school/school.router.ts');
const service = read('apps/api/src/modules/school/school.canonical.service.ts');
const migration = read('packages/database/prisma/migrations/20260831124500_schoolx_canonical_capabilities/migration.sql');

test('SX-3 closes the department capability gap', () => {
  assert.match(router, /schoolRouter\.get\('\/departments'/);
  assert.match(router, /schoolRouter\.post\('\/departments'/);
  assert.match(service, /active staff in the same school/);
  assert.match(service, /row_version/);
});

test('SX-3 exposes typed versioned timezone and currency configuration', () => {
  assert.match(router, /\/configuration\/timezone/);
  assert.match(router, /\/configuration\/currency/);
  assert.match(service, /schemaVersion: 1/);
  assert.match(migration, /school_timezone[\s\S]*row_version/);
  assert.match(migration, /school_currency[\s\S]*row_version/);
});

test('legacy flexible settings are read-only and term/subscription writes leave SchoolX', () => {
  assert.doesNotMatch(router, /schoolRouter\.put\('\/settings'/);
  assert.doesNotMatch(router, /schoolRouter\.patch\('\/settings\/:id\/archive'/);
  assert.doesNotMatch(router, /schoolRouter\.put\('\/term-policy'/);
  assert.doesNotMatch(router, /schoolRouter\.patch\('\/subscription'/);
  assert.match(migration, /REVOKE INSERT, UPDATE, DELETE ON TABLE sukuux\.school_settings/);
  assert.match(migration, /REVOKE INSERT, UPDATE, DELETE ON TABLE sukuux\.school_configuration/);
});

test('calendar keeps academic year and term authority in AcademicX', () => {
  assert.match(service, /academics_academic_year/);
  assert.match(service, /academics_term/);
  assert.match(service, /academicYearsAndTerms: 'AcademicX'/);
  assert.match(router, /schoolRouter\.get\('\/calendar'/);
});

test('readiness distinguishes provider activation from full operational readiness', () => {
  assert.match(service, /providerActivationReady/);
  assert.match(service, /operationalReady/);
  assert.match(service, /activationRequired: false/);
  assert.match(migration, /_schoolx_activation_readiness/);
  assert.match(migration, /SchoolX activation readiness is incomplete/);
});

test('canonical SchoolX relations are RLS protected', () => {
  for (const table of ['school_department','school_holiday','school_timezone','school_currency','school_onboarding','school_calendar']) {
    assert.match(migration, new RegExp(`ALTER TABLE sukuux\\.${table} ENABLE ROW LEVEL SECURITY`));
    assert.match(migration, new RegExp(`ALTER TABLE sukuux\\.${table} FORCE ROW LEVEL SECURITY`));
  }
});

test('primary campus uniqueness becomes a database invariant', () => {
  assert.match(migration, /uq_school_campus_primary_active/);
  assert.match(migration, /WHERE is_primary=true AND is_active=true/);
});
