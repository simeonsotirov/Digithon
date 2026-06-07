import { query } from "./db.js";

export async function writeEvent(
  runId: string,
  stepName: string,
  eventType: string,
  status: "started" | "succeeded" | "failed" | "skipped",
  payload: Record<string, unknown> = {},
) {
  await query(
    `insert into events (run_id, workflow_id, step_name, event_type, status, payload)
     values ($1::uuid, $1::text, $2, $3, $4, $5::jsonb)`,
    [runId, stepName, eventType, status, JSON.stringify(payload)],
  );
}
