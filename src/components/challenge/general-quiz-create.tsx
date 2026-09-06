"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { TOKEN_RULES } from "@/lib/config/tokens";

type SubjectTopics = { id: string; title: string; topics: { id: string; title: string }[] };

export function GeneralQuizCreate({
  subjects,
  classmates,
}: {
  subjects: SubjectTopics[];
  classmates: { id: string; full_name: string | null }[];
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"solo" | "duel">("solo");
  const [picked, setPicked] = useState<string[]>([]);
  const [opponent, setOpponent] = useState("");
  const [count, setCount] = useState<number>(6);
  const [stake, setStake] = useState<number>(TOKEN_RULES.spend.duelStakeDefault);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const total = useMemo(() => subjects.reduce((n, s) => n + s.topics.length, 0), [subjects]);

  function toggle(id: string) {
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  }

  function create() {
    setError(null);
    if (picked.length === 0) return setError("Pick at least one topic.");
    if (mode === "duel" && !opponent) return setError("Pick an opponent.");
    startTransition(async () => {
      const res = await fetch("/api/matches", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          mode,
          subjectId: null,
          isGeneral: true,
          topicIds: picked,
          questionCount: count,
          stake: mode === "duel" ? stake : 0,
          opponentIds: mode === "duel" ? [opponent] : [],
        }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error ?? "Could not create the quiz.");
      router.push(`/matches/${data.matchId}`);
    });
  }

  return (
    <div className="d-flex flex-column gap-3">
      <div>
        <span className="form-label-custom d-block">Mode</span>
        <div className="d-flex gap-2">
          {(["solo", "duel"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`btn-custom btn-custom-sm ${mode === m ? "btn-custom-primary" : "btn-custom-light"}`}
            >
              {m === "solo" ? "Practice solo" : "Challenge someone"}
            </button>
          ))}
        </div>
      </div>

      {mode === "duel" && (
        <div>
          <label className="form-label-custom" htmlFor="g-opp">
            Opponent
          </label>
          <select id="g-opp" className="form-select-custom" value={opponent} onChange={(e) => setOpponent(e.target.value)}>
            <option value="">Choose a classmate…</option>
            {classmates.map((c) => (
              <option key={c.id} value={c.id}>
                {c.full_name ?? "Unnamed student"}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <span className="form-label-custom d-block">
          Topics ({picked.length} of {total})
        </span>
        <div className="d-flex flex-column gap-2">
          {subjects.map((s) => (
            <div key={s.id}>
              <div className="item-sub mb-1">{s.title}</div>
              <div className="d-flex flex-wrap gap-2">
                {s.topics.map((t) => (
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
          ))}
        </div>
      </div>

      <div className="d-flex gap-3">
        <div>
          <label className="form-label-custom" htmlFor="g-cnt">
            Questions
          </label>
          <input
            id="g-cnt"
            type="number"
            min={3}
            max={20}
            className="form-control-custom form-control-custom-sm"
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
          />
        </div>
        {mode === "duel" && (
          <div>
            <label className="form-label-custom" htmlFor="g-stk">
              Stake each
            </label>
            <input
              id="g-stk"
              type="number"
              min={0}
              className="form-control-custom form-control-custom-sm"
              value={stake}
              onChange={(e) => setStake(Number(e.target.value))}
            />
          </div>
        )}
      </div>

      {error && <div className="alert-custom alert-custom-danger d-block">{error}</div>}

      <button type="button" className="btn-custom btn-custom-primary align-self-start" disabled={pending} onClick={create}>
        {pending ? "Creating…" : mode === "solo" ? "Start practice" : `Challenge${stake > 0 ? ` · ${stake} 🪙` : ""}`}
      </button>
    </div>
  );
}
