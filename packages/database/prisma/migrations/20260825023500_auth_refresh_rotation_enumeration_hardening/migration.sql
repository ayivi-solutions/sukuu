-- ============================================================================
-- SUKUU STAGE 3B PHASE 2F
-- Authentication Enumeration + Refresh Rotation Hardening
-- Additive, forward-only migration. No outer BEGIN/COMMIT wrapper.
-- ============================================================================

DO $preflight$
BEGIN
  IF to_regclass('system.system_user') IS NULL THEN
    RAISE EXCEPTION 'Phase 2F aborted: system_user missing';
  END IF;

  IF to_regclass('system.system_session') IS NULL THEN
    RAISE EXCEPTION 'Phase 2F aborted: system_session missing';
  END IF;

  IF to_regprocedure('system.auth_verify_credentials(text,text,text,text)') IS NULL THEN
    RAISE EXCEPTION 'Phase 2F aborted: credential verifier missing';
  END IF;

  IF to_regprocedure('system._auth_password_matches(text,text)') IS NULL THEN
    RAISE EXCEPTION 'Phase 2F aborted: password helper missing';
  END IF;

  IF to_regprocedure('system._auth_verify_credentials_core(text,text,text,text)') IS NOT NULL THEN
    RAISE EXCEPTION 'Phase 2F aborted: verifier core already exists';
  END IF;

  IF to_regprocedure('system.auth_rotate_refresh_session(text,text,text,text,text,text)') IS NOT NULL THEN
    RAISE EXCEPTION 'Phase 2F aborted: refresh rotation already exists';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM system.system_user u
    WHERE u.archived_at IS NULL
      AND u.status <> 'CLOSED'
      AND u.password_hash IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Phase 2F aborted: no current password hash is available for timing normalization';
  END IF;
END
$preflight$;

ALTER FUNCTION system.auth_verify_credentials(text,text,text,text)
RENAME TO _auth_verify_credentials_core;

REVOKE ALL
ON FUNCTION system._auth_verify_credentials_core(text,text,text,text)
FROM PUBLIC;

DO $revoke_core_runtime$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_catalog.pg_roles
    WHERE rolname='sukuu_app_runtime'
  ) THEN
    EXECUTE
      'REVOKE EXECUTE ON FUNCTION system._auth_verify_credentials_core(text,text,text,text) FROM sukuu_app_runtime';
  END IF;
END
$revoke_core_runtime$;

