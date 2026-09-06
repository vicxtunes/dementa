import { notFound } from "next/navigation";
import { getTopic, getSubject } from "@/lib/domain/curriculum/queries";
import { QuizRunner } from "@/components/challenge/quiz-runner";
import { PageHeader } from "@/components/spark/primitives";

export default async function QuizPage({
  params,
}: {
  params: Promise<{ subjectId: string; topicId: string }>;
}) {
  const { subjectId, topicId } = await params;
  const subject = getSubject(subjectId);
  const topic = await getTopic(subjectId, topicId);
  if (!subject || !topic || topic.quiz.length === 0) notFound();

  return (
    <>
      <PageHeader
        title={`${topic.title} — Quiz`}
        subtitle={`${subject.title} · pass at 80% to master · +${topic.tokenRewardBase} tokens`}
      />
      <div className="row g-4">
        <div className="col-xl-8 col-lg-10">
          <QuizRunner
            subjectId={subjectId}
            topicId={topicId}
            topicTitle={topic.title}
            questions={topic.quiz}
          />
        </div>
      </div>
    </>
  );
}
