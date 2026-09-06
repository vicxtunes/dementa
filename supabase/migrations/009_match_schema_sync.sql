-- ============================================================================
-- 009 — Reconcile the match engine schema with the app code
--
-- The deployed database predates parts of migration 004: `matches` is missing
-- `is_general` and `topic_ids`, and `match_participants` is missing `status`
-- (the column the accept / decline / finish lifecycle runs on). Without these,
-- every non-solo match — duels AND team quizzes — fails on insert.
--
-- This adds only what's missing and re-asserts the current match RLS (identical
-- to 006). Safe to run even if 004/006 were applied in full. Run it before the
-- /teams + /team-quizzes feature; it also unblocks 1v1 duels.
-- ============================================================================

begin;

-- --- missing columns -------------------------------------------------------
alter table matches add column if not exists is_general boolean not null default false;
alter table matches add column if not exists topic_ids  text[]  not null default '{}';

alter table match_participants add column if not exists status text not null default 'invited';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'match_participants_status_check'
  ) then
    alter table match_participants add constraint match_participants_status_check
      check (status in ('invited', 'joined', 'finished', 'declined'));
  end if;
end $$;

-- --- current match RLS (same as 006) --------------------------------------
create or replace function public.my_match_ids()
returns setof uuid language sql security definer stable set search_path = public as $$
  select mp.match_id from match_participants mp where mp.user_id = auth.uid()
  union
  select mt.match_id from match_teams mt
    join team_members tm on tm.team_id = mt.team_id
    where tm.user_id = auth.uid()
$$;

alter table matches enable row level security;
alter table match_participants enable row level security;
alter table match_teams enable row level security;

drop policy if exists "See your matches" on matches;
create policy "See your matches" on matches for select
  using (id in (select public.my_match_ids()) or created_by = auth.uid());

drop policy if exists "See participants of your matches" on match_participants;
create policy "See participants of your matches" on match_participants for select
  using (match_id in (select public.my_match_ids()));

drop policy if exists "Answer your own participant row" on match_participants;
drop policy if exists "Update your own participant row" on match_participants;
create policy "Update your own participant row" on match_participants for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "See teams of your matches" on match_teams;
create policy "See teams of your matches" on match_teams for select using (
  match_id in (select public.my_match_ids())
  or exists (select 1 from team_members tm where tm.team_id = match_teams.team_id and tm.user_id = auth.uid())
);

commit;
