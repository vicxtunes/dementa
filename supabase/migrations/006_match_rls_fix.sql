-- ============================================================================
-- 006 — Fix the recursive RLS on the match engine (from 004) and open the
--       lifecycle a learner drives (accept / decline / answer their own row).
--
-- Run AFTER 004. Safe to re-run.
-- ============================================================================

begin;

-- Match ids the current user can see, via a SECURITY DEFINER helper so the
-- policies below don't recurse into match_participants' own policy.
create or replace function public.my_match_ids()
returns setof uuid language sql security definer stable set search_path = public as $$
  select mp.match_id from match_participants mp where mp.user_id = auth.uid()
  union
  select mt.match_id from match_teams mt
    join team_members tm on tm.team_id = mt.team_id
    where tm.user_id = auth.uid()
$$;

drop policy if exists "See your matches" on matches;
create policy "See your matches" on matches for select
  using (id in (select public.my_match_ids()) or created_by = auth.uid());

drop policy if exists "See participants of your matches" on match_participants;
create policy "See participants of your matches" on match_participants for select
  using (match_id in (select public.my_match_ids()));

drop policy if exists "Answer your own participant row" on match_participants;
create policy "Update your own participant row" on match_participants for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "See teams of your matches" on match_teams;
create policy "See teams of your matches" on match_teams for select using (
  match_id in (select public.my_match_ids())
  or exists (select 1 from team_members tm where tm.team_id = match_teams.team_id and tm.user_id = auth.uid())
);

commit;
