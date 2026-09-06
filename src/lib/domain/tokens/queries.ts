import { createClient } from "@/lib/supabase/server";
import type { TokenReason } from "@/lib/config/tokens";

export type TokenTransaction = {
  id: string;
  amount: number;
  reason: TokenReason;
  reference_id: string | null;
  created_at: string;
};

export async function getBalance(): Promise<number> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;
  const { data } = await supabase
    .from("profiles")
    .select("token_balance")
    .eq("id", user.id)
    .single<{ token_balance: number }>();
  return data?.token_balance ?? 0;
}

export async function listTransactions(limit = 50): Promise<TokenTransaction[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("token_transactions")
    .select("id, amount, reason, reference_id, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<TokenTransaction[]>();
  return data ?? [];
}
