"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Refreshes the match page on an interval so a "Waiting…" screen updates
 *  itself when the other side accepts / finishes, without a manual reload. */
export function MatchPoll({ everyMs = 5000 }: { everyMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, everyMs);
    return () => clearInterval(id);
  }, [router, everyMs]);
  return (
    <span className="item-sub d-inline-flex align-items-center gap-1">
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: 999,
          background: "var(--brand-forest-medium, #2f7d5f)",
          display: "inline-block",
        }}
      />
      Updating live
    </span>
  );
}
