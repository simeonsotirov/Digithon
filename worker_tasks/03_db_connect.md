# 03 — Database Connection

**Goal:** the worker connects to Postgres and runs a real query on startup. Proves the link works before any business logic.

## Validation gate (run first)

```
Confirm 02 passed: run `cd apps/worker && npm run worker` and check it prints the ready log.
If it does not, stop and go back to 02_skeleton.md.
```

## Prompt

```
Add Postgres connectivity to the worker using the `pg` package.
Files:
- apps/worker/src/db.ts: create a single pg Pool from DATABASE_URL, export it, and export a `query(text, params)` helper.
- update apps/worker/src/index.ts: on startup, run `select 1 as ok` via the helper and log "worker: db connected" on success.
Install pg and @types/pg. Then run `npm run worker`.
On any connection error, log the message clearly and exit code 1. Show me the output.
```

## Test (must pass before step 04)

- [ ] `npm run worker` prints `worker: db connected`.
- [ ] Pointing `DATABASE_URL` at a bad host makes it fail with a readable error (then restore it).

If any box is unchecked, fix it before moving on.
