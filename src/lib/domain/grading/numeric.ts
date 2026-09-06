import type { Grader } from "./types";
import { numericMatches } from "./parse-number";

/**
 * Numeric grader — leans on `parseNumericAnswer` (decimals, fractions,
 * √/sqrt/root, π/pi, powers, percent, ×/÷, degree signs, "x =") and compares
 * within the question's tolerance, with a relative fallback when none is set.
 */
export const numericGrader: Grader = {
  grade(question, answer) {
    return numericMatches(answer.value, question.correct_numeric_value, question.numeric_tolerance);
  },
};
