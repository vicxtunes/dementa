import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEvent, getLeaderboard, myEntry, eventSubjectLabel, eventTopicLabels, isLive } from "@/lib/domain/events/queries";
import { PageHeader, BadgeTable } from "@/components/spark/primitives";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const event = await getEvent(id);
  if (!event) notFound();

  const [leaderboard, mine] = await Promise.all([getLeaderboard(id), myEntry(id)]);
  const live = isLive(event);

  return (
    <>
      <Link href="/challenges" className="footer-link d-inline-flex align-items-center gap-1 mb-2">
        <i className="bi bi-arrow-left" /> All challenges
      </Link>
      <PageHeader
        title={event.title}
        subtitle={`${eventSubjectLabel(event)} · ${event.question_ids.length} questions · ${eventTopicLabels(event).join(", ")}`}
      >
        <BadgeTable variant={live ? "success" : "failed"}>{event.status}</BadgeTable>
      </PageHeader>

      <div className="row g-4">
        <div className="col-lg-5">
          <div className="card">
            {event.description && <p style={{ color: "var(--text-main)" }}>{event.description}</p>}
            {event.prize_tokens > 0 && (
              <div className="alert-custom alert-custom-primary d-block">
                🏆 <strong>{event.prize_tokens} tokens</strong>
                {event.prize_places > 1 ? ` shared by the top ${event.prize_places}` : " for the winner"}
                {event.prize_description ? ` — ${event.prize_description}` : ""}
              </div>
            )}
            {event.ends_at && (
              <p className="item-sub">Closes {new Date(event.ends_at).toLocaleString()}</p>
            )}

            {mine ? (
              <div className="rounded-[14px] p-4 text-center" style={{ background: "#F8FAF9" }}>
                <p className="stat-label m-0">Your entry</p>
                <p className="stat-value my-1">
                  {mine.score} / {mine.total}
                </p>
                <p className="item-sub m-0">One attempt each — this is locked in.</p>
              </div>
            ) : live ? (
              <Link href={`/challenges/${id}/play`} className="btn-custom btn-custom-primary btn-custom-lg align-self-start">
                Enter the challenge <i className="bi bi-arrow-right" />
              </Link>
            ) : (
              <p className="item-sub m-0">This challenge is not open for entries.</p>
            )}
          </div>
        </div>

        <div className="col-lg-7">
          <div className="table-card-custom">
            <div className="table-header-control">
              <span style={{ fontWeight: 700 }}>Leaderboard</span>
            </div>
            <div className="table-responsive">
              <table className="table-custom">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Student</th>
                    <th style={{ textAlign: "right" }}>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((r) => (
                    <tr key={r.user_id} style={r.user_id === user?.id ? { background: "rgba(180,241,5,0.08)" } : undefined}>
                      <td className="table-amount">{r.place}</td>
                      <td className="table-user-name">
                        {r.full_name ?? "Student"}
                        {r.place <= event.prize_places && event.prize_tokens > 0 && " 🏆"}
                      </td>
                      <td className="table-amount" style={{ textAlign: "right" }}>
                        {r.score}/{r.total}
                      </td>
                    </tr>
                  ))}
                  {leaderboard.length === 0 && (
                    <tr>
                      <td colSpan={3} className="text-center py-5 table-user-sub">
                        No entries yet — be the first.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
