import { type ChildProcess, spawn } from "node:child_process";

import { pool, query } from "./db.js";
import { runSchedulerLoop } from "./scheduler.js";

let cli: ChildProcess | null = null;

async function main() {
  await query("select 1 as ok");
  console.log("worker: db connected");

  cli = spawn("npx", ["@openworkflow/cli", "worker", "start"], {
    cwd: process.cwd(),
    env: process.env,
    stdio: "inherit",
  });

  cli.on("exit", async (code) => {
    await pool.end();
    process.exit(code ?? 1);
  });

  await runSchedulerLoop();
}

process.on("SIGINT", async () => {
  cli?.kill("SIGINT");
  await pool.end();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  cli?.kill("SIGTERM");
  await pool.end();
  process.exit(0);
});

main().catch(async (error) => {
  console.error(error);
  await pool.end();
  process.exit(1);
});
