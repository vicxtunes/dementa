import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { tokensEnabled } from "@/lib/domain/tokens/award.server";
import { scoreAnswers, settleMatch } from "@/lib/domain/matches/engine.server";
import type { SubmittedAnswer } from "@/lib/domain/grading";

type Body =
  | { action: "accept" }
  | { action: "decline" }
  | { action: "finish"; answers: SubmittedAnswer[] };

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id: matchId } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  let b: Body;
  try {
    b = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: match } = await admin
    .from("matches")
    .select("*")
    .eq("id", matchId)
    .maybeSingle<{
      id: string;
      mode: string;
      status: string;
      created_by: string;
      question_ids: string[];
      settings: { token_entry_cost?: number };
    }>();
  if (!match) return NextResponse.json({ error: "Unknown match." }, { status: 404 });

  const { data: part } = await admin
    .from("match_participants")
    .select("*")
    .eq("match_id", matchId)
    .eq("user_id", user.id)
    .maybeSingle<{ status: string; score: number | null }>();
  if (!part) return NextResponse.json({ error: "You are not in this match." }, { status: 403 });

  const stake = match.settings?.token_entry_cost ?? 0;

  if (b.action === "accept") {
    if (part.status !== "invited") return NextResponse.json({ error: "Nothing to accept." }, { status: 400 });
    if (stake > 0 && tokensEnabled()) {
      const { data: me } = await admin
        .from("profiles")
        .select("token_balance")
        .eq("id", user.id)
        .single<{ token_balance: number }>();
      if ((me?.token_balance ?? 0) < stake) {
        return NextResponse.json({ error: "Not enough tokens." }, { status: 400 });
      }
      await admin.rpc("apply_token_delta", {
        p_user_id: user.id,
        p_amount: -stake,
        p_reason: match.mode === "group" ? "group_quiz_entry" : "duel_entry",
        p_reference_id: matchId,
        p_dedup: false,
      });
    }
    await admin.from("match_participants").update({ status: "joined" }).eq("match_id", matchId).eq("user_id", user.id);
    await admin.from("matches").update({ status: "active" }).eq("id", matchId);
    return NextResponse.json({ ok: true, status: "active" });
  }

  if (b.action === "decline") {
    if (part.status !== "invited") return NextResponse.json({ error: "Nothing to decline." }, { status: 400 });
    await admin.from("match_participants").update({ status: "declined" }).eq("match_id", matchId).eq("user_id", user.id);

    if (match.mode === "group") {
      // One player declining doesn't end a team quiz. It's only off if a whole
      // team can no longer field anyone.
      const { data: rows } = await admin
        .from("match_participants")
        .select("user_id, team_id, status")
        .eq("match_id", matchId)
        .returns<{ user_id: string; team_id: string | null; status: string }[]>();
      const byTeam = new Map<string, string[]>();
      for (const r of rows ?? []) {
        if (!r.team_id) continue;
        byTeam.set(r.team_id, [...(byTeam.get(r.team_id) ?? []), r.status]);
      }
      const aTeamOut = [...byTeam.values()].some((statuses) => statuses.every((s) => s === "declined"));
      if (!aTeamOut) {
        return NextResponse.json({ ok: true, status: match.status });
      }

      await admin.from("matches").update({ status: "declined" }).eq("id", matchId);
      if (stake > 0 && tokensEnabled()) {
        // Refund everyone who had already paid the entry cost.
        const paid = (rows ?? []).filter((r) => r.status === "joined" || r.status === "finished");
        for (const r of paid) {
          await admin.rpc("apply_token_delta", {
            p_user_id: r.user_id,
            p_amount: stake,
            p_reason: "group_quiz_refund",
            p_reference_id: matchId,
            p_dedup: true,
          });
        }
      }
      return NextResponse.json({ ok: true, status: "declined" });
    }

    await admin.from("matches").update({ status: "declined" }).eq("id", matchId);
    if (stake > 0 && tokensEnabled() && match.mode === "duel") {
      await admin.rpc("apply_token_delta", {
        p_user_id: match.created_by,
        p_amount: stake,
        p_reason: "duel_refund",
        p_reference_id: matchId,
        p_dedup: true,
      });
    }
    return NextResponse.json({ ok: true, status: "declined" });
  }

  // finish
  if (part.status !== "joined") {
    return NextResponse.json({ error: "You can't submit for this match." }, { status: 400 });
  }
  const answers = (b.answers ?? []).slice(0, match.question_ids.length);
  const score = await scoreAnswers(admin, match.question_ids, answers);
  await admin
    .from("match_participants")
    .update({ answers, score, status: "finished", finished_at: new Date().toISOString() })
    .eq("match_id", matchId)
    .eq("user_id", user.id);

  await settleMatch(admin, matchId);

  const { data: after } = await admin
    .from("matches")
    .select("status, winner_ref")
    .eq("id", matchId)
    .single<{ status: string; winner_ref: string | null }>();

  return NextResponse.json({ ok: true, score, total: match.question_ids.length, match: after });
}
