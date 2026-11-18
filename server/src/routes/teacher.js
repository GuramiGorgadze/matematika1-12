import { Router } from "express";
import { z } from "zod";
import {
  attemptDetail,
  attemptsCsv,
  overview,
  studentDetail,
  studentsCsv,
  studentsTable,
} from "../services/teacher.js";
import { badRequest, unauthorized, unavailable } from "../utils/errors.js";

const listQuery = z.object({
  q: z.string().max(80).optional(),
  grade: z.coerce.number().int().min(1).max(12).optional(),
  kind: z.enum(["exam", "chapter"]).optional(),
  status: z.enum(["in_progress", "submitted"]).optional(),
  limit: z.coerce.number().int().min(1).max(500).default(100),
  skip: z.coerce.number().int().min(0).default(0),
});

export function teacherRoutes({ store, auth, sheets, config, limiters }) {
  const r = Router();
  const tz = config.timezone;

  r.post("/session", limiters.teacher, (req, res) => {
    if (!config.teacherKey) throw unavailable("Teacher access is not configured: set TEACHER_KEY on the server.");
    if (!auth.checkTeacherKey(req.body?.key)) throw unauthorized("არასწორი გასაღები");
    res.json({ token: auth.teacherToken() });
  });

  r.use(auth.requireTeacher);

  r.get("/overview", async (_req, res) => {
    res.json({ ...(await overview(store, tz)), sheets: sheets.status() });
  });

  r.get("/students", async (req, res) => {
    const q = listQuery.safeParse(req.query);
    if (!q.success) throw badRequest("Invalid query");
    res.json({ items: await studentsTable(store, q.data) });
  });

  r.get("/students/:id", async (req, res) => {
    res.json(await studentDetail(store, req.params.id));
  });

  r.get("/attempts", async (req, res) => {
    const q = listQuery.safeParse(req.query);
    if (!q.success) throw badRequest("Invalid query");
    res.json(await store.attempts.list(q.data));
  });

  r.get("/attempts/:id", async (req, res) => {
    res.json({ attempt: await attemptDetail(store, req.params.id) });
  });

  r.get("/export/students.csv", async (_req, res) => {
    res.attachment("students.csv").type("text/csv; charset=utf-8").send(await studentsCsv(store, tz));
  });

  r.get("/export/attempts.csv", async (_req, res) => {
    res.attachment("tests.csv").type("text/csv; charset=utf-8").send(await attemptsCsv(store, tz));
  });

  r.get("/sheets", (_req, res) => res.json(sheets.status()));

  r.post("/sheets/resync", async (_req, res) => {
    if (!sheets.enabled) throw unavailable("Google Sheets is not configured (SHEETS_MODE=off).");
    await sheets.resyncAll();
    res.json({ ok: true, ...sheets.status() });
  });

  return r;
}
