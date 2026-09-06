import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { quizPassed } from "@/lib/config/tokens";
import { SUBJECT_DEFINITIONS, getSubjectDefinition, ALL_TOPICS } from "@/lib/subjects";
import type { SubjectDefinition } from "@/lib/subjects";
import type { Profile, ProgressRow, QuizAttemptRow } from "./types";
import type { ActivityItem } from "@/components/spark/navbar";

const titleById = new Map(ALL_TOPICS.map((t) => [t.id, t.title]));
const attemptPassed = (a: QuizAttemptRow) => quizPassed(a.score, a.total);

function relTime(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString();
}

const scorePct = (a: QuizAttemptRow) => (a.total > 0 ? (a.score / a.total) * 100 : 0);

/**
 * Loads the current user's profile + all progress + all attempts once per
 * request (cache()-deduped across the (app) layout and every page).
 */
export const loadDashboard = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: progressRows }, { data: attemptRows }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single<Profile>(),
    supabase.from("progress").select("*").eq("user_id", user.id).returns<ProgressRow[]>(),
    supabase
      .from("quiz_attempts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .returns<QuizAttemptRow[]>(),
  ]);
  if (!profile) redirect("/login");

  const progress = progressRows ?? [];
  const attempts = attemptRows ?? [];

  return {
    profile,
    progressRows: progress,
    attemptRows: attempts,
    tokenBalance: profile.token_balance ?? 0,
    ...overallStats(progress, attempts),
    activity: recentActivity(attempts),
    subject: (subjectId: string) => subjectDashboard(subjectId, progress, attempts),
  };
});

function overallStats(progress: ProgressRow[], attempts: QuizAttemptRow[]) {
  const masteredCount = progress.filter((r) => r.quiz_passed).length;
  const avgScore =
    attempts.length > 0
      ? Math.round(attempts.reduce((s, a) => s + scorePct(a), 0) / attempts.length)
      : 0;
  return { masteredCount, avgScore, attemptCount: attempts.length, totalTopics: ALL_TOPICS.length };
}

function recentActivity(attempts: QuizAttemptRow[]): ActivityItem[] {
  return attempts.slice(0, 4).map((a) => {
    const passed = attemptPassed(a);
    return {
      icon: passed ? "bi-check-circle-fill" : "bi-arrow-repeat",
      tone: passed ? ("success" as const) : ("warning" as const),
      text: `${passed ? "Mastered" : "Attempted"} ${titleById.get(a.topic_id) ?? a.topic_id} — ${a.score}/${a.total}`,
      time: relTime(a.created_at),
    };
  });
}

export type SubjectDashboard = ReturnType<typeof subjectDashboard>;

/** Per-subject progress model — powers each subject's home page. */
export function subjectDashboard(
  subjectId: string,
  progressRows: ProgressRow[],
  attemptRows: QuizAttemptRow[],
  def: SubjectDefinition | undefined = getSubjectDefinition(subjectId)
) {
  const topics = def?.topics ?? [];
  const ids = new Set(topics.map((t) => t.id));
  const progressById = new Map(
    progressRows.filter((r) => ids.has(r.topic_id)).map((r) => [r.topic_id, r])
  );
  const attempts = attemptRows
    .filter((a) => ids.has(a.topic_id))
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  // best score % per topic, from all attempts
  const bestPctByTopic = new Map<string, number>();
  const attemptCountByTopic = new Map<string, number>();
  for (const a of attempts) {
    bestPctByTopic.set(a.topic_id, Math.max(bestPctByTopic.get(a.topic_id) ?? 0, scorePct(a)));
    attemptCountByTopic.set(a.topic_id, (attemptCountByTopic.get(a.topic_id) ?? 0) + 1);
  }

  const topicStatus = (id: string): "mastered" | "attempted" | "viewed" | "not-started" => {
    const row = progressById.get(id);
    if (row?.quiz_passed) return "mastered";
    if (attemptCountByTopic.has(id)) return "attempted";
    if (row?.content_viewed) return "viewed";
    return "not-started";
  };

  const total = topics.length;
  const masteredCount = topics.filter((t) => topicStatus(t.id) === "mastered").length;
  const attemptedCount = topics.filter((t) => topicStatus(t.id) === "attempted").length;
  const viewedCount = topics.filter((t) => topicStatus(t.id) === "viewed").length;
  const notStartedCount = total - masteredCount - attemptedCount - viewedCount;
  /** topics with any activity (viewed / attempted / mastered) */
  const startedCount = total - notStartedCount;

  const avgScore =
    attempts.length > 0 ? Math.round(attempts.reduce((s, a) => s + scorePct(a), 0) / attempts.length) : 0;
  const recent5 = attempts.slice(-5);
  const prev5 = attempts.slice(-10, -5);
  const mean = (xs: QuizAttemptRow[]) => (xs.length ? xs.reduce((s, a) => s + scorePct(a), 0) / xs.length : 0);
  const scoreTrend = recent5.length && prev5.length ? Math.round(mean(recent5) - mean(prev5)) : null;

  const passedSoFar = new Set<string>();
  const masterySpark: number[] = [];
  for (const a of attempts) {
    if (attemptPassed(a)) passedSoFar.add(a.topic_id);
    masterySpark.push(passedSoFar.size);
  }

  const perTopic = topics.map((t) => ({
    id: t.id,
    title: t.title,
    day: t.day,
    tokenRewardBase: t.tokenRewardBase,
    status: topicStatus(t.id),
    bestPct: bestPctByTopic.has(t.id) ? Math.round(bestPctByTopic.get(t.id)!) : null,
    attempts: attemptCountByTopic.get(t.id) ?? 0,
  }));

  const plan = (def?.plan ?? []).map((p) => {
    const dayTopics = perTopic.filter((t) => t.day === p.day);
    return {
      day: p.day,
      focus: p.focus,
      topics: dayTopics,
      mastered: dayTopics.filter((t) => t.status === "mastered").length,
      total: dayTopics.length,
    };
  });

  const recentAttempts = [...attempts].reverse().slice(0, 6).map((a) => ({
    id: a.id,
    title: titleById.get(a.topic_id) ?? a.topic_id,
    score: a.score,
    total: a.total,
    pct: Math.round(scorePct(a)),
    passed: attemptPassed(a),
    when: new Date(a.created_at),
  }));

  const nextTopic = perTopic.find((t) => t.status !== "mastered");
  const scoreSpark = attempts.map(scorePct);

  return {
    subject: def?.meta,
    total,
    masteredCount,
    attemptedCount,
    viewedCount,
    notStartedCount,
    startedCount,
    avgScore,
    scoreTrend,
    attemptCount: attempts.length,
    masterySpark: masterySpark.length ? masterySpark : [0, 0],
    scoreSpark: scoreSpark.length ? scoreSpark : [0, 0],
    perTopic,
    plan,
    recentAttempts,
    nextTopic,
    hasPlan: (def?.plan?.length ?? 0) > 0,
  };
}

export const SUBJECT_IDS = SUBJECT_DEFINITIONS.map((d) => d.meta.id);
