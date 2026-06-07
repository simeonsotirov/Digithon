import { pool, query, claimRun } from "./db.js";
import { writeEvent } from "./events.js";
import { runNormalizer } from "./normalizer.js";
import { processNextRun } from "./workflows/ingest.js";

async function main() {
  await query("select 1 as ok");
  console.log("worker: db connected");

  const records = await runNormalizer("db/seed/messy_sales.csv");
  console.log(`worker: normalizer returned ${records.length} records`);

  const run = await claimRun();
  if (run) {
    console.log(`worker: claimed run ${run.id}`);
    await writeEvent(run.id, "claim_run", "run_claimed", "succeeded", { source: "worker" });
  } else {
    console.log("worker: no queued runs");
  }

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
