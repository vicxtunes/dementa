import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEvent, myEntry, isLive } from "@/lib/domain/events/queries";
import { EventRunner } from "@/components/challenge/event-runner";
import { PageHeader } from "@/components/spark/primitives";
import type { MatchQuestion } from "@/components/challenge/match-runner";

export default async function EventPlayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) notFound();
  if (!isLive(event)) redirect(`/challenges/${id}`);
  if (await myEntry(id)) redirect(`/challenges/${id}`);

  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("quiz_questions")
    .select("id, question, question_type, options")
    .in("id", event.question_ids)
    .returns<{ id: string; question: string; question_type: "multiple_choice" | "numeric"; options: string[] | null }[]>();
  const byId = new Map((rows ?? []).map((r) => [r.id, r]));
  const questions: MatchQuestion[] = event.question_ids
    .map((qid) => byId.get(qid))
    .filter(Boolean)
    .map((r) => ({ question: r!.question, type: r!.question_type, options: r!.options }));

  return (
    <>
      <PageHeader title={event.title} subtitle="One attempt — answer carefully." />
      <div className="row g-4">
        <div className="col-xl-8 col-lg-10">
          <EventRunner challengeId={id} questions={questions} />
        </div>
      </div>
    </>
  );
}
