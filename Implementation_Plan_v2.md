# Implementation Plan v2

## MVP Goal

Build a narrow, production-shaped MVP that can ingest messy retail tabular data from local CSV/XLSX upload or a simple Google Drive file reference, persist raw parsed rows, normalize the data through OpenWorkflow, and display operational analytics in an enterprise-grade React dashboard.

```text
CSV/XLSX upload or Google Drive file
  -> FastAPI POST /ingest
  -> queued ingest run
  -> OpenWorkflow durable worker
  -> resolve source
  -> fetch file if needed
  -> pandas parses tabular data
  -> raw_data stores JSONB row payloads
  -> Python normalizer maps data to our canonical model
  -> normalized_data stores structured records + JSONB payloads
  -> deterministic predictor combines normalized sales + seeded demand events
  -> inventory_predictions stores explainable store/product stock needs
  -> FastAPI read APIs validate responses with Pydantic
  -> React Query + ShadCN dashboard renders analytics, tables, and events
```

The first priority is a fully working end-to-end MVP. If time remains after the MVP is stable, improve the Google Drive connector, analytics, and dashboard polish.

## Core Principles

1. Keep the MVP path simple and reliable before adding breadth.
2. Store raw source rows before normalization so the system is auditable.
3. Use OpenWorkflow for durable ingestion, retries, resume, and observable events.
4. Use Postgres relational tables, indexes, and JSONB fields so reads are fast and future joins are easy.
5. Use FastAPI and Pydantic as the strict API validation boundary.
6. Use React Query for server state and ShadCN UI components for a polished dashboard.
7. Do not add auth, RLS, realtime, ML, broad connector frameworks, or multi-page navigation until the MVP works end to end.
8. For inventory prediction, start with deterministic event-aware rules and seeded calendar data before adding external APIs or ML.

## Source Ingestion

### Supported MVP Sources

```text
csv_upload
xlsx_upload
google_drive
seeded_file
```

### Source Flow

1. The user starts ingest from the dashboard.
2. The user either uploads a CSV/XLSX file or pastes a Google Drive file link/id.
3. FastAPI validates the request and creates an `ingest_runs` row with `status = 'queued'`.
4. OpenWorkflow claims the queued run.
5. The worker resolves source metadata and fetches the file if needed.
6. pandas reads the tabular file and converts rows into JSON-compatible dictionaries.
7. The worker stores every parsed row in `raw_data.raw_payload` before normalization.
8. The normalizer converts parsed rows into canonical records for `normalized_data`.

Google Drive should stay narrow for the MVP: accept a link or file id and fetch the file. Do not build a Drive file browser, generic connector system, or complex OAuth UX before the core demo works.

## Database Design

Postgres is the durable source of truth. The schema should use normalized relational tables for joins and JSONB fields for flexible analytics over source and normalized payloads.

### Tables

```text
users
ingest_runs
stores
raw_data
normalized_data
calendar_events
inventory_predictions
events
```

### Suggested Fields

```text
users:
- id
- email
- display_name
- created_at

ingest_runs:
- id
- user_id
- source_type
- source_filename
- source_uri
- source_mime_type
- status
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
- raw_payload JSONB
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
- normalized_payload JSONB
- quality_notes JSONB
- reorder_signal
- created_at

calendar_events:
- id
- event_name
- event_type
- starts_on
- ends_on
- country
- region
- city
- impact_scope
- impact_score
- product_tags JSONB
- payload JSONB
- created_at

inventory_predictions:
- id
- run_id
- store_id
- product_name
- forecast_date
- baseline_quantity
- predicted_quantity
- event_uplift
- risk_level
- related_event_id
- explanation_notes JSONB
- payload JSONB
- created_at

events:
- id
- run_id
- workflow_id
- step_name
- event_type
- status
- payload JSONB
- created_at
```

### Joins And Extensibility

Keep relationships explicit so the database can support future product, supplier, inventory, and analytics features without rewriting the MVP schema.

1. `ingest_runs.user_id` joins to `users.id`.
2. `raw_data.run_id` joins to `ingest_runs.id`.
3. `normalized_data.raw_data_id` joins to `raw_data.id`.
4. `normalized_data.run_id` joins to `ingest_runs.id`.
5. `normalized_data.store_id` joins to `stores.id`.
6. `inventory_predictions.run_id` joins to `ingest_runs.id`.
7. `inventory_predictions.store_id` joins to `stores.id`.
8. `inventory_predictions.related_event_id` joins to `calendar_events.id` when a prediction is event-driven.
9. `events.run_id` joins to `ingest_runs.id`.

Prefer foreign keys where practical, but do not let perfect modeling block the MVP. The important rule is that raw rows, normalized rows, stores, runs, and events remain queryable together.

### Required Indexes

Indexes are required so FastAPI read endpoints, dashboard tables, event timelines, and OpenWorkflow resume/retry checks stay fast as data grows.

```sql
create index if not exists idx_ingest_runs_status on ingest_runs(status);
create index if not exists idx_ingest_runs_created_at on ingest_runs(created_at desc);
create index if not exists idx_raw_data_run_id on raw_data(run_id);
create unique index if not exists idx_raw_data_run_hash on raw_data(run_id, source_row_hash);
create index if not exists idx_raw_data_payload_gin on raw_data using gin(raw_payload);
create unique index if not exists idx_normalized_data_raw_data_id on normalized_data(raw_data_id);
create index if not exists idx_normalized_data_run_id on normalized_data(run_id);
create index if not exists idx_normalized_data_store_id on normalized_data(store_id);
create index if not exists idx_normalized_data_sale_date on normalized_data(sale_date);
create index if not exists idx_normalized_data_reorder_signal on normalized_data(reorder_signal);
create index if not exists idx_normalized_data_payload_gin on normalized_data using gin(normalized_payload);
create index if not exists idx_calendar_events_starts_on on calendar_events(starts_on);
create index if not exists idx_calendar_events_event_type on calendar_events(event_type);
create index if not exists idx_calendar_events_impact_scope on calendar_events(impact_scope);
create index if not exists idx_calendar_events_product_tags_gin on calendar_events using gin(product_tags);
create index if not exists idx_inventory_predictions_run_id on inventory_predictions(run_id);
create index if not exists idx_inventory_predictions_store_id on inventory_predictions(store_id);
create index if not exists idx_inventory_predictions_product_name on inventory_predictions(product_name);
create index if not exists idx_inventory_predictions_forecast_date on inventory_predictions(forecast_date);
create index if not exists idx_inventory_predictions_risk_level on inventory_predictions(risk_level);
create unique index if not exists idx_inventory_predictions_unique_forecast on inventory_predictions(run_id, store_id, product_name, forecast_date, coalesce(related_event_id, '00000000-0000-0000-0000-000000000000'::uuid));
create index if not exists idx_events_run_id on events(run_id);
create index if not exists idx_events_workflow_id on events(workflow_id);
create index if not exists idx_events_step_name on events(step_name);
create index if not exists idx_events_created_at on events(created_at);
```

