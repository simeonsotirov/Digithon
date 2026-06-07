# apps/web — React Dashboard

## Start

```bash
cd apps/web
npm install
npm run dev
```

Opens at http://localhost:5173

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8000` | FastAPI base URL |

Create `.env.local` to override:

```bash
VITE_API_BASE_URL=http://localhost:8000
```

## API Endpoints Used

| Hook | Method | Endpoint | Purpose |
|---|---|---|---|
| `useDashboard` | GET | `/dashboard` | KPIs, stores, runs, records, events |
| `useRuns` | GET | `/runs` | Run list for filter dropdown |
| `useEvents(runId)` | GET | `/events?run_id=...` | Events for a selected run |
| `useIngestMutation` | POST | `/ingest` | Queue a new ingest run |

All data comes from FastAPI only. The dashboard never talks directly to Postgres.

## Demo Click Path

1. Start the API (`poetry run api`) and worker (`npm run worker` in `apps/worker`).
2. Open http://localhost:5173.
3. Click **"Ingest messy CSV"** — the run status banner turns yellow (`running`).
4. Watch KPI cards increment as the worker normalizes rows.
5. Use the **Store** dropdown to filter records by canonical store name.
6. Use the **Run** dropdown to isolate a single run's records and events.
7. The **Workflow Events** timeline shows every step the worker executed.
8. To demo crash/resume: kill the worker mid-run, restart it — events resume from the last safe step, no duplicate rows.

## Mocked Data

None. All data is live from the API. If the API is unreachable, the dashboard shows:

> API unavailable — start the backend with `poetry run api`.
