# Platform Pivot: Multi-Subject Academic App with Token Economy

Give this to Claude Code alongside the existing repo (the "Industrial Processes" Chemistry app built earlier). This document describes a re-scoping: the app is no longer Chemistry-only — it's a general academic app that bridges the gap between students and school during holidays or any time off class. Chemistry's Industrial Processes content becomes the **first subject module**, not the whole app. Everything in the app now runs on a token economy.

No AI/LLM content generation is used anywhere in this plan.

---

## 1. What changed and why

Same student base, bigger ambition: instead of one Chemistry sprint, the app hosts multiple subjects, each with its own set of "Challenges" (what we previously called "processes") and assessments. A token economy sits across all of it — tokens are earned by doing academic work and spent on the more social/competitive features (duels, team quizzes) and unlocks. This keeps the earning side purely tied to learning effort, and the spending side tied to the fun/social layer, so tokens can't be gamed into rewards without actually doing the academic work first.

---

## 2. Core concepts (generalized data model)

| Old concept (Chemistry-only) | New concept (generic) |
|---|---|
| The Chemistry app itself | One **Subject** among several |
| A "process" (e.g. Manufacture of Oxygen) | A **Challenge** — a unit of content + its quiz bank, belonging to a subject |
| The 8-day plan | A subject-specific **pacing plan** (optional — not every subject needs a fixed day sequence; Chemistry keeps its 8-day rail, other subjects can just list challenges freely) |
| Quiz questions per process | Quiz questions per challenge — same shape as before, but a question now also needs a `question_type` (`multiple_choice` or `numeric`) to support subjects like Math where answers are numbers, not options (see Section 6) |
| Past papers (Chemistry-specific) | **Assessments** — a generic type covering past papers, timed exams, or any bigger graded piece of work, per subject |
| Versus (1v1 duel) | Unchanged, but now scoped to a subject + challenge(s) within it, and costs tokens to start |
| — (new) | **Team Quizzes** — groups vs. groups, see Section 6 |
| — (new) | **Token wallet** — every student has a balance, every earn/spend is logged |

---

## 3. Database schema — new and changed tables

