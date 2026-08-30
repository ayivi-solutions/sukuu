-- SUKUU SYSTEMX ACTION-PERMISSION CATALOG
-- EFS-SYS-0006..0010 / ETAS-ERP-006 / ESS-SYS-141..145
-- Additive and backward-compatible: legacy read/full catalogue entries are retained.

DO $preflight$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM system.system_role
    WHERE name='superadmin' AND archived_at IS NULL
  ) THEN
    RAISE EXCEPTION 'SystemX action-policy migration aborted: superadmin role missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM system.system_role
    WHERE name='headmaster' AND archived_at IS NULL
  ) THEN
    RAISE EXCEPTION 'SystemX action-policy migration aborted: headmaster role missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM system.system_permission
    WHERE module='system' AND action='full' AND resource='*'
  ) THEN
    RAISE EXCEPTION 'SystemX action-policy migration aborted: legacy system/full permission missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM system.system_permission
    WHERE module='system' AND action='read' AND resource='*'
  ) THEN
    RAISE EXCEPTION 'SystemX action-policy migration aborted: legacy system/read permission missing';
  END IF;
END
$preflight$;

WITH action_catalog(action,label,description) AS (
  VALUES
    ('view','View','View authorised SystemX records'),
    ('create','Create','Create SystemX records or requests'),
    ('submit','Submit','Submit SystemX changes for consequential processing'),
    ('approve','Approve','Approve consequential SystemX actions'),
    ('release','Release','Release approved SystemX outcomes'),
    ('correct','Correct','Correct authorised SystemX records'),
    ('cancel','Cancel','Cancel or withdraw eligible SystemX operations'),
    ('export','Export','Export governed SystemX evidence and reports'),
    ('administer','Administer','Administer privileged SystemX security and policy controls')
)
INSERT INTO system.system_permission (
  id,module,action,resource,label,description
)
SELECT
  gen_random_uuid()::text,
  'system',
  c.action,
  '*',
  c.label,
  c.description
FROM action_catalog c
WHERE NOT EXISTS (
  SELECT 1
  FROM system.system_permission p
  WHERE p.module='system'
    AND p.action=c.action
    AND p.resource='*'
);

-- Highest tenant governance authority receives the explicit full action catalogue.
INSERT INTO system.system_role_permission (
  id,role_id,permission_id,granted_at,granted_by
)
SELECT
  gen_random_uuid()::text,
  r.id,
  p.id,
  CURRENT_TIMESTAMP,
  NULL
FROM system.system_role r
JOIN system.system_permission p
  ON p.module='system'
 AND p.resource='*'
 AND p.action IN (
   'view','create','submit','approve','release',
   'correct','cancel','export','administer'
 )
WHERE r.name='superadmin'
  AND r.archived_at IS NULL
  AND NOT EXISTS (
    SELECT 1
    FROM system.system_role_permission rp
    WHERE rp.role_id=r.id
      AND rp.permission_id=p.id
  );

-- School head is explicitly separated from tenant governance administration.
INSERT INTO system.system_role_permission (
  id,role_id,permission_id,granted_at,granted_by
)
SELECT
  gen_random_uuid()::text,
  r.id,
  p.id,
  CURRENT_TIMESTAMP,
  NULL
FROM system.system_role r
JOIN system.system_permission p
  ON p.module='system'
 AND p.resource='*'
 AND p.action IN ('view','approve','release','export')
WHERE r.name='headmaster'
  AND r.archived_at IS NULL
  AND NOT EXISTS (
    SELECT 1
    FROM system.system_role_permission rp
    WHERE rp.role_id=r.id
      AND rp.permission_id=p.id
  );

-- Conservative one-time bootstrap for existing delegated roles:
-- legacy FULL becomes explicit maker/admin actions but NOT approve/release.
INSERT INTO system.system_role_permission (
  id,role_id,permission_id,granted_at,granted_by
)
SELECT DISTINCT
  gen_random_uuid()::text,
  legacy.role_id,
  action_perm.id,
  CURRENT_TIMESTAMP,
  NULL
FROM system.system_role_permission legacy
JOIN system.system_permission legacy_perm
  ON legacy_perm.id=legacy.permission_id
