import { createClient } from "@/lib/supabase/server";

export type ClassRow = {
  code: string;
  name: string;
  description: string | null;
  term_label: string | null;
  is_active: boolean;
  created_at: string;
};

export type ClassOverviewRow = {
  user_id: string;
  full_name: string | null;
  class_code: string;
  streak_days: number;
  token_balance: number | null;
  topics_mastered: number;
  total_topics: number;
  avg_score: number;
  quiz_attempts: number;
  best_score: number;
  last_attempt_at: string | null;
};

export async function listClasses(): Promise<ClassRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("classes")
    .select("*")
    .order("created_at")
    .returns<ClassRow[]>();
  return data ?? [];
}

export async function getClass(code: string): Promise<ClassRow | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("classes").select("*").eq("code", code).maybeSingle<ClassRow>();
  return data;
}

export async function classRoster(code: string): Promise<ClassOverviewRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("class_overview")
    .select("*")
    .eq("class_code", code)
    .order("full_name")
    .returns<ClassOverviewRow[]>();
  return data ?? [];
}

/** Other students in the current user's class (for picking a duel opponent). */
export async function myClassmates(): Promise<{ id: string; full_name: string | null }[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data: me } = await supabase
    .from("profiles")
    .select("class_code")
    .eq("id", user.id)
    .single<{ class_code: string }>();
  if (!me) return [];
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("class_code", me.class_code)
    .eq("role", "student")
    .neq("id", user.id)
    .order("full_name")
    .returns<{ id: string; full_name: string | null }[]>();
  return data ?? [];
}

export async function classStudentCounts(): Promise<Record<string, number>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("class_overview")
    .select("class_code")
    .returns<{ class_code: string }[]>();
  const counts: Record<string, number> = {};
  for (const r of data ?? []) counts[r.class_code] = (counts[r.class_code] ?? 0) + 1;
  return counts;
}
