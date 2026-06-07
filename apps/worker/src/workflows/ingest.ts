import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "csv-parse/sync";
import type pg from "pg";

import { pool, query } from "../db.js";
import { runNormalizer, type NormalizedRecord } from "../normalizer.js";

type IngestRun = {
  id: string;
  user_id: string;
  source_filename: string;
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../../..");

async function event(
  client: pg.PoolClient,
  runId: string,
  workflowId: string,
  stepName: string,
  eventType: string,
  status: "started" | "succeeded" | "failed" | "skipped",
  payload: Record<string, unknown> = {},
) {
  await client.query(
    `insert into events (run_id, workflow_id, step_name, event_type, status, payload)
     values ($1, $2, $3, $4, $5, $6::jsonb)`,
    [runId, workflowId, stepName, eventType, status, JSON.stringify(payload)],
  );
}

async function claimRun(): Promise<IngestRun | null> {
  const result = await query<IngestRun>(
    `update ingest_runs
     set status = 'running', started_at = coalesce(started_at, now()), error_message = null
     where id = (
       select id from ingest_runs
       where status in ('queued', 'running')
       order by created_at asc
       limit 1
       for update skip locked
     )
     returning id, user_id, source_filename`,
  );
  return result.rows[0] ?? null;
}

async function loadCsv(sourceFilename: string) {
  const absolutePath = path.isAbsolute(sourceFilename)
    ? sourceFilename
    : path.join(repoRoot, sourceFilename);
  const contents = await fs.readFile(absolutePath, "utf8");
  return parse(contents, { columns: true, skip_empty_lines: true }) as Record<string, string>[];
}

async function storeRawRows(client: pg.PoolClient, run: IngestRun, rows: Record<string, string>[]) {
  for (const [index, rawRow] of rows.entries()) {
    const normalizedHash = JSON.stringify(rawRow, Object.keys(rawRow).sort());
    await client.query(
      `insert into raw_data (user_id, run_id, source_filename, source_row_number, source_row_hash, raw_payload)
       values ($1, $2, $3, $4, encode(digest($5, 'sha256'), 'hex'), $6::jsonb)
       on conflict (run_id, source_row_hash) do nothing`,
      [run.user_id, run.id, run.source_filename, index + 1, normalizedHash, JSON.stringify(rawRow)],
    );
  }
}

async function storeNormalizedRows(
  client: pg.PoolClient,
  run: IngestRun,
  records: NormalizedRecord[],
) {
  for (const record of records) {
    const raw = await client.query<{ id: string }>(
      `select id from raw_data where run_id = $1 and source_row_number = $2 limit 1`,
      [run.id, record.source_row_number],
    );
    const rawDataId = raw.rows[0]?.id;
    if (!rawDataId) {
      continue;
    }

    const store = await client.query<{ id: string }>(
      `insert into stores (canonical_name, display_name)
       values ($1, initcap(replace($1, '_', ' ')))
       on conflict (canonical_name) do update set display_name = excluded.display_name
       returning id`,
      [record.canonical_store],
    );

    await client.query(
      `insert into normalized_data (
         raw_data_id, run_id, store_id, product_name, quantity, price, sale_date,
         normalized_payload, quality_notes, reorder_signal
       ) values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb, $10)
       on conflict (raw_data_id) do update set
         store_id = excluded.store_id,
         product_name = excluded.product_name,
         quantity = excluded.quantity,
         price = excluded.price,
         sale_date = excluded.sale_date,
         normalized_payload = excluded.normalized_payload,
         quality_notes = excluded.quality_notes,
         reorder_signal = excluded.reorder_signal`,
      [
        rawDataId,
        run.id,
        store.rows[0].id,
        record.product_name,
        record.quantity,
        record.price,
        record.sale_date,
        JSON.stringify(record.normalized_payload),
        JSON.stringify(record.quality_notes),
        record.reorder_signal,
      ],
    );
  }
}

export async function processNextRun() {
  const run = await claimRun();
  if (!run) {
    return false;
  }

  const workflowId = `ingest-${run.id}`;
  const client = await pool.connect();

  try {
    await event(client, run.id, workflowId, "claim_run", "run_claimed", "succeeded");
    await event(client, run.id, workflowId, "load_csv", "csv_loaded", "started");
    const csvRows = await loadCsv(run.source_filename);
    await event(client, run.id, workflowId, "load_csv", "csv_loaded", "succeeded", {
      row_count: csvRows.length,
    });

    await event(client, run.id, workflowId, "store_raw_rows", "raw_rows_stored", "started");
    await storeRawRows(client, run, csvRows);
    await event(client, run.id, workflowId, "store_raw_rows", "raw_rows_stored", "succeeded");

    await event(client, run.id, workflowId, "normalize_python", "normalization_started", "started");
    const normalized = await runNormalizer(run.source_filename);
    await event(client, run.id, workflowId, "normalize_python", "normalization_completed", "succeeded", {
      row_count: normalized.length,
    });

    await event(client, run.id, workflowId, "persist_normalized_rows", "normalized_rows_stored", "started");
    await storeNormalizedRows(client, run, normalized);
    await event(client, run.id, workflowId, "persist_normalized_rows", "normalized_rows_stored", "succeeded");

    await client.query(
      `update ingest_runs set status = 'completed', completed_at = now() where id = $1`,
      [run.id],
    );
    await event(client, run.id, workflowId, "mark_run_complete", "run_completed", "succeeded");
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await client.query(
      `update ingest_runs set status = 'failed', completed_at = now(), error_message = $2 where id = $1`,
      [run.id, message],
    );
    await event(client, run.id, workflowId, "run_failed", "run_failed", "failed", { error: message });
    throw error;
  } finally {
    client.release();
  }
}
