# 09 — Persist Normalized Rows (Idempotent)

**Goal:** store the cleaned records in `normalized_data`, linked to their raw row, safely re-runnable. Uniqueness on `raw_data_id` blocks duplicates.

## Validation gate (run first)

```
Confirm 08 passed: raw_data has the expected rows and re-running did not double them.
Confirm normalized_data exists with a unique constraint on raw_data_id:
psql "$DATABASE_URL" -c "\d normalized_data"
If missing, ask Developer A or add the unique constraint locally.
```

## Prompt

```
Add storeNormalizedRows(runId, records) to apps/worker/src/db.ts.
For each record:
- find its raw_data_id by matching (run_id, source_row_hash) in raw_data
- resolve store_id: upsert into stores(canonical_name) from record.canonical_store, get its id
- insert into normalized_data(raw_data_id, run_id, store_id, product_name, quantity, price, sale_date, normalized_payload, quality_notes, reorder_signal)
  using ON CONFLICT (raw_data_id) DO NOTHING
After inserting, call writeEvent(runId, 'persist_normalized_rows', 'normalized_rows_stored', 'succeeded', { count }).
Wire into index.ts after store_raw_rows. Run `npm run worker`, then run AGAIN and confirm no duplication.
```

## Test (must pass before step 10)

- [ ] `select count(*) from normalized_data where run_id='<id>';` matches record count.
- [ ] Every normalized row has a non-null `raw_data_id` and `store_id`.
- [ ] Running twice keeps the count the **same**.
- [ ] A `normalized_rows_stored` event exists.

If any box is unchecked, fix it before moving on.
