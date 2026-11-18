/** 6 423 — thousands separated by a thin space, as in Georgian print */
export const thousands = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "\u2009");

/** Georgian ordinals: 1-ლი, მე-2 … მე-12 */
export function ord(n) {
  return n === 1 ? "1-ლი" : `მე-${n}`;
}

export const STAGES = [
  { key: 1, title: "დაწყებითი საფეხური", range: "1–6 კლასი", from: 1, to: 6 },
  { key: 2, title: "საბაზო საფეხური", range: "7–9 კლასი", from: 7, to: 9 },
  { key: 3, title: "საშუალო საფეხური", range: "10–12 კლასი", from: 10, to: 12 },
];
export const stageOf = (n) => (n <= 6 ? 1 : n <= 9 ? 2 : 3);
export const stageName = (n) => (n <= 6 ? "დაწყებითი" : n <= 9 ? "საბაზო" : "საშუალო");

/** Tailwind classes per school stage (written out in full so the build keeps them) */
export const STAGE_STYLES = {
  1: { text: "text-stage-1", bg: "bg-stage-1-soft", fill: "bg-stage-1-fill", border: "border-stage-1", badge: "stage1", stroke: "var(--stage-1-fill)" },
  2: { text: "text-stage-2", bg: "bg-stage-2-soft", fill: "bg-stage-2-fill", border: "border-stage-2", badge: "stage2", stroke: "var(--stage-2-fill)" },
  3: { text: "text-stage-3", bg: "bg-stage-3-soft", fill: "bg-stage-3-fill", border: "border-stage-3", badge: "stage3", stroke: "var(--stage-3-fill)" },
};

const pad = (n) => String(n).padStart(2, "0");

/** 4:07, 1:02:09 — timers */
export function clock(seconds) {
  const s = Math.max(0, Math.round(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h ? `${h}:${pad(m)}:${pad(s % 60)}` : `${m}:${pad(s % 60)}`;
}

/** "1 სთ 5 წთ", "12 წთ", "45 წმ" — durations in prose */
export function humanDuration(seconds) {
  const s = Math.max(0, Math.round(seconds));
  if (s < 60) return `${s} წმ`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m} წთ`;
  return `${Math.floor(m / 60)} სთ ${m % 60} წთ`;
}

export function dateTime(t) {
  if (!t) return "—";
  const d = new Date(t);
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function dateOnly(t) {
  if (!t) return "—";
  const d = new Date(t);
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
}

export function timeOnly(t) {
  const d = new Date(t);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function dayKey(t = Date.now()) {
  const d = new Date(t);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** "დღეს", "გუშინ", "5 დღის წინ" */
export function ago(t) {
  if (!t) return "—";
  const days = Math.floor((Date.now() - new Date(t)) / 86400000);
  if (days <= 0) return "დღეს";
  if (days === 1) return "გუშინ";
  return `${days} დღის წინ`;
}

export const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);

export function initials(first = "", last = "") {
  return `${first.trim()[0] || ""}${last.trim()[0] || ""}`;
}
