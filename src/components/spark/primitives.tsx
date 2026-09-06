import Link from "next/link";
import type { ReactNode } from "react";

/** The lime three-bar asterisk decoration used on dark cards / promo banners. */
export function LimeAsterisk({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(50,50)">
        <rect x="-6" y="-45" width="12" height="90" rx="6" ry="6" fill="#B4F105" />
        <rect x="-6" y="-45" width="12" height="90" rx="6" ry="6" fill="#B4F105" transform="rotate(60)" />
        <rect x="-6" y="-45" width="12" height="90" rx="6" ry="6" fill="#B4F105" transform="rotate(120)" />
      </g>
    </svg>
  );
}

export function PageHeader({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-header">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export function TrendBadge({ dir, children }: { dir: "up" | "down"; children: ReactNode }) {
  return (
    <span className={`trend-badge ${dir === "up" ? "trend-up" : "trend-down"}`}>
      <i className={`bi ${dir === "up" ? "bi-arrow-up-right" : "bi-arrow-down-left"}`} />
      <span>{children}</span>
    </span>
  );
}

/** Spark `.badge-table` pill (success / pending / failed). */
export function BadgeTable({
  variant,
  children,
}: {
  variant: "success" | "pending" | "failed";
  children: ReactNode;
}) {
  return <span className={`badge-table ${variant}`}>{children}</span>;
}

/** The dark-green highlight card (Spark "alert-green-card"). */
export function AlertGreenCard({
  badge,
  date,
  text,
  href,
  linkLabel,
}: {
  badge: string;
  date: string;
  text: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className="card alert-green-card">
      <div className="position-relative z-index-2">
        <span className="alert-green-badge">{badge}</span>
        <div className="alert-green-date">{date}</div>
        <div className="alert-green-text">{text}</div>
      </div>
      <Link href={href} className="alert-green-link z-index-2">
        <span>{linkLabel}</span>
        <i className="bi bi-arrow-right" />
      </Link>
      <LimeAsterisk className="alert-green-bg-shape" />
    </div>
  );
}

export function PromoBanner({
  title,
  desc,
  href,
  cta,
}: {
  title: string;
  desc: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="promo-banner-card">
      <LimeAsterisk className="promo-banner-bg-shape" />
      <h3 className="promo-title">{title}</h3>
      <p className="promo-desc">{desc}</p>
      <Link
        href={href}
        className="btn-promo z-index-2"
        style={{ textDecoration: "none", display: "block" }}
      >
        {cta}
      </Link>
    </div>
  );
}

/** Card header with a title and an optional right slot (legend / menu). */
export function CardHeader({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="card-header">
      <h2 className="card-title">{title}</h2>
      {children}
    </div>
  );
}

export function ProgressRow({
  label,
  value,
  pct,
  tone = "lime",
}: {
  label: string;
  value: string | number;
  pct: number;
  tone?: "lime" | "orange" | "dim";
}) {
  const barClass =
    tone === "orange" ? "bg-brand-orange" : tone === "dim" ? "bg-lime-accent opacity-50" : "bg-lime-accent";
  return (
    <div className="progress-container">
      <div className="progress-label-row">
        <span className="progress-label">{label}</span>
        <span className="progress-value">{value}</span>
      </div>
      <div
        className="progress"
        role="progressbar"
        aria-label={label}
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className={`progress-bar ${barClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
