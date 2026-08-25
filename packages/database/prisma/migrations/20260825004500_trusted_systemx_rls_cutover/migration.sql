-- ============================================================================
-- SUKUU STAGE 3B PHASE 2E
-- Trusted SystemX RLS Cutover
--
-- This migration replaces the legacy SystemX policy layer that trusts
-- caller-settable compatibility GUCs with the cryptographically/session-bound
-- system.ctx_* authority established in Stage 3B.
--
-- Gate A evidence:
--   44 live SystemX policies
--   40 policies trusting legacy app.current_* / app.actor_role values
--   4 unconditional TRUE policies
--   legacy-GUC spoof exposure confirmed as sukuu_app_runtime
--
-- Gate B:
--   application dependencies moved behind withTenantContext()
--
-- Gate C final rehearsal:
--   candidate policies = 33
--   legacy-GUC policies = 0
--   unconditional TRUE policies = 0
--   trusted ctx_* policies = 33
--   real sukuu_app_runtime, BYPASSRLS=false
--   no-context / legacy-spoof / invalid-proof denial verified
--   trusted tenant-bound visibility verified
--   command-log actor+tenant idempotency continuity verified
--   full rehearsal transaction rolled back cleanly
--
-- IMPORTANT AUTHORITY BOUNDARIES
--   * tenant superadmin is NOT a provider/platform administrator
--   * 14 provider/platform-global tables therefore become deny-by-default to
--     sukuu_app_runtime until a dedicated provider identity path exists
--   * the global permission catalogue is tenant-runtime READ-ONLY
--   * role-permission mutation is limited to non-system roles in the current
--     tenant
--   * command-log access is bound to BOTH trusted tenant and trusted actor
--
-- This is an additive migration. No previously deployed migration is edited.
-- ============================================================================


-- --------------------------------------------------------------------------
-- 1. Exact live-state preflight.
-- --------------------------------------------------------------------------

DO $preflight$
DECLARE
  v_total_policies integer;
  v_missing integer;
  v_unexpected integer;
  v_legacy integer;
  v_trusted integer;
  v_unconditional integer;
  v_system_tables integer;
  v_rls_tables integer;
  v_force_tables integer;