### JSONB Analytics

Use JSONB fields to support analytics without losing raw source fidelity.

1. `raw_data.raw_payload` stores the exact parsed row dictionary from pandas.
2. `normalized_data.normalized_payload` stores canonicalized fields, original values, and explainability metadata.
3. `normalized_data.quality_notes` stores correction and warning labels.
4. `calendar_events.product_tags` stores normalized product/category labels affected by an event.
5. `calendar_events.payload` stores event source metadata, holiday observance details, event examples, and future API response fragments.
6. `inventory_predictions.explanation_notes` stores human-readable reasons such as `baseline_from_recent_sales`, `super_bowl_snack_uplift`, or `holiday_storewide_uplift`.
7. `inventory_predictions.payload` stores numeric model inputs such as lookback windows, matched events, uplift multipliers, and threshold comparisons.
8. `events.payload` stores workflow-level metadata, error details, row counts, and retry information.

Fast dashboard analytics can combine relational columns and JSONB fields. Example analytics include total raw rows, normalized row count, quality issue count, reorder count, stockout count, predicted reorder count, predicted stockout count, upcoming high-impact events, rows by store, rows by source type, and events by workflow step.

### Prediction Tables And Seed Data

Inventory prediction is step two after the basic ingest path is working. It should be implemented as a deterministic, event-aware rules engine backed by Postgres tables. Do not add ML forecasting or require a third-party event API for the hackathon demo.

#### `calendar_events`

`calendar_events` stores holidays and demand-driving events that can affect store inventory. It is intentionally database-backed so predictions are reproducible, explainable, and independent of live API availability during the demo.

Recommended SQL shape:

```sql
create table if not exists calendar_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  event_type text not null check (event_type in ('holiday', 'sports', 'shopping', 'seasonal', 'local_event')),
  starts_on date not null,
  ends_on date not null,
  country text not null default 'US',
  region text,
  city text,
  impact_scope text not null check (impact_scope in ('national', 'regional', 'local')),
  impact_score numeric(5, 2) not null check (impact_score >= 0),
  product_tags jsonb not null default '[]'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (ends_on >= starts_on),
  unique (event_name, starts_on, country, coalesce(region, ''), coalesce(city, ''))
);
```

Field rules:

1. `event_name` should be display-ready, for example `Super Bowl`, `Thanksgiving`, or `Black Friday`.
2. `event_type` controls default uplift behavior. Use `holiday`, `sports`, `shopping`, `seasonal`, or `local_event` only.
3. `starts_on` and `ends_on` allow one-day events and multi-day demand windows such as back-to-school season.
4. `country`, `region`, and `city` allow future local matching. For MVP national events, use `country = 'US'` and leave `region` and `city` null.
5. `impact_scope` should be `national` for events that affect all stores, `regional` for state/region events, and `local` for city-level events.
6. `impact_score` should be a simple numeric strength, not a model output. Recommended MVP range is `0.10` to `1.00`, where `0.10` is mild and `1.00` is very high.
7. `product_tags` should contain normalized product names or categories that can be matched against normalized rows, for example `["chips", "soda", "snacks", "coffee beans"]`.
8. `payload` can hold `source`, `notes`, `default_uplift_multiplier`, `event_window_days`, and future API response metadata.

Seed this table in the migration or in a dedicated seed SQL file. The seed must be idempotent using `on conflict do nothing` or `on conflict do update`.

Required MVP seed events:

```text
New Year's Day
Martin Luther King Jr. Day
Presidents' Day
Super Bowl
Valentine's Day
Mother's Day
Father's Day
Memorial Day
Independence Day
Labor Day
Back-to-school season
Halloween
Thanksgiving
Black Friday
Christmas Eve
Christmas Day
New Year's Eve
```

Recommended seed metadata:

```text
Super Bowl:
- event_type: sports
- impact_scope: national
- impact_score: 0.90
- product_tags: snacks, chips, soda, frozen pizza, beverages
- payload notes: High snack and party demand. Use a short pre-event demand window.

Black Friday:
- event_type: shopping
- impact_scope: national
- impact_score: 0.85
- product_tags: coffee beans, espresso pods, checkout supplies, snacks, beverages
- payload notes: High traffic and staff/customer refreshment demand.

Thanksgiving:
- event_type: holiday
- impact_scope: national
- impact_score: 0.80
- product_tags: groceries, tea bags, coffee beans, seasonal items
- payload notes: Holiday grocery and hosting demand.

Back-to-school season:
- event_type: seasonal
- impact_scope: national
- impact_score: 0.60
- product_tags: snacks, beverages, lunch items, stationery
- payload notes: Multi-week seasonal demand window.

Christmas Eve / Christmas Day:
- event_type: holiday
- impact_scope: national
- impact_score: 0.80
- product_tags: coffee beans, tea bags, gifts, seasonal items
- payload notes: Gift, hosting, and holiday foot traffic demand.
```

For fixed-date holidays, create seeds for the current demo year and the following year so upcoming-event dashboards still work if the demo date changes. For floating holidays and Super Bowl, hardcode the demo-year dates in the seed and document that a later API refresh can replace this.

#### `inventory_predictions`

`inventory_predictions` stores the output of the deterministic predictor. The table is durable so the dashboard can show prediction history, the worker can retry safely, and judges can see that predictions are real persisted business data rather than frontend-only calculations.

Recommended SQL shape:

```sql
create table if not exists inventory_predictions (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references ingest_runs(id),
  store_id uuid not null references stores(id),
  product_name text not null,
  forecast_date date not null,
  baseline_quantity integer not null check (baseline_quantity >= 0),
  predicted_quantity integer not null check (predicted_quantity >= 0),
  event_uplift integer not null default 0 check (event_uplift >= 0),
  risk_level text not null check (risk_level in ('ok', 'watch', 'reorder', 'stockout')),
  related_event_id uuid references calendar_events(id),
  explanation_notes jsonb not null default '[]'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
```

Idempotency rule:

1. Add a unique index for `(run_id, store_id, product_name, forecast_date, related_event_id)` using a null-safe expression for `related_event_id`.
2. Worker inserts should use `on conflict do update` or `on conflict do nothing` so retry/resume cannot duplicate predictions.
3. If the prediction algorithm changes during development, prefer `on conflict do update` for the MVP so the latest deterministic output is visible without manually deleting rows.

Prediction record examples:

