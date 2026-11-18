import { z } from "zod";
import { ANSWER_STATUSES, AWAY_TYPES } from "../models/Attempt.js";
import { badRequest, conflict, DuplicateKeyError, notFound } from "../utils/errors.js";
import { fullName } from "../utils/identity.js";

const cut = (n) => (s) => (s == null ? s : String(s).slice(0, n));

const answerInput = z.object({
  n: z.number().int().min(1).max(200),
  qid: z.string().max(80).optional(),
  type: z.enum(["choice", "written"]),
  prompt: z.string().max(4000).optional().transform(cut(600)),
  given: z.string().max(2000).nullable().optional().transform(cut(300)),
  correct: z.string().max(2000).optional().transform(cut(300)),
  status: z.enum(ANSWER_STATUSES),
  points: z.number().min(0).max(100),
  maxPoints: z.number().min(0).max(100),
  selfScored: z.boolean().optional(),
});

const awayInput = z.object({
  from: z.number().int().positive(),
  to: z.number().int().positive(),
  ms: z.number().min(0),
  type: z.enum(AWAY_TYPES),
  q: z.number().int().min(0).max(200).optional(),
});

const focusInput = z.object({
  leaves: z.number().int().min(0).max(100000),
  awayMs: z.number().min(0),
  longestMs: z.number().min(0).optional(),
  events: z.array(awayInput).max(1000),
});

export const attemptInput = z.object({
  clientId: z.string().min(8).max(64).regex(/^[\w-]+$/),
  status: z.enum(["in_progress", "submitted"]),
  kind: z.enum(["exam", "chapter"]),
  testId: z.string().min(1).max(40),
  title: z.string().min(1).max(200),
  testGrade: z.number().int().min(1).max(12).optional(),
  chapterId: z.string().max(20).optional(),
  startedAt: z.number().int().positive(),
  finishedAt: z.number().int().positive().optional(),
  timeLimitSec: z.number().min(0).max(86400).optional(),
  durationSec: z.number().min(0).max(604800).optional(),
  autoSubmitted: z.boolean().optional(),
  questionCount: z.number().int().min(0).max(200).optional(),
  answeredCount: z.number().int().min(0).max(200).optional(),
  answers: z.array(answerInput).max(200).optional(),
  focus: focusInput.optional(),
  client: z.object({ tz: z.string().max(60).optional(), ua: z.string().max(300).optional() }).optional(),
});

export const selfScoreInput = z.object({
  scores: z.record(z.string().regex(/^\d{1,3}$/), z.number().min(0).max(100)),
});

/** score, counts and percent from the per-question results */
export function recalc(answers) {
  const counts = { correct: 0, wrong: 0, unanswered: 0, partial: 0, pending: 0 };
  let score = 0;
  let maxScore = 0;
  let answered = 0;
  for (const a of answers) {
    counts[a.status] = (counts[a.status] || 0) + 1;
    score += a.points || 0;
    maxScore += a.maxPoints || 0;
    if (a.given != null && String(a.given).trim() !== "") answered++;
  }
  const percent = maxScore ? Math.round((score / maxScore) * 1000) / 10 : 0;
  return { counts, score, maxScore, percent, answeredCount: answered };
}

/** trust the event list, but never report fewer leaves than the browser counted */
export function normalizeFocus(f) {
  if (!f) return { leaves: 0, awayMs: 0, longestMs: 0, events: [] };
  const events = f.events
    .filter((e) => e.to >= e.from)
    .map((e) => ({ from: new Date(e.from), to: new Date(e.to), ms: Math.round(e.ms), type: e.type, q: e.q }))
    .sort((a, b) => a.from - b.from);
  const sum = events.reduce((s, e) => s + e.ms, 0);
  const longest = events.reduce((m, e) => Math.max(m, e.ms), 0);
  return {
    leaves: Math.max(f.leaves, events.length),
    awayMs: Math.round(Math.max(f.awayMs, sum)),
    longestMs: Math.round(Math.max(f.longestMs || 0, longest)),
    events,
  };
}

/**
 * Create or update an attempt (idempotent by clientId). The browser saves an attempt when it
 * starts, pings it while running (answered count, tab leaves), and saves the full result at the end.
 */