CREATE FUNCTION system.auth_verify_credentials(
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
  v_candidate record;
  v_dummy_hash text;
BEGIN
  SELECT u.password_hash, u.locked_until
    INTO v_candidate
  FROM system.system_user u
  WHERE u.archived_at IS NULL
    AND u.status <> 'CLOSED'
    AND lower(btrim(u.email))=lower(btrim(p_email))
  LIMIT 1;

  IF NOT FOUND THEN
    SELECT u.password_hash
      INTO v_dummy_hash
    FROM system.system_user u
    WHERE u.archived_at IS NULL
      AND u.status <> 'CLOSED'
      AND u.password_hash IS NOT NULL
    ORDER BY u.id
    LIMIT 1;

    PERFORM system._auth_password_matches(
      p_password,
      v_dummy_hash
    );

    INSERT INTO system.system_authentication_log
      (id,user_id,login_status,ip_address,user_agent,created_at)
    VALUES
      (gen_random_uuid()::text,NULL,'FAILED'::sukuux."AuthLoginStatus",
       p_ip_address,p_user_agent,CURRENT_TIMESTAMP);

    RETURN jsonb_build_object(
      'ok',false,
      'reason','INVALID'
    );
  END IF;

  IF v_candidate.locked_until IS NOT NULL
     AND v_candidate.locked_until > CURRENT_TIMESTAMP THEN
    PERFORM system._auth_password_matches(
      p_password,
      v_candidate.password_hash
    );
  END IF;

  RETURN system._auth_verify_credentials_core(
    p_email,
    p_password,
    p_ip_address,
    p_user_agent
  );
END
$function$;

REVOKE ALL
ON FUNCTION system.auth_verify_credentials(text,text,text,text)
FROM PUBLIC;

CREATE FUNCTION system.auth_rotate_refresh_session(
  p_session_id text,
  p_user_id text,
  p_presented_refresh_token text,
  p_new_refresh_token_hash text,
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
  v_session system.system_session%ROWTYPE;
  v_user system.system_user%ROWTYPE;
  v_role_key text;
BEGIN
  IF p_session_id IS NULL
     OR p_user_id IS NULL
     OR p_presented_refresh_token IS NULL
     OR length(p_presented_refresh_token) < 32
     OR p_new_refresh_token_hash IS NULL
     OR p_new_refresh_token_hash !~ '^\$2[aby]\$[0-9]{2}\$'
  THEN
    RETURN jsonb_build_object('ok',false,'reason','INVALID');
  END IF;

  SELECT s.*
    INTO v_session
  FROM system.system_session s
  WHERE s.id=p_session_id
    AND s.user_id=p_user_id
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND
     OR v_session.is_active <> true
     OR v_session.invalidated_at IS NOT NULL
     OR v_session.expires_at <= CURRENT_TIMESTAMP
     OR v_session.school_id IS NULL
  THEN
    RETURN jsonb_build_object('ok',false,'reason','INVALID');
  END IF;

  IF NOT system._auth_password_matches(
    p_presented_refresh_token,
    v_session.refresh_token_hash
  ) THEN
    UPDATE system.system_session
    SET
      is_active=false,
      invalidated_at=COALESCE(invalidated_at,CURRENT_TIMESTAMP),
      last_activity_at=CURRENT_TIMESTAMP
    WHERE id=v_session.id;

    INSERT INTO system.system_audit_event
      (id,user_id,school_id,action,entity_type,entity_id,
       before_state,after_state,created_at)
    VALUES
      (
        gen_random_uuid()::text,
        v_session.user_id,
        v_session.school_id,
        'REFRESH_TOKEN_REPLAY_DETECTED',
        'system_session',
        v_session.id,
        NULL,
        jsonb_build_object(
          'sessionInvalidated',true,
          'ipAddress',p_ip_address,
          'userAgent',p_user_agent
        )::text,
        CURRENT_TIMESTAMP
      );

    RETURN jsonb_build_object('ok',false,'reason','REPLAY');
  END IF;

  SELECT u.*
    INTO v_user
  FROM system.system_user u
  WHERE u.id=v_session.user_id
    AND u.archived_at IS NULL
  LIMIT 1;

  IF NOT FOUND
     OR v_user.is_active <> true
     OR v_user.status IN ('LOCKED','SUSPENDED','CLOSED')
  THEN
    UPDATE system.system_session
    SET
      is_active=false,
      invalidated_at=COALESCE(invalidated_at,CURRENT_TIMESTAMP),
      last_activity_at=CURRENT_TIMESTAMP
    WHERE id=v_session.id;

    RETURN jsonb_build_object('ok',false,'reason','INVALID');
  END IF;

  SELECT r.name
    INTO v_role_key
  FROM system.system_user_role sur
  JOIN system.system_role r ON r.id=sur.role_id
  WHERE sur.user_id=v_session.user_id
    AND sur.school_id=v_session.school_id
    AND (sur.expires_at IS NULL OR sur.expires_at>CURRENT_TIMESTAMP)
    AND r.archived_at IS NULL
  ORDER BY
    CASE r.name
      WHEN 'superadmin' THEN 0
      WHEN 'headmaster' THEN 1
      ELSE 2
    END,
    r.name
  LIMIT 1;

  IF v_role_key IS NULL THEN
    UPDATE system.system_session
    SET
      is_active=false,
      invalidated_at=COALESCE(invalidated_at,CURRENT_TIMESTAMP),
      last_activity_at=CURRENT_TIMESTAMP
    WHERE id=v_session.id;

    RETURN jsonb_build_object('ok',false,'reason','INVALID');
  END IF;

  UPDATE system.system_session
  SET
    refresh_token_hash=p_new_refresh_token_hash,
    last_activity_at=CURRENT_TIMESTAMP
  WHERE id=v_session.id;

  RETURN jsonb_build_object(
    'ok',true,
    'schoolId',v_session.school_id,
    'roleKey',v_role_key,
    'mustResetPassword',v_user.must_reset_password,
    'expiresAt',v_session.expires_at,
    'authAssurance',v_session.auth_assurance
  );
END
$function$;

REVOKE ALL
ON FUNCTION system.auth_rotate_refresh_session(text,text,text,text,text,text)
FROM PUBLIC;

DO $runtime_grants$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_catalog.pg_roles
    WHERE rolname='sukuu_app_runtime'
  ) THEN
    EXECUTE
      'GRANT EXECUTE ON FUNCTION system.auth_verify_credentials(text,text,text,text) TO sukuu_app_runtime';
    EXECUTE
      'GRANT EXECUTE ON FUNCTION system.auth_rotate_refresh_session(text,text,text,text,text,text) TO sukuu_app_runtime';
    EXECUTE
      'REVOKE EXECUTE ON FUNCTION system._auth_verify_credentials_core(text,text,text,text) FROM sukuu_app_runtime';
  END IF;
END
$runtime_grants$;

DO $postflight$
BEGIN
  IF to_regprocedure('system.auth_verify_credentials(text,text,text,text)') IS NULL THEN
    RAISE EXCEPTION 'Phase 2F postflight: hardened verifier missing';
  END IF;

  IF to_regprocedure('system._auth_verify_credentials_core(text,text,text,text)') IS NULL THEN
    RAISE EXCEPTION 'Phase 2F postflight: verifier core missing';
  END IF;

  IF to_regprocedure('system.auth_rotate_refresh_session(text,text,text,text,text,text)') IS NULL THEN
    RAISE EXCEPTION 'Phase 2F postflight: refresh rotation missing';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_catalog.pg_roles
    WHERE rolname='sukuu_app_runtime'
  ) THEN
    IF NOT has_function_privilege(
      'sukuu_app_runtime',
      'system.auth_verify_credentials(text,text,text,text)',
      'EXECUTE'
    ) THEN
      RAISE EXCEPTION 'Phase 2F postflight: verifier execute missing';
    END IF;

    IF NOT has_function_privilege(
      'sukuu_app_runtime',
      'system.auth_rotate_refresh_session(text,text,text,text,text,text)',
      'EXECUTE'
    ) THEN
      RAISE EXCEPTION 'Phase 2F postflight: refresh execute missing';
    END IF;

    IF has_function_privilege(
      'sukuu_app_runtime',
      'system._auth_verify_credentials_core(text,text,text,text)',
      'EXECUTE'
    ) THEN
      RAISE EXCEPTION 'Phase 2F postflight: runtime can bypass hardened verifier';
    END IF;
  END IF;
END
$postflight$;
