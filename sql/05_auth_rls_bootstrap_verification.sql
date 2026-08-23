-- ============================================================================
-- SUKUU STAGE 3A
-- Authentication Bootstrap Verification v0.1
-- READ ONLY
-- Run after the Stage 3A migration is deployed.
-- ============================================================================

WITH f AS (
  SELECT
    n.nspname AS schema_name,
    p.proname AS function_name,
    pg_catalog.pg_get_function_identity_arguments(p.oid) AS arguments,
    p.prosecdef AS security_definer,
    p.provolatile AS volatility,
    p.proconfig AS function_config,
    pg_catalog.pg_get_userbyid(p.proowner) AS owner_name
  FROM pg_catalog.pg_proc p
  JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'system'
    AND p.proname IN (
      'auth_lookup_user',
      'auth_lookup_session',
      'auth_record_attempt'
    )
),
runtime_privileges AS (
  SELECT
    has_function_privilege(
      'sukuu_app_runtime',
      'system.auth_lookup_user(text)',
      'EXECUTE'
    ) AS lookup_user_execute,
    has_function_privilege(
      'sukuu_app_runtime',
      'system.auth_lookup_session(text,text)',
      'EXECUTE'
    ) AS lookup_session_execute,
    has_function_privilege(
      'sukuu_app_runtime',
      'system.auth_record_attempt(text,text,text,text)',
      'EXECUTE'
    ) AS record_attempt_execute
)
SELECT
  (SELECT count(*) FROM f) AS bootstrap_function_count,
  (SELECT count(*) FROM f WHERE security_definer) AS security_definer_count,
  (
    SELECT count(*)
    FROM f
    WHERE array_to_string(function_config, ',') LIKE '%search_path=pg_catalog, system, sukuux%'
  ) AS fixed_search_path_count,
  rp.lookup_user_execute,
  rp.lookup_session_execute,
  rp.record_attempt_execute,
  (
    SELECT coalesce(
      jsonb_agg(
        jsonb_build_object(
          'function', function_name,
          'arguments', arguments,
          'security_definer', security_definer,
          'volatility', volatility,
          'owner', owner_name,
          'config', function_config
        )
        ORDER BY function_name
      ),
      '[]'::jsonb
    )
    FROM f
  ) AS function_fingerprint,
  now() AS captured_at
FROM runtime_privileges rp;

-- PUBLIC must not retain explicit EXECUTE grants on the bootstrap functions.
SELECT
  routine_schema,
  routine_name,
  grantee,
  privilege_type
FROM information_schema.routine_privileges
WHERE routine_schema = 'system'
  AND routine_name IN (
    'auth_lookup_user',
    'auth_lookup_session',
    'auth_record_attempt'
  )
ORDER BY routine_name, grantee;

-- Current login identities must remain unique by normalized email.
SELECT
  lower(btrim(email)) AS normalized_email,
  count(*) AS current_records
FROM system.system_user
WHERE archived_at IS NULL
  AND status <> 'CLOSED'
GROUP BY lower(btrim(email))
HAVING count(*) > 1
ORDER BY normalized_email;

-- Expected: zero rows.


-- Verify the native partial unique index exists and matches the login predicate.
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'system'
  AND tablename = 'system_user'
  AND indexname = 'uq_system_user_current_normalized_email';

-- Expected: exactly one row containing:
--   UNIQUE
--   lower(btrim(email))
--   archived_at IS NULL
--   status <> 'CLOSED'


-- Verify auth_lookup_user itself excludes historical closed/archived identities.
SELECT
  pg_get_functiondef(
    'system.auth_lookup_user(text)'::regprocedure
  ) AS auth_lookup_user_definition;

