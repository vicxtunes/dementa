import type {
  PaperItem,
  ItemKey,
  ItemAnswer,
  AssessmentSection,
  QuestionType,
} from "./queries";

/** Fold for lenient exact-match comparison of short answers. */
export function normalizeText(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip diacritics
    .toLowerCase()
    .replace(/[‘’“”"']/g, "") // strip quotes
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.。]+$/, ""); // trailing full stop
}

export function isAutogradable(item: PaperItem, key: ItemKey | undefined): boolean {
  if (item.question_type === "mcq") return key?.correct_option != null && item.mcq_options.length > 0;
  if (item.question_type === "short_answer") return Boolean(key?.expected_answer);
  return false; // structured is always self-marked
}

export function itemMax(item: PaperItem): number {
  if (item.max_marks != null) return item.max_marks;
  if (item.question_type === "structured") {
    return item.sub_questions.reduce((n, q) => n + (q.marks ?? 0), 0);
  }
  return 1;
}

/** Marks an autogradable item earns for a submitted answer (0 otherwise). */
export function gradeOne(item: PaperItem, key: ItemKey | undefined, answer: ItemAnswer | undefined): number {
  if (!answer || !key) return 0;
  if (item.question_type === "mcq" && answer.type === "mcq") {
    return answer.choice != null && answer.choice === key.correct_option ? itemMax(item) : 0;
  }
  if (item.question_type === "short_answer" && answer.type === "short_answer" && key.expected_answer) {
    const pool = [key.expected_answer, ...(key.accepted_answers ?? [])].map(normalizeText);
    return answer.text && pool.includes(normalizeText(answer.text)) ? itemMax(item) : 0;
  }
  return 0;
}

export type ItemBreakdown = {
  itemId: string;
  questionType: QuestionType;
  autogradable: boolean;
  autoAwarded: number;
  max: number;
  counted: boolean; // required, or chosen in a pick-N section
};

export type ScoreBreakdown = {
  perItem: ItemBreakdown[];
  autoScore: number;
  autoMax: number;
  selfMax: number; // total marks available from self-marked (structured / no-key short) counted items
};

/**
 * Auto-score + compute the max marks available, honouring choice-rule sections:
 * a pick-N section contributes `N × (representative item max)` to the max
 * regardless of how many items the student actually chose.
 */
export function scoreAttempt(
  items: PaperItem[],
  keys: Map<string, ItemKey>,
  answers: Record<string, ItemAnswer>,
  sections: AssessmentSection[],
  chosenItems: Record<string, string[]>
): ScoreBreakdown {
  const pickBySection = new Map(sections.map((s) => [s.id, s.pick_count ?? null]));
  const bySection = new Map<string | null, PaperItem[]>();
  for (const it of items) {
    const arr = bySection.get(it.section_id) ?? [];
    arr.push(it);
    bySection.set(it.section_id, arr);
  }
  let autoScore = 0;
  let autoMax = 0;
  let selfMax = 0;
  const perItem: ItemBreakdown[] = [];

  for (const [secId, secItems] of bySection) {
    const pick = secId ? pickBySection.get(secId) ?? null : null;

    if (pick == null) {
      // every item in this group is required
      for (const it of secItems) {
        const key = keys.get(it.id);
        const auto = isAutogradable(it, key);
        const mx = itemMax(it);
        const got = auto ? gradeOne(it, key, answers[it.id]) : 0;
        if (auto) {
          autoScore += got;
          autoMax += mx;
        } else {
          selfMax += mx;
        }
        perItem.push({
          itemId: it.id,
          questionType: it.question_type,
          autogradable: auto,
          autoAwarded: got,
          max: mx,
          counted: true,
        });
      }
      continue;
    }

    // pick-N section: fixed max of N slots, based on the first item's shape
    const rep = secItems[0];
    const repAuto = rep ? isAutogradable(rep, keys.get(rep.id)) : false;
    const slotMax = rep ? itemMax(rep) : 0;
    if (repAuto) autoMax += pick * slotMax;
    else selfMax += pick * slotMax;

    const picked = (chosenItems[secId as string] ?? []).slice(0, pick);
    for (const it of secItems) {
      const key = keys.get(it.id);
      const auto = isAutogradable(it, key);
      const isChosen = picked.includes(it.id);
      const got = isChosen && auto ? gradeOne(it, key, answers[it.id]) : 0;
      if (isChosen && auto) autoScore += got;
      perItem.push({
        itemId: it.id,
        questionType: it.question_type,
        autogradable: auto,
        autoAwarded: got,
        max: itemMax(it),
        counted: isChosen,
      });
    }
  }

  return { perItem, autoScore, autoMax, selfMax };
}

/**
 * Self-marked score from the student's per-sub-part marks, each clamped to its
 * allocation. Structured items count per sub-part; a short-answer item with no
 * expected answer counts as a single part keyed by "answer".
 */
export function selfMarkScore(
  items: PaperItem[],
  keys: Map<string, ItemKey>,
  sections: AssessmentSection[],
  chosenItems: Record<string, string[]>,
  selfMarks: Record<string, Record<string, number>>
): number {
  const { perItem } = scoreAttempt(items, keys, {}, sections, chosenItems);
  const countedSelfItemIds = new Set(
    perItem.filter((p) => !p.autogradable && p.counted).map((p) => p.itemId)
  );
  const itemById = new Map(items.map((it) => [it.id, it]));

  let total = 0;
  for (const itemId of countedSelfItemIds) {
    const it = itemById.get(itemId);
    if (!it) continue;
    const marks = selfMarks[itemId] ?? {};
    if (it.question_type === "structured") {
      for (const sq of it.sub_questions) {
        const alloc = sq.marks ?? 0;
        total += Math.max(0, Math.min(alloc, Math.round(Number(marks[sq.label]) || 0)));
      }
    } else {
      // short_answer with no expected answer → one "answer" slot
      total += Math.max(0, Math.min(itemMax(it), Math.round(Number(marks.answer) || 0)));
    }
  }
  return total;
}
