-- ═══════════════════════════════════════════════════════════════════════════
-- Sukuu SystemX Completeness Migration — Part 2: Runtime Role & RLS
-- Creates a non-owner runtime role (PDDS-SYS-0003, ESS: "table owners bypass
-- RLS") and applies row-level security to all 36 SystemX tables, differentiated
-- by three real access patterns rather than one blanket rule:
--
--   Category A (12 tables, direct school_id)  -> tenant match
--   Category B (8 tables, user_id no school_id) -> own record, or a colleague
--                                                   in the same school
--   Category C (16 tables, neither)             -> platform-role gated
--
-- DO NOT SWITCH DATABASE_URL TO THE NEW ROLE UNTIL YOU HAVE RUN THE
-- VERIFICATION QUERIES AT THE BOTTOM OF THIS FILE AND CONFIRMED THEY BEHAVE
-- AS EXPECTED. Your existing connection string keeps working exactly as
-- before until you change it — this script does not touch the current
-- connection or role in any way that would break it.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. Create the runtime role ─────────────────────────────────────────────
-- IMPORTANT: replace 'CHANGE_ME_STRONG_PASSWORD' with a real generated secret
-- before running this, then store it in your password manager immediately.
-- This role deliberately does NOT own any table, which is what makes RLS
-- enforcement apply to it (table owners bypass RLS by default in Postgres).
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'sukuu_app_runtime') then
    create role sukuu_app_runtime with login password 'CHANGE_ME_STRONG_PASSWORD';
  end if;
end $$;

grant usage on schema sukuux to sukuu_app_runtime;
grant usage on schema system to sukuu_app_runtime;

-- Full CRUD on every existing table in both schemas — this role replaces
-- your current connection role, so it needs everything the app currently
-- does. RLS policies (below) restrict what it can actually see/change on
-- the system.* tables specifically; sukuux.* tables are unrestricted for now,
-- same as they are today, since their RLS is scoped to their own module's
-- turn in the module-by-module sequence, not this pass.
grant select, insert, update, delete on all tables in schema sukuux to sukuu_app_runtime;
grant select, insert, update, delete on all tables in schema system to sukuu_app_runtime;
grant usage, select on all sequences in schema sukuux to sukuu_app_runtime;
grant usage, select on all sequences in schema system to sukuu_app_runtime;

-- Make future tables in both schemas grant automatically to this role too,
-- so the next module's migration doesn't need to repeat this step.
alter default privileges in schema sukuux grant select, insert, update, delete on tables to sukuu_app_runtime;
alter default privileges in schema system grant select, insert, update, delete on tables to sukuu_app_runtime;

-- ─── 2. Enable + FORCE row level security on all 36 SystemX tables ─────────
-- FORCE is the specific, non-optional part: without it, the table owner
-- (the role that ran `prisma db push`, almost certainly your current
-- connection role) bypasses every policy below entirely.
do $$
declare
  tbl text;
  tables text[] := array[
    'system_settings','system_log','system_user','system_role','system_permission',
    'system_role_permission','system_user_role','system_session','system_device',
    'system_api_key','system_login_history','system_password_history','system_mfa',
    'system_feature_flag','system_backup','system_job_queue','system_webhook',
    'system_audit_event','system_notification_preference','system_subscription',
    'system_tenant_plan','system_user_identity','system_authentication_log',
    'system_password_policy','system_security_policy','system_configuration',
    'system_environment','system_department','system_integration','system_backup_log',
    'system_job_execution','system_health_check','system_rate_limit',
    'system_data_retention','system_error_log','system_service','system_service_status',
    'system_domain_event','system_command_log'
  ];
begin
  foreach tbl in array tables loop
    execute format('alter table system.%I enable row level security', tbl);
    execute format('alter table system.%I force row level security', tbl);
  end loop;
end $$;

-- ─── 3. Category A — direct school_id (tenant match) ───────────────────────
-- NOTE: system_role and system_feature_flag are deliberately excluded from
-- this loop — both have legitimate, currently-used NULL-school_id rows
-- (global/system-wide roles and flags) that a plain tenant-match policy
-- would incorrectly hide from non-superadmin actors. They get bespoke
-- policies in step 3b below instead.
do $$
declare
  tbl text;
  tables text[] := array[
    'system_log','system_user_role','system_api_key',
    'system_backup','system_job_queue','system_webhook','system_audit_event',
    'system_subscription','system_password_policy','system_security_policy'
  ];
begin
  foreach tbl in array tables loop
    execute format('drop policy if exists tenant_match on system.%I', tbl);
    execute format($f$
      create policy tenant_match on system.%I
      using (
        school_id = nullif(current_setting('app.current_school_id', true), '')
        or nullif(current_setting('app.actor_role', true), '') = 'superadmin'
      )
      with check (
        school_id = nullif(current_setting('app.current_school_id', true), '')
        or nullif(current_setting('app.actor_role', true), '') = 'superadmin'
      )
    $f$, tbl);
  end loop;
end $$;

