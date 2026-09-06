import Link from "next/link";
import type { SubjectMeta } from "@/lib/subjects";

export function SubjectCard({
  subject,
  mastered,
  total,
  started = 0,
  ctaLabel,
}: {
  subject: SubjectMeta;
  mastered: number;
  total: number;
  /** topics with any activity — viewed, attempted or mastered */
  started?: number;
  ctaLabel: string;
}) {
  const pct = total > 0 ? Math.round((mastered / total) * 100) : 0;
  const inProgress = mastered > 0 || started > 0;
  const state = pct === 100 ? "success" : inProgress ? "pending" : "failed";

  return (
    <div className="card h-100 d-flex flex-column">
      <div className="card-header">
        <div className="d-flex align-items-center gap-3">
          <span
            className="d-flex align-items-center justify-content-center"
            style={{
              width: 46,
              height: 46,
              borderRadius: 14,
              background: subject.accent,
              color: "#fff",
              fontSize: "1.3rem",
            }}
          >
            <i className={`bi ${subject.icon}`} />
          </span>
          <div>
            <h2 className="card-title">{subject.title}</h2>
            <p className="item-sub m-0">
              {total} topic{total === 1 ? "" : "s"}
            </p>
          </div>
        </div>
        <span className={`badge-table ${state}`}>
          {pct === 100 ? "Complete" : inProgress ? "In progress" : "Not started"}
        </span>
      </div>

      <p className="page-subtitle" style={{ flexGrow: 1 }}>
        {subject.description}
      </p>

      <div className="progress-container mb-3">
        <div className="progress-label-row">
          <span className="progress-label">
            {mastered} / {total} mastered
            {started > mastered ? ` · ${started - mastered} in progress` : ""}
          </span>
          <span className="progress-value">{pct}%</span>
        </div>
        <div
          className="progress"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="progress-bar bg-lime-accent" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <Link href={`/subjects/${subject.id}`} className="btn-custom btn-custom-primary align-self-start">
        {ctaLabel} <i className="bi bi-arrow-right" />
      </Link>
    </div>
  );
}
