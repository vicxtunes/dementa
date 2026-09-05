export type SideEffect = { issue: string; effect: string; mitigation: string };
export type Flashcard = { front: string; back: string };
export type QuizQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

export type ProcessEntry = {
  id: string;
  day: number;
  title: string;
  rawMaterials: string[];
  steps: string[];
  equations: string[];
  sideEffects: SideEffect[];
  socialBenefits: string[];
  flashcards: Flashcard[];
  quiz: QuizQuestion[];
};

export type Role = "student" | "teacher";

export type Profile = {
  id: string;
  full_name: string | null;
  role: Role;
  class_code: string;
  streak_days: number;
  last_active: string | null;
  created_at: string;
};

export type ProgressRow = {
  user_id: string;
  process_id: string;
  content_viewed: boolean;
  quiz_passed: boolean;
  updated_at: string;
};

export type QuizAttemptRow = {
  id: string;
  user_id: string;
  process_id: string;
  score: number;
  total: number;
  created_at: string;
};

export type ClassOverviewRow = {
  user_id: string;
  full_name: string | null;
  class_code: string;
  streak_days: number;
  processes_mastered: number;
  total_processes: number;
  avg_score: number;
  quiz_attempts: number;
  best_score: number;
  last_attempt_at: string | null;
};
