BEGIN;

-- ============================================================================
-- SUKUU OPERATING SYSTEM
-- Stage 3B Phase 2B
-- Privileged Authority Separation Foundation
--
-- AUTHORITY MODEL
--
-- platform_admin
--   Ayivi Solutions provider/platform authority.
--   Not a school tenant role.
--   No tenant module permissions are granted in this migration.
--   Dedicated privileged authentication/session semantics follow in Phase 2C/D.
--
-- superadmin
--   Highest governance authority within one tenant.
--   Tenant owner/proprietor/governing authority or formally delegated authority.
--
-- headmaster
--   Chief operational school authority.
--   Tenant-bound and subordinate to tenant superadmin for Sukuu governance.
--
-- This migration DOES NOT perform the final RLS policy cutover.
-- ============================================================================


-- --------------------------------------------------------------------------
-- 1. Pre-cutover authority guards.
-- --------------------------------------------------------------------------

DO $authority_preflight$
BEGIN

  IF NOT EXISTS (
    SELECT 1
    FROM system.system_role
    WHERE name = 'superadmin'
      AND archived_at IS NULL
  ) THEN
    RAISE EXCEPTION
      'Phase 2B aborted: active superadmin role is missing';
  END IF;


  IF NOT EXISTS (
    SELECT 1
    FROM system.system_role
    WHERE name = 'headmaster'
      AND archived_at IS NULL
  ) THEN
    RAISE EXCEPTION
      'Phase 2B aborted: active headmaster role is missing';
  END IF;


  -- Every current tenant superadmin must already be tenant-bound.
  IF EXISTS (
    SELECT 1

    FROM system.system_user_role sur

    JOIN system.system_role r
      ON r.id = sur.role_id

    WHERE
      r.name = 'superadmin'
      AND r.archived_at IS NULL
      AND sur.school_id IS NULL
      AND (
        sur.expires_at IS NULL
        OR sur.expires_at > CURRENT_TIMESTAMP
      )
  ) THEN
    RAISE EXCEPTION
      'Phase 2B aborted: active superadmin grant without tenant scope';
  END IF;


  -- Do not silently preserve a dual superadmin/headmaster identity
  -- inside the same tenant.
  IF EXISTS (
    SELECT
      sur.user_id,
      sur.school_id

    FROM system.system_user_role sur

    JOIN system.system_role r
      ON r.id = sur.role_id

    WHERE
      r.name IN ('superadmin','headmaster')
      AND r.archived_at IS NULL
      AND (
        sur.expires_at IS NULL
        OR sur.expires_at > CURRENT_TIMESTAMP
      )

    GROUP BY
      sur.user_id,
      sur.school_id

    HAVING
      COUNT(DISTINCT r.name) = 2
  ) THEN
    RAISE EXCEPTION
      'Phase 2B aborted: one identity holds superadmin and headmaster in the same tenant';
  END IF;


  IF NOT EXISTS (
    SELECT 1
    FROM system.system_permission
    WHERE module = 'system'
      AND action = 'full'
      AND resource = '*'
  ) THEN
    RAISE EXCEPTION
      'Phase 2B aborted: SystemX FULL permission catalogue entry is missing';
  END IF;


  IF NOT EXISTS (
    SELECT 1
    FROM system.system_permission
    WHERE module = 'system'
      AND action = 'read'
      AND resource = '*'
  ) THEN
    RAISE EXCEPTION
      'Phase 2B aborted: SystemX READ permission catalogue entry is missing';
  END IF;

END
$authority_preflight$;


-- --------------------------------------------------------------------------
-- 2. Create the provider/platform role DEFINITION only.
--
-- system_user_role.school_id is currently NOT NULL, therefore this migration
-- deliberately creates no platform_admin user grant. Platform authority must
-- not be faked by attaching Ayivi's privileged identity to a school tenant.
-- --------------------------------------------------------------------------

INSERT INTO system.system_role (
  id,
  name,
  label,
  description,
  is_system,
  school_id,
  row_version,
  created_at,
  archived_at
)
SELECT
  gen_random_uuid()::text,
  'platform_admin',
  'Platform Administrator',
  'Ayivi Solutions provider/platform privileged authority. Not a tenant business role.',
  true,
  NULL,
  1,
  CURRENT_TIMESTAMP,
  NULL
WHERE NOT EXISTS (
  SELECT 1
  FROM system.system_role
  WHERE name = 'platform_admin'
    AND archived_at IS NULL
);


