import Link from "next/link";
import { signOut } from "@/lib/quick-solution/actions/auth";
import type { Profile } from "@/lib/quick-solution/types";

export function SiteHeader({ profile }: { profile: Profile }) {
  return (
    <header className="flex items-center justify-between border-b border-ink/15 px-6 py-4">
      <Link href="/quick-solution/v1/dashboard" className="font-serif text-lg font-semibold text-ink">
        Industrial Processes
      </Link>
      <div className="flex items-center gap-4">
        {profile.role === "teacher" && (
          <Link href="/quick-solution/v1/teacher" className="text-sm font-medium text-flame hover:underline">
            Teacher dashboard
          </Link>
        )}
        <span className="hidden text-sm text-ink/60 sm:inline">{profile.full_name ?? "Student"}</span>
        <form action={signOut}>
          <button
            type="submit"
            className="border border-ink/20 px-3 py-1.5 text-sm font-medium text-ink/70 transition-colors hover:border-ink hover:text-ink"
          >
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}
