# Digithon

Demand-driven inventory normalizer MVP:

```text
messy CSV -> queued ingest run -> durable worker -> Python normalizer -> Postgres -> FastAPI -> React dashboard
```

## Monorepo

```text
apps/api              FastAPI + Pydantic API
apps/worker           TypeScript worker groundwork
apps/web              Vite React dashboard groundwork
packages/normalizer   Poetry-managed Python normalization engine
db/migrations         Postgres SQL migrations
db/seed               Demo messy CSV data
```

Python is managed from the repo root with Poetry. The API and normalizer are path dependencies in the root `pyproject.toml` so the team can run one shared Python environment during the hackathon.

## Setup

```bash
poetry install
npm install
```

## One-Script Local Startup

The recommended local startup keeps the useful tmux layout while Docker provides the shared infrastructure.

```bash
./start-local.sh
```

The script creates a `digiton` tmux session with windows for:

- `docker`: starts Postgres, runs the one-shot migration container, and starts OpenWorkflow.
- `api`: installs Python dependencies, waits for Docker Postgres, reruns migrations, and starts FastAPI.
- `workers`: installs Node dependencies, waits for Docker Postgres, and starts the ingest worker.
- `react ui`: installs Node dependencies and starts the Vite dashboard.
- `clean`: prints cleanup and status helper commands.

If the tmux session already exists, attach with:

```bash
tmux attach -t digiton
```

To restart from a clean tmux session:

```bash
tmux kill-session -t digiton
./start-local.sh
```

## Fully Dockerized Stack

You can also run the whole local stack in Docker:

```bash
docker compose up -d --build
```

Docker-hosted services:

```text
Postgres:              localhost:55432
FastAPI:               http://localhost:8000
React dashboard:       http://localhost:5173
OpenWorkflow dashboard http://localhost:3001
OpenWorkflow worker    docker compose service: worker
```

Set the local database connection for commands running on the host:

```bash
export DATABASE_URL="postgresql://postgres:postgres@localhost:55432/digithon"
```

Apply all migrations manually, if needed:

```bash
for f in db/migrations/*.sql; do psql "$DATABASE_URL" -f "$f"; done
```

## Run

```bash
poetry run api
npm run worker
npm run web
```

Run the normalizer directly:

```bash
poetry run normalizer --input db/seed/messy_sales.csv
```
