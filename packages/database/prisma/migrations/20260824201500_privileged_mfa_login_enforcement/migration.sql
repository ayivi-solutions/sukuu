BEGIN;

-- ============================================================================
-- SUKUU STAGE 3B PHASE 2D
-- Privileged MFA Login Enforcement
--
-- CUTOVER SCOPE
--   - tenant superadmin
--   - tenant headmaster
--
-- platform_admin is intentionally NOT downgraded to this TOTP-only path.
-- Its stronger phishing-resistant privileged identity path remains separate.
--
-- This migration:
--   1. requires TOTP to establish superadmin/headmaster sessions
--   2. prevents the legacy password-only finalizer from creating such sessions
--   3. binds login TOTP to the password-verification ticket by HMAC proof
--   4. prevents TOTP counter replay
--   5. establishes auth_assurance=MFA at login
--   6. deliberately does NOT grant a fresh SystemX step-up window
-- ============================================================================


-- --------------------------------------------------------------------------
-- 1. Cutover preconditions.
-- --------------------------------------------------------------------------

DO $preflight$
DECLARE
  v_privileged_users integer;
  v_protected_users integer;
  v_open_recovery integer;
  v_pending_recovery integer;
  v_active_privileged_sessions integer;
BEGIN

  IF to_regclass(
    'system.system_auth_ticket'
  ) IS NULL
  OR to_regclass(
    'system.system_session'
  ) IS NULL
  OR to_regclass(
    'system.system_mfa'
  ) IS NULL
  OR to_regclass(
    'system.system_mfa_recovery_challenge'
  ) IS NULL THEN

    RAISE EXCEPTION
      'Privileged MFA login cutover aborted: required foundation table missing';

  END IF;


  IF to_regprocedure(
    'system.auth_verify_credentials(text,text,text,text)'
  ) IS NULL
  OR to_regprocedure(
    'system.auth_finalize_session(text,text,text,text,text,timestamp without time zone)'
  ) IS NULL
  OR to_regprocedure(
    'system.auth_finalize_session(text,text,text,text,text,timestamp with time zone)'
  ) IS NULL
  OR to_regprocedure(
    'system._mfa_proof_secret()'
  ) IS NULL
  OR to_regprocedure(
    'system._hmac_sha256_hex(text,text)'
  ) IS NULL THEN

    RAISE EXCEPTION
      'Privileged MFA login cutover aborted: required authentication function missing';

  END IF;


  SELECT
    COUNT(
      DISTINCT sur.user_id
    )::integer

  INTO
    v_privileged_users

  FROM
    system.system_user_role sur

  JOIN
    system.system_role r
    ON r.id=sur.role_id

  JOIN
    system.system_user u
    ON u.id=sur.user_id

  WHERE
    r.name IN (
      'superadmin',
      'headmaster'
    )

    AND r.archived_at IS NULL
    AND u.archived_at IS NULL
    AND u.is_active=true
    AND u.status='ACTIVE'

    AND (
      sur.expires_at IS NULL
      OR sur.expires_at >
         CURRENT_TIMESTAMP
    );


  SELECT
    COUNT(
      DISTINCT sur.user_id
    )::integer

  INTO
    v_protected_users

  FROM
    system.system_user_role sur

  JOIN
    system.system_role r
    ON r.id=sur.role_id

  JOIN
    system.system_user u
    ON u.id=sur.user_id

  JOIN
    system.system_mfa m
    ON m.user_id=sur.user_id
    AND m.method=
      'TOTP'::sukuux."MfaMethod"

  WHERE
    r.name IN (
      'superadmin',
      'headmaster'
    )

    AND r.archived_at IS NULL
    AND u.archived_at IS NULL
    AND u.is_active=true
    AND u.status='ACTIVE'

    AND (
      sur.expires_at IS NULL
      OR sur.expires_at >
         CURRENT_TIMESTAMP
    )

    AND m.is_enabled=true
    AND m.verified_at IS NOT NULL
    AND m.secret IS NOT NULL
    AND m.last_verified_counter IS NOT NULL
    AND m.failed_attempt_count=0
    AND (
      m.locked_until IS NULL
      OR m.locked_until <=
         CURRENT_TIMESTAMP
    );


  IF
    v_privileged_users <> 2
    OR v_protected_users <> 2
  THEN

    RAISE EXCEPTION
      'Privileged MFA login cutover aborted: expected exactly two fully protected tenant privileged identities';

  END IF;


  SELECT
    COUNT(*)::integer

  INTO
    v_open_recovery

  FROM
    system.system_mfa_recovery_challenge

  WHERE
    consumed_at IS NULL
    AND revoked_at IS NULL;


  SELECT
    COUNT(*)::integer

  INTO
    v_pending_recovery

  FROM
    system.system_mfa_recovery_challenge

  WHERE
    pending_secret_envelope IS NOT NULL;


  IF
    v_open_recovery <> 0
    OR v_pending_recovery <> 0
  THEN

    RAISE EXCEPTION
      'Privileged MFA login cutover aborted: recovery operation is still open';

  END IF;


  SELECT
    COUNT(*)::integer

  INTO
    v_active_privileged_sessions

  FROM
    system.system_session s

  WHERE
    s.is_active=true
    AND s.invalidated_at IS NULL
    AND s.expires_at >
        CURRENT_TIMESTAMP

    AND EXISTS (

      SELECT 1

      FROM
        system.system_user_role sur

      JOIN
        system.system_role r
        ON r.id=sur.role_id

      WHERE
        sur.user_id=s.user_id
        AND sur.school_id=s.school_id

        AND r.name IN (
          'superadmin',
          'headmaster'
        )

        AND r.archived_at IS NULL

        AND (
          sur.expires_at IS NULL
          OR sur.expires_at >
             CURRENT_TIMESTAMP
        )

    );


  IF
    v_active_privileged_sessions <> 0
  THEN

    RAISE EXCEPTION
      'Privileged MFA login cutover aborted: active privileged sessions must be zero';

  END IF;

