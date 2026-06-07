# Detailed MVP Implementation Tasks

This file turns the MVP architecture into concrete build tasks for four developers. Each developer should use official documentation first. If a blog post, tutorial, or AI answer conflicts with official docs, follow the official docs.

## Official Documentation Index

Use these links while implementing:

| Technology | Official docs |
|---|---|
| FastAPI | https://fastapi.tiangolo.com/ |
| Pydantic | https://docs.pydantic.dev/ |
| PostgreSQL | https://www.postgresql.org/docs/ |
| Supabase Postgres | https://supabase.com/docs/guides/database/postgres |
| Python `csv` | https://docs.python.org/3/library/csv.html |
| Python `json` | https://docs.python.org/3/library/json.html |
| Python `argparse` | https://docs.python.org/3/library/argparse.html |
| OpenWorkflow | https://openworkflow.dev |
| OpenWorkflow GitHub | https://github.com/openworkflowdev/openworkflow |
| Node.js `child_process` | https://nodejs.org/api/child_process.html |
| Vite | https://vite.dev/guide/ |
| React | https://react.dev/ |
| TanStack Query | https://tanstack.com/query/latest |
| Zustand | https://zustand.docs.pmnd.rs/ |

## Shared Rules For Everyone

1. Keep the MVP path simple: messy CSV -> queued run -> worker -> normalizer -> Postgres -> FastAPI reads -> React dashboard.
2. Use snake_case for database columns and API JSON fields.
3. Keep `DATABASE_URL` as the shared database connection environment variable.
4. Do not add auth, RLS, realtime, ML, object storage, Kubernetes, or multi-page navigation before the end-to-end demo works.
5. If blocked for more than 10 minutes, mock the boundary and keep moving.
6. Prefer official docs listed above over random web examples.
7. Commit small vertical slices. Do not wait until the entire lane is complete.
8. Coordinate schema changes through Developer A.
9. Coordinate normalizer output changes through Developer B.
10. Coordinate workflow step and idempotency changes through Developer C.
11. Coordinate UI response-shape assumptions through Developer D.

## Shared Contracts

These contracts should be considered stable unless the team explicitly agrees to change them.

### Run Status Values

```text
queued
running
completed
failed
```

### Event Status Values

```text
started
succeeded
failed
skipped
```

### Event Types

```text
run_created
run_claimed
csv_loaded
raw_rows_stored
normalization_started
normalization_completed
normalized_rows_stored
run_completed
run_failed
```

### Reorder Signal Values

```text
ok
watch
reorder
stockout
```

### Normalizer JSON Output Shape

```json
{
  "source_row_number": 1,
  "source_row_hash": "stable-hash",
  "canonical_store": "downtown",
  "product_name": "coffee beans",
  "quantity": 3,
  "price": 12.99,
  "sale_date": "2026-06-07",
  "normalized_payload": {
    "original_store": "Downtown Store",
    "canonical_store": "downtown"
  },
  "quality_notes": ["normalized_store_name", "parsed_price_symbol"],
  "reorder_signal": "ok"
}
```

### Dashboard Response Shape

```json
{
  "kpis": {
    "total_raw_rows": 0,
    "total_normalized_rows": 0,
    "quality_issue_count": 0,
    "reorder_count": 0,
    "stockout_count": 0
  },
  "runs": [],
  "stores": [],
  "records": [],
  "events": []
}
```

## Developer A - Database And FastAPI

Developer A owns `db/migrations` and `apps/api`.

Primary official docs:

1. FastAPI: https://fastapi.tiangolo.com/
2. Pydantic: https://docs.pydantic.dev/
3. PostgreSQL: https://www.postgresql.org/docs/
4. Supabase Postgres if used: https://supabase.com/docs/guides/database/postgres

### A1 - Create The API App Skeleton

Files to create:

```text
apps/api/app/__init__.py
apps/api/app/main.py
apps/api/app/db.py
apps/api/app/schemas.py
apps/api/app/routes.py
apps/api/requirements.txt
apps/api/README.md
```

