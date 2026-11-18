import { useCallback, useEffect, useReducer, useRef } from "react";
import { toast } from "sonner";
import { clock } from "@/lib/format";
import { outbox } from "./outbox";
import { CLOSED_GAP_MS, createPresenceTracker, emptyFocus, focusSummary } from "./presence";
import { readTest, writeTest } from "./storage";

export const clientInfo = () => ({
  tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
  ua: navigator.userAgent.slice(0, 300),
});

/**
 * Shared plumbing of a timed test: the persisted record { run, hist }, the tab-presence tracker
 * while running, periodic "still running" pings to the server, and the auto-finish at time-out.
 *
 * buildPing(run) → the in-progress attempt body sent to the server.
 */
export function useRunRecord(key, { running, buildPing, getQ, onTimeUp }) {
  const rec = useRef(null);
  const recKey = useRef(null);
  if (recKey.current !== key) {
    rec.current = readTest(key);
    recKey.current = key;
  }
  const [, force] = useReducer((x) => x + 1, 0);
  const tracker = useRef(null);

  const commit = useCallback(
    (render = true) => {
      writeTest(key, rec.current, { silent: !render });
      if (render) force();
    },
    [key],
  );

  const ping = useCallback(() => {
    const run = rec.current.run;
    if (run) outbox.saveAttempt(run.clientId, buildPing(run));
  }, [buildPing]);

  /* tab-leave tracking + heartbeat while the test is running */
  const runId = running ? rec.current.run?.clientId : null;
  useEffect(() => {
    const run = rec.current.run;
    if (!runId || !run) return;
    const t = createPresenceTracker(run, {
      getQ,
      persist: () => commit(false),
      onReturn: (ev, f) => {
        force();
        toast.warning(`ტესტის ჩანართი დატოვე ${clock(ev.ms / 1000)}-ით`, {
          description: `ეს ფიქსირდება (სულ ${f.leaves}-ჯერ). დრო ამ ხნის განმავლობაშიც მიდიოდა.`,
        });
        ping();
      },
    });
    tracker.current = t;
    t.start();
    if (run.focus.leaves) force();
    const every = setInterval(ping, 60000);
    return () => {
      clearInterval(every);
      t.stop();
      tracker.current = null;
    };
  }, [runId, commit, getQ, ping]);

  /* time runs out (checked twice a second, and when the tab becomes visible again) */
  useEffect(() => {
    if (!runId) return;
    const check = () => {
      const run = rec.current.run;
      if (run && Date.now() >= run.end) onTimeUp();
    };
    const t = setInterval(check, 500);
    document.addEventListener("visibilitychange", check);
    return () => (clearInterval(t), document.removeEventListener("visibilitychange", check));
  }, [runId, onTimeUp]);

  /** close the open leave (if any) at `at` and return the focus summary for the result */
  const finishFocus = useCallback(
    (at) => {
      const run = rec.current.run;
      if (tracker.current) return tracker.current.finish(at);
      if (run && !run.focus) run.focus = emptyFocus();
      /* the test ran out while the page was closed: the gap since it was last seen counts */
      if (run && !run.focus.open && run.focus.lastSeen && at - run.focus.lastSeen > CLOSED_GAP_MS) {
        run.focus.open = { from: run.focus.lastSeen, type: "closed", q: getQ() };
      }
      if (run?.focus?.open) {
        const o = run.focus.open;
        const to = Math.max(o.from, at);
        run.focus.events.push({ from: o.from, to, ms: to - o.from, type: o.type, q: o.q });
        run.focus.leaves++;
        run.focus.awayMs += to - o.from;
        run.focus.longestMs = Math.max(run.focus.longestMs, to - o.from);
        run.focus.open = null;
      }
      return focusSummary(run?.focus);
    },
    [getQ],
  );

  return { rec: rec.current, commit, ping, finishFocus, force };
}
