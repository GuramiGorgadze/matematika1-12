import { attemptStatsByStudent } from "../format.js";
import { createAppsScriptAdapter, createServiceAccountAdapter } from "./adapters.js";
import { answerRows, SHEETS, studentRow, testRow } from "./rows.js";

export function createAdapter(sheetsConfig) {
  if (sheetsConfig.mode === "service-account") return createServiceAccountAdapter(sheetsConfig);
  if (sheetsConfig.mode === "apps-script") return createAppsScriptAdapter({ url: sheetsConfig.webhookUrl, secret: sheetsConfig.webhookSecret });
  return null;
}

/**
 * Mirrors MongoDB into the spreadsheet. MongoDB stays the source of truth: every attempt and
 * student carries a sync flag, and this loop pushes whatever is pending in batches, so a Google
 * outage only delays the sheet — nothing is lost, and rows are upserted (never duplicated).
 */
export function createSheetsSync({ store, adapter, intervalMs = 60000, timezone = "Asia/Tbilisi", log = console }) {
  const state = { running: false, lastRunAt: null, lastOkAt: null, lastError: null, timer: null, kick: null };

  async function syncAttempts() {
    const pending = await store.attempts.listSheetsPending(25);
    if (!pending.length) return 0;
    const startedAt = new Date();
    /* a running test has no answers yet; its row is refreshed when it is submitted */
    const ops = [
      { name: SHEETS.tests.name, headers: SHEETS.tests.headers, rows: pending.map((a) => testRow(a, timezone)) },
      {
        name: SHEETS.answers.name,
        headers: SHEETS.answers.headers,
        rows: pending.filter((a) => a.status === "submitted").flatMap((a) => answerRows(a, timezone)),
      },
    ].filter((op) => op.rows.length);
    try {
      await adapter.upsertMany(ops);
      await Promise.all(pending.map((a) => store.attempts.setSheets(a.id, { status: "synced", startedAt })));
      return pending.length;
    } catch (e) {
      await Promise.all(pending.map((a) => store.attempts.setSheets(a.id, { status: "error", error: e.message })));
      throw e;
    }
  }

  async function syncStudents() {
    const dirty = await store.students.listDirty(300);
    if (!dirty.length) return 0;
    const startedAt = new Date();
    const ids = dirty.map((s) => s.id);
    const idSet = new Set(ids);
    const agg = attemptStatsByStudent((await store.attempts.summaries()).filter((a) => idSet.has(String(a.student))));
    try {
      await adapter.upsertMany([
        { name: SHEETS.students.name, headers: SHEETS.students.headers, rows: dirty.map((s) => studentRow(s, agg.get(s.id), timezone)) },
      ]);
      await store.students.markSheets(ids, { ok: true, startedAt });
      return dirty.length;
    } catch (e) {
      await store.students.markSheets(ids, { ok: false, error: e.message });
      throw e;
    }
  }

  async function run() {
    if (!adapter || state.running) return;
    state.running = true;
    state.lastRunAt = new Date();
    try {
      let n = 0;
      /* drain attempts first: they matter most to the teacher */
      for (let i = 0; i < 8; i++) {
        const k = await syncAttempts();
        n += k;
        if (k < 25) break;
      }
      n += await syncStudents();
      state.lastOkAt = new Date();
      state.lastError = null;
      if (n) log.info?.(`[sheets] synced ${n} row group(s)`);
    } catch (e) {
      state.lastError = { message: e.message, at: new Date() };
      log.warn?.(`[sheets] sync failed: ${e.message}`);
    } finally {
      state.running = false;
    }
  }

  return {
    enabled: !!adapter,
    mode: adapter ? adapter.mode : "off",
    run,
    /** run soon (debounced) — called after a test is saved */
    kick(delay = 1500) {
      if (!adapter) return;
      clearTimeout(state.kick);
      state.kick = setTimeout(run, delay);
      state.kick.unref?.();
    },
    start() {
      if (!adapter || state.timer) return;
      state.timer = setInterval(run, intervalMs);
      state.timer.unref?.();
      this.kick(3000);
    },
    stop() {
      clearInterval(state.timer);
      clearTimeout(state.kick);
      state.timer = null;
    },
    async resyncAll() {
      await store.attempts.markAllPending();
      await store.students.markAllDirty();
      this.kick(200);
    },
    status() {
      return { mode: adapter ? adapter.mode : "off", running: state.running, lastRunAt: state.lastRunAt, lastOkAt: state.lastOkAt, lastError: state.lastError };
    },
  };
}
