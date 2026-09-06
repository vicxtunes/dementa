import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import {
  SUBJECTS,
  getSubjectDefinition,
  getTopic as getTopicContent,
  type SubjectMeta,
  type Topic,
} from "@/lib/subjects";

/**
 * Curriculum reads. Content (notes, flashcards, questions) comes from the
 * authored subject modules in src/lib/subjects — always in sync with what's
 * deployed. The database is the authority on *visibility*: a topic row may be
 * scoped to a class, and RLS filters it per user. Pattern: check the row is
 * visible in the DB, then render from the module.
 */

export function listSubjects(): SubjectMeta[] {
  return SUBJECTS;
}

export function getSubject(subjectId: string): SubjectMeta | undefined {
  return getSubjectDefinition(subjectId)?.meta;
}

/** Topic ids visible to the current user for a subject (RLS-filtered). */
export const getVisibleTopicIds = cache(async (subjectId: string): Promise<Set<string>> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("topics")
    .select("id")
    .eq("subject_id", subjectId)
    .returns<{ id: string }[]>();
  return new Set((data ?? []).map((r) => r.id));
});

/** All topics the user can see for a subject, hydrated from the module. */
export async function getVisibleTopics(subjectId: string): Promise<Topic[]> {
  const def = getSubjectDefinition(subjectId);
  if (!def) return [];
  const visible = await getVisibleTopicIds(subjectId);
  return def.topics.filter((t) => visible.has(t.id));
}

/** A single topic, or undefined if it doesn't exist or isn't visible. */
export async function getTopic(subjectId: string, topicId: string): Promise<Topic | undefined> {
  const topic = getTopicContent(subjectId, topicId);
  if (!topic) return undefined;
  const visible = await getVisibleTopicIds(subjectId);
  return visible.has(topicId) ? topic : undefined;
}
