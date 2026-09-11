/**
 * Timetable day keys.
 *
 * The admin grid stores a day in the short form the weekly grid is sized for
 * ("Mon"), while the student portal thinks in the names a person reads
 * ("Monday") and in whatever `toLocaleDateString` hands back for today. Both
 * sides have to agree on one key or a published timetable reads back as empty,
 * so every comparison goes through `dayKey` and every heading through
 * `DAY_LABELS`.
 */

export const DAY_KEYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

export type DayKey = (typeof DAY_KEYS)[number];

export const DAY_LABELS: Record<DayKey, string> = {
  Mon: 'Monday',
  Tue: 'Tuesday',
  Wed: 'Wednesday',
  Thu: 'Thursday',
  Fri: 'Friday',
  Sat: 'Saturday',
  Sun: 'Sunday',
};

/** "Monday", "monday", "MON" and "Mon" all reduce to "Mon". Null when unreadable. */
export const dayKey = (value?: string): DayKey | null => {
  const head = (value ?? '').trim().slice(0, 3).toLowerCase();
  return DAY_KEYS.find(key => key.toLowerCase() === head) ?? null;
};