Tasks:

1. Add `fastapi`, `uvicorn`, `pydantic`, and a Postgres driver to `requirements.txt`.
2. Read FastAPI official docs for app creation, path operations, request bodies, and response models.
3. Read Pydantic official docs for `BaseModel`, field validation, and JSON serialization.
4. Create `main.py` with a FastAPI app and route registration.
5. Add `GET /health` returning `{ "status": "ok" }`.
6. Keep app startup simple; no auth middleware for MVP.

Acceptance criteria:

1. `uvicorn app.main:app --reload` starts from `apps/api`.
2. `GET /health` works.
3. FastAPI Swagger UI opens at `/docs`.

### A2 - Create The Database Migration

Files to create:

```text
db/migrations/001_init.sql
```

Tasks:

1. Read PostgreSQL official docs for `CREATE TABLE`, constraints, indexes, JSONB, timestamps, and transactions.
2. Create tables: `users`, `ingest_runs`, `stores`, `raw_data`, `normalized_data`, `events`.
3. Use UUID text columns or Postgres UUID columns. Pick the fastest safe option for the team.
4. Add `created_at timestamptz not null default now()` to every table.
5. Add foreign keys where practical, but do not let perfect relational modeling block the MVP.
6. Add unique constraint on `normalized_data.raw_data_id`.
7. Add a retry-safe uniqueness strategy for raw rows, preferably `(run_id, source_row_hash)`.
8. Add indexes on `ingest_runs.status`, `events.run_id`, `events.created_at`, and `normalized_data.run_id`.
9. Seed one demo user row if useful.

Suggested table fields:

```text
users(id, email, display_name, created_at)
ingest_runs(id, user_id, source_filename, status, started_at, completed_at, error_message, created_at)
stores(id, canonical_name, display_name, created_at)
raw_data(id, user_id, run_id, source_filename, source_row_number, source_row_hash, raw_payload, created_at)
normalized_data(id, raw_data_id, run_id, store_id, product_name, quantity, price, sale_date, normalized_payload, quality_notes, reorder_signal, created_at)
events(id, run_id, workflow_id, step_name, event_type, status, payload, created_at)
```

Acceptance criteria:

1. Migration runs cleanly on a fresh Postgres database.
2. Running the migration twice is either avoided by convention or made safe with `if not exists`.
3. Worker can rely on uniqueness constraints for retry safety.

### A3 - Implement Database Access

Files to edit:

```text
apps/api/app/db.py
apps/api/app/routes.py
```

Tasks:

1. Read the official docs for the selected Postgres driver.
2. Load `DATABASE_URL` from environment.
3. Add a small helper for database queries.
4. Avoid a large ORM layer for MVP unless the whole team agrees.
5. Keep SQL explicit and readable.
6. Return clear errors when `DATABASE_URL` is missing.

Acceptance criteria:

1. API can connect to Postgres.
2. API can insert and read a test row.
3. Errors are visible in local logs.

### A4 - Implement API Schemas

Files to edit:

```text
apps/api/app/schemas.py
```

Tasks:

1. Define Pydantic response models for run, event, store, normalized record, and dashboard.
2. Define request model for `POST /ingest`.
3. Use snake_case fields only.
4. Keep optional fields explicit with `None` defaults where needed.
5. Ensure datetime fields serialize cleanly.

Acceptance criteria:

1. FastAPI `/docs` shows typed request/response schemas.
2. Frontend can use `/docs` as the source of truth.

### A5 - Implement MVP Endpoints

Files to edit:

```text
apps/api/app/routes.py
apps/api/app/main.py
```

Tasks:

