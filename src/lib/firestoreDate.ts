/**
 * Reading dates back out of Firestore.
 *
 * The same field arrives in three shapes depending on which screen wrote it and
 * when: a Firestore `Timestamp`, a real `Date`, or a plain "YYYY-MM-DD" string
 * from a date input. A page that assumes only one of them shows "Invalid Date"
 * against perfectly good data, so every date the portal renders goes through
 * here.
 */

/** Null when the value is absent or cannot be read as a date. */
export const toDate = (value: any): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value?.toDate === 'function') {
    const converted = value.toDate();
    return converted instanceof Date && !Number.isNaN(converted.getTime()) ? converted : null;
  }
  // A Timestamp that arrived as plain JSON rather than through the SDK.
  if (typeof value?.seconds === 'number') return new Date(value.seconds * 1000);

  const raw = String(value).trim();
  if (!raw) return null;

  // Read a bare "YYYY-MM-DD" as a local date. Letting Date parse it treats it as
  // UTC midnight, which shows the previous day anywhere west of Greenwich.
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  const parsed = iso ? new Date(+iso[1], +iso[2] - 1, +iso[3]) : new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

/**
 * A date for reading, in the day-month-year order the branches use.
 * Anything unreadable falls back to the raw text rather than "Invalid Date",
 * so a hand-typed value still tells the student something.
 */
export const formatDate = (value: any, fallback = 'Not on record'): string => {
  const date = toDate(value);
  if (date) return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const raw = value == null ? '' : String(value).trim();
  return raw || fallback;
};
