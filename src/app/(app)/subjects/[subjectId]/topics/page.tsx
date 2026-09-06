import Link from "next/link";
import { notFound } from "next/navigation";
import { loadDashboard } from "@/lib/domain/curriculum/dashboard";
import { getSubject } from "@/lib/domain/curriculum/queries";
import { BadgeTable } from "@/components/spark/primitives";

export default async function TopicsPage({
  params,
}: {
  params: Promise<{ subjectId: string }>;
}) {
  const { subjectId } = await params;
  const subject = getSubject(subjectId);
  if (!subject) notFound();

  const d = await loadDashboard();
  const s = d.subject(subjectId);
  const href = (id: string) => `/subjects/${subjectId}/topics/${id}`;

  const row = (t: { id: string; title: string; tokenRewardBase: number; status: string }) => (
    <Link key={t.id} href={href(t.id)} className="transaction-item" style={{ textDecoration: "none" }}>
      <div className="transaction-icon bg-forest-light text-lime">
        <i
          className={`bi ${
            t.status === "mastered" ? "bi-check-lg" : t.status === "viewed" ? "bi-book" : "bi-circle"
          }`}
        />
      </div>
      <div className="transaction-info">
        <div className="transaction-name">{t.title}</div>
        <div className="transaction-date">
          {t.status === "mastered" ? "Mastered" : t.status === "viewed" ? "Notes read" : "Not started"}
        </div>
      </div>
      <div className="transaction-amount table-user-sub">+{t.tokenRewardBase} 🪙</div>
    </Link>
  );

  return (
    <div className="card">
      {s.hasPlan ? (
        <div className="d-flex flex-column gap-4">
          {s.plan.map((p) => (
            <div key={p.day}>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="stat-label m-0">
                  Day {p.day} · {p.focus}
                </span>
                <BadgeTable variant={p.mastered === p.total && p.total > 0 ? "success" : "pending"}>
                  {p.mastered}/{p.total}
                </BadgeTable>
              </div>
              <div className="transaction-list">{p.topics.map(row)}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="transaction-list">{s.perTopic.map(row)}</div>
      )}
    </div>
  );
}
