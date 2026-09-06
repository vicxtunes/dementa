import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { loadDashboard } from "@/lib/domain/curriculum/dashboard";
import { getPaper, listItems } from "@/lib/domain/assessments/queries";
import { addItem, deleteItem } from "@/lib/domain/assessments/service";
import { PageHeader } from "@/components/spark/primitives";

export default async function EditPaperItemsPage({
  params,
}: {
  params: Promise<{ subjectId: string; paperId: string }>;
}) {
  const { subjectId, paperId } = await params;
  const { profile } = await loadDashboard();
  if (profile.role !== "teacher") redirect(`/subjects/${subjectId}`);

  const paper = await getPaper(paperId);
  if (!paper) notFound();
  const items = await listItems(paperId);

  return (
    <>
      <Link
        href={`/subjects/${subjectId}/manage`}
        className="footer-link d-inline-flex align-items-center gap-1 mb-2"
      >
        <i className="bi bi-arrow-left" /> Manage
      </Link>
      <PageHeader title={paper.title} subtitle={`${items.length} question${items.length === 1 ? "" : "s"}`} />

      <div className="row g-4">
        <div className="col-lg-7">
          {items.length === 0 ? (
            <div className="card">
              <p className="item-sub m-0">No questions yet — add the first one.</p>
            </div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {items.map((item) => (
                <div className="card" key={item.id}>
                  <div className="card-header">
                    <h3 className="card-title" style={{ fontSize: "1rem" }}>
                      {item.section ? `${item.section} · ` : ""}Question {item.item_number}
                    </h3>
                    <form action={deleteItem}>
                      <input type="hidden" name="id" value={item.id} />
                      <input type="hidden" name="assessment_id" value={paperId} />
                      <input type="hidden" name="subject_id" value={subjectId} />
                      <button className="table-btn-action delete" type="submit" aria-label="Delete">
                        <i className="bi bi-trash" />
                      </button>
                    </form>
                  </div>
                  <p className="item-sub" style={{ whiteSpace: "pre-wrap" }}>
                    {item.scenario}
                  </p>
                  <ol className="ps-3 m-0">
                    {item.sub_questions.map((sq) => (
                      <li key={sq.label} className="mb-1" style={{ color: "var(--text-main)" }}>
                        {sq.prompt}
                        {sq.model_answer && (
                          <span className="item-sub d-block">Model: {sq.model_answer}</span>
                        )}
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="col-lg-5">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title" style={{ fontSize: "1rem" }}>
                Add a question
              </h3>
            </div>
            <form action={addItem} className="d-flex flex-column gap-3">
              <input type="hidden" name="assessment_id" value={paperId} />
              <input type="hidden" name="subject_id" value={subjectId} />
              <div>
                <label className="form-label-custom" htmlFor="section">
                  Section (optional)
                </label>
                <input id="section" name="section" className="form-control-custom" placeholder="Section A" />
              </div>
              <div>
                <label className="form-label-custom" htmlFor="scenario">
                  Scenario / stem
                </label>
                <textarea id="scenario" name="scenario" className="form-control-custom" rows={4} required />
              </div>
              <p className="form-label-custom m-0">Sub-questions (i, ii, iii…)</p>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="d-flex flex-column gap-1">
                  <input name="prompt" className="form-control-custom form-control-custom-sm" placeholder={`Sub-question ${i + 1}`} />
                  <input name="model_answer" className="form-control-custom form-control-custom-sm" placeholder="Model answer (optional)" />
                </div>
              ))}
              <button type="submit" className="btn-custom btn-custom-primary align-self-start">
                Add question
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
