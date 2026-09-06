import { loadDashboard } from "@/lib/domain/curriculum/dashboard";
import { listSubjects } from "@/lib/domain/curriculum/queries";
import { SubjectCard } from "@/components/spark/subject-card";
import { PageHeader } from "@/components/spark/primitives";

export default async function SubjectsPage() {
  const d = await loadDashboard();
  const subjects = listSubjects();

  return (
    <>
      <PageHeader
        title="Subjects"
        subtitle="Work through a subject's topics over the break. Your teacher follows your progress across all of them."
      />

      <div className="row g-4">
        {subjects.map((subject) => {
          const s = d.subject(subject.id);
          return (
            <div className="col-md-6 col-xl-4" key={subject.id}>
              <SubjectCard
                subject={subject}
                mastered={s.masteredCount}
                total={s.total}
                started={s.startedCount}
                ctaLabel={s.startedCount > 0 ? "Continue" : "Open subject"}
              />
            </div>
          );
        })}
      </div>
    </>
  );
}
