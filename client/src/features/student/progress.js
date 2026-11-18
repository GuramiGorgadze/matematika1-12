import { useSyncExternalStore } from "react";
import { api } from "@/lib/api";
import { storage } from "@/lib/storage";
import { session } from "./session";

/**
 * Practice-problem progress, local first: every check is saved in the browser instantly and
 * pushed to the server a few seconds later (merged with $max on the server, so several devices
 * never overwrite each other). Entry shape (same as the original app): { n, ok, ft, seen, t }.
 */
let sid = null;
let prog = {};
let dirty = new Set();
let version = 0;
let timer = null;
const listeners = new Set();

const emit = () => {
  version++;
  listeners.forEach((l) => l());
};
const save = () => {
  if (!sid) return;
  storage.set(`mx:prog:${sid}`, prog);
  storage.set(`mx:progdirty:${sid}`, [...dirty]);
};

function load(studentId) {
  sid = studentId;
  prog = sid ? storage.get(`mx:prog:${sid}`, {}) : {};
  dirty = new Set(sid ? storage.get(`mx:progdirty:${sid}`, []) : []);
  emit();
}

async function stats() {
  const { CURR, PBYID, problemsOf } = await import("@/content/index.js");
  let solved = 0;
  let firstTry = 0;
  let tries = 0;
  let lessonsDone = 0;
  for (const [id, s] of Object.entries(prog)) {
    if (!PBYID[id]) continue;
    tries += s.n || 0;
    if (s.ok) {
      solved++;
      if (s.ft) firstTry++;
    }
  }
  for (const list of Object.values(CURR))
    for (const ch of list)
      if (!ch.soon)
        for (const l of ch.lessons) {
          const ps = problemsOf(l.id);
          if (ps.length && ps.every((p) => prog[p.id]?.ok)) lessonsDone++;
        }
  return { solved, firstTry, tries, lessonsDone };
}

export const progress = {
  subscribe(l) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  version: () => version,
  get: (pid) => prog[pid] || null,
  all: () => prog,

  mark(pid, patch) {
    if (!sid) return;
    prog = { ...prog, [pid]: { ...(prog[pid] || { n: 0 }), ...patch } };
    dirty.add(pid);
    save();
    emit();
    clearTimeout(timer);
    timer = setTimeout(() => this.sync().catch(() => {}), 4000);
  },

  reset() {
    prog = {};
    dirty = new Set();
    save();
    emit();
  },

  /** pull the server copy and merge it into the local one */
  async pull() {
    if (!sid) return;
    const { entries } = await api("/me/progress");
    const next = { ...prog };
    for (const e of entries) {
      const cur = next[e.problemId] || { n: 0 };
      next[e.problemId] = {
        n: Math.max(cur.n || 0, e.tries || 0),
        ok: cur.ok || e.solved ? 1 : 0,
        ft: cur.ft || e.firstTry ? 1 : 0,
        seen: cur.seen || e.seen ? 1 : 0,
        t: Math.max(cur.t || 0, e.lastAt ? +new Date(e.lastAt) : 0) || undefined,
      };
    }
    prog = next;
    save();
    emit();
  },

  async sync() {
    if (!sid || !dirty.size) return;
    const ids = [...dirty].slice(0, 2500);
    const entries = ids.map((pid) => {
      const p = prog[pid] || {};
      return { problemId: pid, lessonId: pid.split(":")[0], tries: p.n || 0, solved: !!p.ok, firstTry: !!p.ft, seen: !!p.seen, lastAt: p.t || undefined };
    });
    await api("/me/progress", { method: "PUT", body: { entries, stats: await stats() } });
    ids.forEach((id) => dirty.delete(id));
    save();
    if (dirty.size) this.sync().catch(() => {});
  },
};

session.subscribe(() => {
  const id = session.get().student?.id || null;
  if (id !== sid) load(id);
});
load(session.get().student?.id || null);
session.onLogin(() => {
  progress.pull().catch(() => {});
  progress.sync().catch(() => {});
});
if (typeof window !== "undefined") {
  window.addEventListener("online", () => progress.sync().catch(() => {}));
  document.addEventListener("visibilitychange", () => document.visibilityState === "hidden" && progress.sync().catch(() => {}));
}

/** re-render when any progress changes; returns the store */
export function useProgress() {
  useSyncExternalStore(progress.subscribe, progress.version);
  return progress;
}
