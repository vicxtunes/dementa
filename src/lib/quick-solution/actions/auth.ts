"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/quick-solution/supabase/server";

export type AuthState = { error: string | null; notice?: string | null };

export async function signUp(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  // Single class for everyone, so the teacher sees every student. Not taken
  // from the form — there's no class-code field anymore.
  const classCode = "S.4 General";
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

  redirect("/quick-solution/v1/dashboard");
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

  redirect("/quick-solution/v1/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/quick-solution/v1/login");
}
