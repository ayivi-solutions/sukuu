BEGIN;

-- ============================================================================
-- SUKUU STAGE 3B PHASE 2D
-- Controlled Privileged MFA Recovery / Re-enrollment Foundation
--
-- ADDITIVE FOUNDATION ONLY.
--
-- This migration does NOT enable mandatory privileged MFA login.
-- This migration does NOT attach step-up enforcement to SystemX.
--
-- Recovery model:
--   1. A controlled operator issues a high-entropy one-time recovery token.
--   2. Only SHA-256(token) is persisted.
--   3. The account holder must also prove the current password.
--   4. Existing MFA remains active while a replacement TOTP secret is pending.
--   5. The replacement secret becomes authoritative only after TOTP validation.
--   6. Successful recovery invalidates all existing sessions for the account.
-- ============================================================================


-- --------------------------------------------------------------------------
-- 1. Preconditions.
-- --------------------------------------------------------------------------

DO $preflight$
BEGIN

  IF to_regclass(
    'system.system_mfa'
  ) IS NULL THEN
    RAISE EXCEPTION
      'Phase 2D recovery aborted: system_mfa missing';
  END IF;


  IF to_regclass(
    'system.system_user'
  ) IS NULL THEN
    RAISE EXCEPTION
      'Phase 2D recovery aborted: system_user missing';
  END IF;


  IF to_regclass(
    'system.system_user_role'
  ) IS NULL
  OR to_regclass(
    'system.system_role'
  ) IS NULL THEN
    RAISE EXCEPTION
      'Phase 2D recovery aborted: role foundation missing';
  END IF;


  IF to_regclass(
    'system.system_session'
  ) IS NULL THEN
    RAISE EXCEPTION
      'Phase 2D recovery aborted: system_session missing';
  END IF;


  IF to_regprocedure(
    'system._auth_password_matches(text,text)'
  ) IS NULL THEN
    RAISE EXCEPTION
      'Phase 2D recovery aborted: password verifier missing';
  END IF;


  IF to_regprocedure(
    'system._mfa_proof_secret()'
  ) IS NULL
  OR to_regprocedure(
    'system._hmac_sha256_hex(text,text)'
  ) IS NULL THEN
    RAISE EXCEPTION
      'Phase 2D recovery aborted: protected HMAC foundation missing';
  END IF;


  IF (
    SELECT COUNT(*)
    FROM system.system_mfa
    WHERE
      method='TOTP'::sukuux."MfaMethod"
      AND is_enabled=true
      AND verified_at IS NOT NULL
  ) <> 2 THEN
    RAISE EXCEPTION
      'Phase 2D recovery aborted: expected two verified privileged TOTP rows';
  END IF;

END
$preflight$;


-- --------------------------------------------------------------------------
-- 2. One-time MFA recovery challenges.
-- --------------------------------------------------------------------------

CREATE TABLE
  system.system_mfa_recovery_challenge
(
  id uuid
    PRIMARY KEY
    DEFAULT gen_random_uuid(),

  user_id text
    NOT NULL,

  school_id text
    NOT NULL,

  purpose text
    NOT NULL
    DEFAULT 'TOTP_REENROLL',

  token_hash text
    NOT NULL,

  reason text
    NOT NULL,

  issued_by text
    NOT NULL,

  created_at timestamptz
    NOT NULL
    DEFAULT CURRENT_TIMESTAMP,

  expires_at timestamptz
    NOT NULL,

  verified_at timestamptz,

  consumed_at timestamptz,

  revoked_at timestamptz,

  attempt_count integer
    NOT NULL
    DEFAULT 0,

  max_attempts integer
    NOT NULL
    DEFAULT 5,

  pending_secret_envelope text,

  pending_started_at timestamptz,

  CONSTRAINT
    system_mfa_recovery_purpose_check
  CHECK (
    purpose='TOTP_REENROLL'
  ),

  CONSTRAINT
    system_mfa_recovery_attempt_check
  CHECK (
    attempt_count >= 0
    AND max_attempts BETWEEN 1 AND 10
  ),

  CONSTRAINT
    system_mfa_recovery_expiry_check
  CHECK (
    expires_at > created_at
  )
);


