# Agent Development Guide

This guide defines how OpenCode, Claude, and any other coding agents must work on this project.

Project goal: build a narrow hackathon MVP that converts messy retail CSV data into durable, normalized, observable Postgres-backed inventory data through a Python normalization engine, OpenWorkflow orchestration, FastAPI APIs, and a React dashboard.

## Official References

Agents must check the official docs before introducing unfamiliar APIs, patterns, or dependencies.

- FastAPI: https://fastapi.tiangolo.com/
- Pydantic: https://docs.pydantic.dev/latest/
- OpenWorkflow: https://openworkflow.dev/
- OpenWorkflow GitHub: https://github.com/openworkflowdev/openworkflow
- PostgreSQL: https://www.postgresql.org/docs/
- Supabase: https://supabase.com/docs
- React: https://react.dev/
- TanStack Query: https://tanstack.com/query/latest/docs/framework/react/overview
- Zustand: https://zustand.docs.pmnd.rs/

## Core Architecture

Keep this boundary intact:

```text
frontend/
  React dashboard
  React Query for server state
  Zustand only for local UI state

backend/
  FastAPI API
  Pydantic request/response schemas
  Starts workflows and exposes read APIs

orchestrator/
  OpenWorkflow integration
  Durable ingest workflow steps
  Retry/resume/event emission

pipeline/
  Python normalization engine
  CSV parsing, canonicalization, dedupe, quality notes

db/
  PostgreSQL/Supabase schema and migrations
```

The required data flow is:

```text
messy CSV
  -> FastAPI POST /ingest
  -> OpenWorkflow run
  -> load CSV
  -> store raw rows
  -> normalize with pipeline/normalize.py
  -> persist normalized rows
  -> append workflow events
  -> FastAPI read APIs
  -> React dashboard
```

## Non-Negotiable Scope Rules

- Do not add auth, RLS, realtime, storage, edge functions, ML, or multipage navigation unless explicitly requested.
- Do not let the frontend talk directly to Supabase/Postgres.
- Do not duplicate workflow logic inside FastAPI.
- Do not duplicate server data into Zustand.
- Do not create generic CRUD screens.
- Do not add new services if plain Postgres, FastAPI, OpenWorkflow, Python, and React are enough.
- Prefer small, production-shaped implementation over broad unfinished features.

## Directory Responsibilities

### `pipeline/`

Owns the normalization IP.

Required behavior:

- Parse messy CSV rows.
- Canonicalize store names.
- Canonicalize product names.
- Parse mixed date formats.
- Parse messy prices.
- Parse quantities.
- Dedupe rows.
- Emit quality notes.
- Return records compatible with backend Pydantic schemas.

Rules:

- Keep normalization deterministic.
- Preserve enough notes to explain every correction.
- Do not write directly to the database from normalization code unless explicitly designed as a workflow step.
- Do not import frontend, orchestrator, or API concerns.

### `backend/`

Owns API validation and read endpoints.

Required endpoints from the execution plan:

- `POST /ingest`
- `GET /dashboard`
- `GET /runs`
- `GET /events`

Rules:

- Use FastAPI routers for API organization.
- Use Pydantic models for request and response contracts.
- Validate all external input at the API boundary.
- Keep OpenAPI docs working.
- Start workflows through the orchestrator integration.
- Serve dashboard data from persisted database records.
- Do not run normalization directly in request handlers except for temporary smoke tests.
- Do not keep durable workflow state in memory.

### `orchestrator/`

Owns OpenWorkflow execution.

Required workflow path:

```text
load-csv
  -> store-raw
  -> normalize-python
  -> persist-normalized
  -> events
```

Rules:

- Every meaningful workflow operation must be a durable step.
- Steps must be idempotent where retries can occur.
- Emit events for step start, success, failure, retry, and resume where practical.
- Use `run_id` and `workflow_id` consistently.
- Do not hide failures without appending an event.
- Keep crash/resume demo credible: database constraints must prevent duplicate raw or normalized rows.

### `db/`

Owns schema and migrations.

Minimum tables:

- `users`
- `stores`
- `raw_data`
- `normalized_data`
- `events`

Required constraints:

- `raw_data.source_row_hash` should be unique.
- `normalized_data.raw_data_id` should be unique.
- `events.run_id` should be indexed.
- `events.workflow_id` should be indexed.
- `events.step_name` should be indexed.

Rules:

- Prefer migrations over ad hoc schema edits.
- Store raw CSV row payloads in `raw_data.raw_payload`.
- Store normalized structured payloads in `normalized_data.normalized_payload`.
- Keep `events` append-only.
- Do not delete workflow events during normal operation.
- Use Supabase only as managed Postgres unless explicitly expanding scope.