```sql
-- ============================================================
-- Subjects (Chemistry is the first row; Math, etc. added later)
-- ============================================================
create table subjects (
  id text primary key,          -- slug, e.g. 'chemistry', 'math'
  title text not null,
  description text,
  icon text,                    -- e.g. an emoji or short label for UI
  created_at timestamptz default now()
);

alter table subjects enable row level security;
create policy "Everyone can read subjects" on subjects for select using (true);
create policy "Teachers can manage subjects" on subjects for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'teacher'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'teacher'));

-- ============================================================
-- Challenges — generalizes the old "processes" table
-- ============================================================
-- Rename/migrate the existing `processes` table to `challenges`, adding subject_id
-- and making `day` optional (only meaningful for subjects with a fixed pacing plan).
create table challenges (
  id text primary key,               -- keep existing slugs (e.g. 'oxygen') for Chemistry rows
  subject_id text references subjects(id) on delete cascade,
  day int,                           -- nullable: only used by subjects with a fixed sprint (e.g. Chemistry's 8-day plan)
  title text not null,
  raw_materials text[] default '{}',    -- Chemistry-specific fields stay as-is;
  steps text[] default '{}',            -- other subjects can leave these empty and
  equations text[] default '{}',        -- rely on a generic `content` field instead
  side_effects jsonb default '[]',
  social_benefits text[] default '{}',
  flashcards jsonb default '[]',
  content jsonb default '{}',         -- free-form per-subject content for non-Chemistry challenges
  token_reward_base int not null default 5   -- base tokens for mastering this challenge (see Section 5)
);

alter table challenges enable row level security;
create policy "Everyone can read challenges" on challenges for select using (true);
create policy "Teachers can manage challenges" on challenges for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'teacher'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'teacher'));

-- ============================================================
-- Quiz questions — same as before, plus question_type for numeric answers
-- ============================================================
-- Rename the existing `process_id` column to `challenge_id`.
alter table quiz_questions rename column process_id to challenge_id;
alter table quiz_questions add column question_type text not null default 'multiple_choice'
  check (question_type in ('multiple_choice', 'numeric'));
alter table quiz_questions add column correct_numeric_value numeric;   -- used when question_type = 'numeric'
alter table quiz_questions add column numeric_tolerance numeric default 0.01; -- acceptable margin of error
alter table quiz_questions alter column options drop not null;         -- not required for numeric questions
alter table quiz_questions alter column correct_index drop not null;   -- not required for numeric questions

-- ============================================================
-- Assessments — generalizes the past-papers idea to any subject
-- ============================================================
create table assessments (
  id uuid primary key default gen_random_uuid(),
  subject_id text references subjects(id) on delete cascade,
  title text not null,
  assessment_type text not null check (assessment_type in ('past_paper', 'timed_exam')),
  source text,                       -- e.g. "AITEL Joint Mocks 2025"
  token_cost_to_attempt int not null default 0,
  token_reward_on_completion int not null default 10,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

alter table assessments enable row level security;
create policy "Everyone can read assessments" on assessments for select using (true);
create policy "Teachers can manage assessments" on assessments for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'teacher'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'teacher'));

-- One row per scenario/item within an assessment (same shape as the earlier past-paper design)
create table assessment_items (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid references assessments(id) on delete cascade,
  item_number int not null,
  section text,
  part text,
  scenario text not null,
  sub_questions jsonb not null default '[]'
  -- [{ "label": "i", "prompt": "...", "model_answer": "..." }, ...]
);

alter table assessment_items enable row level security;
create policy "Everyone can read assessment items" on assessment_items for select using (true);
create policy "Teachers can manage assessment items" on assessment_items for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'teacher'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'teacher'));

create table assessment_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  assessment_id uuid references assessments(id) on delete cascade,
  answers jsonb not null default '{}',   -- { item_id: { "i": "text", "ii": "text" } }
  self_marked_done boolean not null default false,
  token_awarded boolean not null default false,  -- prevents double-claiming the completion reward
  updated_at timestamptz default now(),
  unique (user_id, assessment_id)
);

alter table assessment_submissions enable row level security;
create policy "Users manage their own assessment submissions" on assessment_submissions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Teachers can read class assessment submissions" on assessment_submissions for select
  using (exists (
    select 1 from profiles p where p.id = auth.uid() and p.role = 'teacher'
    and p.class_code = (select class_code from profiles where id = assessment_submissions.user_id)
  ));

-- ============================================================
-- Token economy
-- ============================================================
alter table profiles add column token_balance int not null default 0;

create table token_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  amount int not null,              -- positive = earned, negative = spent
  reason text not null check (reason in (
    'challenge_mastered', 'assessment_completed', 'streak_bonus', 'teacher_grant',
    'versus_entry', 'team_quiz_entry', 'unlock_purchase'
  )),
  reference_id text,                 -- id of the challenge/assessment/duel/etc, for audit purposes
  created_at timestamptz default now()
);

alter table token_transactions enable row level security;
create policy "Users can read their own transactions" on token_transactions for select
  using (auth.uid() = user_id);
create policy "Teachers can read class transactions" on token_transactions for select
  using (exists (
    select 1 from profiles p where p.id = auth.uid() and p.role = 'teacher'
    and p.class_code = (select class_code from profiles where id = token_transactions.user_id)
  ));
-- Transactions are only ever inserted by server-side logic (a Route Handler using the service-role key),
-- never directly by the client, so there is no client-facing insert policy here. This prevents a student
-- from crediting themselves tokens by calling the table directly.

-- ============================================================
-- Team quizzes — groups vs. groups, same spirit as Versus
-- ============================================================
create table teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  class_code text not null,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

alter table teams enable row level security;
create policy "Users can see teams in their class" on teams for select
  using (class_code = (select class_code from profiles where id = auth.uid()));
create policy "Users can create teams in their class" on teams for insert
  with check (class_code = (select class_code from profiles where id = auth.uid()));

create table team_members (
  team_id uuid references teams(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  primary key (team_id, user_id)
);

alter table team_members enable row level security;
create policy "Users can see team membership in their class" on team_members for select
  using (exists (select 1 from teams t where t.id = team_members.team_id
    and t.class_code = (select class_code from profiles where id = auth.uid())));
create policy "Users can join/leave teams themselves" on team_members for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table team_quizzes (
  id uuid primary key default gen_random_uuid(),
  team_a_id uuid references teams(id) on delete cascade,
  team_b_id uuid references teams(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'active', 'completed', 'declined')),
  settings jsonb not null,
  -- { "subject_id": "chemistry", "challenge_ids": [...], "question_count": 10,
  --   "time_limit_seconds": 20, "token_entry_cost": 5 }
  question_ids uuid[] not null,
  -- Per-member answers, keyed by user id, same record shape as duel answers:
  member_answers jsonb not null default '{}',  -- { user_id: [{question_id, selected_index_or_value, correct, time_taken_seconds}] }
  team_a_score int,
  team_b_score int,
  winner_team_id uuid references teams(id),
  created_at timestamptz default now(),
  completed_at timestamptz
);

alter table team_quizzes enable row level security;
create policy "Team members can see their team quizzes" on team_quizzes for select
  using (exists (select 1 from team_members tm where tm.user_id = auth.uid()
    and tm.team_id in (team_a_id, team_b_id)));
create policy "Team members can update their team quizzes" on team_quizzes for update
  using (exists (select 1 from team_members tm where tm.user_id = auth.uid()
    and tm.team_id in (team_a_id, team_b_id)));
create policy "Team members can create team quizzes for their own team" on team_quizzes for insert
  with check (exists (select 1 from team_members tm where tm.user_id = auth.uid() and tm.team_id = team_a_id));
```

