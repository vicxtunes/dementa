import Link from "next/link";
import type { Topic } from "@/lib/subjects";
import { FlashcardDeck } from "./flashcard-deck";
import { MarkReadButton } from "./mark-read-button";

function chipList(values: string[] | undefined) {
  if (!values?.length) return null;
  return (
    <div className="d-flex flex-wrap gap-2 mb-4">
      {values.map((m) => (
        <span
          key={m}
          className="badge-table"
          style={{ background: "#F8FAF9", color: "var(--text-muted-green)" }}
        >
          {m}
        </span>
      ))}
    </div>
  );
}

export function TopicContent({
  topic,
  contentViewed,
  quizHref,
}: {
  topic: Topic;
  contentViewed: boolean;
  quizHref: string;
}) {
  const c = topic;
  const summary = typeof c.content?.summary === "string" ? c.content.summary : null;
  const keyPoints = Array.isArray(c.content?.keyPoints) ? (c.content.keyPoints as string[]) : null;

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title" style={{ fontSize: "1.35rem" }}>
          {c.title}
        </h2>
        {contentViewed && (
          <span className="badge-table success">
            <i className="bi bi-check-lg" /> Read
          </span>
        )}
      </div>

      {summary && <p className="mb-4" style={{ color: "var(--text-main)" }}>{summary}</p>}
      {chipList(c.rawMaterials)}

      {keyPoints && (
        <>
          <h3 className="stat-label">Key points</h3>
          <ul className="mb-4 ps-3">
            {keyPoints.map((k, i) => (
              <li key={i} className="mb-1" style={{ color: "var(--text-main)" }}>
                {k}
              </li>
            ))}
          </ul>
        </>
      )}

      {c.steps?.length ? (
        <>
          <h3 className="stat-label">Steps</h3>
          <ol className="transaction-list mb-4">
            {c.steps.map((step, i) => (
              <li className="transaction-item" key={i}>
                <div className="transaction-icon bg-forest-light text-lime" style={{ fontSize: "0.9rem" }}>
                  {i + 1}
                </div>
                <div className="transaction-info">
                  <div className="transaction-name" style={{ whiteSpace: "normal", fontWeight: 500 }}>
                    {step}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </>
      ) : null}

      {c.equations?.length ? (
        <>
          <h3 className="stat-label">Equations</h3>
          <div className="alert-custom alert-custom-primary d-block mb-4">
            <div
              className="d-flex flex-column gap-2"
              style={{ fontFamily: "var(--font-geist-mono), monospace" }}
            >
              {c.equations.map((eq, i) => (
                <code key={i} style={{ color: "inherit" }}>
                  {eq}
                </code>
              ))}
            </div>
          </div>
        </>
      ) : null}

      {c.sideEffects?.length ? (
        <>
          <h3 className="stat-label">Side effects &amp; mitigation</h3>
          <div className="d-flex flex-column gap-2 mb-4">
            {c.sideEffects.map((se, i) => (
              <div className="alert-custom alert-custom-danger d-block" key={i}>
                <p className="fw-bold mb-1">{se.issue}</p>
                <p className="mb-1">{se.effect}</p>
                <p className="mb-0" style={{ color: "var(--brand-forest-medium)" }}>
                  <i className="bi bi-shield-check" /> {se.mitigation}
                </p>
              </div>
            ))}
          </div>
        </>
      ) : null}

      {c.socialBenefits?.length ? (
        <>
          <h3 className="stat-label">Social benefits</h3>
          <ul className="mb-4 ps-3">
            {c.socialBenefits.map((sb, i) => (
              <li key={i} className="mb-1" style={{ color: "var(--text-main)" }}>
                {sb}
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {c.flashcards?.length ? (
        <>
          <h3 className="stat-label">Flashcards</h3>
          <div className="mb-4">
            <FlashcardDeck cards={c.flashcards} />
          </div>
        </>
      ) : null}

      <div className="d-flex flex-wrap align-items-center gap-2">
        <MarkReadButton topicId={c.id} alreadyViewed={contentViewed} />
        <Link href={quizHref} className="btn-custom btn-custom-secondary">
          <i className="bi bi-patch-question" /> Take the quiz
        </Link>
      </div>
    </div>
  );
}
