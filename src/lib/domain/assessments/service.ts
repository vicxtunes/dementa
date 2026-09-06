"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureAttemptFresh } from "./attempts.server";
import type { PaperFormat, PaperKind, QuestionType } from "./queries";

const SUB_LABELS = "i ii iii iv v vi vii viii ix x xi xii".split(" ");

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

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const intOrNull = (fd: FormData, k: string) => {
  const v = str(fd, k);
  if (v === "") return null;
  const n = Math.trunc(Number(v));
  return Number.isFinite(n) ? n : null;
};

function builderPath(subjectId: string, paperId: string) {
  return `/subjects/${subjectId}/manage/papers/${paperId}`;
}

function revalidatePaper(subjectId: string, paperId: string) {
  revalidatePath(builderPath(subjectId, paperId));
  revalidatePath(`/subjects/${subjectId}/papers/${paperId}`);
  revalidatePath(`/subjects/${subjectId}/papers`);
  revalidatePath(`/subjects/${subjectId}/manage`);
}

// ---------------------------------------------------------------------------
// Papers
// ---------------------------------------------------------------------------

export async function createPaper(formData: FormData) {
  const { supabase, userId, classCode } = await requireTeacher();
  const subjectId = str(formData, "subject_id");
  const title = str(formData, "title");
  if (!subjectId || !title) return;

  const format = (str(formData, "format") || "structured") as PaperFormat;
  const kind = (str(formData, "kind") || "revision") as PaperKind;
  const duration = kind === "exam" ? intOrNull(formData, "duration_minutes") : null;
  const reward = Math.max(0, Math.trunc(Number(formData.get("token_reward_on_completion")) || 10));
  const scope = str(formData, "scope") || "all";

  const { data, error } = await supabase
    .from("assessments")
    .insert({
      subject_id: subjectId,
      class_code: scope === "my-class" ? classCode : null,
      title,
      format,
      kind,
      duration_minutes: duration,
      instructions: str(formData, "instructions") || null,
      token_reward_on_completion: reward,
      published: false,
      created_by: userId,
    })
    .select("id")
    .single<{ id: string }>();
  if (error) throw new Error(error.message);

  revalidatePath(`/subjects/${subjectId}/papers`);
  redirect(builderPath(subjectId, data.id));
}

