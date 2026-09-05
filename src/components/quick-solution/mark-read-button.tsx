"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { markContentViewed } from "@/lib/quick-solution/actions/progress";

export function MarkReadButton({ processId, alreadyViewed }: { processId: string; alreadyViewed: boolean }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  if (alreadyViewed) {
    return (
      <span className="inline-flex items-center gap-2 border border-flame/40 px-4 py-2 text-sm font-medium text-flame">
        Notes marked as read
      </span>
    );
  }

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await markContentViewed(processId);
          router.refresh();
        })
      }
      className="border border-ink bg-ink px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-flame hover:border-flame disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isPending ? "Saving…" : "Mark notes as read"}
    </button>
  );
}