JOIN system.system_role role_def
  ON role_def.id=legacy.role_id
JOIN system.system_permission action_perm
  ON action_perm.module='system'
 AND action_perm.resource='*'
 AND action_perm.action IN (
   'view','create','submit','correct',
   'cancel','export','administer'
 )
WHERE legacy_perm.module='system'
  AND legacy_perm.action='full'
  AND legacy_perm.resource='*'
  AND role_def.archived_at IS NULL
  AND role_def.name NOT IN ('superadmin','headmaster','platform_admin')
  AND NOT EXISTS (
    SELECT 1
    FROM system.system_role_permission existing
    WHERE existing.role_id=legacy.role_id
      AND existing.permission_id=action_perm.id
  );

-- Legacy READ becomes explicit VIEW only. Export remains separately grantable.
INSERT INTO system.system_role_permission (
  id,role_id,permission_id,granted_at,granted_by
)
SELECT DISTINCT
  gen_random_uuid()::text,
  legacy.role_id,
  view_perm.id,
  CURRENT_TIMESTAMP,
  NULL
FROM system.system_role_permission legacy
JOIN system.system_permission legacy_perm
  ON legacy_perm.id=legacy.permission_id
JOIN system.system_role role_def
  ON role_def.id=legacy.role_id
JOIN system.system_permission view_perm
  ON view_perm.module='system'
 AND view_perm.resource='*'
 AND view_perm.action='view'
WHERE legacy_perm.module='system'
  AND legacy_perm.action='read'
  AND legacy_perm.resource='*'
  AND role_def.archived_at IS NULL
  AND role_def.name NOT IN ('superadmin','headmaster','platform_admin')
  AND NOT EXISTS (
    SELECT 1
    FROM system.system_role_permission existing
    WHERE existing.role_id=legacy.role_id
      AND existing.permission_id=view_perm.id
  );

DO $postcheck$
DECLARE
  v_actions integer;
  v_super integer;
  v_head integer;
BEGIN
  SELECT COUNT(DISTINCT action)::int
  INTO v_actions
  FROM system.system_permission
  WHERE module='system'
    AND resource='*'
    AND action IN (
      'view','create','submit','approve','release',
      'correct','cancel','export','administer'
    );

  IF v_actions <> 9 THEN
    RAISE EXCEPTION 'SystemX action-policy post-check failed: expected 9 actions, found %',v_actions;
  END IF;

  SELECT COUNT(DISTINCT p.action)::int
  INTO v_super
  FROM system.system_role_permission rp
  JOIN system.system_role r ON r.id=rp.role_id
  JOIN system.system_permission p ON p.id=rp.permission_id
  WHERE r.name='superadmin'
    AND r.archived_at IS NULL
    AND p.module='system'
    AND p.resource='*'
    AND p.action IN (
      'view','create','submit','approve','release',
      'correct','cancel','export','administer'
    );

  IF v_super <> 9 THEN
    RAISE EXCEPTION 'SystemX action-policy post-check failed: superadmin expected 9 actions, found %',v_super;
  END IF;

  SELECT COUNT(DISTINCT p.action)::int
  INTO v_head
  FROM system.system_role_permission rp
  JOIN system.system_role r ON r.id=rp.role_id
  JOIN system.system_permission p ON p.id=rp.permission_id
  WHERE r.name='headmaster'
    AND r.archived_at IS NULL
    AND p.module='system'
    AND p.resource='*'
    AND p.action IN ('view','approve','release','export');

  IF v_head <> 4 THEN
    RAISE EXCEPTION 'SystemX action-policy post-check failed: headmaster expected 4 actions, found %',v_head;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM system.system_role_permission rp
    JOIN system.system_role r ON r.id=rp.role_id
    JOIN system.system_permission p ON p.id=rp.permission_id
    WHERE r.name='headmaster'
      AND r.archived_at IS NULL
      AND p.module='system'
      AND p.resource='*'
      AND p.action IN ('create','submit','correct','cancel','administer')
  ) THEN
    RAISE EXCEPTION 'SystemX action-policy post-check failed: headmaster received tenant-governance actions';
  END IF;
END
$postcheck$;
