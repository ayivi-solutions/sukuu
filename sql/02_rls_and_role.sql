-- ============================================================================
-- DEPRECATED: LEGACY SYSTEMX RLS BOOTSTRAP
-- ============================================================================
--
-- This file is intentionally retired and MUST NOT be used to configure Sukuu.
--
-- The authoritative SystemX runtime-role and row-level-security history is now
-- maintained exclusively through the Prisma migration ledger. The trusted RLS
-- cutover is session-bound through system.ctx_* helpers and does not trust
-- caller-settable compatibility context.
--
-- This hard stop prevents accidental reintroduction of the superseded policy
-- model from an old operational SQL script.
-- ============================================================================

DO $deprecated$
BEGIN
  RAISE EXCEPTION
    'DEPRECATED SUKUU RLS BOOTSTRAP: use the authoritative Prisma migration history; this script must not be executed';
END
$deprecated$;
