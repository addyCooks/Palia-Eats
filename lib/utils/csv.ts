// Builds CSV text for spreadsheets. Pure (no imports) so it can be tested on its own.

// One cell. Quotes and commas are handled, and a cell that a spreadsheet could mistake for a
// formula (starting with = @ or a stray + or -) gets a leading ' so it stays plain text: names and
// notes typed by customers end up in these files, and "=HYPERLINK(...)" must never run.
export function csvCell(value: unknown): string {
  let text = value === null || value === undefined ? "" : String(value);
  const looksNumeric = /^[+-]?[\d\s().-]+$/.test(text); // a number or a phone number such as +91 98765 43210
  if (/^[=@\t\r]/.test(text) || (/^[+-]/.test(text) && !looksNumeric)) text = `'${text}`;
  if (/[",\n\r]/.test(text)) text = `"${text.replace(/"/g, '""')}"`;
  return text;
}

// With a byte-order mark so Excel opens Hindi and other non-English text correctly.
export function toCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers, ...rows].map((row) => row.map(csvCell).join(","));
  return `﻿${lines.join("\r\n")}\r\n`;
}
