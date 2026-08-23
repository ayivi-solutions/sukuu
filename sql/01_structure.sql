-- ═══════════════════════════════════════════════════════════════════════════
-- Sukuu SystemX Completeness Migration — Part 1: Structure
-- Moves all 36 SystemX tables from `sukuux` into a dedicated `system` schema
-- (PDDS-SYS-0001), adds the status/row_version columns needed for the state
-- machine (EEAS-SYS-0021, PDDS-SYS-0016), and creates the domain-event outbox
-- (EEAS-SYS-0026..0030, ETAS-ARC-015).
--
-- SAFE TO RE-RUN: every statement is guarded (IF NOT EXISTS / IF EXISTS /
-- catalog checks), so running this twice does nothing destructive.
--
-- RUN THIS BEFORE `npx prisma generate` and BEFORE deploying the new code.
-- Run it directly in the Supabase SQL Editor, or via psql against DIRECT_URL
-- (not the pooled DATABASE_URL — schema DDL should go through the direct
-- connection, not pgbouncer).
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 0. Pre-flight: row counts before we touch anything ────────────────────
-- Run this block first and SAVE the output. After the migration, Part 3 of
-- this script re-counts the same tables in their new location — the numbers
-- must match exactly, or something went wrong and you stop immediately.
select 'PRE-MIGRATION COUNTS' as label;
select
  (select count(*) from sukuux.system_user)            as system_user,
  (select count(*) from sukuux.system_role)             as system_role,
  (select count(*) from sukuux.system_permission)       as system_permission,
  (select count(*) from sukuux.system_role_permission)  as system_role_permission,
  (select count(*) from sukuux.system_user_role)        as system_user_role,
  (select count(*) from sukuux.system_session)          as system_session,
  (select count(*) from sukuux.system_audit_event)      as system_audit_event,
  (select count(*) from sukuux.system_feature_flag)     as system_feature_flag;

-- ─── 1. Create the target schema ────────────────────────────────────────────
create schema if not exists system;

-- ─── 2. Move all 36 SystemX tables (ALTER TABLE ... SET SCHEMA is a fast
--        metadata-only operation in Postgres — it does NOT copy data, so
--        this is safe and near-instant even on large tables) ───────────────
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
    'system_data_retention','system_error_log','system_service','system_service_status'
  ];
begin
  foreach tbl in array tables loop
    if exists (select 1 from information_schema.tables where table_schema = 'sukuux' and table_name = tbl) then
      execute format('alter table sukuux.%I set schema system', tbl);
      raise notice 'Moved: sukuux.% -> system.%', tbl, tbl;
    elsif exists (select 1 from information_schema.tables where table_schema = 'system' and table_name = tbl) then
      raise notice 'Already in system schema, skipping: %', tbl;
    else
      raise warning 'TABLE NOT FOUND IN EITHER SCHEMA — CHECK MANUALLY: %', tbl;
    end if;
  end loop;
end $$;

-- ─── 3. Post-move verification — counts must match Part 0 exactly ─────────
select 'POST-MIGRATION COUNTS (compare to PRE-MIGRATION COUNTS above)' as label;
select
  (select count(*) from system.system_user)            as system_user,
  (select count(*) from system.system_role)             as system_role,
  (select count(*) from system.system_permission)       as system_permission,
  (select count(*) from system.system_role_permission)  as system_role_permission,
  (select count(*) from system.system_user_role)        as system_user_role,
  (select count(*) from system.system_session)          as system_session,
  (select count(*) from system.system_audit_event)      as system_audit_event,
  (select count(*) from system.system_feature_flag)     as system_feature_flag;

-- ─── 4. State machine columns on system_user (EEAS-SYS-0021, PDDS-SYS-0016) ─
alter table system.system_user add column if not exists status text;
alter table system.system_user add column if not exists row_version integer not null default 1;

-- Backfill status from the existing boolean/nullable fields, since there is
-- no prior authoritative status column. This runs once — rows that already
-- have a status (re-run safety) are left untouched.
update system.system_user
set status = case
  when archived_at is not null then 'CLOSED'
  when locked_until is not null and locked_until > now() then 'LOCKED'
  when is_active = false then 'SUSPENDED'
  when is_verified = false then 'PENDING_VERIFICATION'
  else 'ACTIVE'
end
where status is null;

alter table system.system_user alter column status set not null;

-- Constrain to the six approved lifecycle states (EFS-SYS-0032). Using a
-- CHECK constraint rather than a Postgres ENUM type so future states can be
-- added with a simple constraint replace, no type-migration risk.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'system_user_status_check'
  ) then
    alter table system.system_user
      add constraint system_user_status_check
      check (status in ('INVITED','PENDING_VERIFICATION','ACTIVE','LOCKED','SUSPENDED','CLOSED'));
  end if;
end $$;

-- ─── 5. row_version for optimistic concurrency on other frequently-contended
--        tables (PDDS-SYS-0010) ─────────────────────────────────────────────
alter table system.system_role add column if not exists row_version integer not null default 1;
alter table system.system_feature_flag add column if not exists row_version integer not null default 1;

-- ─── 6. Domain event outbox (EEAS-SYS-0026..0030) ──────────────────────────
-- gen_random_uuid() is built into Postgres 13+ core, but pgcrypto is enabled
-- defensively here in case of an older engine version.
create extension if not exists pgcrypto;

create table if not exists system.system_domain_event (
  id                 uuid primary key default gen_random_uuid(),
  aggregate_type     text not null,
  aggregate_id       text not null,
  event_type         text not null,
  occurred_at        timestamptz not null default now(),
  recorded_at        timestamptz not null default now(),
  producer           text not null default 'sukuu-api',
  correlation_id     text not null,
  causation_id       text,
  tenant_id          text,
  payload            jsonb not null default '{}'::jsonb,
  status             text not null default 'PENDING' check (status in ('PENDING','PUBLISHED','FAILED')),
  published_at       timestamptz,
  attempt_count      integer not null default 0,
  last_error         text
);
create index if not exists idx_system_domain_event_status on system.system_domain_event (status) where status = 'PENDING';
create index if not exists idx_system_domain_event_aggregate on system.system_domain_event (aggregate_type, aggregate_id);
create index if not exists idx_system_domain_event_tenant on system.system_domain_event (tenant_id);

-- ─── 7. Idempotency ledger for commands (EEAS-SYS-0027, EFS-SYS-0023) ──────
create table if not exists system.system_command_log (
  operation_id       text primary key,
  tenant_id          text,
  actor_id           text,
  command_type       text not null,
  aggregate_id       text,
  request_hash       text,
  result_status      integer,
  result_body        jsonb,
  issued_at          timestamptz not null default now(),
  completed_at       timestamptz
);
create index if not exists idx_system_command_log_tenant on system.system_command_log (tenant_id);

select 'MIGRATION PART 1 COMPLETE' as status;
