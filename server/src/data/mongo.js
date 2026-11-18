import dns from "node:dns";
import mongoose from "mongoose";
import { Attempt } from "../models/Attempt.js";
import { Progress } from "../models/Progress.js";
import { Student } from "../models/Student.js";
import { DuplicateKeyError } from "../utils/errors.js";

const isDup = (e) => e && (e.code === 11000 || e.code === 11001);
const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** lean document → plain object with a string `id` */
function out(doc) {
  if (!doc) return null;
  const { _id, __v, ...rest } = doc;
  const o = { id: String(_id), ...rest };
  if (o.student) o.student = String(o.student);
  if (o.activity?.days instanceof Map) o.activity.days = Object.fromEntries(o.activity.days);
  return o;
}

export async function connectMongo(uri, { dnsServers = [] } = {}) {
  /* Node's own resolver sometimes cannot reach the router's DNS for SRV records (Atlas mongodb+srv://) */
  if (dnsServers.length) dns.setServers(dnsServers);
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  await Promise.all([Student.syncIndexes(), Progress.syncIndexes(), Attempt.syncIndexes()]);
  return mongoose.connection;
}

export async function disconnectMongo() {
  await mongoose.disconnect();
}

const ATTEMPT_SUMMARY_FIELDS =
  "student clientId studentName studentGrade school kind testId title testGrade chapterId status startedAt finishedAt lastActiveAt timeLimitSec durationSec autoSubmitted questionCount answeredCount score maxScore percent counts focus.leaves focus.awayMs focus.longestMs sheets createdAt updatedAt";

