import Link from "next/link";
import type { ProcessEntry } from "@/lib/quick-solution/types";
import { FlashcardDeck } from "./flashcard-deck";
import { MarkReadButton } from "./mark-read-button";

export function ProcessContent({
  process,
  contentViewed,
}: {
  process: ProcessEntry;
  contentViewed: boolean;
}) {
  return (
    <section className="flex flex-col gap-8 border-b border-ink/10 pb-12">
      <div>
        <h2 className="font-serif text-2xl font-semibold text-ink">{process.title}</h2>
        <p className="mt-1 text-sm text-ink/60">
          Raw materials: {process.rawMaterials.join(", ")}
        </p>
      </div>

      <div>
        <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-ink/40">Steps</h3>
        <ol className="flex flex-col gap-2">
          {process.steps.map((step, i) => (
            <li key={i} className="flex gap-3 text-sm text-ink">
              <span className="shrink-0 font-serif text-flame">{i + 1}.</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {process.equations.length > 0 && (
        <div>
          <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-ink/40">Equations</h3>
          <div className="flex flex-col gap-1.5 border border-ink/15 bg-white/40 p-4">
            {process.equations.map((eq, i) => (
              <code key={i} className="text-sm text-ink">
                {eq}
              </code>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-ink/40">
          Side effects &amp; mitigation
        </h3>
        <div className="flex flex-col gap-3">
          {process.sideEffects.map((se, i) => (
            <div key={i} className="border-l-2 border-rust/50 pl-4">
              <p className="text-sm font-medium text-ink">{se.issue}</p>
              <p className="text-sm text-ink/70">{se.effect}</p>
              <p className="mt-1 text-sm text-flame">Mitigation: {se.mitigation}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-ink/40">
          Social benefits
        </h3>
        <ul className="flex flex-col gap-1.5">
          {process.socialBenefits.map((sb, i) => (
            <li key={i} className="flex gap-3 text-sm text-ink">
              <span className="shrink-0 text-amber">•</span>
              <span>{sb}</span>
            </li>
          ))}
        </ul>
      </div>

      {process.flashcards.length > 0 && (
        <div>
          <h3 className="mb-4 text-xs font-medium uppercase tracking-wide text-ink/40">Flashcards</h3>
          <FlashcardDeck cards={process.flashcards} />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <MarkReadButton processId={process.id} alreadyViewed={contentViewed} />
        <Link
          href={`/quick-solution/v1/quiz/${process.id}`}
          className="border border-flame px-4 py-2 text-sm font-medium text-flame transition-colors hover:bg-flame hover:text-paper"
        >
          Take the quiz
        </Link>
      </div>
    </section>
  );
}
