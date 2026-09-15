/**
 * Reading a CSV file back into rows.
 *
 * The counterpart to `exportToCSV`. Splitting on commas and newlines is not
 * enough: a quoted field may itself contain a comma, a newline or an escaped
 * quote, and a file saved by Excel arrives with a byte order mark and carriage
 * returns. This walks the text once, character by character, so all of those
 * survive the trip.
 */

/** One parsed row per line, one string per cell. Empty trailing rows dropped. */
export function parseCSV(text: string): string[][] {
  // Excel writes a byte order mark; left in place it becomes part of the first
  // column name and no header would ever match.
  const input = text.replace(/^﻿/, '');

  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    if (quoted) {
      if (char === '"') {
        // A doubled quote inside a quoted field is one literal quote.
        if (input[i + 1] === '"') { cell += '"'; i++; }
        else quoted = false;
      } else {
        cell += char;
      }
      continue;
    }

    if (char === '"') { quoted = true; continue; }

    if (char === ',') { row.push(cell); cell = ''; continue; }

    if (char === '\n' || char === '\r') {
      // Treat CRLF as one break rather than two.
      if (char === '\r' && input[i + 1] === '\n') i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
      continue;
    }

    cell += char;
  }

  // Whatever is still in hand when the text runs out is the last cell.
  if (cell !== '' || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  // A file ending in a newline leaves one empty row behind; so does a stray
  // blank line in the middle.
  return rows.filter(r => r.some(c => c.trim() !== ''));
}

/**
 * A column heading reduced to something worth comparing.
 *
 * "App No", "appNo" and "app_no" are the same column as far as an import is
 * concerned, so spelling, case and punctuation are all dropped before matching.
 */
export const normalizeHeader = (value: string): string =>
  (value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
