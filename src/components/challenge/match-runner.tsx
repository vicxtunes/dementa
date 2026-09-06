"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export type MatchQuestion = {
  question: string;
  type: "multiple_choice" | "numeric";
  options: string[] | null;
};

type Answer = { selectedIndex: number | null; value: string | null };

export function MatchRunner({ matchId, questions }: { matchId: string; questions: MatchQuestion[] }) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>(() =>
    questions.map(() => ({ selectedIndex: null, value: null }))
  );
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const q = questions[index];
  const answered = answers[index].selectedIndex !== null || (answers[index].value ?? "") !== "";

  function set(a: Answer) {
    setAnswers((prev) => prev.map((x, i) => (i === index ? a : x)));
  }

  function next() {
    if (q.type === "numeric" && draft.trim()) set({ selectedIndex: null, value: draft.trim() });
    if (index + 1 < questions.length) {
      setIndex((i) => i + 1);
      setDraft("");
      return;
    }
    setError(null);
    startTransition(async () => {
      const finalAnswers = answers.map((a, i) =>
        i === index && q.type === "numeric" && draft.trim() ? { selectedIndex: null, value: draft.trim() } : a
      );
      try {
        const res = await fetch(`/api/matches/${matchId}`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ action: "finish", answers: finalAnswers }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data.error ?? "Couldn't submit your answers.");
          return;
        }
        router.refresh();
      } catch {
        setError("Couldn't reach the server — check your connection.");
      }
    });
  }

  const pct = Math.round(((index + (answered ? 1 : 0)) / questions.length) * 100);

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Question {index + 1}</h2>
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
        <input
          className="form-control-custom"
          placeholder="Your answer"
          value={answers[index].value ?? draft}
          onChange={(e) => setDraft(e.target.value)}
        />
      ) : (
        <div className="flex flex-col gap-2">
          {(q.options ?? []).map((opt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => set({ selectedIndex: i, value: null })}
              className={`rounded-[12px] border px-4 py-3 text-left text-sm font-medium ${
                answers[index].selectedIndex === i
                  ? "border-[color:var(--brand-forest-medium)] bg-[#eef4f1]"
                  : "border-[color:var(--border-light)] bg-white hover:border-[color:var(--brand-forest-medium)]"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}

      {error && <div className="alert-custom alert-custom-danger d-block mt-3">{error}</div>}

      <button
        type="button"
        onClick={next}
        disabled={pending || (!answered && !draft.trim())}
        className="btn-custom btn-custom-primary mt-4 align-self-start"
      >
        {index + 1 < questions.length ? "Next" : pending ? "Submitting…" : "Finish"}
        <i className="bi bi-arrow-right" />
      </button>
    </div>
  );
}