BEGIN

  IF to_regprocedure(
    'system.ctx_user_id()'
  ) IS NULL
  OR to_regprocedure(
    'system.ctx_school_id()'
  ) IS NULL
  OR to_regprocedure(
    'system.ctx_has_role(text)'
  ) IS NULL
  OR to_regprocedure(
    'system.ctx_is_tenant_superadmin()'
  ) IS NULL
  OR to_regprocedure(
    'system.ctx_is_headmaster()'
  ) IS NULL
  OR to_regprocedure(
    'system.ctx_can_access_user(text)'
  ) IS NULL
  OR to_regprocedure(
    'system._context_proof_valid()'
  ) IS NULL THEN

    RAISE EXCEPTION
      'Trusted RLS cutover aborted: trusted context helper foundation is incomplete';

  END IF;


  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_roles
    WHERE
      rolname='sukuu_app_runtime'
      AND rolsuper=false
      AND rolbypassrls=false
  ) THEN

    RAISE EXCEPTION
      'Trusted RLS cutover aborted: sukuu_app_runtime is missing or can bypass RLS';

  END IF;


  SELECT
    COUNT(*)::integer,
    COUNT(*) FILTER (
      WHERE c.relrowsecurity
    )::integer,
    COUNT(*) FILTER (
      WHERE c.relforcerowsecurity
    )::integer

  INTO
    v_system_tables,
    v_rls_tables,
    v_force_tables

  FROM
    pg_catalog.pg_class c

  JOIN
    pg_catalog.pg_namespace n
    ON n.oid=c.relnamespace

  WHERE
    n.nspname='system'
    AND c.relkind='r';


  IF
    v_system_tables <> 43
    OR v_rls_tables <> 43
    OR v_force_tables <> 43
  THEN

    RAISE EXCEPTION
      'Trusted RLS cutover aborted: expected 43/43 SystemX tables under RLS + FORCE RLS, got total %, RLS %, FORCE %',
      v_system_tables,
      v_rls_tables,
      v_force_tables;

  END IF;


  SELECT
    COUNT(*)::integer

  INTO
    v_total_policies

  FROM
    pg_catalog.pg_policies

  WHERE
    schemaname='system';


  IF v_total_policies <> 44 THEN

    RAISE EXCEPTION
      'Trusted RLS cutover aborted: expected 44 pre-cutover SystemX policies, found %',
      v_total_policies;

  END IF;


  WITH expected(
    tablename,
    policyname,
    cmd
  ) AS (
    VALUES
      ('system_api_key','tenant_match','ALL'),
      ('system_audit_event','tenant_match','ALL'),
      ('system_authentication_log','own_or_colleague','ALL'),
      ('system_backup','tenant_match','ALL'),
      ('system_backup_log','platform_admin_only','ALL'),
      ('system_configuration','platform_admin_only','ALL'),
      ('system_data_retention','platform_admin_only','ALL'),
      ('system_department','platform_admin_only','ALL'),
      ('system_device','own_or_colleague','ALL'),
      ('system_environment','platform_admin_only','ALL'),
      ('system_error_log','platform_admin_only','ALL'),
      ('system_feature_flag','feature_flag_read','SELECT'),
      ('system_feature_flag','feature_flag_update','UPDATE'),
      ('system_feature_flag','feature_flag_write_tenant','INSERT'),
      ('system_health_check','platform_admin_only','ALL'),
      ('system_integration','platform_admin_only','ALL'),
      ('system_job_execution','platform_admin_only','ALL'),
      ('system_job_queue','tenant_match','ALL'),
      ('system_log','tenant_match','ALL'),
      ('system_login_history','own_or_colleague','ALL'),
      ('system_notification_preference','own_or_colleague','ALL'),
      ('system_password_policy','tenant_match','ALL'),
      ('system_permission','permission_delete_admin_only','DELETE'),
      ('system_permission','permission_read_all','SELECT'),
      ('system_permission','permission_update_admin_only','UPDATE'),
      ('system_permission','permission_write_admin_only','INSERT'),
      ('system_rate_limit','platform_admin_only','ALL'),
      ('system_role','role_access','ALL'),
      ('system_role_permission','role_permission_delete_admin_only','DELETE'),
      ('system_role_permission','role_permission_read_all','SELECT'),
      ('system_role_permission','role_permission_write_admin_only','INSERT'),
      ('system_security_policy','tenant_match','ALL'),
      ('system_service','platform_admin_only','ALL'),
      ('system_service_status','platform_admin_only','ALL'),
      ('system_session','own_or_colleague','ALL'),
      ('system_settings','platform_admin_only','ALL'),
      ('system_subscription','tenant_match','ALL'),
      ('system_tenant_plan','platform_admin_only','ALL'),
      ('system_user','system_user_access','ALL'),
      ('system_user_identity','own_or_colleague','ALL'),
      ('system_user_role','tenant_match','ALL'),
      ('system_webhook','tenant_match','ALL'),
      ('system_command_log','service_only','ALL'),
      ('system_domain_event','service_only','ALL')
  )

  SELECT
    COUNT(*)::integer

  INTO
    v_missing

  FROM
    expected e

  LEFT JOIN
    pg_catalog.pg_policies p
    ON p.schemaname='system'
    AND p.tablename=e.tablename
    AND p.policyname=e.policyname
    AND p.cmd=e.cmd

  WHERE
    p.policyname IS NULL;


  WITH expected(
    tablename,
    policyname,
    cmd
  ) AS (
    VALUES
      ('system_api_key','tenant_match','ALL'),
      ('system_audit_event','tenant_match','ALL'),
      ('system_authentication_log','own_or_colleague','ALL'),
      ('system_backup','tenant_match','ALL'),
      ('system_backup_log','platform_admin_only','ALL'),
      ('system_configuration','platform_admin_only','ALL'),
      ('system_data_retention','platform_admin_only','ALL'),
      ('system_department','platform_admin_only','ALL'),
      ('system_device','own_or_colleague','ALL'),
      ('system_environment','platform_admin_only','ALL'),
      ('system_error_log','platform_admin_only','ALL'),
      ('system_feature_flag','feature_flag_read','SELECT'),
      ('system_feature_flag','feature_flag_update','UPDATE'),
      ('system_feature_flag','feature_flag_write_tenant','INSERT'),
      ('system_health_check','platform_admin_only','ALL'),
      ('system_integration','platform_admin_only','ALL'),
      ('system_job_execution','platform_admin_only','ALL'),
      ('system_job_queue','tenant_match','ALL'),
      ('system_log','tenant_match','ALL'),
      ('system_login_history','own_or_colleague','ALL'),
      ('system_notification_preference','own_or_colleague','ALL'),
      ('system_password_policy','tenant_match','ALL'),
      ('system_permission','permission_delete_admin_only','DELETE'),
      ('system_permission','permission_read_all','SELECT'),
      ('system_permission','permission_update_admin_only','UPDATE'),
      ('system_permission','permission_write_admin_only','INSERT'),
      ('system_rate_limit','platform_admin_only','ALL'),
      ('system_role','role_access','ALL'),
      ('system_role_permission','role_permission_delete_admin_only','DELETE'),
      ('system_role_permission','role_permission_read_all','SELECT'),
      ('system_role_permission','role_permission_write_admin_only','INSERT'),
      ('system_security_policy','tenant_match','ALL'),
      ('system_service','platform_admin_only','ALL'),
      ('system_service_status','platform_admin_only','ALL'),
      ('system_session','own_or_colleague','ALL'),
      ('system_settings','platform_admin_only','ALL'),
      ('system_subscription','tenant_match','ALL'),
      ('system_tenant_plan','platform_admin_only','ALL'),
      ('system_user','system_user_access','ALL'),
      ('system_user_identity','own_or_colleague','ALL'),
      ('system_user_role','tenant_match','ALL'),
      ('system_webhook','tenant_match','ALL'),
      ('system_command_log','service_only','ALL'),
      ('system_domain_event','service_only','ALL')
  )

  SELECT
    COUNT(*)::integer

  INTO
    v_unexpected

  FROM
    pg_catalog.pg_policies p

  LEFT JOIN
    expected e
    ON e.tablename=p.tablename
    AND e.policyname=p.policyname
    AND e.cmd=p.cmd

  WHERE
    p.schemaname='system'
    AND e.tablename IS NULL;


  IF
    v_missing <> 0
    OR v_unexpected <> 0
  THEN

    RAISE EXCEPTION
      'Trusted RLS cutover aborted: live policy identity drift detected (missing %, unexpected %)',
      v_missing,
      v_unexpected;

  END IF;


  SELECT
    COUNT(*) FILTER (
      WHERE
        (
          COALESCE(qual,'')
          || ' ' ||
          COALESCE(with_check,'')
        ) LIKE '%app.current_school_id%'
        OR
        (
          COALESCE(qual,'')
          || ' ' ||
          COALESCE(with_check,'')
        ) LIKE '%app.current_user_id%'
        OR
        (
          COALESCE(qual,'')
          || ' ' ||
          COALESCE(with_check,'')
        ) LIKE '%app.actor_role%'
    )::integer,

    COUNT(*) FILTER (
      WHERE
        (
          COALESCE(qual,'')
          || ' ' ||
          COALESCE(with_check,'')
        ) LIKE '%ctx_%'
    )::integer,

    COUNT(*) FILTER (
      WHERE
        regexp_replace(
          COALESCE(qual,''),
          '\s+',
          ' ',
          'g'
        )='true'
        AND (
          COALESCE(with_check,'')=''
          OR regexp_replace(
            COALESCE(with_check,''),
            '\s+',
            ' ',
            'g'
          )='true'
        )
    )::integer

  INTO
    v_legacy,
    v_trusted,
    v_unconditional

  FROM
    pg_catalog.pg_policies

  WHERE
    schemaname='system';


  IF
    v_legacy <> 40
    OR v_trusted <> 0
    OR v_unconditional <> 4
  THEN

    RAISE EXCEPTION
      'Trusted RLS cutover aborted: expected legacy/trusted/unconditional = 40/0/4, got %/%/%',
      v_legacy,
      v_trusted,
      v_unconditional;

  END IF;


  IF NOT EXISTS (
    SELECT 1
    FROM sukuux._prisma_migrations
    WHERE
      migration_name=
        '20260824201500_privileged_mfa_login_enforcement'
      AND finished_at IS NOT NULL
      AND rolled_back_at IS NULL
  ) THEN

    RAISE EXCEPTION
      'Trusted RLS cutover aborted: Phase 2D privileged MFA login enforcement is not cleanly deployed';

  END IF;

