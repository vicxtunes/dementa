"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Team create / join / leave. These touch only the caller's own class and their
 * own membership row, so RLS (see migration 004) covers them — no service role.
 * Starting a team quiz, which moves multiple students' token balances, goes
 * through the /api/matches Route Handler instead.
 */

async function currentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated.");
  return { supabase, user };
}

export async function createTeam(formData: FormData): Promise<void> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Give the team a name.");
  if (name.length > 60) throw new Error("That name is too long.");

  const { supabase, user } = await currentUser();
  const { data: me } = await supabase
    .from("profiles")
    .select("class_code")
    .eq("id", user.id)
    .single<{ class_code: string }>();
  if (!me?.class_code) throw new Error("You need to be in a class to make a team.");

  const { data: team, error } = await supabase
    .from("teams")
    .insert({ name, class_code: me.class_code, created_by: user.id })
    .select("id")
    .single<{ id: string }>();
  if (error || !team) throw new Error(error?.message ?? "Could not create the team.");

  const { error: joinError } = await supabase
    .from("team_members")
    .insert({ team_id: team.id, user_id: user.id });
  if (joinError) throw new Error(joinError.message);

  revalidatePath("/teams");
}

export async function joinTeam(formData: FormData): Promise<void> {
  const teamId = String(formData.get("teamId") ?? "");
  if (!teamId) throw new Error("Missing team.");

  const { supabase, user } = await currentUser();
  const { error } = await supabase
    .from("team_members")
    .upsert({ team_id: teamId, user_id: user.id }, { onConflict: "team_id,user_id", ignoreDuplicates: true });
  if (error) throw new Error(error.message);

  revalidatePath("/teams");
}

export async function leaveTeam(formData: FormData): Promise<void> {
  const teamId = String(formData.get("teamId") ?? "");
  if (!teamId) throw new Error("Missing team.");

  const { supabase, user } = await currentUser();
  const { error } = await supabase
    .from("team_members")
    .delete()
    .eq("team_id", teamId)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);

  revalidatePath("/teams");
}
