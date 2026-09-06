"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function requireTeacher() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, class_code")
    .eq("id", user.id)
    .single<{ role: string; class_code: string }>();
  if (profile?.role !== "teacher") redirect("/home");
  return { supabase, userId: user.id, classCode: profile.class_code };
}

export async function createPaper(formData: FormData) {
  const { supabase, userId, classCode } = await requireTeacher();
  const subjectId = String(formData.get("subject_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const type = String(formData.get("assessment_type") ?? "past_paper");
  const source = String(formData.get("source") ?? "").trim() || null;
  const reward = Math.max(0, Math.trunc(Number(formData.get("token_reward_on_completion")) || 10));
  const scope = String(formData.get("scope") ?? "all");
  if (!subjectId || !title) return;

  const { data, error } = await supabase
    .from("assessments")
    .insert({
      subject_id: subjectId,
      class_code: scope === "my-class" ? classCode : null,
      title,
      assessment_type: type,
      source,
      token_reward_on_completion: reward,
      created_by: userId,
    })
    .select("id")
    .single<{ id: string }>();
  if (error) throw new Error(error.message);

  revalidatePath(`/subjects/${subjectId}/papers`);
  redirect(`/subjects/${subjectId}/manage/papers/${data.id}`);
}

export async function deletePaper(formData: FormData) {
  const { supabase } = await requireTeacher();
  const id = String(formData.get("id") ?? "");
  const subjectId = String(formData.get("subject_id") ?? "");
  if (!id) return;
  await supabase.from("assessments").delete().eq("id", id);
  revalidatePath(`/subjects/${subjectId}/manage`);
  revalidatePath(`/subjects/${subjectId}/papers`);
}

export async function addItem(formData: FormData) {
  const { supabase } = await requireTeacher();
  const paperId = String(formData.get("assessment_id") ?? "");
  const subjectId = String(formData.get("subject_id") ?? "");
  const scenario = String(formData.get("scenario") ?? "").trim();
  const section = String(formData.get("section") ?? "").trim() || null;
  if (!paperId || !scenario) return;

  // sub-questions arrive as parallel prompt[]/answer[] arrays.
  const prompts = formData.getAll("prompt").map(String);
  const answers = formData.getAll("model_answer").map(String);
  const labels = "i ii iii iv v vi vii viii".split(" ");
  const subQuestions = prompts
    .map((p, i) => ({ label: labels[i] ?? `${i + 1}`, prompt: p.trim(), model_answer: (answers[i] ?? "").trim() }))
    .filter((q) => q.prompt);

  const { count } = await supabase
    .from("assessment_items")
    .select("id", { count: "exact", head: true })
    .eq("assessment_id", paperId);

  const { error } = await supabase.from("assessment_items").insert({
    assessment_id: paperId,
    item_number: (count ?? 0) + 1,
    section,
    scenario,
    sub_questions: subQuestions,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/subjects/${subjectId}/manage/papers/${paperId}`);
  revalidatePath(`/subjects/${subjectId}/papers/${paperId}`);
}

export async function deleteItem(formData: FormData) {
  const { supabase } = await requireTeacher();
  const id = String(formData.get("id") ?? "");
  const paperId = String(formData.get("assessment_id") ?? "");
  const subjectId = String(formData.get("subject_id") ?? "");
  if (!id) return;
  await supabase.from("assessment_items").delete().eq("id", id);
  revalidatePath(`/subjects/${subjectId}/manage/papers/${paperId}`);
}
