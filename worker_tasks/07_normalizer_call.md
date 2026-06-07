# 07 — Call the Python Normalizer

**Goal:** the worker runs Developer B's Python script as a subprocess and parses its JSON. No shell injection — use execFile.

## Validation gate (run first)

```
Confirm 06 passed: claiming a run writes a run_claimed event.
Also confirm the normalizer exists and runs standalone:
python3 packages/normalizer/normalize.py --input db/seed/messy_sales.csv | head
The output must be valid JSON on stdout. If the script or CSV is missing, see the mock note.
```

## Prompt

```
Create apps/worker/src/normalizer.ts exporting runNormalizer(csvPath).
Use node:child_process execFile (NOT shell string interpolation) to run:
  python3 packages/normalizer/normalize.py --input <csvPath>
- Capture stdout and JSON.parse it into an array of records.
- Capture stderr and log it to the worker console for debugging.
- If the process exits non-zero OR stdout is not valid JSON, throw a clear error.
Add a tiny manual test in index.ts: call runNormalizer on db/seed/messy_sales.csv and log how many records came back.
Run `npm run worker` and show me the record count and any stderr.
```

> **If normalizer not ready:** write a fixture file `apps/worker/fixtures/normalized.json` with 2 records in the contract shape, and have runNormalizer read that file for now. Swap to the subprocess later — the rest of the pipeline does not change.

## Test (must pass before step 08)

- [ ] Worker logs a record count > 0.
- [ ] stdout JSON parses without error; stderr (if any) is logged separately and does not corrupt parsing.
- [ ] A deliberately broken CSV path makes runNormalizer throw a clear error.

If any box is unchecked, fix it before moving on.
