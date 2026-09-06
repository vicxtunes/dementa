/**
 * Parse a student's free-text numeric answer into a number. Handles the forms
 * learners actually type: decimals, fractions, √ / sqrt / root, π / pi, powers
 * (^), percent, ×/÷, degree signs, a leading "x =", and light spacing.
 * Returns null if it can't be evaluated with a safe arithmetic grammar.
 */
export function parseNumericAnswer(input: string): number | null {
  if (input == null) return null;
  let s = input.trim().toLowerCase();
  if (s === "") return null;

  // strip a leading "x =", "ans:", "= "
  s = s.replace(/^[a-z]{0,4}\s*[:=]\s*/, "");

  s = s
    .replace(/√/g, "sqrt")
    .replace(/∛/g, "cbrt")
    .replace(/π/g, "pi")
    .replace(/[°]/g, "")
    .replace(/\bdeg(rees)?\b/g, "")
    .replace(/×/g, "*")
    .replace(/[÷:]/g, "/")
    .replace(/\^/g, "**")
    .replace(/\broot/g, "sqrt")
    .replace(/(\d+(?:\.\d+)?)\s*%/g, "($1/100)")
    .replace(/\s+/g, "");

  // give bare `sqrt`/`cbrt` an argument: sqrt3 -> sqrt(3), sqrt3/2 -> sqrt(3)/2
  s = s
    .replace(/sqrt(?!\()\s*(\d+(?:\.\d+)?)/g, "sqrt($1)")
    .replace(/cbrt(?!\()\s*(\d+(?:\.\d+)?)/g, "cbrt($1)");

  // safe grammar: after removing the known identifiers only arithmetic remains
  const bare = s.replace(/sqrt|cbrt|pi/g, "");
  if (!/^[0-9+\-*/().e]*$/.test(bare)) return null;
  if (/\bfunction\b|=>|\[|\]|`/.test(s)) return null;

  try {
    const fn = new Function("sqrt", "cbrt", "pi", `"use strict";return (${s});`);
    const v = fn(Math.sqrt, Math.cbrt, Math.PI);
    return typeof v === "number" && Number.isFinite(v) ? v : null;
  } catch {
    return null;
  }
}

/** True if `answer` evaluates within tolerance of `expected`. */
export function numericMatches(
  answer: string | null,
  expected: number | null,
  tolerance: number | null
): boolean {
  if (expected == null || answer == null) return false;
  const v = parseNumericAnswer(answer);
  if (v == null) return false;
  const tol = tolerance ?? Math.max(0.01, Math.abs(expected) * 0.01);
  return Math.abs(v - expected) <= tol;
}
