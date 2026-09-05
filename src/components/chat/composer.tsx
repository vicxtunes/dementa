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
    <div className="shrink-0 border-t border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex max-w-2xl items-end gap-2">
        <button
          type="button"
          aria-label="Attach file"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
        >
          <AttachIcon className="h-5 w-5" />
        </button>

        <div className="flex flex-1 items-center gap-2 rounded-2xl bg-zinc-100 px-3.5 py-2.5 dark:bg-zinc-900">
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
            className="max-h-32 w-full resize-none bg-transparent text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none dark:text-zinc-100"
          />
          <button
            type="button"
            aria-label="Emoji"
            className="shrink-0 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            <EmojiIcon className="h-5 w-5" />
          </button>
        </div>

        <button
          type="button"
          onClick={handleSend}
          disabled={!value.trim()}
          aria-label="Send message"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-600 text-white transition-colors hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-400 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-600"
        >
          <SendIcon className="h-4.5 w-4.5" />
        </button>
      </div>
    </div>
  );
}
