"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { QuizQuestion } from "@/lib/quick-solution/types";
import { submitQuizAttempt } from "@/lib/quick-solution/actions/progress";
import { PASS_THRESHOLD } from "@/lib/quick-solution/data/curriculum";

export function QuizRunner({
  processId,
  processTitle,
  questions,
}: {
  processId: string;
  processTitle: string;
  questions: QuizQuestion[];
}) {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>(() => questions.map(() => null));
  const [finished, setFinished] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const question = questions[index];
  const score = answers.filter((a, i) => a === questions[i].correctIndex).length;
  const passed = questions.length > 0 && score / questions.length >= PASS_THRESHOLD;

  function pick(optionIndex: number) {
    if (picked !== null) return;
    setPicked(optionIndex);
    setAnswers((prev) => prev.map((a, i) => (i === index ? optionIndex : a)));
  }

  function next() {
    if (index + 1 < questions.length) {
      setIndex((i) => i + 1);
      setPicked(null);
    } else {
      setFinished(true);
      startTransition(async () => {
        await submitQuizAttempt(processId, score, questions.length);
        router.refresh();
      });
    }
  }

  function retake() {
    setIndex(0);
    setPicked(null);
    setAnswers(questions.map(() => null));
    setFinished(false);
  }

  if (finished) {
    return (
      <div className="flex flex-col gap-8">
        <div className="border border-ink/15 p-6 text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-ink/40">Result</p>
          <p className="mt-2 font-serif text-3xl font-semibold text-ink">
            {score} / {questions.length}
          </p>
          <p className={`mt-1 text-sm font-medium ${passed ? "text-flame" : "text-rust"}`}>
            {passed ? "Passed" : "Not yet — 80% needed to master this process"}
          </p>
          {isPending && <p className="mt-2 text-xs text-ink/40">Saving result…</p>}
        </div>

        <div className="flex flex-col gap-4">
          {questions.map((q, i) => {
            const chosen = answers[i];
            const correct = chosen === q.correctIndex;
            return (
              <div key={i} className="border-l-2 border-ink/15 pl-4">
                <p className="text-sm font-medium text-ink">{q.question}</p>
                <p className={`mt-1 text-sm ${correct ? "text-flame" : "text-rust"}`}>
                  Your answer: {chosen === null ? "—" : q.options[chosen]}
                </p>
                {!correct && (
                  <p className="text-sm text-flame">Correct answer: {q.options[q.correctIndex]}</p>
                )}
                <p className="mt-1 text-sm text-ink/60">{q.explanation}</p>
              </div>
            );
          })}
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={retake}
            className="border border-ink px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-ink hover:text-paper"
          >
            Retake quiz
          </button>
          <Link
            href="/quick-solution/v1/dashboard"
            className="border border-ink/20 px-4 py-2 text-sm font-medium text-ink/70 transition-colors hover:border-ink hover:text-ink"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-baseline justify-between">
        <h1 className="font-serif text-xl font-semibold text-ink">{processTitle} — Quiz</h1>
        <span className="text-sm text-ink/50">
          {index + 1} / {questions.length}
        </span>
      </div>

      <p className="text-base text-ink">{question.question}</p>

      <div className="flex flex-col gap-2">
        {question.options.map((option, i) => {
          const isCorrect = i === question.correctIndex;
          const isPicked = i === picked;
          let stateClass = "border-ink/20 hover:border-ink";
          if (picked !== null) {
            if (isCorrect) stateClass = "border-flame bg-flame/10 text-flame";
            else if (isPicked) stateClass = "border-rust bg-rust/10 text-rust";
            else stateClass = "border-ink/10 text-ink/40";
          }
          return (
            <button
              key={i}
              type="button"
              onClick={() => pick(i)}
              disabled={picked !== null}
              className={`border px-4 py-2.5 text-left text-sm transition-colors disabled:cursor-default ${stateClass}`}
            >
              {option}
            </button>
          );
        })}
      </div>

      {picked !== null && <p className="text-sm text-ink/60">{question.explanation}</p>}

      {picked !== null && (
        <button
          type="button"
          onClick={next}
          className="self-start border border-ink bg-ink px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-flame hover:border-flame"
        >
          {index + 1 < questions.length ? "Next question" : "See results"}
        </button>
      )}
    </div>
  );
}
