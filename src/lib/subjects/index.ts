import type { SubjectDefinition, SubjectMeta, Topic } from "./types";
import { chemistry } from "./chemistry";
import { math } from "./math";

export type {
  SubjectDefinition,
  SubjectMeta,
  SubjectHomeProps,
  TopicViewProps,
  SectionKey,
  Topic,
  TopicQuestion,
  QuestionType,
  Flashcard,
  SideEffect,
} from "./types";

/** Every subject module, most prominent first. Seed script + queries read here. */
export const SUBJECT_DEFINITIONS: SubjectDefinition[] = [chemistry, math].sort(
  (a, b) => b.meta.navWeight - a.meta.navWeight
);

export const SUBJECTS: SubjectMeta[] = SUBJECT_DEFINITIONS.map((d) => d.meta);

export function getSubjectDefinition(subjectId: string): SubjectDefinition | undefined {
  return SUBJECT_DEFINITIONS.find((d) => d.meta.id === subjectId);
}

export function getSubjectMeta(subjectId: string): SubjectMeta | undefined {
  return getSubjectDefinition(subjectId)?.meta;
}

export function getTopic(subjectId: string, topicId: string): Topic | undefined {
  return getSubjectDefinition(subjectId)?.topics.find((t) => t.id === topicId);
}

export const ALL_TOPICS: Topic[] = SUBJECT_DEFINITIONS.flatMap((d) => d.topics);
