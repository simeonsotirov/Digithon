import { query } from "./db.js";

export async function writeEvent(
  runId: string,
  workflowId: string,
  stepName: string,
  eventType: string,
  status: "started" | "succeeded" | "failed" | "skipped",
  payload: Record<string, unknown> = {},
) {
  await query(
    `insert into events (run_id, workflow_id, step_name, event_type, status, payload)
     values ($1::uuid, $2, $3, $4, $5, $6::jsonb)`,
    [runId, workflowId, stepName, eventType, status, JSON.stringify(payload)],
  );
}
