"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { PaperItem, AssessmentSection, ItemAnswer, AttemptRow } from "@/lib/domain/assessments/queries";
import { ItemView, blankAnswer, isAnswered } from "./item-view";
import { QuestionNavigator } from "./question-navigator";
import { PaperTimer } from "./paper-timer";

const SAVE_DEBOUNCE_MS = 3500;

export function AssessmentRunner({
  paperId,
  sections,
  items,
  attempt,
  serverNow,
}: {
  paperId: string;
  sections: AssessmentSection[];
  items: PaperItem[];
  attempt: AttemptRow;
  serverNow: string;
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, ItemAnswer>>(() => ({ ...(attempt.answers ?? {}) }));
  const chosen = attempt.chosen_items ?? {}; // P5 makes this interactive
  const [flags, setFlags] = useState<Set<string>>(new Set());
  const [index, setIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const answersRef = useRef(answers);
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);
  const dirtyRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(async () => {
    if (!dirtyRef.current) return;
    dirtyRef.current = false;
    if (timerRef.current) clearTimeout(timerRef.current);
    try {
      const res = await fetch(`/api/assessments/${paperId}/attempt`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "save", answers: answersRef.current }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 409) {
        router.refresh(); // timer expired server-side
        return;
      }
      if (!res.ok) {
        setError(data.error ?? "Could not save.");
        return;
      }
      setError(null);
      setSavedAt(Date.now());
    } catch {
      setError("Network hiccup — your answers aren't saved yet.");
    }
  }, [paperId, router]);

  const queueSave = useCallback(() => {
    dirtyRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(flush, SAVE_DEBOUNCE_MS);
  }, [flush]);

  // flush on tab hide + unmount
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "hidden") void flush();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      void flush();
    };
  }, [flush]);

  function setAnswer(itemId: string, a: ItemAnswer) {
    setAnswers((prev) => ({ ...prev, [itemId]: a }));
    queueSave();
  }

  function goto(i: number) {
    if (i === index) return;
    void flush();
    setIndex(Math.max(0, Math.min(items.length - 1, i)));
  }

  function toggleFlag(itemId: string) {
    setFlags((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  }

  async function submit(via: "manual" | "timer") {
    if (submitting) return;
    setSubmitting(true);
    await flush();
    try {
      const res = await fetch(`/api/assessments/${paperId}/attempt`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "submit", via }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Could not submit.");
        setSubmitting(false);
        return;
      }
      router.refresh();
    } catch {
      setError("Could not submit — check your connection.");
      setSubmitting(false);
    }
  }

  const item = items[index];
  const answered = items.filter((it) => isAnswered(answers[it.id])).length;
  const current = answers[item.id] ?? blankAnswer(item);

  return (
    <div className="row g-4">
      <div className="col-lg-8">
        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <div>
            <span className="stat-label m-0">
              Item {item.item_number} · {index + 1} / {items.length}
            </span>
            <div className="item-sub">
              {answered} answered
              {savedAt && " · saved"}
            </div>
          </div>
          <PaperTimer dueAt={attempt.due_at} serverNow={serverNow} onExpire={() => submit("timer")} />
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              Item {item.item_number}
              {item.max_marks != null ? ` (${item.max_marks} marks)` : ""}
            </h2>
            <button
              type="button"
              className={`btn-custom btn-custom-sm ${flags.has(item.id) ? "btn-custom-warning" : "btn-custom-light"}`}
              onClick={() => toggleFlag(item.id)}
            >
              <i className="bi bi-flag" /> {flags.has(item.id) ? "Flagged" : "Flag"}
            </button>
          </div>

          <ItemView item={item} answer={current} onChange={(a) => setAnswer(item.id, a)} />

          {error && <div className="alert-custom alert-custom-danger d-block mt-3">{error}</div>}

          <div className="d-flex justify-content-between mt-4">
            <button
              type="button"
              className="btn-custom btn-custom-light"
              disabled={index === 0}
              onClick={() => goto(index - 1)}
            >
              <i className="bi bi-arrow-left" /> Previous
            </button>
            {index < items.length - 1 ? (
              <button type="button" className="btn-custom btn-custom-primary" onClick={() => goto(index + 1)}>
                Next <i className="bi bi-arrow-right" />
              </button>
            ) : (
              <button
                type="button"
                className="btn-custom btn-custom-primary"
                disabled={submitting}
                onClick={() => {
                  const unanswered = items.length - answered;
                  const msg =
                    unanswered > 0
                      ? `Submit now? ${unanswered} item${unanswered === 1 ? "" : "s"} still unanswered — you can't change your answers after this.`
                      : "Submit your paper? You can't change your answers after this.";
                  if (window.confirm(msg)) void submit("manual");
                }}
              >
                {submitting ? "Submitting…" : "Submit paper"}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="col-lg-4">
        <QuestionNavigator
          items={items}
          sections={sections}
          index={index}
          answers={answers}
          flags={flags}
          chosen={chosen}
          onJump={goto}
        />
        {items.length > 1 && (
          <button
            type="button"
            className="btn-custom btn-custom-primary w-100 mt-3"
            disabled={submitting}
            onClick={() => {
              const unanswered = items.length - answered;
              const msg =
                unanswered > 0
                  ? `Submit now? ${unanswered} item${unanswered === 1 ? "" : "s"} still unanswered.`
                  : "Submit your paper?";
              if (window.confirm(msg)) void submit("manual");
            }}
          >
            Submit paper
          </button>
        )}
      </div>
    </div>
  );
}
