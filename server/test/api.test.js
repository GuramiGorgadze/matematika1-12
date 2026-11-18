import assert from "node:assert/strict";
import { describe, it } from "node:test";
import request from "supertest";
import { ANA, buildApp } from "./helpers.js";

async function signIn(app, details = ANA) {
  const res = await request(app).post("/api/session").send(details);
  return { res, token: res.body.token, auth: { Authorization: `Bearer ${res.body.token}` } };
}

const T0 = Date.UTC(2026, 10, 18, 10, 0, 0);

function examPayload(status, extra = {}) {
  return {
    status,
    kind: "chapter",
    testId: "11:t1",
    title: "თავი I. ტრიგონომეტრია — შემაჯამებელი ტესტი",
    testGrade: 11,
    chapterId: "t1",
    startedAt: T0,
    timeLimitSec: 1800,
    questionCount: 3,
    ...extra,
  };
}

const ANSWERS = [
  { n: 1, qid: "c1s1:abc", type: "choice", prompt: "იპოვე $\\sin 30^\\circ$", given: "ბ) 1/2", correct: "ბ) 1/2", status: "correct", points: 1, maxPoints: 1 },
  { n: 2, qid: "c1s2:def", type: "written", prompt: "გამოთვალე $2+2$", given: "5", correct: "4", status: "wrong", points: 0, maxPoints: 1 },
  { n: 3, qid: "c1s3:ghi", type: "written", prompt: "ამოხსენი", given: null, correct: "3", status: "unanswered", points: 0, maxPoints: 1 },
];

describe("student session", () => {
  it("registers once and signs back in with the same details", async () => {
    const { app } = buildApp();
    const a = await signIn(app);
    assert.equal(a.res.status, 201);
    assert.ok(a.token);
    assert.equal(a.res.body.student.firstName, "ანა");
    assert.equal(a.res.body.student.key, undefined, "identity key is not exposed");

    const b = await signIn(app, { ...ANA, firstName: "  ანა ", school: "თბილისის  №1 საჯარო სკოლა" });
    assert.equal(b.res.status, 200);
    assert.equal(b.res.body.student.id, a.res.body.student.id);
  });

  it("validates the registration form", async () => {
    const { app } = buildApp();
    const res = await request(app).post("/api/session").send({ firstName: "ა", lastName: "ბ", school: "", grade: 13 });
    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, "bad_request");
  });

  it("rejects profile changes that collide with another student", async () => {
    const { app } = buildApp();
    await signIn(app, { ...ANA, firstName: "გიორგი" });
    const { auth } = await signIn(app);
    const res = await request(app).patch("/api/me").set(auth).send({ ...ANA, firstName: "გიორგი" });
    assert.equal(res.status, 409);
  });

  it("requires a token for /me", async () => {
    const { app } = buildApp();
    assert.equal((await request(app).get("/api/me")).status, 401);
    assert.equal((await request(app).get("/api/me").set({ Authorization: "Bearer nope" })).status, 401);
  });
});

describe("activity and practice progress", () => {
  it("adds up visits and active seconds per day", async () => {
    const { app } = buildApp();
    const { auth } = await signIn(app);
    await request(app).post("/api/me/activity").set(auth).send({ seconds: 30, day: "2026-11-18", visit: true }).expect(200);
    const r = await request(app).post("/api/me/activity").set(auth).send({ seconds: 45, day: "2026-11-18" }).expect(200);
    assert.equal(r.body.activity.visits, 1);
    assert.equal(r.body.activity.seconds, 75);
    assert.equal(r.body.activity.days["2026-11-18"], 75);
    await request(app).post("/api/me/activity").set(auth).send({ seconds: 99999, day: "2026-11-18" }).expect(400);
  });

  it("merges progress from two devices without losing anything", async () => {
    const { app } = buildApp();
    const { auth } = await signIn(app);
    const e = (o) => ({ problemId: "g7c3s1:x1", lessonId: "g7c3s1", tries: 0, solved: false, firstTry: false, seen: false, ...o });
    await request(app).put("/api/me/progress").set(auth).send({ entries: [e({ tries: 3, solved: true })], stats: { solved: 1, firstTry: 0, tries: 3, lessonsDone: 0 } }).expect(200);
    await request(app).put("/api/me/progress").set(auth).send({ entries: [e({ tries: 1, seen: true })] }).expect(200);
    const r = await request(app).get("/api/me/progress").set(auth).expect(200);
    assert.equal(r.body.entries.length, 1);
    assert.deepEqual({ ...r.body.entries[0], lastAt: undefined }, { ...e({ tries: 3, solved: true, seen: true }), lastAt: undefined });
    const me = await request(app).get("/api/me").set(auth);
    assert.equal(me.body.student.stats.solved, 1);
  });
});

