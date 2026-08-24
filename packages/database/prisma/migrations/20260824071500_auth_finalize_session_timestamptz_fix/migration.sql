BEGIN;

-- ============================================================================
-- SUKUU OPERATING SYSTEM
-- Stage 3B Phase 1 corrective migration
--
-- Prisma binds JavaScript Date values as PostgreSQL timestamptz.
-- The original auth_finalize_session() contract accepts
-- timestamp without time zone.
--
-- Add a timestamptz overload which converts the instant explicitly to UTC
-- and delegates to the already-deployed canonical implementation.
--
-- The original deployed function is intentionally left unchanged.
-- ============================================================================

CREATE OR REPLACE FUNCTION system.auth_finalize_session(
  p_ticket_id text,
  p_session_id text,
  p_refresh_token_hash text,
  p_ip_address text,
  p_user_agent text,
  p_expires_at timestamp with time zone
)
RETURNS void
LANGUAGE sql
VOLATILE
SECURITY DEFINER
SET search_path = pg_catalog, system, sukuux
AS $function$
  SELECT system.auth_finalize_session(
    p_ticket_id,
    p_session_id,
    p_refresh_token_hash,
    p_ip_address,
    p_user_agent,
    p_expires_at AT TIME ZONE 'UTC'
  )
$function$;

REVOKE ALL ON FUNCTION
  system.auth_finalize_session(
    text,
    text,
    text,
    text,
    text,
    timestamp with time zone
  )
FROM PUBLIC;

DO $runtime_grant$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_roles
    WHERE rolname = 'sukuu_app_runtime'
  ) THEN
    EXECUTE
      'GRANT EXECUTE ON FUNCTION system.auth_finalize_session(text,text,text,text,text,timestamp with time zone) TO sukuu_app_runtime';
  END IF;
END
$runtime_grant$;

COMMIT;
