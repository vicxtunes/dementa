import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "assessment-media";
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

async function requireTeacher() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Not authenticated." }, { status: 401 }) };
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single<{ role: string }>();
  if (profile?.role !== "teacher") {
    return { error: NextResponse.json({ error: "Teachers only." }, { status: 403 }) };
  }
  return { userId: user.id };
}

export async function POST(request: Request) {
  const gate = await requireTeacher();
  if (gate.error) return gate.error;

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  const itemId = String(form?.get("item_id") ?? "").trim();
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file." }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ error: "Use a PNG, JPEG, WEBP or GIF image." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "That image is over 5 MB." }, { status: 400 });
  }

  const ext = file.name.includes(".") ? file.name.split(".").pop()!.toLowerCase().replace(/[^a-z0-9]/g, "") : "img";
  const folder = itemId && /^[0-9a-f-]{36}$/.test(itemId) ? itemId : "unfiled";
  const path = `${folder}/${crypto.randomUUID()}.${ext || "img"}`;

  const admin = createAdminClient();
  const { error } = await admin.storage
    .from(BUCKET)
    .upload(path, new Uint8Array(await file.arrayBuffer()), { contentType: file.type, upsert: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data } = admin.storage.from(BUCKET).getPublicUrl(path);
  return NextResponse.json({ path, publicUrl: data.publicUrl });
}
