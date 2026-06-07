import { query } from "./db.js";
import { ow } from "./openworkflowClient.js";
import { ingestWorkflow } from "../../../openworkflow/ingest.js";

type QueuedRun = {
  id: string;
};

export async function scheduleQueuedRuns() {
  const result = await query<QueuedRun>(
    `select id
     from ingest_runs
     where status = 'queued' and workflow_id is null
     order by created_at asc
     limit 10`,
  );

  for (const run of result.rows) {
    const handle = await ow.runWorkflow(
      ingestWorkflow.spec,
      { runId: run.id },
      { idempotencyKey: `ingest:${run.id}` },
    );
    const workflowId =
      (handle as { id?: string; runId?: string; workflowRunId?: string }).id ??
      (handle as { runId?: string }).runId ??
      (handle as { workflowRunId?: string }).workflowRunId ??
      null;

    if (workflowId) {
      await query(
        `update ingest_runs set workflow_id = coalesce(workflow_id, $2) where id = $1::uuid`,
        [run.id, workflowId],
      );
    }

    console.log(`scheduled ingest run ${run.id}${workflowId ? ` as workflow ${workflowId}` : ""}`);
  }
}

export async function runSchedulerLoop() {
  console.log("worker: scheduling queued ingest runs into OpenWorkflow");
  while (true) {
    await scheduleQueuedRuns();
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
}
