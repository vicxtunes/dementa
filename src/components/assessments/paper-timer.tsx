"use client";

import { useEffect, useRef, useState } from "react";
import { formatCountdown } from "@/lib/domain/assessments/timing";

export function PaperTimer({
  dueAt,
  serverNow,
  onExpire,
}: {
  dueAt: string | null;
  serverNow: string;
  onExpire: () => void;
}) {
  const [remaining, setRemaining] = useState<number | null>(null);
  const firedRef = useRef(false);
  const onExpireRef = useRef(onExpire);
  useEffect(() => {
    onExpireRef.current = onExpire;
  });

  useEffect(() => {
    if (!dueAt) return;
    const offset = Date.parse(serverNow) - Date.now();
    const due = Date.parse(dueAt);
    const tick = () => {
      const r = due - (Date.now() + offset);
      setRemaining(r);
      if (r <= 0 && !firedRef.current) {
        firedRef.current = true;
        onExpireRef.current();
      }
    };
    const seed = requestAnimationFrame(tick); // avoids a synchronous setState in the effect body
    const id = setInterval(tick, 1000);
    return () => {
      cancelAnimationFrame(seed);
      clearInterval(id);
    };
  }, [dueAt, serverNow]);

  if (!dueAt || remaining == null) return null;

  const tone =
    remaining <= 60_000
      ? "var(--sys-red, #c0392b)"
      : remaining <= 5 * 60_000
        ? "var(--brand-orange, #d97706)"
        : "var(--text-main)";

  return (
    <div
      className="d-inline-flex align-items-center gap-2"
      style={{
        fontWeight: 700,
        fontVariantNumeric: "tabular-nums",
        color: tone,
        padding: "6px 12px",
        borderRadius: 10,
        border: "1px solid var(--border-light)",
        background: "#fff",
      }}
      role="timer"
      aria-live="off"
    >
      <i className="bi bi-clock" />
      {remaining <= 0 ? "Time up" : formatCountdown(remaining)}
    </div>
  );
}