END
$preflight$;


-- --------------------------------------------------------------------------
-- 2. Remove the complete legacy SystemX policy set.
--    Preflight guarantees each policy exists exactly as expected.
-- --------------------------------------------------------------------------

DROP POLICY tenant_match
  ON system.system_api_key;

DROP POLICY tenant_match
  ON system.system_audit_event;

DROP POLICY own_or_colleague
  ON system.system_authentication_log;

DROP POLICY tenant_match
  ON system.system_backup;

DROP POLICY platform_admin_only
  ON system.system_backup_log;

DROP POLICY platform_admin_only
  ON system.system_configuration;

DROP POLICY platform_admin_only
  ON system.system_data_retention;

DROP POLICY platform_admin_only
  ON system.system_department;

DROP POLICY own_or_colleague
  ON system.system_device;

DROP POLICY platform_admin_only
  ON system.system_environment;

DROP POLICY platform_admin_only
  ON system.system_error_log;

DROP POLICY feature_flag_read
  ON system.system_feature_flag;

DROP POLICY feature_flag_update
  ON system.system_feature_flag;

DROP POLICY feature_flag_write_tenant
  ON system.system_feature_flag;

DROP POLICY platform_admin_only
  ON system.system_health_check;

DROP POLICY platform_admin_only
  ON system.system_integration;

