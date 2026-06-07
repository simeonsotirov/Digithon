alter table ingest_runs add column if not exists workflow_id text;
create index if not exists idx_ingest_runs_workflow_id on ingest_runs(workflow_id);
