const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../../..');
const src=r=>fs.readFileSync(path.join(root,r),'utf8');

const policy=src('apps/api/src/lib/systemAuthorization.ts');
const middleware=src('apps/api/src/middleware/requireSystemAction.ts');
const router=src('apps/api/src/modules/system/system.router.ts');
const service=src('apps/api/src/modules/system/system.service.ts');
const migration=src('packages/database/prisma/migrations/20260830200000_systemx_action_permission_catalog/migration.sql');

test('SystemX has nine explicit Blueprint action permissions',()=>{
  for(const a of ['view','create','submit','approve','release','correct','cancel','export','administer']){
    assert.ok(policy.includes(`'${a}'`),`missing action ${a}`);
    assert.ok(migration.includes(`'${a}'`),`migration missing action ${a}`);
  }
});
test('SystemX action decision resolves live roles and explicit permission grants',()=>{
  assert.match(policy,/getActiveRoleNames/);
  assert.match(policy,/systemPermission\.findMany/);
  assert.match(policy,/systemRolePermission\.findFirst/);
  assert.match(policy,/purpose\.trim/);
  assert.match(policy,/DENY_ACTION_PERMISSION/);
});
test('SystemX routes no longer infer consequential authority from read/full visibility',()=>{
  assert.doesNotMatch(router,/requireModuleAccess/);
  assert.match(router,/const V = requireSystemAction\('view'/);
  assert.match(router,/const SUB = requireSystemAction\('submit'/);
  assert.match(router,/const APP = requireSystemAction\('approve'/);
  assert.match(router,/const EXP = requireSystemAction\('export'/);
  assert.match(router,/const ADM = requireSystemAction\('administer'/);
  assert.match(router,/post\('\/users\/bulk\/commit', APP, S/);
});
test('SystemX denial uses stable non-sensitive policy codes',()=>{
  assert.match(middleware,/error: 'Action not permitted'/);
  assert.match(middleware,/code: decision\.code/);
  assert.doesNotMatch(middleware,/err\.message/);
});
test('SystemX blocks administrative self-state change',()=>{
  assert.match(service,/administrative status changes require another authorised actor/);
});
test('SystemX blocks administrative self-password reset',()=>{
  assert.match(service,/use the self-service credential flow for your own password/);
});
test('SystemX permission maker-checker includes direct and employment role holders',()=>{
  assert.match(service,/systemUserRole\.findMany/);
  assert.match(service,/holderUserIds\.has\(ctx\.userId\)/);
  assert.match(service,/PRIVILEGED_PERMISSION_ACTIONS/);
});
test('SystemX self-role assignment evaluates the permissions carried by the target role',()=>{
  assert.match(service,/roleCarriesPrivilegedPermission/);
  assert.match(service,/you cannot assign yourself a privileged role/);
});
test('SystemX migration separates headmaster from tenant-governance administration',()=>{
  assert.match(migration,/p\.action IN \('view','approve','release','export'\)/);
  assert.match(migration,/headmaster received tenant-governance actions/);
});
