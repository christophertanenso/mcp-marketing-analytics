/**
 * Format data as a markdown table.
 */
export function markdownTable(headers: string[], rows: string[][]): string {
  if (rows.length === 0) {
    return "No data found.";
  }

  const colWidths = headers.map((h, i) => {
    const maxDataWidth = rows.reduce((max, row) => Math.max(max, (row[i] || "").length), 0);
    return Math.max(h.length, maxDataWidth);
  });

  const headerRow = "| " + headers.map((h, i) => h.padEnd(colWidths[i])).join(" | ") + " |";
  const separator = "| " + colWidths.map(w => "-".repeat(w)).join(" | ") + " |";
  const dataRows = rows.map(
    row => "| " + row.map((cell, i) => (cell || "").padEnd(colWidths[i])).join(" | ") + " |"
  );

  return [headerRow, separator, ...dataRows].join("\n");
}

/**
 * Format a number with commas for readability.
 */
export function formatNumber(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return String(value);
  return num.toLocaleString("en-US");
}

/**
 * Format a percentage (0-1 range or 0-100 range).
 */
export function formatPercent(value: number | string, alreadyPercent = false): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return String(value);
  const pct = alreadyPercent ? num : num * 100;
  return pct.toFixed(2) + "%";
}

/**
 * Format currency from micros (Google Ads) or raw value.
 */
export function formatCurrency(micros: number | string): string {
  const num = typeof micros === "string" ? parseFloat(micros) : micros;
  if (isNaN(num)) return String(micros);
  return "$" + (num / 1_000_000).toFixed(2);
}

/**
 * Format currency from a raw dollar amount.
 */
export function formatDollars(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return String(value);
  return "$" + num.toFixed(2);
}

/**
 * Format seconds into a human-readable duration.
 */
export function formatDuration(seconds: number | string): string {
  const num = typeof seconds === "string" ? parseFloat(seconds) : seconds;
  if (isNaN(num)) return String(seconds);
  const mins = Math.floor(num / 60);
  const secs = Math.round(num % 60);
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}
