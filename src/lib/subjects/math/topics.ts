import type { Topic } from "@/lib/subjects/types";

// Stub content for the second subject — proves the platform is subject-generic.
// `numeric` questions carry their grading fields now; tolerance grading (mathjs)
// and the on-screen math keypad land in a later milestone.

export const mathTopics: Topic[] = [
  {
    id: "trig-ratios",
    subjectId: "math",
    day: null,
    title: "Trigonometric Ratios",
    tokenRewardBase: 5,
    content: {
      summary:
        "The sine, cosine and tangent of an angle in a right-angled triangle, and the exact values for 30°, 45° and 60°.",
      keyPoints: [
        "sin θ = opposite / hypotenuse",
        "cos θ = adjacent / hypotenuse",
        "tan θ = opposite / adjacent",
        "sin 30° = 1/2, cos 30° = √3/2, tan 30° = 1/√3",
        "sin 45° = cos 45° = 1/√2, tan 45° = 1",
        "sin 60° = √3/2, cos 60° = 1/2, tan 60° = √3",
      ],
    },
    flashcards: [
      { front: "sin 30°", back: "1/2" },
      { front: "cos 30°", back: "√3/2 ≈ 0.866" },
      { front: "tan 45°", back: "1" },
      { front: "Which ratio is opposite / adjacent?", back: "tangent (tan)" },
    ],
    quiz: [
      {
        question: "What is the exact value of sin 30°?",
        type: "numeric",
        correctNumericValue: 0.5,
        numericTolerance: 0.001,
        explanation: "sin 30° = 1/2 = 0.5 exactly.",
      },
      {
        question: "What is cos 30°? (give a decimal to 3 s.f. or an exact form)",
        type: "numeric",
        correctNumericValue: 0.8660254,
        numericTolerance: 0.01,
        explanation: "cos 30° = √3/2 ≈ 0.866.",
      },
      {
        question: "In a right-angled triangle, tan θ is defined as:",
        type: "multiple_choice",
        options: [
          "adjacent / hypotenuse",
          "opposite / hypotenuse",
          "opposite / adjacent",
          "hypotenuse / opposite",
        ],
        correctIndex: 2,
        explanation: "tan θ = opposite / adjacent.",
      },
      {
        question: "What is tan 45°?",
        type: "numeric",
        correctNumericValue: 1,
        numericTolerance: 0.001,
        explanation: "In a 45°–45°–90° triangle opposite = adjacent, so tan 45° = 1.",
      },
    ],
  },
  {
    id: "pythagoras",
    subjectId: "math",
    day: null,
    title: "Pythagoras' Theorem",
    tokenRewardBase: 5,
    content: {
      summary:
        "In a right-angled triangle, the square of the hypotenuse equals the sum of the squares of the other two sides: a² + b² = c².",
      keyPoints: [
        "c is always the hypotenuse (the side opposite the right angle).",
        "To find a shorter side: a = √(c² − b²).",
        "A triangle with sides 3, 4, 5 is right-angled (3² + 4² = 5²).",
      ],
    },
    flashcards: [
      { front: "State Pythagoras' theorem", back: "a² + b² = c², where c is the hypotenuse" },
      { front: "Sides 6 and 8 — what is the hypotenuse?", back: "√(36 + 64) = √100 = 10" },
    ],
    quiz: [
      {
        question: "A right-angled triangle has legs of 3 cm and 4 cm. How long is the hypotenuse, in cm?",
        type: "numeric",
        correctNumericValue: 5,
        numericTolerance: 0.001,
        explanation: "√(3² + 4²) = √25 = 5 cm.",
      },
      {
        question: "The hypotenuse is 13 and one leg is 5. How long is the other leg?",
        type: "numeric",
        correctNumericValue: 12,
        numericTolerance: 0.001,
        explanation: "√(13² − 5²) = √(169 − 25) = √144 = 12.",
      },
      {
        question: "Which side does c represent in a² + b² = c²?",
        type: "multiple_choice",
        options: ["The shortest side", "The hypotenuse", "Any side", "The base"],
        correctIndex: 1,
        explanation: "c is the hypotenuse — the side opposite the right angle.",
      },
    ],
  },
];
