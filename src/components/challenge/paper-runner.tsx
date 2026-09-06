"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { PaperItem } from "@/lib/domain/assessments/queries";

export function PaperRunner({
  paperId,
  items,
  initialAnswers,
  alreadyDone,
}: {
  paperId: string;
  items: PaperItem[];
  initialAnswers: Record<string, Record<string, string>>;
  alreadyDone: boolean;
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState(initialAnswers);
  const [done, setDone] = useState(alreadyDone);
  const [showModel, setShowModel] = useState(false);
  const [savedNote, setSavedNote] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function setAnswer(itemId: string, label: string, value: string) {
    setAnswers((prev) => ({ ...prev, [itemId]: { ...prev[itemId], [label]: value } }));
  }

  function submit(markDone: boolean) {
    startTransition(async () => {
      const res = await fetch("/api/assessment-submissions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ paperId, answers, markDone }),
      });
      const data = await res.json().catch(() => ({}));
      if (markDone) {
        setDone(true);
        setShowModel(true);
        setSavedNote(
          data.tokensAwarded > 0
            ? `Marked done · +${data.tokensAwarded} tokens (balance ${data.newBalance})`
            : "Marked done"
        );
      } else {
        setSavedNote("Progress saved");
      }
      router.refresh();
      setTimeout(() => setSavedNote(null), 4000);
    });
  }

  return (
    <div className="d-flex flex-column gap-4">
      {items.map((item) => (
        <div className="card" key={item.id}>
          <div className="card-header">
            <h2 className="card-title">
              {item.section ? `${item.section} · ` : ""}Question {item.item_number}
            </h2>
          </div>
          <p className="mb-3" style={{ color: "var(--text-main)", whiteSpace: "pre-wrap" }}>
            {item.scenario}
          </p>
          <div className="d-flex flex-column gap-3">
            {item.sub_questions.map((sq) => (
              <div key={sq.label}>
                <label className="form-label-custom">
                  ({sq.label}) {sq.prompt}
                </label>
                <textarea
                  className="form-control-custom"
                  rows={3}
                  value={answers[item.id]?.[sq.label] ?? ""}
                  onChange={(e) => setAnswer(item.id, sq.label, e.target.value)}
                  disabled={done}
                />
                {showModel && sq.model_answer && (
                  <div className="alert-custom alert-custom-success d-block mt-2">
                    <strong>Model answer:</strong> {sq.model_answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="d-flex flex-wrap align-items-center gap-2">
        {!done ? (
          <>
            <button
              type="button"
              className="btn-custom btn-custom-light"
              disabled={pending}
              onClick={() => submit(false)}
            >
              Save progress
            </button>
            <button
              type="button"
              className="btn-custom btn-custom-primary"
              disabled={pending}
              onClick={() => submit(true)}
            >
              Mark as done &amp; reveal model answers
            </button>
          </>
        ) : (
          <>
            <span className="badge-table success">
              <i className="bi bi-check-lg" /> Completed
            </span>
            <button
              type="button"
              className="btn-custom btn-custom-light btn-custom-sm"
              onClick={() => setShowModel((v) => !v)}
            >
              {showModel ? "Hide" : "Show"} model answers
            </button>
          </>
        )}
        {savedNote && <span className="item-sub">{savedNote}</span>}
      </div>
    </div>
  );
}