CREATE UNIQUE INDEX
  uq_system_mfa_recovery_token_hash
ON
  system.system_mfa_recovery_challenge
  (token_hash);


CREATE UNIQUE INDEX
  uq_system_mfa_recovery_open_user
ON
  system.system_mfa_recovery_challenge
  (user_id)
WHERE
  consumed_at IS NULL
  AND revoked_at IS NULL;


CREATE INDEX
  idx_system_mfa_recovery_school
ON
  system.system_mfa_recovery_challenge
  (school_id);


CREATE INDEX
  idx_system_mfa_recovery_expiry
ON
  system.system_mfa_recovery_challenge
  (expires_at);


ALTER TABLE
  system.system_mfa_recovery_challenge
ENABLE ROW LEVEL SECURITY;


ALTER TABLE
  system.system_mfa_recovery_challenge
FORCE ROW LEVEL SECURITY;


REVOKE ALL
ON TABLE
  system.system_mfa_recovery_challenge
FROM PUBLIC;


DO $runtime_table_lock$
BEGIN

  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_roles
    WHERE rolname='sukuu_app_runtime'
  ) THEN

    EXECUTE
      'REVOKE ALL ON TABLE system.system_mfa_recovery_challenge FROM sukuu_app_runtime';

  END IF;

END
$runtime_table_lock$;


-- --------------------------------------------------------------------------
-- 3. Controlled operator issuance.
--
-- Not executable by application runtime.
-- The plaintext token never enters this function.
-- --------------------------------------------------------------------------

CREATE FUNCTION
  system.admin_issue_mfa_recovery_challenge(
    p_user_id text,
    p_school_id text,
    p_token_hash text,
    p_reason text,
    p_issued_by text,
    p_ttl_minutes integer
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

  v_ttl integer;
  v_challenge_id uuid;
  v_expires_at timestamptz;

BEGIN

  IF
    p_user_id IS NULL
    OR p_school_id IS NULL
    OR p_token_hash IS NULL
    OR length(p_token_hash) <> 64
    OR p_reason IS NULL
    OR length(btrim(p_reason)) < 8
    OR length(p_reason) > 500
    OR p_issued_by IS NULL
    OR length(btrim(p_issued_by)) < 3
    OR length(p_issued_by) > 200
  THEN

    RETURN jsonb_build_object(
      'ok',
      false,
      'reason',
      'INVALID_REQUEST'
    );

  END IF;


  v_ttl :=
    LEAST(
      GREATEST(
        COALESCE(
          p_ttl_minutes,
          15
        ),
        5
      ),
      60
    );


  IF NOT EXISTS (

    SELECT 1

    FROM
      system.system_user u

    JOIN
      system.system_user_role sur
      ON sur.user_id=u.id
      AND sur.school_id=p_school_id

    JOIN
      system.system_role r
      ON r.id=sur.role_id

    JOIN
      system.system_mfa m
      ON m.user_id=u.id
      AND m.method=
        'TOTP'::sukuux."MfaMethod"

    WHERE
      u.id=p_user_id
      AND u.archived_at IS NULL
      AND u.is_active=true
      AND u.status='ACTIVE'
      AND (
        u.locked_until IS NULL
        OR u.locked_until <= CURRENT_TIMESTAMP
      )
      AND r.name IN (
        'superadmin',
        'headmaster'
      )
      AND r.archived_at IS NULL
      AND (
        sur.expires_at IS NULL
        OR sur.expires_at > CURRENT_TIMESTAMP
      )
      AND m.is_enabled=true
      AND m.verified_at IS NOT NULL

  ) THEN

    RETURN jsonb_build_object(
      'ok',
      false,
      'reason',
      'TARGET_NOT_ELIGIBLE'
    );

  END IF;


  UPDATE
    system.system_mfa_recovery_challenge

  SET
    revoked_at=
      COALESCE(
        revoked_at,
        CURRENT_TIMESTAMP
      )

  WHERE
    user_id=p_user_id
    AND consumed_at IS NULL
    AND revoked_at IS NULL;


  v_expires_at :=
    CURRENT_TIMESTAMP
    + make_interval(
        mins=>v_ttl
      );


  INSERT INTO
    system.system_mfa_recovery_challenge
  (
    user_id,
    school_id,
    token_hash,
    reason,
    issued_by,
    expires_at
  )
  VALUES
  (
    p_user_id,
    p_school_id,
    p_token_hash,
    btrim(p_reason),
    btrim(p_issued_by),
    v_expires_at
  )
  RETURNING
    id
  INTO
    v_challenge_id;


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
    p_user_id,
    p_school_id,
    'MFA_RECOVERY_ISSUED',
    'system_mfa_recovery_challenge',
    v_challenge_id::text,
    NULL,
    jsonb_build_object(
      'purpose',
      'TOTP_REENROLL',
      'issuedBy',
      btrim(p_issued_by),
      'ttlMinutes',
      v_ttl,
      'reason',
      btrim(p_reason)
    )::text,
    CURRENT_TIMESTAMP
  );


  RETURN jsonb_build_object(
    'ok',
    true,
    'challengeId',
    v_challenge_id::text,
    'expiresAt',
    v_expires_at
  );