END
$preflight$;


-- --------------------------------------------------------------------------
-- 2. Password-verification ticket -> MFA requirement.
--
-- This path consumes the first password-verification ticket when the client
-- has not yet supplied a TOTP. The next request re-verifies the password and
-- creates a fresh ticket for cryptographic MFA verification.
-- --------------------------------------------------------------------------

CREATE FUNCTION
  system.auth_mfa_login_requirement(
    p_ticket_id text
  )

RETURNS jsonb

LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER

SET search_path =
  pg_catalog,
  system,
  sukuux

AS $function$

DECLARE

  v_ticket
    system.system_auth_ticket%ROWTYPE;

  v_mfa
    system.system_mfa%ROWTYPE;

  v_privileged boolean;

BEGIN

  SELECT
    t.*

  INTO
    v_ticket

  FROM
    system.system_auth_ticket t

  WHERE
    t.id=p_ticket_id

  LIMIT 1

  FOR UPDATE;


  IF NOT FOUND
     OR v_ticket.used_at IS NOT NULL
     OR v_ticket.expires_at <=
        CURRENT_TIMESTAMP
  THEN

    RETURN jsonb_build_object(
      'ok',
      false,
      'reason',
      'INVALID_TICKET'
    );

  END IF;


  v_privileged :=
    EXISTS (

      SELECT 1

      FROM
        system.system_user_role sur

      JOIN
        system.system_role r
        ON r.id=sur.role_id

      WHERE
        sur.user_id=
          v_ticket.user_id

        AND sur.school_id=
          v_ticket.school_id

        AND r.name IN (
          'superadmin',
          'headmaster'
        )

        AND r.archived_at IS NULL

        AND (
          sur.expires_at IS NULL
          OR sur.expires_at >
             CURRENT_TIMESTAMP
        )

    );


  IF NOT v_privileged THEN

    RETURN jsonb_build_object(
      'ok',
      true,
      'required',
      false
    );

  END IF;


  SELECT
    m.*

  INTO
    v_mfa

  FROM
    system.system_mfa m

  WHERE
    m.user_id=
      v_ticket.user_id

    AND m.method=
      'TOTP'::sukuux."MfaMethod"

  LIMIT 1

  FOR UPDATE;


  UPDATE
    system.system_auth_ticket

  SET
    used_at=
      CURRENT_TIMESTAMP

  WHERE
    id=v_ticket.id;


  IF NOT FOUND
     OR v_mfa.secret IS NULL
     OR v_mfa.is_enabled <> true
     OR v_mfa.verified_at IS NULL
  THEN

    RETURN jsonb_build_object(
      'ok',
      false,
      'reason',
      'MFA_REQUIRED'
    );

  END IF;


  IF
    v_mfa.locked_until IS NOT NULL
    AND v_mfa.locked_until >
        CURRENT_TIMESTAMP
  THEN

    RETURN jsonb_build_object(
      'ok',
      false,
      'reason',
      'TEMP_LOCK',
      'lockedUntil',
      v_mfa.locked_until
    );

  END IF;


  RETURN jsonb_build_object(
    'ok',
    true,
    'required',
    true,
    'method',
    'TOTP'
  );

