"use client";

import { useState } from "react";
import { SettingsIcon } from "./icons";
import { NAV_ITEMS } from "./nav-items";
import { Avatar } from "./avatar";

export function IconRail() {
  const [active, setActive] = useState<string>("chats");

  return (
    <nav className="hidden w-[72px] shrink-0 flex-col items-center border-r border-zinc-200 bg-zinc-50 py-4 md:flex dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mb-6 flex h-9 w-9 items-center justify-center rounded-xl bg-sky-600 text-sm font-bold text-white">
        D
      </div>

      <ul className="flex flex-1 flex-col items-center gap-2">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <li key={id}>
            <button
              type="button"
              onClick={() => setActive(id)}
              title={label}
              aria-label={label}
              aria-current={active === id}
              className={`flex h-11 w-11 items-center justify-center rounded-xl transition-colors ${
                active === id
                  ? "bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400"
                  : "text-zinc-500 hover:bg-zinc-200/60 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              <Icon className="h-5 w-5" />
            </button>
          </li>
        ))}
      </ul>

      <button
        type="button"
        title="Settings"
        aria-label="Settings"
        className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl text-zinc-500 transition-colors hover:bg-zinc-200/60 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
      >
        <SettingsIcon className="h-5 w-5" />
      </button>

      <button type="button" title="Your profile" aria-label="Your profile">
        <Avatar name="You" online />
      </button>
    </nav>
  );
}
