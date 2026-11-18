import { useSyncExternalStore } from "react";
import { api, TOKEN_KEY } from "@/lib/api";
import { storage } from "@/lib/storage";

const STUDENT_KEY = "mx:student";

/**
 * Who is signed in. Students register with first name, last name, grade and school (no
 * password, like the original app); the server returns a token. The last known profile is
 * cached so the app opens instantly and keeps working offline.
 */
let state = (() => {
  const token = storage.get(TOKEN_KEY);
  const cached = storage.get(STUDENT_KEY);
  if (token && cached) return { status: "ready", student: cached };
  return { status: token ? "loading" : "anonymous", student: null };
})();

const listeners = new Set();
const loginHooks = new Set();
function set(next) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

export const session = {
  get: () => state,
  subscribe(l) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  /** run fn(student) whenever a student becomes active (start-up, sign-in) */
  onLogin(fn) {
    loginHooks.add(fn);
    if (state.status === "ready") fn(state.student);
    return () => loginHooks.delete(fn);
  },

  async init() {
    if (!storage.get(TOKEN_KEY)) return set({ status: "anonymous", student: null });
    try {
      const { student } = await api("/me");
      storage.set(STUDENT_KEY, student);
      const first = state.status !== "ready";
      set({ status: "ready", student });
      if (first) loginHooks.forEach((fn) => fn(student));
    } catch (e) {
      if (e.status === 401) this.clear();
      else if (!state.student) set({ status: "anonymous" });
    }
  },

  async register(details) {
    const { token, student, created } = await api("/session", { method: "POST", body: details });
    storage.set(TOKEN_KEY, token);
    storage.set(STUDENT_KEY, student);
    set({ status: "ready", student });
    loginHooks.forEach((fn) => fn(student));
    return { student, created };
  },

  async update(details) {
    const { student } = await api("/me", { method: "PATCH", body: details });
    storage.set(STUDENT_KEY, student);
    set({ student });
    return student;
  },

  clear() {
    storage.remove(TOKEN_KEY);
    storage.remove(STUDENT_KEY);
    set({ status: "anonymous", student: null });
  },
};

export function useSession() {
  return useSyncExternalStore(session.subscribe, session.get);
}

/** only re-runs when the student id changes */
export const currentStudentId = () => state.student?.id || null;
