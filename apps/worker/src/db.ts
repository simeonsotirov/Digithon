import pg from "pg";

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}

export const pool = new Pool({ connectionString });

export async function query<T extends pg.QueryResultRow>(sql: string, params: unknown[] = []) {
  return pool.query<T>(sql, params);
}

export type IngestRun = {
  id: string;
  user_id: string;
  source_filename: string;
};

export async function claimRun(): Promise<IngestRun | null> {
  const result = await query<IngestRun>(
    `update ingest_runs
     set status = 'running', started_at = coalesce(started_at, now()), error_message = null
     where id = (
       select id from ingest_runs
       where status = 'queued'
       order by created_at asc
       limit 1
       for update skip locked
     )
     returning id, user_id, source_filename`,
  );
  return result.rows[0] ?? null;
}

export async function storeRawRows(
  run: IngestRun,
  records: { source_row_number: number; source_row_hash: string; [key: string]: unknown }[],
) {
  for (const record of records) {
    await query(
      `insert into raw_data (user_id, run_id, source_filename, source_row_number, source_row_hash, raw_payload)
       values ($1::uuid, $2::uuid, $3, $4, $5, $6::jsonb)
       on conflict (run_id, source_row_hash) do nothing`,
      [run.user_id, run.id, run.source_filename, record.source_row_number, record.source_row_hash, JSON.stringify(record)],
    );
  }
}

export async function storeNormalizedRows(
  runId: string,
  records: {
    source_row_hash: string;
    canonical_store: string;
    product_name: string;
    quantity: number;
    price: number;
    sale_date: string;
    normalized_payload: Record<string, unknown>;
    quality_notes: string[];
    reorder_signal: string;
  }[],
) {
  for (const record of records) {
    const rawResult = await query<{ id: string }>(
      `select id from raw_data where run_id = $1::uuid and source_row_hash = $2 limit 1`,
      [runId, record.source_row_hash],
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
    const storeId = storeResult.rows[0].id;

    await query(
      `insert into normalized_data
         (raw_data_id, run_id, store_id, product_name, quantity, price, sale_date,
          normalized_payload, quality_notes, reorder_signal)
       values ($1::uuid, $2::uuid, $3::uuid, $4, $5, $6, $7, $8::jsonb, $9::jsonb, $10)
       on conflict (raw_data_id) do nothing`,
      [
        rawDataId, runId, storeId,
        record.product_name, record.quantity, record.price, record.sale_date,
        JSON.stringify(record.normalized_payload),
        JSON.stringify(record.quality_notes),
        record.reorder_signal,
      ],
    );
  }
}
