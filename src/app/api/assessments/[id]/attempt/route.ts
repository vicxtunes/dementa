import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  startAttempt,
  saveAttempt,
  submitAttempt,
  beginSelfMark,
  finalizeSelfMark,
} from "@/lib/domain/assessments/attempts.server";
import type { ItemAnswer } from "@/lib/domain/assessments/queries";

type Body =
  | { action: "start" }
  | { action: "save"; answers?: Record<string, ItemAnswer>; chosenItems?: Record<string, string[]> }
  | { action: "submit"; via?: "manual" | "timer" }
  | { action: "begin_self_mark" }
  | { action: "finalize"; selfMarks?: Record<string, Record<string, number>> };

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id: paperId } = await ctx.params;
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

  if (b.action === "start") {
    const res = await startAttempt(paperId, user.id);
    if ("error" in res) return NextResponse.json({ error: res.error }, { status: res.status });
    return NextResponse.json({ attempt: res.attempt });
  }

  // the remaining actions target the caller's latest attempt for this paper
  const { data: attempt } = await supabase
    .from("assessment_attempts")
    .select("id")
    .eq("assessment_id", paperId)
    .eq("user_id", user.id)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ id: string }>();
  if (!attempt) return NextResponse.json({ error: "No attempt in progress." }, { status: 404 });

  if (b.action === "save") {
    const res = await saveAttempt(attempt.id, user.id, { answers: b.answers, chosenItems: b.chosenItems });
    if ("error" in res) return NextResponse.json({ error: res.error }, { status: res.status });
    return NextResponse.json({ attempt: res.attempt }, { status: res.expired ? 409 : 200 });
  }
  if (b.action === "submit") {
    const res = await submitAttempt(attempt.id, user.id, b.via === "timer" ? "timer" : "manual");
    if ("error" in res) return NextResponse.json({ error: res.error }, { status: res.status });
    return NextResponse.json({ attempt: res.attempt });
  }
  if (b.action === "begin_self_mark") {
    const res = await beginSelfMark(attempt.id, user.id);
    if ("error" in res) return NextResponse.json({ error: res.error }, { status: res.status });
    return NextResponse.json({ attempt: res.attempt });
  }
  if (b.action === "finalize") {
    const res = await finalizeSelfMark(attempt.id, user.id, b.selfMarks ?? {});
    if ("error" in res) return NextResponse.json({ error: res.error }, { status: res.status });
    return NextResponse.json({ attempt: res.attempt });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
