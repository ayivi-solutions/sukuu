BEGIN;

-- ============================================================================
-- SUKUU OPERATING SYSTEM
-- Stage 3B Phase 1: Trusted Session Context Foundation
--
-- ADDITIVE FOUNDATION ONLY. The existing RLS policies are not replaced here.
-- Phase 2 performs the policy cutover only after this path passes lifecycle
-- verification under the real non-owner runtime role.
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS extensions;

DO $pgcrypto$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_extension WHERE extname = 'pgcrypto'
  ) THEN
    EXECUTE 'CREATE EXTENSION pgcrypto WITH SCHEMA extensions';
  END IF;
END
$pgcrypto$;

-- --------------------------------------------------------------------------
-- 1. Bind server sessions to one authoritative school.
-- --------------------------------------------------------------------------

ALTER TABLE system.system_session
  ADD COLUMN IF NOT EXISTS school_id text;

CREATE INDEX IF NOT EXISTS "ix_system_session_school_id"
  ON system.system_session (school_id);

UPDATE system.system_session
SET
  is_active = false,
  invalidated_at = COALESCE(
    invalidated_at,
    CURRENT_TIMESTAMP::timestamp(3) without time zone
  )
WHERE is_active = true
  AND expires_at <= CURRENT_TIMESTAMP;

WITH unique_active_grant AS (
  SELECT sur.user_id, MIN(sur.school_id) AS school_id
  FROM system.system_user_role sur
  JOIN system.system_role r ON r.id = sur.role_id
  WHERE sur.school_id IS NOT NULL
    AND (sur.expires_at IS NULL OR sur.expires_at > CURRENT_TIMESTAMP)
    AND r.archived_at IS NULL
  GROUP BY sur.user_id
  HAVING COUNT(DISTINCT sur.school_id) = 1
)
UPDATE system.system_session s
SET school_id = uag.school_id
FROM unique_active_grant uag
WHERE s.user_id = uag.user_id
  AND s.is_active = true
  AND s.invalidated_at IS NULL
  AND s.expires_at > CURRENT_TIMESTAMP
  AND s.school_id IS NULL;

DO $active_session_guard$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM system.system_session
    WHERE is_active = true
      AND invalidated_at IS NULL
      AND expires_at > CURRENT_TIMESTAMP
      AND school_id IS NULL
  ) THEN
    RAISE EXCEPTION
      'Stage 3B aborted: active session could not be bound to one school';
  END IF;
END
$active_session_guard$;

ALTER TABLE system.system_session
  DROP CONSTRAINT IF EXISTS "ck_system_session_active_requires_school";

ALTER TABLE system.system_session
  ADD CONSTRAINT "ck_system_session_active_requires_school"
  CHECK (is_active IS NOT TRUE OR school_id IS NOT NULL);

-- --------------------------------------------------------------------------
-- 2. Protected context secret. No runtime table policy is created.
-- --------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS system.system_context_secret (
  id           text PRIMARY KEY,
  secret_value text NOT NULL,
  created_at   timestamp(3) without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  rotated_at   timestamp(3) without time zone
);

ALTER TABLE system.system_context_secret ENABLE ROW LEVEL SECURITY;
ALTER TABLE system.system_context_secret FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE system.system_context_secret FROM PUBLIC;

DO $revoke_context_secret$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname='sukuu_app_runtime') THEN
    EXECUTE 'REVOKE ALL ON TABLE system.system_context_secret FROM sukuu_app_runtime';
  END IF;
END
$revoke_context_secret$;

-- --------------------------------------------------------------------------
-- 3. One-time authentication tickets.
-- --------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS system.system_auth_ticket (
  id         text PRIMARY KEY,
  user_id    text NOT NULL,
  school_id  text NOT NULL,
  created_at timestamp(3) without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at timestamp(3) without time zone NOT NULL,
  used_at    timestamp(3) without time zone
);

CREATE INDEX IF NOT EXISTS "ix_system_auth_ticket_expiry"
  ON system.system_auth_ticket (expires_at);

ALTER TABLE system.system_auth_ticket ENABLE ROW LEVEL SECURITY;
ALTER TABLE system.system_auth_ticket FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE system.system_auth_ticket FROM PUBLIC;

