# Supabase migrations

Run **in order** in the Supabase SQL editor. Each is guarded for safe re-runs.

| # | File | What | Status |
|---|---|---|---|
| 001 | `../schema.sql` → `../fix-auth-issues.sql` → `../create-teacher.sql` | Original schema: `profiles`, `processes`, `quiz_questions`, `quiz_attempts`, `progress`, `class_overview`, signup trigger, `my_class_code()`, teacher account. | applied |
| 002 | `002_subjects_and_classes.sql` | `subjects`, managed `classes`, `processes`→`challenges` (+ `subject_id`/`class_code`/`content`/`token_reward_base`), `quiz_questions` numeric columns, `progress`/`quiz_attempts` renames, `resources`. | applied |
| 003 | `003_token_economy.sql` | `profiles.token_balance`, `token_transactions` ledger, `apply_token_delta()`, the `progress.quiz_passed` guard trigger. Needs `SUPABASE_SERVICE_ROLE_KEY`. | applied |
| 004 | `004_assessments_and_matches.sql` | Papers (`assessments*`), `teams`/`team_members`, the unified `matches`/`match_teams`/`match_participants` engine. | applied |
| 005 | `005_rename_topics.sql` | `challenges`→`topics`, `challenge_id`→`topic_id` everywhere; `token_transactions.reason` widened (`topic_mastered` + duel/group/prize); `resources` gets `topic_id`+`kind`; `class_overview`→`topics_mastered`. | applied |
| 006 | `006_match_rls_fix.sql` | Fixes the recursive RLS on `matches`/`match_participants`/`match_teams` from 004 (adds `my_match_ids()`), opens the accept/decline/answer lifecycle. **Run this.** | run for M4+ |
| 007 | `007_challenge_events.sql` | `challenges` (time-boxed prize events) + `challenge_entries` + `challenge_leaderboard` view + `close_expired_challenges()`. **Run this.** | run for M6 |
| 008 | `008_group_quiz_refund.sql` | Adds the `group_quiz_refund` token reason — team-quiz stakes are refunded when a whole team declines. **Run this** for the `/teams` + `/team-quizzes` feature. | run for team quizzes |
| 009 | `009_match_schema_sync.sql` | Reconciles drift: adds `matches.is_general`, `matches.topic_ids`, `match_participants.status` (the deployed DB predates them, breaking every non-solo match) and re-asserts the match RLS. **Run this** — unblocks 1v1 duels as well as team quizzes. | run for duels + team quizzes |

After any change to `src/lib/subjects/**`:

```bash
npm run generate-seed        # rewrites supabase/seed.sql (topics + quiz_questions)
```

then run `supabase/seed.sql` in the SQL editor.

## Optional: schedule the event close sweep

`close_expired_challenges()` flips expired open events to `closed` and pays the
prize. Wire it to a Supabase scheduled function (pg_cron) or call
`closeExpiredEvents()` from the teacher's Challenges page ("Run close sweep").
