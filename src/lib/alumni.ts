/**
 * Alumni helpers shared by the alumni report and the alumni WhatsApp page, so
 * the two can never disagree about which batch a student belongs to.
 */

/** Placeholder for a record with no usable year. Never offered as a filter option. */
export const UNKNOWN_BATCH = "—";

interface HasEnrolmentDates {
  admissionDate?: string;
  discontinuedDate?: string;
}

/**
 * Batch year — the year the student left, else the year they joined.
 *
 * Firestore rows are not guaranteed to hold an ISO date string: the field can
 * be absent, an empty string, a partial date, or a Timestamp. Optional
 * chaining alone does not cover that, because `""?.slice(0, 4)` is `""`, and an
 * empty string reaching `<SelectItem value="">` is a runtime error in Radix.
 * Anything that is not a four-digit year is reported as UNKNOWN_BATCH instead.
 */
export function batchYear(s: HasEnrolmentDates): string {
  const raw = s.discontinuedDate || s.admissionDate || "";
  const year = String(raw).slice(0, 4);
  return /^\d{4}$/.test(year) ? year : UNKNOWN_BATCH;
}
