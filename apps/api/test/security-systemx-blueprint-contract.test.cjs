const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const repoRoot=path.resolve(__dirname,'../../..');
const source=r=>fs.readFileSync(path.join(repoRoot,r),'utf8');

const service=source('apps/api/src/modules/system/system.service.ts');
const controller=source('apps/api/src/modules/system/system.controller.ts');
const router=source('apps/api/src/modules/system/system.router.ts');
const ui=source('apps/erp/app/systemx/page.tsx');
const workflow=source('.github/workflows/security-regression.yml');

test('SystemX request entry uses authenticated tenant context',()=>{
  assert.match(router,/systemRouter\.use\(\s*authenticate,\s*attachTenantContext\s*\)/);
});
test('SystemX high-risk mutations use action authority plus fresh step-up',()=>{
  assert.match(router,/requireSystemAction/);
  assert.match(router,/const APP = requireSystemAction\('approve'/);
  assert.match(router,/const ADM = requireSystemAction\('administer'/);
  assert.match(router,/const S = requireStepUp/);
  for(const r of ['/users/:userId/suspend','/users/:userId/reinstate','/users/:userId/status','/users/:userId/reset-password','/sessions/:sessionId/revoke']) assert.ok(router.includes(r));
});
test('SystemX implements Blueprint lifecycle, audit, events and idempotency',()=>{
  for(const s of ['INVITED','PENDING_VERIFICATION','ACTIVE','LOCKED','SUSPENDED','CLOSED']) assert.ok(service.includes(s));
  assert.match(service,/ALLOWED_TRANSITIONS/);
  assert.match(service,/row_version:\s*\{\s*increment:\s*1\s*\}/);
  assert.match(service,/systemAuditEvent\.create/);
  assert.match(service,/systemDomainEvent\.create/);
  assert.match(service,/withIdempotency/);
  assert.match(service,/systemCommandLog/);
});
test('SystemX exposes the six EFS-SYS-0040 governed reports in API and UI',()=>{
  for(const r of ['user-role-register','privileged-access-review','active-session-register','failed-login-trend','feature-flag-history','audit-export']){
    assert.ok(router.includes('/reports/'+r));
    assert.ok(ui.includes(r));
  }
});
test('SystemX controller does not disclose raw exception text',()=>{
  assert.doesNotMatch(controller,/err\.message/);
  assert.match(controller,/error:\s*'Request failed'/);
  assert.match(controller,/error:\s*'Invalid state transition'/);
});
test('SystemX UI carries core operational workspaces',()=>{
  for(const x of ['Users','Roles & Permissions','Feature Flags','Audit Log','Sessions','Security','Bulk Import','Reports','Event Log']) assert.ok(ui.includes(x));
});
test('CI generates and validates authoritative Prisma schema before API build',()=>{
  assert.match(workflow,/Generate Prisma client/);
  assert.match(workflow,/prisma generate --schema=packages\/database\/prisma\/schema\.prisma/);
  assert.match(workflow,/Validate Prisma schema/);
  assert.ok(workflow.indexOf('Generate Prisma client')<workflow.indexOf('Build API'));
});