END
$function$;


REVOKE ALL

ON FUNCTION
  system.auth_mfa_login_requirement(
    text
  )

FROM PUBLIC;


-- --------------------------------------------------------------------------
-- 3. Encrypted login MFA material for one valid password ticket.
--
-- No direct runtime table access is granted. The application still needs
-- MFA_ENCRYPTION_KEY to decrypt the envelope.
-- --------------------------------------------------------------------------

CREATE FUNCTION
  system.auth_mfa_login_material(
    p_ticket_id text
  )

RETURNS jsonb

LANGUAGE plpgsql
STABLE
SECURITY DEFINER

SET search_path =
  pg_catalog,
  system,
  sukuux

AS $function$

DECLARE

  v_ticket
    system.system_auth_ticket%ROWTYPE;

  v_user
    system.system_user%ROWTYPE;

  v_mfa
    system.system_mfa%ROWTYPE;

BEGIN

  SELECT
    t.*

  INTO
    v_ticket

  FROM
    system.system_auth_ticket t

  WHERE
    t.id=p_ticket_id

  LIMIT 1;


  IF NOT FOUND
     OR v_ticket.used_at IS NOT NULL
     OR v_ticket.expires_at <=
        CURRENT_TIMESTAMP
  THEN

    RETURN jsonb_build_object(
      'ok',
      false,
      'reason',
      'INVALID_TICKET'
    );

  END IF;


  SELECT
    u.*

  INTO
    v_user

  FROM
    system.system_user u

  WHERE
    u.id=v_ticket.user_id
    AND u.archived_at IS NULL
    AND u.is_active=true
    AND u.status='ACTIVE'

  LIMIT 1;


  IF NOT FOUND THEN

    RETURN jsonb_build_object(
      'ok',
      false,
      'reason',
      'ACCOUNT_BLOCKED'
    );

  END IF;


  IF NOT EXISTS (

    SELECT 1

    FROM
      system.system_user_role sur

    JOIN
      system.system_role r
      ON r.id=sur.role_id

    WHERE
      sur.user_id=
        v_ticket.user_id

      AND sur.school_id=
        v_ticket.school_id

      AND r.name IN (
        'superadmin',
        'headmaster'
      )

      AND r.archived_at IS NULL

      AND (
        sur.expires_at IS NULL
        OR sur.expires_at >
           CURRENT_TIMESTAMP
      )

  ) THEN

    RETURN jsonb_build_object(
      'ok',
      false,
      'reason',
      'NOT_PRIVILEGED'
    );

  END IF;


  SELECT
    m.*

  INTO
    v_mfa

  FROM
    system.system_mfa m

  WHERE
    m.user_id=
      v_ticket.user_id

    AND m.method=
      'TOTP'::sukuux."MfaMethod"

  LIMIT 1;


  IF NOT FOUND
     OR v_mfa.secret IS NULL
     OR v_mfa.is_enabled <> true
     OR v_mfa.verified_at IS NULL
  THEN

    RETURN jsonb_build_object(
      'ok',
      false,
      'reason',
      'MFA_REQUIRED'
    );

  END IF;


  IF
    v_mfa.locked_until IS NOT NULL
    AND v_mfa.locked_until >
        CURRENT_TIMESTAMP
  THEN

    RETURN jsonb_build_object(
      'ok',
      false,
      'reason',
      'TEMP_LOCK',
      'lockedUntil',
      v_mfa.locked_until
    );

  END IF;


  RETURN jsonb_build_object(
    'ok',
    true,
    'required',
    true,
    'method',
    'TOTP',
    'userId',
    v_ticket.user_id,
    'schoolId',
    v_ticket.school_id,
    'email',
    v_user.email,
    'secretEnvelope',
    v_mfa.secret,
    'lastVerifiedCounter',
    v_mfa.last_verified_counter
  );

