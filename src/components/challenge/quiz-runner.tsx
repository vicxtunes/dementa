"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { TopicQuestion } from "@/lib/subjects";
import { submitQuiz, type QuizResult } from "@/lib/actions/quiz";
import { numericMatches } from "@/lib/domain/grading/parse-number";

type Answer = { questionIndex: number; selectedIndex?: number; value?: string };

/** Local pre-check so the UI can show correct/incorrect immediately; the
 *  authoritative score + token award comes back from the server. */
function looksCorrect(q: TopicQuestion, a: Answer): boolean {
  if (q.type === "numeric") {
    return numericMatches(a.value ?? null, q.correctNumericValue ?? null, q.numericTolerance ?? null);
  }
  return a.selectedIndex === q.correctIndex;
}

export function QuizRunner({
  subjectId,
  topicId,
  topicTitle,
  questions,
}: {
  subjectId: string;
  topicId: string;
  topicTitle: string;
  questions: TopicQuestion[];
}) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>(() =>
    questions.map((_, i) => ({ questionIndex: i }))
  );
  const [locked, setLocked] = useState<boolean[]>(() => questions.map(() => false));
  const [numericDraft, setNumericDraft] = useState("");
  const [result, setResult] = useState<QuizResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const q = questions[index];
  const answer = answers[index];
  const isLocked = locked[index];
  const localScore = questions.filter((qq, i) => locked[i] && looksCorrect(qq, answers[i])).length;

  function lockIn(next: Answer) {
    setAnswers((prev) => prev.map((a, i) => (i === index ? next : a)));
    setLocked((prev) => prev.map((v, i) => (i === index ? true : v)));
  }

  function pickOption(optionIndex: number) {
    if (isLocked) return;
    lockIn({ questionIndex: index, selectedIndex: optionIndex });
  }

  function submitNumeric() {
    if (isLocked || !numericDraft.trim()) return;
    lockIn({ questionIndex: index, value: numericDraft.trim() });
  }

  function next() {
    if (index + 1 < questions.length) {
      setIndex((i) => i + 1);
      setNumericDraft("");
      return;
    }
    startTransition(async () => {
      const res = await submitQuiz({
        subjectId,
        topicId,
        answers: answers.map((a) => ({
          selectedIndex: a.selectedIndex ?? null,
          value: a.value ?? null,
        })),
      });
      setResult(res);
      router.refresh();
    });
  }

  function retake() {
    setIndex(0);
    setAnswers(questions.map((_, i) => ({ questionIndex: i })));
    setLocked(questions.map(() => false));
    setNumericDraft("");
    setResult(null);
  }

  if (result) {
    return (
      <div className="card">
        <div
          className="rounded-[14px] border border-[color:var(--border-light)] p-6 text-center"
          style={{ background: "#F8FAF9" }}
        >
          <p className="stat-label m-0">Result</p>
          <p className="stat-value my-1">
            {result.score} / {result.total}
          </p>
          <span className={`badge-table ${result.passed ? "success" : "failed"}`}>
            {result.passed ? "Passed — topic mastered" : "80% needed to master this topic"}
          </span>
          {result.tokensAwarded > 0 && (
            <p className="mt-2 mb-0" style={{ color: "var(--brand-forest-medium)", fontWeight: 700 }}>
              +{result.tokensAwarded} tokens · balance {result.newBalance} 🪙
            </p>
          )}
          {isPending && <p className="item-sub mt-2 mb-0">Saving…</p>}
        </div>

        <div className="d-flex flex-column gap-2 my-4">
          {questions.map((qq, i) => {
            const r = result.perQuestion[i];
            return (
              <div
                key={i}
                className={`alert-custom d-block ${r?.correct ? "alert-custom-success" : "alert-custom-danger"}`}
              >
                <p className="fw-bold mb-1">{qq.question}</p>
                <p className="mb-1">
                  Your answer:{" "}
                  {qq.type === "numeric"
                    ? (answers[i].value ?? "—")
                    : answers[i].selectedIndex != null
                      ? qq.options?.[answers[i].selectedIndex!]
                      : "—"}
                </p>
                <p className="mb-0" style={{ opacity: 0.85 }}>
                  {qq.explanation}
                </p>
              </div>
            );
          })}
        </div>

        <div className="d-flex gap-2">
          <button type="button" onClick={retake} className="btn-custom btn-custom-outline-primary">
            <i className="bi bi-arrow-repeat" /> Retake quiz
          </button>
          <Link href={`/subjects/${subjectId}`} className="btn-custom btn-custom-light">
            Back to subject
          </Link>
        </div>
      </div>
    );
  }

  const pct = Math.round(((index + (isLocked ? 1 : 0)) / questions.length) * 100);

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">{topicTitle}</h2>
        <span className="stat-label m-0">
          {index + 1} / {questions.length}
        </span>
      </div>

      <div className="progress mb-4" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="progress-bar bg-lime-accent" style={{ width: `${pct}%` }} />
      </div>

      <p className="mb-3" style={{ fontSize: "1.05rem", fontWeight: 600, color: "var(--text-main)" }}>
        {q.question}
      </p>

      {q.type === "numeric" ? (
        <div className="d-flex flex-column gap-2">
          <input
            className="form-control-custom"
            placeholder="e.g. 0.5  or  √3/2"
            value={isLocked ? (answer.value ?? "") : numericDraft}
            onChange={(e) => setNumericDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitNumeric()}
            disabled={isLocked}
            inputMode="text"
          />
          {!isLocked && (
            <button
              type="button"
              onClick={submitNumeric}
              disabled={!numericDraft.trim()}
              className="btn-custom btn-custom-primary align-self-start"
            >
              Submit answer
            </button>
          )}
          <p className="item-sub m-0">A math keypad and tolerance grading arrive with the Math subject.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {(q.options ?? []).map((option, i) => {
            const isCorrect = i === q.correctIndex;
            const isPicked = i === answer.selectedIndex;
            let cls =
              "border-[color:var(--border-light)] bg-white hover:border-[color:var(--brand-forest-medium)]";
            if (isLocked) {
              if (isCorrect) cls = "border-[color:var(--sys-green)] bg-[#f0fdf4] text-[#166534]";
              else if (isPicked) cls = "border-[color:var(--sys-red)] bg-[#fef2f2] text-[#991b1b]";
              else cls = "border-[color:var(--border-light)] opacity-55";
            }
            return (
              <button
                key={i}
                type="button"
                onClick={() => pickOption(i)}
                disabled={isLocked}
                className={`rounded-[12px] border px-4 py-3 text-left text-sm font-medium transition-colors disabled:cursor-default ${cls}`}
              >
                {option}
              </button>
            );
          })}
        </div>
      )}

      {isLocked && (
        <div
          className={`alert-custom d-block mt-3 ${
            looksCorrect(q, answer) ? "alert-custom-success" : "alert-custom-danger"
          }`}
        >
          {q.explanation}
        </div>
      )}

      {isLocked && (
        <button
          type="button"
          onClick={next}
          disabled={isPending}
          className="btn-custom btn-custom-primary mt-3 align-self-start"
        >
          {index + 1 < questions.length ? "Next question" : isPending ? "Grading…" : "See results"}
          <i className="bi bi-arrow-right" />
        </button>
      )}

      <p className="item-sub mt-3 mb-0">Provisional score: {localScore} / {questions.length}</p>
    </div>
  );
}
