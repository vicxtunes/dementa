import { redirect } from "next/navigation";
import { loadDashboard } from "@/lib/domain/curriculum/dashboard";
import { SUBJECT_DEFINITIONS } from "@/lib/subjects";
import { createEvent } from "@/lib/domain/events/service";
import { PageHeader } from "@/components/spark/primitives";

export default async function ManageEventsPage() {
  const { profile } = await loadDashboard();
  if (profile.role !== "teacher") redirect("/challenges");

  return (
    <>
      <PageHeader title="New challenge" subtitle="Pick topics, set a prize and a deadline." />
      <div className="row g-4">
        <div className="col-lg-7">
          <div className="card">
            <form action={createEvent} className="d-flex flex-column gap-3">
              <div>
                <label className="form-label-custom" htmlFor="title">
                  Title
                </label>
                <input id="title" name="title" className="form-control-custom" required placeholder="End-of-term Chemistry showdown" />
              </div>
              <div>
                <label className="form-label-custom" htmlFor="description">
                  Description
                </label>
                <textarea id="description" name="description" className="form-control-custom" rows={2} />
              </div>
              <div>
                <label className="form-label-custom" htmlFor="subject_id">
                  Subject
                </label>
                <select id="subject_id" name="subject_id" className="form-select-custom" defaultValue="">
                  <option value="">General (cross-subject)</option>
                  {SUBJECT_DEFINITIONS.map((d) => (
                    <option key={d.meta.id} value={d.meta.id}>
                      {d.meta.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <span className="form-label-custom d-block">Topics (tick any across subjects)</span>
                <div className="d-flex flex-column gap-2" style={{ maxHeight: 260, overflowY: "auto" }}>
                  {SUBJECT_DEFINITIONS.map((d) => (
                    <div key={d.meta.id}>
                      <div className="item-sub mb-1">{d.meta.title}</div>
                      {d.topics.map((t) => (
                        <label key={t.id} className="form-check-custom">
                          <input
                            type="checkbox"
                            name="topic_ids"
                            value={t.id}
                            className="form-check-input-custom"
                          />
                          <span>{t.title}</span>
                        </label>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
              <div className="d-flex gap-3">
                <div>
                  <label className="form-label-custom" htmlFor="question_count">
                    Questions
                  </label>
                  <input id="question_count" name="question_count" type="number" min={3} max={30} defaultValue={10} className="form-control-custom form-control-custom-sm" />
                </div>
                <div>
                  <label className="form-label-custom" htmlFor="prize_tokens">
                    Prize (tokens)
                  </label>
                  <input id="prize_tokens" name="prize_tokens" type="number" min={0} defaultValue={100} className="form-control-custom form-control-custom-sm" />
                </div>
                <div>
                  <label className="form-label-custom" htmlFor="prize_places">
                    Winners
                  </label>
                  <input id="prize_places" name="prize_places" type="number" min={1} defaultValue={1} className="form-control-custom form-control-custom-sm" />
                </div>
              </div>
              <div>
                <label className="form-label-custom" htmlFor="prize_description">
                  Prize note (optional)
                </label>
                <input id="prize_description" name="prize_description" className="form-control-custom" placeholder="+ a shout-out in class" />
              </div>
              <div>
                <label className="form-label-custom" htmlFor="ends_at">
                  Closes at
                </label>
                <input id="ends_at" name="ends_at" type="datetime-local" className="form-control-custom" />
              </div>
              <label className="form-check-custom">
                <input type="checkbox" name="publish" className="form-check-input-custom" defaultChecked />
                <span>Publish now (otherwise saved as a draft)</span>
              </label>
              <button type="submit" className="btn-custom btn-custom-primary align-self-start">
                Create challenge
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
