const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const repoRoot=path.resolve(__dirname,'../../..');
const source=r=>fs.readFileSync(path.join(repoRoot,r),'utf8');

const service=source('apps/api/src/modules/school/school.service.ts');
const controller=source('apps/api/src/modules/school/school.controller.ts');
const ui=source('apps/erp/app/schoolx/page.tsx');

test('SchoolX scoped by-ID mutations use trusted transaction context',()=>{
  assert.match(service,/import \{ withTenantContext \} from '\.\.\/\.\.\/lib\/tenantContext'/);
  for(const sig of [
    'archiveAccreditation(schoolId: string, id: string)',
    'updateContact(schoolId: string, id: string',
    'toggleCampus(schoolId: string, id: string',
    'updateCampus(schoolId: string, id: string',
    'updateAccreditation(schoolId: string, id: string',
    'archiveSetting(schoolId: string, id: string)'
  ]) assert.ok(service.includes(sig), sig);
  assert.ok((service.match(/school_id: schoolId/g)||[]).length >= 12);
  assert.ok((service.match(/withTenantContext\(undefined/g)||[]).length >= 6);
});

test('SchoolX controller supplies trusted school context and hides cross-tenant existence',()=>{
  for(const call of [
    'archiveAccreditation(req.schoolId, req.params.accreditationId)',
    'updateContact(req.schoolId, req.params.id, req.body)',
    'toggleCampus(req.schoolId, req.params.id, !!req.body.isActive)',
    'updateCampus(req.schoolId, req.params.id, req.body)',
    'updateAccreditation(req.schoolId, req.params.accreditationId, req.body)',
    'archiveSetting(req.schoolId, req.params.id)'
  ]) assert.ok(controller.includes(call), call);
  assert.ok((controller.match(/error: 'Record not found'/g)||[]).length >= 6);
  assert.doesNotMatch(controller,/getSettingSchoolId/);
});

test('SchoolX profile form does not control lifecycle activation and persists visible official fields',()=>{
  const allowedLine=service.split('\n').find(l=>l.includes('const allowed =')) || '';
  assert.doesNotMatch(allowedLine,/is_active/);
  for(const field of ['short_name','ownership_type','founding_date','founder_name','registration_number','school_type']) assert.ok(ui.includes(field+': school.'+field), field);
  assert.doesNotMatch(ui,/checked=\{!!school\.is_active\}/);
  assert.match(ui,/Lifecycle-managed; not editable from the profile form/);
});

test('SchoolX expiring-within-60-days metric excludes already-expired records',()=>{
  assert.match(service,/const now = new Date\(\);/);
  assert.ok((service.match(/exp >= now && exp <= in60Days/g)||[]).length === 2);
});

test('SchoolX campus create form carries the phone value already supported by the API',()=>{
  assert.match(ui,/value=\{campusForm\.phone\}/);
});
