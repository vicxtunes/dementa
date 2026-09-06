import Link from "next/link";
import { notFound } from "next/navigation";
import { loadDashboard } from "@/lib/domain/curriculum/dashboard";
import { getSubject } from "@/lib/domain/curriculum/queries";
import { createClient } from "@/lib/supabase/server";

type PaperRow = {
  id: string;
  title: string;
  assessment_type: "past_paper" | "timed_exam";
  source: string | null;
  token_reward_on_completion: number;
};

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

  const supabase = await createClient();
  const { data: papers } = await supabase
    .from("assessments")
    .select("id, title, assessment_type, source, token_reward_on_completion")
    .eq("subject_id", subjectId)
    .order("created_at", { ascending: false })
    .returns<PaperRow[]>();

  if (!papers || papers.length === 0) {
    return (
      <div className="card">
        <div className="subject-empty">
          <i className="bi bi-file-earmark-text" />
          <p className="m-0" style={{ fontWeight: 700, color: "var(--text-main)" }}>
            No papers yet
          </p>
          <p className="m-0">
            {isTeacher
              ? "Add a past paper or a timed exam for students to attempt online."
              : "No online papers have been set for this subject yet."}
          </p>
          {isTeacher && (
            <Link href={`/subjects/${subjectId}/manage`} className="btn-custom btn-custom-primary btn-custom-sm mt-2">
              <i className="bi bi-plus-lg" /> Add a paper
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
              <th>Type</th>
              <th>Reward</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {papers.map((p) => (
              <tr key={p.id}>
                <td>
                  <div className="table-user-name">{p.title}</div>
                  {p.source && <div className="table-user-sub">{p.source}</div>}
                </td>
                <td className="table-user-sub">
                  {p.assessment_type === "past_paper" ? "Past paper" : "Timed exam"}
                </td>
                <td className="table-amount">+{p.token_reward_on_completion} 🪙</td>
                <td style={{ textAlign: "right" }}>
                  <Link
                    href={`/subjects/${subjectId}/papers/${p.id}`}
                    className="btn-custom btn-custom-light btn-custom-sm"
                  >
                    Attempt
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
