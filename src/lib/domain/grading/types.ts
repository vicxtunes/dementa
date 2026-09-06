export type GradableQuestion = {
  question_type: "multiple_choice" | "numeric";
  correct_index: number | null;
  correct_numeric_value: number | null;
  numeric_tolerance: number | null;
};

export type SubmittedAnswer = {
  selectedIndex: number | null;
  value: string | null;
};

export type Grader = {
  /** Returns true if the answer is correct for this question. */
  grade(question: GradableQuestion, answer: SubmittedAnswer): boolean;
};
