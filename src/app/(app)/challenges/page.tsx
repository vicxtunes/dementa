import Link from "next/link";
import { loadDashboard } from "@/lib/domain/curriculum/dashboard";
import { listEvents, eventSubjectLabel, isLive } from "@/lib/domain/events/queries";
import { setEventStatus, closeExpiredEvents } from "@/lib/domain/events/service";
import { LimeAsterisk, PageHeader, BadgeTable } from "@/components/spark/primitives";

function timeLeft(ends: string | null): string {
  if (!ends) return "No deadline";
  const ms = new Date(ends).getTime() - Date.now();
  if (ms <= 0) return "Ended";
  const days = Math.floor(ms / 86400000);
  if (days >= 1) return `${days}d left`;
  const hrs = Math.floor(ms / 3600000);
  return hrs >= 1 ? `${hrs}h left` : "Ends soon";
}

export default async function ChallengesPage() {
  const { profile } = await loadDashboard();
  const isTeacher = profile.role === "teacher";
  const events = await listEvents(isTeacher);

  return (
    <>
      <PageHeader
        title="Challenges"
        subtitle="Time-boxed events with prizes. Enter before the deadline — one attempt each."
      >
        {isTeacher && (
          <div className="d-flex gap-2">
            <form action={closeExpiredEvents}>
              <button className="btn-custom btn-custom-light btn-custom-sm" type="submit">
                Run close sweep
              </button>
            </form>
            <Link href="/challenges/manage" className="btn-custom btn-custom-primary btn-custom-sm">
              <i className="bi bi-plus-lg" /> New challenge
            </Link>
          </div>
        )}
      </PageHeader>

      {events.length === 0 ? (
        <div className="card">
          <div className="subject-empty">
            <i className="bi bi-trophy" />
            <p className="m-0" style={{ fontWeight: 700, color: "var(--text-main)" }}>
              No live challenges
            </p>
            <p className="m-0">
              {isTeacher ? "Create one to get the class competing." : "Check back — a new challenge could drop any time."}
            </p>
          </div>
        </div>
      ) : (
        <div className="row g-4">
          {events.map((e) => (
            <div className="col-md-6 col-xl-4" key={e.id}>
              <div className="card h-100 d-flex flex-column" style={{ position: "relative", overflow: "hidden" }}>
                <LimeAsterisk className="alert-green-bg-shape" />
                <div className="d-flex align-items-center justify-content-between mb-2 z-index-2">
                  <span className="badge-table" style={{ background: "#F8FAF9", color: "var(--text-muted-green)" }}>
                    {eventSubjectLabel(e)}
                  </span>
                  <BadgeTable variant={isLive(e) ? "success" : e.status === "closed" ? "failed" : "pending"}>
                    {e.status === "open" ? timeLeft(e.ends_at) : e.status}
                  </BadgeTable>
                </div>
                <h3 className="card-title z-index-2">{e.title}</h3>
                {e.description && <p className="item-sub z-index-2">{e.description}</p>}
                {e.prize_tokens > 0 && (
                  <p className="z-index-2 mb-2" style={{ fontWeight: 700, color: "var(--brand-forest-medium)" }}>
                    🏆 {e.prize_tokens} tokens{e.prize_places > 1 ? ` · top ${e.prize_places}` : ""}
                    {e.prize_description ? ` · ${e.prize_description}` : ""}
                  </p>
                )}
                <div className="mt-auto d-flex gap-2 z-index-2">
                  <Link href={`/challenges/${e.id}`} className="btn-custom btn-custom-primary btn-custom-sm">
                    {isLive(e) ? "Enter" : "View"}
                  </Link>
                  {isTeacher && e.status === "draft" && (
                    <form action={setEventStatus}>
                      <input type="hidden" name="id" value={e.id} />
                      <input type="hidden" name="status" value="open" />
                      <button className="btn-custom btn-custom-light btn-custom-sm" type="submit">
                        Publish
                      </button>
                    </form>
                  )}
                  {isTeacher && e.status === "closed" && (
                    <form action={setEventStatus}>
                      <input type="hidden" name="id" value={e.id} />
                      <input type="hidden" name="status" value="archived" />
                      <button className="btn-custom btn-custom-light btn-custom-sm" type="submit">
                        Archive
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
