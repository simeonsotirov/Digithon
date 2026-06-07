# 05 — Claim a Queued Run

**Goal:** the worker safely claims one `queued` run and flips it to `running`. Uses row locking so two workers never grab the same run.

## Validation gate (run first)

```
Confirm 04 passed: run `psql "$DATABASE_URL" -c "select count(*) from ingest_runs where status='queued';"`.
The count must be at least 1. If it is 0, go back to 04_seed_a_run.md.
```

## Prompt

```
Add run claiming to apps/worker/src/db.ts and call it from src/index.ts.
Write a claimRun() function that, in one transaction:
- selects one ingest_runs row where status='queued' ordered by created_at, using `FOR UPDATE SKIP LOCKED`
- if none, returns null
- if found, updates it to status='running', started_at=now(), and returns the row
In index.ts: call claimRun() once on startup. If a run is claimed, log "worker: claimed run <id>". If null, log "worker: no queued runs".
Run `npm run worker` and show output. Then verify in psql the run is now 'running'.
```

## Test (must pass before step 06)

- [ ] Worker logs `worker: claimed run <id>`.
- [ ] `psql "$DATABASE_URL" -c "select id, status, started_at from ingest_runs where id='<id>';"` shows `running` with a `started_at`.
- [ ] Running the worker again logs `worker: no queued runs` (it does NOT re-claim a running run).

If any box is unchecked, fix it before moving on.
