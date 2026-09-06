-- ============================================================================
-- 012 — Paper economy: attempt cost + score-gated reward
--
--   * `assessments.pass_pct` — the fraction of total marks a student must reach
--     for the completion reward to pay out (default 0.8). `token_cost_to_attempt`
--     already exists (004) — it is now actually charged on start.
--   * new token reasons `assessment_entry` / `assessment_refund`.
--
-- Run AFTER 011. Safe to re-run.
-- ============================================================================

begin;

alter table assessments add column if not exists pass_pct numeric not null default 0.8;
alter table assessments drop constraint if exists assessments_pass_pct_check;
alter table assessments add constraint assessments_pass_pct_check
  check (pass_pct >= 0 and pass_pct <= 1);

alter table token_transactions drop constraint if exists token_transactions_reason_check;
alter table token_transactions add constraint token_transactions_reason_check
  check (reason in (
    'topic_mastered', 'assessment_completed', 'assessment_entry', 'assessment_refund',
    'streak_bonus', 'teacher_grant',
    'duel_entry', 'duel_refund', 'duel_payout',
    'group_quiz_entry', 'group_quiz_payout', 'group_quiz_refund',
    'challenge_prize', 'unlock_purchase'
  ));

commit;