DROP POLICY platform_admin_only
  ON system.system_job_execution;

DROP POLICY tenant_match
  ON system.system_job_queue;

DROP POLICY tenant_match
  ON system.system_log;

DROP POLICY own_or_colleague
  ON system.system_login_history;

DROP POLICY own_or_colleague
  ON system.system_notification_preference;

DROP POLICY tenant_match
  ON system.system_password_policy;

DROP POLICY permission_delete_admin_only
  ON system.system_permission;

DROP POLICY permission_read_all
  ON system.system_permission;

DROP POLICY permission_update_admin_only
  ON system.system_permission;

DROP POLICY permission_write_admin_only
  ON system.system_permission;

DROP POLICY platform_admin_only
  ON system.system_rate_limit;

DROP POLICY role_access
  ON system.system_role;

DROP POLICY role_permission_delete_admin_only
  ON system.system_role_permission;

DROP POLICY role_permission_read_all
  ON system.system_role_permission;

DROP POLICY role_permission_write_admin_only
  ON system.system_role_permission;

DROP POLICY tenant_match
  ON system.system_security_policy;

DROP POLICY platform_admin_only
  ON system.system_service;

DROP POLICY platform_admin_only
  ON system.system_service_status;

DROP POLICY own_or_colleague
  ON system.system_session;

DROP POLICY platform_admin_only
  ON system.system_settings;

DROP POLICY tenant_match
  ON system.system_subscription;

DROP POLICY platform_admin_only
  ON system.system_tenant_plan;

DROP POLICY system_user_access
  ON system.system_user;

DROP POLICY own_or_colleague
  ON system.system_user_identity;

DROP POLICY tenant_match
  ON system.system_user_role;

DROP POLICY tenant_match
  ON system.system_webhook;

DROP POLICY service_only
  ON system.system_command_log;

DROP POLICY service_only
  ON system.system_domain_event;


-- --------------------------------------------------------------------------
-- 3. Direct tenant tables.
-- --------------------------------------------------------------------------

CREATE POLICY tenant_trusted
ON system.system_log
FOR ALL
USING (
  school_id =
    system.ctx_school_id()
)
WITH CHECK (
  school_id =
    system.ctx_school_id()
);

CREATE POLICY tenant_trusted
ON system.system_user_role
FOR ALL
USING (
  school_id =
    system.ctx_school_id()
)
WITH CHECK (
  school_id =
    system.ctx_school_id()
);

CREATE POLICY tenant_trusted
ON system.system_api_key
FOR ALL
USING (
  school_id =
    system.ctx_school_id()
)
WITH CHECK (
  school_id =
    system.ctx_school_id()
);