DO $revoke_auth_ticket$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname='sukuu_app_runtime') THEN
    EXECUTE 'REVOKE ALL ON TABLE system.system_auth_ticket FROM sukuu_app_runtime';
  END IF;
END
$revoke_auth_ticket$;

-- --------------------------------------------------------------------------
-- 4. Internal crypto helpers.
-- --------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION system._pgcrypto_schema()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, system
AS $function$
  SELECT n.nspname::text
  FROM pg_catalog.pg_extension e
  JOIN pg_catalog.pg_namespace n ON n.oid = e.extnamespace
  WHERE e.extname = 'pgcrypto'
  LIMIT 1
$function$;
REVOKE ALL ON FUNCTION system._pgcrypto_schema() FROM PUBLIC;

CREATE OR REPLACE FUNCTION system._auth_password_matches(
  p_password text,
  p_stored_hash text
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, system
AS $function$
DECLARE
  v_schema text;
  v_hash text;
  v_match boolean;
BEGIN
  IF p_password IS NULL OR p_stored_hash IS NULL THEN RETURN false; END IF;

  IF left(p_stored_hash, 4) IN ('$2b$', '$2y$') THEN
    v_hash := '$2a$' || substr(p_stored_hash, 5);
  ELSE
    v_hash := p_stored_hash;
  END IF;

  v_schema := system._pgcrypto_schema();
  IF v_schema IS NULL THEN RAISE EXCEPTION 'pgcrypto extension unavailable'; END IF;

  EXECUTE format('SELECT %I.crypt($1,$2) = $2', v_schema)
    INTO v_match
    USING p_password, v_hash;

  RETURN COALESCE(v_match, false);
END
$function$;
REVOKE ALL ON FUNCTION system._auth_password_matches(text,text) FROM PUBLIC;

CREATE OR REPLACE FUNCTION system._hmac_sha256_hex(
  p_data text,
  p_key text
)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, system
AS $function$
DECLARE
  v_schema text;
  v_result text;
BEGIN
  IF p_data IS NULL OR p_key IS NULL THEN RETURN NULL; END IF;

  v_schema := system._pgcrypto_schema();
  IF v_schema IS NULL THEN RAISE EXCEPTION 'pgcrypto extension unavailable'; END IF;

  EXECUTE format(
    'SELECT pg_catalog.encode(%I.hmac($1,$2,''sha256''),''hex'')',
    v_schema
  )
  INTO v_result
  USING p_data, p_key;

  RETURN v_result;
END
$function$;
REVOKE ALL ON FUNCTION system._hmac_sha256_hex(text,text) FROM PUBLIC;

CREATE OR REPLACE FUNCTION system._context_secret()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, system
AS $function$
  SELECT secret_value
  FROM system.system_context_secret
  WHERE id='rls-v1'
  LIMIT 1
$function$;
REVOKE ALL ON FUNCTION system._context_secret() FROM PUBLIC;

-- --------------------------------------------------------------------------
-- 5. Cryptographically-verifiable context helpers.
-- --------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION system._context_proof_valid()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, system
AS $function$
DECLARE
  v_session_id text;
  v_user_id text;
  v_proof text;
  v_secret text;
  v_expected text;
BEGIN
  v_session_id := NULLIF(current_setting('app.session_id', true), '');
  v_user_id := NULLIF(current_setting('app.session_user_id', true), '');
  v_proof := NULLIF(current_setting('app.session_proof', true), '');

  IF v_session_id IS NULL OR v_user_id IS NULL OR v_proof IS NULL THEN
    RETURN false;
  END IF;

  v_secret := system._context_secret();
  IF v_secret IS NULL OR length(v_secret) < 32 THEN RETURN false; END IF;

  v_expected := system._hmac_sha256_hex(v_session_id || ':' || v_user_id, v_secret);
  IF v_expected IS NULL OR v_expected <> v_proof THEN RETURN false; END IF;

  RETURN EXISTS (
    SELECT 1
    FROM system.system_session s
    JOIN system.system_user u ON u.id=s.user_id
    WHERE s.id=v_session_id
      AND s.user_id=v_user_id
      AND s.school_id IS NOT NULL
      AND s.is_active=true
      AND s.invalidated_at IS NULL
      AND s.expires_at > CURRENT_TIMESTAMP
      AND u.archived_at IS NULL
      AND u.is_active=true
      AND u.status NOT IN ('LOCKED','SUSPENDED','CLOSED')
  );
END
$function$;
REVOKE ALL ON FUNCTION system._context_proof_valid() FROM PUBLIC;

CREATE OR REPLACE FUNCTION system.ctx_user_id()
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, system
AS $function$
BEGIN
  IF NOT system._context_proof_valid() THEN RETURN NULL; END IF;
  RETURN NULLIF(current_setting('app.session_user_id', true), '');
END
$function$;
REVOKE ALL ON FUNCTION system.ctx_user_id() FROM PUBLIC;

CREATE OR REPLACE FUNCTION system.ctx_school_id()
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, system
AS $function$
DECLARE v_school_id text;
BEGIN
  IF NOT system._context_proof_valid() THEN RETURN NULL; END IF;
  SELECT school_id INTO v_school_id
  FROM system.system_session
  WHERE id=NULLIF(current_setting('app.session_id', true), '')
  LIMIT 1;
  RETURN v_school_id;
END
$function$;
REVOKE ALL ON FUNCTION system.ctx_school_id() FROM PUBLIC;

CREATE OR REPLACE FUNCTION system.ctx_has_role(p_role_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, system
AS $function$
  SELECT system._context_proof_valid()
     AND EXISTS (
       SELECT 1
       FROM system.system_session s
       JOIN system.system_user_role sur
         ON sur.user_id=s.user_id AND sur.school_id=s.school_id
       JOIN system.system_role r ON r.id=sur.role_id
       WHERE s.id=NULLIF(current_setting('app.session_id', true), '')
         AND r.name=p_role_name
         AND r.archived_at IS NULL
         AND (sur.expires_at IS NULL OR sur.expires_at > CURRENT_TIMESTAMP)
     )
$function$;
REVOKE ALL ON FUNCTION system.ctx_has_role(text) FROM PUBLIC;

CREATE OR REPLACE FUNCTION system.ctx_is_system_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, system
AS $function$
  SELECT system.ctx_has_role('superadmin') OR system.ctx_has_role('headmaster')
$function$;
REVOKE ALL ON FUNCTION system.ctx_is_system_admin() FROM PUBLIC;

CREATE OR REPLACE FUNCTION system.ctx_can_access_user(p_target_user_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, system
AS $function$
  SELECT system._context_proof_valid()
     AND (
       p_target_user_id = system.ctx_user_id()
       OR EXISTS (
         SELECT 1
         FROM system.system_user_role target_role
         WHERE target_role.user_id=p_target_user_id
           AND target_role.school_id=system.ctx_school_id()
           AND (
             target_role.expires_at IS NULL
             OR target_role.expires_at > CURRENT_TIMESTAMP
           )
       )
     )
$function$;
REVOKE ALL ON FUNCTION system.ctx_can_access_user(text) FROM PUBLIC;

-- --------------------------------------------------------------------------
-- 6. Database-verified credential check -> one-time ticket.
-- --------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION system.auth_verify_credentials(
  p_email text,
  p_password text,
  p_ip_address text,
  p_user_agent text
)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = pg_catalog, system, sukuux
AS $function$
DECLARE
  v_user system.system_user%ROWTYPE;
  v_count integer;
  v_backoff_seconds integer;
  v_locked_until timestamp(3) without time zone;
  v_school_count integer;
  v_school_id text;
  v_ticket_id text;
  v_roles jsonb;
BEGIN
  SELECT u.* INTO v_user
  FROM system.system_user u
  WHERE u.archived_at IS NULL
    AND u.status <> 'CLOSED'
    AND lower(btrim(u.email))=lower(btrim(p_email))
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO system.system_authentication_log
      (id,user_id,login_status,ip_address,user_agent,created_at)
    VALUES
      (gen_random_uuid()::text,NULL,'FAILED'::sukuux."AuthLoginStatus",
       p_ip_address,p_user_agent,CURRENT_TIMESTAMP);

    RETURN jsonb_build_object('ok',false,'reason','INVALID');
  END IF;

  IF v_user.locked_until IS NOT NULL
     AND v_user.locked_until > CURRENT_TIMESTAMP THEN

    INSERT INTO system.system_authentication_log
      (id,user_id,login_status,ip_address,user_agent,created_at)
    VALUES
      (gen_random_uuid()::text,v_user.id,'LOCKED'::sukuux."AuthLoginStatus",
       p_ip_address,p_user_agent,CURRENT_TIMESTAMP);

    RETURN jsonb_build_object(
      'ok',false,
      'reason','TEMP_LOCK',
      'retrySeconds', GREATEST(
        1,
        CEIL(EXTRACT(EPOCH FROM (v_user.locked_until-CURRENT_TIMESTAMP)))::integer
      )
    );
  END IF;

  IF NOT system._auth_password_matches(p_password,v_user.password_hash) THEN
    v_count := COALESCE(v_user.failed_login_count,0)+1;

    IF v_count >= 5 THEN
      v_backoff_seconds := LEAST(power(2::numeric,v_count),3600)::integer;
      v_locked_until :=
        CURRENT_TIMESTAMP::timestamp(3) without time zone
        + make_interval(secs=>v_backoff_seconds);
    ELSE
      v_locked_until := NULL;
    END IF;

    UPDATE system.system_user
    SET failed_login_count=v_count,
        locked_until=v_locked_until
    WHERE id=v_user.id;

    INSERT INTO system.system_authentication_log
      (id,user_id,login_status,ip_address,user_agent,created_at)
    VALUES
      (gen_random_uuid()::text,v_user.id,'FAILED'::sukuux."AuthLoginStatus",
       p_ip_address,p_user_agent,CURRENT_TIMESTAMP);

    RETURN jsonb_build_object('ok',false,'reason','INVALID');
  END IF;

  IF v_user.status IN ('SUSPENDED','CLOSED','LOCKED') THEN
    INSERT INTO system.system_authentication_log
      (id,user_id,login_status,ip_address,user_agent,created_at)
    VALUES
      (gen_random_uuid()::text,v_user.id,'FAILED'::sukuux."AuthLoginStatus",
       p_ip_address,p_user_agent,CURRENT_TIMESTAMP);

    RETURN jsonb_build_object('ok',false,'reason',v_user.status);
  END IF;

  SELECT COUNT(DISTINCT sur.school_id)::integer, MIN(sur.school_id)
    INTO v_school_count,v_school_id
  FROM system.system_user_role sur
  JOIN system.system_role r ON r.id=sur.role_id
  WHERE sur.user_id=v_user.id
    AND sur.school_id IS NOT NULL
    AND (sur.expires_at IS NULL OR sur.expires_at>CURRENT_TIMESTAMP)
    AND r.archived_at IS NULL;

  IF COALESCE(v_school_count,0)<>1 OR v_school_id IS NULL THEN
    INSERT INTO system.system_authentication_log
      (id,user_id,login_status,ip_address,user_agent,created_at)
    VALUES
      (gen_random_uuid()::text,v_user.id,'FAILED'::sukuux."AuthLoginStatus",
       p_ip_address,p_user_agent,CURRENT_TIMESTAMP);

    RETURN jsonb_build_object('ok',false,'reason','NO_CONTEXT');
  END IF;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id',role_rows.id,
        'name',role_rows.name,
        'label',role_rows.label
      )
      ORDER BY
        CASE role_rows.name
          WHEN 'superadmin' THEN 0
          WHEN 'headmaster' THEN 1
          ELSE 2
        END,
        role_rows.name
    ),
    '[]'::jsonb
  )
  INTO v_roles
  FROM (
    SELECT DISTINCT r.id,r.name,r.label
    FROM system.system_user_role sur
    JOIN system.system_role r ON r.id=sur.role_id
    WHERE sur.user_id=v_user.id
      AND sur.school_id=v_school_id
      AND (sur.expires_at IS NULL OR sur.expires_at>CURRENT_TIMESTAMP)
      AND r.archived_at IS NULL
  ) role_rows;

  IF jsonb_array_length(v_roles)=0 THEN
    RETURN jsonb_build_object('ok',false,'reason','NO_CONTEXT');
  END IF;

  DELETE FROM system.system_auth_ticket
  WHERE expires_at < CURRENT_TIMESTAMP-interval '5 minutes'
     OR used_at IS NOT NULL;

  v_ticket_id := gen_random_uuid()::text;

  INSERT INTO system.system_auth_ticket
    (id,user_id,school_id,created_at,expires_at,used_at)
  VALUES
    (v_ticket_id,v_user.id,v_school_id,CURRENT_TIMESTAMP,
     CURRENT_TIMESTAMP+interval '60 seconds',NULL);

  RETURN jsonb_build_object(
    'ok',true,
    'ticketId',v_ticket_id,
    'userId',v_user.id,
    'email',v_user.email,
    'isVerified',v_user.is_verified,
    'mustResetPassword',v_user.must_reset_password,
    'status',v_user.status,
    'schoolId',v_school_id,
    'roles',v_roles
  );
