-- ============================================================================
-- 002 — Subjects + managed Classes + generalised Challenges
--
-- Part of the platform pivot (docs/platform-pivot-tokens-and-subjects.md).
-- Run ONCE in the Supabase SQL editor AFTER 001 (schema.sql + fix-auth-issues.sql
-- + create-teacher.sql), and BEFORE deploying the Phase 1 app code.
--
-- Guarded for safe partial re-runs: table renames wrapped in existence checks,
-- new objects use `if not exists` / `create or replace`.
--
-- After running: regenerate + re-apply seed (`npm run generate-seed`).
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1. Classes — was a bare text column on profiles; now a managed table.
-- ---------------------------------------------------------------------------
create table if not exists classes (
  code        text primary key,
  name        text not null,
  description text,
  term_label  text,                      -- e.g. "Term 1 holiday 2026"
  teacher_id  uuid references profiles(id) on delete set null,
  is_active   boolean not null default true,
  created_at  timestamptz default now()
);

alter table classes enable row level security;

insert into classes (code, name, description)
values ('S.4 General', 'S.4 General', 'The default class — everyone starts here.')
on conflict (code) do nothing;

-- backfill any class codes already in use, then point the teacher at the default
insert into classes (code, name)
select distinct class_code, class_code from profiles where class_code is not null
on conflict (code) do nothing;

update classes c
set teacher_id = p.id
from profiles p
where c.code = 'S.4 General' and p.role = 'teacher' and c.teacher_id is null;

drop policy if exists "Everyone can read classes" on classes;
create policy "Everyone can read classes" on classes for select using (true);

drop policy if exists "Teachers can manage classes" on classes;
create policy "Teachers can manage classes" on classes for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'teacher'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'teacher'));

do $$
begin
  if not exists (select 1 from information_schema.table_constraints
                 where constraint_name = 'profiles_class_code_fkey' and table_name = 'profiles') then
    alter table profiles
      add constraint profiles_class_code_fkey
      foreign key (class_code) references classes(code) on update cascade;
  end if;
end $$;

-- Allow a teacher to move students between classes.
drop policy if exists "Teachers can manage class membership" on profiles;
create policy "Teachers can manage class membership" on profiles for update
  using (exists (select 1 from profiles t where t.id = auth.uid() and t.role = 'teacher'))
  with check (exists (select 1 from profiles t where t.id = auth.uid() and t.role = 'teacher'));

-- ---------------------------------------------------------------------------
-- 2. Subjects — Chemistry becomes the first row.
-- ---------------------------------------------------------------------------
create table if not exists subjects (
  id          text primary key,          -- slug: 'chemistry', 'math'
  title       text not null,
  description text,
  icon        text,                      -- bootstrap-icons name or emoji
  sort_order  int not null default 0,
  created_at  timestamptz default now()
);

alter table subjects enable row level security;

insert into subjects (id, title, description, icon, sort_order) values
  ('chemistry', 'Chemistry', 'S.4 industrial processes — an 8-day revision sprint.', 'bi-thermometer-half', 0)
on conflict (id) do nothing;

drop policy if exists "Everyone can read subjects" on subjects;
create policy "Everyone can read subjects" on subjects for select using (true);

drop policy if exists "Teachers can manage subjects" on subjects;
create policy "Teachers can manage subjects" on subjects for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'teacher'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'teacher'));

-- ---------------------------------------------------------------------------
-- 3. processes -> challenges
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from information_schema.tables
             where table_schema = 'public' and table_name = 'processes')
     and not exists (select 1 from information_schema.tables
             where table_schema = 'public' and table_name = 'challenges') then
    alter table processes rename to challenges;
  end if;
end $$;

alter table challenges add column if not exists subject_id text;
alter table challenges add column if not exists class_code text;   -- null = all classes in the subject
alter table challenges add column if not exists content jsonb not null default '{}'::jsonb;
alter table challenges add column if not exists token_reward_base int not null default 5;

update challenges set subject_id = 'chemistry' where subject_id is null;

