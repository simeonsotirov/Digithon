# Docker Stack Progress

## What Changed

The local development stack is now containerized with Docker Compose.

Services included:

- Postgres database
- One-shot database migration runner
- FastAPI backend
- React/Vite frontend dashboard
- OpenWorkflow dashboard
- OpenWorkflow ingest worker/scheduler

## Local URLs

```text
Postgres:               localhost:55432
FastAPI:                http://localhost:8000
React dashboard:        http://localhost:5173
OpenWorkflow dashboard: http://localhost:3001
```

## Recommended Tmux Startup

Use the one-script startup for local development:

```bash
./start-local.sh
```

This keeps separate tmux windows for Docker infrastructure, FastAPI, the worker, the React UI, and cleanup helpers. The Docker window starts only shared infrastructure by default:

```bash
docker compose up -d --build postgres migrate openworkflow
```

The API and worker windows wait for Docker Postgres before starting local host processes.

## Fully Dockerized Run Command

```bash
docker compose up -d --build
```

## Files Added

- `Dockerfile.api`
- `Dockerfile.web`
- `Dockerfile.openworkflow`
- `Dockerfile.worker`
- `openworkflow.config.ts`
- `openworkflow/placeholder.ts`
- `openworkflow/ingest.ts`

## Files Updated

- `docker-compose.yml`
- `package.json`
- `package-lock.json`
- `README.md`
- `start-local.sh`
- `db/migrations/001_init.sql`

## Verification Completed

- FastAPI health endpoint responds at `http://localhost:8000/health`.
- React dashboard responds at `http://localhost:5173`.
- OpenWorkflow dashboard responds at `http://localhost:3001`.
- `docker compose ps` shows `postgres`, `api`, `web`, `openworkflow`, and `worker` running.
- The migration container runs all SQL migrations after Postgres is healthy and stops on SQL errors.
- Existing local database volumes safely receive the `ingest_runs.workflow_id` column before the workflow index is created.

## Important Caveat

Real ingest runs are now scheduled into OpenWorkflow and should appear in the OpenWorkflow dashboard after `POST /ingest` creates a queued app run. The worker container supervises both the scheduler and the OpenWorkflow worker runtime.
