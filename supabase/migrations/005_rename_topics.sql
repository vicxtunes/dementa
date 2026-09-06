-- ============================================================================
-- 005 — Rename "challenges" (the study unit) to "topics"
--
-- "A challenge is a challenge, not a subject." A Subject holds Topics; the word
-- Challenge is reserved for time-boxed prize events (migration 006). This
-- renames the study-unit table + its foreign keys and widens the token ledger's
-- reason set for duels / group quizzes / event prizes.
--
-- Run AFTER 002, 003, 004. Guarded for safe partial re-runs. Ships with the M1
-- app code (routes /subjects/[id]/topics/[topicId]).
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1. challenges -> topics  (+ dependent columns)
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from information_schema.tables
             where table_schema = 'public' and table_name = 'challenges')
     and not exists (select 1 from information_schema.tables
             where table_schema = 'public' and table_name = 'topics') then
    alter table challenges rename to topics;
  end if;
end $$;

do $$
begin
  if exists (select 1 from information_schema.columns
             where table_name = 'quiz_questions' and column_name = 'challenge_id')
     and not exists (select 1 from information_schema.columns
             where table_name = 'quiz_questions' and column_name = 'topic_id') then
    alter table quiz_questions rename column challenge_id to topic_id;
  end if;
  if exists (select 1 from information_schema.columns
             where table_name = 'quiz_attempts' and column_name = 'challenge_id')
     and not exists (select 1 from information_schema.columns
             where table_name = 'quiz_attempts' and column_name = 'topic_id') then
    alter table quiz_attempts rename column challenge_id to topic_id;
  end if;
  if exists (select 1 from information_schema.columns
             where table_name = 'progress' and column_name = 'challenge_id')
     and not exists (select 1 from information_schema.columns
             where table_name = 'progress' and column_name = 'topic_id') then
    alter table progress rename column challenge_id to topic_id;
  end if;
end $$;

-- Rename the RLS policy for clarity (behaviour identical).
drop policy if exists "Read challenges for your class" on topics;
drop policy if exists "Teachers can manage challenges" on topics;
create policy "Read topics for your class" on topics for select
  using (class_code is null or class_code = public.my_class_code());
create policy "Teachers can manage topics" on topics for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'teacher'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'teacher'));

-- ---------------------------------------------------------------------------
-- 2. Token ledger — rename the mastery reason, add duel / group / prize reasons
-- ---------------------------------------------------------------------------
update token_transactions set reason = 'topic_mastered' where reason = 'challenge_mastered';

alter table token_transactions drop constraint if exists token_transactions_reason_check;
alter table token_transactions add constraint token_transactions_reason_check
  check (reason in (
    'topic_mastered', 'assessment_completed', 'streak_bonus', 'teacher_grant',
    'duel_entry', 'duel_refund', 'duel_payout',
    'group_quiz_entry', 'group_quiz_payout',
    'challenge_prize', 'unlock_purchase'
  ));

-- ---------------------------------------------------------------------------
-- 3. Resources — attach to a topic, and type them.
--    topics.id is a text slug, so topic_id is text (not uuid).
-- ---------------------------------------------------------------------------
alter table resources add column if not exists topic_id text;
alter table resources add column if not exists kind text not null default 'note';
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'resources_kind_check') then
    alter table resources add constraint resources_kind_check
      check (kind in ('note', 'past_paper', 'link'));
  end if;
  if not exists (select 1 from information_schema.table_constraints
                 where constraint_name = 'resources_topic_id_fkey') then
    alter table resources add constraint resources_topic_id_fkey
      foreign key (topic_id) references topics(id) on delete set null;
  end if;
end $$;

-- If 004 was applied before this fix, `matches.topic_ids` may be uuid[]; the
-- slugs it must hold are text. Safe to re-run (identity cast when already text).
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_name = 'matches' and column_name = 'topic_ids'
               and data_type = 'ARRAY' and udt_name = '_uuid') then
    alter table matches alter column topic_ids type text[] using topic_ids::text[];
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 4. class_overview — the joins now name topics; drop + recreate.
-- ---------------------------------------------------------------------------
drop view if exists class_overview;
create view class_overview as
select
  p.id as user_id,
  p.full_name,
  p.class_code,
  p.streak_days,
  count(distinct case when pr.quiz_passed then pr.topic_id end) as topics_mastered,
  (select count(*) from topics) as total_topics,
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
