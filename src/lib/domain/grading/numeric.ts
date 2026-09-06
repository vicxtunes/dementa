import type { Grader } from "./types";

/**
 * Phase-1 numeric grader: normalises common notations and evaluates simple
 * arithmetic / roots / fractions to a number, then compares within tolerance.
 * Phase 3 swaps the evaluator for mathjs (full expression support) and adds the
 * on-screen math keypad. Symbolic equivalence is out of scope either way.
 */
function evaluate(input: string): number | null {
  const s = input
    .trim()
    .toLowerCase()
    .replace(/√\s*(\d+(\.\d+)?)/g, "sqrt($1)")
    .replace(/√\s*\(([^)]+)\)/g, "sqrt($1)")
    .replace(/π/g, "pi")
    .replace(/[°]/g, "")
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/\s+/g, "");

  if (s === "") return null;

  // Only allow a safe arithmetic grammar.
  const safe = s.replace(/sqrt/g, "").replace(/pi/g, "");
  if (!/^[0-9+\-*/().]*$/.test(safe)) return null;

  try {
    const fn = new Function("sqrt", "pi", `return (${s});`);
    const v = fn(Math.sqrt, Math.PI);
    return typeof v === "number" && Number.isFinite(v) ? v : null;
  } catch {
    return null;
  }
}

export const numericGrader: Grader = {
  grade(question, answer) {
    if (question.correct_numeric_value == null || answer.value == null) return false;
    const v = evaluate(answer.value);
    if (v == null) return false;
    const tol = question.numeric_tolerance ?? 0.01;
    return Math.abs(v - question.correct_numeric_value) <= tol;
  },
};
