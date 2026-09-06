import Link from "next/link";
import { notFound } from "next/navigation";
import { getSubject } from "@/lib/domain/curriculum/queries";
import { getRunnerPaper } from "@/lib/domain/assessments/queries";
import { assessmentMediaUrl } from "@/lib/domain/assessments/media";
import { PageHeader } from "@/components/spark/primitives";

// P1: read-only paper preview. The timed one-item-per-screen runner lands in P2.
export default async function PaperPage({
  params,
}: {
  params: Promise<{ subjectId: string; paperId: string }>;
}) {
  const { subjectId, paperId } = await params;
  const subject = getSubject(subjectId);
  const bundle = await getRunnerPaper(paperId);
  if (!subject || !bundle) notFound();
  const { paper, sections, items } = bundle;

  const bySection = new Map<string | null, typeof items>();
  for (const it of items) {
    const k = it.section_id;
    bySection.set(k, [...(bySection.get(k) ?? []), it]);
  }

  return (
    <>
      <Link
        href={`/subjects/${subjectId}/papers`}
        className="footer-link d-inline-flex align-items-center gap-1 mb-2"
      >
        <i className="bi bi-arrow-left" /> Exams &amp; Papers
      </Link>
      <PageHeader
        title={paper.title}
        subtitle={`${paper.kind === "exam" ? "Exam" : "Revision paper"}${
          paper.duration_minutes ? ` · ${paper.duration_minutes} min` : ""
        } · +${paper.token_reward_on_completion} tokens on completion`}
      />

      {paper.instructions && (
        <div className="alert-custom alert-custom-info d-block" style={{ whiteSpace: "pre-wrap" }}>
          {paper.instructions}
        </div>
      )}

      <div className="card mb-3">
        <p className="item-sub m-0">
          Online attempts for this paper are being set up. For now this is a read-only preview of the questions.
        </p>
      </div>

      {[...bySection.entries()].map(([sectionId, secItems]) => {
        const sec = sections.find((s) => s.id === sectionId);
        return (
          <div key={sectionId ?? "none"} className="mb-4">
            {sec && (
              <h2 className="card-title mb-1">
                {sec.label}
                {sec.pick_count ? ` — answer ${sec.pick_count} of ${secItems.length}` : ""}
              </h2>
            )}
            {sec?.instructions && <p className="item-sub">{sec.instructions}</p>}
            <div className="d-flex flex-column gap-3">
              {secItems.map((item) => (
                <div className="card" key={item.id}>
                  <div className="card-header">
                    <h3 className="card-title" style={{ fontSize: "1rem" }}>
                      Item {item.item_number}
                      {item.max_marks != null ? ` (${item.max_marks} marks)` : ""}
                    </h3>
                  </div>
                  <p style={{ whiteSpace: "pre-wrap", color: "var(--text-main)" }}>{item.scenario}</p>
                  {item.images.map((im) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={im.path}
                      src={assessmentMediaUrl(im.path)}
                      alt={im.caption ?? "support material"}
                      style={{ maxWidth: 420, borderRadius: 10, marginBottom: 8 }}
                    />
                  ))}
                  {item.task_intro && <p className="item-sub">{item.task_intro}</p>}
                  {item.question_type === "mcq" && (
                    <ol type="A" className="ps-3 m-0">
                      {item.mcq_options.map((o, i) => (
                        <li key={i} style={{ color: "var(--text-main)" }}>
                          {o}
                        </li>
                      ))}
                    </ol>
                  )}
                  {item.question_type === "structured" && (
                    <ol className="ps-3 m-0">
                      {item.sub_questions.map((sq) => (
                        <li key={sq.label} style={{ color: "var(--text-main)" }}>
                          {sq.prompt}
                          {sq.marks ? ` (${sq.marks} marks)` : ""}
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
}
