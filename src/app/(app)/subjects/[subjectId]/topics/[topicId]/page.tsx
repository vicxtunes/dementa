import Link from "next/link";
import { notFound } from "next/navigation";
import { loadDashboard } from "@/lib/domain/curriculum/dashboard";
import { getTopic, getSubject } from "@/lib/domain/curriculum/queries";
import { getSubjectDefinition } from "@/lib/subjects";
import { TopicContent } from "@/components/challenge/topic-content";
import { PageHeader } from "@/components/spark/primitives";
import type { ProgressRow } from "@/lib/domain/curriculum/types";

export default async function TopicPage({
  params,
}: {
  params: Promise<{ subjectId: string; topicId: string }>;
}) {
  const { subjectId, topicId } = await params;
  const subject = getSubject(subjectId);
  const topic = await getTopic(subjectId, topicId);
  if (!subject || !topic) notFound();

  const d = await loadDashboard();
  const viewed = Boolean(
    (d.progressRows as ProgressRow[]).find((r) => r.topic_id === topicId)?.content_viewed
  );
  const base = `/subjects/${subjectId}/topics/${topicId}`;

  // Bespoke topic renderer if the subject module ships one.
  const Bespoke = getSubjectDefinition(subjectId)?.components?.TopicView;

  return (
    <>
      <Link
        href={`/subjects/${subjectId}/topics`}
        className="footer-link d-inline-flex align-items-center gap-1 mb-2"
      >
        <i className="bi bi-arrow-left" /> All topics
      </Link>
      <PageHeader
        title={topic.title}
        subtitle={
          topic.day != null
            ? `${subject.title} · Day ${topic.day} · +${topic.tokenRewardBase} tokens to master`
            : `${subject.title} · +${topic.tokenRewardBase} tokens to master`
        }
      />
      <div className="row g-4">
        <div className="col-xl-9">
          {Bespoke ? (
            <Bespoke topic={topic} subject={subject} contentViewed={viewed} quizHref={`${base}/quiz`} />
          ) : (
            <TopicContent topic={topic} contentViewed={viewed} quizHref={`${base}/quiz`} />
          )}
        </div>
      </div>
    </>
  );
}
