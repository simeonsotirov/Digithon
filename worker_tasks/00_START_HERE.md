# Worker Build — Start Here

You are **Developer C**. You own `apps/worker` — the TypeScript OpenWorkflow worker.

## How to use this folder

Run the files **in order**, one at a time: `01`, `02`, `03`, ...

Each file is a single bite-sized step. Every file:
1. **Validates** the previous step is done (a gate you must pass first).
2. Gives you one **concise prompt** to run.
3. Ends with a **test** that must pass before you move on.

**Rule: do not start a step until its validation gate passes. Do not finish a step until its test passes.** This guarantees no broken state ever moves forward.

## The pipeline you are building

```
queued run -> claim it -> load CSV -> store raw rows
  -> call Python normalizer -> store normalized rows
  -> emit events -> mark run completed
```

Every step is durable. Kill the worker mid-run, restart it, and it resumes without duplicating rows. **That crash-resume moment is the demo's wow.**

## Files in this folder

| File | Step | Done when |
|---|---|---|
| `01_prereqs.md` | Confirm tools + DB access | `node`, `python`, `psql` work; `DATABASE_URL` set |
| `02_skeleton.md` | Worker boots | `npm run worker` prints a ready log |
| `03_db_connect.md` | Connect to Postgres | Worker runs `SELECT 1` on startup |
| `04_seed_a_run.md` | Get a test run to claim | One `queued` row exists in `ingest_runs` |
| `05_claim_run.md` | Claim a queued run | Run flips `queued` -> `running`, event written |
| `06_events.md` | Event writer helper | Events appear in `events` table |
| `07_normalizer_call.md` | Call Python normalizer | Worker parses normalizer JSON from stdout |
| `08_store_raw.md` | Persist raw rows | `raw_data` rows written, idempotent |
| `09_store_normalized.md` | Persist normalized rows | `normalized_data` rows written, idempotent |
| `10_full_workflow.md` | Wire all 7 durable steps | One run goes to `completed` end-to-end |
| `11_crash_resume.md` | Crash-resume demo | Kill mid-run, restart, no duplicates |
| `12_handoff.md` | Handoff checklist | Teammates can run your worker blind |

## Shared contracts (never change these without team agreement)

**Run statuses:** `queued` `running` `completed` `failed`
**Event statuses:** `started` `succeeded` `failed` `skipped`
**Event types:** `run_created` `run_claimed` `csv_loaded` `raw_rows_stored` `normalization_started` `normalization_completed` `normalized_rows_stored` `run_completed` `run_failed`

## If you get blocked for 10+ minutes

Mock the boundary and keep moving:
- DB not ready -> seed a row manually (`04`).
- Normalizer not ready -> write fake JSON to a file and read it.
- OpenWorkflow setup fights you -> use a plain polling loop + the events table now, add durable workflow after the path works.

Never drop the **normalizer call** or the **event timeline**. Those are the demo.
