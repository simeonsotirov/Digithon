# 06 — Event Writer

**Goal:** one helper that writes every workflow event. This is what makes the timeline (and crash-resume story) visible.

## Validation gate (run first)

```
Confirm 05 passed: the worker can claim a run and set it to 'running'.
Also confirm the events table exists: psql "$DATABASE_URL" -c "\d events".
If events does not exist, ask Developer A for the migration or mock it (see note).
```

## Prompt

```
Create apps/worker/src/events.ts exporting:
writeEvent(runId, stepName, eventType, status, payload)
It inserts into events(run_id, workflow_id, step_name, event_type, status, payload).
Use the runId as workflow_id for MVP if OpenWorkflow has not given one yet. Use JSONB for payload.
Then in index.ts, right after claiming a run, call writeEvent(runId, 'claim_run', 'run_claimed', 'succeeded', { source: 'worker' }).
Run `npm run worker`, then show me the events row in psql.
```

> **If `events` does not exist:** minimal local table to unblock: `id uuid default gen_random_uuid() primary key, run_id uuid, workflow_id text, step_name text, event_type text, status text, payload jsonb, created_at timestamptz default now()`.

## Test (must pass before step 07)

- [ ] After claiming, `psql "$DATABASE_URL" -c "select step_name, event_type, status from events order by created_at desc limit 1;"` shows `claim_run / run_claimed / succeeded`.
- [ ] `payload` is valid JSON in the row.

If any box is unchecked, fix it before moving on.
