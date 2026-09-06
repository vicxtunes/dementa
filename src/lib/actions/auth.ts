"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error: string | null; notice?: string | null };

export async function signUp(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  // Optional class join code — defaults to the shared class. The
  // handle_new_user trigger reads this; an unknown code will fail the
  // profiles.class_code FK, so it must match an existing `classes` row.
  const classCode = String(formData.get("classCode") ?? "").trim() || "S.4 General";
  // Sign-up is students only. The teacher account is provisioned directly in
  // Supabase (see supabase/create-teacher.sql) and can't be self-registered.
  const role = "student";

  if (!fullName || !email || !password) {
    return { error: "Full name, email, and password are required." };
  }

  const supabase = await createClient();

  // The `profiles` row is created server-side by the on_auth_user_created
  // trigger (see supabase/schema.sql) from this metadata — not inserted
  // here, since signUp() may return no session (email confirmation
  // pending), which would make a client-side insert fail RLS.
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, role, class_code: classCode } },
  });

  if (error || !data.user) {
    return { error: error?.message ?? "Sign up failed." };
  }

  if (!data.session) {
    return { error: null, notice: "Account created — check your email to confirm it, then log in." };
  }

  redirect("/home");
}

export async function signIn(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  redirect("/home");
}

export async function signOut() {
  const supabase = await createClient();
  // `local` scope clears this session's cookies without a network round-trip to
  // revoke other devices — more reliable, and it's all we need here.
  try {
    await supabase.auth.signOut({ scope: "local" });
  } catch {
    // cookies are cleared by the client above regardless of the API result
  }
  redirect("/login");
}
