import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import request from "supertest";
import { createAppsScriptAdapter } from "../src/services/sheets/adapters.js";
import { ANA, buildApp } from "./helpers.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const CODE = fs.readFileSync(path.join(here, "../../google-apps-script/Code.gs"), "utf8");

/** a tiny in-memory stand-in for SpreadsheetApp, enough for Code.gs */
function fakeSpreadsheet() {
  const sheets = new Map();
  class Range {
    constructor(sh, r, c, nr = 1, nc = 1) {
      Object.assign(this, { sh, r, c, nr, nc });
    }
    getValues() {
      const out = [];
      for (let i = 0; i < this.nr; i++) {
        const row = this.sh.data[this.r - 1 + i] || [];
        out.push(Array.from({ length: this.nc }, (_, j) => row[this.c - 1 + j] ?? ""));
      }
      return out;
    }
    setValues(v) {
      assert.equal(v.length, this.nr, "row count must match the range");
      v.forEach((row, i) => {
        assert.equal(row.length, this.nc, "column count must match the range");
        const target = (this.sh.data[this.r - 1 + i] ||= []);
        row.forEach((x, j) => (target[this.c - 1 + j] = x));
      });
      this.sh.writes++;
      return this;
    }
    setFontWeight() {
      return this;
    }
  }
  class Sheet {
    constructor(name) {
      Object.assign(this, { name, data: [], frozen: 0, writes: 0 });
    }
    getName() {
      return this.name;
    }
    getLastRow() {
      return this.data.length;
    }
    getRange(r, c, nr, nc) {
      return new Range(this, r, c, nr, nc);
    }
    setFrozenRows(n) {
      this.frozen = n;
    }
  }
  const ss = {
    getName: () => "test",
    getSheets: () => [...sheets.values()],
    getSheetByName: (n) => sheets.get(n) || null,
    insertSheet: (n) => {
      const s = new Sheet(n);
      sheets.set(n, s);
      return s;
    },
  };
  return { ss, sheets };
}

