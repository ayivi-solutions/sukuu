-- ============================================================================
-- SUKUU STAGE 3B PHASE 2F
-- Refresh-token full-digest hardening
--
-- Forward-only correction for the already-applied bcrypt refresh-verifier
-- design. bcrypt truncates inputs after 72 bytes; Sukuu refresh JWTs exceed
-- that boundary and can share the same prefix. The application now supplies
-- versioned HMAC-SHA-256 digests over the complete token.
--
-- CUTOVER CONTRACT
--   - stop API traffic before applying this migration
--   - deploy REFRESH_TOKEN_DIGEST_SECRET and the matching API build
--   - all legacy refresh sessions are invalidated
--   - no legacy comparison compatibility remains after cutover
-- ============================================================================

BEGIN;


-- --------------------------------------------------------------------------
-- 1. Deterministic preconditions.
-- --------------------------------------------------------------------------

DO $preflight$
BEGIN
  IF to_regclass(
    'system.system_session'
  ) IS NULL
  OR to_regclass(
    'system.system_audit_event'
  ) IS NULL THEN
    RAISE EXCEPTION
      'Refresh-digest cutover aborted: required SystemX table missing';
  END IF;

  IF to_regprocedure(
    'system.auth_rotate_refresh_session(text,text,text,text,text,text)'
  ) IS NULL THEN
    RAISE EXCEPTION
      'Refresh-digest cutover aborted: prior rotation contract missing';
  END IF;

  IF to_regprocedure(
    'extensions.digest(text,text)'
  ) IS NULL THEN
    RAISE EXCEPTION
      'Refresh-digest cutover aborted: pgcrypto digest helper missing';
  END IF;
END
$preflight$;


-- --------------------------------------------------------------------------
-- 2. Preserve cutover evidence before invalidating every legacy session.
-- --------------------------------------------------------------------------

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
SELECT
  gen_random_uuid()::text,
  s.user_id,
  s.school_id,
  'REFRESH_DIGEST_CUTOVER_INVALIDATION',
  'system_session',
  s.id,
  jsonb_build_object(
    'wasActive',
    s.is_active,
    'verifierFormat',
    CASE
      WHEN s.refresh_token_hash ~ '^\$2[aby]\$[0-9]{2}\$'
      THEN 'BCRYPT'
      ELSE 'OTHER_LEGACY'
    END
  )::text,
  jsonb_build_object(
    'sessionInvalidated',
    true,
    'reason',
    'REFRESH_DIGEST_V1_CUTOVER'
  )::text,
  CURRENT_TIMESTAMP
FROM
  system.system_session s
WHERE
  s.refresh_token_hash !~ '^h1:[0-9a-f]{64}$'
  AND s.is_active=true
  AND s.invalidated_at IS NULL
  AND NOT EXISTS (
    SELECT 1
    FROM system.system_audit_event e
    WHERE e.action=
      'REFRESH_DIGEST_CUTOVER_INVALIDATION'
      AND e.entity_type='system_session'
      AND e.entity_id=s.id
  );


-- --------------------------------------------------------------------------
-- 3. Remove all legacy verifier material and invalidate affected sessions.
--    Tombstones remain versioned historical evidence but cannot authenticate.
-- --------------------------------------------------------------------------

UPDATE
  system.system_session s
SET
  refresh_token_hash=
    'legacy-disabled:' ||
    encode(
      extensions.digest(
        s.id || ':' ||
        s.refresh_token_hash,
        'sha256'
      ),
      'hex'
    ),
  is_active=false,
  invalidated_at=
    COALESCE(
      s.invalidated_at,
      CURRENT_TIMESTAMP
    ),
  last_activity_at=
    CASE
      WHEN s.is_active=true
      THEN CURRENT_TIMESTAMP
      ELSE s.last_activity_at
    END
WHERE
  s.refresh_token_hash !~
    '^(h1|legacy-disabled):[0-9a-f]{64}$';