CREATE POLICY tenant_trusted
ON system.system_backup
FOR ALL
USING (
  school_id =
    system.ctx_school_id()
)
WITH CHECK (
  school_id =
    system.ctx_school_id()
);

CREATE POLICY tenant_trusted
ON system.system_job_queue
FOR ALL
USING (
  school_id =
    system.ctx_school_id()
)
WITH CHECK (
  school_id =
    system.ctx_school_id()
);

CREATE POLICY tenant_trusted
ON system.system_webhook
FOR ALL
USING (
  school_id =
    system.ctx_school_id()
)
WITH CHECK (
  school_id =
    system.ctx_school_id()
);

CREATE POLICY tenant_trusted
ON system.system_audit_event
FOR ALL
USING (
  school_id =
    system.ctx_school_id()
)
WITH CHECK (
  school_id =
    system.ctx_school_id()
);

CREATE POLICY tenant_trusted
ON system.system_subscription
FOR ALL
USING (
  school_id =
    system.ctx_school_id()
)
WITH CHECK (
  school_id =
    system.ctx_school_id()
);

CREATE POLICY tenant_trusted
ON system.system_password_policy
FOR ALL
USING (
  school_id =
    system.ctx_school_id()
)
WITH CHECK (
  school_id =
    system.ctx_school_id()
);

CREATE POLICY tenant_trusted
ON system.system_security_policy
FOR ALL
USING (
  school_id =
    system.ctx_school_id()
)
WITH CHECK (
  school_id =
    system.ctx_school_id()
);


-- --------------------------------------------------------------------------
-- 4. Roles.
--    System roles remain readable but never tenant-mutable.
-- --------------------------------------------------------------------------

CREATE POLICY role_read_trusted
ON system.system_role
FOR SELECT
USING (
  system.ctx_user_id()
    IS NOT NULL
  AND (
    is_system=true
    OR school_id=
       system.ctx_school_id()
  )
);

CREATE POLICY role_insert_superadmin
ON system.system_role
FOR INSERT
WITH CHECK (
  system.ctx_is_tenant_superadmin()
  AND is_system=false
  AND school_id=
      system.ctx_school_id()
);

CREATE POLICY role_update_superadmin
ON system.system_role
FOR UPDATE
USING (
  system.ctx_is_tenant_superadmin()
  AND is_system=false
  AND school_id=
      system.ctx_school_id()
)
WITH CHECK (
  system.ctx_is_tenant_superadmin()
  AND is_system=false
  AND school_id=
      system.ctx_school_id()
);

CREATE POLICY role_delete_superadmin
ON system.system_role
FOR DELETE
USING (
  system.ctx_is_tenant_superadmin()
  AND is_system=false
  AND school_id=
      system.ctx_school_id()
);


-- --------------------------------------------------------------------------
-- 5. Feature flags.
--    Tenant actors may read tenant + global flags.
--    Tenant superadmin may mutate only tenant-owned flags.
-- --------------------------------------------------------------------------

CREATE POLICY feature_flag_read_trusted
ON system.system_feature_flag
FOR SELECT
USING (
  system.ctx_user_id()
    IS NOT NULL
  AND (
    school_id=
      system.ctx_school_id()
    OR school_id IS NULL
  )
);

CREATE POLICY feature_flag_insert_superadmin
ON system.system_feature_flag
FOR INSERT
WITH CHECK (
  system.ctx_is_tenant_superadmin()
  AND school_id=
      system.ctx_school_id()
);

CREATE POLICY feature_flag_update_superadmin
ON system.system_feature_flag
FOR UPDATE
USING (
  system.ctx_is_tenant_superadmin()
  AND school_id=
      system.ctx_school_id()
)
WITH CHECK (
  system.ctx_is_tenant_superadmin()
  AND school_id=
      system.ctx_school_id()
);


-- --------------------------------------------------------------------------
-- 6. User-bound tables.
-- --------------------------------------------------------------------------

CREATE POLICY user_scope_trusted
ON system.system_authentication_log
FOR ALL
USING (
  system.ctx_can_access_user(
    user_id
  )
)
WITH CHECK (
  user_id=
    system.ctx_user_id()
  OR (
    system.ctx_is_tenant_superadmin()
    AND system.ctx_can_access_user(
      user_id
    )
  )
);

