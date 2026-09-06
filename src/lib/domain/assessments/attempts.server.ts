import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { awardAssessmentCompletion, chargeAssessmentEntry } from "@/lib/domain/tokens/award.server";
import { computeDueAt, isExpired } from "./timing";
import { scoreAttempt, selfMarkScore } from "./grading";
import type {
  AttemptRow,
  PaperRow,
  PaperItem,
  ItemKey,
  AssessmentSection,
  ItemAnswer,
} from "./queries";

type Admin = ReturnType<typeof createAdminClient>;

const ITEM_COLUMNS =
  "id, assessment_id, section_id, item_number, position, section, part, question_type, scenario, task_intro, sub_questions, mcq_options, images, max_marks";

export type PaperBundle = {
  paper: PaperRow;
  sections: AssessmentSection[];
  items: PaperItem[];
  keys: Map<string, ItemKey>;
};

async function loadBundle(admin: Admin, paperId: string): Promise<PaperBundle | null> {
  const { data: paper } = await admin
    .from("assessments")
    .select("*")
    .eq("id", paperId)
    .maybeSingle<PaperRow>();
  if (!paper) return null;

  const [{ data: sections }, { data: items }] = await Promise.all([
    admin.from("assessment_sections").select("*").eq("assessment_id", paperId).order("position").returns<AssessmentSection[]>(),
    admin
      .from("assessment_items")
      .select(ITEM_COLUMNS)
      .eq("assessment_id", paperId)
      .order("position")
      .order("item_number")
      .returns<PaperItem[]>(),
  ]);
  const normItems = (items ?? []).map((r) => ({
    ...r,
    sub_questions: Array.isArray(r.sub_questions) ? r.sub_questions : [],
    mcq_options: Array.isArray(r.mcq_options) ? r.mcq_options : [],
    images: Array.isArray(r.images) ? r.images : [],
  }));

  const ids = normItems.map((i) => i.id);
  const keys = new Map<string, ItemKey>();
  if (ids.length) {
    const { data: keyRows } = await admin
      .from("assessment_item_keys")
      .select("*")
      .in("item_id", ids)
      .returns<ItemKey[]>();
    for (const k of keyRows ?? []) {
      keys.set(k.item_id, {
        ...k,
        accepted_answers: Array.isArray(k.accepted_answers) ? k.accepted_answers : [],
        model_answers: k.model_answers && typeof k.model_answers === "object" ? k.model_answers : {},
      });
    }
  }
  return { paper, sections: sections ?? [], items: normItems, keys };
}

async function loadAttempt(admin: Admin, attemptId: string): Promise<AttemptRow | null> {
  const { data } = await admin.from("assessment_attempts").select("*").eq("id", attemptId).maybeSingle<AttemptRow>();
  return data;
}

// ---------------------------------------------------------------------------

/** Compute scores, advance state, and (when landing in `completed`) settle the token. */
async function finalize(
  admin: Admin,
  attempt: AttemptRow,
  bundle: PaperBundle,
  via: "manual" | "timer"
): Promise<AttemptRow> {
  const breakdown = scoreAttempt(
    bundle.items,
    bundle.keys,
    attempt.answers ?? {},
    bundle.sections,
    attempt.chosen_items ?? {}
  );
  const hasSelfMark = breakdown.selfMax > 0;
  const now = new Date().toISOString();

  const patch: Record<string, unknown> = {
    auto_score: breakdown.autoScore,
    auto_max: breakdown.autoMax,
    self_max: breakdown.selfMax,
    submitted_at: attempt.submitted_at ?? now,
    submitted_via: attempt.submitted_via ?? via,
    updated_at: now,
  };

  if (hasSelfMark) {
    patch.state = "submitted";
  } else {
    patch.state = "completed";
    patch.self_score = 0;
    patch.total_score = breakdown.autoScore;
    patch.total_max = breakdown.autoMax;
    patch.completed_at = now;
  }

  const { data: updated } = await admin
    .from("assessment_attempts")
    .update(patch)
    .eq("id", attempt.id)
    .select("*")
    .single<AttemptRow>();

  if (!hasSelfMark && updated) await settleToken(admin, updated, bundle.paper);
  return updated ?? { ...attempt, ...(patch as Partial<AttemptRow>) };
}

/** Did the attempt reach the paper's pass mark? */
export function attemptPassed(attempt: AttemptRow, paper: PaperRow): boolean {
  const max = attempt.total_max ?? (attempt.auto_max ?? 0) + (attempt.self_max ?? 0);
  const got = attempt.total_score ?? attempt.auto_score ?? 0;
  if (max <= 0) return true; // nothing to grade → count as passed
  return got / max >= (paper.pass_pct ?? 0.8);
}

