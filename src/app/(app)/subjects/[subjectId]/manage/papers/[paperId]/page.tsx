import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { loadDashboard } from "@/lib/domain/curriculum/dashboard";
import { getPaper, listSections, listItems, listItemKeys } from "@/lib/domain/assessments/queries";
import {
  updatePaper,
  setPaperPublished,
  addSection,
  updateSection,
  deleteSection,
  moveSection,
} from "@/lib/domain/assessments/service";
import { ItemsEditor } from "@/components/assessments/items-editor";
import { PageHeader } from "@/components/spark/primitives";

export default async function BuildPaperPage({
  params,
}: {
  params: Promise<{ subjectId: string; paperId: string }>;
}) {
  const { subjectId, paperId } = await params;
  const { profile } = await loadDashboard();
  if (profile.role !== "teacher") redirect(`/subjects/${subjectId}`);

  const paper = await getPaper(paperId);
  if (!paper) notFound();
  const [sections, items, keys] = await Promise.all([
    listSections(paperId),
    listItems(paperId),
    listItemKeys(paperId),
  ]);

  const keysForClient = Object.fromEntries(keys);

  return (
    <>
      <Link
        href={`/subjects/${subjectId}/manage`}
        className="footer-link d-inline-flex align-items-center gap-1 mb-2"
      >
        <i className="bi bi-arrow-left" /> Manage
      </Link>
      <PageHeader
        title={paper.title}
        subtitle={`${paper.kind === "exam" ? "Exam" : "Revision paper"}${
          paper.duration_minutes ? ` · ${paper.duration_minutes} min` : ""
        } · ${items.length} item${items.length === 1 ? "" : "s"}`}
      >
        <div className="d-flex gap-2">
          <Link
            href={`/subjects/${subjectId}/manage/papers/${paperId}/submissions`}
            className="btn-custom btn-custom-light btn-custom-sm"
          >
            <i className="bi bi-list-check" /> Submissions
          </Link>
          <form action={setPaperPublished}>
            <input type="hidden" name="id" value={paperId} />
            <input type="hidden" name="subject_id" value={subjectId} />
            <input type="hidden" name="published" value={(!paper.published).toString()} />
            <button
              type="submit"
              className={`btn-custom btn-custom-sm ${paper.published ? "btn-custom-light" : "btn-custom-primary"}`}
            >
              {paper.published ? "Unpublish" : "Publish"}
            </button>
          </form>
        </div>
      </PageHeader>

      {/* Settings ------------------------------------------------------------ */}
      <div className="card mb-4">
        <div className="card-header">
          <h2 className="card-title">Settings</h2>
        </div>
        <form action={updatePaper} className="d-flex flex-column gap-3">
          <input type="hidden" name="id" value={paperId} />
          <input type="hidden" name="subject_id" value={subjectId} />
          <div>
            <label className="form-label-custom" htmlFor="s-title">
              Title
            </label>
            <input id="s-title" name="title" className="form-control-custom" defaultValue={paper.title} required />
          </div>
          <div className="d-flex gap-3 flex-wrap">
            <div className="flex-grow-1">
              <label className="form-label-custom" htmlFor="s-kind">
                Kind
              </label>
              <select id="s-kind" name="kind" className="form-select-custom" defaultValue={paper.kind}>
                <option value="revision">Revision paper (untimed, retakes)</option>
                <option value="exam">Exam (strict timer, one attempt)</option>
              </select>
            </div>
            <div style={{ width: 120 }}>
              <label className="form-label-custom" htmlFor="s-dur">
                Minutes
              </label>
              <input
                id="s-dur"
                name="duration_minutes"
                className="form-control-custom"
                type="number"
                min={1}
                defaultValue={paper.duration_minutes ?? ""}
              />
            </div>
            <div className="flex-grow-1">
              <label className="form-label-custom" htmlFor="s-format">
                Format
              </label>
              <select id="s-format" name="format" className="form-select-custom" defaultValue={paper.format}>
                <option value="structured">Structured questions</option>
                <option value="mcq">Multiple choice</option>
                <option value="short_answer">Short answer</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>
            <div style={{ width: 160 }}>
              <label className="form-label-custom" htmlFor="s-reward">
                Reward (tokens)
              </label>
              <input
                id="s-reward"
                name="token_reward_on_completion"
                className="form-control-custom"
                type="number"
                min={0}
                defaultValue={paper.token_reward_on_completion}
              />
            </div>
          </div>
          <div>
            <label className="form-label-custom" htmlFor="s-instr">
              Instructions to candidates
            </label>
            <textarea
              id="s-instr"
              name="instructions"
              className="form-control-custom"
              rows={3}
              defaultValue={paper.instructions ?? ""}
            />
          </div>
          <button type="submit" className="btn-custom btn-custom-primary align-self-start">
            Save settings
          </button>
        </form>
      </div>

      {/* Sections ---------------------------------------------------------- */}
      <div className="card mb-4">
        <div className="card-header">
          <h2 className="card-title">Sections &amp; choice rules ({sections.length})</h2>
        </div>
        <p className="item-sub">
          Group items into sections. Leave &ldquo;Answer&rdquo; blank to require every item; set it to a number for
          &ldquo;answer N of these&rdquo;. Items in a pick-N section should carry equal marks.
        </p>

        {sections.length > 0 && (
          <div className="d-flex flex-column gap-3 mb-3">
            {sections.map((sec, i) => (
              <form
                key={sec.id}
                action={updateSection}
                className="d-flex flex-wrap align-items-end gap-2 pb-3"
                style={{ borderBottom: "1px solid var(--border-light)" }}
              >
                <input type="hidden" name="id" value={sec.id} />
                <input type="hidden" name="assessment_id" value={paperId} />
                <input type="hidden" name="subject_id" value={subjectId} />
                <div style={{ minWidth: 160 }} className="flex-grow-1">
                  <label className="form-label-custom">Label</label>
                  <input name="label" className="form-control-custom form-control-custom-sm" defaultValue={sec.label} required />
                </div>
                <div style={{ minWidth: 200 }} className="flex-grow-1">
                  <label className="form-label-custom">Instructions</label>
                  <input
                    name="instructions"
                    className="form-control-custom form-control-custom-sm"
                    defaultValue={sec.instructions ?? ""}
                    placeholder="Answer one item"
                  />
                </div>
                <div style={{ width: 90 }}>
                  <label className="form-label-custom">Answer</label>
                  <input
                    name="pick_count"
                    type="number"
                    min={1}
                    className="form-control-custom form-control-custom-sm"
                    defaultValue={sec.pick_count ?? ""}
                    placeholder="all"
                  />
                </div>
                <button type="submit" className="btn-custom btn-custom-light btn-custom-sm">
                  Save
                </button>
                <SectionMoveButtons first={i === 0} last={i === sections.length - 1} />
                <button
                  type="submit"
                  formAction={deleteSection}
                  className="table-btn-action delete"
                  aria-label="Delete section"
                >
                  <i className="bi bi-trash" />
                </button>
              </form>
            ))}
          </div>
        )}

        <form action={addSection} className="d-flex flex-wrap align-items-end gap-2">
          <input type="hidden" name="assessment_id" value={paperId} />
          <input type="hidden" name="subject_id" value={subjectId} />
          <div style={{ minWidth: 160 }} className="flex-grow-1">
            <label className="form-label-custom">New section label</label>
            <input name="label" className="form-control-custom form-control-custom-sm" placeholder="Section B — Part I" required />
          </div>
          <div style={{ minWidth: 200 }} className="flex-grow-1">
            <label className="form-label-custom">Instructions</label>
            <input name="instructions" className="form-control-custom form-control-custom-sm" placeholder="Answer one item" />
          </div>
          <div style={{ width: 90 }}>
            <label className="form-label-custom">Answer</label>
            <input name="pick_count" type="number" min={1} className="form-control-custom form-control-custom-sm" placeholder="all" />
          </div>
          <button type="submit" className="btn-custom btn-custom-primary btn-custom-sm">
            Add section
          </button>
        </form>
      </div>

      {/* Items ----------------------------------------------------------- */}
      <ItemsEditor
        subjectId={subjectId}
        paperId={paperId}
        sections={sections.map((s) => ({ id: s.id, label: s.label }))}
        items={items}
        keys={keysForClient}
      />
    </>
  );
}

function SectionMoveButtons({ first, last }: { first: boolean; last: boolean }) {
  return (
    <span className="d-flex gap-1">
      <button
        type="submit"
        formAction={moveSection}
        name="dir"
        value="up"
        className="table-btn-action"
        aria-label="Move up"
        disabled={first}
      >
        <i className="bi bi-arrow-up" />
      </button>
      <button
        type="submit"
        formAction={moveSection}
        name="dir"
        value="down"
        className="table-btn-action"
        aria-label="Move down"
        disabled={last}
      >
        <i className="bi bi-arrow-down" />
      </button>
    </span>
  );
}
