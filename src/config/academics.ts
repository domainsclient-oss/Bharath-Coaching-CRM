/**
 * Academic structure. A batch is Class + Board + Mode, e.g.
 * "Class 10 - CBSE - Offline". Classes and modes are fixed here; boards live
 * in boards.ts.
 */
export const CLASSES: readonly string[] = [
  "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12",
];

/** For filter dropdowns: "All" first, rendered as "All Classes". */
export const CLASS_FILTER_OPTIONS: readonly string[] = ["All", ...CLASSES];

export const MODES: readonly string[] = ["Offline", "Online", "One to One"];

/** For filter dropdowns: "All" first, rendered as "All Modes". */
export const MODE_FILTER_OPTIONS: readonly string[] = ["All", ...MODES];

/**
 * "10" → "Class 10". Batches store this as `name`: attendance and leads read
 * the grade back out of it, so it must stay in exactly this form.
 */
export const classLabel = (classNumber: string) => `Class ${classNumber}`;

/** "Class 10", "class 10 A", "10" → "10". Empty when the name has no grade. */
export function classNumberOf(name?: string): string {
  const match = (name ?? "").match(/\d+/);
  return match ? String(Number(match[0])) : "";
}

export interface BatchFields {
  name?: string;
  classNumber?: string;
  board?: string;
  mode?: string;
}

/** Grade of a batch, falling back to its name for records made before classNumber existed. */
export const batchClassNumber = (b: BatchFields) => b.classNumber || classNumberOf(b.name);

/** "Class 10 - CBSE - Offline" — the label to show wherever a batch is listed. */
export function batchLabel(b: BatchFields): string {
  const n = batchClassNumber(b);
  return [n ? classLabel(n) : b.name, b.board, b.mode].filter(Boolean).join(" - ");
}

/** Identity of a batch, for spotting duplicates. Case-insensitive. */
export const batchKey = (classNumber: string, board: string, mode: string) =>
  `${classNumber}|${board}|${mode}`.toLowerCase();

/**
 * Subjects offered per class band. Every subject dropdown for a student reads
 * from here — add or rename a subject in this one place.
 */
export const SUBJECTS_BY_CLASS_BAND = {
  /** Classes 1–8 */
  primary: [
    "Tamil", "English", "Maths", "Science", "Social", "All Subjects",
    "Hindi", "Basic Tamil", "Basic English", "Basic Maths",
    "Summer Class", "Hand Writing",
  ],
  /** Classes 9–10 */
  secondary: [
    "Tamil", "English", "Maths", "Science", "Social", "All Subjects",
    "Basic Tamil", "Basic English", "Basic Maths",
    "Summer Class", "Hand Writing",
  ],
  /** Classes 11–12 */
  higherSecondary: [
    "Mathematics", "Physics", "Chemistry", "Computer Science",
  ],
} as const satisfies Record<string, readonly string[]>;

/**
 * Subjects a student of this class can be enrolled in. Accepts "10" or
 * "Class 10"; returns an empty list when no class has been chosen yet.
 */
export function subjectsForClass(classNumber?: string): readonly string[] {
  const grade = Number(classNumberOf(classNumber));
  if (!grade) return [];
  if (grade <= 8)  return SUBJECTS_BY_CLASS_BAND.primary;
  if (grade <= 10) return SUBJECTS_BY_CLASS_BAND.secondary;
  return SUBJECTS_BY_CLASS_BAND.higherSecondary;
}

/**
 * Per-subject batch timings, keyed by `${classNumber}|${board}`. Only the
 * combinations listed here offer a timing choice — every other class keeps
 * the plain subject selection.
 */
export const BATCH_TIMINGS: Record<string, Record<string, readonly string[]>> = {
  "10|CBSE": {
    Maths: [
      "Batch I — 5:30 PM to 6:45 PM",
      "Batch II — 6:45 PM to 8:00 PM",
    ],
    Science: [
      "Batch I — 8:00 PM to 9:15 PM",
      "Batch II — 7:00 PM to 8:30 PM",
    ],
  },
};

/**
 * Subject → batch timings on offer for this class and board. Empty when the
 * combination has no batch timings, which is how callers know to hide the
 * timing selection entirely.
 */
export function batchTimingsFor(classNumber?: string, board?: string): Record<string, readonly string[]> {
  const key = `${classNumberOf(classNumber)}|${(board ?? "").toUpperCase()}`;
  return BATCH_TIMINGS[key] ?? {};
}
