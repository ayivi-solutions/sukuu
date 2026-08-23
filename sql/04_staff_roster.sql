-- ═══════════════════════════════════════════════════════════════════════════
-- Staff Roster Migration — decouples staff records from login accounts
-- Today staff_staff.user_id is required, meaning a staff record can only
-- ever be created at the same instant as a login account — there is no way
-- for a real staff roster to exist independently. This is a small, low-
-- risk change: sukuux.* tables carry no RLS yet (only system.* does, from
-- the SystemX pass), so this is a plain constraint change, not a policy
-- change like the earlier migrations.
-- ═══════════════════════════════════════════════════════════════════════════

-- Pre-flight: confirm no existing row would violate the new unique
-- constraint below (two staff rows already sharing one user_id). Expect
-- zero rows back — every user_id in use today should be on exactly one
-- staff record already, since the old flow always created them 1:1.
select user_id, count(*)
from sukuux.staff_staff
where user_id is not null
group by user_id
having count(*) > 1;

-- If that returned any rows, STOP and tell me before proceeding.

alter table sukuux.staff_staff alter column user_id drop not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'uq_staff_staff_user_id'
  ) then
    -- A standard unique constraint treats NULL as distinct from every other
    -- NULL, so any number of not-yet-linked roster entries (user_id is
    -- null) can coexist — the constraint only fires if two rows ever
    -- share the same non-null user_id.
    alter table sukuux.staff_staff
      add constraint uq_staff_staff_user_id unique (user_id);
  end if;
end $$;

select 'STAFF ROSTER MIGRATION COMPLETE' as status;
