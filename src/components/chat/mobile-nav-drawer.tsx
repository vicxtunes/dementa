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
        className="flex h-9 w-9 items-center justify-center rounded-[10px] text-muted hover:bg-canvas md:hidden"
      >
        <MenuIcon className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-forest-dark/40 backdrop-blur-sm"
          />
          <div className="absolute inset-y-0 left-0 flex w-64 flex-col bg-white py-4 shadow-xl">
            <div className="flex items-center justify-between px-4 pb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#1A3E30] text-lg font-bold text-lime">
                  <i className="bi bi-asterisk" />
                </div>
                <span className="text-sm font-bold text-ink">Dementa</span>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="flex h-8 w-8 items-center justify-center rounded-[10px] text-muted hover:bg-canvas"
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
                    className={`flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-bold transition-colors ${
                      active === id ? "bg-[#eef4f1] text-forest" : "text-muted hover:bg-canvas"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {label}
                  </button>
                </li>
              ))}
            </ul>

            <div className="flex items-center justify-between border-t border-[#e9efef] px-4 pt-4">
              <div className="flex items-center gap-2">
                <Avatar name="You" online />
                <span className="text-sm text-ink">You</span>
              </div>
              <button
                type="button"
                aria-label="Settings"
                className="flex h-9 w-9 items-center justify-center rounded-[10px] text-muted hover:bg-canvas"
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
