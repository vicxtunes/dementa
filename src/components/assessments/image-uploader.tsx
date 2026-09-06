"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { attachItemImage, removeItemImage } from "@/lib/domain/assessments/service";
import { assessmentMediaUrl } from "@/lib/domain/assessments/media";
import type { ItemImage } from "@/lib/domain/assessments/queries";

export function ImageUploader({
  itemId,
  paperId,
  subjectId,
  images,
}: {
  itemId: string;
  paperId: string;
  subjectId: string;
  images: ItemImage[];
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("item_id", itemId);
      const res = await fetch("/api/assessment-media", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Upload failed.");
        return;
      }
      const attach = new FormData();
      attach.set("item_id", itemId);
      attach.set("assessment_id", paperId);
      attach.set("subject_id", subjectId);
      attach.set("path", data.path);
      startTransition(async () => {
        await attachItemImage(attach);
        router.refresh();
      });
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function remove(path: string) {
    const fd = new FormData();
    fd.set("item_id", itemId);
    fd.set("assessment_id", paperId);
    fd.set("subject_id", subjectId);
    fd.set("path", path);
    startTransition(async () => {
      await removeItemImage(fd);
      router.refresh();
    });
  }

  return (
    <div className="mt-2">
      <div className="d-flex flex-wrap gap-2">
        {images.map((im) => (
          <div key={im.path} style={{ position: "relative" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={assessmentMediaUrl(im.path)}
              alt={im.caption ?? "support material"}
              style={{ height: 84, width: 84, objectFit: "cover", borderRadius: 8, border: "1px solid var(--border-light)" }}
            />
            <button
              type="button"
              onClick={() => remove(im.path)}
              disabled={pending}
              aria-label="Remove image"
              className="table-btn-action delete"
              style={{ position: "absolute", top: -8, right: -8, background: "#fff", borderRadius: 999 }}
            >
              <i className="bi bi-x-lg" />
            </button>
          </div>
        ))}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={onPick}
        disabled={busy || pending}
        className="form-control-custom form-control-custom-sm mt-2"
        style={{ maxWidth: 320 }}
      />
      {(busy || pending) && <span className="item-sub d-block">Uploading…</span>}
      {error && <span className="alert-custom alert-custom-danger d-block mt-1">{error}</span>}
    </div>
  );
}