```json
{
  "store_name": "Downtown",
  "product_name": "coffee beans",
  "forecast_date": "2026-11-27",
  "baseline_quantity": 18,
  "predicted_quantity": 28,
  "event_uplift": 10,
  "risk_level": "reorder",
  "related_event": "Black Friday",
  "explanation_notes": [
    "baseline_from_recent_sales",
    "black_friday_high_traffic_uplift",
    "predicted_quantity_exceeds_reorder_threshold"
  ]
}
```

#### Store Location Extension

For MVP national events, stores do not need geography. For regional or local events, add store location fields before consuming local event APIs.

Future `stores` fields:

```text
city
region
postal_code
latitude
longitude
```

Do not block step two on these fields. Seeded national events are enough for the first prediction demo.

## FastAPI And Pydantic

FastAPI owns API validation and read endpoints. Pydantic models are the source of truth for API request and response shapes.

### Required Endpoints

```text
GET /health
POST /ingest
GET /runs
GET /runs/{run_id}
GET /events?run_id=...
GET /dashboard
GET /calendar-events
GET /predictions
```

### API Rules

1. Validate source type and file metadata at `POST /ingest`.
2. Accept local CSV/XLSX upload, Google Drive file reference, or seeded file source.
3. Return stable IDs, timestamps, run statuses, and event statuses.
4. Use typed Pydantic response models for every endpoint.
5. Keep SQL explicit and indexed for dashboard queries.
6. Do not run the whole workflow inside FastAPI request handlers.
7. Do not let the frontend read directly from Postgres or Supabase.
8. Serve prediction reads from `inventory_predictions`; do not calculate dashboard predictions in React.
9. Keep `GET /calendar-events` read-only for the MVP. Event ingestion/refresh can be a later worker task.

### Prediction API Contracts

Add Pydantic response models when the prediction tables are introduced.

Recommended models:

```text
CalendarEvent:
- id: str
- event_name: str
- event_type: Literal['holiday', 'sports', 'shopping', 'seasonal', 'local_event']
- starts_on: date
- ends_on: date
- country: str
- region: str | None
- city: str | None
- impact_scope: Literal['national', 'regional', 'local']
- impact_score: float
- product_tags: list[str]
- payload: dict[str, Any]
- created_at: datetime

InventoryPrediction:
- id: str
- run_id: str
- store_id: str
- store_name: str
- product_name: str
- forecast_date: date
- baseline_quantity: int
- predicted_quantity: int
- event_uplift: int
- risk_level: Literal['ok', 'watch', 'reorder', 'stockout']
- related_event_id: str | None
- related_event_name: str | None
- explanation_notes: list[str]
- payload: dict[str, Any]
- created_at: datetime

PredictionKpis:
- predicted_reorder_count: int
- predicted_stockout_count: int
- upcoming_event_count: int
- high_impact_event_count: int
```

Endpoint behavior:

1. `GET /calendar-events` returns upcoming events ordered by `starts_on asc`, default limit 50.
2. `GET /calendar-events?from_date=YYYY-MM-DD&to_date=YYYY-MM-DD` filters by date range.
3. `GET /predictions` returns prediction rows ordered by `forecast_date asc`, then highest risk first.
4. `GET /predictions?run_id=...` filters predictions for a specific ingest run.
5. `GET /predictions?store_id=...` filters predictions for one store.
6. `GET /predictions?risk_level=reorder` filters predictions for operational action.
7. `GET /dashboard` should include `upcoming_events`, `predictions`, and `prediction_kpis` once those tables exist.
8. Keep list endpoints bounded with `limit` query parameters. Do not return unbounded prediction history.

Dashboard response extension:

```text
DashboardResponse:
- kpis
- prediction_kpis
- runs
- stores
- records
- upcoming_events
- predictions
- events
```

### API Scaling Next Steps

1. Keep FastAPI stateless so it can scale horizontally behind a load balancer.
2. Use Pydantic validation at the API boundary and response layer; avoid repeated validation inside hot database loops.
3. Add pagination and limits to dashboard tables, runs, normalized records, and event timeline endpoints.
4. Use database connection pooling for FastAPI and keep pool sizing separate from OpenWorkflow worker pool sizing.
5. Avoid returning full `raw_payload` JSONB fields in list endpoints unless the UI explicitly needs row-level debug details.
6. Keep `/dashboard`, `/runs`, `/events`, and normalized-record queries backed by indexed SQL.
7. Use `EXPLAIN ANALYZE` on important dashboard queries before demo freeze and whenever data volume grows.
8. Scale API reads separately from workflow execution; API servers serve validated reads and ingest requests, while OpenWorkflow workers process durable jobs.

### Database Performance Next Steps

1. Verify all required indexes exist before the end-to-end demo.
2. Confirm indexed joins for `run_id`, `raw_data_id`, `store_id`, `workflow_id`, and `user_id`.
3. Confirm indexed filters for `status`, `created_at`, `step_name`, `sale_date`, and `reorder_signal`.
4. Keep GIN indexes on JSONB fields used for analytics, especially `raw_payload` and `normalized_payload`.
5. Keep uniqueness constraints on `(run_id, source_row_hash)` and `normalized_data.raw_data_id` for retry safety.
6. Prefer explicit joins and normalized relational references over duplicating server data into wide tables.
7. Add only indexes that support real API/workflow queries; avoid indexing every JSONB key prematurely.

## OpenWorkflow Worker

OpenWorkflow owns durable execution, retries, resume, and event emission. It should make the ingestion path faster, safer, and scalable by keeping each step idempotent and observable.

### Workflow Topology Decision

For the MVP, use **one customer-facing parent ingest workflow** with durable steps instead of splitting every stage into separate workflows.

This ingest workflow is our stateful machine for one customer data-ingestion run. It owns the run lifecycle from source resolution through raw storage, normalization, persistence, event emission, and completion. OpenWorkflow stores durable workflow/step state internally, while our application `events` table stores business-readable audit events for the dashboard and customer observability.

This decision follows the OpenWorkflow model from the official docs: workflows are durable functions, `step.run()` creates checkpoints that do not repeat completed work, and `step.runWorkflow()` is available when a parent workflow needs to start and wait for a child workflow. For the MVP customer ingest path, durable steps are the better fit because the stages are tightly coupled and sequential.

Recommended MVP topology:

```text
ingest_data_workflow(run_id)
  step: claim_run
  step: resolve_source
  step: fetch_file
  step: parse_tabular_data
  step: store_raw_rows
  step: normalize_python
  step: persist_normalized_rows
  step: generate_inventory_predictions
  step: emit_summary_events
  step: mark_run_complete
```

Why this is the best first customer case:

1. The ingest path is mostly sequential; each stage depends on the previous stage's output.
2. The dashboard needs one clear run id, status, timeline, and error path.
3. Crash/resume is easier to prove because completed steps are remembered and not re-run.
4. Idempotency stays simpler because raw and normalized writes are checkpointed inside one run lifecycle.
5. The customer mental model is simple: one uploaded file equals one ingest workflow run.
6. The prediction step can be checkpointed after normalized rows exist and safely retried using `inventory_predictions` uniqueness.

