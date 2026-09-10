/**
 * Timetable slot labels.
 *
 * A slot is stored as one display string on the entry, e.g. "10:00-11:00 AM",
 * and the weekly grid groups rows by that exact string. So a slot the user
 * picks by hand has to come out character-for-character identical to the
 * seeded ones in `TIME_SLOTS`, or the same hour would split into two rows.
 * These helpers are the single place that format is written and read.
 */

export interface SlotTimes {
  /** 24-hour "HH:MM", the shape an <input type="time"> works in. */
  start: string;
  end: string;
}

const pad = (n: number) => String(n).padStart(2, '0');

const to24 = (hour12: number, minute: number, meridiem: 'AM' | 'PM'): number => {
  const hour = meridiem === 'AM' ? (hour12 === 12 ? 0 : hour12) : (hour12 === 12 ? 12 : hour12 + 12);
  return hour * 60 + minute;
};

/** Minutes since midnight for a 24-hour "HH:MM", or null if it is not one. */
export const minutesOf = (value: string): number | null => {
  const match = /^(\d{1,2}):(\d{2})$/.exec((value ?? '').trim());
  if (!match) return null;
  const hours = +match[1];
  const minutes = +match[2];
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
};

const asHHMM = (minutes: number) => `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;

/**
 * Read a stored label back into two times.
 *
 * The meridiem written once at the end belongs to the closing time. The
 * opening time borrows it unless that would place the start at or after the
 * end, which is how "11:00-12:00 PM" means eleven in the morning until noon.
 */
export function parseSlot(label: string): SlotTimes | null {
  const match = /^\s*(\d{1,2}):(\d{2})\s*(AM|PM)?\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)?\s*$/i.exec(label ?? '');
  if (!match) return null;

  const endMeridiem = (match[6] || match[3] || 'AM').toUpperCase() as 'AM' | 'PM';
  const startMeridiem = (match[3] || endMeridiem).toUpperCase() as 'AM' | 'PM';

  const end = to24(+match[4], +match[5], endMeridiem);
  let start = to24(+match[1], +match[2], startMeridiem);
  // Only shift a start that had no meridiem of its own to borrow.
  if (!match[3] && start >= end) start -= 12 * 60;
  if (start < 0 || start >= end) return null;

  return { start: asHHMM(start), end: asHHMM(end) };
}

/**
 * Write two times back into the seeded label shape, so a hand-picked slot and
 * a preset slot that cover the same hour are one string and share one row.
 * Returns null when the pair is not a usable range.
 */
export function formatSlot(start: string, end: string): string | null {
  const from = minutesOf(start);
  const to = minutesOf(end);
  if (from == null || to == null || to <= from) return null;

  const twelveHour = (minutes: number) => {
    const hour = Math.floor(minutes / 60) % 24;
    return `${hour % 12 === 0 ? 12 : hour % 12}:${pad(minutes % 60)}`;
  };

  return `${twelveHour(from)}-${twelveHour(to)} ${Math.floor(to / 60) % 24 >= 12 ? 'PM' : 'AM'}`;
}

/** Sort key for grid rows. A label that will not parse sinks to the bottom. */
export const slotStartMinutes = (label: string): number => {
  const parsed = parseSlot(label);
  const minutes = parsed ? minutesOf(parsed.start) : null;
  return minutes ?? Number.MAX_SAFE_INTEGER;
};

export interface ClockParts {
  /** 1 to 12, as read off a clock face. */
  hour: number;
  minute: number;
  meridiem: 'AM' | 'PM';
}

/**
 * Split a 24-hour "HH:MM" into the three parts the pickers work in.
 *
 * The form keeps its state in 24-hour strings so the label helpers above stay
 * the only place that has to reason about meridiems; the pickers convert at
 * the edge.
 */
export function splitTime(value: string): ClockParts | null {
  const total = minutesOf(value);
  if (total == null) return null;
  const hour24 = Math.floor(total / 60);
  return {
    hour: hour24 % 12 === 0 ? 12 : hour24 % 12,
    minute: total % 60,
    meridiem: hour24 >= 12 ? 'PM' : 'AM',
  };
}

/** Put the three parts back together as a 24-hour "HH:MM". */
export function joinTime({ hour, minute, meridiem }: ClockParts): string {
  const hour24 = meridiem === 'AM' ? (hour === 12 ? 0 : hour) : (hour === 12 ? 12 : hour + 12);
  return `${pad(hour24)}:${pad(minute)}`;
}