END
$function$;


REVOKE ALL

ON FUNCTION
  system.auth_mfa_login_material(
    text
  )

FROM PUBLIC;


-- --------------------------------------------------------------------------
-- 4. Invalid/replayed login MFA accounting.
--
-- Each password ticket is single-attempt for MFA. A fresh attempt requires
-- the password to be verified again.
-- --------------------------------------------------------------------------

CREATE FUNCTION
  system.auth_mfa_login_record_failure(
    p_ticket_id text,
    p_ip_address text,
    p_user_agent text
  )

RETURNS jsonb

LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER

SET search_path =
  pg_catalog,
  system,
  sukuux

AS $function$

DECLARE

  v_ticket
    system.system_auth_ticket%ROWTYPE;

  v_mfa
    system.system_mfa%ROWTYPE;

  v_count integer;
  v_locked_until timestamp(3)
    without time zone;

BEGIN

  SELECT
    t.*

  INTO
    v_ticket

  FROM
    system.system_auth_ticket t

  WHERE
    t.id=p_ticket_id

  LIMIT 1

  FOR UPDATE;


  IF NOT FOUND
     OR v_ticket.used_at IS NOT NULL
     OR v_ticket.expires_at <=
        CURRENT_TIMESTAMP
  THEN

    RETURN jsonb_build_object(
      'ok',
      false,
      'reason',
      'INVALID_TICKET'
    );

  END IF;


  SELECT
    m.*

  INTO
    v_mfa

  FROM
    system.system_mfa m

  WHERE
    m.user_id=
      v_ticket.user_id

    AND m.method=
      'TOTP'::sukuux."MfaMethod"

    AND m.is_enabled=true

  LIMIT 1

  FOR UPDATE;


  UPDATE
    system.system_auth_ticket

  SET
    used_at=
      CURRENT_TIMESTAMP

  WHERE
    id=v_ticket.id;


  IF NOT FOUND THEN

    RETURN jsonb_build_object(
      'ok',
      false,
      'reason',
      'MFA_REQUIRED'
    );

  END IF;


  UPDATE
    system.system_mfa

  SET
    failed_attempt_count=
      failed_attempt_count+1,

    locked_until=
      CASE

        WHEN failed_attempt_count+1 >= 5
        THEN
          CURRENT_TIMESTAMP+
          interval '5 minutes'

        ELSE
          locked_until

      END,

    updated_at=
      CURRENT_TIMESTAMP

  WHERE
    id=v_mfa.id

  RETURNING
    failed_attempt_count,
    locked_until

  INTO
    v_count,
    v_locked_until;


  INSERT INTO
    system.system_authentication_log
  (
    id,
    user_id,
    login_status,
    ip_address,
    user_agent,
    created_at
  )
  VALUES
  (
    gen_random_uuid()::text,
    v_ticket.user_id,

    CASE
      WHEN v_locked_until IS NOT NULL
           AND v_locked_until >
               CURRENT_TIMESTAMP
      THEN
        'LOCKED'::sukuux."AuthLoginStatus"
      ELSE
        'FAILED'::sukuux."AuthLoginStatus"
    END,

    p_ip_address,
    p_user_agent,
    CURRENT_TIMESTAMP
  );


  INSERT INTO
    system.system_audit_event
  (
    id,
    user_id,
    school_id,
    action,
    entity_type,
    entity_id,
    before_state,
    after_state,
    created_at
  )
  VALUES
  (
    gen_random_uuid()::text,
    v_ticket.user_id,
    v_ticket.school_id,
    'MFA_LOGIN_FAILED',
    'system_mfa',
    v_mfa.id,
    NULL,
    jsonb_build_object(
      'failedAttempts',
      v_count,
      'locked',
      v_locked_until IS NOT NULL
      AND v_locked_until >
          CURRENT_TIMESTAMP
    )::text,
    CURRENT_TIMESTAMP
  );


  RETURN jsonb_build_object(
    'ok',
    true,
    'failedAttempts',
    v_count,
    'lockedUntil',
    v_locked_until
  );