Use child workflows later only when a stage becomes independently valuable, long-running, or reusable across products. Good future candidates are `fetch_google_drive_file`, `normalize_large_dataset`, `generate_analytics_snapshot`, or `export_clean_data`. Do not split into child workflows just for code organization.

Child workflow tradeoffs to account for when we introduce them:

1. A parent can durably wait for a child workflow result with `step.runWorkflow()`.
2. If the child fails, the parent step fails unless we handle the error.
3. If the parent step times out, the child can continue running independently, so cancellation semantics must be designed explicitly.
4. Each child workflow needs its own input/output contract, retry policy, event mapping, and dashboard visibility.

Rule of thumb: use durable steps for tightly coupled stages in one customer ingest run; use child workflows for independently reusable business processes.

### Customer State Machine Contract

The customer-visible state machine should be modeled by `ingest_runs.status` plus append-only rows in `events`. OpenWorkflow is the durable executor; Postgres is the customer-facing audit and analytics system.

```text
queued
  -> running
  -> completed

queued
  -> running
  -> failed
```

State machine rules:

1. FastAPI creates the run as `queued` and appends `run_created`.
2. OpenWorkflow claims the run, changes it to `running`, and appends `run_claimed`.
3. Every meaningful workflow step appends a business event to `events` before or after the operation.
4. Failed steps append a `failed` event and update `ingest_runs.error_message`.
5. Successful completion appends `run_completed` and marks the run `completed`.
6. Events remain append-only so the dashboard can explain exactly what happened.
7. OpenWorkflow step history and application events are complementary; do not rely on only one of them.

### Parent Workflow Vs Child Workflow Decision Matrix

Use the parent ingest workflow with durable steps when:

1. The operation belongs to the same customer ingest run.
2. The next step depends on the previous step's output.
3. The dashboard should show one unified run timeline.
4. The operation is a checkpoint, not a standalone business process.
5. Idempotency depends on the same `run_id` and database constraints.

Use a child workflow only when:

1. The operation can be reused independently by another workflow or product feature.
2. The operation may run for a long time and the parent should durably wait while freeing worker capacity.
3. The operation needs its own retry policy, lifecycle, cancellation handling, or dashboard grouping.
4. The operation can be safely represented by its own input/output contract.
5. The team has implemented explicit event mapping so customer observability remains clear.

MVP decision: do **not** create child workflows for `resolve_source`, `fetch_file`, `parse_tabular_data`, `store_raw_rows`, `normalize_python`, `persist_normalized_rows`, or `generate_inventory_predictions`. Keep those as durable steps inside `ingest_data_workflow(run_id)` until there is a concrete need to split them.

### Workflow Steps

```text
claim_run
resolve_source
fetch_file
parse_tabular_data
store_raw_rows
normalize_python
persist_normalized_rows
generate_inventory_predictions
emit_summary_events
mark_run_complete
```

### Workflow Events

```text
run_created
run_claimed
source_received
source_fetched
tabular_data_parsed
raw_rows_stored
normalization_started
normalization_completed
normalized_rows_stored
prediction_started
prediction_completed
predictions_stored
run_completed
run_failed
```

### Reliability Rules

1. Insert raw rows idempotently using `(run_id, source_row_hash)` uniqueness.
2. Insert normalized rows idempotently using `normalized_data.raw_data_id` uniqueness.
3. Insert or update inventory predictions idempotently using a unique key over run, store, product, forecast date, and related event.
4. Append events; never overwrite events during normal operation.
5. Mark runs failed with a useful error message on unrecoverable errors.
6. Keep crash/resume credible: restarting the worker must not duplicate raw, normalized, or prediction rows.

## Normalization Engine

The normalizer is the core IP. It should operate on parsed tabular row dictionaries, not CSV-specific input only.

### Responsibilities

1. Canonicalize store names.
2. Canonicalize product names.
3. Parse mixed date formats.
4. Parse messy prices.
5. Parse quantities.
6. Deduplicate rows using stable hashes.
7. Emit quality notes for corrections and suspicious values.
8. Emit deterministic reorder and stockout signals.
9. Return records compatible with backend Pydantic schemas.

### pandas Normalization Next Steps

Use pandas official docs as the primary reference: https://pandas.pydata.org/

1. Use pandas for source parsing and tabular preparation, especially `read_csv`, `read_excel`, missing-value handling, dtype normalization, and date parsing.
2. Normalize input files into a consistent row dictionary shape before writing to `raw_data`.
3. Convert pandas rows into JSON-safe dictionaries before database insertion; handle `NaN`, `NaT`, timestamps, decimals, and numpy scalar values explicitly.
4. Keep deterministic business normalization in Python functions after pandas parsing so CSV, XLSX, and Google Drive inputs produce the same canonical model.
5. Avoid returning large DataFrames from OpenWorkflow steps because step results are persisted; store rows in Postgres and return counts, ids, or references.
6. Process large files in chunks when needed, especially CSV files that can exceed memory limits.
7. Validate final normalized records against the Pydantic-compatible output contract before persisting.
8. Preserve original source values inside `raw_payload` and useful explainability metadata inside `normalized_payload`.
9. Keep quality notes explicit so every correction can be explained in the dashboard.

## Prediction Engine

The prediction engine is step two after normalization is stable. It should produce explainable store/product stock-need forecasts from persisted normalized sales and seeded demand events.

Do not implement black-box ML for the MVP. The first version should be deterministic, testable, and easy to explain in a demo.

### Prediction Goal

Answer this question for each store and product:

```text
What stock is this store likely to need soon, and why?
```

The demo story should be concrete:

```text
Downtown needs more coffee beans on Black Friday because recent baseline demand is 18 units, Black Friday is a high-traffic shopping event, the event uplift is 10 units, and predicted demand crosses the reorder threshold.
```

### Package Shape

Add a separate predictor package so normalization stays focused on cleaning messy data.

Recommended structure:

```text
packages/predictor/
  predictor/
    __init__.py
    predict.py
  README.md
  requirements.txt
```

The predictor should not import FastAPI or frontend code. It can expose pure functions and a CLI/callable entrypoint for the worker.

### Predictor Inputs

Minimum input objects:

```text
Normalized sales rows:
- run_id
- store_id
- store_name
- product_name
- quantity
- sale_date
- reorder_signal

Calendar events:
- id
- event_name
- event_type
- starts_on
- ends_on
- impact_score
- impact_scope
- product_tags
- payload

Prediction config:
- forecast_window_days
- lookback_days
- default_reorder_points
- event_type_multipliers
```

