import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { tokensEnabled } from "@/lib/domain/tokens/award.server";

type Body = {
  paperId: string;
  answers: Record<string, Record<string, string>>;
  markDone: boolean;
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }
  const { paperId, answers, markDone } = body;

  const { data: paper } = await supabase
    .from("assessments")
    .select("id, token_reward_on_completion")
    .eq("id", paperId)
    .maybeSingle<{ id: string; token_reward_on_completion: number }>();
  if (!paper) return NextResponse.json({ error: "Unknown paper." }, { status: 404 });

  // Save the student's own submission (RLS: own rows only).
  const { data: existing } = await supabase
    .from("assessment_submissions")
    .select("id, token_awarded")
    .eq("assessment_id", paperId)
    .eq("user_id", user.id)
    .maybeSingle<{ id: string; token_awarded: boolean }>();

  await supabase.from("assessment_submissions").upsert(
    {
      user_id: user.id,
      assessment_id: paperId,
      answers,
      self_marked_done: markDone,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,assessment_id" }
  );

  let tokensAwarded = 0;
  let newBalance = 0;
  if (markDone && !existing?.token_awarded && tokensEnabled()) {
    const admin = createAdminClient();
    const { data: bal } = await admin.rpc("apply_token_delta", {
      p_user_id: user.id,
      p_amount: paper.token_reward_on_completion,
      p_reason: "assessment_completed",
      p_reference_id: paperId,
      p_dedup: true,
    });
    if (typeof bal === "number") {
      tokensAwarded = paper.token_reward_on_completion;
      newBalance = bal;
      await admin
        .from("assessment_submissions")
        .update({ token_awarded: true })
        .eq("assessment_id", paperId)
        .eq("user_id", user.id);
    }
  }

  return NextResponse.json({ saved: true, tokensAwarded, newBalance });
}
