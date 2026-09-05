import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/quick-solution/supabase/server";
import { processes, processesForDay, DAY_FOCUS, TOTAL_DAYS } from "@/lib/quick-solution/data/curriculum";
import { SiteHeader } from "@/components/quick-solution/site-header";
import { ProcessContent } from "@/components/quick-solution/process-content";
import type { Profile, ProgressRow } from "@/lib/quick-solution/types";

export default async function DayPage({ params }: { params: Promise<{ day: string }> }) {
  const { day: dayParam } = await params;
  const day = Number(dayParam);
  if (!Number.isInteger(day) || day < 1 || day > TOTAL_DAYS) notFound();

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

  const { data: progressRows } = await supabase
    .from("progress")
    .select("*")
    .eq("user_id", user.id)
    .returns<ProgressRow[]>();
  const progressByProcess = new Map((progressRows ?? []).map((row) => [row.process_id, row]));

  const dayProcesses = day === TOTAL_DAYS ? [] : processesForDay(day);
  if (day !== TOTAL_DAYS && dayProcesses.length === 0) notFound();

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader profile={profile} />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-10 px-6 py-10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-ink/40">Day {day}</p>
            <h1 className="font-serif text-2xl font-semibold text-ink">{DAY_FOCUS[day]}</h1>
          </div>
          <div className="flex gap-2 text-sm">
            {day > 1 && (
              <Link href={`/quick-solution/v1/day/${day - 1}`} className="text-flame hover:underline">
                ← Day {day - 1}
              </Link>
            )}
            {day < TOTAL_DAYS && (
              <Link href={`/quick-solution/v1/day/${day + 1}`} className="text-flame hover:underline">
                Day {day + 1} →
              </Link>
            )}
          </div>
        </div>

        {day === TOTAL_DAYS ? (
          <ReviewHub progressByProcess={progressByProcess} />
        ) : (
          dayProcesses.map((process) => (
            <ProcessContent
              key={process.id}
              process={process}
              contentViewed={Boolean(progressByProcess.get(process.id)?.content_viewed)}
            />
          ))
        )}

        <Link href="/quick-solution/v1/dashboard" className="text-sm text-ink/50 hover:text-ink">
          ← Back to dashboard
        </Link>
      </main>
    </div>
  );
}

function ReviewHub({ progressByProcess }: { progressByProcess: Map<string, ProgressRow> }) {
  return (
    <div className="flex flex-col gap-8">
      <p className="text-sm text-ink/60">
        Full mock exam — run through every process&apos;s quiz one more time before the real thing.
      </p>
      <ul className="flex flex-col gap-2">
        {processes.map((p) => {
          const mastered = progressByProcess.get(p.id)?.quiz_passed;
          return (
            <li key={p.id}>
              <Link
                href={`/quick-solution/v1/quiz/${p.id}`}
                className="flex items-center justify-between border border-ink/15 px-4 py-3 text-sm transition-colors hover:border-flame"
              >
                <span className="text-ink">
                  Day {p.day} · {p.title}
                </span>
                <span className={mastered ? "text-flame" : "text-ink/40"}>
                  {mastered ? "Mastered" : "Not yet mastered"}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