The worker may query these inputs from Postgres and pass JSON into the Python predictor, or implement the first deterministic calculation in TypeScript. Prefer Python if the logic becomes more analytical, but keep the database writes in the worker.

### Predictor Output Contract

The predictor should return records compatible with `inventory_predictions`.

```json
{
  "run_id": "uuid",
  "store_id": "uuid",
  "product_name": "coffee beans",
  "forecast_date": "2026-11-27",
  "baseline_quantity": 18,
  "predicted_quantity": 28,
  "event_uplift": 10,
  "risk_level": "reorder",
  "related_event_id": "uuid-or-null",
  "explanation_notes": [
    "baseline_from_recent_sales",
    "event_matched_product_tag",
    "black_friday_high_traffic_uplift",
    "predicted_quantity_exceeds_reorder_threshold"
  ],
  "payload": {
    "lookback_days": 30,
    "forecast_window_days": 14,
    "baseline_method": "average_quantity_by_store_product",
    "event_impact_score": 0.85,
    "event_multiplier": 0.55,
    "matched_product_tags": ["coffee beans"]
  }
}
```

### Deterministic Prediction Algorithm

Use this first algorithm. It is intentionally simple and explainable.

1. Select normalized rows for the current `run_id`. If there are too few rows, fall back to all recent normalized rows across completed runs.
2. Group by `store_id` and `product_name`.
3. Compute `baseline_quantity` as the average daily quantity sold over the lookback window. For tiny demo data, use average observed quantity per sale date and round up.
4. Load upcoming `calendar_events` where `starts_on` is between today and `today + forecast_window_days`.
5. Match events to products when either product name is in `product_tags` or product category is represented by a tag. For MVP, exact lower-case string matching is acceptable.
6. Compute an event multiplier from `event_type` and `impact_score`.
7. Compute `event_uplift = ceil(baseline_quantity * event_multiplier)`.
8. Compute `predicted_quantity = baseline_quantity + event_uplift`.
9. Compute `risk_level` by comparing predicted demand against reorder thresholds.
10. Emit explanation notes for every non-obvious decision.

Recommended default config:

```json
{
  "forecast_window_days": 30,
  "lookback_days": 30,
  "event_type_multipliers": {
    "holiday": 0.35,
    "sports": 0.60,
    "shopping": 0.55,
    "seasonal": 0.30,
    "local_event": 0.25
  },
  "risk_thresholds": {
    "watch": 1.10,
    "reorder": 1.35,
    "stockout": 1.75
  }
}
```

Multiplier formula:

```text
event_multiplier = event_type_multipliers[event_type] * impact_score
```

Risk-level rule:

```text
ratio = predicted_quantity / max(baseline_quantity, 1)

if baseline_quantity == 0 and predicted_quantity > 0:
  risk_level = "stockout"
else if ratio >= 1.75:
  risk_level = "stockout"
else if ratio >= 1.35:
  risk_level = "reorder"
else if ratio >= 1.10:
  risk_level = "watch"
else:
  risk_level = "ok"
```

This risk rule is demand-risk oriented. It is separate from `normalized_data.reorder_signal`, which reflects current row-level inventory condition.

### Event Matching Rules

MVP matching:

1. Normalize product and tags with lower-case trim.
2. Match when `product_name == tag`.
3. Also match common categories using a small in-code map.

Suggested category map:

```text
coffee beans -> coffee, coffee beans, beverages, gifts
espresso pods -> coffee, espresso pods, beverages
oat milk -> oat milk, beverages, groceries
tea bags -> tea, tea bags, beverages, gifts
chips -> chips, snacks
soda -> soda, beverages, snacks
frozen pizza -> frozen pizza, snacks
```

If no product tag matches an event, the predictor may still create a low uplift storewide prediction for high-impact national events, but mark it clearly with `storewide_event_uplift`.

### Prediction Workflow Step

Add `generate_inventory_predictions` after `persist_normalized_rows`.

Step behavior:

1. Append `prediction_started` event with run id, forecast window, and lookback window.
2. Query normalized rows for the run and stores involved in the run.
3. Query upcoming calendar events for the forecast window.
4. Run deterministic prediction logic.
5. Insert or update `inventory_predictions` idempotently.
6. Append `predictions_stored` event with prediction count, risky prediction count, and matched event count.
7. Append `prediction_completed` event.
8. If prediction fails, append a failed event and decide based on demo timing whether to fail the run or mark prediction as skipped.

Recommended MVP failure behavior:

1. If normalization or persistence fails, fail the run.
2. If prediction generation fails after normalized rows are saved, append `prediction_failed` and mark the prediction step failed.
3. For the hackathon demo, it is acceptable to continue to `mark_run_complete` with a warning only if dashboard still clearly shows the prediction failure event. Prefer failing if prediction is part of the judged step-two demo.

### External Event API Decision

No external API is required for MVP prediction. Seeded `calendar_events` should be the source of truth for the demo.

Future options:

```text
Nager.Date:
- Best for free public holiday refreshes.
- Good first API after MVP.
- Does not provide local concerts, sports, or impact scoring.

Calendarific:
- Broader holiday coverage and richer observance metadata.
- Useful for international expansion.
- Requires API key and still does not solve demand impact by itself.

PredictHQ:
- Best production-grade demand intelligence option.
- Provides major events, categories, location matching, and impact/rank signals.
- Likely paid and unnecessary for hackathon reliability.

Ticketmaster Discovery API:
- Useful for local concerts/sports/venue events.
- Does not provide retail demand impact scoring; we would still need our own impact rules.
```

Future API integration should be a separate refresh workflow:

```text
refresh_calendar_events_workflow
  -> fetch_external_events
  -> normalize_event_payloads
  -> upsert_calendar_events
  -> append_refresh_events
```

Do not call external event APIs during `ingest_data_workflow`; that would make ingest less reliable and harder to demo.

### Prediction Verification

Minimum tests/checks:

1. Seeded calendar events insert idempotently.
2. Predictor returns at least one `reorder` or `stockout` prediction for the seeded demo data.
3. Re-running the worker does not duplicate predictions.
4. `GET /dashboard` returns predictions from Postgres, not mocked frontend data.
5. Explanation notes show which event caused an uplift.
6. If there are no upcoming events, predictor still returns baseline predictions or emits a clear skipped/no-op event.

### Technology Stack Leverage

1. FastAPI handles stateless API requests, source validation, and typed read endpoints.
2. Pydantic defines stable contracts for ingest requests, normalized records, runs, events, and dashboard responses.
3. OpenWorkflow provides the durable state machine, retry/resume behavior, and checkpointed steps.
4. pandas handles tabular parsing and data preparation before raw row persistence.
5. Postgres stores relational joins, JSONB payloads, indexes, workflow events, and analytics-ready data.
6. React Query owns server data fetching, mutations, refetching, loading states, and errors.
7. ShadCN provides accessible enterprise-grade dashboard components without expanding the MVP into a custom design-system project.

