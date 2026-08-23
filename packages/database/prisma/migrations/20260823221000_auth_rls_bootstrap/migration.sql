-- ============================================================================
-- SUKUU OPERATING SYSTEM
-- Stage 3A: Authentication RLS Bootstrap and Session Integrity
--
-- Purpose:
--   1. Provide a narrowly-scoped pre-authentication lookup without weakening
--      FORCE RLS on system.system_user.
--   2. Provide a narrowly-scoped session lookup for signed JWT session claims.
--   3. Preserve authentication-attempt evidence before a user RLS context exists.
--
-- Security model:
--   - Functions are SECURITY DEFINER because authentication necessarily starts
--     before app.current_user_id can exist.
--   - search_path is fixed and excludes public.
--   - PUBLIC execute is revoked.
--   - sukuu_app_runtime receives EXECUTE only if the role already exists.
--   - No table policy is weakened and no BYPASSRLS/login role is created.
-- ============================================================================

-- One current login identity per normalized email.
--
-- Historical CLOSED/archived identities remain preserved and may reuse the
-- same email later. Only the current login-eligible identity set is unique.
CREATE UNIQUE INDEX IF NOT EXISTS "uq_system_user_current_normalized_email"
ON system.system_user (lower(btrim(email)))
WHERE archived_at IS NULL
  AND status <> 'CLOSED';


CREATE OR REPLACE FUNCTION system.auth_lookup_user(p_email text)
RETURNS TABLE (
  id text,
  email text,
  password_hash text,
  is_active boolean,
  is_verified boolean,
  last_login_at timestamp(3) without time zone,
  failed_login_count integer,
  locked_until timestamp(3) without time zone,
  must_reset_password boolean,
  status text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, system, sukuux
AS $function$
  SELECT
    u.id,
    u.email,
    u.password_hash,
    u.is_active,
    u.is_verified,
    u.last_login_at,
    u.failed_login_count,
    u.locked_until,
    u.must_reset_password,
    u.status
  FROM system.system_user AS u
  WHERE u.archived_at IS NULL
    AND u.status <> 'CLOSED'
    AND lower(btrim(u.email)) = lower(btrim(p_email))
  LIMIT 1
$function$;

REVOKE ALL ON FUNCTION system.auth_lookup_user(text) FROM PUBLIC;


CREATE OR REPLACE FUNCTION system.auth_lookup_session(
  p_session_id text,
  p_user_id text
)
RETURNS TABLE (
  session_id text,
  user_id text,
  refresh_token_hash text,
  is_active boolean,
  expires_at timestamp(3) without time zone,
  last_activity_at timestamp(3) without time zone,
  invalidated_at timestamp(3) without time zone,
  user_is_active boolean,
  user_status text,
  must_reset_password boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, system, sukuux
AS $function$
  SELECT
    s.id AS session_id,
    s.user_id,
    s.refresh_token_hash,
    s.is_active,
    s.expires_at,
    s.last_activity_at,
    s.invalidated_at,
    u.is_active AS user_is_active,
    u.status AS user_status,
    u.must_reset_password
  FROM system.system_session AS s
  JOIN system.system_user AS u
    ON u.id = s.user_id
  WHERE s.id = p_session_id
    AND s.user_id = p_user_id
  LIMIT 1
$function$;

REVOKE ALL ON FUNCTION system.auth_lookup_session(text, text) FROM PUBLIC;


CREATE OR REPLACE FUNCTION system.auth_record_attempt(
  p_user_id text,
  p_status text,
  p_ip_address text,
  p_user_agent text
)
RETURNS void
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = pg_catalog, system, sukuux
AS $function$
BEGIN
  IF p_status IS NULL OR p_status NOT IN ('SUCCESS', 'FAILED', 'LOCKED') THEN
    RAISE EXCEPTION 'Invalid authentication status';
  END IF;

  INSERT INTO system.system_authentication_log (
    id,
    user_id,
    login_status,
    ip_address,
    user_agent,
    created_at
  )
  VALUES (
    gen_random_uuid()::text,
    p_user_id,
    p_status::sukuux."AuthLoginStatus",
    p_ip_address,
    p_user_agent,
    CURRENT_TIMESTAMP
  );
END
$function$;

REVOKE ALL ON FUNCTION system.auth_record_attempt(text, text, text, text) FROM PUBLIC;


-- Grant only the narrow bootstrap functions to the non-owner runtime role.
-- The role itself remains an operational concern and is not created here.
DO $grant$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_roles
    WHERE rolname = 'sukuu_app_runtime'
  ) THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION system.auth_lookup_user(text) TO sukuu_app_runtime';
    EXECUTE 'GRANT EXECUTE ON FUNCTION system.auth_lookup_session(text, text) TO sukuu_app_runtime';
    EXECUTE 'GRANT EXECUTE ON FUNCTION system.auth_record_attempt(text, text, text, text) TO sukuu_app_runtime';
  END IF;
END
$grant$;
