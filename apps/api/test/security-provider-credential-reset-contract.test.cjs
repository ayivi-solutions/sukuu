const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../../..');
const src=p=>fs.readFileSync(path.join(root,p),'utf8');

const migration=src('packages/database/prisma/migrations/20260901010000_provider_credential_reset/migration.sql');
const service=src('apps/api/src/modules/provider/providerCredentialReset.service.ts');
const controller=src('apps/api/src/modules/provider/provider.controller.ts');
const router=src('apps/api/src/modules/provider/provider.router.ts');
const schema=src('packages/database/prisma/schema.prisma');

test('credential reset tables are FORCE-RLS deny-by-default with no ordinary policies, matching provider table convention', () => {
  assert.match(migration, /ALTER TABLE %I\.%I ENABLE ROW LEVEL SECURITY/);
  assert.match(migration, /ALTER TABLE %I\.%I FORCE ROW LEVEL SECURITY/);
  assert.match(migration, /REVOKE ALL ON TABLE %I\.%I FROM PUBLIC/);
  assert.match(migration, /REVOKE ALL ON TABLE %I\.%I FROM sukuu_app_runtime/);
  assert.doesNotMatch(migration, /CREATE POLICY/);
});

test('reset request never discloses whether a matching provider account exists', () => {
  const fn = migration.slice(migration.indexOf('FUNCTION system.provider_credential_reset_request'));
  assert.match(fn, /RETURN jsonb_build_object\('ok', true\);/);
  assert.match(service, /Always returns a generic success message/i);
});

test('a Platform Owner cannot approve or reject their own reset request', () => {
  assert.match(migration, /v_request\.provider_id = p_approver_provider_id THEN\s*\n\s*RETURN jsonb_build_object\('ok',false,'reason','CANNOT_APPROVE_OWN_REQUEST'\)/);
});

test('the same approver cannot decide on the same request twice', () => {
  assert.match(migration, /uq_provider_cred_reset_approval_once/);
  assert.match(migration, /ALREADY_DECIDED/);
});

test('finalization requires two DISTINCT approvals, not one', () => {
  assert.match(migration, /v_approve_count < 2 THEN/);
  assert.match(migration, /count\(\*\) INTO v_approve_count/);
});

test('a single rejection kills the request immediately without needing a second decision', () => {
  const fn = migration.slice(migration.indexOf('FUNCTION system.provider_credential_reset_decide'));
  assert.match(fn, /IF p_decision = 'REJECT' THEN\s*\n\s*UPDATE system\.system_provider_credential_reset_request\s*\n\s*SET status='REJECTED'/);
});

test('finalized approval revokes existing authenticators and reuses the existing bootstrap/registration flow unchanged', () => {
  const fn = migration.slice(migration.indexOf('FUNCTION system.provider_credential_reset_decide'));
  assert.match(fn, /UPDATE system\.system_provider_authenticator\s*\n\s*SET revoked_at=CURRENT_TIMESTAMP/);
  assert.match(fn, /status='PENDING_ENROLLMENT'/);
  assert.match(fn, /bootstrap_token_hash=p_new_bootstrap_token_hash/);
  assert.match(fn, /bootstrap_used_at=NULL/);
});

test('finalized approval invalidates any active provider sessions for the target', () => {
  const fn = migration.slice(migration.indexOf('FUNCTION system.provider_credential_reset_decide'));
  assert.match(fn, /UPDATE system\.system_provider_session\s*\n\s*SET is_active=false, invalidated_at=CURRENT_TIMESTAMP/);
});

test('the raw bootstrap token is never persisted -- only its hash crosses into SQL', () => {
  assert.match(service, /createHash\('sha256'\)\.update\(raw, 'utf8'\)\.digest\('hex'\)/);
  assert.doesNotMatch(service, /INSERT INTO|bootstrap_token_hash\s*=\s*raw/);
});

test('the raw token is returned only on the finalizing APPROVE call, never on a non-finalizing decision', () => {
  assert.match(service, /if \(result\.finalized && result\.outcome === 'APPROVED'\) \{/);
  assert.match(service, /bootstrapToken: token!\.raw/);
});

test('reset request and decision routes are mounted with the correct auth requirements', () => {
  assert.match(router, /providerRouter\.post\(\s*\n\s*'\/credential-reset\/request',\s*\n\s*providerIpLimiter,\s*\n\s*ctrl\.providerCredentialResetRequest\s*\n\s*\);/);
  assert.match(router, /providerRouter\.get\(\s*\n\s*'\/credential-reset\/pending',\s*\n\s*authenticateProvider,\s*\n\s*ctrl\.providerCredentialResetPending\s*\n\s*\);/);
  assert.match(router, /providerRouter\.post\(\s*\n\s*'\/credential-reset\/:requestId\/decide',\s*\n\s*authenticateProvider,\s*\n\s*ctrl\.providerCredentialResetDecide\s*\n\s*\);/);
});

test('the request endpoint is intentionally NOT behind authenticateProvider (the whole point is the requester is locked out)', () => {
  const block = router.slice(
    router.indexOf("'/credential-reset/request'"),
    router.indexOf("ctrl.providerCredentialResetRequest")
  );
  assert.doesNotMatch(block, /authenticateProvider/);
});

test('controller returns 409 on a rejected decision, not a generic 500', () => {
  assert.match(controller, /ProviderCredentialResetDecisionError/);
  assert.match(controller, /res\.status\(409\)/);
});

test('credential reset persistence is represented in the Prisma schema', () => {
  assert.match(schema, /model SystemProviderCredentialResetRequest \{/);
  assert.match(schema, /model SystemProviderCredentialResetApproval \{/);
  assert.match(schema, /@@unique\(\[request_id, approver_provider_id\]/);
});
