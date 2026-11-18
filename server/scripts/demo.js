/**
 * Demo mode: runs the API with the in-memory store (no MongoDB needed) and a default teacher
 * key. Data disappears when the process stops. Build the client first (npm run build) to have
 * the whole app on http://localhost:4000.
 */
process.env.DB_DRIVER = "memory";
process.env.TEACHER_KEY ||= "demo-teacher";
console.log(`[demo] teacher dashboard key: ${process.env.TEACHER_KEY}`);
await import("../src/index.js");
