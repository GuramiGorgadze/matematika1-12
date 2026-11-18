import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const here = path.dirname(fileURLToPath(import.meta.url));

/* server/.env (variables already set in the environment win) */
const envFile = path.resolve(here, "../../.env");
if (fs.existsSync(envFile) && typeof process.loadEnvFile === "function") process.loadEnvFile(envFile);

const schema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  TRUST_PROXY: z.string().optional(),

  /* data */
  DB_DRIVER: z.enum(["mongo", "memory"]).default("mongo"),
  MONGODB_URI: z.string().default("mongodb://127.0.0.1:27017/matematika"),
  /* DNS servers for mongodb+srv:// lookups, e.g. "8.8.8.8,1.1.1.1" (fixes "querySrv ECONNREFUSED" on some Windows/router setups) */
  DNS_SERVERS: z.string().optional(),

  /* auth */
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters").optional(),
  TEACHER_KEY: z.string().min(6, "TEACHER_KEY must be at least 6 characters").optional(),

  /* web */
  CORS_ORIGIN: z.string().optional(),
  CLIENT_DIST: z.string().optional(),
  TIMEZONE: z.string().default("Asia/Tbilisi"),

  /* Google Sheets mirror */
  SHEETS_MODE: z
    .string()
    .default("off")
    .transform((v) => v.trim().toLowerCase().replace(/_/g, "-"))
    .pipe(z.enum(["off", "service-account", "apps-script"])),
  GOOGLE_SHEET_ID: z.string().optional(),
  GOOGLE_SERVICE_ACCOUNT_EMAIL: z.string().optional(),
  GOOGLE_PRIVATE_KEY: z.string().optional(),
  SHEETS_WEBHOOK_URL: z.string().url().optional(),
  SHEETS_WEBHOOK_SECRET: z.string().optional(),
  SHEETS_SYNC_INTERVAL_SEC: z.coerce.number().int().min(10).default(60),
});

function load() {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const lines = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Invalid environment configuration:\n${lines}`);
  }
  const e = parsed.data;
  const isProd = e.NODE_ENV === "production";

  let jwtSecret = e.JWT_SECRET;
  if (!jwtSecret) {
    if (isProd) throw new Error("JWT_SECRET is required in production.");
    jwtSecret = crypto.randomBytes(32).toString("hex");
    if (e.NODE_ENV !== "test") console.warn("[config] JWT_SECRET not set: using a random secret (sessions reset on restart).");
  }

  if (e.SHEETS_MODE === "service-account" && !(e.GOOGLE_SHEET_ID && e.GOOGLE_SERVICE_ACCOUNT_EMAIL && e.GOOGLE_PRIVATE_KEY)) {
    throw new Error("SHEETS_MODE=service-account needs GOOGLE_SHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY.");
  }
  if (e.SHEETS_MODE === "apps-script" && !e.SHEETS_WEBHOOK_URL) {
    throw new Error("SHEETS_MODE=apps-script needs SHEETS_WEBHOOK_URL (the deployed Apps Script web app URL).");
  }

  return {
    env: e.NODE_ENV,
    isProd,
    port: e.PORT,
    trustProxy: e.TRUST_PROXY ? (/^\d+$/.test(e.TRUST_PROXY) ? Number(e.TRUST_PROXY) : e.TRUST_PROXY === "true") : false,
    db: { driver: e.DB_DRIVER, uri: e.MONGODB_URI, dnsServers: (e.DNS_SERVERS || "").split(",").map((s) => s.trim()).filter(Boolean) },
    jwtSecret,
    teacherKey: e.TEACHER_KEY || null,
    corsOrigins: e.CORS_ORIGIN ? e.CORS_ORIGIN.split(",").map((s) => s.trim()).filter(Boolean) : null,
    clientDist: e.CLIENT_DIST ? path.resolve(e.CLIENT_DIST) : path.resolve(here, "../../../client/dist"),
    timezone: e.TIMEZONE,
    sheets: {
      mode: e.SHEETS_MODE,
      sheetId: e.GOOGLE_SHEET_ID,
      email: e.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      /* keys pasted into .env usually carry literal "\n" sequences */
      privateKey: e.GOOGLE_PRIVATE_KEY ? e.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n") : undefined,
      webhookUrl: e.SHEETS_WEBHOOK_URL,
      webhookSecret: e.SHEETS_WEBHOOK_SECRET || "",
      intervalMs: e.SHEETS_SYNC_INTERVAL_SEC * 1000,
    },
  };
}

export const config = load();
