# Digithon MVP Architecture

Digithon is a monorepo for a demand-driven inventory normalizer: messy retail CSV data becomes normalized, durable, queryable operational data. The MVP should stay simple enough to finish during the hackathon while keeping the seams clean enough to scale after the demo.

The core product story is:

```text
messy CSV -> durable workflow -> Python normalization IP -> Postgres -> FastAPI -> React dashboard
```

## Architecture Goals

1. Finish the MVP quickly without overbuilding platform features.
2. Keep the Python normalizer isolated as the defensible IP.
3. Use OpenWorkflow for durable, resumable execution and the crash-resume demo.
4. Store raw data, normalized data, runs, and workflow events in Postgres.
5. Expose all frontend data through FastAPI; the frontend never talks directly to Postgres.
6. Use a monorepo from the start so API, worker, frontend, contracts, data, and normalizer evolve together.
7. Leave obvious scale paths after the MVP without implementing them now.

## Current Stack

| Layer | MVP choice | Notes |
|---|---|---|
| Monorepo | npm/pnpm workspaces plus Python packages | Keep one repo with separate apps and packages. Use whichever package manager the team can set up fastest. |
| API | FastAPI + Pydantic | Owns validation, ingest-run creation, and dashboard read APIs. |
| Web | Vite + React + React Query | One dashboard screen. React Query owns server state. |
| UI state | Optional Zustand | Only for selected run, selected store, filters, and demo mode. |
| Worker | TypeScript OpenWorkflow worker | Owns durable ingest execution, retries, resume, and event emission. |
| Normalizer | Python | Parses messy CSV rows, canonicalizes fields, dedupes, emits quality notes and inventory signals. |
| Database | Postgres or Supabase Postgres | Use Supabase only as managed Postgres if it is frictionless. |
| Migrations | SQL files | Prefer plain SQL for MVP speed and transparency. |
| Auth | Seeded demo user only | Real auth is out of scope unless required. |
| Deployment | Local dev first | Docker can be added after the MVP path works. |

## Monorepo Shape

Target structure:

```text
digithon/
  apps/
    api/                  # FastAPI app and Pydantic schemas
    web/                  # Vite React dashboard
    worker/               # OpenWorkflow worker process
  packages/
    normalizer/           # Python normalization engine, the core IP
    contracts/            # Shared API contract notes or generated client later
  db/
    migrations/           # SQL migrations
    seed/                 # messy CSV and demo seed data
  docs/
    architecture.md       # Longer-lived version of this file when needed
  HACKATHON_EXECUTION_PLAN.md
  architecture-current.md
```

This repo should not copy the heavier Orbit architecture. Do not add event sourcing, projection infrastructure, Google OAuth, role systems, Kubernetes manifests, or generic service layers for the MVP.

## Runtime Flow

```text
React dashboard
  React Query + optional Zustand UI state
        |
        v
FastAPI API
  POST /ingest
  GET /dashboard
  GET /runs
  GET /events
        |
        v
Postgres / Supabase
  users, ingest_runs, stores, raw_data, normalized_data, events
        ^
        |
OpenWorkflow worker
  claim run -> load CSV -> store raw -> call Python normalizer
  -> persist normalized rows -> emit events -> mark run complete
        |
        v
packages/normalizer/normalize.py
```

The simplest integration model is queue-by-database:

1. FastAPI receives an ingest request.
2. FastAPI creates an `ingest_runs` row with `status = 'queued'`.
3. The OpenWorkflow worker claims queued runs and starts durable execution.
4. Workflow steps write `events` rows as they progress.
5. Workflow steps persist raw and normalized data idempotently.
6. FastAPI serves dashboard reads from Postgres.
7. React Query polls or refetches runs, events, and dashboard data.

This avoids making Python/FastAPI directly invoke TypeScript OpenWorkflow internals during the hackathon. If direct workflow scheduling becomes easy, it can be added later behind the same API contract.

## Component Responsibilities

| Component | Responsibility |
|---|---|
| `apps/api` | Validate requests, create ingest runs, expose dashboard/read endpoints, return typed JSON. |
| `apps/worker` | Run OpenWorkflow workflows, claim queued runs, execute durable steps, call the Python normalizer, write events. |
| `apps/web` | Render KPIs, normalized table, store/run filters, ingest trigger, and events timeline. |
| `packages/normalizer` | Transform messy CSV input into normalized records, quality notes, dedupe metadata, stockout/reorder signals. |
| `packages/contracts` | Keep request/response shapes documented. Generate an OpenAPI client later if useful. |
| `db/migrations` | Own the application schema as explicit SQL. |
| `db/seed` | Store demo CSVs, guaranteed messy cases, and optional seed scripts. |

## Database Contract

Minimum MVP tables:

```text
users
ingest_runs
stores
raw_data
normalized_data
events
```

Recommended fields:

```text
users:
- id
- email
- display_name
- created_at

ingest_runs:
- id
- user_id
- source_filename
- status              # queued, running, completed, failed
- started_at
- completed_at
- error_message
- created_at

stores:
- id
- canonical_name
- display_name
- created_at

raw_data:
- id
- user_id
- run_id
- source_filename
- source_row_number
- source_row_hash
- raw_payload
- created_at

normalized_data:
- id
- raw_data_id
- run_id
- store_id
- product_name
- quantity
- price
- sale_date
- normalized_payload
- quality_notes
- reorder_signal
- created_at

events:
- id
- run_id
- workflow_id
- step_name
- event_type
- status
- payload
- created_at
```

