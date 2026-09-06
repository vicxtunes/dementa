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

export async function createResource(formData: FormData) {
  const { supabase, userId, classCode } = await requireTeacher();

  const subjectId = String(formData.get("subject_id") ?? "").trim() || null;
  const kind = String(formData.get("kind") ?? "note");
  const title = String(formData.get("title") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim() || null;
  const body = String(formData.get("body") ?? "").trim() || null;
  const scope = String(formData.get("scope") ?? "all"); // "all" | "my-class"

  if (!title) return;

  const { error } = await supabase.from("resources").insert({
    subject_id: subjectId,
    kind,
    title,
    url,
    body,
    class_code: scope === "my-class" ? classCode : null,
    created_by: userId,
  });
  if (error) throw new Error(error.message);

  if (subjectId) {
    revalidatePath(`/subjects/${subjectId}/resources`);
    revalidatePath(`/subjects/${subjectId}/manage`);
  }
}

export async function deleteResource(formData: FormData) {
  const { supabase } = await requireTeacher();
  const id = String(formData.get("id") ?? "");
  const subjectId = String(formData.get("subject_id") ?? "");
  if (!id) return;
  await supabase.from("resources").delete().eq("id", id);
  if (subjectId) {
    revalidatePath(`/subjects/${subjectId}/resources`);
    revalidatePath(`/subjects/${subjectId}/manage`);
  }
}
