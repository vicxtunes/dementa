"use client";

import { useState } from "react";
import type { Flashcard } from "@/lib/subjects";

export function FlashcardDeck({ cards }: { cards: Flashcard[] }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  if (cards.length === 0) return null;
  const card = cards[index];

  function go(delta: number) {
    setFlipped(false);
    setIndex((i) => (i + delta + cards.length) % cards.length);
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        aria-label={flipped ? "Show question" : "Show answer"}
        className="w-full max-w-md [perspective:1200px]"
      >
        <div
          className="relative h-52 w-full transition-transform duration-300 [transform-style:preserve-3d]"
          style={{ transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-[14px] border border-[color:var(--border-light)] bg-white p-6 text-center shadow-sm [backface-visibility:hidden]">
            <span className="text-xs font-bold uppercase tracking-wide text-[color:var(--text-muted-green)]">
              Question
            </span>
            <p className="text-lg font-semibold text-[color:var(--text-main)]">{card.front}</p>
          </div>
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-[14px] border-2 border-forest bg-[color:var(--brand-forest-medium)] p-6 text-center [backface-visibility:hidden]"
            style={{ transform: "rotateY(180deg)" }}
          >
            <span className="text-xs font-bold uppercase tracking-wide text-lime">Answer</span>
            <p className="text-white">{card.back}</p>
          </div>
        </div>
      </button>

      <div className="flex items-center gap-3">
        <button type="button" onClick={() => go(-1)} className="btn-custom btn-custom-light btn-custom-sm">
          <i className="bi bi-chevron-left" /> Prev
        </button>
        <span className="text-sm font-semibold text-[color:var(--text-muted-green)]">
          {index + 1} / {cards.length}
        </span>
        <button type="button" onClick={() => go(1)} className="btn-custom btn-custom-light btn-custom-sm">
          Next <i className="bi bi-chevron-right" />
        </button>
      </div>
    </div>
  );
}
