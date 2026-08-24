/**
 * RETIRED SECURITY-SENSITIVE BOOTSTRAP.
 *
 * Sukuu Stage 3B Phase 2C removed the historical known-password
 * superadmin bootstrap.
 *
 * Tenant Superadmin is the highest authority within one tenant.
 * It must receive its credential through the controlled,
 * single-use credential-challenge lifecycle.
 *
 * This file intentionally creates no user, password or role grant.
 */

console.error(
  'Legacy known-password superadmin bootstrap is disabled.'
);

console.error(
  'Use the controlled credential-challenge onboarding/remediation process.'
);

process.exitCode = 1;
