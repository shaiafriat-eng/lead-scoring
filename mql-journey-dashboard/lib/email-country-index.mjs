import fs from "node:fs/promises";
import path from "node:path";
import { parseCsvLine, splitCsvRows } from "./parse-csv-line.mjs";

function trim(v) {
  return (v ?? "").trim();
}

function setCountry(map, email, country) {
  const e = trim(email).toLowerCase();
  const c = trim(country);
  if (!e || !c || c === "(unknown)") return;
  if (!map.has(e)) map.set(e, c);
}

/**
 * Email → country from lead-calendar JSON and Chili Piper meeting exports.
 * Pre-MQL CSV has no geo columns; this is the best available join.
 */
export async function buildEmailCountryIndex(rootDir) {
  const map = new Map();

  try {
    const lcPath = path.join(rootDir, "public", "lead-calendar-data.json");
    const lc = JSON.parse(await fs.readFile(lcPath, "utf8"));
    for (const lead of lc.leads ?? []) {
      setCountry(map, lead.email, lead.country);
    }
  } catch {
    /* optional */
  }

  try {
    const meetingsPath = path.join(rootDir, "data", "chilipiper", "Meeting_new.csv");
    const text = await fs.readFile(meetingsPath, "utf8");
    const rows = splitCsvRows(text);
    if (rows.length < 2) return map;

    const headers = parseCsvLine(rows[0]).map((h) => trim(h));
    const idx = Object.fromEntries(headers.map((h, i) => [h, i]));
    const emailIdx = idx["Guest Email"] ?? idx.Email;
    const countryIdx = idx.Country ?? idx["CB Company Country"];
    const stateIdx = idx["CB Contact State"] ?? idx["CB company state"];

    for (let i = 1; i < rows.length; i++) {
      const fields = parseCsvLine(rows[i]);
      const email = fields[emailIdx];
      const country = fields[countryIdx] || fields[stateIdx];
      setCountry(map, email, country);
    }
  } catch {
    /* optional */
  }

  return map;
}

export function countryForEmail(index, email) {
  if (!email) return null;
  return index.get(String(email).trim().toLowerCase()) ?? null;
}