async function settleToken(admin: Admin, attempt: AttemptRow, paper: PaperRow): Promise<void> {
  if (attempt.token_awarded) return;
  // Reward only when the student reached the pass mark.
  if (!attemptPassed(attempt, paper)) {
    await admin.from("assessment_attempts").update({ token_awarded: true }).eq("id", attempt.id);
    return;
  }
  const res = await awardAssessmentCompletion({
    userId: attempt.user_id,
    assessmentId: attempt.assessment_id,
    amount: paper.token_reward_on_completion,
  });
  if (res.awarded > 0 || res.balance != null) {
    await admin.from("assessment_attempts").update({ token_awarded: true }).eq("id", attempt.id);
  }
}

/** If the attempt is a live timed one that has run out, finalize it. Returns the fresh row. */
export async function ensureAttemptFresh(attemptId: string): Promise<AttemptRow | null> {
  const admin = createAdminClient();
  const attempt = await loadAttempt(admin, attemptId);
  if (!attempt) return null;
  if (attempt.state !== "in_progress" || !isExpired(attempt.due_at)) return attempt;

  const bundle = await loadBundle(admin, attempt.assessment_id);
  if (!bundle) return attempt;
  return finalize(admin, attempt, bundle, "timer");
}

// ---------------------------------------------------------------------------

export async function startAttempt(
  paperId: string,
  userId: string
): Promise<{ attempt: AttemptRow } | { error: string; status: number }> {
  const admin = createAdminClient();
  const { data: paper } = await admin
    .from("assessments")
    .select("id, kind, duration_minutes, published, token_cost_to_attempt")
    .eq("id", paperId)
    .maybeSingle<{
      id: string;
      kind: string;
      duration_minutes: number | null;
      published: boolean;
      token_cost_to_attempt: number;
    }>();
  if (!paper) return { error: "Unknown paper.", status: 404 };

  const { data: latest } = await admin
    .from("assessment_attempts")
    .select("*")
    .eq("assessment_id", paperId)
    .eq("user_id", userId)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle<AttemptRow>();

  if (latest && latest.state !== "completed") {
    return { attempt: (await ensureAttemptFresh(latest.id)) ?? latest };
  }
  if (latest && latest.state === "completed" && paper.kind === "exam") {
    return { attempt: latest }; // one attempt only — hand back the finished one
  }

  const cost = paper.token_cost_to_attempt ?? 0;
  if (cost > 0) {
    const { data: prof } = await admin
      .from("profiles")
      .select("token_balance")
      .eq("id", userId)
      .single<{ token_balance: number }>();
    const bal = prof?.token_balance ?? 0;
    if (bal < cost) {
      return { error: `This paper costs ${cost} 🪙 to attempt — you have ${bal}.`, status: 402 };
    }
  }

  const startedAt = new Date().toISOString();
  const { data: created, error } = await admin
    .from("assessment_attempts")
    .insert({
      assessment_id: paperId,
      user_id: userId,
      kind: paper.kind,
      state: "in_progress",
      started_at: startedAt,
      due_at: computeDueAt(startedAt, paper.kind, paper.duration_minutes),
    })
    .select("*")
    .single<AttemptRow>();
  if (error || !created) {
    // race on the exam partial-unique index — return whatever now exists
    if (latest) return { attempt: latest };
    return { error: error?.message ?? "Could not start.", status: 500 };
  }

  if (cost > 0) {
    const charge = await chargeAssessmentEntry({ userId, attemptId: created.id, amount: cost });
    if (!charge.ok) {
      await admin.from("assessment_attempts").delete().eq("id", created.id);
      return { error: charge.error ?? "Not enough tokens.", status: 402 };
    }
  }
  return { attempt: created };
}

function assertChoiceLimits(
  bundle: PaperBundle,
  chosen: Record<string, string[]>
): string | null {
  for (const sec of bundle.sections) {
    if (sec.pick_count == null) continue;
    const picks = chosen[sec.id] ?? [];
    if (picks.length > sec.pick_count) {
      return `${sec.label}: choose at most ${sec.pick_count} item${sec.pick_count === 1 ? "" : "s"}.`;
    }
  }
  return null;
}

export async function saveAttempt(
  attemptId: string,
  userId: string,
  patch: { answers?: Record<string, ItemAnswer>; chosenItems?: Record<string, string[]> }
): Promise<{ attempt: AttemptRow; expired?: boolean } | { error: string; status: number }> {
  const admin = createAdminClient();
  const fresh = await ensureAttemptFresh(attemptId);
  if (!fresh) return { error: "Unknown attempt.", status: 404 };
  if (fresh.user_id !== userId) return { error: "Not your attempt.", status: 403 };
  if (fresh.state !== "in_progress") return { attempt: fresh, expired: true };

  const bundle = await loadBundle(admin, fresh.assessment_id);
  if (!bundle) return { error: "Unknown paper.", status: 404 };

  const answers = patch.answers ? { ...(fresh.answers ?? {}), ...patch.answers } : fresh.answers ?? {};
  const chosenItems = patch.chosenItems ?? fresh.chosen_items ?? {};
  const limitError = assertChoiceLimits(bundle, chosenItems);
  if (limitError) return { error: limitError, status: 400 };

  const { data: updated } = await admin
    .from("assessment_attempts")
    .update({ answers, chosen_items: chosenItems, updated_at: new Date().toISOString() })
    .eq("id", attemptId)
    .select("*")
    .single<AttemptRow>();
  return { attempt: updated ?? fresh };
}

