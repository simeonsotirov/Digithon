# 12 — Handoff

**Goal:** anyone on the team can run your worker and the crash-resume demo without reading your code.

## Validation gate (run first)

```
Confirm 11 passed: the crash-resume demo runs twice in a row with no duplicate rows.
```

## Prompt

```
Finalize apps/worker/README.md as a complete handoff doc with:
1. Worker start command and required env vars (DATABASE_URL, optional DEMO_STEP_DELAY_MS).
2. The 7 workflow steps and the exact event types each emits.
3. Idempotency assumptions: (run_id, source_row_hash) on raw_data, raw_data_id on normalized_data.
4. The crash-resume demo steps (copy from 11).
5. How to seed a fresh queued run for a clean demo.
Then do a final clean-room test: fresh queued run -> npm run worker -> reaches completed -> dashboard-relevant tables populated.
Show me the final README and the clean-room test output.
```

## Test (you are done when)

- [ ] A teammate could start the worker and run the demo using only the README.
- [ ] Clean-room run: fresh queued run reaches `completed` with raw, normalized, and event rows.
- [ ] No duplicate rows on re-run.

## Final commit

```
From repo root, commit your worker lane:
git add apps/worker worker_tasks
git commit -m "Developer C: durable OpenWorkflow ingest worker with crash-resume"
git push -u origin BG_openworkflow_worker
```

Then open a PR against `main` for the team to review.