export async function updatePaper(formData: FormData) {
  const { supabase } = await requireTeacher();
  const id = str(formData, "id");
  const subjectId = str(formData, "subject_id");
  if (!id) return;

  const kind = (str(formData, "kind") || "revision") as PaperKind;
  const { error } = await supabase
    .from("assessments")
    .update({
      title: str(formData, "title"),
      format: (str(formData, "format") || "structured") as PaperFormat,
      kind,
      duration_minutes: kind === "exam" ? intOrNull(formData, "duration_minutes") : null,
      instructions: str(formData, "instructions") || null,
      token_reward_on_completion: Math.max(0, Math.trunc(Number(formData.get("token_reward_on_completion")) || 10)),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePaper(subjectId, id);
}

export async function setPaperPublished(formData: FormData) {
  const { supabase } = await requireTeacher();
  const id = str(formData, "id");
  const subjectId = str(formData, "subject_id");
  if (!id) return;
  await supabase.from("assessments").update({ published: str(formData, "published") === "true" }).eq("id", id);
  revalidatePaper(subjectId, id);
}

export async function deletePaper(formData: FormData) {
  const { supabase } = await requireTeacher();
  const id = str(formData, "id");
  const subjectId = str(formData, "subject_id");
  if (!id) return;
  await supabase.from("assessments").delete().eq("id", id);
  revalidatePath(`/subjects/${subjectId}/manage`);
  revalidatePath(`/subjects/${subjectId}/papers`);
}

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------

export async function addSection(formData: FormData) {
  const { supabase } = await requireTeacher();
  const paperId = str(formData, "assessment_id");
  const subjectId = str(formData, "subject_id");
  const label = str(formData, "label");
  if (!paperId || !label) return;

  const { count } = await supabase
    .from("assessment_sections")
    .select("id", { count: "exact", head: true })
    .eq("assessment_id", paperId);

  const { error } = await supabase.from("assessment_sections").insert({
    assessment_id: paperId,
    position: count ?? 0,
    label,
    instructions: str(formData, "instructions") || null,
    pick_count: intOrNull(formData, "pick_count"),
  });
  if (error) throw new Error(error.message);
  revalidatePaper(subjectId, paperId);
}

export async function updateSection(formData: FormData) {
  const { supabase } = await requireTeacher();
  const id = str(formData, "id");
  const paperId = str(formData, "assessment_id");
  const subjectId = str(formData, "subject_id");
  if (!id) return;
  await supabase
    .from("assessment_sections")
    .update({
      label: str(formData, "label"),
      instructions: str(formData, "instructions") || null,
      pick_count: intOrNull(formData, "pick_count"),
    })
    .eq("id", id);
  revalidatePaper(subjectId, paperId);
}

export async function deleteSection(formData: FormData) {
  const { supabase } = await requireTeacher();
  const id = str(formData, "id");
  const paperId = str(formData, "assessment_id");
  const subjectId = str(formData, "subject_id");
  if (!id) return;
  await supabase.from("assessment_sections").delete().eq("id", id);
  revalidatePaper(subjectId, paperId);
}

async function reorder(
  table: "assessment_sections" | "assessment_items",
  paperId: string,
  id: string,
  dir: "up" | "down"
) {
  const { supabase } = await requireTeacher();
  const { data: rows } = await supabase
    .from(table)
    .select("id, position")
    .eq("assessment_id", paperId)
    .order("position", { ascending: true })
    .returns<{ id: string; position: number }[]>();
  if (!rows) return;
  const i = rows.findIndex((r) => r.id === id);
  const j = dir === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= rows.length) return;
  await Promise.all([
    supabase.from(table).update({ position: rows[j].position }).eq("id", rows[i].id),
    supabase.from(table).update({ position: rows[i].position }).eq("id", rows[j].id),
  ]);
}

export async function moveSection(formData: FormData) {
  await requireTeacher();
  const paperId = str(formData, "assessment_id");
  const subjectId = str(formData, "subject_id");
  await reorder("assessment_sections", paperId, str(formData, "id"), str(formData, "dir") as "up" | "down");
  revalidatePaper(subjectId, paperId);
}

// ---------------------------------------------------------------------------
// Items
// ---------------------------------------------------------------------------

type ItemFields = {
  section_id: string | null;
  question_type: QuestionType;
  scenario: string;
  task_intro: string | null;
  sub_questions: { label: string; prompt: string; marks: number }[];
  mcq_options: string[];
  max_marks: number;
};

type KeyFields = {
  correct_option: number | null;
  expected_answer: string | null;
  accepted_answers: string[];
  model_answers: Record<string, string>;
};

function parseItem(formData: FormData): { item: ItemFields; key: KeyFields } {
  const question_type = (str(formData, "question_type") || "structured") as QuestionType;
  const section_id = str(formData, "section_id") || null;
  const scenario = str(formData, "scenario");
  const task_intro = str(formData, "task_intro") || null;

  if (question_type === "mcq") {
    const mcq_options = formData.getAll("option").map(String).map((s) => s.trim()).filter(Boolean);
    const correct = intOrNull(formData, "correct_option");
    const marks = Math.max(1, Math.trunc(Number(formData.get("max_marks")) || 1));
    return {
      item: { section_id, question_type, scenario, task_intro, sub_questions: [], mcq_options, max_marks: marks },
      key: {
        correct_option: correct != null && correct >= 0 && correct < mcq_options.length ? correct : null,
        expected_answer: null,
        accepted_answers: [],
        model_answers: {},
      },
    };
  }

  if (question_type === "short_answer") {
    const marks = Math.max(1, Math.trunc(Number(formData.get("max_marks")) || 1));
    const expected = str(formData, "expected_answer") || null;
    const accepted = formData.getAll("accepted_answer").map(String).map((s) => s.trim()).filter(Boolean);
    return {
      item: { section_id, question_type, scenario, task_intro, sub_questions: [], mcq_options: [], max_marks: marks },
      key: { correct_option: null, expected_answer: expected, accepted_answers: accepted, model_answers: {} },
    };
  }

  // structured
  const prompts = formData.getAll("sub_prompt").map(String);
  const marksArr = formData.getAll("sub_marks").map(String);
  const models = formData.getAll("sub_model").map(String);
  const model_answers: Record<string, string> = {};
  const sub_questions: { label: string; prompt: string; marks: number }[] = [];
  prompts.forEach((p, i) => {
    const prompt = p.trim();
    if (!prompt) return;
    const label = SUB_LABELS[sub_questions.length] ?? `${sub_questions.length + 1}`;
    const marks = Math.max(0, Math.trunc(Number(marksArr[i]) || 0));
    sub_questions.push({ label, prompt, marks });
    const model = (models[i] ?? "").trim();
    if (model) model_answers[label] = model;
  });
  const max_marks = sub_questions.reduce((n, q) => n + q.marks, 0);
  return {
    item: { section_id, question_type, scenario, task_intro, sub_questions, mcq_options: [], max_marks },
    key: { correct_option: null, expected_answer: null, accepted_answers: [], model_answers },
  };
}

export async function addItem(formData: FormData) {
  const { supabase } = await requireTeacher();
  const paperId = str(formData, "assessment_id");
  const subjectId = str(formData, "subject_id");
  if (!paperId) return;
  const { item, key } = parseItem(formData);
  if (!item.scenario) return;

  const { count } = await supabase
    .from("assessment_items")
    .select("id", { count: "exact", head: true })
    .eq("assessment_id", paperId);
  const n = (count ?? 0) + 1;

  const { data, error } = await supabase
    .from("assessment_items")
    .insert({ assessment_id: paperId, item_number: n, position: n, ...item })
    .select("id")
    .single<{ id: string }>();
  if (error) throw new Error(error.message);

  await supabase.from("assessment_item_keys").upsert({ item_id: data.id, ...key }, { onConflict: "item_id" });
  revalidatePaper(subjectId, paperId);
}

export async function updateItem(formData: FormData) {
  const { supabase } = await requireTeacher();
  const id = str(formData, "id");
  const paperId = str(formData, "assessment_id");
  const subjectId = str(formData, "subject_id");
  if (!id) return;
  const { item, key } = parseItem(formData);
  const { error } = await supabase.from("assessment_items").update(item).eq("id", id);
  if (error) throw new Error(error.message);
  await supabase.from("assessment_item_keys").upsert({ item_id: id, ...key }, { onConflict: "item_id" });
  revalidatePaper(subjectId, paperId);
}

export async function deleteItem(formData: FormData) {
  const { supabase } = await requireTeacher();
  const id = str(formData, "id");
  const paperId = str(formData, "assessment_id");
  const subjectId = str(formData, "subject_id");
  if (!id) return;
  await supabase.from("assessment_items").delete().eq("id", id); // cascade drops the key
  revalidatePaper(subjectId, paperId);
}

export async function moveItem(formData: FormData) {
  await requireTeacher();
  const paperId = str(formData, "assessment_id");
  const subjectId = str(formData, "subject_id");
  await reorder("assessment_items", paperId, str(formData, "id"), str(formData, "dir") as "up" | "down");
  revalidatePaper(subjectId, paperId);
}

// ---------------------------------------------------------------------------
// Item images (files land in the assessment-media bucket via /api/assessment-media)
// ---------------------------------------------------------------------------

export async function attachItemImage(formData: FormData) {
  const { supabase } = await requireTeacher();
  const itemId = str(formData, "item_id");
  const paperId = str(formData, "assessment_id");
  const subjectId = str(formData, "subject_id");
  const path = str(formData, "path");
  if (!itemId || !path) return;

  const { data: row } = await supabase
    .from("assessment_items")
    .select("images")
    .eq("id", itemId)
    .single<{ images: { path: string; caption?: string }[] }>();
  const images = Array.isArray(row?.images) ? row!.images : [];
  if (images.some((im) => im.path === path)) return;
  images.push({ path, caption: str(formData, "caption") || undefined });
  await supabase.from("assessment_items").update({ images }).eq("id", itemId);
  revalidatePaper(subjectId, paperId);
}

export async function removeItemImage(formData: FormData) {
  const { supabase } = await requireTeacher();
  const itemId = str(formData, "item_id");
  const paperId = str(formData, "assessment_id");
  const subjectId = str(formData, "subject_id");
  const path = str(formData, "path");
  if (!itemId || !path) return;

  const { data: row } = await supabase
    .from("assessment_items")
    .select("images")
    .eq("id", itemId)
    .single<{ images: { path: string; caption?: string }[] }>();
  const images = (Array.isArray(row?.images) ? row!.images : []).filter((im) => im.path !== path);
  await supabase.from("assessment_items").update({ images }).eq("id", itemId);

  try {
    await createAdminClient().storage.from("assessment-media").remove([path]);
  } catch {
    // best effort — an orphaned object is harmless
  }
  revalidatePaper(subjectId, paperId);
}

// ---------------------------------------------------------------------------
// Close attempts whose timer expired while the tab was closed
// ---------------------------------------------------------------------------

export async function closeExpiredAttempts(formData: FormData) {
  await requireTeacher();
  const paperId = str(formData, "assessment_id");
  const subjectId = str(formData, "subject_id");
  if (!paperId) return;

  const admin = createAdminClient();
  const { data: stale } = await admin
    .from("assessment_attempts")
    .select("id")
    .eq("assessment_id", paperId)
    .eq("state", "in_progress")
    .lt("due_at", new Date().toISOString())
    .returns<{ id: string }[]>();
  for (const a of stale ?? []) await ensureAttemptFresh(a.id);

  revalidatePath(`/subjects/${subjectId}/manage/papers/${paperId}/submissions`);
}
