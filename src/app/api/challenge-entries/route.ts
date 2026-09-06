import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { scoreAnswers } from "@/lib/domain/matches/engine.server";
import { tokensEnabled } from "@/lib/domain/tokens/award.server";
import type { SubmittedAnswer } from "@/lib/domain/grading";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  let body: { challengeId: string; answers: SubmittedAnswer[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  if (!tokensEnabled()) {
    return NextResponse.json({ error: "Events require the server token key." }, { status: 503 });
  }
  const admin = createAdminClient();

  const { data: event } = await admin
    .from("challenges")
    .select("id, status, question_ids, ends_at")
    .eq("id", body.challengeId)
    .maybeSingle<{ id: string; status: string; question_ids: string[]; ends_at: string | null }>();
  if (!event) return NextResponse.json({ error: "Unknown event." }, { status: 404 });
  if (event.status !== "open" || (event.ends_at && new Date(event.ends_at) < new Date())) {
    return NextResponse.json({ error: "This event is closed." }, { status: 400 });
  }

  // One entry per user.
  const { data: existing } = await admin
    .from("challenge_entries")
    .select("id")
    .eq("challenge_id", event.id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (existing) return NextResponse.json({ error: "You have already entered." }, { status: 400 });

  const answers = (body.answers ?? []).slice(0, event.question_ids.length);
  const score = await scoreAnswers(admin, event.question_ids, answers);

  await admin.from("challenge_entries").insert({
    challenge_id: event.id,
    user_id: user.id,
    score,
    total: event.question_ids.length,
    breakdown: answers,
  });

  return NextResponse.json({ score, total: event.question_ids.length });
}
