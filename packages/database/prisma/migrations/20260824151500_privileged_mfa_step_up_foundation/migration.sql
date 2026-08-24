BEGIN;

-- ============================================================================
-- SUKUU STAGE 3B PHASE 2D
-- Privileged MFA + Step-Up Foundation
--
-- FOUNDATION ONLY.
--
-- This migration does NOT yet force privileged login through MFA.
-- Enforcement follows only after controlled enrollment of privileged users.
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
      'Phase 2D aborted: system_mfa missing';
  END IF;


  IF to_regclass(
    'system.system_session'
  ) IS NULL THEN
    RAISE EXCEPTION
      'Phase 2D aborted: system_session missing';
  END IF;


  IF to_regprocedure(
    'system.ctx_user_id()'
  ) IS NULL
  OR to_regprocedure(
    'system.ctx_school_id()'
  ) IS NULL
  OR to_regprocedure(
    'system.ctx_has_role(text)'
  ) IS NULL THEN

    RAISE EXCEPTION
      'Phase 2D aborted: trusted session helpers missing';

  END IF;


  /*
   * Gate A established zero MFA rows.
   *
   * Stop if something has appeared between discovery and deployment.
   */

  IF EXISTS (
    SELECT 1
    FROM system.system_mfa
  ) THEN

    RAISE EXCEPTION
      'Phase 2D aborted: unexpected pre-existing MFA rows';

  END IF;

END
$preflight$;


-- --------------------------------------------------------------------------
-- 2. Harden MFA credential-vault structure.
--
-- Existing fields are retained for compatibility:
--
-- secret
--   stores ONLY an AES-256-GCM encrypted envelope.
--
-- backup_codes
--   remains an empty JSON array in this phase.
--   No plaintext recovery code is stored.
-- --------------------------------------------------------------------------

ALTER TABLE
  system.system_mfa

ADD COLUMN IF NOT EXISTS
  failed_attempt_count integer
  NOT NULL
  DEFAULT 0,

ADD COLUMN IF NOT EXISTS
  locked_until timestamp(3)
  without time zone,

ADD COLUMN IF NOT EXISTS
  last_verified_counter bigint,

ADD COLUMN IF NOT EXISTS
  created_at timestamp(3)
  without time zone
  NOT NULL
  DEFAULT CURRENT_TIMESTAMP,

ADD COLUMN IF NOT EXISTS
  updated_at timestamp(3)
  without time zone
  NOT NULL
  DEFAULT CURRENT_TIMESTAMP;


ALTER TABLE
  system.system_mfa

ALTER COLUMN
  backup_codes

SET DEFAULT
  '[]';


CREATE UNIQUE INDEX IF NOT EXISTS
  system_mfa_user_id_method_key

ON
  system.system_mfa
  (user_id, method);


-- --------------------------------------------------------------------------
-- 3. Remove unsafe direct MFA-vault access.
-- --------------------------------------------------------------------------

DROP POLICY IF EXISTS
  own_or_colleague

ON
  system.system_mfa;


REVOKE ALL

ON TABLE
  system.system_mfa

FROM PUBLIC;


DO $runtime_mfa_lock$
BEGIN

  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_roles
    WHERE rolname='sukuu_app_runtime'
  ) THEN

    EXECUTE
      'REVOKE ALL ON TABLE system.system_mfa FROM sukuu_app_runtime';

  END IF;

END
$runtime_mfa_lock$;


ALTER TABLE
  system.system_mfa
ENABLE ROW LEVEL SECURITY;


ALTER TABLE
  system.system_mfa
FORCE ROW LEVEL SECURITY;


-- --------------------------------------------------------------------------
-- 4. Session assurance + step-up state.
-- --------------------------------------------------------------------------

ALTER TABLE
  system.system_session

ADD COLUMN IF NOT EXISTS
  auth_assurance text
  NOT NULL
  DEFAULT 'PASSWORD',

ADD COLUMN IF NOT EXISTS
  mfa_verified_at timestamp(3)
  without time zone,

ADD COLUMN IF NOT EXISTS
  step_up_verified_at timestamp(3)
  without time zone,

