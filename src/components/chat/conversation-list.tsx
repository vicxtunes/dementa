"use client";

import { useMemo, useState } from "react";
import type { Conversation } from "@/lib/types";
import { lastMessagePreview } from "@/lib/mock-data";
import { Avatar } from "./avatar";
import { PlusIcon, SearchIcon } from "./icons";
import { MobileNavDrawer } from "./mobile-nav-drawer";

const FILTERS = ["All", "Unread", "Groups"] as const;
type Filter = (typeof FILTERS)[number];

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
}: {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("All");

  const filtered = useMemo(() => {
    return conversations.filter((c) => {
      if (filter === "Unread" && c.unread === 0) return false;
      if (filter === "Groups" && !c.isGroup) return false;
      if (query && !c.name.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [conversations, filter, query]);

  return (
    <aside className="flex h-full w-full flex-col border-zinc-200 bg-white md:w-[340px] md:shrink-0 md:border-r dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center justify-between gap-2 px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <MobileNavDrawer />
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Chats</h1>
        </div>
        <button
          type="button"
          title="New chat"
          aria-label="New chat"
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-600 text-white transition-colors hover:bg-sky-500"
        >
          <PlusIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="px-4 pb-3">
        <div className="flex items-center gap-2 rounded-lg bg-zinc-100 px-3 py-2 dark:bg-zinc-900">
          <SearchIcon className="h-4 w-4 text-zinc-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            type="text"
            placeholder="Search conversations"
            className="w-full bg-transparent text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none dark:text-zinc-100"
          />
        </div>
      </div>

      <div className="flex gap-1 px-4 pb-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filter === f
                ? "bg-sky-600 text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <ul className="flex-1 overflow-y-auto px-2 pb-2">
        {filtered.map((c) => {
          const isSelected = c.id === selectedId;
          return (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => onSelect(c.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                  isSelected
                    ? "bg-sky-50 dark:bg-sky-500/10"
                    : "hover:bg-zinc-100 dark:hover:bg-zinc-900"
                }`}
              >
                <Avatar name={c.name} online={c.online} size="lg" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      {c.name}
                    </span>
                    <span className="shrink-0 text-xs text-zinc-400">{c.lastMessageAt}</span>
                  </span>
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                      {lastMessagePreview(c.id)}
                    </span>
                    {c.unread > 0 && (
                      <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-amber-500 px-1 text-[11px] font-medium text-white">
                        {c.unread}
                      </span>
                    )}
                  </span>
                </span>
              </button>
            </li>
          );
        })}

        {filtered.length === 0 && (
          <li className="px-3 py-8 text-center text-sm text-zinc-400">No conversations found.</li>
        )}
      </ul>
    </aside>
  );
}
