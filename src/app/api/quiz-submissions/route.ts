import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { gradeQuiz, type GradableQuestion, type SubmittedAnswer } from "@/lib/domain/grading";
import { getTopic } from "@/lib/subjects";
import { awardTopicMastery, tokensEnabled } from "@/lib/domain/tokens/award.server";
import { quizPassed } from "@/lib/config/tokens";

type Body = {
  subjectId: string;
  topicId: string;
  answers: SubmittedAnswer[];
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
  const { subjectId, topicId, answers } = body;
  const topic = getTopic(subjectId, topicId);
  if (!topic) return NextResponse.json({ error: "Unknown topic." }, { status: 404 });

  // Authoritative questions from the DB (RLS-readable), fall back to the module.
  const { data: rows } = await supabase
    .from("quiz_questions")
    .select("question_type, correct_index, correct_numeric_value, numeric_tolerance")
    .eq("topic_id", topicId)
    .returns<
      {
        question_type: "multiple_choice" | "numeric";
        correct_index: number | null;
        correct_numeric_value: number | null;
        numeric_tolerance: number | null;
      }[]
    >();

  const questions: GradableQuestion[] =
    rows && rows.length === topic.quiz.length
      ? rows.map((r) => ({
          question_type: r.question_type,
          correct_index: r.correct_index,
          correct_numeric_value: r.correct_numeric_value,
          numeric_tolerance: r.numeric_tolerance,
        }))
      : topic.quiz.map((q) => ({
          question_type: q.type,
          correct_index: q.correctIndex ?? null,
          correct_numeric_value: q.correctNumericValue ?? null,
          numeric_tolerance: q.numericTolerance ?? null,
        }));

  const normAnswers: SubmittedAnswer[] = questions.map((_, i) => ({
    selectedIndex: answers?.[i]?.selectedIndex ?? null,
    value: answers?.[i]?.value ?? null,
  }));

  const { perQuestion, score, total } = gradeQuiz(questions, normAnswers);
  const passed = quizPassed(score, total);

  const writer = tokensEnabled() ? createAdminClient() : supabase;

  await writer.from("quiz_attempts").insert({ user_id: user.id, topic_id: topicId, score, total });

  const { data: prior } = await writer
    .from("progress")
    .select("quiz_passed")
    .eq("user_id", user.id)
    .eq("topic_id", topicId)
    .maybeSingle<{ quiz_passed: boolean }>();
  const alreadyMastered = Boolean(prior?.quiz_passed);

  await writer.from("progress").upsert(
    {
      user_id: user.id,
      topic_id: topicId,
      content_viewed: true,
      quiz_passed: passed || alreadyMastered,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,topic_id" }
  );

  let tokensAwarded = 0;
  let newBalance = 0;
  if (passed) {
    const res = await awardTopicMastery({
      userId: user.id,
      topicId,
      tokenRewardBase: topic.tokenRewardBase,
      firstAttempt: !alreadyMastered,
    });
    tokensAwarded = res.awarded;
    newBalance = res.balance ?? 0;
  }
  if (newBalance === 0 && tokensEnabled()) {
    const { data } = await supabase
      .from("profiles")
      .select("token_balance")
      .eq("id", user.id)
      .single<{ token_balance: number }>();
    newBalance = data?.token_balance ?? 0;
  }

  return NextResponse.json({ score, total, passed, perQuestion, tokensAwarded, newBalance });
}
