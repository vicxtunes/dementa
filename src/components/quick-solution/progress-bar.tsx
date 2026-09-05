export function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-sm font-medium text-ink/70">
          {current} of {total} processes mastered
        </span>
        <span className="text-sm text-ink/50">{pct}%</span>
      </div>
      <div className="h-2 w-full border border-ink/15">
        <div className="h-full bg-flame transition-[width]" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
