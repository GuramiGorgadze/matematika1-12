import { createApp } from "./app.js";
import { config } from "./config/env.js";
import { createMemoryStore } from "./data/memory.js";
import { connectMongo, createMongoStore, disconnectMongo } from "./data/mongo.js";
import { createAdapter, createSheetsSync } from "./services/sheets/sync.js";

async function main() {
  let store;
  if (config.db.driver === "memory") {
    store = createMemoryStore();
    console.warn("[db] DB_DRIVER=memory — demo mode, data is kept in memory and lost on restart.");
  } else {
    await connectMongo(config.db.uri, { dnsServers: config.db.dnsServers });
    store = createMongoStore();
    console.log(`[db] connected to MongoDB (${config.db.uri.replace(/\/\/[^@]*@/, "//***@")})`);
  }

  const sheets = createSheetsSync({
    store,
    adapter: createAdapter(config.sheets),
    intervalMs: config.sheets.intervalMs,
    timezone: config.timezone,
  });
  sheets.start();
  console.log(`[sheets] mode: ${sheets.mode}`);
  if (!config.teacherKey) console.warn("[teacher] TEACHER_KEY not set — the teacher dashboard is disabled.");

  const app = createApp({ config, store, sheets });
  const server = app.listen(config.port, () => console.log(`[http] listening on http://localhost:${config.port}`));

  const shutdown = async (signal) => {
    console.log(`[http] ${signal} received, shutting down`);
    sheets.stop();
    server.close();
    await sheets.run().catch(() => {}); /* push what is pending */
    if (store.kind === "mongo") await disconnectMongo();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((e) => {
  console.error("[fatal]", e.message);
  process.exit(1);
});
