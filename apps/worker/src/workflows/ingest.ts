import { query, type IngestRun } from "../db.js";
import { writeEvent } from "../events.js";
import { runNormalizer } from "../normalizer.js";

const stepDelay = parseInt(process.env.DEMO_STEP_DELAY_MS ?? "0", 10);
const sleep = () => stepDelay > 0 ? new Promise((r) => setTimeout(r, stepDelay)) : Promise.resolve();

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

async function storeRawRows(run: IngestRun, records: { source_row_number: number; source_row_hash: string; [key: string]: unknown }[]) {
  for (const record of records) {
    await query(
      `insert into raw_data (user_id, run_id, source_filename, source_row_number, source_row_hash, raw_payload)
       values ($1::uuid, $2::uuid, $3, $4, $5, $6::jsonb)
       on conflict (run_id, source_row_hash) do nothing`,
      [run.user_id, run.id, run.source_filename, record.source_row_number, record.source_row_hash, JSON.stringify(record)],
    );
  }
}

async function storeNormalizedRows(run: IngestRun, records: {
  source_row_hash: string;
  canonical_store: string;
  product_name: string;
  quantity: number;
  price: number;
  sale_date: string;
  normalized_payload: Record<string, unknown>;
  quality_notes: string[];
  reorder_signal: string;
}[]) {
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
}

export async function processNextRun(): Promise<boolean> {
  const run = await claimRun();
  if (!run) return false;

  try {
    await writeEvent(run.id, "claim_run", "run_claimed", "succeeded");
    await sleep();

    await writeEvent(run.id, "load_csv", "csv_loaded", "started");
    const records = await runNormalizer(run.source_filename);
    await writeEvent(run.id, "load_csv", "csv_loaded", "succeeded", { row_count: records.length });
    await sleep();

    await writeEvent(run.id, "store_raw_rows", "raw_rows_stored", "started");
    await storeRawRows(run, records);
    await writeEvent(run.id, "store_raw_rows", "raw_rows_stored", "succeeded", { count: records.length });
    await sleep();

    await writeEvent(run.id, "normalize_python", "normalization_started", "started");
    await writeEvent(run.id, "normalize_python", "normalization_completed", "succeeded", { row_count: records.length });
    await sleep();

    await writeEvent(run.id, "persist_normalized_rows", "normalized_rows_stored", "started");
    await storeNormalizedRows(run, records);
    await writeEvent(run.id, "persist_normalized_rows", "normalized_rows_stored", "succeeded", { count: records.length });
    await sleep();

    await query(
      `update ingest_runs set status = 'completed', completed_at = now() where id = $1::uuid`,
      [run.id],
    );
    await writeEvent(run.id, "mark_run_complete", "run_completed", "succeeded");

    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await query(
      `update ingest_runs set status = 'failed', completed_at = now(), error_message = $2 where id = $1::uuid`,
      [run.id, message],
    );
    await writeEvent(run.id, "run_failed", "run_failed", "failed", { error: message });
    throw error;
  }
}
