# SystemX Threat Model

Status: Controlled engineering baseline
Owner: AYIVI Systems Limited, Sukuu SystemX security owner
Blueprint authority: ESS-SYS-141 to ESS-SYS-145, EFS-SYS-0001 to EFS-SYS-0042, ETAS, EEAS and PDDS.

## 1. Scope and trust boundary

SystemX is the authoritative Sukuu ERP capability for authentication, user-account lifecycle, tenant-bound role and permission administration, session governance, feature flags, security policy, audit evidence, SystemX events and governed SystemX reports.

The trusted boundary begins at authenticated server-side session resolution. Browser state, request-body identifiers, route parameters and legacy caller-settable tenant GUC values are not authority. The API resolves live session, tenant, account, active relationship, role, action, purpose and applicable resource state before consequential SystemX work.

Database authority is defence in depth. SystemX tables remain under PostgreSQL RLS and FORCE RLS. Trusted context uses session-bound server state and an HMAC proof. The legacy `app.current_school_id`, `app.current_user_id` and `app.actor_role` authority mechanism is retired.

Provider authority and tenant authority are separate. Tenant Superadmin is the highest tenant-governance authority but is not AYIVI Platform Owner. Provider-global authority must use a dedicated provider identity plane rather than a null-school tenant shortcut.

## 2. Protected assets

1. User account and credential state.
2. Session and device state.
3. Tenant role assignments and permission grants.
4. Security policies and password policies.
5. Feature flags.
6. API keys and webhooks.
7. Audit events, command-log evidence and domain-event evidence.
8. Governed report outputs and exports.
9. Trusted tenant-context proof material.
10. The migration ledger and RLS policy layer.

## 3. Authorised actor classes

1. Sukuu tenant Superadmin.
2. School Head or Headmaster within the explicit action catalogue.
3. Delegated school administrator with explicit action grants.
4. Auditor with separately granted view/export authority.
5. Support operator with minimum necessary authority.
6. AYIVI provider authority only through the separate provider plane when implemented and authorised.

## 4. Primary threats and controls

### Privilege escalation

Threat: a user obtains or exercises authority beyond their current tenant relationship or explicit action permissions.

Controls:
- live server-side role resolution;
- explicit SystemX actions: view, create, submit, approve, release, correct, cancel, export and administer;
- no consequential authority inferred from hidden UI state;
- step-up authentication for high-risk actions;
- RLS and FORCE RLS on all SystemX tables;
- deny-by-default provider-global SystemX tables for tenant runtime;
- security regression tests and persistent CI.

### Self-approval and toxic combinations

Threat: an actor grants themselves privileged authority or approves their own consequential access change.

Controls:
- maker-checker checks on privileged permission grants;
- privileged self-role assignment denial;
- administrative self-state-change denial;
- administrative self-password-reset denial;
- separate submit/approve/release actions;
- audit evidence for grants, revocations and consequential transitions.

### Account takeover

Threat: stolen credentials, refresh-token replay, MFA abuse or session theft.

Controls:
- HTTP-only secure browser credential transport;
- CSRF and trusted-origin controls;
- refresh rotation with complete-token HMAC digest;
- rate limiting on login and MFA verification;
- session revocation;
- privileged fresh-authentication checks;
- generic external error semantics that do not aid enumeration.

### Delegation abuse

Threat: temporary or delegated authority persists beyond purpose, school or approved period.

Controls:
- school-scoped SystemUserRole records;
- expiry-aware live role resolution;
- immediate revocation through expiry;
- explicit action grants;
- privileged-access reporting;
- audit history retained rather than deleting assignment evidence.

### Audit suppression or evidence destruction

Threat: a consequential action is performed without durable evidence or evidence is destructively overwritten.

Controls:
- SystemX audit-event writes;
- domain-event outbox;
- immutable-history pattern for consequential access changes;
- archive/revoke/correct semantics instead of hard deletion where evidence must survive;
- governed audit export;
- persistent CI contracts covering evidence paths.

