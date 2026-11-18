import fs from "node:fs";
import path from "node:path";
import compression from "compression";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import { createAuth } from "./middleware/auth.js";
import { studentRoutes } from "./routes/student.js";
import { teacherRoutes } from "./routes/teacher.js";
import { HttpError } from "./utils/errors.js";

/**
 * Builds the Express app. Data access, Sheets sync and configuration are injected so the same
 * app runs against MongoDB in production and against the in-memory store in tests.
 */
export function createApp({ config, store, sheets }) {
  const app = express();
  const auth = createAuth({ secret: config.jwtSecret, teacherKey: config.teacherKey, store });

  if (config.trustProxy) app.set("trust proxy", config.trustProxy);
  app.disable("x-powered-by");

  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          "default-src": ["'self'"],
          "script-src": ["'self'"],
          /* fonts are self-hosted: no third-party origins needed */
          "style-src": ["'self'", "'unsafe-inline'"],
          "font-src": ["'self'", "data:"],
          "img-src": ["'self'", "data:", "blob:"],
          "connect-src": ["'self'"],
          "object-src": ["'none'"],
          "frame-ancestors": ["'self'"],
          /* only behind HTTPS (production); on plain-HTTP setups it would break every asset request */
          "upgrade-insecure-requests": config.isProd ? [] : null,
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );
  app.use(compression());
  if (config.corsOrigins) app.use("/api", cors({ origin: config.corsOrigins }));
  if (config.env !== "test") app.use(morgan(config.isProd ? "combined" : "dev"));
  app.use(express.json({ limit: "1mb" }));

  const test = config.env === "test";
  const limiters = {
    api: rateLimit({ windowMs: 60_000, limit: test ? 10_000 : 600, standardHeaders: "draft-8", legacyHeaders: false }),
    session: rateLimit({ windowMs: 60_000, limit: test ? 10_000 : 30, standardHeaders: "draft-8", legacyHeaders: false }),
    teacher: rateLimit({ windowMs: 15 * 60_000, limit: test ? 10_000 : 10, standardHeaders: "draft-8", legacyHeaders: false }),
  };

  app.use("/api", limiters.api);
  app.get("/api/health", (_req, res) => res.json({ ok: true, db: store.kind, sheets: sheets.status().mode, time: new Date().toISOString() }));
  app.use("/api/teacher", teacherRoutes({ store, auth, sheets, config, limiters }));
  app.use("/api", studentRoutes({ store, auth, sheets, limiters }));
  app.use("/api", (_req, _res, next) => next(new HttpError(404, "not_found", "Unknown API route")));

  /* the built React app (npm run build) */
  const index = path.join(config.clientDist, "index.html");
  if (fs.existsSync(index)) {
    app.use(
      express.static(config.clientDist, {
        index: false,
        setHeaders(res, file) {
          if (file.includes(`${path.sep}assets${path.sep}`)) res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        },
      }),
    );
    app.get(/^(?!\/api\/).*/, (_req, res) => res.sendFile(index));
  }

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, _next) => {
    if (err?.type === "entity.parse.failed") err = new HttpError(400, "bad_json", "Malformed JSON body");
    if (err?.type === "entity.too.large") err = new HttpError(413, "too_large", "Request body too large");
    if (err instanceof HttpError) {
      return res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details } });
    }
    console.error(`[error] ${req.method} ${req.originalUrl}`, err);
    res.status(500).json({ error: { code: "server_error", message: "Something went wrong on the server." } });
  });

  return app;
}
