/**
 * Client-side CSV export — no backend endpoint required. Builds the file in
 * memory from already-fetched rows and triggers a browser download. Values
 * are RFC 4180-escaped, and a UTF-8 BOM is prepended so Excel renders ₦ and
 * other non-ASCII characters correctly.
 */

function escapeCell(value: unknown): string {
  const s = value === null || value === undefined ? '' : String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers.map(escapeCell).join(',')];
  for (const row of rows) lines.push(row.map(escapeCell).join(','));
  return lines.join('\r\n');
}

export function downloadCsv(filename: string, headers: string[], rows: unknown[][]): void {
  const blob = new Blob(['﻿' + toCsv(headers, rows)], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Timestamped filename, e.g. `audit-trail-2026-07-15.csv`. */
export function csvFilename(base: string): string {
  return `${base}-${new Date().toISOString().slice(0, 10)}.csv`;
}
