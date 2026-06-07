# 01 — Prerequisites

**Goal:** confirm every tool and connection exists before writing any code. No code starts until this passes.

## Validation gate (run first)

Nothing to validate — this is step 1.

## Prompt

```
Check my environment for the worker lane. Run and report:
- node --version (need 18+)
- npm --version
- python3 --version (need 3.10+)
- psql --version
- echo $DATABASE_URL (must be a postgres URL, not empty)
Then run: psql "$DATABASE_URL" -c "select 1;"
If DATABASE_URL is missing or the psql connection fails, stop and tell me exactly what is broken and how to fix it. Do not continue.
```

## Test (must pass before step 02)

- [ ] `node`, `npm`, `python3`, `psql` all print a version.
- [ ] `DATABASE_URL` is set and looks like `postgresql://...`.
- [ ] `psql "$DATABASE_URL" -c "select 1;"` returns `1`.

If any box is unchecked, fix it now. Do not proceed.