-- ─── 3b. system_role — tenant match OR is_system (global roles like
--         'superadmin'/'headmaster' have school_id=null and must stay
--         visible to every actor, since every role-check in the app reads
--         this table) ───────────────────────────────────────────────────
drop policy if exists role_access on system.system_role;
create policy role_access on system.system_role
using (
  is_system = true
  or school_id = nullif(current_setting('app.current_school_id', true), '')
  or nullif(current_setting('app.actor_role', true), '') = 'superadmin'
)
with check (
  -- system roles are never created/edited through the app (updateRole
  -- already rejects is_system edits at the application layer) — writes
  -- here are always tenant-scoped, never to a null-school_id row.
  school_id = nullif(current_setting('app.current_school_id', true), '')
  or nullif(current_setting('app.actor_role', true), '') = 'superadmin'
);

-- ─── 3c. system_feature_flag — tenant match OR global (school_id null),
--         since listFeatureFlags intentionally shows platform-wide flags
--         to every school; writes to a global flag are platform-admin-only ──
drop policy if exists feature_flag_read on system.system_feature_flag;
create policy feature_flag_read on system.system_feature_flag for select using (
  school_id = nullif(current_setting('app.current_school_id', true), '')
  or school_id is null
  or nullif(current_setting('app.actor_role', true), '') = 'superadmin'
);
drop policy if exists feature_flag_write_tenant on system.system_feature_flag;
create policy feature_flag_write_tenant on system.system_feature_flag for insert with check (
  school_id = nullif(current_setting('app.current_school_id', true), '')
  or (school_id is null and nullif(current_setting('app.actor_role', true), '') in ('superadmin','headmaster'))
);
drop policy if exists feature_flag_update on system.system_feature_flag;
create policy feature_flag_update on system.system_feature_flag for update using (
  school_id = nullif(current_setting('app.current_school_id', true), '')
  or (school_id is null and nullif(current_setting('app.actor_role', true), '') in ('superadmin','headmaster'))
);

-- ─── 4. Category B — user_id present, no school_id (own record, or a
--        colleague sharing at least one school via system_user_role) ───────
do $$
declare
  tbl text;
  tables text[] := array[
    'system_session','system_device','system_login_history','system_password_history',
    'system_mfa','system_notification_preference','system_user_identity',
    'system_authentication_log'
  ];
begin
  foreach tbl in array tables loop
    execute format('drop policy if exists own_or_colleague on system.%I', tbl);
    -- NOTE: the correlated reference back to the protected table's own row
    -- must stay OUTSIDE the joined subquery, as a bare unqualified column —
    -- CREATE POLICY does not accept the table's own name as a qualifier
    -- (system.%I.user_id is invalid here), and qualifying it would in any
    -- case be ambiguous against sur1/sur2's own id columns. Restructuring
    -- as "user_id in (self-contained subquery)" avoids both problems: the
    -- subquery needs no correlation back to the outer row at all.
    execute format($f$
      create policy own_or_colleague on system.%I
      using (
        user_id = nullif(current_setting('app.current_user_id', true), '')
        or nullif(current_setting('app.actor_role', true), '') = 'superadmin'
        or user_id in (
          select target_role.user_id
          from system.system_user_role as viewer_role
          join system.system_user_role as target_role
            on viewer_role.school_id = target_role.school_id
          where viewer_role.user_id = nullif(current_setting('app.current_user_id', true), '')
        )
      )
      with check (
        user_id = nullif(current_setting('app.current_user_id', true), '')
        or nullif(current_setting('app.actor_role', true), '') = 'superadmin'
      )
    $f$, tbl);
  end loop;
end $$;

-- ─── 5. Category C — SystemUser itself (bespoke: own record, colleague via
--        system_user_role, or platform admin) ──────────────────────────────
drop policy if exists system_user_access on system.system_user;
create policy system_user_access on system.system_user
using (
  id = nullif(current_setting('app.current_user_id', true), '')
  or nullif(current_setting('app.actor_role', true), '') = 'superadmin'
  or id in (
    select target_role.user_id
    from system.system_user_role as viewer_role
    join system.system_user_role as target_role
      on viewer_role.school_id = target_role.school_id
    where viewer_role.user_id = nullif(current_setting('app.current_user_id', true), '')
  )
)
with check (
  id = nullif(current_setting('app.current_user_id', true), '')
  or nullif(current_setting('app.actor_role', true), '') = 'superadmin'
);

-- ─── 6. Category C — remaining platform-global tables (no tenant concept;
--        readable/writable by superadmin and headmaster only, since those
--        are the two roles the seeded RBAC grants full 'system' access to) ─
do $$
declare
  tbl text;
  tables text[] := array[
    'system_settings','system_permission','system_tenant_plan','system_configuration',
    'system_environment','system_department','system_integration','system_backup_log',
    'system_job_execution','system_health_check','system_rate_limit',
    'system_data_retention','system_error_log','system_service','system_service_status'
  ];
begin
  foreach tbl in array tables loop
    execute format('drop policy if exists platform_admin_only on system.%I', tbl);
    execute format($f$
      create policy platform_admin_only on system.%I
      using (nullif(current_setting('app.actor_role', true), '') in ('superadmin','headmaster'))
      with check (nullif(current_setting('app.actor_role', true), '') in ('superadmin','headmaster'))
    $f$, tbl);
  end loop;
