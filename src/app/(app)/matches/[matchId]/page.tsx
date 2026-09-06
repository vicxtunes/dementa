import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMatch, getParticipants, getMatchTeams, describeMatch } from "@/lib/domain/matches/queries";
import { MatchRunner, type MatchQuestion } from "@/components/challenge/match-runner";
import { MatchActions } from "@/components/challenge/match-actions";
import { MatchPoll } from "@/components/challenge/match-poll";
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

  const isGroup = match.mode === "group";
  const isSolo = match.mode === "solo";
  const stake = match.settings?.token_entry_cost ?? 0;
  const teams = isGroup ? await getMatchTeams(matchId) : [];
  const myTeam = teams.find((t) => t.team_id === me.team_id);
  const otherTeam = teams.find((t) => t.team_id !== me.team_id);
  const teammates = parts.filter((p) => p.user_id !== user?.id && p.team_id === me.team_id);
  const opponents = parts.filter((p) => (isGroup ? p.team_id !== me.team_id : p.user_id !== user?.id));

  const kind = isSolo ? "Practice" : isGroup ? "Team quiz" : "Quiz duel";
  const versus = isGroup
    ? `${myTeam?.name ?? "Your team"} vs ${otherTeam?.name ?? "the other team"}`
    : parts.map((p) => p.full_name ?? "You").join(" vs ");

  let body: React.ReactNode;

  if (match.status === "declined") {
    body = (
      <div className="card">
        <p className="m-0">
          This {isGroup ? "team quiz was called off" : "match was declined"}.{" "}
          {stake > 0 && "Any stake you paid was refunded."}
        </p>
      </div>
    );
  } else if (me.status === "declined") {
    body = (
      <div className="card">
        <p className="m-0">You turned down this {isGroup ? "team quiz" : "match"}.</p>
      </div>
    );
  } else if (me.status === "invited") {
    body = (
      <div className="card">
        <p className="mb-3">
          {isGroup ? (
            <>
              You&apos;ve been added to <strong>{myTeam?.name ?? "a team"}</strong> for a{" "}
              {match.question_ids.length}-question team quiz against{" "}
              <strong>{otherTeam?.name ?? "another team"}</strong> on {describeMatch(match)}.
              {stake > 0 && ` Stake: ${stake} tokens each.`}
            </>
          ) : (
            <>
              <strong>{opponents[0]?.full_name ?? "A classmate"}</strong> challenged you to a{" "}
              {match.question_ids.length}-question quiz on {describeMatch(match)}.
              {stake > 0 && ` Stake: ${stake} tokens each.`}
            </>
          )}
        </p>
        <MatchActions matchId={matchId} stake={stake} />
      </div>
    );
  } else if (match.status === "completed") {
    if (isGroup) {
      const won = match.winner_ref === me.team_id;
      const tie = match.winner_ref === null;
      const sorted = [...teams].sort((a, b) => a.slot.localeCompare(b.slot));
      body = (
        <div className="card">
          <div
            className="rounded-[14px] border border-[color:var(--border-light)] p-6 text-center"
            style={{ background: "#F8FAF9" }}
          >
            <p className="stat-label m-0">Result</p>
            <p className="stat-value my-1">{tie ? "Tie" : won ? "Your team won" : "Your team lost"}</p>
            <span className={`badge-table ${won ? "success" : tie ? "pending" : "failed"}`}>
              {sorted.map((t) => `${t.name} ${t.score ?? 0}`).join("  ·  ")}
            </span>
            {won && stake > 0 && (
              <p className="mt-2 mb-0" style={{ color: "var(--brand-forest-medium)", fontWeight: 700 }}>
                The pot was split among your team.
              </p>
            )}
          </div>
        </div>
      );
    } else {
      const won = match.winner_ref === user?.id;
      const tie = match.winner_ref === null;
      body = (
        <div className="card">
          <div
            className="rounded-[14px] border border-[color:var(--border-light)] p-6 text-center"
            style={{ background: "#F8FAF9" }}
          >
            <p className="stat-label m-0">Result</p>
            <p className="stat-value my-1">{isSolo ? "Practice complete" : tie ? "Tie" : won ? "You won" : "You lost"}</p>
            <span className={`badge-table ${won || isSolo ? "success" : tie ? "pending" : "failed"}`}>
              {parts.map((p) => `${p.full_name ?? "You"} ${p.score ?? 0}`).join("  ·  ")}
            </span>
            {won && stake > 0 && !isSolo && (
              <p className="mt-2 mb-0" style={{ color: "var(--brand-forest-medium)", fontWeight: 700 }}>
                +{stake * parts.filter((p) => p.status === "finished").length} tokens
              </p>
            )}
          </div>
        </div>
      );
    }
  } else if (me.status === "finished") {
    const waitingOn = isGroup
      ? "the other players"
      : opponents.map((o) => o.full_name ?? "your opponent").join(", ");
    body = (
      <div className="card">
        <p className="mb-2">
          You scored <strong>{me.score}/{match.question_ids.length}</strong>. Waiting for {waitingOn} to finish.
        </p>
        <MatchPoll />
      </div>
    );
  } else if (match.status === "pending") {
    const waitingOn = isGroup
      ? "players on both teams"
      : opponents.map((o) => o.full_name ?? "your opponent").join(", ");
    body = (
      <div className="card">
        <p className="mb-2">Waiting for {waitingOn} to accept.</p>
        <MatchPoll />
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
    body = (
      <>
        {isGroup && (
          <p className="item-sub mb-3">
            Playing for <strong>{myTeam?.name ?? "your team"}</strong>
            {teammates.length > 0 && ` with ${teammates.map((t) => t.full_name ?? "a teammate").join(", ")}`}.
          </p>
        )}
        <MatchRunner matchId={matchId} questions={questions} />
      </>
    );
  }

  return (
    <>
      <Link href="/home" className="footer-link d-inline-flex align-items-center gap-1 mb-2">
        <i className="bi bi-arrow-left" /> Home
      </Link>
      <PageHeader title={kind} subtitle={`${describeMatch(match)} · ${versus}`}>
        <BadgeTable variant={match.status === "completed" ? "success" : "pending"}>{match.status}</BadgeTable>
      </PageHeader>
      <div className="row g-4">
        <div className="col-xl-8 col-lg-10">{body}</div>
      </div>
    </>
  );
}