CREATE POLICY user_scope_trusted
ON system.system_device
FOR ALL
USING (
  system.ctx_can_access_user(
    user_id
  )
)
WITH CHECK (
  user_id=
    system.ctx_user_id()
  OR (
    system.ctx_is_tenant_superadmin()
    AND system.ctx_can_access_user(
      user_id
    )
  )
);

CREATE POLICY user_scope_trusted
ON system.system_login_history
FOR ALL
USING (
  system.ctx_can_access_user(
    user_id
  )
)
WITH CHECK (
  user_id=
    system.ctx_user_id()
  OR (
    system.ctx_is_tenant_superadmin()
    AND system.ctx_can_access_user(
      user_id
    )
  )
);

CREATE POLICY user_scope_trusted
ON system.system_notification_preference
FOR ALL
USING (
  system.ctx_can_access_user(
    user_id
  )
)
WITH CHECK (
  user_id=
    system.ctx_user_id()
  OR (
    system.ctx_is_tenant_superadmin()
    AND system.ctx_can_access_user(
      user_id
    )
  )
);

CREATE POLICY user_scope_trusted
ON system.system_session
FOR ALL
USING (
  system.ctx_can_access_user(
    user_id
  )
)
WITH CHECK (
  user_id=
    system.ctx_user_id()
  OR (
    system.ctx_is_tenant_superadmin()
    AND system.ctx_can_access_user(
      user_id
    )
  )
);

CREATE POLICY user_scope_trusted
ON system.system_user_identity
FOR ALL
USING (
  system.ctx_can_access_user(
    user_id
  )
)
WITH CHECK (
  user_id=
    system.ctx_user_id()
  OR (
    system.ctx_is_tenant_superadmin()
    AND system.ctx_can_access_user(
      user_id
    )
  )
);


-- --------------------------------------------------------------------------
-- 7. SystemUser.
-- --------------------------------------------------------------------------

CREATE POLICY user_read_trusted
ON system.system_user
FOR SELECT
USING (
  system.ctx_can_access_user(
    id
  )
);

CREATE POLICY user_insert_superadmin
ON system.system_user
FOR INSERT
WITH CHECK (
  system.ctx_is_tenant_superadmin()
);

CREATE POLICY user_update_trusted
ON system.system_user
FOR UPDATE
USING (
  id=
    system.ctx_user_id()
  OR (
    system.ctx_is_tenant_superadmin()
    AND system.ctx_can_access_user(
      id
    )
  )
)
WITH CHECK (
  id=
    system.ctx_user_id()
  OR (
    system.ctx_is_tenant_superadmin()
    AND system.ctx_can_access_user(
      id
    )
  )
);

CREATE POLICY user_delete_superadmin
ON system.system_user
FOR DELETE
USING (
  system.ctx_is_tenant_superadmin()
  AND system.ctx_can_access_user(
    id
  )
);


-- --------------------------------------------------------------------------
-- 8. Permission catalogue.
--    Provider-owned definitions are trusted-read-only to tenant runtime.
-- --------------------------------------------------------------------------

CREATE POLICY permission_read_trusted
ON system.system_permission
FOR SELECT
USING (
  system.ctx_user_id()
    IS NOT NULL
);


-- --------------------------------------------------------------------------
-- 9. Role-permission catalogue.
--    Reads support requireModuleAccess().
--    Writes are limited to non-system roles owned by the current tenant.
-- --------------------------------------------------------------------------

CREATE POLICY role_permission_read_trusted
ON system.system_role_permission
FOR SELECT
USING (
  system.ctx_user_id()
    IS NOT NULL
);

CREATE POLICY role_permission_insert_tenant_superadmin
ON system.system_role_permission
FOR INSERT
WITH CHECK (
  system.ctx_is_tenant_superadmin()
  AND EXISTS (
    SELECT 1
    FROM system.system_role r
    WHERE
      r.id=role_id
      AND r.is_system=false
      AND r.school_id=
          system.ctx_school_id()
  )
);

