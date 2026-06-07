import { pool, query } from "./db.js";
import { processNextRun } from "./workflows/ingest.js";

async function main() {
  await query("select 1 as ok");
  console.log("worker: db connected, polling for queued runs");

  while (true) {
    const processed = await processNextRun();
    if (!processed) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
}

process.on("SIGINT", async () => {
  await pool.end();
  process.exit(0);
});

main().catch(async (error) => {
  console.error(error);
  await pool.end();
  process.exit(1);
});
