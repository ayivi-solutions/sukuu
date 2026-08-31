const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const path = require('node:path');

const apiRoot =
  path.resolve(
    __dirname,
    '..'
  );

const repoRoot =
  path.resolve(
    apiRoot,
    '../..'
  );

function read(relative) {
  return fs.readFileSync(
    path.join(
      repoRoot,
      relative
    ),
    'utf8'
  );
}

const migration = read(
  'packages/database/prisma/migrations/20260831082000_schoolx_provider_authority_delegate_handoff/migration.sql'
);
const authService = read(
  'apps/api/src/modules/provider/providerAuth.service.ts'
);
const delegateService = read(
  'apps/api/src/modules/provider/providerDelegate.service.ts'
);
const schoolService = read(
  'apps/api/src/modules/provider/providerSchool.service.ts'
);
const router = read(
  'apps/api/src/modules/provider/provider.router.ts'
);
const middleware = read(
  'apps/api/src/middleware/authenticateProvider.ts'
);
const transport = read(
  'apps/api/src/lib/providerBrowserTransport.ts'
);
const context = read(
  'apps/api/src/lib/providerContext.ts'
);
const index = read(
  'apps/api/src/index.ts'
);
const schema = read(
  'packages/database/prisma/schema.prisma'
);
const apiPackage =
  JSON.parse(read('apps/api/package.json'));
const lock =
  JSON.parse(read('package-lock.json'));

test('provider authority is physically separate from tenant authority', () => {
  assert.match(
    migration,
    /system_provider_identity/
  );
  assert.match(
    migration,
    /system_provider_session/
  );
  assert.match(
    migration,
    /platform_admin must not have a tenant user-role grant/
  );
  assert.match(
    migration,
    /v_platform_grants <> 0/
  );
  assert.doesNotMatch(
    context,
    /schoolId/
  );
  assert.match(
    context,
    /app\.provider_session_id/
  );
  assert.match(
    context,
    /provider:.*sessionId.*providerId/s
  );
});

test('provider browser session is cookie-only and CSRF/origin-bound', () => {
  assert.match(
    transport,
    /httpOnly: true/
  );
  assert.match(
    transport,
    /sameSite: 'strict'/
  );
  assert.match(
    transport,
    /PROVIDER_WEBAUTHN_ORIGIN/
  );
  assert.match(
    transport,
    /x-sukuu-provider-csrf/
  );
  assert.match(
    middleware,
    /readProviderAccessCookie/
  );
  assert.doesNotMatch(
    middleware,
    /Bearer /
  );
  assert.match(
    router,
    /isTrustedProviderBrowserRequest/
  );
});

test('provider authentication requires approved directly-attested external security key', () => {
  assert.match(
    authService,
    /attestationType: 'direct'/
  );
  assert.match(
    authService,
    /authenticatorAttachment:\s*'cross-platform'/
  );
  assert.match(
    authService,
    /userVerification: 'required'/
  );
  assert.match(
    authService,
    /supportedAlgorithmIDs:\s*\[-7, -257\]/
  );
  assert.match(
    authService,
    /PROVIDER_WEBAUTHN_ALLOWED_AAGUIDS/
  );
  assert.match(
    authService,
    /fmt ===\s*'none'/
  );
  assert.match(
    authService,
    /credentialDeviceType !==\s*'singleDevice'/
  );
  assert.match(
    authService,
    /credentialBackedUp !== false/
  );
});

test('provider tables are FORCE-RLS deny-by-default with no ordinary policies', () => {
  assert.match(
    migration,
    /FORCE ROW LEVEL SECURITY/
  );
  assert.match(
    migration,
    /REVOKE ALL ON TABLE .* FROM sukuu_app_runtime/s
  );
  assert.match(
    migration,
    /v_policies <> 0/
  );
  assert.match(
    migration,
    /provider\/delegate tables must have zero ordinary RLS policies/
  );
  assert.doesNotMatch(
    migration,
    /CREATE POLICY[\s\S]*system_provider_identity/
  );
});

test('delegate handoff is one-time, self-activated and MFA-protected', () => {
  assert.match(
    schoolService,
    /randomBytes\(32\)/
  );
  assert.match(
    schoolService,
    /createHash\('sha256'\)/
  );
  assert.match(
    delegateService,
    /validateCredentialPassword/
  );
  assert.match(
    delegateService,
    /verifyTotp/
  );
  assert.match(
    migration,
    /INITIAL_TENANT_SUPERADMIN_ACTIVATED/
  );
  assert.match(
    migration,
    /'superadmin'/
  );
  assert.match(
    migration,
    /'TOTP'::sukuux\."MfaMethod"/
  );
  assert.match(
    migration,
    /invite_consumed_at=CURRENT_TIMESTAMP/
  );
});

test('provider approval requires maker-checker and one operational MFA Superadmin', () => {
  assert.match(
    migration,
    /v_school\.status <> 'UNDER_VERIFICATION'/
  );
  assert.match(
    migration,
    /v_submission\.actor_id=v_provider_id/
  );
  assert.match(
    migration,
    /Exactly one operational Tenant Superadmin with MFA is required/
  );
  assert.match(
    migration,
    /SCHOOL_VERIFY_APPROVE/
  );
  assert.match(
    migration,
    /SchoolVerified/
  );
});

test('provider surface is mounted separately from tenant SchoolX', () => {
  assert.match(
    index,
    /providerRouter/
  );
  assert.match(
    index,
    /\/api\/v1\/provider/
  );
  assert.match(
    router,
    /\/schoolx\/institutions/
  );
  assert.match(
    router,
    /authenticateProvider/
  );
});

test('provider persistence is represented in the Prisma schema', () => {
  for (const model of [
    'SystemProviderIdentity',
    'SystemProviderAuthenticator',
    'SystemProviderChallenge',
    'SystemProviderSession',
    'SystemProviderAuditEvent',
    'SchoolDelegateNomination',
  ]) {
    assert.ok(
      schema.includes(
        `model ${model}`
      ),
      model
    );
  }
});

test('SimpleWebAuthn is pinned to the accepted current release in package and lock', () => {
  assert.equal(
    apiPackage.dependencies[
      '@simplewebauthn/server'
    ],
    '13.3.3'
  );

  assert.equal(
    lock.packages?.['apps/api']
      ?.dependencies?.[
        '@simplewebauthn/server'
      ],
    '13.3.3'
  );

  assert.equal(
    lock.packages?.[
      'node_modules/@simplewebauthn/server'
    ]?.version,
    '13.3.3'
  );
});

test('provider code does not mint a tenant platform_admin grant', () => {
  assert.doesNotMatch(
    migration,
    /INSERT INTO system\.system_user_role[\s\S]{0,1000}platform_admin/
  );
  assert.doesNotMatch(
    authService,
    /systemUserRole/
  );
  assert.doesNotMatch(
    schoolService,
    /platform_admin.*school_id/s
  );
});
