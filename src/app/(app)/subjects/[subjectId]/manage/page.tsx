import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { loadDashboard } from "@/lib/domain/curriculum/dashboard";
import { getSubject } from "@/lib/domain/curriculum/queries";
import { listSubjectResources } from "@/lib/domain/resources/queries";
import { createResource, deleteResource } from "@/lib/domain/resources/service";
import { listPapers } from "@/lib/domain/assessments/queries";
import { createPaper, deletePaper } from "@/lib/domain/assessments/service";

export default async function ManageSubjectPage({
  params,
}: {
  params: Promise<{ subjectId: string }>;
}) {
  const { subjectId } = await params;
  const subject = getSubject(subjectId);
  if (!subject) notFound();

  const { profile } = await loadDashboard();
  if (profile.role !== "teacher") redirect(`/subjects/${subjectId}`);

  const [resources, papers] = await Promise.all([listSubjectResources(subjectId), listPapers(subjectId)]);

  return (
    <div className="d-flex flex-column gap-4">
      {/* Resources ------------------------------------------------------- */}
      <div className="row g-4">
        <div className="col-lg-5">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Add a resource</h2>
            </div>
            <form action={createResource} className="d-flex flex-column gap-3">
              <input type="hidden" name="subject_id" value={subjectId} />
              <div>
                <label className="form-label-custom" htmlFor="kind">
                  Type
                </label>
                <select id="kind" name="kind" className="form-select-custom" defaultValue="note">
                  <option value="note">Revision note</option>
                  <option value="past_paper">Past paper (file / link)</option>
                  <option value="link">Link</option>
                </select>
              </div>
              <div>
                <label className="form-label-custom" htmlFor="title">
                  Title
                </label>
                <input id="title" name="title" className="form-control-custom" required placeholder="Balancing equations — notes" />
              </div>
              <div>
                <label className="form-label-custom" htmlFor="url">
                  Link / file URL
                </label>
                <input id="url" name="url" className="form-control-custom" type="url" placeholder="https://…" />
              </div>
              <div>
                <label className="form-label-custom" htmlFor="body">
                  Note (optional)
                </label>
                <textarea id="body" name="body" className="form-control-custom" rows={3} />
              </div>
              <div>
                <label className="form-label-custom" htmlFor="scope">
                  Visible to
                </label>
                <select id="scope" name="scope" className="form-select-custom" defaultValue="all">
                  <option value="all">Everyone in the subject</option>
                  <option value="my-class">Only my class</option>
                </select>
              </div>
              <button type="submit" className="btn-custom btn-custom-primary align-self-start">
                Add resource
              </button>
            </form>
          </div>
        </div>

        <div className="col-lg-7">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Resources ({resources.length})</h2>
            </div>
            {resources.length === 0 ? (
              <p className="item-sub m-0">Nothing added yet.</p>
            ) : (
              <div className="transaction-list">
                {resources.map((r) => (
                  <div className="transaction-item" key={r.id}>
                    <div className="transaction-icon bg-forest-light text-lime">
                      <i
                        className={`bi ${
                          r.kind === "past_paper" ? "bi-file-earmark-pdf" : r.kind === "link" ? "bi-link-45deg" : "bi-journal-text"
                        }`}
                      />
                    </div>
                    <div className="transaction-info">
                      <div className="transaction-name">{r.title}</div>
                      <div className="transaction-date">{r.class_code ? `Class ${r.class_code}` : "All classes"}</div>
                    </div>
                    <form action={deleteResource}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="subject_id" value={subjectId} />
                      <button className="table-btn-action delete" type="submit" aria-label="Delete">
                        <i className="bi bi-trash" />
                      </button>
                    </form>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Papers -------------------------------------------------------------- */}
      <div className="row g-4">
        <div className="col-lg-5">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Add a paper</h2>
            </div>
            <form action={createPaper} className="d-flex flex-column gap-3">
              <input type="hidden" name="subject_id" value={subjectId} />
              <div>
                <label className="form-label-custom" htmlFor="p-title">
                  Title
                </label>
                <input id="p-title" name="title" className="form-control-custom" required placeholder="2024 Joint Mock — Paper 1" />
              </div>
              <div className="d-flex gap-3">
                <div className="flex-grow-1">
                  <label className="form-label-custom" htmlFor="p-kind">
                    Kind
                  </label>
                  <select id="p-kind" name="kind" className="form-select-custom" defaultValue="revision">
                    <option value="revision">Revision paper (untimed, retakes)</option>
                    <option value="exam">Exam (strict timer, one attempt)</option>
                  </select>
                </div>
                <div style={{ width: 120 }}>
                  <label className="form-label-custom" htmlFor="p-dur">
                    Minutes
                  </label>
                  <input id="p-dur" name="duration_minutes" className="form-control-custom" type="number" min={1} placeholder="120" />
                </div>
              </div>
              <div>
                <label className="form-label-custom" htmlFor="p-format">
                  Format
                </label>
                <select id="p-format" name="format" className="form-select-custom" defaultValue="structured">
                  <option value="structured">Structured questions</option>
                  <option value="mcq">Multiple choice</option>
                  <option value="short_answer">Short answer</option>
                  <option value="mixed">Mixed</option>
                </select>
              </div>
              <div>
                <label className="form-label-custom" htmlFor="p-instructions">
                  Instructions to candidates (optional)
                </label>
                <textarea id="p-instructions" name="instructions" className="form-control-custom" rows={3} placeholder="Answer all items in Section A…" />
              </div>
              <div>
                <label className="form-label-custom" htmlFor="source">
                  Source (optional)
                </label>
                <input id="source" name="source" className="form-control-custom" placeholder="AITEL Joint Mocks 2025" />
              </div>
              <div className="d-flex gap-3 flex-wrap">
                <div style={{ width: 120 }}>
                  <label className="form-label-custom" htmlFor="p-cost">
                    Cost 🪙
                  </label>
                  <input id="p-cost" name="token_cost_to_attempt" className="form-control-custom" type="number" defaultValue={0} min={0} />
                </div>
                <div style={{ width: 120 }}>
                  <label className="form-label-custom" htmlFor="reward">
                    Reward 🪙
                  </label>
                  <input id="reward" name="token_reward_on_completion" className="form-control-custom" type="number" defaultValue={10} min={0} />
                </div>
                <div style={{ width: 110 }}>
                  <label className="form-label-custom" htmlFor="p-pass">
                    Pass %
                  </label>
                  <input id="p-pass" name="pass_pct" className="form-control-custom" type="number" defaultValue={80} min={0} max={100} />
                </div>
                <div className="flex-grow-1">
                  <label className="form-label-custom" htmlFor="p-scope">
                    Visible to
                  </label>
                  <select id="p-scope" name="scope" className="form-select-custom" defaultValue="all">
                    <option value="all">Everyone in the subject</option>
                    <option value="my-class">Only my class</option>
                  </select>
                </div>
              </div>
              <p className="item-sub m-0">
                Reward pays out only if the student reaches the pass mark. The entry cost is charged when they start.
              </p>
              <button type="submit" className="btn-custom btn-custom-primary align-self-start">
                Create &amp; build
              </button>
            </form>
          </div>
        </div>

        <div className="col-lg-7">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Papers ({papers.length})</h2>
            </div>
            {papers.length === 0 ? (
              <p className="item-sub m-0">No papers yet.</p>
            ) : (
              <div className="transaction-list">
                {papers.map((p) => (
                  <div className="transaction-item" key={p.id}>
                    <div className="transaction-icon bg-forest-light text-lime">
                      <i className="bi bi-file-earmark-text" />
                    </div>
                    <div className="transaction-info">
                      <div className="transaction-name">
                        {p.title}
                        {!p.published && <span className="badge-table pending ms-2">Draft</span>}
                      </div>
                      <div className="transaction-date">
                        {p.kind === "exam" ? "Exam" : "Revision paper"}
                        {p.duration_minutes ? ` · ${p.duration_minutes} min` : ""} ·{" "}
                        {p.class_code ? `Class ${p.class_code}` : "All classes"}
                      </div>
                    </div>
                    <div className="d-flex gap-1">
                      <Link
                        href={`/subjects/${subjectId}/manage/papers/${p.id}`}
                        className="table-btn-action"
                        aria-label="Edit questions"
                      >
                        <i className="bi bi-pencil" />
                      </Link>
                      <form action={deletePaper}>
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="subject_id" value={subjectId} />
                        <button className="table-btn-action delete" type="submit" aria-label="Delete">
                          <i className="bi bi-trash" />
                        </button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