Recommended constraints and indexes:

1. `raw_data.source_row_hash` should be unique per source/run strategy so retries do not duplicate raw rows.
2. `normalized_data.raw_data_id` should be unique so retries do not duplicate normalized rows.
3. `events.run_id`, `events.workflow_id`, `events.step_name`, and `events.created_at` should be indexed.
4. `ingest_runs.status` should be indexed so the worker can claim queued work quickly.
5. Use JSONB for `raw_payload`, `normalized_payload`, `quality_notes`, and event `payload`.

Keep the event table append-only for observability. Do not build full event sourcing/projections for the MVP.

## API Contract

FastAPI owns the HTTP boundary.

MVP endpoints:

| Endpoint | Purpose |
|---|---|
| `GET /health` | Local/dev health check. |
| `POST /ingest` | Create an ingest run from an uploaded CSV or known seed file. |
| `GET /runs` | List recent ingest runs and statuses. |
| `GET /runs/{run_id}` | Return one run summary. |
| `GET /events?run_id=...` | Return workflow events for a run. |
| `GET /dashboard` | Return KPIs, stores, normalized records, and inventory signals. |

API rules:

1. Use Pydantic models for request and response validation.
2. Use snake_case JSON fields end to end.
3. Keep API routes thin; do not put normalization logic in routes.
4. Do not let the frontend access Postgres directly.
5. Return enough run/event information for the dashboard to show progress without special realtime infrastructure.

## Workflow Contract

OpenWorkflow owns durable execution.

MVP workflow steps:

```text
claim_run
load_csv
store_raw_rows
normalize_python
persist_normalized_rows
emit_summary_events
mark_run_complete
```

Workflow rules:

1. Every step should emit an event row with `run_id`, `step_name`, `status`, and useful payload.
2. Persistence steps must be idempotent so retry/resume is safe.
3. Workflow failures should mark the run as `failed` and persist `error_message`.
4. The worker is the only component that calls the Python normalizer during MVP ingest.
5. The crash-resume demo should kill the worker mid-run, restart it, and show continuation through persisted events.

## Normalizer Contract

The Python normalizer is the IP layer. It should be easy to test without the API, worker, or database.

Input:

```text
CSV file path or parsed row list
```

Output:

```text
normalized records:
- source_row_number
- source_row_hash
- canonical_store
- product_name
- quantity
- price
- sale_date
- quality_notes
- reorder_signal
```

Normalizer rules:

1. Parse inconsistent dates, prices, quantities, and store names.
2. Canonicalize stores and products.
3. Dedupe rows using stable source-row hashes.
4. Emit quality notes for every correction or suspicious value.
5. Emit simple stockout/reorder signals using deterministic rules, not ML.
6. Keep database writes out of the normalizer.

## Frontend Contract

The dashboard should be one screen optimized for the demo.

Required UI:

1. Ingest button or upload control.
2. Current/recent run status.
3. KPI cards for row count, cleaned rows, quality issues, stockout/reorder signals.
4. Store filter.
5. Normalized records table.
6. Workflow events timeline.

Frontend rules:

1. React Query owns all server data.
2. Zustand is optional and only for UI state like selected store, selected run, filters, or demo mode.
3. Do not duplicate server data into Zustand.
4. Prefer polling/refetching for run progress during MVP; avoid realtime infrastructure unless it is already free.
5. Keep navigation minimal; one dashboard route is enough.

## Local Development

Expected dev commands after setup:

```bash
# database
export DATABASE_URL="postgresql://..."

# api
cd apps/api
pip install -r requirements.txt
uvicorn app.main:app --reload

# worker
cd apps/worker
npm install
npm run worker

# web
cd apps/web
npm install
npm run dev
```

The exact package manager can change, but the process split should remain API, worker, web, and database.

## MVP Guardrails

1. No real auth unless required; use a seeded demo user.
2. No Supabase platform features beyond Postgres.
3. No generic CRUD screens.
4. No multi-page app unless the dashboard is already complete.
5. No ML forecasting; deterministic reorder rules are enough.
6. No full event sourcing; use append-only workflow events only.
7. No frontend direct database access.
8. No second domain layer in FastAPI or the worker.
9. No Kubernetes/deployment work before local demo works.
10. Drop visual polish before dropping the durable workflow path.

## Scale Path After MVP

The MVP architecture can scale without rewriting the core flow.

Near-term scale additions:

1. Add real auth and tenant scoping.
2. Add object storage for uploaded CSV files.
3. Generate a typed frontend API client from FastAPI OpenAPI.
4. Add materialized views or summary tables for dashboard performance.
5. Add worker concurrency and deployment containers.
6. Add stricter migrations and CI checks.
7. Add structured normalizer test fixtures and quality reports.

Later scale additions:

1. Add row-level security if Supabase becomes part of the product surface.
2. Add a real queue if database-queued runs become a bottleneck.
3. Add tenant-aware billing/account models.
4. Add integrations for POS systems or cloud file drops.
5. Add richer event taxonomy and audit views.
6. Add model-assisted forecasting only after deterministic rules are trusted.

## Key Files To Read First

Start with these files when building the MVP:

1. `HACKATHON_EXECUTION_PLAN.md`
2. `architecture-current.md`
3. `MVP_WORK_SPLIT.md`
4. `db/migrations/`
5. `packages/normalizer/`
6. `apps/api/`
7. `apps/worker/`
8. `apps/web/`
