BEGIN;

-- ============================================================================
-- SUKUU SCHOOLX SX-2B
-- Dedicated AYIVI Provider Authority + Initial Tenant Superadmin Handoff
--
-- Provider authority is NOT a tenant role and receives no system_user_role
-- grant. Provider authentication is hardware-backed WebAuthn with a dedicated
-- provider session/context. Initial Tenant Superadmin role approval is recorded
-- by the provider, while account activation is completed by the nominated
-- delegate using the one-time invitation plus password + TOTP proof.
-- ============================================================================

DO $preflight$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM "_prisma_migrations"
    WHERE migration_name =
      '20260831050000_schoolx_action_lifecycle_foundation'
      AND finished_at IS NOT NULL
      AND rolled_back_at IS NULL
  ) THEN
    RAISE EXCEPTION
      'SX-2B aborted: accepted SX-2A migration is not applied';
  END IF;

  IF to_regclass('sukuux.school_lifecycle_transition') IS NULL
     OR to_regprocedure('system._context_secret()') IS NULL
     OR to_regprocedure('system._hmac_sha256_hex(text,text)') IS NULL
     OR to_regprocedure('system._mfa_proof_secret()') IS NULL THEN
    RAISE EXCEPTION
      'SX-2B aborted: trusted authority/MFA foundations are incomplete';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM system.system_role
    WHERE name='platform_admin'
      AND is_system=true
      AND school_id IS NULL
      AND archived_at IS NULL
  ) THEN
    RAISE EXCEPTION
      'SX-2B aborted: provider platform_admin role definition is missing';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM system.system_user_role ur
    JOIN system.system_role r
      ON r.id=ur.role_id
    WHERE r.name='platform_admin'
      AND r.archived_at IS NULL
  ) THEN
    RAISE EXCEPTION
      'SX-2B aborted: platform_admin must not have a tenant user-role grant';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_roles
    WHERE rolname='sukuu_app_runtime'
      AND rolsuper=false
      AND rolbypassrls=false
  ) THEN
    RAISE EXCEPTION
      'SX-2B aborted: non-bypass sukuu_app_runtime role is unavailable';
  END IF;

  IF to_regclass('system.system_provider_identity') IS NOT NULL
     OR to_regclass('system.system_provider_authenticator') IS NOT NULL
     OR to_regclass('system.system_provider_challenge') IS NOT NULL
     OR to_regclass('system.system_provider_session') IS NOT NULL
     OR to_regclass('system.system_provider_audit_event') IS NOT NULL
     OR to_regclass('sukuux.school_delegate_nomination') IS NOT NULL THEN
    RAISE EXCEPTION
      'SX-2B aborted: provider/delegate objects already exist unexpectedly';
  END IF;
END
$preflight$;

-- --------------------------------------------------------------------------
-- 1. Dedicated provider-global persistence. No tenant nullable-scope shortcut.
-- --------------------------------------------------------------------------

CREATE TABLE system.system_provider_identity (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  login_name text NOT NULL,
  display_name text NOT NULL,
  status text NOT NULL DEFAULT 'PENDING_ENROLLMENT',
  row_version integer NOT NULL DEFAULT 1,
  bootstrap_token_hash text,
  bootstrap_expires_at timestamptz,
  bootstrap_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  activated_at timestamptz,
  last_login_at timestamptz,
  suspended_at timestamptz,
  closed_at timestamptz,
  CONSTRAINT system_provider_identity_status_check
    CHECK (status IN ('PENDING_ENROLLMENT','ACTIVE','SUSPENDED','CLOSED'))
);

CREATE UNIQUE INDEX uq_system_provider_identity_login_name
  ON system.system_provider_identity (login_name);

CREATE TABLE system.system_provider_authenticator (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  provider_id text NOT NULL,
  credential_id text NOT NULL,
  public_key bytea NOT NULL,
  counter bigint NOT NULL DEFAULT 0,
  transports text,
  device_type text NOT NULL,
  backed_up boolean NOT NULL DEFAULT false,
  aaguid text,
  attachment text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_used_at timestamptz,
  revoked_at timestamptz,
  CONSTRAINT system_provider_authenticator_provider_fk
    FOREIGN KEY (provider_id)
    REFERENCES system.system_provider_identity(id),
  CONSTRAINT system_provider_authenticator_device_check
    CHECK (device_type='singleDevice' AND backed_up=false),
  CONSTRAINT system_provider_authenticator_attachment_check
    CHECK (attachment IN ('platform','cross-platform'))
);

CREATE UNIQUE INDEX uq_system_provider_authenticator_credential
  ON system.system_provider_authenticator (credential_id);

CREATE INDEX idx_system_provider_authenticator_provider
  ON system.system_provider_authenticator (provider_id);

CREATE TABLE system.system_provider_challenge (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  provider_id text NOT NULL,
  purpose text NOT NULL,
  challenge text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  revoked_at timestamptz,
  CONSTRAINT system_provider_challenge_provider_fk
    FOREIGN KEY (provider_id)
    REFERENCES system.system_provider_identity(id),
  CONSTRAINT system_provider_challenge_purpose_check
    CHECK (purpose IN ('REGISTER','AUTHENTICATE'))
);

CREATE INDEX idx_system_provider_challenge_provider_purpose
  ON system.system_provider_challenge (provider_id, purpose, created_at DESC);

CREATE TABLE system.system_provider_session (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  provider_id text NOT NULL,
  credential_id text NOT NULL,
  assurance text NOT NULL DEFAULT 'WEBAUTHN_HARDWARE',
  is_active boolean NOT NULL DEFAULT true,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at timestamptz NOT NULL,
  last_activity_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  invalidated_at timestamptz,
  CONSTRAINT system_provider_session_provider_fk
    FOREIGN KEY (provider_id)
    REFERENCES system.system_provider_identity(id),
  CONSTRAINT system_provider_session_assurance_check
    CHECK (assurance='WEBAUTHN_HARDWARE')
);

CREATE INDEX idx_system_provider_session_provider
  ON system.system_provider_session (provider_id, is_active, expires_at);

