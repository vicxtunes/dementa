import Link from "next/link";
import { redirect } from "next/navigation";
import { loadDashboard } from "@/lib/domain/curriculum/dashboard";
import { listClasses, classStudentCounts } from "@/lib/domain/classes/queries";
import { createClass } from "@/lib/domain/classes/service";
import { PageHeader } from "@/components/spark/primitives";

export default async function ClassesPage() {
  const { profile } = await loadDashboard();
  if (profile.role !== "teacher") redirect(`/classes/${encodeURIComponent(profile.class_code)}`);

  const [classes, counts] = await Promise.all([listClasses(), classStudentCounts()]);

  return (
    <>
      <PageHeader title="Classes" subtitle="Create classes and scope topics and resources to them." />

      <div className="row g-4">
        <div className="col-lg-8">
          <div className="table-card-custom">
            <div className="table-responsive">
              <table className="table-custom">
                <thead>
                  <tr>
                    <th>Class</th>
                    <th>Term</th>
                    <th>Students</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {classes.map((c) => (
                    <tr key={c.code}>
                      <td>
                        <div className="table-user-name">{c.name}</div>
                        <div className="table-user-sub">{c.code}</div>
                      </td>
                      <td className="table-user-sub">{c.term_label ?? "—"}</td>
                      <td>{counts[c.code] ?? 0}</td>
                      <td style={{ textAlign: "right" }}>
                        <Link href={`/classes/${encodeURIComponent(c.code)}`} className="btn-custom btn-custom-light btn-custom-sm">
                          Open
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">New class</h2>
            </div>
            <form action={createClass} className="d-flex flex-column gap-3">
              <div>
                <label className="form-label-custom" htmlFor="name">
                  Name
                </label>
                <input id="name" name="name" className="form-control-custom" placeholder="S.4 Sciences" required />
              </div>
              <div>
                <label className="form-label-custom" htmlFor="code">
                  Join code
                </label>
                <input id="code" name="code" className="form-control-custom" placeholder="S4-SCI" />
              </div>
              <div>
                <label className="form-label-custom" htmlFor="term_label">
                  Term / period
                </label>
                <input
                  id="term_label"
                  name="term_label"
                  className="form-control-custom"
                  placeholder="Term 1 holiday 2026"
                />
              </div>
              <button type="submit" className="btn-custom btn-custom-primary align-self-start">
                Create class
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
