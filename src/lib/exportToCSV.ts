/**
 * exportToCSV
 * Converts a header row + data rows into a CSV file and triggers a browser download.
 *
 * @param headers  - Column names for the first row
 * @param rows     - Array of arrays (each inner array is one CSV row, values auto-escaped)
 * @param filename - Downloaded file name (without .csv extension)
 */
export function exportToCSV(
  headers: string[],
  rows: (string | number | null | undefined)[][],
  filename: string
) {
  // Escape a single cell: wrap in quotes if it contains commas, quotes, or newlines
  const escapeCell = (val: string | number | null | undefined): string => {
    const str = val == null ? "" : String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csvContent = [headers, ...rows]
    .map(row => row.map(escapeCell).join(","))
    .join("\n");

  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" }); // BOM for Excel UTF-8
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
