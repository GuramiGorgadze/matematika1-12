/**
 * Records every time a student leaves a running test and for how long.
 *
 *   hidden  — the tab was hidden (switched tab, minimised the browser, switched app on a phone)
 *   blur    — the page stayed visible but the window lost focus (another window in front)
 *   closed  — the page was closed or reloaded, or the device slept, while the test kept running
 *
 * The state lives inside the test run (persisted with it), so leaves are counted across reloads:
 * when a closed test is reopened, the gap since the page was last seen is recorded as "closed".
 *
 * focus = { leaves, awayMs, longestMs, events: [{ from, to, ms, type, q }], open, lastSeen }
 */
export const MIN_AWAY_MS = 400; /* shorter flickers (e.g. a system dialog blinking) are ignored */
export const CLOSED_GAP_MS = 15000; /* heartbeat gap that means the page was not running */
const HEARTBEAT_MS = 5000;

export function emptyFocus() {
  return { leaves: 0, awayMs: 0, longestMs: 0, events: [], open: null, lastSeen: null };
}

export function focusSummary(f) {
  const { leaves = 0, awayMs = 0, longestMs = 0, events = [] } = f || {};
  return { leaves, awayMs, longestMs, events: events.map(({ from, to, ms, type, q }) => ({ from, to, ms, type, q })) };
}

/**
 * @param run      the persisted run object; run.focus is created if missing; run.end caps gaps
 * @param getQ     () => current question number (1-based) for the record
 * @param persist  (urgent) => void — save the run (called synchronously on page hide)
 * @param onReturn (event, focus) => void — the student came back
 */
export function createPresenceTracker(run, { getQ, persist, onReturn, now = () => Date.now(), doc = document, win = window }) {
  const f = (run.focus ||= emptyFocus());
  let hb = null;
  let blurTimer = null;

  const isAway = () => doc.visibilityState === "hidden" || !doc.hasFocus();
  const cap = (t) => (run.end ? Math.min(t, run.end) : t);

  function open(type) {
    if (f.open) {
      if (type === "hidden" && f.open.type === "blur") f.open.type = "hidden";
      return;
    }
    f.open = { from: now(), type, q: getQ() };
    persist(false);
  }

  function close(at, notify = true) {
    if (!f.open) return null;
    const to = Math.max(f.open.from, cap(at));
    const ev = { from: f.open.from, to, ms: to - f.open.from, type: f.open.type, q: f.open.q };
    f.open = null;
    f.lastSeen = at;
    if (ev.ms >= MIN_AWAY_MS) {
      f.events.push(ev);
      f.leaves += 1;
      f.awayMs += ev.ms;
      f.longestMs = Math.max(f.longestMs, ev.ms);
      persist(false);
      if (notify) onReturn?.(ev, f);
      return ev;
    }
    persist(false);
    return null;
  }

  const onVisibility = () => {
    if (doc.visibilityState === "hidden") open("hidden");
    else if (doc.hasFocus()) close(now());
  };
  const onBlur = () => {
    /* let a focus change inside the page settle first */
    clearTimeout(blurTimer);
    blurTimer = setTimeout(() => {
      if (!doc.hasFocus()) open(doc.visibilityState === "hidden" ? "hidden" : "blur");
    }, 50);
  };
  const onFocus = () => {
    clearTimeout(blurTimer);
    if (doc.visibilityState === "visible") close(now());
  };
  const onPageHide = () => {
    if (!f.open) f.open = { from: now(), type: "closed", q: getQ() };
    else if (f.open.type === "blur") f.open.type = "closed";
    f.lastSeen = now();
    persist(true);
  };
  const beat = () => {
    if (!f.open && !isAway()) {
      f.lastSeen = now();
      persist(false);
    }
  };

  return {
    focus: f,
    start() {
      const t = now();
      /* reopened after the page was closed or the browser was killed */
      if (f.open) close(t);
      else if (f.lastSeen && t - f.lastSeen > CLOSED_GAP_MS) {
        f.open = { from: f.lastSeen, type: "closed", q: getQ() };
        close(t);
      }
      f.lastSeen = t;
      persist(false);
      doc.addEventListener("visibilitychange", onVisibility);
      win.addEventListener("blur", onBlur);
      win.addEventListener("focus", onFocus);
      win.addEventListener("pagehide", onPageHide);
      hb = setInterval(beat, HEARTBEAT_MS);
      if (isAway()) open(doc.visibilityState === "hidden" ? "hidden" : "blur");
    },
    stop() {
      clearInterval(hb);
      clearTimeout(blurTimer);
      doc.removeEventListener("visibilitychange", onVisibility);
      win.removeEventListener("blur", onBlur);
      win.removeEventListener("focus", onFocus);
      win.removeEventListener("pagehide", onPageHide);
    },
    /** close any open leave at the moment the test ended and return the summary */
    finish(at) {
      close(at, false);
      return focusSummary(f);
    },
  };
}