function loadScript(secret = "s3cret") {
  const { ss, sheets } = fakeSpreadsheet();
  const ctx = {
    SpreadsheetApp: { getActiveSpreadsheet: () => ss },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    ContentService: {
      MimeType: { JSON: "application/json" },
      createTextOutput: (s) => ({ setMimeType() { return this; }, getContent: () => s }),
    },
  };
  vm.createContext(ctx);
  vm.runInContext(CODE.replace(/var SECRET = "[^"]*";/, `var SECRET = ${JSON.stringify(secret)};`), ctx);
  const post = (body) => JSON.parse(ctx.doPost({ postData: { contents: JSON.stringify(body) } }).getContent());
  return { post, sheets, ctx };
}

describe("Code.gs (Apps Script bridge)", () => {
  const op = (rows) => ({ name: "ტესტები", headers: ["ID", "ქულა", "შენიშვნა"], rows });

  it("creates the tab with headers, appends new keys and updates existing ones in place", () => {
    const { post, sheets } = loadScript();
    assert.deepEqual(post({ secret: "s3cret", action: "upsert", ops: [op([["a1", 5, "x"], ["a2", 7, "y"]])] }).ok, true);
    const sh = sheets.get("ტესტები");
    assert.deepEqual(sh.data[0], ["ID", "ქულა", "შენიშვნა"]);
    assert.equal(sh.frozen, 1);
    assert.equal(sh.data.length, 3);

    const r = post({ secret: "s3cret", action: "upsert", ops: [op([["a2", 9, "y2"], ["a3", 1, "z"], ["a2", 10, "last wins"]])] });
    assert.deepEqual(r.counts[0], { name: "ტესტები", updated: 1, added: 1 });
    assert.deepEqual(sh.data.slice(1), [["a1", 5, "x"], ["a2", 10, "last wins"], ["a3", 1, "z"]]);
  });

  it("stores formula-looking text as text and pads short rows", () => {
    const { post, sheets } = loadScript();
    post({ secret: "s3cret", action: "upsert", ops: [op([["b1", "=IMPORTXML(1)", "@x"], ["b2", -3]])] });
    const sh = sheets.get("ტესტები");
    assert.deepEqual(sh.data[1], ["b1", "'=IMPORTXML(1)", "'@x"]);
    assert.deepEqual(sh.data[2], ["b2", -3, ""]);
  });

  it("refuses a wrong secret", () => {
    const { post, sheets } = loadScript();
    const r = post({ secret: "nope", action: "upsert", ops: [op([["c1", 1, ""]])] });
    assert.equal(r.ok, false);
    assert.equal(sheets.size, 0);
  });
});

describe("server → Apps Script, end to end over HTTP", () => {
  it("a finished test lands in the three tabs and a re-sync does not duplicate rows", async () => {
    const script = loadScript("e2e-secret");
    /* local stand-in for script.google.com: same 302 → GET dance the real web app does */
    let last = null;
    const srv = http.createServer((req, res) => {
      let body = "";
      req.on("data", (c) => (body += c));
      req.on("end", () => {
        if (req.method === "POST") {
          last = JSON.stringify(script.post(JSON.parse(body)));
          res.writeHead(302, { Location: "/echo" }).end();
        } else res.writeHead(200, { "Content-Type": "application/json" }).end(last);
      });
    });
    await new Promise((r) => srv.listen(0, "127.0.0.1", r));
    const url = `http://127.0.0.1:${srv.address().port}/exec`;

    const { app, sheets } = buildApp({ adapter: createAppsScriptAdapter({ url, secret: "e2e-secret" }) });
    sheets.stop();
    const s = await request(app).post("/api/session").send(ANA);
    const auth = { Authorization: `Bearer ${s.body.token}` };
    const T = Date.UTC(2026, 10, 18, 9, 0, 0);
    await request(app)
      .put("/api/me/attempts/e2e-0001-abcdef")
      .set(auth)
      .send({
        status: "submitted", kind: "exam", testId: "n2025", title: "ეროვნული გამოცდა 2025", testGrade: 12, startedAt: T, finishedAt: T + 3600_000,
        answers: [
          { n: 1, type: "choice", prompt: "q1", given: "ა) 2", correct: "ა) 2", status: "correct", points: 1, maxPoints: 1 },
          { n: 2, type: "choice", prompt: "q2", given: "=1+1", correct: "ბ) 3", status: "wrong", points: 0, maxPoints: 1 },
        ],
        focus: { leaves: 2, awayMs: 65000, events: [{ from: T + 1000, to: T + 61000, ms: 60000, type: "hidden", q: 1 }, { from: T + 90000, to: T + 95000, ms: 5000, type: "blur", q: 2 }] },
      })
      .expect(201);
    await sheets.run();
    assert.equal(sheets.status().lastError, null);

    const tabs = script.sheets;
    assert.deepEqual([...tabs.keys()].sort(), ["ტესტები", "პასუხები", "მოსწავლეები"].sort());
    const tests = tabs.get("ტესტები").data;
    assert.equal(tests.length, 2);
    const h = tests[0];
    assert.equal(tests[1][h.indexOf("ჩანართიდან გასვლები")], 2);
    assert.equal(tests[1][h.indexOf("ჩანართს გარეთ (სულ)")], "1:05");
    assert.equal(tests[1][h.indexOf("ყველაზე ხანგრძლივი გასვლა")], "1:00");
    assert.equal(tabs.get("პასუხები").data.length, 3);
    assert.equal(tabs.get("პასუხები").data[2][9], "'=1+1", "student input is never a formula");
    assert.equal(tabs.get("მოსწავლეები").data[1][1], "ანა");

    /* self-scoring and a full resync update the same rows */
    await sheets.resyncAll();
    sheets.stop();
    await sheets.run();
    assert.equal(tabs.get("ტესტები").data.length, 2);
    assert.equal(tabs.get("პასუხები").data.length, 3);
    assert.equal(tabs.get("მოსწავლეები").data.length, 2);
    srv.close();
  });
});
