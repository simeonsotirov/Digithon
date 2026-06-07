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

Set the database connection:

```bash
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/digithon"
```

Apply the migration with your Postgres client:

```bash
psql "$DATABASE_URL" -f db/migrations/001_init.sql
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