### Tenant-boundary escape

Threat: School A can read or mutate School B SystemX data.

Controls:
- trusted session-bound tenant context;
- 43/43 SystemX tables under RLS and FORCE RLS;
- trusted `system.ctx_*` helpers;
- legacy tenant GUC retirement;
- tenant-scoped application queries;
- historical controlled RLS negative acceptance retained only while the exact trusted RLS migration checksum and live policy invariants remain unchanged.

### Sensitive export abuse

Threat: an authorised user exports data beyond role, tenant, purpose or minimum necessary scope.

Controls:
- separate `export` action;
- server-side tenant scope;
- governed report metadata with source authority, generation time, purpose and tenant scope;
- audit-on-view/export evidence where required;
- production commissioning requires representative sensitive-export testing.

## 5. Security invariants

1. No SystemX request is authorised solely because a control is hidden or visible in the UI.
2. A caller-controlled tenant identifier cannot override authenticated tenant authority.
3. Tenant Superadmin is not provider Platform Owner.
4. `sukuu_app_runtime` must remain `rolsuper=false` and `rolbypassrls=false`.
5. Applied migrations are immutable. Corrections are forward-only.
6. Consequential SystemX actions use explicit action authority and fresh authentication where required.
7. Production authorisation is not granted while a critical or high-severity security, privacy, accessibility, source-authority or unrecoverable-data-entry defect remains open.

## 6. AYIVI Infrastructure Sovereignty Reconciliation

The eight Sukuu Blueprints remain the only source of truth for SystemX functional, data, security, UI and AI requirements. The following AYIVI company-level infrastructure standards govern deployment and portability assumptions and do not replace or amend those Blueprints:

1. AYV-INF-DOC-001, Infrastructure Sovereignty and Deployment Portability Doctrine.
2. AYV-DB-STD-001, Self-Hosted PostgreSQL Managed Operations Architecture Standard.
3. AYV-DB-MIG-001, Supabase-to-Sovereign PostgreSQL Migration and Portability Standard.
4. AYV-CRI-ARC-001, Institutional Critical Systems Deployment Reference Architecture, where Sukuu is deployed into a critical institutional context.

SystemX is therefore designed for managed Supabase during development where appropriate while preserving a controlled migration path to AYIVI-controlled, customer-controlled or institution-controlled PostgreSQL.

A sovereign target is not accepted merely because PostgreSQL is installed. The target must reproduce the required managed operational outcomes, including high availability, pooling, backup and point-in-time recovery, monitoring, TLS/network controls, storage resilience, disaster recovery and infrastructure automation.

Database identities must remain separated by operational purpose. The target role map shall distinguish at minimum application runtime, migration/DDL, reporting/read-only, integration, auditor and controlled database administration identities. The SystemX application runtime must use a non-superuser, non-BYPASSRLS role. Migration or administrative credentials shall never become the normal application runtime identity.

Supabase provider-internal roles are not treated as portable application authority. Migration recreates only approved application and institutional roles, resets target LOGIN credentials and separately migrates, self-hosts or substitutes provider services such as Auth, Storage, Realtime, Edge Functions, pooling and secrets where they are used.

Sovereign cutover requires a recorded source/target PostgreSQL and extension matrix, structural/data/security reconciliation, positive and negative RLS tests by tenant/role, application regression and load testing, approved cutover, endpoint switch, monitoring and a retained rollback window.

## 7. Residual commissioning risks

Engineering completion does not substitute for production commissioning. The following remain commissioning gates where not yet evidenced in a deployment-specific environment:
- representative-user acceptance;
- low-bandwidth, interrupted-session, shared-device, screen-reader, 200 per cent zoom, denied-access and stale-data scenarios;
- confirmation that the deployed API `DATABASE_URL` uses a non-superuser, non-BYPASSRLS runtime identity;
- deployment-specific incident-response exercise and rollback validation.

These are explicit release holds, not permission to weaken the SystemX engineering baseline.
