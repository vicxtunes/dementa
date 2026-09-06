"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { Profile } from "@/lib/domain/curriculum/types";
import { Sidebar } from "./sidebar";
import { Navbar, type ActivityItem, type MatchInvite } from "./navbar";
import { Footer } from "./footer";

/**
 * The Spark admin chrome: fixed dark sidebar + off-canvas overlay on mobile,
 * sticky navbar, page header, and footer. Ports the interactions from
 * spark-admin's dashboard.js (mobile toggle + desktop minimize).
 */
export function AppShell({
  profile,
  activity,
  masteredCount,
  tokenBalance,
  invites,
  children,
}: {
  profile: Profile;
  activity: ActivityItem[];
  masteredCount: number;
  tokenBalance: number;
  invites: MatchInvite[];
  children: ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);

  useEffect(() => {
    document.body.classList.toggle("sidebar-minimized", minimized);
    const t = setTimeout(() => window.dispatchEvent(new Event("resize")), 320);
    return () => {
      clearTimeout(t);
      document.body.classList.remove("sidebar-minimized");
    };
  }, [minimized]);

  return (
    <>
      <Sidebar
        profile={profile}
        mobileOpen={mobileOpen}
        masteredCount={masteredCount}
        onNavigate={() => setMobileOpen(false)}
      />
      <div
        className={`sidebar-overlay ${mobileOpen ? "show" : ""}`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />
      <div className="main-wrapper">
        <Navbar
          profile={profile}
          activity={activity}
          tokenBalance={tokenBalance}
          invites={invites}
          onMobileToggle={() => setMobileOpen((o) => !o)}
          onDesktopToggle={() => setMinimized((m) => !m)}
        />
        {children}
        <Footer />
      </div>
    </>
  );
}