CREATE TABLE system.system_provider_audit_event (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  provider_id text,
  session_id text,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  purpose text NOT NULL,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_system_provider_audit_event_provider_time
  ON system.system_provider_audit_event (provider_id, created_at DESC);

CREATE TABLE sukuux.school_delegate_nomination (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  school_id text NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text,
  status text NOT NULL DEFAULT 'NOMINATED',
  nominated_by_provider_id text NOT NULL,
  nomination_reason text NOT NULL,
  invite_token_hash text NOT NULL,
  invite_expires_at timestamptz NOT NULL,
  invite_consumed_at timestamptz,
  pending_mfa_secret_envelope text,
  accept_started_at timestamptz,
  attempt_count integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 5,
  activated_user_id text,
  activated_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT school_delegate_nomination_status_check
    CHECK (status IN ('NOMINATED','ACTIVATION_STARTED','ACTIVATED','REVOKED')),
  CONSTRAINT school_delegate_nomination_attempt_check
    CHECK (attempt_count >= 0 AND max_attempts BETWEEN 1 AND 10)
);

CREATE UNIQUE INDEX uq_school_delegate_nomination_token_hash
  ON sukuux.school_delegate_nomination (invite_token_hash);

CREATE UNIQUE INDEX uq_school_delegate_nomination_open_school
  ON sukuux.school_delegate_nomination (school_id)
  WHERE status IN ('NOMINATED','ACTIVATION_STARTED')
    AND revoked_at IS NULL;

CREATE INDEX idx_school_delegate_nomination_school
  ON sukuux.school_delegate_nomination (school_id, created_at DESC);

-- Provider bootstrap identity definition only. The one-time bootstrap token hash
-- is intentionally NOT issued by this migration. It is provisioned only by the
-- separate provider-enrollment commissioning gate after this foundation passes.
INSERT INTO system.system_provider_identity (
  id,
  login_name,
  display_name,
  status,
  row_version
)
VALUES (
  gen_random_uuid()::text,
  'platform-owner',
  'Platform Owner',
  'PENDING_ENROLLMENT',
  1
);

-- --------------------------------------------------------------------------
-- 2. FORCE RLS and remove direct runtime table authority.
-- --------------------------------------------------------------------------

DO $provider_rls$
DECLARE
  v_schema text;
  v_table text;
  v_tables text[][] := ARRAY[
    ARRAY['system','system_provider_identity'],
    ARRAY['system','system_provider_authenticator'],
    ARRAY['system','system_provider_challenge'],
    ARRAY['system','system_provider_session'],
    ARRAY['system','system_provider_audit_event'],
    ARRAY['sukuux','school_delegate_nomination']
  ];
  v_item text[];
BEGIN
  FOREACH v_item SLICE 1 IN ARRAY v_tables LOOP
    v_schema := v_item[1];
    v_table := v_item[2];

    EXECUTE format(
      'ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY',
      v_schema,
      v_table
    );
    EXECUTE format(
      'ALTER TABLE %I.%I FORCE ROW LEVEL SECURITY',
      v_schema,
      v_table
    );
    EXECUTE format(
      'REVOKE ALL ON TABLE %I.%I FROM PUBLIC',
      v_schema,
      v_table
    );
    EXECUTE format(
      'REVOKE ALL ON TABLE %I.%I FROM sukuu_app_runtime',
      v_schema,
      v_table
    );
  END LOOP;
END
$provider_rls$;

-- Intentionally NO ordinary policies on provider/delegate tables.
-- All application access is through the narrow SECURITY DEFINER functions below.

-- --------------------------------------------------------------------------
-- 3. Dedicated provider context, domain-separated from tenant context.
-- --------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION system._provider_context_proof_valid()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path=pg_catalog,system
AS $function$
DECLARE
  v_session_id text;
  v_provider_id text;
  v_proof text;
  v_secret text;
  v_expected text;
BEGIN
  v_session_id := NULLIF(
    current_setting('app.provider_session_id', true),
    ''
  );
  v_provider_id := NULLIF(
    current_setting('app.provider_user_id', true),
    ''
  );
  v_proof := NULLIF(
    current_setting('app.provider_session_proof', true),
    ''
  );

  IF v_session_id IS NULL
     OR v_provider_id IS NULL
     OR v_proof IS NULL THEN
    RETURN false;
  END IF;

  v_secret := system._context_secret();
  IF v_secret IS NULL OR length(v_secret) < 32 THEN
    RETURN false;
  END IF;

  v_expected := system._hmac_sha256_hex(
    'provider:' || v_session_id || ':' || v_provider_id,
    v_secret
  );

  IF v_expected IS NULL OR v_expected <> v_proof THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM system.system_provider_session s
    JOIN system.system_provider_identity p
      ON p.id=s.provider_id
    WHERE s.id=v_session_id
      AND s.provider_id=v_provider_id
      AND s.is_active=true
      AND s.invalidated_at IS NULL
      AND s.expires_at > CURRENT_TIMESTAMP
      AND s.assurance='WEBAUTHN_HARDWARE'
      AND p.status='ACTIVE'
      AND p.closed_at IS NULL
  );
END
$function$;

CREATE OR REPLACE FUNCTION system.provider_ctx_user_id()
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path=pg_catalog,system
AS $function$
BEGIN
  IF NOT system._provider_context_proof_valid() THEN
    RETURN NULL;
  END IF;

  RETURN NULLIF(
    current_setting('app.provider_user_id', true),
    ''
  );
END
$function$;

CREATE OR REPLACE FUNCTION system.provider_ctx_session_id()
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path=pg_catalog,system
AS $function$
BEGIN
  IF NOT system._provider_context_proof_valid() THEN
    RETURN NULL;
  END IF;

  RETURN NULLIF(
    current_setting('app.provider_session_id', true),
    ''
  );
END
$function$;

-- --------------------------------------------------------------------------
-- 4. One-time provider WebAuthn enrollment.
-- --------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION system.provider_bootstrap_material(
  p_login_name text,
  p_token_hash text
)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path=pg_catalog,system
AS $function$
DECLARE
  v_provider system.system_provider_identity%ROWTYPE;
BEGIN
  IF p_login_name IS NULL
     OR p_token_hash IS NULL
     OR length(p_token_hash) <> 64 THEN
    RETURN jsonb_build_object('ok',false,'reason','INVALID');
  END IF;

  SELECT *
  INTO v_provider
  FROM system.system_provider_identity
  WHERE lower(login_name)=lower(p_login_name)
    AND status='PENDING_ENROLLMENT'
    AND bootstrap_token_hash=p_token_hash
    AND bootstrap_expires_at > CURRENT_TIMESTAMP
    AND bootstrap_used_at IS NULL
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok',false,'reason','INVALID');
  END IF;

  IF EXISTS (
    SELECT 1
    FROM system.system_provider_authenticator
    WHERE provider_id=v_provider.id
      AND revoked_at IS NULL
  ) THEN
    RETURN jsonb_build_object('ok',false,'reason','ALREADY_ENROLLED');
  END IF;

  RETURN jsonb_build_object(
    'ok',true,
    'providerId',v_provider.id,
    'loginName',v_provider.login_name,
    'displayName',v_provider.display_name
  );
END
$function$;

CREATE OR REPLACE FUNCTION system.provider_registration_challenge_begin(
  p_login_name text,
  p_token_hash text,
  p_challenge text,
  p_expires_at timestamptz
)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path=pg_catalog,system
AS $function$
DECLARE
  v_material jsonb;
  v_provider_id text;
  v_challenge_id text;
BEGIN
  v_material := system.provider_bootstrap_material(
    p_login_name,
    p_token_hash
  );

  IF COALESCE((v_material->>'ok')::boolean,false) IS NOT TRUE THEN
    RETURN jsonb_build_object('ok',false,'reason','INVALID');
  END IF;

  v_provider_id := v_material->>'providerId';

  UPDATE system.system_provider_challenge
  SET revoked_at=CURRENT_TIMESTAMP
  WHERE provider_id=v_provider_id
    AND purpose='REGISTER'
    AND consumed_at IS NULL
    AND revoked_at IS NULL;

  v_challenge_id := gen_random_uuid()::text;

  INSERT INTO system.system_provider_challenge (
    id,
    provider_id,
    purpose,
    challenge,
    expires_at
  )
  VALUES (
    v_challenge_id,
    v_provider_id,
    'REGISTER',
    p_challenge,
    LEAST(
      p_expires_at,
      CURRENT_TIMESTAMP + interval '5 minutes'
    )
  );

  RETURN jsonb_build_object(
    'ok',true,
    'challengeId',v_challenge_id
  );