export async function submitAttempt(
  attemptId: string,
  userId: string,
  via: "manual" | "timer"
): Promise<{ attempt: AttemptRow } | { error: string; status: number }> {
  const admin = createAdminClient();
  const fresh = await ensureAttemptFresh(attemptId);
  if (!fresh) return { error: "Unknown attempt.", status: 404 };
  if (fresh.user_id !== userId) return { error: "Not your attempt.", status: 403 };
  if (fresh.state !== "in_progress") return { attempt: fresh }; // idempotent

  const bundle = await loadBundle(admin, fresh.assessment_id);
  if (!bundle) return { error: "Unknown paper.", status: 404 };
  return { attempt: await finalize(admin, fresh, bundle, via) };
}

export async function beginSelfMark(
  attemptId: string,
  userId: string
): Promise<{ attempt: AttemptRow } | { error: string; status: number }> {
  const admin = createAdminClient();
  const attempt = await loadAttempt(admin, attemptId);
  if (!attempt) return { error: "Unknown attempt.", status: 404 };
  if (attempt.user_id !== userId) return { error: "Not your attempt.", status: 403 };
  if (attempt.state === "self_marking") return { attempt };
  if (attempt.state !== "submitted") return { error: "Not ready to self-mark.", status: 400 };

  const { data: updated } = await admin
    .from("assessment_attempts")
    .update({ state: "self_marking", updated_at: new Date().toISOString() })
    .eq("id", attemptId)
    .select("*")
    .single<AttemptRow>();
  return { attempt: updated ?? attempt };
}

export async function finalizeSelfMark(
  attemptId: string,
  userId: string,
  selfMarks: Record<string, Record<string, number>>
): Promise<{ attempt: AttemptRow } | { error: string; status: number }> {
  const admin = createAdminClient();
  const attempt = await loadAttempt(admin, attemptId);
  if (!attempt) return { error: "Unknown attempt.", status: 404 };
  if (attempt.user_id !== userId) return { error: "Not your attempt.", status: 403 };
  if (attempt.state === "completed") return { attempt }; // idempotent
  if (attempt.state !== "submitted" && attempt.state !== "self_marking") {
    return { error: "Not ready to finalize.", status: 400 };
  }

  const bundle = await loadBundle(admin, attempt.assessment_id);
  if (!bundle) return { error: "Unknown paper.", status: 404 };

  const selfScore = selfMarkScore(
    bundle.items,
    bundle.keys,
    bundle.sections,
    attempt.chosen_items ?? {},
    selfMarks ?? {}
  );
  const autoMax = attempt.auto_max ?? 0;
  const selfMax = attempt.self_max ?? 0;
  const now = new Date().toISOString();

  const { data: updated } = await admin
    .from("assessment_attempts")
    .update({
      self_marks: selfMarks ?? {},
      self_score: selfScore,
      total_score: (attempt.auto_score ?? 0) + selfScore,
      total_max: autoMax + selfMax,
      state: "completed",
      completed_at: now,
      updated_at: now,
    })
    .eq("id", attemptId)
    .select("*")
    .single<AttemptRow>();

  if (updated) await settleToken(admin, updated, bundle.paper);
  return { attempt: updated ?? attempt };
}

type RevealedKey = { correct_option: number | null; expected_answer: string | null; model_answers: Record<string, string> };

/** Revealed marking key for a paper — only reached after the caller has an attempt past `in_progress`, or the paper is revision. */
export async function revealKeys(
  paperId: string,
  userId: string
): Promise<{ keys: Record<string, RevealedKey> } | { error: string; status: number }> {
  const admin = createAdminClient();
  const bundle = await loadBundle(admin, paperId);
  if (!bundle) return { error: "Unknown paper.", status: 404 };

  if (bundle.paper.kind !== "revision") {
    const { data: attempt } = await admin
      .from("assessment_attempts")
      .select("state")
      .eq("assessment_id", paperId)
      .eq("user_id", userId)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle<{ state: string }>();
    if (!attempt || attempt.state === "in_progress") {
      return { error: "Finish the paper first.", status: 403 };
    }
  }

  const out: Record<string, RevealedKey> = {};
  for (const it of bundle.items) {
    const k = bundle.keys.get(it.id);
    out[it.id] = {
      correct_option: k?.correct_option ?? null,
      expected_answer: k?.expected_answer ?? null,
      model_answers: k?.model_answers ?? {},
    };
  }
  return { keys: out };
}