END
$function$;
REVOKE ALL ON FUNCTION
  system.auth_verify_credentials(text,text,text,text)
FROM PUBLIC;

-- --------------------------------------------------------------------------
-- 7. Ticket -> school-bound server session.
-- --------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION system.auth_finalize_session(
  p_ticket_id text,
  p_session_id text,
  p_refresh_token_hash text,
  p_ip_address text,
  p_user_agent text,
  p_expires_at timestamp(3) without time zone
)
RETURNS void
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = pg_catalog, system, sukuux
AS $function$
DECLARE
  v_ticket system.system_auth_ticket%ROWTYPE;
  v_user system.system_user%ROWTYPE;
BEGIN
  SELECT * INTO v_ticket
  FROM system.system_auth_ticket
  WHERE id=p_ticket_id
  FOR UPDATE;

  IF NOT FOUND
     OR v_ticket.used_at IS NOT NULL
     OR v_ticket.expires_at<=CURRENT_TIMESTAMP THEN
    RAISE EXCEPTION 'Authentication ticket is invalid or expired';
  END IF;

  SELECT * INTO v_user
  FROM system.system_user
  WHERE id=v_ticket.user_id
  FOR UPDATE;

  IF NOT FOUND
     OR v_user.archived_at IS NOT NULL
     OR v_user.status IN ('LOCKED','SUSPENDED','CLOSED') THEN
    RAISE EXCEPTION 'User is no longer eligible to establish a session';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM system.system_user_role sur
    JOIN system.system_role r ON r.id=sur.role_id
    WHERE sur.user_id=v_ticket.user_id
      AND sur.school_id=v_ticket.school_id
      AND (sur.expires_at IS NULL OR sur.expires_at>CURRENT_TIMESTAMP)
      AND r.archived_at IS NULL
  ) THEN
    RAISE EXCEPTION 'User no longer has active school authority';
  END IF;

  INSERT INTO system.system_session (
    id,user_id,school_id,refresh_token_hash,ip_address,user_agent,device_id,
    is_active,created_at,expires_at,last_activity_at,invalidated_at
  )
  VALUES (
    p_session_id,v_ticket.user_id,v_ticket.school_id,p_refresh_token_hash,
    p_ip_address,p_user_agent,NULL,true,CURRENT_TIMESTAMP,p_expires_at,
    CURRENT_TIMESTAMP,NULL
  );

  UPDATE system.system_user
  SET
    status=CASE
      WHEN status IN ('INVITED','PENDING_VERIFICATION') THEN 'ACTIVE'
      ELSE status
    END,
    is_active=CASE
      WHEN status IN ('INVITED','PENDING_VERIFICATION') THEN true
      ELSE is_active
    END,
    is_verified=CASE
      WHEN status IN ('INVITED','PENDING_VERIFICATION') THEN true
      ELSE is_verified
    END,
    row_version=CASE
      WHEN status IN ('INVITED','PENDING_VERIFICATION') THEN row_version+1
      ELSE row_version
    END,
    failed_login_count=0,
    locked_until=NULL,
    last_login_at=CURRENT_TIMESTAMP
  WHERE id=v_ticket.user_id;

  INSERT INTO system.system_authentication_log
    (id,user_id,login_status,ip_address,user_agent,created_at)
  VALUES
    (gen_random_uuid()::text,v_ticket.user_id,'SUCCESS'::sukuux."AuthLoginStatus",
     p_ip_address,p_user_agent,CURRENT_TIMESTAMP);

  UPDATE system.system_auth_ticket
  SET used_at=CURRENT_TIMESTAMP
  WHERE id=v_ticket.id;
