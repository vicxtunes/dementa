-- ============================================================================
-- 008 — Add the 'group_quiz_refund' token reason
--
-- Team quizzes need a refund path, mirroring 'duel_refund': when a whole team
-- declines a pending team quiz, everyone who already paid the entry cost is
-- refunded. Run AFTER 005. Safe to re-run.
-- ============================================================================

begin;

alter table token_transactions drop constraint if exists token_transactions_reason_check;
alter table token_transactions add constraint token_transactions_reason_check
  check (reason in (
    'topic_mastered', 'assessment_completed', 'streak_bonus', 'teacher_grant',
    'duel_entry', 'duel_refund', 'duel_payout',
    'group_quiz_entry', 'group_quiz_payout', 'group_quiz_refund',
    'challenge_prize', 'unlock_purchase'
  ));

commit;
