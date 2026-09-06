import type { GradableQuestion, Grader, SubmittedAnswer } from "./types";
import { multipleChoiceGrader } from "./multiple-choice";
import { numericGrader } from "./numeric";

export type { GradableQuestion, SubmittedAnswer } from "./types";

const GRADERS: Record<string, Grader> = {
  multiple_choice: multipleChoiceGrader,
  numeric: numericGrader,
};

export function gradeQuestion(question: GradableQuestion, answer: SubmittedAnswer): boolean {
  const grader = GRADERS[question.question_type];
  if (!grader) return false;
  return grader.grade(question, answer);
}

export function gradeQuiz(
  questions: GradableQuestion[],
  answers: SubmittedAnswer[]
): { perQuestion: { correct: boolean }[]; score: number; total: number } {
  const perQuestion = questions.map((q, i) => ({
    correct: gradeQuestion(q, answers[i] ?? { selectedIndex: null, value: null }),
  }));
  return {
    perQuestion,
    score: perQuestion.filter((r) => r.correct).length,
    total: questions.length,
  };
}
