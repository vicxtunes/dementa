-- ============================================================================
-- 010 — Re-assert the match-engine CHECK constraints
--
-- More 004 drift: the deployed `matches.mode` check still reads
-- ('solo', 'duel') with no 'group', so team quizzes can't be inserted. Because
-- 004 uses `create table if not exists`, re-running it never touches an
-- existing table's constraints — so drop and re-add each one to match 004's
-- intent. Safe to re-run. Run AFTER 009.
-- ============================================================================

begin;

alter table matches drop constraint if exists matches_mode_check;
alter table matches add constraint matches_mode_check
  check (mode in ('solo', 'duel', 'group'));

alter table matches drop constraint if exists matches_status_check;
alter table matches add constraint matches_status_check
  check (status in ('pending', 'active', 'completed', 'declined'));

alter table match_teams drop constraint if exists match_teams_slot_check;
alter table match_teams add constraint match_teams_slot_check
  check (slot in ('a', 'b'));

alter table match_participants drop constraint if exists match_participants_status_check;
alter table match_participants add constraint match_participants_status_check
  check (status in ('invited', 'joined', 'finished', 'declined'));

commit;
