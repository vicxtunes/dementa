import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { tokensEnabled } from "@/lib/domain/tokens/award.server";
import { pickQuestionIds } from "@/lib/domain/matches/engine.server";

type Body = {
  mode: "solo" | "duel" | "group";
  subjectId: string | null;
  isGeneral: boolean;
  topicIds: string[];
  questionCount: number;
  stake: number;
  opponentIds?: string[]; // duel
  teamA?: { name: string; memberIds: string[] }; // group (creator auto-added)
  teamB?: { name: string; memberIds: string[] };
};

export async function POST(request: Request) {
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

  const stake = Math.max(0, Math.trunc(Number(b.stake) || 0));
  const count = Math.min(20, Math.max(3, Math.trunc(Number(b.questionCount) || 5)));
  if (!b.topicIds?.length) return NextResponse.json({ error: "Pick at least one topic." }, { status: 400 });

  const { data: me } = await supabase
    .from("profiles")
    .select("token_balance, class_code")
    .eq("id", user.id)
    .single<{ token_balance: number; class_code: string }>();
  const stakeActive = stake > 0 && tokensEnabled();
  if (stakeActive && (me?.token_balance ?? 0) < stake) {
    return NextResponse.json({ error: "Not enough tokens for that stake." }, { status: 400 });
  }

  const admin = createAdminClient();
  const questionIds = await pickQuestionIds(admin, b.topicIds, count);
  if (questionIds.length === 0) {
    return NextResponse.json({ error: "Those topics have no questions." }, { status: 400 });
  }

  const { data: match, error } = await admin
    .from("matches")
    .insert({
      mode: b.mode,
      is_general: Boolean(b.isGeneral),
      subject_id: b.isGeneral ? null : b.subjectId,
      class_code: me?.class_code ?? null,
      topic_ids: b.topicIds,
      settings: { question_count: questionIds.length, token_entry_cost: stake },
      question_ids: questionIds,
      status: b.mode === "solo" ? "active" : "pending",
      created_by: user.id,
    })
    .select("id")
    .single<{ id: string }>();
  if (error || !match) {
    return NextResponse.json({ error: error?.message ?? "Could not create match." }, { status: 500 });
  }

  const deduct = async (uid: string, reason: "duel_entry" | "group_quiz_entry") => {
    if (!stakeActive) return;
    await admin.rpc("apply_token_delta", {
      p_user_id: uid,
      p_amount: -stake,
      p_reason: reason,
      p_reference_id: match.id,
      p_dedup: false,
    });
  };

  if (b.mode === "solo") {
    await admin.from("match_participants").insert({ match_id: match.id, user_id: user.id, status: "joined" });
  } else if (b.mode === "duel") {
    if (b.opponentIds?.length !== 1) {
      return NextResponse.json({ error: "A duel needs exactly one opponent." }, { status: 400 });
    }
    await admin.from("match_participants").insert([
      { match_id: match.id, user_id: user.id, status: "joined" },
      { match_id: match.id, user_id: b.opponentIds[0], status: "invited" },
    ]);
    await deduct(user.id, "duel_entry");
  } else {
    // group
    const aMembers = [...new Set([user.id, ...(b.teamA?.memberIds ?? [])])];
    const bMembers = [...new Set(b.teamB?.memberIds ?? [])];
    if (aMembers.length < 1 || bMembers.length < 1) {
      return NextResponse.json({ error: "Both teams need members." }, { status: 400 });
    }
    const { data: teams } = await admin
      .from("teams")
      .insert([
        { name: b.teamA?.name || "Team A", class_code: me?.class_code, created_by: user.id },
        { name: b.teamB?.name || "Team B", class_code: me?.class_code, created_by: user.id },
      ])
      .select("id")
      .returns<{ id: string }[]>();
    const [teamAId, teamBId] = (teams ?? []).map((t) => t.id);
    await admin.from("team_members").insert([
      ...aMembers.map((uid) => ({ team_id: teamAId, user_id: uid })),
      ...bMembers.map((uid) => ({ team_id: teamBId, user_id: uid })),
    ]);
    await admin.from("match_teams").insert([
      { match_id: match.id, team_id: teamAId, slot: "a" },
      { match_id: match.id, team_id: teamBId, slot: "b" },
    ]);
    await admin.from("match_participants").insert([
      ...aMembers.map((uid) => ({
        match_id: match.id,
        user_id: uid,
        team_id: teamAId,
        status: uid === user.id ? ("joined" as const) : ("invited" as const),
      })),
      ...bMembers.map((uid) => ({ match_id: match.id, user_id: uid, team_id: teamBId, status: "invited" as const })),
    ]);
    await deduct(user.id, "group_quiz_entry");
  }

  return NextResponse.json({ matchId: match.id });
}
