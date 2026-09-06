"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ClassOverviewRow } from "@/lib/domain/classes/queries";
import { moveStudentToClass } from "@/lib/domain/classes/service";
import { Dropdown } from "@/components/spark/dropdown";

const PAGE_SIZE = 10;
type Filter = "all" | "mastery50" | "hasAttempts";

function initials(name: string | null) {
  if (!name) return "?";
  return name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
}

export function StudentsTable({
  students,
  canManage = false,
  classes = [],
}: {
  students: ClassOverviewRow[];
  canManage?: boolean;
  classes?: { code: string; name: string }[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return students.filter((s) => {
      if (q && !(s.full_name ?? "").toLowerCase().includes(q)) return false;
      if (filter === "mastery50" && s.topics_mastered / Math.max(s.total_topics, 1) < 0.5) return false;
      if (filter === "hasAttempts" && s.quiz_attempts === 0) return false;
      return true;
    });
  }, [students, query, filter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount - 1);
  const rows = filtered.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);
  const filterLabel =
    filter === "mastery50" ? "Mastery ≥ 50%" : filter === "hasAttempts" ? "Has attempts" : "All students";

  async function grant(studentId: string, amount: number) {
    setBusy(studentId);
    await fetch("/api/tokens/grant", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ studentId, amount }),
    });
    setBusy(null);
    router.refresh();
  }

  async function move(studentId: string, classCode: string) {
    setBusy(studentId);
    const fd = new FormData();
    fd.set("student_id", studentId);
    fd.set("class_code", classCode);
    await moveStudentToClass(fd);
    setBusy(null);
    router.refresh();
  }

  const cols = canManage ? 8 : 7;

  return (
    <div className="table-card-custom">
      <div className="table-header-control">
        <div className="table-search-box">
          <i className="bi bi-search table-search-icon" />
          <input
            className="table-search-input"
            placeholder="Search students…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
          />
        </div>
        <div className="table-filter-group">
          <Dropdown
            align="end"
            trigger={
              <button className="btn-table-action" type="button">
                <i className="bi bi-funnel" /> {filterLabel}
              </button>
            }
          >
            {(
              [
                ["all", "All students"],
                ["mastery50", "Mastery ≥ 50%"],
                ["hasAttempts", "Has attempts"],
              ] as [Filter, string][]
            ).map(([value, label]) => (
              <button
                key={value}
                className="dropdown-item w-100 border-0 bg-transparent text-start"
                type="button"
                onClick={() => {
                  setFilter(value);
                  setPage(0);
                }}
              >
                {label}
              </button>
            ))}
          </Dropdown>
        </div>
      </div>

      <div className="table-responsive">
        <table className="table-custom">
          <thead>
            <tr>
              <th>Student</th>
              <th>Mastered</th>
              <th>Avg. score</th>
              <th>Tokens</th>
              <th>Attempts</th>
              <th>Streak</th>
              <th>Last attempt</th>
              {canManage && <th />}
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.user_id} style={busy === s.user_id ? { opacity: 0.5 } : undefined}>
                <td>
                  <div className="table-user-cell">
                    <span className="table-user-avatar d-flex align-items-center justify-content-center fw-bold text-lime">
                      {initials(s.full_name)}
                    </span>
                    <div>
                      <div className="table-user-name">{s.full_name ?? "Unnamed student"}</div>
                      <div className="table-user-sub">Class {s.class_code}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span
                    className={`badge-table ${
                      s.topics_mastered === s.total_topics
                        ? "success"
                        : s.topics_mastered === 0
                          ? "failed"
                          : "pending"
                    }`}
                  >
                    {s.topics_mastered} / {s.total_topics}
                  </span>
                </td>
                <td className="table-amount">{Math.round(s.avg_score * 100)}%</td>
                <td className="table-amount">{s.token_balance ?? 0} 🪙</td>
                <td>{s.quiz_attempts}</td>
                <td>{s.streak_days} days</td>
                <td className="table-user-sub">
                  {s.last_attempt_at ? new Date(s.last_attempt_at).toLocaleDateString() : "—"}
                </td>
                {canManage && (
                  <td style={{ textAlign: "right" }}>
                    <Dropdown
                      align="end"
                      trigger={
                        <button className="btn-table-action" type="button" aria-label="Manage student">
                          <i className="bi bi-three-dots" />
                        </button>
                      }
                    >
                      <div className="dropdown-header">Tokens</div>
                      <button
                        className="dropdown-item w-100 border-0 bg-transparent text-start"
                        type="button"
                        onClick={() => grant(s.user_id, 10)}
                      >
                        <i className="bi bi-gift" /> Grant 10 tokens
                      </button>
                      <button
                        className="dropdown-item w-100 border-0 bg-transparent text-start"
                        type="button"
                        onClick={() => grant(s.user_id, 25)}
                      >
                        <i className="bi bi-gift" /> Grant 25 tokens
                      </button>
                      {classes.length > 1 && (
                        <>
                          <hr className="dropdown-divider" />
                          <div className="dropdown-header">Move to class</div>
                          {classes
                            .filter((c) => c.code !== s.class_code)
                            .map((c) => (
                              <button
                                key={c.code}
                                className="dropdown-item w-100 border-0 bg-transparent text-start"
                                type="button"
                                onClick={() => move(s.user_id, c.code)}
                              >
                                <i className="bi bi-arrow-right-circle" /> {c.name}
                              </button>
                            ))}
                        </>
                      )}
                    </Dropdown>
                  </td>
                )}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={cols} className="text-center py-5 table-user-sub">
                  No students match this view.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="table-footer-control">
        <span className="table-pagination-info">
          Showing {rows.length} of {filtered.length} students
        </span>
        <nav>
          <ul className="pagination mb-0">
            <li className={`page-item ${current === 0 ? "disabled" : ""}`}>
              <button className="page-link" type="button" onClick={() => setPage(current - 1)}>
                <i className="bi bi-chevron-left" />
              </button>
            </li>
            {Array.from({ length: pageCount }, (_, i) => (
              <li key={i} className={`page-item ${i === current ? "active" : ""}`}>
                <button className="page-link" type="button" onClick={() => setPage(i)}>
                  {i + 1}
                </button>
              </li>
            ))}
            <li className={`page-item ${current >= pageCount - 1 ? "disabled" : ""}`}>
              <button className="page-link" type="button" onClick={() => setPage(current + 1)}>
                <i className="bi bi-chevron-right" />
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}
