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
  const [chosen, setChosen] = useState<Record<string, string[]>>(() => ({ ...(attempt.chosen_items ?? {}) }));
  const [flags, setFlags] = useState<Set<string>>(new Set());
  const [index, setIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const stateRef = useRef({ answers, chosen });
  useEffect(() => {
    stateRef.current = { answers, chosen };
  }, [answers, chosen]);
  const dirtyRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sectionById = new Map(sections.map((s) => [s.id, s]));
  const pickSection = (itemId: string) => {
    const it = items.find((x) => x.id === itemId);
    const sec = it?.section_id ? sectionById.get(it.section_id) : undefined;
    return sec && sec.pick_count != null ? sec : null;
  };
  const isChosen = (itemId: string) => {
    const sec = pickSection(itemId);
    return !sec || (chosen[sec.id] ?? []).includes(itemId);
  };

  const flush = useCallback(async () => {
    if (!dirtyRef.current) return;
    dirtyRef.current = false;
    if (timerRef.current) clearTimeout(timerRef.current);
    try {
      const res = await fetch(`/api/assessments/${paperId}/attempt`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "save",
          answers: stateRef.current.answers,
          chosenItems: stateRef.current.chosen,
        }),
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
    // typing into a not-yet-chosen pick-N item auto-selects it, if there's room
    const sec = pickSection(itemId);
    if (sec && !(chosen[sec.id] ?? []).includes(itemId)) {
      setChosen((prev) => {
        const cur = prev[sec.id] ?? [];
        if (cur.length >= (sec.pick_count ?? 0)) return prev;
        return { ...prev, [sec.id]: [...cur, itemId] };
      });
    }
    queueSave();
  }

  function toggleChosen(itemId: string) {
    const sec = pickSection(itemId);
    if (!sec) return;
    setError(null);
    setChosen((prev) => {
      const cur = prev[sec.id] ?? [];
      if (cur.includes(itemId)) return { ...prev, [sec.id]: cur.filter((x) => x !== itemId) };
      if (cur.length >= (sec.pick_count ?? 0)) {
        setError(`You've already chosen ${sec.pick_count} item${sec.pick_count === 1 ? "" : "s"} in ${sec.label}. Deselect one first.`);
        return prev;
      }
      return { ...prev, [sec.id]: [...cur, itemId] };
    });
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
  const counted = items.filter((it) => isChosen(it.id));
  const answered = counted.filter((it) => isAnswered(answers[it.id])).length;
  const current = answers[item.id] ?? blankAnswer(item);
  const currentSection = pickSection(item.id);
  const currentChosen = isChosen(item.id);
  const sectionPicks = currentSection ? (chosen[currentSection.id] ?? []).length : 0;

  return (
    <div className="row g-4">
      <div className="col-lg-8">
        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <div>
            <span className="stat-label m-0">
              Item {item.item_number} · {index + 1} / {items.length}
            </span>
            <div className="item-sub">
              {answered} / {counted.length} answered
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

          {currentSection && (
            <div
              className="d-flex justify-content-between align-items-center mb-3 p-2"
              style={{ background: "#F8FAF9", borderRadius: 10 }}
            >
              <span className="item-sub m-0">
                {currentSection.label}: answer {currentSection.pick_count} · {sectionPicks} chosen
              </span>
              <button
                type="button"
                className={`btn-custom btn-custom-sm ${currentChosen ? "btn-custom-primary" : "btn-custom-light"}`}
                onClick={() => toggleChosen(item.id)}
              >
                {currentChosen ? (
                  <>
                    <i className="bi bi-check-lg" /> Attempting
                  </>
                ) : (
                  "Attempt this item"
                )}
              </button>
            </div>
          )}

          <ItemView
            item={item}
            answer={current}
            onChange={(a) => setAnswer(item.id, a)}
            disabled={Boolean(currentSection) && !currentChosen}
          />

          {currentSection && !currentChosen && (
            <p className="item-sub mt-2">Tap &ldquo;Attempt this item&rdquo; (or just start typing) to answer this one.</p>
          )}

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
                  const unanswered = counted.length - answered;
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
              const unanswered = counted.length - answered;
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
