/**
 * The only boards the institute offers. Every board dropdown in the app reads
 * from here — add or rename a board in this one place.
 */
export const BOARDS: readonly string[] = [
  "CBSE",
  "SAMACHEER",
  "ICSE",
  "IGCSE",
  "IB",
];

/** For filter dropdowns: "All" first, rendered as "All Boards". */
export const BOARD_FILTER_OPTIONS: readonly string[] = ["All", ...BOARDS];
