"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { TOKEN_RULES } from "@/lib/config/tokens";

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
  const [opponent, setOpponent] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [count, setCount] = useState<number>(5);
  const [stake, setStake] = useState<number>(TOKEN_RULES.spend.duelStakeDefault);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggle(id: string) {
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  }

  function create() {
    setError(null);
    if (!opponent) return setError("Pick an opponent.");
    if (stake > tokenBalance) {
      return setError(`That stake is ${stake} 🪙 but you only have ${tokenBalance}. Lower it or set it to 0.`);
    }
    if (picked.length === 0) return setError("Pick at least one topic.");
    startTransition(async () => {
      const res = await fetch("/api/matches", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          mode: "duel",
          subjectId,
          isGeneral: false,
          topicIds: picked,
          questionCount: count,
          stake,
          opponentIds: [opponent],
        }),
      });
      const data = await res.json().catch(() => ({}) as { matchId?: string; error?: string });
      if (!res.ok || !data.matchId) {
        return setError(data.error ?? "Could not create the duel.");
      }
      router.push(`/matches/${data.matchId}`);
    });
  }

  if (classmates.length === 0) {
    return <p className="item-sub m-0">No classmates to challenge yet.</p>;
  }

  return (
    <div className="d-flex flex-column gap-3">
      <div>
        <label className="form-label-custom" htmlFor="opp">
          Opponent
        </label>
        <select id="opp" className="form-select-custom" value={opponent} onChange={(e) => setOpponent(e.target.value)}>
          <option value="">Choose a classmate…</option>
          {classmates.map((c) => (
            <option key={c.id} value={c.id}>
              {c.full_name ?? "Unnamed student"}
            </option>
          ))}
        </select>
      </div>

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

      <div className="d-flex gap-3">
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
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="form-label-custom" htmlFor="stk">
            Stake (tokens each)
          </label>
          <input
            id="stk"
            type="number"
            min={0}
            max={tokenBalance}
            className="form-control-custom form-control-custom-sm"
            value={stake}
            onChange={(e) => setStake(Number(e.target.value))}
          />
          <span className="item-sub">You have {tokenBalance} 🪙 · 0 = free</span>
        </div>
      </div>

      {error && <div className="alert-custom alert-custom-danger d-block">{error}</div>}

      <button type="button" className="btn-custom btn-custom-primary align-self-start" disabled={pending} onClick={create}>
        {pending ? "Creating…" : `Challenge${stake > 0 ? ` · stake ${stake} 🪙` : ""}`}
      </button>
    </div>
  );
}
