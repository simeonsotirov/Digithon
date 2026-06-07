# 02 — Worker Skeleton

**Goal:** a TypeScript worker that boots and prints a ready log. No DB, no logic yet — just a clean start.

## Validation gate (run first)

```
Confirm 01 passed: re-run `node --version` and `echo $DATABASE_URL`.
If either fails, stop and go back to 01_prereqs.md.
```

## Prompt

```
Create the worker skeleton in apps/worker. Use TypeScript run with tsx (no build step for MVP).
Files:
- apps/worker/package.json with scripts: "worker": "tsx src/index.ts", and deps: typescript, tsx, @types/node
- apps/worker/tsconfig.json (strict, module nodenext, target es2022)
- apps/worker/src/index.ts that:
    1. reads DATABASE_URL from env
    2. if missing, logs a clear error and exits code 1
    3. otherwise logs "worker: ready, polling for queued runs"
- apps/worker/README.md with the run command
Then run `cd apps/worker && npm install` and `npm run worker`.
Show me the output. Do not add DB code or workflow logic yet.
```

## Test (must pass before step 03)

- [ ] `cd apps/worker && npm install` completes with no errors.
- [ ] `npm run worker` prints `worker: ready, polling for queued runs`.
- [ ] Temporarily unsetting `DATABASE_URL` makes it exit with a clear error (then re-set it).

If any box is unchecked, fix it before moving on.
