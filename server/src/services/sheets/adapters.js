import { sheets as sheetsApi } from "@googleapis/sheets";
import { JWT } from "google-auth-library";

/** A1 notation helpers */
const quote = (name) => `'${String(name).replace(/'/g, "''")}'`;
function colLetter(n) {
  let s = "";
  for (; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
  return s;
}
/** last row wins when the same key appears twice in one batch */
function dedupe(rows) {
  const m = new Map();
  for (const r of rows) m.set(String(r[0]), r);
  return [...m.values()];
}

/**
 * Google Sheets API with a service account. Share the spreadsheet with the service account's
 * e-mail (Editor). Tabs and header rows are created on first use.
 */
export function createServiceAccountAdapter({ sheetId, email, privateKey }) {
  const auth = new JWT({ email, key: privateKey, scopes: ["https://www.googleapis.com/auth/spreadsheets"] });
  const api = sheetsApi({ version: "v4", auth });
  const ready = new Set();

  async function ensure(name, headers) {
    if (ready.has(name)) return;
    const meta = await api.spreadsheets.get({ spreadsheetId: sheetId, fields: "sheets.properties.title" });
    const titles = (meta.data.sheets || []).map((s) => s.properties.title);
    if (!titles.includes(name)) {
      await api.spreadsheets.batchUpdate({
        spreadsheetId: sheetId,
        requestBody: { requests: [{ addSheet: { properties: { title: name, gridProperties: { frozenRowCount: 1 } } } }] },
      });
    }
    const head = await api.spreadsheets.values.get({ spreadsheetId: sheetId, range: `${quote(name)}!1:1` });
    const cur = head.data.values?.[0] || [];
    if (headers.some((h, i) => cur[i] !== h)) {
      await api.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: `${quote(name)}!A1`,
        valueInputOption: "RAW",
        requestBody: { values: [headers] },
      });
    }
    ready.add(name);
  }

  async function upsert({ name, headers, rows }) {
    if (!rows.length) return;
    await ensure(name, headers);
    const keys = await api.spreadsheets.values.get({ spreadsheetId: sheetId, range: `${quote(name)}!A2:A` });
    const at = new Map();
    (keys.data.values || []).forEach((r, i) => r[0] && at.set(String(r[0]), i + 2));
    const last = colLetter(headers.length);
    const updates = [];
    const appends = [];
    for (const row of dedupe(rows)) {
      const r = at.get(String(row[0]));
      if (r) updates.push({ range: `${quote(name)}!A${r}:${last}${r}`, values: [row] });
      else appends.push(row);
    }
    if (updates.length) {
      await api.spreadsheets.values.batchUpdate({ spreadsheetId: sheetId, requestBody: { valueInputOption: "RAW", data: updates } });
    }
    if (appends.length) {
      await api.spreadsheets.values.append({
        spreadsheetId: sheetId,
        range: `${quote(name)}!A1`,
        valueInputOption: "RAW",
        insertDataOption: "INSERT_ROWS",
        requestBody: { values: appends },
      });
    }
  }

  return {
    mode: "service-account",
    async upsertMany(ops) {
      for (const op of ops) await upsert(op);
    },
  };
}

/**
 * Apps Script web app (google-apps-script/Code.gs) bound to the spreadsheet. No Google Cloud
 * project needed: deploy the script as a web app and paste its URL into SHEETS_WEBHOOK_URL.
 */
export function createAppsScriptAdapter({ url, secret, fetchImpl = fetch }) {
  return {
    mode: "apps-script",
    async upsertMany(ops) {
      const body = JSON.stringify({ secret, action: "upsert", ops: ops.map((o) => ({ ...o, rows: dedupe(o.rows) })) });
      const res = await fetchImpl(url, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body,
        redirect: "follow",
        signal: AbortSignal.timeout(45000),
      });
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Apps Script answered HTTP ${res.status} without JSON — is the web app deployed with access "Anyone"?`);
      }
      if (!data.ok) throw new Error(data.error || "Apps Script reported an error");
      return data;
    },
  };
}

export const _internals = { colLetter, quote, dedupe };
