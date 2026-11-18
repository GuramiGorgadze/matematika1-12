import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { forbidden, unauthorized } from "../utils/errors.js";

export function createAuth({ secret, teacherKey, store }) {
  const sign = (payload, expiresIn) => jwt.sign(payload, secret, { expiresIn, issuer: "matematika" });

  function readToken(req) {
    const h = req.get("authorization") || "";
    const m = /^Bearer\s+(.+)$/i.exec(h);
    if (!m) return null;
    try {
      return jwt.verify(m[1], secret, { issuer: "matematika" });
    } catch {
      return null;
    }
  }

  return {
    studentToken: (id) => sign({ sub: id, role: "student" }, "365d"),
    teacherToken: () => sign({ role: "teacher" }, "12h"),

    /** constant-time comparison of the teacher key */
    checkTeacherKey(key) {
      if (!teacherKey) return false;
      const a = crypto.createHash("sha256").update(String(key ?? "")).digest();
      const b = crypto.createHash("sha256").update(teacherKey).digest();
      return crypto.timingSafeEqual(a, b);
    },

    requireStudent: async (req, _res, next) => {
      const t = readToken(req);
      if (!t || t.role !== "student") return next(unauthorized());
      const s = await store.students.getById(t.sub);
      if (!s) return next(unauthorized("Session expired"));
      req.student = s;
      next();
    },

    requireTeacher: (req, _res, next) => {
      const t = readToken(req);
      if (!t) return next(unauthorized());
      if (t.role !== "teacher") return next(forbidden("Teacher access only"));
      next();
    },
  };
}
