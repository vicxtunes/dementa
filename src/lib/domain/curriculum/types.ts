export type Role = "student" | "teacher";

export type Profile = {
  id: string;
  full_name: string | null;
  role: Role;
  class_code: string;
  streak_days: number;
  last_active: string | null;
  token_balance: number;
  created_at: string;
};

export type ProgressRow = {
  user_id: string;
  topic_id: string;
  content_viewed: boolean;
  quiz_passed: boolean;
  updated_at: string;
};

export type QuizAttemptRow = {
  id: string;
  user_id: string;
  topic_id: string;
  score: number;
  total: number;
  created_at: string;
};