CREATE POLICY role_permission_delete_tenant_superadmin
ON system.system_role_permission
FOR DELETE
USING (
  system.ctx_is_tenant_superadmin()
  AND EXISTS (
    SELECT 1
    FROM system.system_role r
    WHERE
      r.id=role_id
      AND r.is_system=false
      AND r.school_id=
          system.ctx_school_id()
  )
);


-- --------------------------------------------------------------------------
-- 10. Domain event outbox.
-- --------------------------------------------------------------------------

CREATE POLICY domain_event_tenant_trusted
ON system.system_domain_event
FOR ALL
USING (
  tenant_id=
    system.ctx_school_id()
)
WITH CHECK (
  tenant_id=
    system.ctx_school_id()
);


-- --------------------------------------------------------------------------
-- 11. Idempotency command log.
--     Bind both tenant and actor so operation IDs cannot be inspected,
--     replayed or completed by a different tenant actor.
-- --------------------------------------------------------------------------

CREATE POLICY command_log_actor_tenant_trusted
ON system.system_command_log
FOR ALL
USING (
  tenant_id=
    system.ctx_school_id()
  AND actor_id=
      system.ctx_user_id()
)
WITH CHECK (
  tenant_id=
    system.ctx_school_id()
  AND actor_id=
      system.ctx_user_id()
);


-- --------------------------------------------------------------------------
-- 12. Provider/platform-global tables.
--
-- No replacement policy is intentionally created on these fourteen tables:
--
--   system_backup_log
--   system_configuration
--   system_data_retention
--   system_department
--   system_environment
--   system_error_log
--   system_health_check
--   system_integration
--   system_job_execution
--   system_rate_limit
--   system_service
--   system_service_status
--   system_settings
--   system_tenant_plan
--
-- They already have RLS + FORCE RLS. With zero sukuu_app_runtime policy they
-- become deny-by-default for all tenant runtime sessions.
--
-- A later provider/platform-admin phase may add a separate workload/provider
-- identity path without weakening this tenant boundary.
-- --------------------------------------------------------------------------


-- --------------------------------------------------------------------------
-- 13. Exact post-cutover verification inside the migration transaction.
-- --------------------------------------------------------------------------

DO $postflight$
DECLARE
  v_total_policies integer;
  v_legacy integer;
  v_trusted integer;
  v_unconditional integer;
  v_platform_policies integer;
  v_permission_policies integer;
  v_role_permission_policies integer;
  v_command_policies integer;
  v_domain_policies integer;
