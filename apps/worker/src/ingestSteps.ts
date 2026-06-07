import { readFile } from "node:fs/promises";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { parse } from "csv-parse/sync";

import { query, type IngestRun } from "./db.js";
import { writeEvent } from "./events.js";
import { runNormalizer, type NormalizedRecord } from "./normalizer.js";

const seededSources = new Set(["db/seed/messy_sales.csv"]);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../..");

function assertAllowedSource(sourceFilename: string) {
  if (!seededSources.has(sourceFilename)) {
    throw new Error(`Unsupported ingest source: ${sourceFilename}`);
  }
}

export type RawCsvRecord = {
  source_row_number: number;
  source_row_hash: string;
  raw_payload: Record<string, string>;
};

function stableJson(value: Record<string, string>) {
  const sorted = Object.keys(value)
    .sort()
    .reduce<Record<string, string>>((acc, key) => {
      acc[key] = value[key];
      return acc;
    }, {});
  return JSON.stringify(sorted);
}

function stableRowHash(row: Record<string, string>) {
  return crypto.createHash("sha256").update(stableJson(row)).digest("hex");
}

export async function markRunRunning(runId: string, workflowId: string): Promise<IngestRun> {
  const result = await query<IngestRun>(
    `update ingest_runs
     set status = 'running', started_at = coalesce(started_at, now()), error_message = null,
         workflow_id = coalesce(workflow_id, $2)
     where id = $1::uuid and status in ('queued', 'running')
     returning id, user_id, source_filename`,
    [runId, workflowId],
  );

  const run = result.rows[0];
  if (!run) {
    throw new Error(`Run ${runId} is not queued or running`);
  }

  assertAllowedSource(run.source_filename);
  await writeEvent(run.id, workflowId, "claim_run", "run_claimed", "succeeded");
  return run;
}

export async function loadCsv(run: IngestRun, workflowId: string): Promise<RawCsvRecord[]> {
  await writeEvent(run.id, workflowId, "load_csv", "csv_loaded", "started");
  const input = await readFile(path.resolve(repoRoot, run.source_filename), "utf8");
  const rows = parse(input, { columns: true, skip_empty_lines: true }) as Record<string, string>[];
  const seen = new Set<string>();
  const records = rows.flatMap((row, index) => {
    const sourceRowHash = stableRowHash(row);
    if (seen.has(sourceRowHash)) return [];
    seen.add(sourceRowHash);
    return [{ source_row_number: index + 1, source_row_hash: sourceRowHash, raw_payload: row }];
  });
  await writeEvent(run.id, workflowId, "load_csv", "csv_loaded", "succeeded", {
    row_count: records.length,
  });
  return records;
}

export async function storeRawRows(
  run: IngestRun,
  workflowId: string,
  records: RawCsvRecord[],
) {
  await writeEvent(run.id, workflowId, "store_raw_rows", "raw_rows_stored", "started");
  for (const record of records) {
    await query(
      `insert into raw_data (user_id, run_id, source_filename, source_row_number, source_row_hash, raw_payload)
       values ($1::uuid, $2::uuid, $3, $4, $5, $6::jsonb)
       on conflict (run_id, source_row_hash) do nothing`,
      [run.user_id, run.id, run.source_filename, record.source_row_number, record.source_row_hash, JSON.stringify(record.raw_payload)],
    );
  }
  await writeEvent(run.id, workflowId, "store_raw_rows", "raw_rows_stored", "succeeded", {
    count: records.length,
  });
}

export async function normalizePython(
  run: IngestRun,
  workflowId: string,
): Promise<NormalizedRecord[]> {
  await writeEvent(run.id, workflowId, "normalize_python", "normalization_started", "started");
  const records = await runNormalizer(run.source_filename);
  await writeEvent(run.id, workflowId, "normalize_python", "normalization_completed", "succeeded", {
    row_count: records.length,
  });
  return records;
}

export async function storeNormalizedRows(
  run: IngestRun,
  workflowId: string,
  records: NormalizedRecord[],
) {
  await writeEvent(run.id, workflowId, "persist_normalized_rows", "normalized_rows_stored", "started");
  for (const record of records) {
    const rawResult = await query<{ id: string }>(
      `select id from raw_data where run_id = $1::uuid and source_row_hash = $2 limit 1`,
      [run.id, record.source_row_hash],
    );
    const rawDataId = rawResult.rows[0]?.id;
    if (!rawDataId) continue;

    const storeResult = await query<{ id: string }>(
      `insert into stores (canonical_name, display_name)
       values ($1, initcap(replace($1, '_', ' ')))
       on conflict (canonical_name) do update set display_name = excluded.display_name
       returning id`,
      [record.canonical_store],
    );

    await query(
      `insert into normalized_data (
         raw_data_id, run_id, store_id, product_name, quantity, price, sale_date,
         normalized_payload, quality_notes, reorder_signal
       ) values ($1::uuid, $2::uuid, $3::uuid, $4, $5, $6, $7, $8::jsonb, $9::jsonb, $10)
       on conflict (raw_data_id) do nothing`,
      [
        rawDataId, run.id, storeResult.rows[0].id,
        record.product_name, record.quantity, record.price, record.sale_date,
        JSON.stringify(record.normalized_payload),
        JSON.stringify(record.quality_notes),
        record.reorder_signal,
      ],
    );
  }
  await writeEvent(run.id, workflowId, "persist_normalized_rows", "normalized_rows_stored", "succeeded", {
    count: records.length,
  });
}

export async function markRunComplete(runId: string, workflowId: string) {
  await query(
    `update ingest_runs
     set status = 'completed', completed_at = now(), error_message = null, workflow_id = coalesce(workflow_id, $2)
     where id = $1::uuid`,
    [runId, workflowId],
  );
  await writeEvent(runId, workflowId, "mark_run_complete", "run_completed", "succeeded");
}

export async function markRunFailed(runId: string, workflowId: string, message: string) {
  await query(
    `update ingest_runs
     set status = 'failed', completed_at = now(), error_message = $2, workflow_id = coalesce(workflow_id, $3)
     where id = $1::uuid`,
    [runId, message, workflowId],
  );
  await writeEvent(runId, workflowId, "run_failed", "run_failed", "failed", { error: message });
}

export async function demoDelay() {
  const stepDelay = parseInt(process.env.DEMO_STEP_DELAY_MS ?? "0", 10);
  if (stepDelay > 0) {
    await new Promise((resolve) => setTimeout(resolve, stepDelay));
  }
}
