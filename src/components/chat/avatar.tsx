const PALETTE = [
  "bg-rose-500",
  "bg-orange-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-teal-500",
  "bg-sky-500",
  "bg-indigo-500",
  "bg-violet-500",
  "bg-fuchsia-500",
];

function colorFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

function initialsFor(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const second = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + second).toUpperCase();
}

export function Avatar({
  name,
  online,
  size = "md",
}: {
  name: string;
  online?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const dims = size === "sm" ? "h-8 w-8 text-xs" : size === "lg" ? "h-11 w-11 text-sm" : "h-10 w-10 text-sm";
  const dot = size === "sm" ? "h-2 w-2" : "h-2.5 w-2.5";

  return (
    <span className="relative inline-flex shrink-0">
      <span
        className={`flex items-center justify-center rounded-full font-medium text-white ${colorFor(
          name
        )} ${dims}`}
      >
        {initialsFor(name)}
      </span>
      {online && (
        <span
          className={`absolute right-0 bottom-0 ${dot} rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-950`}
        />
      )}
    </span>
  );
}
