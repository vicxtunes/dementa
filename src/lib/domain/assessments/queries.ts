import { createClient } from "@/lib/supabase/server";

export type PaperRow = {
  id: string;
  subject_id: string | null;
  class_code: string | null;
  title: string;
  assessment_type: "past_paper" | "timed_exam";
  source: string | null;
  token_cost_to_attempt: number;
  token_reward_on_completion: number;
  created_at: string;
};

export type SubQuestion = { label: string; prompt: string; model_answer?: string };

export type PaperItem = {
  id: string;
  assessment_id: string;
  item_number: number;
  section: string | null;
  part: string | null;
  scenario: string;
  sub_questions: SubQuestion[];
};

export type PaperSubmission = {
  id: string;
  answers: Record<string, Record<string, string>>; // { itemId: { label: text } }
  self_marked_done: boolean;
  token_awarded: boolean;
  updated_at: string;
};

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

export async function listItems(paperId: string): Promise<PaperItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("assessment_items")
    .select("*")
    .eq("assessment_id", paperId)
    .order("item_number")
    .returns<PaperItem[]>();
  return data ?? [];
}

export async function getMySubmission(paperId: string): Promise<PaperSubmission | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("assessment_submissions")
    .select("id, answers, self_marked_done, token_awarded, updated_at")
    .eq("assessment_id", paperId)
    .eq("user_id", user.id)
    .maybeSingle<PaperSubmission>();
  return data;
}