UPDATE system.system_role
SET
  label = 'Platform Administrator',
  description =
    'Ayivi Solutions provider/platform privileged authority. Not a tenant business role.',
  row_version = row_version + 1
WHERE name = 'platform_admin'
  AND archived_at IS NULL;


-- --------------------------------------------------------------------------
-- 3. Canonicalise tenant privileged-role meaning.
-- --------------------------------------------------------------------------

UPDATE system.system_role
SET
  label = 'Superadmin',
  description =
    'Tenant owner, proprietor, governing authority or formally delegated authority - highest governance authority within one tenant',
  row_version = row_version + 1
WHERE name = 'superadmin'
  AND archived_at IS NULL;


UPDATE system.system_role
SET
  label = 'Headmaster',
  description =
    'Chief operational school authority within the tenant; subordinate to tenant superadmin for Sukuu governance',
  row_version = row_version + 1
WHERE name = 'headmaster'
  AND archived_at IS NULL;


-- --------------------------------------------------------------------------
-- 4. Separate module-level governance authority.
--
-- superadmin:
--   remains FULL across the tenant module catalogue.
--
-- headmaster:
--   loses FULL SystemX administration and receives READ SystemX access.
--
-- Detailed create/submit/approve/release/administer separation follows
-- through the EFS-aligned action-policy pass.
-- --------------------------------------------------------------------------

DELETE FROM system.system_role_permission rp

USING
  system.system_role r,
  system.system_permission p

WHERE
  rp.role_id = r.id
  AND rp.permission_id = p.id
  AND r.name = 'headmaster'
  AND r.archived_at IS NULL
  AND p.module = 'system'
  AND p.action = 'full'
  AND p.resource = '*';


INSERT INTO system.system_role_permission (
  id,
  role_id,
  permission_id,
  granted_at,
  granted_by
)
SELECT
  gen_random_uuid()::text,
  r.id,
  p.id,
  CURRENT_TIMESTAMP,
  NULL

FROM
  system.system_role r,
  system.system_permission p

WHERE
  r.name = 'headmaster'
  AND r.archived_at IS NULL
  AND p.module = 'system'
  AND p.action = 'read'
  AND p.resource = '*'

  AND NOT EXISTS (
    SELECT 1

    FROM system.system_role_permission existing

    WHERE
      existing.role_id = r.id
      AND existing.permission_id = p.id
  );


-- Explicitly preserve full tenant SystemX authority for superadmin.

INSERT INTO system.system_role_permission (
  id,
  role_id,
  permission_id,
  granted_at,
  granted_by
)
SELECT
  gen_random_uuid()::text,
  r.id,
  p.id,
  CURRENT_TIMESTAMP,
  NULL

FROM
  system.system_role r,
  system.system_permission p

WHERE
  r.name = 'superadmin'
  AND r.archived_at IS NULL
  AND p.module = 'system'
  AND p.action = 'full'
  AND p.resource = '*'

  AND NOT EXISTS (
    SELECT 1

    FROM system.system_role_permission existing

    WHERE
      existing.role_id = r.id
      AND existing.permission_id = p.id
  );


-- --------------------------------------------------------------------------
-- 5. Explicit trusted tenant-authority helpers.
-- --------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION
  system.ctx_is_tenant_superadmin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, system
AS $function$
  SELECT system.ctx_has_role('superadmin')
$function$;


REVOKE ALL ON FUNCTION
  system.ctx_is_tenant_superadmin()
FROM PUBLIC;


CREATE OR REPLACE FUNCTION
  system.ctx_is_headmaster()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, system
AS $function$
  SELECT system.ctx_has_role('headmaster')
$function$;


REVOKE ALL ON FUNCTION
  system.ctx_is_headmaster()
FROM PUBLIC;


-- Deprecated compatibility helper.
--
-- It must no longer treat Headmaster as an administrator equivalent to
-- tenant Superadmin.
--
-- Platform administration will receive a separate dedicated privileged
-- context in Phase 2C/D and final policies will use explicit authority
-- helpers rather than this ambiguous compatibility name.

CREATE OR REPLACE FUNCTION
  system.ctx_is_system_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, system
AS $function$
  SELECT system.ctx_is_tenant_superadmin()
$function$;


REVOKE ALL ON FUNCTION
  system.ctx_is_system_admin()
FROM PUBLIC;


