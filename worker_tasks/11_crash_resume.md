# 11 — Crash-Resume Demo

**Goal:** the wow moment. Kill the worker mid-run, restart it, and the run finishes with zero duplicate rows. Rehearsable on demand.

## Validation gate (run first)

```
Confirm 10 passed: a fresh queued run reaches 'completed' with one event per step and no duplicates on re-run.
If the happy path is not rock solid, do NOT attempt crash-resume yet — fix 10 first.
```

## Prompt

```
Make the crash-resume demo reliable and document it.
1. Add an optional env var DEMO_STEP_DELAY_MS that, when set, sleeps that many ms between durable steps so I can kill the worker at a predictable point (default 0 = no delay).
2. Write apps/worker/README.md "Crash-Resume Demo" section with EXACT steps:
   - seed a fresh queued run
   - start: DEMO_STEP_DELAY_MS=1500 npm run worker
   - after "store_raw_rows" event appears, kill the worker (Ctrl+C)
   - restart: npm run worker
   - expected: it resumes, finishes to 'completed', and raw_data/normalized_data counts are unchanged (no duplicates)
3. Run the full demo yourself twice in a row and show me the event timelines and row counts both times.
```

## Test (must pass before step 12)

- [ ] Killing the worker after `store_raw_rows` then restarting still reaches `completed`.
- [ ] Raw and normalized row counts are identical to a clean run (no duplicates).
- [ ] The event timeline clearly shows the interruption and resumption.
- [ ] The demo works **twice in a row** without code changes.

If any box is unchecked, fix it before moving on.
