/**
 * Wipes all student *activity* for a clean testing slate. Keeps every account
 * (students + teacher) and all authored content (subjects, topics, quiz
 * questions, assessments, resources, classes, challenge events).
 *
 *   npx tsx scripts/reset-student-activity.mts          # dry run — counts only
 *   npx tsx scripts/reset-student-activity.mts --yes    # actually delete
 */
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";

const env = fs.readFileSync(".env.local", "utf8");
const g = (k: string) => (env.match(new RegExp(`^${k}=(.*)$`, "m")) || [])[1]?.trim();
const admin = createClient(g("NEXT_PUBLIC_SUPABASE_URL")!, g("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false },
});

const APPLY = process.argv.includes("--yes");

// [table, a column that is never null] — children before parents.
const TABLES: [string, string][] = [
  ["challenge_entries", "id"],
  ["assessment_attempts", "id"],
  ["assessment_submissions", "id"],
  ["match_participants", "match_id"],
  ["match_teams", "match_id"],
  ["matches", "id"],
  ["team_members", "team_id"],
  ["teams", "id"],
  ["token_transactions", "id"],
  ["quiz_attempts", "id"],
  ["progress", "user_id"],
];

async function count(table: string): Promise<number> {
  const { count } = await admin.from(table).select("*", { count: "exact", head: true });
  return count ?? 0;
}

async function main() {
  console.log(APPLY ? "APPLYING reset…\n" : "DRY RUN (pass --yes to apply)\n");

  for (const [table, col] of TABLES) {
    const before = await count(table);
    if (!APPLY) {
      console.log(`  ${table}: ${before} rows`);
      continue;
    }
    const { error } = await admin.from(table).delete().not(col, "is", null);
    console.log(error ? `  ${table}: ERROR ${error.message}` : `  ${table}: cleared (${before} → ${await count(table)})`);
  }

  const { count: students } = await admin
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "student");
  console.log(`\n  student profiles: ${students}`);
  if (APPLY) {
    const { error } = await admin
      .from("profiles")
      .update({ token_balance: 0, streak_days: 0, last_active: null })
      .eq("role", "student");
    console.log(
      error ? `  reset balances: ERROR ${error.message}` : "  reset token_balance / streak_days / last_active → 0"
    );
  }

  console.log(APPLY ? "\nDone. Content and all accounts untouched." : "\n(dry run — nothing changed)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
