BEGIN;

-- Superadmin name capture. system_user has never had a name column;
-- Superadmin (activated via provider_delegate_accept_complete) has no
-- staff_staff record either, so their name -- captured in the original
-- school_delegate_nomination -- was simply never persisted anywhere
-- queryable once activated. This fixes capture going forward AND
-- backfills every already-activated Superadmin from their retained
-- nomination record.

DO $preflight$
BEGIN
  IF to_regclass('system.system_user') IS NULL
     OR to_regclass('sukuux.school_delegate_nomination') IS NULL THEN
    RAISE EXCEPTION 'Superadmin name capture migration aborted: required tables are missing';
  END IF;
END
$preflight$;

ALTER TABLE system.system_user
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text;

-- Backfill: every already-activated Superadmin gets their name restored
-- from the nomination record that originally named them.
UPDATE system.system_user u
SET first_name = n.first_name,
    last_name = n.last_name
FROM sukuux.school_delegate_nomination n
WHERE n.activated_user_id = u.id
  AND u.first_name IS NULL;

-- Capture first_name/last_name going forward. Identical to the existing
-- function in every other respect -- same signature, same checks, same
-- side effects -- only the system_user INSERT gains two columns.
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
    first_name,
    last_name,
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
    v_nomination.first_name,
    v_nomination.last_name,
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

COMMIT;
