import Link from "next/link";
import { notFound } from "next/navigation";
import { getPaper, listItems, getMySubmission } from "@/lib/domain/assessments/queries";
import { getSubject } from "@/lib/domain/curriculum/queries";
import { PaperRunner } from "@/components/challenge/paper-runner";
import { PageHeader } from "@/components/spark/primitives";

export default async function PaperAttemptPage({
  params,
}: {
  params: Promise<{ subjectId: string; paperId: string }>;
}) {
  const { subjectId, paperId } = await params;
  const subject = getSubject(subjectId);
  const paper = await getPaper(paperId);
  if (!subject || !paper) notFound();

  const [items, submission] = await Promise.all([listItems(paperId), getMySubmission(paperId)]);

  return (
    <>
      <Link
        href={`/subjects/${subjectId}/papers`}
        className="footer-link d-inline-flex align-items-center gap-1 mb-2"
      >
        <i className="bi bi-arrow-left" /> All papers
      </Link>
      <PageHeader
        title={paper.title}
        subtitle={`${paper.source ?? (paper.assessment_type === "past_paper" ? "Past paper" : "Timed exam")} · self-marked · +${paper.token_reward_on_completion} tokens`}
      />
      {items.length === 0 ? (
        <div className="card">
          <p className="item-sub m-0">This paper has no questions yet.</p>
        </div>
      ) : (
        <div className="row g-4">
          <div className="col-xl-9">
            <PaperRunner
              paperId={paperId}
              items={items}
              initialAnswers={submission?.answers ?? {}}
              alreadyDone={Boolean(submission?.self_marked_done)}
            />
          </div>
        </div>
      )}
    </>
  );
}
