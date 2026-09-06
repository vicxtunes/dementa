"use client";

import type { PaperItem, ItemAnswer } from "@/lib/domain/assessments/queries";
import { itemMax } from "@/lib/domain/assessments/grading";

type Reveal = { model_answers: Record<string, string>; expected_answer: string | null };

export function SelfMarkPanel({
  item,
  answer,
  reveal,
  marks,
  onChange,
  disabled,
}: {
  item: PaperItem;
  answer: ItemAnswer | undefined;
  reveal: Reveal | undefined;
  marks: Record<string, number>;
  onChange: (label: string, value: number) => void;
  disabled: boolean;
}) {
  const parts =
    item.question_type === "structured"
      ? item.sub_questions.map((sq) => ({ label: sq.label, prompt: sq.prompt, alloc: sq.marks ?? 0 }))
      : [{ label: "answer", prompt: "Your answer", alloc: itemMax(item) }];

  const answerFor = (label: string): string => {
    if (!answer) return "";
    if (answer.type === "structured") return answer.parts[label] ?? "";
    if (answer.type === "short_answer") return answer.text;
    return "";
  };

  return (
    <div className="d-flex flex-column gap-3">
      {parts.map((p) => (
        <div key={p.label} className="pb-2" style={{ borderBottom: "1px dashed var(--border-light)" }}>
          {item.question_type === "structured" && (
            <div className="item-sub">
              ({p.label}) {p.prompt} — {p.alloc} mark{p.alloc === 1 ? "" : "s"}
            </div>
          )}
          <div className="mt-1" style={{ whiteSpace: "pre-wrap" }}>
            <span className="item-sub">Your answer: </span>
            {answerFor(p.label) || <em className="item-sub">blank</em>}
          </div>
          {reveal?.model_answers?.[p.label] && (
            <div className="alert-custom alert-custom-success d-block mt-1">
              <strong>Model answer:</strong> {reveal.model_answers[p.label]}
            </div>
          )}
          {p.label === "answer" && reveal?.expected_answer && (
            <div className="alert-custom alert-custom-success d-block mt-1">
              <strong>Expected:</strong> {reveal.expected_answer}
            </div>
          )}
          <label className="form-label-custom mt-1">
            Marks you earned (0–{p.alloc})
          </label>
          <input
            type="number"
            min={0}
            max={p.alloc}
            className="form-control-custom form-control-custom-sm"
            style={{ width: 100 }}
            disabled={disabled}
            value={marks[p.label] ?? 0}
            onChange={(e) => onChange(p.label, Math.max(0, Math.min(p.alloc, Math.round(Number(e.target.value) || 0))))}
          />
        </div>
      ))}
    </div>
  );
}
