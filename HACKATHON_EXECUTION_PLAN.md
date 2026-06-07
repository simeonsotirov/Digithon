# 7-Hour Hackathon Execution Plan
### Demand-driven inventory normalizer — messy CSV → durable workflow → Postgres API → dashboard

---

## The idea in one line
Ingest a deliberately messy retail CSV, run it through a **Python normalization engine (the IP)** orchestrated by **OpenWorkflow** (durable, resumable, retryable), persist raw/normalized data and workflow events in **Postgres/Supabase**, expose the data through a **FastAPI + Pydantic API**, and surface operational insights on a **React dashboard** powered by **React Query**.

## Architecture
```
 React dashboard
   React Query + optional Zustand UI state
        │
        ▼
 FastAPI + Pydantic API
   POST /ingest, GET /dashboard, GET /runs, GET /events
        │
        ▼
 Postgres / Supabase
   users, stores, raw_data, normalized_data, events
        ▲
        │ writes durable business data + workflow events
 ┌──────────────────────── OpenWorkflow Engine ────────────────────────┐
 │ load-csv → store-raw → normalize-python → persist-normalized → events │
 │         durable steps, retries, resume, observable execution          │
 └──────────────────────────────┬───────────────────────────────────────┘
                                │ calls
                                ▼
                       pipeline/normalize.py
                       THE IP: canonical store/product,
                       date+price+qty parsing, dedupe,
                       quality notes, stockout/reorder logic
```
Every workflow step is managed by OpenWorkflow with retry/resume policies. The application database stores raw data, normalized data, stores, users, and an append-only events table so the system can explain what happened and continue after failures. Kill the worker mid-run, restart, and the workflow resumes from the last safe point. **That resume-after-crash moment is your demo's "wow."**

Use Supabase as managed Postgres if it stays frictionless. If Supabase slows the team down, replace it with plain Postgres and keep the same FastAPI database layer.

---

## MVP components
- `pipeline/normalize.py` — Python normalization engine. It parses messy CSV rows, canonicalizes stores/products, fixes dates/prices/quantities, dedupes rows, and emits normalized records plus quality notes.
- `backend/` — FastAPI + Pydantic API. It validates ingest requests, starts OpenWorkflow runs, and serves dashboard/read APIs from Postgres.
- `orchestrator/` — OpenWorkflow engine integration. It owns workflow steps, retries, resume behavior, and event emission.
- `db/` — Postgres/Supabase schema and migrations for `users`, `stores`, `raw_data`, `normalized_data`, and `events`.
- `frontend/` — React dashboard using React Query for server state. Zustand is reserved for UI-only state such as selected store, selected run, filters, and demo mode.
- `messy_sales.csv` + `make_messy_data.py` — the dataset and its generator.

The MVP is production-shaped but intentionally narrow. Keep the workflow path simple: ingest CSV, store raw rows, normalize in Python, persist normalized rows, emit events, and render the dashboard.

---

## MVP scope

### In scope
- Postgres/Supabase as the application database.
- FastAPI + Pydantic as the API boundary.
- OpenWorkflow as the durable workflow engine.
- Python as the normalization/IP layer.
- React dashboard with React Query for API data.
- Zustand only for local UI state.
- Workflow events persisted for observability and recovery/debugging.

### Out of scope for the hackathon MVP
- Auth/RLS unless absolutely required.
- Supabase realtime, storage, edge functions, or platform-specific features.
- Generic CRUD screens.
- Multi-page app navigation.
- ML forecasting.
- Frontend direct database access.
- Duplicating server data into Zustand.

### Responsibility split
- **FastAPI:** validate requests, trigger workflows, expose read APIs.
- **OpenWorkflow:** execute ingest workflows, retries, resume, event emission.
- **Python:** normalize CSV rows and return validated structured data.
- **Postgres/Supabase:** store users, stores, raw rows, normalized rows, and events.
- **React Query:** fetch server state and refresh dashboard data after ingest.
- **Zustand:** selected store, selected run, filters, and UI mode only.

---

## Database contract

Minimum tables:
- `users`
- `stores`
- `raw_data`
- `normalized_data`
- `events`

Recommended fields:

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

Recommended constraints:
- `raw_data.source_row_hash` should be unique.
- `normalized_data.raw_data_id` should be unique.
- `events.run_id`, `events.workflow_id`, and `events.step_name` should be indexed.

These constraints keep retries safe and make the crash-resume demo credible.

---

## SPLIT 1 — Timeline (solo or whole team, hour by hour)

