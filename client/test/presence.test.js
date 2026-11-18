import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CLOSED_GAP_MS, createPresenceTracker } from "../src/features/tests/presence.js";

/** a fake document/window pair whose visibility and focus the test controls */
function env() {
  const handlers = { doc: {}, win: {} };
  const state = { visible: true, focused: true, t: 1_000_000 };
  const on = (bag) => ({
    addEventListener: (n, fn) => ((bag[n] ||= []).push(fn)),
    removeEventListener: (n, fn) => (bag[n] = (bag[n] || []).filter((x) => x !== fn)),
  });
  const doc = { ...on(handlers.doc), get visibilityState() { return state.visible ? "visible" : "hidden"; }, hasFocus: () => state.focused };
  const win = on(handlers.win);
  const fire = (bag, n) => (bag[n] || []).forEach((fn) => fn());
  return {
    doc, win, state,
    now: () => state.t,
    tick: (ms) => (state.t += ms),
    hide() { state.visible = false; state.focused = false; fire(handlers.doc, "visibilitychange"); fire(handlers.win, "blur"); },
    show() { state.visible = true; state.focused = true; fire(handlers.doc, "visibilitychange"); fire(handlers.win, "focus"); },
    blur() { state.focused = false; fire(handlers.win, "blur"); },
    focus() { state.focused = true; fire(handlers.win, "focus"); },
    pagehide: () => fire(handlers.win, "pagehide"),
  };
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

describe("presence tracker", () => {
  it("counts a hidden tab with its duration and question", () => {
    const e = env();
    const run = { end: e.now() + 3600_000 };
    const returns = [];
    let q = 3;
    const t = createPresenceTracker(run, { getQ: () => q, persist() {}, onReturn: (ev) => returns.push(ev), now: e.now, doc: e.doc, win: e.win });
    t.start();
    e.tick(10_000);
    e.hide();
    e.tick(45_000);
    q = 4;
    e.show();
    const s = t.finish(e.now());
    assert.equal(s.leaves, 1);
    assert.equal(s.awayMs, 45_000);
    assert.equal(s.events[0].type, "hidden");
    assert.equal(s.events[0].q, 3, "records the question the student left from");
    assert.equal(returns.length, 1);
    t.stop();
  });

  it("records an unfocused window as blur, ignores flickers", async () => {
    const e = env();
    const run = {};
    const t = createPresenceTracker(run, { getQ: () => 1, persist() {}, now: e.now, doc: e.doc, win: e.win });
    t.start();
    e.blur();
    await wait(60);
    e.tick(8_000);
    e.focus();
    e.blur();
    await wait(60);
    e.tick(100); /* flicker */
    e.focus();
    const s = t.finish(e.now());
    assert.equal(s.leaves, 1);
    assert.equal(s.events[0].type, "blur");
    assert.equal(s.events[0].ms, 8_000);
    t.stop();
  });

  it("keeps counting across a closed page and caps the gap at the end of the test", () => {
    const e = env();
    const run = { end: e.now() + 600_000 };
    const saved = [];
    const t1 = createPresenceTracker(run, { getQ: () => 7, persist: (urgent) => saved.push(urgent), now: e.now, doc: e.doc, win: e.win });
    t1.start();
    e.tick(5_000);
    e.pagehide();
    t1.stop();
    assert.equal(saved.at(-1), true, "page hide saves synchronously");
    assert.equal(run.focus.open.type, "closed");

    e.tick(120_000); /* page closed for two minutes */
    const t2 = createPresenceTracker(run, { getQ: () => 7, persist() {}, now: e.now, doc: e.doc, win: e.win });
    t2.start();
    assert.equal(run.focus.leaves, 1);
    assert.equal(run.focus.events[0].ms, 120_000);
    assert.equal(run.focus.events[0].type, "closed");

    /* browser killed without pagehide: the heartbeat gap counts, but not past the deadline */
    t2.stop();
    e.tick(10_000_000);
    const t3 = createPresenceTracker(run, { getQ: () => 7, persist() {}, now: e.now, doc: e.doc, win: e.win });
    t3.start();
    assert.equal(run.focus.leaves, 2);
    assert.ok(run.focus.events[1].to <= run.end, "gap capped at the end of the test");
    assert.ok(run.focus.events[1].ms > CLOSED_GAP_MS);
    t3.stop();
  });
});
