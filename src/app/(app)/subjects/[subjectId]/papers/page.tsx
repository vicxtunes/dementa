import Link from "next/link";
import { notFound } from "next/navigation";
import { loadDashboard } from "@/lib/domain/curriculum/dashboard";
import { getSubject } from "@/lib/domain/curriculum/queries";
import { listPapers } from "@/lib/domain/assessments/queries";

export default async function PapersPage({
  params,
}: {
  params: Promise<{ subjectId: string }>;
}) {
  const { subjectId } = await params;
  const subject = getSubject(subjectId);
  if (!subject) notFound();

  const { profile } = await loadDashboard();
  const isTeacher = profile.role === "teacher";

  const all = await listPapers(subjectId);
  const papers = isTeacher ? all : all.filter((p) => p.published);

  if (papers.length === 0) {
    return (
      <div className="card">
        <div className="subject-empty">
          <i className="bi bi-file-earmark-text" />
          <p className="m-0" style={{ fontWeight: 700, color: "var(--text-main)" }}>
            No exams or papers yet
          </p>
          <p className="m-0">
            {isTeacher
              ? "Build an exam or a revision paper for students to attempt online."
              : "Nothing has been set for this subject yet."}
          </p>
          {isTeacher && (
            <Link href={`/subjects/${subjectId}/manage`} className="btn-custom btn-custom-primary btn-custom-sm mt-2">
              <i className="bi bi-plus-lg" /> Build one
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="table-card-custom">
      <div className="table-responsive">
        <table className="table-custom">
          <thead>
            <tr>
              <th>Paper</th>
              <th>Kind</th>
              <th>Time</th>
              <th>Reward</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {papers.map((p) => (
              <tr key={p.id}>
                <td>
                  <div className="table-user-name">
                    {p.title}
                    {isTeacher && !p.published && <span className="badge-table pending ms-2">Draft</span>}
                  </div>
                  {p.source && <div className="table-user-sub">{p.source}</div>}
                </td>
                <td className="table-user-sub">{p.kind === "exam" ? "Exam" : "Revision paper"}</td>
                <td className="table-user-sub">{p.duration_minutes ? `${p.duration_minutes} min` : "Untimed"}</td>
                <td className="table-amount">+{p.token_reward_on_completion} 🪙</td>
                <td style={{ textAlign: "right" }}>
                  <Link
                    href={
                      isTeacher
                        ? `/subjects/${subjectId}/manage/papers/${p.id}`
                        : `/subjects/${subjectId}/papers/${p.id}`
                    }
                    className="btn-custom btn-custom-light btn-custom-sm"
                  >
                    {isTeacher ? "Edit" : "Open"}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
