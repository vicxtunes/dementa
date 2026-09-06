import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { gradeQuiz, type GradableQuestion, type SubmittedAnswer } from "@/lib/domain/grading";

type Admin = ReturnType<typeof createAdminClient>;

/** Pick up to `count` random question ids drawn from the given topics. */
export async function pickQuestionIds(
  admin: Admin,
  topicIds: string[],
  count: number
): Promise<string[]> {
  const { data } = await admin
    .from("quiz_questions")
    .select("id")
    .in("topic_id", topicIds)
    .returns<{ id: string }[]>();
  const ids = (data ?? []).map((r) => r.id);
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return ids.slice(0, Math.max(1, count));
}

/** Grade a participant's answers against the match's fixed question set. */
export async function scoreAnswers(
  admin: Admin,
  questionIds: string[],
  answers: SubmittedAnswer[]
): Promise<number> {
  const { data } = await admin
    .from("quiz_questions")
    .select("id, question_type, correct_index, correct_numeric_value, numeric_tolerance")
    .in("id", questionIds)
    .returns<
      {
        id: string;
        question_type: "multiple_choice" | "numeric";
        correct_index: number | null;
        correct_numeric_value: number | null;
        numeric_tolerance: number | null;
      }[]
    >();
  const byId = new Map((data ?? []).map((q) => [q.id, q]));
  const ordered: GradableQuestion[] = questionIds.map((id) => {
    const q = byId.get(id);
    return {
      question_type: q?.question_type ?? "multiple_choice",
      correct_index: q?.correct_index ?? null,
      correct_numeric_value: q?.correct_numeric_value ?? null,
      numeric_tolerance: q?.numeric_tolerance ?? null,
    };
  });
  return gradeQuiz(ordered, answers).score;
}

/**
 * Settle a match once every joined participant has finished: compute the
 * winner, mark it completed, and pay out the pot.
 */
export async function settleMatch(admin: Admin, matchId: string): Promise<void> {
  const { data: match } = await admin
    .from("matches")
    .select("*")
    .eq("id", matchId)
    .maybeSingle<{ id: string; mode: string; status: string; settings: { token_entry_cost?: number } }>();
  if (!match || match.status === "completed") return;

  const { data: parts } = await admin
    .from("match_participants")
    .select("user_id, team_id, status, score")
    .eq("match_id", matchId)
    .returns<{ user_id: string; team_id: string | null; status: string; score: number | null }[]>();
  const joined = (parts ?? []).filter((p) => p.status === "joined" || p.status === "finished");
  if (joined.length === 0 || joined.some((p) => p.status !== "finished")) return;

  const stake = match.settings?.token_entry_cost ?? 0;

  if (match.mode === "group") {
    const { data: teams } = await admin
      .from("match_teams")
      .select("team_id")
      .eq("match_id", matchId)
      .returns<{ team_id: string }[]>();
    const teamScore = new Map<string, number>();
    for (const p of joined) {
      if (!p.team_id) continue;
      teamScore.set(p.team_id, (teamScore.get(p.team_id) ?? 0) + (p.score ?? 0));
    }
    let winner: string | null = null;
    let best = -1;
    for (const t of teams ?? []) {
      const sc = teamScore.get(t.team_id) ?? 0;
      await admin.from("match_teams").update({ score: sc }).eq("match_id", matchId).eq("team_id", t.team_id);
      if (sc > best) {
        best = sc;
        winner = t.team_id;
      } else if (sc === best) {
        winner = null; // tie
      }
    }
    if (winner && stake > 0) {
      const pot = stake * joined.length;
      const winners = joined.filter((p) => p.team_id === winner);
      const share = Math.floor(pot / winners.length);
      for (const w of winners) {
        await admin.rpc("apply_token_delta", {
          p_user_id: w.user_id,
          p_amount: share,
          p_reason: "group_quiz_payout",
          p_reference_id: matchId,
          p_dedup: true,
        });
      }
    }
    await admin
      .from("matches")
      .update({ status: "completed", winner_ref: winner, completed_at: new Date().toISOString() })
      .eq("id", matchId);
    return;
  }

  // duel / solo
  const sorted = [...joined].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  const top = sorted[0];
  const tie = sorted.length > 1 && (sorted[1].score ?? 0) === (top.score ?? 0);
  const winner = tie ? null : top.user_id;

  if (stake > 0 && match.mode === "duel") {
    const pot = stake * joined.length;
    if (winner) {
      await admin.rpc("apply_token_delta", {
        p_user_id: winner,
        p_amount: pot,
        p_reason: "duel_payout",
        p_reference_id: matchId,
        p_dedup: true,
      });
    } else {
      // tie — refund each entrant their stake
      for (const p of joined) {
        await admin.rpc("apply_token_delta", {
          p_user_id: p.user_id,
          p_amount: stake,
          p_reason: "duel_refund",
          p_reference_id: matchId,
          p_dedup: true,
        });
      }
    }
  }

  await admin
    .from("matches")
    .update({ status: "completed", winner_ref: winner, completed_at: new Date().toISOString() })
    .eq("id", matchId);
}