END
$function$;

CREATE OR REPLACE FUNCTION system.provider_registration_material(
  p_login_name text,
  p_token_hash text,
  p_challenge_id text
)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path=pg_catalog,system
AS $function$
DECLARE
  v_material jsonb;
  v_provider_id text;
  v_challenge system.system_provider_challenge%ROWTYPE;
BEGIN
  v_material := system.provider_bootstrap_material(
    p_login_name,
    p_token_hash
  );

  IF COALESCE((v_material->>'ok')::boolean,false) IS NOT TRUE THEN
    RETURN jsonb_build_object('ok',false,'reason','INVALID');
  END IF;

  v_provider_id := v_material->>'providerId';

  SELECT *
  INTO v_challenge
  FROM system.system_provider_challenge
  WHERE id=p_challenge_id
    AND provider_id=v_provider_id
    AND purpose='REGISTER'
    AND consumed_at IS NULL
    AND revoked_at IS NULL
    AND expires_at > CURRENT_TIMESTAMP
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok',false,'reason','INVALID');
  END IF;

  RETURN jsonb_build_object(
    'ok',true,
    'providerId',v_provider_id,
    'challenge',v_challenge.challenge
  );
END
$function$;

CREATE OR REPLACE FUNCTION system.provider_registration_complete(
  p_login_name text,
  p_token_hash text,
  p_challenge_id text,
  p_credential_id text,
  p_public_key bytea,
  p_counter bigint,
  p_transports text,
  p_device_type text,
  p_backed_up boolean,
  p_aaguid text,
  p_attachment text,
  p_proof text
)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path=pg_catalog,system
AS $function$
DECLARE
  v_provider system.system_provider_identity%ROWTYPE;
  v_challenge system.system_provider_challenge%ROWTYPE;
  v_secret text;
  v_expected text;
BEGIN
  SELECT *
  INTO v_provider
  FROM system.system_provider_identity
  WHERE lower(login_name)=lower(p_login_name)
    AND status='PENDING_ENROLLMENT'
    AND bootstrap_token_hash=p_token_hash
    AND bootstrap_expires_at > CURRENT_TIMESTAMP
    AND bootstrap_used_at IS NULL
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok',false,'reason','INVALID');
  END IF;

  SELECT *
  INTO v_challenge
  FROM system.system_provider_challenge
  WHERE id=p_challenge_id
    AND provider_id=v_provider.id
    AND purpose='REGISTER'
    AND consumed_at IS NULL
    AND revoked_at IS NULL
    AND expires_at > CURRENT_TIMESTAMP
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok',false,'reason','INVALID');
  END IF;

  IF p_credential_id IS NULL
     OR p_public_key IS NULL
     OR p_device_type <> 'singleDevice'
     OR p_backed_up IS NOT FALSE
     OR p_attachment NOT IN ('platform','cross-platform') THEN
    RETURN jsonb_build_object('ok',false,'reason','AUTHENTICATOR_POLICY');
  END IF;

  v_secret := system._context_secret();
  v_expected := system._hmac_sha256_hex(
    'provider-register:' ||
      v_provider.id || ':' ||
      p_challenge_id || ':' ||
      p_credential_id || ':' ||
      p_counter::text,
    v_secret
  );

  IF v_expected IS NULL OR v_expected <> p_proof THEN
    RETURN jsonb_build_object('ok',false,'reason','PROOF_INVALID');
  END IF;

  IF EXISTS (
    SELECT 1
    FROM system.system_provider_authenticator
    WHERE credential_id=p_credential_id
  ) THEN
    RETURN jsonb_build_object('ok',false,'reason','DUPLICATE_CREDENTIAL');
  END IF;

  INSERT INTO system.system_provider_authenticator (
    provider_id,
    credential_id,
    public_key,
    counter,
    transports,
    device_type,
    backed_up,
    aaguid,
    attachment
  )
  VALUES (
    v_provider.id,
    p_credential_id,
    p_public_key,
    GREATEST(p_counter,0),
    p_transports,
    p_device_type,
    p_backed_up,
    NULLIF(p_aaguid,''),
    p_attachment
  );

  UPDATE system.system_provider_challenge
  SET consumed_at=CURRENT_TIMESTAMP
  WHERE id=v_challenge.id;

  UPDATE system.system_provider_identity
  SET
    status='ACTIVE',
    row_version=row_version+1,
    bootstrap_used_at=CURRENT_TIMESTAMP,
    bootstrap_token_hash=NULL,
    bootstrap_expires_at=NULL,
    activated_at=CURRENT_TIMESTAMP
  WHERE id=v_provider.id;

  INSERT INTO system.system_provider_audit_event (
    provider_id,
    action,
    entity_type,
    entity_id,
    purpose,
    payload
  )
  VALUES (
    v_provider.id,
    'PROVIDER_WEBAUTHN_ENROLLED',
    'system_provider_identity',
    v_provider.id,
    'Initial provider privileged-identity enrollment',
    jsonb_build_object(
      'credentialId',p_credential_id,
      'deviceType',p_device_type,
      'attachment',p_attachment,
      'aaguid',NULLIF(p_aaguid,'')
    )
  );

  RETURN jsonb_build_object('ok',true);
END
$function$;

-- --------------------------------------------------------------------------
-- 5. Provider WebAuthn authentication/session.
-- --------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION system.provider_auth_material(
  p_login_name text
)
RETURNS TABLE (
  provider_id text,
  login_name text,
  credential_id text,
  public_key_base64 text,
  counter bigint,
  transports text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path=pg_catalog,system
AS $function$
  SELECT
    p.id,
    p.login_name,
    a.credential_id,
    encode(a.public_key,'base64'),
    a.counter,
    a.transports
  FROM system.system_provider_identity p
  JOIN system.system_provider_authenticator a
    ON a.provider_id=p.id
  WHERE lower(p.login_name)=lower(p_login_name)
    AND p.status='ACTIVE'
    AND p.closed_at IS NULL
    AND a.revoked_at IS NULL
$function$;

CREATE OR REPLACE FUNCTION system.provider_auth_challenge_begin(
  p_provider_id text,
  p_challenge text,
  p_expires_at timestamptz
)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path=pg_catalog,system
AS $function$
DECLARE
  v_challenge_id text;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM system.system_provider_identity
    WHERE id=p_provider_id
      AND status='ACTIVE'
      AND closed_at IS NULL
  ) THEN
    RETURN jsonb_build_object('ok',false,'reason','INVALID');
  END IF;

  UPDATE system.system_provider_challenge
  SET revoked_at=CURRENT_TIMESTAMP
  WHERE provider_id=p_provider_id
    AND purpose='AUTHENTICATE'
    AND consumed_at IS NULL
    AND revoked_at IS NULL;

  v_challenge_id := gen_random_uuid()::text;

  INSERT INTO system.system_provider_challenge (
    id,
    provider_id,
    purpose,
    challenge,
    expires_at
  )
  VALUES (
    v_challenge_id,
    p_provider_id,
    'AUTHENTICATE',
    p_challenge,
    LEAST(
      p_expires_at,
      CURRENT_TIMESTAMP + interval '5 minutes'
    )
  );

  RETURN jsonb_build_object(
    'ok',true,
    'challengeId',v_challenge_id
  );
