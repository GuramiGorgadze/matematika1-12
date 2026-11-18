/**
 * მათემატიკა → Google Sheets bridge (Apps Script web app).
 *
 * The Node server POSTs batches of rows here; each row is inserted or updated in place by the
 * key in column A, so re-sent data never duplicates rows. Tabs and header rows are created
 * automatically: მოსწავლეები (students), ტესტები (tests), პასუხები (answers).
 *
 * Setup (once):
 *   1. Create a Google Sheet → Extensions → Apps Script → replace Code.gs with this file.
 *   2. Put a long random value in SECRET below (the same value goes into SHEETS_WEBHOOK_SECRET).
 *   3. Deploy → New deployment → Web app → Execute as: Me, Who has access: Anyone → Deploy.
 *   4. Copy the web app URL (…/exec) into SHEETS_WEBHOOK_URL and set SHEETS_MODE=apps-script.
 *   After editing this file, use Deploy → Manage deployments → Edit → New version.
 */
var SECRET = "change-me-to-the-same-value-as-SHEETS_WEBHOOK_SECRET";

function doPost(e) {
  var out;
  try {
    var body = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    if (SECRET && body.secret !== SECRET) throw new Error("Wrong secret");
    if (body.action !== "upsert" || !Array.isArray(body.ops)) throw new Error("Unknown action");

    var lock = LockService.getScriptLock();
    lock.waitLock(30000);
    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var counts = body.ops.map(function (op) { return upsert_(ss, op); });
      out = { ok: true, counts: counts };
    } finally {
      lock.releaseLock();
    }
  } catch (err) {
    out = { ok: false, error: String((err && err.message) || err) };
  }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

/** health check: open the web app URL in a browser */
function doGet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var tabs = ss.getSheets().map(function (s) { return s.getName(); });
  return ContentService.createTextOutput(JSON.stringify({ ok: true, spreadsheet: ss.getName(), tabs: tabs })).setMimeType(ContentService.MimeType.JSON);
}

function upsert_(ss, op) {
  var name = String(op.name || "").slice(0, 90);
  var headers = op.headers || [];
  var rows = (op.rows || []).map(function (r) { return r.map(safe_); });
  if (!name || !rows.length) return { name: name, updated: 0, added: 0 };

  var sh = ss.getSheetByName(name) || ss.insertSheet(name);
  var width = Math.max(headers.length, rows[0].length);
  ensureHeaders_(sh, headers);

  /* row number of every existing key */
  var last = sh.getLastRow();
  var at = {};
  if (last >= 2) {
    var keys = sh.getRange(2, 1, last - 1, 1).getValues();
    for (var i = 0; i < keys.length; i++) if (keys[i][0] !== "") at[String(keys[i][0])] = i + 2;
  }

  var updates = [];
  var adds = [];
  var seen = {};
  for (var j = rows.length - 1; j >= 0; j--) {
    /* last occurrence of a key in the batch wins */
    var key = String(rows[j][0]);
    if (seen[key]) continue;
    seen[key] = true;
    var row = pad_(rows[j], width);
    if (at[key]) updates.push({ r: at[key], v: row });
    else adds.unshift(row);
  }

  /* write updates in contiguous blocks to keep the number of calls low */
  updates.sort(function (a, b) { return a.r - b.r; });
  for (var k = 0; k < updates.length; ) {
    var start = updates[k].r, block = [updates[k].v];
    while (k + block.length < updates.length && updates[k + block.length].r === start + block.length) block.push(updates[k + block.length].v);
    sh.getRange(start, 1, block.length, width).setValues(block);
    k += block.length;
  }
  if (adds.length) sh.getRange(sh.getLastRow() + 1, 1, adds.length, width).setValues(adds);
  return { name: name, updated: updates.length, added: adds.length };
}

function ensureHeaders_(sh, headers) {
  if (!headers.length) return;
  var cur = sh.getRange(1, 1, 1, headers.length).getValues()[0];
  var same = true;
  for (var i = 0; i < headers.length; i++) if (cur[i] !== headers[i]) { same = false; break; }
  if (!same) {
    sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold");
    sh.setFrozenRows(1);
  }
}

/** strings that look like formulas are stored as text */
function safe_(v) {
  if (v === null || v === undefined) return "";
  if (typeof v === "string" && /^[=+\-@]/.test(v)) return "'" + v;
  return v;
}

function pad_(row, width) {
  var r = row.slice(0, width);
  while (r.length < width) r.push("");
  return r;
}
