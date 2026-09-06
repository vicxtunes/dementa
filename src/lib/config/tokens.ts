/**
 * Every number in the token economy lives here. Starting defaults, meant to be
 * tuned — nothing else in the app should hardcode a token amount or a threshold.
 */
export const TOKEN_RULES = {
  /** Fraction of a topic's questions correct needed to "master" it. */
  passThreshold: 0.6,

  earn: {
    /** Fallback when a topic has no `token_reward_base`. */
    topicMasteryBase: 5,
    /** Multiplier when a topic is mastered on the very first attempt. */
    firstAttemptMultiplier: 1,
    /** Multiplier when a topic is re-mastered after a previous score drop. */
    reMasteryMultiplier: 0.5,
    /** Fallback paper (assessment) completion reward. */
    paperCompletion: 10,
    /** Award a streak bonus every N consecutive active days. */
    streakMilestoneEvery: 3,
    streakMilestoneBonus: 5,
  },

  spend: {
    // Default to a free duel / team quiz — a student with a zero balance can
    // still play. Staking tokens is opt-in.
    duelStakeDefault: 0,
    groupQuizStakePerMemberDefault: 0,
    /** Winner's cut of a staked duel/group pot; the rest is the house rake. */
    winnerPotShare: 0.8,
  },
} as const;

/**
 * Did this quiz attempt master the topic? Uses `passThreshold`, but a short
 * quiz always passes on "all but one" so a single slip on a 3–5 question set
 * isn't a wall.
 */
export function quizPassed(score: number, total: number): boolean {
  if (total <= 0) return false;
  if (total <= 5 && total - score <= 1) return true;
  return score / total >= TOKEN_RULES.passThreshold;
}

export type TokenReason =
  | "topic_mastered"
  | "assessment_completed"
  | "assessment_entry"
  | "assessment_refund"
  | "streak_bonus"
  | "teacher_grant"
  | "duel_entry"
  | "duel_refund"
  | "duel_payout"
  | "group_quiz_entry"
  | "group_quiz_payout"
  | "group_quiz_refund"
  | "challenge_prize"
  | "unlock_purchase";

export const TOKEN_REASON_LABELS: Record<TokenReason, string> = {
  topic_mastered: "Topic mastered",
  assessment_completed: "Exam / paper reward",
  assessment_entry: "Exam / paper entry",
  assessment_refund: "Exam / paper refund",
  streak_bonus: "Streak bonus",
  teacher_grant: "Teacher grant",
  duel_entry: "Duel stake",
  duel_refund: "Duel refund",
  duel_payout: "Duel winnings",
  group_quiz_entry: "Group quiz stake",
  group_quiz_payout: "Group quiz winnings",
  group_quiz_refund: "Group quiz refund",
  challenge_prize: "Challenge prize",
  unlock_purchase: "Unlock",
};
