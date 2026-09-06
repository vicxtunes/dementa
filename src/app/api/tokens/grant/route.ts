import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { grantByTeacher, tokensEnabled } from "@/lib/domain/tokens/award.server";

export async function POST(request: Request) {
  if (!tokensEnabled()) {
    return NextResponse.json({ error: "Token economy not configured." }, { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { data: me } = await supabase
    .from("profiles")
    .select("role, class_code")
    .eq("id", user.id)
    .single<{ role: string; class_code: string }>();
  if (me?.role !== "teacher") {
    return NextResponse.json({ error: "Teachers only." }, { status: 403 });
  }

  let body: { studentId?: string; amount?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }
  const amount = Math.trunc(Number(body.amount));
  if (!body.studentId || !Number.isFinite(amount) || amount <= 0 || amount > 500) {
    return NextResponse.json({ error: "Invalid grant." }, { status: 400 });
  }

  // The student must be in the teacher's class.
  const { data: student } = await supabase
    .from("profiles")
    .select("class_code")
    .eq("id", body.studentId)
    .single<{ class_code: string }>();
  if (!student || student.class_code !== me.class_code) {
    return NextResponse.json({ error: "Not your student." }, { status: 403 });
  }

  const balance = await grantByTeacher({ studentId: body.studentId, amount, note: "teacher grant" });
  return NextResponse.json({ balance });
}
