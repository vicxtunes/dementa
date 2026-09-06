"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { PaperRow, AssessmentSection, PaperItem, AttemptRow } from "@/lib/domain/assessments/queries";
import { assessmentMediaUrl } from "@/lib/domain/assessments/media";
import { scoreAttempt } from "@/lib/domain/assessments/grading";
import { SelfMarkPanel } from "./self-mark-panel";

type RevealKey = { correct_option: number | null; expected_answer: string | null; model_answers: Record<string, string> };

export function AttemptReview({
  paperId,
  paper,
  sections,
  items,
  attempt,
}: {
  paperId: string;
  paper: PaperRow;
  sections: AssessmentSection[];
  items: PaperItem[];
  attempt: AttemptRow;
}) {
  const router = useRouter();
  const [keys, setKeys] = useState<Record<string, RevealKey> | null>(null);
  const [selfMarks, setSelfMarks] = useState<Record<string, Record<string, number>>>(
    () => ({ ...(attempt.self_marks ?? {}) })
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/assessments/${paperId}/reveal`)
      .then((r) => r.json())
      .then((d) => setKeys(d.keys ?? null))
      .catch(() => setError("Could not load the marking scheme."));
  }, [paperId]);

  const marking = attempt.state === "self_marking";
  const completed = attempt.state === "completed";
  const canSelfMark = attempt.state === "submitted" || marking;

  // client-side breakdown for display (server is authoritative for stored totals)
  const breakdown = useMemo(() => {
    const keyMap = new Map(
      Object.entries(keys ?? {}).map(([id, k]) => [
        id,
        { item_id: id, correct_option: k.correct_option, expected_answer: k.expected_answer, accepted_answers: [], model_answers: k.model_answers },
      ])
    );
    return scoreAttempt(items, keyMap, attempt.answers ?? {}, sections, attempt.chosen_items ?? {});
  }, [keys, items, attempt.answers, attempt.chosen_items, sections]);

  const perItem = new Map(breakdown.perItem.map((p) => [p.itemId, p]));

  async function post(body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/assessments/${paperId}/attempt`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setBusy(false);
        return;
      }
      router.refresh();
    } catch {
      setError("Network error.");
      setBusy(false);
    }
  }

  const setMark = (itemId: string, label: string, value: number) =>
    setSelfMarks((prev) => ({ ...prev, [itemId]: { ...(prev[itemId] ?? {}), [label]: value } }));

  const provisionalSelf = useMemo(() => {
    let t = 0;
    for (const p of breakdown.perItem) {
      if (p.autogradable || !p.counted) continue;
      const m = selfMarks[p.itemId] ?? {};
      t += Object.values(m).reduce((s, v) => s + (Number(v) || 0), 0);
    }
    return t;
  }, [breakdown, selfMarks]);

  const autoScore = completed ? attempt.auto_score ?? breakdown.autoScore : breakdown.autoScore;
  const autoMax = attempt.auto_max ?? breakdown.autoMax;
  const selfMax = attempt.self_max ?? breakdown.selfMax;
  const totalScore = completed ? attempt.total_score ?? 0 : autoScore + (canSelfMark ? provisionalSelf : 0);
  const totalMax = (attempt.total_max ?? autoMax + selfMax) || autoMax + selfMax;

  return (
    <div className="d-flex flex-column gap-3">
      <div className="card">
        <div
          className="rounded-[14px] border border-[color:var(--border-light)] p-4 text-center"
          style={{ background: "#F8FAF9" }}
        >
          <p className="stat-label m-0">{completed ? "Result" : "Provisional score"}</p>
          <p className="stat-value my-1">
            {totalScore} / {totalMax}
          </p>
          <span className="item-sub">
            Auto {autoScore}/{autoMax}
            {selfMax > 0 && ` · Self-marked ${completed ? attempt.self_score ?? 0 : provisionalSelf}/${selfMax}`}
          </span>
          {completed && attempt.token_awarded && (
            <p className="mt-2 mb-0" style={{ color: "var(--brand-forest-medium)", fontWeight: 700 }}>
              +{paper.token_reward_on_completion} tokens
            </p>
          )}
        </div>

        {attempt.state === "submitted" && selfMax > 0 && (
          <button
            type="button"
            className="btn-custom btn-custom-primary align-self-start mt-3"
            disabled={busy}
            onClick={() => post({ action: "begin_self_mark" })}
          >
            Start marking your written answers
          </button>
        )}
        {marking && (
          <button
            type="button"
            className="btn-custom btn-custom-primary align-self-start mt-3"
            disabled={busy}
            onClick={() => post({ action: "finalize", selfMarks })}
          >
            {busy ? "Saving…" : "Finish marking"}
          </button>
        )}
        {completed && paper.kind === "revision" && (
          <button
            type="button"
            className="btn-custom btn-custom-light align-self-start mt-3"
            disabled={busy}
            onClick={() => post({ action: "start" })}
          >
            Start again
          </button>
        )}
        {error && <div className="alert-custom alert-custom-danger d-block mt-2">{error}</div>}
      </div>

      {!keys && <p className="item-sub">Loading the marking scheme…</p>}

      {keys &&
        items.map((item) => {
          const key = keys[item.id];
          const grade = perItem.get(item.id);
          const answer = attempt.answers?.[item.id];
          const auto = grade?.autogradable;

          return (
            <div className="card" key={item.id}>
              <div className="card-header">
                <h3 className="card-title" style={{ fontSize: "1rem" }}>
                  Item {item.item_number}
                  {item.max_marks != null ? ` (${item.max_marks} marks)` : ""}
                </h3>
                {auto && grade && (
                  <span className={`badge-table ${grade.autoAwarded > 0 ? "success" : "failed"}`}>
                    {grade.autoAwarded}/{grade.max}
                  </span>
                )}
              </div>

              <p style={{ whiteSpace: "pre-wrap", color: "var(--text-main)" }}>{item.scenario}</p>
              {item.images.map((im) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={im.path}
                  src={assessmentMediaUrl(im.path)}
                  alt={im.caption ?? "support material"}
                  style={{ maxWidth: 360, borderRadius: 8, marginBottom: 8 }}
                />
              ))}

              {item.question_type === "mcq" && (
                <ol type="A" className="ps-3 m-0">
                  {item.mcq_options.map((opt, i) => {
                    const picked = answer?.type === "mcq" && answer.choice === i;
                    const correct = key?.correct_option === i;
                    return (
                      <li
                        key={i}
                        style={{
                          color: correct ? "var(--sys-green, #157347)" : picked ? "var(--sys-red, #c0392b)" : "var(--text-main)",
                          fontWeight: correct || picked ? 700 : 400,
                        }}
                      >
                        {opt}
                        {correct && " ✓"}
                        {picked && !correct && " ✗ (your answer)"}
                      </li>
                    );
                  })}
                </ol>
              )}

              {item.question_type === "short_answer" && auto && (
                <div>
                  <div>
                    <span className="item-sub">Your answer: </span>
                    {answer?.type === "short_answer" && answer.text ? answer.text : <em className="item-sub">blank</em>}
                  </div>
                  {key?.expected_answer && (
                    <div className="alert-custom alert-custom-success d-block mt-1">
                      <strong>Expected:</strong> {key.expected_answer}
                    </div>
                  )}
                </div>
              )}

              {grade && !auto && grade.counted && (
                <SelfMarkPanel
                  item={item}
                  answer={answer}
                  reveal={key}
                  marks={selfMarks[item.id] ?? {}}
                  onChange={(label, value) => setMark(item.id, label, value)}
                  disabled={!marking}
                />
              )}
            </div>
          );
        })}
    </div>
  );
}
