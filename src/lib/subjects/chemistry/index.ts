import type { SubjectDefinition, Topic } from "@/lib/subjects/types";
import { processes, DAY_FOCUS, TOTAL_DAYS, PASS_THRESHOLD } from "./topics";

const topics: Topic[] = processes.map((p) => ({
  id: p.id,
  subjectId: "chemistry",
  day: p.day,
  title: p.title,
  tokenRewardBase: 5,
  rawMaterials: p.rawMaterials,
  steps: p.steps,
  equations: p.equations,
  sideEffects: p.sideEffects,
  socialBenefits: p.socialBenefits,
  flashcards: p.flashcards,
  quiz: p.quiz.map((q) => ({
    question: q.question,
    type: "multiple_choice" as const,
    options: q.options,
    correctIndex: q.correctIndex,
    explanation: q.explanation,
  })),
}));

export const chemistry: SubjectDefinition = {
  meta: {
    id: "chemistry",
    title: "Chemistry",
    description: "S.4 industrial processes — an 8-day revision sprint.",
    icon: "bi-thermometer-half",
    accent: "#1f7a6c",
    navWeight: 100,
  },
  sections: ["overview", "topics", "resources", "papers", "quizzes"],
  pacing: "day-plan",
  plan: Array.from({ length: TOTAL_DAYS }, (_, i) => ({ day: i + 1, focus: DAY_FOCUS[i + 1] })),
  quiz: { passThreshold: PASS_THRESHOLD, questionTypes: ["multiple_choice"] },
  topics,
};