END
$function$;


REVOKE ALL

ON FUNCTION
  system.admin_issue_mfa_recovery_challenge(
    text,
    text,
    text,
    text,
    text,
    integer
  )

FROM PUBLIC;


-- --------------------------------------------------------------------------
-- 4. Recovery authorization.
--
-- Requires BOTH:
--   - the one-time recovery token
--   - the current account password
--
-- Existing MFA is not replaced here.
-- --------------------------------------------------------------------------

CREATE FUNCTION
  system.auth_mfa_recovery_authorize(
    p_token_hash text,
    p_email text,
    p_password text,
    p_pending_secret_envelope text
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

  v_challenge
    system.system_mfa_recovery_challenge%ROWTYPE;

  v_user
    system.system_user%ROWTYPE;

BEGIN

  IF
    p_token_hash IS NULL
    OR length(p_token_hash) <> 64
    OR p_email IS NULL
    OR p_password IS NULL
    OR p_pending_secret_envelope IS NULL
    OR length(p_pending_secret_envelope) < 32
    OR length(p_pending_secret_envelope) > 4096
  THEN

    RETURN jsonb_build_object(
      'ok',
      false,
      'reason',
      'INVALID'
    );

  END IF;


  SELECT
    c.*

  INTO
    v_challenge

  FROM
    system.system_mfa_recovery_challenge c

  WHERE
    c.token_hash=p_token_hash

  LIMIT 1

  FOR UPDATE;


  IF NOT FOUND
     OR v_challenge.consumed_at IS NOT NULL
     OR v_challenge.revoked_at IS NOT NULL
     OR v_challenge.expires_at <= CURRENT_TIMESTAMP
     OR v_challenge.attempt_count >=
        v_challenge.max_attempts
  THEN

    RETURN jsonb_build_object(
      'ok',
      false,
      'reason',
      'INVALID'
    );

  END IF;


  SELECT
    u.*

  INTO
    v_user

  FROM
    system.system_user u

  WHERE
    u.id=v_challenge.user_id
    AND u.archived_at IS NULL
    AND u.is_active=true
    AND u.status='ACTIVE'
    AND (
      u.locked_until IS NULL
      OR u.locked_until <= CURRENT_TIMESTAMP
    )
    AND lower(btrim(u.email))=
        lower(btrim(p_email))

  LIMIT 1

  FOR UPDATE;


  IF NOT FOUND
     OR NOT system._auth_password_matches(
       p_password,
       v_user.password_hash
     )
  THEN

    UPDATE
      system.system_mfa_recovery_challenge

    SET
      attempt_count=
        attempt_count+1,

      revoked_at=
        CASE

          WHEN attempt_count+1 >=
               max_attempts
          THEN CURRENT_TIMESTAMP

          ELSE revoked_at

        END

    WHERE
      id=v_challenge.id;


    RETURN jsonb_build_object(
      'ok',
      false,
      'reason',
      'INVALID'
    );

  END IF;


  IF NOT EXISTS (

    SELECT 1

    FROM
      system.system_user_role sur

    JOIN
      system.system_role r
      ON r.id=sur.role_id

    JOIN
      system.system_mfa m
      ON m.user_id=sur.user_id
      AND m.method=
        'TOTP'::sukuux."MfaMethod"

    WHERE
      sur.user_id=v_user.id
      AND sur.school_id=
          v_challenge.school_id
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
      AND m.is_enabled=true
      AND m.verified_at IS NOT NULL

  ) THEN

    UPDATE
      system.system_mfa_recovery_challenge

    SET
      revoked_at=
        COALESCE(
          revoked_at,
          CURRENT_TIMESTAMP
        )

    WHERE
      id=v_challenge.id;


    RETURN jsonb_build_object(
      'ok',
      false,
      'reason',
      'INVALID'
    );

  END IF;


  UPDATE
    system.system_mfa_recovery_challenge

  SET
    verified_at=
      CURRENT_TIMESTAMP,

    pending_secret_envelope=
      p_pending_secret_envelope,

    pending_started_at=
      CURRENT_TIMESTAMP,

    attempt_count=0

  WHERE
    id=v_challenge.id;


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
    v_user.id,
    v_challenge.school_id,
    'MFA_RECOVERY_AUTHORIZED',
    'system_mfa_recovery_challenge',
    v_challenge.id::text,
    NULL,
    jsonb_build_object(
      'purpose',
      'TOTP_REENROLL'
    )::text,
    CURRENT_TIMESTAMP
  );


  RETURN jsonb_build_object(
    'ok',
    true
  );

