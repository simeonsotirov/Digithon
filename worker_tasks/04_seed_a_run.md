# 04 — Seed a Test Run

**Goal:** guarantee at least one `queued` run exists so the next step has something to claim. Removes your dependency on Developer A's API.

## Validation gate (run first)

```
Confirm 03 passed: run `npm run worker` and check it prints "worker: db connected".
Also confirm the ingest_runs table exists: `psql "$DATABASE_URL" -c "\d ingest_runs"`.
If the table does not exist, stop: ask Developer A to apply db/migrations/001_init.sql, or mock the table per the note below.
```

## Prompt

```
I need one queued run to test against.
First check ingest_runs exists with: psql "$DATABASE_URL" -c "\d ingest_runs"
If it exists, insert a queued run:
psql "$DATABASE_URL" -c "insert into ingest_runs (id, source_filename, status) values (gen_random_uuid(), 'messy_sales.csv', 'queued') returning id, status;"
Then confirm with: psql "$DATABASE_URL" -c "select id, status from ingest_runs where status='queued';"
Show me the returned run id. I will use it in the next steps.
```

> **If `ingest_runs` does not exist yet:** ask Developer A for `db/migrations/001_init.sql`, or create a minimal local table just to unblock yourself: `id uuid primary key, source_filename text, status text, started_at timestamptz, completed_at timestamptz, error_message text, created_at timestamptz default now()`. Replace with the real migration later.

## Test (must pass before step 05)

- [ ] A row in `ingest_runs` has `status = 'queued'`.
- [ ] You have its `id` written down.

If any box is unchecked, fix it before moving on.
