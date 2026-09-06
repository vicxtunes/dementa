"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function MatchActions({ matchId, stake }: { matchId: string; stake: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function respond(action: "accept" | "decline") {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/matches/${matchId}`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ action }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data.error ?? "Something went wrong.");
          return;
        }
        router.refresh();
      } catch {
        setError("Couldn't reach the server — check your connection.");
      }
    });
  }

  return (
    <div className="d-flex flex-column gap-2">
      <div className="d-flex gap-2">
        <button
          type="button"
          className="btn-custom btn-custom-primary"
          disabled={pending}
          onClick={() => respond("accept")}
        >
          {pending ? "…" : "Accept"}
          {stake > 0 ? ` · ${stake} 🪙` : ""}
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
      {error && <div className="alert-custom alert-custom-danger d-block">{error}</div>}
    </div>
  );
}
