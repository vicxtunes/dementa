import type { SubjectDefinition } from "@/lib/subjects/types";
import { mathTopics } from "./topics";

export const math: SubjectDefinition = {
  meta: {
    id: "math",
    title: "Mathematics",
    description: "Trigonometry and geometry — numeric-answer practice.",
    icon: "bi-calculator",
    accent: "#5b5bd6",
    navWeight: 90,
  },
  sections: ["overview", "topics", "resources", "papers", "quizzes"],
  pacing: "free-list",
  quiz: { passThreshold: 0.8, questionTypes: ["multiple_choice", "numeric"] },
  topics: mathTopics,
};
