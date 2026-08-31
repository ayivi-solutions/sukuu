const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../../..');
const src=p=>fs.readFileSync(path.join(root,p),'utf8');
const router=src('apps/api/src/modules/school/school.router.ts');
const authz=src('apps/api/src/lib/schoolAuthorization.ts');
const middleware=src('apps/api/src/middleware/requireSchoolAction.ts');
const service=src('apps/api/src/modules/school/school.service.ts');
const schema=src('packages/database/prisma/schema.prisma');
const migration=src('packages/database/prisma/migrations/20260831050000_schoolx_action_lifecycle_foundation/migration.sql');

test('SchoolX router no longer uses read/full module gates',()=>{
  assert.doesNotMatch(router,/requireModuleAccess/);
  assert.match(router,/requireSchoolAction/);
  for(const action of ['view','create','submit','approve','correct','cancel','administer']) assert.ok(router.includes("A('" + action + "'"),action);
});

test('SchoolX exposes the nine explicit controlled actions',()=>{
  for(const action of ['view','create','submit','approve','release','correct','cancel','export','administer']) {
    assert.ok(authz.includes("'" + action + "'"),action);
  }
  assert.match(authz,/module: 'school'/);
  assert.match(middleware,/evaluateSchoolAction/);
});

test('SchoolSchool carries the controlled lifecycle and append-only transition evidence model',()=>{
  for(const field of ['status','row_version','verified_at','verified_by','activated_at','suspended_at','archived_at']) assert.ok(schema.includes(field),field);
  assert.match(schema,/model SchoolLifecycleTransition/);
  assert.match(migration,/school_school_status_check/);
  assert.match(migration,/school_lifecycle_transition/);
});

test('SchoolX lifecycle state machine implements maker-checker and controlled transitions',()=>{
  assert.ok(service.includes("DRAFT: ['UNDER_VERIFICATION', 'ARCHIVED']"));
  assert.ok(service.includes("UNDER_VERIFICATION: ['DRAFT', 'ACTIVE', 'ARCHIVED']"));
  assert.ok(service.includes("if (submission?.actor_id === input.actorId)"));
  assert.match(service,/SchoolMakerCheckerError/);
  assert.match(service,/ProviderSchoolAuthorityRequiredError/);
  assert.ok(service.includes("input.authorityPlane !== 'PROVIDER'"));
  assert.ok(service.includes("row_version: { increment: 1 }"));
  assert.ok(service.includes("row_version: currentVersion"));
  assert.match(service,/SchoolLifecycleConflictError/);
  assert.doesNotMatch(router,/approve-verification/);
});

test('Lifecycle transitions atomically write domain, audit and outbox evidence',()=>{
  assert.match(service,/schoolLifecycleTransition.create/);
  assert.match(service,/schoolAuditLog.create/);
  assert.match(service,/systemAuditEvent.create/);
  assert.match(service,/systemDomainEvent.create/);
});

test('Migration preserves provider-global separation and SchoolX RLS targets',()=>{
  assert.match(migration,/platform_admin received tenant SchoolX authority/);
  assert.match(migration,/FORCE ROW LEVEL SECURITY/);
  assert.match(migration,/school_id = system.ctx_school_id()/);
  assert.doesNotMatch(migration,/DROP TABLE|TRUNCATE|DELETE FROM sukuux.school_school/i);
});