### Migration note for the existing Chemistry data

The existing `processes` table becomes `challenges` with `subject_id = 'chemistry'`. Concretely: rename the table, add the `subject_id` and `content` columns, and insert one row into `subjects` for Chemistry. The existing 11 processes, their quiz questions, flashcards, and the 8-day plan all carry over unchanged — Chemistry keeps its fixed 8-day rail; it's just now one subject among several rather than the whole app.

---

## 4. Question types — supporting numeric answers (e.g. Trigonometry)

Following on from the earlier discussion about trig-style questions: a challenge in a Math subject can have `question_type = 'numeric'` questions instead of multiple choice. For these:

- The student answer input is a small on-screen math keypad (buttons for `sin cos tan`, `π`, `√`, `°`, fraction bar, `x²`) feeding into a live-rendered math field (e.g. using MathQuill or KaTeX for display), not a plain text box.
- Grading: parse whatever the student enters (e.g. `√3/2`, `0.866`, `sqrt(3)/2`) using a math expression library (e.g. **mathjs**, already listed as an available library), evaluate it to a plain number, and mark correct if `abs(evaluated - correct_numeric_value) <= numeric_tolerance`.
- This does not require a full computer algebra system — numeric-tolerance comparison covers the large majority of real trig/arithmetic questions (angles, ratios, side lengths). Full symbolic equivalence (accepting any algebraically-equivalent rearrangement of an expression) is out of scope for this version.

---

## 5. Token economy — earning and spending rules

Tokens are only ever awarded by trusted server-side logic (a Next.js Route Handler using the Supabase service-role key), never inserted directly by the client, to prevent a student from crediting themselves. Every award or spend is logged as a row in `token_transactions`.

### Earning