describe("test attempts", () => {
  it("saves start, tab-leave pings and the final result with per-question correctness", async () => {
    const { app, store } = buildApp();
    const { auth } = await signIn(app);
    const url = "/api/me/attempts/run-0001-abcdef";

    const start = await request(app).put(url).set(auth).send(examPayload("in_progress"));
    assert.equal(start.status, 201);
    assert.equal(start.body.attempt.status, "in_progress");

    const focus = {
      leaves: 2,
      awayMs: 47000,
      events: [
        { from: T0 + 60000, to: T0 + 105000, ms: 45000, type: "hidden", q: 2 },
        { from: T0 + 200000, to: T0 + 202000, ms: 2000, type: "blur", q: 3 },
      ],
    };
    const ping = await request(app).put(url).set(auth).send(examPayload("in_progress", { answeredCount: 2, focus }));
    assert.equal(ping.status, 200);
    assert.equal(ping.body.attempt.focus.leaves, 2);
    assert.equal(ping.body.attempt.focus.longestMs, 45000);

    const done = await request(app)
      .put(url)
      .set(auth)
      .send(examPayload("submitted", { finishedAt: T0 + 600000, durationSec: 600, answers: ANSWERS, focus }));
    assert.equal(done.status, 200);
    const a = done.body.attempt;
    assert.equal(a.status, "submitted");
    assert.equal(a.score, 1);
    assert.equal(a.maxScore, 3);
    assert.equal(a.percent, 33.3);
    assert.deepEqual(a.counts, { correct: 1, wrong: 1, unanswered: 1, partial: 0, pending: 0 });
    assert.equal(a.answers, undefined, "list responses omit answers");

    /* a stale ping from another tab cannot reopen it */
    const late = await request(app).put(url).set(auth).send(examPayload("in_progress"));
    assert.equal(late.body.attempt.status, "submitted");

    const full = await request(app).get(url).set(auth).expect(200);
    assert.equal(full.body.attempt.answers[1].status, "wrong");
    assert.equal(full.body.attempt.focus.events.length, 2);

    const saved = (await store.attempts.summaries())[0];
    assert.equal(saved.focus.awayMs, 47000);
  });

  it("re-scores open questions graded by the student", async () => {
    const { app } = buildApp();
    const { auth } = await signIn(app);
    const url = "/api/me/attempts/run-0002-abcdef";
    const answers = [
      { n: 38, type: "written", prompt: "ღია ამოცანა", given: "x=2", correct: "x=2", status: "pending", points: 0, maxPoints: 4 },
      { n: 1, type: "choice", prompt: "a", given: "ა) 1", correct: "ა) 1", status: "correct", points: 1, maxPoints: 1 },
    ];
    await request(app).put(url).set(auth).send({ ...examPayload("submitted", { kind: "exam", testId: "n2024", answers }) }).expect(201);
    const r = await request(app).patch(`${url}/self-score`).set(auth).send({ scores: { 38: 3 } }).expect(200);
    assert.equal(r.body.attempt.score, 4);
    assert.equal(r.body.attempt.counts.partial, 1);
    assert.equal(r.body.attempt.counts.pending, 0);
  });

  it("rejects malformed attempts", async () => {
    const { app } = buildApp();
    const { auth } = await signIn(app);
    await request(app).put("/api/me/attempts/x").set(auth).send(examPayload("in_progress")).expect(400);
    await request(app).put("/api/me/attempts/run-0003-abcdef").set(auth).send(examPayload("submitted")).expect(400);
  });
});