do $$
begin
  if not exists (select 1 from information_schema.table_constraints
                 where constraint_name = 'challenges_subject_id_fkey') then
    alter table challenges add constraint challenges_subject_id_fkey
      foreign key (subject_id) references subjects(id) on delete cascade;
  end if;
  if not exists (select 1 from information_schema.table_constraints
                 where constraint_name = 'challenges_class_code_fkey') then
    alter table challenges add constraint challenges_class_code_fkey
      foreign key (class_code) references classes(code) on update cascade on delete set null;
  end if;
end $$;

alter table challenges alter column subject_id set not null;
alter table challenges alter column day drop not null;
alter table challenges enable row level security;

drop policy if exists "Everyone can read processes" on challenges;
drop policy if exists "Everyone can read challenges" on challenges;
drop policy if exists "Read challenges for your class" on challenges;
create policy "Read challenges for your class" on challenges for select
  using (class_code is null or class_code = public.my_class_code());

drop policy if exists "Teachers can manage challenges" on challenges;
create policy "Teachers can manage challenges" on challenges for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'teacher'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'teacher'));

-- ---------------------------------------------------------------------------
-- 4. quiz_questions — process_id -> challenge_id, add numeric-answer columns
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_name = 'quiz_questions' and column_name = 'process_id')
     and not exists (select 1 from information_schema.columns
             where table_name = 'quiz_questions' and column_name = 'challenge_id') then
    alter table quiz_questions rename column process_id to challenge_id;
  end if;
end $$;

alter table quiz_questions add column if not exists question_type text not null default 'multiple_choice';
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'quiz_questions_question_type_check') then
    alter table quiz_questions add constraint quiz_questions_question_type_check
      check (question_type in ('multiple_choice', 'numeric'));
  end if;
end $$;
alter table quiz_questions add column if not exists correct_numeric_value numeric;
alter table quiz_questions add column if not exists numeric_tolerance numeric default 0.01;
alter table quiz_questions alter column options drop not null;
alter table quiz_questions alter column correct_index drop not null;

-- ---------------------------------------------------------------------------
-- 5. quiz_attempts / progress — process_id -> challenge_id
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_name = 'quiz_attempts' and column_name = 'process_id')
     and not exists (select 1 from information_schema.columns
             where table_name = 'quiz_attempts' and column_name = 'challenge_id') then
    alter table quiz_attempts rename column process_id to challenge_id;
  end if;
  if exists (select 1 from information_schema.columns
             where table_name = 'progress' and column_name = 'process_id')
     and not exists (select 1 from information_schema.columns
             where table_name = 'progress' and column_name = 'challenge_id') then
    alter table progress rename column process_id to challenge_id;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 6. Resources — teacher-shared links / notes, per class and/or subject
-- ---------------------------------------------------------------------------
create table if not exists resources (
  id         uuid primary key default gen_random_uuid(),
  class_code text references classes(code) on update cascade on delete cascade,   -- null = all classes
  subject_id text references subjects(id) on delete cascade,                      -- null = general
  title      text not null,
  url        text,
  body       text,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now()
);

alter table resources enable row level security;

drop policy if exists "Read resources for your class" on resources;
create policy "Read resources for your class" on resources for select
  using (class_code is null or class_code = public.my_class_code());

drop policy if exists "Teachers can manage resources" on resources;
create policy "Teachers can manage resources" on resources for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'teacher'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'teacher'));

-- ---------------------------------------------------------------------------
-- 7. class_overview view — refresh for the renamed columns
-- ---------------------------------------------------------------------------
create or replace view class_overview as
select
  p.id as user_id,
  p.full_name,
  p.class_code,
  p.streak_days,
  count(distinct case when pr.quiz_passed then pr.challenge_id end) as processes_mastered,
  (select count(*) from challenges) as total_processes,
  coalesce(avg(qa.score::float / nullif(qa.total, 0)), 0) as avg_score,
  count(qa.id) as quiz_attempts,
  coalesce(max(qa.score::float / nullif(qa.total, 0)), 0) as best_score,
  max(qa.created_at) as last_attempt_at
from profiles p
left join progress pr on pr.user_id = p.id
left join quiz_attempts qa on qa.user_id = p.id
where p.role = 'student'
group by p.id, p.full_name, p.class_code, p.streak_days;

commit;
