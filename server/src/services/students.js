import { z } from "zod";
import { badRequest, conflict, DuplicateKeyError } from "../utils/errors.js";
import { cleanText, studentKey } from "../utils/identity.js";

const name = (min, max, msg) =>
  z
    .string()
    .transform(cleanText)
    .pipe(z.string().min(min, msg).max(max));

export const detailsInput = z.object({
  firstName: name(2, 40, "სახელი მინიმუმ 2 ასოა"),
  lastName: name(2, 40, "გვარი მინიმუმ 2 ასოა"),
  school: name(2, 80, "ჩაწერე სკოლის სახელი"),
  grade: z.coerce.number().int().min(1).max(12),
});

export const activityInput = z.object({
  /** active seconds since the last heartbeat (the browser only counts visible, non-idle time) */
  seconds: z.number().int().min(0).max(3600),
  day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  visit: z.boolean().optional(),
});

const progressEntry = z.object({
  problemId: z.string().min(1).max(80),
  lessonId: z.string().max(40).optional(),
  tries: z.number().int().min(0).max(10000),
  solved: z.boolean(),
  firstTry: z.boolean(),
  seen: z.boolean(),
  lastAt: z.number().int().positive().optional(),
});

export const progressInput = z.object({
  entries: z.array(progressEntry).max(3000),
  stats: z
    .object({
      solved: z.number().int().min(0),
      firstTry: z.number().int().min(0),
      tries: z.number().int().min(0),
      lessonsDone: z.number().int().min(0),
    })
    .optional(),
});

function parse(schema, raw, what) {
  const r = schema.safeParse(raw);
  if (!r.success) throw badRequest(`Invalid ${what}`, r.error.issues.slice(0, 5));
  return r.data;
}

export function publicStudent(s) {
  if (!s) return null;
  const { key, sheets, ...rest } = s;
  return rest;
}

export async function startSession(store, raw) {
  const d = parse(detailsInput, raw, "details");
  return store.students.findOrCreate({ ...d, key: studentKey(d) });
}

export async function updateDetails(store, id, raw) {
  const d = parse(detailsInput, raw, "details");
  try {
    return await store.students.update(id, { ...d, key: studentKey(d) });
  } catch (e) {
    if (e instanceof DuplicateKeyError) throw conflict("ასეთი მოსწავლე უკვე არსებობს (იგივე სახელი, გვარი, სკოლა და კლასი).");
    throw e;
  }
}

export async function recordActivity(store, id, raw) {
  const d = parse(activityInput, raw, "activity");
  return store.students.addActivity(id, { seconds: d.seconds, day: d.day, visit: !!d.visit, at: new Date() });
}

export async function saveProgress(store, id, raw) {
  const d = parse(progressInput, raw, "progress");
  const entries = d.entries.map((e) => ({ ...e, lastAt: e.lastAt ? new Date(e.lastAt) : undefined }));
  const changed = await store.progress.upsertMany(id, entries);
  if (d.stats) await store.students.setStats(id, d.stats);
  return changed;
}
