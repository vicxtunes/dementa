"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

export function MatchActions({ matchId, stake }: { matchId: string; stake: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function respond(action: "accept" | "decline") {
    startTransition(async () => {
      await fetch(`/api/matches/${matchId}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action }),
      });
      router.refresh();
    });
  }

  return (
    <div className="d-flex gap-2">
      <button
        type="button"
        className="btn-custom btn-custom-primary"
        disabled={pending}
        onClick={() => respond("accept")}
      >
        Accept{stake > 0 ? ` · ${stake} 🪙` : ""}
      </button>
      <button
        type="button"
        className="btn-custom btn-custom-light"
        disabled={pending}
        onClick={() => respond("decline")}
      >
        Decline
      </button>
    </div>
  );
}