export function createMongoStore() {
  const students = {
    async findOrCreate(data) {
      const now = new Date();
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const res = await Student.findOneAndUpdate(
            { key: data.key },
            {
              $setOnInsert: {
                firstName: data.firstName,
                lastName: data.lastName,
                school: data.school,
                grade: data.grade,
                key: data.key,
                "activity.firstSeenAt": now,
              },
              $set: { "activity.lastSeenAt": now, "sheets.dirty": true },
            },
            { upsert: true, returnDocument: "after", includeResultMetadata: true, lean: true, runValidators: true },
          );
          return { student: out(res.value), created: !res.lastErrorObject?.updatedExisting };
        } catch (e) {
          if (!isDup(e) || attempt) throw e; /* two first sign-ins raced: read the winner */
        }
      }
      return null;
    },

    async getById(id) {
      if (!mongoose.isValidObjectId(id)) return null;
      return out(await Student.findById(id).lean());
    },

    async update(id, patch) {
      try {
        return out(
          await Student.findByIdAndUpdate(id, { $set: { ...patch, "sheets.dirty": true } }, { returnDocument: "after", lean: true, runValidators: true }),
        );
      } catch (e) {
        if (isDup(e)) throw new DuplicateKeyError("key");
        throw e;
      }
    },

    async addActivity(id, { seconds = 0, day, visit = false, at = new Date() }) {
      const inc = {};
      if (seconds) inc["activity.seconds"] = seconds;
      if (seconds && day) inc[`activity.days.${day}`] = seconds;
      if (visit) inc["activity.visits"] = 1;
      const update = { $max: { "activity.lastSeenAt": at }, $set: { "sheets.dirty": true } };
      if (Object.keys(inc).length) update.$inc = inc;
      return out(await Student.findByIdAndUpdate(id, update, { returnDocument: "after", lean: true }));
    },

    async setStats(id, stats) {
      return out(
        await Student.findByIdAndUpdate(
          id,
          { $set: { stats: { ...stats, updatedAt: new Date() }, "sheets.dirty": true } },
          { returnDocument: "after", lean: true },
        ),
      );
    },

    async list({ q, grade } = {}) {
      const filter = {};
      if (grade) filter.grade = grade;
      if (q) {
        const rx = new RegExp(escapeRegex(q), "i");
        filter.$or = [{ firstName: rx }, { lastName: rx }, { school: rx }];
      }
      return (await Student.find(filter).sort({ "activity.lastSeenAt": -1 }).limit(5000).lean()).map(out);
    },

    async listDirty(limit = 200) {
      return (await Student.find({ "sheets.dirty": true }).sort({ updatedAt: 1 }).limit(limit).lean()).map(out);
    },

    /** clears the dirty flag only for students not changed since the sync started */
    async markSheets(ids, { ok, error, startedAt }) {
      if (!ids.length) return;
      const filter = { _id: { $in: ids } };
      if (ok) {
        filter.updatedAt = { $lte: startedAt };
        await Student.updateMany(filter, { $set: { "sheets.dirty": false, "sheets.syncedAt": new Date(), "sheets.error": null } }, { timestamps: false });
      } else {
        await Student.updateMany(filter, { $set: { "sheets.error": String(error).slice(0, 300) } }, { timestamps: false });
      }
    },

    async markAllDirty() {
      await Student.updateMany({}, { $set: { "sheets.dirty": true } }, { timestamps: false });
    },
  };

  const progress = {
    async list(studentId) {
      const rows = await Progress.find({ student: studentId }).lean();
      return rows.map(({ problemId, lessonId, tries, solved, firstTry, seen, lastAt }) => ({ problemId, lessonId, tries, solved, firstTry, seen, lastAt }));
    },

    async upsertMany(studentId, entries) {
      if (!entries.length) return 0;
      const ops = entries.map((e) => ({
        updateOne: {
          filter: { student: studentId, problemId: e.problemId },
          update: {
            $max: { tries: e.tries, solved: e.solved, firstTry: e.firstTry, seen: e.seen, lastAt: e.lastAt },
            $set: { lessonId: e.lessonId },
          },
          upsert: true,
          setDefaultsOnInsert: false,
        },
      }));
      const r = await Progress.bulkWrite(ops, { ordered: false });
      return (r.upsertedCount || 0) + (r.modifiedCount || 0);
    },
  };

  const attempts = {
    async findByClient(studentId, clientId) {
      return out(await Attempt.findOne({ student: studentId, clientId }).lean());
    },

    async create(doc) {
      try {
        const created = await Attempt.create(doc);
        return out(created.toObject());
      } catch (e) {
        if (isDup(e)) throw new DuplicateKeyError("clientId");
        throw e;
      }
    },

    async update(id, set) {
      return out(await Attempt.findByIdAndUpdate(id, { $set: set }, { returnDocument: "after", lean: true, runValidators: true }));
    },

    async getById(id) {
      if (!mongoose.isValidObjectId(id)) return null;
      return out(await Attempt.findById(id).lean());
    },

    async listForStudent(studentId, { limit = 300 } = {}) {
      return (await Attempt.find({ student: studentId }).select(ATTEMPT_SUMMARY_FIELDS).sort({ startedAt: -1 }).limit(limit).lean()).map(out);
    },

    async list({ grade, kind, status, studentId, q, limit = 100, skip = 0 } = {}) {
      const filter = {};
      if (grade) filter.studentGrade = grade;
      if (kind) filter.kind = kind;
      if (status) filter.status = status;
      if (studentId) filter.student = studentId;
      if (q) {
        const rx = new RegExp(escapeRegex(q), "i");
        filter.$or = [{ studentName: rx }, { title: rx }, { school: rx }];
      }
      const [items, total] = await Promise.all([
        Attempt.find(filter).select(ATTEMPT_SUMMARY_FIELDS).sort({ startedAt: -1 }).skip(skip).limit(limit).lean(),
        Attempt.countDocuments(filter),
      ]);
      return { items: items.map(out), total };
    },

    async summaries() {
      return (await Attempt.find({}).select(ATTEMPT_SUMMARY_FIELDS).sort({ startedAt: -1 }).limit(20000).lean()).map(out);
    },

    async setSheets(id, { status, error, startedAt }) {
      const filter = { _id: id };
      if (status === "synced" && startedAt) filter.updatedAt = { $lte: startedAt };
      const set = { "sheets.status": status, "sheets.error": error ? String(error).slice(0, 300) : null };
      if (status === "synced") set["sheets.syncedAt"] = new Date();
      await Attempt.updateOne(filter, { $set: set }, { timestamps: false });
    },

    async listSheetsPending(limit = 20) {
      return (await Attempt.find({ "sheets.status": { $in: ["pending", "error"] } }).sort({ updatedAt: 1 }).limit(limit).lean()).map(out);
    },

    async markAllPending() {
      await Attempt.updateMany({}, { $set: { "sheets.status": "pending" } }, { timestamps: false });
    },
  };

  return { kind: "mongo", students, progress, attempts };
}
