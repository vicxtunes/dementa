"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { markTopicViewed } from "@/lib/actions/progress";

export function MarkReadButton({
  topicId,
  alreadyViewed,
}: {
  topicId: string;
  alreadyViewed: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  if (alreadyViewed) {
    return (
      <span className="btn-custom btn-custom-light" aria-disabled="true">
        <i className="bi bi-check-circle-fill" style={{ color: "var(--brand-forest-medium)" }} /> Notes read
      </span>
    );
  }

  return (
    <button
      type="button"
      disabled={isPending}
      className="btn-custom btn-custom-primary"
      onClick={() =>
        startTransition(async () => {
          await markTopicViewed(topicId);
          router.refresh();
        })
      }
    >
      {isPending ? "Saving…" : "Mark notes as read"}
    </button>
  );
}
