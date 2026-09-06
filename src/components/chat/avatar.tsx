const PALETTE = [
  "bg-[#072F1F]",
  "bg-[#1A3E30]",
  "bg-[#2F6F4F]",
  "bg-[#3F7D5A]",
  "bg-[#5B7F5B]",
  "bg-[#6C7E75]",
  "bg-[#4C6B52]",
  "bg-[#2C5F4C]",
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
        className={`flex items-center justify-center rounded-[12px] font-bold text-white ${colorFor(
          name
        )} ${dims}`}
      >
        {initialsFor(name)}
      </span>
      {online && (
        <span
          className={`absolute right-0 bottom-0 ${dot} rounded-full bg-sys-green ring-2 ring-white`}
        />
      )}
    </span>
  );
}
