import { useSyncExternalStore } from "react";
import { api } from "@/lib/api";
import { storage } from "@/lib/storage";
import { session } from "@/features/student/session";

/**
 * Every test save goes through this outbox: it is written to the browser first and then sent
 * to the server, retrying until it lands (offline, server restart, closed laptop…). For one
 * test only the latest state matters, so a newer save replaces an unsent older one.
 */
let version = 0;
let flushing = false;
let retry = null;
const listeners = new Set();
const emit = () => {
  version++;
  listeners.forEach((l) => l());
};

const key = () => `mx:outbox:${session.get().student?.id}`;
const read = () => storage.get(key(), {});
const write = (o) => {
  storage.set(key(), o);
  emit();
};

export const outbox = {
  subscribe(l) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  version: () => version,
  pending: (clientId) => !!(read()[clientId] || read()[`${clientId}#score`]),
  size: () => Object.keys(read()).length,

  /** queue the latest state of an attempt (start, ping or final submit) */
  saveAttempt(clientId, body) {
    if (!session.get().student) return;
    const o = read();
    const prev = o[clientId];
    /* never let a ping replace an unsent final result */
    if (prev?.body?.status === "submitted" && body.status !== "submitted") return;
    o[clientId] = { kind: "attempt", body, v: (prev?.v || 0) + 1 };
    write(o);
    this.flush();
  },

  saveScores(clientId, scores) {
    if (!session.get().student) return;
    const o = read();
    const k = `${clientId}#score`;
    o[k] = { kind: "score", clientId, scores: { ...(o[k]?.scores || {}), ...scores }, v: (o[k]?.v || 0) + 1 };
    write(o);
    this.flush();
  },

  async flush() {
    if (flushing || !session.get().student) return;
    flushing = true;
    clearTimeout(retry);
    retry = null;
    let failed = false;
    try {
      /* attempts before score changes (a score needs its attempt on the server) */
      const entries = Object.entries(read()).sort(([, a], [, b]) => (a.kind === b.kind ? 0 : a.kind === "attempt" ? -1 : 1));
      for (const [k, e] of entries) {
        try {
          if (e.kind === "attempt") await api(`/me/attempts/${encodeURIComponent(k)}`, { method: "PUT", body: e.body });
          else await api(`/me/attempts/${encodeURIComponent(e.clientId)}/self-score`, { method: "PATCH", body: { scores: e.scores } });
          const o = read();
          if (o[k]?.v === e.v) {
            delete o[k];
            write(o);
          }
        } catch (err) {
          if (err.status === 400 || err.status === 404 || err.status === 409) {
            console.warn("[outbox] dropped", k, err.message);
            const o = read();
            delete o[k];
            write(o);
          } else throw err;
        }
      }
    } catch {
      failed = true; /* offline or server down */
    } finally {
      flushing = false;
      if (failed) retry = setTimeout(() => this.flush(), 20000);
      else if (this.size()) retry = setTimeout(() => this.flush(), 500);
    }
  },
};

session.onLogin(() => outbox.flush());
session.subscribe(emit);
if (typeof window !== "undefined") window.addEventListener("online", () => outbox.flush());

export function useOutboxPending(clientId) {
  useSyncExternalStore(outbox.subscribe, outbox.version);
  return clientId ? outbox.pending(clientId) : outbox.size() > 0;
}
