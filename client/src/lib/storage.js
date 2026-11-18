/**
 * localStorage that never throws (private mode, full quota, blocked storage): falls back to memory.
 * All keys are prefixed with "mx:".
 */
const mem = new Map();

function raw() {
  try {
    const s = window.localStorage;
    const k = "mx:__probe";
    s.setItem(k, "1");
    s.removeItem(k);
    return s;
  } catch {
    return null;
  }
}
const ls = typeof window !== "undefined" ? raw() : null;

export const storage = {
  get(key, fallback = null) {
    try {
      const v = ls ? ls.getItem(key) : mem.get(key);
      return v == null ? fallback : JSON.parse(v);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    const v = JSON.stringify(value);
    mem.set(key, v);
    try {
      ls?.setItem(key, v);
    } catch {
      /* quota exceeded: the memory copy keeps the app working for this visit */
    }
  },
  remove(key) {
    mem.delete(key);
    try {
      ls?.removeItem(key);
    } catch {
      /* ignore */
    }
  },
  keys(prefix = "") {
    const out = new Set([...mem.keys()].filter((k) => k.startsWith(prefix)));
    try {
      if (ls)
        for (let i = 0; i < ls.length; i++) {
          const k = ls.key(i);
          if (k && k.startsWith(prefix)) out.add(k);
        }
    } catch {
      /* ignore */
    }
    return [...out];
  },
};
