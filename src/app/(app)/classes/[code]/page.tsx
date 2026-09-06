import { notFound, redirect } from "next/navigation";
import { loadDashboard } from "@/lib/domain/curriculum/dashboard";
import { getClass, classRoster, listClasses } from "@/lib/domain/classes/queries";
import { PageHeader } from "@/components/spark/primitives";
import { StudentsTable } from "@/components/class/students-table";

export default async function ClassDetailPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code: raw } = await params;
  const code = decodeURIComponent(raw);
  const { profile } = await loadDashboard();

  // Students may only view their own class roster.
  if (profile.role !== "teacher" && profile.class_code !== code) redirect("/home");

  const [cls, roster, allClasses] = await Promise.all([
    getClass(code),
    classRoster(code),
    profile.role === "teacher" ? listClasses() : Promise.resolve([]),
  ]);
  if (!cls) notFound();

  return (
    <>
      <PageHeader
        title={cls.name}
        subtitle={`${cls.code}${cls.term_label ? ` · ${cls.term_label}` : ""} · ${roster.length} students`}
      />
      <StudentsTable
        students={roster}
        canManage={profile.role === "teacher"}
        classes={allClasses.map((c) => ({ code: c.code, name: c.name }))}
      />
    </>
  );
}
