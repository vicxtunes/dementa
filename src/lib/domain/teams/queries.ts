import { createClient } from "@/lib/supabase/server";

export type TeamMember = { user_id: string; full_name: string | null };

export type TeamWithMembers = {
  id: string;
  name: string;
  class_code: string;
  created_by: string;
  created_at: string;
  members: TeamMember[];
};

type TeamRow = {
  id: string;
  name: string;
  class_code: string;
  created_by: string;
  created_at: string;
};

/** Attach member lists (with names) to a set of teams in one round trip. */
async function withMembers(teams: TeamRow[]): Promise<TeamWithMembers[]> {
  if (teams.length === 0) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("team_members")
    .select("team_id, user_id, profiles(full_name)")
    .in(
      "team_id",
      teams.map((t) => t.id)
    )
    .returns<{ team_id: string; user_id: string; profiles: { full_name: string | null } | null }[]>();

  const byTeam = new Map<string, TeamMember[]>();
  for (const row of data ?? []) {
    const list = byTeam.get(row.team_id) ?? [];
    list.push({ user_id: row.user_id, full_name: row.profiles?.full_name ?? null });
    byTeam.set(row.team_id, list);
  }
  return teams.map((t) => ({ ...t, members: byTeam.get(t.id) ?? [] }));
}

/** Every team in the current user's class (RLS scopes this to the class). */
export async function listClassTeams(): Promise<TeamWithMembers[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("teams")
    .select("*")
    .order("created_at", { ascending: true })
    .returns<TeamRow[]>();
  return withMembers(data ?? []);
}

/** Teams the current user belongs to. */
export async function myTeams(): Promise<TeamWithMembers[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: memberships } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", user.id)
    .returns<{ team_id: string }[]>();
  const ids = (memberships ?? []).map((m) => m.team_id);
  if (ids.length === 0) return [];

  const { data } = await supabase
    .from("teams")
    .select("*")
    .in("id", ids)
    .order("created_at", { ascending: true })
    .returns<TeamRow[]>();
  return withMembers(data ?? []);
}

export async function getTeam(teamId: string): Promise<TeamWithMembers | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("teams").select("*").eq("id", teamId).maybeSingle<TeamRow>();
  if (!data) return null;
  return (await withMembers([data]))[0] ?? null;
}
