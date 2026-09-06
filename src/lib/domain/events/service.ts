"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { tokensEnabled } from "@/lib/domain/tokens/award.server";
import { pickQuestionIds } from "@/lib/domain/matches/engine.server";

async function requireTeacher() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single<{ role: string }>();
  if (profile?.role !== "teacher") redirect("/home");
  return { supabase, userId: user.id };
}

export async function createEvent(formData: FormData) {
  const { userId } = await requireTeacher();

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const subjectId = String(formData.get("subject_id") ?? "").trim() || null;
  const topicIds = formData.getAll("topic_ids").map(String).filter(Boolean);
  const questionCount = Math.min(30, Math.max(3, Math.trunc(Number(formData.get("question_count")) || 10)));
  const prizeTokens = Math.max(0, Math.trunc(Number(formData.get("prize_tokens")) || 0));
  const prizePlaces = Math.max(1, Math.trunc(Number(formData.get("prize_places")) || 1));
  const prizeDescription = String(formData.get("prize_description") ?? "").trim() || null;
  const endsAt = String(formData.get("ends_at") ?? "").trim() || null;
  const publish = formData.get("publish") === "on";

  if (!title || topicIds.length === 0) return;

  // Materialise a fixed question set now so every entrant gets the same quiz.
  let questionIds: string[] = [];
  if (tokensEnabled()) {
    questionIds = await pickQuestionIds(createAdminClient(), topicIds, questionCount);
  }

  const { supabase } = await requireTeacher();
  const { data, error } = await supabase
    .from("challenges")
    .insert({
      title,
      description,
      subject_id: subjectId,
      topic_ids: topicIds,
      rules: { question_count: questionCount },
      question_ids: questionIds,
      prize_tokens: prizeTokens,
      prize_places: prizePlaces,
      prize_description: prizeDescription,
      ends_at: endsAt,
      status: publish ? "open" : "draft",
      created_by: userId,
    })
    .select("id")
    .single<{ id: string }>();
  if (error) throw new Error(error.message);

  revalidatePath("/challenges");
  redirect(`/challenges/${data.id}`);
}

export async function setEventStatus(formData: FormData) {
  const { supabase } = await requireTeacher();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !["draft", "open", "closed", "archived"].includes(status)) return;
  await supabase.from("challenges").update({ status }).eq("id", id);
  revalidatePath("/challenges");
  revalidatePath(`/challenges/${id}`);
}

/** Manually run the close+payout sweep (also schedulable in Supabase). */
export async function closeExpiredEvents() {
  await requireTeacher();
  if (tokensEnabled()) {
    await createAdminClient().rpc("close_expired_challenges");
  }
  revalidatePath("/challenges");
}