END
$function$;

CREATE OR REPLACE FUNCTION system.provider_auth_verify_material(
  p_login_name text,
  p_challenge_id text,
  p_credential_id text
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path=pg_catalog,system
AS $function$
DECLARE
  v_provider system.system_provider_identity%ROWTYPE;
  v_challenge system.system_provider_challenge%ROWTYPE;
  v_auth system.system_provider_authenticator%ROWTYPE;
BEGIN
  SELECT *
  INTO v_provider
  FROM system.system_provider_identity
  WHERE lower(login_name)=lower(p_login_name)
    AND status='ACTIVE'
    AND closed_at IS NULL
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok',false,'reason','INVALID');
  END IF;

  SELECT *
  INTO v_challenge
  FROM system.system_provider_challenge
  WHERE id=p_challenge_id
    AND provider_id=v_provider.id
    AND purpose='AUTHENTICATE'
    AND consumed_at IS NULL
    AND revoked_at IS NULL
    AND expires_at > CURRENT_TIMESTAMP
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok',false,'reason','INVALID');
  END IF;

  SELECT *
  INTO v_auth
  FROM system.system_provider_authenticator
  WHERE provider_id=v_provider.id
    AND credential_id=p_credential_id
    AND revoked_at IS NULL
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok',false,'reason','INVALID');
  END IF;

  RETURN jsonb_build_object(
    'ok',true,
    'providerId',v_provider.id,
    'challenge',v_challenge.challenge,
    'credentialId',v_auth.credential_id,
    'publicKeyBase64',encode(v_auth.public_key,'base64'),
    'counter',v_auth.counter,
    'transports',v_auth.transports
  );
END
$function$;

CREATE OR REPLACE FUNCTION system.provider_auth_complete(
  p_provider_id text,
  p_challenge_id text,
  p_credential_id text,
  p_new_counter bigint,
  p_ip_address text,
  p_user_agent text,
  p_proof text
)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path=pg_catalog,system
AS $function$
DECLARE
  v_challenge system.system_provider_challenge%ROWTYPE;
  v_auth system.system_provider_authenticator%ROWTYPE;
  v_secret text;
  v_expected text;
  v_session_id text;
  v_expires_at timestamptz;
BEGIN
  SELECT *
  INTO v_challenge
  FROM system.system_provider_challenge
  WHERE id=p_challenge_id
    AND provider_id=p_provider_id
    AND purpose='AUTHENTICATE'
    AND consumed_at IS NULL
    AND revoked_at IS NULL
    AND expires_at > CURRENT_TIMESTAMP
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok',false,'reason','INVALID');
  END IF;

  SELECT *
  INTO v_auth
  FROM system.system_provider_authenticator
  WHERE provider_id=p_provider_id
    AND credential_id=p_credential_id
    AND revoked_at IS NULL
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok',false,'reason','INVALID');
  END IF;

  IF v_auth.counter > 0 AND p_new_counter <= v_auth.counter THEN
    RETURN jsonb_build_object('ok',false,'reason','COUNTER_REPLAY');
  END IF;

  v_secret := system._context_secret();
  v_expected := system._hmac_sha256_hex(
    'provider-auth:' ||
      p_provider_id || ':' ||
      p_challenge_id || ':' ||
      p_credential_id || ':' ||
      p_new_counter::text,
    v_secret
  );

  IF v_expected IS NULL OR v_expected <> p_proof THEN
    RETURN jsonb_build_object('ok',false,'reason','PROOF_INVALID');
  END IF;

  UPDATE system.system_provider_authenticator
  SET
    counter=p_new_counter,
    last_used_at=CURRENT_TIMESTAMP
  WHERE id=v_auth.id;

  UPDATE system.system_provider_challenge
  SET consumed_at=CURRENT_TIMESTAMP
  WHERE id=v_challenge.id;

  v_session_id := gen_random_uuid()::text;
  v_expires_at := CURRENT_TIMESTAMP + interval '30 minutes';

  INSERT INTO system.system_provider_session (
    id,
    provider_id,
    credential_id,
    assurance,
    is_active,
    ip_address,
    user_agent,
    expires_at,
    last_activity_at
  )
  VALUES (
    v_session_id,
    p_provider_id,
    p_credential_id,
    'WEBAUTHN_HARDWARE',
    true,
    p_ip_address,
    p_user_agent,
    v_expires_at,
    CURRENT_TIMESTAMP
  );

  UPDATE system.system_provider_identity
  SET last_login_at=CURRENT_TIMESTAMP
  WHERE id=p_provider_id;

  INSERT INTO system.system_provider_audit_event (
    provider_id,
    session_id,
    action,
    entity_type,
    entity_id,
    purpose,
    payload
  )
  VALUES (
    p_provider_id,
    v_session_id,
    'PROVIDER_LOGIN',
    'system_provider_session',
    v_session_id,
    'Privileged provider session establishment',
    jsonb_build_object(
      'assurance','WEBAUTHN_HARDWARE',
      'credentialId',p_credential_id
    )
  );

  RETURN jsonb_build_object(
    'ok',true,
    'providerId',p_provider_id,
    'sessionId',v_session_id,
    'expiresAt',v_expires_at
  );
END
$function$;

CREATE OR REPLACE FUNCTION system.provider_auth_session_lookup(
  p_session_id text,
  p_provider_id text
)
RETURNS TABLE (
  active boolean,
  assurance text
)
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path=pg_catalog,system
AS $function$
BEGIN
  UPDATE system.system_provider_session
  SET last_activity_at=CURRENT_TIMESTAMP
  WHERE id=p_session_id
    AND provider_id=p_provider_id
    AND is_active=true
    AND invalidated_at IS NULL
    AND expires_at > CURRENT_TIMESTAMP;

  RETURN QUERY
  SELECT
    (
      s.is_active=true
      AND s.invalidated_at IS NULL
      AND s.expires_at > CURRENT_TIMESTAMP
      AND p.status='ACTIVE'
      AND p.closed_at IS NULL
    ) AS active,
    s.assurance
  FROM system.system_provider_session s
  JOIN system.system_provider_identity p
    ON p.id=s.provider_id
  WHERE s.id=p_session_id
    AND s.provider_id=p_provider_id
  LIMIT 1;
END
$function$;

CREATE OR REPLACE FUNCTION system.provider_session_revoke()
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path=pg_catalog,system
AS $function$
DECLARE
  v_provider_id text;
  v_session_id text;
BEGIN
  v_provider_id := system.provider_ctx_user_id();
  v_session_id := system.provider_ctx_session_id();

  IF v_provider_id IS NULL OR v_session_id IS NULL THEN
    RETURN jsonb_build_object('ok',false,'reason','INVALID_SESSION');
  END IF;

  UPDATE system.system_provider_session
  SET
    is_active=false,
    invalidated_at=CURRENT_TIMESTAMP,
    last_activity_at=CURRENT_TIMESTAMP
  WHERE id=v_session_id
    AND provider_id=v_provider_id;

  INSERT INTO system.system_provider_audit_event (
    provider_id,
    session_id,
    action,
    entity_type,
    entity_id,
    purpose
  )
  VALUES (
    v_provider_id,
    v_session_id,
    'PROVIDER_LOGOUT',
    'system_provider_session',
    v_session_id,
    'Privileged provider session revocation'
  );

  RETURN jsonb_build_object('ok',true);
END
$function$;

-- --------------------------------------------------------------------------
-- 6. Explicit provider SchoolX authority.
-- --------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION system.provider_school_list()
RETURNS TABLE (
  id text,
  name text,
  code text,
  status text,
  row_version integer,
  delegate_status text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path=pg_catalog,system,sukuux
AS $function$
BEGIN
  IF system.provider_ctx_user_id() IS NULL THEN
    RAISE EXCEPTION 'Provider session required';
  END IF;

  RETURN QUERY
  SELECT
    s.id,
    s.name,
    s.code,
    s.status,
    s.row_version,
    (
      SELECT n.status
      FROM sukuux.school_delegate_nomination n
      WHERE n.school_id=s.id
      ORDER BY n.created_at DESC
      LIMIT 1
    ) AS delegate_status
  FROM sukuux.school_school s
  ORDER BY s.created_at DESC;
END
$function$;

CREATE OR REPLACE FUNCTION system.provider_school_create(
  p_name text,
  p_code text,
  p_school_type text,
  p_address text,
  p_city text,
  p_region text,
  p_country text,
  p_phone text,
  p_email text,
  p_ownership_type text
)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path=pg_catalog,system,sukuux
AS $function$
DECLARE
  v_provider_id text;
  v_session_id text;
  v_school_id text;
  v_correlation_id text;
BEGIN
  v_provider_id := system.provider_ctx_user_id();
  v_session_id := system.provider_ctx_session_id();

  IF v_provider_id IS NULL OR v_session_id IS NULL THEN
    RETURN jsonb_build_object('ok',false,'reason','Provider session required');
  END IF;

  IF length(trim(COALESCE(p_name,''))) < 2
     OR length(trim(COALESCE(p_code,''))) < 2
     OR length(trim(COALESCE(p_address,''))) < 2
     OR length(trim(COALESCE(p_city,''))) < 2
     OR length(trim(COALESCE(p_region,''))) < 2
     OR length(trim(COALESCE(p_country,''))) < 2 THEN
    RETURN jsonb_build_object('ok',false,'reason','Required institution fields are incomplete');
  END IF;

  IF upper(p_school_type) NOT IN ('BASIC','COMBINED','JHS','SHS','TERTIARY') THEN
    RETURN jsonb_build_object('ok',false,'reason','Unsupported school type');
  END IF;

  IF p_ownership_type IS NOT NULL
     AND upper(p_ownership_type) NOT IN ('PUBLIC','PRIVATE','MISSION','INTERNATIONAL','OTHER') THEN
    RETURN jsonb_build_object('ok',false,'reason','Unsupported ownership type');
  END IF;

  IF EXISTS (
    SELECT 1
    FROM sukuux.school_school
    WHERE lower(code)=lower(trim(p_code))
      AND archived_at IS NULL
  ) THEN
    RETURN jsonb_build_object('ok',false,'reason','Institution code already exists');
  END IF;

  v_school_id := gen_random_uuid()::text;
  v_correlation_id := gen_random_uuid()::text;

  INSERT INTO sukuux.school_school (
    id,
    name,
    code,
    school_type,
    address,
    city,
    region,
    country,
    phone,
    email,
    ownership_type,
    is_active,
    status,
    row_version,
    created_at,
    updated_at
  )
  VALUES (
    v_school_id,
    trim(p_name),
    upper(trim(p_code)),
    upper(p_school_type)::sukuux."SchoolSchoolType",
    trim(p_address),
    trim(p_city),
    trim(p_region),
    trim(p_country),
    NULLIF(trim(COALESCE(p_phone,'')),''),
    NULLIF(lower(trim(COALESCE(p_email,''))),''),
    CASE
      WHEN p_ownership_type IS NULL OR trim(p_ownership_type)=''
        THEN NULL
      ELSE upper(p_ownership_type)::sukuux."SchoolOwnershipType"
    END,
    false,
    'DRAFT',
    1,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  );

  INSERT INTO sukuux.school_lifecycle_transition (
    id,
    school_id,
    prior_state,
    new_state,
    action,
    actor_id,
    actor_role,
    reason,
    correlation_id,
    created_at
  )
  VALUES (
    gen_random_uuid()::text,
    v_school_id,
    'DRAFT',
    'DRAFT',
    'PROVIDER_CREATE',
    v_provider_id,
    'platform_admin',
    'Provider-controlled institution establishment',
    v_correlation_id,
    CURRENT_TIMESTAMP
  );

  INSERT INTO system.system_domain_event (
    id,
    aggregate_type,
    aggregate_id,
    event_type,
    occurred_at,
    recorded_at,
    producer,
    correlation_id,
    tenant_id,
    payload,
    status,
    attempt_count
  )
  VALUES (
    gen_random_uuid(),
    'School',
    v_school_id,
    'SchoolCreated',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    'sukuu-api',
    v_correlation_id,
    v_school_id,
    jsonb_build_object(
      'schoolId',v_school_id,
      'code',upper(trim(p_code)),
      'providerId',v_provider_id
    ),
    'PENDING',
    0
  );

  INSERT INTO system.system_provider_audit_event (
    provider_id,
    session_id,
    action,
    entity_type,
    entity_id,
    purpose,
    payload
  )
  VALUES (
    v_provider_id,
    v_session_id,
    'SCHOOL_CREATE',
    'school_school',
    v_school_id,
    'Provider-controlled institution establishment',
    jsonb_build_object('code',upper(trim(p_code)))
  );

  RETURN jsonb_build_object(
    'ok',true,
    'schoolId',v_school_id
  );
END
$function$;

CREATE OR REPLACE FUNCTION system.provider_school_nominate_delegate(
  p_school_id text,
  p_first_name text,
  p_last_name text,
  p_email text,
  p_phone text,
  p_invite_token_hash text,
  p_invite_expires_at timestamptz,
  p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path=pg_catalog,system,sukuux
AS $function$
DECLARE
  v_provider_id text;
  v_session_id text;
  v_nomination_id text;
BEGIN
  v_provider_id := system.provider_ctx_user_id();
  v_session_id := system.provider_ctx_session_id();

  IF v_provider_id IS NULL OR v_session_id IS NULL THEN
    RETURN jsonb_build_object('ok',false,'reason','Provider session required');
  END IF;

  IF length(trim(COALESCE(p_reason,''))) < 5 THEN
    RETURN jsonb_build_object('ok',false,'reason','Nomination reason is required');
  END IF;

  IF length(COALESCE(p_invite_token_hash,'')) <> 64
     OR p_invite_expires_at <= CURRENT_TIMESTAMP THEN
    RETURN jsonb_build_object('ok',false,'reason','Invitation material is invalid');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM sukuux.school_school
    WHERE id=p_school_id
      AND status IN ('DRAFT','UNDER_VERIFICATION')
      AND archived_at IS NULL
  ) THEN
    RETURN jsonb_build_object('ok',false,'reason','Institution is not eligible for initial delegate nomination');
  END IF;

  IF EXISTS (
    SELECT 1
    FROM system.system_user_role ur
    JOIN system.system_role r ON r.id=ur.role_id
    JOIN system.system_user u ON u.id=ur.user_id
    WHERE ur.school_id=p_school_id
      AND r.name='superadmin'
      AND r.archived_at IS NULL
      AND u.archived_at IS NULL
      AND u.status NOT IN ('CLOSED')
      AND (ur.expires_at IS NULL OR ur.expires_at > CURRENT_TIMESTAMP)
  ) THEN
    RETURN jsonb_build_object('ok',false,'reason','Institution already has a Tenant Superadmin');
  END IF;

  IF EXISTS (
    SELECT 1
    FROM sukuux.school_delegate_nomination
    WHERE school_id=p_school_id
      AND status IN ('NOMINATED','ACTIVATION_STARTED')
      AND revoked_at IS NULL
  ) THEN
    RETURN jsonb_build_object('ok',false,'reason','An active delegate nomination already exists');
  END IF;

  v_nomination_id := gen_random_uuid()::text;

  INSERT INTO sukuux.school_delegate_nomination (
    id,
    school_id,
    first_name,
    last_name,
    email,
    phone,
    status,
    nominated_by_provider_id,
    nomination_reason,
    invite_token_hash,
    invite_expires_at
  )
  VALUES (
    v_nomination_id,
    p_school_id,
    trim(p_first_name),
    trim(p_last_name),
    lower(trim(p_email)),
    NULLIF(trim(COALESCE(p_phone,'')),''),
    'NOMINATED',
    v_provider_id,
    trim(p_reason),
    p_invite_token_hash,
    LEAST(
      p_invite_expires_at,
      CURRENT_TIMESTAMP + interval '24 hours'
    )
  );

  INSERT INTO system.system_provider_audit_event (
    provider_id,
    session_id,
    action,
    entity_type,
    entity_id,
    purpose,
    payload
  )
  VALUES (
    v_provider_id,
    v_session_id,
    'TENANT_SUPERADMIN_NOMINATED',
    'school_delegate_nomination',
    v_nomination_id,
    trim(p_reason),
    jsonb_build_object(
      'schoolId',p_school_id,
      'email',lower(trim(p_email))
    )
  );

  RETURN jsonb_build_object(
    'ok',true,
    'nominationId',v_nomination_id
  );
END
$function$;

-- --------------------------------------------------------------------------
-- 7. Delegate self-activation: password + TOTP before role grant becomes live.
-- --------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION system.provider_delegate_accept_begin(
  p_token_hash text,
  p_secret_envelope text
)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path=pg_catalog,system,sukuux
AS $function$
DECLARE
  v_nomination sukuux.school_delegate_nomination%ROWTYPE;
BEGIN
  SELECT *
  INTO v_nomination
  FROM sukuux.school_delegate_nomination
  WHERE invite_token_hash=p_token_hash
    AND status IN ('NOMINATED','ACTIVATION_STARTED')
    AND revoked_at IS NULL
    AND invite_consumed_at IS NULL
    AND invite_expires_at > CURRENT_TIMESTAMP
    AND attempt_count < max_attempts
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND OR p_secret_envelope IS NULL THEN
    RETURN jsonb_build_object('ok',false,'reason','INVALID');
  END IF;

  UPDATE sukuux.school_delegate_nomination
  SET
    status='ACTIVATION_STARTED',
    pending_mfa_secret_envelope=p_secret_envelope,
    accept_started_at=CURRENT_TIMESTAMP
  WHERE id=v_nomination.id;

  RETURN jsonb_build_object(
    'ok',true,
    'schoolId',v_nomination.school_id,
    'email',v_nomination.email,
    'displayName',trim(v_nomination.first_name || ' ' || v_nomination.last_name)
  );
END
$function$;

CREATE OR REPLACE FUNCTION system.provider_delegate_accept_material(
  p_token_hash text
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path=pg_catalog,system,sukuux
AS $function$
DECLARE
  v_nomination sukuux.school_delegate_nomination%ROWTYPE;
BEGIN
  SELECT *
  INTO v_nomination
  FROM sukuux.school_delegate_nomination
  WHERE invite_token_hash=p_token_hash
    AND status='ACTIVATION_STARTED'
    AND revoked_at IS NULL
    AND invite_consumed_at IS NULL
    AND invite_expires_at > CURRENT_TIMESTAMP
    AND attempt_count < max_attempts
    AND pending_mfa_secret_envelope IS NOT NULL
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok',false,'reason','INVALID');
  END IF;

  RETURN jsonb_build_object(
    'ok',true,
    'schoolId',v_nomination.school_id,
    'email',v_nomination.email,
    'displayName',trim(v_nomination.first_name || ' ' || v_nomination.last_name),
    'secretEnvelope',v_nomination.pending_mfa_secret_envelope
  );
END
$function$;

CREATE OR REPLACE FUNCTION system.provider_delegate_accept_failure(
  p_token_hash text
)
RETURNS void
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path=pg_catalog,system,sukuux
AS $function$
BEGIN
  UPDATE sukuux.school_delegate_nomination
  SET
    attempt_count=attempt_count+1,
    revoked_at=CASE
      WHEN attempt_count+1 >= max_attempts
        THEN CURRENT_TIMESTAMP
      ELSE revoked_at
    END,
    status=CASE
      WHEN attempt_count+1 >= max_attempts
        THEN 'REVOKED'
      ELSE status
    END
  WHERE invite_token_hash=p_token_hash
    AND invite_consumed_at IS NULL
    AND revoked_at IS NULL;
END
$function$;

CREATE OR REPLACE FUNCTION system.provider_delegate_accept_complete(
  p_token_hash text,
  p_password_plain text,
  p_password_hash text,
  p_totp_counter bigint,
  p_proof text
)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path=pg_catalog,system,sukuux
AS $function$
DECLARE
  v_nomination sukuux.school_delegate_nomination%ROWTYPE;
  v_superadmin_role_id text;
  v_user_id text;
  v_expected text;
  v_mfa_secret text;
BEGIN
  SELECT *
  INTO v_nomination
  FROM sukuux.school_delegate_nomination
  WHERE invite_token_hash=p_token_hash
    AND status='ACTIVATION_STARTED'
    AND revoked_at IS NULL
    AND invite_consumed_at IS NULL
    AND invite_expires_at > CURRENT_TIMESTAMP
    AND attempt_count < max_attempts
    AND pending_mfa_secret_envelope IS NOT NULL
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok',false,'reason','INVALID');
  END IF;

  IF p_password_plain IS NULL
     OR length(p_password_plain) < 12
     OR p_password_plain !~ '[A-Z]'
     OR p_password_plain !~ '[a-z]'
     OR p_password_plain !~ '[0-9]'
     OR p_password_plain !~ '[^A-Za-z0-9]' THEN
    RETURN jsonb_build_object('ok',false,'reason','WEAK_PASSWORD');
  END IF;

  IF p_password_hash IS NULL
     OR length(p_password_hash) < 40
     OR p_totp_counter IS NULL
     OR p_proof IS NULL THEN
    RETURN jsonb_build_object('ok',false,'reason','INVALID');
  END IF;

  v_mfa_secret := system._mfa_proof_secret();
  v_expected := system._hmac_sha256_hex(
    'DELEGATE:' ||
      p_token_hash || ':' ||
      v_nomination.school_id || ':' ||
      p_totp_counter::text,
    v_mfa_secret
  );

  IF v_expected IS NULL OR v_expected <> p_proof THEN
    RETURN jsonb_build_object('ok',false,'reason','PROOF_INVALID');
  END IF;

  IF EXISTS (
    SELECT 1
    FROM system.system_user
    WHERE lower(email)=lower(v_nomination.email)
      AND archived_at IS NULL
  ) THEN
    RETURN jsonb_build_object('ok',false,'reason','LOGIN_ALREADY_EXISTS');
  END IF;

  IF EXISTS (
    SELECT 1
    FROM system.system_user_role ur
    JOIN system.system_role r ON r.id=ur.role_id
    JOIN system.system_user u ON u.id=ur.user_id
    WHERE ur.school_id=v_nomination.school_id
      AND r.name='superadmin'
      AND r.archived_at IS NULL
      AND u.archived_at IS NULL
      AND u.status NOT IN ('CLOSED')
      AND (ur.expires_at IS NULL OR ur.expires_at > CURRENT_TIMESTAMP)
  ) THEN
    RETURN jsonb_build_object('ok',false,'reason','SUPERADMIN_ALREADY_EXISTS');
  END IF;

  SELECT id
  INTO v_superadmin_role_id
  FROM system.system_role
  WHERE name='superadmin'
    AND archived_at IS NULL
  LIMIT 1;

  IF v_superadmin_role_id IS NULL THEN
    RETURN jsonb_build_object('ok',false,'reason','SUPERADMIN_ROLE_MISSING');
  END IF;

  v_user_id := gen_random_uuid()::text;

  INSERT INTO system.system_user (
    id,
    email,
    phone,
    password_hash,
    is_active,
    is_verified,
    last_login_at,
    failed_login_count,
    locked_until,
    must_reset_password,
    status,
    row_version,
    created_at,
    updated_at,
    archived_at
  )
  VALUES (
    v_user_id,
    lower(v_nomination.email),
    v_nomination.phone,
    p_password_hash,
    true,
    true,
    NULL,
    0,
    NULL,
    false,
    'ACTIVE',
    1,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    NULL
  );

  INSERT INTO system.system_user_role (
    id,
    user_id,
    role_id,
    school_id,
    assigned_at,
    assigned_by,
    expires_at
  )
  VALUES (
    gen_random_uuid()::text,
    v_user_id,
    v_superadmin_role_id,
    v_nomination.school_id,
    CURRENT_TIMESTAMP,
    v_nomination.nominated_by_provider_id,
    NULL
  );

  INSERT INTO system.system_mfa (
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
  VALUES (
    gen_random_uuid()::text,
    v_user_id,
    'TOTP'::sukuux."MfaMethod",
    v_nomination.pending_mfa_secret_envelope,
    true,
    '[]',
    CURRENT_TIMESTAMP,
    0,
    NULL,
    p_totp_counter,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  );

  UPDATE sukuux.school_delegate_nomination
  SET
    status='ACTIVATED',
    invite_consumed_at=CURRENT_TIMESTAMP,
    pending_mfa_secret_envelope=NULL,
    activated_user_id=v_user_id,
    activated_at=CURRENT_TIMESTAMP
  WHERE id=v_nomination.id;

  INSERT INTO system.system_audit_event (
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
  VALUES (
    gen_random_uuid()::text,
    NULL,
    v_nomination.school_id,
    'INITIAL_TENANT_SUPERADMIN_ACTIVATED',
    'system_user',
    v_user_id,
    'APPROVED_NOMINATION',
    'ACTIVE_WITH_TOTP',
    CURRENT_TIMESTAMP
  );

  INSERT INTO system.system_provider_audit_event (
    provider_id,
    action,
    entity_type,
    entity_id,
    purpose,
    payload
  )
  VALUES (
    v_nomination.nominated_by_provider_id,
    'TENANT_SUPERADMIN_HANDOFF_COMPLETED',
    'school_delegate_nomination',
    v_nomination.id,
    v_nomination.nomination_reason,
    jsonb_build_object(
      'schoolId',v_nomination.school_id,
      'userId',v_user_id,
      'email',v_nomination.email
    )
  );

  INSERT INTO system.system_domain_event (
    id,
    aggregate_type,
    aggregate_id,
    event_type,
    occurred_at,
    recorded_at,
    producer,
    correlation_id,
    tenant_id,
    payload,
    status,
    attempt_count
  )
  VALUES (
    gen_random_uuid(),
    'School',
    v_nomination.school_id,
    'TenantSuperadminActivated',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    'sukuu-api',
    gen_random_uuid()::text,
    v_nomination.school_id,
    jsonb_build_object(
      'schoolId',v_nomination.school_id,
      'userId',v_user_id,
      'nominatedByProviderId',v_nomination.nominated_by_provider_id
    ),
    'PENDING',
    0
  );

  RETURN jsonb_build_object(
    'ok',true,
    'userId',v_user_id,
    'schoolId',v_nomination.school_id
  );
END
$function$;

-- --------------------------------------------------------------------------
-- 8. Provider verification/activation. Requires operational delegate first.
-- --------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION system.provider_school_approve(
  p_school_id text,
  p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path=pg_catalog,system,sukuux
AS $function$
DECLARE
  v_provider_id text;
  v_session_id text;
  v_school sukuux.school_school%ROWTYPE;
  v_submission sukuux.school_lifecycle_transition%ROWTYPE;
  v_correlation_id text;
BEGIN
  v_provider_id := system.provider_ctx_user_id();
  v_session_id := system.provider_ctx_session_id();

  IF v_provider_id IS NULL OR v_session_id IS NULL THEN
    RETURN jsonb_build_object('ok',false,'reason','Provider session required');
  END IF;

  IF length(trim(COALESCE(p_reason,''))) < 5 THEN
    RETURN jsonb_build_object('ok',false,'reason','Verification reason is required');
  END IF;

  SELECT *
  INTO v_school
  FROM sukuux.school_school
  WHERE id=p_school_id
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND OR v_school.status <> 'UNDER_VERIFICATION' THEN
    RETURN jsonb_build_object('ok',false,'reason','Institution must be UNDER_VERIFICATION');
  END IF;

  SELECT *
  INTO v_submission
  FROM sukuux.school_lifecycle_transition
  WHERE school_id=p_school_id
    AND new_state='UNDER_VERIFICATION'
  ORDER BY created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok',false,'reason','Verification submission evidence is missing');
  END IF;

  IF v_submission.actor_id=v_provider_id THEN
    RETURN jsonb_build_object('ok',false,'reason','Maker-checker violation');
  END IF;

  IF (
    SELECT count(*)::integer
    FROM system.system_user_role ur
    JOIN system.system_role r ON r.id=ur.role_id
    JOIN system.system_user u ON u.id=ur.user_id
    JOIN system.system_mfa m
      ON m.user_id=u.id
      AND m.method='TOTP'::sukuux."MfaMethod"
    WHERE ur.school_id=p_school_id
      AND r.name='superadmin'
      AND r.archived_at IS NULL
      AND u.archived_at IS NULL
      AND u.status='ACTIVE'
      AND u.is_active=true
      AND m.is_enabled=true
      AND m.verified_at IS NOT NULL
      AND m.secret IS NOT NULL
      AND (ur.expires_at IS NULL OR ur.expires_at > CURRENT_TIMESTAMP)
  ) <> 1 THEN
    RETURN jsonb_build_object(
      'ok',false,
      'reason','Exactly one operational Tenant Superadmin with MFA is required before go-live approval'
    );
  END IF;

  v_correlation_id := gen_random_uuid()::text;

  UPDATE sukuux.school_school
  SET
    status='ACTIVE',
    is_active=true,
    row_version=row_version+1,
    verified_at=CURRENT_TIMESTAMP,
    verified_by=v_provider_id,
    activated_at=CURRENT_TIMESTAMP,
    suspended_at=NULL,
    updated_at=CURRENT_TIMESTAMP
  WHERE id=p_school_id;

  INSERT INTO sukuux.school_lifecycle_transition (
    id,
    school_id,
    prior_state,
    new_state,
    action,
    actor_id,
    actor_role,
    reason,
    correlation_id,
    created_at
  )
  VALUES (
    gen_random_uuid()::text,
    p_school_id,
    'UNDER_VERIFICATION',
    'ACTIVE',
    'PROVIDER_VERIFY_APPROVE',
    v_provider_id,
    'platform_admin',
    trim(p_reason),
    v_correlation_id,
    CURRENT_TIMESTAMP
  );

  INSERT INTO sukuux.school_audit_log (
    id,
    school_id,
    action,
    performed_by,
    created_at
  )
  VALUES (
    gen_random_uuid()::text,
    p_school_id,
    'LIFECYCLE UNDER_VERIFICATION -> ACTIVE: ' || trim(p_reason),
    v_provider_id,
    CURRENT_TIMESTAMP
  );

  INSERT INTO system.system_audit_event (
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
  VALUES (
    gen_random_uuid()::text,
    NULL,
    p_school_id,
    'SCHOOL_LIFECYCLE:UNDER_VERIFICATION->ACTIVE',
    'school_school',
    p_school_id,
    'UNDER_VERIFICATION',
    'ACTIVE',
    CURRENT_TIMESTAMP
  );

  INSERT INTO system.system_domain_event (
    id,
    aggregate_type,
    aggregate_id,
    event_type,
    occurred_at,
    recorded_at,
    producer,
    correlation_id,
    tenant_id,
    payload,
    status,
    attempt_count
  )
  VALUES (
    gen_random_uuid(),
    'School',
    p_school_id,
    'SchoolVerified',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    'sukuu-api',
    v_correlation_id,
    p_school_id,
    jsonb_build_object(
      'priorState','UNDER_VERIFICATION',
      'newState','ACTIVE',
      'reason',trim(p_reason),
      'providerId',v_provider_id
    ),
    'PENDING',
    0
  );

  INSERT INTO system.system_provider_audit_event (
    provider_id,
    session_id,
    action,
    entity_type,
    entity_id,
    purpose,
    payload
  )
  VALUES (
    v_provider_id,
    v_session_id,
    'SCHOOL_VERIFY_APPROVE',
    'school_school',
    p_school_id,
    trim(p_reason),
    jsonb_build_object(
      'priorState','UNDER_VERIFICATION',
      'newState','ACTIVE'
    )
  );

  RETURN jsonb_build_object(
    'ok',true,
    'schoolId',p_school_id
  );
END
$function$;

-- --------------------------------------------------------------------------
-- 9. Revoke public execution and grant only reviewed API runtime functions.
-- --------------------------------------------------------------------------

DO $function_grants$
DECLARE
  v_signature text;
  v_functions text[] := ARRAY[
    'system._provider_context_proof_valid()',
    'system.provider_ctx_user_id()',
    'system.provider_ctx_session_id()',
    'system.provider_bootstrap_material(text,text)',
    'system.provider_registration_challenge_begin(text,text,text,timestamp with time zone)',
    'system.provider_registration_material(text,text,text)',
    'system.provider_registration_complete(text,text,text,text,bytea,bigint,text,text,boolean,text,text,text)',
    'system.provider_auth_material(text)',
    'system.provider_auth_challenge_begin(text,text,timestamp with time zone)',
    'system.provider_auth_verify_material(text,text,text)',
    'system.provider_auth_complete(text,text,text,bigint,text,text,text)',
    'system.provider_auth_session_lookup(text,text)',
    'system.provider_session_revoke()',
    'system.provider_school_list()',
    'system.provider_school_create(text,text,text,text,text,text,text,text,text,text)',
    'system.provider_school_nominate_delegate(text,text,text,text,text,text,timestamp with time zone,text)',
    'system.provider_delegate_accept_begin(text,text)',
    'system.provider_delegate_accept_material(text)',
    'system.provider_delegate_accept_failure(text)',
    'system.provider_delegate_accept_complete(text,text,text,bigint,text)',
    'system.provider_school_approve(text,text)'
  ];
BEGIN
  FOREACH v_signature IN ARRAY v_functions LOOP
    EXECUTE format(
      'REVOKE ALL ON FUNCTION %s FROM PUBLIC',
      v_signature
    );
    EXECUTE format(
      'GRANT EXECUTE ON FUNCTION %s TO sukuu_app_runtime',
      v_signature
    );
  END LOOP;
END
$function_grants$;

-- --------------------------------------------------------------------------
-- 10. Postconditions.
-- --------------------------------------------------------------------------

DO $postcheck$
DECLARE
  v_rls integer;
  v_force integer;
  v_policies integer;
  v_platform_grants integer;
BEGIN
  SELECT
    count(*) FILTER (WHERE c.relrowsecurity)::integer,
    count(*) FILTER (WHERE c.relforcerowsecurity)::integer
  INTO v_rls, v_force
  FROM pg_catalog.pg_class c
  JOIN pg_catalog.pg_namespace n
    ON n.oid=c.relnamespace
  WHERE (n.nspname,c.relname) IN (
    ('system','system_provider_identity'),
    ('system','system_provider_authenticator'),
    ('system','system_provider_challenge'),
    ('system','system_provider_session'),
    ('system','system_provider_audit_event'),
    ('sukuux','school_delegate_nomination')
  );

  IF v_rls <> 6 OR v_force <> 6 THEN
    RAISE EXCEPTION
      'SX-2B postcheck: expected 6/6 provider/delegate tables under RLS + FORCE RLS';
  END IF;

  SELECT count(*)::integer
  INTO v_policies
  FROM pg_catalog.pg_policies
  WHERE (schemaname,tablename) IN (
    ('system','system_provider_identity'),
    ('system','system_provider_authenticator'),
    ('system','system_provider_challenge'),
    ('system','system_provider_session'),
    ('system','system_provider_audit_event'),
    ('sukuux','school_delegate_nomination')
  );

  IF v_policies <> 0 THEN
    RAISE EXCEPTION
      'SX-2B postcheck: provider/delegate tables must have zero ordinary RLS policies';
  END IF;

  SELECT count(*)::integer
  INTO v_platform_grants
  FROM system.system_user_role ur
  JOIN system.system_role r ON r.id=ur.role_id
  WHERE r.name='platform_admin'
    AND r.archived_at IS NULL;

  IF v_platform_grants <> 0 THEN
    RAISE EXCEPTION
      'SX-2B postcheck: provider authority was incorrectly attached to a tenant';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM system.system_provider_identity
    WHERE login_name='platform-owner'
      AND status='PENDING_ENROLLMENT'
  ) THEN
    RAISE EXCEPTION
      'SX-2B postcheck: pending provider bootstrap identity missing';
  END IF;
END
$postcheck$;

COMMIT;
