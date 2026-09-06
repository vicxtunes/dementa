"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PaperRow, AssessmentSection } from "@/lib/domain/assessments/queries";

export function StartCard({
  paperId,
  paper,
  sections,
  itemCount,
  resuming,
}: {
  paperId: string;
  paper: PaperRow;
  sections: AssessmentSection[];
  itemCount: number;
  resuming: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/assessments/${paperId}/attempt`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "start" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Could not start.");
        setPending(false);
        return;
      }
      router.refresh();
    } catch {
      setError("Could not start — check your connection.");
      setPending(false);
    }
  }

  return (
    <div className="card">
      {paper.instructions && (
        <div className="alert-custom alert-custom-info d-block" style={{ whiteSpace: "pre-wrap" }}>
          {paper.instructions}
        </div>
      )}

      <ul className="ps-3">
        <li>
          {itemCount} item{itemCount === 1 ? "" : "s"}
          {sections.length > 0 && ` across ${sections.length} section${sections.length === 1 ? "" : "s"}`}
        </li>
        {sections
          .filter((s) => s.pick_count != null)
          .map((s) => (
            <li key={s.id}>
              {s.label}: answer {s.pick_count} item{s.pick_count === 1 ? "" : "s"}
            </li>
          ))}
        <li>
          {paper.kind === "exam" && paper.duration_minutes
            ? `${paper.duration_minutes}-minute timer`
            : "No time limit"}
        </li>
        <li>Completion reward: +{paper.token_reward_on_completion} tokens</li>
      </ul>

      {paper.kind === "exam" && paper.duration_minutes && (
        <div className="alert-custom alert-custom-warning d-block">
          <strong>This is a timed exam.</strong> The clock starts the moment you begin and keeps running even if you
          close this tab. When it reaches zero the paper submits automatically. You get one attempt.
        </div>
      )}
      {paper.kind === "revision" && (
        <p className="item-sub">You can take this as many times as you like and review the model answers freely.</p>
      )}

      {error && <div className="alert-custom alert-custom-danger d-block">{error}</div>}

      <button type="button" className="btn-custom btn-custom-primary align-self-start" disabled={pending} onClick={start}>
        {pending ? "Starting…" : resuming ? "Resume" : paper.kind === "exam" ? "Start the exam" : "Start"}
      </button>
    </div>
  );
}
