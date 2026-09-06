"use client";

import type { PaperItem, AssessmentSection, ItemAnswer } from "@/lib/domain/assessments/queries";
import { isAnswered } from "./item-view";

export function QuestionNavigator({
  items,
  sections,
  index,
  answers,
  flags,
  chosen,
  onJump,
}: {
  items: PaperItem[];
  sections: AssessmentSection[];
  index: number;
  answers: Record<string, ItemAnswer>;
  flags: Set<string>;
  chosen: Record<string, string[]>;
  onJump: (i: number) => void;
}) {
  const sectionById = new Map(sections.map((s) => [s.id, s]));
  const chosenSet = new Set(Object.values(chosen ?? {}).flat());

  // group item indices by section, in item order
  const groups: { section: AssessmentSection | null; entries: number[] }[] = [];
  items.forEach((it, i) => {
    const sec = it.section_id ? sectionById.get(it.section_id) ?? null : null;
    const last = groups[groups.length - 1];
    if (last && last.section?.id === sec?.id) last.entries.push(i);
    else groups.push({ section: sec, entries: [i] });
  });

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title" style={{ fontSize: "1rem" }}>
          Questions
        </h2>
      </div>
      <div className="d-flex flex-column gap-3">
        {groups.map((g, gi) => {
          const pick = g.section?.pick_count ?? null;
          const pickedCount = g.section ? (chosen[g.section.id] ?? []).length : 0;
          return (
            <div key={gi}>
              {g.section && (
                <div className="item-sub mb-1">
                  {g.section.label}
                  {pick != null && ` · answer ${pick} of ${g.entries.length} (${pickedCount}/${pick})`}
                </div>
              )}
              <div className="d-flex flex-wrap gap-2">
                {g.entries.map((i) => {
                  const it = items[i];
                  const optional = pick != null && !chosenSet.has(it.id);
                  const done = isAnswered(answers[it.id]);
                  const current = i === index;
                  return (
                    <button
                      key={it.id}
                      type="button"
                      onClick={() => onJump(i)}
                      aria-label={`Question ${it.item_number}${done ? ", answered" : ""}${current ? ", current" : ""}`}
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 9,
                        fontWeight: 700,
                        fontSize: 13,
                        border: current ? "2px solid var(--brand-forest-medium)" : "1px solid var(--border-light)",
                        background: optional ? "#f3f4f6" : done ? "#eef4f1" : "#fff",
                        color: optional ? "var(--text-muted-green, #6b7280)" : "var(--text-main)",
                        opacity: optional ? 0.7 : 1,
                        position: "relative",
                      }}
                    >
                      {it.item_number}
                      {flags.has(it.id) && (
                        <span style={{ position: "absolute", top: -4, right: -4, color: "var(--brand-orange, #d97706)" }}>
                          <i className="bi bi-flag-fill" style={{ fontSize: 10 }} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
