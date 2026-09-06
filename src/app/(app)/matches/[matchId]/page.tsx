import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMatch, getParticipants, describeMatch } from "@/lib/domain/matches/queries";
import { MatchRunner, type MatchQuestion } from "@/components/challenge/match-runner";
import { MatchActions } from "@/components/challenge/match-actions";
import { PageHeader, BadgeTable } from "@/components/spark/primitives";

export default async function MatchPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const match = await getMatch(matchId);
  if (!match) notFound();
  const parts = await getParticipants(matchId);
  const me = parts.find((p) => p.user_id === user?.id);
  if (!me) notFound();

  const stake = match.settings?.token_entry_cost ?? 0;
  const opponents = parts.filter((p) => p.user_id !== user?.id);

  let body: React.ReactNode;

  if (match.status === "declined") {
    body = <div className="card"><p className="m-0">This match was declined. {stake > 0 && "Your stake was refunded."}</p></div>;
  } else if (me.status === "invited") {
    body = (
      <div className="card">
        <p className="mb-3">
          <strong>{opponents[0]?.full_name ?? "A classmate"}</strong> challenged you to a {match.question_ids.length}-question
          quiz on {describeMatch(match)}.{stake > 0 && ` Stake: ${stake} tokens each.`}
        </p>
        <MatchActions matchId={matchId} stake={stake} />
      </div>
    );
  } else if (me.status === "declined") {
    body = <div className="card"><p className="m-0">You declined this match.</p></div>;
  } else if (match.status === "completed") {
    const won = match.winner_ref === user?.id;
    const tie = match.winner_ref === null;
    body = (
      <div className="card">
        <div className="rounded-[14px] border border-[color:var(--border-light)] p-6 text-center" style={{ background: "#F8FAF9" }}>
          <p className="stat-label m-0">Result</p>
          <p className="stat-value my-1">{tie ? "Tie" : won ? "You won" : "You lost"}</p>
          <span className={`badge-table ${won ? "success" : tie ? "pending" : "failed"}`}>
            {parts.map((p) => `${p.full_name ?? "You"} ${p.score ?? 0}`).join("  ·  ")}
          </span>
          {won && stake > 0 && (
            <p className="mt-2 mb-0" style={{ color: "var(--brand-forest-medium)", fontWeight: 700 }}>
              +{stake * parts.filter((p) => p.status === "finished").length} tokens
            </p>
          )}
        </div>
      </div>
    );
  } else if (me.status === "finished") {
    body = (
      <div className="card">
        <p className="m-0">
          You scored <strong>{me.score}/{match.question_ids.length}</strong>. Waiting for{" "}
          {opponents.map((o) => o.full_name ?? "your opponent").join(", ")} to finish.
        </p>
      </div>
    );
  } else if (match.status === "pending") {
    body = (
      <div className="card">
        <p className="m-0">
          Waiting for {opponents.map((o) => o.full_name ?? "your opponent").join(", ")} to accept.
        </p>
      </div>
    );
  } else {
    // active + I'm joined + not finished → play
    const { data: rows } = await supabase
      .from("quiz_questions")
      .select("id, question, question_type, options")
      .in("id", match.question_ids)
      .returns<{ id: string; question: string; question_type: "multiple_choice" | "numeric"; options: string[] | null }[]>();
    const byId = new Map((rows ?? []).map((r) => [r.id, r]));
    const questions: MatchQuestion[] = match.question_ids
      .map((id) => byId.get(id))
      .filter(Boolean)
      .map((r) => ({ question: r!.question, type: r!.question_type, options: r!.options }));
    body = <MatchRunner matchId={matchId} questions={questions} />;
  }

  return (
    <>
      <Link href="/home" className="footer-link d-inline-flex align-items-center gap-1 mb-2">
        <i className="bi bi-arrow-left" /> Home
      </Link>
      <PageHeader
        title="Quiz duel"
        subtitle={`${describeMatch(match)} · ${parts.map((p) => p.full_name ?? "You").join(" vs ")}`}
      >
        <BadgeTable variant={match.status === "completed" ? "success" : "pending"}>{match.status}</BadgeTable>
      </PageHeader>
      <div className="row g-4">
        <div className="col-xl-8 col-lg-10">{body}</div>
      </div>
    </>
  );
}
