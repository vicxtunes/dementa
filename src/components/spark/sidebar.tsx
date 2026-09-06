"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { SUBJECTS } from "@/lib/subjects";
import type { Profile } from "@/lib/domain/curriculum/types";

function initials(name: string | null) {
  if (!name) return "S";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function Sidebar({
  profile,
  mobileOpen,
  masteredCount,
  onNavigate,
}: {
  profile: Profile;
  mobileOpen: boolean;
  masteredCount: number;
  onNavigate: () => void;
}) {
  const pathname = usePathname();
  const activeSubject = SUBJECTS.find((s) => pathname.startsWith(`/subjects/${s.id}`));
  const [subjectsOpen, setSubjectsOpen] = useState(pathname.startsWith("/subjects"));

  const link = (href: string, icon: string, label: string, badge?: string) => {
    const active =
      href === "/home" ? pathname === "/home" : pathname === href || pathname.startsWith(`${href}/`);
    return (
      <li className="sidebar-menu-item" key={href}>
        <Link
          href={href}
          onClick={onNavigate}
          className={`sidebar-menu-link ${active ? "active" : ""}`}
          title={label}
        >
          <i className={`bi ${icon}`} />
          <span>{label}</span>
          {badge != null && <span className="sidebar-menu-badge">{badge}</span>}
        </Link>
      </li>
    );
  };

  return (
    <div className={`sidebar-wrapper ${mobileOpen ? "show" : ""}`} id="sidebar">
      <Link href="/home" className="sidebar-brand" onClick={onNavigate}>
        <i className="bi bi-asterisk" />
        <span>Dementa</span>
      </Link>

      <div className="flex-grow-1 overflow-y-auto">
        <div className="sidebar-menu-section">
          <div className="sidebar-menu-title">Menu</div>
          <ul className="sidebar-menu-list">
            {link("/home", "bi-house-door-fill", "Home")}
            <li className="sidebar-menu-item">
              <button
                type="button"
                className={`sidebar-menu-link w-100 border-0 bg-transparent text-start ${
                  pathname.startsWith("/subjects") ? "active" : ""
                }`}
                aria-expanded={subjectsOpen}
                onClick={() => setSubjectsOpen((o) => !o)}
              >
                <i className="bi bi-mortarboard-fill" />
                <span>Subjects</span>
                <span className="sidebar-menu-badge">{masteredCount}</span>
                <i className="bi bi-chevron-down dropdown-caret" />
              </button>
              {subjectsOpen && (
                <ul className="sidebar-submenu">
                  <li>
                    <Link href="/subjects" onClick={onNavigate} className="sidebar-submenu-link">
                      All subjects
                    </Link>
                  </li>
                  {SUBJECTS.map((s) => (
                    <li key={s.id}>
                      <Link
                        href={`/subjects/${s.id}`}
                        onClick={onNavigate}
                        className="sidebar-submenu-link d-flex align-items-center gap-2"
                        style={{ color: activeSubject?.id === s.id ? "#fff" : undefined }}
                      >
                        <span
                          style={{
                            width: 7,
                            height: 7,
                            borderRadius: 999,
                            background: s.accent,
                            flexShrink: 0,
                          }}
                        />
                        {s.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
            {link("/quizzes", "bi-controller", "Quizzes")}
            {link("/challenges", "bi-trophy-fill", "Challenges")}
            {link("/wallet", "bi-coin", "Wallet")}
          </ul>
        </div>

        <div className="sidebar-menu-section">
          <div className="sidebar-menu-title">Workspace</div>
          <ul className="sidebar-menu-list">
            {link("/chat", "bi-chat-dots-fill", "Team Chat")}
            {profile.role === "teacher" && link("/classes", "bi-people-fill", "Classes")}
          </ul>
        </div>
      </div>

      <div className="sidebar-profile">
        <span className="sidebar-profile-img d-flex align-items-center justify-content-center fw-bold text-lime">
          {initials(profile.full_name)}
        </span>
        <div className="sidebar-profile-info">
          <div className="sidebar-profile-name">{profile.full_name ?? "Student"}</div>
          <div className="sidebar-profile-email">
            {profile.role === "teacher" ? "Teacher" : `Class ${profile.class_code}`}
          </div>
        </div>
      </div>
    </div>
  );
}