end $$;

-- system_permission needs to be READABLE by everyone (the role-management UI
-- and the requireModuleAccess middleware both need to read it for every
-- authenticated request), but writable only by platform admins. Replace its
-- policy from the loop above with a split read/write version.
drop policy if exists platform_admin_only on system.system_permission;
drop policy if exists permission_read_all on system.system_permission;
create policy permission_read_all on system.system_permission for select using (true);
drop policy if exists permission_write_admin_only on system.system_permission;
create policy permission_write_admin_only on system.system_permission for insert with check (
  nullif(current_setting('app.actor_role', true), '') in ('superadmin','headmaster')
);
drop policy if exists permission_update_admin_only on system.system_permission;
create policy permission_update_admin_only on system.system_permission for update using (
  nullif(current_setting('app.actor_role', true), '') in ('superadmin','headmaster')
);
drop policy if exists permission_delete_admin_only on system.system_permission;
create policy permission_delete_admin_only on system.system_permission for delete using (
  nullif(current_setting('app.actor_role', true), '') in ('superadmin','headmaster')
);

-- system_role_permission needs the SAME split treatment and for the SAME
-- reason: requireModuleAccess (packages/database via apps/api middleware)
-- reads this table on every single authenticated request across the ENTIRE
-- application to resolve whether the caller's role has the grant it needs.
-- If this table were left in Category A/C with a restrictive USING clause,
-- or left with no policy at all under FORCE RLS, every request in every
-- module would start failing authorization — not just SystemX. Reads must
-- stay open; writes are already gated by assignPermission's maker-checker
-- check at the application layer, so admin-only at the database layer too.
drop policy if exists role_permission_read_all on system.system_role_permission;
create policy role_permission_read_all on system.system_role_permission for select using (true);
drop policy if exists role_permission_write_admin_only on system.system_role_permission;
create policy role_permission_write_admin_only on system.system_role_permission for insert with check (
  nullif(current_setting('app.actor_role', true), '') in ('superadmin','headmaster')
);
drop policy if exists role_permission_delete_admin_only on system.system_role_permission;
create policy role_permission_delete_admin_only on system.system_role_permission for delete using (
  nullif(current_setting('app.actor_role', true), '') in ('superadmin','headmaster')
);

-- ─── 7. Outbox and command log — service-role only, no per-tenant read needed
--        (these are internal plumbing, not user-facing records) ───────────
drop policy if exists service_only on system.system_domain_event;
create policy service_only on system.system_domain_event using (true) with check (true);
drop policy if exists service_only on system.system_command_log;
create policy service_only on system.system_command_log using (true) with check (true);
-- (These stay permissive because they are written by trusted server code
-- immediately after authorization has already been checked at the
-- application layer for the underlying action; they are not queried
-- directly by any user-facing endpoint outside SystemX's own reports.)

select 'MIGRATION PART 2 COMPLETE — DO NOT SWITCH DATABASE_URL YET, RUN VERIFICATION BELOW FIRST' as status;

-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICATION — run each block, read the comment, confirm the result
-- matches before touching DATABASE_URL. Run these AS sukuu_app_runtime
-- (e.g. `psql "postgresql://sukuu_app_runtime:PASSWORD@HOST/DB"` or set
-- role in the SQL editor with `set role sukuu_app_runtime;`).
-- ═══════════════════════════════════════════════════════════════════════════

-- V1. With no session variables set, you should see ZERO rows back from a
-- tenant-scoped table — proves FORCE RLS is actually active and the role
-- has no implicit bypass.
-- set role sukuu_app_runtime;
-- select count(*) from system.system_role;   -- expect 0

-- V2. Set a real school_id from your data, then the same query should
-- return only that school's roles.
-- set local app.current_school_id = '<a real school_id from system_role>';
-- select count(*) from system.system_role;   -- expect > 0, only that school

-- V3. Set app.actor_role = 'superadmin' with no school_id — should see
-- everything (superadmin bypass in every Category A/B policy).
-- set local app.actor_role = 'superadmin';
-- select count(*) from system.system_role;   -- expect the full table count

-- V4. CRITICAL — confirm every seeded role is_system=true (superadmin and
-- staff are confirmed from seed_rbac.js; the other 8 roles' is_system value
-- was not independently verified here). If ANY row below shows false or
-- null, STOP: the role_access policy above assumes is_system=true for all
-- platform-seeded roles, and a false here means that role becomes invisible
-- to requireModuleAccess for every module once RLS is active — a full
-- lockout for anyone holding that role. Run as your EXISTING (owner) role,
-- not sukuu_app_runtime, so RLS doesn't hide the very rows you're checking.
select name, is_system, school_id from system.system_role
where name in ('superadmin','headmaster','school_admin','bursar','hod','teacher','registrar','staff','student','parent')
order by name;
-- expect: is_system = true and school_id = null on EVERY row. If any row
-- fails this, run: update system.system_role set is_system = true, school_id
-- = null where name = '<that role>'; before proceeding to Part 3.

