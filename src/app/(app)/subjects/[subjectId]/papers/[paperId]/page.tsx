import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSubject } from "@/lib/domain/curriculum/queries";
import { loadDashboard } from "@/lib/domain/curriculum/dashboard";
import { getRunnerPaper, getLatestAttempt } from "@/lib/domain/assessments/queries";
import { ensureAttemptFresh } from "@/lib/domain/assessments/attempts.server";
import { StartCard } from "@/components/assessments/start-card";
import { AssessmentRunner } from "@/components/assessments/assessment-runner";
import { AttemptReview } from "@/components/assessments/attempt-review";
import { PageHeader } from "@/components/spark/primitives";

export default async function PaperPage({
  params,
}: {
  params: Promise<{ subjectId: string; paperId: string }>;
}) {
  const { subjectId, paperId } = await params;
  const subject = getSubject(subjectId);
  const { profile } = await loadDashboard();
  if (profile.role === "teacher") redirect(`/subjects/${subjectId}/manage/papers/${paperId}`);

  const bundle = await getRunnerPaper(paperId);
  if (!subject || !bundle) notFound();
  const { paper, sections, items } = bundle;
  if (!paper.published) notFound();

  let attempt = await getLatestAttempt(paperId);
  if (attempt) attempt = (await ensureAttemptFresh(attempt.id)) ?? attempt;
  const serverNow = new Date().toISOString();

  const header = (
    <>
      <Link
        href={`/subjects/${subjectId}/papers`}
        className="footer-link d-inline-flex align-items-center gap-1 mb-2"
      >
        <i className="bi bi-arrow-left" /> Exams &amp; Papers
      </Link>
      <PageHeader
        title={paper.title}
        subtitle={`${paper.kind === "exam" ? "Exam" : "Revision paper"}${
          paper.duration_minutes ? ` · ${paper.duration_minutes} min` : ""
        } · +${paper.token_reward_on_completion} tokens on completion`}
      />
    </>
  );

  if (items.length === 0) {
    return (
      <>
        {header}
        <div className="card">
          <p className="item-sub m-0">This paper has no questions yet.</p>
        </div>
      </>
    );
  }

  if (!attempt) {
    return (
      <>
        {header}
        <StartCard paperId={paperId} paper={paper} sections={sections} itemCount={items.length} resuming={false} />
      </>
    );
  }

  if (attempt.state === "in_progress") {
    return (
      <>
        {header}
        <AssessmentRunner
          paperId={paperId}
          sections={sections}
          items={items}
          attempt={attempt}
          serverNow={serverNow}
        />
      </>
    );
  }

  return (
    <>
      {header}
      <AttemptReview paperId={paperId} paper={paper} sections={sections} items={items} attempt={attempt} />
    </>
  );
}
