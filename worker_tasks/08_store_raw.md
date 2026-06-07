# 08 — Persist Raw Rows (Idempotent)

**Goal:** store every source CSV row in `raw_data`, safely re-runnable. Uniqueness on `(run_id, source_row_hash)` means retries never duplicate.

## Validation gate (run first)

```
Confirm 07 passed: runNormalizer returns parsed records.
Confirm raw_data exists and has a unique constraint:
psql "$DATABASE_URL" -c "\d raw_data"
Look for a unique index on (run_id, source_row_hash). If missing, ask Developer A or add it locally.
```

## Prompt

```
Add storeRawRows(runId, records) to apps/worker/src/db.ts.
For each normalizer record, insert into raw_data(run_id, source_filename, source_row_number, source_row_hash, raw_payload)
using the record's source_row_number, source_row_hash, and the full record as raw_payload (JSONB).
Use INSERT ... ON CONFLICT (run_id, source_row_hash) DO NOTHING so re-runs are safe.
After inserting, call writeEvent(runId, 'store_raw_rows', 'raw_rows_stored', 'succeeded', { count }).
Wire this into index.ts after the normalizer call. Run `npm run worker`.
Then run it a SECOND time on the same run and confirm the raw_data count did NOT double.
```

## Test (must pass before step 09)

- [ ] `psql "$DATABASE_URL" -c "select count(*) from raw_data where run_id='<id>';"` matches the record count.
- [ ] Running the step twice keeps the count the **same** (idempotent).
- [ ] A `raw_rows_stored` event exists for the run.

If any box is unchecked, fix it before moving on.
