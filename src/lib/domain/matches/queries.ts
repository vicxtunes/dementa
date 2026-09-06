import { createClient } from "@/lib/supabase/server";
import { getSubjectMeta } from "@/lib/subjects";
import { ALL_TOPICS } from "@/lib/subjects";

export type MatchMode = "solo" | "duel" | "group";
export type MatchStatus = "pending" | "active" | "completed" | "declined";
export type ParticipantStatus = "invited" | "joined" | "finished" | "declined";

export type MatchRow = {
  id: string;
  mode: MatchMode;
  is_general: boolean;
  subject_id: string | null;
  topic_ids: string[];
  settings: { question_count?: number; time_limit_seconds?: number; token_entry_cost?: number };
  question_ids: string[];
  status: MatchStatus;
  created_by: string;
  winner_ref: string | null;
  created_at: string;
  completed_at: string | null;
};

export type MatchParticipant = {
  match_id: string;
  user_id: string;
  team_id: string | null;
  status: ParticipantStatus;
  answers: unknown[];
  score: number | null;
  finished_at: string | null;
  full_name?: string | null;
};

const topicTitle = new Map(ALL_TOPICS.map((t) => [t.id, t.title]));

export function describeMatch(m: MatchRow): string {
  const subject = m.subject_id ? getSubjectMeta(m.subject_id)?.title : "General";
  const topics = m.topic_ids.map((id) => topicTitle.get(id) ?? id);
  const topicLabel = topics.length <= 2 ? topics.join(" & ") : `${topics.length} topics`;
  return `${subject} · ${topicLabel}`;
}

export async function getMatch(matchId: string): Promise<MatchRow | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("matches").select("*").eq("id", matchId).maybeSingle<MatchRow>();
  return data;
}

export async function getParticipants(matchId: string): Promise<MatchParticipant[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("match_participants")
    .select("*, profiles(full_name)")
    .eq("match_id", matchId)
    .returns<(MatchParticipant & { profiles: { full_name: string | null } | null })[]>();
  return (data ?? []).map((p) => ({ ...p, full_name: p.profiles?.full_name ?? null }));
}

/** Matches the current user is in (optionally filtered to a subject). */
export async function myMatches(subjectId?: string): Promise<MatchRow[]> {
  const supabase = await createClient();
  let q = supabase.from("matches").select("*").order("created_at", { ascending: false });
  if (subjectId) q = q.eq("subject_id", subjectId);
  const { data } = await q.returns<MatchRow[]>();
  return data ?? [];
}

/** Pending invites for the current user — surfaced in the navbar. */
export async function myInvites(): Promise<{ matchId: string; label: string; from: string | null }[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: parts } = await supabase
    .from("match_participants")
    .select("match_id")
    .eq("user_id", user.id)
    .eq("status", "invited")
    .returns<{ match_id: string }[]>();
  const ids = (parts ?? []).map((p) => p.match_id);
  if (ids.length === 0) return [];

  const { data: matches } = await supabase
    .from("matches")
    .select("*")
    .in("id", ids)
    .eq("status", "pending")
    .returns<MatchRow[]>();

  const creators = [...new Set((matches ?? []).map((m) => m.created_by))];
  const { data: profs } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", creators)
    .returns<{ id: string; full_name: string | null }[]>();
  const nameById = new Map((profs ?? []).map((p) => [p.id, p.full_name]));

  return (matches ?? []).map((m) => ({
    matchId: m.id,
    label: describeMatch(m),
    from: nameById.get(m.created_by) ?? null,
  }));
}