| Block | Time | Goal | Definition of done |
|------|------|------|--------------------|
| **0. Setup** | 0:00–0:30 | Repo, Python, Node, FastAPI, OpenWorkflow, Postgres/Supabase connection | API, worker, DB connection, and React app start locally |
| **1. Database + API contract** | 0:30–1:30 | Create tables and Pydantic schemas for users, stores, raw data, normalized data, events | FastAPI can read/write a test row and return typed responses |
| **2. Normalizer** | 1:30–2:30 | Harden `normalize.py` on the messy CSV; tune canonical maps + parsing rules | Python emits normalized records compatible with Pydantic schemas |
| **3. Orchestration** | 2:30–4:00 | Wire OpenWorkflow: load CSV → store raw → normalize → persist normalized → emit events | Workflow run writes DB rows and events, not hand-created data |
| **4. Dashboard** | 4:00–5:30 | React dashboard with React Query: KPIs, store filter, normalized table, events timeline | Open localhost and see real DB data from the workflow |
| **5. Demo polish + buffer** | 5:30–7:00 | Crash-and-resume demo, seed a guaranteed messy row/stockout, rehearse the 3-min pitch | Demo runs twice without touching code |

**Hard cut line at hour 5:** if anything is behind, drop extra dashboard polish and supplier PO features. The core demo is messy CSV → durable workflow → normalized Postgres data → React dashboard → crash/resume with visible events.

---

## SPLIT 2 — By workstream (team of ~3-4, run in parallel after Setup)

**Person A — Pipeline / IP (Python)**
- Own `normalize.py`: canonical store/product maps, date/price/qty parsers, dedupe, data-quality notes.
- Deliver normalized records compatible with the Pydantic contract early (hour 1) so B and C can build against it.
- Stretch: define reorder points, stockout logic, and purchase-order candidates.
- Stretch: a `--quality-report` flag that counts each fix type (great pitch material).

**Person B — Orchestration / backend (TypeScript + OpenWorkflow)**
- Get OpenWorkflow worker running and integrated with the ingest workflow.
- Build durable steps: load CSV, store raw rows, call Python, persist normalized rows, emit events.
- Own retry/resume behavior and the crash-and-resume demo path.

**Person C — Backend / API (FastAPI + Pydantic + DB)**
- Own the Postgres/Supabase schema and migrations.
- Build Pydantic models for raw data, normalized data, stores, events, and dashboard summary.
- Build API endpoints for triggering ingest and reading dashboard data.

**Person D — Frontend (React)**
- Build the dashboard from the API contract: KPI cards, normalized data table, stores filter, events timeline.
- Use React Query for all server data and mutations.
- Use Zustand only for UI state such as selected store, selected run, filters, or demo mode.
- Own visual polish and the judge-facing dashboard flow.

**Shared / integration checkpoints:** sync at 0:30 (contract agreed), 3:30 (end-to-end data flowing), 6:00 (demo freeze).

---

## Run instructions (drop-in)
```bash
# 1. Database
# Use Supabase or plain Postgres. Keep the same DATABASE_URL contract.
export DATABASE_URL="postgresql://..."

# 2. Backend API
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload

# 3. OpenWorkflow worker
cd ../orchestrator
npm install
npm run worker

# 4. Frontend
cd ../frontend
npm install
npm run dev
```

---

## 3-minute demo script
1. **The problem (20s).** Show `messy_sales.csv` — "this is what a real store export looks like: stores spelled multiple ways, dates in multiple formats, prices as `$1.20`, `1,20`, and invalid values."
2. **The IP (40s).** Trigger ingest from the React dashboard. FastAPI validates the request, OpenWorkflow starts the run, and Python normalizes the messy data.
3. **The system (40s).** Show Postgres/Supabase rows: raw data, normalized data, stores, and workflow events. The API and dashboard are reading real persisted data, not static JSON.
4. **The wow — durability (40s).** Re-run; **kill the worker mid-run**; restart it. OpenWorkflow resumes from the last safe point and events show exactly what happened.
5. **The pitch (40s).** "The defensible IP is normalizing chaotic retail data into trustworthy operational records, and every step is durable, replayable, and observable."

---

## Scope guardrails (so 7 hours is enough)
- **Fake the data, real the logic.** No live POS integration — the messy CSV *is* the integration story.
- **Simple database, not a platform project.** Use Supabase as managed Postgres only. If it causes friction, switch to plain Postgres.
- **One dashboard screen.** Resist multi-page navigation.
- **Rules over ML.** Reorder points and simple thresholds demo identically to a model in 3 minutes.
- **React Query owns server data.** Zustand is only for UI state.
- **OpenWorkflow owns execution.** FastAPI triggers workflows and serves reads; it does not duplicate workflow logic.
- **Seed one guaranteed messy/failure case** before judging so the normalization and recovery moments always fire.

**Verdict on feasibility:** doable in 7 hours if the team keeps the scope narrow. The winning story is not the stack itself; it is messy CSV → durable workflow → normalized Postgres records → observable dashboard → crash/resume recovery.
