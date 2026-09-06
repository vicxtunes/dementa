import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SUBJECT_DEFINITIONS } from "@/lib/subjects";
import { getVisibleTopicIds } from "@/lib/domain/curriculum/queries";
import { myTeams, listClassTeams } from "@/lib/domain/teams/queries";
import { myMatches, describeMatch, getParticipants } from "@/lib/domain/matches/queries";
import { TeamQuizCreate } from "@/components/challenge/team-quiz-create";
import { PageHeader, BadgeTable } from "@/components/spark/primitives";

export default async function TeamQuizzesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [mine, classTeams, matches, meProfile] = await Promise.all([
    myTeams(),
    listClassTeams(),
    myMatches(),
    user
      ? supabase.from("profiles").select("token_balance").eq("id", user.id).maybeSingle<{ token_balance: number }>()
      : Promise.resolve({ data: null }),
  ]);
  const tokenBalance = meProfile?.data?.token_balance ?? 0;

  const visibleBySubject = await Promise.all(
    SUBJECT_DEFINITIONS.map(async (d) => ({ d, visible: await getVisibleTopicIds(d.meta.id) }))
  );
  const subjects = visibleBySubject
    .map(({ d, visible }) => ({
      id: d.meta.id,
      title: d.meta.title,
      topics: d.topics.filter((t) => visible.has(t.id)).map((t) => ({ id: t.id, title: t.title })),
    }))
    .filter((s) => s.topics.length > 0);

  const group = matches.filter((m) => m.mode === "group");
  const withParts = await Promise.all(
    group.slice(0, 15).map(async (m) => ({ m, parts: await getParticipants(m.id) }))
  );
  const involved = withParts.filter(({ parts }) => parts.some((p) => p.user_id === user?.id));

  return (
    <>
      <PageHeader title="Team quizzes" subtitle="Put your team up against another team in your class.">
        <Link href="/teams" className="btn-custom btn-custom-light btn-custom-sm">
          <i className="bi bi-people" /> Manage teams
        </Link>
      </PageHeader>

      <div className="row g-4">
        <div className="col-lg-6">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">New team quiz</h2>
            </div>
            {mine.length === 0 ? (
              <p className="item-sub m-0">
                You need a team first. <Link href="/teams" className="footer-link">Create or join one →</Link>
              </p>
            ) : subjects.length === 0 ? (
              <p className="item-sub m-0">No subjects with questions are available yet.</p>
            ) : (
              <TeamQuizCreate
                myTeams={mine.map((t) => ({ id: t.id, name: t.name, memberCount: t.members.length }))}
                classTeams={classTeams.map((t) => ({
                  id: t.id,
                  name: t.name,
                  memberCount: t.members.length,
                }))}
                subjects={subjects}
                tokenBalance={tokenBalance}
              />
            )}
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Your team quizzes</h2>
            </div>
            {involved.length === 0 ? (
              <p className="item-sub m-0">Nothing yet — start one on the left.</p>
            ) : (
              <div className="transaction-list">
                {involved.map(({ m, parts }) => {
                  const me = parts.find((p) => p.user_id === user?.id);
                  const myTeamId = me?.team_id;
                  const status =
                    m.status === "completed"
                      ? m.winner_ref === myTeamId
                        ? "Your team won"
                        : m.winner_ref === null
                          ? "Tie"
                          : "Your team lost"
                      : m.status === "declined"
                        ? "Called off"
                        : me?.status === "invited"
                          ? "Invited"
                          : me?.status === "finished"
                            ? "Waiting"
                            : "Your turn";
                  return (
                    <Link
                      key={m.id}
                      href={`/matches/${m.id}`}
                      className="transaction-item"
                      style={{ textDecoration: "none" }}
                    >
                      <div className="transaction-icon bg-forest-light text-lime">
                        <i className="bi bi-people-fill" />
                      </div>
                      <div className="transaction-info">
                        <div className="transaction-name">{describeMatch(m)}</div>
                        <div className="transaction-date">
                          {parts.length} player{parts.length === 1 ? "" : "s"}
                        </div>
                      </div>
                      <div className="transaction-amount">
                        <BadgeTable variant={m.status === "completed" ? "success" : "pending"}>
                          {status}
                        </BadgeTable>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
