import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { revealKeys } from "@/lib/domain/assessments/attempts.server";

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id: paperId } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const res = await revealKeys(paperId, user.id);
  if ("error" in res) return NextResponse.json({ error: res.error }, { status: res.status });
  return NextResponse.json({ keys: res.keys });
}
