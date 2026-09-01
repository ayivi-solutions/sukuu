BEGIN;

-- GAP-016 completion: accountable officers.
-- Named individuals accountable for the institution, required before an
-- UNDER_VERIFICATION -> ACTIVE go-live transition. Distinct from
-- school_delegate_nomination, which covers the one-time tenant Superadmin
-- handoff, not ongoing operational accountability.

DO $preflight$
BEGIN
  IF to_regclass('sukuux.school_school') IS NULL THEN
    RAISE EXCEPTION 'GAP-016 officer migration aborted: sukuux.school_school is missing';
  END IF;

  IF to_regprocedure('system.ctx_school_id()') IS NULL THEN
    RAISE EXCEPTION 'GAP-016 officer migration aborted: trusted context foundation is missing';
  END IF;

  IF to_regclass('sukuux.school_accountable_officer') IS NOT NULL THEN
    RAISE EXCEPTION 'GAP-016 officer migration aborted: sukuux.school_accountable_officer already exists';
  END IF;
END
$preflight$;

DO $enum_guard$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'SchoolOfficerType' AND n.nspname = 'sukuux'
  ) THEN
    CREATE TYPE sukuux."SchoolOfficerType" AS ENUM (
      'HEAD_OF_SCHOOL',
      'COMPLIANCE_OFFICER',
      'DATA_PROTECTION_OFFICER'
    );
  END IF;
END
$enum_guard$;

CREATE TABLE sukuux.school_accountable_officer (
  id            text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  school_id     text NOT NULL,
  officer_type  sukuux."SchoolOfficerType" NOT NULL,
  full_name     text NOT NULL,
  email         text NOT NULL,
  phone         text,
  appointed_by  text NOT NULL,
  appointed_at  timestamp(3) NOT NULL,
  removed_by    text,
  removed_at    timestamp(3),
  row_version   integer NOT NULL DEFAULT 1,
  created_at    timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_school_accountable_officer_school_type
  ON sukuux.school_accountable_officer (school_id, officer_type);

-- One active officer per type per school; a removed officer frees the slot.
CREATE UNIQUE INDEX uq_school_accountable_officer_active_type
  ON sukuux.school_accountable_officer (school_id, officer_type)
  WHERE removed_at IS NULL;

ALTER TABLE sukuux.school_accountable_officer ENABLE ROW LEVEL SECURITY;
ALTER TABLE sukuux.school_accountable_officer FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS schoolx_accountable_officer_tenant ON sukuux.school_accountable_officer;
CREATE POLICY schoolx_accountable_officer_tenant ON sukuux.school_accountable_officer
  USING (school_id=system.ctx_school_id())
  WITH CHECK (school_id=system.ctx_school_id());

COMMIT;
