import Link from "next/link";
import { loadDashboard } from "@/lib/domain/curriculum/dashboard";
import { listSubjects } from "@/lib/domain/curriculum/queries";
import { conversations } from "@/lib/mock-data";
import { SubjectCard } from "@/components/spark/subject-card";
import { CardHeader, PageHeader } from "@/components/spark/primitives";

export default async function HomePage() {
  const d = await loadDashboard();
  const firstName = d.profile.full_name?.split(" ")[0];
  const isTeacher = d.profile.role === "teacher";
  const subjects = listSubjects();

  return (
    <>
      <PageHeader
        title={firstName ? `Welcome back, ${firstName}` : "Home"}
        subtitle={
          isTeacher
            ? `Class ${d.profile.class_code} · your students' academic home`
            : `Class ${d.profile.class_code} · your academic journey, one place`
        }
      />

      <div className="row g-4">
        <div className="col-sm-4">
          <div className="card card-stat">
            <span className="stat-label">Token balance</span>
            <div className="stat-value">{d.tokenBalance} 🪙</div>
            <div className="trend-badge trend-up">
              <i className="bi bi-coin" />
              <span>Earn by mastering topics</span>
            </div>
          </div>
        </div>
        <div className="col-sm-4">
          <div className="card card-stat">
            <span className="stat-label">Topics mastered</span>
            <div className="stat-value">
              {d.masteredCount}
              <span className="text-muted-green fs-6 fw-semibold">/{d.totalTopics}</span>
            </div>
            <div className="trend-badge trend-up">
              <i className="bi bi-fire" />
              <span>{d.profile.streak_days}-day streak</span>
            </div>
          </div>
        </div>
        <div className="col-sm-4">
          <div className="card card-stat">
            <span className="stat-label">Average score</span>
            <div className="stat-value">{d.avgScore}%</div>
            <div className="trend-badge trend-up">
              <i className="bi bi-clipboard-check" />
              <span>{d.attemptCount} quiz attempts</span>
            </div>
          </div>
        </div>

        <div className="col-lg-8">
          <h2 className="card-title mb-3">Your subjects</h2>
          <div className="row g-4">
            {subjects.map((subject) => {
              const s = d.subject(subject.id);
              return (
                <div className="col-md-6" key={subject.id}>
                  <SubjectCard
                    subject={subject}
                    mastered={s.masteredCount}
                    total={s.total}
                    ctaLabel={s.masteredCount > 0 ? "Continue" : "Open"}
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div className="col-lg-4">
          <h2 className="card-title mb-3">Workspace</h2>
          <div className="card mb-3">
            <CardHeader title="Team Chat" />
            <p className="item-sub">
              {conversations.length} conversations · {conversations.reduce((n, c) => n + c.unread, 0)} unread
            </p>
            <Link href="/chat" className="btn-custom btn-custom-light align-self-start">
              <i className="bi bi-chat-dots" /> Open chat
            </Link>
          </div>

          {isTeacher && (
            <div className="card">
              <CardHeader title="Classes" />
              <p className="item-sub">Manage classes and follow every student&rsquo;s progress.</p>
              <Link href="/classes" className="btn-custom btn-custom-light align-self-start">
                <i className="bi bi-people" /> Open classes
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