END
$function$;
REVOKE ALL ON FUNCTION
  system.auth_finalize_session(
    text,text,text,text,text,timestamp without time zone
  )
FROM PUBLIC;

-- --------------------------------------------------------------------------
-- 8. Authoritative session lookup for the application middleware.
-- --------------------------------------------------------------------------

DROP FUNCTION IF EXISTS system.auth_lookup_session(text,text);

CREATE FUNCTION system.auth_lookup_session(
  p_session_id text,
  p_user_id text
)
RETURNS TABLE (
  session_id text,
  user_id text,
  school_id text,
  role_key text,
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
    s.id,
    s.user_id,
    s.school_id,
    primary_role.role_key,
    s.refresh_token_hash,
    s.is_active,
    s.expires_at,
    s.last_activity_at,
    s.invalidated_at,
    u.is_active,
    u.status,
    u.must_reset_password
  FROM system.system_session s
  JOIN system.system_user u ON u.id=s.user_id
  LEFT JOIN LATERAL (
    SELECT r.name AS role_key
    FROM system.system_user_role sur
    JOIN system.system_role r ON r.id=sur.role_id
    WHERE sur.user_id=s.user_id
      AND sur.school_id=s.school_id
      AND (sur.expires_at IS NULL OR sur.expires_at>CURRENT_TIMESTAMP)
      AND r.archived_at IS NULL
    ORDER BY
      CASE r.name
        WHEN 'superadmin' THEN 0
        WHEN 'headmaster' THEN 1
        ELSE 2
      END,
      r.name
    LIMIT 1
  ) primary_role ON true
  WHERE s.id=p_session_id
    AND s.user_id=p_user_id
  LIMIT 1
$function$;

REVOKE ALL ON FUNCTION system.auth_lookup_session(text,text) FROM PUBLIC;

-- --------------------------------------------------------------------------
-- 9. Runtime function grants.
-- --------------------------------------------------------------------------

DO $runtime_grants$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname='sukuu_app_runtime') THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION system.auth_verify_credentials(text,text,text,text) TO sukuu_app_runtime';
    EXECUTE 'GRANT EXECUTE ON FUNCTION system.auth_finalize_session(text,text,text,text,text,timestamp without time zone) TO sukuu_app_runtime';
    EXECUTE 'GRANT EXECUTE ON FUNCTION system.auth_lookup_session(text,text) TO sukuu_app_runtime';
    EXECUTE 'GRANT EXECUTE ON FUNCTION system.ctx_user_id() TO sukuu_app_runtime';
    EXECUTE 'GRANT EXECUTE ON FUNCTION system.ctx_school_id() TO sukuu_app_runtime';
    EXECUTE 'GRANT EXECUTE ON FUNCTION system.ctx_has_role(text) TO sukuu_app_runtime';
    EXECUTE 'GRANT EXECUTE ON FUNCTION system.ctx_is_system_admin() TO sukuu_app_runtime';
    EXECUTE 'GRANT EXECUTE ON FUNCTION system.ctx_can_access_user(text) TO sukuu_app_runtime';
  END IF;
END
$runtime_grants$;

DO $post_guard$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM system.system_session
    WHERE is_active=true
      AND invalidated_at IS NULL
      AND expires_at>CURRENT_TIMESTAMP
      AND school_id IS NULL
  ) THEN
    RAISE EXCEPTION 'Stage 3B post-check failed: active session without school';
  END IF;
END
$post_guard$;

COMMIT;
