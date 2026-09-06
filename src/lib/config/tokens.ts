/**
 * Every number in the token economy lives here. Starting defaults, meant to be
 * tuned — nothing else in the app should hardcode a token amount or a threshold.
 */
export const TOKEN_RULES = {
  /** Fraction of a topic's questions correct needed to "master" it. */
  passThreshold: 0.8,

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
    duelStakeDefault: 5,
    groupQuizStakePerMemberDefault: 5,
  },
} as const;

export type TokenReason =
  | "topic_mastered"
  | "assessment_completed"
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
  assessment_completed: "Paper completed",
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
