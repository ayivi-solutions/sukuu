BEGIN;

-- SCHOOLX SX-2A — explicit action authority + institution lifecycle foundation
-- EFS-SCH-0006..0010, EFS-SCH-0032..0035, EEAS-SCH lifecycle controls.

DO $preflight$
BEGIN
  IF to_regclass('sukuux.school_school') IS NULL THEN
    RAISE EXCEPTION 'SX-2A aborted: sukuux.school_school missing';
  END IF;
  IF to_regprocedure('system.ctx_school_id()') IS NULL OR to_regprocedure('system.ctx_user_id()') IS NULL THEN
    RAISE EXCEPTION 'SX-2A aborted: trusted tenant-context helpers missing';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM system.system_role WHERE name='superadmin' AND archived_at IS NULL) THEN
    RAISE EXCEPTION 'SX-2A aborted: superadmin role missing';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM system.system_role WHERE name='headmaster' AND archived_at IS NULL) THEN
    RAISE EXCEPTION 'SX-2A aborted: headmaster role missing';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM system.system_role WHERE name='platform_admin' AND school_id IS NULL AND is_system=true AND archived_at IS NULL) THEN
    RAISE EXCEPTION 'SX-2A aborted: provider-global platform_admin role definition missing';
  END IF;
  IF EXISTS (
    SELECT 1 FROM system.system_user_role sur
    JOIN system.system_role r ON r.id=sur.role_id
    WHERE r.name='platform_admin' AND r.archived_at IS NULL
  ) THEN
    RAISE EXCEPTION 'SX-2A aborted: platform_admin must not have a tenant user-role grant';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM system.system_permission WHERE module='school' AND action='read' AND resource='*') THEN
    RAISE EXCEPTION 'SX-2A aborted: legacy school/read permission missing';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM system.system_permission WHERE module='school' AND action='full' AND resource='*') THEN
    RAISE EXCEPTION 'SX-2A aborted: legacy school/full permission missing';
  END IF;
END
$preflight$;

ALTER TABLE sukuux.school_school ADD COLUMN IF NOT EXISTS status text;
ALTER TABLE sukuux.school_school ADD COLUMN IF NOT EXISTS row_version integer NOT NULL DEFAULT 1;
ALTER TABLE sukuux.school_school ADD COLUMN IF NOT EXISTS verified_at timestamp(3);
ALTER TABLE sukuux.school_school ADD COLUMN IF NOT EXISTS verified_by text;
ALTER TABLE sukuux.school_school ADD COLUMN IF NOT EXISTS activated_at timestamp(3);
ALTER TABLE sukuux.school_school ADD COLUMN IF NOT EXISTS suspended_at timestamp(3);
ALTER TABLE sukuux.school_school ADD COLUMN IF NOT EXISTS archived_at timestamp(3);

UPDATE sukuux.school_school
SET status = CASE WHEN is_active THEN 'ACTIVE' ELSE 'SUSPENDED' END
WHERE status IS NULL;

ALTER TABLE sukuux.school_school ALTER COLUMN status SET DEFAULT 'DRAFT';
ALTER TABLE sukuux.school_school ALTER COLUMN status SET NOT NULL;

ALTER TABLE sukuux.school_school DROP CONSTRAINT IF EXISTS school_school_status_check;
ALTER TABLE sukuux.school_school ADD CONSTRAINT school_school_status_check
CHECK (status IN ('DRAFT','UNDER_VERIFICATION','ACTIVE','SUSPENDED','ARCHIVED'));

