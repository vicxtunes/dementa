-- ============================================================================
-- 007 — Challenge events
--
-- A Challenge is a time-boxed event the team/developer creates, often with a
-- prize. It appears, runs, closes, and is then archived out of the system.
-- (Distinct from Topics, and from learner duels/group quizzes.)
--
-- Run AFTER 006. Safe to re-run.
-- ============================================================================

begin;

create table if not exists challenges (
  id                uuid primary key default gen_random_uuid(),
  title             text not null,
  description       text,
  banner_url        text,
  subject_id        text references subjects(id) on delete set null,   -- null = general / cross-subject
  class_code        text references classes(code) on update cascade on delete set null,  -- null = all classes
  topic_ids         text[] not null default '{}',
  rules             jsonb not null default '{}',   -- { question_count, time_limit_seconds }
  question_ids      uuid[] not null default '{}',
  prize_description text,
  prize_tokens      int not null default 0,
  prize_places      int not null default 1,        -- how many top entrants share the prize
  status            text not null default 'draft'
                      check (status in ('draft', 'open', 'closed', 'archived')),
  starts_at         timestamptz,
  ends_at           timestamptz,
  created_by        uuid references profiles(id),
  created_at        timestamptz default now()
);

alter table challenges enable row level security;

drop policy if exists "Read open challenges for your class" on challenges;
create policy "Read open challenges for your class" on challenges for select using (
  (status in ('open', 'closed') and (class_code is null or class_code = public.my_class_code()))
  or created_by = auth.uid()
  or exists (select 1 from profiles where id = auth.uid() and role = 'teacher')
);

drop policy if exists "Teachers manage challenges" on challenges;
create policy "Teachers manage challenges" on challenges for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'teacher'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'teacher'));

create table if not exists challenge_entries (
  id           uuid primary key default gen_random_uuid(),
  challenge_id uuid references challenges(id) on delete cascade,
  user_id      uuid references profiles(id) on delete cascade,
  score        int not null default 0,
  total        int not null default 0,
  breakdown    jsonb not null default '[]',
  submitted_at timestamptz default now(),
  unique (challenge_id, user_id)
);

alter table challenge_entries enable row level security;

drop policy if exists "Read entries for challenges you can see" on challenge_entries;
create policy "Read entries for challenges you can see" on challenge_entries for select using (
  exists (
    select 1 from challenges c
    where c.id = challenge_entries.challenge_id
      and (c.class_code is null or c.class_code = public.my_class_code()
           or exists (select 1 from profiles where id = auth.uid() and role = 'teacher'))
  )
);
-- Entries are written only by the service-role Route Handler (grades + dedups).

-- Leaderboard: ranked entries per challenge.
create or replace view challenge_leaderboard as
select
  e.challenge_id,
  e.user_id,
  p.full_name,
  p.class_code,
  e.score,
  e.total,
  e.submitted_at,
  rank() over (partition by e.challenge_id order by e.score desc, e.submitted_at asc) as place
from challenge_entries e
join profiles p on p.id = e.user_id;

-- Flip expired open challenges to closed and pay prizes to the top places.
-- Call from a Supabase scheduled function, or manually.
create or replace function public.close_expired_challenges()
returns void language plpgsql security definer set search_path = public as $$
declare
  c record;
  w record;
  share int;
begin
  for c in
    select * from challenges
    where status = 'open' and ends_at is not null and ends_at < now()
  loop
    update challenges set status = 'closed' where id = c.id;

    if c.prize_tokens > 0 then
      share := greatest(1, c.prize_tokens / greatest(1, c.prize_places));
      for w in
        select user_id from challenge_leaderboard
        where challenge_id = c.id and place <= c.prize_places
      loop
        perform public.apply_token_delta(w.user_id, share, 'challenge_prize', c.id::text, true);
      end loop;
    end if;
  end loop;
end $$;

revoke execute on function public.close_expired_challenges() from public, anon, authenticated;

commit;
