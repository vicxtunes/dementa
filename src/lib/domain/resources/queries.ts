import { createClient } from "@/lib/supabase/server";

export type ResourceKind = "note" | "past_paper" | "link";

export type ResourceRow = {
  id: string;
  subject_id: string | null;
  topic_id: string | null;
  class_code: string | null;
  kind: ResourceKind;
  title: string;
  url: string | null;
  body: string | null;
  created_at: string;
};

/** Resources for a subject that are visible to the current user (RLS-scoped). */
export async function listSubjectResources(subjectId: string): Promise<ResourceRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("resources")
    .select("id, subject_id, topic_id, class_code, kind, title, url, body, created_at")
    .eq("subject_id", subjectId)
    .order("created_at", { ascending: false })
    .returns<ResourceRow[]>();
  return data ?? [];
}
