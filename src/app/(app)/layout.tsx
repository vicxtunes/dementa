import { loadDashboard } from "@/lib/domain/curriculum/dashboard";
import { myInvites } from "@/lib/domain/matches/queries";
import { AppShell } from "@/components/spark/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [{ profile, activity, masteredCount, tokenBalance }, invites] = await Promise.all([
    loadDashboard(),
    myInvites(),
  ]);

  return (
    <AppShell
      profile={profile}
      activity={activity}
      masteredCount={masteredCount}
      tokenBalance={tokenBalance}
      invites={invites}
    >
      {children}
    </AppShell>
  );
}
