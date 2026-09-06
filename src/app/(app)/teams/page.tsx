import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { listClassTeams, myTeams } from "@/lib/domain/teams/queries";
import { createTeam, joinTeam, leaveTeam } from "@/lib/actions/teams";
import { PageHeader } from "@/components/spark/primitives";

function MemberList({ names }: { names: (string | null)[] }) {
  if (names.length === 0) return <span className="item-sub">No members yet</span>;
  return <span className="item-sub">{names.map((n) => n ?? "Unnamed student").join(", ")}</span>;
}

export default async function TeamsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [mine, classTeams] = await Promise.all([myTeams(), listClassTeams()]);
  const myTeamIds = new Set(mine.map((t) => t.id));
  const joinable = classTeams.filter((t) => !myTeamIds.has(t.id));

  return (
    <>
      <PageHeader title="Teams" subtitle="Group up with classmates, then take on another team in a quiz.">
        <Link href="/team-quizzes" className="btn-custom btn-custom-primary btn-custom-sm">
          <i className="bi bi-controller" /> Start a team quiz
        </Link>
      </PageHeader>

      <div className="row g-4">
        <div className="col-lg-7">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Your teams</h2>
            </div>
            {mine.length === 0 ? (
              <p className="item-sub m-0">
                You&apos;re not on a team yet — create one, or join a classmate&apos;s below.
              </p>
            ) : (
              <div className="d-flex flex-column gap-3">
                {mine.map((t) => (
                  <div
                    key={t.id}
                    className="d-flex justify-content-between align-items-start gap-3 pb-3"
                    style={{ borderBottom: "1px solid var(--border-light)" }}
                  >
                    <div>
                      <div className="table-user-name">{t.name}</div>
                      <MemberList names={t.members.map((m) => m.full_name)} />
                      <div className="item-sub mt-1">
                        {t.members.length} member{t.members.length === 1 ? "" : "s"}
                      </div>
                    </div>
                    <form action={leaveTeam}>
                      <input type="hidden" name="teamId" value={t.id} />
                      <button type="submit" className="btn-custom btn-custom-light btn-custom-sm">
                        Leave
                      </button>
                    </form>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card mt-4">
            <div className="card-header">
              <h2 className="card-title">Other teams in your class</h2>
            </div>
            {joinable.length === 0 ? (
              <p className="item-sub m-0">No other teams yet.</p>
            ) : (
              <div className="d-flex flex-column gap-3">
                {joinable.map((t) => (
                  <div
                    key={t.id}
                    className="d-flex justify-content-between align-items-start gap-3 pb-3"
                    style={{ borderBottom: "1px solid var(--border-light)" }}
                  >
                    <div>
                      <div className="table-user-name">{t.name}</div>
                      <MemberList names={t.members.map((m) => m.full_name)} />
                    </div>
                    <form action={joinTeam}>
                      <input type="hidden" name="teamId" value={t.id} />
                      <button
                        type="submit"
                        className="btn-custom btn-custom-light btn-custom-sm"
                        disabled={t.members.some((m) => m.user_id === user?.id)}
                      >
                        Join
                      </button>
                    </form>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="col-lg-5">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">New team</h2>
            </div>
            <form action={createTeam} className="d-flex flex-column gap-3">
              <div>
                <label className="form-label-custom" htmlFor="name">
                  Team name
                </label>
                <input
                  id="name"
                  name="name"
                  className="form-control-custom"
                  placeholder="The Catalysts"
                  maxLength={60}
                  required
                />
              </div>
              <button type="submit" className="btn-custom btn-custom-primary align-self-start">
                Create team
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
