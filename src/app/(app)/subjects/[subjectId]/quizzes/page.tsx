import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSubject } from "@/lib/domain/curriculum/queries";
import { getVisibleTopics } from "@/lib/domain/curriculum/queries";
import { myClassmates } from "@/lib/domain/classes/queries";
import { myMatches, describeMatch, getParticipants } from "@/lib/domain/matches/queries";
import { DuelCreate } from "@/components/challenge/duel-create";
import { BadgeTable } from "@/components/spark/primitives";

export default async function SubjectQuizzesPage({
  params,
}: {
  params: Promise<{ subjectId: string }>;
}) {
  const { subjectId } = await params;
  const subject = getSubject(subjectId);
  if (!subject) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [topics, classmates, matches, meProfile] = await Promise.all([
    getVisibleTopics(subjectId),
    myClassmates(),
    myMatches(subjectId),
    user
      ? supabase.from("profiles").select("token_balance").eq("id", user.id).maybeSingle<{ token_balance: number }>()
      : Promise.resolve({ data: null }),
  ]);
  const tokenBalance = meProfile?.data?.token_balance ?? 0;

  // Only show matches I'm actually a participant in.
  const withParts = await Promise.all(
    matches.slice(0, 20).map(async (m) => ({ m, parts: await getParticipants(m.id) }))
  );
  const mine = withParts.filter(({ parts }) => parts.some((p) => p.user_id === user?.id));

  return (
    <div className="row g-4">
      <div className="col-lg-5">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Practice or challenge</h2>
          </div>
          <DuelCreate
            subjectId={subjectId}
            topics={topics.map((t) => ({ id: t.id, title: t.title }))}
            classmates={classmates}
            tokenBalance={tokenBalance}
          />
        </div>
      </div>

      <div className="col-lg-7">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Your quizzes</h2>
          </div>
          {mine.length === 0 ? (
            <p className="item-sub m-0">Nothing yet — practise solo or challenge a classmate.</p>
          ) : (
            <div className="transaction-list">
              {mine.map(({ m, parts }) => {
                const me = parts.find((p) => p.user_id === user?.id);
                const label =
                  m.status === "completed"
                    ? m.winner_ref === user?.id
                      ? "You won"
                      : m.winner_ref === null
                        ? "Tie"
                        : "You lost"
                    : m.status === "pending"
                      ? me?.status === "invited"
                        ? "Invited"
                        : "Waiting for opponent"
                      : me?.status === "finished"
                        ? "Waiting for opponent to finish"
                        : "Your turn";
                return (
                  <Link key={m.id} href={`/matches/${m.id}`} className="transaction-item" style={{ textDecoration: "none" }}>
                    <div className="transaction-icon bg-forest-light text-lime">
                      <i className="bi bi-controller" />
                    </div>
                    <div className="transaction-info">
                      <div className="transaction-name">{describeMatch(m)}</div>
                      <div className="transaction-date">
                        {parts.map((p) => p.full_name ?? "You").join(" vs ")}
                      </div>
                    </div>
                    <div className="transaction-amount">
                      <BadgeTable
                        variant={
                          m.status === "completed"
                            ? m.winner_ref === user?.id
                              ? "success"
                              : "failed"
                            : "pending"
                        }
                      >
                        {label}
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
  );
}
