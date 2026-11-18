import { api } from "@/lib/api";
import { dayKey } from "@/lib/format";
import { storage } from "@/lib/storage";
import { session } from "./session";

/**
 * Time on site and visits (as in the original app): only visible, non-idle time counts.
 * A new visit starts after 30 minutes without activity. Seconds are sent once a minute and
 * when the tab is hidden; offline seconds are kept and sent later.
 */
const TICK = 15000;
const IDLE = 60000;
const GAP = 30 * 60 * 1000;
const FLUSH = 60000;

let started = false;
let lastInput = Date.now();
let lastTick = Date.now();
let sending = false;

const key = () => `mx:act:${session.get().student?.id}`;
const read = () => storage.get(key(), { seconds: 0, day: dayKey(), visit: false, lastActive: 0 });
const write = (s) => storage.set(key(), s);

function touch() {
  if (!session.get().student) return;
  const now = Date.now();
  lastInput = now;
  const s = read();
  if (!s.lastActive || now - s.lastActive > GAP) s.visit = true;
  s.lastActive = now;
  write(s);
}

/** add the visible, non-idle time since the last tick; `force` counts up to a hide/unload */
function tick(force = false) {
  const now = Date.now();
  const dt = Math.min(now - lastTick, 30000);
  lastTick = now;
  if (!session.get().student || now - lastInput > IDLE) return;
  if (!force && document.visibilityState !== "visible") return;
  const s = read();
  const today = dayKey(now);
  if (s.day !== today && s.seconds) {
    flush(true); /* yesterday's seconds go out first */
    return;
  }
  s.day = today;
  s.seconds += Math.round(dt / 1000);
  s.lastActive = now;
  write(s);
}

/**
 * Counters are cleared before sending (and restored if the request fails): a send that fires
 * while the page unloads can never be counted twice by the next page.
 */
async function flush(keepalive = false) {
  if (sending || !session.get().student) return;
  const s = read();
  if (!s.seconds && !s.visit) return;
  sending = true;
  const body = { seconds: Math.min(3600, s.seconds), day: s.day, visit: !!s.visit };
  const rest = s.seconds - body.seconds;
  write({ ...s, seconds: rest, visit: false, day: rest > 0 ? s.day : dayKey() });
  try {
    await api("/me/activity", { method: "POST", body, keepalive });
  } catch {
    /* offline: put the seconds back for the next try */
    const cur = read();
    write({ ...cur, seconds: cur.seconds + body.seconds, visit: cur.visit || body.visit, day: body.day });
  } finally {
    sending = false;
  }
}

export function startActivityTracking() {
  if (started || typeof window === "undefined") return;
  started = true;
  for (const ev of ["pointerdown", "keydown", "scroll", "touchstart"]) window.addEventListener(ev, touch, { passive: true, capture: true });
  setInterval(tick, TICK);
  setInterval(() => document.visibilityState === "visible" && flush(), FLUSH);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      tick(true);
      flush(true);
    } else {
      lastTick = Date.now();
      touch();
    }
  });
  window.addEventListener("pagehide", () => {
    tick(true);
    flush(true);
  });
  session.onLogin(() => {
    touch();
    setTimeout(() => flush(), 3000);
  });
}
