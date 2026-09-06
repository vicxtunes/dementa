/** Pure timer helpers — safe on the server and in client components. */

export function computeDueAt(startedAtIso: string, kind: string, durationMinutes: number | null): string | null {
  if (kind !== "exam" || !durationMinutes || durationMinutes <= 0) return null;
  return new Date(new Date(startedAtIso).getTime() + durationMinutes * 60_000).toISOString();
}

export function remainingMs(dueAtIso: string | null, nowMs: number = Date.now()): number | null {
  if (!dueAtIso) return null;
  return Date.parse(dueAtIso) - nowMs;
}

export function isExpired(dueAtIso: string | null, nowMs: number = Date.now()): boolean {
  const r = remainingMs(dueAtIso, nowMs);
  return r != null && r <= 0;
}

export function formatCountdown(ms: number): string {
  const clamped = Math.max(0, ms);
  const totalSec = Math.floor(clamped / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}
