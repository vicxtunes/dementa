import { redirect } from "next/navigation";
import { createClient } from "@/lib/quick-solution/supabase/server";
import { processes, processesForDay, TOTAL_DAYS } from "@/lib/quick-solution/data/curriculum";
import { SiteHeader } from "@/components/quick-solution/site-header";
import { ProgressBar } from "@/components/quick-solution/progress-bar";
import { DayRail, type DayStatus } from "@/components/quick-solution/day-rail";
import type { Profile, ProgressRow } from "@/lib/quick-solution/types";

export default async function DashboardPage() {
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
  const masteredCount = processes.filter((p) => progressByProcess.get(p.id)?.quiz_passed).length;

  const statuses: Record<number, DayStatus> = {};
  for (let day = 1; day < TOTAL_DAYS; day++) {
    const dayProcesses = processesForDay(day);
    const allMastered = dayProcesses.every((p) => progressByProcess.get(p.id)?.quiz_passed);
    const anyStarted = dayProcesses.some(
      (p) => progressByProcess.get(p.id)?.content_viewed || progressByProcess.get(p.id)?.quiz_passed
    );
    statuses[day] = allMastered ? "mastered" : anyStarted ? "in-progress" : "not-started";
  }
  statuses[TOTAL_DAYS] = masteredCount === processes.length ? "mastered" : "not-started";

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader profile={profile} />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-10">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-ink">
            {profile.full_name ? `Welcome back, ${profile.full_name.split(" ")[0]}` : "Welcome back"}
          </h1>
          <p className="mt-1 text-sm text-ink/60">Class {profile.class_code} · 8-day sprint</p>
        </div>

        <ProgressBar current={masteredCount} total={processes.length} />

        <DayRail statuses={statuses} />
      </main>
    </div>
  );
}