## React Dashboard

The dashboard should look enterprise-ready while staying one screen. Use ShadCN UI components from https://ui.shadcn.com and React Query for all server data.

### Frontend Rules

1. React Query owns dashboard data, runs, events, normalized rows, ingest mutations, loading states, errors, and refetching.
2. Zustand may only store local UI state such as selected run, selected store, filters, and demo mode.
3. Do not store API response collections in Zustand.
4. Use ShadCN components for consistent, accessible dashboard UI.
5. Keep the app to one dashboard screen for the MVP.
6. Ensure desktop and mobile layouts remain usable.
7. Render prediction data from FastAPI only; do not calculate or mock stock predictions in the browser once the API exists.

### Recommended ShadCN Components

```text
button
card
badge
select
table
scroll-area
skeleton
alert
separator
tabs
input
```

### Required UI

1. Ingest panel with local CSV/XLSX upload.
2. Google Drive link/file-id input.
3. Current run status.
4. KPI cards.
5. Store filter.
6. Normalized records table powered by FastAPI data.
7. Workflow/events timeline.
8. Analytics panels from Postgres aggregates and JSONB-backed fields.
9. Upcoming demand events panel backed by `calendar_events`.
10. Predicted stock needs panel backed by `inventory_predictions`.
11. Loading skeletons while React Query fetches data.
12. Clear error alerts for API, upload, Drive, parsing, workflow, and prediction failures.

### Production Design System

The dashboard must look like a polished operations product, not a generic admin template. Use a colorful but disciplined enterprise visual language: dark navy foundation, electric data accents, high-contrast cards, clear status colors, and restrained gradients.

Design direction:

```text
Name: SignalOps Inventory
Mood: command center, clean retail intelligence, energetic but trustworthy
Visual anchors: dark blue shell, bright event colors, glassy cards, crisp tables, status badges, subtle glow accents
Avoid: flat gray-only UI, random rainbow colors, heavy shadows, generic SaaS sidebars, multi-page navigation
```

#### Color Tokens

Use CSS variables through Tailwind/ShadCN. These tokens can live in `apps/web/src/index.css` or the existing global CSS file.

Core palette:

```css
:root {
  --background: 222 47% 7%;
  --foreground: 210 40% 98%;

  --card: 222 44% 10%;
  --card-foreground: 210 40% 98%;

  --popover: 222 44% 9%;
  --popover-foreground: 210 40% 98%;

  --primary: 183 100% 48%;
  --primary-foreground: 222 47% 7%;

  --secondary: 258 90% 66%;
  --secondary-foreground: 210 40% 98%;

  --muted: 220 28% 16%;
  --muted-foreground: 215 20% 68%;

  --accent: 329 86% 60%;
  --accent-foreground: 210 40% 98%;

  --destructive: 0 84% 62%;
  --destructive-foreground: 210 40% 98%;

  --border: 218 32% 22%;
  --input: 218 32% 22%;
  --ring: 183 100% 48%;

  --radius: 1rem;
}
```

Semantic data colors:

```text
cyan / primary: active workflow, current run, ingest action, neutral data highlights
violet / secondary: normalized data, cleaned rows, product intelligence
pink / accent: demand events, holidays, Super Bowl, campaign/event uplift
emerald: healthy, completed, ok, successful persistence
amber: watch, queued, warning, medium risk
orange: reorder, high attention, event uplift
red: stockout, failed, destructive, urgent risk
slate: inactive, skipped, empty, historical context
```

Recommended Tailwind utility mapping:

```text
background shell: bg-slate-950
panel/card: bg-slate-900/80 border-slate-800
elevated card: bg-slate-900/95 border-cyan-400/15
primary action: bg-cyan-400 text-slate-950 hover:bg-cyan-300
secondary action: bg-violet-500 text-white hover:bg-violet-400
event accent: bg-fuchsia-500 text-white
success: bg-emerald-500 text-slate-950
warning: bg-amber-400 text-slate-950
reorder: bg-orange-500 text-white
stockout/failure: bg-red-500 text-white
subtle text: text-slate-400
primary text: text-slate-50
```

#### Page Composition

One dashboard screen should feel like a command center.

Recommended layout:

```text
Top hero/status strip:
- Product name and one-line value proposition
- Current run status badge
- Ingest action
- Optional last updated timestamp

KPI band:
- 4 to 6 colorful KPI cards
- Include raw rows, normalized rows, quality issues, reorder/stockout, predicted risks

Main grid:
- Left/wide column: normalized records table and predicted stock needs
- Right/narrow column: workflow timeline and upcoming demand events

Filter row:
- Store filter
- Run filter
- Risk filter
- Refresh action
```

Desktop grid:

```text
container: max-w-7xl mx-auto px-6 py-6
main grid: grid grid-cols-12 gap-4
wide panels: col-span-12 xl:col-span-8
side panels: col-span-12 xl:col-span-4
KPI cards: grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4
```

Mobile layout:

```text
single column
hero first
ingest action visible near top
KPI cards stack in 1 column
tables become horizontal scroll areas or compact cards
timeline and event panels remain below primary tables
```

#### Typography

Use system fonts for implementation speed, with strong hierarchy.

Recommended font stack:

```css
font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
```

Type scale:

```text
page title: text-2xl md:text-3xl font-semibold tracking-tight
section title: text-sm font-semibold uppercase tracking-[0.18em] text-slate-400
card metric: text-2xl md:text-3xl font-semibold tabular-nums
table text: text-sm
metadata: text-xs text-slate-400
badge text: text-xs font-medium
```

Use `tabular-nums` for KPI numbers, quantities, prices, row counts, dates, and prediction values.

#### Card System

All cards should share a production-grade panel treatment.

Base card style:

```text
rounded-2xl border border-slate-800 bg-slate-900/80 shadow-sm shadow-black/20 backdrop-blur
```

Highlighted card style:

```text
rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/30 shadow-lg shadow-cyan-950/20
```

Event card style:

```text
rounded-2xl border border-fuchsia-400/20 bg-gradient-to-br from-slate-900 via-slate-900 to-fuchsia-950/30
```

Risk card style:

```text
rounded-2xl border border-orange-400/25 bg-gradient-to-br from-slate-900 via-slate-900 to-orange-950/30
```

Rules:

1. Cards should have clear headings, one primary value, and one supporting line.
2. Use subtle gradients on important panels only. Do not put gradients on every card.
3. Keep card padding consistent: `p-4` on mobile, `p-5` or `p-6` on desktop.
4. Use borders more than heavy shadows.
5. Use icons only if already available; do not add a large icon dependency just for decoration.

