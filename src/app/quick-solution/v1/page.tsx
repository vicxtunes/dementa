import Link from "next/link";
import { createClient } from "@/lib/quick-solution/supabase/server";
import { DAY_FOCUS, TOTAL_DAYS, processes } from "@/lib/quick-solution/data/curriculum";

export default async function QuickSolutionLanding() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const days = Array.from({ length: TOTAL_DAYS }, (_, i) => i + 1);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-14 px-6 py-16">
      <section className="flex flex-col gap-5">
        <p className="text-xs font-medium tracking-wide text-flame">S.4 General · Chemistry</p>
        <h1 className="font-serif text-4xl font-semibold leading-tight text-ink sm:text-5xl">
          Industrial Processes — an 8-day revision sprint
        </h1>
        <p className="max-w-xl text-base leading-relaxed text-ink/70">
          Revise all {processes.length} industrial processes from your teacher&rsquo;s notes in
          eight focused days. Each day gives you the full write-up, a deck of flashcards, and an
          auto-graded quiz. Your scores are saved, and you can retake any quiz as many times as
          you need.
        </p>

        <div className="mt-2 flex flex-wrap gap-3">
          {user ? (
            <>
              <Link
                href="/quick-solution/v1/dashboard"
                className="border border-ink bg-ink px-5 py-2.5 text-sm font-medium text-paper transition-colors hover:border-flame hover:bg-flame"
              >
                Go to your dashboard
              </Link>
              <Link
                href="/quick-solution/v1/day/1"
                className="border border-ink/20 px-5 py-2.5 text-sm font-medium text-ink/70 transition-colors hover:border-ink hover:text-ink"
              >
                Jump to Day 1
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/quick-solution/v1/login"
                className="border border-ink bg-ink px-5 py-2.5 text-sm font-medium text-paper transition-colors hover:border-flame hover:bg-flame"
              >
                Log in
              </Link>
              <Link
                href="/quick-solution/v1/login"
                className="border border-ink/20 px-5 py-2.5 text-sm font-medium text-ink/70 transition-colors hover:border-ink hover:text-ink"
              >
                Create an account
              </Link>
            </>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-serif text-xl font-semibold text-ink">The 8-day plan</h2>
        <ol className="flex flex-col border-t border-ink/15">
          {days.map((day) => (
            <li
              key={day}
              className="flex items-baseline gap-4 border-b border-ink/10 py-3"
            >
              <span className="w-6 shrink-0 text-sm font-semibold text-ink/40">{day}</span>
              <span className="font-serif text-base text-ink">{DAY_FOCUS[day]}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="grid gap-6 sm:grid-cols-3">
        {[
          {
            title: "Content notes",
            body: "Raw materials, numbered steps, equations, side effects and their mitigations, and social benefits for every process.",
          },
          {
            title: "Flashcards",
            body: "A flip-card deck per process for quick, active recall before you sit the quiz.",
          },
          {
            title: "Auto-graded quizzes",
            body: "One question at a time with instant explanations. Pass at 80% to master a process; retake as often as you like.",
          },
        ].map((card) => (
          <div key={card.title} className="border-l-2 border-ink/15 pl-4">
            <h3 className="font-serif text-base font-semibold text-ink">{card.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-ink/60">{card.body}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
