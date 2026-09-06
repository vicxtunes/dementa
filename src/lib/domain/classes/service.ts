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
    .select("role")
    .eq("id", user.id)
    .single<{ role: string }>();
  if (profile?.role !== "teacher") redirect("/home");
  return { supabase, userId: user.id };
}

export async function createClass(formData: FormData) {
  const { supabase, userId } = await requireTeacher();
  const name = String(formData.get("name") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim() || name;
  const term = String(formData.get("term_label") ?? "").trim() || null;
  if (!name) return;

  const { error } = await supabase.from("classes").insert({
    code,
    name,
    term_label: term,
    teacher_id: userId,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/classes");
  redirect(`/classes/${encodeURIComponent(code)}`);
}

export async function moveStudentToClass(formData: FormData) {
  const { supabase } = await requireTeacher();
  const studentId = String(formData.get("student_id") ?? "");
  const classCode = String(formData.get("class_code") ?? "");
  if (!studentId || !classCode) return;

  const { error } = await supabase
    .from("profiles")
    .update({ class_code: classCode })
    .eq("id", studentId);
  if (error) throw new Error(error.message);

  revalidatePath("/classes", "layout");
}
