import { Router } from "express";
import { publicAttempt, saveAttempt, selfScore } from "../services/attempts.js";
import { publicStudent, recordActivity, saveProgress, startSession, updateDetails } from "../services/students.js";
import { notFound } from "../utils/errors.js";

export function studentRoutes({ store, auth, sheets, limiters }) {
  const r = Router();

  /** sign in or register: the same details always return the same profile */
  r.post("/session", limiters.session, async (req, res) => {
    const { student, created } = await startSession(store, req.body);
    sheets.kick();
    res.status(created ? 201 : 200).json({ token: auth.studentToken(student.id), student: publicStudent(student), created });
  });

  r.use("/me", auth.requireStudent);

  r.get("/me", (req, res) => res.json({ student: publicStudent(req.student) }));

  r.patch("/me", async (req, res) => {
    const s = await updateDetails(store, req.student.id, req.body);
    sheets.kick();
    res.json({ student: publicStudent(s) });
  });

  r.post("/me/activity", async (req, res) => {
    const s = await recordActivity(store, req.student.id, req.body);
    res.json({ ok: true, activity: s.activity });
  });

  r.get("/me/progress", async (req, res) => {
    res.json({ entries: await store.progress.list(req.student.id) });
  });

  r.put("/me/progress", async (req, res) => {
    const changed = await saveProgress(store, req.student.id, req.body);
    res.json({ ok: true, changed });
  });

  r.get("/me/attempts", async (req, res) => {
    const items = await store.attempts.listForStudent(req.student.id);
    res.json({ items: items.map((a) => publicAttempt(a, { withAnswers: false })) });
  });

  r.get("/me/attempts/:clientId", async (req, res) => {
    const a = await store.attempts.findByClient(req.student.id, req.params.clientId);
    if (!a) throw notFound("Attempt not found");
    res.json({ attempt: publicAttempt(a) });
  });

  /** start, progress ping and final submit all go through this idempotent upsert */
  r.put("/me/attempts/:clientId", async (req, res) => {
    const { attempt, created, submittedNow } = await saveAttempt(store, req.student, { ...req.body, clientId: req.params.clientId });
    if (created || submittedNow || attempt.sheets?.status === "pending") sheets.kick(submittedNow ? 500 : 3000);
    res.status(created ? 201 : 200).json({ attempt: publicAttempt(attempt, { withAnswers: false }) });
  });

  r.patch("/me/attempts/:clientId/self-score", async (req, res) => {
    const a = await selfScore(store, req.student, req.params.clientId, req.body);
    sheets.kick();
    res.json({ attempt: publicAttempt(a, { withAnswers: false }) });
  });

  return r;
}
