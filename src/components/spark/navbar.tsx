"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { signOut } from "@/lib/actions/auth";
import type { Profile } from "@/lib/domain/curriculum/types";
import { Dropdown } from "./dropdown";

export type ActivityItem = {
  icon: string;
  tone: "success" | "primary" | "warning";
  text: string;
  time: string;
};

export type MatchInvite = { matchId: string; label: string; from: string | null };

function initials(name: string | null) {
  if (!name) return "S";
  return name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
}

export function Navbar({
  profile,
  activity,
  tokenBalance,
  invites,
  onMobileToggle,
  onDesktopToggle,
}: {
  profile: Profile;
  activity: ActivityItem[];
  tokenBalance: number;
  invites: MatchInvite[];
  onMobileToggle: () => void;
  onDesktopToggle: () => void;
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
    else document.exitFullscreen().catch(() => {});
  }, []);

  return (
    <header className="navbar-custom">
      <div className="navbar-left">
        <button
          className="btn-desktop-toggle d-none d-xl-flex align-items-center justify-content-center me-3"
          onClick={onDesktopToggle}
          aria-label="Minimize sidebar"
          type="button"
        >
          <i className="bi bi-chevron-bar-left" />
        </button>
        <button
          className="sidebar-toggle-btn me-2"
          onClick={onMobileToggle}
          aria-label="Toggle navigation"
          type="button"
        >
          <i className="bi bi-list" />
        </button>

        <Dropdown
          menuClassName="dropdown-menu-quick-action"
          align="start"
          trigger={
            <button className="btn-quick-action dropdown-toggle" type="button">
              <i className="bi bi-grid-3x3-gap-fill" />
              <span>Go to</span>
            </button>
          }
        >
          <div className="dropdown-header">Jump to</div>
          <Link className="dropdown-item" href="/subjects">
            <i className="bi bi-mortarboard" /> Subjects
          </Link>
          <Link className="dropdown-item" href="/wallet">
            <i className="bi bi-coin" /> Wallet
          </Link>
          <hr className="dropdown-divider" />
          <Link className="dropdown-item" href="/chat">
            <i className="bi bi-chat-dots" /> Team chat
          </Link>
        </Dropdown>
      </div>

      <div className="navbar-search-wrapper">
        <input
          type="text"
          className="navbar-search-input"
          placeholder="Search subjects, topics, flashcards…"
          aria-label="Search"
        />
        <button className="navbar-search-btn" aria-label="Search" type="button">
          <i className="bi bi-search" />
        </button>
      </div>

      <div className="navbar-actions">
        <Link
          href="/wallet"
          className="btn-date-picker"
          style={{ textDecoration: "none" }}
          aria-label={`Token balance: ${tokenBalance}`}
        >
          <span aria-hidden>🪙</span>
          <span style={{ fontWeight: 800 }}>{tokenBalance}</span>
        </Link>

        <button
          className="navbar-action-btn me-1"
          aria-label="Toggle fullscreen"
          type="button"
          onClick={toggleFullscreen}
        >
          <i className={`bi ${isFullscreen ? "bi-fullscreen-exit" : "bi-arrows-fullscreen"}`} />
        </button>

        <Dropdown
          menuClassName="dropdown-menu-notification p-0"
          autoClose="outside"
          trigger={
            <button className="navbar-action-btn dropdown-toggle" type="button" aria-label="Notifications">
              <i className="bi bi-bell" />
              {(activity.length > 0 || invites.length > 0) && <span className="navbar-action-badge" />}
            </button>
          }
        >
          <div className="notification-header">
            <h6 className="notification-title">Notifications</h6>
          </div>
          <div className="notification-list">
            {invites.map((inv) => (
              <Link href={`/matches/${inv.matchId}`} key={inv.matchId} className="notification-item">
                <div className="notification-icon bg-primary text-white">
                  <i className="bi bi-controller" />
                </div>
                <div className="notification-content">
                  <p className="notification-text">
                    <strong>{inv.from ?? "A classmate"}</strong> challenged you — {inv.label}
                  </p>
                  <span className="notification-time">Tap to accept or decline</span>
                </div>
                <span className="notification-unread-dot" />
              </Link>
            ))}
            {activity.length === 0 && invites.length === 0 && (
              <div className="notification-item">
                <div className="notification-content">
                  <p className="notification-text">No quiz attempts yet — open a subject to start.</p>
                </div>
              </div>
            )}
            {activity.map((a, i) => (
              <div className="notification-item" key={i}>
                <div
                  className={`notification-icon ${
                    a.tone === "success"
                      ? "bg-success text-white"
                      : a.tone === "warning"
                        ? "bg-warning text-dark"
                        : "bg-primary text-white"
                  }`}
                >
                  <i className={`bi ${a.icon}`} />
                </div>
                <div className="notification-content">
                  <p className="notification-text">{a.text}</p>
                  <span className="notification-time">{a.time}</span>
                </div>
              </div>
            ))}
          </div>
          <Link href="/home" className="notification-footer">
            View home
          </Link>
        </Dropdown>

        <Dropdown
          menuClassName="dropdown-menu-profile"
          trigger={
            <button className="navbar-profile-btn dropdown-toggle" type="button">
              <span className="navbar-profile-img d-flex align-items-center justify-content-center fw-bold bg-forest-light text-lime">
                {initials(profile.full_name)}
              </span>
              <span className="navbar-profile-name d-none d-md-inline">
                {profile.full_name ?? "Student"}
              </span>
              <i className="bi bi-chevron-down navbar-profile-caret" />
            </button>
          }
        >
          <div className="dropdown-header">
            {profile.role === "teacher" ? "Teacher account" : `Class ${profile.class_code}`}
          </div>
          <Link className="dropdown-item" href="/wallet">
            <i className="bi bi-coin" /> Wallet · {tokenBalance} 🪙
          </Link>
          <span className="dropdown-item" aria-disabled="true" style={{ opacity: 0.55, cursor: "default" }}>
            <i className="bi bi-gear" /> Settings
          </span>
          <hr className="dropdown-divider" />
          <form action={signOut}>
            <button className="dropdown-item text-danger w-100 border-0 bg-transparent text-start" type="submit">
              <i className="bi bi-box-arrow-right" /> Sign out
            </button>
          </form>
        </Dropdown>
      </div>
    </header>
  );
}