#### KPI Cards

KPI cards must be colorful and information-dense.

Recommended KPI card set:

```text
Rows Ingested: cyan
Rows Normalized: violet
Quality Issues: amber
Current Reorders: orange
Predicted Reorders: fuchsia
Stockout Risk: red
```

Each KPI card should include:

```text
label
metric
short context line
small badge or spark indicator
```

Example content:

```text
Predicted Reorders
12
Next 30 days across 3 stores
```

#### Badge System

Use ShadCN badges with consistent semantic classes.

Status badges:

```text
queued: bg-amber-400/15 text-amber-300 border-amber-400/30
running: bg-cyan-400/15 text-cyan-300 border-cyan-400/30
completed: bg-emerald-400/15 text-emerald-300 border-emerald-400/30
failed: bg-red-400/15 text-red-300 border-red-400/30
skipped: bg-slate-400/15 text-slate-300 border-slate-400/30
```

Risk badges:

```text
ok: bg-emerald-400/15 text-emerald-300 border-emerald-400/30
watch: bg-amber-400/15 text-amber-300 border-amber-400/30
reorder: bg-orange-400/15 text-orange-300 border-orange-400/30
stockout: bg-red-400/15 text-red-300 border-red-400/30
```

Event badges:

```text
holiday: bg-fuchsia-400/15 text-fuchsia-300 border-fuchsia-400/30
sports: bg-cyan-400/15 text-cyan-300 border-cyan-400/30
shopping: bg-violet-400/15 text-violet-300 border-violet-400/30
seasonal: bg-emerald-400/15 text-emerald-300 border-emerald-400/30
local_event: bg-orange-400/15 text-orange-300 border-orange-400/30
```

#### Tables

Tables should feel dense but readable.

Table rules:

1. Use sticky or visually persistent headers when table panels scroll.
2. Use `text-slate-400` for secondary metadata.
3. Use risk/status badges instead of plain text for operational states.
4. Align numeric columns right when possible.
5. Use `font-medium text-slate-100` for product and store names.
6. Use zebra or hover row treatments, not both aggressively.

Recommended row hover:

```text
hover:bg-cyan-400/5 transition-colors
```

Recommended table container:

```text
rounded-xl border border-slate-800 overflow-hidden
```

#### Workflow Timeline

The timeline is a key demo element and should look alive.

Timeline style:

```text
vertical rail: border-l border-slate-800
started/current dot: bg-cyan-400 shadow-cyan-400/30
succeeded dot: bg-emerald-400 shadow-emerald-400/30
failed dot: bg-red-400 shadow-red-400/30
skipped dot: bg-slate-500
```

Timeline item content:

```text
step name
event type
status badge
timestamp
short payload summary when useful
```

Workflow steps should display as human-readable labels:

```text
claim_run -> Claim Run
parse_tabular_data -> Parse File
store_raw_rows -> Store Raw Rows
normalize_python -> Normalize Records
persist_normalized_rows -> Save Normalized Rows
generate_inventory_predictions -> Generate Predictions
mark_run_complete -> Complete Run
```

#### Prediction Visual Language

Prediction features should have a distinct event-intelligence feel.

Use fuchsia/pink for event-driven demand and orange/red for operational risk.

Prediction row emphasis:

```text
event uplift: text-fuchsia-300
predicted quantity: text-cyan-300 font-semibold tabular-nums
baseline quantity: text-slate-400 tabular-nums
reorder risk: text-orange-300
stockout risk: text-red-300
```

Upcoming events cards should show:

```text
event name
date or date range
impact score as a compact pill
event type badge
affected product tags as small muted chips
```

Impact score styling:

```text
0.00-0.39: slate/cyan subtle
0.40-0.69: amber
0.70-1.00: fuchsia/orange high-impact
```

#### Forms And Inputs

Ingest controls need to feel safe and clear.

Rules:

1. Primary ingest button should be cyan and visually dominant.
2. Destructive actions should not be introduced for MVP.
3. File input/dropzone should use a dashed cyan border and clear accepted formats.
4. Google Drive input should look secondary, not more important than local/seeded ingest.
5. Disabled/loading states must be obvious and prevent duplicate ingest submissions.

Dropzone style:

```text
rounded-2xl border border-dashed border-cyan-400/30 bg-cyan-400/5 hover:bg-cyan-400/10 transition-colors
```

#### Loading, Empty, And Error States

Loading:

```text
Use ShadCN Skeleton with dark slate blocks.
Keep panel dimensions stable while loading.
Show skeletons for KPI cards, table rows, and timeline items.
```

Empty states:

```text
Use a concise title, one sentence, and a primary action when relevant.
Example: No predictions yet. Run an ingest to generate event-aware stock needs.
```

Errors:

```text
Use destructive alert styling with a short human-readable message.
Include the failed step if available.
Do not dump raw stack traces in the UI.
```

#### Motion And Interaction

Keep motion subtle and useful.

Allowed motion:

```text
hover color transitions
button active scale at 98 percent
new run status pulse while running
timeline current-step glow
table row hover
```

Avoid:

```text
large animated backgrounds
continuous distracting animations
slow transitions over 200ms
animation required to understand data
```

#### Accessibility

The colorful UI must remain accessible.

Requirements:

1. Do not rely on color alone. Pair color with text labels and badges.
2. Maintain high text contrast on dark backgrounds.
3. Keep focus rings visible with cyan ring tokens.
4. Buttons and controls need clear disabled/loading states.
5. Tables need readable labels on mobile or horizontal scroll with visible affordance.
6. Dates and numbers should be text, not only visual charts.

#### Implementation Rules For Developer D

1. Use ShadCN components as the base, then apply these tokens/classes.
2. Custom dashboard components are allowed and encouraged when they improve reuse, but they must be composed from ShadCN primitives and styled with the same ShadCN/Tailwind token system.
3. Do not replace ShadCN primitives with bespoke versions for common UI elements. Use ShadCN `Card`, `Button`, `Badge`, `Table`, `Select`, `Tabs`, `Alert`, `Skeleton`, `ScrollArea`, `Input`, and `Separator` as the foundation.
4. Good custom components include `KpiCard`, `RunStatusBadge`, `RiskBadge`, `EventTypeBadge`, `WorkflowTimeline`, `PredictionTable`, `UpcomingEventsPanel`, `IngestPanel`, and `DashboardSection`.
5. Keep custom styling in small utility functions or component class names. Do not build a full design-system package during the hackathon.
6. Create small helpers for badge variants if repeated often, for example `getRunStatusClass`, `getRiskClass`, and `getEventTypeClass`.
7. Keep the dashboard one screen. Do not add side navigation just to make it feel enterprise.
8. Prioritize the hero, KPI cards, normalized table, prediction table, and workflow timeline before decorative polish.
9. Verify mobile at narrow width before demo freeze.

