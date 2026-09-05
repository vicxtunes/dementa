import Link from "next/link";
import { DAY_FOCUS, TOTAL_DAYS } from "@/lib/quick-solution/data/curriculum";

export type DayStatus = "not-started" | "in-progress" | "mastered";

export function DayRail({ statuses }: { statuses: Record<number, DayStatus> }) {
  return (
    <ol className="flex flex-col">
      {Array.from({ length: TOTAL_DAYS }, (_, i) => i + 1).map((day) => {
        const status = statuses[day] ?? "not-started";
        const isLast = day === TOTAL_DAYS;

        return (
          <li key={day} className="flex gap-4">
            <div className="flex flex-col items-center">
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-semibold ${
                  status === "mastered"
                    ? "border-flame bg-flame text-paper"
                    : status === "in-progress"
                      ? "border-amber text-ink"
                      : "border-ink/25 text-ink/50"
                }`}
              >
                {day}
              </span>
              {!isLast && <span className="mt-1 mb-1 w-px flex-1 bg-ink/15" />}
            </div>

            <Link
              href={`/quick-solution/v1/day/${day}`}
              className="group mb-6 flex flex-1 flex-col gap-0.5 border-b border-ink/10 pb-6"
            >
              <span className="text-xs font-medium uppercase tracking-wide text-ink/40">
                Day {day}
              </span>
              <span className="font-serif text-lg text-ink group-hover:text-flame">
                {DAY_FOCUS[day]}
              </span>
              <span className="text-xs text-ink/50">
                {status === "mastered"
                  ? "Mastered"
                  : status === "in-progress"
                    ? "In progress"
                    : "Not started"}
              </span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
