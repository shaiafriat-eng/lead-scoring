import { splitCsvRows, parseCsvLine } from "./parse-csv-line.mjs";

/** @typedef {Record<string, string>} EventRow */

/**
 * @param {string} csvText
 * @returns {{ headers: string[], rows: EventRow[] }}
 */
export function parseEventsSheet(csvText) {
  const logical = splitCsvRows(csvText);
  if (!logical.length) return { headers: [], rows: [] };
  const headers = parseCsvLine(logical[0]).map((h) => h.trim().toUpperCase());
  const rows = logical.slice(1).map((line) => {
    const fields = parseCsvLine(line);
    /** @type {EventRow} */
    const row = {};
    headers.forEach((h, i) => {
      row[h] = (fields[i] ?? "").trim();
    });
    return row;
  });
  return { headers, rows };
}
