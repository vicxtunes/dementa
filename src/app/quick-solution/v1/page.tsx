import { redirect } from "next/navigation";
import { createClient } from "@/lib/quick-solution/supabase/server";

export default async function QuickSolutionHome() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  redirect(user ? "/quick-solution/v1/dashboard" : "/quick-solution/v1/login");
}
