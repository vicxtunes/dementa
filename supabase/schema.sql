-- ============================================================
-- Industrial Processes — 8 Day Sprint — Supabase schema
-- Run this once in the Supabase SQL editor (Project > SQL Editor)
-- ============================================================

-- 1. Profiles (extends auth.users)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  role text not null default 'student' check (role in ('student', 'teacher')),
  class_code text not null default 'S.4 General',
  streak_days int not null default 0,
  last_active date,
  created_at timestamptz default now()
);

alter table profiles enable row level security;

-- Helper used by the SELECT policy below: SECURITY DEFINER means this
-- query bypasses RLS internally, which is required here — a policy on
-- `profiles` that subqueries `profiles` directly (e.g.
-- `class_code = (select class_code from profiles where id = auth.uid())`)
-- causes Postgres to re-evaluate the same policy to satisfy the subquery,
-- which re-triggers the subquery, forever: "infinite recursion detected
-- in policy for relation profiles". Routing the self-lookup through a
-- SECURITY DEFINER function breaks that cycle.
create or replace function public.my_class_code()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select class_code from public.profiles where id = auth.uid();
$$;

create policy "Users can view profiles in their class"
on profiles for select
using (
  class_code = public.my_class_code()
);

create policy "Users can update their own profile"
on profiles for update
using (auth.uid() = id);

create policy "Users can insert their own profile"
on profiles for insert
with check (auth.uid() = id);

-- 2. Processes (the 11 industrial processes, mapped to an 8-day plan)
create table processes (
  id text primary key,            -- slug, e.g. 'oxygen'
  day int not null,               -- which of the 8 days this belongs to
  title text not null,
  raw_materials text[] not null default '{}',
  steps text[] not null default '{}',
  equations text[] default '{}',
  side_effects jsonb not null default '[]',  -- [{issue, effect, mitigation}]
  social_benefits text[] not null default '{}',
  flashcards jsonb not null default '[]'      -- [{front, back}]
);

alter table processes enable row level security;
create policy "Everyone can read processes"
on processes for select
using (true);

-- 3. Quiz questions per process
create table quiz_questions (
  id uuid primary key default gen_random_uuid(),
  process_id text references processes(id) on delete cascade,
  question text not null,
  options text[] not null,
  correct_index int not null,
  explanation text
);

alter table quiz_questions enable row level security;
create policy "Everyone can read quiz questions"
on quiz_questions for select
using (true);

-- 4. Quiz attempts (per student, per process)
create table quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  process_id text references processes(id) on delete cascade,
  score int not null,
  total int not null,
  created_at timestamptz default now()
);

alter table quiz_attempts enable row level security;

create policy "Users can read their own attempts"
on quiz_attempts for select
using (auth.uid() = user_id);

create policy "Teachers can read attempts in their class"
on quiz_attempts for select
using (
  exists (
    select 1 from profiles p
    where p.id = auth.uid()
    and p.role = 'teacher'
    and p.class_code = (select class_code from profiles where id = quiz_attempts.user_id)
  )
);

create policy "Users can insert their own attempts"
on quiz_attempts for insert
with check (auth.uid() = user_id);

-- 5. Progress (has a student opened/completed a day's content?)
create table progress (
  user_id uuid references profiles(id) on delete cascade,
  process_id text references processes(id) on delete cascade,
  content_viewed boolean not null default false,
  quiz_passed boolean not null default false,
  updated_at timestamptz default now(),
  primary key (user_id, process_id)
);

alter table progress enable row level security;

create policy "Users can manage their own progress"
on progress for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Teachers can read class progress"
on progress for select
using (
  exists (
    select 1 from profiles p
    where p.id = auth.uid()
    and p.role = 'teacher'
    and p.class_code = (select class_code from profiles where id = progress.user_id)
  )
);

-- ============================================================
-- Helpful view for the teacher dashboard: one row per student
-- ============================================================
create or replace view class_overview as
select
  p.id as user_id,
  p.full_name,
  p.class_code,
  p.streak_days,
  count(distinct case when pr.quiz_passed then pr.process_id end) as processes_mastered,
  (select count(*) from processes) as total_processes,
  coalesce(avg(qa.score::float / nullif(qa.total, 0)), 0) as avg_score,
  count(qa.id) as quiz_attempts,
  coalesce(max(qa.score::float / nullif(qa.total, 0)), 0) as best_score,
  max(qa.created_at) as last_attempt_at
from profiles p
left join progress pr on pr.user_id = p.id
left join quiz_attempts qa on qa.user_id = p.id
where p.role = 'student'
group by p.id, p.full_name, p.class_code, p.streak_days;

-- ============================================================
-- Auto-create a profile row whenever a new auth user signs up.
--
-- Necessary because when "Confirm email" is enabled (Supabase's default),
-- auth.signUp() returns no active session until the email is confirmed —
-- so a client-side insert into `profiles` right after signUp() would run
-- unauthenticated and get rejected by the RLS policy above. This trigger
-- runs as SECURITY DEFINER (bypassing RLS) inside the same transaction
-- GoTrue uses to create the auth.users row, so it's always in sync.
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role, class_code)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    coalesce(new.raw_user_meta_data ->> 'role', 'student'),
    coalesce(new.raw_user_meta_data ->> 'class_code', 'S.4 General')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
