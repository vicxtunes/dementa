"use client";

import { useState } from "react";
import { AttachIcon, EmojiIcon, SendIcon } from "./icons";

export function Composer({ onSend }: { onSend: (content: string) => void }) {
  const [value, setValue] = useState("");

  function handleSend() {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setValue("");
  }

  return (
    <div className="shrink-0 border-t border-[#e9efef] bg-white px-4 py-3">
      <div className="mx-auto flex max-w-2xl items-end gap-2">
        <button
          type="button"
          aria-label="Attach file"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] text-muted hover:bg-canvas hover:text-forest"
        >
          <AttachIcon className="h-5 w-5" />
        </button>

        <div className="flex flex-1 items-center gap-2 rounded-[16px] border border-[#e9efef] bg-canvas px-3.5 py-2.5">
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            rows={1}
            placeholder="Write a message..."
            className="max-h-32 w-full resize-none bg-transparent text-sm text-ink placeholder:text-muted focus:outline-none"
          />
          <button
            type="button"
            aria-label="Emoji"
            className="shrink-0 text-muted hover:text-forest"
          >
            <EmojiIcon className="h-5 w-5" />
          </button>
        </div>

        <button
          type="button"
          onClick={handleSend}
          disabled={!value.trim()}
          aria-label="Send message"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-forest text-white transition-colors hover:bg-forest-dark disabled:cursor-not-allowed disabled:bg-[#e9efef] disabled:text-muted"
        >
          <SendIcon className="h-4.5 w-4.5" />
        </button>
      </div>
    </div>
  );
}
