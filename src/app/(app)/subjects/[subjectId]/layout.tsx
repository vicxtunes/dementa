import Link from "next/link";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { getSubjectDefinition } from "@/lib/subjects";
import { loadDashboard } from "@/lib/domain/curriculum/dashboard";
import { SubjectTabs } from "@/components/spark/subject-tabs";

const SECTION_META: Record<string, { label: string; icon: string; path: string }> = {
  overview: { label: "Overview", icon: "bi-grid-1x2", path: "" },
  topics: { label: "Topics", icon: "bi-journal-text", path: "/topics" },
  resources: { label: "Resources", icon: "bi-folder2-open", path: "/resources" },
  papers: { label: "Exams & Papers", icon: "bi-file-earmark-text", path: "/papers" },
  quizzes: { label: "Quizzes", icon: "bi-controller", path: "/quizzes" },
};

export default async function SubjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ subjectId: string }>;
}) {
  const { subjectId } = await params;
  const def = getSubjectDefinition(subjectId);
  if (!def) notFound();

  const { profile } = await loadDashboard();
  const base = `/subjects/${subjectId}`;

  const tabs = def.sections
    .filter((s) => s !== "quizzes" || true)
    .map((s) => ({
      key: s,
      label: SECTION_META[s].label,
      icon: SECTION_META[s].icon,
      href: `${base}${SECTION_META[s].path}`,
    }));

  return (
    <div className="subject-scope" style={{ "--subject-accent": def.meta.accent } as CSSProperties}>
      <div className="subject-topbar">
        <div className="subject-identity">
          <span className="subject-badge">
            <i className={`bi ${def.meta.icon}`} />
          </span>
          <div>
            <Link href="/subjects" className="subject-crumb">
              <i className="bi bi-chevron-left" /> Subjects
            </Link>
            <h1 className="subject-name">{def.meta.title}</h1>
          </div>
        </div>
        {profile.role === "teacher" && (
          <Link href={`${base}/manage`} className="btn-custom btn-custom-light btn-custom-sm">
            <i className="bi bi-pencil-square" /> Manage
          </Link>
        )}
      </div>

      <SubjectTabs tabs={tabs} base={base} />

      {children}
    </div>
  );
}
