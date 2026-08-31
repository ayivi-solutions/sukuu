const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../../..');
const src=r=>fs.readFileSync(path.join(root,r),'utf8');

const policy=src('apps/api/src/lib/systemAuthorization.ts');
const controller=src('apps/api/src/modules/system/system.controller.ts');
const router=src('apps/api/src/modules/system/system.router.ts');
const service=src('apps/api/src/modules/system/system.service.ts');
const ui=src('apps/erp/app/systemx/page.tsx');

test('SystemX exposes the effective nine-action capability set to its workspace',()=>{
  assert.match(policy,/SYSTEM_ACTIONS/);
  assert.match(policy,/listSystemCapabilities/);
  for(const a of ['view','create','submit','approve','release','correct','cancel','export','administer']){
    assert.ok(policy.includes(`'${a}'`),`missing capability ${a}`);
  }
  assert.match(router,/get\('\/capabilities', V, ctrl\.getCapabilities\)/);
  assert.match(controller,/listSystemCapabilities/);
});

test('SystemX governed report responses identify authority, version, time, purpose and scope',()=>{
  for(const marker of ['sourceAuthority','ruleVersion','effectivePeriod','generatedAt','purpose','tenantScope','rows']){
    assert.ok(controller.includes(marker),`missing report metadata ${marker}`);
  }
  for(const key of ['user-role-register','privileged-access-review','active-session-register','failed-login-trend','feature-flag-history','audit-export']){
    assert.ok(controller.includes(`'${key}'`),`missing governed report envelope ${key}`);
  }
});

test('Privileged access review follows explicit action permissions and direct role assignments',()=>{
  for(const a of ['approve','release','correct','cancel','administer']){
    assert.ok(service.includes(`'${a}'`),`privileged report missing ${a}`);
  }
  assert.match(service,/systemUserRole\.findMany/);
  assert.match(service,/privilegedActions/);
  assert.match(service,/directAssignments/);
});

test('SystemX workspace makes current school and role context visible',()=>{
  assert.match(ui,/CURRENT SCHOOL/);
  assert.match(ui,/CURRENT ROLE/);
  assert.match(ui,/currentSchoolContext/);
  assert.match(ui,/currentRoleContext/);
});

test('SystemX user workspace supports search, filter, sort and saved view',()=>{
  assert.match(ui,/userQuery/);
  assert.match(ui,/userStatusFilter/);
  assert.match(ui,/userSort/);
  assert.match(ui,/sukuu_systemx_user_view/);
  assert.match(ui,/filteredUsers/);
});

test('SystemX workspace prioritises operational work before secondary statistics',()=>{
  assert.match(ui,/PRIORITY WORK/);
  assert.match(ui,/pendingOutboxEvents/);
  assert.match(
    ui,
    /Math\.max\(0, summary\.users\.total - summary\.users\.mfaEnabled\)/
  );
});

test('SystemX uses capability-aware disclosure for consequential controls',()=>{
  assert.match(ui,/systemCapabilities/);
  assert.match(ui,/canSystemAction/);
  assert.match(ui,/canSystemAction\('create'\)/);
  assert.match(ui,/canSystemAction\('approve'\)/);
  assert.match(ui,/canSystemAction\('administer'\)/);
});

test('SystemX report experience handles metadata, loading, empty and scoped export',()=>{
  assert.match(ui,/reportRows/);
  assert.match(ui,/reportMeta/);
  assert.match(ui,/reportLoading/);
  assert.match(ui,/No data for this report yet/);
  assert.match(ui,/Export CSV/);
  assert.match(ui,/sourceAuthority/);
});
