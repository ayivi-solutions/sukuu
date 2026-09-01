BEGIN;

-- Break-glass Platform Owner credential recovery.
-- A locked-out provider requests reset by login_name (generic response,
-- no enumeration). Requires two DISTINCT other Platform Owners to
-- approve before a fresh bootstrap token is issued, reusing the
-- existing, tested provider_bootstrap_material()/registration flow
-- unchanged. A single rejection kills the request.

DO $preflight$
BEGIN
  IF to_regclass('system.system_provider_identity') IS NULL
     OR to_regclass('system.system_provider_authenticator') IS NULL THEN
    RAISE EXCEPTION 'Provider credential reset migration aborted: provider identity foundation is missing';
  END IF;

  IF to_regclass('system.system_provider_credential_reset_request') IS NOT NULL THEN
    RAISE EXCEPTION 'Provider credential reset migration aborted: tables already exist';
  END IF;
END
$preflight$;

CREATE TABLE system.system_provider_credential_reset_request (
  id            text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  provider_id   text NOT NULL,
  status        text NOT NULL DEFAULT 'PENDING',
  reason        text,
  created_at    timestamptz(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at    timestamptz(6) NOT NULL,
  resolved_at   timestamptz(6)
);

CREATE INDEX idx_provider_cred_reset_request_provider
  ON system.system_provider_credential_reset_request (provider_id, status);

CREATE TABLE system.system_provider_credential_reset_approval (
  id                    text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  request_id            text NOT NULL,
  approver_provider_id  text NOT NULL,
  decision              text NOT NULL,
  reason                text,
  created_at            timestamptz(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX uq_provider_cred_reset_approval_once
  ON system.system_provider_credential_reset_approval (request_id, approver_provider_id);

DO $rls$
DECLARE
  v_schema text;
  v_table text;
  v_tables text[][] := ARRAY[
    ARRAY['system','system_provider_credential_reset_request'],
    ARRAY['system','system_provider_credential_reset_approval']
  ];
  v_item text[];
BEGIN
  FOREACH v_item SLICE 1 IN ARRAY v_tables LOOP
    v_schema := v_item[1];
    v_table := v_item[2];

    EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', v_schema, v_table);
    EXECUTE format('ALTER TABLE %I.%I FORCE ROW LEVEL SECURITY', v_schema, v_table);
    EXECUTE format('REVOKE ALL ON TABLE %I.%I FROM PUBLIC', v_schema, v_table);
    EXECUTE format('REVOKE ALL ON TABLE %I.%I FROM sukuu_app_runtime', v_schema, v_table);
  END LOOP;
END
$rls$;

-- Request reset by login_name. Always returns {ok:true} regardless of
-- whether a matching ACTIVE provider was found, to avoid enumeration.
CREATE OR REPLACE FUNCTION system.provider_credential_reset_request(
  p_login_name text,
  p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path=pg_catalog,system
AS $function$
DECLARE
  v_provider system.system_provider_identity%ROWTYPE;
  v_request_id text;
BEGIN
  SELECT * INTO v_provider
  FROM system.system_provider_identity
  WHERE lower(login_name)=lower(p_login_name)
    AND status='ACTIVE'
  LIMIT 1;

  IF FOUND THEN
    UPDATE system.system_provider_credential_reset_request
    SET status='EXPIRED', resolved_at=CURRENT_TIMESTAMP
    WHERE provider_id=v_provider.id
      AND status='PENDING';

    INSERT INTO system.system_provider_credential_reset_request (
      provider_id, reason, expires_at
    ) VALUES (
      v_provider.id, p_reason, CURRENT_TIMESTAMP + interval '72 hours'
    ) RETURNING id INTO v_request_id;

    INSERT INTO system.system_provider_audit_event (
      provider_id, action, entity_type, entity_id, purpose, payload
    ) VALUES (
      v_provider.id, 'CREDENTIAL_RESET_REQUESTED', 'system_provider_credential_reset_request',
      v_request_id, 'break-glass provider recovery',
      jsonb_build_object('reason', p_reason)
    );
  END IF;

  -- Generic response regardless of whether a matching provider existed.
  RETURN jsonb_build_object('ok', true);
END;
$function$;

-- List requests pending this approver's decision, excluding their own.
CREATE OR REPLACE FUNCTION system.provider_credential_reset_pending_for_approver(
  p_approver_provider_id text
)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path=pg_catalog,system
AS $function$
DECLARE
  v_rows jsonb;
BEGIN
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'requestId', r.id,
    'loginName', p.login_name,
    'displayName', p.display_name,
    'reason', r.reason,
    'createdAt', r.created_at,
    'expiresAt', r.expires_at,
    'approvalCount', (
      SELECT count(*) FROM system.system_provider_credential_reset_approval a
      WHERE a.request_id=r.id AND a.decision='APPROVE'
    )
  )), '[]'::jsonb)
  INTO v_rows
  FROM system.system_provider_credential_reset_request r
  JOIN system.system_provider_identity p ON p.id=r.provider_id
  WHERE r.status='PENDING'
    AND r.expires_at > CURRENT_TIMESTAMP
    AND r.provider_id <> p_approver_provider_id
    AND NOT EXISTS (
      SELECT 1 FROM system.system_provider_credential_reset_approval a
      WHERE a.request_id=r.id AND a.approver_provider_id=p_approver_provider_id
    );

  RETURN jsonb_build_object('ok', true, 'requests', v_rows);
END;
$function$;

-- Record one approve/reject decision. On the second DISTINCT approval,
-- finalize: revoke existing authenticators, reset status to
-- PENDING_ENROLLMENT, and install the new bootstrap token supplied by
-- the caller (generated application-side so the raw value is never
-- persisted, only its hash).
CREATE OR REPLACE FUNCTION system.provider_credential_reset_decide(
  p_request_id text,
  p_approver_provider_id text,
  p_decision text,
  p_reason text,
  p_new_bootstrap_token_hash text,
  p_new_bootstrap_expires_at timestamptz
)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path=pg_catalog,system
AS $function$
DECLARE
  v_request system.system_provider_credential_reset_request%ROWTYPE;
  v_approve_count int;
BEGIN
  IF p_decision NOT IN ('APPROVE','REJECT') THEN
    RETURN jsonb_build_object('ok',false,'reason','INVALID_DECISION');
  END IF;

  SELECT * INTO v_request
  FROM system.system_provider_credential_reset_request
  WHERE id=p_request_id
    AND status='PENDING'
    AND expires_at > CURRENT_TIMESTAMP
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok',false,'reason','NOT_PENDING');
  END IF;

  IF v_request.provider_id = p_approver_provider_id THEN
    RETURN jsonb_build_object('ok',false,'reason','CANNOT_APPROVE_OWN_REQUEST');
  END IF;

  IF EXISTS (
    SELECT 1 FROM system.system_provider_credential_reset_approval
    WHERE request_id=p_request_id AND approver_provider_id=p_approver_provider_id
  ) THEN
    RETURN jsonb_build_object('ok',false,'reason','ALREADY_DECIDED');
  END IF;

  INSERT INTO system.system_provider_credential_reset_approval (
    request_id, approver_provider_id, decision, reason
  ) VALUES (
    p_request_id, p_approver_provider_id, p_decision, p_reason
  );

  INSERT INTO system.system_provider_audit_event (
    provider_id, action, entity_type, entity_id, purpose, payload
  ) VALUES (
    p_approver_provider_id, 'CREDENTIAL_RESET_' || p_decision, 'system_provider_credential_reset_request',
    p_request_id, 'break-glass provider recovery decision',
    jsonb_build_object('reason', p_reason)
  );

  IF p_decision = 'REJECT' THEN
    UPDATE system.system_provider_credential_reset_request
    SET status='REJECTED', resolved_at=CURRENT_TIMESTAMP
    WHERE id=p_request_id;

    RETURN jsonb_build_object('ok',true,'finalized',true,'outcome','REJECTED');
  END IF;

  SELECT count(*) INTO v_approve_count
  FROM system.system_provider_credential_reset_approval
  WHERE request_id=p_request_id AND decision='APPROVE';

  IF v_approve_count < 2 THEN
    RETURN jsonb_build_object('ok',true,'finalized',false,'approvalCount',v_approve_count);
  END IF;

  UPDATE system.system_provider_authenticator
  SET revoked_at=CURRENT_TIMESTAMP
  WHERE provider_id=v_request.provider_id
    AND revoked_at IS NULL;

  UPDATE system.system_provider_identity
  SET status='PENDING_ENROLLMENT',
      bootstrap_token_hash=p_new_bootstrap_token_hash,
      bootstrap_expires_at=p_new_bootstrap_expires_at,
      bootstrap_used_at=NULL,
      row_version=row_version+1
  WHERE id=v_request.provider_id;

  UPDATE system.system_provider_session
  SET is_active=false, invalidated_at=CURRENT_TIMESTAMP
  WHERE provider_id=v_request.provider_id
    AND is_active=true;

  UPDATE system.system_provider_credential_reset_request
  SET status='APPROVED', resolved_at=CURRENT_TIMESTAMP
  WHERE id=p_request_id;

  INSERT INTO system.system_provider_audit_event (
    provider_id, action, entity_type, entity_id, purpose, payload
  ) VALUES (
    v_request.provider_id, 'CREDENTIAL_RESET_FINALIZED', 'system_provider_identity',
    v_request.provider_id, 'break-glass provider recovery finalized',
    jsonb_build_object('requestId', p_request_id)
  );

  RETURN jsonb_build_object(
    'ok', true, 'finalized', true, 'outcome', 'APPROVED',
    'providerId', v_request.provider_id
  );
END;
$function$;

COMMIT;
