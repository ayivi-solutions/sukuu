-- ═══════════════════════════════════════════════════════════════════════════
-- RBAC Live-Check Migration — unique constraint on system_user_role
-- Prevents duplicate (user, role, school) grants. Safe to run regardless
-- of order relative to the code deploy — this is a pure constraint add,
-- no data change.
-- ═══════════════════════════════════════════════════════════════════════════

-- Pre-flight: confirm there are no existing duplicates that would make the
-- constraint fail to apply. Expect zero rows back.
select user_id, role_id, school_id, count(*)
from system.system_user_role
group by user_id, role_id, school_id
having count(*) > 1;

-- If the query above returned any rows, STOP and tell me before proceeding
-- — do not run the statement below until that's resolved.

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'uq_system_user_role_user_role_school'
  ) then
    alter table system.system_user_role
      add constraint uq_system_user_role_user_role_school
      unique (user_id, role_id, school_id);
  end if;
end $$;

select 'RBAC CONSTRAINT MIGRATION COMPLETE' as status;
