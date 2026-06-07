# MVP Work Split - 4 Developers

This split is optimized for speed. Each developer owns one lane, but the interfaces are fixed early so everyone can work in parallel.

For step-by-step implementation tasks, use `IMPLEMENTATION_TASKS.md`. It includes detailed file-level tasks, acceptance criteria, smoke tests, and official documentation links.

## Shared MVP Goal

Build the end-to-end demo path:

```text
messy CSV -> queued ingest run -> durable OpenWorkflow worker -> Python normalizer -> Postgres -> FastAPI reads -> React dashboard
```

The demo is successful when a judge can see:

1. A messy CSV ingested from the dashboard or seeded file.
2. Raw rows and normalized rows persisted in Postgres.
3. Workflow events showing every major step.
4. A dashboard with KPIs, normalized records, filters, and run status.
5. A worker crash/restart that resumes or safely retries without duplicate rows.

## Developer A - Database + API

Owns `apps/api` and `db/migrations`.

### Responsibilities

1. Create the SQL schema.
2. Build FastAPI app structure.
3. Add Pydantic request/response models.
4. Implement ingest-run creation.
5. Implement dashboard and run/event read endpoints.
6. Provide stable JSON contracts for frontend and worker.

### Deliverables

1. `db/migrations/001_init.sql`
2. `apps/api/app/main.py`
3. `apps/api/app/db.py`
4. `apps/api/app/schemas.py`
5. `apps/api/app/routes.py`
6. `apps/api/requirements.txt`

### MVP Endpoints

```text
GET /health
POST /ingest
GET /runs
GET /runs/{run_id}
GET /events?run_id=...
GET /dashboard
```

### Done When

1. API starts locally with `uvicorn app.main:app --reload`.
2. `POST /ingest` creates an `ingest_runs` row with `status = 'queued'`.
3. Read endpoints return real Postgres data.
4. Frontend can build against stable response shapes.

## Developer B - Python Normalizer

Owns `packages/normalizer` and demo CSV quality.

### Responsibilities

1. Build the normalization engine.
2. Parse messy dates, prices, quantities, store names, and product names.
3. Generate stable source-row hashes.
4. Emit normalized records and quality notes.
5. Add deterministic stockout/reorder signals.
6. Provide a CLI or callable script the worker can run.

### Deliverables

1. `packages/normalizer/normalize.py`
2. `packages/normalizer/requirements.txt`
3. `packages/normalizer/README.md`
4. `db/seed/messy_sales.csv`
5. Optional `db/seed/make_messy_data.py`

### Output Contract

The normalizer should output JSON records shaped like:

```json
{
  "source_row_number": 1,
  "source_row_hash": "stable-hash",
  "canonical_store": "downtown",
  "product_name": "coffee beans",
  "quantity": 3,
  "price": 12.99,
  "sale_date": "2026-06-07",
  "quality_notes": ["normalized_store_name", "parsed_price_symbol"],
  "reorder_signal": "ok"
}
```

### Done When

1. The normalizer runs against `db/seed/messy_sales.csv`.
2. It prints or writes JSON consumable by the worker.
3. It handles known messy cases without crashing.
4. It includes at least one guaranteed stockout/reorder signal for the demo.

## Developer C - OpenWorkflow Worker

Owns `apps/worker`.

### Responsibilities

1. Set up the TypeScript worker.
2. Claim queued ingest runs from Postgres.
3. Execute durable workflow steps.
4. Call the Python normalizer.
5. Persist raw and normalized rows idempotently.
6. Emit events for every major step.
7. Own the crash-resume demo path.

### Deliverables

1. `apps/worker/package.json`
2. `apps/worker/src/index.ts`
3. `apps/worker/src/db.ts`
4. `apps/worker/src/workflows/ingest.ts`
5. `apps/worker/src/normalizer.ts`

### Workflow Steps

```text
claim_run
load_csv
store_raw_rows
normalize_python
persist_normalized_rows
emit_summary_events
mark_run_complete
```

### Done When

1. Worker starts with `npm run worker`.
2. Worker claims a queued run and marks it `running`.
3. Worker writes event rows for each step.
4. Worker writes raw and normalized data.
5. Re-running after a crash does not duplicate rows.

## Developer D - React Dashboard

Owns `apps/web`.

### Responsibilities

1. Set up Vite React.
2. Add React Query API hooks.
3. Build the single-screen dashboard.
4. Add ingest trigger/upload flow.
5. Render KPIs, table, filters, run status, and event timeline.
6. Polish the judge-facing demo flow.

### Deliverables

1. `apps/web/package.json`
2. `apps/web/src/main.tsx`
3. `apps/web/src/App.tsx`
4. `apps/web/src/api.ts`
5. `apps/web/src/components/*`

### Required UI

1. Ingest button or upload control.
2. Current run status.
3. KPI cards.
4. Store filter.
5. Normalized records table.
6. Workflow events timeline.

### Done When

1. Web app starts with `npm run dev`.
2. Dashboard reads from FastAPI only.
3. React Query refetches after ingest.
4. User can understand the workflow state from the UI.

## Integration Contracts

Agree on these early and do not churn them unless required.

### Database Tables

```text
users
ingest_runs
stores
raw_data
normalized_data
events
```

### Run Statuses

```text
queued
running
completed
failed
```

### Event Statuses

```text
started
succeeded
failed
skipped
```

### Reorder Signals

```text
ok
watch
reorder
stockout
```

## Timeline

| Time | Checkpoint | Expected State |
|---|---|---|
| 0:00-0:30 | Setup | Repo structure, DB URL, API/web/worker skeletons. |
| 0:30-1:30 | Contracts | Schema, API response shapes, normalizer output locked. |
| 1:30-3:00 | Core Build | API writes runs, normalizer works, worker can claim runs, UI has static shell. |
| 3:00-4:30 | Integration | Worker writes DB data, API reads it, UI renders it. |
| 4:30-5:30 | Demo Path | Full ingest from UI to dashboard works. |
| 5:30-6:30 | Crash Demo | Kill/restart worker, events show safe resume/retry. |
| 6:30-7:00 | Freeze | No new features; fix bugs and rehearse. |

## Coordination Rules

1. Developer A owns schema changes. Everyone else requests changes through A.
2. Developer B owns normalizer output shape. Worker adapts to that contract.
3. Developer C owns durable execution and idempotency.
4. Developer D owns dashboard usability and demo clarity.
5. If blocked for more than 10 minutes, switch to mocked data at the boundary and keep moving.
6. Hard cut: if integration is behind, drop upload and use a seeded CSV path.
7. Do not add auth, realtime, ML, or multi-page navigation before the core demo works.

## First Tasks To Start Now

### Developer A

Create `db/migrations/001_init.sql`, then implement `POST /ingest` and `GET /runs`.

### Developer B

Create `db/seed/messy_sales.csv` and make `normalize.py` output JSON for it.

### Developer C

Create the worker skeleton and a loop that can claim one queued run.

### Developer D

Create the dashboard shell and wire React Query to mocked API responses until Developer A endpoints are live.