### `frontend/`

Owns the judge-facing dashboard.

Required UI:

- KPI cards.
- Store filter.
- Normalized data table.
- Workflow/events timeline.
- Ingest trigger.

Rules:

- Use React Query for API data, mutations, loading states, and refetching.
- Use Zustand only for selected store, selected run, filters, and demo mode.
- Do not store API response data in Zustand.
- Keep the MVP to one dashboard screen.
- Prefer clear operational storytelling over generic UI polish.
- Ensure desktop and mobile layouts remain usable.

## Database Contract

Use this contract unless explicitly changed by the team.

```text
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
- normalized_payload
- product_name
- quantity
- price
- sale_date
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

## API Contract Rules

- Pydantic schemas are the source of truth for backend I/O.
- Frontend code must match API response shapes, not database internals.
- If an API shape changes, update the corresponding frontend query usage in the same change.
- Prefer typed response models for every endpoint.
- Return stable IDs, timestamps, and status fields needed by the dashboard.

## State Management Rules

React Query owns:

- Dashboard summary data.
- Runs.
- Events.
- Normalized rows.
- Ingest mutation state.
- Refetching after ingest.

Zustand owns only:

- Selected store.
- Selected run.
- Filters.
- UI/demo mode.
- Local panel/table state.

Never put server collections in Zustand.

## Workflow Reliability Rules

Agents must preserve retry/resume safety.

- Raw row inserts must be dedupe-safe.
- Normalized row inserts must be dedupe-safe.
- Workflow events must be append-only.
- Retrying a step must not create duplicate normalized records.
- A killed worker must be able to resume from the last safe checkpoint.
- Any manual shortcut that breaks the crash/resume demo is forbidden.

## Dependency Rules

- Add dependencies only when they solve a concrete MVP problem.
- Prefer official libraries and documented APIs.
- Do not add large frameworks for small utilities.
- Do not mix competing state/data libraries.
- Do not introduce Supabase platform features unless the execution plan changes.

## Environment Rules

Shared contract:

```bash
DATABASE_URL="postgresql://..."
```

Rules:

- Backend and orchestrator must use the same database contract.
- Secrets must come from environment variables.
- Do not hardcode database URLs, Supabase keys, or local machine paths.
- Keep local run commands simple.

Expected local services:

```bash
backend:      uvicorn app.main:app --reload
orchestrator: npm run worker
frontend:     npm run dev
```

## Agent Workflow

Before coding:

- Read `HACKATHON_EXECUTION_PLAN.md`.
- Inspect the relevant directory before editing.
- Confirm existing project conventions.
- Prefer the smallest correct change.

While coding:

- Keep changes scoped to the requested workstream.
- Do not modify unrelated files.
- Preserve public contracts unless updating all consumers.
- Use official docs when unsure.
- Keep code readable and boring.

After coding:

- Run the narrowest useful verification.
- For backend changes, run relevant Python tests or import/startup checks.
- For frontend changes, run typecheck/build if available.
- For orchestrator changes, verify worker startup or workflow smoke path if available.
- Report what changed and what was verified.

## Integration Checkpoints

Agents should optimize toward these milestones:

1. Database/API contract exists and can read/write typed rows.
2. Normalizer emits records compatible with Pydantic schemas.
3. Workflow writes raw rows, normalized rows, and events.
4. Dashboard reads real API data.
5. Crash/resume demo works without code changes.

## Hard Cut Rule

If time is short, protect the core demo:

```text
messy CSV
  -> durable workflow
  -> normalized Postgres rows
  -> observable dashboard
  -> crash/resume with visible events
```

Drop first:

- Extra dashboard polish.
- Supplier purchase order features.
- Realtime updates.
- Auth.
- Multi-page navigation.
- ML forecasting.

## Forbidden Patterns

- FastAPI request handler performs the whole workflow inline.
- Frontend reads directly from Supabase.
- Zustand stores fetched dashboard data.
- Workflow retries create duplicate rows.
- Events are overwritten instead of appended.
- Mock dashboard data remains after real API data exists.
- Agent adds broad infrastructure instead of finishing the MVP path.
- Agent changes database contract without updating backend, orchestrator, and frontend consumers.

## Definition Of Done

A change is done only when:

- It preserves the project architecture.
- It keeps the MVP scope narrow.
- It updates all affected layers.
- It uses documented APIs from official sources.
- It has been verified with the most relevant available command.
- It improves or preserves the crash/resume demo path.
