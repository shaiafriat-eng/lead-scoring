/**
 * Load a spreadsheet tab via the gviz endpoint (works when CSV export by name fails).
 * @param {string} spreadsheetId
 * @param {string} sheetName tab name
 * @returns {Promise<{ headers: string[], rows: Record<string, string>[] }>}
 */
export async function fetchGoogleSheetGviz(spreadsheetId, sheetName) {
  const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Google Sheet gviz failed (sheet=${sheetName}): ${res.status}`);
  }
  const body = await res.text();
  const match = body.match(/google\.visualization\.Query\.setResponse\((.*)\);?\s*$/s);
  if (!match) {
    throw new Error(`Google Sheet gviz parse failed (sheet=${sheetName})`);
  }
  const json = JSON.parse(match[1]);
  const headers = (json.table?.cols ?? []).map((c) => String(c.label ?? "").trim());
  const rows = (json.table?.rows ?? []).map((row) => {
    /** @type {Record<string, string>} */
    const record = {};
    headers.forEach((label, i) => {
      const cell = row.c?.[i];
      if (cell?.f != null && cell.f !== "") {
        record[label] = String(cell.f);
      } else if (cell?.v != null && cell.v !== "") {
        record[label] = String(cell.v);
      } else {
        record[label] = "";
      }
    });
    return record;
  });
  return { headers, rows };
}