-- --------------------------------------------------------------------------
-- 4. Enforce versioned digest or disabled-tombstone format for every future
--    insert and update. Existing rows have already been normalized above.
-- --------------------------------------------------------------------------

ALTER TABLE
  system.system_session
DROP CONSTRAINT IF EXISTS
  system_session_refresh_token_digest_format_ck;

ALTER TABLE
  system.system_session
ADD CONSTRAINT
  system_session_refresh_token_digest_format_ck
CHECK (
  refresh_token_hash ~
    '^(h1|legacy-disabled):[0-9a-f]{64}$'
);


-- --------------------------------------------------------------------------
-- 5. Private fixed-length digest comparison. Both 32-byte values are scanned
--    fully before the result is returned. Runtime receives no direct grant.
-- --------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION
  system._auth_refresh_digest_matches(
    p_presented_digest text,
    p_stored_digest text
  )
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
STRICT
SET search_path =
  pg_catalog,
  system,
  sukuux
AS $function$
DECLARE
  v_presented bytea;
  v_stored bytea;
  v_difference integer := 0;
  v_index integer;
BEGIN
  IF p_presented_digest !~
       '^h1:[0-9a-f]{64}$'
     OR p_stored_digest !~
       '^h1:[0-9a-f]{64}$'
  THEN
    RETURN false;
  END IF;

  v_presented :=
    decode(
      substring(
        p_presented_digest
        FROM 4
      ),
      'hex'
    );

  v_stored :=
    decode(
      substring(
        p_stored_digest
        FROM 4
      ),
      'hex'
    );

  FOR v_index IN 0..31 LOOP
    v_difference :=
      v_difference |
      (
        get_byte(
          v_presented,
          v_index
        ) #
        get_byte(
          v_stored,
          v_index
        )
      );
  END LOOP;

  RETURN v_difference=0;
END
$function$;


-- --------------------------------------------------------------------------
-- 6. Replace the prior same-signature contract with digest-only semantics.
--    The row lock keeps compare-and-rotate atomic under concurrent requests.
-- --------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION
  system.auth_rotate_refresh_session(
    p_session_id text,
    p_user_id text,
    -- Parameter names are retained from the deployed function because
    -- PostgreSQL CREATE OR REPLACE cannot rename input parameters. Both
    -- values are digest-only after this cutover.
    p_presented_refresh_token text,
    p_new_refresh_token_hash text,
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
  v_session
    system.system_session%ROWTYPE;
  v_user
    system.system_user%ROWTYPE;
  v_role_key text;
BEGIN
  IF p_session_id IS NULL
     OR p_user_id IS NULL
     OR p_presented_refresh_token IS NULL
     OR p_presented_refresh_token !~
       '^h1:[0-9a-f]{64}$'
     OR p_new_refresh_token_hash IS NULL
     OR p_new_refresh_token_hash !~
       '^h1:[0-9a-f]{64}$'
  THEN
    RETURN jsonb_build_object(
      'ok',
      false,
      'reason',
      'INVALID'
    );
  END IF;

  SELECT
    s.*
  INTO
    v_session
  FROM
    system.system_session s
  WHERE
    s.id=p_session_id
    AND s.user_id=p_user_id
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND
     OR v_session.is_active <> true
     OR v_session.invalidated_at IS NOT NULL
     OR v_session.expires_at <= CURRENT_TIMESTAMP
     OR v_session.school_id IS NULL
  THEN
    RETURN jsonb_build_object(
      'ok',
      false,
      'reason',
      'INVALID'
    );
  END IF;

  IF NOT system._auth_refresh_digest_matches(
    p_presented_refresh_token,
    v_session.refresh_token_hash
  ) THEN
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
      id=v_session.id;

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
      v_session.user_id,
      v_session.school_id,
      'REFRESH_TOKEN_REPLAY_DETECTED',
      'system_session',
      v_session.id,
      NULL,
      jsonb_build_object(
        'sessionInvalidated',
        true,
        'ipAddress',
        p_ip_address,
        'userAgent',
        p_user_agent,
        'verifierVersion',
        'h1'
      )::text,
      CURRENT_TIMESTAMP
    );

    RETURN jsonb_build_object(
      'ok',
      false,
      'reason',
      'REPLAY'
    );
  END IF;

  SELECT
    u.*
  INTO
    v_user
  FROM
    system.system_user u
  WHERE
    u.id=v_session.user_id
    AND u.archived_at IS NULL
  LIMIT 1;

  IF NOT FOUND
     OR v_user.is_active <> true
     OR v_user.status IN (
       'LOCKED',
       'SUSPENDED',
       'CLOSED'
     )
  THEN
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
      id=v_session.id;

    RETURN jsonb_build_object(
      'ok',
      false,
      'reason',
      'INVALID'
    );
  END IF;

  SELECT
    r.name
  INTO
    v_role_key
  FROM
    system.system_user_role sur
  JOIN
    system.system_role r
    ON r.id=sur.role_id
  WHERE
    sur.user_id=v_session.user_id
    AND sur.school_id=v_session.school_id
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
  LIMIT 1;

  IF v_role_key IS NULL THEN
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
      id=v_session.id;

    RETURN jsonb_build_object(
      'ok',
      false,
      'reason',
      'INVALID'
    );
  END IF;

  UPDATE
    system.system_session
  SET
    refresh_token_hash=
      p_new_refresh_token_hash,
    last_activity_at=
      CURRENT_TIMESTAMP
  WHERE
    id=v_session.id;

  RETURN jsonb_build_object(
    'ok',
    true,
    'schoolId',
    v_session.school_id,
    'roleKey',
    v_role_key,
    'mustResetPassword',
    v_user.must_reset_password,
    'expiresAt',
    v_session.expires_at,
    'authAssurance',
    v_session.auth_assurance
  );