ADD COLUMN IF NOT EXISTS
  step_up_expires_at timestamp(3)
  without time zone;


DO $session_assurance_check$
BEGIN

  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_constraint
    WHERE conname=
      'system_session_auth_assurance_check'
  ) THEN

    ALTER TABLE
      system.system_session

    ADD CONSTRAINT
      system_session_auth_assurance_check

    CHECK (
      auth_assurance IN (
        'PASSWORD',
        'MFA'
      )
    );

  END IF;

END
$session_assurance_check$;


-- --------------------------------------------------------------------------
-- 5. Protected MFA verification-proof boundary.
--
-- The API performs TOTP cryptographic verification because the encrypted
-- TOTP seed is decryptable only by the application.
--
-- The database does NOT trust a counter alone. Successful verification must
-- also carry an HMAC proof generated with MFA_PROOF_SECRET.
--
-- The matching secret is provisioned during controlled deployment into the
-- existing FORCE-RLS system_context_secret vault as id='mfa-proof-v1'.
-- --------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION
  system._mfa_proof_secret()

RETURNS text

LANGUAGE sql
STABLE
SECURITY DEFINER

SET search_path =
  pg_catalog,
  system

AS $function$

  SELECT
    secret_value

  FROM
    system.system_context_secret

  WHERE
    id='mfa-proof-v1'

  LIMIT 1;

$function$;


REVOKE ALL

ON FUNCTION
  system._mfa_proof_secret()

FROM PUBLIC;