END
$function$;


REVOKE ALL

ON FUNCTION
  system.auth_mfa_login_record_failure(
    text,
    text,
    text
  )

FROM PUBLIC;


-- --------------------------------------------------------------------------
-- 5. Private login verification proof.
-- --------------------------------------------------------------------------

CREATE FUNCTION
  system._mfa_login_proof_valid(
    p_ticket_id text,
    p_user_id text,
    p_school_id text,
    p_counter bigint,
    p_proof text
  )

RETURNS boolean

LANGUAGE plpgsql
STABLE
SECURITY DEFINER

SET search_path =
  pg_catalog,
  system

AS $function$

DECLARE

  v_secret text;
  v_expected text;

BEGIN

  IF
    p_ticket_id IS NULL
    OR p_user_id IS NULL
    OR p_school_id IS NULL
    OR p_counter IS NULL
    OR p_proof IS NULL
  THEN

    RETURN false;

  END IF;


  v_secret :=
    system._mfa_proof_secret();


  IF
    v_secret IS NULL
    OR length(v_secret) < 32
  THEN

    RETURN false;

  END IF;


  v_expected :=
    system._hmac_sha256_hex(
      'LOGIN'
      || ':'
      || p_ticket_id
      || ':'
      || p_user_id
      || ':'
      || p_school_id
      || ':'
      || p_counter::text,
      v_secret
    );


  RETURN (
    v_expected IS NOT NULL
    AND v_expected=p_proof
  );

END
$function$;


REVOKE ALL

ON FUNCTION
  system._mfa_login_proof_valid(
    text,
    text,
    text,
    bigint,
    text
  )

FROM PUBLIC;


-- --------------------------------------------------------------------------
-- 6. MFA-bound privileged session finalization.
-- --------------------------------------------------------------------------

CREATE FUNCTION
  system.auth_finalize_mfa_session(
    p_ticket_id text,
    p_session_id text,
    p_refresh_token_hash text,
    p_ip_address text,
    p_user_agent text,
    p_expires_at timestamp with time zone,
    p_counter bigint,
    p_proof text
  )

RETURNS jsonb

LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER

SET search_path =
  pg_catalog,
  system,
  sukuux

AS $function$

DECLARE

  v_ticket
    system.system_auth_ticket%ROWTYPE;

  v_user
    system.system_user%ROWTYPE;

  v_mfa
    system.system_mfa%ROWTYPE;