END
$function$;


REVOKE ALL

ON FUNCTION
  system.auth_mfa_recovery_authorize(
    text,
    text,
    text,
    text
  )

FROM PUBLIC;


-- --------------------------------------------------------------------------
-- 5. Return pending encrypted recovery material.
-- --------------------------------------------------------------------------

CREATE FUNCTION
  system.auth_mfa_recovery_material(
    p_token_hash text,
    p_email text
  )
RETURNS jsonb

LANGUAGE plpgsql
STABLE
SECURITY DEFINER

SET search_path =
  pg_catalog,
  system

AS $function$

DECLARE

  v_challenge
    system.system_mfa_recovery_challenge%ROWTYPE;

  v_email text;

BEGIN

  IF
    p_token_hash IS NULL
    OR length(p_token_hash) <> 64
    OR p_email IS NULL
  THEN

    RETURN jsonb_build_object(
      'ok',
      false,
      'reason',
      'INVALID'
    );

  END IF;


  SELECT
    c.*

  INTO
    v_challenge

  FROM
    system.system_mfa_recovery_challenge c

  WHERE
    c.token_hash=p_token_hash
    AND c.verified_at IS NOT NULL
    AND c.pending_secret_envelope IS NOT NULL
    AND c.consumed_at IS NULL
    AND c.revoked_at IS NULL
    AND c.expires_at > CURRENT_TIMESTAMP
    AND c.attempt_count <
        c.max_attempts

  LIMIT 1;


  IF NOT FOUND THEN

    RETURN jsonb_build_object(
      'ok',
      false,
      'reason',
      'INVALID'
    );

  END IF;


  SELECT
    u.email

  INTO
    v_email

  FROM
    system.system_user u

  WHERE
    u.id=v_challenge.user_id
    AND u.archived_at IS NULL

  LIMIT 1;


  IF
    v_email IS NULL
    OR lower(btrim(v_email)) <>
       lower(btrim(p_email))
  THEN

    RETURN jsonb_build_object(
      'ok',
      false,
      'reason',
      'INVALID'
    );

  END IF;


  RETURN jsonb_build_object(
    'ok',
    true,
    'userId',
    v_challenge.user_id,
    'schoolId',
    v_challenge.school_id,
    'secretEnvelope',
    v_challenge.pending_secret_envelope
  );

