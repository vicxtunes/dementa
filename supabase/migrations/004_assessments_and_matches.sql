-- ============================================================================
-- 004 — Papers (assessments) + teams + the unified match engine
--
-- Part of the platform pivot (docs/platform-pivot-tokens-and-subjects.md).
-- Run AFTER 003 and BEFORE / alongside 005. Pairs with milestones M3–M5.
-- The `matches` engine powers in-subject duels (1v1), group quizzes, and
-- learner-built general (cross-subject) quizzes — one core, three modes.
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- Assessments — generic past papers / timed exams, per subject and/or class
-- ---------------------------------------------------------------------------
create table if not exists assessments (
  id                         uuid primary key default gen_random_uuid(),
  subject_id                 text references subjects(id) on delete cascade,
  class_code                 text references classes(code) on update cascade on delete set null,
  title                      text not null,
  assessment_type            text not null check (assessment_type in ('past_paper', 'timed_exam')),
  source                     text,
  token_cost_to_attempt      int not null default 0,
  token_reward_on_completion int not null default 10,
  created_by                 uuid references profiles(id),
  created_at                 timestamptz default now()
);
alter table assessments enable row level security;
drop policy if exists "Read assessments for your class" on assessments;
create policy "Read assessments for your class" on assessments for select
  using (class_code is null or class_code = public.my_class_code());
drop policy if exists "Teachers can manage assessments" on assessments;
create policy "Teachers can manage assessments" on assessments for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'teacher'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'teacher'));

create table if not exists assessment_items (
  id            uuid primary key default gen_random_uuid(),
  assessment_id uuid references assessments(id) on delete cascade,
  item_number   int not null,
  section       text,
  part          text,
  scenario      text not null,
  sub_questions jsonb not null default '[]'   -- [{label, prompt, model_answer}]
);
alter table assessment_items enable row level security;
drop policy if exists "Everyone can read assessment items" on assessment_items;
create policy "Everyone can read assessment items" on assessment_items for select using (true);
drop policy if exists "Teachers can manage assessment items" on assessment_items;
create policy "Teachers can manage assessment items" on assessment_items for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'teacher'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'teacher'));

create table if not exists assessment_submissions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references profiles(id) on delete cascade,
  assessment_id    uuid references assessments(id) on delete cascade,
  answers          jsonb not null default '{}',
  self_marked_done boolean not null default false,
  token_awarded    boolean not null default false,
  updated_at       timestamptz default now(),
  unique (user_id, assessment_id)
);
alter table assessment_submissions enable row level security;
drop policy if exists "Users manage their own assessment submissions" on assessment_submissions;
create policy "Users manage their own assessment submissions" on assessment_submissions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Teachers can read class assessment submissions" on assessment_submissions;
create policy "Teachers can read class assessment submissions" on assessment_submissions for select
  using (exists (
    select 1 from profiles p where p.id = auth.uid() and p.role = 'teacher'
    and p.class_code = (select class_code from profiles where id = assessment_submissions.user_id)
  ));

-- ---------------------------------------------------------------------------
-- Teams
-- ---------------------------------------------------------------------------
create table if not exists teams (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  class_code text not null references classes(code) on update cascade on delete cascade,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);
alter table teams enable row level security;
drop policy if exists "See teams in your class" on teams;
create policy "See teams in your class" on teams for select using (class_code = public.my_class_code());
drop policy if exists "Create teams in your class" on teams;
create policy "Create teams in your class" on teams for insert with check (class_code = public.my_class_code());

create table if not exists team_members (
  team_id uuid references teams(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  primary key (team_id, user_id)
);
alter table team_members enable row level security;
drop policy if exists "See team membership in your class" on team_members;
create policy "See team membership in your class" on team_members for select
  using (exists (select 1 from teams t where t.id = team_members.team_id and t.class_code = public.my_class_code()));
drop policy if exists "Join or leave teams yourself" on team_members;
create policy "Join or leave teams yourself" on team_members for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Unified match engine — solo practice, 1v1 duels, and group-vs-group quizzes,
-- in-subject or learner-built general (cross-subject).
-- ---------------------------------------------------------------------------
create table if not exists matches (
  id           uuid primary key default gen_random_uuid(),
  mode         text not null check (mode in ('solo', 'duel', 'group')),
  is_general   boolean not null default false,  -- true = cross-subject, subject_id null
  subject_id   text references subjects(id) on delete set null,
  class_code   text references classes(code) on update cascade on delete set null,
  topic_ids    text[] not null default '{}',    -- topics.id is a text slug

  settings     jsonb not null default '{}',   -- { question_count, time_limit_seconds, token_entry_cost }
  question_ids uuid[] not null default '{}',
  status       text not null default 'pending' check (status in ('pending', 'active', 'completed', 'declined')),
  created_by   uuid references profiles(id),
  winner_ref   text,                           -- participant user_id (duel) or team_id (group)
  created_at   timestamptz default now(),
  completed_at timestamptz
);
alter table matches enable row level security;

create table if not exists match_teams (
  match_id uuid references matches(id) on delete cascade,
  team_id  uuid references teams(id) on delete cascade,
  slot     text not null check (slot in ('a', 'b')),
  score    int,
  primary key (match_id, team_id)
);
alter table match_teams enable row level security;

create table if not exists match_participants (
  match_id    uuid references matches(id) on delete cascade,
  user_id     uuid references profiles(id) on delete cascade,
  team_id     uuid references teams(id) on delete set null,
  status      text not null default 'invited'
                check (status in ('invited', 'joined', 'finished', 'declined')),
  answers     jsonb not null default '[]',
  score       int,
  finished_at timestamptz,
  primary key (match_id, user_id)
);
alter table match_participants enable row level security;

-- Helper: match ids the current user can see. SECURITY DEFINER so the RLS
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
create policy "Answer your own participant row" on match_participants for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "See teams of your matches" on match_teams;
create policy "See teams of your matches" on match_teams for select using (
  match_id in (select public.my_match_ids())
  or exists (select 1 from team_members tm where tm.team_id = match_teams.team_id and tm.user_id = auth.uid())
);
-- Match creation + settlement (score aggregation, winner, token payout) run via
-- service-role Route Handlers.

commit;