BEGIN

  SELECT
    t.*

  INTO
    v_ticket

  FROM
    system.system_auth_ticket t

  WHERE
    t.id=p_ticket_id

  LIMIT 1

  FOR UPDATE;


  IF NOT FOUND
     OR v_ticket.used_at IS NOT NULL
     OR v_ticket.expires_at <=
        CURRENT_TIMESTAMP
  THEN

    RETURN jsonb_build_object(
      'ok',
      false,
      'reason',
      'INVALID_TICKET'
    );

  END IF;


  SELECT
    u.*

  INTO
    v_user

  FROM
    system.system_user u

  WHERE
    u.id=v_ticket.user_id

  LIMIT 1

  FOR UPDATE;


  IF NOT FOUND
     OR v_user.archived_at IS NOT NULL
     OR v_user.is_active <> true
     OR v_user.status IN (
       'LOCKED',
       'SUSPENDED',
       'CLOSED'
     )
  THEN

    RETURN jsonb_build_object(
      'ok',
      false,
      'reason',
      'ACCOUNT_BLOCKED'
    );

  END IF;


  IF NOT EXISTS (

    SELECT 1

    FROM
      system.system_user_role sur

    JOIN
      system.system_role r
      ON r.id=sur.role_id

    WHERE
      sur.user_id=
        v_ticket.user_id

      AND sur.school_id=
        v_ticket.school_id

      AND r.name IN (
        'superadmin',
        'headmaster'
      )

      AND r.archived_at IS NULL

      AND (
        sur.expires_at IS NULL
        OR sur.expires_at >
           CURRENT_TIMESTAMP
      )

  ) THEN

    RETURN jsonb_build_object(
      'ok',
      false,
      'reason',
      'NOT_PRIVILEGED'
    );

  END IF;


  SELECT
    m.*

  INTO
    v_mfa

  FROM
    system.system_mfa m

  WHERE
    m.user_id=
      v_ticket.user_id

    AND m.method=
      'TOTP'::sukuux."MfaMethod"

    AND m.is_enabled=true
    AND m.verified_at IS NOT NULL

  LIMIT 1

  FOR UPDATE;


  IF NOT FOUND
     OR v_mfa.secret IS NULL
  THEN

    RETURN jsonb_build_object(
      'ok',
      false,
      'reason',
      'MFA_REQUIRED'
    );

  END IF;


  IF
    v_mfa.locked_until IS NOT NULL
    AND v_mfa.locked_until >
        CURRENT_TIMESTAMP
  THEN

    RETURN jsonb_build_object(
      'ok',
      false,
      'reason',
      'TEMP_LOCK'
    );

  END IF;


  IF NOT system._mfa_login_proof_valid(
    p_ticket_id,
    v_ticket.user_id,
    v_ticket.school_id,
    p_counter,
    p_proof
  ) THEN

    RETURN jsonb_build_object(
      'ok',
      false,
      'reason',
      'INVALID_VERIFICATION_PROOF'
    );

  END IF;


  IF
    p_counter IS NULL
    OR p_counter <=
       COALESCE(
         v_mfa.last_verified_counter,
         -1
       )
  THEN

    RETURN jsonb_build_object(
      'ok',
      false,
      'reason',
      'REPLAY'
    );

  END IF;


  INSERT INTO
    system.system_session
  (
    id,
    user_id,
    school_id,
    refresh_token_hash,
    ip_address,
    user_agent,
    device_id,
    is_active,
    created_at,
    expires_at,
    last_activity_at,
    invalidated_at,
    auth_assurance,
    mfa_verified_at,
    step_up_verified_at,
    step_up_expires_at
  )
  VALUES
  (
    p_session_id,
    v_ticket.user_id,
    v_ticket.school_id,
    p_refresh_token_hash,
    p_ip_address,
    p_user_agent,
    NULL,
    true,
    CURRENT_TIMESTAMP,
    p_expires_at AT TIME ZONE 'UTC',
    CURRENT_TIMESTAMP,
    NULL,
    'MFA',
    CURRENT_TIMESTAMP,
    NULL,
    NULL
  );


  UPDATE
    system.system_mfa

  SET
    failed_attempt_count=0,
    locked_until=NULL,
    last_verified_counter=
      p_counter,
    updated_at=
      CURRENT_TIMESTAMP

  WHERE
    id=v_mfa.id;


  UPDATE
    system.system_user

  SET
    status=
      CASE

        WHEN status IN (
          'INVITED',
          'PENDING_VERIFICATION'
        )
        THEN
          'ACTIVE'

        ELSE
          status

      END,

    is_active=
      CASE

        WHEN status IN (
          'INVITED',
          'PENDING_VERIFICATION'
        )
        THEN
          true

        ELSE
          is_active

      END,

    is_verified=
      CASE

        WHEN status IN (
          'INVITED',
          'PENDING_VERIFICATION'
        )
        THEN
          true

        ELSE
          is_verified

      END,

    row_version=
      CASE

        WHEN status IN (
          'INVITED',
          'PENDING_VERIFICATION'
        )
        THEN
          row_version+1

        ELSE
          row_version

      END,

    failed_login_count=0,
    locked_until=NULL,
    last_login_at=
      CURRENT_TIMESTAMP

  WHERE
    id=v_ticket.user_id;


  INSERT INTO
    system.system_authentication_log
  (
    id,
    user_id,
    login_status,
    ip_address,
    user_agent,
    created_at
  )
  VALUES
  (
    gen_random_uuid()::text,
    v_ticket.user_id,
    'SUCCESS'::sukuux."AuthLoginStatus",
    p_ip_address,
    p_user_agent,
    CURRENT_TIMESTAMP
  );


  INSERT INTO
    system.system_audit_event
  (
    id,
    user_id,
    school_id,
    action,
    entity_type,
    entity_id,
    before_state,
    after_state,
    created_at
  )
  VALUES
  (
    gen_random_uuid()::text,
    v_ticket.user_id,
    v_ticket.school_id,
    'MFA_LOGIN_VERIFIED',
    'system_mfa',
    v_mfa.id,
    NULL,
    jsonb_build_object(
      'method',
      'TOTP',
      'authAssurance',
      'MFA',
      'stepUpGranted',
      false
    )::text,
    CURRENT_TIMESTAMP
  );


  UPDATE
    system.system_auth_ticket

  SET
    used_at=
      CURRENT_TIMESTAMP

  WHERE
    id=v_ticket.id;


  RETURN jsonb_build_object(
    'ok',
    true,
    'assurance',
    'MFA'
  );