export async function saveAttempt(store, student, raw) {
  const parsed = attemptInput.safeParse(raw);
  if (!parsed.success) throw badRequest("Invalid attempt", parsed.error.issues.slice(0, 5));
  const input = parsed.data;
  const existing = await store.attempts.findByClient(student.id, input.clientId);

  if (existing && existing.status === "submitted") {
    /* a late ping from another tab must not reopen a finished test */
    return { attempt: existing, created: false, submittedNow: false };
  }

  const base = {
    studentName: fullName(student),
    studentGrade: student.grade,
    school: student.school,
    kind: input.kind,
    testId: input.testId,
    title: input.title,
    testGrade: input.testGrade,
    chapterId: input.chapterId,
    startedAt: new Date(input.startedAt),
    lastActiveAt: new Date(),
    timeLimitSec: input.timeLimitSec,
    questionCount: input.questionCount ?? input.answers?.length ?? 0,
    answeredCount: input.answeredCount ?? 0,
    focus: normalizeFocus(input.focus),
    client: input.client,
  };

  let set = { ...base, status: "in_progress" };
  const submittedNow = input.status === "submitted";
  if (submittedNow) {
    if (!input.answers?.length) throw badRequest("A submitted attempt needs its answers.");
    const r = recalc(input.answers);
    const finishedAt = new Date(input.finishedAt || Date.now());
    set = {
      ...base,
      status: "submitted",
      finishedAt,
      durationSec: input.durationSec ?? Math.max(0, Math.round((finishedAt - base.startedAt) / 1000)),
      autoSubmitted: !!input.autoSubmitted,
      answers: input.answers.map((a) => ({ ...a, given: a.given ?? null, selfScored: !!a.selfScored })),
      questionCount: input.answers.length,
      ...r,
      "sheets.status": "pending",
    };
  }

  if (!existing) {
    try {
      const doc = { student: student.id, clientId: input.clientId, ...set };
      delete doc["sheets.status"];
      const created = await store.attempts.create({ ...doc, sheets: { status: "pending" } });
      return { attempt: created, created: true, submittedNow };
    } catch (e) {
      if (!(e instanceof DuplicateKeyError)) throw e;
      /* the start ping and the first progress ping raced: fall through to update */
      const again = await store.attempts.findByClient(student.id, input.clientId);
      if (!again) throw e;
      if (again.status === "submitted") return { attempt: again, created: false, submittedNow: false };
      const updated = await store.attempts.update(again.id, set);
      return { attempt: updated, created: false, submittedNow };
    }
  }
  /* refresh the sheet row of a running test when the student left the tab again */
  if (!submittedNow && (existing.focus?.leaves || 0) !== set.focus.leaves) set["sheets.status"] = "pending";
  const updated = await store.attempts.update(existing.id, set);
  return { attempt: updated, created: false, submittedNow };
}

/** points a student gives their own open (written) answers after an exam */
export async function selfScore(store, student, clientId, raw) {
  const parsed = selfScoreInput.safeParse(raw);
  if (!parsed.success) throw badRequest("Invalid scores", parsed.error.issues.slice(0, 5));
  const attempt = await store.attempts.findByClient(student.id, clientId);
  if (!attempt) throw notFound("Attempt not found");
  if (attempt.status !== "submitted") throw conflict("The test is still running.");

  const answers = attempt.answers.map((a) => {
    const v = parsed.data.scores[String(a.n)];
    if (v == null || a.type !== "written") return a;
    const points = Math.max(0, Math.min(a.maxPoints, Math.round(v)));
    const hasGiven = a.given != null && String(a.given).trim() !== "";
    const status = points >= a.maxPoints ? "correct" : points > 0 ? "partial" : hasGiven ? "wrong" : "unanswered";
    return { ...a, points, status, selfScored: true };
  });
  const updated = await store.attempts.update(attempt.id, { answers, ...recalc(answers), "sheets.status": "pending" });
  return updated;
}

/** what the student's own browser may see about an attempt */
export function publicAttempt(a, { withAnswers = true } = {}) {
  if (!a) return null;
  const { sheets, client, student, ...rest } = a;
  if (!withAnswers) delete rest.answers;
  return rest;
}
