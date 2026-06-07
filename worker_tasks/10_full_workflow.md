# 10 — Full Durable Workflow

**Goal:** wire all 7 steps into one OpenWorkflow definition so a single queued run goes all the way to `completed` automatically, with an event per step.

## Validation gate (run first)

```
Confirm 05–09 each passed individually: claim, events, normalizer, store_raw, store_normalized all work and are idempotent.
If any one is shaky, fix it before composing them — a broken piece here is 10x harder to debug.
```

## Prompt

```
Read the OpenWorkflow official docs (https://openworkflow.dev) for defining a workflow, durable steps, retries, and running a worker.
Create apps/worker/src/workflows/ingest.ts defining an ingest workflow with these durable steps in order:
  claim_run -> load_csv -> store_raw_rows -> normalize_python -> persist_normalized_rows -> emit_summary_events -> mark_run_complete
Each step:
- does its work using the db.ts / events.ts / normalizer.ts functions already built
- emits a started event before and a succeeded event after (use writeEvent)
- is idempotent (reuse the ON CONFLICT logic) so retries are safe
mark_run_complete sets ingest_runs.status='completed', completed_at=now(), and writes a run_completed event.
On any unrecoverable error, set status='failed', store error_message, and write a run_failed event.
Update index.ts to register the workflow and run the OpenWorkflow worker loop.
Seed a fresh queued run (see 04), start the worker, and show me the run reaching 'completed' with all step events.
```

> **If OpenWorkflow setup blocks you for 10+ min:** keep a plain async function that calls the 7 steps in sequence inside a try/catch, still emitting events and still idempotent. The demo story survives. Add the OpenWorkflow wrapper after the path is green.

## Test (must pass before step 11)

- [ ] A fresh queued run ends as `completed`.
- [ ] `raw_data` and `normalized_data` both have rows for it.
- [ ] `events` shows one row per step (`claim_run` ... `run_completed`) in chronological order.
- [ ] Re-running the worker does not create duplicate raw/normalized rows.

If any box is unchecked, fix it before moving on.
