import crypto from "node:crypto";
import { DuplicateKeyError } from "../utils/errors.js";

/**
 * In-memory implementation of the data interface used by the services.
 * Used by the automated tests and by `npm run demo` (try the app without MongoDB).
 * Data is lost when the process stops.
 */
const newId = () => crypto.randomBytes(12).toString("hex");
const clone = (o) => (o == null ? o : structuredClone(o));
const toDate = (v) => (v == null ? v : v instanceof Date ? v : new Date(v));
const max = (a, b) => (a == null ? b : b == null ? a : a > b ? a : b);

function setPath(obj, path, value) {
  const parts = path.split(".");
  let o = obj;
  for (let i = 0; i < parts.length - 1; i++) o = o[parts[i]] ??= {};
  o[parts.at(-1)] = value;
}

export function createMemoryStore() {
  const S = new Map(); /* id → student */
  const P = new Map(); /* studentId|problemId → progress */
  const A = new Map(); /* id → attempt */

  const students = {
    async findOrCreate(data) {
      const now = new Date();
      for (const s of S.values()) {
        if (s.key === data.key) {
          s.activity.lastSeenAt = now;
          s.sheets.dirty = true;
          s.updatedAt = now;
          return { student: clone(s), created: false };
        }
      }
      const s = {
        id: newId(),
        firstName: data.firstName,
        lastName: data.lastName,
        school: data.school,
        grade: data.grade,
        key: data.key,
        activity: { visits: 0, seconds: 0, days: {}, firstSeenAt: now, lastSeenAt: now },
        stats: { solved: 0, firstTry: 0, tries: 0, lessonsDone: 0 },
        sheets: { dirty: true },
        createdAt: now,
        updatedAt: now,
      };
      S.set(s.id, s);
      return { student: clone(s), created: true };
    },

    async getById(id) {
      return clone(S.get(id) || null);
    },

    async update(id, patch) {
      const s = S.get(id);
      if (!s) return null;
      if (patch.key && patch.key !== s.key) for (const o of S.values()) if (o.key === patch.key) throw new DuplicateKeyError("key");
      Object.assign(s, patch, { updatedAt: new Date() });
      s.sheets.dirty = true;
      return clone(s);
    },

    async addActivity(id, { seconds = 0, day, visit = false, at = new Date() }) {
      const s = S.get(id);
      if (!s) return null;
      s.activity.seconds += seconds;
      if (seconds && day) s.activity.days[day] = (s.activity.days[day] || 0) + seconds;
      if (visit) s.activity.visits += 1;
      s.activity.lastSeenAt = max(toDate(s.activity.lastSeenAt), toDate(at));
      s.sheets.dirty = true;
      s.updatedAt = new Date();
      return clone(s);
    },

    async setStats(id, stats) {
      const s = S.get(id);
      if (!s) return null;
      s.stats = { ...stats, updatedAt: new Date() };
      s.sheets.dirty = true;
      s.updatedAt = new Date();
      return clone(s);
    },

    async list({ q, grade } = {}) {
      const rx = q ? new RegExp(String(q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") : null;
      return [...S.values()]
        .filter((s) => (!grade || s.grade === grade) && (!rx || rx.test(s.firstName) || rx.test(s.lastName) || rx.test(s.school)))
        .sort((a, b) => toDate(b.activity.lastSeenAt) - toDate(a.activity.lastSeenAt))
        .map(clone);
    },

    async listDirty(limit = 200) {
      return [...S.values()].filter((s) => s.sheets.dirty).slice(0, limit).map(clone);
    },

    async markSheets(ids, { ok, error, startedAt }) {
      for (const id of ids) {
        const s = S.get(id);
        if (!s) continue;
        if (ok && toDate(s.updatedAt) <= toDate(startedAt)) Object.assign(s.sheets, { dirty: false, syncedAt: new Date(), error: null });
        else if (!ok) s.sheets.error = String(error).slice(0, 300);
      }
    },

    async markAllDirty() {
      for (const s of S.values()) s.sheets.dirty = true;
    },
  };

  const progress = {
    async list(studentId) {
      return [...P.values()].filter((p) => p.student === studentId).map(({ student, ...rest }) => clone(rest));
    },

    async upsertMany(studentId, entries) {
      let n = 0;
      for (const e of entries) {
        const k = studentId + "|" + e.problemId;
        const cur = P.get(k) || { student: studentId, problemId: e.problemId };
        const next = {
          ...cur,
          lessonId: e.lessonId ?? cur.lessonId,
          tries: max(cur.tries, e.tries) ?? 0,
          solved: Boolean(cur.solved || e.solved),
          firstTry: Boolean(cur.firstTry || e.firstTry),
          seen: Boolean(cur.seen || e.seen),
          lastAt: max(toDate(cur.lastAt), toDate(e.lastAt)),
        };
        if (JSON.stringify(next) !== JSON.stringify(cur)) n++;
        P.set(k, next);
      }
      return n;
    },
  };

  const attempts = {
    async findByClient(studentId, clientId) {
      for (const a of A.values()) if (a.student === studentId && a.clientId === clientId) return clone(a);
      return null;
    },

    async create(doc) {
      for (const a of A.values()) if (a.student === String(doc.student) && a.clientId === doc.clientId) throw new DuplicateKeyError("clientId");
      const now = new Date();
      const a = {
        sheets: { status: "pending" },
        focus: { leaves: 0, awayMs: 0, longestMs: 0, events: [] },
        answers: [],
        counts: { correct: 0, wrong: 0, unanswered: 0, partial: 0, pending: 0 },
        ...clone(doc),
        id: newId(),
        student: String(doc.student),
        createdAt: now,
        updatedAt: now,
      };
      A.set(a.id, a);
      return clone(a);
    },

    async update(id, set) {
      const a = A.get(id);
      if (!a) return null;
      for (const [k, v] of Object.entries(set)) setPath(a, k, clone(v));
      a.updatedAt = new Date();
      return clone(a);
    },

    async getById(id) {
      return clone(A.get(id) || null);
    },

    async listForStudent(studentId) {
      return [...A.values()]
        .filter((a) => a.student === studentId)
        .sort((x, y) => toDate(y.startedAt) - toDate(x.startedAt))
        .map(({ answers, ...rest }) => ({ ...clone(rest), focus: { ...rest.focus, events: undefined } }));
    },

    async list({ grade, kind, status, studentId, q, limit = 100, skip = 0 } = {}) {
      const rx = q ? new RegExp(String(q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") : null;
      const all = [...A.values()]
        .filter(
          (a) =>
            (!grade || a.studentGrade === grade) &&
            (!kind || a.kind === kind) &&
            (!status || a.status === status) &&
            (!studentId || a.student === studentId) &&
            (!rx || rx.test(a.studentName) || rx.test(a.title) || rx.test(a.school || "")),
        )
        .sort((x, y) => toDate(y.startedAt) - toDate(x.startedAt));
      return { items: all.slice(skip, skip + limit).map(({ answers, ...rest }) => clone(rest)), total: all.length };
    },

    async summaries() {
      return [...A.values()].map(({ answers, ...rest }) => clone(rest));
    },

    async setSheets(id, { status, error, startedAt }) {
      const a = A.get(id);
      if (!a) return;
      if (status === "synced" && startedAt && toDate(a.updatedAt) > toDate(startedAt)) return;
      a.sheets = { ...a.sheets, status, error: error ? String(error).slice(0, 300) : null, ...(status === "synced" ? { syncedAt: new Date() } : {}) };
    },

    async listSheetsPending(limit = 20) {
      return [...A.values()].filter((a) => a.sheets.status === "pending" || a.sheets.status === "error").slice(0, limit).map(clone);
    },

    async markAllPending() {
      for (const a of A.values()) a.sheets.status = "pending";
    },
  };

  return { kind: "memory", students, progress, attempts };
}