CREATE OR REPLACE FUNCTION
  system._mfa_verification_proof_valid(
    p_purpose text,
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

  v_session_id text;
  v_user_id text;
  v_school_id text;
  v_secret text;
  v_expected text;

BEGIN

  IF p_purpose IS NULL
     OR p_counter IS NULL
     OR p_proof IS NULL
  THEN

    RETURN false;

  END IF;


  IF NOT system._context_proof_valid()
  THEN

    RETURN false;

  END IF;


  v_session_id :=
    NULLIF(
      current_setting(
        'app.session_id',
        true
      ),
      ''
    );


  v_user_id :=
    system.ctx_user_id();


  v_school_id :=
    system.ctx_school_id();


  IF v_session_id IS NULL
     OR v_user_id IS NULL
     OR v_school_id IS NULL
  THEN

    RETURN false;

  END IF;


  v_secret :=
    system._mfa_proof_secret();


  IF v_secret IS NULL
     OR length(v_secret) < 32
  THEN

    RETURN false;

  END IF;


  v_expected :=
    system._hmac_sha256_hex(
      p_purpose
      || ':'
      || v_session_id
      || ':'
      || v_user_id
      || ':'
      || v_school_id
      || ':'
      || p_counter::text,
      v_secret
    );


  RETURN (
    v_expected IS NOT NULL
    AND v_expected = p_proof
  );

END
$function$;


REVOKE ALL

ON FUNCTION
  system._mfa_verification_proof_valid(
    text,
    bigint,
    text
  )

FROM PUBLIC;


-- --------------------------------------------------------------------------
-- 6. Safe MFA status surface for SystemX.
--
-- No secret, encrypted or otherwise, leaves this function.
-- --------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION
  system.mfa_status_for_school()

RETURNS TABLE (
  user_id text,
  method text,
  is_enabled boolean,
  verified_at timestamp
    without time zone
)

LANGUAGE plpgsql
STABLE
SECURITY DEFINER

SET search_path =
  pg_catalog,
  system,
  sukuux

AS $function$

BEGIN

  IF NOT system._context_proof_valid()
     OR system.ctx_school_id() IS NULL
  THEN

    RETURN;

  END IF;


  RETURN QUERY

  SELECT
    m.user_id,
    m.method::text,
    m.is_enabled,
    m.verified_at

  FROM
    system.system_mfa m

  WHERE EXISTS (

    SELECT 1

    FROM
      system.system_user_role sur

    WHERE
      sur.user_id=m.user_id

      AND sur.school_id=
        system.ctx_school_id()

      AND (
        sur.expires_at IS NULL
        OR sur.expires_at >
           CURRENT_TIMESTAMP
      )

  );

END
$function$;


REVOKE ALL

ON FUNCTION
  system.mfa_status_for_school()

FROM PUBLIC;


-- --------------------------------------------------------------------------
-- 6. Current-session MFA status.
-- --------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION
  system.auth_mfa_status()

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

  v_user_id text;
  v_user system.system_user%ROWTYPE;
  v_mfa system.system_mfa%ROWTYPE;
  v_privileged boolean;

BEGIN

  v_user_id :=
    system.ctx_user_id();


  IF v_user_id IS NULL
     OR system.ctx_school_id() IS NULL
  THEN

    RETURN jsonb_build_object(
      'ok',
      false,
      'reason',
      'INVALID_SESSION'
    );

  END IF;


  v_privileged :=
    system.ctx_has_role(
      'superadmin'
    )
    OR
    system.ctx_has_role(
      'headmaster'
    );


  SELECT *
  INTO v_user

  FROM
    system.system_user

  WHERE
    id=v_user_id

  LIMIT 1;


  SELECT *
  INTO v_mfa

  FROM
    system.system_mfa

  WHERE
    user_id=v_user_id

    AND method=
      'TOTP'::sukuux."MfaMethod"

  LIMIT 1;


  RETURN jsonb_build_object(
    'ok',
    true,
    'privileged',
    v_privileged,
    'email',
    v_user.email,
    'configured',
    FOUND,
    'enabled',
    COALESCE(
      v_mfa.is_enabled,
      false
    ),
    'method',
    CASE
      WHEN FOUND
      THEN v_mfa.method::text
      ELSE NULL
    END,
    'verifiedAt',
    v_mfa.verified_at,
    'lockedUntil',
    v_mfa.locked_until
  );

END
$function$;


REVOKE ALL

ON FUNCTION
  system.auth_mfa_status()

FROM PUBLIC;


-- --------------------------------------------------------------------------
-- 7. Begin authenticated privileged TOTP enrollment.
-- --------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION
  system.auth_mfa_begin_totp_enrollment(
    p_secret_envelope text
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

  v_user_id text;
  v_school_id text;

BEGIN

  v_user_id :=
    system.ctx_user_id();


  v_school_id :=
    system.ctx_school_id();


  IF v_user_id IS NULL
     OR v_school_id IS NULL
  THEN

    RETURN jsonb_build_object(
      'ok',
      false,
      'reason',
      'INVALID_SESSION'
    );

  END IF;


  IF NOT (
    system.ctx_has_role(
      'superadmin'
    )
    OR
    system.ctx_has_role(
      'headmaster'
    )
  ) THEN

    RETURN jsonb_build_object(
      'ok',
      false,
      'reason',
      'NOT_PRIVILEGED'
    );

  END IF;


  IF p_secret_envelope IS NULL
     OR length(
       p_secret_envelope
     ) < 32
     OR length(
       p_secret_envelope
     ) > 4096
  THEN

    RETURN jsonb_build_object(
      'ok',
      false,
      'reason',
      'INVALID_SECRET_ENVELOPE'
    );

  END IF;


  IF EXISTS (

    SELECT 1

    FROM
      system.system_mfa

    WHERE
      user_id=v_user_id

      AND method=
        'TOTP'::sukuux."MfaMethod"

      AND is_enabled=true

  ) THEN

    RETURN jsonb_build_object(
      'ok',
      false,
      'reason',
      'ALREADY_ENROLLED'
    );

  END IF;


  INSERT INTO
    system.system_mfa
  (
    id,
    user_id,
    method,
    secret,
    is_enabled,
    backup_codes,
    verified_at,
    failed_attempt_count,
    locked_until,
    last_verified_counter,
    created_at,
    updated_at
  )

  VALUES
  (
    gen_random_uuid()::text,
    v_user_id,
    'TOTP'::sukuux."MfaMethod",
    p_secret_envelope,
    false,
    '[]',
    NULL,
    0,
    NULL,
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )

  ON CONFLICT
    (user_id,method)

  DO UPDATE

  SET
    secret=
      EXCLUDED.secret,

    is_enabled=false,

    backup_codes=
      '[]',

    verified_at=NULL,

    failed_attempt_count=0,

    locked_until=NULL,

    last_verified_counter=NULL,

    updated_at=
      CURRENT_TIMESTAMP;


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
    v_user_id,
    v_school_id,
    'MFA_ENROLLMENT_STARTED',
    'system_mfa',
    v_user_id,
    NULL,
    jsonb_build_object(
      'method',
      'TOTP'
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
  system.auth_mfa_begin_totp_enrollment(
    text
  )

FROM PUBLIC;


-- --------------------------------------------------------------------------
-- 8. Return encrypted MFA material to current user only.
--
-- The application still needs MFA_ENCRYPTION_KEY to decrypt it.
-- --------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION
  system.auth_mfa_material()

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

  v_user_id text;
  v_mfa system.system_mfa%ROWTYPE;

BEGIN

  v_user_id :=
    system.ctx_user_id();


  IF v_user_id IS NULL
     OR system.ctx_school_id() IS NULL
  THEN

    RETURN jsonb_build_object(
      'ok',
      false,
      'reason',
      'INVALID_SESSION'
    );

  END IF;


  SELECT *
  INTO v_mfa

  FROM
    system.system_mfa

  WHERE
    user_id=v_user_id

    AND method=
      'TOTP'::sukuux."MfaMethod"

  LIMIT 1;


  IF NOT FOUND THEN

    RETURN jsonb_build_object(
      'ok',
      false,
      'reason',
      'NOT_CONFIGURED'
    );

  END IF;


  IF v_mfa.locked_until IS NOT NULL
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
    'enabled',
    v_mfa.is_enabled,
    'method',
    v_mfa.method::text,
    'secretEnvelope',
    v_mfa.secret,
    'lastVerifiedCounter',
    v_mfa.last_verified_counter
  );

END
$function$;


REVOKE ALL

ON FUNCTION
  system.auth_mfa_material()

FROM PUBLIC;


-- --------------------------------------------------------------------------
-- 9. MFA failure accounting.
-- --------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION
  system.auth_mfa_record_failure()

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

  v_user_id text;
  v_count integer;
  v_locked_until timestamp(3)
    without time zone;

BEGIN

  v_user_id :=
    system.ctx_user_id();


  IF v_user_id IS NULL THEN

    RETURN jsonb_build_object(
      'ok',
      false,
      'reason',
      'INVALID_SESSION'
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
    user_id=v_user_id

    AND method=
      'TOTP'::sukuux."MfaMethod"

  RETURNING
    failed_attempt_count,
    locked_until

  INTO
    v_count,
    v_locked_until;


  RETURN jsonb_build_object(
    'ok',
    true,
    'failedAttempts',
    COALESCE(
      v_count,
      0
    ),
    'lockedUntil',
    v_locked_until
  );

END
$function$;


REVOKE ALL

ON FUNCTION
  system.auth_mfa_record_failure()

FROM PUBLIC;


-- --------------------------------------------------------------------------
-- 10. Complete TOTP enrollment.
--
-- The API verifies the TOTP cryptographically first.
--
-- Counter monotonicity prevents replay of an already accepted code.
-- --------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION
  system.auth_mfa_complete_enrollment(
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

  v_user_id text;
  v_school_id text;
  v_session_id text;
  v_mfa system.system_mfa%ROWTYPE;

BEGIN

  v_user_id :=
    system.ctx_user_id();


  v_school_id :=
    system.ctx_school_id();


  v_session_id :=
    NULLIF(
      current_setting(
        'app.session_id',
        true
      ),
      ''
    );


  IF v_user_id IS NULL
     OR v_school_id IS NULL
     OR v_session_id IS NULL
  THEN

    RETURN jsonb_build_object(
      'ok',
      false,
      'reason',
      'INVALID_SESSION'
    );

  END IF;


  IF NOT (
    system.ctx_has_role(
      'superadmin'
    )
    OR
    system.ctx_has_role(
      'headmaster'
    )
  ) THEN

    RETURN jsonb_build_object(
      'ok',
      false,
      'reason',
      'NOT_PRIVILEGED'
    );

  END IF;


  IF NOT system._mfa_verification_proof_valid(
    'ENROLL',
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


  SELECT *
  INTO v_mfa

  FROM
    system.system_mfa

  WHERE
    user_id=v_user_id

    AND method=
      'TOTP'::sukuux."MfaMethod"

  LIMIT 1

  FOR UPDATE;


  IF NOT FOUND
     OR v_mfa.secret IS NULL
  THEN

    RETURN jsonb_build_object(
      'ok',
      false,
      'reason',
      'NOT_CONFIGURED'
    );

  END IF;


  IF v_mfa.locked_until IS NOT NULL
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


  IF p_counter IS NULL
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


  UPDATE
    system.system_mfa

  SET
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
    id=v_mfa.id;


  UPDATE
    system.system_session

  SET
    auth_assurance=
      'MFA',

    mfa_verified_at=
      CURRENT_TIMESTAMP,

    step_up_verified_at=
      CURRENT_TIMESTAMP,

    step_up_expires_at=
      CURRENT_TIMESTAMP+
      interval '10 minutes',

    last_activity_at=
      CURRENT_TIMESTAMP

  WHERE
    id=v_session_id

    AND user_id=v_user_id

    AND school_id=v_school_id

    AND is_active=true

    AND invalidated_at IS NULL;


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
    v_user_id,
    v_school_id,
    'MFA_ENROLLED',
    'system_mfa',
    v_mfa.id,
    NULL,
    jsonb_build_object(
      'method',
      'TOTP'
    )::text,
    CURRENT_TIMESTAMP
  );


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
  system.auth_mfa_complete_enrollment(
    bigint,
    text
  )

FROM PUBLIC;


-- --------------------------------------------------------------------------
-- 11. Fresh MFA step-up.
-- --------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION
  system.auth_mfa_complete_step_up(
    p_counter bigint,
    p_proof text,
    p_ttl_seconds integer
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

  v_user_id text;
  v_school_id text;
  v_session_id text;
  v_mfa system.system_mfa%ROWTYPE;
  v_ttl integer;

BEGIN

  v_user_id :=
    system.ctx_user_id();


  v_school_id :=
    system.ctx_school_id();


  v_session_id :=
    NULLIF(
      current_setting(
        'app.session_id',
        true
      ),
      ''
    );


  IF v_user_id IS NULL
     OR v_school_id IS NULL
     OR v_session_id IS NULL
  THEN

    RETURN jsonb_build_object(
      'ok',
      false,
      'reason',
      'INVALID_SESSION'
    );

  END IF;


  v_ttl :=
    LEAST(
      GREATEST(
        COALESCE(
          p_ttl_seconds,
          600
        ),
        60
      ),
      900
    );


  IF NOT system._mfa_verification_proof_valid(
    'STEP_UP',
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


  SELECT *
  INTO v_mfa

  FROM
    system.system_mfa

  WHERE
    user_id=v_user_id

    AND method=
      'TOTP'::sukuux."MfaMethod"

    AND is_enabled=true

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


  IF v_mfa.locked_until IS NOT NULL
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


  IF p_counter IS NULL
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
    system.system_session

  SET
    auth_assurance=
      'MFA',

    mfa_verified_at=
      COALESCE(
        mfa_verified_at,
        CURRENT_TIMESTAMP
      ),

    step_up_verified_at=
      CURRENT_TIMESTAMP,

    step_up_expires_at=
      CURRENT_TIMESTAMP+
      make_interval(
        secs=>v_ttl
      ),

    last_activity_at=
      CURRENT_TIMESTAMP

  WHERE
    id=v_session_id

    AND user_id=v_user_id

    AND school_id=v_school_id

    AND is_active=true

    AND invalidated_at IS NULL;


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
    v_user_id,
    v_school_id,
    'MFA_STEP_UP_VERIFIED',
    'system_session',
    v_session_id,
    NULL,
    jsonb_build_object(
      'ttlSeconds',
      v_ttl
    )::text,
    CURRENT_TIMESTAMP
  );


  RETURN jsonb_build_object(
    'ok',
    true,
    'stepUpExpiresAt',
    CURRENT_TIMESTAMP+
      make_interval(
        secs=>v_ttl
      )
  );

END
$function$;


REVOKE ALL

ON FUNCTION
  system.auth_mfa_complete_step_up(
    bigint,
    text,
    integer
  )

FROM PUBLIC;


-- --------------------------------------------------------------------------
-- 12. Extend authoritative session lookup with assurance state.
-- --------------------------------------------------------------------------

DROP FUNCTION IF EXISTS
  system.auth_lookup_session(
    text,
    text
  );


CREATE FUNCTION
  system.auth_lookup_session(
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
  expires_at timestamp(3)
    without time zone,
  last_activity_at timestamp(3)
    without time zone,
  invalidated_at timestamp(3)
    without time zone,
  user_is_active boolean,
  user_status text,
  must_reset_password boolean,
  auth_assurance text,
  mfa_verified_at timestamp(3)
    without time zone,
  step_up_verified_at timestamp(3)
    without time zone,
  step_up_expires_at timestamp(3)
    without time zone
)

LANGUAGE sql
STABLE
SECURITY DEFINER

SET search_path =
  pg_catalog,
  system,
  sukuux

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
    u.must_reset_password,
    s.auth_assurance,
    s.mfa_verified_at,
    s.step_up_verified_at,
    s.step_up_expires_at

  FROM
    system.system_session s

  JOIN
    system.system_user u
      ON u.id=s.user_id

  LEFT JOIN LATERAL (

    SELECT
      r.name AS role_key

    FROM
      system.system_user_role sur

    JOIN
      system.system_role r
        ON r.id=sur.role_id

    WHERE
      sur.user_id=s.user_id

      AND sur.school_id=
        s.school_id

      AND (
        sur.expires_at IS NULL
        OR sur.expires_at >
           CURRENT_TIMESTAMP
      )

      AND r.archived_at IS NULL

    ORDER BY

      CASE r.name
        WHEN 'superadmin' THEN 0
        WHEN 'headmaster' THEN 1
        ELSE 2
      END,

      r.name

    LIMIT 1

  ) primary_role
    ON true

  WHERE
    s.id=p_session_id

    AND s.user_id=
      p_user_id

  LIMIT 1;

$function$;


REVOKE ALL

ON FUNCTION
  system.auth_lookup_session(
    text,
    text
  )

FROM PUBLIC;


-- --------------------------------------------------------------------------
-- 13. Runtime function authority.
-- --------------------------------------------------------------------------

DO $runtime_function_grants$
BEGIN

  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_roles
    WHERE rolname='sukuu_app_runtime'
  ) THEN

    EXECUTE
      'GRANT EXECUTE ON FUNCTION system.mfa_status_for_school() TO sukuu_app_runtime';

    EXECUTE
      'GRANT EXECUTE ON FUNCTION system.auth_mfa_status() TO sukuu_app_runtime';

    EXECUTE
      'GRANT EXECUTE ON FUNCTION system.auth_mfa_begin_totp_enrollment(text) TO sukuu_app_runtime';

    EXECUTE
      'GRANT EXECUTE ON FUNCTION system.auth_mfa_material() TO sukuu_app_runtime';

    EXECUTE
      'GRANT EXECUTE ON FUNCTION system.auth_mfa_record_failure() TO sukuu_app_runtime';

    EXECUTE
      'GRANT EXECUTE ON FUNCTION system.auth_mfa_complete_enrollment(bigint,text) TO sukuu_app_runtime';

    EXECUTE
      'GRANT EXECUTE ON FUNCTION system.auth_mfa_complete_step_up(bigint,text,integer) TO sukuu_app_runtime';

    EXECUTE
      'GRANT EXECUTE ON FUNCTION system.auth_lookup_session(text,text) TO sukuu_app_runtime';

  END IF;

END
$runtime_function_grants$;


COMMIT;
