-- ============================================================
-- Run this ONE file now. It's safe to run even if some of it was
-- already applied — every statement uses create-or-replace / drop-if-
-- exists, so re-running does nothing destructive.
--
-- Combines two fixes:
--   1. handle_new_user trigger — auto-creates a `profiles` row when a
--      new auth user signs up. Without this, sign-up creates the auth
--      user but no profile, so every page that reads `profiles` (which
--      is all of them) comes back empty.
--   2. my_class_code() + the profiles SELECT policy fix — resolves
--      "infinite recursion detected in policy for relation profiles".
-- ============================================================

-- 1. Auto-create profile on sign-up
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
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. Fix infinite recursion in the profiles SELECT policy
create or replace function public.my_class_code()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select class_code from public.profiles where id = auth.uid();
$$;

drop policy if exists "Users can view profiles in their class" on profiles;
create policy "Users can view profiles in their class"
on profiles for select
using (
  class_code = public.my_class_code()
);

-- 3. Backfill: create profiles for any auth users the trigger missed
-- (e.g. the rate-limit / recursion test accounts created earlier),
-- defaulting role to student and class_code to 'S.4 General' since their
-- original signup metadata is gone.
insert into public.profiles (id, full_name, role, class_code)
select u.id, u.raw_user_meta_data ->> 'full_name', 'student', 'S.4 General'
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;

-- 3b. There is one class for everyone now — move every existing profile
-- (students and the teacher) onto 'S.4 General'.
update public.profiles set class_code = 'S.4 General' where class_code <> 'S.4 General';

-- 4. Refresh the teacher dashboard view with the extra monitoring columns
-- (best score, attempt count, last attempt). Re-runnable; only appends
-- columns so `create or replace view` is safe.
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
