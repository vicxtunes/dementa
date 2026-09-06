import Link from "next/link";
import { notFound } from "next/navigation";
import { loadDashboard } from "@/lib/domain/curriculum/dashboard";
import { getSubject } from "@/lib/domain/curriculum/queries";
import { getSubjectDefinition } from "@/lib/subjects";
import { BarChart, DonutChart, Sparkline } from "@/components/spark/charts";
import { AlertGreenCard, BadgeTable, CardHeader, TrendBadge } from "@/components/spark/primitives";

export default async function SubjectOverviewPage({
  params,
}: {
  params: Promise<{ subjectId: string }>;
}) {
  const { subjectId } = await params;
  const subject = getSubject(subjectId);
  if (!subject) notFound();

  // Bespoke overview if the subject module ships one.
  const Bespoke = getSubjectDefinition(subjectId)?.components?.SubjectHome;
  if (Bespoke) return <Bespoke subject={subject} />;

  const d = await loadDashboard();
  const s = d.subject(subjectId);
  const base = `/subjects/${subjectId}`;
  const topicHref = (id: string) => `${base}/topics/${id}`;

  return (
    <>
      <p className="page-subtitle mb-3">
        {subject.description} · {s.masteredCount} of {s.total} topics mastered
      </p>

      <div className="row g-4">
        <div className="col-md-4">
          <AlertGreenCard
            badge="Keep going"
            date={new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            text={
              s.masteredCount === s.total
                ? `Every topic in ${subject.title} mastered`
                : `${s.masteredCount} of ${s.total} topics mastered`
            }
            href={s.nextTopic ? topicHref(s.nextTopic.id) : `${base}/topics`}
            linkLabel={s.nextTopic ? `Continue: ${s.nextTopic.title}` : "Review"}
          />
        </div>
        <div className="col-md-4">
          <div className="card card-stat d-flex flex-column justify-content-between">
            <div>
              <div className="card-header">
                <span className="stat-label">Mastered</span>
              </div>
              <div className="stat-value">
                {s.masteredCount}
                <span className="text-muted-green fs-6 fw-semibold">/{s.total}</span>
              </div>
              <div className="trend-badge trend-up">
                <i className="bi bi-mortarboard" />
                <span>{s.total ? Math.round((s.masteredCount / s.total) * 100) : 0}% complete</span>
              </div>
            </div>
            <div className="sparkline-card-footer">
              <Sparkline data={s.masterySpark} color="up" />
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card card-stat d-flex flex-column justify-content-between">
            <div>
              <div className="card-header">
                <span className="stat-label">Average Score</span>
              </div>
              <div className="stat-value">{s.avgScore}%</div>
              {s.scoreTrend != null ? (
                <TrendBadge dir={s.scoreTrend >= 0 ? "up" : "down"}>
                  {s.scoreTrend >= 0 ? "+" : ""}
                  {s.scoreTrend}% vs. earlier
                </TrendBadge>
              ) : (
                <div className="trend-badge trend-up">
                  <i className="bi bi-clipboard-check" />
                  <span>{s.attemptCount} quiz attempts</span>
                </div>
              )}
            </div>
            <div className="sparkline-card-footer">
              <Sparkline data={s.scoreSpark} color={s.scoreTrend != null && s.scoreTrend < 0 ? "down" : "up"} />
            </div>
          </div>
        </div>

        <div className="col-xl-8">
          {s.hasPlan ? (
            <div className="card">
              <div className="card-header mb-2">
                <h2 className="card-title">Progress by day</h2>
              </div>
              <BarChart
                categories={s.plan.map((p) => `Day ${p.day}`)}
                series={[
                  { name: "Mastered", data: s.plan.map((p) => p.mastered) },
                  { name: "Remaining", data: s.plan.map((p) => p.total - p.mastered) },
                ]}
              />
            </div>
          ) : (
            <div className="card">
              <CardHeader title="Next up" />
              <div className="transaction-list">
                {s.perTopic.slice(0, 5).map((t) => (
                  <Link key={t.id} href={topicHref(t.id)} className="transaction-item" style={{ textDecoration: "none" }}>
                    <div className="transaction-icon bg-forest-light text-lime">
                      <i
                        className={`bi ${
                          t.status === "mastered"
                            ? "bi-check-lg"
                            : t.status === "attempted"
                              ? "bi-arrow-repeat"
                              : "bi-arrow-right"
                        }`}
                      />
                    </div>
                    <div className="transaction-info">
                      <div className="transaction-name">{t.title}</div>
                      <div className="transaction-date">
                        {t.status === "mastered"
                          ? "Mastered"
                          : t.status === "attempted"
                            ? `In progress${t.bestPct != null ? ` · best ${t.bestPct}%` : ""}`
                            : t.status === "viewed"
                              ? "Notes read"
                              : "Not started"}
                      </div>
                    </div>
                    <div className="transaction-amount table-user-sub">+{t.tokenRewardBase} 🪙</div>
                  </Link>
                ))}
              </div>
              <Link href={`${base}/topics`} className="btn-custom btn-custom-light btn-custom-sm mt-3 align-self-start">
                All topics
              </Link>
            </div>
          )}

          {s.recentAttempts.length > 0 && (
            <div className="card">
              <CardHeader title="Recent attempts" />
              <div className="transaction-list">
                {s.recentAttempts.slice(0, 5).map((a) => (
                  <div className="transaction-item" key={a.id}>
                    <div className="transaction-info">
                      <div className="transaction-name">{a.title}</div>
                      <div className="transaction-date">
                        {a.when.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </div>
                    </div>
                    <div className="transaction-amount">
                      <BadgeTable variant={a.passed ? "success" : "pending"}>
                        {a.score}/{a.total}
                      </BadgeTable>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="col-xl-4">
          <div className="card">
            <div className="card-header mb-1">
              <h2 className="card-title">Mastery</h2>
            </div>
            <DonutChart
              labels={["Mastered", "In progress", "Not started"]}
              series={[s.masteredCount, s.attemptedCount + s.viewedCount, s.notStartedCount]}
              totalLabel="Topics"
            />
            <div className="chart-legends-container">
              <div className="chart-legend-item">
                <span className="legend-dot bg-lime-accent" />
                <span className="text-muted-green">Mastered</span>
              </div>
              <div className="chart-legend-item">
                <span className="legend-dot bg-forest-medium" />
                <span className="text-muted-green">In progress</span>
              </div>
              <div className="chart-legend-item">
                <span className="legend-dot bg-brand-orange" />
                <span className="text-muted-green">Not started</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
