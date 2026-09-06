"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SubjectTabs({
  tabs,
  base,
}: {
  tabs: { key: string; label: string; icon: string; href: string }[];
  base: string;
}) {
  const pathname = usePathname();

  return (
    <nav className="subject-tabs">
      {tabs.map((t) => {
        const active =
          t.href === base ? pathname === base : pathname === t.href || pathname.startsWith(`${t.href}/`);
        return (
          <Link key={t.key} href={t.href} className={`subject-tab ${active ? "active" : ""}`}>
            <i className={`bi ${t.icon}`} />
            <span>{t.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
