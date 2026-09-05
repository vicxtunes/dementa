"use client";

import { useState } from "react";
import type { Flashcard } from "@/lib/quick-solution/types";

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
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 border border-ink/20 bg-white/40 p-6 text-center [backface-visibility:hidden]">
            <span className="text-xs font-medium uppercase tracking-wide text-flame">Question</span>
            <p className="font-serif text-lg text-ink">{card.front}</p>
          </div>
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 border border-flame bg-flame/10 p-6 text-center [backface-visibility:hidden]"
            style={{ transform: "rotateY(180deg)" }}
          >
            <span className="text-xs font-medium uppercase tracking-wide text-flame">Answer</span>
            <p className="text-ink">{card.back}</p>
          </div>
        </div>
      </button>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => go(-1)}
          className="border border-ink/20 px-3 py-1.5 text-sm font-medium text-ink/70 hover:border-ink hover:text-ink"
        >
          Prev
        </button>
        <span className="text-sm text-ink/50">
          {index + 1} / {cards.length}
        </span>
        <button
          type="button"
          onClick={() => go(1)}
          className="border border-ink/20 px-3 py-1.5 text-sm font-medium text-ink/70 hover:border-ink hover:text-ink"
        >
          Next
        </button>
      </div>
    </div>
  );
}
