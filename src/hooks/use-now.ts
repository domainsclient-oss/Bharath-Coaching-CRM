"use client";

import { useEffect, useState } from "react";

/**
 * A Date that re-renders on an interval, so clock-derived UI (a session
 * flipping Scheduled -> Live -> Ended) updates without a page refresh.
 *
 * Initialised to the real current time rather than a placeholder, so the first
 * paint already shows correct statuses. That is safe here despite SSR: the
 * sessions come from a Firestore onSnapshot subscription, which yields an empty
 * list on the server, so there is no time-dependent markup to mismatch.
 */
export function useNow(intervalMs = 30_000): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    // Resync immediately on mount, then keep ticking.
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}