END
$function$;


REVOKE ALL

ON FUNCTION
  system.auth_mfa_recovery_material(
    text,
    text
  )

FROM PUBLIC;


-- --------------------------------------------------------------------------
-- 6. Recovery verification failure accounting.
-- --------------------------------------------------------------------------

CREATE FUNCTION
  system.auth_mfa_recovery_record_failure(
    p_token_hash text,
    p_email text
  )
RETURNS jsonb

LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER

SET search_path =
  pg_catalog,
  system

AS $function$

DECLARE

  v_challenge_id uuid;
  v_count integer;
  v_revoked_at timestamptz;

BEGIN

  SELECT
    c.id

  INTO
    v_challenge_id

  FROM
    system.system_mfa_recovery_challenge c

  JOIN
    system.system_user u
    ON u.id=c.user_id

  WHERE
    c.token_hash=p_token_hash
    AND c.verified_at IS NOT NULL
    AND c.pending_secret_envelope IS NOT NULL
    AND c.consumed_at IS NULL
    AND c.revoked_at IS NULL
    AND c.expires_at > CURRENT_TIMESTAMP
    AND lower(btrim(u.email))=
        lower(btrim(p_email))

  LIMIT 1

  FOR UPDATE
    OF c;


  IF NOT FOUND THEN

    RETURN jsonb_build_object(
      'ok',
      false,
      'reason',
      'INVALID'
    );

  END IF;


  UPDATE
    system.system_mfa_recovery_challenge

  SET
    attempt_count=
      attempt_count+1,

    revoked_at=
      CASE

        WHEN attempt_count+1 >=
             max_attempts
        THEN CURRENT_TIMESTAMP

        ELSE revoked_at

      END

  WHERE
    id=v_challenge_id

  RETURNING
    attempt_count,
    revoked_at

  INTO
    v_count,
    v_revoked_at;


  RETURN jsonb_build_object(
    'ok',
    true,
    'attempts',
    v_count,
    'revoked',
    v_revoked_at IS NOT NULL
  );

END
$function$;


REVOKE ALL

ON FUNCTION
  system.auth_mfa_recovery_record_failure(
    text,
    text
  )

FROM PUBLIC;


-- --------------------------------------------------------------------------
-- 7. Private recovery verification proof.
--
-- This proof is deliberately independent of authenticated session context
-- because this path must remain usable when privileged MFA login is enforced.
-- --------------------------------------------------------------------------

