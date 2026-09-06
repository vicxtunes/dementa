// Client helper — posts a quiz submission to the server-authoritative grader.

export type QuizResult = {
  score: number;
  total: number;
  passed: boolean;
  perQuestion: { correct: boolean }[];
  tokensAwarded: number;
  newBalance: number;
};

export async function submitQuiz(input: {
  subjectId: string;
  topicId: string;
  answers: { selectedIndex: number | null; value: string | null }[];
}): Promise<QuizResult> {
  const res = await fetch("/api/quiz-submissions", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    return {
      score: 0,
      total: input.answers.length,
      passed: false,
      perQuestion: input.answers.map(() => ({ correct: false })),
      tokensAwarded: 0,
      newBalance: 0,
    };
  }
  return (await res.json()) as QuizResult;
}
