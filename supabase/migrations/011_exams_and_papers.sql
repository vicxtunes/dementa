-- ============================================================================
-- 011 — Exams & Papers: real assessment workflow
--
-- Turns the thin self-marked "papers" feature into a full exam workflow:
--   * paper `format` (mcq / structured / short_answer / mixed) + per-item type
--   * `kind` (exam = strict timed, revision = lenient + retakes) + duration
--   * choice-rule sections ("answer N of M items")
--   * a HIDDEN marking key table (assessment_items is world-readable, so the
--     key cannot live on it)
--   * per-attempt state (assessment_attempts) replacing the single-row
--     assessment_submissions — supports revision retakes and a wall-clock timer
--   * an `assessment-media` storage bucket for support images
--
-- Run AFTER 010, by hand in the Supabase SQL editor. Every statement is
-- guarded for safe re-runs (010 lesson: `create table if not exists` never
-- updates an existing table, so columns/constraints are added explicitly).
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1. assessments — format / kind / duration / instructions
-- ---------------------------------------------------------------------------
alter table assessments add column if not exists format text not null default 'structured';
alter table assessments drop constraint if exists assessments_format_check;
alter table assessments add constraint assessments_format_check
  check (format in ('mcq', 'structured', 'short_answer', 'mixed'));

alter table assessments add column if not exists kind text not null default 'revision';
alter table assessments drop constraint if exists assessments_kind_check;
alter table assessments add constraint assessments_kind_check
  check (kind in ('exam', 'revision'));

alter table assessments add column if not exists duration_minutes int;   -- null = untimed
alter table assessments add column if not exists instructions text;
alter table assessments add column if not exists published boolean not null default true;

-- legacy assessment_type: keep the column & old values, but let the new
-- builder ignore it.
alter table assessments drop constraint if exists assessments_assessment_type_check;
alter table assessments alter column assessment_type drop not null;

-- ---------------------------------------------------------------------------
-- 2. assessment_sections — choice-rule groups
-- ---------------------------------------------------------------------------
create table if not exists assessment_sections (
  id            uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references assessments(id) on delete cascade,
  position      int  not null default 0,
  label         text not null,              -- "Section A", "Section B — Part I"
  instructions  text,                       -- "Answer all items", "Answer one item"
  pick_count    int,                        -- null = answer all M; N = pick N of M
  created_at    timestamptz default now()
);
create index if not exists assessment_sections_paper_idx
  on assessment_sections (assessment_id, position);

alter table assessment_sections enable row level security;
drop policy if exists "Read sections for visible papers" on assessment_sections;
create policy "Read sections for visible papers" on assessment_sections for select
  using (exists (
    select 1 from assessments a
    where a.id = assessment_sections.assessment_id
      and (a.class_code is null or a.class_code = public.my_class_code())
  ));
drop policy if exists "Teachers manage sections" on assessment_sections;
create policy "Teachers manage sections" on assessment_sections for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'teacher'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'teacher'));

-- ---------------------------------------------------------------------------
-- 3. assessment_items — type / section / task intro / options / images / marks
-- ---------------------------------------------------------------------------
alter table assessment_items add column if not exists question_type text not null default 'structured';
alter table assessment_items drop constraint if exists assessment_items_question_type_check;
alter table assessment_items add constraint assessment_items_question_type_check
  check (question_type in ('mcq', 'short_answer', 'structured'));

alter table assessment_items add column if not exists section_id uuid
  references assessment_sections(id) on delete set null;
alter table assessment_items add column if not exists position int not null default 0;
alter table assessment_items add column if not exists task_intro text;
alter table assessment_items add column if not exists mcq_options jsonb not null default '[]'::jsonb;  -- ["A ...", "B ..."]
alter table assessment_items add column if not exists images jsonb not null default '[]'::jsonb;       -- [{path, caption}]
alter table assessment_items add column if not exists max_marks int;   -- mcq/short: item marks; structured: Σ sub-part marks

-- sub_questions entries widen to { label, prompt, marks }. model_answer moves
-- out to assessment_item_keys.

-- ---------------------------------------------------------------------------
-- 4. assessment_item_keys — HIDDEN marking key (no student SELECT policy)
-- ---------------------------------------------------------------------------
create table if not exists assessment_item_keys (
  item_id          uuid primary key references assessment_items(id) on delete cascade,
  correct_option   int,                                  -- mcq: index into mcq_options
  expected_answer  text,                                  -- short_answer: canonical (null => self-marked)
  accepted_answers jsonb not null default '[]'::jsonb,    -- short_answer: extra accepted strings
  model_answers    jsonb not null default '{}'::jsonb,    -- structured: { label: "model answer" }
  updated_at       timestamptz default now()
);
alter table assessment_item_keys enable row level security;
drop policy if exists "Teachers manage item keys" on assessment_item_keys;
create policy "Teachers manage item keys" on assessment_item_keys for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'teacher'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'teacher'));
-- students: NO policy => zero rows. Grading + reveal read via the service role.