END
$function$;


REVOKE ALL

ON FUNCTION
  system.auth_finalize_mfa_session(
    text,
    text,
    text,
    text,
    text,
    timestamp with time zone,
    bigint,
    text
  )

FROM PUBLIC;


-- --------------------------------------------------------------------------
-- 7. Close the legacy password-only privileged-session bypass.
--
-- The existing timestamptz overload delegates to this canonical function,
-- so replacing this implementation closes both legacy finalization paths.
-- --------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION
  system.auth_finalize_session(
    p_ticket_id text,
    p_session_id text,
    p_refresh_token_hash text,
    p_ip_address text,
    p_user_agent text,
    p_expires_at timestamp(3)
      without time zone
  )

RETURNS void

LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER

SET search_path =
  pg_catalog,
  system,
  sukuux

AS $function$

DECLARE

  v_ticket
    system.system_auth_ticket%ROWTYPE;

  v_user
    system.system_user%ROWTYPE;

BEGIN

  SELECT
    t.*

  INTO
    v_ticket

  FROM
    system.system_auth_ticket t

  WHERE
    t.id=p_ticket_id

  LIMIT 1

  FOR UPDATE;


  IF NOT FOUND
     OR v_ticket.used_at IS NOT NULL
     OR v_ticket.expires_at <=
        CURRENT_TIMESTAMP
  THEN

    RAISE EXCEPTION
      'Authentication ticket is invalid or expired';

  END IF;


  SELECT
    u.*

  INTO
    v_user

  FROM
    system.system_user u

  WHERE
    u.id=v_ticket.user_id

  LIMIT 1

  FOR UPDATE;


  IF NOT FOUND
     OR v_user.archived_at IS NOT NULL
     OR v_user.status IN (
       'LOCKED',
       'SUSPENDED',
       'CLOSED'
     )
  THEN

    RAISE EXCEPTION
      'User is no longer eligible to establish a session';

  END IF;


  IF NOT EXISTS (

    SELECT 1

    FROM
      system.system_user_role sur

    JOIN
      system.system_role r
      ON r.id=sur.role_id

    WHERE
      sur.user_id=
        v_ticket.user_id

      AND sur.school_id=
        v_ticket.school_id

      AND (
        sur.expires_at IS NULL
        OR sur.expires_at >
           CURRENT_TIMESTAMP
      )

      AND r.archived_at IS NULL

  ) THEN

    RAISE EXCEPTION
      'User no longer has active school authority';

  END IF;


  IF EXISTS (

    SELECT 1

    FROM
      system.system_user_role sur

    JOIN
      system.system_role r
      ON r.id=sur.role_id

    WHERE
      sur.user_id=
        v_ticket.user_id

      AND sur.school_id=
        v_ticket.school_id

      AND r.name IN (
        'superadmin',
        'headmaster'
      )

      AND r.archived_at IS NULL

      AND (
        sur.expires_at IS NULL
        OR sur.expires_at >
           CURRENT_TIMESTAMP
      )

  ) THEN

    RAISE EXCEPTION
      'Privileged session requires MFA finalization';

  END IF;


  INSERT INTO
    system.system_session
  (
    id,
    user_id,
    school_id,
    refresh_token_hash,
    ip_address,
    user_agent,
    device_id,
    is_active,
    created_at,
    expires_at,
    last_activity_at,
    invalidated_at
  )
  VALUES
  (
    p_session_id,
    v_ticket.user_id,
    v_ticket.school_id,
    p_refresh_token_hash,
    p_ip_address,
    p_user_agent,
    NULL,
    true,
    CURRENT_TIMESTAMP,
    p_expires_at,
    CURRENT_TIMESTAMP,
    NULL
  );


  UPDATE
    system.system_user

  SET
    status=
      CASE

        WHEN status IN (
          'INVITED',
          'PENDING_VERIFICATION'
        )
        THEN
          'ACTIVE'

        ELSE
          status

      END,

    is_active=
      CASE

        WHEN status IN (
          'INVITED',
          'PENDING_VERIFICATION'
        )
        THEN
          true

        ELSE
          is_active

      END,

    is_verified=
      CASE

        WHEN status IN (
          'INVITED',
          'PENDING_VERIFICATION'
        )
        THEN
          true

        ELSE
          is_verified

      END,

    row_version=
      CASE

        WHEN status IN (
          'INVITED',
          'PENDING_VERIFICATION'
        )
        THEN
          row_version+1

        ELSE
          row_version

      END,

    failed_login_count=0,
    locked_until=NULL,
    last_login_at=
      CURRENT_TIMESTAMP

  WHERE
    id=v_ticket.user_id;


  INSERT INTO
    system.system_authentication_log
  (
    id,
    user_id,
    login_status,
    ip_address,
    user_agent,
    created_at
  )
  VALUES
  (
    gen_random_uuid()::text,
    v_ticket.user_id,
    'SUCCESS'::sukuux."AuthLoginStatus",
    p_ip_address,
    p_user_agent,
    CURRENT_TIMESTAMP
  );


  UPDATE
    system.system_auth_ticket

  SET
    used_at=
      CURRENT_TIMESTAMP

  WHERE
    id=v_ticket.id;

