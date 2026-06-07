# Digithon Worker

TypeScript worker groundwork for the ingest path.

```bash
export DATABASE_URL="postgresql://..."
npm run worker
```

The worker claims queued `ingest_runs`, calls the Poetry-managed normalizer, persists raw and normalized records idempotently, and appends workflow events.
