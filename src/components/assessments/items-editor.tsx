"use client";

import { useState } from "react";
import { addItem, updateItem, deleteItem, moveItem } from "@/lib/domain/assessments/service";
import type { PaperItem, QuestionType, ItemKey } from "@/lib/domain/assessments/queries";
import { ImageUploader } from "./image-uploader";

type SectionOpt = { id: string; label: string };

const TYPE_LABEL: Record<QuestionType, string> = {
  mcq: "Multiple choice",
  short_answer: "Short answer",
  structured: "Structured",
};

export function ItemsEditor({
  subjectId,
  paperId,
  sections,
  items,
  keys,
}: {
  subjectId: string;
  paperId: string;
  sections: SectionOpt[];
  items: PaperItem[];
  keys: Record<string, ItemKey>;
}) {
  const [editing, setEditing] = useState<string | null>(null);

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Items ({items.length})</h2>
      </div>

      {items.length === 0 ? (
        <p className="item-sub">No items yet — add the first below.</p>
      ) : (
        <div className="d-flex flex-column gap-3 mb-4">
          {items.map((item, i) => (
            <div
              key={item.id}
              className="pb-3"
              style={{ borderBottom: "1px solid var(--border-light)" }}
            >
              <div className="d-flex justify-content-between align-items-start gap-2">
                <div>
                  <span className="badge-table success me-2">{TYPE_LABEL[item.question_type]}</span>
                  <span className="table-user-name">
                    Item {item.item_number}
                    {item.max_marks != null ? ` · ${item.max_marks} mark${item.max_marks === 1 ? "" : "s"}` : ""}
                  </span>
                  {item.section_id && (
                    <span className="item-sub d-block">
                      {sections.find((s) => s.id === item.section_id)?.label ?? "—"}
                    </span>
                  )}
                </div>
                <div className="d-flex gap-1">
                  <form action={moveItem}>
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="assessment_id" value={paperId} />
                    <input type="hidden" name="subject_id" value={subjectId} />
                    <button
                      type="submit"
                      name="dir"
                      value="up"
                      className="table-btn-action"
                      aria-label="Move up"
                      disabled={i === 0}
                    >
                      <i className="bi bi-arrow-up" />
                    </button>
                    <button
                      type="submit"
                      name="dir"
                      value="down"
                      className="table-btn-action"
                      aria-label="Move down"
                      disabled={i === items.length - 1}
                    >
                      <i className="bi bi-arrow-down" />
                    </button>
                  </form>
                  <button
                    type="button"
                    className="table-btn-action"
                    aria-label="Edit"
                    onClick={() => setEditing((e) => (e === item.id ? null : item.id))}
                  >
                    <i className="bi bi-pencil" />
                  </button>
                  <form action={deleteItem}>
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="assessment_id" value={paperId} />
                    <input type="hidden" name="subject_id" value={subjectId} />
                    <button className="table-btn-action delete" type="submit" aria-label="Delete">
                      <i className="bi bi-trash" />
                    </button>
                  </form>
                </div>
              </div>

              <p className="item-sub mt-1" style={{ whiteSpace: "pre-wrap" }}>
                {item.scenario.slice(0, 240)}
                {item.scenario.length > 240 ? "…" : ""}
              </p>

              <ImageUploader
                itemId={item.id}
                paperId={paperId}
                subjectId={subjectId}
                images={item.images}
              />

              {editing === item.id && (
                <div className="mt-3">
                  <ItemForm
                    action={updateItem}
                    subjectId={subjectId}
                    paperId={paperId}
                    sections={sections}
                    item={item}
                    itemKey={keys[item.id]}
                    onDone={() => setEditing(null)}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <h3 className="card-title" style={{ fontSize: "1rem" }}>
        Add an item
      </h3>
      <ItemForm action={addItem} subjectId={subjectId} paperId={paperId} sections={sections} />
    </div>
  );
}

// ---------------------------------------------------------------------------

function ItemForm({
  action,
  subjectId,
  paperId,
  sections,
  item,
  itemKey,
  onDone,
}: {
  action: (fd: FormData) => void | Promise<void>;
  subjectId: string;
  paperId: string;
  sections: SectionOpt[];
  item?: PaperItem;
  itemKey?: ItemKey;
  onDone?: () => void;
}) {
  const [qtype, setQtype] = useState<QuestionType>(item?.question_type ?? "structured");
  const [options, setOptions] = useState<string[]>(
    item?.mcq_options?.length ? item.mcq_options : ["", "", "", ""]
  );
  const [correct, setCorrect] = useState<number>(itemKey?.correct_option ?? 0);
  const [subs, setSubs] = useState<{ prompt: string; marks: string; model: string }[]>(
    item && item.question_type === "structured" && item.sub_questions.length
      ? item.sub_questions.map((sq) => ({
          prompt: sq.prompt,
          marks: String(sq.marks ?? 0),
          model: itemKey?.model_answers?.[sq.label] ?? "",
        }))
      : [{ prompt: "", marks: "3", model: "" }]
  );
  const [accepted, setAccepted] = useState<string[]>(
    itemKey?.accepted_answers?.length ? itemKey.accepted_answers : [""]
  );

  return (
    <form
      action={action}
      className="d-flex flex-column gap-3"
      style={{ background: "#F8FAF9", padding: 14, borderRadius: 12 }}
    >
      {item && <input type="hidden" name="id" value={item.id} />}
      <input type="hidden" name="assessment_id" value={paperId} />
      <input type="hidden" name="subject_id" value={subjectId} />

      <div className="d-flex gap-3 flex-wrap">
        <div className="flex-grow-1">
          <label className="form-label-custom">Question type</label>
          <select
            name="question_type"
            className="form-select-custom"
            value={qtype}
            onChange={(e) => setQtype(e.target.value as QuestionType)}
          >
            <option value="structured">Structured</option>
            <option value="mcq">Multiple choice</option>
            <option value="short_answer">Short answer</option>
          </select>
        </div>
        <div className="flex-grow-1">
          <label className="form-label-custom">Section</label>
          <select name="section_id" className="form-select-custom" defaultValue={item?.section_id ?? ""}>
            <option value="">No section</option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="form-label-custom">
          {qtype === "structured" ? "Scenario / stem" : "Question"}
        </label>
        <textarea
          name="scenario"
          className="form-control-custom"
          rows={qtype === "structured" ? 4 : 2}
          defaultValue={item?.scenario ?? ""}
          required
        />
      </div>

      {qtype === "structured" && (
        <>
          <div>
            <label className="form-label-custom">Task intro (optional)</label>
            <input
              name="task_intro"
              className="form-control-custom form-control-custom-sm"
              defaultValue={item?.task_intro ?? ""}
              placeholder="As a chemistry student, advise on:"
            />
          </div>
          <div>
            <span className="form-label-custom d-block">Sub-parts (i, ii, iii…)</span>
            <div className="d-flex flex-column gap-2">
              {subs.map((s, i) => (
                <div key={i} className="d-flex flex-column gap-1 pb-2" style={{ borderBottom: "1px dashed var(--border-light)" }}>
                  <div className="d-flex gap-2">
                    <input
                      name="sub_prompt"
                      className="form-control-custom form-control-custom-sm flex-grow-1"
                      placeholder={`Part ${i + 1} prompt`}
                      value={s.prompt}
                      onChange={(e) => setSubs((p) => p.map((x, j) => (j === i ? { ...x, prompt: e.target.value } : x)))}
                    />
                    <input
                      name="sub_marks"
                      type="number"
                      min={0}
                      className="form-control-custom form-control-custom-sm"
                      style={{ width: 80 }}
                      placeholder="marks"
                      value={s.marks}
                      onChange={(e) => setSubs((p) => p.map((x, j) => (j === i ? { ...x, marks: e.target.value } : x)))}
                    />
                    <button
                      type="button"
                      className="table-btn-action delete"
                      aria-label="Remove part"
                      onClick={() => setSubs((p) => (p.length > 1 ? p.filter((_, j) => j !== i) : p))}
                    >
                      <i className="bi bi-x-lg" />
                    </button>
                  </div>
                  <input
                    name="sub_model"
                    className="form-control-custom form-control-custom-sm"
                    placeholder="Model answer (hidden from students until they self-mark)"
                    value={s.model}
                    onChange={(e) => setSubs((p) => p.map((x, j) => (j === i ? { ...x, model: e.target.value } : x)))}
                  />
                </div>
              ))}
            </div>
            <button
              type="button"
              className="btn-custom btn-custom-light btn-custom-sm mt-2"
              onClick={() => setSubs((p) => [...p, { prompt: "", marks: "3", model: "" }])}
            >
              + Add sub-part
            </button>
          </div>
        </>
      )}

      {qtype === "mcq" && (
        <>
          <div>
            <span className="form-label-custom d-block">Options (pick the correct one)</span>
            <div className="d-flex flex-column gap-2">
              {options.map((opt, i) => (
                <div key={i} className="d-flex align-items-center gap-2">
                  <input
                    type="radio"
                    name="correct_option"
                    value={i}
                    checked={correct === i}
                    onChange={() => setCorrect(i)}
                    aria-label={`Option ${i + 1} is correct`}
                  />
                  <input
                    name="option"
                    className="form-control-custom form-control-custom-sm flex-grow-1"
                    placeholder={`Option ${i + 1}`}
                    value={opt}
                    onChange={(e) => setOptions((p) => p.map((x, j) => (j === i ? e.target.value : x)))}
                  />
                  <button
                    type="button"
                    className="table-btn-action delete"
                    aria-label="Remove option"
                    onClick={() =>
                      setOptions((p) => {
                        if (p.length <= 2) return p;
                        const next = p.filter((_, j) => j !== i);
                        setCorrect((c) => (c >= next.length ? next.length - 1 : c));
                        return next;
                      })
                    }
                  >
                    <i className="bi bi-x-lg" />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="btn-custom btn-custom-light btn-custom-sm mt-2"
              onClick={() => setOptions((p) => [...p, ""])}
            >
              + Add option
            </button>
          </div>
          <div style={{ width: 120 }}>
            <label className="form-label-custom">Marks</label>
            <input
              name="max_marks"
              type="number"
              min={1}
              className="form-control-custom form-control-custom-sm"
              defaultValue={item?.max_marks ?? 1}
            />
          </div>
        </>
      )}

      {qtype === "short_answer" && (
        <>
          <div>
            <label className="form-label-custom">Expected answer (leave blank to self-mark)</label>
            <input
              name="expected_answer"
              className="form-control-custom form-control-custom-sm"
              defaultValue={itemKey?.expected_answer ?? ""}
              placeholder="sodium chloride"
            />
          </div>
          <div>
            <span className="form-label-custom d-block">Also accept</span>
            <div className="d-flex flex-column gap-2">
              {accepted.map((a, i) => (
                <div key={i} className="d-flex gap-2">
                  <input
                    name="accepted_answer"
                    className="form-control-custom form-control-custom-sm flex-grow-1"
                    placeholder="NaCl"
                    value={a}
                    onChange={(e) => setAccepted((p) => p.map((x, j) => (j === i ? e.target.value : x)))}
                  />
                  <button
                    type="button"
                    className="table-btn-action delete"
                    aria-label="Remove"
                    onClick={() => setAccepted((p) => (p.length > 1 ? p.filter((_, j) => j !== i) : [""]))}
                  >
                    <i className="bi bi-x-lg" />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="btn-custom btn-custom-light btn-custom-sm mt-2"
              onClick={() => setAccepted((p) => [...p, ""])}
            >
              + Add accepted answer
            </button>
          </div>
          <div style={{ width: 120 }}>
            <label className="form-label-custom">Marks</label>
            <input
              name="max_marks"
              type="number"
              min={1}
              className="form-control-custom form-control-custom-sm"
              defaultValue={item?.max_marks ?? 1}
            />
          </div>
        </>
      )}

      <div className="d-flex gap-2">
        <button type="submit" className="btn-custom btn-custom-primary btn-custom-sm">
          {item ? "Save item" : "Add item"}
        </button>
        {onDone && (
          <button type="button" className="btn-custom btn-custom-light btn-custom-sm" onClick={onDone}>
            Close
          </button>
        )}
      </div>
    </form>
  );
}
