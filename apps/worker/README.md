# Digithon Worker

TypeScript worker supervisor. It schedules queued ingest runs into OpenWorkflow, then the OpenWorkflow worker runtime executes durable steps that call the Python normalizer, persist raw and normalized records idempotently, and append a workflow event timeline.

## Requirements

- Node 18+
- Poetry (the worker invokes the normalizer via `poetry run normalizer`)
- Postgres (via `docker compose up -d` from repo root)

Install Python deps once from the repo root so the normalizer is available:

```bash
poetry install
```

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | Postgres connection string |
| `OPENWORKFLOW_POSTGRES_URL` | No | Optional separate OpenWorkflow Postgres URL. Defaults to `DATABASE_URL`. |
| `OPENWORKFLOW_NAMESPACE_ID` | No | OpenWorkflow namespace. Defaults to `digithon-local`. |
| `OPENWORKFLOW_SCHEMA` | No | OpenWorkflow schema. Defaults to `openworkflow`. |
| `DEMO_STEP_DELAY_MS` | No | Ms to sleep between steps (default 0). Set to 1500 for the crash-resume demo. |

## Start

```bash
export DATABASE_URL="postgresql://postgres:postgres@localhost:55432/digithon"
npm run worker
```

## Seed a queued run

```bash
psql "$DATABASE_URL" -c "insert into ingest_runs (user_id, source_filename, status) \
  values ('00000000-0000-0000-0000-000000000001', 'db/seed/messy_sales.csv', 'queued') \
  returning id;"
```

## Workflow steps

OpenWorkflow processes each run through durable steps in order:

| # | Step | Event type emitted | Table written |
|---|---|---|---|
| 1 | claim_run | `run_claimed / succeeded` | `ingest_runs` status → running, `workflow_id` set |
| 2 | load_csv | `csv_loaded / started+succeeded` | — |
| 3 | store_raw_rows | `raw_rows_stored / started+succeeded` | `raw_data` |
| 4 | normalize_python | `normalization_started / normalization_completed` | — |
| 5 | persist_normalized_rows | `normalized_rows_stored / started+succeeded` | `normalized_data`, `stores` |
| 6 | mark_run_complete | `run_completed / succeeded` | `ingest_runs` status → completed |
| — | on error | `run_failed / failed` | `ingest_runs` status → failed |

## Idempotency

Re-running the worker on the same run ID never creates duplicate rows:

- `raw_data` — unique constraint on `(run_id, source_row_hash)`. Retries hit `ON CONFLICT DO NOTHING`.
- `normalized_data` — unique constraint on `raw_data_id`. Retries hit `ON CONFLICT DO NOTHING`.
- OpenWorkflow uses workflow leases and the scheduler uses an idempotency key of `ingest:<run_id>` so duplicate scheduling does not create duplicate workflow execution.

## Crash-Resume Demo

Kill the worker mid-run, restart it, and the run finishes with zero duplicate rows.

**Step 1 — seed a fresh queued run:**
```bash
psql "$DATABASE_URL" -c "insert into ingest_runs (user_id, source_filename, status) \
  values ('00000000-0000-0000-0000-000000000001', 'db/seed/messy_sales.csv', 'queued') \
  returning id;"
```
Note the returned `id`.

**Step 2 — start the worker with step delays:**
```bash
DEMO_STEP_DELAY_MS=1500 npm run worker
```

**Step 3 — kill it after `store_raw_rows` appears in logs, press `Ctrl+C`.**

**Step 4 — restart normally:**
```bash
npm run worker
```

**Expected result:**
- Run reaches `completed`
- `raw_data` and `normalized_data` counts are identical to a clean run (no duplicates)
- Event timeline shows the interruption then resumption

**Verify:**
```bash
RUN_ID=<id>
psql "$DATABASE_URL" -c "select status from ingest_runs where id='$RUN_ID';"
psql "$DATABASE_URL" -c "select count(*) from raw_data where run_id='$RUN_ID';"
psql "$DATABASE_URL" -c "select count(*) from normalized_data where run_id='$RUN_ID';"
psql "$DATABASE_URL" -c "select step_name, event_type, status from events where run_id='$RUN_ID' order by created_at;"
```