| Action | Reward |
|---|---|
| Mastering a challenge (quiz score ≥ 80%, first time only) | The challenge's `token_reward_base` (default 5), scaled up slightly for a first-attempt pass vs. a retake — e.g. full reward on first mastery, half reward on any subsequent re-mastery after a score drop |
| Completing an assessment (self-marked as done) | The assessment's `token_reward_on_completion` (default 10) |
| Daily activity streak (already tracked via `profiles.streak_days`) | A small flat bonus every few days of consecutive activity (e.g. +5 tokens every 3-day streak milestone) — exact cadence is a tuning knob, not fixed here |
| Teacher grant | A teacher can manually award tokens to a student (e.g. for effort not captured elsewhere) via the teacher dashboard |

### Spending

| Action | Cost |
|---|---|
| Starting a Versus duel | A small fixed cost (e.g. 5 tokens), paid by the challenger when the duel is created; refunded if the opponent declines |
| Starting/joining a Team Quiz | A fixed cost per participating member (e.g. 5 tokens each), deducted when the team quiz is created/accepted |
| Unlocks (future) | Placeholder for later ideas — e.g. unlocking a bonus subject early, cosmetic profile badges, or a hint reveal inside an assessment. Not required for this version; just leave the `unlock_purchase` reason in the schema so it's ready. |

All specific numbers above are starting defaults, not fixed rules — make them easy to tune (e.g. a small `token_rules` config object in code) rather than hardcoding them throughout the UI.

### Displaying the balance

Show the student's `token_balance` in the dashboard header, next to their name, at all times — this is the core feedback loop of the whole economy, so it needs to be visible everywhere, not buried in a settings page.

---

## 6. Team Quizzes — pages and flow

Modeled closely on the existing Versus duel, but team-sized:

| Route | Purpose |
|---|---|
| `/teams` | Create a team (name it) or join an existing team in your class. Shows your current team(s) and members. |
| `/team-quizzes` | Hub, parallel to `/versus`: pick your team, an opposing team, a subject, challenge(s) within it, question count, optional timer. On creation, deduct the entry cost in tokens from every member of the initiating team (via the server-side token logic — this needs a Route Handler, not a direct client insert, since it touches multiple users' balances atomically). |
| `/team-quizzes/[id]` | Each team member answers the same fixed question set independently (same async-friendly model as Versus). A team's score is the sum (or average — pick one and be consistent) of its members' correct answers. Once all members of both teams have finished, resolve the winner by comparing team scores, and pay out any completion-based token rewards. |

Reuse the Versus scoring approach (from the earlier feature addendum) at the individual level, then aggregate to the team level for the final result.

---

## 7. Acceptance checklist for this pivot

- [ ] `subjects` table exists with at least a `chemistry` row; Chemistry's existing 11 challenges, quiz questions, and 8-day plan all still work exactly as before, now under `subject_id = 'chemistry'`
- [ ] A student's `token_balance` is visible on the dashboard at all times and updates immediately after any earning/spending action
- [ ] Mastering a challenge for the first time credits the correct token reward exactly once (no duplicate credit on repeat attempts unless it's a genuine re-mastery after a score drop)
- [ ] Token awards/spends are only ever performed server-side (Route Handlers with the service role key); there is no client-side Supabase call that directly inserts into `token_transactions` or updates `token_balance`
- [ ] Starting a Versus duel deducts the entry cost from the challenger and refunds it if the opponent declines
- [ ] A numeric-type quiz question (e.g. a trig question) can be answered via the on-screen math keypad, is graded within its numeric tolerance, and multiple equivalent input forms (e.g. `√3/2`, `0.866`) are all marked correct
- [ ] A team can be created, joined, and used to start a Team Quiz against another team; entry cost is deducted from every participating member; the result resolves correctly once all members on both sides have played
- [ ] Existing RLS boundaries (a student can't read another student's data unless a teacher) are preserved across every new table
