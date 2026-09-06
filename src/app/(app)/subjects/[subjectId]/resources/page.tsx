import Link from "next/link";
import { notFound } from "next/navigation";
import { loadDashboard } from "@/lib/domain/curriculum/dashboard";
import { getSubject } from "@/lib/domain/curriculum/queries";
import { listSubjectResources } from "@/lib/domain/resources/queries";

const KIND_META = {
  note: { icon: "bi-journal-text", label: "Note" },
  past_paper: { icon: "bi-file-earmark-pdf", label: "Past paper" },
  link: { icon: "bi-link-45deg", label: "Link" },
} as const;

export default async function ResourcesPage({
  params,
}: {
  params: Promise<{ subjectId: string }>;
}) {
  const { subjectId } = await params;
  const subject = getSubject(subjectId);
  if (!subject) notFound();

  const { profile } = await loadDashboard();
  const resources = await listSubjectResources(subjectId);
  const isTeacher = profile.role === "teacher";

  if (resources.length === 0) {
    return (
      <div className="card">
        <div className="subject-empty">
          <i className="bi bi-folder2-open" />
          <p className="m-0" style={{ fontWeight: 700, color: "var(--text-main)" }}>
            No resources yet
          </p>
          <p className="m-0">
            {isTeacher
              ? "Add revision notes, past papers and links for your class."
              : "Your teacher hasn't shared any notes or past papers for this subject yet."}
          </p>
          {isTeacher && (
            <Link href={`/subjects/${subjectId}/manage`} className="btn-custom btn-custom-primary btn-custom-sm mt-2">
              <i className="bi bi-plus-lg" /> Add a resource
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="row g-3">
      {resources.map((r) => {
        const meta = KIND_META[r.kind];
        return (
          <div className="col-md-6" key={r.id}>
            <div className="card h-100 mb-0">
              <div className="d-flex align-items-start gap-3">
                <span
                  className="d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    background: "var(--subject-accent, #072f1f)",
                    color: "#fff",
                    fontSize: "1.1rem",
                  }}
                >
                  <i className={`bi ${meta.icon}`} />
                </span>
                <div className="min-w-0">
                  <div className="table-user-sub">{meta.label}</div>
                  <h3 className="card-title" style={{ fontSize: "1rem" }}>
                    {r.title}
                  </h3>
                  {r.body && <p className="item-sub mb-2">{r.body}</p>}
                  {r.url && (
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-custom btn-custom-light btn-custom-sm"
                    >
                      <i className="bi bi-box-arrow-up-right" /> Open
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
      {isTeacher && (
        <div className="col-md-6">
          <Link
            href={`/subjects/${subjectId}/manage`}
            className="card h-100 mb-0 d-flex align-items-center justify-content-center text-center"
            style={{ border: "1px dashed var(--border-light)", boxShadow: "none", textDecoration: "none" }}
          >
            <span className="text-muted-green">
              <i className="bi bi-plus-lg" /> Add a resource
            </span>
          </Link>
        </div>
      )}
    </div>
  );
}
