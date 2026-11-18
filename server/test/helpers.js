import { createApp } from "../src/app.js";
import { createMemoryStore } from "../src/data/memory.js";
import { createSheetsSync } from "../src/services/sheets/sync.js";

export function testConfig(over = {}) {
  return {
    env: "test",
    isProd: false,
    port: 0,
    trustProxy: false,
    db: { driver: "memory" },
    jwtSecret: "test-secret-test-secret-test-secret",
    teacherKey: "teacher-123",
    corsOrigins: null,
    clientDist: "/nonexistent",
    timezone: "Asia/Tbilisi",
    sheets: { mode: "off" },
    ...over,
  };
}

/** records every batch the sync engine would send to Google */
export function captureAdapter() {
  const calls = [];
  return {
    mode: "capture",
    calls,
    fail: false,
    async upsertMany(ops) {
      if (this.fail) throw new Error("Google is down");
      calls.push(structuredClone(ops));
    },
  };
}

export function buildApp({ adapter = captureAdapter(), config = testConfig() } = {}) {
  const store = createMemoryStore();
  const sheets = createSheetsSync({ store, adapter, intervalMs: 3600000, timezone: config.timezone, log: { info() {}, warn() {} } });
  const app = createApp({ config, store, sheets });
  return { app, store, sheets, adapter };
}

export const ANA = { firstName: "ანა", lastName: "ბერიძე", school: "თბილისის №1 საჯარო სკოლა", grade: 11 };
