"use client";

import { useState } from "react";
import { Avatar } from "./avatar";
import { CloseIcon, MenuIcon, SettingsIcon } from "./icons";
import { NAV_ITEMS, type NavId } from "./nav-items";

export function MobileNavDrawer() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<NavId>("chats");

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 md:hidden dark:text-zinc-400 dark:hover:bg-zinc-900"
      >
        <MenuIcon className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/30"
          />
          <div className="absolute inset-y-0 left-0 flex w-64 flex-col bg-white py-4 shadow-xl dark:bg-zinc-950">
            <div className="flex items-center justify-between px-4 pb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-600 text-sm font-bold text-white">
                  D
                </div>
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  Dementa Chat
                </span>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900"
              >
                <CloseIcon className="h-4.5 w-4.5" />
              </button>
            </div>

            <ul className="flex flex-1 flex-col gap-1 px-2">
              {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => {
                      setActive(id);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      active === id
                        ? "bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400"
                        : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {label}
                  </button>
                </li>
              ))}
            </ul>

            <div className="flex items-center justify-between border-t border-zinc-100 px-4 pt-4 dark:border-zinc-900">
              <div className="flex items-center gap-2">
                <Avatar name="You" online />
                <span className="text-sm text-zinc-700 dark:text-zinc-200">You</span>
              </div>
              <button
                type="button"
                aria-label="Settings"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
              >
                <SettingsIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
