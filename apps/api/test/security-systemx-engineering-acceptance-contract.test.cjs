const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../../..');
const src=r=>fs.readFileSync(path.join(root,r),'utf8');

const threat=src('docs/systemx/SYSTEMX_THREAT_MODEL.md');
const playbook=src('docs/systemx/SYSTEMX_INCIDENT_RESPONSE_PLAYBOOK.md');
const acceptance=src('docs/systemx/SYSTEMX_ENGINEERING_ACCEPTANCE.yaml');
const workflow=src('.github/workflows/security-regression.yml');

test('SystemX threat model covers all ESS named primary threats',()=>{
  for(const term of ['Privilege escalation','Self-approval','Account takeover','Delegation abuse','Audit suppression','Tenant-boundary escape','Sensitive export abuse']){
    assert.ok(threat.toLowerCase().includes(term.toLowerCase()),`missing threat ${term}`);
  }
});

test('SystemX threat model preserves provider and tenant authority separation',()=>{
  assert.match(threat,/Tenant Superadmin is not provider Platform Owner/);
  assert.match(threat,/dedicated provider identity plane/);
});

test('SystemX incident playbook preserves evidence and forward-only migration doctrine',()=>{
  assert.match(playbook,/Preserve evidence/);
  assert.match(playbook,/Do not disable RLS/);
  assert.match(playbook,/forward-only corrective migration/);
  assert.match(playbook,/Cross-tenant or RLS failure/);
});

test('SystemX acceptance traceability spans EFS, ETAS, ESS, EUIXS, EEAS and PDDS',()=>{
  for(const term of ['EFS-SYS-0001..0010','ETAS-ERP-004..006','ESS-SYS-141..145','EUIXS-REQ-0720..0725','EEAS','PDDS']){
    assert.ok(acceptance.includes(term),`missing traceability ${term}`);
  }
});

test('SystemX acceptance explicitly separates engineering completion from production authorisation',()=>{
  assert.match(acceptance,/production_authorisation: NOT_GRANTED_BY_ENGINEERING_ACCEPTANCE/);
  assert.match(acceptance,/production_commissioning_holds:/);
  assert.match(acceptance,/representative-user testing/);
  assert.match(acceptance,/deployed API runtime DATABASE_URL proven non-superuser and non-BYPASSRLS/);
});

test('SystemX persistent CI builds both API and ERP before security regression',()=>{
  assert.match(workflow,/Build API/);
  assert.match(workflow,/Build ERP/);
  assert.match(workflow,/Run security regression contracts/);
  assert.ok(workflow.indexOf('Build API')<workflow.indexOf('Run security regression contracts'));
  assert.ok(workflow.indexOf('Build ERP')<workflow.indexOf('Run security regression contracts'));
});


test('SystemX acceptance reconciles AYIVI sovereign PostgreSQL standards without superseding the Blueprints',()=>{
  const threat=src('docs/systemx/SYSTEMX_THREAT_MODEL.md');
  const acceptance=src('docs/systemx/SYSTEMX_ENGINEERING_ACCEPTANCE.yaml');
  for(const code of ['AYV-INF-DOC-001','AYV-DB-STD-001','AYV-DB-MIG-001','AYV-CRI-ARC-001']){
    assert.ok(threat.includes(code),`threat model missing ${code}`);
    assert.ok(acceptance.includes(code),`acceptance missing ${code}`);
  }
  assert.match(acceptance,/do not replace[\s\S]*eight Sukuu Blueprints/i);
  for(const role of ['sukuu_app_runtime','sukuu_migration','sukuu_reporting','sukuu_integration','sukuu_auditor','sukuu_admin']){
    assert.ok(acceptance.includes(role),`missing sovereign role class ${role}`);
  }
  assert.match(threat,/non-superuser, non-BYPASSRLS role/);
  assert.match(acceptance,/high availability and controlled failover/);
  assert.match(acceptance,/WAL archiving and point-in-time recovery/);
  assert.match(acceptance,/positive and negative access tests by role and tenant/);
});
