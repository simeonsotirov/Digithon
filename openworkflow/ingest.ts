import { defineWorkflow } from "openworkflow";

import {
  demoDelay,
  generatePredictions,
  loadCsv,
  markRunComplete,
  markRunFailed,
  markRunRunning,
  normalizePython,
  storeNormalizedRows,
  storeRawRows,
} from "../apps/worker/src/ingestSteps.js";

type IngestInput = {
  runId: string;
};

export const ingestWorkflow = defineWorkflow(
  {
    name: "ingest-csv",
    retryPolicy: {
      initialInterval: "1s",
      backoffCoefficient: 2,
      maximumInterval: "10s",
      maximumAttempts: 3,
    },
  },
  async ({ input, step, run }: { input: IngestInput; step: any; run: { id: string } }) => {
    const workflowId = run.id;

    try {
      const ingestRun = await step.run({ name: "claim_run" }, () =>
        markRunRunning(input.runId, workflowId),
      );
      await step.run({ name: "demo_delay_after_claim" }, demoDelay);

      const rawRecords = await step.run({ name: "load_csv" }, () => loadCsv(ingestRun, workflowId));
      await step.run({ name: "demo_delay_after_load_csv" }, demoDelay);

      await step.run({ name: "store_raw_rows" }, () => storeRawRows(ingestRun, workflowId, rawRecords));
      await step.run({ name: "demo_delay_after_store_raw" }, demoDelay);

      const records = await step.run({ name: "normalize_python" }, () => normalizePython(ingestRun, workflowId));
      await step.run({ name: "demo_delay_after_normalize" }, demoDelay);

      await step.run({ name: "persist_normalized_rows" }, () =>
        storeNormalizedRows(ingestRun, workflowId, records),
      );
      await step.run({ name: "demo_delay_after_persist" }, demoDelay);

      await step.run({ name: "generate_predictions" }, () => generatePredictions(ingestRun, workflowId));
      await step.run({ name: "demo_delay_after_predictions" }, demoDelay);

      await step.run({ name: "mark_run_complete" }, () => markRunComplete(input.runId, workflowId));

      return { runId: input.runId, workflowId, normalizedCount: records.length };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await step.run({ name: "mark_run_failed" }, () => markRunFailed(input.runId, workflowId, message));
      throw error;
    }
  },
);
