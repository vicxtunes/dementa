import type { Grader } from "./types";

export const multipleChoiceGrader: Grader = {
  grade(question, answer) {
    return (
      question.correct_index != null &&
      answer.selectedIndex != null &&
      answer.selectedIndex === question.correct_index
    );
  },
};