ShadCN composition rule:

```text
Custom component = domain-specific wrapper around ShadCN primitives + project tokens.

Examples:
- KpiCard wraps ShadCN Card/CardHeader/CardContent.
- RiskBadge wraps ShadCN Badge with risk-level classes.
- PredictionTable wraps ShadCN Table with formatted inventory prediction rows.
- IngestPanel wraps ShadCN Card, Button, Input, Alert, and Skeleton states.

Avoid:
- Custom button implementations instead of ShadCN Button.
- Custom select/dropdown implementations instead of ShadCN Select.
- Custom table markup that ignores ShadCN Table styling.
- One-off color classes that do not match the design tokens.
```

### Prediction UI

Add prediction UI only after the core ingest dashboard works. Keep it on the same screen.

Recommended panels:

1. `Upcoming Demand Events` card list showing event name, date range, event type, impact score, and affected product tags.
2. `Predicted Stock Needs` table showing store, product, forecast date, baseline quantity, predicted quantity, event uplift, risk badge, and explanation.
3. `Prediction KPIs` cards for predicted reorder count, predicted stockout count, upcoming event count, and high-impact event count.
4. Optional store filter should apply to normalized records and predictions together.
5. Optional risk filter can show only `watch`, `reorder`, or `stockout` predictions.

Prediction table columns:

```text
Store
Product
Forecast Date
Baseline
Predicted Need
Event Uplift
Risk
Related Event
Reason
```

Risk badge colors:

```text
ok: neutral
watch: secondary/warning
reorder: warning/attention
stockout: destructive
```

UX requirements:

1. Every prediction row must show a human-readable reason, not just a number.
2. If there are no predictions yet, show an empty state explaining that predictions are generated after ingest.
3. If there are events but no matching product predictions, show upcoming events separately so seeded events are still visible.
4. Keep mobile usable by making the prediction table horizontally scrollable or card-based on small screens.
5. Do not add a separate forecasting page for MVP.

## Analytics

Analytics should run from Postgres through FastAPI, then render through React Query and ShadCN tables/cards.

### MVP Analytics

1. Total raw rows.
2. Total normalized rows.
3. Quality issue count.
4. Reorder count.
5. Stockout count.
6. Predicted reorder count.
7. Predicted stockout count.
8. Upcoming event count.
9. Rows by store.
10. Recent runs and statuses.
11. Workflow event counts by step and status.

### Future-Friendly Analytics

1. Source quality by file type.
2. Most common normalization corrections.
3. Store-level inventory risk.
4. Product-level reorder patterns.
5. Run duration by workflow step.
6. Prediction accuracy after actual sales arrive.
7. Event impact by product category.
8. Forecasted risk by store and week.

## Work Split

### Developer A - Database And FastAPI

1. Create schema and migrations.
2. Add required indexes and JSONB fields.
3. Add Pydantic schemas for ingest, runs, events, records, and dashboard analytics.
4. Implement `POST /ingest` and read endpoints.
5. Ensure dashboard queries use indexed columns and explicit joins.
6. Add `calendar_events` and `inventory_predictions` tables in a second migration when prediction work starts.
7. Seed US holidays and major demand events idempotently.
8. Add Pydantic schemas and API reads for calendar events, predictions, and prediction KPIs.

### Developer B - Normalizer

1. Make normalization source-agnostic over parsed row dictionaries.
2. Emit stable hashes, canonical fields, quality notes, and reorder signals.
3. Keep output compatible with Pydantic models.
4. Provide a CLI/callable path for the worker.
5. Coordinate product names/categories with the predictor so event `product_tags` can match normalized product names.

### Developer B2 - Predictor

If the team has capacity, assign the predictor to the normalizer owner or a separate developer.

1. Create `packages/predictor` with pure deterministic prediction functions.
2. Accept normalized sales rows and calendar event rows as JSON-compatible inputs.
3. Emit records matching `inventory_predictions`.
4. Implement event matching through normalized product names and product tags.
5. Emit explanation notes for every uplift and risk decision.
6. Provide a CLI/callable entrypoint for the worker.
7. Add demo fixtures that guarantee at least one `reorder` or `stockout` prediction.

### Developer C - OpenWorkflow Worker

1. Claim queued runs.
2. Resolve source metadata.
3. Fetch Google Drive files when feasible.
4. Parse CSV/XLSX with pandas.
5. Store raw rows before normalization.
6. Call the normalizer.
7. Persist normalized rows idempotently.
8. Call the predictor after normalized rows are persisted.
9. Persist inventory predictions idempotently.
10. Emit events for every meaningful step, including prediction start/completion/failure.
11. Own crash/resume demo reliability.

### Developer D - React Dashboard

1. Build the single-screen dashboard.
2. Use ShadCN components for ingest controls, cards, tables, badges, skeletons, and alerts.
3. Use React Query for all API reads and mutations.
4. Add upload and Google Drive input flows.
5. Render KPIs, analytics, normalized data, event timeline, upcoming events, and predicted stock needs.
6. Add prediction empty/error states without storing API response data in Zustand.

## Hard Cut Rules

1. If Google Drive blocks progress, keep local CSV/XLSX upload and seeded CSV working.
2. If upload blocks progress, use seeded CSV only.
3. If XLSX parsing blocks progress, keep CSV parsing working and document XLSX as the next fix.
4. If dashboard polish blocks progress, keep the ingest/run/events path visible and drop extra styling.
5. Do not drop the normalizer, raw row persistence, indexed database reads, or event timeline.
6. If prediction work blocks the core demo, keep seeded `calendar_events` visible and postpone `inventory_predictions` generation.
7. If external event APIs block progress, drop them entirely and use seeded events only.

## Definition Of Done

1. User can ingest CSV/XLSX or a seeded file from the dashboard.
2. Google Drive reference path is implemented if time allows, or clearly stubbed behind the same source contract.
3. pandas-parsed rows are stored in `raw_data.raw_payload`.
4. Normalized records are stored in `normalized_data`.
5. Required indexes exist for run, raw row, normalized row, event, and JSONB queries.
6. FastAPI endpoints return Pydantic-validated responses.
7. React Query fetches dashboard data and refreshes after ingest.
8. ShadCN components render an enterprise-grade dashboard.
9. OpenWorkflow events show source resolution, parsing, raw storage, normalization, persistence, completion, and failures.
10. Step-two prediction tables exist and are seeded with US holidays and major demand events.
11. Inventory predictions are generated from persisted normalized rows plus `calendar_events`, then stored in `inventory_predictions`.
12. Dashboard shows upcoming events and predicted stock needs with explanation notes.
13. Killing and restarting the worker does not duplicate raw, normalized, or prediction rows.