CREATE TABLE IF NOT EXISTS sukuux.school_lifecycle_transition (
  id text PRIMARY KEY,
  school_id text NOT NULL,
  prior_state text NOT NULL,
  new_state text NOT NULL,
  action text NOT NULL,
  actor_id text NOT NULL,
  actor_role text,
  reason text NOT NULL,
  correlation_id text NOT NULL,
  created_at timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT school_lifecycle_transition_prior_check CHECK (prior_state IN ('DRAFT','UNDER_VERIFICATION','ACTIVE','SUSPENDED','ARCHIVED')),
  CONSTRAINT school_lifecycle_transition_new_check CHECK (new_state IN ('DRAFT','UNDER_VERIFICATION','ACTIVE','SUSPENDED','ARCHIVED')),
  CONSTRAINT school_lifecycle_transition_school_fk FOREIGN KEY (school_id) REFERENCES sukuux.school_school(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_school_lifecycle_transition_school_time
  ON sukuux.school_lifecycle_transition (school_id, created_at);
CREATE INDEX IF NOT EXISTS idx_school_lifecycle_transition_school_state
  ON sukuux.school_lifecycle_transition (school_id, new_state);

ALTER TABLE sukuux.school_lifecycle_transition ENABLE ROW LEVEL SECURITY;
ALTER TABLE sukuux.school_lifecycle_transition FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS schoolx_lifecycle_tenant ON sukuux.school_lifecycle_transition;
CREATE POLICY schoolx_lifecycle_tenant ON sukuux.school_lifecycle_transition
  USING (school_id = system.ctx_school_id())
  WITH CHECK (school_id = system.ctx_school_id());

DO $runtime_grants$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname='sukuu_app_runtime') THEN
    EXECUTE 'GRANT SELECT, INSERT ON TABLE sukuux.school_lifecycle_transition TO sukuu_app_runtime';
  END IF;
END
$runtime_grants$;

WITH action_catalog(action,label,description) AS (
  VALUES
    ('view','View','View authorised SchoolX records'),
    ('create','Create','Create SchoolX records or requests'),
    ('submit','Submit','Submit SchoolX changes for consequential processing'),
    ('approve','Approve','Approve consequential SchoolX actions'),
    ('release','Release','Release approved SchoolX outcomes'),
    ('correct','Correct','Correct authorised SchoolX records'),
    ('cancel','Cancel','Cancel or withdraw eligible SchoolX operations'),
    ('export','Export','Export governed SchoolX evidence and reports'),
    ('administer','Administer','Administer privileged SchoolX controls')
)
INSERT INTO system.system_permission (id,module,action,resource,label,description)
SELECT gen_random_uuid()::text,'school',a.action,'*',a.label,a.description
FROM action_catalog a
WHERE NOT EXISTS (
  SELECT 1 FROM system.system_permission p
  WHERE p.module='school' AND p.action=a.action AND p.resource='*'
);

-- Tenant superadmin receives the complete SchoolX action catalogue.
INSERT INTO system.system_role_permission (id,role_id,permission_id,granted_at,granted_by)
SELECT gen_random_uuid()::text,r.id,p.id,CURRENT_TIMESTAMP,NULL
FROM system.system_role r
JOIN system.system_permission p ON p.module='school' AND p.resource='*'
 AND p.action IN ('view','create','submit','approve','release','correct','cancel','export','administer')
WHERE r.name='superadmin' AND r.archived_at IS NULL
AND NOT EXISTS (
  SELECT 1 FROM system.system_role_permission rp
  WHERE rp.role_id=r.id AND rp.permission_id=p.id
);

-- Headmaster is a maker/operational authority, not tenant governance approver.
INSERT INTO system.system_role_permission (id,role_id,permission_id,granted_at,granted_by)
SELECT gen_random_uuid()::text,r.id,p.id,CURRENT_TIMESTAMP,NULL
FROM system.system_role r
JOIN system.system_permission p ON p.module='school' AND p.resource='*'
 AND p.action IN ('view','create','submit','correct','cancel','export')
WHERE r.name='headmaster' AND r.archived_at IS NULL
AND NOT EXISTS (
  SELECT 1 FROM system.system_role_permission rp
  WHERE rp.role_id=r.id AND rp.permission_id=p.id
);

-- Conservative compatibility bootstrap: legacy FULL roles become maker roles,
-- never implicit approvers/releasers. Platform admin receives no tenant grants.
INSERT INTO system.system_role_permission (id,role_id,permission_id,granted_at,granted_by)
SELECT DISTINCT gen_random_uuid()::text,legacy.role_id,action_perm.id,CURRENT_TIMESTAMP,NULL
FROM system.system_role_permission legacy
JOIN system.system_permission legacy_perm ON legacy_perm.id=legacy.permission_id
JOIN system.system_role role_def ON role_def.id=legacy.role_id
JOIN system.system_permission action_perm
  ON action_perm.module='school' AND action_perm.resource='*'
 AND action_perm.action IN ('view','create','submit','correct','cancel','export')
WHERE legacy_perm.module='school' AND legacy_perm.action='full' AND legacy_perm.resource='*'
  AND role_def.archived_at IS NULL
  AND role_def.name NOT IN ('superadmin','headmaster','platform_admin')
  AND NOT EXISTS (
    SELECT 1 FROM system.system_role_permission existing
    WHERE existing.role_id=legacy.role_id AND existing.permission_id=action_perm.id
  );

INSERT INTO system.system_role_permission (id,role_id,permission_id,granted_at,granted_by)
SELECT DISTINCT gen_random_uuid()::text,legacy.role_id,view_perm.id,CURRENT_TIMESTAMP,NULL
FROM system.system_role_permission legacy
JOIN system.system_permission legacy_perm ON legacy_perm.id=legacy.permission_id
JOIN system.system_role role_def ON role_def.id=legacy.role_id
JOIN system.system_permission view_perm
  ON view_perm.module='school' AND view_perm.resource='*' AND view_perm.action='view'
WHERE legacy_perm.module='school' AND legacy_perm.action='read' AND legacy_perm.resource='*'
  AND role_def.archived_at IS NULL
  AND role_def.name NOT IN ('platform_admin')
  AND NOT EXISTS (
    SELECT 1 FROM system.system_role_permission existing
    WHERE existing.role_id=legacy.role_id AND existing.permission_id=view_perm.id
  );

DO $postcheck$
DECLARE
  v_actions integer;
  v_super integer;
  v_head integer;
BEGIN
  SELECT count(DISTINCT action)::int INTO v_actions
  FROM system.system_permission
  WHERE module='school' AND resource='*'
    AND action IN ('view','create','submit','approve','release','correct','cancel','export','administer');
  IF v_actions <> 9 THEN RAISE EXCEPTION 'SX-2A postcheck: expected 9 SchoolX actions, found %', v_actions; END IF;

  SELECT count(DISTINCT p.action)::int INTO v_super
  FROM system.system_role_permission rp
  JOIN system.system_role r ON r.id=rp.role_id
  JOIN system.system_permission p ON p.id=rp.permission_id
  WHERE r.name='superadmin' AND r.archived_at IS NULL
    AND p.module='school' AND p.resource='*'
    AND p.action IN ('view','create','submit','approve','release','correct','cancel','export','administer');
  IF v_super <> 9 THEN RAISE EXCEPTION 'SX-2A postcheck: superadmin expected 9 SchoolX actions, found %', v_super; END IF;

  SELECT count(DISTINCT p.action)::int INTO v_head
  FROM system.system_role_permission rp
  JOIN system.system_role r ON r.id=rp.role_id
  JOIN system.system_permission p ON p.id=rp.permission_id
  WHERE r.name='headmaster' AND r.archived_at IS NULL
    AND p.module='school' AND p.resource='*'
    AND p.action IN ('view','create','submit','correct','cancel','export');
  IF v_head <> 6 THEN RAISE EXCEPTION 'SX-2A postcheck: headmaster expected 6 maker actions, found %', v_head; END IF;

  IF EXISTS (
    SELECT 1 FROM system.system_role_permission rp
    JOIN system.system_role r ON r.id=rp.role_id
    JOIN system.system_permission p ON p.id=rp.permission_id
    WHERE r.name='headmaster' AND r.archived_at IS NULL
      AND p.module='school' AND p.resource='*'
      AND p.action IN ('approve','release','administer')
  ) THEN RAISE EXCEPTION 'SX-2A postcheck: headmaster received SchoolX approver/admin authority'; END IF;

  IF EXISTS (
    SELECT 1 FROM system.system_role_permission rp
    JOIN system.system_role r ON r.id=rp.role_id
    JOIN system.system_permission p ON p.id=rp.permission_id
    WHERE r.name='platform_admin' AND r.archived_at IS NULL
      AND p.module='school' AND p.resource='*'
      AND p.action IN ('view','create','submit','approve','release','correct','cancel','export','administer')
  ) THEN RAISE EXCEPTION 'SX-2A postcheck: platform_admin received tenant SchoolX authority'; END IF;
END
$postcheck$;

COMMIT;