-- --------------------------------------------------------------------------
-- 6. Runtime helper grants.
-- --------------------------------------------------------------------------

DO $runtime_grants$
BEGIN

  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_roles
    WHERE rolname = 'sukuu_app_runtime'
  ) THEN

    EXECUTE
      'GRANT EXECUTE ON FUNCTION system.ctx_is_tenant_superadmin() TO sukuu_app_runtime';

    EXECUTE
      'GRANT EXECUTE ON FUNCTION system.ctx_is_headmaster() TO sukuu_app_runtime';

    EXECUTE
      'GRANT EXECUTE ON FUNCTION system.ctx_is_system_admin() TO sukuu_app_runtime';

  END IF;

END
$runtime_grants$;


-- --------------------------------------------------------------------------
-- 7. Postconditions.
-- --------------------------------------------------------------------------

DO $authority_postcheck$
DECLARE
  v_superadmin_full_modules integer;
BEGIN

  -- Platform role is a global role definition.
  IF NOT EXISTS (
    SELECT 1

    FROM system.system_role

    WHERE
      name = 'platform_admin'
      AND school_id IS NULL
      AND is_system = true
      AND archived_at IS NULL
  ) THEN
    RAISE EXCEPTION
      'Phase 2B post-check failed: platform_admin role definition missing';
  END IF;


  -- No ordinary tenant grant may be manufactured for platform_admin.
  IF EXISTS (
    SELECT 1

    FROM system.system_user_role sur

    JOIN system.system_role r
      ON r.id = sur.role_id

    WHERE
      r.name = 'platform_admin'
      AND r.archived_at IS NULL
  ) THEN
    RAISE EXCEPTION
      'Phase 2B post-check failed: platform_admin has a tenant user-role grant';
  END IF;


  -- Headmaster must not retain SystemX FULL.
  IF EXISTS (
    SELECT 1

    FROM system.system_role_permission rp

    JOIN system.system_role r
      ON r.id = rp.role_id

    JOIN system.system_permission p
      ON p.id = rp.permission_id

    WHERE
      r.name = 'headmaster'
      AND r.archived_at IS NULL
      AND p.module = 'system'
      AND p.action = 'full'
      AND p.resource = '*'
  ) THEN
    RAISE EXCEPTION
      'Phase 2B post-check failed: headmaster still has SystemX FULL';
  END IF;


  -- Headmaster retains SystemX visibility through READ.
  IF NOT EXISTS (
    SELECT 1

    FROM system.system_role_permission rp

    JOIN system.system_role r
      ON r.id = rp.role_id

    JOIN system.system_permission p
      ON p.id = rp.permission_id

    WHERE
      r.name = 'headmaster'
      AND r.archived_at IS NULL
      AND p.module = 'system'
      AND p.action = 'read'
      AND p.resource = '*'
  ) THEN
    RAISE EXCEPTION
      'Phase 2B post-check failed: headmaster SystemX READ is missing';
  END IF;


  -- Tenant superadmin remains full across the 24-module catalogue.
  SELECT
    COUNT(DISTINCT p.module)::int

  INTO
    v_superadmin_full_modules

  FROM system.system_role_permission rp

  JOIN system.system_role r
    ON r.id = rp.role_id

  JOIN system.system_permission p
    ON p.id = rp.permission_id

  WHERE
    r.name = 'superadmin'
    AND r.archived_at IS NULL
    AND p.action = 'full'
    AND p.resource = '*';


  IF v_superadmin_full_modules <> 24 THEN
    RAISE EXCEPTION
      'Phase 2B post-check failed: expected superadmin FULL authority on 24 tenant modules, found %',
      v_superadmin_full_modules;
  END IF;


  -- A single identity must not hold both tenant governance roles.
  IF EXISTS (
    SELECT
      sur.user_id,
      sur.school_id

    FROM system.system_user_role sur

    JOIN system.system_role r
      ON r.id = sur.role_id

    WHERE
      r.name IN ('superadmin','headmaster')
      AND r.archived_at IS NULL
      AND (
        sur.expires_at IS NULL
        OR sur.expires_at > CURRENT_TIMESTAMP
      )

    GROUP BY
      sur.user_id,
      sur.school_id

    HAVING
      COUNT(DISTINCT r.name) = 2
  ) THEN
    RAISE EXCEPTION
      'Phase 2B post-check failed: superadmin/headmaster identity overlap';
  END IF;

END
$authority_postcheck$;


COMMIT;
