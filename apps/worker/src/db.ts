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
