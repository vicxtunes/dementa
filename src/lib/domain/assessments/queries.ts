import { createClient } from "@/lib/supabase/server";

export type PaperFormat = "mcq" | "structured" | "short_answer" | "mixed";
export type PaperKind = "exam" | "revision";
export type QuestionType = "mcq" | "short_answer" | "structured";

export type PaperRow = {
  id: string;
  subject_id: string | null;
  class_code: string | null;
  title: string;
  format: PaperFormat;
  kind: PaperKind;
  duration_minutes: number | null;
  instructions: string | null;
  published: boolean;
  source: string | null;
  token_reward_on_completion: number;
  created_at: string;
};

export type AssessmentSection = {
  id: string;
  assessment_id: string;
  position: number;
  label: string;
  instructions: string | null;
  pick_count: number | null;
};

export type SubQuestion = {
  label: string;
  prompt: string;
  marks?: number;
  /** @deprecated moved to assessment_item_keys; kept so the legacy runner compiles */
  model_answer?: string;
};

export type ItemImage = { path: string; caption?: string };

export type PaperItem = {
  id: string;
  assessment_id: string;
  section_id: string | null;
  item_number: number;
  position: number;
  section: string | null;
  part: string | null;
  question_type: QuestionType;
  scenario: string;
  task_intro: string | null;
  sub_questions: SubQuestion[];
  mcq_options: string[];
  images: ItemImage[];
  max_marks: number | null;
};

/** The hidden marking key — only ever loaded server-side by a teacher or the service role. */
export type ItemKey = {
  item_id: string;
  correct_option: number | null;
  expected_answer: string | null;
  accepted_answers: string[];
  model_answers: Record<string, string>;
};

export type AttemptState = "in_progress" | "submitted" | "self_marking" | "completed";

export type AttemptRow = {
  id: string;
  assessment_id: string;
  user_id: string;
  kind: PaperKind;
  state: AttemptState;
  submitted_via: "manual" | "timer" | null;
  started_at: string;
  due_at: string | null;
  submitted_at: string | null;
  completed_at: string | null;
  answers: Record<string, ItemAnswer>;
  chosen_items: Record<string, string[]>;
  self_marks: Record<string, Record<string, number>>;
  auto_score: number | null;
  auto_max: number | null;
  self_score: number | null;
  self_max: number | null;
  total_score: number | null;
  total_max: number | null;
  token_awarded: boolean;
};

export type ItemAnswer =
  | { type: "mcq"; choice: number | null }
  | { type: "short_answer"; text: string }
  | { type: "structured"; parts: Record<string, string> };

const ITEM_COLUMNS =
  "id, assessment_id, section_id, item_number, position, section, part, question_type, scenario, task_intro, sub_questions, mcq_options, images, max_marks";

// ---------------------------------------------------------------------------
// Papers
// ---------------------------------------------------------------------------

export async function listPapers(subjectId: string): Promise<PaperRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("assessments")
    .select("*")
    .eq("subject_id", subjectId)
    .order("created_at", { ascending: false })
    .returns<PaperRow[]>();
  return data ?? [];
}

export async function getPaper(paperId: string): Promise<PaperRow | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("assessments").select("*").eq("id", paperId).maybeSingle<PaperRow>();
  return data;
}

export async function listSections(paperId: string): Promise<AssessmentSection[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("assessment_sections")
    .select("*")
    .eq("assessment_id", paperId)
    .order("position", { ascending: true })
    .returns<AssessmentSection[]>();
  return data ?? [];
}

/** Items in author order — used by the teacher builder and (minus keys) the student runner. */
export async function listItems(paperId: string): Promise<PaperItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("assessment_items")
    .select(ITEM_COLUMNS)
    .eq("assessment_id", paperId)
    .order("position", { ascending: true })
    .order("item_number", { ascending: true })
    .returns<PaperItem[]>();
  return (data ?? []).map(normalizeItem);
}

function normalizeItem(row: PaperItem): PaperItem {
  return {
    ...row,
    sub_questions: Array.isArray(row.sub_questions) ? row.sub_questions : [],
    mcq_options: Array.isArray(row.mcq_options) ? row.mcq_options : [],
    images: Array.isArray(row.images) ? row.images : [],
  };
}

/**
 * The full paper for a student attempt: metadata + sections + items, with NO
 * marking keys. `assessment_items` is world-readable, so keys live in a
 * separate table that has no student SELECT policy.
 */
export async function getRunnerPaper(
  paperId: string
): Promise<{ paper: PaperRow; sections: AssessmentSection[]; items: PaperItem[] } | null> {
  const paper = await getPaper(paperId);
  if (!paper) return null;
  const [sections, items] = await Promise.all([listSections(paperId), listItems(paperId)]);
  return { paper, sections, items };
}

/** Marking keys for a paper. RLS lets only teachers read the table with a cookie client. */
export async function listItemKeys(paperId: string): Promise<Map<string, ItemKey>> {
  const supabase = await createClient();
  const { data: items } = await supabase
    .from("assessment_items")
    .select("id")
    .eq("assessment_id", paperId)
    .returns<{ id: string }[]>();
  const ids = (items ?? []).map((i) => i.id);
  if (ids.length === 0) return new Map();
  const { data } = await supabase
    .from("assessment_item_keys")
    .select("*")
    .in("item_id", ids)
    .returns<ItemKey[]>();
  return new Map(
    (data ?? []).map((k) => [
      k.item_id,
      {
        ...k,
        accepted_answers: Array.isArray(k.accepted_answers) ? k.accepted_answers : [],
        model_answers: k.model_answers && typeof k.model_answers === "object" ? k.model_answers : {},
      },
    ])
  );
}

// ---------------------------------------------------------------------------
// Attempts (used from P2 onward)
// ---------------------------------------------------------------------------

export async function getLatestAttempt(paperId: string): Promise<AttemptRow | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("assessment_attempts")
    .select("*")
    .eq("assessment_id", paperId)
    .eq("user_id", user.id)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle<AttemptRow>();
  return data;
}

export async function listAttemptsForTeacher(paperId: string): Promise<(AttemptRow & { full_name: string | null })[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("assessment_attempts")
    .select("*, profiles(full_name)")
    .eq("assessment_id", paperId)
    .order("started_at", { ascending: false })
    .returns<(AttemptRow & { profiles: { full_name: string | null } | null })[]>();
  return (data ?? []).map((a) => ({ ...a, full_name: a.profiles?.full_name ?? null }));
}