END
$function$;


-- --------------------------------------------------------------------------
-- 7. Least-privilege execution boundary.
-- --------------------------------------------------------------------------

REVOKE ALL ON FUNCTION
  system._auth_refresh_digest_matches(
    text,
    text
  )
FROM PUBLIC;

REVOKE EXECUTE ON FUNCTION
  system._auth_refresh_digest_matches(
    text,
    text
  )
FROM sukuu_app_runtime;

ALTER FUNCTION
  system._auth_refresh_digest_matches(
    text,
    text
  )
OWNER TO postgres;

REVOKE ALL ON FUNCTION
  system.auth_rotate_refresh_session(
    text,
    text,
    text,
    text,
    text,
    text
  )
FROM PUBLIC;

GRANT EXECUTE ON FUNCTION
  system.auth_rotate_refresh_session(
    text,
    text,
    text,
    text,
    text,
    text
  )
TO sukuu_app_runtime;

ALTER FUNCTION
  system.auth_rotate_refresh_session(
    text,
    text,
    text,
    text,
    text,
    text
  )
OWNER TO postgres;


-- --------------------------------------------------------------------------
-- 8. Deterministic postconditions.
-- --------------------------------------------------------------------------

DO $postflight$
DECLARE
  v_active_legacy integer;
  v_non_versioned integer;
BEGIN
  SELECT
    COUNT(*)::integer
  INTO
    v_active_legacy
  FROM
    system.system_session
  WHERE
    is_active=true
    AND invalidated_at IS NULL
    AND refresh_token_hash !~
      '^h1:[0-9a-f]{64}$';

  SELECT
    COUNT(*)::integer
  INTO
    v_non_versioned
  FROM
    system.system_session
  WHERE
    refresh_token_hash !~
      '^(h1|legacy-disabled):[0-9a-f]{64}$';

  IF v_active_legacy <> 0
     OR v_non_versioned <> 0
  THEN
    RAISE EXCEPTION
      'Refresh-digest postcondition failed: active legacy %, non-versioned %',
      v_active_legacy,
      v_non_versioned;
  END IF;
END
$postflight$;

COMMIT;