describe("teacher dashboard", () => {
  async function seeded() {
    const ctx = buildApp();
    const { auth } = await signIn(ctx.app);
    await request(ctx.app)
      .put("/api/me/attempts/run-0100-abcdef")
      .set(auth)
      .send(
        examPayload("submitted", {
          answers: ANSWERS,
          finishedAt: Date.now(),
          focus: { leaves: 1, awayMs: 12000, events: [{ from: Date.now() - 20000, to: Date.now() - 8000, ms: 12000, type: "hidden", q: 2 }] },
        }),
      );
    const t = await request(ctx.app).post("/api/teacher/session").send({ key: "teacher-123" });
    return { ...ctx, teacher: { Authorization: `Bearer ${t.body.token}` } };
  }

  it("needs the teacher key", async () => {
    const { app } = buildApp();
    assert.equal((await request(app).post("/api/teacher/session").send({ key: "wrong" })).status, 401);
    const { auth } = await signIn(app);
    assert.equal((await request(app).get("/api/teacher/overview").set(auth)).status, 403);
  });

  it("shows totals, students with test stats, attempt details and CSV exports", async () => {
    const { app, teacher } = await seeded();
    const ov = await request(app).get("/api/teacher/overview").set(teacher).expect(200);
    assert.equal(ov.body.totals.students, 1);
    assert.equal(ov.body.totals.tests, 1);
    assert.equal(ov.body.totals.leaves, 1);
    assert.equal(ov.body.days.length, 14);

    const st = await request(app).get("/api/teacher/students").set(teacher).expect(200);
    assert.equal(st.body.items[0].tests, 1);
    assert.equal(st.body.items[0].leaves, 1);
    assert.equal(st.body.items[0].bestPercent, 33.3);

    const list = await request(app).get("/api/teacher/attempts?grade=11").set(teacher).expect(200);
    assert.equal(list.body.total, 1);
    const one = await request(app).get(`/api/teacher/attempts/${list.body.items[0].id}`).set(teacher).expect(200);
    assert.equal(one.body.attempt.answers.length, 3);
    assert.equal(one.body.attempt.focus.events[0].type, "hidden");

    const csv = await request(app).get("/api/teacher/export/attempts.csv").set(teacher).expect(200);
    assert.ok(csv.text.startsWith("﻿"));
    assert.match(csv.text, /ტრიგონომეტრია/);
    assert.match(csv.text, /სხვა ჩანართი ან აპი/);
  });
});

describe("google sheets mirror", () => {
  it("pushes tests, answers and students once, then upserts changes in place", async () => {
    const { app, sheets, adapter } = buildApp();
    const { auth } = await signIn(app);
    await request(app)
      .put("/api/me/attempts/run-0200-abcdef")
      .set(auth)
      .send(examPayload("submitted", { answers: ANSWERS, finishedAt: T0 + 300000, focus: { leaves: 1, awayMs: 9000, events: [{ from: T0 + 1000, to: T0 + 10000, ms: 9000, type: "blur", q: 1 }] } }));
    sheets.stop();
    await sheets.run();

    const names = adapter.calls.flat().map((op) => op.name);
    assert.deepEqual(names.sort(), ["ტესტები", "პასუხები", "მოსწავლეები"].sort());
    const tests = adapter.calls.flat().find((op) => op.name === "ტესტები");
    const row = Object.fromEntries(tests.headers.map((h, i) => [h, tests.rows[0][i]]));
    assert.equal(row["სტატუსი"], "დასრულებული");
    assert.equal(row["%"], 33.3);
    assert.equal(row["ჩანართიდან გასვლები"], 1);
    assert.equal(row["ჩანართს გარეთ (სულ)"], "0:09");
    assert.match(row["გასვლების დეტალები"], /14:00:01 · 0:09 · ამოცანა №1 · ფანჯარა არააქტიური/);
    assert.equal(row["სწორი ამოცანები"], "1");
    assert.equal(row["არასწორი ამოცანები"], "2");
    const answers = adapter.calls.flat().find((op) => op.name === "პასუხები");
    assert.equal(answers.rows.length, 3);
    assert.equal(answers.rows[1][11], "არასწორი");

    /* nothing pending → nothing sent */
    adapter.calls.length = 0;
    await sheets.run();
    assert.equal(adapter.calls.length, 0);
  });

  it("keeps rows pending while Google is unreachable and retries later", async () => {
    const { app, sheets, adapter, store } = buildApp();
    const { auth } = await signIn(app);
    await request(app).put("/api/me/attempts/run-0300-abcdef").set(auth).send(examPayload("in_progress"));
    sheets.stop();
    adapter.fail = true;
    await sheets.run();
    assert.equal(sheets.status().lastError.message, "Google is down");
    assert.equal((await store.attempts.listSheetsPending()).length, 1);
    adapter.fail = false;
    await sheets.run();
    assert.equal((await store.attempts.listSheetsPending()).length, 0);
  });
});