END
$function$;


REVOKE ALL

ON FUNCTION
  system.auth_finalize_session(
    text,
    text,
    text,
    text,
    text,
    timestamp without time zone
  )

FROM PUBLIC;


-- --------------------------------------------------------------------------
-- 8. Runtime execution boundary.
-- --------------------------------------------------------------------------

DO $runtime_execute$
BEGIN

  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_roles
    WHERE rolname='sukuu_app_runtime'
  ) THEN

    EXECUTE
      'GRANT EXECUTE ON FUNCTION system.auth_mfa_login_requirement(text) TO sukuu_app_runtime';

    EXECUTE
      'GRANT EXECUTE ON FUNCTION system.auth_mfa_login_material(text) TO sukuu_app_runtime';

    EXECUTE
      'GRANT EXECUTE ON FUNCTION system.auth_mfa_login_record_failure(text,text,text) TO sukuu_app_runtime';

    EXECUTE
      'GRANT EXECUTE ON FUNCTION system.auth_finalize_mfa_session(text,text,text,text,text,timestamp with time zone,bigint,text) TO sukuu_app_runtime';

    EXECUTE
      'REVOKE ALL ON FUNCTION system._mfa_login_proof_valid(text,text,text,bigint,text) FROM sukuu_app_runtime';

    EXECUTE
      'GRANT EXECUTE ON FUNCTION system.auth_finalize_session(text,text,text,text,text,timestamp without time zone) TO sukuu_app_runtime';

    EXECUTE
      'GRANT EXECUTE ON FUNCTION system.auth_finalize_session(text,text,text,text,text,timestamp with time zone) TO sukuu_app_runtime';

  END IF;

END
$runtime_execute$;


COMMIT;
