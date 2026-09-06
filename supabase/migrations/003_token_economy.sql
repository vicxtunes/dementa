-- ============================================================================
-- 003 — Token economy
--
-- Part of the platform pivot (docs/platform-pivot-tokens-and-subjects.md).
-- Run ONCE in the Supabase SQL editor AFTER 002, and TOGETHER WITH the Phase 2
-- app code (the /api/quiz-submissions Route Handler). Between running this and
-- deploying that handler, the client can no longer mark challenge mastery — the
-- guard trigger below only lets the service role set progress.quiz_passed.
--
-- Requires SUPABASE_SERVICE_ROLE_KEY in the app environment.
-- ============================================================================

begin;

alter table profiles add column if not exists token_balance int not null default 0;

-- ---------------------------------------------------------------------------
-- Ledger — append-only; balance on profiles is a running projection.
-- ---------------------------------------------------------------------------
create table if not exists token_transactions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references profiles(id) on delete cascade,
  amount       int not null,               -- + earned, - spent
  reason       text not null check (reason in (
                 'challenge_mastered', 'assessment_completed', 'streak_bonus',
                 'teacher_grant', 'versus_entry', 'versus_refund', 'versus_payout',
                 'team_quiz_entry', 'team_quiz_payout', 'unlock_purchase')),
  reference_id text,
  created_at   timestamptz default now()
);
create index if not exists token_transactions_user_idx  on token_transactions (user_id, created_at desc);
create index if not exists token_transactions_dedup_idx on token_transactions (user_id, reason, reference_id);

alter table token_transactions enable row level security;

drop policy if exists "Users can read their own transactions" on token_transactions;
create policy "Users can read their own transactions" on token_transactions for select
  using (auth.uid() = user_id);

drop policy if exists "Teachers can read class transactions" on token_transactions;
create policy "Teachers can read class transactions" on token_transactions for select
  using (exists (
    select 1 from profiles p where p.id = auth.uid() and p.role = 'teacher'
    and p.class_code = (select class_code from profiles where id = token_transactions.user_id)
  ));
-- No insert/update/delete policy: writes happen only via the service role
-- (Next.js Route Handlers), so a student can never credit themselves.

-- ---------------------------------------------------------------------------
-- Atomic ledger primitive. The Route Handler (service role) calls this via
-- rpc(); it inserts the transaction and moves the balance in one statement.
-- p_dedup = true makes repeated (user, reason, reference_id) awards a no-op
-- (used for one-time rewards like first-mastery).
-- ---------------------------------------------------------------------------
create or replace function public.apply_token_delta(
  p_user_id uuid,
  p_amount int,
  p_reason text,
  p_reference_id text default null,
  p_dedup boolean default false
) returns int language plpgsql security definer set search_path = public as $$
declare
  v_balance int;
begin
  if p_dedup and exists (
    select 1 from token_transactions
    where user_id = p_user_id and reason = p_reason
      and reference_id is not distinct from p_reference_id
  ) then
    select token_balance into v_balance from profiles where id = p_user_id;
    return coalesce(v_balance, 0);
  end if;

  insert into token_transactions (user_id, amount, reason, reference_id)
  values (p_user_id, p_amount, p_reason, p_reference_id);

  update profiles set token_balance = token_balance + p_amount
  where id = p_user_id
  returning token_balance into v_balance;

  return v_balance;
end $$;

revoke execute on function public.apply_token_delta(uuid, int, text, text, boolean)
  from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Hardening: only the service role may set progress.quiz_passed = true, so a
-- student can't self-mark mastery (and trigger a token award) by writing the
-- progress row directly. /api/quiz-submissions runs as the service role.
-- ---------------------------------------------------------------------------
create or replace function public.guard_progress_quiz_passed()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if coalesce(current_setting('request.jwt.claims', true)::jsonb ->> 'role', '') = 'service_role' then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.quiz_passed := false;
  else
    new.quiz_passed := old.quiz_passed;
  end if;
  return new;
end $$;

drop trigger if exists progress_guard_quiz_passed on progress;
create trigger progress_guard_quiz_passed
  before insert or update on progress
  for each row execute function public.guard_progress_quiz_passed();

-- ---------------------------------------------------------------------------
-- class_overview — add the balance so the teacher table can show it.
-- Drop + recreate (not `create or replace`) because adding a column changes the
-- column list, which `create or replace view` rejects.
-- ---------------------------------------------------------------------------
drop view if exists class_overview;
create view class_overview as
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
  max(qa.created_at) as last_attempt_at,
  p.token_balance
from profiles p
left join progress pr on pr.user_id = p.id
left join quiz_attempts qa on qa.user_id = p.id
where p.role = 'student'
group by p.id, p.full_name, p.class_code, p.streak_days, p.token_balance;

commit;
