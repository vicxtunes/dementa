import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { TOKEN_RULES, type TokenReason } from "@/lib/config/tokens";

type Admin = ReturnType<typeof createAdminClient>;

/** Whether the service-role key is configured. When false, token operations
 *  are skipped (the app still works; the economy is just inert). */
export function tokensEnabled(): boolean {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

async function delta(
  admin: Admin,
  userId: string,
  amount: number,
  reason: TokenReason,
  referenceId: string | null,
  dedup: boolean
): Promise<number | null> {
  const { data, error } = await admin.rpc("apply_token_delta", {
    p_user_id: userId,
    p_amount: amount,
    p_reason: reason,
    p_reference_id: referenceId,
    p_dedup: dedup,
  });
  if (error) {
    console.error("apply_token_delta failed", { reason, referenceId, error });
    return null;
  }
  return typeof data === "number" ? data : null;
}

/**
 * Credits the mastery reward for a topic, once. Returns the amount awarded
 * (0 if already claimed / tokens disabled) and the resulting balance.
 */
export async function awardTopicMastery(opts: {
  userId: string;
  topicId: string;
  tokenRewardBase: number;
  firstAttempt: boolean;
}): Promise<{ awarded: number; balance: number | null }> {
  if (!tokensEnabled()) return { awarded: 0, balance: null };
  const admin = createAdminClient();

  const multiplier = opts.firstAttempt
    ? TOKEN_RULES.earn.firstAttemptMultiplier
    : TOKEN_RULES.earn.reMasteryMultiplier;
  const amount = Math.max(1, Math.round(opts.tokenRewardBase * multiplier));

  // Already credited for this topic? apply_token_delta dedups, but check
  // first so we can report awarded = 0 accurately.
  const { data: existing } = await admin
    .from("token_transactions")
    .select("id")
    .eq("user_id", opts.userId)
    .eq("reason", "topic_mastered")
    .eq("reference_id", opts.topicId)
    .maybeSingle();
  if (existing) {
    const { data } = await admin
      .from("profiles")
      .select("token_balance")
      .eq("id", opts.userId)
      .single<{ token_balance: number }>();
    return { awarded: 0, balance: data?.token_balance ?? null };
  }

  const balance = await delta(
    admin,
    opts.userId,
    amount,
    "topic_mastered",
    opts.topicId,
    true
  );
  return { awarded: balance == null ? 0 : amount, balance };
}

/** Teacher manually grants tokens to a student. */
export async function grantByTeacher(opts: {
  studentId: string;
  amount: number;
  note?: string;
}): Promise<number | null> {
  if (!tokensEnabled()) return null;
  const admin = createAdminClient();
  return delta(admin, opts.studentId, opts.amount, "teacher_grant", opts.note ?? null, false);
}

/**
 * Credits the completion reward for an exam / paper, once per paper regardless
 * of how many revision retakes the student does (dedup key = assessmentId).
 */
export async function awardAssessmentCompletion(opts: {
  userId: string;
  assessmentId: string;
  amount: number;
}): Promise<{ awarded: number; balance: number | null }> {
  if (!tokensEnabled() || opts.amount <= 0) return { awarded: 0, balance: null };
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("token_transactions")
    .select("id")
    .eq("user_id", opts.userId)
    .eq("reason", "assessment_completed")
    .eq("reference_id", opts.assessmentId)
    .maybeSingle();
  if (existing) {
    const { data } = await admin
      .from("profiles")
      .select("token_balance")
      .eq("id", opts.userId)
      .single<{ token_balance: number }>();
    return { awarded: 0, balance: data?.token_balance ?? null };
  }

  const balance = await delta(
    admin,
    opts.userId,
    opts.amount,
    "assessment_completed",
    opts.assessmentId,
    true
  );
  return { awarded: balance == null ? 0 : opts.amount, balance };
}
