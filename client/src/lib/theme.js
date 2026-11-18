import { useSyncExternalStore } from "react";
import { storage } from "./storage";

/** "light" | "dark" | "system"; applied as the .dark class on <html> (see public/theme-init.js) */
const KEY = "mx:theme";
const listeners = new Set();
const media = typeof window !== "undefined" ? window.matchMedia("(prefers-color-scheme: dark)") : null;

function apply(pref) {
  const dark = pref === "dark" || (pref === "system" && media?.matches);
  document.documentElement.classList.toggle("dark", !!dark);
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
}

let pref = storage.get(KEY) || "system";
if (typeof document !== "undefined") apply(pref);
media?.addEventListener("change", () => pref === "system" && (apply(pref), listeners.forEach((l) => l())));

export const theme = {
  get: () => pref,
  isDark: () => document.documentElement.classList.contains("dark"),
  set(p) {
    pref = p;
    storage.set(KEY, p);
    apply(p);
    listeners.forEach((l) => l());
  },
  toggle() {
    this.set(this.isDark() ? "light" : "dark");
  },
  subscribe(l) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

export function useDarkMode() {
  return useSyncExternalStore(theme.subscribe, theme.isDark);
}
