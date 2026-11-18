import assert from "node:assert/strict";
import { describe, it } from "node:test";
import mongoose from "mongoose";
import { Attempt } from "../src/models/Attempt.js";
import { Progress } from "../src/models/Progress.js";
import { Student } from "../src/models/Student.js";

/* Schema validation runs without a database connection. */
describe("mongoose schemas", () => {
  const id = new mongoose.Types.ObjectId();

  it("accepts a complete submitted attempt with answers and tab-leave events", () => {
    const a = new Attempt({
      student: id,
      clientId: "run-1234-abcd",
      kind: "exam",
      testId: "n2024",
      title: "ეროვნული გამოცდა 2024",
      status: "submitted",
      startedAt: new Date(),
      answers: [{ n: 1, type: "choice", status: "correct", points: 1, maxPoints: 1 }],
      focus: { leaves: 1, awayMs: 3000, longestMs: 3000, events: [{ from: new Date(), to: new Date(), ms: 3000, type: "hidden", q: 1 }] },
    });
    assert.equal(a.validateSync(), undefined);
    assert.equal(a.sheets.status, "pending");
  });

  it("rejects unknown answer states and away types", () => {
    const a = new Attempt({
      student: id, clientId: "run-1", kind: "chapter", testId: "x", title: "x", startedAt: new Date(),
      answers: [{ n: 1, type: "choice", status: "maybe" }],
      focus: { events: [{ from: new Date(), to: new Date(), ms: 1, type: "teleported" }] },
    });
    const err = a.validateSync();
    assert.ok(err.errors["answers.0.status"]);
    assert.ok(err.errors["focus.events.0.type"]);
  });

  it("validates students and keeps activity days as a map", () => {
    const s = new Student({ firstName: "ანა", lastName: "ბერიძე", school: "სკოლა", grade: 13, key: "k" });
    assert.ok(s.validateSync().errors.grade);
    const ok = new Student({ firstName: "ანა", lastName: "ბერიძე", school: "სკოლა", grade: 9, key: "k" });
    ok.activity.days.set("2026-11-18", 60);
    assert.equal(ok.validateSync(), undefined);
    assert.equal(ok.toObject().activity.days.get("2026-11-18"), 60);
  });

  it("declares the indexes the data layer relies on", () => {
    const keys = (M) => M.schema.indexes().map(([k, o]) => JSON.stringify(k) + (o?.unique ? "!" : ""));
    assert.ok(keys(Attempt).includes('{"student":1,"clientId":1}!'));
    assert.ok(keys(Progress).includes('{"student":1,"problemId":1}!'));
    assert.ok(Student.schema.path("key").options.unique);
  });
});
