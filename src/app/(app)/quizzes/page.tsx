import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SUBJECT_DEFINITIONS } from "@/lib/subjects";
import { getVisibleTopicIds } from "@/lib/domain/curriculum/queries";
import { myClassmates } from "@/lib/domain/classes/queries";
import { myMatches, describeMatch, getParticipants } from "@/lib/domain/matches/queries";
import { GeneralQuizCreate } from "@/components/challenge/general-quiz-create";
import { PageHeader, BadgeTable } from "@/components/spark/primitives";

export default async function QuizzesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const visibleBySubject = await Promise.all(
    SUBJECT_DEFINITIONS.map(async (d) => ({ d, visible: await getVisibleTopicIds(d.meta.id) }))
  );
  const subjects = visibleBySubject.map(({ d, visible }) => ({
    id: d.meta.id,
    title: d.meta.title,
    topics: d.topics.filter((t) => visible.has(t.id)).map((t) => ({ id: t.id, title: t.title })),
  }));

  const [classmates, matches, meProfile] = await Promise.all([
    myClassmates(),
    myMatches(),
    user
      ? supabase.from("profiles").select("token_balance").eq("id", user.id).maybeSingle<{ token_balance: number }>()
      : Promise.resolve({ data: null }),
  ]);
  const tokenBalance = meProfile?.data?.token_balance ?? 0;
  const general = matches.filter((m) => m.is_general);
  const withParts = await Promise.all(
    general.slice(0, 15).map(async (m) => ({ m, parts: await getParticipants(m.id) }))
  );
  const mine = withParts.filter(({ parts }) => parts.some((p) => p.user_id === user?.id));

  return (
    <>
      <PageHeader
        title="Quizzes"
        subtitle="Build your own quiz across any subjects — practise solo or challenge a classmate."
      >
        <Link href="/team-quizzes" className="btn-custom btn-custom-light btn-custom-sm">
          <i className="bi bi-people" /> Team quizzes
        </Link>
      </PageHeader>
      <div className="row g-4">
        <div className="col-lg-6">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">New quiz</h2>
            </div>
            <GeneralQuizCreate subjects={subjects} classmates={classmates} tokenBalance={tokenBalance} />
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Your quizzes</h2>
            </div>
            {mine.length === 0 ? (
              <p className="item-sub m-0">Nothing yet — build one on the left.</p>
            ) : (
              <div className="transaction-list">
                {mine.map(({ m, parts }) => {
                  const me = parts.find((p) => p.user_id === user?.id);
                  const status =
                    m.status === "completed"
                      ? m.mode === "solo"
                        ? `Scored ${me?.score ?? 0}/${m.question_ids.length}`
                        : m.winner_ref === user?.id
                          ? "You won"
                          : m.winner_ref === null
                            ? "Tie"
                            : "You lost"
                      : me?.status === "invited"
                        ? "Invited"
                        : me?.status === "finished"
                          ? "Waiting"
                          : "Your turn";
                  return (
                    <Link key={m.id} href={`/matches/${m.id}`} className="transaction-item" style={{ textDecoration: "none" }}>
                      <div className="transaction-icon bg-forest-light text-lime">
                        <i className={`bi ${m.mode === "solo" ? "bi-person" : "bi-controller"}`} />
                      </div>
                      <div className="transaction-info">
                        <div className="transaction-name">{describeMatch(m)}</div>
                        <div className="transaction-date">{parts.map((p) => p.full_name ?? "You").join(" vs ")}</div>
                      </div>
                      <div className="transaction-amount">
                        <BadgeTable variant={m.status === "completed" ? "success" : "pending"}>{status}</BadgeTable>
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
