/** Formatting shared by the Sheets mirror and the CSV exports. */
const dtCache = new Map();
function fmt(tz, opts) {
  const k = tz + JSON.stringify(opts);
  if (!dtCache.has(k)) dtCache.set(k, new Intl.DateTimeFormat("sv-SE", { timeZone: tz, hour12: false, ...opts }));
  return dtCache.get(k);
}

/** 2026-11-18 15:58:03 in the school's time zone */
export function dateTime(d, tz) {
  if (!d) return "";
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(+date)) return "";
  return fmt(tz, { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(date);
}

export function clockTime(d, tz) {
  if (!d) return "";
  return fmt(tz, { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(d instanceof Date ? d : new Date(d));
}

/** 1:05:09 or 4:07 */
export function duration(ms) {
  if (ms == null || Number.isNaN(ms)) return "";
  const s = Math.max(0, Math.round(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}

export const minutes = (seconds) => Math.round(((seconds || 0) / 60) * 10) / 10;

export const ANSWER_LABEL = { correct: "სწორი", wrong: "არასწორი", unanswered: "უპასუხო", partial: "ნაწილობრივ", pending: "შესაფასებელი" };
export const AWAY_LABEL = { hidden: "სხვა ჩანართი ან აპი", blur: "ფანჯარა არააქტიური", closed: "გვერდი დახურული" };
export const KIND_LABEL = { exam: "ეროვნული/სავარჯიშო გამოცდა", chapter: "თავის შემაჯამებელი ტესტი" };
export const STATUS_LABEL = { in_progress: "მიმდინარე", submitted: "დასრულებული" };

export function awayDetails(events, tz, limit = 40000) {
  const s = (events || [])
    .map((e) => `${clockTime(e.from, tz)} · ${duration(e.ms)}${e.q ? ` · ამოცანა №${e.q}` : ""} · ${AWAY_LABEL[e.type] || e.type}`)
    .join("; ");
  return s.length > limit ? s.slice(0, limit) + "…" : s;
}

export function questionList(answers, status) {
  return (answers || [])
    .filter((a) => a.status === status)
    .map((a) => a.n)
    .join(", ");
}

/** aggregate submitted attempts per student id */
export function attemptStatsByStudent(attempts) {
  const by = new Map();
  for (const a of attempts) {
    const k = String(a.student);
    const s = by.get(k) || { tests: 0, inProgress: 0, best: null, sumPct: 0, leaves: 0, awayMs: 0, lastTestAt: null };
    if (a.status === "submitted") {
      s.tests++;
      s.sumPct += a.percent || 0;
      s.best = s.best == null ? a.percent : Math.max(s.best, a.percent);
      const t = new Date(a.finishedAt || a.startedAt);
      if (!s.lastTestAt || t > s.lastTestAt) s.lastTestAt = t;
    } else s.inProgress++;
    s.leaves += a.focus?.leaves || 0;
    s.awayMs += a.focus?.awayMs || 0;
    by.set(k, s);
  }
  for (const s of by.values()) s.avg = s.tests ? Math.round((s.sumPct / s.tests) * 10) / 10 : null;
  return by;
}
