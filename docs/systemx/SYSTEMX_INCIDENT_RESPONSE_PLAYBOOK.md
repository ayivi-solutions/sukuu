# SystemX Security Incident Response Playbook

Status: Controlled engineering baseline
Owner: AYIVI Systems Limited, Sukuu SystemX security owner

## 1. Trigger conditions

Invoke this playbook for suspected privilege escalation, self-approval bypass, account takeover, refresh replay, cross-tenant exposure, RLS bypass, unauthorised export, audit suppression, unexpected provider-global access, leaked API key or webhook secret, compromised privileged session or unexplained SystemX state transition.

## 2. Immediate containment

1. Preserve evidence before destructive action.
2. Revoke affected SystemX sessions and refresh capability.
3. Suspend affected tenant accounts where compromise is credible.
4. Revoke or disable affected API keys, webhooks or delegated role assignments.
5. If tenant isolation is in doubt, stop the affected application path rather than widening database privilege.
6. Do not disable RLS, FORCE RLS, trusted context checks or maker-checker controls to restore service.
7. Do not edit an already-applied migration. Use a forward-only corrective migration.

## 3. Evidence preservation

Retain:
- commit SHA and deployment/build identity;
- SystemX audit events;
- authentication logs;
- session identifiers in controlled evidence;
- command-log and domain-event correlation identifiers;
- relevant role and permission grants;
- migration-ledger state and migration checksums;
- RLS policy inventory and runtime-role flags;
- affected timestamps, state transitions and reason fields.

Do not place passwords, JWTs, refresh tokens, TOTP seeds, RLS secrets or database credentials in incident tickets, evidence ZIPs or chat logs.

## 4. Investigation sequence

1. Confirm tenant and deployment boundary.
2. Confirm source commit and persistent CI result.
3. Confirm the API runtime database identity and `rolsuper`/`rolbypassrls`.
4. Confirm all SystemX tables remain RLS + FORCE RLS.
5. Confirm legacy tenant GUC authority has not reappeared.
6. Confirm the nine SystemX action permissions and live role grants.
7. Reconstruct the actor, relationship, role, purpose, resource state and SoD decision.
8. Reconstruct session creation, refresh rotation, MFA and step-up evidence where applicable.
9. Reconcile consequential action to audit event and domain event.
10. Determine whether any other tenant, user or protected record was reachable.

## 5. Incident classes

### A. Account takeover
Contain by revoking sessions, rotating affected credentials, resetting MFA through an authorised recovery process and reviewing role grants.

### B. Privilege escalation or self-approval
Contain by revoking the grant, expiring affected assignments and preserving the grant/revocation audit chain. Test the same path against maker-checker controls before restoration.

### C. Cross-tenant or RLS failure
Treat as critical. Stop the affected application path, capture runtime DB identity and policy state, verify trusted context helpers and compare the live trusted-RLS migration checksum. Do not restore until tenant negative tests pass.

### D. Sensitive export
Identify report, purpose, tenant scope, actor and affected classification. Revoke export authority if needed and preserve the governed report metadata and audit evidence.

### E. Audit or event suppression
Treat missing evidence for a consequential action as a security defect. Preserve database and application logs, determine the last complete evidence boundary and restore through a forward-only correction.

## 6. Recovery and rollback

Recovery must restore the last known-good source commit, database migration state and authority configuration without weakening security controls. Rollback criteria are:
- source regression attributable to the latest commit;
- failed API or ERP production build;
- failed SystemX security regression;
- migration invariant failure;
- tenant-isolation failure;
- critical or high-severity privacy/security defect.

Database rollback never means editing or deleting an applied migration. Use forward correction.

## 7. Closure criteria

An incident is closed only when:
1. containment is complete;
2. affected authority is reconciled;
3. SystemX audit and event evidence is complete or the evidence gap is formally recorded;
4. tenant-isolation tests pass where relevant;
5. API and ERP builds pass;
6. the full SystemX security regression passes;
7. persistent CI is green;
8. corrective requirements are traced to EFS, EEAS, PDDS and ESS;
9. any remaining risk is owned and formally dispositioned.

## 8. Exercise requirement

Before production authorisation, execute a deployment-specific tabletop or controlled exercise covering at minimum account takeover, privilege escalation and cross-tenant/RLS failure. Record participants, timeline, decisions, recovery result and defects.
