import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/quick-solution/supabase/server";
import { processById } from "@/lib/quick-solution/data/curriculum";
import { SiteHeader } from "@/components/quick-solution/site-header";
import { QuizRunner } from "@/components/quick-solution/quiz-runner";
import type { Profile } from "@/lib/quick-solution/types";

type QuizQuestionRow = {
  id: string;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string | null;
};

export default async function QuizPage({ params }: { params: Promise<{ processId: string }> }) {
  const { processId } = await params;
  const process = processById(processId);
  if (!process) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/quick-solution/v1/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();
  if (!profile) redirect("/quick-solution/v1/login");

  const { data: questionRows } = await supabase
    .from("quiz_questions")
    .select("*")
    .eq("process_id", processId)
    .returns<QuizQuestionRow[]>();

  const questions = (questionRows ?? []).map((row) => ({
    question: row.question,
    options: row.options,
    correctIndex: row.correct_index,
    explanation: row.explanation ?? "",
  }));

  if (questions.length === 0) notFound();

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader profile={profile} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
        <QuizRunner processId={process.id} processTitle={process.title} questions={questions} />
      </main>
    </div>
  );
}
