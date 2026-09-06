import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { loadDashboard } from "@/lib/domain/curriculum/dashboard";
import { getPaper, listAttemptsForTeacher } from "@/lib/domain/assessments/queries";
import { closeExpiredAttempts } from "@/lib/domain/assessments/service";
import { PageHeader } from "@/components/spark/primitives";

export default async function PaperSubmissionsPage({
  params,
}: {
  params: Promise<{ subjectId: string; paperId: string }>;
}) {
  const { subjectId, paperId } = await params;
  const { profile } = await loadDashboard();
  if (profile.role !== "teacher") redirect(`/subjects/${subjectId}`);

  const paper = await getPaper(paperId);
  if (!paper) notFound();
  const attempts = await listAttemptsForTeacher(paperId);

  return (
    <>
      <Link
        href={`/subjects/${subjectId}/manage/papers/${paperId}`}
        className="footer-link d-inline-flex align-items-center gap-1 mb-2"
      >
        <i className="bi bi-arrow-left" /> Back to builder
      </Link>
      <PageHeader title={`${paper.title} — submissions`} subtitle={`${attempts.length} attempt${attempts.length === 1 ? "" : "s"}`}>
        {attempts.some((a) => a.state === "in_progress" && a.due_at && new Date(a.due_at) < new Date()) && (
          <form action={closeExpiredAttempts}>
            <input type="hidden" name="assessment_id" value={paperId} />
            <input type="hidden" name="subject_id" value={subjectId} />
            <button type="submit" className="btn-custom btn-custom-light btn-custom-sm">
              <i className="bi bi-hourglass-bottom" /> Close expired attempts
            </button>
          </form>
        )}
      </PageHeader>

      {attempts.length === 0 ? (
        <div className="card">
          <p className="item-sub m-0">No one has attempted this paper yet.</p>
        </div>
      ) : (
        <div className="table-card-custom">
          <div className="table-responsive">
            <table className="table-custom">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>State</th>
                  <th>Auto</th>
                  <th>Self</th>
                  <th>Total</th>
                  <th>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((a) => (
                  <tr key={a.id}>
                    <td className="table-user-name">{a.full_name ?? "Student"}</td>
                    <td className="table-user-sub">
                      {a.state}
                      {a.submitted_via === "timer" ? " (timer)" : ""}
                    </td>
                    <td>{a.auto_score != null ? `${a.auto_score}/${a.auto_max ?? "?"}` : "—"}</td>
                    <td>{a.self_score != null ? `${a.self_score}/${a.self_max ?? "?"}` : "—"}</td>
                    <td>{a.total_score != null ? `${a.total_score}/${a.total_max ?? "?"}` : "—"}</td>
                    <td className="table-user-sub">
                      {a.submitted_at ? new Date(a.submitted_at).toLocaleString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
