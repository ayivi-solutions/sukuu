BEGIN;

-- SCHOOLX SX-3: canonical capability completion.
-- SchoolX owns departments, typed institution configuration, institutional
-- holidays and readiness coordination. AcademicX remains source authority for
-- academic years and terms. Existing ACTIVE schools are not retroactively changed.

DO $preflight$
BEGIN
  IF to_regclass('sukuux.school_department') IS NULL
     OR to_regclass('sukuux.school_holiday') IS NULL
     OR to_regclass('sukuux.school_timezone') IS NULL
     OR to_regclass('sukuux.school_currency') IS NULL
     OR to_regclass('sukuux.school_onboarding') IS NULL
     OR to_regclass('sukuux.school_calendar') IS NULL
     OR to_regclass('sukuux.academics_academic_year') IS NULL
     OR to_regclass('sukuux.academics_term') IS NULL THEN
    RAISE EXCEPTION 'SX-3 aborted: required canonical tables are missing';
  END IF;

  IF to_regprocedure('system.ctx_school_id()') IS NULL
     OR to_regprocedure('system.provider_school_approve(text,text)') IS NULL THEN
    RAISE EXCEPTION 'SX-3 aborted: trusted context/provider approval foundation is missing';
  END IF;

  IF EXISTS (
    SELECT 1 FROM sukuux.school_department
    GROUP BY school_id, lower(code) HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'SX-3 aborted: duplicate department codes require reconciliation';
  END IF;

  IF EXISTS (
    SELECT 1 FROM sukuux.school_timezone
    GROUP BY school_id HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'SX-3 aborted: multiple timezone rows exist for a school';
  END IF;

  IF EXISTS (
    SELECT 1 FROM sukuux.school_currency
    GROUP BY school_id HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'SX-3 aborted: multiple currency rows exist for a school';
  END IF;

  IF EXISTS (
    SELECT 1 FROM sukuux.school_onboarding
    GROUP BY school_id, step HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'SX-3 aborted: duplicate onboarding steps exist for a school';
  END IF;

  IF EXISTS (
    SELECT 1 FROM sukuux.school_campus
    WHERE is_primary=true AND is_active=true
    GROUP BY school_id HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'SX-3 aborted: multiple active primary campuses exist for a school';
  END IF;
END
$preflight$;

ALTER TABLE sukuux.school_department
  ADD COLUMN IF NOT EXISTS row_version integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS changed_reason text,
  ADD COLUMN IF NOT EXISTS created_at timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS archived_at timestamp(3);

ALTER TABLE sukuux.school_holiday
  ADD COLUMN IF NOT EXISTS row_version integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS changed_reason text,
  ADD COLUMN IF NOT EXISTS created_at timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS archived_at timestamp(3);

ALTER TABLE sukuux.school_timezone
  ADD COLUMN IF NOT EXISTS row_version integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS updated_by text,
  ADD COLUMN IF NOT EXISTS effective_from timestamp(3),
  ADD COLUMN IF NOT EXISTS effective_to timestamp(3),
  ADD COLUMN IF NOT EXISTS changed_reason text,
  ADD COLUMN IF NOT EXISTS created_at timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS archived_at timestamp(3);

ALTER TABLE sukuux.school_currency
  ADD COLUMN IF NOT EXISTS row_version integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS updated_by text,
  ADD COLUMN IF NOT EXISTS effective_from timestamp(3),
  ADD COLUMN IF NOT EXISTS effective_to timestamp(3),
  ADD COLUMN IF NOT EXISTS changed_reason text,
  ADD COLUMN IF NOT EXISTS created_at timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS archived_at timestamp(3);

ALTER TABLE sukuux.school_onboarding
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS source_domain text NOT NULL DEFAULT 'SCHOOLX',
  ADD COLUMN IF NOT EXISTS owner_user_id text,
  ADD COLUMN IF NOT EXISTS exception_reason text,
  ADD COLUMN IF NOT EXISTS evidence_reference text,
  ADD COLUMN IF NOT EXISTS row_version integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS changed_reason text,
  ADD COLUMN IF NOT EXISTS updated_at timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS archived_at timestamp(3);

ALTER TABLE sukuux.school_onboarding DROP CONSTRAINT IF EXISTS school_onboarding_status_check;
ALTER TABLE sukuux.school_onboarding
  ADD CONSTRAINT school_onboarding_status_check
  CHECK (status IN ('PENDING','IN_REVIEW','BLOCKED','RESOLVED'));

ALTER TABLE sukuux.school_currency DROP CONSTRAINT IF EXISTS school_currency_code_check;
ALTER TABLE sukuux.school_currency
  ADD CONSTRAINT school_currency_code_check CHECK (currency_code ~ '^[A-Z]{3}$');

ALTER TABLE sukuux.school_currency DROP CONSTRAINT IF EXISTS school_currency_decimal_places_check;
ALTER TABLE sukuux.school_currency
  ADD CONSTRAINT school_currency_decimal_places_check CHECK (decimal_places BETWEEN 0 AND 4);

CREATE UNIQUE INDEX IF NOT EXISTS uq_school_department_school_code_active
  ON sukuux.school_department (school_id, lower(code))
  WHERE archived_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_school_timezone_school_active
  ON sukuux.school_timezone (school_id)
  WHERE archived_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_school_currency_school_active
  ON sukuux.school_currency (school_id)
  WHERE archived_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_school_onboarding_school_step_active
  ON sukuux.school_onboarding (school_id, step)
  WHERE archived_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_school_campus_primary_active
  ON sukuux.school_campus (school_id)
  WHERE is_primary=true AND is_active=true;

ALTER TABLE sukuux.school_department ENABLE ROW LEVEL SECURITY;
ALTER TABLE sukuux.school_department FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS schoolx_department_tenant ON sukuux.school_department;
CREATE POLICY schoolx_department_tenant ON sukuux.school_department
  USING (school_id=system.ctx_school_id())
  WITH CHECK (school_id=system.ctx_school_id());

ALTER TABLE sukuux.school_holiday ENABLE ROW LEVEL SECURITY;
ALTER TABLE sukuux.school_holiday FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS schoolx_holiday_tenant ON sukuux.school_holiday;
CREATE POLICY schoolx_holiday_tenant ON sukuux.school_holiday
  USING (school_id=system.ctx_school_id())
  WITH CHECK (school_id=system.ctx_school_id());

ALTER TABLE sukuux.school_timezone ENABLE ROW LEVEL SECURITY;
ALTER TABLE sukuux.school_timezone FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS schoolx_timezone_tenant ON sukuux.school_timezone;
CREATE POLICY schoolx_timezone_tenant ON sukuux.school_timezone
  USING (school_id=system.ctx_school_id())
  WITH CHECK (school_id=system.ctx_school_id());

ALTER TABLE sukuux.school_currency ENABLE ROW LEVEL SECURITY;
ALTER TABLE sukuux.school_currency FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS schoolx_currency_tenant ON sukuux.school_currency;
CREATE POLICY schoolx_currency_tenant ON sukuux.school_currency
  USING (school_id=system.ctx_school_id())
  WITH CHECK (school_id=system.ctx_school_id());

ALTER TABLE sukuux.school_onboarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE sukuux.school_onboarding FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS schoolx_onboarding_tenant ON sukuux.school_onboarding;
CREATE POLICY schoolx_onboarding_tenant ON sukuux.school_onboarding
  USING (school_id=system.ctx_school_id())
  WITH CHECK (school_id=system.ctx_school_id());

ALTER TABLE sukuux.school_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE sukuux.school_calendar FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS schoolx_calendar_tenant ON sukuux.school_calendar;
CREATE POLICY schoolx_calendar_tenant ON sukuux.school_calendar
  FOR SELECT USING (school_id=system.ctx_school_id());

DO $runtime_grants$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname='sukuu_app_runtime') THEN
    EXECUTE 'GRANT SELECT, INSERT, UPDATE ON TABLE sukuux.school_department TO sukuu_app_runtime';
    EXECUTE 'GRANT SELECT, INSERT, UPDATE ON TABLE sukuux.school_holiday TO sukuu_app_runtime';
    EXECUTE 'GRANT SELECT, INSERT, UPDATE ON TABLE sukuux.school_timezone TO sukuu_app_runtime';
    EXECUTE 'GRANT SELECT, INSERT, UPDATE ON TABLE sukuux.school_currency TO sukuu_app_runtime';
    EXECUTE 'GRANT SELECT, INSERT, UPDATE ON TABLE sukuux.school_onboarding TO sukuu_app_runtime';
    EXECUTE 'GRANT SELECT ON TABLE sukuux.school_calendar TO sukuu_app_runtime';
    EXECUTE 'REVOKE INSERT, UPDATE, DELETE ON TABLE sukuux.school_settings FROM sukuu_app_runtime';
    EXECUTE 'REVOKE INSERT, UPDATE, DELETE ON TABLE sukuux.school_configuration FROM sukuu_app_runtime';
  END IF;
END
$runtime_grants$;

CREATE OR REPLACE FUNCTION system._schoolx_activation_readiness(p_school_id text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path=pg_catalog,system,sukuux
AS $function$
DECLARE
  v_school sukuux.school_school%ROWTYPE;
  v_profile boolean := false;
  v_primary boolean := false;
  v_timezone boolean := false;
  v_currency boolean := false;
BEGIN
  SELECT * INTO v_school
    FROM sukuux.school_school
   WHERE id=p_school_id
   LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ready',false,'reason','SCHOOL_NOT_FOUND');
  END IF;

  v_profile :=
    length(trim(COALESCE(v_school.name,''))) > 0 AND
    length(trim(COALESCE(v_school.code,''))) > 0 AND
    length(trim(COALESCE(v_school.address,''))) > 0 AND
    length(trim(COALESCE(v_school.city,''))) > 0 AND
    length(trim(COALESCE(v_school.region,''))) > 0 AND
    length(trim(COALESCE(v_school.country,''))) > 0;

  SELECT count(*)=1 INTO v_primary
    FROM sukuux.school_campus
   WHERE school_id=p_school_id AND is_primary=true AND is_active=true;

  SELECT count(*)=1 INTO v_timezone
    FROM sukuux.school_timezone
   WHERE school_id=p_school_id AND archived_at IS NULL;

  SELECT count(*)=1 INTO v_currency
    FROM sukuux.school_currency
   WHERE school_id=p_school_id AND archived_at IS NULL;

  RETURN jsonb_build_object(
    'ready', v_profile AND v_primary AND v_timezone AND v_currency,
    'checks', jsonb_build_object(
      'institutionProfile',v_profile,
      'primaryCampus',v_primary,
      'timezone',v_timezone,
      'currency',v_currency
    )
  );
END
$function$;

REVOKE ALL ON FUNCTION system._schoolx_activation_readiness(text) FROM PUBLIC;

-- Extend the accepted SX-2B approval with the SchoolX-owned readiness gate only.
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
  v_readiness jsonb;
BEGIN
  v_provider_id := system.provider_ctx_user_id();
  v_session_id := system.provider_ctx_session_id();

  IF v_provider_id IS NULL OR v_session_id IS NULL THEN
    RETURN jsonb_build_object('ok',false,'reason','Provider session required');
  END IF;

  IF length(trim(COALESCE(p_reason,''))) < 5 THEN
    RETURN jsonb_build_object('ok',false,'reason','Verification reason is required');
  END IF;

  SELECT * INTO v_school
    FROM sukuux.school_school
   WHERE id=p_school_id
   LIMIT 1
   FOR UPDATE;

  IF NOT FOUND OR v_school.status <> 'UNDER_VERIFICATION' THEN
    RETURN jsonb_build_object('ok',false,'reason','Institution must be UNDER_VERIFICATION');
  END IF;

  SELECT * INTO v_submission
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

  v_readiness := system._schoolx_activation_readiness(p_school_id);
  IF COALESCE((v_readiness->>'ready')::boolean,false) IS NOT TRUE THEN
    RETURN jsonb_build_object(
      'ok',false,
      'reason','SchoolX activation readiness is incomplete',
      'readiness',v_readiness
    );
  END IF;

  v_correlation_id := gen_random_uuid()::text;

  UPDATE sukuux.school_school
     SET status='ACTIVE',
         is_active=true,
         row_version=row_version+1,
         verified_at=CURRENT_TIMESTAMP,
         verified_by=v_provider_id,
         activated_at=CURRENT_TIMESTAMP,
         suspended_at=NULL,
         updated_at=CURRENT_TIMESTAMP
   WHERE id=p_school_id;

  INSERT INTO sukuux.school_lifecycle_transition
    (id,school_id,prior_state,new_state,action,actor_id,actor_role,reason,correlation_id,created_at)
  VALUES
    (gen_random_uuid()::text,p_school_id,'UNDER_VERIFICATION','ACTIVE',
     'PROVIDER_VERIFY_APPROVE',v_provider_id,'platform_admin',trim(p_reason),
     v_correlation_id,CURRENT_TIMESTAMP);

  INSERT INTO sukuux.school_audit_log
    (id,school_id,action,performed_by,created_at)
  VALUES
    (gen_random_uuid()::text,p_school_id,
     'LIFECYCLE UNDER_VERIFICATION -> ACTIVE: ' || trim(p_reason),
     v_provider_id,CURRENT_TIMESTAMP);

  INSERT INTO system.system_audit_event
    (id,user_id,school_id,action,entity_type,entity_id,before_state,after_state,created_at)
  VALUES
    (gen_random_uuid()::text,NULL,p_school_id,
     'SCHOOL_LIFECYCLE:UNDER_VERIFICATION->ACTIVE',
     'school_school',p_school_id,'UNDER_VERIFICATION','ACTIVE',CURRENT_TIMESTAMP);

  INSERT INTO system.system_domain_event
    (id,aggregate_type,aggregate_id,event_type,occurred_at,recorded_at,producer,
     correlation_id,tenant_id,payload,status,attempt_count)
  VALUES
    (gen_random_uuid(),'School',p_school_id,'SchoolVerified',
     CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,'sukuu-api',
     v_correlation_id,p_school_id,
     jsonb_build_object(
       'priorState','UNDER_VERIFICATION',
       'newState','ACTIVE',
       'reason',trim(p_reason),
       'providerId',v_provider_id
     ),
     'PENDING',0);

  INSERT INTO system.system_provider_audit_event
    (provider_id,session_id,action,entity_type,entity_id,purpose,payload)
  VALUES
    (v_provider_id,v_session_id,'SCHOOL_VERIFY_APPROVE','school_school',
     p_school_id,trim(p_reason),
     jsonb_build_object('priorState','UNDER_VERIFICATION','newState','ACTIVE'));

  RETURN jsonb_build_object('ok',true,'schoolId',p_school_id);
END
$function$;

REVOKE ALL ON FUNCTION system.provider_school_approve(text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION system.provider_school_approve(text,text) TO sukuu_app_runtime;

DO $postcheck$
DECLARE
  v_rls integer;
  v_force integer;
BEGIN
  SELECT
    count(*) FILTER (WHERE c.relrowsecurity)::integer,
    count(*) FILTER (WHERE c.relforcerowsecurity)::integer
    INTO v_rls,v_force
    FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
   WHERE (n.nspname,c.relname) IN (
     ('sukuux','school_department'),
     ('sukuux','school_holiday'),
     ('sukuux','school_timezone'),
     ('sukuux','school_currency'),
     ('sukuux','school_onboarding'),
     ('sukuux','school_calendar')
   );

  IF v_rls <> 6 OR v_force <> 6 THEN
    RAISE EXCEPTION 'SX-3 postcheck: canonical SchoolX RLS/FORCE RLS incomplete';
  END IF;

  IF to_regclass('sukuux.uq_school_campus_primary_active') IS NULL THEN
    RAISE EXCEPTION 'SX-3 postcheck: primary-campus uniqueness missing';
  END IF;

  IF to_regprocedure('system._schoolx_activation_readiness(text)') IS NULL THEN
    RAISE EXCEPTION 'SX-3 postcheck: activation readiness function missing';
  END IF;
END
$postcheck$;

COMMIT;
