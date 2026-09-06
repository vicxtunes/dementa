"use client";

import { useState } from "react";
import { SettingsIcon } from "./icons";
import { NAV_ITEMS } from "./nav-items";
import { Avatar } from "./avatar";

export function IconRail() {
  const [active, setActive] = useState<string>("chats");

  return (
    <nav className="hidden w-[72px] shrink-0 flex-col items-center bg-[#051C12] py-4 md:flex">
      <div className="mb-6 flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#1A3E30] text-lg font-bold text-lime">
        <i className="bi bi-asterisk" />
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
              className={`flex h-11 w-11 items-center justify-center rounded-[10px] transition-colors ${
                active === id
                  ? "bg-white/10 text-lime"
                  : "text-[#879A91] hover:bg-white/5 hover:text-white"
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
        className="mb-4 flex h-11 w-11 items-center justify-center rounded-[10px] text-[#879A91] transition-colors hover:bg-white/5 hover:text-white"
      >
        <SettingsIcon className="h-5 w-5" />
      </button>

      <button type="button" title="Your profile" aria-label="Your profile">
        <Avatar name="You" online />
      </button>
    </nav>
  );
}
