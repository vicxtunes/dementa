"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { TOKEN_RULES } from "@/lib/config/tokens";

type TeamOption = { id: string; name: string; memberCount: number };
type SubjectTopics = { id: string; title: string; topics: { id: string; title: string }[] };

export function TeamQuizCreate({
  myTeams,
  classTeams,
  subjects,
  tokenBalance = 0,
}: {
  myTeams: TeamOption[];
  classTeams: TeamOption[];
  subjects: SubjectTopics[];
  tokenBalance?: number;
}) {
  const router = useRouter();
  const [teamAId, setTeamAId] = useState(myTeams[0]?.id ?? "");
  const [teamBId, setTeamBId] = useState("");
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? "");
  const [picked, setPicked] = useState<string[]>([]);
  const [count, setCount] = useState<number>(6);
  const [stake, setStake] = useState<number>(TOKEN_RULES.spend.groupQuizStakePerMemberDefault);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const subject = useMemo(() => subjects.find((s) => s.id === subjectId), [subjects, subjectId]);
  const opponents = classTeams.filter((t) => t.id !== teamAId && t.memberCount > 0);

  function toggle(id: string) {
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  }

  function create() {
    setError(null);
    if (!teamAId) return setError("Pick your team.");
    if (!teamBId) return setError("Pick an opposing team.");
    if (picked.length === 0) return setError("Pick at least one topic.");
    if (stake > tokenBalance) {
      return setError(`That stake is ${stake} 🪙 but you only have ${tokenBalance}. Lower it or set it to 0.`);
    }
    startTransition(async () => {
      const res = await fetch("/api/matches", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          mode: "group",
          subjectId,
          isGeneral: false,
          topicIds: picked,
          questionCount: count,
          stake,
          teamAId,
          teamBId,
        }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error ?? "Could not start the team quiz.");
      router.push(`/matches/${data.matchId}`);
    });
  }

  return (
    <div className="d-flex flex-column gap-3">
      <div className="d-flex gap-3">
        <div className="flex-grow-1">
          <label className="form-label-custom" htmlFor="tq-a">
            Your team
          </label>
          <select
            id="tq-a"
            className="form-select-custom"
            value={teamAId}
            onChange={(e) => {
              setTeamAId(e.target.value);
              if (e.target.value === teamBId) setTeamBId("");
            }}
          >
            {myTeams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.memberCount})
              </option>
            ))}
          </select>
        </div>
        <div className="flex-grow-1">
          <label className="form-label-custom" htmlFor="tq-b">
            Against
          </label>
          <select
            id="tq-b"
            className="form-select-custom"
            value={teamBId}
            onChange={(e) => setTeamBId(e.target.value)}
          >
            <option value="">Choose a team…</option>
            {opponents.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.memberCount})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="form-label-custom" htmlFor="tq-subj">
          Subject
        </label>
        <select
          id="tq-subj"
          className="form-select-custom"
          value={subjectId}
          onChange={(e) => {
            setSubjectId(e.target.value);
            setPicked([]);
          }}
        >
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>
      </div>

      <div>
        <span className="form-label-custom d-block">
          Topics ({picked.length} of {subject?.topics.length ?? 0})
        </span>
        <div className="d-flex flex-wrap gap-2">
          {(subject?.topics ?? []).map((t) => (
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
          <label className="form-label-custom" htmlFor="tq-cnt">
            Questions
          </label>
          <input
            id="tq-cnt"
            type="number"
            min={3}
            max={20}
            className="form-control-custom form-control-custom-sm"
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="form-label-custom" htmlFor="tq-stk">
            Stake per player
          </label>
          <input
            id="tq-stk"
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

      <p className="item-sub m-0">
        Every player on both teams pays the stake when they accept. The winning team splits the pot.
      </p>

      {error && <div className="alert-custom alert-custom-danger d-block">{error}</div>}

      <button
        type="button"
        className="btn-custom btn-custom-primary align-self-start"
        disabled={pending}
        onClick={create}
      >
        {pending ? "Starting…" : `Start team quiz${stake > 0 ? ` · ${stake} 🪙 each` : ""}`}
      </button>
    </div>
  );
}
