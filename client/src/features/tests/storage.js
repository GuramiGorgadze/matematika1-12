import { useCallback, useSyncExternalStore } from "react";
import { storage } from "@/lib/storage";
import { session } from "@/features/student/session";

/**
 * Local copy of a test: the running attempt (answers, timer, tab leaves) and the history of
 * finished attempts with full detail for the result screens. The server gets every save too
 * (see outbox.js); this copy makes the test survive reloads and work offline.
 */
const subs = new Set();
let ver = 0;
const bump = () => {
  ver++;
  subs.forEach((l) => l());
};

export const chapterTestKey = (grade, chapterId) => `mx:cht:${session.get().student?.id}:${grade}:${chapterId}`;
export const examKey = (examId) => `mx:exam:${session.get().student?.id}:${examId}`;

export function readTest(key) {
  const o = storage.get(key, null) || {};
  return { run: o.run || null, hist: Array.isArray(o.hist) ? o.hist : [] };
}
export function writeTest(key, st, { silent = false } = {}) {
  storage.set(key, st);
  if (!silent) bump();
}

/** subscribe a component to one test record */
export function useTestRecord(key) {
  const snap = useSyncExternalStore(
    useCallback((l) => (subs.add(l), () => subs.delete(l)), []),
    () => ver,
  );
  void snap;
  return readTest(key);
}

/** best result of a test, for cards ("best: 34 / 40") */
export function bestOf(hist) {
  let best = null;
  for (const a of hist) {
    const pct = a.max ? a.score / a.max : 0;
    if (!best || pct > best.pct) best = { pct, score: a.score, max: a.max };
  }
  return best;
}
