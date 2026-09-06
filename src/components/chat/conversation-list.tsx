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
    <aside className="flex h-full w-full flex-col border-[#e9efef] bg-white md:w-[340px] md:shrink-0 md:border-r">
      <div className="flex items-center justify-between gap-2 px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <MobileNavDrawer />
          <h1 className="text-lg font-bold text-ink">Chats</h1>
        </div>
        <button
          type="button"
          title="New chat"
          aria-label="New chat"
          className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-forest text-white transition-colors hover:bg-forest-dark"
        >
          <PlusIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="px-4 pb-3">
        <div className="flex items-center gap-2 rounded-[12px] bg-canvas px-3 py-2">
          <SearchIcon className="h-4 w-4 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            type="text"
            placeholder="Search conversations"
            className="w-full bg-transparent text-sm text-ink placeholder:text-muted focus:outline-none"
          />
        </div>
      </div>

      <div className="flex gap-1 px-4 pb-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${
              filter === f ? "bg-forest text-white" : "bg-canvas text-muted hover:bg-[#e9efef]"
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
                className={`flex w-full items-center gap-3 rounded-[12px] px-3 py-2.5 text-left transition-colors ${
                  isSelected ? "bg-[#eef4f1]" : "hover:bg-canvas"
                }`}
              >
                <Avatar name={c.name} online={c.online} size="lg" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-bold text-ink">{c.name}</span>
                    <span className="shrink-0 text-xs text-muted">{c.lastMessageAt}</span>
                  </span>
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs text-muted">{lastMessagePreview(c.id)}</span>
                    {c.unread > 0 && (
                      <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-lime px-1 text-[11px] font-bold text-forest-dark">
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
          <li className="px-3 py-8 text-center text-sm text-muted">No conversations found.</li>
        )}
      </ul>
    </aside>
  );
}
