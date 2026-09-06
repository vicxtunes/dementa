"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/** Marks a topic's notes as read. Quiz grading + mastery + token awards go
 *  through the /api/quiz-submissions Route Handler (server-authoritative). */
export async function markTopicViewed(topicId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated.");

  const { error } = await supabase.from("progress").upsert(
    {
      user_id: user.id,
      topic_id: topicId,
      content_viewed: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,topic_id" }
  );
  if (error) throw new Error(error.message);

  revalidatePath("/subjects", "layout");
  revalidatePath("/home");
}
