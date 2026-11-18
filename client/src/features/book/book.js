import { Box, Move, Shapes, Spline } from "lucide-react";
import { useCallback, useSyncExternalStore } from "react";
import { problemsOf } from "@/content/index.js";
import { useProgress } from "@/features/student/progress";
import { session } from "@/features/student/session";
import { storage } from "@/lib/storage";

export const TOOL_ICONS = { geo: Shapes, trig: Spline, vec: Move, "3d": Box };

/** solved / total problems of one lesson (`done` once every problem is solved) */
export function lessonStats(progress, lessonId) {
  const ps = problemsOf(lessonId);
  let solved = 0;
  for (const p of ps) if (progress.get(p.id)?.ok) solved++;
  return { solved, total: ps.length, done: ps.length > 0 && solved === ps.length };
}

/** solved / total over many lessons, re-rendering on progress changes */
export function useSolved(lessonIds) {
  const progress = useProgress();
  let solved = 0;
  let total = 0;
  for (const id of lessonIds) {
    const s = lessonStats(progress, id);
    solved += s.solved;
    total += s.total;
  }
  return { solved, total };
}

/* ---------- the last lesson a student opened ("continue where you left off") ---------- */
const subs = new Set();
const lastKey = () => `mx:last:${session.get().student?.id || "anon"}`;

export function rememberLesson(entry) {
  storage.set(lastKey(), { ...entry, at: Date.now() });
  subs.forEach((l) => l());
}

export function useLastLesson() {
  const subscribe = useCallback((l) => (subs.add(l), () => subs.delete(l)), []);
  const raw = useSyncExternalStore(subscribe, () => JSON.stringify(storage.get(lastKey(), null)));
  return raw ? JSON.parse(raw) : null;
}
