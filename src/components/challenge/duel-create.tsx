"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

const CHALLENGE_STAKE = 5; // one-on-one: 5 🪙 each, winner keeps 80% of the pot

export function DuelCreate({
  subjectId,
  topics,
  classmates,
  tokenBalance = 0,
}: {
  subjectId: string;
  topics: { id: string; title: string }[];
  classmates: { id: string; full_name: string | null }[];
  tokenBalance?: number;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"solo" | "duel">("solo");
  const [opponent, setOpponent] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [count, setCount] = useState<number>(5);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggle(id: string) {
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  }

  function create() {
    setError(null);
    if (picked.length === 0) return setError("Pick at least one topic.");
    if (mode === "duel") {
      if (!opponent) return setError("Pick an opponent.");
      if (tokenBalance < CHALLENGE_STAKE) {
        return setError(
          `A one-on-one costs ${CHALLENGE_STAKE} 🪙 each and you have ${tokenBalance}. Earn some by mastering topics first.`
        );
      }
    }
    startTransition(async () => {
      const res = await fetch("/api/matches", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          mode,
          subjectId,
          isGeneral: false,
          topicIds: picked,
          questionCount: count,
          stake: mode === "duel" ? CHALLENGE_STAKE : 0,
          opponentIds: mode === "duel" ? [opponent] : [],
        }),
      });
      const data = await res.json().catch(() => ({}) as { matchId?: string; error?: string });
      if (!res.ok || !data.matchId) {
        return setError(data.error ?? "Could not start the quiz.");
      }
      router.push(`/matches/${data.matchId}`);
    });
  }

  return (
    <div className="d-flex flex-column gap-3">
      <div>
        <span className="form-label-custom d-block">Mode</span>
        <div className="d-flex gap-2">
          <button
            type="button"
            onClick={() => setMode("solo")}
            className={`btn-custom btn-custom-sm ${mode === "solo" ? "btn-custom-primary" : "btn-custom-light"}`}
          >
            Solo practice
          </button>
          <button
            type="button"
            onClick={() => setMode("duel")}
            className={`btn-custom btn-custom-sm ${mode === "duel" ? "btn-custom-primary" : "btn-custom-light"}`}
          >
            One-on-one · {CHALLENGE_STAKE} 🪙
          </button>
        </div>
        {mode === "duel" && (
          <p className="item-sub mt-1 mb-0">
            Both players stake {CHALLENGE_STAKE} 🪙. The winner takes 80% of the pot; a tie refunds both. You have{" "}
            {tokenBalance} 🪙.
          </p>
        )}
      </div>

      {mode === "duel" && (
        <div>
          <label className="form-label-custom" htmlFor="opp">
            Opponent
          </label>
          {classmates.length === 0 ? (
            <p className="item-sub m-0">No classmates to challenge yet.</p>
          ) : (
            <select id="opp" className="form-select-custom" value={opponent} onChange={(e) => setOpponent(e.target.value)}>
              <option value="">Choose a classmate…</option>
              {classmates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name ?? "Unnamed student"}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      <div>
        <span className="form-label-custom d-block">Topics</span>
        <div className="d-flex flex-wrap gap-2">
          {topics.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => toggle(t.id)}
              className={`badge-table ${picked.includes(t.id) ? "success" : ""}`}
              style={{
                cursor: "pointer",
                background: picked.includes(t.id) ? undefined : "#F8FAF9",
                color: picked.includes(t.id) ? undefined : "var(--text-muted-green)",
              }}
            >
              {t.title}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="form-label-custom" htmlFor="cnt">
          Questions
        </label>
        <input
          id="cnt"
          type="number"
          min={3}
          max={20}
          className="form-control-custom form-control-custom-sm"
          style={{ width: 100 }}
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
        />
      </div>

      {error && <div className="alert-custom alert-custom-danger d-block">{error}</div>}

      <button type="button" className="btn-custom btn-custom-primary align-self-start" disabled={pending} onClick={create}>
        {pending ? "Starting…" : mode === "solo" ? "Start practice" : `Challenge · ${CHALLENGE_STAKE} 🪙`}
      </button>
    </div>
  );
}