CREATE FUNCTION
  system._mfa_recovery_proof_valid(
    p_token_hash text,
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
    p_token_hash IS NULL
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
      'RECOVERY'
      || ':'
      || p_token_hash
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
  system._mfa_recovery_proof_valid(
    text,
    text,
    text,
    bigint,
    text
  )

FROM PUBLIC;


-- --------------------------------------------------------------------------
-- 8. Complete recovery atomically.
--
-- The active MFA seed is replaced only here after the new TOTP secret has
-- been cryptographically verified by the application.
-- --------------------------------------------------------------------------

CREATE FUNCTION
  system.auth_mfa_recovery_complete(
    p_token_hash text,
    p_email text,
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

  v_challenge
    system.system_mfa_recovery_challenge%ROWTYPE;

  v_email text;
  v_mfa_id text;

BEGIN

  SELECT
    c.*

  INTO
    v_challenge

  FROM
    system.system_mfa_recovery_challenge c

  WHERE
    c.token_hash=p_token_hash

  LIMIT 1

  FOR UPDATE;


  IF NOT FOUND
     OR v_challenge.verified_at IS NULL
     OR v_challenge.pending_secret_envelope IS NULL
     OR v_challenge.consumed_at IS NOT NULL
     OR v_challenge.revoked_at IS NOT NULL
     OR v_challenge.expires_at <= CURRENT_TIMESTAMP
     OR v_challenge.attempt_count >=
        v_challenge.max_attempts
  THEN

    RETURN jsonb_build_object(
      'ok',
      false,
      'reason',
      'INVALID'
    );

  END IF;


  SELECT
    u.email

  INTO
    v_email

  FROM
    system.system_user u

  WHERE
    u.id=v_challenge.user_id
    AND u.archived_at IS NULL
    AND u.is_active=true
    AND u.status='ACTIVE'

  LIMIT 1;


  IF
    v_email IS NULL
    OR lower(btrim(v_email)) <>
       lower(btrim(p_email))
  THEN

    RETURN jsonb_build_object(
      'ok',
      false,
      'reason',
      'INVALID'
    );

  END IF;


  IF NOT system._mfa_recovery_proof_valid(
    p_token_hash,
    v_challenge.user_id,
    v_challenge.school_id,
    p_counter,
    p_proof
  ) THEN

    RETURN jsonb_build_object(
      'ok',
      false,
      'reason',
      'INVALID_PROOF'
    );

  END IF;


  SELECT
    m.id

  INTO
    v_mfa_id

  FROM
    system.system_mfa m

  WHERE
    m.user_id=v_challenge.user_id
    AND m.method=
        'TOTP'::sukuux."MfaMethod"
    AND m.is_enabled=true

  LIMIT 1

  FOR UPDATE;


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
    secret=
      v_challenge.pending_secret_envelope,

    is_enabled=true,

    verified_at=
      CURRENT_TIMESTAMP,

    failed_attempt_count=0,

    locked_until=NULL,

    last_verified_counter=
      p_counter,

    updated_at=
      CURRENT_TIMESTAMP

  WHERE
    id=v_mfa_id;


  UPDATE
    system.system_session

  SET
    is_active=false,

    invalidated_at=
      COALESCE(
        invalidated_at,
        CURRENT_TIMESTAMP
      ),

    last_activity_at=
      CURRENT_TIMESTAMP

  WHERE
    user_id=v_challenge.user_id
    AND is_active=true
    AND invalidated_at IS NULL;


  UPDATE
    system.system_mfa_recovery_challenge

  SET
    consumed_at=
      CURRENT_TIMESTAMP,

    pending_secret_envelope=NULL,

    pending_started_at=NULL

  WHERE
    id=v_challenge.id;


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
    v_challenge.user_id,
    v_challenge.school_id,
    'MFA_RECOVERY_COMPLETED',
    'system_mfa',
    v_mfa_id,
    NULL,
    jsonb_build_object(
      'method',
      'TOTP',
      'allSessionsInvalidated',
      true
    )::text,
    CURRENT_TIMESTAMP
  );


  RETURN jsonb_build_object(
    'ok',
    true,
    'success',
    true,
    'method',
    'TOTP'
  );

END
$function$;


REVOKE ALL

ON FUNCTION
  system.auth_mfa_recovery_complete(
    text,
    text,
    bigint,
    text
  )

FROM PUBLIC;


-- --------------------------------------------------------------------------
-- 9. Runtime execution surface.
-- --------------------------------------------------------------------------

DO $runtime_execute$
BEGIN

  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_roles
    WHERE rolname='sukuu_app_runtime'
  ) THEN

    EXECUTE
      'GRANT EXECUTE ON FUNCTION system.auth_mfa_recovery_authorize(text,text,text,text) TO sukuu_app_runtime';

    EXECUTE
      'GRANT EXECUTE ON FUNCTION system.auth_mfa_recovery_material(text,text) TO sukuu_app_runtime';

    EXECUTE
      'GRANT EXECUTE ON FUNCTION system.auth_mfa_recovery_record_failure(text,text) TO sukuu_app_runtime';

    EXECUTE
      'GRANT EXECUTE ON FUNCTION system.auth_mfa_recovery_complete(text,text,bigint,text) TO sukuu_app_runtime';

    EXECUTE
      'REVOKE ALL ON FUNCTION system.admin_issue_mfa_recovery_challenge(text,text,text,text,text,integer) FROM sukuu_app_runtime';

    EXECUTE
      'REVOKE ALL ON FUNCTION system._mfa_recovery_proof_valid(text,text,text,bigint,text) FROM sukuu_app_runtime';

  END IF;

END
$runtime_execute$;


COMMIT;
