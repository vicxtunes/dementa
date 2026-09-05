import { redirect } from "next/navigation";
import { createClient } from "@/lib/quick-solution/supabase/server";
import { SiteHeader } from "@/components/quick-solution/site-header";
import type { ClassOverviewRow, Profile } from "@/lib/quick-solution/types";

export default async function TeacherPage() {
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
  if (profile.role !== "teacher") redirect("/quick-solution/v1/dashboard");

  const { data: students } = await supabase
    .from("class_overview")
    .select("*")
    .eq("class_code", profile.class_code)
    .order("full_name")
    .returns<ClassOverviewRow[]>();

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader profile={profile} />
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-10">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-ink">Class overview</h1>
          <p className="mt-1 text-sm text-ink/60">
            Class {profile.class_code} · every quiz attempt is stored, so students can retake a
            quiz as many times as they need.
          </p>
        </div>

        <div className="overflow-x-auto border border-ink/15">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-ink/15 text-xs font-medium uppercase tracking-wide text-ink/40">
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Mastered</th>
                <th className="px-4 py-3">Avg. score</th>
                <th className="px-4 py-3">Best score</th>
                <th className="px-4 py-3">Attempts</th>
                <th className="px-4 py-3">Streak</th>
                <th className="px-4 py-3">Last attempt</th>
              </tr>
            </thead>
            <tbody>
              {(students ?? []).map((s) => (
                <tr key={s.user_id} className="border-b border-ink/10 last:border-0">
                  <td className="px-4 py-3 text-ink">{s.full_name ?? "Unnamed student"}</td>
                  <td className="px-4 py-3 text-ink">
                    {s.processes_mastered} / {s.total_processes}
                  </td>
                  <td className="px-4 py-3 text-ink">{Math.round(s.avg_score * 100)}%</td>
                  <td className="px-4 py-3 text-ink">{Math.round(s.best_score * 100)}%</td>
                  <td className="px-4 py-3 text-ink">{s.quiz_attempts}</td>
                  <td className="px-4 py-3 text-ink">{s.streak_days} days</td>
                  <td className="px-4 py-3 text-ink/60">
                    {s.last_attempt_at
                      ? new Date(s.last_attempt_at).toLocaleDateString()
                      : "—"}
                  </td>
                </tr>
              ))}
              {(students ?? []).length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-ink/40">
                    No students in this class yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
