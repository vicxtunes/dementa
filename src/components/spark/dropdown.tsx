"use client";

import {
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";

type DropdownProps = {
  /** The toggle element. Gets click/aria wiring cloned onto it. */
  trigger: ReactElement<Record<string, unknown>>;
  children: ReactNode;
  /** Horizontal edge the menu aligns to. */
  align?: "start" | "end";
  /** Extra class on the menu (Spark provides .dropdown-menu-custom, -profile, etc.). */
  menuClassName?: string;
  /** Keep open when clicking inside the menu (e.g. notifications). */
  autoClose?: "outside" | true;
};

const EDGE_PAD = 8;

/**
 * Headless dropdown — replaces Bootstrap's dropdown JS. Click to toggle,
 * closes on outside-click and Escape. Positioned with plain absolute layout
 * (no Popper); after opening it nudges itself back inside the viewport so a
 * wide menu near a screen edge (e.g. notifications on mobile) stays visible.
 */
export function Dropdown({
  trigger,
  children,
  align = "end",
  menuClassName = "dropdown-menu-custom",
  autoClose = true,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Runs when the menu mounts (it's only in the DOM while open). Measures the
  // menu and shifts it horizontally if it spills past either viewport edge.
  const measureMenu = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    requestAnimationFrame(() => {
      node.style.transform = "";
      const rect = node.getBoundingClientRect();
      const vw = document.documentElement.clientWidth;
      if (rect.width > vw - EDGE_PAD * 2) {
        node.style.transform = `translateX(${EDGE_PAD - rect.left}px)`;
        node.style.maxWidth = `${vw - EDGE_PAD * 2}px`;
      } else if (rect.left < EDGE_PAD) {
        node.style.transform = `translateX(${EDGE_PAD - rect.left}px)`;
      } else if (rect.right > vw - EDGE_PAD) {
        node.style.transform = `translateX(${vw - EDGE_PAD - rect.right}px)`;
      }
    });
  }, []);

  const clonedTrigger = isValidElement(trigger)
    ? cloneElement(trigger, {
        onClick: (e: React.MouseEvent) => {
          (trigger.props.onClick as ((e: React.MouseEvent) => void) | undefined)?.(e);
          setOpen((o) => !o);
        },
        "aria-expanded": open,
        "aria-haspopup": "menu",
        "aria-controls": id,
      })
    : trigger;

  return (
    <div className="dropdown position-relative" ref={wrapRef}>
      {clonedTrigger}
      {open && (
        <div
          id={id}
          role="menu"
          ref={measureMenu}
          className={`dropdown-menu ${menuClassName} show`}
          style={{
            position: "absolute",
            top: "calc(100% + 0.25rem)",
            left: align === "start" ? 0 : "auto",
            right: align === "end" ? 0 : "auto",
          }}
          onClick={() => {
            // Defer so a click that also submits a form / fires a server action
            // (e.g. Sign out) isn't cut short by this menu unmounting first.
            if (autoClose === true) setTimeout(() => setOpen(false), 0);
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
