/**
 * Live-class session status.
 *
 * Status is DERIVED from the clock, never stored. A session's state is entirely
 * a function of its scheduled start and duration versus the current time, so
 * there is nothing to keep in sync and no way for a past session to sit in the
 * database claiming to be live.
 *
 *   now <  start            -> "Scheduled"
 *   start <= now <  end     -> "Live"
 *   now >= start + duration -> "Ended"
 *
 * Any `status` field on existing documents is legacy and ignored.
 */

export type SessionStatus = "Scheduled" | "Live" | "Ended";

export interface SessionTiming {
  /** "YYYY-MM-DD", but older records hold Date/Timestamp/ISO — see toDateParts. */
  date?: unknown;
  /** "14:30" (form input) or "2:30 PM" (older records). */
  time?: unknown;
  /** Minutes. Falls back to DEFAULT_DURATION_MINS when absent or unusable. */
  duration?: unknown;
}

export const DEFAULT_DURATION_MINS = 60;

/** Calendar day, in local time. Handles string / Date / Firestore Timestamp. */
function toDateParts(value: unknown): { y: number; m: number; d: number } | null {
  if (!value) return null;

  if (typeof value === 'string') {
    const ymd = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
    // Built from parts, not `new Date(str)`, which reads a bare YYYY-MM-DD as
    // UTC midnight and lands on the previous day west of Greenwich.
    if (ymd) return { y: +ymd[1], m: +ymd[2], d: +ymd[3] };
  }

  const asDate =
    typeof (value as any)?.toDate === 'function' ? (value as any).toDate()
    : value instanceof Date ? value
    : new Date(value as string);

  if (!(asDate instanceof Date) || Number.isNaN(asDate.getTime())) return null;
  return { y: asDate.getFullYear(), m: asDate.getMonth() + 1, d: asDate.getDate() };
}

/** Accepts 24-hour "14:30" and 12-hour "2:30 PM" / "2:30pm". */
function toTimeParts(value: unknown): { h: number; min: number } | null {
  if (typeof value !== 'string') return null;
  const raw = value.trim();
  if (!raw) return null;

  const meridiem = raw.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (meridiem) {
    let h = +meridiem[1];
    const min = +meridiem[2];
    const isPM = meridiem[3].toUpperCase() === 'PM';
    if (isPM && h !== 12) h += 12;
    if (!isPM && h === 12) h = 0;
    if (h > 23 || min > 59) return null;
    return { h, min };
  }

  const military = raw.match(/^(\d{1,2}):(\d{2})/);
  if (military) {
    const h = +military[1];
    const min = +military[2];
    if (h > 23 || min > 59) return null;
    return { h, min };
  }
  return null;
}

/** Scheduled start, or null when date/time cannot be read. */
export function getSessionStart(session: SessionTiming): Date | null {
  const day = toDateParts(session.date);
  const clock = toTimeParts(session.time);
  if (!day || !clock) return null;
  return new Date(day.y, day.m - 1, day.d, clock.h, clock.min, 0, 0);
}

export function getSessionDuration(session: SessionTiming): number {
  const mins = Number(session.duration);
  return Number.isFinite(mins) && mins > 0 ? mins : DEFAULT_DURATION_MINS;
}

/** Start + duration, or null when the start cannot be read. */
export function getSessionEnd(session: SessionTiming): Date | null {
  const start = getSessionStart(session);
  if (!start) return null;
  return new Date(start.getTime() + getSessionDuration(session) * 60_000);
}

export function getSessionStatus(
  session: SessionTiming,
  now: Date = new Date()
): SessionStatus {
  const start = getSessionStart(session);
  // Unreadable timing: report "Scheduled". We cannot prove such a session is
  // over, and we must never claim it is live.
  if (!start) return 'Scheduled';

  if (now < start) return 'Scheduled';
  return now < new Date(start.getTime() + getSessionDuration(session) * 60_000)
    ? 'Live'
    : 'Ended';
}

/** Attaches the derived status, shadowing any stored one. */
export function withSessionStatus<T extends SessionTiming>(
  sessions: T[],
  now: Date
): (T & { status: SessionStatus })[] {
  return sessions.map((s) => ({ ...s, status: getSessionStatus(s, now) }));
}