1. `POST /ingest`: create an `ingest_runs` row with `status = 'queued'`.
2. `POST /ingest`: accept either uploaded file support or a `source_filename` pointing to a seeded CSV. If upload blocks progress, use seeded CSV for MVP.
3. `GET /runs`: return newest runs first.
4. `GET /runs/{run_id}`: return one run or 404.
5. `GET /events?run_id=...`: return chronological events for a run.
6. `GET /dashboard`: return KPIs, recent runs, stores, normalized records, and recent events.
7. Keep pagination minimal; use simple limits for dashboard rows.

Acceptance criteria:

1. `POST /ingest` produces a queued run visible in `GET /runs`.
2. `GET /dashboard` returns a valid dashboard response even with no data.
3. Frontend can integrate without direct database access.

### A6 - Developer A Handoff Checklist

Before handoff, provide:

1. How to run migration.
2. How to start API.
3. Example `POST /ingest` request.
4. Example `GET /dashboard` response.
5. Any exact assumptions the worker must follow.

## Developer B - Python Normalizer

Developer B owns `packages/normalizer` and `db/seed`.

Primary official docs:

1. Python `csv`: https://docs.python.org/3/library/csv.html
2. Python `json`: https://docs.python.org/3/library/json.html
3. Python `argparse`: https://docs.python.org/3/library/argparse.html

### B1 - Create Seed Data

Files to create:

```text
db/seed/messy_sales.csv
db/seed/README.md
```

Tasks:

1. Create a CSV with at least 40 rows.
2. Include store name variations such as `Downtown`, `Downtown Store`, `DT`, `downtown`.
3. Include price variations such as `$12.99`, `12.99`, `12,99`, empty value, and invalid value.
4. Include date variations such as `2026-06-07`, `06/07/2026`, `7 Jun 2026`, and invalid value.
5. Include quantity variations such as `3`, `3 units`, empty value, negative value, and invalid value.
6. Include duplicate rows that should produce the same or intentionally detectable hashes.
7. Include at least one row that should generate `reorder`.
8. Include at least one row that should generate `stockout`.

Acceptance criteria:

1. The CSV is intentionally messy but still realistic.
2. Demo data always triggers quality notes and inventory signals.

### B2 - Create Normalizer Package Skeleton

Files to create:

```text
packages/normalizer/normalize.py
packages/normalizer/requirements.txt
packages/normalizer/README.md
```

Tasks:

1. Use Python standard library first: `csv`, `json`, `argparse`, `hashlib`, `datetime`, `decimal`, and `re`.
2. Avoid heavy dependencies unless they save obvious time.
3. Add a CLI shape like `python normalize.py --input ../../db/seed/messy_sales.csv`.
4. Print JSON to stdout so the worker can capture it.
5. Send logs or debug messages to stderr, not stdout.

Acceptance criteria:

1. CLI runs locally.
2. Stdout is valid JSON only.
3. Worker can call it as a subprocess.

### B3 - Implement Parsing Helpers

Files to edit:

```text
packages/normalizer/normalize.py
```

Tasks:

1. Implement `parse_store(value)`.
2. Implement `parse_product(value)`.
3. Implement `parse_quantity(value)`.
4. Implement `parse_price(value)`.
5. Implement `parse_sale_date(value)`.
6. Implement `source_row_hash(row)`.
7. Implement `quality_notes` collection for every correction.
8. Use `Decimal` internally for money parsing if practical, then output JSON numbers or strings consistently.

Acceptance criteria:

1. Bad values do not crash the script.
2. Every suspicious correction creates a quality note.
3. Stable source-row hashes are deterministic across repeated runs.

### B4 - Implement Inventory Signals

Files to edit:

```text
packages/normalizer/normalize.py
```

Tasks:

1. Define deterministic reorder thresholds per product or a default threshold.
2. Return `stockout` for zero or negative available/sold quantity conditions that make sense for the demo data.
3. Return `reorder` for low inventory or high demand conditions.
4. Return `watch` for suspicious but not urgent rows.
5. Return `ok` for clean rows.
6. Keep the rules simple and explainable for judges.

Acceptance criteria:

1. At least one demo row produces `stockout`.
2. At least one demo row produces `reorder`.
3. The rules can be explained in one sentence.

### B5 - Implement JSON Output

Files to edit:

```text
packages/normalizer/normalize.py
```

Tasks:

1. Output an array of normalized records.
2. Include all fields from the shared normalizer contract.
3. Include the original values inside `normalized_payload` where helpful.
4. Include `quality_notes` as an array.
5. Ensure dates output as ISO `YYYY-MM-DD` strings or `null`.
6. Ensure invalid rows still return structured records when possible.

Acceptance criteria:

1. Output validates against the expected shape.
2. Worker can parse stdout with `JSON.parse`.
3. Repeated runs on the same CSV produce stable output.

### B6 - Developer B Handoff Checklist

Before handoff, provide:

1. Exact CLI command to run normalizer.
2. Example JSON output with two records.
3. List of quality note values.
4. Explanation of reorder and stockout rules.
5. Any assumptions about CSV headers.

## Developer C - OpenWorkflow Worker

Developer C owns `apps/worker`.

Primary official docs:

1. OpenWorkflow: https://openworkflow.dev
2. OpenWorkflow GitHub: https://github.com/openworkflowdev/openworkflow
3. Node.js `child_process`: https://nodejs.org/api/child_process.html
4. PostgreSQL: https://www.postgresql.org/docs/

### C1 - Create Worker Skeleton

Files to create:

```text
apps/worker/package.json
apps/worker/tsconfig.json
apps/worker/src/index.ts
apps/worker/src/db.ts
apps/worker/src/events.ts
apps/worker/src/normalizer.ts
apps/worker/src/workflows/ingest.ts
apps/worker/README.md
```

Tasks:

1. Use official OpenWorkflow docs to initialize or wire the worker.
2. Keep the worker process separate from FastAPI.
3. Load `DATABASE_URL` from environment.
4. Add `npm run worker` script.
5. Add a clear startup log showing the worker is polling or ready.

Acceptance criteria:

1. `npm run worker` starts.
2. Missing `DATABASE_URL` fails with a useful error.
3. Worker can connect to Postgres.

### C2 - Implement Run Claiming

Files to edit:

```text
apps/worker/src/db.ts
apps/worker/src/index.ts
```

Tasks:

1. Query for one `queued` run.
2. Claim it transactionally by setting `status = 'running'` and `started_at = now()`.
3. Use a safe claim pattern such as row locking where practical.
4. Emit `run_claimed` event.
5. Avoid two workers claiming the same run.

Acceptance criteria:

1. A queued run becomes running when worker starts.
2. Event row is written.
3. Re-running worker does not claim completed runs.

### C3 - Implement Event Writer

Files to edit:

```text
apps/worker/src/events.ts
```

Tasks:

1. Create `writeEvent(runId, stepName, eventType, status, payload)`.
2. Store `workflow_id` when OpenWorkflow provides one. If not immediately available, use run id or a generated stable value for MVP.
3. Use JSONB payloads.
4. Write events before and after major steps.
5. On failure, write a `failed` event with a useful error message.

Acceptance criteria:

1. Dashboard can show a chronological event timeline.
2. Failures are visible in `events` and `ingest_runs.error_message`.

### C4 - Implement Normalizer Subprocess Call

Files to edit:

```text
apps/worker/src/normalizer.ts
```

Tasks:

1. Read Node.js official `child_process` docs.
2. Use `spawn` or `execFile` rather than shell string interpolation.
3. Call `python packages/normalizer/normalize.py --input <csv_path>`.
4. Capture stdout and parse JSON.
5. Capture stderr for debugging.
6. Fail the workflow step if the Python process exits non-zero.

Acceptance criteria:

1. Worker can run the Python normalizer.
2. Invalid JSON fails clearly.
3. Python stderr appears in worker logs without corrupting JSON parsing.

### C5 - Implement Durable Ingest Workflow

Files to edit:

```text
apps/worker/src/workflows/ingest.ts
apps/worker/src/index.ts
```

Tasks:

1. Use OpenWorkflow official docs for workflow definition, durable steps, retries, and workers.
2. Implement durable steps: `claim_run`, `load_csv`, `store_raw_rows`, `normalize_python`, `persist_normalized_rows`, `emit_summary_events`, `mark_run_complete`.
3. Keep each database write step idempotent.
4. Use source-row hash uniqueness to avoid duplicate raw rows.
5. Use `normalized_data.raw_data_id` uniqueness to avoid duplicate normalized rows.
6. Mark run `completed` when done.
7. Mark run `failed` on unrecoverable error.

Acceptance criteria:

1. Worker turns one queued run into completed.
2. Worker writes raw rows and normalized rows.
3. Worker writes events for every major step.
4. Killing and restarting the worker does not duplicate rows.

### C6 - Implement Crash-Resume Demo Script

Files to create or edit:

```text
apps/worker/README.md
```

Tasks:

1. Document exactly how to start worker.
2. Document exactly when to kill worker during demo.
3. Document how to restart worker.
4. Document what events should appear after restart.
5. Add an artificial delay flag only if needed for the demo, such as `DEMO_STEP_DELAY_MS`.

Acceptance criteria:

1. Team can rehearse crash/resume without reading code.
2. Demo works twice in a row.

### C7 - Developer C Handoff Checklist

Before handoff, provide:

1. Worker start command.
2. Required environment variables.
3. List of workflow events emitted.
4. Crash-resume demo steps.
5. Known idempotency assumptions.

## Developer D - React Dashboard

Developer D owns `apps/web`.

Primary official docs:

1. Vite: https://vite.dev/guide/
2. React: https://react.dev/
3. TanStack Query: https://tanstack.com/query/latest
4. Zustand: https://zustand.docs.pmnd.rs/

### D1 - Create Web App Skeleton

Files to create:

```text
apps/web/package.json
apps/web/index.html
apps/web/src/main.tsx
apps/web/src/App.tsx
apps/web/src/api.ts
apps/web/src/styles.css
apps/web/README.md
```

Tasks:

1. Use Vite official docs to scaffold or manually create a Vite React app.
2. Use React official docs for component structure and state.
3. Add TanStack Query provider at the app root.
4. Add `VITE_API_BASE_URL` support with local default.
5. Keep routing out unless needed; one screen is enough.

Acceptance criteria:

1. `npm run dev` starts.
2. App renders a dashboard shell.
3. API base URL is configurable.

### D2 - Implement API Client

Files to edit:

```text
apps/web/src/api.ts
```

Tasks:

1. Implement `getDashboard()`.
2. Implement `getRuns()`.
3. Implement `getEvents(runId)`.
4. Implement `createIngestRun(input)`.
5. Throw useful errors for non-2xx responses.
6. Use snake_case response fields as provided by FastAPI.
7. Keep types close to the API contract until generated OpenAPI types exist.

Acceptance criteria:

1. API calls work against Developer A endpoints.
2. Mock fallback is available only if API is not ready.
3. Errors show in the UI.

### D3 - Add React Query Hooks

Files to create or edit:

```text
apps/web/src/queries.ts
apps/web/src/App.tsx
```

Tasks:

1. Read TanStack Query official docs for queries, mutations, invalidation, and refetch intervals.
2. Add query for dashboard data.
3. Add query for runs.
4. Add query for events for selected run.
5. Add mutation for ingest creation.
6. Invalidate dashboard/runs/events after ingest mutation.
7. Use polling/refetch interval for active runs.

Acceptance criteria:

1. Dashboard updates after ingest.
2. Active run status refreshes without manual page reload.
3. Server data is not duplicated into Zustand.

### D4 - Build Dashboard UI

Files to create or edit:

```text
apps/web/src/App.tsx
apps/web/src/components/KpiCards.tsx
apps/web/src/components/IngestPanel.tsx
apps/web/src/components/RunStatus.tsx
apps/web/src/components/StoreFilter.tsx
apps/web/src/components/RecordsTable.tsx
apps/web/src/components/EventsTimeline.tsx
apps/web/src/styles.css
```

Tasks:

1. Build one screen, not a multi-page app.
2. Add a strong hero/header explaining the flow.
3. Add ingest trigger near the top.
4. Show current run status clearly.
5. Show KPI cards: raw rows, normalized rows, quality issues, reorder count, stockout count.
6. Add store filter.
7. Add normalized records table.
8. Add event timeline with step name, event type, status, and timestamp.
9. Use color and hierarchy to make errors and stockouts obvious.
10. Ensure desktop and mobile layouts are usable.

Acceptance criteria:

1. Judge can understand the product without explanation.
2. Dashboard works on laptop and mobile widths.
3. Event timeline makes the durable workflow visible.

### D5 - Add Minimal UI State

Files to create only if needed:

```text
apps/web/src/store.ts
```

Tasks:

1. Use Zustand only if plain React state becomes awkward.
2. Store selected run id, selected store id/name, filters, and demo mode only.
3. Do not store API responses in Zustand.
4. Read Zustand official docs before adding it.

Acceptance criteria:

1. Server state remains in React Query.
2. UI state is small and obvious.

### D6 - Developer D Handoff Checklist

Before handoff, provide:

1. Web start command.
2. Required environment variables.
3. Which endpoints the UI calls.
4. Any mocked data still present.
5. Demo click path from ingest to visible results.

## Integration Milestones

### Milestone 1 - Skeletons Running

Deadline target: first 30 minutes.

Required state:

1. API starts.
2. Worker starts.
3. Web starts.
4. Database URL is agreed.
5. Seed CSV exists or is being created.

### Milestone 2 - Contracts Locked

Deadline target: first 90 minutes.

Required state:

1. SQL table names and key fields are locked.
2. Normalizer output JSON shape is locked.
3. Dashboard response shape is locked.
4. Run and event statuses are locked.

### Milestone 3 - First End-To-End Run

Deadline target: hour 3 to 4.

Required state:

1. `POST /ingest` creates queued run.
2. Worker claims run.
3. Worker calls normalizer.
4. Worker writes at least one normalized row.
5. Dashboard can render the row.

### Milestone 4 - Durable Demo

Deadline target: hour 5 to 6.

Required state:

1. Events show workflow progress.
2. Killing worker mid-run does not destroy the run.
3. Restarting worker completes or safely retries.
4. Duplicate raw/normalized rows are prevented.

### Milestone 5 - Demo Freeze

Deadline target: final 30 to 60 minutes.

Required state:

1. No new features.
2. Fix only bugs that affect the demo path.
3. Rehearse the 3-minute pitch twice.
4. Keep a known-good seed CSV and run id ready.

## Cross-Developer Smoke Test

Run this when all lanes have something working:

```text
1. Apply database migration.
2. Start FastAPI.
3. Start worker.
4. Start web.
5. Trigger ingest from the web or call POST /ingest.
6. Confirm run appears as queued, then running, then completed.
7. Confirm raw_data has rows.
8. Confirm normalized_data has rows.
9. Confirm events has step events.
10. Confirm dashboard shows KPIs, records, and events.
```

## If Something Breaks

Use this fallback order:

1. If upload blocks progress, use seeded CSV path only.
2. If OpenWorkflow setup blocks progress, keep the worker loop and event table, then re-add durable workflow after the demo path works.
3. If worker-to-Python subprocess blocks progress, write normalizer JSON to a file and let worker read it.
4. If dashboard integration blocks progress, use mocked dashboard data but keep the ingest/run/events panel wired.
5. If Supabase blocks progress, switch to local Postgres with the same `DATABASE_URL` contract.

Do not drop the normalizer or the event timeline. Those are core to the demo story.
