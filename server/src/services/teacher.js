import { notFound } from "../utils/errors.js";
import { publicStudent } from "./students.js";
import {
  ANSWER_LABEL,
  attemptStatsByStudent,
  awayDetails,
  dateTime,
  duration,
  KIND_LABEL,
  minutes,
  questionList,
  STATUS_LABEL,
} from "./format.js";

const DAY = 86400000;

function dayKey(d, tz) {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

/** dashboard numbers. Computed in memory: comfortable for thousands of students and tests. */
export async function overview(store, tz) {
  const [students, attempts] = await Promise.all([store.students.list(), store.attempts.summaries()]);
  const now = Date.now();
  const submitted = attempts.filter((a) => a.status === "submitted");
  const avg = (arr) => (arr.length ? Math.round((arr.reduce((s, x) => s + x, 0) / arr.length) * 10) / 10 : null);

  const byGrade = [];
  for (let g = 1; g <= 12; g++) {
    const st = students.filter((s) => s.grade === g);
    const at = submitted.filter((a) => a.studentGrade === g);
    if (st.length || at.length) byGrade.push({ grade: g, students: st.length, tests: at.length, avgPercent: avg(at.map((a) => a.percent)) });
  }

  /* last 14 days: active students and finished tests per day */
  const days = [];
  for (let i = 13; i >= 0; i--) {
    const key = dayKey(new Date(now - i * DAY), tz);
    days.push({
      date: key,
      activeStudents: students.filter((s) => s.activity?.days?.[key]).length,
      minutes: Math.round(students.reduce((m, s) => m + (s.activity?.days?.[key] || 0), 0) / 60),
      tests: submitted.filter((a) => dayKey(new Date(a.finishedAt), tz) === key).length,
    });
  }

  const withLeaves = submitted.filter((a) => (a.focus?.leaves || 0) > 0);
  return {
    totals: {
      students: students.length,
      activeToday: students.filter((s) => now - new Date(s.activity?.lastSeenAt || 0) < DAY).length,
      activeWeek: students.filter((s) => now - new Date(s.activity?.lastSeenAt || 0) < 7 * DAY).length,
      tests: submitted.length,
      inProgress: attempts.length - submitted.length,
      avgPercent: avg(submitted.map((a) => a.percent)),
      testsWithLeaves: withLeaves.length,
      leaves: submitted.reduce((s, a) => s + (a.focus?.leaves || 0), 0),
      awayMs: submitted.reduce((s, a) => s + (a.focus?.awayMs || 0), 0),
    },
    byGrade,
    days,
    recent: submitted
      .sort((a, b) => new Date(b.finishedAt) - new Date(a.finishedAt))
      .slice(0, 8),
  };
}

export async function studentsTable(store, { q, grade } = {}) {
  const [students, attempts] = await Promise.all([store.students.list({ q, grade }), store.attempts.summaries()]);
  const agg = attemptStatsByStudent(attempts);
  return students.map((s) => {
    const a = agg.get(s.id) || {};
    return {
      ...publicStudent(s),
      activeDays: Object.keys(s.activity?.days || {}).length,
      tests: a.tests || 0,
      inProgress: a.inProgress || 0,
      bestPercent: a.best ?? null,
      avgPercent: a.avg ?? null,
      leaves: a.leaves || 0,
      awayMs: a.awayMs || 0,
      lastTestAt: a.lastTestAt || null,
    };
  });
}

export async function studentDetail(store, id) {
  const s = await store.students.getById(id);
  if (!s) throw notFound("Student not found");
  const [attempts, progress] = await Promise.all([store.attempts.listForStudent(id), store.progress.list(id)]);
  return { student: publicStudent(s), attempts, progress: { problems: progress.length, solved: progress.filter((p) => p.solved).length } };
}

export async function attemptDetail(store, id) {
  const a = await store.attempts.getById(id);
  if (!a) throw notFound("Attempt not found");
  const { client, ...rest } = a;
  return rest;
}

/* ---------- CSV (UTF-8 with BOM so Excel shows Georgian correctly) ---------- */
function csv(rows) {
  const cell = (v) => {
    let s = v == null ? "" : String(v);
    if (/^[=+\-@]/.test(s)) s = "'" + s; /* no formulas from user input */
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return "﻿" + rows.map((r) => r.map(cell).join(",")).join("\r\n");
}

export async function studentsCsv(store, tz) {
  const rows = await studentsTable(store);
  return csv([
    ["ID", "სახელი", "გვარი", "კლასი", "სკოლა", "რეგისტრაცია", "ბოლო აქტივობა", "ვიზიტები", "აქტიური დღეები", "დრო საიტზე (წთ)", "ამოხსნილი ამოცანები", "დასრულებული გაკვეთილები", "ტესტები", "საუკეთესო %", "საშუალო %", "ჩანართიდან გასვლები", "ჩანართს გარეთ (წთ)"],
    ...rows.map((s) => [
      s.id, s.firstName, s.lastName, s.grade, s.school, dateTime(s.createdAt, tz), dateTime(s.activity?.lastSeenAt, tz),
      s.activity?.visits || 0, s.activeDays, minutes(s.activity?.seconds), s.stats?.solved || 0, s.stats?.lessonsDone || 0,
      s.tests, s.bestPercent ?? "", s.avgPercent ?? "", s.leaves, minutes(s.awayMs / 1000),
    ]),
  ]);
}

export async function attemptsCsv(store, tz) {
  const { items } = await store.attempts.list({ limit: 20000 });
  const full = await Promise.all(items.map((a) => store.attempts.getById(a.id)));
  return csv([
    ["ID", "სტატუსი", "დაწყება", "დასრულება", "მოსწავლე", "კლასი", "სკოლა", "ტიპი", "ტესტი", "ქულა", "მაქს.", "%", "სწორი", "არასწორი", "უპასუხო", "დრო", "ჩანართიდან გასვლები", "ჩანართს გარეთ", "გასვლების დეტალები", "სწორი ამოცანები", "არასწორი ამოცანები", "უპასუხო ამოცანები"],
    ...full.filter(Boolean).map((a) => [
      a.id, STATUS_LABEL[a.status], dateTime(a.startedAt, tz), dateTime(a.finishedAt, tz), a.studentName, a.studentGrade, a.school,
      KIND_LABEL[a.kind], a.title, a.score, a.maxScore, a.percent, a.counts?.correct, a.counts?.wrong, a.counts?.unanswered,
      duration((a.durationSec || 0) * 1000), a.focus?.leaves || 0, duration(a.focus?.awayMs || 0), awayDetails(a.focus?.events, tz),
      questionList(a.answers, "correct"), questionList(a.answers, "wrong"), questionList(a.answers, "unanswered"),
    ]),
  ]);
}

export { ANSWER_LABEL };