-- backfill: lift any inline model_answer out of sub_questions
insert into assessment_item_keys (item_id, model_answers)
select i.id,
       coalesce(
         jsonb_object_agg(sq->>'label', sq->>'model_answer')
           filter (where (sq ? 'model_answer') and coalesce(sq->>'model_answer', '') <> ''),
         '{}'::jsonb)
from assessment_items i
cross join lateral jsonb_array_elements(i.sub_questions) sq
where jsonb_typeof(i.sub_questions) = 'array'
group by i.id
on conflict (item_id) do nothing;

update assessment_items i
set sub_questions = (
  select coalesce(jsonb_agg(sq - 'model_answer'), '[]'::jsonb)
  from jsonb_array_elements(i.sub_questions) sq
)
where jsonb_typeof(i.sub_questions) = 'array'
  and exists (
    select 1 from jsonb_array_elements(i.sub_questions) sq where sq ? 'model_answer'
  );

-- ---------------------------------------------------------------------------
-- 5. assessment_attempts — one row per attempt
-- ---------------------------------------------------------------------------
create table if not exists assessment_attempts (
  id            uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references assessments(id) on delete cascade,
  user_id       uuid not null references profiles(id) on delete cascade,
  kind          text not null default 'revision',   -- snapshot of assessments.kind at start
  state         text not null default 'in_progress'
                  check (state in ('in_progress', 'submitted', 'self_marking', 'completed')),
  submitted_via text check (submitted_via in ('manual', 'timer')),
  started_at    timestamptz not null default now(),
  due_at        timestamptz,                          -- started_at + duration; null = untimed
  submitted_at  timestamptz,
  completed_at  timestamptz,
  answers       jsonb not null default '{}'::jsonb,   -- { itemId: <answer> }
  chosen_items  jsonb not null default '{}'::jsonb,   -- { sectionId: [itemId, ...] }
  self_marks    jsonb not null default '{}'::jsonb,   -- { itemId: { label: marks } }
  auto_score    int,  auto_max  int,
  self_score    int,  self_max  int,
  total_score   int,  total_max int,
  token_awarded boolean not null default false,
  updated_at    timestamptz not null default now()
);
create index if not exists assessment_attempts_user_idx
  on assessment_attempts (user_id, assessment_id, started_at desc);
-- one attempt per user for a graded exam; unlimited for revision
create unique index if not exists assessment_attempts_one_exam
  on assessment_attempts (user_id, assessment_id) where kind = 'exam';

alter table assessment_attempts enable row level security;
drop policy if exists "Students read their own attempts" on assessment_attempts;
create policy "Students read their own attempts" on assessment_attempts for select
  using (auth.uid() = user_id);
drop policy if exists "Teachers read class attempts" on assessment_attempts;
create policy "Teachers read class attempts" on assessment_attempts for select
  using (exists (
    select 1 from profiles p
    where p.id = auth.uid() and p.role = 'teacher'
      and p.class_code = (select class_code from profiles where id = assessment_attempts.user_id)
  ));
-- NO insert/update/delete policy: every mutation runs through a service-role
-- Route Handler (same hardening as token_transactions).

-- ---------------------------------------------------------------------------
-- 6. Sweep attempts whose timer expired while the tab was closed
-- ---------------------------------------------------------------------------
create or replace function public.close_expired_assessment_attempts()
returns int language plpgsql security definer set search_path = public as $$
declare v_count int;
begin
  with expired as (
    update assessment_attempts a
    set state = case when exists (
          select 1 from assessment_items it
          where it.assessment_id = a.assessment_id
            and it.question_type in ('structured', 'short_answer'))
        then 'submitted' else 'completed' end,
        submitted_via = 'timer',
        submitted_at  = coalesce(a.submitted_at, now()),
        updated_at    = now()
    where a.state = 'in_progress' and a.due_at is not null and a.due_at < now()
    returning 1)
  select count(*) into v_count from expired;
  return v_count;
end $$;
revoke execute on function public.close_expired_assessment_attempts() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 7. Storage: assessment-media bucket + policies
--    (If the SQL editor rejects the buckets insert, create the bucket in the
--     dashboard — public — and run only the storage.objects policies.)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('assessment-media', 'assessment-media', true)
on conflict (id) do nothing;

drop policy if exists "assessment-media public read" on storage.objects;
create policy "assessment-media public read" on storage.objects for select
  using (bucket_id = 'assessment-media');

drop policy if exists "assessment-media teacher insert" on storage.objects;
create policy "assessment-media teacher insert" on storage.objects for insert
  with check (bucket_id = 'assessment-media'
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'teacher'));

drop policy if exists "assessment-media teacher update" on storage.objects;
create policy "assessment-media teacher update" on storage.objects for update
  using (bucket_id = 'assessment-media'
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'teacher'));

drop policy if exists "assessment-media teacher delete" on storage.objects;
create policy "assessment-media teacher delete" on storage.objects for delete
  using (bucket_id = 'assessment-media'
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'teacher'));

commit;
