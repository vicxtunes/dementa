import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureAttemptFresh } from "@/lib/domain/assessments/attempts.server";

/**
 * Finalize every timed attempt whose clock ran out while the tab was closed.
 * Auth: a teacher session, or a shared-secret header for a scheduled job
 * (set ASSESSMENT_SWEEP_SECRET and send it as `x-sweep-secret`).
 */
export async function POST(request: Request) {
  const secret = process.env.ASSESSMENT_SWEEP_SECRET;
  const headerSecret = request.headers.get("x-sweep-secret");
  let authed = Boolean(secret && headerSecret && headerSecret === secret);

  if (!authed) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single<{ role: string }>();
      authed = profile?.role === "teacher";
    }
  }
  if (!authed) return NextResponse.json({ error: "Not allowed." }, { status: 403 });

  const admin = createAdminClient();
  const { data: stale } = await admin
    .from("assessment_attempts")
    .select("id")
    .eq("state", "in_progress")
    .lt("due_at", new Date().toISOString())
    .returns<{ id: string }[]>();

  let swept = 0;
  for (const a of stale ?? []) {
    await ensureAttemptFresh(a.id);
    swept++;
  }
  return NextResponse.json({ swept });
}