BEGIN

  SELECT
    COUNT(*)::integer,

    COUNT(*) FILTER (
      WHERE
        (
          COALESCE(qual,'')
          || ' ' ||
          COALESCE(with_check,'')
        ) LIKE '%app.current_school_id%'
        OR
        (
          COALESCE(qual,'')
          || ' ' ||
          COALESCE(with_check,'')
        ) LIKE '%app.current_user_id%'
        OR
        (
          COALESCE(qual,'')
          || ' ' ||
          COALESCE(with_check,'')
        ) LIKE '%app.actor_role%'
    )::integer,

    COUNT(*) FILTER (
      WHERE
        (
          COALESCE(qual,'')
          || ' ' ||
          COALESCE(with_check,'')
        ) LIKE '%ctx_%'
    )::integer,

    COUNT(*) FILTER (
      WHERE
        regexp_replace(
          COALESCE(qual,''),
          '\s+',
          ' ',
          'g'
        )='true'
        AND (
          COALESCE(with_check,'')=''
          OR regexp_replace(
            COALESCE(with_check,''),
            '\s+',
            ' ',
            'g'
          )='true'
        )
    )::integer

  INTO
    v_total_policies,
    v_legacy,
    v_trusted,
    v_unconditional

  FROM
    pg_catalog.pg_policies

  WHERE
    schemaname='system';


  IF
    v_total_policies <> 33
    OR v_legacy <> 0
    OR v_trusted <> 33
    OR v_unconditional <> 0
  THEN

    RAISE EXCEPTION
      'Trusted RLS postflight failed: expected total/legacy/trusted/unconditional = 33/0/33/0, got %/%/%/%',
      v_total_policies,
      v_legacy,
      v_trusted,
      v_unconditional;

  END IF;


  SELECT
    COUNT(*)::integer

  INTO
    v_platform_policies

  FROM
    pg_catalog.pg_policies

  WHERE
    schemaname='system'
    AND tablename IN (
      'system_backup_log',
      'system_configuration',
      'system_data_retention',
      'system_department',
      'system_environment',
      'system_error_log',
      'system_health_check',
      'system_integration',
      'system_job_execution',
      'system_rate_limit',
      'system_service',
      'system_service_status',
      'system_settings',
      'system_tenant_plan'
    );


  IF v_platform_policies <> 0 THEN

    RAISE EXCEPTION
      'Trusted RLS postflight failed: provider/platform-global tenant-runtime policy count must be zero, found %',
      v_platform_policies;

  END IF;


  SELECT
    COUNT(*)::integer

  INTO
    v_permission_policies

  FROM
    pg_catalog.pg_policies

  WHERE
    schemaname='system'
    AND tablename='system_permission';


  IF
    v_permission_policies <> 1
    OR NOT EXISTS (
      SELECT 1
      FROM pg_catalog.pg_policies
      WHERE
        schemaname='system'
        AND tablename='system_permission'
        AND policyname='permission_read_trusted'
        AND cmd='SELECT'
    )
  THEN

    RAISE EXCEPTION
      'Trusted RLS postflight failed: permission catalogue must have exactly one trusted SELECT policy';

  END IF;


  SELECT
    COUNT(*)::integer

  INTO
    v_role_permission_policies

  FROM
    pg_catalog.pg_policies

  WHERE
    schemaname='system'
    AND tablename='system_role_permission';


  IF
    v_role_permission_policies <> 3
    OR NOT EXISTS (
      SELECT 1
      FROM pg_catalog.pg_policies
      WHERE
        schemaname='system'
        AND tablename='system_role_permission'
        AND policyname='role_permission_read_trusted'
        AND cmd='SELECT'
    )
    OR NOT EXISTS (
      SELECT 1
      FROM pg_catalog.pg_policies
      WHERE
        schemaname='system'
        AND tablename='system_role_permission'
        AND policyname='role_permission_insert_tenant_superadmin'
        AND cmd='INSERT'
    )
    OR NOT EXISTS (
      SELECT 1
      FROM pg_catalog.pg_policies
      WHERE
        schemaname='system'
        AND tablename='system_role_permission'
        AND policyname='role_permission_delete_tenant_superadmin'
        AND cmd='DELETE'
    )
  THEN

    RAISE EXCEPTION
      'Trusted RLS postflight failed: role-permission policy set is incomplete';

  END IF;


  SELECT
    COUNT(*)::integer

  INTO
    v_command_policies

  FROM
    pg_catalog.pg_policies

  WHERE
    schemaname='system'
    AND tablename='system_command_log';


  IF
    v_command_policies <> 1
    OR NOT EXISTS (
      SELECT 1
      FROM pg_catalog.pg_policies
      WHERE
        schemaname='system'
        AND tablename='system_command_log'
        AND policyname='command_log_actor_tenant_trusted'
        AND cmd='ALL'
        AND COALESCE(qual,'')
            LIKE '%ctx_school_id%'
        AND COALESCE(qual,'')
            LIKE '%ctx_user_id%'
        AND COALESCE(with_check,'')
            LIKE '%ctx_school_id%'
        AND COALESCE(with_check,'')
            LIKE '%ctx_user_id%'
    )
  THEN

    RAISE EXCEPTION
      'Trusted RLS postflight failed: command log is not trusted tenant+actor bound';

  END IF;


  SELECT
    COUNT(*)::integer

  INTO
    v_domain_policies

  FROM
    pg_catalog.pg_policies

  WHERE
    schemaname='system'
    AND tablename='system_domain_event';


  IF
    v_domain_policies <> 1
    OR NOT EXISTS (
      SELECT 1
      FROM pg_catalog.pg_policies
      WHERE
        schemaname='system'
        AND tablename='system_domain_event'
        AND policyname='domain_event_tenant_trusted'
        AND cmd='ALL'
    )
  THEN

    RAISE EXCEPTION
      'Trusted RLS postflight failed: domain-event tenant policy is incomplete';

  END IF;

END
$postflight$;
