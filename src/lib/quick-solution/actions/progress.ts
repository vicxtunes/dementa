"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/quick-solution/supabase/server";
import { PASS_THRESHOLD } from "@/lib/quick-solution/data/curriculum";

export async function markContentViewed(processId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated.");

  const { error } = await supabase
    .from("progress")
    .upsert(
      { user_id: user.id, process_id: processId, content_viewed: true, updated_at: new Date().toISOString() },
      { onConflict: "user_id,process_id" }
    );

  if (error) throw new Error(error.message);

  revalidatePath(`/day`);
  revalidatePath(`/dashboard`);
}

export async function submitQuizAttempt(processId: string, score: number, total: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated.");

  const passed = total > 0 && score / total >= PASS_THRESHOLD;

  const { error: attemptError } = await supabase.from("quiz_attempts").insert({
    user_id: user.id,
    process_id: processId,
    score,
    total,
  });
  if (attemptError) throw new Error(attemptError.message);

  const { error: progressError } = await supabase.from("progress").upsert(
    {
      user_id: user.id,
      process_id: processId,
      content_viewed: true,
      quiz_passed: passed,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,process_id" }
  );
  if (progressError) throw new Error(progressError.message);

  revalidatePath(`/dashboard`);
  revalidatePath(`/day`);
  revalidatePath(`/teacher`);

  return { passed };
}
