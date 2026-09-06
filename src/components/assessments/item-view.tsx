"use client";

import { assessmentMediaUrl } from "@/lib/domain/assessments/media";
import type { PaperItem, ItemAnswer } from "@/lib/domain/assessments/queries";

export function ItemView({
  item,
  answer,
  onChange,
  disabled = false,
}: {
  item: PaperItem;
  answer: ItemAnswer | undefined;
  onChange: (a: ItemAnswer) => void;
  disabled?: boolean;
}) {
  return (
    <div className="d-flex flex-column gap-3">
      <p style={{ whiteSpace: "pre-wrap", color: "var(--text-main)", fontSize: "1.02rem", margin: 0 }}>
        {item.scenario}
      </p>

      {item.images.length > 0 && (
        <div className="d-flex flex-wrap gap-3">
          {item.images.map((im) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={im.path}
              src={assessmentMediaUrl(im.path)}
              alt={im.caption ?? "support material"}
              style={{ maxWidth: 380, maxHeight: 300, objectFit: "contain", borderRadius: 10, border: "1px solid var(--border-light)" }}
            />
          ))}
        </div>
      )}

      {item.task_intro && <p className="item-sub" style={{ margin: 0 }}>{item.task_intro}</p>}

      {item.question_type === "mcq" && (
        <div className="d-flex flex-column gap-2">
          {item.mcq_options.map((opt, i) => {
            const selected = answer?.type === "mcq" && answer.choice === i;
            return (
              <button
                key={i}
                type="button"
                disabled={disabled}
                onClick={() => onChange({ type: "mcq", choice: i })}
                className="rounded-[12px] border px-4 py-3 text-left text-sm font-medium"
                style={{
                  borderColor: selected ? "var(--brand-forest-medium)" : "var(--border-light)",
                  background: selected ? "#eef4f1" : "#fff",
                }}
              >
                <strong className="me-2">{String.fromCharCode(65 + i)}.</strong>
                {opt}
              </button>
            );
          })}
        </div>
      )}

      {item.question_type === "short_answer" && (
        <input
          className="form-control-custom"
          placeholder="Your answer"
          disabled={disabled}
          value={answer?.type === "short_answer" ? answer.text : ""}
          onChange={(e) => onChange({ type: "short_answer", text: e.target.value })}
        />
      )}

      {item.question_type === "structured" && (
        <div className="d-flex flex-column gap-3">
          {item.sub_questions.map((sq) => {
            const parts = answer?.type === "structured" ? answer.parts : {};
            return (
              <div key={sq.label}>
                <label className="form-label-custom">
                  ({sq.label}) {sq.prompt}
                  {sq.marks ? <span className="item-sub"> — {sq.marks} mark{sq.marks === 1 ? "" : "s"}</span> : null}
                </label>
                <textarea
                  className="form-control-custom"
                  rows={3}
                  disabled={disabled}
                  value={parts[sq.label] ?? ""}
                  onChange={(e) =>
                    onChange({ type: "structured", parts: { ...parts, [sq.label]: e.target.value } })
                  }
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function blankAnswer(item: PaperItem): ItemAnswer {
  if (item.question_type === "mcq") return { type: "mcq", choice: null };
  if (item.question_type === "short_answer") return { type: "short_answer", text: "" };
  return { type: "structured", parts: {} };
}

export function isAnswered(a: ItemAnswer | undefined): boolean {
  if (!a) return false;
  if (a.type === "mcq") return a.choice != null;
  if (a.type === "short_answer") return a.text.trim() !== "";
  return Object.values(a.parts).some((v) => v.trim() !== "");
}
