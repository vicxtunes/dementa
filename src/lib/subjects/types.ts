import type { ComponentType } from "react";

// ---------------------------------------------------------------------------
// Authored content shapes. The database mirrors these (supabase/migrations).
// scripts/generate-seed.mts turns the subject modules into supabase/seed.sql.
// ---------------------------------------------------------------------------

export type QuestionType = "multiple_choice" | "numeric";

export type TopicQuestion = {
  question: string;
  type: QuestionType;
  explanation: string;
  /** multiple_choice */
  options?: string[];
  correctIndex?: number;
  /** numeric */
  correctNumericValue?: number;
  numericTolerance?: number;
};

export type Flashcard = { front: string; back: string };
export type SideEffect = { issue: string; effect: string; mitigation: string };

export type Topic = {
  id: string; // slug, unique across all subjects
  subjectId: string;
  /** Position in the subject's day-plan; null for free-list subjects. */
  day: number | null;
  title: string;
  tokenRewardBase: number;
  quiz: TopicQuestion[];

  // Structured chemistry-shaped fields — optional, absent for other subjects.
  rawMaterials?: string[];
  steps?: string[];
  equations?: string[];
  sideEffects?: SideEffect[];
  socialBenefits?: string[];
  flashcards?: Flashcard[];
  /** Free-form body for topics that don't fit the structured shape. */
  content?: Record<string, unknown>;
};

// ---------------------------------------------------------------------------
// SubjectDefinition — a subject is a code module. The generic renderer reads
// this; `components` / `grade` are opt-in bespoke overrides.
// ---------------------------------------------------------------------------

export type SectionKey = "overview" | "topics" | "resources" | "papers" | "quizzes";

export type SubjectMeta = {
  id: string;
  title: string;
  description: string;
  icon: string; // bootstrap-icons name
  /** CSS colour — sets --subject-accent for this subject's pages. */
  accent: string;
  /** Higher = earlier / more prominent in the sidebar. */
  navWeight: number;
};

export type TopicViewProps = { topic: Topic; subject: SubjectMeta; contentViewed: boolean; quizHref: string };
export type SubjectHomeProps = { subject: SubjectMeta };

export type SubjectDefinition = {
  meta: SubjectMeta;
  /** Which section tabs the subject exposes. */
  sections: SectionKey[];
  pacing: "day-plan" | "free-list";
  /** A day-plan subject's day → focus labels. */
  plan?: { day: number; focus: string }[];
  quiz: { passThreshold: number; questionTypes: QuestionType[] };
  topics: Topic[];
  /** Opt-in bespoke UI. Falls back to the shared renderer when absent. */
  components?: {
    SubjectHome?: ComponentType<SubjectHomeProps>;
    TopicView?: ComponentType<TopicViewProps>;
  };
  /** Opt-in grading override. Return undefined to fall through to the default grader. */
  grade?: (question: TopicQuestion, answer: { selectedIndex: number | null; value: string | null }) => boolean | undefined;
};
