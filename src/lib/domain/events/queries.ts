import { createClient } from "@/lib/supabase/server";
import { getSubjectMeta, ALL_TOPICS } from "@/lib/subjects";

export type EventRow = {
  id: string;
  title: string;
  description: string | null;
  banner_url: string | null;
  subject_id: string | null;
  class_code: string | null;
  topic_ids: string[];
  rules: { question_count?: number };
  question_ids: string[];
  prize_description: string | null;
  prize_tokens: number;
  prize_places: number;
  status: "draft" | "open" | "closed" | "archived";
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
};

export type LeaderboardRow = {
  challenge_id: string;
  user_id: string;
  full_name: string | null;
  score: number;
  total: number;
  submitted_at: string;
  place: number;
};

const titleById = new Map(ALL_TOPICS.map((t) => [t.id, t.title]));

export function eventSubjectLabel(e: EventRow): string {
  return e.subject_id ? (getSubjectMeta(e.subject_id)?.title ?? e.subject_id) : "General";
}

export function eventTopicLabels(e: EventRow): string[] {
  return e.topic_ids.map((id) => titleById.get(id) ?? id);
}

export function isLive(e: EventRow): boolean {
  if (e.status !== "open") return false;
  if (e.ends_at && new Date(e.ends_at) < new Date()) return false;
  if (e.starts_at && new Date(e.starts_at) > new Date()) return false;
  return true;
}

/** Events a student can browse: open + not past their end. Teachers see all non-archived. */
export async function listEvents(isTeacher: boolean): Promise<EventRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("challenges")
    .select("*")
    .neq("status", "archived")
    .order("created_at", { ascending: false })
    .returns<EventRow[]>();
  const rows = data ?? [];
  if (isTeacher) return rows;
  return rows.filter((e) => e.status === "open" && (!e.ends_at || new Date(e.ends_at) >= new Date()));
}

export async function getEvent(id: string): Promise<EventRow | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("challenges").select("*").eq("id", id).maybeSingle<EventRow>();
  return data;
}

export async function getLeaderboard(challengeId: string, limit = 25): Promise<LeaderboardRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("challenge_leaderboard")
    .select("*")
    .eq("challenge_id", challengeId)
    .order("place")
    .limit(limit)
    .returns<LeaderboardRow[]>();
  return data ?? [];
}

export async function myEntry(challengeId: string): Promise<{ score: number; total: number } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("challenge_entries")
    .select("score, total")
    .eq("challenge_id", challengeId)
    .eq("user_id", user.id)
    .maybeSingle<{ score: number; total: number }>();
  return data;
}
